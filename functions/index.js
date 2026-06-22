const admin = require('firebase-admin')
const express = require('express')
const Busboy = require('busboy')
const os = require('os')
const path = require('path')
const fs = require('fs')
const cors = require('cors')

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()
const bucket = admin.storage().bucket()

const app = express()
app.use(cors())

// Limits (modifiable)
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_PER_UID_PER_HOUR = 10
const MAX_PER_UID_PER_DAY = 50
const MAX_PER_IP_PER_HOUR = 20
const MAX_PER_IP_PER_DAY = 100

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (xff) return xff.split(',')[0].trim()
  return req.ip
}

async function countRecentUploads({ field, value, sinceTimestamp }) {
  const q = db.collection('photos')
    .where(field, '==', value)
    .where('createdAt', '>=', sinceTimestamp)
  const snap = await q.get()
  return snap.size
}

app.post('/upload', async (req, res) => {
  try {
    // Verify token
    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }
    const idToken = authHeader.split('Bearer ')[1]
    let decoded
    try {
      decoded = await admin.auth().verifyIdToken(idToken)
    } catch (err) {
      console.error('Token verify failed', err)
      return res.status(401).json({ error: 'Invalid token' })
    }
    const uid = decoded.uid
    const ip = getClientIp(req)

    // Quota checks
    const now = admin.firestore.Timestamp.now()
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000)
    const oneDayAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000)

    const [uidHourCount, uidDayCount, ipHourCount, ipDayCount] = await Promise.all([
      countRecentUploads({ field: 'uploaderUid', value: uid, sinceTimestamp: oneHourAgo }),
      countRecentUploads({ field: 'uploaderUid', value: uid, sinceTimestamp: oneDayAgo }),
      countRecentUploads({ field: 'ip', value: ip, sinceTimestamp: oneHourAgo }),
      countRecentUploads({ field: 'ip', value: ip, sinceTimestamp: oneDayAgo }),
    ])

    if (uidHourCount >= MAX_PER_UID_PER_HOUR || uidDayCount >= MAX_PER_UID_PER_DAY) {
      return res.status(429).json({ error: 'Quota exceeded for this user' })
    }
    if (ipHourCount >= MAX_PER_IP_PER_HOUR || ipDayCount >= MAX_PER_IP_PER_DAY) {
      return res.status(429).json({ error: 'Quota exceeded for this IP' })
    }

    // Parse multipart with Busboy
    const busboy = new Busboy({ headers: req.headers })
    let uploadError = null
    let tempFilePath = null
    let originalFilename = null
    let contentType = null
    let fileSize = 0

    await new Promise((resolve, reject) => {
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        originalFilename = filename
        contentType = mimetype
        const safeName = `${Date.now()}_${path.basename(filename)}`
        tempFilePath = path.join(os.tmpdir(), safeName)
        const writeStream = fs.createWriteStream(tempFilePath)

        file.on('data', (data) => {
          fileSize += data.length
          if (fileSize > MAX_SIZE_BYTES) {
            uploadError = 'File too large'
            file.resume()
            writeStream.end()
            // do not reject here, wait for finish to cleanup
          } else {
            writeStream.write(data)
          }
        })

        file.on('end', () => {
          writeStream.end()
        })

        writeStream.on('error', (err) => {
          uploadError = err.message
        })

        writeStream.on('finish', () => {
          resolve()
        })
      })

      busboy.on('error', (err) => reject(err))
      busboy.on('finish', () => {
        resolve()
      })

      req.pipe(busboy)
    })

    if (uploadError) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath)
      return res.status(400).json({ error: uploadError })
    }

    if (!tempFilePath) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Upload to storage
    const destination = `photos/${path.basename(tempFilePath)}`
    await bucket.upload(tempFilePath, {
      destination,
      metadata: {
        contentType,
      }
    })

    // Make public (optional). You can remove this and instead generate signed URLs.
    const file = bucket.file(destination)
    try {
      await file.makePublic()
    } catch (err) {
      console.warn('makePublic failed, continuing', err.message)
    }

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destination)}`

    // Add Firestore document in photos
    await db.collection('photos').add({
      url: publicUrl,
      name: originalFilename,
      size: fileSize,
      contentType,
      uploaderUid: uid,
      ip,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // cleanup temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath)

    res.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('Upload error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Export as Cloud Function compatible handler
exports.app = app

// If running locally for testing, start server
if (require.main === module) {
  const port = process.env.PORT || 8080
  app.listen(port, () => console.log(`Listening on ${port}`))
}
