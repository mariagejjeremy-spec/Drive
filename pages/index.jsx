import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [authed, setAuthed] = useState(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState(null)

  const [photos, setPhotos] = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')

  const [lightbox, setLightbox] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = localStorage.getItem('w_auth') === '1'
    const admin = localStorage.getItem('w_admin') === '1'
    const token = localStorage.getItem('w_admin_token') || null
    setAuthed(ok)
    setIsAdmin(admin)
    setAdminToken(token)
    if (ok) loadPhotos()
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setLightbox(null)
        setDeleteConfirm(null)
        setLogoutConfirm(false)
      }
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
    const data = await res.json()
    if (res.ok && data.ok) {
      localStorage.setItem('w_auth', '1')
      if (data.admin) {
        localStorage.setItem('w_admin', '1')
        localStorage.setItem('w_admin_token', data.adminToken)
        setIsAdmin(true)
        setAdminToken(data.adminToken)
      }
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
        setUploadError("Erreur lors de l'upload. Réessayez.")
      }
    }
    xhr.onerror = () => {
      setUploading(false)
      setUploadError('Erreur réseau. Réessayez.')
    }
    xhr.send(fd)
  }

  function handleLogout() {
    localStorage.removeItem('w_auth')
    localStorage.removeItem('w_admin')
    localStorage.removeItem('w_admin_token')
    setAuthed(false)
    setIsAdmin(false)
    setAdminToken(null)
    setPassword('')
    setLogoutConfirm(false)
  }

  async function handleDelete(photo) {
    setDeleting(true)
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: photo.id, adminToken }),
      })
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
        setLightbox(null)
      }
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  // ── Loading splash ────────────────────────────────────────────────────────
  if (authed === null) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.loadingEmoji}>🍋</div>
      </div>
    )
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={s.loginBg}>
        <div style={s.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🍋🍊🌿</div>
            <h1 style={s.loginTitle}>Notre Mariage</h1>
            <p style={s.loginSub}>Entrez le mot de passe pour accéder à la galerie</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
              placeholder="Mot de passe"
              autoComplete="current-password"
              style={s.loginInput}
            />
            {loginError && <p style={s.errorText}>{loginError}</p>}
            <button type="submit" style={s.loginBtn}>
              Accéder à la galerie →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Gallery ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#FFFDE7' }}>

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div>
            <h1 style={s.headerTitle}>
              🍋 Notre Mariage
            </h1>
            <p style={s.headerCount}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} partagée{photos.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {uploading && (
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                {uploadProgress}%
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={uploading ? { ...s.uploadBtn, opacity: 0.6 } : s.uploadBtn}
            >
              {uploading ? '⏳' : '📷 Ajouter'}
            </button>
            <button
              onClick={() => setLogoutConfirm(true)}
              style={s.logoutBtn}
              title="Se déconnecter"
            >
              ⏏
            </button>
          </div>
        </div>

        {uploading && (
          <div style={s.progressTrack}>
            <div style={{ ...s.progressBar, width: `${uploadProgress}%` }} />
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
        <div style={s.errorBanner}>
          {uploadError}
          <button onClick={() => setUploadError('')} style={s.errorBannerClose}>×</button>
        </div>
      )}

      {/* Gallery grid */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 10px 40px' }}>
        {loadingPhotos ? (
          <SkeletonGrid />
        ) : photos.length === 0 ? (
          <EmptyState onUpload={() => fileInputRef.current?.click()} />
        ) : (
          <MasonryGrid
            photos={photos}
            isAdmin={isAdmin}
            onPhotoClick={setLightbox}
            onDeleteClick={setDeleteConfirm}
          />
        )}
      </main>

      {/* ── Logout confirmation ─────────────────────────────────────────── */}
      {logoutConfirm && (
        <div style={s.modalOverlay} onClick={() => setLogoutConfirm(false)}>
          <div style={{ ...s.modalCard, maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 48 }}>👋</div>
              <h2 style={s.modalTitle}>Se déconnecter ?</h2>
              <p style={{ color: '#888', fontSize: 14 }}>Vous devrez entrer le mot de passe pour revenir.</p>
            </div>
            <button onClick={handleLogout} style={s.dangerBtn}>
              Oui, me déconnecter
            </button>
            <button onClick={() => setLogoutConfirm(false)} style={s.cancelBtn}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={s.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...s.modalCard, maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 48 }}>🗑️</div>
              <h2 style={s.modalTitle}>Supprimer cette photo ?</h2>
              <p style={{ color: '#888', fontSize: 14 }}>Cette action est irréversible.</p>
            </div>
            <img
              src={deleteConfirm.thumbUrl}
              alt=""
              style={{ width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 200, objectFit: 'cover' }}
            />
            <button
              onClick={() => handleDelete(deleteConfirm)}
              disabled={deleting}
              style={deleting ? { ...s.dangerBtn, opacity: 0.6 } : s.dangerBtn}
            >
              {deleting ? 'Suppression...' : 'Oui, supprimer'}
            </button>
            <button onClick={() => setDeleteConfirm(null)} style={s.cancelBtn}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightbox && (
        <div style={s.lightboxOverlay} onClick={() => setLightbox(null)}>
          <button style={s.lightboxClose} onClick={() => setLightbox(null)}>✕</button>

          <div style={s.lightboxActions} onClick={(e) => e.stopPropagation()}>
            <a
              href={lightbox.downloadUrl}
              target="_blank"
              rel="noreferrer"
              style={s.lightboxActionBtn}
              title="Télécharger"
            >
              ⬇ Télécharger
            </a>
            {isAdmin && (
              <button
                onClick={() => { setDeleteConfirm(lightbox); setLightbox(null) }}
                style={{ ...s.lightboxActionBtn, background: 'rgba(220,38,38,0.85)' }}
              >
                🗑 Supprimer
              </button>
            )}
          </div>

          <img
            src={lightbox.url}
            alt=""
            style={s.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MasonryGrid({ photos, isAdmin, onPhotoClick, onDeleteClick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {[0, 1, 2].map((col) => (
        <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {photos
            .filter((_, i) => i % 3 === col)
            .map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isAdmin={isAdmin}
                onClick={() => onPhotoClick(photo)}
                onDelete={() => onDeleteClick(photo)}
              />
            ))}
        </div>
      ))}
    </div>
  )
}

function PhotoCard({ photo, isAdmin, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        ...s.photoCard,
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.18)' : '0 2px 10px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={photo.thumbUrl}
        alt=""
        loading="lazy"
        onClick={onClick}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
      />

      <div style={{ ...s.cardOverlay, opacity: hovered ? 1 : 0 }}>
        <a
          href={photo.downloadUrl}
          target="_blank"
          rel="noreferrer"
          style={s.cardActionBtn}
          onClick={(e) => e.stopPropagation()}
        >
          ⬇
        </a>
        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            style={{ ...s.cardActionBtn, background: 'rgba(220,38,38,0.85)', border: 'none', cursor: 'pointer' }}
          >
            🗑
          </button>
        )}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {[0, 1, 2].map((col) => (
        <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[180, 240, 160, 210, 190].map((h, i) => (
            <div key={i} style={{ ...s.skeleton, height: h }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onUpload }) {
  return (
    <div style={s.emptyWrap}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>📸</div>
      <p style={{ fontSize: 20, fontWeight: 600, color: '#555', margin: '0 0 6px' }}>
        Aucune photo pour l'instant
      </p>
      <p style={{ color: '#999', marginBottom: 24 }}>
        Soyez le premier à partager un souvenir !
      </p>
      <button onClick={onUpload} style={s.emptyUploadBtn}>
        Ajouter la première photo 📷
      </button>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  loadingWrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
  },
  loadingEmoji: { fontSize: 64, animation: 'spin 1.5s linear infinite' },

  loginBg: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    background: 'linear-gradient(135deg, #FFF176 0%, #FFD54F 40%, #FF8A65 75%, #AED581 100%)',
  },
  loginCard: {
    background: 'white', borderRadius: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    padding: '40px 36px', maxWidth: 380, width: '100%',
  },
  loginTitle: { fontSize: 30, fontWeight: 800, color: '#E65100', margin: '0 0 6px' },
  loginSub: { fontSize: 14, color: '#888', margin: 0 },
  loginInput: {
    width: '100%', border: '2px solid #FFD54F', borderRadius: 16,
    padding: '14px 16px', fontSize: 16, textAlign: 'center', outline: 'none',
    boxSizing: 'border-box', color: '#333',
  },
  loginBtn: {
    background: 'linear-gradient(135deg, #FFD600, #FF8A00)', color: 'white', border: 'none',
    borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,138,0,0.4)',
  },
  errorText: { color: '#e53e3e', fontSize: 13, textAlign: 'center', margin: 0 },

  header: {
    background: 'linear-gradient(135deg, #FFD600 0%, #FF8A00 100%)',
    position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 2px 12px rgba(255,138,0,0.35)',
  },
  headerInner: {
    maxWidth: 1200, margin: '0 auto', padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white', fontSize: 20, fontWeight: 800, margin: '0 0 2px',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  adminBadge: {
    background: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: '2px 10px',
    fontSize: 12, fontWeight: 600,
  },
  headerCount: { color: 'rgba(255,255,255,0.85)', fontSize: 12, margin: 0 },
  uploadBtn: {
    background: 'white', color: '#E65100', border: 'none', borderRadius: 50,
    padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
    borderRadius: '50%', width: 40, height: 40, fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  progressTrack: { height: 4, background: 'rgba(255,255,255,0.3)' },
  progressBar: { height: 4, background: '#AED581', transition: 'width 0.3s ease' },
  errorBanner: {
    background: '#FED7D7', color: '#C53030', textAlign: 'center', padding: '10px 16px',
    fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  errorBannerClose: {
    marginLeft: 8, fontWeight: 700, background: 'none', border: 'none',
    cursor: 'pointer', color: '#C53030',
  },

  photoCard: {
    borderRadius: 16, overflow: 'hidden', background: '#f5f5f5',
    position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardOverlay: {
    position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6,
    transition: 'opacity 0.2s',
  },
  cardActionBtn: {
    background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 8,
    padding: '6px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
  },

  skeleton: {
    borderRadius: 16,
    background: 'linear-gradient(90deg, #FFF9C4 25%, #FFF176 50%, #FFF9C4 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
  },

  emptyWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', paddingTop: 80, textAlign: 'center',
  },
  emptyUploadBtn: {
    background: 'linear-gradient(135deg, #FFD600, #FF8A00)', color: 'white',
    border: 'none', borderRadius: 50, padding: '14px 32px', fontWeight: 700,
    fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,138,0,0.35)',
  },

  modalOverlay: {
    position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modalCard: {
    background: 'white', borderRadius: 24, padding: '32px 28px',
    maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 10,
  },
  modalTitle: { fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '8px 0 4px' },
  dangerBtn: {
    background: '#DC2626', color: 'white', border: 'none', borderRadius: 14,
    padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  cancelBtn: {
    background: '#f3f4f6', color: '#555', border: 'none', borderRadius: 14,
    padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },

  lightboxOverlay: {
    position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.93)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  lightboxClose: {
    position: 'absolute', top: 16, right: 16,
    background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
    width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontWeight: 700,
  },
  lightboxActions: {
    position: 'absolute', bottom: 48, display: 'flex', gap: 10,
  },
  lightboxActionBtn: {
    background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none',
    borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  lightboxImg: {
    maxWidth: '90vw', maxHeight: '78vh', borderRadius: 12, objectFit: 'contain',
  },
  lightboxDate: {
    color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10, marginBottom: 56,
  },
}
