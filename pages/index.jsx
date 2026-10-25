import { useState, useEffect, useRef } from 'react'

const CLOUDINARY_CONFIGURATION_CODE = 'CLOUDINARY_CONFIGURATION'
const CLOUDINARY_CONFIGURATION_MESSAGE =
  'La configuration Cloudinary est invalide. Vérifiez le Cloud name (pas la clé API) et que les clés API appartiennent au même compte.'

const CATEGORIES = [
  { id: 'all', label: 'Toutes' },
  { id: 'Cérémonies', label: 'Cérémonies' },
  { id: 'Apéro', label: 'Apéro' },
  { id: 'Repas', label: 'Repas' },
  { id: 'Piste de danse', label: 'Piste de danse' },
  { id: "La communauté de l'anneau", label: "La communauté de l'anneau" },
  { id: 'Mariage civil', label: 'Mariage civil' },
  { id: 'Autre', label: 'Autre' },
]

const CAT_ICONS = {
  all: '/cat-all.png',
  'Cérémonies': '/cat-ceremonie.png',
  'Apéro': '/cat-reception.png',
  'Repas': '/cat-repas.png',
  'Piste de danse': '/cat-piste-danse.png',
  "La communauté de l'anneau": '/cat-details.png',
  'Mariage civil': '/cat-mariage-civil.png',
  'Autre': '/cat-autre.png',
}

