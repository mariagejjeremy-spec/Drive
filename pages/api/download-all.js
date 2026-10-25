import archiver from 'archiver'
import https from 'https'
import http from 'http'
import {
  createCloudinaryErrorResponse,
  getCloudinary,
  logSanitizedCloudinaryError,
} from '../../lib/cloudinary'

function fetchStream(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchStream(res.headers.location).then(resolve).catch(reject)
      } else if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
      } else {
        resolve(res)
      }
    }).on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { category } = req.query

  try {
    const cld = getCloudinary()

    let search = cld.search
      .expression('folder:wedding-photos')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .with_field('tags')

    const result = await search.execute()

    let resources = result.resources
    if (category && category !== 'all') {
      resources = resources.filter(r => (r.tags?.[0] || 'Autre') === category)
    }

    const folderName = category && category !== 'all' ? category : 'wedding-photos'
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`)

    const archive = archiver('zip', { zlib: { level: 1 } })
    archive.pipe(res)

    for (let i = 0; i < resources.length; i++) {
      const r = resources[i]
      const url = cld.url(r.public_id, { secure: true, transformation: [{ quality: 100 }] })
      try {
        const stream = await fetchStream(url)
        const ext = r.format || 'jpg'
        const filename = `${String(i + 1).padStart(3, '0')}_${r.public_id.split('/').pop()}.${ext}`
        archive.append(stream, { name: filename })
        await new Promise(resolve => stream.on('end', resolve))
      } catch (err) {
        logSanitizedCloudinaryError('download-all:skip', err)
      }
    }

    await archive.finalize()
  } catch (err) {
    logSanitizedCloudinaryError('download-all', err)
    if (!res.headersSent) {
      const failure = createCloudinaryErrorResponse(err, 'Erreur lors de la création du ZIP.')
      res.status(failure.status).json(failure.body)
    }
  }
}

export const config = {
  api: { responseLimit: false },
}
