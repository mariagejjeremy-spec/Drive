import { promises as fs } from 'fs'
import path from 'path'

const settingsFile = path.join(process.cwd(), 'wedding-settings.json')

async function getSettings() {
  try {
    const data = await fs.readFile(settingsFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { uploadsEnabled: true }
  }
}

async function saveSettings(settings) {
  await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2))
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const settings = await getSettings()
      return res.status(200).json(settings)
    } catch (err) {
      console.error('[settings GET]', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { uploadsEnabled, adminToken } = req.body

      // Vérifier le token admin
      if (adminToken !== process.env.ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Token admin invalide' })
      }

      if (typeof uploadsEnabled !== 'boolean') {
        return res.status(400).json({ error: 'uploadsEnabled doit être un booléen' })
      }

      const settings = await getSettings()
      settings.uploadsEnabled = uploadsEnabled
      await saveSettings(settings)

      return res.status(200).json({ ok: true, uploadsEnabled })
    } catch (err) {
      console.error('[settings POST]', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).end()
}