export default function Home() {
  const [authed, setAuthed]         = useState(null)
  const [password, setPassword]     = useState('')
  const [loginError, setLoginError] = useState('')
  const [isAdmin, setIsAdmin]       = useState(false)
  const [adminToken, setAdminToken] = useState(null)

  const [photos, setPhotos]               = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [photosError, setPhotosError]     = useState('')
  const [selectedCat, setSelectedCat]     = useState('all')
  const [managerOpen, setManagerOpen]     = useState(false)

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
      const res = await fetch('/api/photos')
      const data = await res.json()
      const loadedPhotos = data.photos || []
      setPhotos(loadedPhotos)
      setPhotosError(
        data.code === CLOUDINARY_CONFIGURATION_CODE
          ? CLOUDINARY_CONFIGURATION_MESSAGE
          : res.ok ? '' : data.error || 'Impossible de charger les photos.'
      )
      return loadedPhotos
    } catch {
      setPhotos([])
      setPhotosError('Impossible de charger les photos.')
      return []
    } finally {
      setLoadingPhotos(false)
    }
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
    setManagerOpen(false)
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
            Notre Mariage &nbsp;·&nbsp; Souvenirs
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
              { img: '/icon-camera-transparent.svg', title: 'Uploadez',    sub: 'Vos moments préférés' },
              { img: '/icon-heart-transparent.svg',  title: 'Revivez',     sub: 'La journée ensemble' },
              { img: '/icon-book-transparent.svg',   title: 'Notre album', sub: 'Tous les souvenirs' },
            ].map(f => (
              <div key={f.title}>
                <img src={f.img} alt="" style={{ height: 48, width: 48, objectFit: 'contain', display: 'block', marginBottom: 8 }} />
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
              <img src="/lemon-camera.svg" alt="" style={{ height: 52, width: 64, objectFit: 'contain', display: 'block', margin: '0 auto 14px' }} />
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
              Réservé aux invités de notre mariage
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
      <div className="topbar" style={{ flex: 'none', height: 56, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid #EAD88A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#2D1F00', lineHeight: 1.1 }}>Notre Mariage</div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: '#C9960A', fontWeight: 700, textTransform: 'uppercase' }}>WEDDING MEMORIES</div>
          </div>
        </div>
        <div className="topbar-actions">
          {isAdmin && (
            <button
              onClick={() => setManagerOpen(open => !open)}
              aria-label={managerOpen ? 'Retour à la galerie' : 'Gestion des images'}
              aria-pressed={managerOpen}
              title={managerOpen ? 'Retour à la galerie' : 'Gestion des images'}
              className="topbar-admin-button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5h18v14H3z" />
                <path d="M3 10h18M8 10v9m7-9v9" />
              </svg>
              <span className="admin-button-label">{managerOpen ? 'Galerie photo' : 'Gestion des images'}</span>
            </button>
          )}
          <button onClick={() => setLogoutConfirm(true)} aria-label="Se déconnecter" title="Se déconnecter" style={{ background: 'none', border: 'none', color: '#A08040', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Sidebar */}
        <div className={`sidebar-desktop${managerOpen ? ' sidebar-hidden' : ''}`} style={{ width: 230, flexShrink: 0, background: 'rgba(250,247,238,0.80)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderRight: '1px solid rgba(234,216,138,0.6)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Welcome */}
          <div style={sideCard}>
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <img src="/icon-camera-transparent.svg" alt="" style={{ height: 54, width: 54, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#2D1F00', margin: '8px 0 4px' }}>Bienvenue !</h3>
              <p style={{ fontSize: 12, color: '#A08040', margin: 0, lineHeight: 1.5 }}>Merci de partager ces beaux souvenirs.</p>
            </div>
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
                <img src={CAT_ICONS[c.id]} alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, mixBlendMode: 'multiply' }} />
                <span style={{ flex: 1 }}>{c.label}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{countOf(c.id)}</span>
              </div>
            ))}
          </div>

          {/* Download all */}
          <a
            href={`/api/download-all${selectedCat !== 'all' ? `?category=${encodeURIComponent(selectedCat)}` : ''}`}
            download
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', borderRadius: 14, padding: '13px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 16px rgba(180,130,0,0.3)', textAlign: 'center' }}
          >
            Tout télécharger
            {selectedCat !== 'all' && (
              <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 400, marginTop: 2 }}>{CATEGORIES.find(c => c.id === selectedCat)?.label}</span>
            )}
          </a>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 46, background: 'rgba(255,255,255,0.78)', border: '1px solid #EAD080', borderRadius: 12, color: '#7A5C20', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <img src="/lemon-camera.svg" alt="" style={{ width: 24, height: 20, objectFit: 'contain' }} />
            Ajouter des photos
          </button>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(249,246,238,0.70)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          {managerOpen ? (
            <PhotoManager photos={photos} loading={loadingPhotos} error={photosError} adminToken={adminToken} onRefresh={loadPhotos} />
          ) : (
            <>

          {/* Non-scrolling header */}
          <div style={{ flexShrink: 0 }}>

            {/* Title */}
            <div style={{ padding: '28px 28px 12px' }}>
              <h1 className="gallery-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#2D1F00', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 8 }}>
                Wedding Memories
                <img src="/icon-heart-transparent.svg" className="desktop-icon" alt="" style={{ height: 38, width: 38, objectFit: 'contain', flexShrink: 0 }} />
              </h1>
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 15, color: '#C9960A', margin: '0 0 6px' }}>
                Revivez la joie. Partagez l'amour.
              </p>
              <p style={{ fontSize: 13, color: '#A08040', margin: 0 }}>
                Une collection de beaux moments partagés par nos invités.
              </p>
            </div>

            {/* Filter pill — mobile only */}
            <div className="filter-pill-mobile" style={{ padding: '0 28px 16px' }}>
              <button
                ref={filterBtnRef}
                onClick={() => {
                  if (!filterOpen && filterBtnRef.current) {
                    const r = filterBtnRef.current.getBoundingClientRect()
                    setFilterRect({ top: r.bottom + 2, left: r.left, width: r.width })
                  }
                  setFilterOpen(v => !v)
                }}
                style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10, background: 'white', border: '2px solid #EAD080', borderRadius: 50, padding: '7px 18px 7px 7px', cursor: 'pointer', boxShadow: '0 2px 16px rgba(180,140,0,0.15)', fontFamily: "'Lato', sans-serif" }}
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
                  <div style={{ position: 'fixed', top: filterRect.top, left: filterRect.left, zIndex: 36, background: 'white', border: '2px solid #EAD080', borderRadius: 20, boxShadow: '0 8px 32px rgba(180,140,0,0.18)', width: filterRect.width, overflow: 'hidden' }}>
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
            ) : photosError ? (
              <div
                role="alert"
                style={{ border: '1px solid rgba(201,150,10,0.35)', borderRadius: 14, background: 'rgba(255,250,236,0.92)', color: '#7A5C20', padding: 16, fontSize: 14, lineHeight: 1.5 }}
              >
                {photosError}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState onUpload={() => setShowUploadModal(true)} catName={CATEGORIES.find(c => c.id === selectedCat)?.label} />
            ) : (
              <MasonryGrid photos={filtered} isAdmin={isAdmin} onPhotoClick={setLightbox} onDeleteClick={setDeleteConfirm} />
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* ── FAB upload button ─────────────────────────────────────────────── */}
      {!managerOpen && <button
        onClick={() => setShowUploadModal(true)}
        title="Ajouter des photos"
        className="fab-upload"
        style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 20, background: 'linear-gradient(135deg, #D4A017, #B8860B)', border: 'none', borderRadius: '50%', width: 66, height: 66, cursor: 'pointer', boxShadow: '0 6px 24px rgba(180,130,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >
        <img src="/lemon-camera.svg" alt="Ajouter des photos" style={{ height: 46, width: 46 }} />
      </button>}

      {/* ── Upload modal ──────────────────────────────────────────────────── */}
      {showUploadModal && (
        <UploadModal
          initialCategory={selectedCat === 'all' ? 'Autre' : selectedCat}
          onClose={() => setShowUploadModal(false)}
          onUploaded={loadPhotos}
          onSuccess={() => setShowUploadModal(false)}
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
              Télécharger
            </a>
            {isAdmin && (
              <button onClick={() => { setDeleteConfirm(lightbox); setLightbox(null) }} style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(180,130,0,0.4)' }}>
                Supprimer
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

const MAX_PHOTOS_PER_BATCH = 25
const MAX_UPLOAD_FILE_SIZE = 50 * 1024 * 1024

function uploadSinglePhoto(file, category, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(event.loaded, event.total)
    }
    xhr.onload = () => {
      if (xhr.status < 300) {
        resolve()
        return
      }

      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        data = null
      }

      const isConfigurationError = data?.code === CLOUDINARY_CONFIGURATION_CODE
      const uploadError = new Error(
        isConfigurationError
          ? CLOUDINARY_CONFIGURATION_MESSAGE
          : data?.error || `Échec de l’envoi (HTTP ${xhr.status})`
      )
      uploadError.code = data?.code
      reject(uploadError)
    }
    xhr.onerror = () => reject(new Error('Erreur réseau'))
    xhr.send(formData)
  })
}

