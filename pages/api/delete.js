import crypto from 'crypto'
import {
  createCloudinaryErrorResponse,
  getCloudinary,
  logSanitizedCloudinaryError,
} from '../../lib/cloudinary'

function verifyToken(token) {
  const expected = crypto
    .createHmac('sha256', (process.env.ADMIN_PASSWORD || '') + (process.env.GALLERY_PASSWORD || ''))
    .update('admin-v1')
    .digest('hex')
  return token === expected
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { publicId, adminToken } = req.body || {}

  if (!adminToken || !verifyToken(adminToken)) {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (!publicId) return res.status(400).json({ error: 'publicId manquant' })

  try {
    const cld = getCloudinary()
    await cld.uploader.destroy(publicId, { resource_type: 'image' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    logSanitizedCloudinaryError('delete', err)
    const failure = createCloudinaryErrorResponse(err, 'Suppression échouée')
    return res.status(failure.status).json(failure.body)
  }
}
