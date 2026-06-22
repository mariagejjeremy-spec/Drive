import crypto from 'crypto'

function adminToken() {
  return crypto
    .createHmac('sha256', (process.env.ADMIN_PASSWORD || '') + (process.env.GALLERY_PASSWORD || ''))
    .update('admin-v1')
    .digest('hex')
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body || {}
  if (!password) return res.status(401).json({ ok: false })

  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ ok: true, admin: true, adminToken: adminToken() })
  }

  if (password === process.env.GALLERY_PASSWORD) {
    return res.status(200).json({ ok: true, admin: false })
  }

  return res.status(401).json({ ok: false })
}
