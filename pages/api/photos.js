import {
  createCloudinaryErrorResponse,
  getCloudinary,
  logSanitizedCloudinaryError,
} from '../../lib/cloudinary'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const cld = getCloudinary()

    const result = await cld.search
      .expression('folder:wedding-photos')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .with_field('tags')
      .execute()

    const photos = result.resources.map((r) => ({
      id: r.public_id,
      category: r.tags?.[0] || 'Autre',
      thumbUrl: cld.url(r.public_id, {
        secure: true,
        transformation: [{ width: 600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      }),
      url: cld.url(r.public_id, {
        secure: true,
        transformation: [{ width: 2000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      }),
      downloadUrl: cld.url(r.public_id, {
        secure: true,
        flags: 'attachment',
        transformation: [{ quality: 100 }],
      }),
      createdAt: r.created_at,
    }))

    return res.status(200).json({ photos })
  } catch (err) {
    logSanitizedCloudinaryError('photos', err)
    const failure = createCloudinaryErrorResponse(err, 'Impossible de charger les photos.')
    return res.status(failure.status).json({ photos: [], ...failure.body })
  }
}
