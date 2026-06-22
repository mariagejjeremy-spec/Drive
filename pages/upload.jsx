import { useState } from 'react'
import { storage, db } from '../lib/firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import Link from 'next/link'

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
    const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on('state_changed', (snapshot) => {
      const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      setProgress(Math.round(prog))
    }, (error) => {
      setStatus('Erreur: ' + error.message)
    }, async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref)
      await addDoc(collection(db, 'photos'), {
        url,
        createdAt: serverTimestamp(),
      })
      setStatus('Upload terminé')
      setFile(null)
      setProgress(0)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Uploader une photo</h2>
          <Link href="/"><a className="text-sm text-blue-600">Retour</a></Link>
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
