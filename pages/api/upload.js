import cloudinary from 'cloudinary'
import formidable from 'formidable'

export const config = {
  api: { bodyParser: false },
}

const cl = cloudinary.v2

function getCloudinary() {
  cl.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cl
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const form = formidable({ maxFileSize: 50 * 1024 * 1024 })
    const [, files] = await form.parse(req)

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'Aucun fichier reçu' })

    const cld = getCloudinary()
    const result = await cld.uploader.upload(file.filepath, {
      folder: 'wedding-photos',
      resource_type: 'image',
    })

    return res.status(200).json({ url: result.secure_url, id: result.public_id })
  } catch (err) {
    console.error('[upload]', err)
    return res.status(500).json({ error: 'Échec de l\'upload' })
  }
}
