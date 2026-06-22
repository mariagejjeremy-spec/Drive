import { useState } from 'react'
import { ensureAnonymousSignIn, auth } from '../lib/firebase'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')

  const handleFile = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setStatus('Connexion...')
    try {
      const user = await ensureAnonymousSignIn()
      if (!user) throw new Error('Impossible de s\'authentifier')
      const token = await user.getIdToken()

      setStatus('Envoi...')

      const formData = new FormData()
      formData.append('file', file, file.name)

      const xhr = new XMLHttpRequest()
      const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_URL
      if (!uploadUrl) {
        setStatus('Erreur: NEXT_PUBLIC_UPLOAD_URL non configuré')
        return
      }
      xhr.open('POST', uploadUrl)
      xhr.setRequestHeader('Authorization', 'Bearer ' + token)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setProgress(percent)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus('Upload terminé')
          setFile(null)
          setProgress(0)
        } else if (xhr.status === 429) {
          setStatus('Quota dépassé: ' + xhr.responseText)
        } else {
          setStatus('Erreur: ' + xhr.responseText)
        }
      }

      xhr.onerror = () => {
        setStatus('Erreur réseau pendant l\'upload')
      }

      xhr.send(formData)
    } catch (err) {
      console.error(err)
      setStatus('Erreur: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Uploader une photo</h2>
        </header>

        <form onSubmit={handleUpload}>
          <input type="file" accept="image/*" onChange={handleFile} />
          <div className="mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={!file}>Uploader</button>
          </div>
        </form>

        {progress > 0 && (
          <div className="mt-4">Progress: {progress}%</div>
        )}
        {status && <div className="mt-2 text-sm text-gray-700">{status}</div>}
      </div>
    </div>
  )
}