function UploadModal({ initialCategory = 'Autre', onClose, onSuccess, onUploaded }) {
  const [fileItems, setFileItems] = useState([])
  const [category, setCategory] = useState(initialCategory)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const cameraRef = useRef(null)
  const previewsRef = useRef(new Set())

  useEffect(() => () => {
    previewsRef.current.forEach(preview => URL.revokeObjectURL(preview))
  }, [])

  function handleSelect(event) {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''
    if (!selectedFiles.length) return

    const issues = []
    const validFiles = []

    selectedFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        issues.push(`${file.name} n’est pas une image.`)
      } else if (file.size === 0) {
        issues.push(`${file.name} est vide.`)
      } else if (file.size > MAX_UPLOAD_FILE_SIZE) {
        issues.push(`${file.name} dépasse la limite de 50 Mo.`)
      } else {
        validFiles.push(file)
      }
    })

    const availableSlots = Math.max(0, MAX_PHOTOS_PER_BATCH - fileItems.length)
    const acceptedFiles = validFiles.slice(0, availableSlots)
    if (acceptedFiles.length < validFiles.length) {
      issues.push(`Maximum ${MAX_PHOTOS_PER_BATCH} photos par envoi.`)
    }

    const newItems = acceptedFiles.map((file, index) => {
      const preview = URL.createObjectURL(file)
      previewsRef.current.add(preview)
      return {
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
        file,
        preview,
      }
    })

    if (newItems.length) setFileItems(current => [...current, ...newItems])
    setError(issues.join(' '))
  }

  function removeFile(itemId) {
    const item = fileItems.find(fileItem => fileItem.id === itemId)
    if (item) {
      URL.revokeObjectURL(item.preview)
      previewsRef.current.delete(item.preview)
    }
    setFileItems(current => current.filter(fileItem => fileItem.id !== itemId))
    setError('')
  }

  async function doUpload() {
    if (!fileItems.length || uploading) return

    const selectedItems = [...fileItems]
    const totalBytes = selectedItems.reduce((total, item) => total + item.file.size, 0)
    let completedBytes = 0
    const uploadedItems = []
    const failedItems = []
    let cloudinaryConfigurationMessage = ''

    setUploading(true)
    setProgress(0)
    setCurrentFile(0)
    setError('')

    for (const [index, item] of selectedItems.entries()) {
      setCurrentFile(index + 1)
      try {
        await uploadSinglePhoto(item.file, category, (loaded, total) => {
          const currentFileBytes = total ? (loaded / total) * item.file.size : 0
          setProgress(Math.min(100, Math.round(((completedBytes + currentFileBytes) / totalBytes) * 100)))
        })
        uploadedItems.push(item)
      } catch (uploadError) {
        failedItems.push(item)
        if (uploadError?.code === CLOUDINARY_CONFIGURATION_CODE) {
          cloudinaryConfigurationMessage = CLOUDINARY_CONFIGURATION_MESSAGE
        }
      }
      completedBytes += item.file.size
      setProgress(Math.min(100, Math.round((completedBytes / totalBytes) * 100)))
    }

    if (uploadedItems.length) await onUploaded()
    setUploading(false)

    if (failedItems.length) {
      uploadedItems.forEach(item => {
        URL.revokeObjectURL(item.preview)
        previewsRef.current.delete(item.preview)
      })
      setFileItems(failedItems)
      const successMessage = uploadedItems.length
        ? `${uploadedItems.length} photo${uploadedItems.length > 1 ? 's' : ''} envoyée${uploadedItems.length > 1 ? 's' : ''}. `
        : ''
      const failureMessage = cloudinaryConfigurationMessage || (failedItems.length === 1
        ? '1 photo n’a pas pu être envoyée. Vous pouvez réessayer.'
        : `${failedItems.length} photos n’ont pas pu être envoyées. Vous pouvez réessayer.`)
      setError(successMessage + failureMessage)
      return
    }

    onSuccess()
  }

  return (
    <div style={overlay} onClick={uploading ? undefined : onClose}>
      <div style={{ ...modalCard, maxWidth: 420 }} onClick={event => event.stopPropagation()}>
        {fileItems.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <button
              type="button"
              aria-label="Choisir plusieurs photos dans la galerie"
              onClick={() => inputRef.current?.click()}
              style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}
            >
              <img src="/upload-gallery.png" alt="" style={{ width: '100%', height: 'auto', borderRadius: 16, display: 'block' }} />
            </button>
            <button
              type="button"
              aria-label="Prendre une photo"
              onClick={() => cameraRef.current?.click()}
              style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}
            >
              <img src="/upload-camera.png" alt="" style={{ width: '100%', height: 'auto', borderRadius: 16, display: 'block' }} />
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <p style={{ margin: 0, color: '#7A5C20', fontSize: 13, fontWeight: 700 }}>
                {fileItems.length} photo{fileItems.length > 1 ? 's' : ''} sélectionnée{fileItems.length > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={addMoreButton}>
                  + Galerie
                </button>
                <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading} style={addMoreButton}>
                  + Photo
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, maxHeight: 190, overflowY: 'auto' }}>
              {fileItems.map(item => (
                <div key={item.id} style={{ position: 'relative', minWidth: 0 }}>
                  <img src={item.preview} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', borderRadius: 10 }} />
                  {!uploading && (
                    <button
                      type="button"
                      aria-label={`Retirer ${item.file.name}`}
                      onClick={() => removeFile(item.id)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, padding: 0, border: 0, borderRadius: '50%', background: 'rgba(45,31,0,0.78)', color: 'white', fontSize: 17, lineHeight: '24px', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  )}
                  <p title={item.file.name} style={{ margin: '4px 0 0', color: '#7A5C20', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.file.name}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ margin: '8px 0 0', color: '#A08040', fontSize: 11 }}>
              Jusqu’à {MAX_PHOTOS_PER_BATCH} photos, 50 Mo maximum par photo.
            </p>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleSelect} style={{ display: 'none' }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleSelect} style={{ display: 'none' }} />

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="upload-category" style={{ fontSize: 13, fontWeight: 700, color: '#7A5C20', display: 'block', marginBottom: 6 }}>
            Catégorie
          </label>
          <select
            id="upload-category"
            value={category}
            onChange={event => setCategory(event.target.value)}
            disabled={uploading}
            style={{ width: '100%', border: '1.5px solid #EAD080', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#2D1F00', background: '#FDFBF2', outline: 'none', cursor: 'pointer', fontFamily: "'Lato', sans-serif" }}
          >
            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <p style={{ margin: '6px 0 0', color: '#A08040', fontSize: 11 }}>
            Cette catégorie s’appliquera à toutes les photos sélectionnées.
          </p>
        </div>

        {uploading && (
          <div style={{ marginBottom: 14 }}>
            <div
              role="progressbar"
              aria-label="Progression de l’envoi des photos"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              style={{ height: 6, background: '#EAD080', borderRadius: 3, overflow: 'hidden' }}
            >
              <div style={{ height: 6, width: `${progress}%`, background: 'linear-gradient(90deg, #D4A017, #B8860B)', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <p aria-live="polite" style={{ fontSize: 12, color: '#A08040', textAlign: 'center', margin: '6px 0 0' }}>
              Photo {currentFile} sur {fileItems.length} · {progress}% — envoi en cours
            </p>
          </div>
        )}

        {error && <p role="alert" style={{ color: '#DC2626', fontSize: 13, textAlign: 'center', margin: '0 0 10px' }}>{error}</p>}

        <button
          type="button"
          onClick={doUpload}
          disabled={!fileItems.length || uploading}
          style={{ width: '100%', background: fileItems.length && !uploading ? 'linear-gradient(135deg, #D4A017, #B8860B)' : '#E0D0A0', color: 'white', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: fileItems.length && !uploading ? 'pointer' : 'not-allowed', marginBottom: 10, boxShadow: fileItems.length && !uploading ? '0 4px 16px rgba(180,130,0,0.3)' : 'none' }}
        >
          {uploading
            ? `Envoi ${currentFile}/${fileItems.length} · ${progress}%`
            : fileItems.length
              ? `Uploader ${fileItems.length} photo${fileItems.length > 1 ? 's' : ''}`
              : 'Sélectionner des photos'}
        </button>

        {!uploading && (
          <button type="button" onClick={onClose} style={cancelBtn}>Annuler</button>
        )}
      </div>
    </div>
  )
}

// ── Gallery sub-components ────────────────────────────────────────────────────

// 5-photo blocks that fill exactly 12 cols × 5 rows with no gaps.
// Even blocks: tall portrait left | 2 landscapes centre | 2 portraits right
// Odd blocks:  2 portraits left | tall portrait centre | 2 landscapes right
function getMosaicPosition(i) {
  const blockIndex  = Math.floor(i / 5)
  const posInBlock  = i % 5
  const rowStart    = blockIndex * 5 + 1
  const isEven      = blockIndex % 2 === 0

  const even = [
    { col: '1 / 6',   row: `${rowStart} / ${rowStart + 5}` },
    { col: '6 / 10',  row: `${rowStart} / ${rowStart + 2}` },
    { col: '6 / 10',  row: `${rowStart + 2} / ${rowStart + 5}` },
    { col: '10 / 13', row: `${rowStart} / ${rowStart + 3}` },
    { col: '10 / 13', row: `${rowStart + 3} / ${rowStart + 5}` },
  ]
  const odd = [
    { col: '1 / 4',   row: `${rowStart} / ${rowStart + 3}` },
    { col: '1 / 4',   row: `${rowStart + 3} / ${rowStart + 5}` },
    { col: '4 / 8',   row: `${rowStart} / ${rowStart + 5}` },
    { col: '8 / 13',  row: `${rowStart} / ${rowStart + 3}` },
    { col: '8 / 13',  row: `${rowStart + 3} / ${rowStart + 5}` },
  ]

  const pos = isEven ? even[posInBlock] : odd[posInBlock]
  return { gridColumn: pos.col, gridRow: pos.row }
}

function PhotoManager({ photos, loading, error, adminToken, onRefresh }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [targetCategory, setTargetCategory] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const allSelected = photos.length > 0 && photos.every(photo => selectedIds.includes(photo.id))

  function toggleAll() {
    setSelectedIds(allSelected ? [] : photos.map(photo => photo.id))
  }

  function togglePhoto(id) {
    setSelectedIds(current => current.includes(id)
      ? current.filter(selectedId => selectedId !== id)
      : [...current, id]
    )
  }

  async function runAction(action) {
    if (!selectedIds.length || busyAction) return
    if (action === 'delete' && !window.confirm(`Supprimer ${selectedIds.length} image${selectedIds.length > 1 ? 's' : ''} ? Cette action est irréversible.`)) return

    setBusyAction(action)
    setFeedback('')
    try {
      const res = await fetch('/api/manage-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, publicIds: selectedIds, category: targetCategory, adminToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.')

      const failedIds = data.failed || []
      const succeeded = (data.updated || []).length
      setSelectedIds(failedIds)
      await onRefresh()
      const resultLabel = action === 'category' ? 'mise(s) à jour' : 'supprimée(s)'
      setFeedback(`${succeeded} image${succeeded > 1 ? 's' : ''} ${resultLabel}.${failedIds.length ? ` ${failedIds.length} échec(s), sélection conservée pour réessayer.` : ''}`)
    } catch (err) {
      setFeedback(err.message || 'Une erreur est survenue.')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <section className="photo-manager" aria-label="Gestionnaire des images">
      <header className="photo-manager-header">
        <div>
          <h1>Gestion des images</h1>
          <p>{photos.length} image{photos.length > 1 ? 's' : ''} dans la galerie</p>
        </div>
        <span className="photo-manager-count">{selectedIds.length} sélectionnée{selectedIds.length > 1 ? 's' : ''}</span>
      </header>

      <div className="photo-manager-toolbar">
        <label className="photo-manager-select-all">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={!photos.length || !!busyAction} />
          Tout sélectionner
        </label>
        <div className="photo-manager-actions">
          <select aria-label="Nouvelle catégorie" value={targetCategory} onChange={event => setTargetCategory(event.target.value)} disabled={!!busyAction}>
            <option value="">Choisir une catégorie</option>
            {CATEGORIES.filter(category => category.id !== 'all').map(category => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => runAction('category')} disabled={!selectedIds.length || !targetCategory || !!busyAction}>
            {busyAction === 'category' ? 'Modification...' : 'Changer la catégorie'}
          </button>
          <button type="button" className="photo-manager-delete" onClick={() => runAction('delete')} disabled={!selectedIds.length || !!busyAction}>
            {busyAction === 'delete' ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      {feedback && <p className="photo-manager-feedback" role="status">{feedback}</p>}

      <div className="photo-manager-scroll">
        {error ? (
          <p className="photo-manager-empty" role="alert">{error}</p>
        ) : loading ? (
          <p className="photo-manager-empty">Chargement des images...</p>
        ) : photos.length ? (
          <table className="photo-manager-table">
            <thead>
              <tr>
                <th aria-label="Sélection" />
                <th>Image</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Ajoutée le</th>
              </tr>
            </thead>
            <tbody>
              {photos.map(photo => (
                <tr key={photo.id} className={selectedIds.includes(photo.id) ? 'is-selected' : ''}>
                  <td>
                    <input type="checkbox" aria-label={`Sélectionner ${photo.id}`} checked={selectedIds.includes(photo.id)} onChange={() => togglePhoto(photo.id)} disabled={!!busyAction} />
                  </td>
                  <td><img className="photo-manager-thumbnail" src={photo.thumbUrl} alt="" loading="lazy" /></td>
                  <td className="photo-manager-name" title={photo.id}>{photo.id.split('/').pop()}</td>
                  <td>{CATEGORIES.find(category => category.id === photo.category)?.label || photo.category}</td>
                  <td>{photo.createdAt ? new Date(photo.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="photo-manager-empty">Aucune image à afficher.</p>
        )}
      </div>
    </section>
  )
}

function MasonryGrid({ photos, isAdmin, onPhotoClick, onDeleteClick }) {
  return (
    <div className="photo-grid">
      {photos.map((photo, i) => (
        <div key={photo.id} className="photo-card-wrap" style={getMosaicPosition(i)}>
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
      style={{ borderRadius: 16, overflow: 'hidden', background: '#f0ead0', position: 'relative', cursor: 'pointer', width: '100%', height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', transform: hovered ? 'scale(1.02)' : 'scale(1)', boxShadow: hovered ? '0 8px 24px rgba(180,140,0,0.2)' : '0 2px 10px rgba(0,0,0,0.08)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={photo.thumbUrl} alt="" loading="lazy" onClick={onClick} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
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
      {Array.from({ length: 15 }, (_, i) => (
        <div key={i} className="photo-card-wrap" style={getMosaicPosition(i)}>
          <div style={{ width: '100%', height: '100%', borderRadius: 16, background: 'linear-gradient(90deg, #F5EDCC 25%, #F0E4A8 50%, #F5EDCC 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
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
          className="empty-img"
          style={{ width: 210, height: 'auto', display: 'block', margin: '0 auto 20px' }}
        />

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#2D1F00', margin: '0 0 10px', lineHeight: 1.25 }}>
          {isFiltered ? `Aucune photo dans "${catName}"` : "Aucune photo pour l'instant"}
        </h2>

        <p style={{ fontSize: 14, color: '#A08040', margin: '0 0 26px', lineHeight: 1.65 }}>
          Soyez la première personne à partager<br />un souvenir de notre mariage.
        </p>

        <button onClick={onUpload} style={{ width: '100%', background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', border: 'none', borderRadius: 50, padding: '14px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 16px rgba(180,130,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 0 }}>
          Ajouter des photos
        </button>

      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const sideCard = { background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 8px rgba(180,140,0,0.1)', border: '1px solid rgba(255,255,255,0.6)' }
const sideTitle = { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#C9960A', margin: '0 0 10px' }
const catRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#5A3E00', marginBottom: 2 }
const activeCatRow = { ...catRow, background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', fontWeight: 700 }

const activeTab = { background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: 'white', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }
const inactiveTab = { background: 'white', color: '#7A5C20', border: '1.5px solid #EAD080', borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }
const addMoreButton = { background: '#FFF9E6', color: '#7A5C20', border: '1px solid #EAD080', borderRadius: 18, padding: '6px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }

const overlay = { position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const modalCard = { background: 'white', borderRadius: 24, padding: '32px 28px', width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }
const modalTitle = { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#2D1F00', margin: '8px 0 4px', textAlign: 'center' }
const dangerBtn = { background: '#DC2626', color: 'white', border: 'none', borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const cancelBtn = { background: '#F5EED5', color: '#7A5C20', border: 'none', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }
