import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [authed, setAuthed] = useState(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [photos, setPhotos] = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const ok = typeof window !== 'undefined' && localStorage.getItem('w_auth') === '1'
    setAuthed(ok)
    if (ok) loadPhotos()
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function loadPhotos() {
    setLoadingPhotos(true)
    try {
      const res = await fetch('/api/photos')
      const data = await res.json()
      setPhotos(data.photos || [])
    } catch {
      // silent
    } finally {
      setLoadingPhotos(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      localStorage.setItem('w_auth', '1')
      setAuthed(true)
      loadPhotos()
    } else {
      setLoginError('Mot de passe incorrect ❌')
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setUploadError('')

    const fd = new FormData()
    fd.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
    }
    xhr.onload = () => {
      setUploading(false)
      setUploadProgress(0)
      if (xhr.status < 300) {
        loadPhotos()
      } else {
        setUploadError('Erreur lors de l\'upload. Réessayez.')
      }
    }
    xhr.onerror = () => {
      setUploading(false)
      setUploadError('Erreur réseau. Réessayez.')
    }
    xhr.send(fd)
  }

  // ─── Loading splash ───────────────────────────────────────────────────────
  if (authed === null) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingEmoji}>🍋</div>
      </div>
    )
  }

  // ─── Login screen ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={styles.loginBg}>
        <div style={styles.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🍋🍊🌿</div>
            <h1 style={styles.loginTitle}>Notre Mariage</h1>
            <p style={styles.loginSub}>Entrez le mot de passe pour voir et partager les photos</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
              placeholder="Mot de passe"
              autoComplete="current-password"
              style={styles.loginInput}
            />
            {loginError && <p style={styles.errorText}>{loginError}</p>}
            <button type="submit" style={styles.loginBtn}>
              Accéder à la galerie →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─── Gallery ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#FFFDE7' }}>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.headerTitle}>🍋 Notre Mariage</h1>
            <p style={styles.headerCount}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} partagée{photos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {uploading && (
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                {uploadProgress}%
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={uploading ? { ...styles.uploadBtn, opacity: 0.6 } : styles.uploadBtn}
            >
              {uploading ? '⏳ Envoi...' : '📷 Ajouter une photo'}
            </button>
          </div>
        </div>

        {uploading && (
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${uploadProgress}%` }} />
          </div>
        )}
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {uploadError && (
        <div style={styles.uploadErrorBanner}>
          {uploadError} <button onClick={() => setUploadError('')} style={{ marginLeft: 8, fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Main content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 10px 40px' }}>
        {loadingPhotos ? (
          <SkeletonGrid />
        ) : photos.length === 0 ? (
          <EmptyState onUpload={() => fileInputRef.current?.click()} />
        ) : (
          <MasonryGrid photos={photos} onPhotoClick={setLightbox} />
        )}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div style={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <button style={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
          <img
            src={lightbox.url}
            alt=""
            style={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          <p style={styles.lightboxDate}>
            {new Date(lightbox.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      )}
    </div>
  )
}

function MasonryGrid({ photos, onPhotoClick }) {
  return (
    <div style={styles.masonryWrap}>
      {[0, 1, 2].map((col) => (
        <div key={col} style={styles.masonryCol}>
          {photos
            .filter((_, i) => i % 3 === col)
            .map((photo) => (
              <div
                key={photo.id}
                style={styles.photoCard}
                onClick={() => onPhotoClick(photo)}
              >
                <img
                  src={photo.thumbUrl}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div style={styles.masonryWrap}>
      {[0, 1, 2].map((col) => (
        <div key={col} style={styles.masonryCol}>
          {[180, 240, 160, 210, 190].map((h, i) => (
            <div key={i} style={{ ...styles.skeleton, height: h }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onUpload }) {
  return (
    <div style={styles.emptyWrap}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>📸</div>
      <p style={{ fontSize: 20, fontWeight: 600, color: '#555', margin: '0 0 6px' }}>
        Aucune photo pour l'instant
      </p>
      <p style={{ color: '#999', marginBottom: 24 }}>
        Soyez le premier à partager un souvenir !
      </p>
      <button onClick={onUpload} style={styles.emptyUploadBtn}>
        Ajouter la première photo 📷
      </button>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = {
  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
  },
  loadingEmoji: {
    fontSize: 64,
    animation: 'spin 1.5s linear infinite',
  },

  loginBg: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    background: 'linear-gradient(135deg, #FFF176 0%, #FFD54F 40%, #FF8A65 75%, #AED581 100%)',
  },
  loginCard: {
    background: 'white',
    borderRadius: 28,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    padding: '40px 36px',
    maxWidth: 380,
    width: '100%',
  },
  loginTitle: {
    fontSize: 30,
    fontWeight: 800,
    color: '#E65100',
    margin: '0 0 6px',
  },
  loginSub: {
    fontSize: 14,
    color: '#888',
    margin: 0,
  },
  loginInput: {
    width: '100%',
    border: '2px solid #FFD54F',
    borderRadius: 16,
    padding: '14px 16px',
    fontSize: 16,
    textAlign: 'center',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#333',
    transition: 'border-color 0.2s',
  },
  loginBtn: {
    background: 'linear-gradient(135deg, #FFD600, #FF8A00)',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    padding: '16px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,138,0,0.4)',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 13,
    textAlign: 'center',
    margin: 0,
  },

  header: {
    background: 'linear-gradient(135deg, #FFD600 0%, #FF8A00 100%)',
    position: 'sticky',
    top: 0,
    zIndex: 20,
    boxShadow: '0 2px 12px rgba(255,138,0,0.35)',
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 800,
    margin: '0 0 2px',
  },
  headerCount: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    margin: 0,
  },
  uploadBtn: {
    background: 'white',
    color: '#E65100',
    border: 'none',
    borderRadius: 50,
    padding: '10px 20px',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    whiteSpace: 'nowrap',
  },
  progressTrack: {
    height: 4,
    background: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    height: 4,
    background: '#AED581',
    transition: 'width 0.3s ease',
  },
  uploadErrorBanner: {
    background: '#FED7D7',
    color: '#C53030',
    textAlign: 'center',
    padding: '10px 16px',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  masonryWrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  masonryCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  photoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    background: '#f5f5f5',
  },
  skeleton: {
    borderRadius: 16,
    background: 'linear-gradient(90deg, #FFF9C4 25%, #FFF176 50%, #FFF9C4 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },

  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    textAlign: 'center',
  },
  emptyUploadBtn: {
    background: 'linear-gradient(135deg, #FFD600, #FF8A00)',
    color: 'white',
    border: 'none',
    borderRadius: 50,
    padding: '14px 32px',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,138,0,0.35)',
  },

  lightboxOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  lightboxClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: 'white',
    width: 40,
    height: 40,
    borderRadius: '50%',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },
  lightboxImg: {
    maxWidth: '90vw',
    maxHeight: '85vh',
    borderRadius: 12,
    objectFit: 'contain',
  },
  lightboxDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 12,
  },
}
