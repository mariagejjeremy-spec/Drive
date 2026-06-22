import { useState, useEffect, useRef } from 'react'

const CATEGORIES = [
  { id: 'all',         label: 'Toutes' },
  { id: 'Cérémonie',   label: 'Cérémonie' },
  { id: 'Réception',   label: 'Réception' },
  { id: 'Détails',     label: 'Détails' },
  { id: 'Moments Fun', label: 'Moments Fun' },
  { id: 'Autre',       label: 'Autre' },
]

const CAT_ICONS = {
  all:           '/cat-all.png',
  'Cérémonie':   '/cat-ceremonie.png',
  'Réception':   '/cat-reception.png',
  'Détails':     '/cat-details.png',
  'Moments Fun': '/cat-moments.png',
  'Autre':       '/cat-autre.png',
}

export default function Home() {
  const [authed, setAuthed]         = useState(null)
  const [password, setPassword]     = useState('')
  const [loginError, setLoginError] = useState('')
  const [isAdmin, setIsAdmin]       = useState(false)
  const [adminToken, setAdminToken] = useState(null)

  const [photos, setPhotos]               = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [selectedCat, setSelectedCat]     = useState('all')

  const [showUploadModal, setShowUploadModal] = useState(false)

  const [lightbox, setLightbox]         = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)

  const [filterOpen, setFilterOpen] = useState(false)
  const [filterRect, setFilterRect] = useState(null)
  const filterBtnRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok    = localStorage.getItem('w_auth') === '1'
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
        setShowUploadModal(false)
        setFilterOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function loadPhotos() {
    setLoadingPhotos(true)
    try {
      const res  = await fetch('/api/photos')
      const data = await res.json()
      setPhotos(data.photos || [])
    } catch { /* silent */ }
    finally { setLoadingPhotos(false) }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    const res  = await fetch('/api/auth', {
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

  function doLogout() {
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
        setPhotos(prev => prev.filter(p => p.id !== photo.id))
        setLightbox(null)
      }
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const filtered   = selectedCat === 'all' ? photos : photos.filter(p => p.category === selectedCat)
  const countOf    = id => id === 'all' ? photos.length : photos.filter(p => p.category === id).length

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authed === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9F6EE' }}>
        <div style={{ fontSize: 56, animation: 'spin 1.5s linear infinite' }}>🍋</div>
      </div>
    )
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Lato', sans-serif", position: 'relative', backgroundImage: "url('/login-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Global light overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,250,220,0.25)', pointerEvents: 'none' }} />

        {/* Left — branding */}
        <div className="login-left" style={{
          flex: '0 0 58%', position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 56px',
        }}>
          {/* subtle dark overlay so text stays readable */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(60,35,0,0.18)', pointerEvents: 'none' }} />

          <p style={{ position: 'relative', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(90,60,0,0.6)', fontWeight: 700, margin: 0 }}>
            🍋 Notre Mariage &nbsp;·&nbsp; Souvenirs
          </p>

          <div style={{ position: 'relative' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 54, lineHeight: 1.15, color: '#3D2800', margin: '0 0 24px', fontWeight: 700 }}>
              <em style={{ color: '#8B6000', fontStyle: 'italic', display: 'block' }}>Partagez la joie,</em>
              Partagez les<br />souvenirs
            </h1>
            <p style={{ color: 'rgba(80,55,0,0.65)', fontSize: 15, lineHeight: 1.8, maxWidth: 360, margin: 0 }}>
              Uploadez vos photos de notre journée spéciale et aidez-nous à revivre chaque moment magique.
            </p>
          </div>

          <div style={{ position: 'relative', display: 'flex', gap: 36 }}>
            {[
              { icon: '📸', title: 'Uploadez',    sub: 'Vos moments préférés' },
              { icon: '💛', title: 'Revivez',     sub: 'La journée ensemble' },
              { icon: '📖', title: 'Notre album', sub: 'Tous les souvenirs' },
            ].map(f => (
              <div key={f.title}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                <p style={{ fontWeight: 700, color: '#3D2800', fontSize: 13, margin: '0 0 2px' }}>{f.title}</p>
                <p style={{ color: 'rgba(80,55,0,0.55)', fontSize: 12, margin: 0 }}>{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — frosted glass card */}
        <div className="login-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'rgba(255,255,255,0.38)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', borderRadius: 28, padding: '52px 40px', boxShadow: '0 8px 48px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.5)' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>🍋</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#2D1F00', margin: '0 0 8px' }}>Bienvenue</h2>
              <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#C9960A', fontWeight: 700, margin: 0 }}>Partagez vos souvenirs</p>
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError('') }}
                placeholder="Mot de passe"
                autoComplete="current-password"
                style={{ width: '100%', border: '1.5px solid #ECD98A', borderRadius: 12, padding: '14px 16px', fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#333', background: '#FDFBF2', fontFamily: "'Lato', sans-serif" }}
              />
              {loginError && <p style={{ color: '#DC2626', fontSize: 13, textAlign: 'center', margin: 0 }}>{loginError}</p>}
              <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)', color: 'white', border: 'none', borderRadius: 12, padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: 1, fontFamily: "'Lato', sans-serif", boxShadow: '0 4px 20px rgba(180,130,0,0.35)' }}>
                Accéder
              </button>
            </form>
            <p style={{ textAlign: 'center', color: '#C8B07A', fontSize: 12, margin: '28px 0 0' }}>
              Réservé aux invités de notre mariage 🍊
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Gallery ───────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Lato', sans-serif", overflow: 'hidden', backgroundImage: "url('/gallery-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center bottom', backgroundAttachment: 'fixed' }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 'none', height: 56, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid #EAD88A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🍋</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#2D1F00', lineHeight: 1.1 }}>Notre Mariage</div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: '#C9960A', fontWeight: 700, textTransform: 'uppercase' }}>WEDDING MEMORIES</div>
          </div>
        </div>
        <button onClick={() => setLogoutConfirm(true)} style={{ background: 'none', border: 'none', color: '#A08040', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ↪ Se déconnecter
        </button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Sidebar */}
        <div className="sidebar-desktop" style={{ width: 230, flexShrink: 0, background: 'rgba(250,247,238,0.80)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRight: '1px solid rgba(234,216,138,0.6)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Welcome */}
          <div style={sideCard}>
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ fontSize: 36 }}>💛</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#2D1F00', margin: '8px 0 4px' }}>Bienvenue !</h3>
              <p style={{ fontSize: 12, color: '#A08040', margin: 0, lineHeight: 1.5 }}>Merci de partager ces beaux souvenirs.</p>
            </div>
          </div>

          {/* Stats */}
          <div style={sideCard}>
            <p style={sideTitle}>Notre Mariage</p>
            <div style={statRow}>
              <span style={{ fontSize: 13, color: '#5A3E00' }}>Photos</span>
              <span style={{ fontWeight: 700, color: '#C9960A', fontSize: 14 }}>{photos.length}</span>
            </div>
            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <div key={c.id} style={statRow}>
                <span style={{ fontSize: 12, color: '#7A5C20' }}>{c.label}</span>
                <span style={{ fontSize: 12, color: '#A08040' }}>{countOf(c.id)}</span>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={sideCard}>
            <p style={sideTitle}>Filtrer par</p>
            {CATEGORIES.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                style={selectedCat === c.id ? activeCatRow : catRow}
              >
                <span>{c.label}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{countOf(c.id)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(249,246,238,0.70)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>

          {/* Non-scrolling header */}
          <div style={{ flexShrink: 0 }}>

            {/* Title */}
            <div style={{ padding: '28px 28px 12px' }}>
              <h1 className="gallery-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#2D1F00', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Wedding Memories ♡
              </h1>
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 15, color: '#C9960A', margin: '0 0 6px' }}>
                Revivez la joie. Partagez l'amour.
              </p>
              <p style={{ fontSize: 13, color: '#A08040', margin: 0 }}>
                Une collection de beaux moments partagés par nos invités.
              </p>
            </div>

            {/* Filter pill */}
            <div style={{ padding: '0 28px 16px' }}>
              <button
                ref={filterBtnRef}
                onClick={() => {
                  if (!filterOpen && filterBtnRef.current) {
                    const r = filterBtnRef.current.getBoundingClientRect()
                    setFilterRect({ top: r.bottom + 8, left: r.left })
                  }
                  setFilterOpen(v => !v)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'white', border: '2px solid #EAD080', borderRadius: 50, padding: '7px 18px 7px 7px', cursor: 'pointer', boxShadow: '0 2px 16px rgba(180,140,0,0.15)', fontFamily: "'Lato', sans-serif" }}
              >
                <img src={CAT_ICONS[selectedCat]} alt="" style={{ height: 46, width: 46, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: '#2D1F00', minWidth: 60 }}>
                  {selectedCat === 'all' ? 'Filtrer' : CATEGORIES.find(c => c.id === selectedCat)?.label}
                </span>
                <span style={{ color: '#C9960A', fontSize: 11, display: 'inline-block', transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 4 }}>▼</span>
              </button>

              {filterOpen && filterRect && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 35 }} onClick={() => setFilterOpen(false)} />
                  <div style={{ position: 'fixed', top: filterRect.top, left: filterRect.left, zIndex: 36, background: 'white', border: '2px solid #EAD080', borderRadius: 20, boxShadow: '0 8px 32px rgba(180,140,0,0.18)', minWidth: 240, overflow: 'hidden' }}>
                    {CATEGORIES.map((c, i) => (
                      <div
                        key={c.id}
                        onClick={() => { setSelectedCat(c.id); setFilterOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer', background: selectedCat === c.id ? '#FFFAEC' : 'white', borderBottom: i < CATEGORIES.length - 1 ? '1px solid #F5EDD0' : 'none' }}
                      >
                        <img src={CAT_ICONS[c.id]} alt="" style={{ height: 40, width: 40, objectFit: 'contain', flexShrink: 0, mixBlendMode: 'multiply' }} />
                        <span style={{ flex: 1, fontSize: 15, color: '#2D1F00', fontWeight: selectedCat === c.id ? 700 : 400 }}>
                          {c.id === 'all' ? 'Toutes les photos' : c.label}
                        </span>
                        {selectedCat === c.id && <span style={{ color: '#D4A017', fontSize: 16, fontWeight: 700 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scrollable photos */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 28px 100px' }}>
            {loadingPhotos ? (
              <SkeletonGrid />
            ) : filtered.length === 0 ? (
              <EmptyState onUpload={() => setShowUploadModal(true)} catName={CATEGORIES.find(c => c.id === selectedCat)?.label} />
            ) : (
              <MasonryGrid photos={filtered} isAdmin={isAdmin} onPhotoClick={setLightbox} onDeleteClick={setDeleteConfirm} />
            )}
          </div>
        </div>
      </div>

      {/* ── FAB upload button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setShowUploadModal(true)}
        style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 20, background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', border: 'none', borderRadius: 50, padding: '13px 22px 13px 16px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(180,130,0,0.45)', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <img src="/lemon-camera.svg" alt="" style={{ height: 30, width: 'auto', display: 'block' }} />
        Ajouter des photos
      </button>

      {/* ── Upload modal ──────────────────────────────────────────────────── */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => { loadPhotos(); setShowUploadModal(false) }}
        />
      )}

      {/* ── Logout confirm ────────────────────────────────────────────────── */}
      {logoutConfirm && (
        <div style={overlay} onClick={() => setLogoutConfirm(false)}>
          <div style={{ ...modalCard, maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 44 }}>👋</div>
              <h2 style={modalTitle}>Se déconnecter ?</h2>
              <p style={{ color: '#A08040', fontSize: 14 }}>Vous devrez entrer le mot de passe pour revenir.</p>
            </div>
            <button onClick={doLogout} style={dangerBtn}>Oui, me déconnecter</button>
            <button onClick={() => setLogoutConfirm(false)} style={cancelBtn}>Annuler</button>
          </div>
        </div>
      )}

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={overlay} onClick={() => !deleting && setDeleteConfirm(null)}>
          <div style={{ ...modalCard, maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 44 }}>🗑️</div>
              <h2 style={modalTitle}>Supprimer cette photo ?</h2>
              <p style={{ color: '#A08040', fontSize: 14 }}>Cette action est irréversible.</p>
            </div>
            <img src={deleteConfirm.thumbUrl} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 14, maxHeight: 180, objectFit: 'cover' }} />
            <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} style={deleting ? { ...dangerBtn, opacity: 0.6 } : dangerBtn}>
              {deleting ? 'Suppression...' : 'Oui, supprimer'}
            </button>
            <button onClick={() => setDeleteConfirm(null)} style={cancelBtn}>Annuler</button>
          </div>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.93)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setLightbox(null)}>
          <button style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontWeight: 700 }} onClick={() => setLightbox(null)}>✕</button>
          <div style={{ position: 'absolute', bottom: 48, display: 'flex', gap: 10 }} onClick={e => e.stopPropagation()}>
            <a href={lightbox.downloadUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              ⬇ Télécharger
            </a>
            {isAdmin && (
              <button onClick={() => { setDeleteConfirm(lightbox); setLightbox(null) }} style={{ background: 'rgba(220,38,38,0.85)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                🗑 Supprimer
              </button>
            )}
          </div>
          <img src={lightbox.url} alt="" style={{ maxWidth: '90vw', maxHeight: '78vh', borderRadius: 12, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [category, setCategory] = useState('Autre')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState('')
  const inputRef = useRef(null)

  function handleSelect(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function doUpload() {
    if (!file || uploading) return
    setUploading(true)
    setProgress(0)
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', category)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.upload.onprogress = ev => {
      if (ev.lengthComputable) setProgress(Math.round(ev.loaded / ev.total * 100))
    }
    xhr.onload = () => {
      setUploading(false)
      if (xhr.status < 300) {
        if (preview) URL.revokeObjectURL(preview)
        onSuccess()
      } else {
        setError("Erreur lors de l'upload. Réessayez.")
      }
    }
    xhr.onerror = () => { setUploading(false); setError('Erreur réseau.') }
    xhr.send(fd)
  }

  return (
    <div style={overlay} onClick={uploading ? undefined : onClose}>
      <div style={{ ...modalCard, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 44 }}>📸</div>
          <h2 style={modalTitle}>Ajouter vos souvenirs</h2>
        </div>

        {/* File zone */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed #EAD080', borderRadius: 16,
            overflow: 'hidden', marginBottom: 16, cursor: 'pointer',
            minHeight: preview ? 0 : 120,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#FDFBF2',
          }}
        >
          {preview ? (
            <img src={preview} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
              <p style={{ color: '#A08040', margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Cliquez pour choisir une photo</p>
              <p style={{ color: '#C0A060', margin: 0, fontSize: 12 }}>JPG, PNG, HEIC — jusqu'à 50 Mo</p>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleSelect} style={{ display: 'none' }} />

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#7A5C20', display: 'block', marginBottom: 6 }}>
            Catégorie
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ width: '100%', border: '1.5px solid #EAD080', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#2D1F00', background: '#FDFBF2', outline: 'none', cursor: 'pointer', fontFamily: "'Lato', sans-serif" }}
          >
            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Progress */}
        {uploading && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 6, background: '#EAD080', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: 6, width: `${progress}%`, background: 'linear-gradient(90deg, #D4A017, #B8860B)', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: 12, color: '#A08040', textAlign: 'center', marginTop: 6 }}>{progress}% — envoi en cours...</p>
          </div>
        )}

        {error && <p style={{ color: '#DC2626', fontSize: 13, textAlign: 'center', margin: '0 0 10px' }}>{error}</p>}

        <button
          onClick={doUpload}
          disabled={!file || uploading}
          style={{ width: '100%', background: file && !uploading ? 'linear-gradient(135deg, #D4A017, #B8860B)' : '#E0D0A0', color: 'white', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: file && !uploading ? 'pointer' : 'not-allowed', marginBottom: 10, boxShadow: file && !uploading ? '0 4px 16px rgba(180,130,0,0.3)' : 'none' }}
        >
          {uploading ? `⬆ ${progress}%` : '⬆ Uploader'}
        </button>

        {!uploading && (
          <button onClick={onClose} style={cancelBtn}>Annuler</button>
        )}
      </div>
    </div>
  )
}

// ── Gallery sub-components ────────────────────────────────────────────────────

function MasonryGrid({ photos, isAdmin, onPhotoClick, onDeleteClick }) {
  return (
    <div className="photo-grid">
      {photos.map(photo => (
        <div key={photo.id} className="photo-card-wrap">
          <PhotoCard photo={photo} isAdmin={isAdmin} onClick={() => onPhotoClick(photo)} onDelete={() => onDeleteClick(photo)} />
        </div>
      ))}
    </div>
  )
}

function PhotoCard({ photo, isAdmin, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ borderRadius: 16, overflow: 'hidden', background: '#f0ead0', position: 'relative', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', transform: hovered ? 'scale(1.02)' : 'scale(1)', boxShadow: hovered ? '0 8px 24px rgba(180,140,0,0.2)' : '0 2px 10px rgba(0,0,0,0.08)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={photo.thumbUrl} alt="" loading="lazy" onClick={onClick} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
        <a href={photo.downloadUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(0,0,0,0.55)', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>⬇</a>
        {isAdmin && (
          <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: 'rgba(220,38,38,0.8)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🗑</button>
        )}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="photo-grid">
      {[180, 240, 160, 210, 195, 230, 170, 250, 185].map((h, i) => (
        <div key={i} className="photo-card-wrap">
          <div style={{ borderRadius: 16, height: h, background: 'linear-gradient(90deg, #F5EDCC 25%, #F0E4A8 50%, #F5EDCC 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onUpload, catName }) {
  const isFiltered = catName && catName !== 'Toutes'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRadius: 32, padding: '36px 36px 32px', maxWidth: 360, width: '100%', boxShadow: '0 4px 28px rgba(180,140,0,0.12)', border: '1px solid rgba(234,216,138,0.5)' }}>

        <img
          src="/empty-camera.png"
          alt=""
          style={{ width: 210, height: 'auto', display: 'block', margin: '0 auto 20px', mixBlendMode: 'multiply' }}
        />

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#2D1F00', margin: '0 0 10px', lineHeight: 1.25 }}>
          {isFiltered ? `Aucune photo dans "${catName}"` : "Aucune photo pour l'instant"}
        </h2>

        <p style={{ fontSize: 14, color: '#A08040', margin: '0 0 26px', lineHeight: 1.65 }}>
          Soyez la première personne à partager<br />un souvenir de notre mariage.
        </p>

        <button onClick={onUpload} style={{ width: '100%', background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', border: 'none', borderRadius: 50, padding: '14px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 16px rgba(180,130,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          Ajouter des photos
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: '#EAD080' }} />
          <span style={{ fontSize: 13, color: '#C0A060' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#EAD080' }} />
        </div>

        <button onClick={onUpload} style={{ width: '100%', background: 'white', color: '#7A5C20', border: '1.5px solid #EAD080', borderRadius: 50, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Importer depuis mon appareil
        </button>

      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const sideCard = { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 8px rgba(180,140,0,0.1)', border: '1px solid rgba(255,255,255,0.6)' }
const sideTitle = { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#C9960A', margin: '0 0 10px' }
const statRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #F5EDCC' }
const catRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#5A3E00', marginBottom: 2 }
const activeCatRow = { ...catRow, background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', fontWeight: 700 }

const activeTab = { background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }
const inactiveTab = { background: 'white', color: '#7A5C20', border: '1.5px solid #EAD080', borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }

const overlay = { position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const modalCard = { background: 'white', borderRadius: 24, padding: '32px 28px', width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }
const modalTitle = { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#2D1F00', margin: '8px 0 4px', textAlign: 'center' }
const dangerBtn = { background: '#DC2626', color: 'white', border: 'none', borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const cancelBtn = { background: '#F5EED5', color: '#7A5C20', border: 'none', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }
