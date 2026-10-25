import formidable from 'formidable'
import {
  createCloudinaryErrorResponse,
  getCloudinary,
  logSanitizedCloudinaryError,
} from '../../lib/cloudinary'

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const form = formidable({ maxFileSize: 50 * 1024 * 1024 })
    const [fields, files] = await form.parse(req)

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'Aucun fichier reçu' })

    const category = Array.isArray(fields.category) ? fields.category[0] : (fields.category || 'Autre')

    const cld = getCloudinary()
    const result = await cld.uploader.upload(file.filepath, {
      folder: 'wedding-photos',
      resource_type: 'image',
      tags: [category],
    })

    return res.status(200).json({ url: result.secure_url, id: result.public_id })
  } catch (err) {
    logSanitizedCloudinaryError('upload', err)
    const failure = createCloudinaryErrorResponse(err, "Échec de l'upload")
    return res.status(failure.status).json(failure.body)
  }
}
