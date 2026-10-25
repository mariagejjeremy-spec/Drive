import crypto from 'crypto'
import {
  createCloudinaryErrorResponse,
  getCloudinary,
  logSanitizedCloudinaryError,
} from '../../lib/cloudinary'

const CATEGORIES = [
  'Cérémonies',
  'Apéro',
  'Repas',
  'Piste de danse',
  "La communauté de l'anneau",
  'Mariage civil',
  'Autre',
]

function verifyToken(token) {
  const expected = crypto
    .createHmac('sha256', (process.env.ADMIN_PASSWORD || '') + (process.env.GALLERY_PASSWORD || ''))
    .update('admin-v1')
    .digest('hex')
  return token === expected
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action, publicIds, category, adminToken } = req.body || {}

  if (!adminToken || !verifyToken(adminToken)) {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (!['category', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'Action invalide' })
  }

  if (
    !Array.isArray(publicIds) ||
    publicIds.length === 0 ||
    publicIds.length > 500 ||
    publicIds.some(id => typeof id !== 'string' || !id.startsWith('wedding-photos/'))
  ) {
    return res.status(400).json({ error: 'Sélection d’images invalide' })
  }

  if (action === 'category' && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Catégorie invalide' })
  }

  try {
    const cld = getCloudinary()
    const updated = []
    const failed = []

    for (let index = 0; index < publicIds.length; index += 10) {
      const batch = publicIds.slice(index, index + 10)
      const results = await Promise.all(batch.map(async publicId => {
        try {
          if (action === 'category') {
            await cld.api.update(publicId, { tags: [category] })
          } else {
            const result = await cld.uploader.destroy(publicId, { resource_type: 'image' })
            if (result.result !== 'ok') throw new Error('Cloudinary delete failed')
          }
          return { publicId, ok: true }
        } catch (err) {
          logSanitizedCloudinaryError(`manage-photos-${action}`, err)
          return { publicId, ok: false }
        }
      }))

      results.forEach(result => (result.ok ? updated : failed).push(result.publicId))
    }

    return res.status(200).json({ updated, failed })
  } catch (err) {
    logSanitizedCloudinaryError('manage-photos', err)
    const failure = createCloudinaryErrorResponse(err, 'Impossible de gérer les photos.')
    return res.status(failure.status).json(failure.body)
  }
}