import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import Link from 'next/link'

export default function Home() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setPhotos(items)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Drive - Photos des invités</h1>
          <Link href="/upload"><a className="bg-blue-600 text-white px-4 py-2 rounded">Uploader une photo</a></Link>
        </header>

        {loading ? (
          <p>Chargement...</p>
        ) : photos.length === 0 ? (
          <p>Aucune photo pour le moment. Sois le premier à uploader !</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="bg-white rounded overflow-hidden shadow">
                <img src={p.url} alt="photo" className="w-full h-48 object-cover" />
                <div className="p-2 text-sm text-gray-600">{new Date(p.createdAt?.toMillis ? p.createdAt.toMillis() : p.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
