import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { LangProvider, useTranslation } from './i18n'
import './App.css'

const API = 'http://localhost:8000/api'

const AFRICAN_COUNTRIES = [
  { code: "AO", name: "Angola" }, { code: "BJ", name: "Bénin" }, { code: "BW", name: "Botswana" },
  { code: "BF", name: "Burkina Faso" }, { code: "BI", name: "Burundi" }, { code: "CM", name: "Cameroun" },
  { code: "CV", name: "Cap-Vert" }, { code: "CF", name: "République centrafricaine" },
  { code: "KM", name: "Comores" }, { code: "CG", name: "Congo-Brazzaville" },
  { code: "CD", name: "République démocratique du Congo" }, { code: "CI", name: "Côte d'Ivoire" },
  { code: "DJ", name: "Djibouti" }, { code: "EG", name: "Égypte" }, { code: "GQ", name: "Guinée équatoriale" },
  { code: "ER", name: "Érythrée" }, { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Éthiopie" },
  { code: "GA", name: "Gabon" }, { code: "GM", name: "Gambie" }, { code: "GH", name: "Ghana" },
  { code: "GN", name: "Guinée" }, { code: "GW", name: "Guinée-Bissau" }, { code: "KE", name: "Kenya" },
  { code: "LS", name: "Lesotho" }, { code: "LR", name: "Liberia" }, { code: "LY", name: "Libye" },
  { code: "MG", name: "Madagascar" }, { code: "MW", name: "Malawi" }, { code: "ML", name: "Mali" },
  { code: "MR", name: "Mauritanie" }, { code: "MU", name: "Maurice" }, { code: "MA", name: "Maroc" },
  { code: "MZ", name: "Mozambique" }, { code: "NA", name: "Namibie" }, { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" }, { code: "RW", name: "Rwanda" }, { code: "ST", name: "Sao Tomé-et-Principe" },
  { code: "SN", name: "Sénégal" }, { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" },
  { code: "SO", name: "Somalie" }, { code: "ZA", name: "Afrique du Sud" }, { code: "SS", name: "Soudan du Sud" },
  { code: "SD", name: "Soudan" }, { code: "TZ", name: "Tanzanie" }, { code: "TG", name: "Togo" },
  { code: "TN", name: "Tunisie" }, { code: "UG", name: "Ouganda" }, { code: "ZM", name: "Zambie" },
  { code: "ZW", name: "Zimbabwe" },
]

function countryFlag(code) {
  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`
}
function flagImg(code, alt, size) {
  const s = size || '16px'
  return <img src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`} alt={alt || code} style={{ width:'auto', height:s, verticalAlign:'middle', borderRadius:'2px', marginRight:'4px' }} />
}
function countryName(code) {
  const c = AFRICAN_COUNTRIES.find(c => c.code === code)
  return c ? c.name : code
}
function countryCodeFromName(name) {
  const c = AFRICAN_COUNTRIES.find(c => c.name === name)
  return c ? c.code : null
}

const ROLES = [
  { value: 'ambassador', label: 'Ambassadeur' },
  { value: 'supermaster', label: 'Super Master' },
  { value: 'partner', label: 'Partenaire' },
  { value: 'director', label: "Chef d'orphelinat" },
  { value: 'federation', label: 'Fédération' },
  { value: 'auditor', label: 'Auditeur' },
]

const CATEGORY_ICONS = ['\u{1F4CB}', '\u{1F4C8}', '\u{26A1}', '\u{1F4C5}', '\u{1F4C4}', '\u{1F3EB}', '\u{1F4E2}', '\u{1F91D}', '\u{1F464}', '\u{1F3E0}']

export default function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [chatbotCollapsed, setChatbotCollapsed] = useState(true)
  const [verifyParams, setVerifyParams] = useState(null)
  const [user, setUser] = useState(null)
  const [activeKey, setActiveKey] = useState('dashboard')
  const [subKey, setSubKey] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const uid = params.get('uid')
    if (token && uid) setVerifyParams({ token, uid })
  }, [])

  useEffect(() => {
    const access = localStorage.getItem('access_token')
    if (!access) return
    fetch(`${API}/auth/me/`, {
      headers: { Authorization: `Bearer ${access}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setUser(data))
      .catch(() => {})
  }, [])

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  if (user) {
    const roleLower = (user.role || '').toLowerCase()
    const rolesWithDashboard = ['director', 'ambassador', 'supermaster', 'federation', 'partner', 'auditor']
    if (rolesWithDashboard.includes(roleLower)) {
      return (
        <ToastProvider>
          <LangProvider>
            <div className="app">
              <DashboardHeader user={user} roleLower={roleLower} roleLabel={ROLES.find(r => r.value === roleLower)?.label || roleLower} activeKey={activeKey} subKey={subKey} setActiveKey={setActiveKey} setSubKey={setSubKey} />
              <main><DashboardShell user={user} role={roleLower} onLogout={logout} activeKey={activeKey} setActiveKey={setActiveKey} subKey={subKey} setSubKey={setSubKey} /></main>
            </div>
          </LangProvider>
        </ToastProvider>
      )
    }
  }

  return (
    <LangProvider>
      <div className="app">
        <Header onLoginClick={() => setShowLogin(true)} onSignupClick={() => setShowSignup(true)} onVirtualAssist={() => setChatbotCollapsed(false)} />
        <main>
          <Hero />
          <Profiles />
          <Support />
          <Stats />
          <Contact />
        </main>
        <Footer />
        <WhatsAppFloat />
        <Chatbot collapsed={chatbotCollapsed} onToggle={setChatbotCollapsed} />
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true) }} onLogin={setUser} />}
        {showSignup && <SignupModal onClose={() => setShowSignup(false)} onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true) }} />}
        {verifyParams && <VerifyEmail params={verifyParams} onDone={() => setVerifyParams(null)} />}
      </div>
    </LangProvider>
  )
}

function Header({ onLoginClick, onSignupClick, onVirtualAssist }) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="header" data-scrolled={scrolled}>
      <div className="header-inner container">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <img src="/logo.jpg" alt="Logo" className="logo-img" />
          <span className="logo-text">Fédération<span className="accent"> des Orphelinats</span></span>
        </a>
        <nav className={`nav${menuOpen ? ' open' : ''}`}>
          <a href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('hero') }}>{t('header_accueil')}</a>
          <a href="#profiles" onClick={(e) => { e.preventDefault(); scrollTo('profiles') }}>{t('header_profils')}</a>
          <a href="#support" onClick={(e) => { e.preventDefault(); scrollTo('support') }}>{t('header_soutenir')}</a>
          <a href="#stats" onClick={(e) => { e.preventDefault(); scrollTo('stats') }}>{t('header_statistiques')}</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact') }}>{t('header_contact')}</a>
        </nav>
        <div className="header-actions">
          <button className="btn btn-ghost-sm" onClick={onVirtualAssist} title={t('header_assistance')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {t('header_assistance')}
          </button>
          <button className="btn btn-outline" onClick={onLoginClick}>{t('header_login')}</button>
          <button className="btn btn-primary" onClick={onSignupClick}>{t('header_signup')}</button>
        </div>
        <button className={`hamburger${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}

function svgUrl(letter, bg, w, h) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg}dd"/><stop offset="100%" stop-color="${bg}88"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)" rx="${Math.round(Math.min(w,h)*0.08)}"/><text x="${w/2}" y="${h*0.58}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="${Math.round(Math.min(w,h)*0.45)}" font-weight="bold" font-family="Arial,sans-serif">${letter}</text></svg>`)}`
}

const youthData = [
  { name: 'Aminata', age: 7, country: 'Sénégal', code: 'SN', color: '#f59e0b', img: svgUrl('A', '#f59e0b', 500, 600) },
  { name: 'Kofi', age: 10, country: 'Ghana', code: 'GH', color: '#22c55e', img: svgUrl('K', '#22c55e', 500, 600) },
  { name: 'Zara', age: 6, country: 'Éthiopie', code: 'ET', color: '#a855f7', img: svgUrl('Z', '#a855f7', 500, 600) },
  { name: 'Moussa', age: 12, country: 'Mali', code: 'ML', color: '#3b82f6', img: svgUrl('M', '#3b82f6', 500, 600) },
  { name: 'Fatou', age: 8, country: 'RDC', code: 'CD', color: '#ef4444', img: svgUrl('F', '#ef4444', 500, 600) },
]

function Hero() {
  const { t } = useTranslation()
  const [slide, setSlide] = useState(0)
  const len = youthData.length

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % len), 5000)
    return () => clearInterval(t)
  }, [len])

  const youth = youthData[slide]

  return (
    <section className="hero" id="hero">
      <div className="hero-grid container">
        <div className="hero-image-card">
          <div className="mock-img">
            <div className="hero-slide">
              {youthData.map((y, i) => (
                <div key={i} className={`hero-slide-img${i === slide ? ' active' : ''}`}>
                  <img src={y.img} alt={y.name} />
                  <div className="hero-slide-overlay" style={{ background: `linear-gradient(transparent 50%, ${y.color}dd 100%)` }}>
                    <div className="hero-slide-info">
                      <span className="hero-slide-name">{y.name}</span>
                      <span className="hero-slide-age">{y.age} ans &middot; {flagImg(y.code, y.country)} {y.country}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hero-dots">
              {youthData.map((y, i) => (
                <button key={i} className={`hdot${i === slide ? ' active' : ''}`} onClick={() => setSlide(i)} style={i === slide ? { background: y.color } : {}} />
              ))}
            </div>
            <div className="mock-badge">
              <span className="badge-dot" />
              <span>{t('hero_badge')}</span>
            </div>
          </div>
        </div>
        <div className="hero-text">
          <span className="hero-tagline">{t('hero_tagline')}</span>
          <h1>{t('hero_title_1')} <span className="accent">{t('hero_title_2')}</span></h1>
          <p>{t('hero_desc')}</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('hero_cta_primary')}
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => document.getElementById('profiles')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('hero_cta_secondary')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

const childrenGrid = [
  [
    { name: 'Aminata', color: '#f59e0b', img: svgUrl('A', '#f59e0b', 200, 250) },
    { name: 'Kofi', color: '#22c55e', img: svgUrl('K', '#22c55e', 200, 250) },
    { name: 'Zara', color: '#a855f7', img: svgUrl('Z', '#a855f7', 200, 250) },
  ],
  [
    { name: 'Moussa', color: '#3b82f6', img: svgUrl('M', '#3b82f6', 200, 250) },
    { name: 'Fatou', color: '#ef4444', img: svgUrl('F', '#ef4444', 200, 250) },
    { name: 'Ekua', color: '#06b6d4', img: svgUrl('E', '#06b6d4', 200, 250) },
  ],
  [
    { name: 'Thabo', color: '#eab308', img: svgUrl('T', '#eab308', 200, 250) },
    { name: 'Aminata', color: '#f59e0b', img: svgUrl('A', '#f59e0b', 200, 250) },
    { name: 'Kofi', color: '#22c55e', img: svgUrl('K', '#22c55e', 200, 250) },
  ],
]

function Profiles() {
  const { t } = useTranslation()
  const [gridIdx, setGridIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setGridIdx(g => (g + 1) % childrenGrid.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="profiles" id="profiles">
      <div className="container">
        <div className="profiles-card">
          <div className="profiles-content">
            <span className="section-tag">{t('profiles_tag')}</span>
            <h2>{t('profiles_title_1')} <span className="accent">{t('profiles_title_2')}</span></h2>
            <p>{t('profiles_desc')}</p>
            <button className="btn btn-primary btn-xl">{t('profiles_btn')}</button>
          </div>
          <div className="profiles-visual">
            <div className="profile-stack">
              {childrenGrid[gridIdx].map((c, i) => (
                <div key={i} className="profile-card-sm" style={{ '--i': i, '--card-accent': c.color }}>
                  <div className="profile-sm-img">
                    <img src={c.img} alt={c.name} />
                  </div>
                  <div className="profile-sm-name">{c.name}</div>
                </div>
              ))}
            </div>
            <div className="profile-dots">
              {childrenGrid.map((_, i) => (
                <span key={i} className={`pdot${i === gridIdx ? ' active' : ''}`} onClick={() => setGridIdx(i)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Support() {
  const { t } = useTranslation()
  const [activePill, setActivePill] = useState(1)
  const pills = ['15 €', '30 €', '50 €', '100 €']

  return (
    <section className="support" id="support">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{t('support_tag')}</span>
          <h2>{t('support_title_1')} <span className="accent">{t('support_title_2')}</span></h2>
        </div>
        <div className="support-grid">
          <div className="support-card join">
            <div className="support-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <h3>{t('support_join_title')}</h3>
            <p>{t('support_join_desc')}</p>
            <ul className="support-list">
              <li><span className="check-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span> {t('support_join_li1')}</li>
              <li><span className="check-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span> {t('support_join_li2')}</li>
              <li><span className="check-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span> {t('support_join_li3')}</li>
            </ul>
            <button className="btn btn-outline btn-block">{t('support_join_btn')}</button>
          </div>
          <div className="support-card donate">
            <div className="support-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="#ef4444">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3>{t('support_donate_title')}</h3>
            <p>{t('support_donate_desc')}</p>
            <div className="donate-pills">
              {pills.map((p, i) => (
                <span key={i} className={`pill${i === activePill ? ' active' : ''}`} onClick={() => setActivePill(i)}>
                  {p}
                </span>
              ))}
            </div>
            <button className="btn btn-primary btn-block">{t('support_donate_btn')}</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const { t } = useTranslation()
  const statsRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const countries = [
    { name: 'Rép. Dém. Congo', count: 342, pct: 85, code: 'CD' },
    { name: 'Côte d\'Ivoire', count: 218, pct: 55, code: 'CI' },
    { name: 'Cameroun', count: 307, pct: 77, code: 'CM' },
    { name: 'Sénégal', count: 195, pct: 49, code: 'SN' },
    { name: 'Burkina Faso', count: 178, pct: 45, code: 'BF' },
    { name: 'Madagascar', count: 412, pct: 100, code: 'MG' },
  ]

  return (
    <section className="stats" id="stats" ref={statsRef}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{t('stats_tag')}</span>
          <h2>{t('stats_title_1')} <span className="accent">{t('stats_title_2')}</span></h2>
        </div>
        <div className="stats-row">
          {countries.map((c, i) => (
            <div key={i} className="stat-item">
              <span className="stat-number">{c.count}</span>
              <span className="stat-label">{flagImg(c.code, c.name)} {c.name}</span>
              <div className="stat-bar">
                <div className="stat-fill" style={{ width: visible ? `${c.pct}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Contact() {
  const { t } = useTranslation()
  return (
    <section className="contact" id="contact">
      <div className="contact-grid container">
        <div className="contact-form-area">
          <span className="section-tag">{t('contact_tag')}</span>
          <h2>{t('contact_title_1')}<span className="accent">{t('contact_title_2')}</span></h2>
          <form className="contact-form" onSubmit={e => e.preventDefault()}>
            <div className="form-row">
              <input type="text" placeholder={t('contact_name')} required />
              <input type="email" placeholder={t('contact_email')} required />
            </div>
            <input type="text" placeholder={t('contact_subject')} />
            <textarea placeholder={t('contact_message')} rows={5} />
            <button type="submit" className="btn btn-primary">{t('contact_submit')}</button>
          </form>
        </div>
        <div className="social-area">
          <span className="section-tag">{t('contact_social_tag')}</span>
          <h2>{t('contact_social_title_1')} <span className="accent">{t('contact_social_title_2')}</span></h2>
          <div className="social-grid">
            {[
              { label: 'Facebook', icon: 'f' },
              { label: 'LinkedIn', icon: 'in' },
              { label: 'Instagram', icon: 'ig' },
              { label: 'Twitter / X', icon: 'X' },
              { label: 'YouTube', icon: 'yt' },
              { label: 'TikTok', icon: 'tk' },
            ].map((s, i) => (
              <a key={i} href="#" className="social-badge" onClick={e => e.preventDefault()}>
                <span className="soc-icon">{s.icon}</span>
                {s.label}
              </a>
            ))}
          </div>
          <div className="contact-info">
            <p>&#9993; contact@cdo-africa.org</p>
            <p>&#9742; +243 800 123 456</p>
            <p>&#127758; Kinshasa, RDC</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ===== ROLE DASHBOARDS ===== */
const ROLE_NAV = {
  director: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Enfants', key: 'enfants' },
    { label: 'Enfants enregistrés', key: 'enfants-enregistres' },
    { label: 'Mise à jour', key: 'update-center' },
    { label: 'Historique', key: 'history-center' },
    { label: 'Projets', key: 'projets' },
    { label: 'Orphelinat', key: 'orphelinats' },
    { label: 'Documents', key: 'documents' },
    { label: 'Ambassadeurs', key: 'ambassadeurs' },
    { label: 'Demandes', key: 'demandes' },
    { label: 'Finances', key: 'finances' },
    { label: 'Dons', key: 'dons' },
    { label: 'Parrainages', key: 'parrainages' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  ambassador: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Gestion multi-orphelinats', key: 'multiOrphelinats' },
    { label: 'Validation locale', key: 'validationLocale' },
    { label: 'Projets', key: 'projets' },
    { label: 'Vérifications', key: 'verifications' },
    { label: 'Dons', key: 'dons' },
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  supermaster: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Système', key: 'systeme' },
    { label: 'Utilisateurs', key: 'users' },
    { label: 'Orphelinats', key: 'orphelinats' },
    { label: 'Ambassadeurs', key: 'ambassadeurs' },
    { label: 'Finances', key: 'finances' },
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  federation: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Utilisateurs', key: 'users' },
    { label: 'Orphelinats', key: 'orphelinats' },
    { label: 'Ambassadeurs', key: 'ambassadeurs' },
    { label: 'Finances', key: 'finances' },
    { label: 'Validation des donnees', key: 'validationLocale' },
    { label: 'Partenaires', key: 'partenaires' },
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  partner: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Besoins', key: 'besoins' },
    { label: 'Projets', key: 'projets' },
    { label: 'Parrainages', key: 'parrainages' },
    { label: 'Dons', key: 'dons' },
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  sponsor: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Dons', key: 'dons' },
    { label: 'Parrainages', key: 'parrainages' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  auditor: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Finances', key: 'finances' },
    { label: 'Paramètres', key: 'parametres' },
  ],
}

const ROLE_PAGES = {
  director: {
    dashboard: { title: 'Tableau de bord général', subtitle: "Vue d'ensemble de l'état de l'orphelinat.", categories: [
      { id: 'D1', title: 'Résumé des opérations', subtitle: '5 Alertes', count: 5 },
      { id: 'D2', title: 'Indicateurs de performance', subtitle: '12 Métriques', count: 12 },
      { id: 'D3', title: 'Actions prioritaires', subtitle: '3 En attente', count: 3 },
      { id: 'D4', title: 'Calendrier', subtitle: '8 Événements', count: 8 },
    ]},
    enfants: { title: 'Profil Complet', subtitle: 'Dossier numérique complet de chaque enfant.', categories: [
      { id: 'E1', title: 'Profil & identité', subtitle: 'Nom, prénom, sexe, âge, photo', count: 24 },
      { id: 'E2', title: 'Situation familiale', subtitle: 'Parents, tuteurs, fratrie, historique', count: 24 },
      { id: 'E3', title: 'Documents administratifs', subtitle: 'Acte de naissance, pièces, décisions', count: 24 },
      { id: 'E4', title: 'Santé & médical', subtitle: 'Groupe sanguin, vaccins, allergies, traitements', count: 24 },
      { id: 'E5', title: 'Scolarité', subtitle: 'Établissement, classe, résultats, bulletins', count: 24 },
    ]},
    'enfants-enregistres': { title: 'Enfants Enregistrés', subtitle: '' },
    projets: { title: 'Gestion des projets', subtitle: 'Planifier et exécuter les projets.', categories: [
      { id: 'P1', title: 'Projets en cours', subtitle: '6 Projets', count: 6 },
      { id: 'P2', title: 'Budget et financement', subtitle: '4 Sources', count: 4 },
      { id: 'P3', title: "Rapports d'impact", subtitle: '8 Rapports', count: 8 },
      { id: 'P4', title: 'Nouveaux projets', subtitle: '2 Propositions', count: 2 },
    ]},
    documents: { title: 'Gestion des documents', subtitle: 'Archives administratives.', categories: [
      { id: 'B1', title: 'Actes de naissance', subtitle: '16 Fichiers', count: 16 },
      { id: 'B2', title: 'Rapports médicaux', subtitle: '28 Fichiers', count: 28 },
      { id: 'B3', title: 'Documents administratifs', subtitle: '15 Fichiers', count: 15 },
      { id: 'B4', title: 'Archives historiques', subtitle: '106 Fichiers', count: 106 },
    ]},
    ambassadeurs: { title: 'Communication ambassadeurs', subtitle: 'Échanges et parrainages.', categories: [
      { id: 'A1', title: 'Liste des ambassadeurs', subtitle: '12 Ambassadeurs', count: 12 },
      { id: 'A2', title: 'Messagerie', subtitle: '5 Conversations', count: 5 },
      { id: 'A3', title: 'Rapports mensuels', subtitle: '10 Rapports', count: 10 },
      { id: 'A4', title: 'Demandes de parrainage', subtitle: '7 Demandes', count: 7 },
    ]},
    demandes: { title: 'Gestion des demandes', subtitle: 'Besoins et appels aux dons.', categories: [
      { id: 'R1', title: 'Besoins urgents', subtitle: '3 Prioritaires', count: 3 },
      { id: 'R2', title: 'Campagnes de collecte', subtitle: '2 Campagnes', count: 2 },
      { id: 'R3', title: 'État des dons', subtitle: '45 Dons', count: 45 },
      { id: 'R4', title: 'Publications', subtitle: '18 Publications', count: 18 },
    ]},
    dons: { title: 'Dons', subtitle: 'Suivi des contributions.', categories: [] },
    finances: { title: 'Finances', subtitle: 'Revenus et dépenses.', categories: [] },
    parrainages: { title: 'Parrainages', subtitle: "Parrainages de l'orphelinat.", categories: [] },
    parametres: { title: 'Paramètres', subtitle: 'Configuration du compte.', categories: [
      { id: 'S4', title: 'Configuration', subtitle: 'Paramètres système', count: 2 },
    ]},
  },
  ambassador: {
    dashboard: { title: 'Tableau de bord', subtitle: "Vue d'ensemble des orphelinats suivis.", categories: [
      { id: 'D1', title: 'Orphelinats actifs', subtitle: '8 Centres', count: 8 },
      { id: 'D2', title: 'Alertes en cours', subtitle: '3 Non résolues', count: 3 },
      { id: 'D3', title: 'Projets en suivi', subtitle: '12 Projets', count: 12 },
      { id: 'D4', title: 'Dons vérifiés', subtitle: '45 Ce mois', count: 45 },
    ]},
    multiOrphelinats: { title: 'Gestion multi-orphelinats', subtitle: "Supervision de l'ensemble des centres rattachés.", categories: [
      { id: 'O1', title: 'Liste des centres', subtitle: '8 Orphelinats', count: 8 },
      { id: 'O2', title: 'Visites terrain', subtitle: '3 Planifiées', count: 3 },
      { id: 'O3', title: 'Rapports de visite', subtitle: '12 Rapports', count: 12 },
      { id: 'O4', title: "Accompagnement d'équipe", subtitle: '6 Directeurs', count: 6 },
    ]},
    validationLocale: { title: 'Validation locale', subtitle: "Vérification et approbation sur le terrain.", categories: [
      { id: 'V1', title: 'Validations en attente', subtitle: '12 Demandes', count: 12 },
      { id: 'V2', title: "Données d'état civil", subtitle: '8 À vérifier', count: 8 },
      { id: 'V3', title: 'Rapports de terrain', subtitle: '4 En attente', count: 4 },
      { id: 'V4', title: 'Validations approuvées', subtitle: '23 Ce mois', count: 23 },
    ]},
    projets: { title: 'Suivi des projets', subtitle: 'Superviser les projets locaux.', categories: [
      { id: 'P1', title: 'Projets en cours', subtitle: '12 Projets', count: 12 },
      { id: 'P2', title: 'Évaluation', subtitle: '4 En cours', count: 4 },
      { id: 'P3', title: "Rapports d'impact", subtitle: '8 Reçus', count: 8 },
      { id: 'P4', title: "Validation d'étape", subtitle: '3 En attente', count: 3 },
    ]},
    verifications: { title: 'Vérifications', subtitle: "Contrôle et validation des données.", categories: [
      { id: 'V1', title: 'Données à vérifier', subtitle: '15 En attente', count: 15 },
      { id: 'V2', title: 'Validations récentes', subtitle: '28 Cette semaine', count: 28 },
      { id: 'V3', title: "Anomalies détectées", subtitle: '2 Signalées', count: 2 },
      { id: 'V4', title: "Rapport d'audit", subtitle: '6 Audits', count: 6 },
    ]},
    dons: { title: "Contrôle des dons", subtitle: 'Suivi et répartition des contributions.', categories: [
      { id: 'N1', title: 'Dons reçus', subtitle: '45 Ce mois', count: 45 },
      { id: 'N2', title: 'Répartition', subtitle: '12 Centres', count: 12 },
      { id: 'N3', title: 'Dons en transit', subtitle: '5 En cours', count: 5 },
      { id: 'N4', title: "Reçus et attestations", subtitle: '30 Documents', count: 30 },
    ]},
    rapports: { title: 'Rapports', subtitle: "Production des rapports d'activité.", categories: [
      { id: 'R1', title: 'Rapport mensuel', subtitle: 'À soumettre', count: 1 },
      { id: 'R2', title: 'Rapport trimestriel', subtitle: '2 Reçus', count: 2 },
      { id: 'R3', title: 'Rapport annuel', subtitle: '2025 Généré', count: 1 },
      { id: 'R4', title: 'Statistiques', subtitle: '8 Graphiques', count: 8 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration du compte.', categories: [
      { id: 'S4', title: 'Configuration', subtitle: 'Préférences', count: 2 },
    ]},
  },
  supermaster: {
    dashboard: { title: 'Supervision générale', subtitle: "Administration centrale du système.", categories: [
      { id: 'D1', title: 'État du système', subtitle: 'Opérationnel', count: 100 },
      { id: 'D2', title: 'Utilisateurs actifs', subtitle: '42 Connectés', count: 42 },
      { id: 'D3', title: 'Alertes sécurité', subtitle: '0 Critique', count: 0 },
      { id: 'D4', title: 'Maintenance', subtitle: 'Planifiée', count: 2 },
    ]},
    systeme: { title: 'Configuration système', subtitle: 'Paramétrage global de la plateforme.', categories: [
      { id: 'C1', title: 'Paramètres généraux', subtitle: 'Nom, fuseau, langue', count: 6 },
      { id: 'C2', title: 'Sécurité système', subtitle: 'Firewall, SSL, 2FA', count: 4 },
      { id: 'C3', title: 'Maintenance', subtitle: 'Sauvegardes logs', count: 3 },
      { id: 'C4', title: 'API et intégrations', subtitle: '3 Services', count: 3 },
    ]},
    users: { title: 'Gestion des utilisateurs', subtitle: "Création et gestion des accès.", categories: [
      { id: 'U1', title: 'Tous les utilisateurs', subtitle: '156 Comptes', count: 156 },
      { id: 'U2', title: "Demandes d'inscription", subtitle: '8 En attente', count: 8 },
      { id: 'U3', title: 'Rôles et permissions', subtitle: '5 Rôles', count: 5 },
      { id: 'U4', title: "Audit d'accès", subtitle: '28 Journaux', count: 28 },
    ]},
    orphelinats: { title: 'Gestion des orphelinats', subtitle: "Supervision des centres.", categories: [
      { id: 'O1', title: 'Tous les centres', subtitle: '12 Orphelinats', count: 12 },
      { id: 'O2', title: "Validations d'activité", subtitle: '6 En attente', count: 6 },
      { id: 'O3', title: 'Statistiques', subtitle: 'Par région', count: 4 },
      { id: 'O4', title: 'Affectations', subtitle: '3 Ambassadeurs', count: 3 },
    ]},
    ambassadeurs: { title: 'Supervision ambassadeurs', subtitle: "Gestion des ambassadeurs terrain.", categories: [
      { id: 'A1', title: 'Liste des ambassadeurs', subtitle: '12 Ambassadeurs', count: 12 },
      { id: 'A2', title: 'Rapports reçus', subtitle: '8 Ce mois', count: 8 },
      { id: 'A3', title: 'Évaluations', subtitle: '3 En cours', count: 3 },
      { id: 'A4', title: "Demandes d'affectation", subtitle: '2 Nouvelles', count: 2 },
    ]},
    finances: { title: 'Finances', subtitle: 'Revenus et dépenses.', categories: [] },
    rapports: { title: 'Rapports nationaux', subtitle: "Production et consultation des rapports.", categories: [
      { id: 'R1', title: 'Rapport national', subtitle: 'À générer', count: 1 },
      { id: 'R2', title: 'Rapports régionaux', subtitle: '4 Reçus', count: 4 },
      { id: 'R3', title: "Statistiques globales", subtitle: '12 Indicateurs', count: 12 },
      { id: 'R4', title: 'Export de données', subtitle: 'Formats PDF/CSV', count: 3 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration globale.', categories: [
      { id: 'S4', title: 'API', subtitle: 'Jetons et clés', count: 2 },
    ]},
  },
  federation: {
    dashboard: { title: "Tableau de bord de la Fédération", subtitle: "Gouvernance centrale des orphelinats.", categories: [
      { id: 'D1', title: 'Activités en cours', subtitle: '32 Actions', count: 32 },
      { id: 'D2', title: 'Validations requises', subtitle: '8 En attente', count: 8 },
      { id: 'D3', title: 'Partenariats actifs', subtitle: '6 Partenaires', count: 6 },
      { id: 'D4', title: 'Rapports du mois', subtitle: '4 Reçus', count: 4 },
    ]},
    users: { title: 'Gestion des utilisateurs', subtitle: "Créer et gérer les comptes.", categories: [
      { id: 'U1', title: "Liste d'utilisateurs", subtitle: '156 Comptes', count: 156 },
      { id: 'U2', title: 'Créer un compte', subtitle: "Nouvel utilisateur", count: 1 },
      { id: 'U3', title: 'Rôles', subtitle: '5 Types', count: 5 },
      { id: 'U4', title: "Demandes d'activation", subtitle: '8 En attente', count: 8 },
    ]},
    orphelinats: { title: 'Gestion des orphelinats', subtitle: "Administration des centres.", categories: [
      { id: 'O1', title: 'Centres actifs', subtitle: '12 Orphelinats', count: 12 },
      { id: 'O2', title: "Validations données", subtitle: '15 En attente', count: 15 },
      { id: 'O3', title: "Contrôle d'activités", subtitle: '6 Rapports', count: 6 },
      { id: 'O4', title: "Affectations", subtitle: '3 En cours', count: 3 },
    ]},
    ambassadeurs: { title: 'Supervision ambassadeurs', subtitle: "Gestion et suivi des ambassadeurs.", categories: [
      { id: 'A1', title: 'Ambassadeurs actifs', subtitle: '12 En poste', count: 12 },
      { id: 'A2', title: 'Rapports reçus', subtitle: '8 Ce mois', count: 8 },
      { id: 'A3', title: 'Évaluations', subtitle: '3 En cours', count: 3 },
      { id: 'A4', title: 'Affectations', subtitle: '5 Demandes', count: 5 },
    ]},
    partenaires: { title: 'Gestion des partenariats', subtitle: "Partenaires et relations.", categories: [
      { id: 'N1', title: 'Partenaires actifs', subtitle: '6 Partenaires', count: 6 },
      { id: 'N2', title: 'Nouveaux prospects', subtitle: '3 En discussion', count: 3 },
      { id: 'N3', title: 'Conventions', subtitle: '8 Signées', count: 8 },
      { id: 'N4', title: "Appels d'offres", subtitle: '2 En cours', count: 2 },
    ]},
    finances: { title: 'Finances', subtitle: 'Revenus et dépenses.', categories: [] },
    rapports: { title: 'Rapports nationaux', subtitle: "Production des rapports.", categories: [
      { id: 'R1', title: 'Rapport mensuel', subtitle: 'Avril 2026', count: 1 },
      { id: 'R2', title: 'Rapport financier', subtitle: 'Trimestre 2', count: 1 },
      { id: 'R3', title: 'Statistiques globales', subtitle: '12 Indicateurs', count: 12 },
      { id: 'R4', title: 'Export', subtitle: 'PDF/CSV', count: 3 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration du compte.', categories: [
      { id: 'S4', title: 'Configuration', subtitle: 'Préférences', count: 2 },
    ]},
  },
  partner: {
    dashboard: { title: 'Tableau de bord', subtitle: "Vue d'ensemble des contributions.", categories: [
      { id: 'D1', title: 'Mes contributions', subtitle: '12 Projets financés', count: 12 },
      { id: 'D2', title: 'Parrainages en cours', subtitle: '3 Enfants', count: 3 },
      { id: 'D3', title: 'Besoins urgents', subtitle: '5 Nouveaux', count: 5 },
      { id: 'D4', title: 'Rapports disponibles', subtitle: '8 Documents', count: 8 },
    ]},
    besoins: { title: 'Consultation des besoins', subtitle: "Consulter les besoins des orphelinats.", categories: [
      { id: 'N1', title: 'Besoins matériels', subtitle: '15 Demandes', count: 15 },
      { id: 'N2', title: "Besoins financiers", subtitle: '8 Projets', count: 8 },
      { id: 'N3', title: 'Urgences', subtitle: '3 Critiques', count: 3 },
      { id: 'N4', title: "Appels aux dons", subtitle: '2 Campagnes', count: 2 },
    ]},
    projets: { title: 'Financement de projets', subtitle: 'Contribuer aux projets locaux.', categories: [
      { id: 'P1', title: 'Projets ouverts', subtitle: '6 Disponibles', count: 6 },
      { id: 'P2', title: 'Mes financements', subtitle: '12 Projets', count: 12 },
      { id: 'P3', title: "Rapports d'impact", subtitle: '8 Reçus', count: 8 },
      { id: 'P4', title: "Propositions", subtitle: '2 Nouvelles', count: 2 },
    ]},
    parrainages: { title: 'Parrainage', subtitle: "Parrainer un enfant à distance.", categories: [
      { id: 'F1', title: 'Enfants disponibles', subtitle: '18 Profils', count: 18 },
      { id: 'F2', title: 'Mes filleuls', subtitle: '3 Enfants', count: 3 },
      { id: 'F3', title: 'Échanges reçus', subtitle: '6 Messages', count: 6 },
      { id: 'F4', title: "Photos et rapports", subtitle: '9 Documents', count: 9 },
    ]},
    dons: { title: 'Dons', subtitle: 'Suivi des contributions.', categories: [] },
    rapports: { title: 'Rapports et documents', subtitle: 'Télécharger les rapports.', categories: [
      { id: 'R1', title: "Rapports d'impact", subtitle: '8 Documents', count: 8 },
      { id: 'R2', title: "Rapports financiers", subtitle: '4 Documents', count: 4 },
      { id: 'R3', title: 'Attestations fiscales', subtitle: '3 Disponibles', count: 3 },
      { id: 'R4', title: "Suivi des contributions", subtitle: '12 Mois', count: 12 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration du compte.', categories: [
      { id: 'S4', title: 'Configuration', subtitle: 'Préférences', count: 2 },
    ]},
  },
  sponsor: {
    dashboard: { title: 'Tableau de bord', subtitle: "Vue d'ensemble.", categories: [] },
    dons: { title: 'Dons', subtitle: 'Suivi des contributions.', categories: [] },
    parrainages: { title: 'Parrainages', subtitle: 'Parrainer un enfant.', categories: [] },
    communication: { title: 'Communication', subtitle: 'Messagerie.', categories: [] },
    parametres: { title: 'Paramètres', subtitle: 'Compte et préférences.', categories: [] },
  },
  auditor: {
    dashboard: { title: 'Tableau de bord', subtitle: "Vue d'ensemble.", categories: [] },
    finances: { title: 'Finances', subtitle: 'Revenus et dépenses.', categories: [] },
    parametres: { title: 'Paramètres', subtitle: 'Compte et préférences.', categories: [] },
  },
}

const ROLE_STATS = {
  director: [
    { label: 'ENFANTS', value: '24', sub: 'CAPACITÉ : 95%', color: '#f59e0b' },
    { label: 'PROJETS', value: '6', sub: 'ACTIFS', color: '#3b82f6' },
    { label: 'AMBASSADEURS', value: '12', sub: 'CONNECTÉS', color: '#a855f7' },
    { label: 'DEMANDES', value: '5', sub: 'CRITIQUES', color: '#ef4444' },
  ],
  ambassador: [
    { label: 'ORPHELINATS', value: '8', sub: 'SUIVIS', color: '#f59e0b' },
    { label: 'PROJETS', value: '12', sub: 'EN COURS', color: '#3b82f6' },
    { label: 'VALIDATIONS', value: '28', sub: 'CE MOIS', color: '#22c55e' },
    { label: 'ALERTES', value: '3', sub: 'NON RÉSOLUES', color: '#ef4444' },
  ],
  supermaster: [
    { label: 'UTILISATEURS', value: '156', sub: 'ACTIFS : 42', color: '#3b82f6' },
    { label: 'CENTRES', value: '12', sub: 'OPÉRATIONNELS', color: '#22c55e' },
    { label: 'AMBASSADEURS', value: '12', sub: 'EN POSTE', color: '#f59e0b' },
    { label: 'ALERTES', value: '0', sub: 'CRITIQUES', color: '#ef4444' },
  ],
  federation: [
    { label: 'ORPHELINATS', value: '12', sub: 'SUPERVISÉS', color: '#f59e0b' },
    { label: 'AMBASSADEURS', value: '12', sub: 'ACTIFS', color: '#3b82f6' },
    { label: 'PARTENAIRES', value: '6', sub: 'ACTIFS', color: '#22c55e' },
    { label: 'VALIDATIONS', value: '8', sub: 'EN ATTENTE', color: '#ef4444' },
  ],
  partner: [
    { label: 'CONTRIBUTIONS', value: '12', sub: 'PROJETS', color: '#f59e0b' },
    { label: 'PARRAINAGES', value: '3', sub: 'ENFANTS', color: '#3b82f6' },
    { label: 'DONS', value: '5', sub: 'CETTE ANNÉE', color: '#22c55e' },
    { label: 'RAPPORTS', value: '8', sub: 'DISPO.', color: '#a855f7' },
  ],
}

const RECENT_ACTIVITIES = [
  { text: 'Rapport médical ajouté · S. Kone', time: 'il y a 10 min' },
  { text: 'Validation administrative · Dossier 04', time: 'il y a 1h' },
]

const INTEGRITY_BARS = [
  { height: 65, color: '#f59e0b' },
  { height: 85, color: '#22c55e' },
  { height: 45, color: '#3b82f6' },
  { height: 70, color: '#a855f7' },
  { height: 55, color: '#f59e0b' },
  { height: 90, color: '#22c55e' },
]

function DashboardHeader({ user, roleLower, roleLabel, activeKey, subKey, setActiveKey, setSubKey }) {
  const { t, lang, setLang } = useTranslation()
  const [time, setTime] = useState(new Date())
  const [profileImg, setProfileImg] = useState(localStorage.getItem('cdo_profile_img') || null)
  const [localOrpName, setLocalOrpName] = useState(localStorage.getItem('cdo_orphanage_name') || '')
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('cdo_theme') || 'dark')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const allChildren = useRef([])
  const fileInputRef = useRef(null)
  const searchRef = useRef(null)
  const searchTimer = useRef(null)
  const notifDropRef = useRef(null)

  useEffect(() => {
    const check = setInterval(() => {
      const v = localStorage.getItem('cdo_orphanage_name') || ''
      if (v !== localOrpName) setLocalOrpName(v)
    }, 1000)
    return () => clearInterval(check)
  }, [localOrpName])

  useEffect(() => {
    const check = setInterval(() => {
      const v = localStorage.getItem('cdo_profile_img')
      if (v !== profileImg) setProfileImg(v)
    }, 1000)
    return () => clearInterval(check)
  }, [profileImg])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  /* ── Fetch notifications from API ── */
  const notifFetchRef = useRef(false)
  const fetchNotifications = async () => {
    const t = localStorage.getItem('access_token')
    if (!t) return
    try {
      let res = await fetch(`${API}/notifications/`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.status === 401) {
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
          if (refRes.ok) {
            const tokens = await refRes.json()
            localStorage.setItem('access_token', tokens.access)
            res = await fetch(`${API}/notifications/`, { headers: { Authorization: `Bearer ${tokens.access}` } })
          }
        }
      }
      if (res.ok) setNotifications(await res.json())
    } catch {}
  }
  useEffect(() => {
    if (notifFetchRef.current) return
    notifFetchRef.current = true
    fetchNotifications()
    const poll = setInterval(fetchNotifications, 30000)
    return () => clearInterval(poll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifDropRef.current && !notifDropRef.current.contains(e.target)) setNotifOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = (q) => {
    const trimmed = q.trim()
    if (!trimmed) { setSearchResults([]); return }
    const lower = trimmed.toLowerCase()

    if (!allChildren.current.length) {
      setSearchLoading(true)
      const token = localStorage.getItem('access_token')
      fetch(`${API}/enfants/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const list = Array.isArray(data) ? data : data.results || []
          allChildren.current = list
          setSearchLoading(false)
          setSearchResults(scoreAndSort(list, lower))
        })
        .catch(() => { setSearchLoading(false) })
    } else {
      setSearchResults(scoreAndSort(allChildren.current, lower))
    }
  }

  const scoreAndSort = (list, lower) => {
    const scored = list.map(child => {
      const prenom = (child.prenom || '').toLowerCase()
      const nom = (child.nom || '').toLowerCase()
      const full = prenom + ' ' + nom
      const uid = (child.uid || '').toLowerCase()
      let score = 0
      if (full === lower) score += 10
      else if (full.startsWith(lower)) score += 7
      else if (full.includes(lower)) score += 4
      if (prenom === lower || nom === lower) score += 8
      else if (prenom.startsWith(lower) || nom.startsWith(lower)) score += 5
      else if (prenom.includes(lower) || nom.includes(lower)) score += 2
      if (uid === lower) score += 12
      else if (uid.startsWith(lower)) score += 6
      else if (uid.includes(lower)) score += 1
      return { child, score }
    })
    return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map(s => s.child)
  }

  const handleSearchInput = (e) => {
    const v = e.target.value
    setSearchQuery(v)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(v), 300)
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '')
    localStorage.setItem('cdo_theme', next)
  }

  const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '')
  const hue = user.first_name ? user.first_name.charCodeAt(0) * 37 % 360 : 200
  const avatarSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="hsl(${hue},50%,35%)"/><text x="20" y="20" dominant-baseline="central" text-anchor="middle" fill="white" font-size="16" font-weight="700" font-family="system-ui">${initials}</text></svg>`)}`

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target.result
        setProfileImg(dataUrl)
        localStorage.setItem('cdo_profile_img', dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const markNotifRead = (nid) => {
    const t = localStorage.getItem('access_token')
    if (!t) return
    fetch(`${API}/notifications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id: nid }),
    }).then(() => { setNotifications(prev => prev.map(n => n.id === nid ? { ...n, is_read: true } : n)) }).catch(() => {})
  }
  const markAllRead = () => {
    const t = localStorage.getItem('access_token')
    if (!t) return
    fetch(`${API}/notifications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ mark_read: true }),
    }).then(() => { setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))) }).catch(() => {})
  }

  const notifCount = notifications.filter(n => !n.is_read).length
  const notifIcon = (title) => {
    if (title.includes('Refusé') || title.includes('rejet')) return '❌'
    if (title.includes('Modification')) return '🔄'
    return '📋'
  }

  return (
    <header className="hd">
      <div className="hd-inner">

        {/* ── LEFT: Logo + Breadcrumb ── */}
        <div className="hd-left">
          <div className="hd-brand">
            <img src="/logo.jpg" alt="CDO" className="hd-logo" />
            <span className="hd-brand-name">{localOrpName || (t('dash_org_name') || 'Fédération des Orphelinats')}</span>
          </div>
          <nav className="hd-breadcrumb" aria-label="Breadcrumb">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>{t('nav_' + activeKey.replace(/-/g, '_')) || activeKey}</span>
            {subKey && <><span className="hd-breadcrumb-sep">/</span><span className="hd-breadcrumb-current">{subKey}</span></>}
          </nav>
        </div>

        {/* ── CENTER: Global Search ── */}
        <div className="hd-center">
          <div className="hd-search" ref={searchRef}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              className="hd-search-input"
              placeholder={t('dash_search_placeholder') || 'Rechercher enfants, projets...'}
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => setSearchOpen(true)}
            />
            {searchLoading && <span className="hd-search-spinner" />}
            {searchOpen && searchQuery.trim() && (
              <div className="hd-search-drop">
                {searchResults.length > 0 ? (
                  searchResults.slice(0, 8).map(child => (
                    <div key={child.id || child.uid} className="hd-search-item" onClick={() => {
                      window.dispatchEvent(new CustomEvent('cdo-navigate-child', { detail: { uid: child.uid } }))
                      setSearchOpen(false); setSearchQuery(''); setSearchResults([])
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span className="hd-search-item-name">{child.prenom || ''} {child.nom || ''}</span>
                      <span className="hd-search-item-uid">{child.uid}</span>
                    </div>
                  ))
                ) : (
                  <div className="hd-search-empty">{t('dash_search_empty') || 'Aucun résultat'}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Tools + User ── */}
        <div className="hd-right">

          {/* Group: Location + Language */}
          <div className="hd-group">
            <div className="hd-country" title={countryName(user.country || 'CD')}>
              {flagImg(user.country || 'CD', '', '18px')}
            </div>
            <div className="hd-lang-wrap">
              <select className="hd-lang-select" value={lang} onChange={e => setLang(e.target.value)} aria-label="Language">
                <option value="fr">FR</option>
                <option value="en">EN</option>
                <option value="sw">SW</option>
                <option value="ln">LN</option>
                <option value="kg">KG</option>
                <option value="tl">TL</option>
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="hd-divider" />

          {/* Group: Status + Clock */}
          <div className="hd-group">
            <span className="hd-status" title={t('dash_system_status') || 'Système opérationnel'}>
              <span className="hd-status-dot" />
              <span className="hd-status-text">{t('dash_system_status') || 'Opérationnel'}</span>
            </span>
            <span className="hd-clock">{time.toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', { hour:'2-digit', minute:'2-digit' })}</span>
          </div>

          {/* Divider */}
          <div className="hd-divider" />

          {/* Group: Notifications + Theme */}
          <div className="hd-group">
            <div className="hd-notif-wrap" ref={notifDropRef}>
              <button className="hd-icon-btn" onClick={() => { setNotifOpen(v => !v) }} title={t('dash_notifications')} aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {notifCount > 0 && <span className="hd-badge">{notifCount}</span>}
              </button>
              {notifOpen && (
                <div className="hd-dropdown">
                  <div className="hd-dropdown-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span>{t('dash_notifications')}</span>
                    {notifCount > 0 && <button onClick={markAllRead} style={{background:'none',border:'none',color:'#60a5fa',fontSize:10,cursor:'pointer',padding:0}}>Tout marquer lu</button>}
                  </div>
                  {notifications.length === 0 && <div style={{padding:'16px',textAlign:'center',fontSize:11,color:'#64748b'}}>Aucune notification</div>}
                  {notifications.slice(0, 20).map(n => (
                    <div key={n.id} className="hd-dropdown-item" onClick={() => { if (!n.is_read) markNotifRead(n.id); setNotifOpen(false); setActiveKey('documents'); setSubKey(null) }} style={{opacity:n.is_read?0.5:1,cursor:'pointer'}}>
                      <span className="hd-dropdown-icon">{notifIcon(n.title)}</span>
                      <div className="hd-dropdown-body">
                        <div className="hd-dropdown-text" style={{fontWeight:n.is_read?400:600}}>{n.title}</div>
                        <div className="hd-dropdown-time" style={{fontSize:10,color:'#94a3b8',whiteSpace:'pre-wrap'}}>{n.content}</div>
                        <div className="hd-dropdown-time">{new Date(n.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="hd-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? t('dash_theme_light') : t('dash_theme_dark')} aria-label="Toggle theme">
              {theme === 'dark'
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
          </div>

          {/* Divider */}
          <div className="hd-divider" />

          {/* User (always visible, avatar + name) */}
          <div className="hd-user" onClick={() => { setActiveKey('parametres'); setSubKey('Profil') }} title={t('settings_profile') || 'Mon Profil'}>
            <div className="hd-user-avatar">
              <img src={profileImg || avatarSvg} alt="" />
            </div>
            <div className="hd-user-info">
              <span className="hd-user-name">{user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}</span>
              <span className="hd-user-role">{t('role_' + roleLower) || roleLabel}</span>
            </div>
            <svg className="hd-user-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

        </div>
      </div>
    </header>
  )
}

function genChildUid(exclude = new Set()) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let uid
  do {
    uid = ''
    for (let i = 0; i < 12; i++) uid += chars[Math.floor(Math.random() * chars.length)]
  } while (exclude.has(uid))
  return uid
}

/* ===== MESSAGING (EclatSocialApp removed — replaced by inline IIFE in DashboardShell) ===== */

/* ===== SVG CHART HELPERS ===== */
function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon || '📭'}</div>
      <div className="empty-state-title">{title || 'Aucun élément'}</div>
      {sub && <div className="empty-state-sub">{sub}</div>}
    </div>
  )
}

function BarChart({ data, valueKey, labelKey, color, unit }) {
  const u = unit || ''
  const values = data.map(d => d[valueKey] || 0)
  const max = Math.max(...values, 1)
  const W = 340, H = 140, BAR_W = Math.floor(W / data.length) - 6, PAD = 28
  return (
    <svg viewBox={`0 0 ${W} ${H + PAD}`} style={{ width: '100%', overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(2, ((d[valueKey] || 0) / max) * H)
        const x = i * (W / data.length) + (W / data.length - BAR_W) / 2
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} fill={color} rx={3} opacity={0.85} />
            <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle" fontSize={10} fill="var(--text-muted)">{d[labelKey]}</text>
            {d[valueKey] > 0 && <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={color}>{u}{d[valueKey]}</text>}
          </g>
        )
      })}
      <line x1={0} y1={H} x2={W} y2={H} stroke="var(--border-card)" strokeWidth={1} />
    </svg>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>Aucune donnée</div>
  const R = 60, CX = 80, CY = 80, STROKE = 22
  let cumAngle = -Math.PI / 2
  const arcs = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI
    const start = cumAngle
    cumAngle += angle
    return { ...d, start, angle }
  })
  const arcPath = (start, angle, r) => {
    const x1 = CX + r * Math.cos(start)
    const y1 = CY + r * Math.sin(start)
    const x2 = CX + r * Math.cos(start + angle)
    const y2 = CY + r * Math.sin(start + angle)
    const large = angle > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 160 160" style={{ width: 120, flexShrink: 0 }}>
        {arcs.map((a, i) => (
          <path key={i} d={arcPath(a.start, a.angle, R)} fill="none" stroke={a.color} strokeWidth={STROKE} strokeLinecap="butt" />
        ))}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill="var(--text-body)">{total}</text>
      </svg>
      <div>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'var(--text-body)' }}>{d.label}: <strong>{d.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ToastContext = React.createContext(null)
function useToast() { return React.useContext(ToastContext) }
function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])
  const addToast = React.useCallback((message, type) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type: type || 'success' }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{t.type === 'success' ? '✓' : '✕'}</span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function DashboardShell({ user, role, onLogout, activeKey, setActiveKey, subKey, setSubKey }) {
  const [registeredChildren, setRegisteredChildren] = useState([])
  const [selectedRegChild, setSelectedRegChild] = useState(null)
  const [editingChild, setEditingChild] = useState(null)
  const [childSearchQuery, setChildSearchQuery] = useState('')
  const [childGenderFilter, setChildGenderFilter] = useState('')
  const [childSortBy, setChildSortBy] = useState('date')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [unassignConfirm, setUnassignConfirm] = useState(null)
  const [docConfirmModal, setDocConfirmModal] = useState(null)
  const [profileImg, setProfileImg] = useState(localStorage.getItem('cdo_profile_img') || null)
  const uidRef = useRef(genChildUid())
  const migratePhoto = (oldUid, newUid) => {
    if (oldUid && newUid && oldUid !== newUid) {
      const photo = localStorage.getItem('cdo_child_photo_' + oldUid)
      if (photo) { localStorage.setItem('cdo_child_photo_' + newUid, photo); localStorage.removeItem('cdo_child_photo_' + oldUid) }
    }
  }
  const [dashTime, setDashTime] = useState(new Date())
  const [fedTab, setFedTab] = useState('pending')
  const [fedDocTab, setFedDocTab] = useState('dossiers')
  const [fedDocTypes, setFedDocTypes] = useState([])
  const [fedOrpDocuments, setFedOrpDocuments] = useState({})
  const [fedDocFeedback, setFedDocFeedback] = useState({})
  const [fedDocPoints, setFedDocPoints] = useState({})
  const [fedDocReviewLoading, setFedDocReviewLoading] = useState(false)
  const [fedDocTypeName, setFedDocTypeName] = useState('')
  const [fedDocTypeKey, setFedDocTypeKey] = useState('')
  const [fedDocTypeRequired, setFedDocTypeRequired] = useState(true)
  const [fedSavingDocType, setFedSavingDocType] = useState(false)
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }
  const [orphanageName, setOrphanageName] = useState(localStorage.getItem('cdo_orphanage_name') || '')

  /* ── Medical form state ── */
  const DEFAULT_VAX = [
    { name:'BCG', done:false, dateAdmin:'', nextDose:'' },
    { name:'Hépatite B', done:false, dateAdmin:'', nextDose:'' },
    { name:'DTCoq', done:false, dateAdmin:'', nextDose:'' },
    { name:'Polio (IPV)', done:false, dateAdmin:'', nextDose:'' },
    { name:'Rougeole-ROR', done:false, dateAdmin:'', nextDose:'' },
    { name:'Fièvre Jaune', done:false, dateAdmin:'', nextDose:'' },
    { name:'Pneumocoque', done:false, dateAdmin:'', nextDose:'' },
    { name:'Rotavirus', done:false, dateAdmin:'', nextDose:'' },
  ]
  const [vaccinations, setVaccinations] = useState(DEFAULT_VAX.map(v => ({...v})))
  const [allergies, setAllergies] = useState([])
  const [treatments, setTreatments] = useState([])
  const [showVaxForm, setShowVaxForm] = useState(false)
  const [showAllergyForm, setShowAllergyForm] = useState(false)
  const [showTxForm, setShowTxForm] = useState(false)
  const [savingHealth, setSavingHealth] = useState(false)

  /* ── Education form state ── */
  const DEFAULT_SUBJECTS = [
    { name:'Mathématiques', grade:'', coefficient:1 },
    { name:'Français', grade:'', coefficient:1 },
    { name:'Anglais', grade:'', coefficient:1 },
    { name:'Sciences', grade:'', coefficient:1 },
    { name:'Histoire/Géo', grade:'', coefficient:1 },
    { name:'Éducation Physique', grade:'', coefficient:1 },
  ]
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS.map(s => ({...s})))
  const [behaviorEntries, setBehaviorEntries] = useState([])
  const [activityEntries, setActivityEntries] = useState([])
  const [showBehaviorForm, setShowBehaviorForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [savingEdu, setSavingEdu] = useState(false)
  const [profileTab, setProfileTab] = useState('overview')

  /* Update Center state */
  const [ucStep, setUcStep] = useState(0)
  const [ucCategory, setUcCategory] = useState(null)
  const [ucType, setUcType] = useState('')
  const [ucTitle, setUcTitle] = useState('')
  const [ucDescription, setUcDescription] = useState('')
  const [ucPrevValue, setUcPrevValue] = useState('')
  const [ucNewValue, setUcNewValue] = useState('')
  const [ucReason, setUcReason] = useState('')
  const [ucFiles, setUcFiles] = useState([])
  const [ucSaving, setUcSaving] = useState(false)
  const [ucSuccess, setUcSuccess] = useState(false)

  /* History Center state */
  const [hcView, setHcView] = useState('timeline')
  const [hcEvents, setHcEvents] = useState([])
  const [hcFilterCategory, setHcFilterCategory] = useState('')
  const [hcFilterType, setHcFilterType] = useState('')
  const [hcSearch, setHcSearch] = useState('')
  const [hcLoading, setHcLoading] = useState(false)
  const [hcExpanded, setHcExpanded] = useState(null)
  const [hcDensity, setHcDensity] = useState('comfortable')
  const [hcFilterPriority, setHcFilterPriority] = useState('')
  const [hcFilterSource, setHcFilterSource] = useState('')
  const [hcDateFrom, setHcDateFrom] = useState('')
  const [hcDateTo, setHcDateTo] = useState('')
  const [hcStatusOnly, setHcStatusOnly] = useState(false)
  const [hcSelectedEvent, setHcSelectedEvent] = useState(null)
  const [hcStats, setHcStats] = useState({ total:0, status_changes:0, health_events:0, education_events:0, family_events:0, document_events:0, alert_events:0 })
  const [hcHistoryChild, setHcHistoryChild] = useState(null)
  const [hcCalendarData, setHcCalendarData] = useState([])
  const [hcViewMode, setHcViewMode] = useState('timeline')

  /* Update Center v2 state */
  const [updateChild, setUpdateChild] = useState(null)
  const [uc2Step, setUc2Step] = useState(0)
  const [uc2Category, setUc2Category] = useState(null)
  const [uc2Type, setUc2Type] = useState('')
  const [uc2FormData, setUc2FormData] = useState({})
  const [uc2Priority, setUc2Priority] = useState('normal')
  const [uc2Reason, setUc2Reason] = useState('')
  const [uc2Comment, setUc2Comment] = useState('')
  const [uc2Files, setUc2Files] = useState([])
  const [uc2Saving, setUc2Saving] = useState(false)
  const [uc2Success, setUc2Success] = useState(false)
  const [uc2Search, setUc2Search] = useState('')
  const [uc2Gender, setUc2Gender] = useState('')
  const [uc2AgeRange, setUc2AgeRange] = useState('')
  const [uc2Region, setUc2Region] = useState('')
  const [uc2SortStatus, setUc2SortStatus] = useState('')

  /* HC selector filters */
  const [hcGender, setHcGender] = useState('')
  const [hcAgeRange, setHcAgeRange] = useState('')
  const [hcRegion, setHcRegion] = useState('')
  const [hcSortStatus, setHcSortStatus] = useState('')

  /* Amb assign / Multi-orphelinats / Federation child data */
  const [ambAssignments, setAmbAssignments] = useState([])
  const [ambLoading, setAmbLoading] = useState(false)
  const [fedAllChildren, setFedAllChildren] = useState([])
  const [fedAllAssignments, setFedAllAssignments] = useState([])
  const [fedLoadingData, setFedLoadingData] = useState(false)
  const [orphanageChildren, setOrphanageChildren] = useState([])
  const [orphanageNeeds, setOrphanageNeeds] = useState([])
  const [loadingOrpDetails, setLoadingOrpDetails] = useState(false)
  const [orphanageAssignments, setOrphanageAssignments] = useState([])
  const [orpSelChildren, setOrpSelChildren] = useState([])
  const [orpAssignAmb, setOrpAssignAmb] = useState('')
  const [orpAssignLoading, setOrpAssignLoading] = useState(false)
  const [ambSearchQuery, setAmbSearchQuery] = useState('')
  const [docVerified, setDocVerified] = useState({})
  const [orpDetailTab, setOrpDetailTab] = useState('status')
  const [dirAmbAssignments, setDirAmbAssignments] = useState([])
  const [dirAmbLoading, setDirAmbLoading] = useState(false)
  const [dirSelectedAmb, setDirSelectedAmb] = useState(null)

  /* ── Donations state ── */
  const [donations, setDonations] = useState([])
  const [donationsLoading, setDonationsLoading] = useState(false)
  const [donationForm, setDonationForm] = useState({ donation_type: 'financier', amount: '', currency: 'USD', orphanage: '' })
  const [donationFormError, setDonationFormError] = useState('')

  /* ── Finances state ── */
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [financesLoading, setFinancesLoading] = useState(false)
  const [financesTab, setFinancesTab] = useState('revenus')
  const [incomeForm, setIncomeForm] = useState({ source: '', amount: '', orphanage: '' })
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', orphanage: '' })
  const [financesFormError, setFinancesFormError] = useState('')

  /* ── Parrainages state ── */
  const [sponsorableChildren, setSponsorableChildren] = useState([])
  const [mySponsored, setMySponsored] = useState([])
  const [parrainagesTab, setParrainagesTab] = useState('disponibles')
  const [parrainagesLoading, setParrainagesLoading] = useState(false)
  const [sponsorshipForm, setSponsorshipForm] = useState({ child: '', sponsorship_type: 'monthly', amount: '' })
  const [sponsorshipFormError, setSponsorshipFormError] = useState('')
  const [donationSubmitting, setDonationSubmitting] = useState(false)
  const [financesSubmitting, setFinancesSubmitting] = useState(false)
  const [sponsorshipSubmitting, setSponsorshipSubmitting] = useState(false)
  const toast = useToast()
  const [selectedSponsorshipId, setSelectedSponsorshipId] = useState(null)
  const [sponsorshipPayments, setSponsorshipPayments] = useState([])

  /* ── Messaging state ── */
  const [msgConversations, setMsgConversations] = useState([])
  const [msgActiveConv, setMsgActiveConv] = useState(null)
  const [msgMessages, setMsgMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgNewConv, setMsgNewConv] = useState(false)
  const [msgChatUsers, setMsgChatUsers] = useState([])
  const [msgUserSearch, setMsgUserSearch] = useState('')
  const [msgSending, setMsgSending] = useState(false)
  const messagesEndRef = useRef(null)
  useEffect(() => {
    if (activeKey === 'communication') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [msgMessages, activeKey])

  /* ── Live stats state ── */
  const [liveStats, setLiveStats] = useState(null)
  const [liveCharts, setLiveCharts] = useState(null)

  /* ── Navigation state preservation ── */
  const savedSubKeys = useRef({})
  const prevSection = useRef('')
  useLayoutEffect(() => {
    const currKey = `${activeKey}_${role || ''}`
    if (prevSection.current) {
      savedSubKeys.current[prevSection.current] = subKey
    }
    prevSection.current = currKey
    if (currKey in savedSubKeys.current) {
      const saved = savedSubKeys.current[currKey]
      if (saved !== undefined && saved !== null) {
        setSubKey(saved)
      }
    } else {
      setSubKey(null)
    }
  }, [activeKey, role])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    if (activeKey === 'validationLocale' && role === 'ambassador') {
      setAmbLoading(true)
      fetch(`${API}/assignments/by-orphanage/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setAmbAssignments(d))
        .catch(() => {})
        .finally(() => setAmbLoading(false))
    }
    if (activeKey === 'multiOrphelinats' && role === 'ambassador') {
      setAmbLoading(true)
      fetch(`${API}/assignments/by-orphanage/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setAmbAssignments(d))
        .catch(() => {})
        .finally(() => setAmbLoading(false))
    }
    if (activeKey === 'ambassadeurs' && (role === 'federation' || role === 'supermaster')) {
      setFedLoadingData(true)
      Promise.all([
        fetch(`${API}/enfants/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/assignments/`, { headers: { Authorization: `Bearer ${token}` } })
      ])
        .then(async ([cRes, aRes]) => {
          if (cRes.ok) setFedAllChildren(await cRes.json())
          if (aRes.ok) setFedAllAssignments(await aRes.json())
        })
        .catch(() => {})
        .finally(() => setFedLoadingData(false))
    }
    if (activeKey === 'orphelinats' && role === 'federation' && subKey) {
      setOrpSelChildren([])
      setOrpAssignAmb('')
      setLoadingOrpDetails(true)
      Promise.all([
        fetch(`${API}/enfants/?orphanage_id=${subKey}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/assignments/`, { headers: { Authorization: `Bearer ${token}` } })
      ])
        .then(async ([cRes, aRes]) => {
          const children = cRes.ok ? await cRes.json() : []
          if (cRes.ok) setOrphanageChildren(children)
          if (aRes.ok) {
            const allAssignments = await aRes.json()
            const childIds = new Set(children.map(c => c.id))
            setOrphanageAssignments(allAssignments.filter(a => childIds.has(a.child)))
          }
        })
        .catch(() => {})
        .finally(() => setLoadingOrpDetails(false))
    }
    if (activeKey === 'ambassadeurs' && orphanageName && user.role === 'director') {
      const myOrp = orphanageRequests.find(o => String(o.director) === String(user.id))
      if (myOrp) {
        setDirAmbLoading(true)
        fetch(`${API}/assignments/?orphanage_id=${myOrp.id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : [])
          .then(d => setDirAmbAssignments(d))
          .catch(() => {})
          .finally(() => setDirAmbLoading(false))
      }
    }
    /* ── Load donations ── */
    if (activeKey === 'dons') {
      setDonationsLoading(true)
      fetch(`${API}/dons/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.status === 401) { onLogout(); return [] } return r.json() })
        .then(data => { setDonations(Array.isArray(data) ? data : []); setDonationsLoading(false) })
        .catch(() => setDonationsLoading(false))
    }
    /* ── Load finances ── */
    if (activeKey === 'finances') {
      const token = localStorage.getItem('access_token')
      setFinancesLoading(true)
      Promise.all([
        fetch(`${API}/revenus/`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => { if (r.status === 401) { onLogout(); return [] } return r.ok ? r.json() : [] }),
        fetch(`${API}/depenses/`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => { if (r.status === 401) { onLogout(); return [] } return r.ok ? r.json() : [] }),
      ]).then(([rev, dep]) => {
        setIncomes(Array.isArray(rev) ? rev : [])
        setExpenses(Array.isArray(dep) ? dep : [])
        setFinancesLoading(false)
      }).catch(() => setFinancesLoading(false))
    }
    /* ── Load parrainages ── */
    if (activeKey === 'parrainages') {
      const token = localStorage.getItem('access_token')
      setParrainagesLoading(true)
      const isSponsorRole = ['sponsor', 'partner'].includes(role)
      const promises = isSponsorRole
        ? [
            fetch(`${API}/parrainages/enfants-disponibles/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (r.status === 401) { onLogout(); return [] } return r.ok ? r.json() : [] }),
            fetch(`${API}/parrainages/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (r.status === 401) { onLogout(); return [] } return r.ok ? r.json() : [] }),
          ]
        : [
            Promise.resolve([]),
            fetch(`${API}/parrainages/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (r.status === 401) { onLogout(); return [] } return r.ok ? r.json() : [] }),
          ]
      Promise.all(promises).then(([available, mine]) => {
        setSponsorableChildren(Array.isArray(available) ? available : [])
        setMySponsored(Array.isArray(mine) ? mine : [])
        setParrainagesLoading(false)
      }).catch(() => setParrainagesLoading(false))
    }
    /* ── Messaging: load conversations + chat-users + set up polling ── */
    if (activeKey === 'communication') {
      const msgToken = localStorage.getItem('access_token')
      setMsgLoading(true)
      const refreshConvs = () => {
        fetch(`${API}/conversations/`, { headers: { Authorization: `Bearer ${msgToken}` } })
          .then(r => { if (r.status === 401) { onLogout(); return [] } return r.ok ? r.json() : [] })
          .then(d => { setMsgConversations(Array.isArray(d) ? d : []); setMsgLoading(false) })
          .catch(() => setMsgLoading(false))
      }
      refreshConvs()
      fetch(`${API}/users/chat-list/`, { headers: { Authorization: `Bearer ${msgToken}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setMsgChatUsers(Array.isArray(d) ? d : []))
        .catch(() => {})
      const pollId = setInterval(refreshConvs, 4000)
      return () => clearInterval(pollId)
    }
    /* ── Load document types for Federation validation (orphanage docs loaded in separate effect) ── */
    if (activeKey === 'validationLocale' && role === 'federation') {
      fetch(`${API}/document-types/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setFedDocTypes(d))
        .catch(() => {})
    }
    /* ── Load document types + submitted docs for Director documents ── */
    if (activeKey === 'documents' && role === 'director') {
      fetch(`${API}/document-types/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setDocTypes(d))
        .catch(() => {})
      const myDocOrp = orphanageRequests.find(o => String(o.director) === String(user.id))
      if (myDocOrp) {
        setDocLoading(true)
        fetch(`${API}/orphanages/${myDocOrp.id}/documents/`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : [])
          .then(d => setSubmittedDocs(d))
          .catch(() => {})
          .finally(() => setDocLoading(false))
      }
    }
    /* ── Fetch live dashboard stats ── */
    if (activeKey === 'dashboard' || activeKey === 'rapports') {
      fetch(`${API}/auth/stats/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.status === 401) { onLogout(); return null } return r.ok ? r.json() : null })
        .then(d => { if (d) { setLiveStats(d.kpis); setLiveCharts(d.charts) } })
        .catch(() => {})
    }
  }, [activeKey, role, subKey, orphanageName])

  /* ── Dedicated document data loader + polling (avoids race with main effect) ── */
  useEffect(() => {
    if (activeKey !== 'documents' || role !== 'director') return
    const loadDocs = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const fetchWithAuth = async (url) => {
        let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (res.status === 401) {
          const refresh = localStorage.getItem('refresh_token')
          if (refresh) {
            const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
            if (refRes.ok) {
              const tokens = await refRes.json()
              localStorage.setItem('access_token', tokens.access)
              res = await fetch(url, { headers: { Authorization: `Bearer ${tokens.access}` } })
            }
          }
        }
        return res
      }
      fetchWithAuth(`${API}/document-types/`).then(r => r.ok ? r.json() : []).then(d => setDocTypes(d)).catch(() => {})
      const reqs = orpReqRef.current
      const myOrp = reqs.find(o => String(o.director) === String(user.id))
      if (myOrp) {
        setDocLoading(true)
        fetchWithAuth(`${API}/orphanages/${myOrp.id}/documents/`).then(r => r.ok ? r.json() : []).then(d => setSubmittedDocs(d)).catch(() => {}).finally(() => setDocLoading(false))
      }
    }
    loadDocs()
    const poll = setInterval(loadDocs, 15000)
    return () => { clearInterval(poll) }
  }, [activeKey, role])

  useEffect(() => {
    if (subKey !== 'Scolarité') return
    const e = editingChild?.extra_data?.education
    if (e) {
      if (e.subjects) setSubjects(e.subjects)
      if (e.behaviorEntries) setBehaviorEntries(e.behaviorEntries)
      if (e.activityEntries) setActivityEntries(e.activityEntries)
    } else {
      setSubjects(DEFAULT_SUBJECTS.map(s => ({...s})))
      setBehaviorEntries([])
      setActivityEntries([])
    }
  }, [subKey, editingChild])

  useEffect(() => {
    if (subKey !== 'Santé & médical') return
    const m = editingChild?.extra_data?.medical
    if (m) {
      if (m.vaccinations) setVaccinations(m.vaccinations)
      if (m.allergies) setAllergies(m.allergies)
      if (m.treatments) setTreatments(m.treatments)
    } else {
      setVaccinations(DEFAULT_VAX.map(v => ({...v})))
      setAllergies([])
      setTreatments([])
    }
  }, [subKey, editingChild])

  useEffect(() => {
    const timer = setInterval(() => setDashTime(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const uid = e.detail.uid
      const child = registeredChildren.find(c => c.uid === uid)
      if (child) {
        setSelectedRegChild(child)
        setActiveKey('enfants-enregistres')
        setSubKey(null)
        setEditingChild(null)
      }
    }
    window.addEventListener('cdo-navigate-child', handler)
    return () => window.removeEventListener('cdo-navigate-child', handler)
  }, [registeredChildren])
  const sidebarRef = useRef(null)
  const [sidebarWidth, setSidebarWidth] = useState(() => parseInt(localStorage.getItem('cdo_sidebar_width')) || 220)
  const isResizing = useRef(false)
  const liveWidth = useRef(sidebarWidth)

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isResizing.current) return
      const newWidth = Math.max(160, Math.min(400, e.clientX))
      liveWidth.current = newWidth
      setSidebarWidth(newWidth)
    }
    const onMouseUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      localStorage.setItem('cdo_sidebar_width', liveWidth.current)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const { t, lang, setLang } = useTranslation()
  const UC_CATEGORIES = [
    { key:'health', icon:'💉', label:t('uc_category_health')||'Santé', desc:t('uc_category_desc_health')||'Vaccinations, maladies, examens', color:'#22c55e', types:[
      { key:'vaccination', icon:'💉', label:'Vaccination', fields:[{key:'vaccine_name',label:'Nom du vaccin',type:'text',required:true},{key:'dose',label:'Dose',type:'select',options:['1ère dose','2ème dose','3ème dose','Rappel','Booster']},{key:'date_admin',label:'Date d\'administration',type:'date',required:true},{key:'next_dose',label:'Prochaine dose',type:'date'},{key:'admin_by',label:'Administré par',type:'text'},{key:'location',label:'Lieu',type:'text'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'illness', icon:'🤒', label:'Maladie', fields:[{key:'diagnosis',label:'Diagnostic',type:'text',required:true},{key:'date_diag',label:'Date du diagnostic',type:'date',required:true},{key:'severity',label:'Sévérité',type:'select',options:['Léger','Modéré','Grave','Critique']},{key:'symptoms',label:'Symptômes',type:'textarea'},{key:'treatment',label:'Traitement prescrit',type:'textarea'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'treatment', icon:'💊', label:'Traitement', fields:[{key:'medication',label:'Médicament',type:'text',required:true},{key:'dosage',label:'Posologie',type:'text',required:true},{key:'frequency',label:'Fréquence',type:'select',options:['1x/jour','2x/jour','3x/jour','1x/semaine','Selon besoin']},{key:'start_date',label:'Date de début',type:'date',required:true},{key:'end_date',label:'Date de fin',type:'date'},{key:'prescribed_by',label:'Prescrit par',type:'text'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'consultation', icon:'🩺', label:'Consultation', fields:[{key:'doctor',label:'Médecin',type:'text',required:true},{key:'specialty',label:'Spécialité',type:'select',options:['Généraliste','Pédiatre','Psychologue','Nutritionniste','Dentiste','Ophtalmologue','Autre']},{key:'date_consult',label:'Date',type:'date',required:true},{key:'reason',label:'Motif',type:'textarea',required:true},{key:'diagnosis',label:'Diagnostic',type:'textarea'},{key:'prescriptions',label:'Prescriptions',type:'textarea'},{key:'follow_up',label:'Suivi nécessaire',type:'select',options:['Oui','Non']}] },
      { key:'hospitalization', icon:'🏥', label:'Hospitalisation', fields:[{key:'hospital',label:'Hôpital',type:'text',required:true},{key:'admit_date',label:'Date d\'admission',type:'date',required:true},{key:'discharge_date',label:'Date de sortie',type:'date'},{key:'reason',label:'Motif',type:'textarea',required:true},{key:'ward',label:'Service',type:'text'},{key:'doctor',label:'Médecin traitant',type:'text'},{key:'outcome',label:'Issue',type:'select',options:['Rétabli','En cours','Référé','Décédé']},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'allergy', icon:'🤧', label:'Allergie', fields:[{key:'allergen',label:'Allergène',type:'text',required:true},{key:'reaction',label:'Réaction',type:'select',options:['Légère','Modérée','Grave','Anaphylaxie']},{key:'date_detected',label:'Date de détection',type:'date'},{key:'severity',label:'Sévérité',type:'select',options:['Faible','Moyenne','Haute','Critique']},{key:'treatment',label:'Traitement',type:'textarea'},{key:'notes',label:'Notes',type:'textarea'}] },
    ]},
    { key:'education', icon:'📚', label:t('uc_category_education')||'Éducation', desc:t('uc_category_desc_education')||'Inscription, notes, examens', color:'#3b82f6', types:[
      { key:'school_enrollment', icon:'🏫', label:'Inscription scolaire', fields:[{key:'school_name',label:'Nom de l\'école',type:'text',required:true},{key:'school_type',label:'Type',type:'select',options:['Maternelle','Primaire','Secondaire','Lycée','Université','Formation pro']},{key:'class',label:'Classe/Niveau',type:'text',required:true},{key:'academic_year',label:'Année scolaire',type:'text',required:true},{key:'start_date',label:'Date de début',type:'date',required:true},{key:'school_address',label:'Adresse',type:'text'},{key:'contact',label:'Contact école',type:'text'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'school_transfer', icon:'🔄', label:'Transfert scolaire', fields:[{key:'from_school',label:'École d\'origine',type:'text',required:true},{key:'to_school',label:'Nouvelle école',type:'text',required:true},{key:'reason',label:'Motif du transfert',type:'select',options:['Déménagement','Familial','Disciplinaire','Scolaire','Autre']},{key:'date_transfer',label:'Date',type:'date',required:true},{key:'class',label:'Classe',type:'text'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'grade_update', icon:'📊', label:'Notes/Classe', fields:[{key:'subject',label:'Matière',type:'text',required:true},{key:'grade',label:'Note /20',type:'number',required:true},{key:'coefficient',label:'Coefficient',type:'number'},{key:'term',label:'Trimestre',type:'select',options:['1er Trimestre','2ème Trimestre','3ème Trimestre']},{key:'academic_year',label:'Année scolaire',type:'text'},{key:'appreciation',label:'Appréciation',type:'textarea'}] },
      { key:'exam_result', icon:'📝', label:'Résultat examen', fields:[{key:'exam_name',label:'Nom de l\'examen',type:'text',required:true},{key:'subject',label:'Matière',type:'text'},{key:'score',label:'Note',type:'number',required:true},{key:'max_score',label:'Note maximale',type:'number'},{key:'date_exam',label:'Date',type:'date'},{key:'result',label:'Résultat',type:'select',options:['Réussi','Échoué','En attente']},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'attendance_update', icon:'📋', label:'Présence', fields:[{key:'period',label:'Période',type:'text',required:true},{key:'days_present',label:'Jours présents',type:'number',required:true},{key:'days_absent',label:'Jours absents',type:'number'},{key:'days_total',label:'Total jours',type:'number'},{key:'absent_reason',label:'Motif absences',type:'textarea'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'academic_note', icon:'📌', label:'Note pédagogique', fields:[{key:'teacher',label:'Enseignant',type:'text'},{key:'subject',label:'Matière',type:'text'},{key:'observation',label:'Observation',type:'textarea',required:true},{key:'recommendation',label:'Recommandation',type:'textarea'},{key:'date',label:'Date',type:'date'}] },
    ]},
    { key:'family', icon:'👨‍👩‍👧‍👦', label:t('uc_category_family')||'Famille', desc:t('uc_category_desc_family')||'Tuteurs, parents, réunification', color:'#a855f7', types:[
      { key:'guardian_assignment', icon:'👤', label:'Attribution tuteur', fields:[{key:'guardian_name',label:'Nom du tuteur',type:'text',required:true},{key:'relation',label:'Lien de parenté',type:'select',options:['Père','Mère','Grand-parent','Oncle/Tante','Frère/Soeur','Famille d\'accueil','Institution']},{key:'phone',label:'Téléphone',type:'text'},{key:'address',label:'Adresse',type:'text'},{key:'date_assigned',label:'Date d\'attribution',type:'date'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'parent_identification', icon:'🔍', label:'Identification parent', fields:[{key:'parent_name',label:'Nom du parent',type:'text',required:true},{key:'parent_type',label:'Type',type:'select',options:['Père','Mère','Père biologique','Mère biologique']},{key:'status',label:'Statut',type:'select',options:['Identifié','Contacté','En recherche']},{key:'last_known',label:'Dernière adresse connue',type:'text'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'family_reunification', icon:'🤗', label:'Réunification', fields:[{key:'status',label:'Statut',type:'select',options:['En cours','Planifiée','Réalisée','Échouée']},{key:'date_planned',label:'Date prévue',type:'date'},{key:'date_completed',label:'Date réalisée',type:'date'},{key:'family_member',label:'Membre concerné',type:'text'},{key:'support_needed',label:'Soutien nécessaire',type:'textarea'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'foster_care', icon:'🏡', label:'Placement familial', fields:[{key:'foster_family',label:'Famille d\'accueil',type:'text',required:true},{key:'address',label:'Adresse',type:'text'},{key:'start_date',label:'Date de début',type:'date',required:true},{key:'duration',label:'Durée prévue',type:'select',options:['Court terme','Long terme','Permanent']},{key:'social_worker',label:'Travailleur social',type:'text'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'adoption_progress', icon:'📋', label:'Adoption', fields:[{key:'stage',label:'Étape',type:'select',options:['Pré-adoption','En cours','Finalisation','Finalisée']},{key:'agency',label:'Agence',type:'text'},{key:'adoptive_parents',label:'Parents adoptifs',type:'text'},{key:'date_started',label:'Date de début',type:'date'},{key:'expected_date',label:'Date prévue',type:'date'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'family_visit', icon:'👋', label:'Visite familiale', fields:[{key:'visitor',label:'Visiteur',type:'text',required:true},{key:'relation',label:'Lien',type:'text'},{key:'date_visit',label:'Date',type:'date',required:true},{key:'duration',label:'Durée',type:'select',options:['1-2h','Demi-journée','Journée','Week-end','Plusieurs jours']},{key:'observations',label:'Observations',type:'textarea'}] },
    ]},
    { key:'documents', icon:'📄', label:t('uc_category_documents')||'Documents', desc:t('uc_category_desc_documents')||'Ajout, remplacement, vérification', color:'#f59e0b', types:[
      { key:'new_document', icon:'📄', label:'Nouveau document', fields:[{key:'doc_type',label:'Type de document',type:'select',options:['Acte de naissance','CNI','Passeport','Photo','Rapport médical','Bulletin scolaire','Document judiciaire','Autre'],required:true},{key:'doc_number',label:'Numéro',type:'text'},{key:'issued_by',label:'Délivré par',type:'text'},{key:'issue_date',label:'Date de délivrance',type:'date'},{key:'expiry_date',label:'Date d\'expiration',type:'date'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'document_replacement', icon:'🔄', label:'Remplacement', fields:[{key:'doc_type',label:'Type',type:'select',options:['Acte de naissance','CNI','Passeport','Photo','Rapport médical','Bulletin scolaire','Autre'],required:true},{key:'reason_replace',label:'Motif',type:'select',options:['Perte','Vol','Détérioration','Expiration','Mise à jour']},{key:'old_number',label:'Ancien numéro',type:'text'},{key:'new_number',label:'Nouveau numéro',type:'text'},{key:'date_replaced',label:'Date',type:'date'},{key:'notes',label:'Notes',type:'textarea'}] },
      { key:'document_verification', icon:'✅', label:'Vérification', fields:[{key:'doc_type',label:'Type',type:'select',options:['Acte de naissance','CNI','Passeport','Rapport médical','Bulletin scolaire','Document judiciaire','Autre'],required:true},{key:'verified_by',label:'Vérifié par',type:'text',required:true},{key:'verification_date',label:'Date',type:'date'},{key:'status',label:'Statut',type:'select',options:['Vérifié','En attente','Non conforme']},{key:'comments',label:'Commentaires',type:'textarea'}] },
    ]},
    { key:'social', icon:'🤝', label:t('uc_category_social')||'Social', desc:t('uc_category_desc_social')||'Suivi social, visites, rapports', color:'#ef4444', types:[
      { key:'social_worker_note', icon:'📝', label:'Note sociale', fields:[{key:'worker',label:'Intervenant',type:'text',required:true},{key:'date_intervention',label:'Date',type:'date',required:true},{key:'type',label:'Type',type:'select',options:['Visite','Entretien','Appel','Réunion','Suivi']},{key:'content',label:'Contenu',type:'textarea',required:true},{key:'recommendations',label:'Recommandations',type:'textarea'}] },
      { key:'home_visit', icon:'🏠', label:'Visite domicile', fields:[{key:'address_visited',label:'Adresse visitée',type:'text',required:true},{key:'date_visit',label:'Date',type:'date',required:true},{key:'living_conditions',label:'Conditions de vie',type:'select',options:['Bonnes','Moyennes','Précaires','Critiques']},{key:'observations',label:'Observations',type:'textarea',required:true},{key:'recommendations',label:'Recommandations',type:'textarea'}] },
      { key:'counseling', icon:'💬', label:'Counseling', fields:[{key:'counselor',label:'Conseiller',type:'text',required:true},{key:'date_session',label:'Date',type:'date',required:true},{key:'type',label:'Type',type:'select',options:['Individuel','Groupe','Familial','Crise']},{key:'theme',label:'Thème',type:'select',options:['Scolaire','Familial','Émotionnel','Comportemental','Orientation','Traumatisme','Autre']},{key:'notes',label:'Notes',type:'textarea',required:true},{key:'outcome',label:'Résultat',type:'textarea'}] },
      { key:'observation', icon:'👁️', label:'Observation', fields:[{key:'observer',label:'Observateur',type:'text',required:true},{key:'date_obs',label:'Date',type:'date',required:true},{key:'domain',label:'Domaine',type:'select',options:['Comportement','Santé','Éducation','Social','Émotionnel']},{key:'description',label:'Description',type:'textarea',required:true},{key:'concerns',label:'Préoccupations',type:'textarea'},{key:'actions',label:'Actions',type:'textarea'}] },
      { key:'incident', icon:'⚠️', label:'Incident', fields:[{key:'incident_type',label:"Type d'incident",type:'select',options:['Violence','Accident','Fuite','Conflit','Vol','Abus','Négligence','Autre'],required:true},{key:'date_incident',label:'Date',type:'date',required:true},{key:'location',label:'Lieu',type:'text'},{key:'description',label:'Description',type:'textarea',required:true},{key:'people_involved',label:'Personnes impliquées',type:'textarea'},{key:'actions_taken',label:'Actions prises',type:'textarea'},{key:'follow_up',label:'Suivi',type:'textarea'}] },
      { key:'protection', icon:'🛡️', label:'Protection', fields:[{key:'concern_type',label:'Type',type:'select',options:['Risque de maltraitance','Exploitation','Discrimination','Mariage forcé','Travail enfant','Autre'],required:true},{key:'severity',label:'Gravité',type:'select',options:['Faible','Moyenne','Haute','Urgente']},{key:'date_reported',label:'Date signalement',type:'date',required:true},{key:'reported_by',label:'Signalé par',type:'text'},{key:'description',label:'Description',type:'textarea',required:true},{key:'measures',label:'Mesures prises',type:'textarea'}] },
    ]},
  ]
  const [theme, setTheme] = useState(localStorage.getItem('cdo_theme') || 'dark')
  const [orphanageRequests, setOrphanageRequests] = useState([])
  /* ── Load federation document data when orphanages are ready ── */
  useEffect(() => {
    if (activeKey !== 'validationLocale' || role !== 'federation') return
    if (orphanageRequests.length === 0) return
    const token = localStorage.getItem('access_token')
    if (!token) return
    fetch(`${API}/document-types/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setFedDocTypes(d))
      .catch(() => {})
    orphanageRequests.forEach(o => {
      fetch(`${API}/orphanages/${o.id}/documents/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setFedOrpDocuments(p => ({ ...p, [o.id]: d })))
        .catch(() => {})
    })
  }, [activeKey, role, orphanageRequests])
  const [orphanageForm, setOrphanageForm] = useState({
    name: localStorage.getItem('cdo_orphanage_name') || '',
    registration_number: '',
    orphanage_type: '',
    date_established: '',
    country: '',
    province: '',
    city: '',
    address: '',
    gps_lat: '',
    gps_lng: '',
    director_name: '',
    director_position: '',
    director_phone: '',
    director_whatsapp: '',
    director_email: '',
    emergency_contact: '',
    capacity: '',
    current_children: '',
    boys: '',
    girls: '',
    children_disabled: '',
    infants_0_5: '',
    children_6_12: '',
    teenagers_13_18: '',
    staff_permanent: '',
    staff_volunteers: '',
    staff_caregivers: '',
    staff_teachers: '',
    document_details: '',
    needs: [],
    needs_priority: 'medium',
    needs_description: '',
    donor_visible: true,
  })
  const [orphanageLoading, setOrphanageLoading] = useState(false)
  const [orphanageNote, setOrphanageNote] = useState('')
  const [orpWizStep, setOrpWizStep] = useState(0)
  const [orpFiles, setOrpFiles] = useState({ registration_cert: null, operating_license: null, director_id: null, tax_doc: null, child_protection: null, annual_report: null, ngo_accreditation: null, partnership_certs: null })
  const [selDocKey, setSelDocKey] = useState('')
  const [orpDraftSaved, setOrpDraftSaved] = useState(false)
  const [bgTheme, setBgTheme] = useState(localStorage.getItem('cdo_bg') || '')
  const [gpsLoading, setGpsLoading] = useState(false)
  /* ── Document management (director + federation) ── */
  const [docTypes, setDocTypes] = useState([])
  const [submittedDocs, setSubmittedDocs] = useState([])
  const [docLoading, setDocLoading] = useState(false)
  const [selDocTypeId, setSelDocTypeId] = useState('')
  const [docFile, setDocFile] = useState(null)
  const [docUploading, setDocUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [docResetKey, setDocResetKey] = useState(0)
  const [openModifDoc, setOpenModifDoc] = useState(null)
  const [modifHistory, setModifHistory] = useState([])
  const modifNotifTimers = useRef({})
  const docFileRef = useRef(null)
  const docLoadKey = useRef('')
  const orpReqRef = useRef(orphanageRequests)
  orpReqRef.current = orphanageRequests
  const autoSaveRef = useRef(null)
  useEffect(() => { if(autoSaveRef.current) clearTimeout(autoSaveRef.current); autoSaveRef.current = setTimeout(() => { try { localStorage.setItem('cdo_orp_draft', JSON.stringify(orphanageForm)); } catch(e){} }, 3000); return () => clearTimeout(autoSaveRef.current); }, [orphanageForm])
  useEffect(() => { try { const d = localStorage.getItem('cdo_orp_draft'); const s = localStorage.getItem('cdo_orp_step'); if(d) setOrphanageForm(prev => ({...prev, ...JSON.parse(d)})); if(s) setOrpWizStep(Number(s)); } catch(e){} }, [])

  const [ambassadorsList, setAmbassadorsList] = useState([])
  const [assigningId, setAssigningId] = useState(null)

  const fetchAmbassadors = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    try {
      const res = await fetch(`${API}/auth/users/?role=ambassador`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAmbassadorsList(Array.isArray(data) ? data : [])
      }
    } catch {}
  }

  const handleAssignAmbassador = async (orphanageId, ambassadorId) => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    setOrphanageLoading(true)
    try {
      const res = await fetch(`${API}/orphanages/${orphanageId}/assign-ambassador/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ambassador_id: ambassadorId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur d'assignation")
      showToast("Ambassadeur assigné avec succès.", 'success')
      setAssigningId(null)
      loadOrphanages()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setOrphanageLoading(false)
    }
  }

  const orpFileHandler = (key) => (e) => { const file = e.target.files?.[0]; if (file) setOrpFiles(p => ({ ...p, [key]: file })); }
  const orpDragHandler = (key) => ({ onDragOver: e => e.preventDefault(), onDrop: e => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) setOrpFiles(p => ({ ...p, [key]: file })); } })
  const directorOrpRec = () => orphanageRequests.find(o => String(o.director) === String(user.id))

  useEffect(() => {
    if ((activeKey === 'orphelinats' || activeKey === 'validationLocale') && role === 'federation') {
      loadOrphanages()
      fetchAmbassadors()
    }
    if (activeKey === 'ambassadeurs' && (role === 'federation' || role === 'supermaster')) {
      loadOrphanages()
      fetchAmbassadors()
    }
  }, [activeKey, role])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cdo_theme', theme)
  }, [theme])

  useEffect(() => {
    if (bgTheme) {
      document.documentElement.setAttribute('data-bg', bgTheme)
    } else {
      document.documentElement.removeAttribute('data-bg')
    }
    localStorage.setItem('cdo_bg', bgTheme)
  }, [bgTheme])

  useEffect(() => {
    const fetchChildren = async () => {
      let token = localStorage.getItem('access_token')
      if (!token) return
      try {
        const res = await fetch(`${API}/enfants/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setRegisteredChildren(data)
        }
      } catch (err) {
        console.error('Failed to fetch children:', err)
      }
    }
    fetchChildren()
  }, [activeKey])

  const deleteChild = async (child) => {
    let token = localStorage.getItem('access_token')
    if (!token) return
    try {
      const res = await fetch(`${API}/enfants/${child.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setRegisteredChildren(prev => prev.filter(c => c.id !== child.id))
        setSelectedRegChild(null)
      }
    } catch (err) {
      console.error('Failed to delete child:', err)
    }
    setDeleteConfirm(null)
  }

  useEffect(() => {
    if (editingChild) {
      uidRef.current = editingChild.uid
    } else {
      const existing = new Set(registeredChildren.map(c => c.uid))
      uidRef.current = genChildUid(existing)
    }
  }, [subKey, registeredChildren, editingChild])

  const getFieldValue = (label) => {
    if (!editingChild) return ''
    if (label === 'Numéro unique') return editingChild.uid || ''
    if (label === 'Nom') return editingChild.nom || ''
    if (label === 'Prénom') return editingChild.prenom || ''
    if (label === 'Sexe') return editingChild.sexe === 'M' ? 'Masculin' : editingChild.sexe === 'F' ? 'Féminin' : ''
    if (label === 'Date de naissance') return editingChild.date_naissance || ''
    if (label === 'Nationalité') return editingChild.nationalite || ''
    if (label === "Adresse d'origine") return editingChild.adresse || ''
    return editingChild.extra_data?.[label] || editingChild[label] || ''
  }
  const [profVersion, setProfVersion] = useState(0)
  const updateProfCompletion = () => setProfVersion(v => v + 1)

  const navItems = ROLE_NAV[role] || ROLE_NAV.director
  const pages = ROLE_PAGES[role] || ROLE_PAGES.director
  const statCards = ROLE_STATS[role] || ROLE_STATS.director
  const roleLabel = ROLES.find(r => r.value === role)?.label || role

  const page = pages[activeKey]
  const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '')
  const hue = user.first_name ? user.first_name.charCodeAt(0) * 37 % 360 : 200
  const avatarSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><rect width="56" height="56" rx="12" fill="hsl(${hue},50%,35%)"/><text x="28" y="28" dominant-baseline="central" text-anchor="middle" fill="white" font-size="22" font-weight="700" font-family="system-ui">${initials}</text></svg>`)}`

  const CHILD_FORMS = {
    'Profil & identité': {
      title: 'Profil & identité',
      fields: [
        { label: 'Numéro unique', type: 'uid' },
        { label: 'Nom', type: 'text' },
        { label: 'Prénom', type: 'text' },
        { label: 'Sexe', type: 'select', options: ['Masculin', 'Féminin'] },
        { label: 'Date de naissance', type: 'date' },
        { label: 'Nationalité', type: 'select', options: AFRICAN_COUNTRIES.map(c => c.name) },
        { label: 'Photo', type: 'file' },
        { label: "Adresse d'origine", type: 'text' },
      ]
    },
    'Situation familiale': {
      title: 'Situation familiale',
      fields: [
        { label: 'Parents connus', type: 'select', options: ['Oui', 'Non', 'Non renseigné'] },
        { label: 'Tuteurs', type: 'text' },
        { label: 'Fratrie', type: 'textarea' },
        { label: 'Historique familial', type: 'textarea' },
      ]
    },
    'Documents administratifs': {
      title: 'Documents administratifs',
      fields: [
        { label: 'Acte de naissance', type: 'file' },
        { label: "Documents d'identité", type: 'file' },
        { label: 'Décisions judiciaires', type: 'file' },
      ]
    },
    'Santé & médical': {
      title: 'Santé & médical',
      fields: [
        { label: 'Groupe sanguin', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
        { label: 'Taille (cm)', type: 'text' },
        { label: 'Poids (kg)', type: 'text' },
        { label: 'Tension artérielle', type: 'text' },
        { label: 'Fréquence cardiaque', type: 'text' },
        { label: 'Température (°C)', type: 'text' },
        { label: 'SpO2 (%)', type: 'text' },
        { label: 'Maladies chroniques', type: 'textarea' },
        { label: 'Chirurgies antérieures', type: 'textarea' },
        { label: 'Antécédents hospitalisation', type: 'textarea' },
        { label: 'Antécédents familiaux', type: 'textarea' },
        { label: 'Handicaps', type: 'textarea' },
        { label: 'Contact urgence', type: 'text' },
        { label: 'Médecin traitant', type: 'text' },
        { label: 'Hôpital', type: 'text' },
        { label: 'Assurance', type: 'text' },
      ]
    },
    'Scolarité': {
      title: 'Scolarité',
      fields: [
        { label: 'Établissement', type: 'text' },
        { label: "Type d'établissement", type: 'select', options: ['Public', 'Privé', 'Confessionnel'] },
        { label: 'Adresse école', type: 'text' },
        { label: 'Téléphone école', type: 'text' },
        { label: 'Email école', type: 'text' },
        { label: 'Directeur', type: 'text' },
        { label: 'Professeur principal', type: 'text' },
        { label: 'Classe actuelle', type: 'text' },
        { label: 'Année scolaire', type: 'text' },
        { label: 'Trimestre', type: 'select', options: ['1er Trimestre', '2ème Trimestre', '3ème Trimestre'] },
        { label: "Niveau d'études", type: 'select', options: ['Préscolaire', 'Primaire', 'Secondaire', 'Lycée', 'Université', 'Formation Pro.'] },
        { label: "Date d'inscription", type: 'date' },
        { label: 'Matières inscrites', type: 'textarea' },
        { label: 'Moyenne générale', type: 'text' },
        { label: 'Rang', type: 'text' },
        { label: 'Points forts', type: 'textarea' },
        { label: 'Points à améliorer', type: 'textarea' },
        { label: 'Présences', type: 'text' },
        { label: 'Absences', type: 'text' },
        { label: "Difficultés d'apprentissage", type: 'textarea' },
        { label: 'Besoins spéciaux', type: 'textarea' },
        { label: 'Soutien scolaire', type: 'textarea' },
        { label: "Bourse d'études", type: 'text' },
        { label: 'Bulletins', type: 'file' },
        { label: 'Certificats', type: 'file' },
      ]
    },
  }

  const PROJECT_TYPES = [
    { value: 'enfant', label: t('proj_type_enfant') || "Pour enfant", icon: '\u{1F476}' },
    { value: 'orphelinat', label: t('proj_type_orphelinat') || "Pour l'orphelinat", icon: '\u{1F3E5}' },
    { value: 'federation', label: t('proj_type_federation') || 'Pour la fédération', icon: '\u{1F465}' },
  ]

  const MOCK_PROJECTS = [
    { id: 1, code: 'XK7M9B2R', type: 'enfant', title: 'Scolarisation 2026', summary: 'Prise en charge scolaire de 50 enfants', description: 'Projet de scolarisation complète incluant fournitures, uniformes et cantine scolaire pour 50 enfants de l\'orphelinat.', pdf_url: '', status: 'open', amount: 15000, raised: 8500, beneficiaries: 50, created_at: '2026-01-15' },
    { id: 2, code: 'HT4N8P1W', type: 'enfant', title: 'Soins médicaux', summary: 'Campagne de vaccination et soins de base', description: 'Programme de vaccination et consultations médicales pour 120 enfants.', pdf_url: '', status: 'open', amount: 8000, raised: 3000, beneficiaries: 120, created_at: '2026-02-01' },
    { id: 3, code: 'JF6L2ZK5', type: 'orphelinat', title: 'Rénovation du bâtiment', summary: 'Réfection des dortoirs et salles de classe', description: 'Travaux de rénovation complète des dortoirs, installation électrique et peinture.', pdf_url: '', status: 'open', amount: 45000, raised: 20000, beneficiaries: 0, created_at: '2026-03-10' },
    { id: 4, code: 'PQ9A3WM8', type: 'orphelinat', title: 'Installation solaire', summary: 'Panneaux solaires pour l\'autonomie énergétique', description: 'Installation de panneaux solaires pour couvrir 80% des besoins énergétiques de l\'orphelinat.', pdf_url: '', status: 'funded', amount: 25000, raised: 25000, beneficiaries: 0, created_at: '2026-04-05' },
    { id: 5, code: 'VC2R7LG4', type: 'federation', title: 'Formation des éducateurs', summary: 'Programme de formation pour 30 éducateurs', description: 'Formation professionnelle des éducateurs des orphelinats membres de la fédération.', pdf_url: '', status: 'open', amount: 30000, raised: 12000, beneficiaries: 30, created_at: '2026-05-20' },
    { id: 6, code: 'BD5Y1TF9', type: 'federation', title: 'Plateforme numérique', summary: 'Déploiement de la plateforme CDO dans 10 orphelinats', description: 'Déploiement et formation à la plateforme de gestion dans les orphelinats membres.', pdf_url: '', status: 'open', amount: 60000, raised: 15000, beneficiaries: 0, created_at: '2026-06-01' },
  ]

  const [projects, setProjects] = useState([])
  const [ongoingProjects, setOngoingProjects] = useState([])
  const [projectTypeFilter, setProjectTypeFilter] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectLoading, setProjectLoading] = useState(false)
  const [showOngoing, setShowOngoing] = useState(false)
  const [showExpired, setShowExpired] = useState(false)

  const genProjectCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  useEffect(() => {
    if (activeKey !== 'projets' && activeKey !== 'dashboard') return
    if (projects.length > 0) return
    setProjectLoading(true)
    const token = localStorage.getItem('access_token')
    fetch(`${API}/projets/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = Array.isArray(data) ? data : data?.results || MOCK_PROJECTS
        setProjects(list)
        setOngoingProjects(list)
        setProjectLoading(false)
      })
      .catch(() => { setProjects(MOCK_PROJECTS); setOngoingProjects(MOCK_PROJECTS); setProjectLoading(false) })
  }, [activeKey])

  const loadOrphanages = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    setOrphanageLoading(true)
    try {
      const res = await fetch(`${API}/orphanages/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setOrphanageRequests(Array.isArray(data) ? data : [])
    } catch {
      setOrphanageRequests([])
    } finally {
      setOrphanageLoading(false)
    }
  }

  useEffect(() => {
    if (!['validationLocale', 'orphelinats', 'parametres', 'ambassadeurs', 'documents'].includes(activeKey)) return
    loadOrphanages()
  }, [activeKey])

  const submitOrphanage = async () => {
    if (!orphanageForm.name.trim()) { showToast("Nom de l'orphelinat requis.", 'error'); return }
    const token = localStorage.getItem('access_token')
    setOrphanageLoading(true)
    try {
      const fd = new FormData()
      Object.entries(orphanageForm).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, typeof v === 'object' ? JSON.stringify(v) : v)
      })
      fd.set('capacity', String(Number(orphanageForm.capacity || 0)))
      Object.entries(orpFiles).forEach(([k, file]) => {
        if (file) fd.append(k, file)
      })
      const res = await fetch(`${API}/orphanages/`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Envoi impossible")
      localStorage.setItem('cdo_orphanage_name', data.name)
      setOrphanageName(data.name)
      showToast("Dossier envoye a la federation pour validation.")
      loadOrphanages()
    } catch (err) {
      showToast(err.message || "Erreur pendant l'envoi du dossier.", 'error')
    } finally {
      setOrphanageLoading(false)
    }
  }

  const validateOrphanage = async (id, action, note) => {
    const token = localStorage.getItem('access_token')
    setOrphanageLoading(true)
    try {
      const res = await fetch(`${API}/orphanages/${id}/validate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action, validation_note: note ?? orphanageNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Validation impossible')
      const msgs = { approve:'Orphelinat validé par la fédération.', reject:'Dossier rejeté.' }
      showToast(msgs[action] || 'Action effectuée.', 'success')
      setOrphanageNote('')
      loadOrphanages()
    } catch (err) {
      showToast(err.message || 'Erreur de validation.', 'error')
    } finally {
      setOrphanageLoading(false)
    }
  }

  return (
    <div className="dash">
      <div className="dash-layout" style={{ gridTemplateColumns: `${sidebarWidth}px 4px 1fr` }}>
        <aside className="dash-sidebar" ref={sidebarRef}>
          <div className="dash-sidebar-divider" />
          <span className="dash-sidebar-section-label">{t('sidebar_nav')}</span>

          <div className="dash-sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`dash-nav-btn${item.key === activeKey ? ' active' : ''}`}
                onClick={() => { if (item.key === activeKey) savedSubKeys.current[`${activeKey}_${role || ''}`] = undefined; setActiveKey(item.key); setSubKey(null); setEditingChild(null); }}
              >
                <span className="dash-nav-label" style={{ paddingLeft: '8px' }}>{t('nav_' + item.key.replace(/-/g, '_')) || item.label}</span>
                {item.key === activeKey && <span className="dash-nav-ind" />}
              </button>
            ))}
          </div>

          <div className="dash-sidebar-bot">
            <button className="dash-nav-btn" onClick={onLogout}>
              <span className="dash-nav-label" style={{ paddingLeft: '8px' }}>{t('sidebar_logout')}</span>
            </button>
          </div>
        </aside>

        <div className="dash-resize-handle" onMouseDown={() => {
          isResizing.current = true
          document.body.style.cursor = 'col-resize'
          document.body.style.userSelect = 'none'
        }} />

        {toast && (
          <div className={`dash-toast dash-toast-${toast.type}`} onClick={() => setToast(null)}>
            <span className="dash-toast-icon">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : toast.type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span className="dash-toast-msg">{toast.message}</span>
          </div>
        )}
        <main className="dash-main">
          {activeKey === 'dashboard' ? (
            <div className="dash-dashboard">
              <div className="dash-dash-welcome">
                <div className="dash-dash-welcome-left">
                  <h1 className="dash-dash-greeting">{t('dash_greeting') || 'Bonjour'}, {user.first_name || 'Administrateur'} <span className="dash-dash-wave">{'\u{1F44B}'}</span></h1>
                  <div className="dash-dash-welcome-meta">
                    <span className="dash-dash-meta-item">{dashTime.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</span>
                    <span className="dash-dash-meta-divider">·</span>
                    <span className="dash-dash-meta-item dash-dash-clock">{dashTime.toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', { hour:'2-digit', minute:'2-digit' })}</span>
                    <span className="dash-dash-meta-divider">·</span>
                    <span className="dash-dash-meta-item dash-dash-org-name">{orphanageName || (t('dash_org_name') || 'Fédération des Orphelinats')}</span>
                  </div>
                </div>
                <div className="dash-dash-welcome-right">
                  <div className="dash-dash-role-badge">
                    <span className="dash-dash-role-dot" style={{ background: role === 'director' ? '#f59e0b' : role === 'federation' ? '#a855f7' : role === 'partner' ? '#22c55e' : role === 'ambassador' ? '#3b82f6' : '#06b6d4' }} />
                    <span>{t('role_' + role) || roleLabel}</span>
                  </div>
                </div>
              </div>

              <div className="dash-dash-kpi-row">
                {statCards.map((card, i) => {
                  const kpiIcons = ['\u{1F476}', '\u{1F465}', '\u{1F4C1}', '\u{1F4E8}', '\u{1F4CB}']
                  const kpiTrends = ['+12%', '+8%', '+23%', '-2%', '+15%']
                  const trendColors = ['#22c55e', '#22c55e', '#22c55e', '#ef4444', '#22c55e']
                  const barColors = ['#f59e0b', '#a855f7', '#3b82f6', '#ef4444', '#22c55e']
                  const displayValue = liveStats ? (liveStats[i]?.value ?? card.value) : card.value
                  const displayLabel = liveStats ? (liveStats[i]?.label ?? card.label) : card.label
                  const displaySub = liveStats ? (liveStats[i]?.sub ?? card.sub) : card.sub
                  return (
                    <div key={i} className="dash-dash-kpi">
                      <div className="dash-dash-kpi-icon" style={{ background: `rgba(${i === 3 ? '239,68,68' : i === 1 ? '168,85,247' : i === 2 ? '59,130,246' : i === 4 ? '34,197,94' : '245,158,11'},0.1)` }}>{kpiIcons[i % kpiIcons.length]}</div>
                      <div className="dash-dash-kpi-body">
                        <span className="dash-dash-kpi-label">{t('stat_' + role + '_' + i + '_label') || displayLabel}</span>
                        <span className="dash-dash-kpi-value">{displayValue}</span>
                      </div>
                      <div className="dash-dash-kpi-trend">
                        <span className="dash-dash-kpi-trend-pct" style={{ color: trendColors[i % trendColors.length] }}>{kpiTrends[i % kpiTrends.length]}</span>
                        <div className="dash-dash-kpi-trend-bar">
                          {INTEGRITY_BARS.slice(i * 2, i * 2 + 3).map((bar, bi) => (
                            <div key={bi} className="dash-dash-kpi-bar" style={{ height: bar.height + '%', background: barColors[i % barColors.length], opacity: 0.4 + bi * 0.2 }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="dash-dash-actions-row">
                {[
                  { icon: '\u{2795}', label: t('dash_add_child') || 'Ajouter un enfant', key: 'enfants', color: '#f59e0b' },
                  { icon: '\u{2795}', label: t('dash_new_project') || 'Nouveau projet', key: 'projets', color: '#3b82f6' },
                  { icon: '\u{2795}', label: t('dash_new_doc') || 'Nouveau document', key: 'documents', color: '#a855f7' },
                  { icon: '\u{2795}', label: t('dash_new_request') || 'Nouvelle demande', key: 'demandes', color: '#22c55e' },
                ].map((action, i) => (
                  <button key={i} className="dash-dash-action-btn" style={{ '--action-color': action.color }} onClick={() => { setActiveKey(action.key); setSubKey(null); setEditingChild(null); }}>
                    <span className="dash-dash-action-icon">{action.icon}</span>
                    <span className="dash-dash-action-label">{action.label}</span>
                  </button>
                ))}
              </div>

              <div className="dash-dash-grid">
                <div className="dash-dash-grid-left">
                  <div className="dash-dash-card dash-dash-recent">
                    <div className="dash-dash-card-header">
                      <span className="dash-dash-card-title">{t('dash_recent_activities') || 'Activités récentes'}</span>
                      <span className="dash-dash-card-badge">{RECENT_ACTIVITIES.length}</span>
                    </div>
                    <div className="dash-dash-card-body">
                      {RECENT_ACTIVITIES.map((act, i) => (
                        <div key={i} className="dash-dash-activity-item">
                          <div className="dash-dash-activity-dot" style={{ background: i === 0 ? '#22c55e' : i === 1 ? '#3b82f6' : '#f59e0b' }} />
                          <div className="dash-dash-activity-content">
                            <span className="dash-dash-activity-text">{act.text}</span>
                            <span className="dash-dash-activity-time">{act.time}</span>
                          </div>
                        </div>
                      ))}
                      {RECENT_ACTIVITIES.length === 0 && (
                        <div className="dash-dash-empty">{t('dash_no_activities') || 'Aucune activité récente'}</div>
                      )}
                    </div>
                  </div>
                  <div className="dash-dash-card dash-dash-upcoming">
                    <div className="dash-dash-card-header">
                      <span className="dash-dash-card-title">{t('dash_upcoming_projects') || 'Projets à venir'}</span>
                      <span className="dash-dash-card-badge">{(ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS).length}</span>
                    </div>
                    <div className="dash-dash-card-body">
                      {(ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS).slice(0, 4).map((proj, i) => (
                        <div key={i} className="dash-dash-project-item" onClick={() => { const _exp = proj.end_date && proj.end_date < new Date().toISOString().split('T')[0]; setActiveKey('projets'); setProjectTypeFilter(null); setSelectedProject(proj); _exp ? (setShowOngoing(false), setShowExpired(true)) : (setShowOngoing(true), setShowExpired(false)); }}>
                          <div className="dash-dash-project-top">
                            <span className="dash-dash-project-name">{proj.title}</span>
                            <span className={`dash-dash-project-status ${proj.status}`}>{proj.status === 'open' ? (t('proj_open') || 'Ouvert') : proj.status === 'funded' ? (t('proj_funded') || 'Financé') : (t('proj_completed') || 'Terminé')}</span>
                          </div>
                          <div className="dash-dash-project-meta">
                            <span className="dash-dash-project-deadline">{t('dash_ends') || 'Fin'}: {proj.end_date || proj.created_at || '—'}</span>
                          </div>
                          <div className="dash-dash-project-bar">
                            <div className="dash-dash-project-bar-fill" style={{ width: proj.amount > 0 ? Math.min(100, Math.round(proj.raised / proj.amount * 100)) + '%' : '0%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="dash-dash-grid-right">
                  <div className="dash-dash-card dash-dash-notifs">
                    <div className="dash-dash-card-header">
                      <span className="dash-dash-card-title">{t('dash_notifications') || 'Notifications'}</span>
                      <span className="dash-dash-card-badge dash-dash-card-badge-alert">3</span>
                    </div>
                    <div className="dash-dash-card-body">
                      {[
                        { text: t('dash_notif_critical') || 'Demandes critiques en attente', type: 'critical' },
                        { text: t('dash_notif_approvals') || 'Approbations en attente', type: 'warning' },
                        { text: t('dash_notif_messages') || 'Nouveaux messages reçus', type: 'info' },
                      ].map((notif, i) => (
                        <div key={i} className={`dash-dash-notif-item dash-dash-notif-${notif.type}`}>
                          <div className="dash-dash-notif-icon">
                            {notif.type === 'critical' ? '\u{26A0}\u{FE0F}' : notif.type === 'warning' ? '\u{23F3}' : '\u{1F4E8}'}
                          </div>
                          <span className="dash-dash-notif-text">{notif.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="dash-dash-modules">
                <div className="dash-dash-modules-header">
                  <span className="dash-dash-card-title">{t('dash_modules') || 'Modules'}</span>
                </div>
                <div className="dash-dash-modules-grid">
                  {navItems.filter(n => n.key !== 'dashboard' && n.key !== 'parametres').map((item, i) => {
                    const moduleIcons = ['\u{1F476}', '\u{1F4C1}', '\u{1F4CB}', '\u{1F465}', '\u{1F4E8}', '\u{1F4AC}']
                    const moduleDescs = [
                      t('dash_mod_enfants') || 'Gestion complète des enfants',
                      t('dash_mod_documents') || 'Archivage numérique des documents',
                      t('dash_mod_projets') || 'Suivi des projets et financements',
                      t('dash_mod_ambassadeurs') || 'Gestion des ambassadeurs',
                      t('dash_mod_demandes') || 'Gestion des demandes',
                      t('dash_mod_comm') || 'Messages et annonces',
                    ]
                    const moduleCounts = [registeredChildren.length || statCards[0]?.value || 0, '86', (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS).length + ' actifs', statCards[2]?.value || 12, statCards[3]?.value || 5, '']
                    const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4']
                    return (
                      <button key={item.key} className="dash-dash-module-card" style={{ '--mod-color': colors[i % colors.length] }} onClick={() => { setActiveKey(item.key); setSubKey(null); setEditingChild(null); }}>
                        <div className="dash-dash-module-icon" style={{ background: `rgba(${i === 0 ? '245,158,11' : i === 1 ? '59,130,246' : i === 2 ? '34,197,94' : i === 3 ? '168,85,247' : i === 4 ? '239,68,68' : '6,182,212'},0.1)` }}>{moduleIcons[i % moduleIcons.length]}</div>
                        <div className="dash-dash-module-info">
                          <span className="dash-dash-module-name">{t('nav_' + item.key.replace(/-/g, '_')) || item.label}</span>
                          <span className="dash-dash-module-desc">{moduleDescs[i % moduleDescs.length]}</span>
                        </div>
                        <div className="dash-dash-module-meta">
                          {moduleCounts[i % moduleCounts.length] && <span className="dash-dash-module-count">{moduleCounts[i % moduleCounts.length]}</span>}
                          <span className="dash-dash-module-arrow">{'\u{2192}'}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="dash-dash-footer">
                <span className="dash-dash-footer-text">{t('dash_footer') || 'Fédération des Orphelinats'} v2.4.1</span>
              </div>
            </div>
          ) : (
            <div className="dash-content-grid" style={{ paddingTop: '24px' }}>
              <div className="dash-content-left">
                <div className="dash-section-header">
                  <span className="dash-section-title">{t('page_' + role + '_' + activeKey.replace(/-/g, '_') + '_title') || page?.title || activeKey}</span>
                </div>

                {subKey && (
                  <div style={{ paddingTop: '32px' }} />
                )}

                {activeKey === 'validationLocale' && role === 'ambassador' ? (() => {
                  return (
                    <div className="dash-sub-form">
                      <div className="dash-validation-head">
                        <p className="dash-page-subtitle">Enfants qui vous sont assignés par la fédération.</p>
                        <button className="dash-form-save" disabled={ambLoading}>Actualiser</button>
                      </div>
                      {ambLoading && <div className="dash-dash-empty">Chargement...</div>}
                      {!ambLoading && Object.keys(ambAssignments).length === 0 && (
                        <div className="dash-dash-empty">Aucun enfant assigné pour le moment.</div>
                      )}
                      {Object.entries(ambAssignments).map(([orpName, children]) => (
                        <div key={orpName} style={{marginBottom:20}}>
                          <h3 style={{fontSize:16,fontWeight:700,color:'#f59e0b',margin:'0 0 10px',display:'flex',alignItems:'center',gap:8}}>
                            🏛️ {orpName}
                          </h3>
                          <div style={{display:'flex',flexDirection:'column',gap:8}}>
                            {children.map(a => (
                              <div key={a.id} style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#2563eb)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>
                                  {(a.child_name||'?')[0]?.toUpperCase()}
                                </div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0'}}>{a.child_name}</div>
                                  <div style={{fontSize:12,color:'#64748b'}}>UID: {a.child_uid} • Assigné le {new Date(a.assigned_at).toLocaleDateString('fr-FR')}</div>
                                </div>
                                {a.note && <div style={{fontSize:11,color:'#94a3b8',maxWidth:200}}>📝 {a.note}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()
                : activeKey === 'validationLocale' && role === 'federation' ? (() => {
                  const token = localStorage.getItem('access_token')
                  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

                  const loadFedDocTypes = () => {
                    fetch(`${API}/document-types/`, { headers: authHeaders })
                      .then(r => r.ok ? r.json() : [])
                      .then(d => setFedDocTypes(d))
                      .catch(() => {})
                  }
                  const loadOrpDocuments = (orpId) => {
                    if (!orpId) return
                    fetch(`${API}/orphanages/${orpId}/documents/`, { headers: authHeaders })
                      .then(r => r.ok ? r.json() : [])
                      .then(d => setFedOrpDocuments(p => ({ ...p, [orpId]: d })))
                      .catch(() => {})
                  }
                  const reviewDocument = async (orpId, docId, action) => {
                    const feedback = fedDocFeedback[`${orpId}_${docId}`] || ''
                    const points_to_update = fedDocPoints[`${orpId}_${docId}`] || ''
                    setFedDocReviewLoading(true)
                    try {
                      const headers = { 'Content-Type': 'application/json', ...authHeaders }
                      const body = JSON.stringify({ action, feedback, points_to_update })
                      let res = await fetch(`${API}/orphanages/${orpId}/documents/${docId}/review/`, {
                        method: 'POST', headers, body,
                      })
                      if (res.status === 401) {
                        const refresh = localStorage.getItem('refresh_token')
                        if (refresh) {
                          const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                          if (refRes.ok) {
                            const tokens = await refRes.json()
                            localStorage.setItem('access_token', tokens.access)
                            headers.Authorization = `Bearer ${tokens.access}`
                            res = await fetch(`${API}/orphanages/${orpId}/documents/${docId}/review/`, {
                              method: 'POST', headers, body,
                            })
                          }
                        }
                      }
                      if (!res.ok) throw new Error('Review failed')
                      const labels = { accept:'Accepté', request_changes:'Modifications demandées', reject:'Refusé' }
                      showToast(`Document ${labels[action] || action} avec succès.`, 'success')
                      setFedDocFeedback(p => ({ ...p, [`${orpId}_${docId}`]: '' }))
                      setFedDocPoints(p => ({ ...p, [`${orpId}_${docId}`]: '' }))
                      loadOrpDocuments(orpId)
                    } catch (e) {
                      showToast("Erreur lors de la révision.", 'error')
                    } finally {
                      setFedDocReviewLoading(false)
                    }
                  }

                  const addDocType = async () => {
                    if (!fedDocTypeKey.trim() || !fedDocTypeName.trim()) { showToast('Clé et libellé requis.', 'error'); return }
                    setFedSavingDocType(true)
                    try {
                      const res = await fetch(`${API}/document-types/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ key: fedDocTypeKey.trim(), label: fedDocTypeName.trim(), required: fedDocTypeRequired, order: fedDocTypes.length + 1 }),
                      })
                      if (!res.ok) throw new Error('Failed')
                      showToast('Type de document ajouté.', 'success')
                      setFedDocTypeKey(''); setFedDocTypeName(''); setFedDocTypeRequired(true)
                      loadFedDocTypes()
                    } catch (e) {
                      showToast("Erreur lors de l'ajout.", 'error')
                    } finally {
                      setFedSavingDocType(false)
                    }
                  }
                  const deleteDocType = (id) => {
                    setDocConfirmModal({
                      title: 'Supprimer ce type de document\u00A0?',
                      message: 'Cette action est irréversible. Les documents de ce type ne seront plus accessibles.',
                      confirmLabel: 'Supprimer',
                      onConfirm: async () => {
                        setDocConfirmModal(null)
                        try {
                          const res = await fetch(`${API}/document-types/${id}/`, { method: 'DELETE', headers: authHeaders })
                          if (!res.ok) throw new Error('Failed')
                          showToast('Type de document supprimé.', 'success')
                          loadFedDocTypes()
                        } catch (e) {
                          showToast('Erreur lors de la suppression.', 'error')
                        }
                      }
                    })
                  }
                  const toggleDocTypeRequired = async (dt) => {
                    try {
                      const res = await fetch(`${API}/document-types/${dt.id}/`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ required: !dt.required }),
                      })
                      if (!res.ok) throw new Error('Failed')
                      loadFedDocTypes()
                    } catch (e) {
                      showToast('Erreur lors de la mise à jour.', 'error')
                    }
                  }

                  const STATUS_BADGES_FED = {
                    pending: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                    accepted: { label: 'Accepté', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
                    changes_requested: { label: 'Modifications demandées', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                    rejected: { label: 'Refusé', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                  }

                  return (
                  <div className="dash-sub-form">
                    {/* ── Tabs: Dossiers / Types de documents ── */}
                    <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                      {['dossiers','types'].map(tab => (
                        <button key={tab} onClick={() => setFedDocTab(tab)} style={{padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',background:'none',border:'none',color:fedDocTab===tab?'#f59e0b':'#64748b',borderBottom:`2px solid ${fedDocTab===tab?'#f59e0b':'transparent'}`,transition:'all .15s ease'}}>
                          {tab === 'dossiers' ? '📋 Dossiers des orphelinats' : '⚙️ Types de documents'}
                        </button>
                      ))}
                    </div>

                    {fedDocTab === 'dossiers' ? (
                      /* ── PER-DOCUMENT REVIEW ── */
                      <div>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                          <p className="dash-page-subtitle" style={{margin:0}}>Documents soumis par les orphelinats — validez ou demandez des modifications.</p>
                           <button className="dash-form-save" onClick={() => { loadOrphanages() }} disabled={orphanageLoading}>Actualiser</button>
                        </div>
                        {orphanageLoading && <div className="dash-dash-empty">Chargement...</div>}
                        {!orphanageLoading && orphanageRequests.length === 0 && <div className="dash-dash-empty">Aucun orphelinat enregistré.</div>}
                        {orphanageRequests.map(orp => {
                          const docs = fedOrpDocuments[orp.id] || []
                          return (
                            <div key={orp.id} style={{marginBottom:20,background:'rgba(30,41,59,0.5)',borderRadius:14,border:'1px solid rgba(255,255,255,0.06)',padding:'18px 20px'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                                <div>
                                  <h3 style={{fontSize:15,fontWeight:700,color:'#e2e8f0',margin:0}}>{orp.name}</h3>
                                  <span style={{fontSize:11,color:'#64748b'}}>Directeur: {orp.director_name || 'Non renseigné'}</span>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <span style={{fontSize:11,color:'#64748b'}}>{docs.filter(d => d.status === 'accepted').length}/{fedDocTypes.length} documents validés</span>
                                  <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:12,background:orp.status==='pending'?'rgba(245,158,11,0.12)':orp.status==='approved'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)',color:orp.status==='pending'?'#f59e0b':orp.status==='approved'?'#22c55e':'#ef4444'}}>
                                    {orp.status === 'pending' ? 'En attente' : orp.status === 'approved' ? 'Validé' : 'Rejeté'}
                                  </span>
                                </div>
                              </div>
                              {docs.length === 0 && <div style={{fontSize:12,color:'#64748b',padding:'8px 0'}}>Aucun document soumis.</div>}
                              {docs.map(doc => {
                                const sb = STATUS_BADGES_FED[doc.status] || STATUS_BADGES_FED.pending
                                return (
                                  <div key={doc.id} style={{padding:'10px 12px',marginBottom:8,background:'rgba(255,255,255,0.02)',borderRadius:10,border:'1px solid rgba(255,255,255,0.04)'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                                      <div style={{flex:1,minWidth:120}}>
                                        <div style={{fontSize:12,fontWeight:600,color:'#e2e8f0'}}>{doc.document_type_name}</div>
                                        <div style={{fontSize:10,color:'#64748b'}}>{new Date(doc.uploaded_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                                      </div>
                                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:sb.bg,color:sb.color}}>{sb.label}</span>
                                      <a href={doc.file} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'#60a5fa',textDecoration:'underline'}}>📖 Voir</a>
                                      {doc.status === 'pending' && (
                                        <div style={{display:'flex',gap:6,alignItems:'flex-start',flexWrap:'wrap',marginTop:4,width:'100%',flexDirection:'column'}}>
                                          <input className="dash-form-input" value={fedDocFeedback[`${orp.id}_${doc.id}`] || ''} onChange={e => setFedDocFeedback(p => ({...p,[`${orp.id}_${doc.id}`]: e.target.value}))} placeholder="Retour (optionnel)" style={{width:'100%',fontSize:11}} />
                                          <textarea className="dash-form-input" value={fedDocPoints[`${orp.id}_${doc.id}`] || ''} onChange={e => setFedDocPoints(p => ({...p,[`${orp.id}_${doc.id}`]: e.target.value}))} placeholder="Points à corriger (un par ligne)" rows={2} style={{width:'100%',fontSize:11,resize:'vertical',minHeight:36}} />
                                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                            <button className="dash-form-save" onClick={() => reviewDocument(orp.id, doc.id, 'accept')} disabled={fedDocReviewLoading} style={{fontSize:11,padding:'5px 12px'}}>✅ Accepter</button>
                                            <button className="dash-form-save" onClick={() => reviewDocument(orp.id, doc.id, 'request_changes')} disabled={fedDocReviewLoading} style={{fontSize:11,padding:'5px 12px',background:'rgba(245,158,11,0.15)',color:'#f59e0b'}}>🔄 Modifications</button>
                                            <button className="dash-orp-save-btn" onClick={() => reviewDocument(orp.id, doc.id, 'reject')} disabled={fedDocReviewLoading} style={{fontSize:11,padding:'5px 12px'}}>❌ Refuser</button>
                                          </div>
                                        </div>
                                      )}
                                      {(doc.status === 'changes_requested' || doc.status === 'rejected') && (doc.feedback || doc.points_to_update) && (
                                        <div style={{width:'100%',marginTop:4,padding:'6px 10px',background:'rgba(239,68,68,0.06)',borderRadius:6,fontSize:11,color:'#ef4444',border:'1px solid rgba(239,68,68,0.12)'}}>
                                          {doc.feedback && <><strong>Retour:</strong> {doc.feedback}</>}
                                          {doc.points_to_update && (
                                            <><br /><strong>Points à corriger:</strong><br />{doc.points_to_update.split('\n').map((p,i) => <div key={i}>• {p}</div>)}</>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      /* ── DOCUMENT TYPE MANAGEMENT ── */
                      <div>
                        <div style={{marginBottom:20,padding:'18px 20px',background:'rgba(30,41,59,0.5)',borderRadius:14,border:'1px solid rgba(255,255,255,0.06)'}}>
                          <h4 style={{fontSize:14,fontWeight:600,color:'#e2e8f0',margin:'0 0 14px 0'}}>Ajouter un type de document</h4>
                          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>
                            <div><label style={{fontSize:10,color:'#94a3b8',display:'block',marginBottom:2}}>Clé (slug)</label><input className="dash-form-input" value={fedDocTypeKey} onChange={e => setFedDocTypeKey(e.target.value)} placeholder="ex: audit_report" style={{fontSize:12,width:150}} /></div>
                            <div><label style={{fontSize:10,color:'#94a3b8',display:'block',marginBottom:2}}>Libellé</label><input className="dash-form-input" value={fedDocTypeName} onChange={e => setFedDocTypeName(e.target.value)} placeholder="ex: Rapport d'audit" style={{fontSize:12,width:200}} /></div>
                            <div style={{display:'flex',alignItems:'center',gap:6,paddingBottom:4}}>
                              <input type="checkbox" id="fed-req" checked={fedDocTypeRequired} onChange={e => setFedDocTypeRequired(e.target.checked)} style={{accentColor:'#f59e0b'}} />
                              <label htmlFor="fed-req" style={{fontSize:11,color:'#94a3b8',cursor:'pointer'}}>REQUIS</label>
                            </div>
                            <button className="dash-form-save" onClick={addDocType} disabled={fedSavingDocType} style={{fontSize:12,padding:'8px 16px'}}>{fedSavingDocType ? '...' : '➕ Ajouter'}</button>
                          </div>
                        </div>
                        <div>
                          <h4 style={{fontSize:14,fontWeight:600,color:'#e2e8f0',margin:'0 0 12px 0'}}>Types de documents ({fedDocTypes.length})</h4>
                          {fedDocTypes.map(dt => (
                            <div key={dt.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',marginBottom:6,background:'rgba(30,41,59,0.3)',borderRadius:10,border:'1px solid rgba(255,255,255,0.04)'}}>
                              <div style={{flex:1}}>
                                <span style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{dt.label}</span>
                                <span style={{fontSize:10,color:'#64748b',marginLeft:8}}>({dt.key})</span>
                              </div>
                              <button onClick={() => toggleDocTypeRequired(dt)} style={{fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:8,background:dt.required?'rgba(239,68,68,0.1)':'rgba(100,116,139,0.1)',border:'none',color:dt.required?'#ef4444':'#94a3b8',cursor:'pointer'}}>
                                {dt.required ? 'REQUIS' : 'Optionnel'}
                              </button>
                              <span style={{fontSize:10,color:'#475569'}}>Ordre: {dt.order}</span>
                              <button onClick={() => deleteDocType(dt.id)} style={{background:'rgba(239,68,68,0.1)',border:'none',borderRadius:8,color:'#ef4444',fontSize:11,padding:'4px 10px',cursor:'pointer'}}>🗑</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  )
                })()
                : activeKey === 'orphelinats' && role === 'director' ? (() => {
                  const ORP_STEPS = ['General Information','Management','Capacity & Statistics','Documents','Needs Assessment','Verification'];
                  const ORP_STEP_ICONS = ['🏛️','👤','📊','📄','🆘','✅'];
                  const ORP_NEEDS_OPTIONS = ['Food','Clean Water','Clothing','School Supplies','Medicine','Beds','Electricity','Internet','Infrastructure','Transportation','Sponsorship Programs'];
                  const ORP_NEEDS_ICONS = ['🍚','💧','👕','📚','💊','🛏️','⚡','🌐','🏗️','🚌','🤝'];
                  const ORP_TYPES = ['Government','Private','Religious','NGO','Community'];
                  const ORP_COUNTRIES = ['Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroun','Cap-Vert','Centrafrique','Comores','Congo-Brazzaville','RD Congo','Côte d\'Ivoire','Djibouti','Egypte','Guinée Équ.','Érythrée','Eswatini','Éthiopie','Gabon','Gambie','Ghana','Guinée','Guinée-Bissau','Kenya','Lesotho','Libéria','Libye','Madagascar','Malawi','Mali','Mauritanie','Maurice','Maroc','Mozambique','Namibie','Niger','Nigeria','Rwanda','Sao Tomé','Sénégal','Seychelles','Sierra Leone','Somalie','Afrique du Sud','Soudan du Sud','Soudan','Tanzanie','Togo','Tunisie','Ouganda','Zambie','Zimbabwe'];
                  const orpUpd = (k, v) => setOrphanageForm(f => ({ ...f, [k]: v }));
                  const orpToggleNeed = (n) => setOrphanageForm(f => ({ ...f, needs: f.needs.includes(n) ? f.needs.filter(x => x !== n) : [...f.needs, n] }));
                  const filledFields = [orphanageForm.name, orphanageForm.registration_number, orphanageForm.orphanage_type, orphanageForm.country, orphanageForm.director_name, orphanageForm.director_phone, orphanageForm.director_email, orphanageForm.capacity].filter(Boolean).length;
                  const profileCompletion = Math.round((filledFields / 8) * 100);
                  const docCount = Object.values(orpFiles).filter(Boolean).length;
                  const docCompletion = Math.round((docCount / 5) * 100);
                  const saveDraft = () => { try { localStorage.setItem('cdo_orp_draft', JSON.stringify(orphanageForm)); localStorage.setItem('cdo_orp_step', String(orpWizStep)); setOrpDraftSaved(true); showToast('Draft saved successfully.'); setTimeout(() => setOrpDraftSaved(false), 2000); } catch(e) {} };
                  const directorOrp = directorOrpRec()
                  const ORP_STATUS_BTN = { pending:{bg:'#ef4444',label:'🔴 En attente de validation par la fédération'}, approved:{bg:'#22c55e',label:'🟢 Validé par la fédération'}, rejected:{bg:'#ef4444',label:'❌ Rejeté'} }
                  return (
                  <div style={{padding:'0 8px'}}>
                    {/* ── TRUST SCORE CARDS ── */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:24}}>
                      {[{label:'Verification',val:'Pending',icon:'🛡️',color:'#f59e0b'},{label:'Profile',val:profileCompletion+'%',icon:'👤',color:'#3b82f6'},{label:'Documents',val:docCompletion+'%',icon:'📄',color:'#22c55e'},{label:'Transparency',val:orphanageForm.donor_visible?'Public':'Private',icon:'👁️',color:'#a855f7'}].map((c,i) => (
                        <div key={i} style={{background:'rgba(30,41,59,0.7)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'18px 16px',display:'flex',alignItems:'center',gap:14}}>
                          <div style={{width:48,height:48,borderRadius:12,background:`${c.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{c.icon}</div>
                          <div><div style={{fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>{c.label}</div><div style={{fontSize:18,fontWeight:700,color:'#e2e8f0'}}>{c.val}</div></div>
                        </div>
                      ))}
                    </div>

                    {/* ── PROGRESS STEPPER ── */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:28,overflowX:'auto',padding:'4px 0'}}>
                      {ORP_STEPS.map((s,i) => (
                        <React.Fragment key={i}>
                          <div onClick={() => setOrpWizStep(i)} style={{display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer',minWidth:80,opacity:orpWizStep===i?1:0.55,transition:'all .3s ease'}}>
                            <div style={{width:38,height:38,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,background:orpWizStep>i?'#22c55e':orpWizStep===i?'linear-gradient(135deg,#f59e0b,#f97316)':'rgba(255,255,255,0.06)',color:orpWizStep>=i?'#fff':'#64748b',border:orpWizStep===i?'2px solid #f59e0b':'2px solid transparent',transition:'all .3s ease',boxShadow:orpWizStep===i?'0 0 20px rgba(245,158,11,0.3)':'none'}}>{orpWizStep>i?'✓':ORP_STEP_ICONS[i]}</div>
                            <span style={{fontSize:10,marginTop:6,color:orpWizStep===i?'#f59e0b':'#64748b',fontWeight:orpWizStep===i?700:500,textAlign:'center',maxWidth:80}}>{s}</span>
                          </div>
                          {i<ORP_STEPS.length-1 && <div style={{flex:1,height:2,background:orpWizStep>i?'#22c55e':'rgba(255,255,255,0.08)',margin:'0 4px',marginBottom:18,minWidth:16,transition:'background .3s ease'}} />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* ── FORM CARD ── */}
                    <div style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:20,padding:'28px 24px',marginBottom:20}}>

                    {/* ══ STEP 0: GENERAL INFORMATION ══ */}
                    {orpWizStep === 0 && <>
                      <h3 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>🏛️ Orphanage Information</h3>
                      <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>Provide the general details about your orphanage.</p>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Orphanage Name <span style={{color:'#ef4444'}}>*</span></label><input className="dash-form-input" value={orphanageForm.name} onChange={e=>orpUpd('name',e.target.value)} placeholder="Enter orphanage name" /></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Legal Registration Number <span style={{color:'#ef4444'}}>*</span></label><div style={{display:'flex',gap:8}}><input className="dash-form-input" style={{flex:1}} value={orphanageForm.registration_number} onChange={e=>orpUpd('registration_number',e.target.value)} placeholder="e.g. ORG-2024-001" /><button type="button" onClick={()=>{const g=()=>{let r='';for(let i=0;i<6;i++)r+='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)];return r};let c=g();const e=new Set([...(orphanageRequests||[]).map(o=>o.registration_number).filter(Boolean),...Object.values(orphanageForm).filter(v=>typeof v==='string')]);while(e.has(c))c=g();orpUpd('registration_number',c)}} style={{background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:12,color:'#f59e0b',fontSize:12,fontWeight:700,padding:'8px 14px',cursor:'pointer',whiteSpace:'nowrap'}}>🎲 Générer</button></div></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Orphanage Type <span style={{color:'#ef4444'}}>*</span></label><select className="dash-form-input" value={orphanageForm.orphanage_type} onChange={e=>orpUpd('orphanage_type',e.target.value)} style={{cursor:'pointer'}}><option value="">Select type...</option>{ORP_TYPES.map(t2=>(<option key={t2} value={t2}>{t2}</option>))}</select></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Date of Establishment</label><input type="date" className="dash-form-input" value={orphanageForm.date_established} onChange={e=>orpUpd('date_established',e.target.value)} /></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Country <span style={{color:'#ef4444'}}>*</span></label><select className="dash-form-input" value={orphanageForm.country} onChange={e=>orpUpd('country',e.target.value)} style={{cursor:'pointer'}}><option value="">Select country...</option>{ORP_COUNTRIES.map(c=>(<option key={c} value={c}>{c}</option>))}</select></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Province / State</label><input className="dash-form-input" value={orphanageForm.province} onChange={e=>orpUpd('province',e.target.value)} placeholder="Province" /></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>City</label><input className="dash-form-input" value={orphanageForm.city} onChange={e=>orpUpd('city',e.target.value)} placeholder="City" /></div>
                        <div style={{gridColumn:'1/-1'}}><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Full Address</label><input className="dash-form-input" value={orphanageForm.address} onChange={e=>orpUpd('address',e.target.value)} placeholder="Full street address" /></div>
                      </div>
                      <div style={{marginTop:20,padding:'16px',background:'rgba(59,130,246,0.06)',borderRadius:12,border:'1px solid rgba(59,130,246,0.15)'}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#3b82f6',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>📍 GPS Location
                          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>{gpsLoading&&<span style={{fontSize:11,color:'#3b82f6'}}>⏳ Recherche...</span>}<button type="button" onClick={()=>{if(gpsLoading)return;setGpsLoading(true);const t=setTimeout(()=>{setGpsLoading(false);showToast('Délai dépassé. Passage en géolocalisation IP...','info');fetch('https://ip-api.com/json/').then(r=>r.json()).then(d=>{if(d.status==='success'){orpUpd('gps_lat',String(d.lat));orpUpd('gps_lng',String(d.lon));showToast(`Position approx: ${d.city}, ${d.country}`,'success')}else showToast('Impossible de localiser. Entrez manuellement.','error')}).catch(()=>showToast('Impossible de localiser. Entrez manuellement.','error')).finally(()=>setGpsLoading(false))},8000);navigator.geolocation.getCurrentPosition(p=>{clearTimeout(t);setGpsLoading(false);orpUpd('gps_lat',String(p.coords.latitude.toFixed(4)));orpUpd('gps_lng',String(p.coords.longitude.toFixed(4)));showToast('Position GPS obtenue avec succès','success')},()=>{clearTimeout(t);fetch('https://ip-api.com/json/').then(r=>r.json()).then(d=>{if(d.status==='success'){orpUpd('gps_lat',String(d.lat));orpUpd('gps_lng',String(d.lon));showToast(`Position approx: ${d.city}, ${d.country}`,'success')}else showToast('Impossible de localiser. Entrez manuellement.','error')}).catch(()=>showToast('Impossible de localiser. Entrez manuellement.','error')).finally(()=>setGpsLoading(false))},{enableHighAccuracy:true,timeout:7000})}} style={{background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:12,color:gpsLoading?'#94a3b8':'#3b82f6',fontSize:11,fontWeight:700,padding:'6px 12px',cursor:gpsLoading?'not-allowed':'pointer',opacity:gpsLoading?0.6:1}}>{gpsLoading?'...':'📍 Obtenir ma position'}</button></div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                          <div><label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:4}}>Latitude</label><input className="dash-form-input" value={orphanageForm.gps_lat} onChange={e=>orpUpd('gps_lat',e.target.value)} placeholder="e.g. -4.3250" /></div>
                          <div><label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:4}}>Longitude</label><input className="dash-form-input" value={orphanageForm.gps_lng} onChange={e=>orpUpd('gps_lng',e.target.value)} placeholder="e.g. 15.3222" /></div>
                        </div>
                      </div>
                    </>}

                    {/* ══ STEP 1: MANAGEMENT ══ */}
                    {orpWizStep === 1 && <>
                      <h3 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>👤 Management & Contact Information</h3>
                      <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>Director and key contact details for verification.</p>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Director Full Name <span style={{color:'#ef4444'}}>*</span></label><input className="dash-form-input" value={orphanageForm.director_name} onChange={e=>orpUpd('director_name',e.target.value)} placeholder="Full name" /></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Position <span style={{color:'#ef4444'}}>*</span></label><input className="dash-form-input" value={orphanageForm.director_position} onChange={e=>orpUpd('director_position',e.target.value)} placeholder="e.g. Executive Director" /></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Phone Number <span style={{color:'#ef4444'}}>*</span></label><input type="tel" className="dash-form-input" value={orphanageForm.director_phone} onChange={e=>orpUpd('director_phone',e.target.value)} placeholder="+243 ..." /></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>WhatsApp Number</label><input type="tel" className="dash-form-input" value={orphanageForm.director_whatsapp} onChange={e=>orpUpd('director_whatsapp',e.target.value)} placeholder="+243 ..." /></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Email Address <span style={{color:'#ef4444'}}>*</span></label><input type="email" className="dash-form-input" value={orphanageForm.director_email} onChange={e=>orpUpd('director_email',e.target.value)} placeholder="director@email.com" /></div>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Emergency Contact</label><input className="dash-form-input" value={orphanageForm.emergency_contact} onChange={e=>orpUpd('emergency_contact',e.target.value)} placeholder="Emergency phone number" /></div>
                      </div>
                    </>}

                    {/* ══ STEP 2: CAPACITY & STATISTICS ══ */}
                    {orpWizStep === 2 && <>
                      <h3 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>📊 Population Statistics</h3>
                      <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>Detailed breakdown of children and staff.</p>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                        <div style={{background:'rgba(245,158,11,0.06)',borderRadius:14,padding:16,border:'1px solid rgba(245,158,11,0.15)'}}>
                          <label style={{fontSize:12,color:'#f59e0b',fontWeight:600,marginBottom:6,display:'block'}}>Maximum Capacity</label>
                          <input type="number" className="dash-form-input" value={orphanageForm.capacity} onChange={e=>orpUpd('capacity',e.target.value)} placeholder="0" style={{fontSize:22,fontWeight:700,textAlign:'center'}} />
                        </div>
                        <div style={{background:'rgba(59,130,246,0.06)',borderRadius:14,padding:16,border:'1px solid rgba(59,130,246,0.15)'}}>
                          <label style={{fontSize:12,color:'#3b82f6',fontWeight:600,marginBottom:6,display:'block'}}>Current Children</label>
                          <input type="number" className="dash-form-input" value={orphanageForm.current_children} onChange={e=>orpUpd('current_children',e.target.value)} placeholder="0" style={{fontSize:22,fontWeight:700,textAlign:'center'}} />
                        </div>
                      </div>
                      <div style={{fontSize:13,fontWeight:600,color:'#94a3b8',marginBottom:10}}>Children Breakdown</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}}>
                        {[{k:'boys',l:'Boys 👦',c:'#3b82f6'},{k:'girls',l:'Girls 👧',c:'#ec4899'},{k:'children_disabled',l:'With Disabilities ♿',c:'#a855f7'},{k:'infants_0_5',l:'Infants (0-5) 👶',c:'#22c55e'},{k:'children_6_12',l:'Children (6-12) 🧒',c:'#f59e0b'},{k:'teenagers_13_18',l:'Teenagers (13-18) 🧑',c:'#06b6d4'}].map(f=>(
                          <div key={f.k} style={{background:'rgba(255,255,255,0.03)',borderRadius:12,padding:'12px',border:'1px solid rgba(255,255,255,0.06)'}}>
                            <label style={{fontSize:11,color:f.c,display:'block',marginBottom:6,fontWeight:600}}>{f.l}</label>
                            <input type="number" className="dash-form-input" value={orphanageForm[f.k]} onChange={e=>orpUpd(f.k,e.target.value)} placeholder="0" style={{textAlign:'center'}} />
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:13,fontWeight:600,color:'#94a3b8',marginBottom:10}}>Staff Information</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12}}>
                        {[{k:'staff_permanent',l:'Permanent Staff',i:'🏢'},{k:'staff_volunteers',l:'Volunteers',i:'🙋'},{k:'staff_caregivers',l:'Caregivers',i:'🤱'},{k:'staff_teachers',l:'Teachers',i:'👩‍🏫'}].map(f=>(
                          <div key={f.k} style={{background:'rgba(255,255,255,0.03)',borderRadius:12,padding:'12px',border:'1px solid rgba(255,255,255,0.06)'}}>
                            <label style={{fontSize:11,color:'#94a3b8',display:'block',marginBottom:6,fontWeight:600}}>{f.i} {f.l}</label>
                            <input type="number" className="dash-form-input" value={orphanageForm[f.k]} onChange={e=>orpUpd(f.k,e.target.value)} placeholder="0" style={{textAlign:'center'}} />
                          </div>
                        ))}
                      </div>
                      {/* Live summary */}
                      {(orphanageForm.capacity || orphanageForm.current_children) && <div style={{marginTop:20,padding:'16px',background:'rgba(34,197,94,0.06)',borderRadius:12,border:'1px solid rgba(34,197,94,0.15)',display:'flex',flexWrap:'wrap',gap:20}}>
                        <div><span style={{fontSize:11,color:'#64748b'}}>Capacity Usage</span><div style={{fontSize:20,fontWeight:700,color:Number(orphanageForm.current_children||0)/Number(orphanageForm.capacity||1)>0.9?'#ef4444':'#22c55e'}}>{orphanageForm.capacity?Math.round(Number(orphanageForm.current_children||0)/Number(orphanageForm.capacity)*100):0}%</div></div>
                        <div><span style={{fontSize:11,color:'#64748b'}}>Available Spots</span><div style={{fontSize:20,fontWeight:700,color:'#3b82f6'}}>{Math.max(0,Number(orphanageForm.capacity||0)-Number(orphanageForm.current_children||0))}</div></div>
                        <div><span style={{fontSize:11,color:'#64748b'}}>Total Staff</span><div style={{fontSize:20,fontWeight:700,color:'#f59e0b'}}>{Number(orphanageForm.staff_permanent||0)+Number(orphanageForm.staff_volunteers||0)+Number(orphanageForm.staff_caregivers||0)+Number(orphanageForm.staff_teachers||0)}</div></div>
                      </div>}
                    </>}

                    {/* ══ STEP 3: DOCUMENTS ══ */}
                    {orpWizStep === 3 && <>
                      <h3 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>📄 Legal Documents</h3>
                      <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>Upload required legal documents for verification.</p>
                      <div style={{fontSize:13,fontWeight:600,color:'#22c55e',marginBottom:14}}>✅ Required Documents ({Object.entries(orpFiles).filter(([k])=>['registration_cert','operating_license','director_id','tax_doc','child_protection'].includes(k)).filter(([,v])=>v).length}/5)</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginBottom:24}}>
                        {[{k:'registration_cert',l:'Registration Certificate',req:true},{k:'operating_license',l:'Operating License',req:true},{k:'director_id',l:'Director Identification',req:true},{k:'tax_doc',l:'Tax Registration',req:true},{k:'child_protection',l:'Child Protection Policy',req:true}].map(d=>(
                          <div key={d.k} {...orpDragHandler(d.k)} style={{border:`2px dashed ${orpFiles[d.k]?'#22c55e':'rgba(255,255,255,0.1)'}`,borderRadius:14,padding:'20px 16px',textAlign:'center',cursor:'pointer',background:orpFiles[d.k]?'rgba(34,197,94,0.04)':'rgba(255,255,255,0.02)',transition:'all .2s ease'}} onClick={()=>document.getElementById('orp-file-'+d.k)?.click()}>
                            <div style={{fontSize:28,marginBottom:6}}>{orpFiles[d.k]?'✅':'📤'}</div>
                            <div style={{fontSize:12,fontWeight:600,color:orpFiles[d.k]?'#22c55e':'#94a3b8',marginBottom:4}}>{d.l}{d.req&&<span style={{color:'#ef4444'}}> *</span>}</div>
                            <div style={{fontSize:11,color:'#64748b'}}>{orpFiles[d.k]?orpFiles[d.k].name:'Drag & drop or click to upload'}</div>
                            <input id={'orp-file-'+d.k} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{display:'none'}} onChange={orpFileHandler(d.k)} />
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:13,fontWeight:600,color:'#64748b',marginBottom:14}}>📎 Optional Documents</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
                        {[{k:'annual_report',l:'Annual Report'},{k:'ngo_accreditation',l:'NGO Accreditation'},{k:'partnership_certs',l:'Partnership Certificates'}].map(d=>(
                          <div key={d.k} {...orpDragHandler(d.k)} style={{border:`2px dashed ${orpFiles[d.k]?'#3b82f6':'rgba(255,255,255,0.06)'}`,borderRadius:14,padding:'16px',textAlign:'center',cursor:'pointer',background:orpFiles[d.k]?'rgba(59,130,246,0.04)':'rgba(255,255,255,0.01)',transition:'all .2s ease'}} onClick={()=>document.getElementById('orp-file-'+d.k)?.click()}>
                            <div style={{fontSize:22,marginBottom:4}}>{orpFiles[d.k]?'📎':'📤'}</div>
                            <div style={{fontSize:12,color:orpFiles[d.k]?'#3b82f6':'#64748b'}}>{d.l}</div>
                            <div style={{fontSize:10,color:'#475569'}}>{orpFiles[d.k]?orpFiles[d.k].name:'Optional'}</div>
                            <input id={'orp-file-'+d.k} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{display:'none'}} onChange={orpFileHandler(d.k)} />
                          </div>
                        ))}
                      </div>
                    </>}

                    {/* ══ STEP 4: NEEDS ASSESSMENT ══ */}
                    {orpWizStep === 4 && <>
                      <h3 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>🆘 Current Needs</h3>
                      <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>Select areas where your orphanage requires support.</p>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:20}}>
                        {ORP_NEEDS_OPTIONS.map((n,i) => {
                          const active = orphanageForm.needs.includes(n);
                          return (<button key={n} onClick={()=>orpToggleNeed(n)} style={{background:active?'rgba(245,158,11,0.12)':'rgba(255,255,255,0.03)',border:`1px solid ${active?'rgba(245,158,11,0.4)':'rgba(255,255,255,0.06)'}`,borderRadius:12,padding:'14px 10px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,transition:'all .2s ease',transform:active?'scale(1.03)':'scale(1)'}}>
                            <span style={{fontSize:24}}>{ORP_NEEDS_ICONS[i]}</span>
                            <span style={{fontSize:11,fontWeight:active?700:500,color:active?'#f59e0b':'#94a3b8'}}>{n}</span>
                            {active && <span style={{fontSize:10,color:'#22c55e'}}>✓ Selected</span>}
                          </button>)
                        })}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                        <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Priority Level</label><select className="dash-form-input" value={orphanageForm.needs_priority} onChange={e=>orpUpd('needs_priority',e.target.value)} style={{cursor:'pointer'}}><option value="low">🟢 Low</option><option value="medium">🟡 Medium</option><option value="high">🟠 High</option><option value="critical">🔴 Critical</option></select></div>
                        <div style={{display:'flex',alignItems:'center',gap:8,paddingTop:20}}><label style={{fontSize:12,color:'#94a3b8',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={orphanageForm.donor_visible} onChange={e=>orpUpd('donor_visible',e.target.checked)} style={{accentColor:'#f59e0b'}} /> 👁️ Visible to donors</label></div>
                      </div>
                      <div><label style={{fontSize:12,color:'#94a3b8',marginBottom:4,display:'block'}}>Describe Current Needs & Challenges</label><textarea className="dash-form-input" rows={4} value={orphanageForm.needs_description} onChange={e=>orpUpd('needs_description',e.target.value)} placeholder="Describe the most urgent needs and current challenges your orphanage is facing..." /></div>
                    </>}

                    {/* ══ STEP 5: VERIFICATION ══ */}
                    {orpWizStep === 5 && <>
                      <h3 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>✅ Verification & Submission</h3>
                      <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>Review your submission and track verification status.</p>

                      {/* Status du dossier */}
                      {!directorOrp ? (
                        <div style={{background:'rgba(168,85,247,0.06)',borderRadius:16,padding:'20px',border:'1px solid rgba(168,85,247,0.15)',marginBottom:20}}>
                          <div style={{fontSize:13,fontWeight:600,color:'#a855f7',marginBottom:14}}>🔍 Assigned Ambassador</div>
                          <div style={{display:'flex',alignItems:'center',gap:16}}>
                            <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,#a855f7,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,color:'#fff'}}>🛡️</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0'}}>Awaiting Assignment</div>
                              <div style={{fontSize:12,color:'#64748b'}}>An ambassador will be assigned after submission</div>
                            </div>
                            <div style={{padding:'6px 14px',borderRadius:20,background:'rgba(245,158,11,0.12)',color:'#f59e0b',fontSize:11,fontWeight:700}}>⏳ Pending</div>
                          </div>
                        </div>
                      ) : (() => {
                        const statusConfig = {
                          pending: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', icon: '🔴', label: "En attente de validation par la fédération" },
                          approved: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', icon: '🟢', label: 'Validé par la fédération' },
                          rejected: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', icon: '❌', label: 'Rejeté' },
                        }
                        const cfg = statusConfig[directorOrp.status] || statusConfig.pending
                        return (
                          <div style={{background:cfg.bg,borderRadius:16,padding:'20px',border:`1px solid ${cfg.border}`,marginBottom:20}}>
                            <div style={{fontSize:13,fontWeight:600,color:cfg.color,marginBottom:14}}>{cfg.icon} Statut du dossier</div>
                            <div style={{display:'flex',alignItems:'center',gap:16}}>
                              <div style={{width:56,height:56,borderRadius:'50%',background:`${cfg.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:cfg.color}}>{cfg.icon}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0'}}>{cfg.label}</div>
                                {directorOrp.ambassador_name && <div style={{fontSize:12,color:cfg.color,marginTop:4}}>Ambassadeur: {directorOrp.ambassador_name}</div>}
                                {directorOrp.feedback && <div style={{fontSize:12,color:'#64748b',marginTop:4,fontStyle:'italic'}}>Feedback: {directorOrp.feedback}</div>}
                              </div>
                              <div style={{padding:'6px 14px',borderRadius:20,background:cfg.bg,color:cfg.color,fontSize:11,fontWeight:700,border:`1px solid ${cfg.border}`}}>{directorOrp.status}</div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Summary */}
                      <div style={{background:'rgba(59,130,246,0.04)',borderRadius:14,padding:'16px 20px',border:'1px solid rgba(59,130,246,0.12)'}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#3b82f6',marginBottom:12}}>📝 Submission Summary</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
                          <div style={{color:'#64748b'}}>Orphanage:</div><div style={{color:'#e2e8f0',fontWeight:600}}>{orphanageForm.name || '—'}</div>
                          <div style={{color:'#64748b'}}>Type:</div><div style={{color:'#e2e8f0'}}>{orphanageForm.orphanage_type || '—'}</div>
                          <div style={{color:'#64748b'}}>Country:</div><div style={{color:'#e2e8f0'}}>{orphanageForm.country || '—'}</div>
                          <div style={{color:'#64748b'}}>Director:</div><div style={{color:'#e2e8f0'}}>{orphanageForm.director_name || '—'}</div>
                          <div style={{color:'#64748b'}}>Capacity:</div><div style={{color:'#e2e8f0'}}>{orphanageForm.capacity || '—'}</div>
                          <div style={{color:'#64748b'}}>Documents:</div><div style={{color:'#e2e8f0'}}>{docCount}/8 uploaded</div>
                          <div style={{color:'#64748b'}}>Needs:</div><div style={{color:'#e2e8f0'}}>{orphanageForm.needs.length} selected</div>
                        </div>
                      </div>
                    </>}

                    </div>{/* end form card */}

                    {/* ── BOTTOM ACTIONS ── */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:20}}>
                      <div style={{display:'flex',gap:10}}>
                        {orpWizStep > 0 && <button className="dash-form-save" onClick={()=>setOrpWizStep(s=>s-1)} style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8'}}>← Previous</button>}
                      </div>
                      <div style={{display:'flex',gap:10,alignItems:'center'}}>
                        {orpDraftSaved && <span style={{fontSize:11,color:'#22c55e'}}>✓ Draft saved</span>}
                        <button className="dash-form-save" onClick={saveDraft} style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8'}}>💾 Save Draft</button>
                        {orpWizStep < 5 ? (
                          <button className="dash-form-save" onClick={()=>setOrpWizStep(s=>s+1)} style={{background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',fontWeight:700}}>Next Step →</button>
                        ) : directorOrp && !orphanageLoading ? (
                          (() => { const c = ORP_STATUS_BTN[directorOrp.status] || ORP_STATUS_BTN.pending; return <span style={{background:c.bg,color:'#fff',fontWeight:700,padding:'10px 28px',borderRadius:10,fontSize:13,display:'inline-block',whiteSpace:'nowrap'}}>{c.label}</span> })()
                        ) : (
                          <button className="dash-form-save" onClick={submitOrphanage} disabled={orphanageLoading} style={{background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',fontWeight:700,padding:'10px 28px'}}>{orphanageLoading?'Submitting...':'🚀 Submit for Verification'}</button>
                        )}
                      </div>
                    </div>
                  </div>
                  );})()
                : activeKey === 'documents' && role === 'director' ? (() => {
                  const myDocOrp = directorOrpRec()
                  const token = localStorage.getItem('access_token')
                  const loadDocTypesDir = async () => {
                    let h = token ? { Authorization: `Bearer ${token}` } : {}
                    let res = await fetch(`${API}/document-types/`, { headers: h })
                    if (res.status === 401) {
                      const refresh = localStorage.getItem('refresh_token')
                      if (refresh) {
                        const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                        if (refRes.ok) {
                          const tokens = await refRes.json()
                          localStorage.setItem('access_token', tokens.access)
                          h = { Authorization: `Bearer ${tokens.access}` }
                          res = await fetch(`${API}/document-types/`, { headers: h })
                        }
                      }
                    }
                    if (res.ok) setDocTypes(await res.json())
                  }
                  const loadSubmittedDocsDir = async () => {
                    if (!myDocOrp) return
                    setDocLoading(true)
                    try {
                      let h = token ? { Authorization: `Bearer ${token}` } : {}
                      let res = await fetch(`${API}/orphanages/${myDocOrp.id}/documents/`, { headers: h })
                      if (res.status === 401) {
                        const refresh = localStorage.getItem('refresh_token')
                        if (refresh) {
                          const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                          if (refRes.ok) {
                            const tokens = await refRes.json()
                            localStorage.setItem('access_token', tokens.access)
                            h = { Authorization: `Bearer ${tokens.access}` }
                            res = await fetch(`${API}/orphanages/${myDocOrp.id}/documents/`, { headers: h })
                          }
                        }
                      }
                      if (res.ok) { const d = await res.json(); setSubmittedDocs(d); setDocResetKey(k => k + 1) }
                      else throw new Error('Erreur chargement')
                    } catch (e) {
                      showToast('Impossible de charger les documents.', 'error')
                    } finally {
                      setDocLoading(false)
                    }
                  }

                  const docFileUrl = (url) => {
                    if (!url) return ''
                    try {
                      const u = new URL(url)
                      return u.pathname + u.search
                    } catch { return url }
                  }

                  const deleteDocument = (docId) => {
                    if (!myDocOrp) return
                    setDocConfirmModal({
                      title: 'Supprimer ce document\u00A0?',
                      message: 'Cette action est irréversible. Le fichier sera définitivement supprimé.',
                      confirmLabel: 'Supprimer',
                      onConfirm: async () => {
                        setDocConfirmModal(null)
                        try {
                          let h = token ? { Authorization: `Bearer ${token}` } : {}
                          let res = await fetch(`${API}/orphanages/${myDocOrp.id}/documents/${docId}/`, { method: 'DELETE', headers: h })
                          if (res.status === 401) {
                            const refresh = localStorage.getItem('refresh_token')
                            if (refresh) {
                              const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                              if (refRes.ok) {
                                const tokens = await refRes.json()
                                localStorage.setItem('access_token', tokens.access)
                                h = { Authorization: `Bearer ${tokens.access}` }
                                res = await fetch(`${API}/orphanages/${myDocOrp.id}/documents/${docId}/`, { method: 'DELETE', headers: h })
                              }
                            }
                          }
                          if (!res.ok) throw new Error('Delete failed')
                          showToast('Document supprimé.', 'success')
                          loadSubmittedDocsDir()
                        } catch (e) {
                          showToast('Erreur lors de la suppression.', 'error')
                        }
                      }
                    })
                  }
                  const modifyDocument = (docId) => {
                    if (!myDocOrp) return
                    setDocConfirmModal({
                      title: 'Remplacer ce document\u00A0?',
                      message: 'La version actuelle sera supprimée. Vous pourrez téléverser une nouvelle version du même type.',
                      confirmLabel: 'Remplacer',
                      onConfirm: async () => {
                        setDocConfirmModal(null)
                        try {
                          let h = token ? { Authorization: `Bearer ${token}` } : {}
                          let res = await fetch(`${API}/orphanages/${myDocOrp.id}/documents/${docId}/`, { method: 'DELETE', headers: h })
                          if (res.status === 401) {
                            const refresh = localStorage.getItem('refresh_token')
                            if (refresh) {
                              const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                              if (refRes.ok) {
                                const tokens = await refRes.json()
                                localStorage.setItem('access_token', tokens.access)
                                h = { Authorization: `Bearer ${tokens.access}` }
                                res = await fetch(`${API}/orphanages/${myDocOrp.id}/documents/${docId}/`, { method: 'DELETE', headers: h })
                              }
                            }
                          }
                          if (!res.ok) throw new Error('Modify failed')
                          showToast('Vous pouvez maintenant téléverser une nouvelle version.', 'success')
                          loadSubmittedDocsDir()
                        } catch (e) {
                          showToast('Erreur lors de la modification.', 'error')
                        }
                      }
                    })
                  }

                  const handleUpload = async () => {
                    if (!selDocTypeId || !docFile || !myDocOrp) return
                    setDocUploading(true)
                    try {
                      const fd = new FormData()
                      fd.append('document_type', selDocTypeId)
                      fd.append('file', docFile)
                      const res = await fetch(`${API}/orphanages/${myDocOrp.id}/documents/`, {
                        method: 'POST',
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        body: fd,
                      })
                      if (!res.ok) throw new Error('Upload failed')
                      showToast('Document téléversé avec succès. En attente de validation par la fédération.', 'success')
                      setDocFile(null)
                      setSelDocTypeId('')
                      setDocResetKey(k => k + 1)
                      if (docFileRef.current) docFileRef.current.value = ''
                      loadSubmittedDocsDir()
                    } catch (e) {
                      showToast("Erreur lors du téléversement.", 'error')
                    } finally {
                      setDocUploading(false)
                    }
                  }

                  const STATUS_BADGES = {
                    pending: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                    accepted: { label: 'Accepté', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
                    changes_requested: { label: 'Modifications demandées', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                    rejected: { label: 'Refusé', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                  }

                  const totalRequired = docTypes.filter(d => d.required).length
                  const totalOptional = docTypes.filter(d => !d.required).length
                  const totalAll = docTypes.length
                  const uploadedCount = new Set(submittedDocs.filter(d => d.status !== 'rejected').map(d => d.document_type)).size

                  return (
                  <>
                  <div style={{padding:'0 8px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                      <div>
                        <h3 style={{fontSize:20,fontWeight:700,color:'#e2e8f0',margin:0}}>📄 Documents</h3>
                        <p style={{fontSize:13,color:'#64748b',margin:'4px 0 0'}}>Gérez les documents administratifs de votre orphelinat</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div style={{marginBottom:20,padding:'16px 20px',background:'rgba(30,41,59,0.5)',borderRadius:14,border:'1px solid rgba(255,255,255,0.06)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <span style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>Progression</span>
                        <span style={{fontSize:13,fontWeight:700,color:'#f59e0b'}}>{uploadedCount}/{totalAll} documents téléversés</span>
                      </div>
                      <div style={{height:6,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${totalAll ? (uploadedCount/totalAll)*100 : 0}%`,background:'linear-gradient(90deg,#f59e0b,#f97316)',borderRadius:3,transition:'width .3s ease'}} />
                      </div>
                      <div style={{display:'flex',gap:16,marginTop:10,fontSize:11,color:'#64748b'}}>
                        <span>🟠 Requis: {docTypes.filter(d => d.required && submittedDocs.some(s => s.document_type === d.id && s.status !== 'rejected')).length}/{totalRequired}</span>
                        <span>🔵 Optionnel: {docTypes.filter(d => !d.required && submittedDocs.some(s => s.document_type === d.id && s.status !== 'rejected')).length}/{totalOptional}</span>
                      </div>
                    </div>

                    {/* Upload new document */}
                    <div style={{background:'rgba(30,41,59,0.5)',borderRadius:14,border:'1px solid rgba(255,255,255,0.06)',padding:'20px',marginBottom:20}}>
                      <h4 style={{fontSize:14,fontWeight:600,color:'#e2e8f0',margin:'0 0 14px 0'}}>📤 Téléverser un document</h4>
                      <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
                        <div style={{flex:1,minWidth:200}}>
                          <label style={{fontSize:11,color:'#94a3b8',display:'block',marginBottom:4}}>Type de document</label>
                          <select className="dash-form-input" value={selDocTypeId} onChange={e => { setSelDocTypeId(e.target.value); setDocFile(null); setDocResetKey(k => k + 1); if (docFileRef.current) docFileRef.current.value = '' }} style={{cursor:'pointer'}}>
                            <option value="">Sélectionnez un type...</option>
                            {docTypes.filter(dt => !submittedDocs.some(s => s.document_type === dt.id && (s.status === 'accepted' || s.status === 'pending'))).map(dt => (
                              <option key={dt.id} value={dt.id}>{dt.label}{dt.required ? ' (REQUIS)' : ' (Optionnel)'}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{flex:1,minWidth:200}}>
                          <label style={{fontSize:11,color:'#94a3b8',display:'block',marginBottom:4}}>Fichier</label>
                          <input type="file" ref={docFileRef} key={`file-input-${docResetKey}`} className="dash-form-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{padding:'3px 12px'}} />
                        </div>
                        <button className="dash-form-save" onClick={handleUpload} disabled={!selDocTypeId || !docFile || docUploading} style={{background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'#fff',fontWeight:700,padding:'10px 24px',whiteSpace:'nowrap'}}>
                          {docUploading ? 'Envoi...' : '⬆ Téléverser'}
                        </button>
                      </div>
                      {docFile && <div style={{marginTop:10,fontSize:11,color:'#22c55e'}}>✓ {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)</div>}
                    </div>

                    {/* List of submitted documents */}
                    <div>
                      <h4 style={{fontSize:14,fontWeight:600,color:'#e2e8f0',margin:'0 0 12px 0'}}>Documents soumis</h4>
                      {docLoading && <div style={{fontSize:12,color:'#64748b',padding:12}}>Chargement...</div>}
                      {!docLoading && submittedDocs.length === 0 && (
                        <div style={{padding:'24px',textAlign:'center',color:'#64748b',fontSize:12,background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px dashed rgba(255,255,255,0.08)'}}>
                          Aucun document soumis pour le moment.
                        </div>
                      )}
                      {submittedDocs.map(doc => {
                        const sb = STATUS_BADGES[doc.status] || STATUS_BADGES.pending
                        return (
                          <div key={doc.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',marginBottom:8,background:'rgba(30,41,59,0.4)',borderRadius:10,border:`1px solid rgba(255,255,255,0.04)`,flexWrap:'wrap'}}>
                            <div style={{flex:1,minWidth:150}}>
                              <div style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{doc.document_type_name}</div>
                              <div style={{fontSize:10,color:'#64748b'}}>{new Date(doc.uploaded_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                            </div>
                            <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:12,background:sb.bg,color:sb.color}}>{sb.label}</span>
                            <button onClick={() => setPreviewDoc(docFileUrl(doc.file))} style={{background:'rgba(59,130,246,0.1)',border:'none',borderRadius:8,color:'#60a5fa',fontSize:11,padding:'4px 10px',cursor:'pointer'}}>👁 Voir</button>
                            <a href={docFileUrl(doc.file)} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'#64748b',textDecoration:'underline'}}>⬇ Télécharger</a>
                            {(Date.now() - new Date(doc.uploaded_at).getTime()) < 2 * 24 * 60 * 60 * 1000 && (
                              <>
                                {(doc.status === 'changes_requested' || doc.status === 'rejected') && (
                                  <button onClick={() => modifyDocument(doc.id)} style={{background:'rgba(245,158,11,0.1)',border:'none',borderRadius:8,color:'#f59e0b',fontSize:11,padding:'4px 10px',cursor:'pointer'}}>✏️ Modifier</button>
                                )}
                                <button onClick={() => deleteDocument(doc.id)} style={{background:'rgba(239,68,68,0.1)',border:'none',borderRadius:8,color:'#ef4444',fontSize:11,padding:'4px 10px',cursor:'pointer'}}>🗑 Supprimer</button>
                              </>
                            )}
                            {(doc.status === 'changes_requested' || doc.status === 'rejected') && (doc.feedback || doc.points_to_update) && (() => {
                              const isFresh = doc.reviewed_at && (Date.now() - new Date(doc.reviewed_at).getTime()) < 60000
                              const detailsOpen = openModifDoc === doc.id
                              return (
                              <>
                                {(isFresh || detailsOpen) && (
                                  <button onClick={() => {
                                    const willOpen = openModifDoc !== doc.id
                                    setOpenModifDoc(willOpen ? doc.id : null)
                                    if (willOpen && !modifNotifTimers.current[doc.id+'_close']) {
                                      modifNotifTimers.current[doc.id+'_close'] = setTimeout(() => setOpenModifDoc(d => d === doc.id ? null : d), 180000)
                                    }
                                  }} style={{
                                    background: isFresh ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
                                    border: isFresh ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 8,
                                    color: isFresh ? '#f87171' : '#ef4444',
                                    fontSize: 11,
                                    padding: '4px 12px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    animation: isFresh ? 'pulse-modif 1s ease-in-out infinite' : 'none',
                                    transition: 'all .2s',
                                  }}>
                                    {detailsOpen ? '▲ Masquer les détails' : doc.status === 'rejected' ? '❌ Voir le motif du refus' : '🔄 Modifications demandées'}
                                  </button>
                                )}
                                {detailsOpen && (
                                  <div style={{width:'100%',padding:'8px 12px',background:'rgba(239,68,68,0.06)',borderRadius:8,border:'1px solid rgba(239,68,68,0.15)',fontSize:11,color:'#ef4444',marginTop:4}}>
                                    {doc.feedback && <><strong>{doc.status === 'rejected' ? 'Motif du refus' : 'Retour de la fédération'}:</strong> {doc.feedback}</>}
                                    {doc.points_to_update && (
                                      <div style={{marginTop:doc.feedback?6:0}}>
                                        <strong>Points à corriger:</strong>
                                        {doc.points_to_update.split('\n').filter(p=>p.trim()).map((p,i) => <div key={i} style={{paddingLeft:12}}>• {p}</div>)}
                                      </div>
                                    )}
                                    <div style={{marginTop:6,fontSize:9,color:'#64748b',textAlign:'right'}}>
                                      {doc.reviewed_at && <>Demandé le {new Date(doc.reviewed_at).toLocaleString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</>}
                                    </div>
                                  </div>
                                )}
                              </>
                              )
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {/* ── Modification history ── */}
                  {submittedDocs.filter(d => d.status === 'changes_requested' || d.status === 'rejected').length > 0 && (
                    <div style={{marginTop:24,padding:'16px 18px',background:'rgba(30,41,59,0.4)',borderRadius:14,border:'1px solid rgba(255,255,255,0.06)'}}>
                      <h4 style={{fontSize:13,fontWeight:700,color:'#94a3b8',margin:'0 0 12px 0',display:'flex',alignItems:'center',gap:6}}>
                        📋 Historique des modifications
                        <span style={{background:'rgba(239,68,68,0.12)',color:'#ef4444',fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:8}}>{submittedDocs.filter(d => d.status === 'changes_requested' || d.status === 'rejected').length}</span>
                      </h4>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {submittedDocs.filter(d => d.status === 'changes_requested' || d.status === 'rejected').map(doc => {
                          const reviewed = doc.reviewed_at ? new Date(doc.reviewed_at) : null
                          return (
                            <div key={doc.id} style={{padding:'10px 12px',background:'rgba(255,255,255,0.02)',borderRadius:8,border:'1px solid rgba(255,255,255,0.04)',fontSize:11}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                                <span style={{fontWeight:600,color:'#e2e8f0'}}>{doc.document_type_name}</span>
                                <span style={{color:'#64748b',fontSize:10}}>{reviewed ? reviewed.toLocaleString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}</span>
                              </div>
                              <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
                                <span style={{
                                  fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:8,
                                  background: doc.status === 'changes_requested' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: doc.status === 'changes_requested' ? '#ef4444' : '#ef4444',
                                }}>
                                  {doc.status === 'changes_requested' ? 'Modifications demandées' : 'Refusé'}
                                </span>
                                <span style={{color:'#64748b',fontSize:9}}>par {doc.reviewed_by_name || 'Fédération'}</span>
                              </div>
                              {doc.feedback && <div style={{color:'#94a3b8',marginBottom:2}}><strong>Retour:</strong> {doc.feedback}</div>}
                              {doc.points_to_update && (
                                <div style={{color:'#94a3b8'}}>
                                  <strong>Points à corriger:</strong>
                                  {doc.points_to_update.split('\n').filter(p=>p.trim()).map((p,i) => <div key={i} style={{paddingLeft:8}}>• {p}</div>)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {/* ── PDF / document preview modal ── */}
                  {previewDoc && (
                    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={() => setPreviewDoc(null)}>
                      <div style={{position:'relative',width:'90%',height:'90%',background:'#1e293b',borderRadius:16,border:'1px solid rgba(255,255,255,0.1)',overflow:'hidden',display:'flex',flexDirection:'column'}} onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                          <span style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>📄 Aperçu du document</span>
                          <button onClick={() => setPreviewDoc(null)} style={{background:'rgba(239,68,68,0.15)',border:'none',borderRadius:8,color:'#ef4444',fontSize:18,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                        </div>
                        <div style={{flex:1,position:'relative'}}>
                          <iframe src={previewDoc} style={{width:'100%',height:'100%',border:'none'}} title="Document preview" />
                          <a href={previewDoc} target="_blank" rel="noopener noreferrer" style={{position:'absolute',bottom:16,right:16,background:'#f59e0b',color:'#fff',fontWeight:700,fontSize:12,padding:'8px 16px',borderRadius:8,textDecoration:'none'}}>⬇ Télécharger</a>
                        </div>
                      </div>
                    </div>
                  )}
                  </>
                  )})()
                : subKey === 'Profil' && activeKey === 'parametres' ? (
                  <div className="dash-sub-form">
                    <div className="dash-sub-form-top">
                      <button className="dash-back-btn" onClick={() => setSubKey(null)}>{'\u2190'} {t('form_back')}</button>
                      <h3 className="dash-sub-form-title">{t('settings_profile') || 'Mon Profil'}</h3>
                    </div>
                    <div className="dash-sub-form-fields" style={{ display:'flex', flexDirection:'column', gap:'16px', padding:'20px 0' }}>
                      <div className="dash-form-field" style={{ alignItems:'center' }}>
                        <div style={{ position:'relative', display:'inline-block', cursor:'pointer' }} onClick={() => document.getElementById('settings-profile-upload')?.click()}>
                          <img src={profileImg || avatarSvg} alt="" style={{ width:'80px', height:'80px', borderRadius:'50%', border:'2px solid rgba(245,158,11,0.2)', objectFit:'cover' }} />
                          <div style={{ position:'absolute', bottom:0, right:0, background:'#f59e0b', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', color:'#fff', fontWeight:'700', lineHeight:'1' }}>+</div>
                          <input id="settings-profile-upload" type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (ev) => {
                                localStorage.setItem('cdo_profile_img', ev.target.result)
                                setProfileImg(ev.target.result)
                              }
                              reader.readAsDataURL(file)
                            }
                          }} />
                        </div>
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_firstname')}</label>
                        <input type="text" className="dash-form-input" value={user.first_name || ''} onChange={e => { user.first_name = e.target.value }} />
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_lastname')}</label>
                        <input type="text" className="dash-form-input" value={user.last_name || ''} onChange={e => { user.last_name = e.target.value }} />
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_email')}</label>
                        <input type="text" className="dash-form-input" value={user.email || ''} readOnly style={{ opacity:0.6 }} />
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_role')}</label>
                        <input type="text" className="dash-form-input" value={t('role_' + role) || roleLabel} readOnly style={{ opacity:0.6 }} />
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_country')}</label>
                        <input type="text" className="dash-form-input" value={countryName(user.country || 'CD')} readOnly style={{ opacity:0.6 }} />
                      </div>
                      {role === 'director' && orphanageName && (
                        <div className="dash-form-field">
                          <label className="dash-form-label">{t('settings_orphanage_name')}</label>
                          <input type="text" className="dash-form-input" value={orphanageName} readOnly style={{ opacity:0.6 }} />
                        </div>
                      )}
                      <button className="dash-form-save" onClick={() => {
                        localStorage.setItem('cdo_first_name', user.first_name || '')
                        localStorage.setItem('cdo_last_name', user.last_name || '')
                        alert(t('settings_saved'))
                      }} style={{ marginTop:'8px' }}>{t('settings_save')}</button>
                    </div>
                  </div>
                ) : subKey && activeKey === 'parametres' ? (
                  <div className="dash-sub-form">
                    <div className="dash-sub-form-top">
                      <button className="dash-back-btn" onClick={() => setSubKey(null)}>{'\u2190'} {t('settings_back')}</button>
                      <h3 className="dash-sub-form-title">{t('settings_config')}</h3>
                    </div>
                    <div className="dash-sub-form-fields">
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('settings_orphanage_name')}</label>
                        <div className="dash-orp-name-row">
                          <input type="text" className="dash-form-input" value={orphanageName} onChange={e => setOrphanageName(e.target.value)} placeholder={t('settings_orphanage_placeholder')} />
                          <button className="dash-orp-save-btn" onClick={() => {
                            localStorage.setItem('cdo_orphanage_name', orphanageName)
                            alert(t('settings_saved'))
                          }}>{t('settings_save')}</button>
                        </div>
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('settings_theme')}</label>
                        <div className="dash-theme-btns">
                          <button className={`dash-theme-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>{'\u{1F319}'} {t('settings_dark')}</button>
                          <button className={`dash-theme-btn${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>{'\u2600\uFE0F'} {t('settings_light')}</button>
                        </div>
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('settings_lang')}</label>
                        <select className="dash-form-input" value={lang} onChange={e => setLang(e.target.value)}>
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                          <option value="sw">Kiswahili</option>
                          <option value="ln">Lingala</option>
                          <option value="kg">Kikongo</option>
                          <option value="tl">Tshiluba</option>
                        </select>
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('settings_bg')}</label>
                        <select className="dash-form-input" value={bgTheme} onChange={e => setBgTheme(e.target.value)}>
                          <option value="">{t('settings_bg_default')}</option>
                          <option value="1">Cyber Blueprint</option>
                          <option value="2">Frosted Carbon</option>
                          <option value="3">Industrial Gold & Slate</option>
                          <option value="4">Tactical HUD</option>
                          <option value="5">Pure Distraction-Free</option>
                          <option value="6">Architectural Blueprint</option>
                          <option value="7">Neon Pulse</option>
                          <option value="8">Brushed Steel & Monotone</option>
                          <option value="9">Abstract Topography</option>
                          <option value="10">Floating Depth Layers</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : subKey === 'Profil' && activeKey === 'parametres' ? (
                  <div className="dash-sub-form">
                    <div className="dash-sub-form-top">
                      <button className="dash-back-btn" onClick={() => setSubKey(null)}>{'\u2190'} {t('form_back')}</button>
                      <h3 className="dash-sub-form-title">{user.first_name} {user.last_name}</h3>
                    </div>
                    <div className="dash-sub-form-fields" style={{ display:'flex', flexDirection:'column', gap:'16px', padding:'20px 0' }}>
                      <div className="dash-form-field" style={{ alignItems:'center' }}>
                        <div style={{ position:'relative', display:'inline-block', cursor:'pointer' }} onClick={() => document.getElementById('settings-profile-upload')?.click()}>
                          <img src={profileImg || avatarSvg} alt="" style={{ width:'72px', height:'72px', borderRadius:'50%', border:'2px solid rgba(245,158,11,0.2)' }} />
                          <div style={{ position:'absolute', bottom:0, right:0, background:'#f59e0b', borderRadius:'50%', width:'22px', height:'22px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', color:'#fff', fontWeight:'700', lineHeight:'1' }}>+</div>
                          <input id="settings-profile-upload-2" type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (ev) => {
                                localStorage.setItem('cdo_profile_img', ev.target.result)
                                setProfileImg(ev.target.result)
                              }
                              reader.readAsDataURL(file)
                            }
                          }} />
                        </div>
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_firstname')}</label>
                        <input type="text" className="dash-form-input" value={user.first_name || ''} readOnly />
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_lastname')}</label>
                        <input type="text" className="dash-form-input" value={user.last_name || ''} readOnly />
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_email')}</label>
                        <input type="text" className="dash-form-input" value={user.email || ''} readOnly />
                      </div>
                      <div className="dash-form-field">
                        <label className="dash-form-label">{t('signup_role')}</label>
                        <input type="text" className="dash-form-input" value={t('role_' + role) || roleLabel} readOnly />
                      </div>
                    </div>
                  </div>
                ) : subKey && activeKey === 'enfants' && subKey === 'Profil & identité' ? (
                  <div className="dash-prof-create">
                    <div className="dash-prof-header">
                      <button className="dash-prof-back-btn" onClick={() => setSubKey(null)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                        {t('form_back')}
                      </button>
                      <div className="dash-prof-header-info">
                        <h2 className="dash-prof-title">{t('form_profil_title') || 'Profil & identité'}</h2>
                        <span className="dash-prof-subtitle">{t('prof_manage_identity') || 'Gérez les informations personnelles et l\'identité du bénéficiaire'}</span>
                      </div>
                      <div className="dash-prof-progress">
                        <div className="dash-prof-progress-text">
                          <span>{t('prof_completion') || 'Profil complété'}</span>
                          <span className="dash-prof-progress-pct" id="prof-completion-pct">{
                            (() => {
                              const fields = ['Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Nationalité', "Adresse d'origine"]
                              const filled = fields.filter(f => getFieldValue(f)).length
                              const uid = editingChild ? editingChild.uid : uidRef.current
                              const hasPhoto = !!localStorage.getItem('cdo_child_photo_' + uid) || !!getFieldValue('Photo')
                              return Math.round((filled + (hasPhoto ? 1 : 0)) / (fields.length + 1) * 100)
                            })()
                          }%</span>
                        </div>
                        <div className="dash-prof-progress-bar">
                          <div className="dash-prof-progress-fill" style={{ width: (() => {
                            const fields = ['Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Nationalité', "Adresse d'origine"]
                            const filled = fields.filter(f => getFieldValue(f)).length
                            const uid = editingChild ? editingChild.uid : uidRef.current
                            const hasPhoto = !!localStorage.getItem('cdo_child_photo_' + uid) || !!getFieldValue('Photo')
                            return Math.round((filled + (hasPhoto ? 1 : 0)) / (fields.length + 1) * 100)
                          })() + '%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="dash-prof-body">
                      <div className="dash-prof-form-col">
                        <div className="dash-prof-card">
                          <div className="dash-prof-card-section">
                            <h4 className="dash-prof-section-title">{t('prof_personal_info') || 'Informations personnelles'}</h4>
                            <div className="dash-prof-grid-2">
                              <div className="dash-prof-field">
                                <label className="dash-prof-field-label" htmlFor="prof-nom">{t('signup_lastname') || 'Nom'}</label>
                                <input id="prof-nom" type="text" className="dash-prof-input" defaultValue={getFieldValue('Nom')} placeholder="Ex: Kiesse" onInput={() => updateProfCompletion()} />
                              </div>
                              <div className="dash-prof-field">
                                <label className="dash-prof-field-label" htmlFor="prof-prenom">{t('signup_firstname') || 'Prénom'}</label>
                                <input id="prof-prenom" type="text" className="dash-prof-input" defaultValue={getFieldValue('Prénom')} placeholder="Ex: Samuel" onInput={() => updateProfCompletion()} />
                              </div>
                            </div>
                          </div>

                          <div className="dash-prof-card-section">
                            <h4 className="dash-prof-section-title">{t('prof_demographic_info') || 'Informations démographiques'}</h4>
                            <div className="dash-prof-grid-3">
                              <div className="dash-prof-field">
                                <label className="dash-prof-field-label" htmlFor="prof-sexe">{t('form_sex') || 'Sexe'}</label>
                                <select id="prof-sexe" className="dash-prof-input" defaultValue={getFieldValue('Sexe')} onChange={() => updateProfCompletion()}>
                                  <option value="">{t('form_select_placeholder') || 'Sélectionner...'}</option>
                                  <option value="Masculin">{t('form_male') || 'Masculin'}</option>
                                  <option value="Féminin">{t('form_female') || 'Féminin'}</option>
                                </select>
                              </div>
                              <div className="dash-prof-field">
                                <label className="dash-prof-field-label" htmlFor="prof-dob">{t('form_dob') || 'Date de naissance'}</label>
                                <div className="dash-prof-input-wrap">
                                  <svg className="dash-prof-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                  <input id="prof-dob" type="date" className="dash-prof-input dash-prof-input-has-icon" defaultValue={getFieldValue('Date de naissance')} onChange={e => {
                                    const ageEl = document.getElementById('prof-age-display')
                                    if (ageEl && e.target.value) {
                                      const bd = new Date(e.target.value)
                                      const today = new Date()
                                      let age = today.getFullYear() - bd.getFullYear()
                                      const m = today.getMonth() - bd.getMonth()
                                      if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--
                                      ageEl.textContent = age + ' ' + (t('prof_years') || 'ans')
                                    } else if (ageEl) { ageEl.textContent = '—' }
                                    updateProfCompletion()
                                  }} />
                                </div>
                              </div>
                              <div className="dash-prof-field">
                                <label className="dash-prof-field-label" htmlFor="prof-nationalite">{t('form_nationality') || 'Nationalité'}</label>
                                <div className="dash-prof-input-wrap" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                  <select id="prof-nationalite" className="dash-prof-input" defaultValue={getFieldValue('Nationalité')} onChange={e => {
                                    updateProfCompletion()
                                    const flagEl = document.getElementById('prof-nat-flag')
                                    if (!flagEl) return
                                    const v = e.target.value
                                    if (!v) { flagEl.innerHTML = ''; return }
                                    const c = AFRICAN_COUNTRIES.find(c => c.name === v)
                                    flagEl.innerHTML = c ? `<img src="https://flagcdn.com/24x18/${c.code.toLowerCase()}.png" alt="${c.name}" style="width:auto;height:18px;border-radius:2px;vertical-align:middle" />` : ''
                                  }}>
                                    <option value="">{t('form_select_placeholder') || 'Sélectionner...'}</option>
                                    {AFRICAN_COUNTRIES.map((c, ci) => <option key={ci} value={c.name}>{c.name}</option>)}
                                  </select>
                                  <span id="prof-nat-flag" style={{minWidth:'24px', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}}>
                                    {(() => {
                                      const nat = getFieldValue('Nationalité')
                                      if (!nat) return null
                                      const c = AFRICAN_COUNTRIES.find(c => c.name === nat)
                                      return c ? <img src={`https://flagcdn.com/24x18/${c.code.toLowerCase()}.png`} alt={c.name} style={{width:'auto',height:'18px',borderRadius:'2px',verticalAlign:'middle'}} /> : null
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="dash-prof-card-section">
                            <h4 className="dash-prof-section-title">{t('prof_address') || 'Adresse'}</h4>
                            <div className="dash-prof-field">
                              <label className="dash-prof-field-label" htmlFor="prof-address">{t('form_origin_address') || 'Adresse d\'origine'}</label>
                              <input id="prof-address" type="text" className="dash-prof-input" defaultValue={getFieldValue("Adresse d'origine")} placeholder={t('prof_address_placeholder') || 'Ville, province, pays d\'origine'} onInput={() => updateProfCompletion()} />
                            </div>
                          </div>

                          <div className="dash-prof-card-section">
                            <h4 className="dash-prof-section-title">{t('prof_photo') || 'Photo'}</h4>
                            <div className="dash-prof-photo-zone" id="prof-photo-zone" onClick={() => document.getElementById('prof-photo-input')?.click()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('prof-photo-input')?.click() }} tabIndex={0} role="button" aria-label={t('prof_upload_photo') || 'Télécharger une photo'}>
                              <input id="prof-photo-input" type="file" accept="image/*" hidden onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = (ev) => {
                                    const uid = editingChild ? editingChild.uid : uidRef.current
                                    localStorage.setItem('cdo_child_photo_' + uid, ev.target.result)
                                    const preview = document.getElementById('prof-photo-preview')
                                    const zone = document.getElementById('prof-photo-zone')
                                    if (preview) { preview.src = ev.target.result; preview.style.display = 'block' }
                                    if (zone) zone.classList.add('dash-prof-photo-has')
                                    const icon = document.getElementById('prof-photo-icon')
                                    if (icon) icon.style.display = 'none'
                                    const text = document.getElementById('prof-photo-text')
                                    if (text) text.style.display = 'none'
                                    const remove = document.getElementById('prof-photo-remove')
                                    if (remove) remove.style.display = 'flex'
                                    updateProfCompletion()
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }} />
                              <div id="prof-photo-icon" className="dash-prof-photo-icon">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                              </div>
                              <p id="prof-photo-text" className="dash-prof-photo-text">{t('prof_drag_photo') || 'Glissez-déposez ou cliquez pour ajouter une photo'}</p>
                              {(() => {
                                const uid = editingChild ? editingChild.uid : uidRef.current
                                const saved = localStorage.getItem('cdo_child_photo_' + uid)
                                return saved ? <img id="prof-photo-preview" className="dash-prof-photo-preview" src={saved} alt="" /> : null
                              })()}
                              <button id="prof-photo-remove" className="dash-prof-photo-remove" type="button" style={{ display: (() => { const uid = editingChild ? editingChild.uid : uidRef.current; return localStorage.getItem('cdo_child_photo_' + uid) ? 'flex' : 'none' })() }} onClick={e => {
                                e.stopPropagation()
                                const uid = editingChild ? editingChild.uid : uidRef.current
                                localStorage.removeItem('cdo_child_photo_' + uid)
                                document.getElementById('prof-photo-input').value = ''
                                const preview = document.getElementById('prof-photo-preview')
                                if (preview) { preview.style.display = 'none'; preview.src = '' }
                                const zone = document.getElementById('prof-photo-zone')
                                if (zone) zone.classList.remove('dash-prof-photo-has')
                                const icon = document.getElementById('prof-photo-icon')
                                if (icon) icon.style.display = 'flex'
                                const text = document.getElementById('prof-photo-text')
                                if (text) text.style.display = 'block'
                                const remove = document.getElementById('prof-photo-remove')
                                if (remove) remove.style.display = 'none'
                                updateProfCompletion()
                              }} aria-label={t('prof_remove_photo') || 'Supprimer la photo'}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          </div>

                          <div className="dash-prof-card-section">
                            <div className="dash-prof-uid-box">
                              <div className="dash-prof-uid-label">{t('form_unique_id') || 'ID UNIQUE'}</div>
                              <div className="dash-prof-uid-value">
                                <span className="dash-prof-uid-text">{editingChild ? editingChild.uid : uidRef.current}</span>
                                <button className="dash-prof-uid-copy" onClick={() => {
                                  navigator.clipboard.writeText(editingChild ? editingChild.uid : uidRef.current)
                                  const btn = document.getElementById('prof-uid-copy-btn')
                                  if (btn) { btn.textContent = '\u2713'; setTimeout(() => { btn.textContent = t('prof_copy') || 'Copier' }, 2000) }
                                }} id="prof-uid-copy-btn">{t('prof_copy') || 'Copier'}</button>
                              </div>
                            </div>
                          </div>

                          <div className="dash-prof-actions">
                            <button className="dash-prof-btn dash-prof-btn-secondary" onClick={() => setSubKey(null)}>{t('form_cancel') || 'Annuler'}</button>
                            <button className="dash-prof-btn dash-prof-btn-primary" id="prof-save-btn" onClick={async () => {
                              const btn = document.getElementById('prof-save-btn')
                              if (btn) btn.classList.add('dash-prof-btn-loading')
                              const nom = document.getElementById('prof-nom')?.value?.trim() || getFieldValue('Nom')
                              const prenom = document.getElementById('prof-prenom')?.value?.trim() || getFieldValue('Prénom')
                              const sexe = document.getElementById('prof-sexe')?.value || getFieldValue('Sexe')
                              const dateNaiss = document.getElementById('prof-dob')?.value || getFieldValue('Date de naissance')
                              const nationalite = document.getElementById('prof-nationalite')?.value || getFieldValue('Nationalité')
                              const adresse = document.getElementById('prof-address')?.value?.trim() || getFieldValue("Adresse d'origine")
                              const uid = editingChild ? editingChild.uid : uidRef.current
                              const photoData = localStorage.getItem('cdo_child_photo_' + uid)
                              const hasPhoto = !!photoData

                              let url = `${API}/enfants/`
                              let method = 'POST'
                              if (editingChild) { url = `${API}/enfants/${editingChild.id}/`; method = 'PUT' }
                              let token = localStorage.getItem('access_token')
                              if (!token) { if (btn) btn.classList.remove('dash-prof-btn-loading'); alert('Session expirée'); return }

                              const dataToFile = (dataurl, name) => {
                                const arr = dataurl.split(',')
                                const mime = arr[0].match(/:(.*?);/)[1]
                                const bstr = atob(arr[1])
                                let n = bstr.length
                                const u8arr = new Uint8Array(n)
                                while (n--) u8arr[n] = bstr.charCodeAt(n)
                                return new File([u8arr], name, { type: mime })
                              }

                              let body, headers
                              const mappedSexe = sexe === 'Masculin' ? 'M' : sexe === 'Féminin' ? 'F' : ''
                              if (hasPhoto) {
                                const fd = new FormData()
                                if (uid) fd.append('uid', String(uid))
                                if (nom) fd.append('nom', String(nom))
                                if (prenom) fd.append('prenom', String(prenom))
                                if (mappedSexe) fd.append('sexe', mappedSexe)
                                if (dateNaiss) fd.append('date_naissance', dateNaiss)
                                if (nationalite) fd.append('nationalite', String(nationalite))
                                if (adresse) fd.append('adresse', String(adresse))
                                fd.append('photo', dataToFile(photoData, 'photo.jpg'))
                                fd.append('extra_data', JSON.stringify(editingChild ? editingChild.extra_data || {} : {}))
                                body = fd
                                headers = { Authorization: `Bearer ${token}` }
                              } else {
                                body = JSON.stringify({
                                  ...(uid ? { uid } : {}),
                                  ...(nom ? { nom } : {}),
                                  ...(prenom ? { prenom } : {}),
                                  ...(mappedSexe ? { sexe: mappedSexe } : {}),
                                  ...(dateNaiss ? { date_naissance: dateNaiss } : {}),
                                  ...(nationalite ? { nationalite } : {}),
                                  ...(adresse ? { adresse } : {}),
                                  extra_data: editingChild ? editingChild.extra_data || {} : {},
                                })
                                headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                              }

                              try {
                                let res = await fetch(url, { method, headers, body })
                                if (res.status === 401) {
                                  const refresh = localStorage.getItem('refresh_token')
                                  if (!refresh) throw new Error('Session expirée')
                                  const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                                  if (!refRes.ok) throw new Error('Session expirée')
                                  const tokens = await refRes.json()
                                  localStorage.setItem('access_token', tokens.access)
                                  headers.Authorization = `Bearer ${tokens.access}`
                                  res = await fetch(url, { method, headers, body })
                                }
                                if (!res.ok) {
                                  const errData = await res.json().catch(() => ({}))
                                  const errMsg = errData.error || Object.values(errData).flat().join(' ') || 'Erreur sauvegarde'
                                  throw new Error(errMsg)
                                }
                                const saved = await res.json()
                                setRegisteredChildren(prev => prev.some(c => c.id === saved.id) ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved])
                                if (btn) btn.classList.remove('dash-prof-btn-loading')
                                setSelectedRegChild(saved); setActiveKey('enfants-enregistres'); setSubKey(null)
                                setEditingChild(saved)
                                migratePhoto(uidRef.current, saved.uid); uidRef.current = saved.uid
                              } catch (e) {
                                if (method === 'POST' && e.message?.includes('dupliquée')) {
                                  uidRef.current = genChildUid()
                                  const newBody = hasPhoto
                                    ? (() => { const f = new FormData(); f.append('uid', uidRef.current); for (const [k,v] of body.entries()) if (k !== 'uid') f.append(k,v); return f })()
                                    : { ...JSON.parse(body), uid: uidRef.current }
                                  try {
                                    let retry = await fetch(`${API}/enfants/`, { method: 'POST', headers: hasPhoto ? { Authorization: `Bearer ${localStorage.getItem('access_token')}` } : { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` }, body: newBody })
                                    if (retry.ok) {
                                      const saved = await retry.json()
                                      setRegisteredChildren(prev => [...prev, saved])
                                      if (btn) btn.classList.remove('dash-prof-btn-loading')
                                      setSelectedRegChild(saved); setActiveKey('enfants-enregistres'); setSubKey(null); migratePhoto(uidRef.current, saved.uid); uidRef.current = saved.uid
                                      return
                                    }
                                  } catch (_) {}
                                }
                                if (btn) btn.classList.remove('dash-prof-btn-loading')
                                alert(e.message || 'Erreur lors de l\'enregistrement')
                              }
                            }}>
                              <span className="dash-prof-btn-label">{t('form_save') || 'Enregistrer'}</span>
                              <span className="dash-prof-btn-spinner">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="dash-prof-side-col">
                          <div className="dash-prof-identity-card">
                            <div className="dash-prof-id-avatar" onClick={() => document.getElementById('prof-photo-input')?.click()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('prof-photo-input')?.click() }} tabIndex={0} role="button" aria-label={t('prof_upload_photo') || 'Changer la photo'} style={{cursor:'pointer'}} title={t('prof_click_upload') || 'Cliquez pour changer la photo'}>
                              {(() => {
                                const uid = editingChild ? editingChild.uid : uidRef.current
                                const saved = localStorage.getItem('cdo_child_photo_' + uid)
                                if (saved) return <img src={saved} alt="" className="dash-prof-id-img" />
                                 const domP = document.getElementById('prof-prenom')?.value
                                 const domN = document.getElementById('prof-nom')?.value
                                 const p = domP || getFieldValue('Prénom') || ''
                                 const n = domN || getFieldValue('Nom') || ''
                                 const inits = ((p?.[0] || '') + (n?.[0] || '')).toUpperCase() || '?'
                                const colors = ['#f59e0b','#22c55e','#a855f7','#3b82f6','#ef4444','#ec4899','#14b8a6']
                                const c = colors[(inits.charCodeAt(0) || 0) % colors.length]
                                return <div className="dash-prof-id-inits" style={{ background: c }}>{inits}</div>
                              })()}
                              <span className="dash-prof-id-badge">{'\u2713'} {t('prof_active') || 'Profil Actif'}</span>
                            </div>
                          <div className="dash-prof-id-body">
                            <h3 className="dash-prof-id-name">{(() => { const dp = document.getElementById('prof-prenom')?.value; const dn = document.getElementById('prof-nom')?.value; return (dp || getFieldValue('Prénom') || 'Prénom') + ' ' + (dn || getFieldValue('Nom') || 'Nom') })()}</h3>
                            <div className="dash-prof-id-field">
                              <span className="dash-prof-id-label">{t('form_unique_id') || 'ID Unique'}</span>
                              <span className="dash-prof-id-value">{editingChild ? editingChild.uid : uidRef.current}</span>
                            </div>
                            <div className="dash-prof-id-field">
                              <span className="dash-prof-id-label">{t('form_nationality') || 'Nationalité'}</span>
                              <span className="dash-prof-id-value">{(() => {
                                const domNat = document.getElementById('prof-nationalite')?.value
                                const nat = domNat || getFieldValue('Nationalité')
                                if (!nat) return '—'
                                const c = AFRICAN_COUNTRIES.find(c => c.name === nat)
                                return c ? <>{flagImg(c.code, c.name, '18px')} {c.name}</> : nat
                              })()}</span>
                            </div>
                            <div className="dash-prof-id-field">
                              <span className="dash-prof-id-label">{t('form_age') || 'Âge'}</span>
                              <span className="dash-prof-id-value" id="prof-age-display">{(() => {
                                const dob = getFieldValue('Date de naissance')
                                if (!dob) return '—'
                                const bd = new Date(dob)
                                const today = new Date()
                                let age = today.getFullYear() - bd.getFullYear()
                                const m = today.getMonth() - bd.getMonth()
                                if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--
                                return age + ' ' + (t('prof_years') || 'ans')
                              })()}</span>
                            </div>
                          </div>
                          <div className="dash-prof-id-footer">
                            <div className="dash-prof-id-uid-box">
                              <span className="dash-prof-id-uid-label">{t('form_unique_id') || 'ID UNIQUE'}</span>
                              <span className="dash-prof-id-uid-code">{editingChild ? editingChild.uid : uidRef.current}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : subKey && activeKey === 'enfants' && subKey === 'Situation familiale' ? (
                  <div className="dash-fam-wrap">
                    <div className="dash-fam-header">
                      <button className="dash-fam-back" onClick={() => setSubKey(null)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                        {t('form_back') || 'Retour'}
                      </button>
                      <h2 className="dash-fam-title">{t('form_famille_title') || 'Situation familiale'}</h2>
                    </div>
                    <div className="dash-fam-card">
                      <div className="dash-fam-field">
                        <label className="dash-fam-label" htmlFor="fam-parents">{t('form_famille_parents') || 'Parents connus'}</label>
                        <select id="fam-parents" className="dash-fam-select" defaultValue={getFieldValue('Parents connus')}>
                          <option value="">{t('form_select_placeholder') || 'Sélectionner...'}</option>
                          <option value="Oui">{t('form_famille_oui') || 'Oui'}</option>
                          <option value="Non">{t('form_famille_non') || 'Non'}</option>
                          <option value="Non renseigné">{t('form_famille_nr') || 'Non renseigné'}</option>
                        </select>
                        <svg className="dash-fam-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                      <div className="dash-fam-field">
                        <label className="dash-fam-label" htmlFor="fam-tuteurs">{t('form_famille_tuteurs') || 'Tuteurs'}</label>
                        <input id="fam-tuteurs" type="text" className="dash-fam-input" defaultValue={getFieldValue('Tuteurs')} placeholder={t('form_famille_tuteurs_placeholder') || 'Nom et prénom des tuteurs légaux'} />
                      </div>
                      <div className="dash-fam-field">
                        <label className="dash-fam-label" htmlFor="fam-fratrie">{t('form_famille_fratrie') || 'Fratrie'}</label>
                        <textarea id="fam-fratrie" className="dash-fam-textarea" rows={4} defaultValue={getFieldValue('Fratrie')} placeholder={t('form_famille_fratrie_placeholder') || 'Noms, âges et informations des frères et sœurs'} />
                      </div>
                      <div className="dash-fam-field">
                        <label className="dash-fam-label" htmlFor="fam-historique">{t('form_famille_historique') || 'Historique familial'}</label>
                        <textarea id="fam-historique" className="dash-fam-textarea" rows={4} defaultValue={getFieldValue('Historique familial')} placeholder={t('form_famille_historique_placeholder') || 'Antécédents familiaux, événements marquants...'} />
                      </div>
                      <div className="dash-fam-actions">
                        <button className="dash-fam-btn dash-fam-btn-primary" id="fam-save-btn" onClick={async () => {
                          const btn = document.getElementById('fam-save-btn')
                          if (btn) btn.classList.add('dash-fam-btn-loading')
                          const parents = document.getElementById('fam-parents')?.value || getFieldValue('Parents connus')
                          const tuteurs = document.getElementById('fam-tuteurs')?.value?.trim() || getFieldValue('Tuteurs')
                          const fratrie = document.getElementById('fam-fratrie')?.value?.trim() || getFieldValue('Fratrie')
                          const historique = document.getElementById('fam-historique')?.value?.trim() || getFieldValue('Historique familial')
                          const uid = editingChild ? editingChild.uid : uidRef.current
                          const body = {
                            uid,
                            nom: editingChild?.nom || '',
                            prenom: editingChild?.prenom || '',
                            extra_data: editingChild ? { ...editingChild.extra_data, 'Parents connus': parents, 'Tuteurs': tuteurs, 'Fratrie': fratrie, 'Historique familial': historique } : { 'Parents connus': parents, 'Tuteurs': tuteurs, 'Fratrie': fratrie, 'Historique familial': historique },
                          }
                          let url = `${API}/enfants/`
                          let method = 'POST'
                          if (editingChild) { url = `${API}/enfants/${editingChild.id}/`; method = 'PUT' }
                          let token = localStorage.getItem('access_token')
                          if (!token) { if (btn) btn.classList.remove('dash-fam-btn-loading'); alert('Session expirée'); return }
                          try {
                            let res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
                            if (res.status === 401) {
                              const refresh = localStorage.getItem('refresh_token')
                              if (!refresh) throw new Error('Session expirée')
                              const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                              if (!refRes.ok) throw new Error('Session expirée')
                              const tokens = await refRes.json()
                              localStorage.setItem('access_token', tokens.access)
                              res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access}` }, body: JSON.stringify(body) })
                            }
                            if (!res.ok) { const errData = await res.json().catch(() => ({})); const errMsg = errData.error || Object.values(errData).flat().join(' ') || 'Erreur sauvegarde'; throw new Error(errMsg) }
                            const saved = await res.json()
                            setRegisteredChildren(prev => prev.some(c => c.id === saved.id) ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved])
                            if (btn) btn.classList.remove('dash-fam-btn-loading')
                            setSelectedRegChild(saved); setActiveKey('enfants-enregistres'); setSubKey(null); migratePhoto(uidRef.current, saved.uid); uidRef.current = saved.uid
                          } catch (e) {
                            if (method === 'POST' && e.message?.includes('dupliquée')) {
                              uidRef.current = genChildUid(); body.uid = uidRef.current
                              try {
                                let retry = await fetch(`${API}/enfants/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` }, body: JSON.stringify(body) })
                                if (retry.ok) { const saved = await retry.json(); setRegisteredChildren(prev => [...prev, saved]); if (btn) btn.classList.remove('dash-fam-btn-loading'); setSelectedRegChild(saved); setActiveKey('enfants-enregistres'); setSubKey(null); setEditingChild(saved); migratePhoto(uidRef.current, saved.uid); uidRef.current = saved.uid; return }
                              } catch (_) {}
                            }
                            if (btn) btn.classList.remove('dash-fam-btn-loading')
                            alert(e.message || 'Erreur lors de l\'enregistrement')
                          }
                        }}>
                          <span className="dash-fam-btn-label">{t('form_save') || 'Enregistrer'}</span>
                          <span className="dash-fam-btn-spinner">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : subKey && activeKey === 'enfants' && subKey === 'Documents administratifs' ? (
                  <div className="dash-docs-wrap">
                    <div className="dash-docs-header">
                      <button className="dash-docs-back" onClick={() => setSubKey(null)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                        {t('form_back') || 'Retour'}
                      </button>
                      <span className="dash-docs-breadcrumb">{t('form_profil_title') || 'Profil complet'}</span>
                    </div>
                    <h2 className="dash-docs-title">{t('form_docs_title') || 'Documents administratifs'}</h2>
                    <div className="dash-docs-cards">
                      {['form_docs_naissance', 'form_docs_identite', 'form_docs_judiciaires'].map((key, i) => {
                        const label = t(key) || CHILD_FORMS['Documents administratifs']?.fields[i]?.label || ''
                        const fieldKey = label
                        const uid = editingChild ? editingChild.uid : uidRef.current
                        const savedDoc = localStorage.getItem('cdo_doc_' + uid + '_' + fieldKey)
                        return (
                          <div key={i} className="dash-docs-card">
                            <div className="dash-docs-card-header">
                              <span className="dash-docs-card-num">0{i + 1}</span>
                              <span className="dash-docs-card-label">{label}</span>
                            </div>
                            <div className="dash-docs-dropzone" id={'dash-docs-zone-' + i} onClick={() => document.getElementById('dash-docs-input-' + i)?.click()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('dash-docs-input-' + i)?.click() }} tabIndex={0} role="button" aria-label={t('form_docs_upload') || 'Télécharger un document'}>
                              <input id={'dash-docs-input-' + i} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const zone = document.getElementById('dash-docs-zone-' + i)
                                const reader = new FileReader()
                                reader.onload = (ev) => {
                                  localStorage.setItem('cdo_doc_' + uid + '_' + fieldKey, ev.target.result)
                                  if (zone) zone.classList.add('dash-docs-dropzone-has-file')
                                }
                                reader.readAsDataURL(file)
                              }} />
                              {savedDoc ? (
                                <div className="dash-docs-file-preview">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                  <span className="dash-docs-file-name">{t('form_docs_file_added') || 'Document ajouté'}</span>
                                  <button className="dash-docs-file-remove" onClick={e => { e.stopPropagation(); localStorage.removeItem('cdo_doc_' + uid + '_' + fieldKey); const zone = document.getElementById('dash-docs-zone-' + i); if (zone) zone.classList.remove('dash-docs-dropzone-has-file'); }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="dash-docs-dropzone-content">
                                  <div className="dash-docs-dropzone-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                  </div>
                                  <p className="dash-docs-dropzone-text">{t('form_docs_drag_drop') || 'Glissez-déposez ou cliquez'}</p>
                                  <span className="dash-docs-dropzone-hint">{t('form_docs_formats') || 'PDF, JPG, PNG — 10 Mo max'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="dash-docs-actions">
                      <button className="dash-docs-btn dash-docs-btn-primary" onClick={async () => {
                        const btn = document.getElementById('dash-docs-submit')
                        if (btn) btn.classList.add('dash-docs-btn-loading')
                        const uid = editingChild ? editingChild.uid : uidRef.current
                        const docs = {}
                        CHILD_FORMS['Documents administratifs']?.fields.forEach(f => {
                          const val = localStorage.getItem('cdo_doc_' + uid + '_' + f.label)
                          if (val) docs[f.label] = val
                        })
                        const extra_data = editingChild ? { ...editingChild.extra_data, documents: docs } : { documents: docs }
                        const token = localStorage.getItem('access_token')
                        if (!token) { if (btn) btn.classList.remove('dash-docs-btn-loading'); alert('Session expirée'); return }
                        try {
                          let url = `${API}/enfants/`
                          let method = 'POST'
                          if (editingChild) { url = `${API}/enfants/${editingChild.id}/`; method = 'PUT' }
                          const body = JSON.stringify({ uid, extra_data })
                          let res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body })
                          if (res.status === 401) {
                            const refresh = localStorage.getItem('refresh_token')
                            if (!refresh) throw new Error('Session expirée')
                            const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                            if (!refRes.ok) throw new Error('Session expirée')
                            const tokens = await refRes.json()
                            localStorage.setItem('access_token', tokens.access)
                            res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access}` }, body })
                          }
                          if (!res.ok) throw new Error('Erreur')
                          const saved = await res.json()
                          setRegisteredChildren(prev => prev.some(c => c.id === saved.id) ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved])
                          if (btn) btn.classList.remove('dash-docs-btn-loading')
                          setSelectedRegChild(saved); setActiveKey('enfants-enregistres'); setSubKey(null); migratePhoto(uidRef.current, saved.uid); uidRef.current = saved.uid
                        } catch (e) {
                          if (btn) btn.classList.remove('dash-docs-btn-loading')
                          alert(e.message || 'Erreur lors de l\'enregistrement')
                        }
                      }} id="dash-docs-submit">
                        <span className="dash-docs-btn-label">{t('form_save') || 'Enregistrer'}</span>
                        <span className="dash-docs-btn-spinner">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                        </span>
                      </button>
                    </div>
                  </div>
                ) : subKey && activeKey === 'enfants' ? (
                  <div className="dash-sub-form">
                    <div className="dash-sub-form-top">
                      <button className="dash-back-btn" onClick={() => { setSubKey(null); }}>{'\u2190'} {t('form_back')}</button>
                      <h3 className="dash-sub-form-title">{subKey}</h3>
                    </div>
                    <div className="dash-sub-form-fields">
                      {subKey === 'Santé & médical' ? (
                        <div className="hm-form">
                          {/* ═══ MEDICAL ALERTS BAR ═══ */}
                          <div className="hm-alerts">
                            <div className="hm-alert critical"><span className="hm-alert-icon">🔴</span><span className="hm-alert-text">{t('hm_alerts_critical') || 'Conditions Critiques'}</span><span className="hm-alert-count">0</span></div>
                            <div className="hm-alert warning"><span className="hm-alert-icon">🟡</span><span className="hm-alert-text">{t('hm_alerts_allergies') || 'Allergies Sévères'}</span><span className="hm-alert-count">{allergies.filter(a => a.severity === 'severe').length}</span></div>
                            <div className="hm-alert info"><span className="hm-alert-icon">🔵</span><span className="hm-alert-text">{t('hm_alerts_medications') || 'Médicaments Actifs'}</span><span className="hm-alert-count">{treatments.filter(t => t.name).length}</span></div>
                          </div>

                          {/* ═══ 1. HEALTH SUMMARY ═══ */}
                          <div className="hm-summary">
                            <div className="hm-summary-avatar">{(() => { const uid = editingChild ? editingChild.uid : uidRef.current; const s = localStorage.getItem('cdo_child_photo_' + uid); if (s) return <img src={s} alt="" style={{width:'56px',height:'56px',borderRadius:'14px',objectFit:'cover'}} />; const inits = ((getFieldValue('Prénom')?.[0]||'')+(getFieldValue('Nom')?.[0]||'')).toUpperCase()||'?'; return inits })()}</div>
                            <div className="hm-summary-info">
                              <div className="hm-summary-name">{getFieldValue('Prénom') || 'Prénom'} {getFieldValue('Nom') || 'Nom'}</div>
                              <div className="hm-summary-meta">
                                <span>🆔 {editingChild ? editingChild.uid : uidRef.current}</span>
                                <span>🎂 {(() => { const d = getFieldValue('Date de naissance'); if (!d) return '—'; const a = Math.floor((new Date()-new Date(d))/(365.25*86400000)); return a+' '+(t('prof_years')||'ans') })()}</span>
                                <span>⚤ {getFieldValue('Sexe') === 'Masculin' ? 'M' : getFieldValue('Sexe') === 'Féminin' ? 'F' : '—'}</span>
                              </div>
                            </div>
                            <div className="hm-summary-right">
                              <select className="hm-summary-blood" defaultValue={getFieldValue('Groupe sanguin') || ''} onChange={e => e.target.dataset.val = e.target.value}>
                                <option value="">—</option>
                                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                              <span className="hm-summary-badge good">✅ {t('hm_health_good') || 'Bon'}</span>
                            </div>
                          </div>

                          {/* ═══ 2. VITAL SIGNS ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(59,130,246,0.15)'}}>❤️</div>
                              <span className="hm-card-title">{t('hm_vitals') || 'Signes Vitaux'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="hm-vitals">
                                <div className="hm-vital">
                                  <div className="hm-vital-icon">📏</div>
                                  <input className="hm-vital-input" type="number" step="0.1" placeholder="Taille" defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.height || '' })()} id="hm-height" />
                                  <div className="hm-vital-label">{t('hm_height') || 'Taille (cm)'}</div>
                                </div>
                                <div className="hm-vital">
                                  <div className="hm-vital-icon">⚖️</div>
                                  <input className="hm-vital-input" type="number" step="0.1" placeholder="Poids" defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.weight || '' })()} id="hm-weight" onInput={e => { const h = document.getElementById('hm-height')?.value; const w = e.target.value; if (h && w) { const bmi = (parseFloat(w) / ((parseFloat(h)/100)**2)).toFixed(1); const el = document.getElementById('hm-bmi-display'); if (el) el.textContent = bmi } }} />
                                  <div className="hm-vital-label">{t('hm_weight') || 'Poids (kg)'}</div>
                                </div>
                                <div className="hm-vital">
                                  <div className="hm-vital-icon">📊</div>
                                  <div className="hm-vital-value" id="hm-bmi-display">{(() => { const m = editingChild?.extra_data?.medical; return m?.bmi || '—' })()}</div>
                                  <div className="hm-vital-label">{t('hm_bmi') || 'IMC'} <span style={{fontSize:'10px',color:'#64748B'}}>({t('hm_bmi_calc') || 'auto'})</span></div>
                                </div>
                                <div className="hm-vital">
                                  <div className="hm-vital-icon">🩸</div>
                                  <input className="hm-vital-input" type="text" placeholder="120/80" defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.bloodPressure || '' })()} id="hm-bp" />
                                  <div className="hm-vital-label">{t('hm_blood_pressure') || 'Tension'}</div>
                                </div>
                                <div className="hm-vital">
                                  <div className="hm-vital-icon">💓</div>
                                  <input className="hm-vital-input" type="number" placeholder="72" defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.heartRate || '' })()} id="hm-hr" />
                                  <div className="hm-vital-label">{t('hm_heart_rate') || 'FC (bpm)'}</div>
                                </div>
                                <div className="hm-vital">
                                  <div className="hm-vital-icon">🌡️</div>
                                  <input className="hm-vital-input" type="number" step="0.1" placeholder="36.6" defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.temperature || '' })()} id="hm-temp" />
                                  <div className="hm-vital-label">{t('hm_temperature') || 'Temp. (°C)'}</div>
                                </div>
                                <div className="hm-vital">
                                  <div className="hm-vital-icon">🫁</div>
                                  <input className="hm-vital-input" type="number" placeholder="98" defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.spo2 || '' })()} id="hm-spo2" />
                                  <div className="hm-vital-label">{t('hm_spo2') || 'SpO₂ (%)'}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ═══ 3. MEDICAL HISTORY ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(168,85,247,0.15)'}}>📋</div>
                              <span className="hm-card-title">{t('hm_medical_history') || 'Antécédents Médicaux'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="hm-grid-2">
                                <div className="hm-field">
                                  <label className="hm-field-label">{t('hm_chronic') || 'Maladies Chroniques'}</label>
                                  <textarea rows={2} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.chronic || '' })()} id="hm-chronic" placeholder="Ex: Asthme, diabète..." />
                                </div>
                                <div className="hm-field">
                                  <label className="hm-field-label">{t('hm_surgeries') || 'Chirurgies Antérieures'}</label>
                                  <textarea rows={2} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.surgeries || '' })()} id="hm-surgeries" placeholder="Ex: Appendicectomie 2020..." />
                                </div>
                                <div className="hm-field">
                                  <label className="hm-field-label">{t('hm_hospitalization') || 'Hospitalisations'}</label>
                                  <textarea rows={2} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.hospitalization || '' })()} id="hm-hospitalization" placeholder="Ex: Paludisme sévère 2021..." />
                                </div>
                                <div className="hm-field">
                                  <label className="hm-field-label">{t('hm_family_history') || 'Antécédents Familiaux'}</label>
                                  <textarea rows={2} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.familyHistory || '' })()} id="hm-family" placeholder="Ex: Hypertension, diabète..." />
                                </div>
                                <div className="hm-field">
                                  <label className="hm-field-label">{t('hm_disabilities') || 'Handicaps'}</label>
                                  <textarea rows={2} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.disabilities || '' })()} id="hm-disabilities" placeholder="Ex: Aucun" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ═══ 4. VACCINATION MANAGEMENT ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(34,197,94,0.15)'}}>💉</div>
                              <span className="hm-card-title">{t('hm_vaccinations') || 'Vaccinations'}</span>
                              <span className="hm-card-badge">{vaccinations.filter(v => v.done).length}/{vaccinations.length}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="hm-vax-progress">
                                <div className="hm-vax-progress-bar"><div className="hm-vax-progress-fill" style={{width:`${vaccinations.length ? Math.round(vaccinations.filter(v=>v.done).length/vaccinations.length*100) : 0}%`}} /></div>
                                <div className="hm-vax-progress-label"><span>{t('hm_vax_progress') || 'Progrès Vaccinal'}</span><span>{vaccinations.filter(v=>v.done).length}/{vaccinations.length}</span></div>
                              </div>
                              <div className="hm-vax-list">
                                {vaccinations.map((v, i) => (
                                  <div key={i} className="hm-vax-item">
                                    <button className={`hm-vax-check${v.done ? ' done' : ''}`} onClick={() => { const nxt = [...vaccinations]; nxt[i] = {...nxt[i], done: !nxt[i].done }; setVaccinations(nxt) }}>{v.done ? '✓' : ''}</button>
                                    <span className="hm-vax-name">{v.name}</span>
                                    <input type="date" className="hm-vax-date" style={{background:'transparent',border:'none',color:'#F1F5F9',fontSize:'11px',outline:'none',width:'120px'}} value={v.dateAdmin} onChange={e => { const nxt = [...vaccinations]; nxt[i] = {...nxt[i], dateAdmin: e.target.value }; setVaccinations(nxt) }} />
                                    <input type="date" className="hm-vax-next" style={{background:'transparent',border:'none',color:'#f59e0b',fontSize:'11px',outline:'none',width:'120px'}} value={v.nextDose} onChange={e => { const nxt = [...vaccinations]; nxt[i] = {...nxt[i], nextDose: e.target.value }; setVaccinations(nxt) }} />
                                    <span className="hm-vax-upload" onClick={() => document.getElementById('hm-vax-upload-' + i)?.click()} title={t('hm_upload_card') || 'Importer Carte'}>📎</span>
                                    <input id={'hm-vax-upload-' + i} type="file" accept="image/*,.pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => { const uid = editingChild ? editingChild.uid : uidRef.current; localStorage.setItem('cdo_vax_' + uid + '_' + i, ev.target.result) }; r.readAsDataURL(f) } }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* ═══ 5. ALLERGIES ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(239,68,68,0.15)'}}>⚠️</div>
                              <span className="hm-card-title">{t('hm_allergies') || 'Allergies'}</span>
                              <span className="hm-card-badge">{allergies.length}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              {allergies.map((a, i) => (
                                <div key={i} className="hm-allergy">
                                  <span className="hm-allergy-icon">{a.type === 'food' ? '🍽️' : a.type === 'drug' ? '💊' : '🌿'}</span>
                                  <div className="hm-allergy-info">
                                    <span className="hm-allergy-name">{a.name || 'Allergie'}</span>
                                    {a.reaction && <span className="hm-allergy-notes">{a.reaction}</span>}
                                  </div>
                                  <span className={`hm-allergy-sev ${a.severity || 'mild'}`}>{a.severity === 'severe' ? (t('hm_severity_severe')||'Sévère') : a.severity === 'moderate' ? (t('hm_severity_moderate')||'Modéré') : (t('hm_severity_mild')||'Léger')}</span>
                                  <span className="hm-allergy-del" onClick={() => setAllergies(allergies.filter((_,j) => j !== i))}>✕</span>
                                </div>
                              ))}
                              {showAllergyForm ? (
                                <div className="hm-inline-form">
                                  <select id="hm- allergy-type" defaultValue="food">
                                    <option value="food">{t('hm_food_allergy') || 'Alimentaire'}</option>
                                    <option value="drug">{t('hm_drug_allergy') || 'Médicamenteuse'}</option>
                                    <option value="env">{t('hm_env_allergy') || 'Environnementale'}</option>
                                  </select>
                                  <input id="hm-allergy-name" placeholder="Nom" style={{flex:1}} />
                                  <select id="hm-allergy-sev" defaultValue="mild">
                                    <option value="mild">{t('hm_severity_mild') || 'Léger'}</option>
                                    <option value="moderate">{t('hm_severity_moderate') || 'Modéré'}</option>
                                    <option value="severe">{t('hm_severity_severe') || 'Sévère'}</option>
                                  </select>
                                  <input id="hm-allergy-reaction" placeholder={t('hm_reaction') || 'Réaction'} style={{flex:1}} />
                                  <button className="hm-inline-confirm" onClick={() => { const name = document.getElementById('hm-allergy-name')?.value?.trim(); if (!name) return; setAllergies([...allergies, { type: document.getElementById('hm- allergy-type')?.value || 'food', name, severity: document.getElementById('hm-allergy-sev')?.value || 'mild', reaction: document.getElementById('hm-allergy-reaction')?.value || '' }]); setShowAllergyForm(false) }}>✓</button>
                                  <button className="hm-inline-cancel" onClick={() => setShowAllergyForm(false)}>✕</button>
                                </div>
                              ) : (
                                <button className="hm-add-btn" onClick={() => setShowAllergyForm(true)}>+ {t('hm_add') || 'Ajouter'}</button>
                              )}
                            </div>
                          </div>

                          {/* ═══ 6. TREATMENTS & MEDICATIONS ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(59,130,246,0.15)'}}>💊</div>
                              <span className="hm-card-title">{t('hm_treatments') || 'Traitements'}</span>
                              <span className="hm-card-badge">{treatments.filter(t => t.name).length}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              {treatments.filter(t => t.name).map((tx, i) => (
                                <div key={i} className="hm-tx-item">
                                  <div className="hm-tx-info">
                                    <span className="hm-tx-name">{tx.name}</span>
                                    <span className="hm-tx-detail">{tx.dosage} — {tx.frequency}</span>
                                  </div>
                                  <span className="hm-tx-badge">{tx.startDate || '—'}</span>
                                  <span className="hm-tx-badge" style={{background:'rgba(239,68,68,0.12)',color:'#ef4444'}}>{tx.endDate || '—'}</span>
                                  <span style={{fontSize:'11px',color:'#64748B'}}>{tx.doctor || ''}</span>
                                  <span className="hm-allergy-del" onClick={() => setTreatments(treatments.filter((_,j) => j !== i))}>✕</span>
                                </div>
                              ))}
                              {showTxForm ? (
                                <div className="hm-inline-form" style={{flexWrap:'wrap'}}>
                                  <input id="hm-tx-name" placeholder={t('hm_medication') || 'Médicament'} style={{flex:1,minWidth:'100px'}} />
                                  <input id="hm-tx-dosage" placeholder={t('hm_dosage') || 'Posologie'} style={{width:'80px'}} />
                                  <input id="hm-tx-freq" placeholder={t('hm_frequency') || 'Fréquence'} style={{width:'100px'}} />
                                  <input id="hm-tx-start" type="date" style={{width:'110px'}} />
                                  <input id="hm-tx-end" type="date" style={{width:'110px'}} />
                                  <input id="hm-tx-doc" placeholder={t('hm_prescribing_doc') || 'Médecin'} style={{flex:1,minWidth:'100px'}} />
                                  <button className="hm-inline-confirm" onClick={() => { const name = document.getElementById('hm-tx-name')?.value?.trim(); if (!name) return; setTreatments([...treatments, { name, dosage: document.getElementById('hm-tx-dosage')?.value || '', frequency: document.getElementById('hm-tx-freq')?.value || '', startDate: document.getElementById('hm-tx-start')?.value || '', endDate: document.getElementById('hm-tx-end')?.value || '', doctor: document.getElementById('hm-tx-doc')?.value || '' }]); setShowTxForm(false) }}>✓</button>
                                  <button className="hm-inline-cancel" onClick={() => setShowTxForm(false)}>✕</button>
                                </div>
                              ) : (
                                <button className="hm-add-btn" onClick={() => setShowTxForm(true)}>+ {t('hm_add') || 'Ajouter'}</button>
                              )}
                            </div>
                          </div>

                          {/* ═══ 7. EMERGENCY INFORMATION ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(245,158,11,0.15)'}}>🆘</div>
                              <span className="hm-card-title">{t('hm_emergency') || 'Urgence'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="hm-emerg">
                                <div className="hm-emerg-item">
                                  <span className="hm-emerg-label">{t('hm_emergency_contact') || 'Contact Urgence'}</span>
                                  <span className="hm-emerg-value"><input style={{background:'transparent',border:'none',color:'#F1F5F9',fontSize:'13px',width:'100%',outline:'none',padding:0}} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.emergencyContact || '' })()} id="hm-ec" placeholder="Nom et téléphone" /></span>
                                </div>
                                <div className="hm-emerg-item">
                                  <span className="hm-emerg-label">{t('hm_primary_doc') || 'Médecin Traitant'}</span>
                                  <span className="hm-emerg-value"><input style={{background:'transparent',border:'none',color:'#F1F5F9',fontSize:'13px',width:'100%',outline:'none',padding:0}} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.primaryDoctor || '' })()} id="hm-pd" placeholder="Dr. Nom" /></span>
                                </div>
                                <div className="hm-emerg-item">
                                  <span className="hm-emerg-label">{t('hm_hospital') || 'Hôpital'}</span>
                                  <span className="hm-emerg-value"><input style={{background:'transparent',border:'none',color:'#F1F5F9',fontSize:'13px',width:'100%',outline:'none',padding:0}} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.hospital || '' })()} id="hm-hosp" placeholder="Hôpital de référence" /></span>
                                </div>
                                <div className="hm-emerg-item">
                                  <span className="hm-emerg-label">{t('hm_insurance') || 'Assurance'}</span>
                                  <span className="hm-emerg-value"><input style={{background:'transparent',border:'none',color:'#F1F5F9',fontSize:'13px',width:'100%',outline:'none',padding:0}} defaultValue={(() => { const m = editingChild?.extra_data?.medical; return m?.insurance || '' })()} id="hm-ins" placeholder="N° police" /></span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ═══ 8. MEDICAL DOCUMENTS ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(99,102,241,0.15)'}}>📄</div>
                              <span className="hm-card-title">{t('hm_documents') || 'Documents Médicaux'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="hm-docs">
                                {[
                                  { id:'presc', icon:'📝', label: t('hm_upload_prescription') || 'Prescriptions' },
                                  { id:'reports', icon:'📊', label: t('hm_upload_report') || 'Rapports' },
                                  { id:'lab', icon:'🔬', label: t('hm_upload_lab') || 'Labo' },
                                ].map(doc => {
                                  const uid = editingChild ? editingChild.uid : uidRef.current
                                  const saved = localStorage.getItem('cdo_meddoc_' + uid + '_' + doc.id)
                                  return (
                                    <div key={doc.id} className={`hm-doc-zone${saved ? ' has' : ''}`} onClick={() => document.getElementById('hm-md-' + doc.id)?.click()}>
                                      <div className="hm-doc-icon">{doc.icon}</div>
                                      <span className="hm-doc-label">{doc.label}</span>
                                      {saved ? <span className="hm-doc-name">✓ Fichier importé</span> : <span style={{fontSize:'10px',color:'#475569'}}>Cliquez pour uploader</span>}
                                      {saved && <span className="hm-doc-remove" onClick={e => { e.stopPropagation(); localStorage.removeItem('cdo_meddoc_' + uid + '_' + doc.id); setSavingHealth(v => !v) }}>Supprimer</span>}
                                      <input id={'hm-md-' + doc.id} type="file" accept="image/*,.pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => { localStorage.setItem('cdo_meddoc_' + uid + '_' + doc.id, ev.target.result); setSavingHealth(v => !v) }; r.readAsDataURL(f) } }} />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          {/* ═══ SAVE BUTTON ═══ */}
                          <div className="hm-save-row">
                            <button className={`hm-save-btn${savingHealth ? ' loading' : ''}`} onClick={async () => {
                              setSavingHealth(true)
                              const m = editingChild?.extra_data?.medical || {}
                              const medical = {
                                bloodGroup: document.querySelector('.hm-summary-blood')?.value || m.bloodGroup || '',
                                height: document.getElementById('hm-height')?.value || m.height || '',
                                weight: document.getElementById('hm-weight')?.value || m.weight || '',
                                bmi: document.getElementById('hm-bmi-display')?.textContent || m.bmi || '',
                                bloodPressure: document.getElementById('hm-bp')?.value || m.bloodPressure || '',
                                heartRate: document.getElementById('hm-hr')?.value || m.heartRate || '',
                                temperature: document.getElementById('hm-temp')?.value || m.temperature || '',
                                spo2: document.getElementById('hm-spo2')?.value || m.spo2 || '',
                                chronic: document.getElementById('hm-chronic')?.value || m.chronic || '',
                                surgeries: document.getElementById('hm-surgeries')?.value || m.surgeries || '',
                                hospitalization: document.getElementById('hm-hospitalization')?.value || m.hospitalization || '',
                                familyHistory: document.getElementById('hm-family')?.value || m.familyHistory || '',
                                disabilities: document.getElementById('hm-disabilities')?.value || m.disabilities || '',
                                vaccinations,
                                allergies,
                                treatments: treatments.filter(t => t.name),
                                emergencyContact: document.getElementById('hm-ec')?.value || m.emergencyContact || '',
                                primaryDoctor: document.getElementById('hm-pd')?.value || m.primaryDoctor || '',
                                hospital: document.getElementById('hm-hosp')?.value || m.hospital || '',
                                insurance: document.getElementById('hm-ins')?.value || m.insurance || '',
                              }
                              const uid = editingChild ? editingChild.uid : uidRef.current
                              const extra_data = { ...(editingChild?.extra_data || {}), medical }
                              const photoDataUrl = localStorage.getItem('cdo_child_photo_' + uid)
                              try {
                                let token = localStorage.getItem('access_token')
                                if (!token) { alert('Session expirée'); setSavingHealth(false); return }

                                const buildBody = () => {
                                  const nom = editingChild?.nom || ''
                                  const prenom = editingChild?.prenom || ''
                                  const sexe = editingChild?.sexe || ''
                                  const date_naissance = editingChild?.date_naissance || null
                                  const nationalite = editingChild?.nationalite || ''
                                  const adresse = editingChild?.adresse || ''
                                  if (photoDataUrl) {
                                    const fd = new FormData()
                                    fd.append('uid', uid); fd.append('nom', nom); fd.append('prenom', prenom); fd.append('sexe', sexe); fd.append('date_naissance', date_naissance || ''); fd.append('nationalite', nationalite); fd.append('adresse', adresse)
                                    fd.append('extra_data', JSON.stringify(extra_data))
                                    const arr = photoDataUrl.split(','); const bytes = atob(arr[1]); const u8 = new Uint8Array(bytes.length); for (let i = 0; i < bytes.length; i++) u8[i] = bytes.charCodeAt(i)
                                    fd.append('photo', new File([u8], 'photo.jpg', { type: arr[0].match(/:(.*?);/)[1] }))
                                    return { body: fd, headers: {} }
                                  }
                                  return { body: JSON.stringify({ uid, nom, prenom, sexe, date_naissance, nationalite, adresse, extra_data }), headers: { 'Content-Type': 'application/json' } }
                                }

                                let url = `${API}/enfants/`
                                let method = 'POST'
                                if (editingChild) { url = `${API}/enfants/${editingChild.id}/`; method = 'PUT' }

                                const send = async () => {
                                  const { body, headers: eh } = buildBody()
                                  const hdrs = { Authorization: `Bearer ${token}`, ...eh }
                                  let res = await fetch(url, { method, headers: hdrs, body })
                                  if (res.status === 401) {
                                    const refresh = localStorage.getItem('refresh_token')
                                    if (!refresh) throw new Error('Session expirée')
                                    const rr = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                                    if (!rr.ok) throw new Error('Session expirée')
                                    const t2 = await rr.json(); localStorage.setItem('access_token', t2.access); hdrs.Authorization = `Bearer ${t2.access}`
                                    res = await fetch(url, { method, headers: hdrs, body })
                                  }
                                  if (!res.ok) { const ed = await res.json().catch(()=>({})); throw new Error(ed.error || Object.values(ed).flat().join(' ') || 'Erreur') }
                                  return res.json()
                                }
                                const saved = await send()
                                setRegisteredChildren(prev => prev.some(c => c.id === saved.id) ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved])
                                setEditingChild(saved)
                                setSavingHealth(false)
                                alert('Dossier médical enregistré!')
                              } catch (e) {
                                setSavingHealth(false)
                                alert(e.message || 'Erreur lors de l\'enregistrement')
                              }
                            }}>
                              {savingHealth && <div className="hm-save-spinner" />}
                              {t('hm_save') || 'Enregistrer le Dossier Médical'}
                            </button>
                          </div>
                        </div>
                      ) : subKey === 'Scolarité' ? (
                        <div className="ed-form">
                          {/* ═══ ACADEMIC ALERTS BAR ═══ */}
                          <div className="ed-alerts">
                            <div className="ed-alert danger"><span className="ed-alert-icon">🔴</span><span className="ed-alert-text">{t('ed_alert_attendance') || 'Présence Insuffisante'}</span></div>
                            <div className="ed-alert warning"><span className="ed-alert-icon">🟡</span><span className="ed-alert-text">{t('ed_alert_grades') || 'Matières en Difficulté'}</span><span className="hm-card-badge">{subjects.filter(s => s.grade && parseFloat(s.grade) < 10).length}</span></div>
                            <div className="ed-alert info"><span className="ed-alert-icon">🔵</span><span className="ed-alert-text">{t('ed_alert_exams') || 'Examens à Venir'}</span></div>
                            <div className="ed-alert success"><span className="ed-alert-icon">🟢</span><span className="ed-alert-text">{t('ed_alert_reports') || 'Bulletins'}</span></div>
                          </div>

                          {/* ═══ DASHBOARD STAT CARDS ═══ */}
                          <div className="ed-stats">
                            <div className="ed-stat"><div className="ed-stat-icon">📊</div><div className="ed-stat-value">{(() => { const g = subjects.filter(s => s.grade).map(s => parseFloat(s.grade) * (s.coefficient || 1)); const c = subjects.filter(s => s.grade).reduce((a, s) => a + (s.coefficient || 1), 0); return g.length && c ? (g.reduce((a, b) => a + b, 0) / c).toFixed(1) : '—' })()}</div><div className="ed-stat-label">{t('ed_gpa_current') || 'Moyenne'}</div></div>
                            <div className="ed-stat"><div className="ed-stat-icon">📈</div><div className="ed-stat-value">{(() => { const p = document.getElementById('ed-present')?.value; const a = document.getElementById('ed-absent')?.value; const total = (parseInt(p)||0) + (parseInt(a)||0); return total ? Math.round(parseInt(p||0)/total*100) + '%' : '—' })() || '—'}</div><div className="ed-stat-label">{t('ed_att_rate') || 'Présence'}</div></div>
                            <div className="ed-stat"><div className="ed-stat-icon">🏆</div><div className="ed-stat-value">{document.getElementById('ed-rank')?.value || '—'}</div><div className="ed-stat-label">{t('ed_rank_current') || 'Rang'}</div></div>
                            <div className="ed-stat"><div className="ed-stat-icon">✅</div><div className="ed-stat-value">{subjects.filter(s => s.grade && parseFloat(s.grade) >= 10).length}</div><div className="ed-stat-label">{t('ed_subjects_passed') || 'Réussies'}</div></div>
                            <div className="ed-stat"><div className="ed-stat-icon">⚠️</div><div className="ed-stat-value" style={{color: subjects.filter(s => s.grade && parseFloat(s.grade) < 10).length > 0 ? '#ef4444' : '#22c55e'}}>{subjects.filter(s => s.grade && parseFloat(s.grade) < 10).length}</div><div className="ed-stat-label">{t('ed_subjects_at_risk') || 'À Risque'}</div></div>
                            <div className="ed-stat"><div className="ed-stat-icon">🎖️</div><div className="ed-stat-value">{activityEntries.filter(a => a.type === 'award').length}</div><div className="ed-stat-label">{t('ed_awards_count') || 'Distinctions'}</div></div>
                          </div>

                          {/* ═══ 1. STUDENT ACADEMIC PROFILE ═══ */}
                          <div className="ed-hero">
                            <div className="ed-hero-avatar">{(() => { const uid = editingChild ? editingChild.uid : uidRef.current; const s = localStorage.getItem('cdo_child_photo_' + uid); if (s) return <img src={s} alt="" style={{width:'56px',height:'56px',borderRadius:'14px',objectFit:'cover'}} />; const inits = ((getFieldValue('Prénom')?.[0]||'')+(getFieldValue('Nom')?.[0]||'')).toUpperCase()||'?'; return inits })()}</div>
                            <div className="ed-hero-info">
                              <div className="ed-hero-name">{getFieldValue('Prénom') || 'Prénom'} {getFieldValue('Nom') || 'Nom'}</div>
                              <div className="ed-hero-meta">
                                <span>🆔 {editingChild ? editingChild.uid : uidRef.current}</span>
                                <span>🎂 {(() => { const d = getFieldValue('Date de naissance'); if (!d) return '—'; const a = Math.floor((new Date()-new Date(d))/(365.25*86400000)); return a+' '+(t('prof_years')||'ans') })()}</span>
                                <span>🏫 {document.getElementById('ed-class')?.value || (() => { const e = editingChild?.extra_data?.education; return e?.currentClass || '' })() || '—'}</span>
                              </div>
                            </div>
                            <div className="ed-hero-right">
                              <span className="ed-hero-badge active">✅ {t('ed_status_active') || 'Actif'}</span>
                              <span className="ed-hero-status">{t('ed_enrollment_date') || "Inscription"} : {document.getElementById('ed-enroll-date')?.value || '—'}</span>
                            </div>
                          </div>

                          {/* ═══ 2. SCHOOL INFORMATION ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(59,130,246,0.15)'}}>🏫</div>
                              <span className="hm-card-title">{t('ed_school_info') || 'Informations Scolaires'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="ed-grid-2">
                                <div className="hm-field"><label className="hm-field-label">{t('ed_school_name') || 'Établissement'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.schoolName||''})()} id="ed-school" placeholder="Ex: École Saint Joseph" /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_school_type') || "Type"}</label><select defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.schoolType||''})()} id="ed-school-type"><option value="">—</option><option value="Public">{t('ed_school_type_public')||'Public'}</option><option value="Privé">{t('ed_school_type_private')||'Privé'}</option><option value="Confessionnel">{t('ed_school_type_religious')||'Confessionnel'}</option></select></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_school_address') || 'Adresse'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.schoolAddress||''})()} id="ed-school-addr" /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_school_phone') || 'Téléphone'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.schoolPhone||''})()} id="ed-school-phone" /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_school_email') || 'Email'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.schoolEmail||''})()} id="ed-school-email" /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_principal') || 'Directeur'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.principal||''})()} id="ed-principal" /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_class_teacher') || 'Professeur Principal'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.classTeacher||''})()} id="ed-teacher" /></div>
                              </div>
                            </div>
                          </div>

                          {/* ═══ 3. ACADEMIC INFORMATION ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(16,185,129,0.15)'}}>📚</div>
                              <span className="hm-card-title">{t('ed_academic') || 'Informations Académiques'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="ed-grid-2">
                                <div className="hm-field"><label className="hm-field-label">{t('ed_current_class') || 'Classe'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.currentClass||''})()} id="ed-class" placeholder="Ex: 5ème" /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_academic_year') || 'Année Scolaire'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.academicYear||''})()} id="ed-year" placeholder="2025-2026" /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_term') || 'Trimestre'}</label><select defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.term||''})()} id="ed-term"><option value="">—</option><option value="1">{t('ed_term_1')||'1er'}</option><option value="2">{t('ed_term_2')||'2ème'}</option><option value="3">{t('ed_term_3')||'3ème'}</option></select></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_student_number') || 'N° Étudiant'}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.studentNumber||''})()} id="ed-student-nb" /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_education_level') || "Niveau"}</label><select defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.educationLevel||''})()} id="ed-level"><option value="">—</option><option value="preschool">{t('ed_level_preschool')||'Préscolaire'}</option><option value="primary">{t('ed_level_primary')||'Primaire'}</option><option value="secondary">{t('ed_level_secondary')||'Secondaire'}</option><option value="highschool">{t('ed_level_highschool')||'Lycée'}</option><option value="university">{t('ed_level_university')||'Université'}</option><option value="vocational">{t('ed_level_vocational')||'Formation Pro.'}</option></select></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_enrollment_date') || "Date d'Inscription"}</label><input type="date" defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.enrollmentDate||''})()} id="ed-enroll-date" /></div>
                              </div>
                            </div>
                          </div>

                          {/* ═══ 4. ACADEMIC PERFORMANCE (GRADES) ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(245,158,11,0.15)'}}>📊</div>
                              <span className="hm-card-title">{t('ed_performance') || 'Performance'}</span>
                              <span className="hm-card-badge">{(() => { const g = subjects.filter(s => s.grade).map(s => parseFloat(s.grade) * (s.coefficient || 1)); const c = subjects.filter(s => s.grade).reduce((a, s) => a + (s.coefficient || 1), 0); return g.length && c ? (g.reduce((a, b) => a + b, 0) / c).toFixed(1) : '—' })()}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <table className="ed-grades">
                                <thead><tr><th>{t('ed_subject')||'Matière'}</th><th>{t('ed_grade')||'Note'}</th><th>{t('ed_coefficient')||'Coef.'}</th><th>Appréciation</th></tr></thead>
                                <tbody>
                                  {subjects.map((s, i) => (
                                    <tr key={i}>
                                      <td><input value={s.name} onChange={e => { const nxt = [...subjects]; nxt[i] = {...nxt[i], name: e.target.value}; setSubjects(nxt) }} /></td>
                                      <td><input type="number" step="0.5" min="0" max="20" value={s.grade} onChange={e => { const nxt = [...subjects]; nxt[i] = {...nxt[i], grade: e.target.value}; setSubjects(nxt) }} placeholder="0-20" /></td>
                                      <td><input type="number" min="1" max="10" value={s.coefficient} onChange={e => { const nxt = [...subjects]; nxt[i] = {...nxt[i], coefficient: parseInt(e.target.value) || 1}; setSubjects(nxt) }} /></td>
                                      <td style={{fontSize:'12px',color: !s.grade ? '#64748B' : parseFloat(s.grade) >= 14 ? '#22c55e' : parseFloat(s.grade) >= 10 ? '#f59e0b' : '#ef4444'}}>{!s.grade ? '—' : parseFloat(s.grade) >= 14 ? 'TB' : parseFloat(s.grade) >= 10 ? 'Satisf.' : 'Insuff.'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="hm-grid-2" style={{marginTop:'12px'}}>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_strengths') || 'Points Forts'}</label><textarea rows={2} defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.strengths||''})()} id="ed-strengths" placeholder="Ex: Mathématiques, Français..." /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_improvements') || 'À Améliorer'}</label><textarea rows={2} defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.improvements||''})()} id="ed-improvements" placeholder="Ex: Sciences, Anglais..." /></div>
                              </div>
                            </div>
                          </div>

                          {/* ═══ 5. ATTENDANCE TRACKING ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(99,102,241,0.15)'}}>📅</div>
                              <span className="hm-card-title">{t('ed_attendance') || 'Présences'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="ed-att-row">
                                <span className="ed-att-label">{t('ed_present') || 'Présences'}</span>
                                <input type="number" className="hm-vital-input" style={{width:'80px'}} min="0" defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.presentDays||''})()} id="ed-present" onInput={() => { const p = parseInt(document.getElementById('ed-present')?.value)||0; const a = parseInt(document.getElementById('ed-absent')?.value)||0; const total = p + a; const el = document.getElementById('ed-att-pct'); if (el) el.textContent = total ? Math.round(p/total*100) + '%' : '—' }} />
                                <span className="ed-att-label">{t('ed_absent') || 'Absences'}</span>
                                <input type="number" className="hm-vital-input" style={{width:'80px'}} min="0" defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.absentDays||''})()} id="ed-absent" onInput={() => { const p = parseInt(document.getElementById('ed-present')?.value)||0; const a = parseInt(document.getElementById('ed-absent')?.value)||0; const total = p + a; const el = document.getElementById('ed-att-pct'); if (el) el.textContent = total ? Math.round(p/total*100) + '%' : '—' }} />
                                <span className="ed-att-pct" id="ed-att-pct">{(()=>{const e=editingChild?.extra_data?.education; if (!e) return '—'; const total = (parseInt(e.presentDays)||0) + (parseInt(e.absentDays)||0); return total ? Math.round(parseInt(e.presentDays||0)/total*100) + '%' : '—' })()}</span>
                              </div>
                              <div className="hm-field"><label className="hm-field-label">{t('ed_attendance_history') || 'Historique'}</label><textarea rows={2} defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.attendanceHistory||''})()} id="ed-att-history" placeholder="Ex: Janvier: 20P/2A, Février: 18P/4A..." /></div>
                            </div>
                          </div>

                          {/* ═══ 6. BEHAVIOR & DISCIPLINE ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(168,85,247,0.15)'}}>👥</div>
                              <span className="hm-card-title">{t('ed_behavior') || 'Comportement'}</span>
                              <span className="hm-card-badge">{behaviorEntries.length}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              {behaviorEntries.map((b, i) => (
                                <div key={i} className="ed-beh-item">
                                  <span className="ed-beh-icon">{b.type === 'positive' ? '⭐' : b.type === 'concern' ? '⚠️' : '🔴'}</span>
                                  <div className="ed-beh-info">
                                    <span className="ed-beh-name">{b.name || 'Comportement'}</span>
                                    {b.notes && <span className="ed-beh-notes">{b.notes}</span>}
                                  </div>
                                  <span className={`ed-beh-type ${b.type || 'concern'}`}>{b.type === 'positive' ? (t('ed_achievements')||'Positif') : b.type === 'incident' ? (t('ed_discipline')||'Incident') : (t('ed_observations')||'Observation')}</span>
                                  <span className="ed-beh-del" onClick={() => setBehaviorEntries(behaviorEntries.filter((_,j) => j !== i))}>✕</span>
                                </div>
                              ))}
                              {showBehaviorForm ? (
                                <div className="hm-inline-form">
                                  <select id="ed-beh-type" defaultValue="observation">
                                    <option value="positive">{t('ed_achievements')||'Réussite'}</option>
                                    <option value="concern">{t('ed_observations')||'Observation'}</option>
                                    <option value="incident">{t('ed_discipline')||'Incident'}</option>
                                  </select>
                                  <input id="ed-beh-name" placeholder="Titre" style={{flex:1}} />
                                  <input id="ed-beh-notes" placeholder="Notes" style={{flex:1}} />
                                  <button className="hm-inline-confirm" onClick={() => { const name = document.getElementById('ed-beh-name')?.value?.trim(); if (!name) return; setBehaviorEntries([...behaviorEntries, { type: document.getElementById('ed-beh-type')?.value || 'observation', name, notes: document.getElementById('ed-beh-notes')?.value || '' }]); setShowBehaviorForm(false) }}>✓</button>
                                  <button className="hm-inline-cancel" onClick={() => setShowBehaviorForm(false)}>✕</button>
                                </div>
                              ) : (
                                <button className="hm-add-btn" onClick={() => setShowBehaviorForm(true)}>+ {t('ed_add') || 'Ajouter'}</button>
                              )}
                            </div>
                          </div>

                          {/* ═══ 7. EDUCATIONAL SUPPORT ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(16,185,129,0.15)'}}>🤝</div>
                              <span className="hm-card-title">{t('ed_support') || 'Soutien'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="ed-grid-2">
                                <div className="hm-field"><label className="hm-field-label">{t('ed_learning_difficulties') || 'Difficultés'}</label><textarea rows={2} defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.learningDifficulties||''})()} id="ed-learn-diff" placeholder="Ex: Dyslexie, TDAH..." /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_special_needs') || 'Besoins Spéciaux'}</label><textarea rows={2} defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.specialNeeds||''})()} id="ed-special" placeholder="Ex: Soutien orthophoniste..." /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_tutoring') || 'Soutien Scolaire'}</label><textarea rows={2} defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.tutoring||''})()} id="ed-tutoring" placeholder="Ex: Cours de rattrapage en maths..." /></div>
                                <div className="hm-field"><label className="hm-field-label">{t('ed_scholarship') || "Bourse"}</label><input defaultValue={(()=>{const e=editingChild?.extra_data?.education; return e?.scholarship||''})()} id="ed-scholarship" placeholder="Ex: Bourse d'excellence 2025" /></div>
                              </div>
                            </div>
                          </div>

                          {/* ═══ 8. SCHOOL DOCUMENTS ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(245,158,11,0.15)'}}>📄</div>
                              <span className="hm-card-title">{t('ed_documents') || 'Documents'}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              <div className="ed-docs">
                                {[
                                  { id:'report', icon:'📋', label: t('ed_report_card') || 'Bulletins' },
                                  { id:'cert', icon:'🏅', label: t('ed_certificate') || 'Certificats' },
                                  { id:'enroll', icon:'📝', label: t('ed_enrollment_letter') || 'Inscription' },
                                  { id:'schoolid', icon:'🆔', label: t('ed_school_id') || "Carte d'Étudiant" },
                                  { id:'exams', icon:'📊', label: t('ed_exam_results') || 'Examens' },
                                  { id:'assess', icon:'📈', label: t('ed_assessments') || 'Évaluations' },
                                ].map(doc => {
                                  const uid = editingChild ? editingChild.uid : uidRef.current
                                  const saved = localStorage.getItem('cdo_schooldoc_' + uid + '_' + doc.id)
                                  return (
                                    <div key={doc.id} className={`ed-doc-zone${saved ? ' has' : ''}`} onClick={() => document.getElementById('ed-doc-' + doc.id)?.click()}>
                                      <div className="ed-doc-icon">{doc.icon}</div>
                                      <span className="ed-doc-label">{doc.label}</span>
                                      {saved ? <span className="ed-doc-name">✓ Fichier</span> : <span style={{fontSize:'10px',color:'#475569'}}>Upload</span>}
                                      {saved && <span className="ed-doc-remove" onClick={e => { e.stopPropagation(); localStorage.removeItem('cdo_schooldoc_' + uid + '_' + doc.id); setSavingEdu(v => !v) }}>Suppr.</span>}
                                      <input id={'ed-doc-' + doc.id} type="file" accept="image/*,.pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => { localStorage.setItem('cdo_schooldoc_' + uid + '_' + doc.id, ev.target.result); setSavingEdu(v => !v) }; r.readAsDataURL(f) } }} />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          {/* ═══ 9. ACTIVITIES & EXTRACURRICULAR ═══ */}
                          <div className="hm-card open">
                            <div className="hm-card-header" onClick={e => e.currentTarget.parentElement.classList.toggle('open')}>
                              <div className="hm-card-icon" style={{background:'rgba(236,72,153,0.15)'}}>🎯</div>
                              <span className="hm-card-title">{t('ed_activities') || 'Activités'}</span>
                              <span className="hm-card-badge">{activityEntries.length}</span>
                              <span className="hm-card-chevron">▼</span>
                            </div>
                            <div className="hm-card-body">
                              {activityEntries.map((a, i) => (
                                <div key={i} className="ed-act-item">
                                  <span className="ed-act-icon">{a.category === 'sports' ? '⚽' : a.category === 'music' ? '🎵' : a.category === 'art' ? '🎨' : a.category === 'club' ? '👥' : a.category === 'competition' ? '🏆' : '🎖️'}</span>
                                  <div className="ed-act-info">
                                    <span className="ed-act-name">{a.name || 'Activité'}</span>
                                    {a.detail && <span className="ed-act-detail">{a.detail}</span>}
                                  </div>
                                  <span className="ed-act-badge">{a.category === 'award' ? (t('ed_awards')||'Prix') : a.category === 'competition' ? (t('ed_competitions')||'Compétition') : a.category}</span>
                                  <span className="ed-act-del" onClick={() => setActivityEntries(activityEntries.filter((_,j) => j !== i))}>✕</span>
                                </div>
                              ))}
                              {showActivityForm ? (
                                <div className="hm-inline-form" style={{flexWrap:'wrap'}}>
                                  <select id="ed-act-cat" defaultValue="sports">
                                    <option value="sports">{t('ed_sports')||'Sports'}</option>
                                    <option value="music">{t('ed_music')||'Musique'}</option>
                                    <option value="art">{t('ed_art')||'Art'}</option>
                                    <option value="club">{t('ed_clubs')||'Clubs'}</option>
                                    <option value="competition">{t('ed_competitions')||'Compétitions'}</option>
                                    <option value="award">{t('ed_awards')||'Prix'}</option>
                                  </select>
                                  <input id="ed-act-name" placeholder="Nom" style={{flex:1,minWidth:'120px'}} />
                                  <input id="ed-act-detail" placeholder="Détail" style={{flex:1,minWidth:'120px'}} />
                                  <button className="hm-inline-confirm" onClick={() => { const name = document.getElementById('ed-act-name')?.value?.trim(); if (!name) return; setActivityEntries([...activityEntries, { category: document.getElementById('ed-act-cat')?.value || 'sports', name, detail: document.getElementById('ed-act-detail')?.value || '' }]); setShowActivityForm(false) }}>✓</button>
                                  <button className="hm-inline-cancel" onClick={() => setShowActivityForm(false)}>✕</button>
                                </div>
                              ) : (
                                <button className="hm-add-btn" onClick={() => setShowActivityForm(true)}>+ {t('ed_add') || 'Ajouter'}</button>
                              )}
                            </div>
                          </div>

                          {/* ═══ SAVE BUTTON ═══ */}
                          <div className="hm-save-row">
                            <button className={`hm-save-btn${savingEdu ? ' loading' : ''}`} style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)'}} onClick={async () => {
                              setSavingEdu(true)
                              const e = editingChild?.extra_data?.education || {}
                              const education = {
                                schoolName: document.getElementById('ed-school')?.value || e.schoolName || '',
                                schoolType: document.getElementById('ed-school-type')?.value || e.schoolType || '',
                                schoolAddress: document.getElementById('ed-school-addr')?.value || e.schoolAddress || '',
                                schoolPhone: document.getElementById('ed-school-phone')?.value || e.schoolPhone || '',
                                schoolEmail: document.getElementById('ed-school-email')?.value || e.schoolEmail || '',
                                principal: document.getElementById('ed-principal')?.value || e.principal || '',
                                classTeacher: document.getElementById('ed-teacher')?.value || e.classTeacher || '',
                                currentClass: document.getElementById('ed-class')?.value || e.currentClass || '',
                                academicYear: document.getElementById('ed-year')?.value || e.academicYear || '',
                                term: document.getElementById('ed-term')?.value || e.term || '',
                                studentNumber: document.getElementById('ed-student-nb')?.value || e.studentNumber || '',
                                educationLevel: document.getElementById('ed-level')?.value || e.educationLevel || '',
                                enrollmentDate: document.getElementById('ed-enroll-date')?.value || e.enrollmentDate || '',
                                subjects,
                                strengths: document.getElementById('ed-strengths')?.value || e.strengths || '',
                                improvements: document.getElementById('ed-improvements')?.value || e.improvements || '',
                                presentDays: document.getElementById('ed-present')?.value || e.presentDays || '',
                                absentDays: document.getElementById('ed-absent')?.value || e.absentDays || '',
                                attendanceHistory: document.getElementById('ed-att-history')?.value || e.attendanceHistory || '',
                                behaviorEntries,
                                activityEntries,
                                learningDifficulties: document.getElementById('ed-learn-diff')?.value || e.learningDifficulties || '',
                                specialNeeds: document.getElementById('ed-special')?.value || e.specialNeeds || '',
                                tutoring: document.getElementById('ed-tutoring')?.value || e.tutoring || '',
                                scholarship: document.getElementById('ed-scholarship')?.value || e.scholarship || '',
                              }
                              const uid = editingChild ? editingChild.uid : uidRef.current
                              const extra_data = { ...(editingChild?.extra_data || {}), education }
                              const photoDataUrl = localStorage.getItem('cdo_child_photo_' + uid)
                              try {
                                let token = localStorage.getItem('access_token')
                                if (!token) { alert('Session expirée'); setSavingEdu(false); return }
                                const buildBody = () => {
                                  const nom = editingChild?.nom || ''
                                  const prenom = editingChild?.prenom || ''
                                  const sexe = editingChild?.sexe || ''
                                  const date_naissance = editingChild?.date_naissance || null
                                  const nationalite = editingChild?.nationalite || ''
                                  const adresse = editingChild?.adresse || ''
                                  if (photoDataUrl) {
                                    const fd = new FormData()
                                    fd.append('uid', uid); fd.append('nom', nom); fd.append('prenom', prenom); fd.append('sexe', sexe); fd.append('date_naissance', date_naissance || ''); fd.append('nationalite', nationalite); fd.append('adresse', adresse)
                                    fd.append('extra_data', JSON.stringify(extra_data))
                                    const arr = photoDataUrl.split(','); const bytes = atob(arr[1]); const u8 = new Uint8Array(bytes.length); for (let i = 0; i < bytes.length; i++) u8[i] = bytes.charCodeAt(i)
                                    fd.append('photo', new File([u8], 'photo.jpg', { type: arr[0].match(/:(.*?);/)[1] }))
                                    return { body: fd, headers: {} }
                                  }
                                  return { body: JSON.stringify({ uid, nom, prenom, sexe, date_naissance, nationalite, adresse, extra_data }), headers: { 'Content-Type': 'application/json' } }
                                }
                                let url = `${API}/enfants/`
                                let method = 'POST'
                                if (editingChild) { url = `${API}/enfants/${editingChild.id}/`; method = 'PUT' }
                                const send = async () => {
                                  const { body, headers: eh } = buildBody()
                                  const hdrs = { Authorization: `Bearer ${token}`, ...eh }
                                  let res = await fetch(url, { method, headers: hdrs, body })
                                  if (res.status === 401) {
                                    const refresh = localStorage.getItem('refresh_token')
                                    if (!refresh) throw new Error('Session expirée')
                                    const rr = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                                    if (!rr.ok) throw new Error('Session expirée')
                                    const t2 = await rr.json(); localStorage.setItem('access_token', t2.access); hdrs.Authorization = `Bearer ${t2.access}`
                                    res = await fetch(url, { method, headers: hdrs, body })
                                  }
                                  if (!res.ok) { const ed = await res.json().catch(()=>({})); throw new Error(ed.error || Object.values(ed).flat().join(' ') || 'Erreur') }
                                  return res.json()
                                }
                                const saved = await send()
                                setRegisteredChildren(prev => prev.some(c => c.id === saved.id) ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved])
                                setEditingChild(saved)
                                setSavingEdu(false)
                                alert('Dossier scolaire enregistré!')
                              } catch (e) {
                                setSavingEdu(false)
                                alert(e.message || 'Erreur lors de l\'enregistrement')
                              }
                            }}>
                              {savingEdu && <div className="hm-save-spinner" />}
                              {t('ed_save') || 'Enregistrer le Dossier Scolaire'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── GENERIC FORM RENDERER ── */
                        CHILD_FORMS[subKey]?.fields.map((f, i) => (
                          <div key={i} className="dash-form-field">
                            <label className="dash-form-label">{f.label}</label>
                            {f.type === 'uid' ? (
                              <input type="text" className="dash-form-input dash-form-uid" value={editingChild ? editingChild.uid : uidRef.current} readOnly />
                            ) : f.type === 'select' && f.label === 'Nationalité' ? (
                              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                <select className="dash-form-input" defaultValue={getFieldValue(f.label)} onChange={e => {
                                  const flagEl = document.getElementById('dash-nat-flag')
                                  if (!flagEl) return
                                  const v = e.target.value
                                  if (!v) { flagEl.innerHTML = ''; return }
                                  const c = AFRICAN_COUNTRIES.find(c => c.name === v)
                                  flagEl.innerHTML = c ? `<img src="https://flagcdn.com/24x18/${c.code.toLowerCase()}.png" alt="${c.name}" style="width:auto;height:18px;border-radius:2px;vertical-align:middle" />` : ''
                                }}>
                                  <option value="">{t('form_select_placeholder')}</option>
                                  {f.options?.map(o => {
                                    const cc = AFRICAN_COUNTRIES.find(c => c.name === o)
                                    return <option key={o} value={o}>{cc ? `${cc.name}` : o}</option>
                                  })}
                                </select>
                                <span id="dash-nat-flag" style={{minWidth:'24px', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}}>
                                  {(() => {
                                    const nat = getFieldValue(f.label)
                                    if (!nat) return null
                                    const c = AFRICAN_COUNTRIES.find(c => c.name === nat)
                                    return c ? <img src={`https://flagcdn.com/24x18/${c.code.toLowerCase()}.png`} alt={c.name} style={{width:'auto',height:'18px',borderRadius:'2px',verticalAlign:'middle'}} /> : null
                                  })()}
                                </span>
                              </div>
                            ) : f.type === 'select' ? (
                              <select className="dash-form-input" defaultValue={getFieldValue(f.label)}>
                                <option value="">{t('form_select_placeholder')}</option>
                                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : f.type === 'textarea' ? (
                              <textarea className="dash-form-input dash-form-textarea" rows={3} defaultValue={getFieldValue(f.label)} />
                            ) : f.type === 'file' && f.label === 'Photo' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                  <input type="file" className="dash-form-file" accept="image/*" onChange={e => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const reader = new FileReader()
                                      reader.onload = (ev) => {
                                        const uid2 = editingChild ? editingChild.uid : uidRef.current
                                        localStorage.setItem('cdo_child_photo_' + uid2, ev.target.result)
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }} />
                                  {(() => {
                                    const uid2 = editingChild ? editingChild.uid : uidRef.current
                                    const saved = localStorage.getItem('cdo_child_photo_' + uid2)
                                    if (saved) return <img src={saved} alt="" style={{ width:'48px', height:'48px', borderRadius:'8px', objectFit:'cover' }} />
                                    if (getFieldValue(f.label)) return <span style={{ fontSize:'12px', color:'#64748B' }}>{t('form_current_file')} {getFieldValue(f.label)}</span>
                                    return null
                                  })()}
                                </div>
                              </div>
                            ) : f.type === 'file' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <input type="file" className="dash-form-file" />
                                {getFieldValue(f.label) && <span style={{ fontSize: '12px', color: '#64748B' }}>{t('form_current_file')} {getFieldValue(f.label)}</span>}
                              </div>
                            ) : (
                              <input type={f.type} className="dash-form-input" defaultValue={getFieldValue(f.label)} />
                            )}
                          </div>
                        ))
                      )}
                      {/* ── GENERIC SAVE BUTTON (only for non-medical/education forms) ── */}
                      {subKey !== 'Santé & médical' && subKey !== 'Scolarité' && (
                        <button className="dash-form-save" onClick={async () => {
                          const data = {}
                          document.querySelectorAll('.dash-sub-form .dash-form-field').forEach(field => {
                            const label = field.querySelector('.dash-form-label')?.textContent || ''
                            const input = field.querySelector('input, select, textarea')
                            if (input) data[label] = input.value || input.files?.[0]?.name || ''
                          })
                          if (!Object.keys(data).length) return

                          const uid = editingChild ? editingChild.uid : uidRef.current
                          const photoDataUrl = localStorage.getItem('cdo_child_photo_' + uid)

                          const buildBody = () => {
                            const nom = data['Nom'] !== undefined ? data['Nom'] : (editingChild ? editingChild.nom : '')
                            const prenom = data['Prénom'] !== undefined ? data['Prénom'] : (editingChild ? editingChild.prenom : '')
                            const sexe = data['Sexe'] !== undefined ? (data['Sexe'] === 'Masculin' ? 'M' : data['Sexe'] === 'Féminin' ? 'F' : '') : (editingChild ? editingChild.sexe : '')
                            const date_naissance = data['Date de naissance'] !== undefined ? (data['Date de naissance'] || null) : (editingChild ? editingChild.date_naissance : null)
                            const nationalite = data['Nationalité'] !== undefined ? data['Nationalité'] : (editingChild ? editingChild.nationalite : '')
                            const adresse = data["Adresse d'origine"] !== undefined ? data["Adresse d'origine"] : (editingChild ? editingChild.adresse : '')
                            const extra_data = editingChild ? { ...editingChild.extra_data, ...data } : data

                            if (photoDataUrl) {
                              const fd = new FormData()
                              fd.append('uid', uid)
                              fd.append('nom', nom)
                              fd.append('prenom', prenom)
                              fd.append('sexe', sexe)
                              fd.append('date_naissance', date_naissance || '')
                              fd.append('nationalite', nationalite)
                              fd.append('adresse', adresse)
                              fd.append('extra_data', JSON.stringify(extra_data))
                              const arr = photoDataUrl.split(',')
                              const mime = arr[0].match(/:(.*?);/)[1]
                              const bstr = atob(arr[1])
                              let n = bstr.length
                              const u8arr = new Uint8Array(n)
                              while (n--) u8arr[n] = bstr.charCodeAt(n)
                              fd.append('photo', new File([u8arr], 'photo.jpg', { type: mime }))
                              return { body: fd, headers: {} }
                            }
                            const jsonBody = { uid, nom, prenom, sexe, date_naissance, nationalite, adresse, extra_data }
                            if (editingChild?.photo && !photoDataUrl) jsonBody.photo = editingChild.photo
                            return { body: JSON.stringify(jsonBody), headers: { 'Content-Type': 'application/json' } }
                          }

                          let url = `${API}/enfants/`
                          let method = 'POST'
                          if (editingChild) {
                            url = `${API}/enfants/${editingChild.id}/`
                            method = 'PUT'
                          }

                          let token = localStorage.getItem('access_token')
                          if (!token) { alert('Session expirée'); return }
                          const send = async () => {
                            const { body, headers: extraHeaders } = buildBody()
                            const allHeaders = { Authorization: `Bearer ${token}`, ...extraHeaders }
                            let res = await fetch(url, { method, headers: allHeaders, body })
                            if (res.status === 401) {
                              const refresh = localStorage.getItem('refresh_token')
                              if (!refresh) throw new Error('Session expirée')
                              const refRes = await fetch(`${API}/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
                              if (!refRes.ok) throw new Error('Session expirée')
                              const tokens = await refRes.json()
                              localStorage.setItem('access_token', tokens.access)
                              allHeaders.Authorization = `Bearer ${tokens.access}`
                              res = await fetch(url, { method, headers: allHeaders, body })
                            }
                            if (!res.ok) {
                              const errData = await res.json().catch(() => ({}))
                              const errMsg = errData.error || Object.values(errData).flat().join(' ') || 'Erreur sauvegarde'
                              throw new Error(errMsg)
                            }
                            return res.json()
                          }
                          try {
                            const saved = await send()
                            setRegisteredChildren(prev => prev.some(c => c.id === saved.id) ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved])
                            setSelectedRegChild(saved); setActiveKey('enfants-enregistres'); setSubKey(null)
                            setEditingChild(saved)
                            migratePhoto(uidRef.current, saved.uid); uidRef.current = saved.uid
                          } catch (e) {
                            if (method === 'POST' && e.message?.includes('dupliquée')) {
                              uidRef.current = genChildUid()
                              try {
                                const { body, headers: extraHeaders } = buildBody()
                                const allHeaders2 = { Authorization: `Bearer ${localStorage.getItem('access_token')}`, ...extraHeaders }
                                const retryBody = typeof body === 'string' ? JSON.stringify({ ...JSON.parse(body), uid: uidRef.current }) : (() => { const f = new FormData(); f.append('uid', uidRef.current); for (const [k,v] of body.entries()) if (k !== 'uid') f.append(k,v); return f })()
                                const retryRes = await fetch(`${API}/enfants/`, { method: 'POST', headers: allHeaders2, body: retryBody })
                                if (retryRes.ok) {
                                  const saved = await retryRes.json()
                                  setRegisteredChildren(prev => [...prev, saved])
                                  setSelectedRegChild(saved); setActiveKey('enfants-enregistres'); setSubKey(null)
                                  setEditingChild(saved)
                                  migratePhoto(uidRef.current, saved.uid); uidRef.current = saved.uid
                                  return
                                }
                              } catch (_) {}
                            }
                            alert(e.message || 'Erreur lors de l\'enregistrement')
                          }
                        }}>Enregistrer</button>
                      )}
                    </div>
                  </div>
                ) : activeKey === 'enfants-enregistres' ? (
                  <div className="ecr-wrap">
                    {selectedRegChild ? (
                      <div className="pd-container">
                        {/* ═══ PROFILE HERO ═══ */}
                        <div className="pd-hero">
                          <div className="pd-hero-avatar" onClick={() => document.getElementById('cdu-' + selectedRegChild.uid)?.click()}>
                            {(() => {
                              const lp = localStorage.getItem('cdo_child_photo_' + selectedRegChild.uid)
                              if (lp) return <img src={lp} alt="" style={{width:'72px',height:'72px',borderRadius:'16px',objectFit:'cover'}} />
                              const src = selectedRegChild.photo
                              if (src && src.startsWith('http')) return <img src={src} alt="" style={{width:'72px',height:'72px',borderRadius:'16px',objectFit:'cover'}} />
                              const hues = ['#f59e0b','#22c55e','#a855f7','#3b82f6','#ef4444','#ec4899','#14b8a6','#f97316']
                              return <img src={svgUrl((selectedRegChild.prenom?.[0] || selectedRegChild.nom?.[0] || '?').toUpperCase(), hues[(selectedRegChild.prenom?.charCodeAt(0)||0)%hues.length], 72, 72)} alt="" style={{width:'72px',height:'72px',borderRadius:'16px',objectFit:'cover'}} />
                            })()}
                            <div className="pd-hero-avatar-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
                            <input id={'cdu-' + selectedRegChild.uid} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { localStorage.setItem('cdo_child_photo_' + selectedRegChild.uid, ev.target.result); setSelectedRegChild({...selectedRegChild}) }; r.readAsDataURL(f) }} />
                          </div>
                          <div className="pd-hero-info">
                            <div className="pd-hero-name">{selectedRegChild.prenom || ''} {selectedRegChild.nom || ''}</div>
                            <div className="pd-hero-meta">
                              <span>🎂 {selectedRegChild.date_naissance ? (() => { const d = new Date(selectedRegChild.date_naissance); const age = Math.floor((Date.now() - d.getTime()) / 31557600000); return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short', year:'numeric' }) + ' (' + age + ' ' + (t('form_years') || 'ans') + ')' })() : '—'}</span>
                              <span>⚤ {selectedRegChild.sexe === 'M' ? (t('form_male') || 'Masculin') : selectedRegChild.sexe === 'F' ? (t('form_female') || 'Féminin') : '—'}</span>
                              {selectedRegChild.nationalite && (() => { const cc = countryCodeFromName(selectedRegChild.nationalite); return <span>{cc ? flagImg(cc, selectedRegChild.nationalite, 16) : null} {selectedRegChild.nationalite}</span> })()}
                              <span>📅 {selectedRegChild.created_at ? new Date(selectedRegChild.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—'}</span>
                            </div>
                            <div className="pd-hero-actions">
                              <button className="pd-hero-btn primary" onClick={() => { setEditingChild(selectedRegChild); setActiveKey('enfants'); setSubKey('Profil & identité'); setSelectedRegChild(null) }}>✏️ {t('form_edit') || 'Modifier'}</button>
                              <button className="pd-hero-btn ghost" onClick={() => setSelectedRegChild(null)}>← {t('form_back')}</button>
                              <button className="pd-hero-btn danger" onClick={() => setDeleteConfirm(selectedRegChild)}>🗑️ {t('form_delete') || 'Supprimer'}</button>
                            </div>
                          </div>
                          <div className="pd-hero-right">
                            <span className="pd-hero-status active">✅ {t('child_status_active') || 'Actif'}</span>
                            <div className="pd-hero-id">
                              <span>🆔</span>
                              <span className="pd-hero-id-code">{selectedRegChild.uid}</span>
                              <span className="pd-hero-id-copy" onClick={() => { navigator.clipboard?.writeText(selectedRegChild.uid) }} title="Copier">📋</span>
                            </div>
                          </div>
                        </div>

                        {/* ═══ STATS ROW ═══ */}
                        <div className="pd-stats">
                          <div className="pd-stat"><span className="pd-stat-label">🎂 {t('form_age') || 'Âge'}</span><span className="pd-stat-value">{selectedRegChild.date_naissance ? Math.floor((Date.now() - new Date(selectedRegChild.date_naissance).getTime()) / 31557600000) + ' ' + (t('form_years') || 'ans') : '—'}</span></div>
                          <div className="pd-stat"><span className="pd-stat-label">❤️ {t('hm_health_status') || 'Santé'}</span><span className="pd-stat-value">{(() => { const m = selectedRegChild.extra_data?.medical; return m ? <> <span className="dot green" /> {m.bloodGroup || 'OK'} </> : <> <span className="dot amber" /> — </> })()}</span></div>
                          <div className="pd-stat"><span className="pd-stat-label">🏫 {t('ed_title') || 'Scolarité'}</span><span className="pd-stat-value">{(() => { const e = selectedRegChild.extra_data?.education; return e?.currentClass || e?.schoolName || '—' })()}</span></div>
                          <div className="pd-stat"><span className="pd-stat-label">📄 {t('child_documents') || 'Documents'}</span><span className="pd-stat-value">{(() => { let n = 0; ['cdo_doc_','cdo_meddoc_','cdo_schooldoc_'].forEach(p => { const uid = selectedRegChild.uid; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(p + uid)) n++ } }); return n })()}</span></div>
                          <div className="pd-stat"><span className="pd-stat-label">👪 {t('form_family_status') || 'Famille'}</span><span className="pd-stat-value">{(() => { const fam = selectedRegChild.extra_data?.['Parents connus']; return fam || '—' })()}</span></div>
                          <div className="pd-stat"><span className="pd-stat-label">🔄 Dernière MAJ</span><span className="pd-stat-value">{selectedRegChild.updated_at ? new Date(selectedRegChild.updated_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short' }) : '—'}</span></div>
                        </div>

                        {/* ═══ TABBED INTERFACE ═══ */}
                        <div className="pd-tabs">
                          {[
                            { key:'overview', icon:'📊', label: t('pd_overview') || 'Aperçu' },
                            { key:'identity', icon:'🆔', label: t('pd_identity') || 'Identité' },
                            { key:'family', icon:'👪', label: t('pd_family') || 'Famille' },
                            { key:'health', icon:'❤️', label: t('pd_health') || 'Santé' },
                            { key:'education', icon:'🏫', label: t('pd_education') || 'Scolarité' },
                            { key:'documents', icon:'📄', label: t('pd_documents') || 'Documents' },
                            { key:'updates', icon:'📝', label: 'Updates' },
                            { key:'history', icon:'📜', label: t('pd_history') || 'Historique' },
                          ].map(tab => (
                            <button key={tab.key} className={`pd-tab${profileTab === tab.key ? ' active' : ''}`} onClick={() => setProfileTab(tab.key)}>
                              <span className="pd-tab-icon">{tab.icon}</span>
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* ═══ TAB CONTENT ═══ */}
                        <div className="pd-grid">
                          <div className="pd-main">
                            {/* ── OVERVIEW TAB ── */}
                            {profileTab === 'overview' && (
                              <>
                                <div className="pd-card">
                                  <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(59,130,246,0.15)'}}>📋</div><span className="pd-card-title">{t('pd_quick_info') || 'Informations Générales'}</span></div>
                                  <div className="pd-card-body">
                                    {(() => {
                                      const items = [
                                        { label: t('form_lastname') || 'Nom', value: selectedRegChild.nom },
                                        { label: t('form_firstname') || 'Prénom', value: selectedRegChild.prenom },
                                        { label: t('form_sex') || 'Sexe', value: selectedRegChild.sexe === 'M' ? (t('form_male')||'M') : selectedRegChild.sexe === 'F' ? (t('form_female')||'F') : '—' },
                                        { label: t('form_dob') || 'Date naissance', value: selectedRegChild.date_naissance || '—' },
                                        { label: t('form_nationality') || 'Nationalité', value: selectedRegChild.nationalite || '—' },
                                        { label: t('form_origin_address') || 'Adresse', value: selectedRegChild.adresse || '—' },
                                        { label: t('form_unique_id') || 'ID Unique', value: selectedRegChild.uid },
                                      ]
                                      return items.map((item, i) => (
                                        <div key={i} className="pd-row">
                                          <span className="pd-row-label">{item.label}</span>
                                          <span className="pd-row-value">{item.label === 'Nationalité' && item.value !== '—' ? (() => { const cc = countryCodeFromName(item.value); return cc ? <>{flagImg(cc, item.value)} {item.value}</> : item.value })() : item.value}</span>
                                        </div>
                                      ))
                                    })()}
                                  </div>
                                </div>
                                <div className="pd-card">
                                  <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(16,185,129,0.15)'}}>❤️</div><span className="pd-card-title">{t('hm_health_title') || 'Santé & Médical'}</span><span className="pd-card-badge">{t('pd_quick_view') || 'Résumé'}</span></div>
                                  <div className="pd-card-body">
                                    <div className="pd-health-row">
                                      {(() => { const m = selectedRegChild.extra_data?.medical || {}; return [
                                        { label: t('hm_blood_group') || 'Groupe', value: m.bloodGroup || '—' },
                                        { label: t('hm_height') || 'Taille', value: m.height ? m.height + ' cm' : '—' },
                                        { label: t('hm_weight') || 'Poids', value: m.weight ? m.weight + ' kg' : '—' },
                                        { label: t('hm_bmi') || 'IMC', value: m.bmi || '—' },
                                      ]})().map((item, i) => (
                                        <div key={i} className="pd-health-item">
                                          <div className="pd-health-label">{item.label}</div>
                                          <div className="pd-health-value">{item.value}</div>
                                        </div>
                                      ))}
                                    </div>
                                    {(() => { const m = selectedRegChild.extra_data?.medical || {}; const hasAllergies = m.allergies?.length; const hasTreatments = m.treatments?.filter(t => t.name).length; const hasChronic = m.chronic; const item = [hasAllergies ? `⚠️ ${m.allergies.length} allergie(s)` : null, hasTreatments ? `💊 ${hasTreatments} traitement(s)` : null, hasChronic ? `📋 ${m.chronic.substring(0, 30)}...` : null].filter(Boolean); return item.length ? <div style={{fontSize:'12px',color:'#94A3B8',padding:'8px 0 0',display:'flex',gap:'12px',flexWrap:'wrap'}}>{item.map((s,i) => <span key={i} style={{display:'flex',alignItems:'center',gap:'4px',padding:'2px 8px',borderRadius:'6px',background:'rgba(255,255,255,0.03)'}}>{s}</span>)}</div> : <div style={{fontSize:'12px',color:'#64748B',padding:'8px 0 0'}}>{t('pd_no_health_data') || 'Aucune donnée médicale'}</div> })()}
                                  </div>
                                </div>
                                <div className="pd-card">
                                  <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(245,158,11,0.15)'}}>🏫</div><span className="pd-card-title">{t('ed_title') || 'Scolarité'}</span><span className="pd-card-badge">{t('pd_quick_view') || 'Résumé'}</span></div>
                                  <div className="pd-card-body">
                                    <div className="pd-school-row">
                                      {(() => { const e = selectedRegChild.extra_data?.education || {}; return [
                                        { label: t('ed_school_name') || 'École', value: e.schoolName || '—' },
                                        { label: t('ed_current_class') || 'Classe', value: e.currentClass || '—' },
                                        { label: t('ed_academic_year') || 'Année', value: e.academicYear || '—' },
                                        { label: t('ed_gpa') || 'Moyenne', value: (() => { if (!e.subjects?.length) return '—'; const g = e.subjects.filter(s => s.grade).map(s => parseFloat(s.grade) * (s.coefficient || 1)); const c = e.subjects.filter(s => s.grade).reduce((a, s) => a + (s.coefficient || 1), 0); return g.length && c ? (g.reduce((a, b) => a + b, 0) / c).toFixed(1) : '—' })() },
                                      ]})().map((item, i) => (
                                        <div key={i} className="pd-health-item">
                                          <div className="pd-health-label">{item.label}</div>
                                          <div className="pd-health-value">{item.value}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* ── IDENTITY TAB ── */}
                            {profileTab === 'identity' && (
                              <div className="pd-card">
                                <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(59,130,246,0.15)'}}>🆔</div><span className="pd-card-title">{t('pd_identity') || 'Identité'}</span></div>
                                <div className="pd-card-body">
                                  {[
                                    { label: t('form_lastname') || 'Nom', value: selectedRegChild.nom },
                                    { label: t('form_firstname') || 'Prénom', value: selectedRegChild.prenom },
                                    { label: t('form_sex') || 'Sexe', value: selectedRegChild.sexe === 'M' ? (t('form_male')||'Masculin') : selectedRegChild.sexe === 'F' ? (t('form_female')||'Féminin') : '—' },
                                    { label: t('form_dob') || 'Date de naissance', value: selectedRegChild.date_naissance || '—' },
                                    { label: t('form_nationality') || 'Nationalité', value: selectedRegChild.nationalite || '—' },
                                    { label: "Adresse d'origine", value: selectedRegChild.adresse || '—' },
                                  ].map((item, i) => (
                                    <div key={i} className="pd-row">
                                      <span className="pd-row-label">{item.label}</span>
                                      <span className="pd-row-value">{item.label === 'Nationalité' && item.value !== '—' ? (() => { const cc = countryCodeFromName(item.value); return cc ? <>{flagImg(cc, item.value)} {item.value}</> : item.value })() : item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ── FAMILY TAB ── */}
                            {profileTab === 'family' && (
                              <div className="pd-card">
                                <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(168,85,247,0.15)'}}>👪</div><span className="pd-card-title">{t('form_family') || 'Situation Familiale'}</span></div>
                                <div className="pd-card-body">
                                  {[['Parents connus','Parents connus'],['Tuteurs','Tuteurs'],['Fratrie','Fratrie'],['Historique familial','Historique familial']].map(([label, key]) => {
                                    const val = selectedRegChild.extra_data?.[key]
                                    return val ? <div key={key} className="pd-row"><span className="pd-row-label">{label}</span><span className="pd-row-value">{val}</span></div> : null
                                  })}
                                  {!selectedRegChild.extra_data?.['Parents connus'] && !selectedRegChild.extra_data?.['Tuteurs'] && !selectedRegChild.extra_data?.['Fratrie'] && !selectedRegChild.extra_data?.['Historique familial'] && <div style={{fontSize:'12px',color:'#64748B',padding:'8px 0',textAlign:'center'}}>{t('pd_no_family_data') || 'Aucune information familiale'}</div>}
                                </div>
                              </div>
                            )}

                            {/* ── HEALTH TAB ── */}
                            {profileTab === 'health' && (
                              <div className="pd-card">
                                <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(239,68,68,0.15)'}}>❤️</div><span className="pd-card-title">{t('hm_health_title') || 'Santé & Médical'}</span></div>
                                <div className="pd-card-body">
                                  {(() => {
                                    const m = selectedRegChild.extra_data?.medical || {}
                                    const items = [
                                      { label: t('hm_blood_group') || 'Groupe', value: m.bloodGroup },
                                      { label: t('hm_height') || 'Taille (cm)', value: m.height },
                                      { label: t('hm_weight') || 'Poids (kg)', value: m.weight },
                                      { label: t('hm_bmi') || 'IMC', value: m.bmi },
                                      { label: t('hm_blood_pressure') || 'Tension', value: m.bloodPressure },
                                      { label: t('hm_heart_rate') || 'FC', value: m.heartRate },
                                      { label: t('hm_temperature') || 'Temp.', value: m.temperature },
                                      { label: t('hm_spo2') || 'SpO₂', value: m.spo2 },
                                      { label: t('hm_chronic') || 'Maladies', value: m.chronic },
                                      { label: t('hm_surgeries') || 'Chirurgies', value: m.surgeries },
                                      { label: t('hm_hospitalization') || 'Hospitalisations', value: m.hospitalization },
                                      { label: t('hm_family_history') || 'Ant. familiaux', value: m.familyHistory },
                                      { label: t('hm_disabilities') || 'Handicaps', value: m.disabilities },
                                      { label: t('hm_emergency_contact') || 'Contact urgence', value: m.emergencyContact },
                                      { label: t('hm_primary_doc') || 'Médecin', value: m.primaryDoctor },
                                      { label: t('hm_hospital') || 'Hôpital', value: m.hospital },
                                    ]
                                    const filled = items.filter(i => i.value)
                                    return filled.length ? filled.map((item, i) => <div key={i} className="pd-row"><span className="pd-row-label">{item.label}</span><span className="pd-row-value">{item.value}</span></div>) : <div style={{fontSize:'12px',color:'#64748B',padding:'8px 0',textAlign:'center'}}>{t('pd_no_health_data') || 'Aucune donnée médicale'}</div>
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* ── EDUCATION TAB ── */}
                            {profileTab === 'education' && (
                              <div className="pd-card">
                                <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(16,185,129,0.15)'}}>🏫</div><span className="pd-card-title">{t('ed_title') || 'Scolarité'}</span></div>
                                <div className="pd-card-body">
                                  {(() => {
                                    const e = selectedRegChild.extra_data?.education || {}
                                    const items = [
                                      { label: t('ed_school_name') || 'École', value: e.schoolName },
                                      { label: t('ed_school_type') || "Type d'école", value: e.schoolType },
                                      { label: t('ed_current_class') || 'Classe', value: e.currentClass },
                                      { label: t('ed_academic_year') || 'Année scolaire', value: e.academicYear },
                                      { label: t('ed_term') || 'Trimestre', value: e.term },
                                      { label: t('ed_student_number') || 'N° étudiant', value: e.studentNumber },
                                      { label: t('ed_education_level') || "Niveau d'études", value: e.educationLevel },
                                      { label: t('ed_enrollment_date') || "Date d'inscription", value: e.enrollmentDate },
                                      { label: t('ed_gpa') || 'Moyenne', value: (() => { if (!e.subjects?.length) return ''; const g = e.subjects.filter(s => s.grade).map(s => parseFloat(s.grade) * (s.coefficient || 1)); const c = e.subjects.filter(s => s.grade).reduce((a, s) => a + (s.coefficient || 1), 0); return g.length && c ? (g.reduce((a, b) => a + b, 0) / c).toFixed(1) : '' })() },
                                      { label: t('ed_rank') || 'Rang', value: e.rank },
                                      { label: t('ed_present') || 'Présences', value: e.presentDays ? e.presentDays + 'j' : '' },
                                      { label: t('ed_absent') || 'Absences', value: e.absentDays ? e.absentDays + 'j' : '' },
                                      { label: t('ed_scholarship') || "Bourse", value: e.scholarship },
                                      { label: t('ed_learning_difficulties') || 'Difficultés', value: e.learningDifficulties },
                                      { label: t('ed_special_needs') || 'Besoins spéciaux', value: e.specialNeeds },
                                    ]
                                    const filled = items.filter(i => i.value)
                                    return filled.length ? filled.map((item, i) => <div key={i} className="pd-row"><span className="pd-row-label">{item.label}</span><span className="pd-row-value">{item.value}</span></div>) : <div style={{fontSize:'12px',color:'#64748B',padding:'8px 0',textAlign:'center'}}>{t('pd_no_education_data') || 'Aucune donnée scolaire'}</div>
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* ── DOCUMENTS TAB ── */}
                            {profileTab === 'documents' && (
                              <div className="pd-card">
                                <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(245,158,11,0.15)'}}>📄</div><span className="pd-card-title">{t('child_documents') || 'Documents'}</span></div>
                                <div className="pd-card-body">
                                  <div className="pd-docs">
                                    {[
                                      { id:'acte', icon:'📜', label: t('doc_acte') || 'Acte de naissance', key:'cdo_doc_' + selectedRegChild.uid + '_Acte de naissance' },
                                      { id:'identite', icon:'🆔', label: t('doc_identite') || "Documents d'identité", key:'cdo_doc_' + selectedRegChild.uid + "_Documents d'identité" },
                                      { id:'judiciaire', icon:'⚖️', label: t('doc_judiciaire') || 'Décisions judiciaires', key:'cdo_doc_' + selectedRegChild.uid + '_Décisions judiciaires' },
                                      { id:'presc', icon:'📝', label: t('hm_upload_prescription') || 'Prescriptions', key:'cdo_meddoc_' + selectedRegChild.uid + '_presc' },
                                      { id:'report', icon:'📊', label: t('hm_upload_report') || 'Rapports médicaux', key:'cdo_meddoc_' + selectedRegChild.uid + '_reports' },
                                      { id:'lab', icon:'🔬', label: t('hm_upload_lab') || 'Résultats labo', key:'cdo_meddoc_' + selectedRegChild.uid + '_lab' },
                                      { id:'bulletin', icon:'📋', label: t('ed_report_card') || 'Bulletins', key:'cdo_schooldoc_' + selectedRegChild.uid + '_report' },
                                      { id:'certificat', icon:'🏅', label: t('ed_certificate') || 'Certificats', key:'cdo_schooldoc_' + selectedRegChild.uid + '_cert' },
                                      { id:'inscription', icon:'📝', label: t('ed_enrollment_letter') || "Lettres d'inscription", key:'cdo_schooldoc_' + selectedRegChild.uid + '_enroll' },
                                    ].map(doc => {
                                      const saved = localStorage.getItem(doc.key)
                                      return (
                                        <div key={doc.id} className="pd-doc">
                                          <div className="pd-doc-icon">{doc.icon}</div>
                                          <span className="pd-doc-name">{doc.label}</span>
                                          <div className="pd-doc-meta"><span className={`pd-doc-status ${saved ? 'uploaded' : 'missing'}`}>{saved ? (t('doc_uploaded') || 'Importé') : (t('doc_missing') || 'Manquant')}</span></div>
                                          <div className="pd-doc-actions">
                                            {saved && <button className="pd-doc-act preview" onClick={() => window.open(saved)}>👁️ {t('doc_preview') || 'Voir'}</button>}
                                            {saved && <button className="pd-doc-act download" onClick={() => { const a = document.createElement('a'); a.href = saved; a.download = doc.label + '.jpg'; a.click() }}>⬇️ {t('doc_download') || 'Tél.'}</button>}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ── UPDATES TAB ── */}
                            {profileTab === 'updates' && (
                              <div className="uc-wrap">
                                <div className="uc-header">
                                  <span className="uc-header-icon">📝</span>
                                  <span className="uc-header-title">{t('uc_title') || 'Centre de Mise à Jour'}</span>
                                  {ucStep > 0 && <button className="uc-back-top" onClick={() => { if (ucStep === 1) { setUcStep(0); setUcCategory(null); setUcType(''); setUcTitle(''); setUcDescription(''); setUcPrevValue(''); setUcNewValue(''); setUcReason(''); setUcFiles([]); setUcSuccess(false) } else setUcStep(s => s - 1) }}>← {t('form_back')}</button>}
                                  {ucStep > 0 && <button className="uc-back-top" style={{marginLeft:'auto'}} onClick={() => { setUcStep(0); setUcCategory(null); setUcType(''); setUcTitle(''); setUcDescription(''); setUcPrevValue(''); setUcNewValue(''); setUcReason(''); setUcFiles([]); setUcSuccess(false) }}>{t('form_cancel') || 'Cancel'}</button>}
                                </div>
                                <div className="uc-steps">
                                  {[t('uc_select_category')||'Catégorie', t('uc_fill_form')||'Détails', t('uc_reason')||'Raison', t('uc_review_save')||'Confirmer'].map((s, i) => (
                                    <div key={i} className={`uc-step${ucStep === i ? ' active' : ''}${ucStep > i ? ' done' : ''}`}>
                                      <div className="uc-step-num">{ucStep > i ? '✓' : i + 1}</div>
                                      <span className="uc-step-label">{s}</span>
                                    </div>
                                  ))}
                                </div>
                                {ucSuccess ? (
                                  <div className="uc-success">
                                    <div className="uc-success-icon">✅</div>
                                    <div className="uc-success-text">{t('uc_success') || 'Mise à jour enregistrée !'}</div>
                                    <button className="uc-btn-primary" onClick={() => { setUcStep(0); setUcCategory(null); setUcType(''); setUcTitle(''); setUcDescription(''); setUcPrevValue(''); setUcNewValue(''); setUcReason(''); setUcFiles([]); setUcSuccess(false); setProfileTab('history') }}>{t('pd_history') || 'Voir historique'}</button>
                                  </div>
                                ) : ucStep === 0 ? (
                                  <div className="uc-categories">
                                    {UC_CATEGORIES.map(cat => (
                                      <button key={cat.key} className="uc-cat-card" style={{'--cat-color':cat.color}} onClick={() => { setUcCategory(cat.key); setUcStep(1) }}>
                                        <span className="uc-cat-icon">{cat.icon}</span>
                                        <span className="uc-cat-label">{cat.label}</span>
                                        <span className="uc-cat-desc">{cat.desc}</span>
                                      </button>
                                    ))}
                                  </div>
                                ) : ucStep === 1 ? (
                                  <div className="uc-form">
                                    <div className="uc-form-group">
                                      <label className="uc-label">{t('uc_category') || 'Type'}</label>
                                      <div className="uc-type-grid">
                                        {UC_CATEGORIES.find(c => c.key === ucCategory)?.types.map(tp => (
                                          <button key={tp.key} className={`uc-type-btn${ucType === tp.key ? ' active' : ''}`} onClick={() => { setUcType(tp.key); setUcTitle((t('uc_type_' + tp.key) || tp.label || tp.key.replace(/_/g, ' ')) + ' - ' + (selectedRegChild?.prenom || '') + ' ' + (selectedRegChild?.nom || '')) }}>
                                            {t('uc_type_' + tp) || tp.replace(/_/g, ' ')}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    {ucType && <>
                                      <div className="uc-form-group">
                                        <label className="uc-label" htmlFor="uc-title">{t('form_title') || 'Titre'}</label>
                                        <input id="uc-title" className="uc-input" value={ucTitle} onChange={e => setUcTitle(e.target.value)} placeholder={t('uc_title_placeholder')||'Titre...'} />
                                      </div>
                                      <div className="uc-form-group">
                                        <label className="uc-label" htmlFor="uc-desc">{t('form_description') || 'Description'}</label>
                                        <textarea id="uc-desc" className="uc-input uc-textarea" value={ucDescription} onChange={e => setUcDescription(e.target.value)} placeholder={t('uc_description_placeholder')||'Décrivez...'} rows={3} />
                                      </div>
                                      <div className="uc-form-row">
                                        <div className="uc-form-group">
                                          <label className="uc-label" htmlFor="uc-prev">{t('hc_old_value') || 'Ancien'}</label>
                                          <textarea id="uc-prev" className="uc-input uc-textarea" value={ucPrevValue} onChange={e => setUcPrevValue(e.target.value)} placeholder={t('uc_prev_value_placeholder')||'Ancien...'} rows={2} />
                                        </div>
                                        <div className="uc-form-group">
                                          <label className="uc-label" htmlFor="uc-new">{t('hc_new_value') || 'Nouveau'}</label>
                                          <textarea id="uc-new" className="uc-input uc-textarea" value={ucNewValue} onChange={e => setUcNewValue(e.target.value)} placeholder={t('uc_new_value_placeholder')||'Nouveau...'} rows={2} />
                                        </div>
                                      </div>
                                      <button className="uc-btn-primary" onClick={() => { if (!ucTitle.trim()) { alert(t('uc_required')||'Requis'); return } setUcStep(2) }}>{t('form_next')||'Suivant'} →</button>
                                    </>}
                                  </div>
                                ) : ucStep === 2 ? (
                                  <div className="uc-form">
                                    <div className="uc-form-group">
                                      <label className="uc-label" htmlFor="uc-reason">{t('uc_reason') || 'Motif'}</label>
                                      <textarea id="uc-reason" className="uc-input uc-textarea" value={ucReason} onChange={e => setUcReason(e.target.value)} placeholder={t('uc_reason_placeholder')||'Raison...'} rows={3} />
                                    </div>
                                    <div className="uc-form-group">
                                      <label className="uc-label">{t('uc_attachments') || 'Fichiers'}</label>
                                      <div className="uc-dropzone" onClick={() => document.getElementById('uc-file-input')?.click()}>
                                        <input id="uc-file-input" type="file" multiple hidden onChange={e => { const files = Array.from(e.target.files || []); setUcFiles(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size, file: f }))]) }} />
                                        <div className="uc-dropzone-content">
                                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                          <p>{t('uc_drag_drop')||'Glissez-déposez'}</p>
                                          <span className="uc-dropzone-hint">{t('uc_click_browse')||'ou cliquez'}</span>
                                        </div>
                                      </div>
                                      {ucFiles.length > 0 && <div className="uc-file-list">{ucFiles.map((f, i) => (
                                        <div key={i} className="uc-file-item">
                                          <span className="uc-file-name">📎 {f.name}</span>
                                          <span className="uc-file-size">{(f.size/1024).toFixed(0)} Ko</span>
                                          <button className="uc-file-remove" onClick={() => setUcFiles(prev => prev.filter((_, j) => j !== i))}>✕</button>
                                        </div>
                                      ))}</div>}
                                    </div>
                                    <div className="uc-form-actions">
                                      <button className="uc-btn-secondary" onClick={() => setUcStep(1)}>← {t('form_back')}</button>
                                      <button className="uc-btn-primary" onClick={() => { if (!ucReason.trim() && ucFiles.length === 0) { if (!confirm(t('uc_save')||'Enregistrer sans raison ?')) return } setUcStep(3) }}>{t('form_next')||'Suivant'} →</button>
                                    </div>
                                  </div>
                                ) : ucStep === 3 ? (
                                  <div className="uc-preview">
                                    <div className="uc-preview-card">
                                      <div className="uc-preview-header">
                                        <span className="uc-preview-badge" style={{background:UC_CATEGORIES.find(c => c.key === ucCategory)?.color}}>{UC_CATEGORIES.find(c => c.key === ucCategory)?.icon} {UC_CATEGORIES.find(c => c.key === ucCategory)?.label}</span>
                                        <span className="uc-preview-type">{t('uc_type_' + ucType) || ucType.replace(/_/g,' ')}</span>
                                      </div>
                                      <h4 className="uc-preview-title">{ucTitle}</h4>
                                      {ucDescription && <p className="uc-preview-desc">{ucDescription}</p>}
                                      {(ucPrevValue || ucNewValue) && <div className="uc-preview-values">
                                        {ucPrevValue && <div className="uc-preview-old"><strong>{t('hc_old_value')||'Ancien'}:</strong> {ucPrevValue}</div>}
                                        {ucNewValue && <div className="uc-preview-new"><strong>{t('hc_new_value')||'Nouveau'}:</strong> {ucNewValue}</div>}
                                      </div>}
                                      {ucReason && <div className="uc-preview-reason"><strong>{t('uc_reason')||'Motif'}:</strong> {ucReason}</div>}
                                      {ucFiles.length > 0 && <div className="uc-preview-files"><strong>{t('uc_attachments')||'Fichiers'}:</strong> {ucFiles.map(f => f.name).join(', ')}</div>}
                                    </div>
                                    <div className="uc-timeline-preview">
                                      <div className="uc-tl-preview-title">{t('uc_preview')||'Aperçu'}</div>
                                      <div className="pd-tl-item" style={{background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'12px'}}>
                                        <div className="pd-tl-dot" style={{background:UC_CATEGORIES.find(c => c.key === ucCategory)?.color}}>{UC_CATEGORIES.find(c => c.key === ucCategory)?.icon}</div>
                                        <div className="pd-tl-content">
                                          <div className="pd-tl-text" style={{fontWeight:'600'}}>{ucTitle}</div>
                                          <div className="pd-tl-time">{new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                                          <div style={{fontSize:'11px',color:'#64748b',marginTop:'4px'}}>{t('hc_performed_by')||'Par'}: {user?.first_name||''} {user?.last_name||''}</div>
                                        </div>
                                      </div>
                                    </div>
                                    <button className="uc-btn-primary uc-btn-save" onClick={async () => {
                                      setUcSaving(true)
                                      const token = localStorage.getItem('access_token')
                                      const body = JSON.stringify({ category: ucCategory, update_type: ucType, title: ucTitle, description: ucDescription, previous_value: ucPrevValue, new_value: ucNewValue, reason: ucReason, attachments: ucFiles.map(f => f.name) })
                                      try {
                                        const res = await fetch(`${API}/enfants/${selectedRegChild.id}/updates/`, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) }, body })
                                        if (res.ok) { setUcSaving(false); setUcSuccess(true); setUcStep(4) }
                                        else throw new Error()
                                      } catch {
                                        const updates = JSON.parse(localStorage.getItem('cdo_updates_' + selectedRegChild.uid) || '[]')
                                        updates.unshift({ id:Date.now(), category:ucCategory, update_type:ucType, title:ucTitle, description:ucDescription, previous_value:ucPrevValue, new_value:ucNewValue, reason:ucReason, attachments:ucFiles.map(f => f.name), created_at:new Date().toISOString(), created_by:(user?.first_name||'')+' '+(user?.last_name||'') })
                                        localStorage.setItem('cdo_updates_' + selectedRegChild.uid, JSON.stringify(updates))
                                        setUcSaving(false); setUcSuccess(true); setUcStep(4)
                                      }
                                    }} disabled={ucSaving}>
                                      {ucSaving ? (t('uc_saving')||'Saving...') : (t('uc_save')||'Enregistrer')}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {/* ── HISTORY CENTER ── */}
                            {profileTab === 'history' && (() => {
                            const hcIcons = {
                              created:'✅', updated:'✏️', update_added:'📝',
                              document_added:'📄', document_verified:'✅', document_replaced:'🔄', document_expired:'⏰',
                              health_update:'💉', vaccination_added:'💉', illness_added:'🤒',
                              treatment_started:'💊', treatment_ended:'✅', consultation_added:'🩺',
                              hospitalization_added:'🏥', allergy_added:'🤧',
                              education_update:'📚', school_enrolled:'🏫', school_changed:'🔄',
                              grade_added:'📊', exam_result_added:'📝',
                              family_update:'👨‍👩‍👧‍👦', guardian_assigned:'👤', parent_identified:'🔍',
                              family_reunified:'🤗', foster_placement:'🏡', adoption_progress:'📋',
                              social_update:'🤝', social_note_added:'📝', home_visit:'🏠',
                              counseling_session:'💬', incident_reported:'⚠️', protection_concern:'🛡️',
                              status_change:'🔄', alert_triggered:'🚨', note_added:'💬', case_note:'📌',
                              file_downloaded:'⬇️', record_approved:'✅', record_rejected:'❌',
                              notification_sent:'🔔', child_archived:'📦', child_restored:'♻️',
                              follow_up:'📋', observation_added:'👁️', transfer_initiated:'🚚', exit_registered:'🚪',
                            }
                            const hcColors = {
                              general:'#64748b', registration:'#22c55e', identity:'#3b82f6', status:'#f59e0b',
                              health:'#22c55e', education:'#3b82f6', family:'#a855f7',
                              documents:'#f59e0b', social:'#ef4444', protection:'#ef4444',
                              alert:'#ef4444', system:'#64748b', follow_up:'#06b6d4',
                            }
                            const criticalEventTypes = ['alert_triggered','protection_concern','incident_reported','hospitalization_added','exit_registered','child_archived','transfer_initiated']
                            const criticalPriorities = ['critical','high']
                            const hcLoadEvents = (child) => {
                              const stored = JSON.parse(localStorage.getItem('cdo_updates_' + child.uid) || '[]')
                              const med = child.extra_data?.medical
                              const vax = med?.vaccinations?.filter(v => v.done).map(v => ({ event_type:'vaccination_added', category:'health', title:`Vaccination ${v.name}`, description:'', old_value:'Non administré', new_value:'Administré le '+(v.dateAdmin||'—'), performed_by_name:'', performed_role:'', department:'', attachments:[], priority:'normal', source_module:'health', event_date:v.dateAdmin||child.created_at })) || []
                              const edu = child.extra_data?.education
                              const grades = edu?.subjects?.filter(s => s.grade).map(s => ({ event_type:'grade_added', category:'education', title:`Note ${s.name}`, description:'', old_value:'', new_value:`${s.grade}/20`, performed_by_name:'', performed_role:'', department:'', attachments:[], priority:'normal', source_module:'education', event_date:child.updated_at })) || []
                              const all = [
                                ...stored.map(s => ({ ...s, event_type:s.event_type||'update_added', performed_by_name:s.created_by||s.created_by_name||'', department:s.department||'', priority:s.priority||'normal', source_module:s.source_module||'update_center', attachments:s.attachments||[], event_date:s.event_date||s.created_at })),
                                ...vax, ...grades,
                                { event_type:'created', category:'registration', title:t('pd_registered')||'Enfant enregistré', description:'Nouvel enregistrement dans le système', old_value:'', new_value:`UID: ${child.uid}`, performed_by_name:(user?.first_name||'')+' '+(user?.last_name||''), performed_role:user?.role||'', department:'', attachments:[], priority:'normal', source_module:'registration', event_date:child.created_at },
                              ]
                              return all.sort((a, b) => new Date(b.event_date||0) - new Date(a.event_date||0))
                            }
                            const hcLocalEvents = hcLoadEvents(selectedRegChild)
                            const hcFiltered = hcLocalEvents.filter(e => {
                              if (hcFilterCategory && e.category !== hcFilterCategory) return false
                              if (hcFilterType && e.event_type !== hcFilterType) return false
                              if (hcFilterPriority && e.priority !== hcFilterPriority) return false
                              if (hcFilterSource && e.source_module !== hcFilterSource) return false
                              if (hcStatusOnly && e.event_type !== 'status_change') return false
                              if (hcDateFrom && new Date(e.event_date||0) < new Date(hcDateFrom)) return false
                              if (hcDateTo && new Date(e.event_date||0) > new Date(hcDateTo+'T23:59:59')) return false
                              if (hcSearch && !(e.title||'').toLowerCase().includes(hcSearch.toLowerCase()) && !(e.description||'').toLowerCase().includes(hcSearch.toLowerCase()) && !(e.performed_by_name||'').toLowerCase().includes(hcSearch.toLowerCase()) && !(e.reason||'').toLowerCase().includes(hcSearch.toLowerCase())) return false
                              return true
                            })
                            const hcStatsLocal = {
                              total: hcLocalEvents.length,
                              status_changes: hcLocalEvents.filter(e => e.event_type === 'status_change').length,
                              health_events: hcLocalEvents.filter(e => e.category === 'health').length,
                              education_events: hcLocalEvents.filter(e => e.category === 'education').length,
                              family_events: hcLocalEvents.filter(e => e.category === 'family').length,
                              document_events: hcLocalEvents.filter(e => e.category === 'documents').length,
                              alert_events: hcLocalEvents.filter(e => e.category === 'alert' || e.category === 'protection' || e.priority === 'critical').length,
                            }
                            const hcGroupEvents = (events) => {
                              const today = new Date(); today.setHours(0,0,0,0)
                              const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1)
                              const weekStart = new Date(today); weekStart.setDate(weekStart.getDate()-weekStart.getDay())
                              const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
                              const groups = { today:[], yesterday:[], thisWeek:[], thisMonth:[], older:[] }
                              events.forEach(e => {
                                const d = new Date(e.event_date||0); d.setHours(0,0,0,0)
                                if (d.getTime() === today.getTime()) groups.today.push(e)
                                else if (d.getTime() === yesterday.getTime()) groups.yesterday.push(e)
                                else if (d >= weekStart) groups.thisWeek.push(e)
                                else if (d >= monthStart) groups.thisMonth.push(e)
                                else groups.older.push(e)
                              })
                              return groups
                            }
                            const hcGrouped = hcGroupEvents(hcFiltered)
                            const hcGroupLabels = { today:t('hc_group_today')||"Aujourd'hui", yesterday:t('hc_group_yesterday')||'Hier', thisWeek:t('hc_group_this_week')||'Cette semaine', thisMonth:t('hc_group_this_month')||'Ce mois-ci', older:t('hc_group_older')||'Plus ancien' }
                            const hcDensityClass = hcDensity === 'compact' ? ' hc-density-compact' : hcDensity === 'audit' ? ' hc-density-audit' : ''
                            return (
                              <div className="hc-wrap">
                                {/* ── Stats Row ── */}
                                <div className="hc-kpi-row">
                                  {[
                                    { label:t('hc_total_events')||'Événements', value:hcStatsLocal.total, icon:'📊', color:'#3b82f6' },
                                    { label:t('hc_status_changes')||'Statuts', value:hcStatsLocal.status_changes, icon:'🔄', color:'#f59e0b' },
                                    { label:t('hc_health_events')||'Santé', value:hcStatsLocal.health_events, icon:'💉', color:'#22c55e' },
                                    { label:t('hc_education_events')||'Éducation', value:hcStatsLocal.education_events, icon:'📚', color:'#3b82f6' },
                                    { label:t('hc_family_events')||'Famille', value:hcStatsLocal.family_events, icon:'👨‍👩‍👧‍👦', color:'#a855f7' },
                                    { label:t('hc_documents_events')||'Documents', value:hcStatsLocal.document_events, icon:'📄', color:'#f59e0b' },
                                    { label:t('hc_alert_events')||'Alertes', value:hcStatsLocal.alert_events, icon:'🚨', color:'#ef4444' },
                                  ].map((kpi, i) => (
                                    <div key={i} className="hc-kpi" style={{borderLeftColor:kpi.color}}>
                                      <span className="hc-kpi-icon">{kpi.icon}</span>
                                      <div className="hc-kpi-info"><span className="hc-kpi-value">{kpi.value}</span><span className="hc-kpi-label">{kpi.label}</span></div>
                                    </div>
                                  ))}
                                </div>

                                {/* ── Toolbar ── */}
                                <div className="hc-toolbar">
                                  <div className="hc-view-tabs">
                                    {[
                                      { key:'timeline', icon:'📋', label:t('hc_timeline')||'Chronologie' },
                                      { key:'audit', icon:'📋', label:t('hc_audit_log')||'Audit' },
                                      { key:'calendar', icon:'📅', label:t('hc_calendar')||'Calendrier' },
                                      { key:'analytics', icon:'📊', label:t('hc_analytics')||'Analytiques' },
                                    ].map(v => (
                                      <button key={v.key} className={`hc-view-tab${hcView === v.key ? ' active' : ''}`} onClick={() => setHcView(v.key)}>{v.icon} {v.label}</button>
                                    ))}
                                  </div>
                                  <div className="hc-toolbar-actions">
                                    {hcView === 'timeline' && (
                                      <div className="hc-density-group">
                                        {['comfortable','compact','audit'].map(d => (
                                          <button key={d} className={`hc-density-btn${hcDensity === d ? ' active' : ''}`} onClick={() => setHcDensity(d)}>
                                            {d === 'comfortable' ? '⋅⋅' : d === 'compact' ? '··' : '━━'} {t('hc_density_'+d)||d}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    <button className="hc-export-btn" onClick={() => {
                                      const csv = [['Date','Catégorie','Type','Titre','Ancien','Nouveau','Par','Motif'].join(',')].concat(hcFiltered.map(e => [e.event_date||'',e.category||'',e.event_type||'',`"${(e.title||'').replace(/"/g,'""')}"`,`"${(e.old_value||'').replace(/"/g,'""')}"`,`"${(e.new_value||'').replace(/"/g,'""')}"`,e.performed_by_name||'',`"${(e.reason||'').replace(/"/g,'""')}"`].join(','))).join('\n')
                                      const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'})
                                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `historique_${selectedRegChild.uid}.csv`; a.click()
                                    }}>{t('hc_export')||'Exporter'} ⬇️</button>
                                  </div>
                                </div>

                                {/* ── Filters ── */}
                                <div className="hc-filters">
                                  <select className="hc-filter-select" value={hcFilterCategory} onChange={e => setHcFilterCategory(e.target.value)} title={t('hc_select_category')||'Catégorie'}>
                                    <option value="">{t('hc_all_categories')||'Toutes catégories'}</option>
                                    {Object.keys(hcColors).map(c => <option key={c} value={c}>{t('uc_category_'+c)||c}</option>)}
                                  </select>
                                  <select className="hc-filter-select" value={hcFilterType} onChange={e => setHcFilterType(e.target.value)} title={t('hc_all_types')||'Type'}>
                                    <option value="">{t('hc_all_types')||'Tous types'}</option>
                                    {Object.entries(hcIcons).map(([k, icon]) => <option key={k} value={k}>{icon} {t('hc_event_'+k)||k}</option>)}
                                  </select>
                                  <select className="hc-filter-select" value={hcFilterPriority} onChange={e => setHcFilterPriority(e.target.value)} title={t('hc_filter_priority')||'Priorité'}>
                                    <option value="">{t('hc_select_priority')||'Toutes priorités'}</option>
                                    {['low','normal','high','critical'].map(p => <option key={p} value={p}>{t('hc_priority_'+p)||p}</option>)}
                                  </select>
                                  <select className="hc-filter-select" value={hcFilterSource} onChange={e => setHcFilterSource(e.target.value)} title={t('hc_filter_source')||'Module'}>
                                    <option value="">{t('hc_filter_source')||'Module'}</option>
                                    {['registration','child_profile','health','education','family','documents','social','update_center','status','system','alert','follow_up'].map(s => <option key={s} value={s}>{t('hc_source_'+s)||s}</option>)}
                                  </select>
                                  <input type="date" className="hc-filter-date" value={hcDateFrom} onChange={e => setHcDateFrom(e.target.value)} title={t('hc_date_from')||'Du'} />
                                  <input type="date" className="hc-filter-date" value={hcDateTo} onChange={e => setHcDateTo(e.target.value)} title={t('hc_date_to')||'Au'} />
                                  <div className="hc-date-presets">
                                    {[
                                      { key:'7d', label:t('hc_preset_7d')||'7 jours', days:7 },
                                      { key:'30d', label:t('hc_preset_30d')||'30 jours', days:30 },
                                      { key:'tm', label:t('hc_preset_this_month')||'Ce mois', fn:()=>{const d=new Date(),y=d.getFullYear(),m=d.getMonth();return{from:new Date(y,m,1).toISOString().split('T')[0],to:d.toISOString().split('T')[0]}} },
                                      { key:'lm', label:t('hc_preset_last_month')||'Mois dernier', fn:()=>{const d=new Date(),y=d.getFullYear(),m=d.getMonth();return{from:new Date(y,m-1,1).toISOString().split('T')[0],to:new Date(y,m,0).toISOString().split('T')[0]}} },
                                    ].map(p => (
                                      <button key={p.key} className={`hc-preset-btn${hcDateFrom && p.fn ? '' : ''}`} onClick={() => {
                                        if (p.fn) { const r=p.fn(); setHcDateFrom(r.from); setHcDateTo(r.to) }
                                        else { const d=new Date(),f=new Date(d); f.setDate(d.getDate()-p.days); setHcDateFrom(f.toISOString().split('T')[0]); setHcDateTo(d.toISOString().split('T')[0]) }
                                      }}>{p.label}</button>
                                    ))}
                                  </div>
                                  <div className="hc-search-wrap">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                    <input className="hc-search-input" value={hcSearch} onChange={e => setHcSearch(e.target.value)} placeholder={t('hc_search_events')||'Rechercher...'} />
                                  </div>
                                  <label className="hc-status-toggle">
                                    <input type="checkbox" checked={hcStatusOnly} onChange={e => setHcStatusOnly(e.target.checked)} />
                                    <span>{t('hc_filter_status_only')||'Statuts'}</span>
                                  </label>
                                  {(hcFilterCategory||hcFilterType||hcFilterPriority||hcFilterSource||hcSearch||hcDateFrom||hcDateTo||hcStatusOnly) && (
                                    <button className="hc-clear-btn" onClick={() => { setHcFilterCategory(''); setHcFilterType(''); setHcFilterPriority(''); setHcFilterSource(''); setHcSearch(''); setHcDateFrom(''); setHcDateTo(''); setHcStatusOnly(false) }}>{t('hc_clear_filters')||'✕ Effacer'}</button>
                                  )}
                                  <span className="hc-filter-count">{hcFiltered.length} / {hcLocalEvents.length} {t('hc_events_count')||'événements'}</span>
                                </div>

                                {/* ── Timeline View ── */}
                                {hcView === 'timeline' && (
                                  <div className={`hc-timeline${hcDensityClass}`}>
                                    {hcFiltered.length === 0 && <div className="hc-empty"><span className="hc-empty-icon">📭</span><p>{t('hc_no_events')||'Aucun événement'}</p></div>}
                                    {hcDensity === 'comfortable' ? (
                                      <>
                                        {Object.entries(hcGrouped).filter(([_, evs]) => evs.length > 0).map(([groupKey, events]) => (
                                          <div key={groupKey} className="hc-tl-group">
                                            <div className="hc-tl-group-header">
                                              <span className="hc-tl-group-label">{hcGroupLabels[groupKey]||groupKey}</span>
                                              <span className="hc-tl-group-count">{events.length} {t('hc_events_count')||'événements'}</span>
                                            </div>
                                            {events.map((event, i) => (
                                              <div key={i} className={`hc-tl-item${hcExpanded === groupKey+'_'+i ? ' expanded' : ''}${criticalEventTypes.includes(event.event_type)||criticalPriorities.includes(event.priority) ? ' hc-tl-critical' : ''}${event.event_type === 'status_change' ? ' hc-tl-status-change' : ''}`}
                                                onClick={() => { const k = groupKey+'_'+i; setHcExpanded(hcExpanded === k ? null : k); setHcSelectedEvent(event) }}
                                              >
                                                <div className="hc-tl-line" />
                                                <div className="hc-tl-dot" style={{background:hcColors[event.category]||'#64748b'}}>{hcIcons[event.event_type]||'📌'}</div>
                                                <div className="hc-tl-card">
                                                  <div className="hc-tl-card-top">
                                                    <span className="hc-tl-badge" style={{background:hcColors[event.category]||'#64748b'}}>{event.category ? (t('uc_category_'+event.category)||event.category) : ''}</span>
                                                    {event.priority && event.priority !== 'normal' && <span className={`hc-tl-priority hc-tl-priority-${event.priority}`}>{t('hc_priority_'+event.priority)||event.priority}</span>}
                                                    <span className="hc-tl-time">{event.event_date ? new Date(event.event_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</span>
                                                  </div>
                                                  <div className="hc-tl-title">{event.title}</div>
                                                  {event.event_type === 'status_change' && event.old_value && event.new_value && (
                                                    <div className="hc-tl-status-beforeafter">
                                                      <span className="hc-tl-status-badge hc-tl-status-old">{event.old_value}</span>
                                                      <span className="hc-tl-arrow">{t('hc_old_new_separator')||'→'}</span>
                                                      <span className="hc-tl-status-badge hc-tl-status-new">{event.new_value}</span>
                                                    </div>
                                                  )}
                                                  {event.performed_by_name && <div className="hc-tl-meta">{t('hc_performed_by')||'Par'}: {event.performed_by_name}{event.performed_role ? ' ('+event.performed_role+')' : ''}</div>}
                                                  {hcExpanded === groupKey+'_'+i && (
                                                    <div className="hc-tl-details">
                                                      {event.description && <div className="hc-tl-detail-row"><strong>{t('form_description')||'Description'}:</strong><span>{event.description}</span></div>}
                                                      {event.old_value && event.event_type !== 'status_change' && <div className="hc-tl-detail-row"><strong style={{color:'#ef4444'}}>{t('hc_old_value')||'Ancien'}:</strong><span>{event.old_value}</span></div>}
                                                      {event.new_value && event.event_type !== 'status_change' && <div className="hc-tl-detail-row"><strong style={{color:'#22c55e'}}>{t('hc_new_value')||'Nouveau'}:</strong><span>{event.new_value}</span></div>}
                                                      {event.reason && <div className="hc-tl-detail-row"><strong>{t('hc_reason')||'Motif'}:</strong><span>{event.reason}</span></div>}
                                                      {event.department && <div className="hc-tl-detail-row"><strong>{t('hc_department')||'Département'}:</strong><span>{event.department}</span></div>}
                                                      {event.source_module && <div className="hc-tl-detail-row"><strong>{t('hc_source_module')||'Module'}:</strong><span>{t('hc_source_'+event.source_module)||event.source_module}</span></div>}
                                                      {event.attachments?.length > 0 && (
                                                        <div className="hc-tl-detail-row"><strong>{t('hc_attachments')||'Fichiers'} ({event.attachments.length})</strong>
                                                          <div className="hc-tl-attachments">{event.attachments.map((a, ai) => <span key={ai} className="hc-tl-attach-file">📎 {a}</span>)}</div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                  <div className="hc-tl-expand">{hcExpanded === groupKey+'_'+i ? '▲' : '▼'}</div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ))}
                                      </>
                                    ) : (
                                      /* Compact / Audit mode */
                                      hcFiltered.map((event, i) => (
                                        <div key={i} className={`hc-tl-item${hcExpanded === i ? ' expanded' : ''}${criticalEventTypes.includes(event.event_type)||criticalPriorities.includes(event.priority) ? ' hc-tl-critical' : ''}${event.event_type === 'status_change' ? ' hc-tl-status-change' : ''}`}
                                          onClick={() => { setHcExpanded(hcExpanded === i ? null : i); setHcSelectedEvent(event) }}
                                        >
                                          <div className="hc-tl-line" />
                                          <div className="hc-tl-dot" style={{background:hcColors[event.category]||'#64748b'}}>{hcIcons[event.event_type]||'📌'}</div>
                                          <div className={`hc-tl-card${hcDensity === 'audit' ? ' hc-tl-card-audit' : ''}`}>
                                            <div className="hc-tl-card-top">
                                              <span className="hc-tl-badge" style={{background:hcColors[event.category]||'#64748b'}}>{event.category || ''}</span>
                                              {event.priority && event.priority !== 'normal' && <span className={`hc-tl-priority hc-tl-priority-${event.priority}`}>{event.priority}</span>}
                                              <span className="hc-tl-time">{event.event_date ? new Date(event.event_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</span>
                                            </div>
                                            <div className="hc-tl-title">{event.title}</div>
                                            {event.event_type === 'status_change' && event.old_value && event.new_value && (
                                              <div className="hc-tl-status-beforeafter">
                                                <span className="hc-tl-status-badge hc-tl-status-old">{event.old_value}</span>
                                                <span className="hc-tl-arrow">→</span>
                                                <span className="hc-tl-status-badge hc-tl-status-new">{event.new_value}</span>
                                              </div>
                                            )}
                                            {event.performed_by_name && <div className="hc-tl-meta">{event.performed_by_name}</div>}
                                            {hcExpanded === i && hcDensity !== 'audit' && (
                                              <div className="hc-tl-details">
                                                {event.description && <div className="hc-tl-detail-row"><strong>Description:</strong><span>{event.description}</span></div>}
                                                {event.old_value && <div className="hc-tl-detail-row"><strong style={{color:'#ef4444'}}>Ancien:</strong><span>{event.old_value}</span></div>}
                                                {event.new_value && <div className="hc-tl-detail-row"><strong style={{color:'#22c55e'}}>Nouveau:</strong><span>{event.new_value}</span></div>}
                                                {event.reason && <div className="hc-tl-detail-row"><strong>Motif:</strong><span>{event.reason}</span></div>}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}

                                {/* ── Audit View ── */}
                                {hcView === 'audit' && (
                                  <div className="hc-audit">
                                    <div className="hc-audit-table">
                                      <div className="hc-audit-header">
                                        <span className="hc-audit-col-date">{t('form_date')||'Date'}</span>
                                        <span className="hc-audit-col-event">{t('form_type')||'Événement'}</span>
                                        <span className="hc-audit-col-cat">{t('uc_category')||'Catégorie'}</span>
                                        <span className="hc-audit-col-priority">{t('hc_priority')||'Priorité'}</span>
                                        <span className="hc-audit-col-user">{t('hc_performed_by')||'Utilisateur'}</span>
                                        <span className="hc-audit-col-role">{t('form_role')||'Rôle'}</span>
                                        <span className="hc-audit-col-dept">{t('hc_department')||'Département'}</span>
                                        <span className="hc-audit-col-source">{t('hc_source_module')||'Module'}</span>
                                        <span className="hc-audit-col-old">{t('hc_old_value')||'Ancien'}</span>
                                        <span className="hc-audit-col-new">{t('hc_new_value')||'Nouveau'}</span>
                                        <span className="hc-audit-col-reason">{t('hc_reason')||'Motif'}</span>
                                      </div>
                                      {hcFiltered.length === 0 && <div className="hc-empty"><p>{t('hc_no_events')||'Aucun événement'}</p></div>}
                                      {hcFiltered.map((event, i) => (
                                        <div key={i} className={`hc-audit-row${criticalEventTypes.includes(event.event_type)||criticalPriorities.includes(event.priority) ? ' hc-audit-critical' : ''}`}>
                                          <span className="hc-audit-col-date" title={event.event_date ? new Date(event.event_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}>{event.event_date ? new Date(event.event_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'2-digit', month:'short' }) : '—'}</span>
                                          <span className="hc-audit-col-event"><span className="hc-event-badge" style={{background:hcColors[event.category]||'#64748b'}}>{hcIcons[event.event_type]||'📌'} {t('hc_event_'+event.event_type)||event.event_type}</span></span>
                                          <span className="hc-audit-col-cat">{event.category ? (t('uc_category_'+event.category)||event.category) : '—'}</span>
                                          <span className="hc-audit-col-priority">{event.priority ? <span className={`hc-tl-priority hc-tl-priority-${event.priority}`}>{t('hc_priority_'+event.priority)||event.priority}</span> : '—'}</span>
                                          <span className="hc-audit-col-user">{event.performed_by_name||'—'}</span>
                                          <span className="hc-audit-col-role">{event.performed_role||'—'}</span>
                                          <span className="hc-audit-col-dept">{event.department||'—'}</span>
                                          <span className="hc-audit-col-source">{event.source_module ? (t('hc_source_'+event.source_module)||event.source_module) : '—'}</span>
                                          <span className="hc-audit-col-old" style={{color:'#ef4444',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={event.old_value}>{event.old_value||'—'}</span>
                                          <span className="hc-audit-col-new" style={{color:'#22c55e',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={event.new_value}>{event.new_value||'—'}</span>
                                          <span className="hc-audit-col-reason" style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={event.reason}>{event.reason||'—'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* ── Calendar View ── */}
                                {hcView === 'calendar' && (
                                  <div className="hc-calendar">
                                    <div className="hc-cal-title">{t('hc_calendar_view')||'Calendrier des activités'}</div>
                                    <div className="hc-cal-grid">
                                      {(() => {
                                        const now = new Date()
                                        const year = now.getFullYear()
                                        const month = now.getMonth()
                                        const firstDay = new Date(year, month, 1)
                                        const lastDay = new Date(year, month + 1, 0)
                                        const startPad = firstDay.getDay()
                                        const days = []
                                        for (let i = 0; i < startPad; i++) days.push(null)
                                        for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
                                        const dayNames = lang === 'en' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
                                        const eventMap = {}
                                        hcFiltered.forEach(e => {
                                          if (!e.event_date) return
                                          const d = new Date(e.event_date)
                                          const key = d.getDate()
                                          if (!eventMap[key]) eventMap[key] = []
                                          eventMap[key].push(e)
                                        })
                                        return <>
                                          {dayNames.map(d => <div key={d} className="hc-cal-day-header">{d}</div>)}
                                          {days.map((d, i) => (
                                            <div key={i} className={`hc-cal-day${d ? '' : ' hc-cal-day-empty'}${d && eventMap[d]?.length ? ' hc-cal-day-has' : ''}${d && eventMap[d]?.some(e => criticalEventTypes.includes(e.event_type)) ? ' hc-cal-day-critical' : ''}`}>
                                              {d && <>
                                                <span className="hc-cal-day-num">{d}</span>
                                                {eventMap[d] && <div className="hc-cal-day-events">{eventMap[d].slice(0,3).map((e, ei) => (
                                                  <div key={ei} className="hc-cal-day-event" style={{background:hcColors[e.category]||'#64748b'}} title={e.title} onClick={() => setHcSelectedEvent(e)}>{hcIcons[e.event_type]||'📌'}</div>
                                                ))}{eventMap[d].length > 3 && <span className="hc-cal-day-more">+{eventMap[d].length-3}</span>}</div>}
                                              </>}
                                            </div>
                                          ))}
                                        </>
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {/* ── Analytics View ── */}
                                {hcView === 'analytics' && (
                                  <div className="hc-analytics">
                                    <div className="hc-analytics-grid">
                                      {Object.entries(hcColors).filter(([key]) => key !== 'alert' && key !== 'protection' && key !== 'system' && key !== 'follow_up').map(([catKey, color]) => {
                                        const ct = hcLocalEvents.filter(e => e.category === catKey).length
                                        if (!ct) return null
                                        return (
                                          <div key={catKey} className="hc-analytics-card" style={{borderLeftColor:color}}>
                                            <div className="hc-analytics-card-top">
                                              <span className="hc-analytics-icon" style={{background:color+'20'}}>{hcIcons[Object.keys(hcIcons).find(k => k.startsWith(catKey))]||'📊'}</span>
                                              <span className="hc-analytics-count">{ct}</span>
                                            </div>
                                            <span className="hc-analytics-label">{t('uc_category_'+catKey)||catKey}</span>
                                            <div className="hc-analytics-bar" style={{background:color+'20'}}><div className="hc-analytics-bar-fill" style={{width:hcLocalEvents.length ? (ct/hcLocalEvents.length*100)+'%' : '0%', background:color}} /></div>
                                          </div>
                                        )
                                      })}
                                      {hcLocalEvents.filter(e => e.category === 'alert' || e.category === 'protection').length > 0 && (
                                        <div className="hc-analytics-card" style={{borderLeftColor:'#ef4444'}}>
                                          <div className="hc-analytics-card-top">
                                            <span className="hc-analytics-icon" style={{background:'rgba(239,68,68,0.12)'}}>🚨</span>
                                            <span className="hc-analytics-count">{hcLocalEvents.filter(e => e.category === 'alert' || e.category === 'protection').length}</span>
                                          </div>
                                          <span className="hc-analytics-label">{t('hc_alert_events')||'Alertes'}</span>
                                          <div className="hc-analytics-bar" style={{background:'rgba(239,68,68,0.12)'}}><div className="hc-analytics-bar-fill" style={{width:hcLocalEvents.length ? (hcLocalEvents.filter(e => e.category === 'alert'||e.category === 'protection').length/hcLocalEvents.length*100)+'%' : '0%', background:'#ef4444'}} /></div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="hc-analytics-summary">
                                      <div className="hc-analytics-summary-item"><span>{t('hc_total_events')||'Total'}</span><strong>{hcLocalEvents.length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_total_updates')||'Updates'}</span><strong>{hcLocalEvents.filter(e => e.event_type === 'update_added').length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_events_today')||"Aujourd'hui"}</span><strong>{hcGrouped.today.length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_events_this_week')||'Cette semaine'}</span><strong>{hcGrouped.thisWeek.length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_events_this_month')||'Ce mois'}</span><strong>{hcGrouped.thisMonth.length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_status_changes')||'Statuts'}</span><strong>{hcLocalEvents.filter(e => e.event_type === 'status_change').length}</strong></div>
                                    </div>
                                  </div>
                                )}

                                {/* ── Event Detail Drawer ── */}
                                {hcSelectedEvent && (
                                  <div className="hc-drawer-overlay" onClick={() => setHcSelectedEvent(null)}>
                                    <div className="hc-drawer" onClick={e => e.stopPropagation()}>
                                      <button className="hc-drawer-close" onClick={() => setHcSelectedEvent(null)}>✕</button>
                                      <div className="hc-drawer-title">{t('hc_event_detail_title')||"Détails de l'événement"}</div>
                                      <div className="hc-drawer-section">
                                        <div className="hc-drawer-section-title">{t('hc_event_info')||'Événement'}</div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_type')||'Type'}</span><span className="hc-drawer-value">{hcIcons[hcSelectedEvent.event_type]||''} {t('hc_event_'+hcSelectedEvent.event_type)||hcSelectedEvent.event_type}</span></div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('uc_category')||'Catégorie'}</span><span className="hc-drawer-value"><span className="hc-tl-badge" style={{background:hcColors[hcSelectedEvent.category]||'#64748b'}}>{t('uc_category_'+hcSelectedEvent.category)||hcSelectedEvent.category}</span></span></div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_title')||'Titre'}</span><span className="hc-drawer-value">{hcSelectedEvent.title}</span></div>
                                        {hcSelectedEvent.description && <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_description')||'Description'}</span><span className="hc-drawer-value">{hcSelectedEvent.description}</span></div>}
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_date')||'Date'}</span><span className="hc-drawer-value">{hcSelectedEvent.event_date ? new Date(hcSelectedEvent.event_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</span></div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_priority')||'Priorité'}</span><span className="hc-drawer-value">{hcSelectedEvent.priority ? <span className={`hc-tl-priority hc-tl-priority-${hcSelectedEvent.priority}`}>{t('hc_priority_'+hcSelectedEvent.priority)||hcSelectedEvent.priority}</span> : '—'}</span></div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_source_module')||'Module'}</span><span className="hc-drawer-value">{hcSelectedEvent.source_module ? (t('hc_source_'+hcSelectedEvent.source_module)||hcSelectedEvent.source_module) : '—'}</span></div>
                                      </div>
                                      {hcSelectedEvent.old_value || hcSelectedEvent.new_value ? (
                                        <div className="hc-drawer-section">
                                          <div className="hc-drawer-section-title">{t('hc_old_value')||'Valeurs'}</div>
                                          {hcSelectedEvent.old_value && <div className="hc-drawer-row"><span className="hc-drawer-label" style={{color:'#ef4444'}}>{t('hc_old_value')||'Ancien'}</span><span className="hc-drawer-value">{hcSelectedEvent.old_value}</span></div>}
                                          {hcSelectedEvent.new_value && <div className="hc-drawer-row"><span className="hc-drawer-label" style={{color:'#22c55e'}}>{t('hc_new_value')||'Nouveau'}</span><span className="hc-drawer-value">{hcSelectedEvent.new_value}</span></div>}
                                          {hcSelectedEvent.reason && <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_reason')||'Motif'}</span><span className="hc-drawer-value">{hcSelectedEvent.reason}</span></div>}
                                        </div>
                                      ) : null}
                                      {hcSelectedEvent.event_type === 'status_change' && (hcSelectedEvent.old_value||hcSelectedEvent.new_value) ? (
                                        <div className="hc-drawer-section">
                                          <div className="hc-drawer-section-title">{t('hc_status_before')||'Changement de statut'}</div>
                                          {hcSelectedEvent.old_value && <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_status_before')||'Avant'}</span><span className="hc-drawer-value"><span className="hc-tl-status-badge hc-tl-status-old">{hcSelectedEvent.old_value}</span></span></div>}
                                          {hcSelectedEvent.new_value && <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_status_after')||'Après'}</span><span className="hc-drawer-value"><span className="hc-tl-status-badge hc-tl-status-new">{hcSelectedEvent.new_value}</span></span></div>}
                                        </div>
                                      ) : null}
                                      <div className="hc-drawer-section">
                                        <div className="hc-drawer-section-title">{t('hc_performed_by')||'Effectué par'}</div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_name')||'Nom'}</span><span className="hc-drawer-value">{hcSelectedEvent.performed_by_name||'—'}</span></div>
                                        {hcSelectedEvent.performed_role && <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_role')||'Rôle'}</span><span className="hc-drawer-value">{hcSelectedEvent.performed_role}</span></div>}
                                        {hcSelectedEvent.department && <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_department')||'Département'}</span><span className="hc-drawer-value">{hcSelectedEvent.department}</span></div>}
                                      </div>
                                      {hcSelectedEvent.attachments?.length > 0 && (
                                        <div className="hc-drawer-section">
                                          <div className="hc-drawer-section-title">{t('hc_attachments')||'Pièces jointes'} ({hcSelectedEvent.attachments.length})</div>
                                          <div className="hc-drawer-attachments">{hcSelectedEvent.attachments.map((a, ai) => <div key={ai} className="hc-drawer-attach">📎 {a}</div>)}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                            })()}
                          </div>

                          {/* ═══ SIDEBAR ═══ */}
                          <div className="pd-side">
                            {/* Quick Actions */}
                            <div className="pd-card">
                              <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(245,158,11,0.15)'}}>⚡</div><span className="pd-card-title">{t('pd_quick_actions') || 'Actions Rapides'}</span></div>
                              <div className="pd-card-body">
                                <div className="pd-actions">
                                  <button className="pd-action-btn" onClick={() => { setEditingChild(selectedRegChild); setActiveKey('enfants'); setSubKey('Profil & identité'); setSelectedRegChild(null) }}>
                                    <span className="pd-action-icon">✏️</span> {t('form_edit') || 'Modifier'} le profil
                                  </button>
                                  <button className="pd-action-btn" onClick={() => { setActiveKey('enfants'); setSubKey('Documents administratifs'); setEditingChild(selectedRegChild); setSelectedRegChild(null) }}>
                                    <span className="pd-action-icon">📄</span> {t('pd_add_doc') || 'Ajouter document'}
                                  </button>
                                  <button className="pd-action-btn" onClick={() => window.print()}>
                                    <span className="pd-action-icon">🖨️</span> {t('pd_print') || 'Imprimer'}
                                  </button>
                                  <button className="pd-action-btn" onClick={() => { window.dispatchEvent(new CustomEvent('cdo-navigate-child', { detail: { uid: selectedRegChild.uid } })) }}>
                                    <span className="pd-action-icon">📜</span> {t('pd_history') || 'Voir historique'}
                                  </button>
                                  <button className="pd-action-btn" onClick={() => { setEditingChild(selectedRegChild); setActiveKey('enfants'); setSubKey('Santé & médical'); setSelectedRegChild(null) }}>
                                    <span className="pd-action-icon">❤️</span> {t('pd_health') || 'Santé'}
                                  </button>
                                  <button className="pd-action-btn" onClick={() => { setUpdateChild(selectedRegChild); setActiveKey('update-center'); setSelectedRegChild(null); setUc2Step(0); setUc2Category(null); setUc2Type(''); setUc2FormData({}); setUc2Priority('normal'); setUc2Reason(''); setUc2Comment(''); setUc2Files([]); setUc2Success(false) }}>
                                    <span className="pd-action-icon">📝</span> {t('uc_title') || 'Mise à jour'}
                                  </button>
                                  <button className="pd-action-btn" onClick={() => { setEditingChild(selectedRegChild); setActiveKey('enfants'); setSubKey('Scolarité'); setSelectedRegChild(null) }}>
                                    <span className="pd-action-icon">🏫</span> {t('pd_education') || 'Scolarité'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="pd-card">
                              <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(59,130,246,0.15)'}}>💬</div><span className="pd-card-title">{t('pd_notes') || 'Notes'}</span></div>
                              <div className="pd-card-body">
                                <div className="pd-notes">
                                  {(() => {
                                    const notes = selectedRegChild.extra_data?.notes || []
                                    if (!notes.length) return <div style={{fontSize:'12px',color:'#64748B',padding:'8px 0',textAlign:'center'}}>{t('pd_no_notes') || 'Aucune note'}</div>
                                    return notes.slice(-3).reverse().map((note, i) => (
                                      <div key={i} className="pd-note">
                                        <div className="pd-note-header">
                                          <span className="pd-note-author">{note.author || 'Staff'}</span>
                                          <span className="pd-note-time">{note.time || ''}</span>
                                        </div>
                                        <div className="pd-note-text">{note.text}</div>
                                      </div>
                                    ))
                                  })()}
                                  <textarea className="pd-note-input" placeholder={t('pd_add_note') || 'Ajouter une note...'} id="pd-note-input" />
                                  <button className="pd-note-btn" onClick={() => {
                                    const text = document.getElementById('pd-note-input')?.value?.trim()
                                    if (!text) return
                                    const notes = [...(selectedRegChild.extra_data?.notes || []), { text, author: user.first_name + ' ' + user.last_name, time: new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) }]
                                    const extra_data = { ...(selectedRegChild.extra_data || {}), notes }
                                    const uid = selectedRegChild.uid
                                    const token = localStorage.getItem('access_token')
                                    if (!token) return
                                    fetch(`${API}/enfants/${selectedRegChild.id}/`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ extra_data }) })
                                      .then(r => r.ok ? r.json() : null)
                                      .then(saved => { if (saved) { setSelectedRegChild(saved); setRegisteredChildren(prev => prev.map(c => c.id === saved.id ? saved : c)); document.getElementById('pd-note-input').value = '' } })
                                      .catch(() => {})
                                  }}>{t('pd_save_note') || 'Enregistrer'}</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      ) : (
                      <>
                        <div className="ecr-stats">
                          <div className="ecr-stat-card">
                            <div className="ecr-stat-icon ecr-stat-icon-blue">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <div className="ecr-stat-info">
                              <span className="ecr-stat-value">{registeredChildren.length}</span>
                              <span className="ecr-stat-label">{t('child_stat_total') || 'Total Enfants'}</span>
                            </div>
                            <span className="ecr-stat-trend ecr-stat-trend-up">+{Math.max(0, registeredChildren.filter(c => c.created_at && new Date(c.created_at) > new Date(Date.now() - 86400000 * 7)).length)}</span>
                          </div>
                          <div className="ecr-stat-card">
                            <div className="ecr-stat-icon ecr-stat-icon-green">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            </div>
                            <div className="ecr-stat-info">
                              <span className="ecr-stat-value">{registeredChildren.length}</span>
                              <span className="ecr-stat-label">{t('child_stat_active') || 'Actifs aujourd\'hui'}</span>
                            </div>
                            <span className="ecr-stat-trend ecr-stat-trend-up">100%</span>
                          </div>
                          <div className="ecr-stat-card">
                            <div className="ecr-stat-icon ecr-stat-icon-amber">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </div>
                            <div className="ecr-stat-info">
                              <span className="ecr-stat-value">{registeredChildren.filter(c => c.created_at && new Date(c.created_at) > new Date(Date.now() - 86400000 * 30)).length}</span>
                              <span className="ecr-stat-label">{t('child_stat_new') || 'Nouveaux (30j)'}</span>
                            </div>
                            <span className="ecr-stat-trend ecr-stat-trend-up">{t('child_new') || 'Nouv.'}</span>
                          </div>
                          <div className="ecr-stat-card">
                            <div className="ecr-stat-icon ecr-stat-icon-red">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            </div>
                            <div className="ecr-stat-info">
                              <span className="ecr-stat-value">0</span>
                              <span className="ecr-stat-label">{t('child_stat_alerts') || 'Alertes'}</span>
                            </div>
                            <span className="ecr-stat-trend ecr-stat-trend-neutral">—</span>
                          </div>
                        </div>

                        <div className="ecr-toolbar">
                          <div className="ecr-search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input type="text" className="ecr-search-input" placeholder={t('child_search_placeholder') || 'Rechercher par nom, prénom ou ID...'} value={childSearchQuery} onChange={e => setChildSearchQuery(e.target.value)} />
                          </div>
                          <div className="ecr-toolbar-filters">
                            <select className="ecr-filter-select" value={childGenderFilter} onChange={e => setChildGenderFilter(e.target.value)}>
                              <option value="">{t('child_filter_all') || 'Tous'}</option>
                              <option value="M">{t('form_male') || 'Masculin'}</option>
                              <option value="F">{t('form_female') || 'Féminin'}</option>
                            </select>
                            <select className="ecr-filter-select" value={childSortBy} onChange={e => setChildSortBy(e.target.value)}>
                              <option value="date">{t('child_sort_date') || 'Plus récents'}</option>
                              <option value="name">{t('child_sort_name') || 'Nom A-Z'}</option>
                              <option value="age">{t('child_sort_age') || 'Âge'}</option>
                            </select>
                          </div>
                        </div>

                        {(() => {
                          let filtered = [...registeredChildren]
                          if (childSearchQuery) {
                            const q = childSearchQuery.toLowerCase()
                            filtered = filtered.filter(c => (c.prenom + ' ' + c.nom + ' ' + c.uid).toLowerCase().includes(q))
                          }
                          if (childGenderFilter) {
                            filtered = filtered.filter(c => c.sexe === childGenderFilter)
                          }
                          if (childSortBy === 'name') {
                            filtered.sort((a, b) => ((a.prenom || '') + ' ' + (a.nom || '')).localeCompare(((b.prenom || '') + ' ' + (b.nom || ''))))
                          } else if (childSortBy === 'age') {
                            filtered.sort((a, b) => {
                              const da = a.date_naissance ? new Date(a.date_naissance).getTime() : 0
                              const db = b.date_naissance ? new Date(b.date_naissance).getTime() : 0
                              return da - db
                            })
                          } else {
                            filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                          }

                          if (filtered.length === 0) {
                            return (
                              <div className="ecr-empty">
                                <div className="ecr-empty-icon">
                                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <p className="ecr-empty-text">{registeredChildren.length === 0 ? (t('child_empty_title') || 'Aucun enfant enregistré') : (t('child_no_results') || 'Aucun résultat')}</p>
                                <p className="ecr-empty-hint">{registeredChildren.length === 0 ? (t('child_empty_hint') || 'Remplissez le formulaire dans Gestion des enfants') : (t('child_try_different') || 'Essayez une recherche différente')}</p>
                              </div>
                            )
                          }

                          return (
                            <div className="ecr-grid">
                              {filtered.map(child => {
                                const hues = ['#f59e0b','#22c55e','#a855f7','#3b82f6','#ef4444','#ec4899','#14b8a6','#f97316']
                                const cc = hues[(child.prenom?.charCodeAt(0) || 0) % hues.length]
                                const initial = (child.prenom?.[0] || child.nom?.[0] || '?').toUpperCase()
                                const localPhoto = localStorage.getItem('cdo_child_photo_' + child.uid)
                                const age = child.date_naissance ? Math.floor((Date.now() - new Date(child.date_naissance).getTime()) / 31557600000) : null
                                return (
                                  <div key={child.uid} className="ecr-card" onClick={() => setSelectedRegChild(child)}>
                                    <div className="ecr-card-top">
                                      <div className="ecr-card-avatar">
                                        <img src={localPhoto || (child.photo?.startsWith('http') ? child.photo : svgUrl(initial, cc, 44, 44))} alt="" />
                                      </div>
                                      <div className="ecr-card-info">
                                        <span className="ecr-card-name">{child.prenom || ''} {child.nom || ''}</span>
                                        <span className="ecr-card-id">{child.uid}</span>
                                      </div>
                                      <span className="ecr-badge ecr-badge-active">{t('child_status_active') || 'Actif'}</span>
                                    </div>
                                    <div className="ecr-card-stats">
                                      <div className="ecr-card-stat">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        {age !== null ? age + ' ' + (t('form_years') || 'ans') : '—'}
                                      </div>
                                      <div className="ecr-card-stat">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        {child.sexe === 'M' ? (t('form_male') || 'M') : child.sexe === 'F' ? (t('form_female') || 'F') : '—'}
                                      </div>
                                      <div className="ecr-card-stat">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        {child.created_at ? new Date(child.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short' }) : '—'}
                                      </div>
                                    </div>
                                    <div className="ecr-card-actions">
                                      <button className="ecr-card-action" onClick={e => { e.stopPropagation(); setSelectedRegChild(child) }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        {t('child_view') || 'Voir'}
                                      </button>
                                      <button className="ecr-card-action" onClick={e => { e.stopPropagation(); setEditingChild(child); setActiveKey('enfants'); setSubKey('Profil & identité'); setSelectedRegChild(null) }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                        {t('form_edit') || 'Modifier'}
                                      </button>
                                      <button className="ecr-card-action" onClick={e => { e.stopPropagation(); }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        {t('child_history') || 'Historique'}
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </>
                    )}
                  </div>
                ) : activeKey === 'ambassadeurs' && orphanageName ? (
                  <div>
                    <div className="dash-role-card" style={{ marginBottom: '12px' }}>
                      <div className="dash-role-avatar-wrap">
                        <span style={{ fontSize: '32px' }}>{'\u{1F3E1}'}</span>
                      </div>
                      <div className="dash-role-info">
                        <span className="dash-role-name">{orphanageName}</span>
                        <span className="dash-role-badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>ACTIF</span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span>{flagImg(user.country || 'CD')} {countryName(user.country || 'CD')}</span>
                          <span>Directeur: {user.first_name} {user.last_name}</span>
                          <span>ID: {user.id}</span>
                        </div>
                      </div>
                    </div>
                    {dirSelectedAmb ? (() => {
                      const ambAssigns = dirAmbAssignments.filter(a => a.ambassador === dirSelectedAmb)
                      return (
                        <div>
                          <button type="button" onClick={()=>setDirSelectedAmb(null)} style={{background:'rgba(255,255,255,0.05)',border:'none',borderRadius:10,color:'#94a3b8',fontSize:13,padding:'8px 16px',cursor:'pointer',marginBottom:16}}>← Retour à la liste</button>
                          <div style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'24px'}}>
                            <h4 style={{fontSize:16,fontWeight:700,color:'#e2e8f0',margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}>
                              <span style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff'}}>
                                {(ambAssigns[0]?.ambassador_name||'?')[0].toUpperCase()}
                              </span>
                              {ambAssigns[0]?.ambassador_name || 'Ambassadeur'}
                            </h4>
                            <div style={{fontSize:13,color:'#64748b',marginBottom:12}}>{ambAssigns.length} enfant(s) assigné(s)</div>
                            <div style={{display:'flex',flexDirection:'column',gap:6}}>
                              {ambAssigns.map(a => (
                                <div key={a.id} style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                  <div>
                                    <div style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{a.child_name}</div>
                                    <div style={{fontSize:11,color:'#64748b'}}>UID: {a.child_uid}</div>
                                  </div>
                                  <span style={{fontSize:10,color:'#64748b'}}>{new Date(a.assigned_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })() : (
                      <div style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'24px',marginBottom:16}}>
                        <h4 style={{fontSize:16,fontWeight:700,color:'#e2e8f0',margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}>👥 Ambassadeurs assignés</h4>
                        {dirAmbLoading ? (
                          <div style={{textAlign:'center',padding:20,color:'#64748b',fontSize:14}}>Chargement...</div>
                        ) : dirAmbAssignments.length === 0 ? (
                          <div style={{padding:'20px',textAlign:'center',color:'#64748b',fontSize:14}}>
                            <div style={{fontSize:36,marginBottom:8}}>🤝</div>
                            <p style={{margin:'0 0 4px'}}>Aucun ambassadeur assigné aux enfants de votre orphelinat.</p>
                            <p style={{margin:0,fontSize:12,color:'#475569'}}>Les ambassadeurs sont assignés par la fédération.</p>
                          </div>
                        ) : (() => {
                          const grouped = {}
                          dirAmbAssignments.forEach(a => {
                            if (!grouped[a.ambassador]) grouped[a.ambassador] = { name: a.ambassador_name, assigns: [] }
                            grouped[a.ambassador].assigns.push(a)
                          })
                          return Object.entries(grouped).map(([ambId, g]) => (
                            <button key={ambId} type="button" onClick={()=>setDirSelectedAmb(Number(ambId))} style={{width:'100%',textAlign:'left',background:'rgba(255,255,255,0.03)',border:'none',borderRadius:12,padding:'14px 16px',marginBottom:8,cursor:'pointer',display:'flex',alignItems:'center',gap:14,transition:'all .2s'}}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                              <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:700,color:'#fff',flexShrink:0}}>{g.name.charAt(0).toUpperCase()}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:14,fontWeight:600,color:'#f59e0b'}}>{g.name}</div>
                                <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{g.assigns.length} enfant(s) assigné(s)</div>
                              </div>
                              <span style={{color:'#64748b',fontSize:13}}>→</span>
                            </button>
                          ))
                        })()}
                      </div>
                    )}
                    <div className="dash-category-cards">
                      {page?.categories?.map((cat, i) => (
                        <button key={i} className="dash-category-card" onClick={() => {
                          setSubKey(cat.title);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>
                          <div className="dash-card-icon-wrap">
                            <span className="dash-card-icon">{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</span>
                          </div>
                          <span className="dash-card-title">{t('cat_' + role + '_' + activeKey.replace(/-/g, '_') + '_' + cat.id + '_title') || cat.title}</span>
                          <span className="dash-card-desc">{t('cat_' + role + '_' + activeKey.replace(/-/g, '_') + '_' + cat.id + '_sub') || cat.subtitle}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeKey === 'projets' ? (
                  <div className="dash-projects">
                    {showOngoing ? (
                      <div className="dash-projects">
                        <div className="dash-proj-list-header">
                          <button className="dash-back-btn" onClick={() => { setShowOngoing(false); setShowExpired(false); setSelectedProject(null) }}>{'\u2190'} {t('form_back')}</button>
                          <span className="dash-section-title">{t('proj_ongoing') || 'Projets en cours'}</span>
                          <span className="dash-proj-count">{(projects.length > 0 ? projects : (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS)).filter(p => !p.end_date || p.end_date >= new Date().toISOString().split('T')[0]).length} {t('proj_projects') || 'projets'}</span>
                        </div>
                        {selectedProject ? (
                          <div className="dash-sub-form">
                            <div className="dash-sub-form-top">
                              <button className="dash-back-btn" onClick={() => setSelectedProject(null)}>{'\u2190'} {t('form_back')}</button>
                              <h3 className="dash-sub-form-title">{selectedProject.code} — {selectedProject.title}</h3>
                              <span className={`dash-proj-status ${selectedProject.status}`}>{selectedProject.status === 'open' ? (t('proj_open') || 'Ouvert') : selectedProject.status === 'funded' ? (t('proj_funded') || 'Financé') : (t('proj_completed') || 'Terminé')}</span>
                            </div>
                            <div className="dash-proj-detail">
                              <div className="dash-proj-meta">
                                <span><strong>{t('proj_type') || 'Type'}:</strong> {PROJECT_TYPES.find(pt => pt.value === selectedProject.type)?.icon} {PROJECT_TYPES.find(pt => pt.value === selectedProject.type)?.label}</span>
                                <span><strong>{t('proj_code') || 'Code'}:</strong> <span className="dash-proj-code-display">{selectedProject.code}</span></span>
                                <span><strong>{t('proj_start_date') || 'Date de début'}:</strong> {selectedProject.start_date || '—'}</span>
                                <span><strong>{t('proj_end_date') || 'Date de fin'}:</strong> {selectedProject.end_date || '—'}</span>
                              </div>
                              <p className="dash-proj-desc">{selectedProject.description}</p>
                              {selectedProject.pdf_url && (
                                <div className="dash-proj-pdf">
                                  <a href={selectedProject.pdf_url} target="_blank" rel="noopener noreferrer" className="dash-proj-pdf-link">{'\u{1F4C4}'} {t('proj_read_pdf') || 'Lire le PDF'}</a>
                                  <a href={selectedProject.pdf_url} download className="dash-proj-pdf-link">{'\u{1F4E5}'} {t('proj_download_pdf') || 'Télécharger le PDF'}</a>
                                </div>
                              )}
                              {role === 'partner' && selectedProject.status === 'open' && (
                                <button className="dash-form-save" onClick={async () => {
                                  const token = localStorage.getItem('access_token')
                                  if (!token) { alert(t('proj_login_required') || 'Connectez-vous pour postuler'); return }
                                  try {
                                    const res = await fetch(`${API}/projets/${selectedProject.id}/apply/`, {
                                      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ message: '' }),
                                    })
                                    if (res.ok) alert(t('proj_applied') || 'Candidature envoyée avec succès !')
                                    else throw new Error()
                                  } catch { alert(t('proj_error') || 'Erreur lors de la candidature') }
                                }}>{t('proj_apply') || 'Postuler pour financer'}</button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="dash-proj-list">
                            {(projects.length > 0 ? projects : (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS)).filter(p => !p.end_date || p.end_date >= new Date().toISOString().split('T')[0]).map(proj => (
                              <div key={proj.code} className="dash-proj-card" onClick={() => setSelectedProject(proj)}>
                                <div className="dash-proj-card-top">
                                  <span className="dash-proj-code">{proj.code}</span>
                                  <span className="dash-proj-badge">{PROJECT_TYPES.find(pt => pt.value === proj.type)?.icon} {PROJECT_TYPES.find(pt => pt.value === proj.type)?.label}</span>
                                </div>
                                <h4 className="dash-proj-card-title">{proj.title}</h4>
                                <p className="dash-proj-card-summary">{proj.summary || proj.description?.substring(0, 80) + '...'}</p>
                                <div className="dash-proj-card-dates">
                                  <span>{proj.start_date || '—'} → {proj.end_date || '—'}</span>
                                </div>
                              </div>
                            ))}
                            {(projects.length > 0 ? projects : (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS)).filter(p => !p.end_date || p.end_date >= new Date().toISOString().split('T')[0]).length === 0 && (
                              <div className="dash-empty-state"><span className="dash-empty-icon">{'\u{1F4CB}'}</span><p>{t('proj_no_ongoing') || 'Aucun projet en cours'}</p></div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : showExpired ? (
                      <div className="dash-projects">
                        <div className="dash-proj-list-header">
                          <button className="dash-back-btn" onClick={() => { setShowExpired(false); setSelectedProject(null) }}>{'\u2190'} {t('form_back')}</button>
                          <span className="dash-section-title">{t('proj_expired') || 'Projets expirés'}</span>
                          <span className="dash-proj-count">{(projects.length > 0 ? projects : (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS)).filter(p => p.end_date && p.end_date < new Date().toISOString().split('T')[0]).length} {t('proj_expired_projects') || 'projets expirés'}</span>
                        </div>
                        {selectedProject ? (
                          <div className="dash-sub-form">
                            <div className="dash-sub-form-top">
                              <button className="dash-back-btn" onClick={() => setSelectedProject(null)}>{'\u2190'} {t('form_back')}</button>
                              <h3 className="dash-sub-form-title">{selectedProject.code} — {selectedProject.title}</h3>
                              <span className={`dash-proj-status ${selectedProject.status}`}>{selectedProject.status === 'open' ? (t('proj_open') || 'Ouvert') : selectedProject.status === 'funded' ? (t('proj_funded') || 'Financé') : (t('proj_completed') || 'Terminé')}</span>
                            </div>
                            <div className="dash-proj-detail">
                              <div className="dash-proj-meta">
                                <span><strong>{t('proj_type') || 'Type'}:</strong> {PROJECT_TYPES.find(pt => pt.value === selectedProject.type)?.icon} {PROJECT_TYPES.find(pt => pt.value === selectedProject.type)?.label}</span>
                                <span><strong>{t('proj_code') || 'Code'}:</strong> <span className="dash-proj-code-display">{selectedProject.code}</span></span>
                                <span><strong>{t('proj_start_date') || 'Date de début'}:</strong> {selectedProject.start_date || '—'}</span>
                                <span><strong>{t('proj_end_date') || 'Date de fin'}:</strong> {selectedProject.end_date || '—'}</span>
                              </div>
                              <p className="dash-proj-desc">{selectedProject.description}</p>
                              {selectedProject.pdf_url && (
                                <div className="dash-proj-pdf">
                                  <a href={selectedProject.pdf_url} target="_blank" rel="noopener noreferrer" className="dash-proj-pdf-link">{'\u{1F4C4}'} {t('proj_read_pdf') || 'Lire le PDF'}</a>
                                  <a href={selectedProject.pdf_url} download className="dash-proj-pdf-link">{'\u{1F4E5}'} {t('proj_download_pdf') || 'Télécharger le PDF'}</a>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="dash-proj-list">
                            {(projects.length > 0 ? projects : (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS)).filter(p => p.end_date && p.end_date < new Date().toISOString().split('T')[0]).map(proj => (
                              <div key={proj.code} className="dash-proj-card expired" onClick={() => setSelectedProject(proj)}>
                                <div className="dash-proj-card-top">
                                  <span className="dash-proj-code">{proj.code}</span>
                                  <span className="dash-proj-badge">{PROJECT_TYPES.find(pt => pt.value === proj.type)?.icon} {PROJECT_TYPES.find(pt => pt.value === proj.type)?.label}</span>
                                </div>
                                <h4 className="dash-proj-card-title">{proj.title}</h4>
                                <p className="dash-proj-card-summary">{proj.summary || proj.description?.substring(0, 80) + '...'}</p>
                                <div className="dash-proj-card-dates">
                                  <span>{proj.start_date || '—'} → {proj.end_date || '—'}</span>
                                </div>
                              </div>
                            ))}
                            {(projects.length > 0 ? projects : (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS)).filter(p => p.end_date && p.end_date < new Date().toISOString().split('T')[0]).length === 0 && (
                              <div className="dash-empty-state"><span className="dash-empty-icon">{'\u{1F4CB}'}</span><p>{t('proj_no_expired') || 'Aucun projet expiré'}</p></div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : projectTypeFilter !== null ? (
                      <div className="dash-proj-create">
                        <div className="dash-proj-create-header">
                          <button className="dash-proj-back-btn" onClick={() => setProjectTypeFilter(null)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                            {t('form_back')}
                          </button>
                          <div className="dash-proj-create-title-group">
                            <span className="dash-proj-create-type-icon">{PROJECT_TYPES.find(pt => pt.value === projectTypeFilter)?.icon}</span>
                            <h2 className="dash-proj-create-title">{t('proj_new_project') || 'Nouveau projet'}</h2>
                          </div>
                          <div className="dash-proj-create-code">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            <span>{genProjectCode()}</span>
                          </div>
                        </div>

                        <div className="dash-proj-create-body">
                          <div className="dash-proj-field">
                            <label className="dash-proj-field-label" htmlFor="proj-title-input">{t('proj_title') || 'Titre du projet'}</label>
                            <input id="proj-title-input" type="text" className="dash-proj-input" placeholder={t('proj_title_placeholder') || 'Ex: Construction d\'une bibliothèque'} />
                          </div>

                          <div className="dash-proj-grid-2">
                            <div className="dash-proj-field">
                              <label className="dash-proj-field-label" htmlFor="proj-start-date">{t('proj_start_date') || 'Date de début'}</label>
                              <div className="dash-proj-input-wrap">
                                <svg className="dash-proj-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <input id="proj-start-date" type="date" className="dash-proj-input dash-proj-input-has-icon" />
                              </div>
                            </div>
                            <div className="dash-proj-field">
                              <label className="dash-proj-field-label" htmlFor="proj-end-date">{t('proj_end_date') || 'Date de fin'}</label>
                              <div className="dash-proj-input-wrap">
                                <svg className="dash-proj-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <input id="proj-end-date" type="date" className="dash-proj-input dash-proj-input-has-icon" />
                              </div>
                            </div>
                          </div>

                          <div className="dash-proj-field">
                            <label className="dash-proj-field-label" htmlFor="proj-desc-input">{t('proj_description') || 'Description du projet'}</label>
                            <textarea id="proj-desc-input" className="dash-proj-input dash-proj-textarea" maxLength={2000} placeholder={t('proj_desc_placeholder') || 'Décrivez les objectifs, le public cible et les résultats attendus...'} onInput={e => { const c = document.getElementById('proj-charcount'); if (c) c.textContent = e.target.value.length + ' / 2000' }} />
                            <span id="proj-charcount" className="dash-proj-charcount">0 / 2000</span>
                          </div>

                          <div className="dash-proj-field">
                            <label className="dash-proj-field-label">{t('proj_pdf_doc') || 'Document PDF'} <span className="dash-proj-optional-badge">({t('form_optional') || 'optionnel'})</span></label>
                            <div className="dash-proj-dropzone" id="proj-dropzone" onClick={() => document.getElementById('proj-pdf-input')?.click()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('proj-pdf-input')?.click() }} tabIndex={0} role="button" aria-label={t('proj_upload_pdf') || 'Télécharger un PDF'}>
                              <input id="proj-pdf-input" type="file" accept="application/pdf" hidden onChange={e => {
                                const file = e.target.files?.[0]
                                const nameEl = document.getElementById('proj-dropzone-name')
                                const iconEl = document.getElementById('proj-dropzone-icon')
                                const textEl = document.getElementById('proj-dropzone-text')
                                const hintEl = document.getElementById('proj-dropzone-hint')
                                const removeEl = document.getElementById('proj-dropzone-remove')
                                const zone = document.getElementById('proj-dropzone')
                                if (file && file.type === 'application/pdf') {
                                  if (nameEl) nameEl.textContent = file.name
                                  if (iconEl) { iconEl.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
                                    if (textEl) textEl.textContent = file.name
                                    if (hintEl) hintEl.textContent = 'PDF — ' + (file.size / 1024).toFixed(0) + ' Ko'
                                    if (removeEl) removeEl.style.display = 'flex'
                                    zone?.classList.add('dash-proj-dropzone-has-file')
                                  }
                                } else if (file) {
                                  alert(t('proj_pdf_invalid') || 'Veuillez sélectionner un fichier PDF')
                                  e.target.value = ''
                                }
                              }} />
                              <div className="dash-proj-dropzone-content" id="proj-dropzone-content">
                                <div className="dash-proj-dropzone-icon" id="proj-dropzone-icon">
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                </div>
                                <p className="dash-proj-dropzone-text" id="proj-dropzone-text">{t('proj_drag_drop') || 'Glissez-déposez votre PDF ici'}</p>
                                <span className="dash-proj-dropzone-hint" id="proj-dropzone-hint">{t('proj_click_browse') || 'ou cliquez pour parcourir'}</span>
                              </div>
                              <div className="dash-proj-dropzone-file" id="proj-dropzone-file">
                                <div className="dash-proj-dropzone-file-info">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                  <span className="dash-proj-dropzone-file-name" id="proj-dropzone-name" />
                                </div>
                                <button className="dash-proj-dropzone-remove" id="proj-dropzone-remove" type="button" onClick={e => {
                                  e.stopPropagation()
                                  const input = document.getElementById('proj-pdf-input')
                                  if (input) input.value = ''
                                  const zone = document.getElementById('proj-dropzone')
                                  zone?.classList.remove('dash-proj-dropzone-has-file')
                                  const iconEl = document.getElementById('proj-dropzone-icon')
                                  if (iconEl) iconEl.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
                                  const textEl = document.getElementById('proj-dropzone-text')
                                  if (textEl) textEl.textContent = t('proj_drag_drop') || 'Glissez-déposez votre PDF ici'
                                  const hintEl = document.getElementById('proj-dropzone-hint')
                                  if (hintEl) hintEl.textContent = t('proj_click_browse') || 'ou cliquez pour parcourir'
                                }} aria-label={t('proj_remove_file') || 'Supprimer le fichier'}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="dash-proj-create-actions">
                            <button className="dash-proj-btn dash-proj-btn-primary" id="proj-submit-btn" onClick={async () => {
                              const btn = document.getElementById('proj-submit-btn')
                              if (btn) btn.classList.add('dash-proj-btn-loading')
                              const title = document.getElementById('proj-title-input')?.value?.trim()
                              const desc = document.getElementById('proj-desc-input')?.value?.trim()
                              const startDate = document.getElementById('proj-start-date')?.value
                              const endDate = document.getElementById('proj-end-date')?.value
                              const pdfInput = document.getElementById('proj-pdf-input')
                              const pdfFile = pdfInput?.files?.[0]
                              if (!title) { if (btn) btn.classList.remove('dash-proj-btn-loading'); alert(t('proj_title_required') || 'Veuillez entrer un titre'); return }
                              if (!desc) { if (btn) btn.classList.remove('dash-proj-btn-loading'); alert(t('proj_desc_required') || 'Veuillez entrer une description'); return }
                              if (!startDate || !endDate) { if (btn) btn.classList.remove('dash-proj-btn-loading'); alert(t('proj_start_end_required') || 'Veuillez sélectionner les dates de début et de fin'); return }
                              const token = localStorage.getItem('access_token')
                              const body = new FormData()
                              body.append('type', projectTypeFilter)
                              body.append('title', title)
                              body.append('description', desc)
                              body.append('summary', desc.substring(0, 80))
                              body.append('start_date', startDate)
                              body.append('end_date', endDate)
                              if (pdfFile && pdfFile.type === 'application/pdf') body.append('pdf_file', pdfFile)
                              try {
                                const res = await fetch(`${API}/projets/`, {
                                  method: 'POST',
                                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                                  body,
                                })
                                if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Erreur' })); throw new Error(e.error || 'Erreur') }
                                const saved = await res.json()
                                setOngoingProjects(prev => [saved, ...prev])
                                setProjects(prev => [saved, ...prev])
                                setProjectTypeFilter(null)
                                setShowOngoing(true); setShowExpired(false)
                              } catch (e) {
                                // fallback: save locally
                                const code = genProjectCode()
                                const newProj = {
                                  id: Date.now(), code, type: projectTypeFilter,
                                  title, description: desc, summary: desc.substring(0, 80),
                                  pdf_url: '', status: 'open', amount: 0, raised: 0,
                                  beneficiaries: 0, start_date: startDate, end_date: endDate,
                                  created_at: new Date().toISOString().split('T')[0],
                                }
                                setOngoingProjects(prev => [newProj, ...prev])
                                setProjects(prev => [newProj, ...prev])
                                setProjectTypeFilter(null)
                                setShowOngoing(true); setShowExpired(false)
                              }
                              if (btn) btn.classList.remove('dash-proj-btn-loading')
                            }}>
                              <span className="dash-proj-btn-label">{t('proj_submit') || 'Soumettre le projet'}</span>
                              <span className="dash-proj-btn-spinner">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                              </span>
                            </button>
                            <button className="dash-proj-btn dash-proj-btn-secondary" onClick={() => setProjectTypeFilter(null)}>
                              {t('form_cancel') || 'Annuler'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                          <span className="dash-section-title" style={{ fontSize:'15px', fontWeight:'700', color:'#e2e8f0' }}>{t('proj_choose_type') || 'Choisissez un type de projet'}</span>
                          <button className="dash-proj-tab" style={{ marginLeft:'auto', fontSize:'12px', padding:'6px 14px' }} onClick={() => { setShowOngoing(true); setShowExpired(false); setSelectedProject(null) }}>
                            {'\u{25B6}'} {t('proj_ongoing') || 'En cours'} ({(projects.length > 0 ? projects : (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS)).filter(p => !p.end_date || p.end_date >= new Date().toISOString().split('T')[0]).length})
                          </button>
                          <button className="dash-proj-tab dash-proj-tab-expired" style={{ fontSize:'12px', padding:'6px 14px' }} onClick={() => { setShowExpired(true); setShowOngoing(false); setSelectedProject(null) }}>
                            {'\u{23F3}'} {t('proj_expired') || 'Expirés'} ({(projects.length > 0 ? projects : (ongoingProjects.length > 0 ? ongoingProjects : MOCK_PROJECTS)).filter(p => p.end_date && p.end_date < new Date().toISOString().split('T')[0]).length})
                          </button>
                        </div>
                        <div className="dash-category-cards" style={{ gridTemplateColumns: role === 'director' ? '1fr 1fr' : '1fr 1fr 1fr' }}>
                          {PROJECT_TYPES.filter(pt => !(role === 'director' && pt.value === 'federation')).map(pt => (
                            <button key={pt.value} className="dash-category-card" onClick={() => setProjectTypeFilter(pt.value)}>
                              <div className="dash-card-icon-wrap">
                                <span className="dash-card-icon" style={{ fontSize: '32px' }}>{pt.icon}</span>
                              </div>
                              <span className="dash-card-title">{pt.label}</span>
                              <span className="dash-card-desc">{t('proj_create_' + pt.value) || 'Créer un projet'}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : activeKey === 'update-center' ? (
                  <div className="uc2-wrap">
                    {!updateChild ? (
                      <div className="uc2-premium-select">
                        <div className="uc2-premium-header">
                          <span className="uc2-premium-header-label">update-center</span>
                          <div className="uc2-premium-header-icons">
                            <button className="uc2-premium-icon-btn" title={t('dash_dashboard')||'Dashboard'}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                            </button>
                            <button className="uc2-premium-icon-btn" title={t('notifications')||'Notifications'}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            </button>
                            <button className="uc2-premium-icon-btn" title={t('settings')||'Settings'}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            </button>
                            <div className="uc2-premium-avatar">
                              {user.photo ? <img src={user.photo} alt="" /> : <span>{user?.first_name?.[0]||user?.username?.[0]||'U'}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="uc2-premium-hero">
                          <div className="uc2-premium-hero-left">
                            <div className="uc2-premium-hero-icon">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                            <div className="uc2-premium-hero-text">
                              <h1 className="uc2-premium-hero-title">{t('uc_title')||'Centre de Mise à Jour'}</h1>
                              <p className="uc2-premium-hero-subtitle">{t('uc_select_child')||'Sélectionnez un enfant pour ajouter une mise à jour'}</p>
                            </div>
                          </div>
                          <div className="uc2-premium-hero-actions">
                            <button className="uc2-premium-hero-btn uc2-premium-hero-btn-primary">{t('uc_view_report')||'Voir le rapport complet'} →</button>
                            <select className="uc2-premium-hero-select" value={uc2SortStatus} onChange={e => setUc2SortStatus(e.target.value)}>
                              <option value="">{t('uc_sort_by_status')||'Trier par statut'}</option>
                              <option value="active">{t('uc_card_status_active')||'Actif'}</option>
                              <option value="sick">{t('child_status_sick')||'Malade'}</option>
                              <option value="hospitalized">{t('child_status_hospitalized')||'Hospitalisé'}</option>
                            </select>
                          </div>
                        </div>
                        <div className="uc2-premium-filters">
                          <div className="uc2-premium-search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input className="uc2-premium-search-input" value={uc2Search} onChange={e => setUc2Search(e.target.value)} placeholder={t('uc_search_child')||'Rechercher un enfant...'} />
                          </div>
                          <select className="uc2-premium-filter-select" value={uc2Gender} onChange={e => setUc2Gender(e.target.value)}>
                            <option value="">{t('uc_filter_gender')||'Genre'}</option>
                            <option value="all">{t('uc_gender_all')||'Tous'}</option>
                            <option value="M">{t('uc_gender_male')||'Masculin'}</option>
                            <option value="F">{t('uc_gender_female')||'Féminin'}</option>
                          </select>
                          <div className="uc2-premium-age-wrap">
                            <span className="uc2-premium-filter-label">{t('uc_filter_age')||'Âge'}</span>
                            <input type="range" className="uc2-premium-age-slider" min="0" max="18" step="1" value={uc2AgeRange || '18'} onChange={e => setUc2AgeRange(e.target.value === '18' ? '' : e.target.value)} />
                            <span className="uc2-premium-age-value">{uc2AgeRange ? uc2AgeRange + ' ' + (t('form_years')||'ans') : t('uc_age_all')||'Tous âges'}</span>
                          </div>
                          <select className="uc2-premium-filter-select" value={uc2Region} onChange={e => setUc2Region(e.target.value)}>
                            <option value="">{t('uc_filter_region')||'Région'}</option>
                            <option value="all">{t('uc_region_all')||'Toutes régions'}</option>
                            {AFRICAN_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="uc2-premium-grid">
                          {(() => {
                            let list = registeredChildren.length > 0 ? registeredChildren : []
                            if (uc2Search) list = list.filter(c => (c.prenom||'').toLowerCase().includes(uc2Search.toLowerCase()) || (c.nom||'').toLowerCase().includes(uc2Search.toLowerCase()) || (c.uid||'').toLowerCase().includes(uc2Search.toLowerCase()))
                            if (uc2Gender && uc2Gender !== 'all') list = list.filter(c => c.sexe === uc2Gender)
                            if (uc2AgeRange) { const max = parseInt(uc2AgeRange); list = list.filter(c => c.date_naissance ? Math.floor((Date.now()-new Date(c.date_naissance).getTime())/31557600000) <= max : false) }
                            if (uc2Region && uc2Region !== 'all') list = list.filter(c => c.nationalite === uc2Region)
                            if (list.length === 0) return <div className="uc2-premium-empty"><span className="uc2-premium-empty-icon">👶</span><p>{t('uc_no_results')||'Aucun enfant trouvé'}</p></div>
                            return list.map(child => {
                              const age = child.date_naissance ? Math.floor((Date.now()-new Date(child.date_naissance).getTime())/31557600000) : null
                              const photo = localStorage.getItem('cdo_child_photo_'+child.uid)
                              const lastMed = child.extra_data?.medical?.lastCheckup || null
                              const crit = ['hospitalized','missing']
                              const bc = crit.includes(child.status) ? 'rgba(239,68,68,0.3)' : child.status === 'sick' ? 'rgba(245,158,11,0.3)' : 'rgba(20,184,166,0.25)'
                              const gc = crit.includes(child.status) ? 'rgba(239,68,68,0.06)' : child.status === 'sick' ? 'rgba(245,158,11,0.06)' : 'rgba(20,184,166,0.04)'
                              return (
                                <div key={child.id} className="uc2-premium-card" style={{borderColor: bc, boxShadow: `0 0 24px ${gc}`}}>
                                  <div className="uc2-premium-card-top">
                                    <div className="uc2-premium-card-avatar">
                                      {photo ? <img src={photo} alt="" /> : <span className="uc2-premium-card-initial">{child.prenom?.[0]||child.nom?.[0]||'?'}</span>}
                                    </div>
                                    <div className="uc2-premium-card-info">
                                      <div className="uc2-premium-card-name">{child.prenom||''} {child.nom||''}</div>
                                      <div className="uc2-premium-card-uid">#{child.uid}</div>
                                      <div className="uc2-premium-card-meta">
                                        <span>{child.sexe === 'M' ? '♂' : child.sexe === 'F' ? '♀' : ''} {child.sexe === 'M' ? (t('form_male')||'M') : child.sexe === 'F' ? (t('form_female')||'F') : '—'}</span>
                                        <span className="uc2-premium-card-dot">·</span>
                                        <span>{age !== null ? age + ' ' + (t('form_years')||'ans') : '—'}</span>
                                      </div>
                                    </div>
                                    <span className="uc2-premium-card-status" style={{
                                      background: crit.includes(child.status) ? 'rgba(239,68,68,0.12)' : child.status === 'sick' ? 'rgba(245,158,11,0.12)' : child.status === 'active' ? 'rgba(20,184,166,0.12)' : 'rgba(100,116,139,0.12)',
                                      color: crit.includes(child.status) ? '#ef4444' : child.status === 'sick' ? '#f59e0b' : child.status === 'active' ? '#14b8a6' : '#94a3b8'
                                    }}>{t('child_status_' + child.status) || child.status}</span>
                                  </div>
                                  <div className="uc2-premium-card-micro">
                                    <div className="uc2-premium-micro-item">
                                      <span className="uc2-premium-micro-label">{t('uc_health_progress')||'Suivi santé'}</span>
                                      <span className="uc2-premium-micro-bar"><span className="uc2-premium-micro-fill" style={{width: child.extra_data?.medical?.vaccinations?.length > 0 ? '70%' : '25%'}}></span></span>
                                    </div>
                                    <div className="uc2-premium-micro-item">
                                      <span className="uc2-premium-micro-label">{t('uc_last_visit')||'Dernière visite'}</span>
                                      <span className="uc2-premium-micro-value">{lastMed ? new Date(lastMed).toLocaleDateString() : '—'}</span>
                                    </div>
                                  </div>
                                  <button className="uc2-premium-card-select" onClick={() => { setUpdateChild(child); setUc2Search(''); setUc2Gender(''); setUc2AgeRange(''); setUc2Region(''); setUc2SortStatus('') }}>
                                    {t('uc_select_btn')||'Sélectionner'} →
                                  </button>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    ) : uc2Success ? (
                      /* ── Success State ── */
                      <div className="uc2-success">
                        <div className="uc2-success-icon">✅</div>
                        <div className="uc2-success-title">{t('uc_success') || 'Mise à jour enregistrée !'}</div>
                        <p className="uc2-success-desc">{t('uc_success_desc') || 'Un événement a été ajouté à l\'historique de l\'enfant.'}</p>
                        <div className="uc2-success-actions">
                          <button className="uc2-btn uc2-btn-primary" onClick={() => { setUc2Step(0); setUc2Category(null); setUc2Type(''); setUc2FormData({}); setUc2Priority('normal'); setUc2Reason(''); setUc2Comment(''); setUc2Files([]); setUc2Success(false) }}>{t('uc_add_another') || 'Ajouter une autre'} +</button>
                          <button className="uc2-btn uc2-btn-secondary" onClick={() => { setActiveKey('enfants-enregistres'); setUpdateChild(null); setUc2Step(0); setUc2Category(null); setUc2Type(''); setUc2FormData({}); setUc2Priority('normal'); setUc2Reason(''); setUc2Comment(''); setUc2Files([]); setUc2Success(false) }}>{t('form_back') || 'Retour'}</button>
                        </div>
                      </div>
                    ) : (
                      /* ── 3-Column Enterprise Dashboard Layout ── */
                      <div className="uc2-dash">
                        {/* ═══ LEFT SIDEBAR: Child List Panel ═══ */}
                        <div className="uc2-left">
                          <div className="uc2-left-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input className="uc2-left-search" value={uc2Search} onChange={e => setUc2Search(e.target.value)} placeholder={t('uc_search_child')||'Rechercher...'} />
                          </div>
                          <div className="uc2-left-filters">
                            <span className="uc2-left-filter-label">{t('form_status')||'Statut'}</span>
                            <div className="uc2-left-filter-chips">
                              {['active','sick','hospitalized','missing'].map(s => (
                                <button key={s} className="uc2-left-chip" onClick={() => {}}>{t('child_status_'+s)||s}</button>
                              ))}
                            </div>
                          </div>
                          <div className="uc2-left-list">
                            {(registeredChildren.length > 0 ? registeredChildren : []).filter(c => !uc2Search || (c.prenom||'').toLowerCase().includes(uc2Search.toLowerCase()) || (c.nom||'').toLowerCase().includes(uc2Search.toLowerCase()) || (c.uid||'').toLowerCase().includes(uc2Search.toLowerCase())).map(child => (
                              <button key={child.id} className={`uc2-left-item${updateChild?.id === child.id ? ' active' : ''}`} onClick={() => { setUpdateChild(child); setUc2Category(null); setUc2Type(''); setUc2FormData({}); setUc2Priority('normal'); setUc2Reason(''); setUc2Comment(''); setUc2Files([]); setUc2Step(0) }}>
                                <div className="uc2-left-item-avatar">
                                  {(() => { const lp = localStorage.getItem('cdo_child_photo_'+child.uid); if (lp) return <img src={lp} alt="" />; return <span>{child.prenom?.[0]||child.nom?.[0]||'?'}</span> })()}
                                  {['missing','hospitalized','at_risk'].includes(child.status) && <span className="uc2-left-item-alert">!</span>}
                                </div>
                                <div className="uc2-left-item-info">
                                  <div className="uc2-left-item-name">{child.prenom||''} {child.nom||''}</div>
                                  <div className="uc2-left-item-meta">#{child.uid} · {child.date_naissance ? Math.floor((Date.now()-new Date(child.date_naissance).getTime())/31557600000)+' '+(t('form_years')||'ans') : '—'}</div>
                                </div>
                                <span className="uc2-left-item-status" style={{background:child.status==='active'?'rgba(34,197,94,0.12)':child.status==='hospitalized'||child.status==='missing'?'rgba(239,68,68,0.12)':'rgba(100,116,139,0.12)',color:child.status==='active'?'#22c55e':child.status==='hospitalized'||child.status==='missing'?'#ef4444':'#94a3b8'}}>{t('child_status_'+child.status)||child.status}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ═══ CENTER: Workspace ═══ */}
                        <div className="uc2-center">
                          {/* Hero Card */}
                          <div className="uc2-hero">
                            <div className="uc2-hero-avatar">
                              {(() => { const lp = localStorage.getItem('cdo_child_photo_' + updateChild.uid); if (lp) return <img src={lp} alt="" />; if (updateChild.photo) return <img src={updateChild.photo} alt="" />; return <span>{updateChild.prenom?.[0] || updateChild.nom?.[0] || '?'}</span> })()}
                            </div>
                            <div className="uc2-hero-info">
                              <div className="uc2-hero-name">{updateChild.prenom || ''} {updateChild.nom || ''} <span className="uc2-hero-uid">#{updateChild.uid}</span></div>
                              <div className="uc2-hero-meta">
                                <span>🎂 {updateChild.date_naissance ? Math.floor((Date.now()-new Date(updateChild.date_naissance).getTime())/31557600000)+' '+(t('form_years')||'ans') : '—'}</span>
                                <span>⚤ {updateChild.sexe === 'M' ? (t('form_male')||'M') : updateChild.sexe === 'F' ? (t('form_female')||'F') : '—'}</span>
                                {updateChild.nationalite && <span>🌍 {updateChild.nationalite}</span>}
                              </div>
                            </div>
                            <div className="uc2-hero-actions">
                              <button className="uc2-hero-btn" onClick={() => { setActiveKey('history-center'); setHcHistoryChild(updateChild) }}>📜 {t('pd_history')||'Historique'}</button>
                              <button className="uc2-hero-btn" onClick={() => { setActiveKey('enfants-enregistrés'); setSelectedRegChild(updateChild) }}>👤 {t('form_profile')||'Profil'}</button>
                            </div>
                          </div>

                          {/* Status Update Card */}
                          {uc2Step === 0 && !uc2Category && (
                            <div className="uc2-status-card">
                              <div className="uc2-status-card-header">
                                <span className="uc2-status-card-icon">🔄</span>
                                <span className="uc2-status-card-title">{t('uc_current_status')||'Mettre à jour le statut'}</span>
                              </div>
                              <div className="uc2-status-card-body">
                                <div className="uc2-status-current">
                                  <span className="uc2-status-label">{t('form_status')||'Statut actuel'}</span>
                                  <span className="uc2-status-badge" style={{background:updateChild.status==='active'?'rgba(34,197,94,0.12)':updateChild.status==='hospitalized'?'rgba(239,68,68,0.12)':'rgba(100,116,139,0.12)',color:updateChild.status==='active'?'#22c55e':updateChild.status==='hospitalized'?'#ef4444':'#94a3b8'}}>{t('child_status_'+updateChild.status)||updateChild.status}</span>
                                </div>
                                <select className="uc2-status-select" value={updateChild.status} onChange={e => {
                                  const newStatus = e.target.value
                                  const token = localStorage.getItem('access_token')
                                  fetch(`${API}/enfants/${updateChild.id}/`, { method:'PUT', headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) }, body:JSON.stringify({ status: newStatus }) }).catch(() => {})
                                  setUpdateChild(prev => ({ ...prev, status: newStatus }))
                                }}>
                                  {['active','sick','hospitalized','healthy','enrolled','dropped_out','with_guardian','missing','at_risk','reunified','adopted','transferred','exited','deceased'].map(s => (
                                    <option key={s} value={s}>{t('child_status_'+s)||s}</option>
                                  ))}
                                </select>
                                <span className="uc2-status-hint">{t('uc_status_change_hint')||'Le changement sera automatiquement enregistré dans l\'historique'}</span>
                              </div>
                            </div>
                          )}

                          {/* Category Distribution Bar */}
                          {uc2Step === 0 && !uc2Category && (
                            <div className="uc2-cat-bar">
                              <div className="uc2-cat-bar-header">
                                <span className="uc2-cat-bar-title">{t('uc_categories')||'Catégories de mise à jour'}</span>
                                <span className="uc2-cat-bar-count">{UC_CATEGORIES.length} {t('uc_categories_lower')||'catégories'}</span>
                              </div>
                              <div className="uc2-cat-bar-grid">
                                {UC_CATEGORIES.map(cat => (
                                  <button key={cat.key} className="uc2-cat-bar-card" style={{'--cat-color':cat.color}} onClick={() => { setUc2Category(cat.key); setUc2Step(1) }}>
                                    <span className="uc2-cat-bar-icon">{cat.icon}</span>
                                    <span className="uc2-cat-bar-label">{cat.label}</span>
                                    <span className="uc2-cat-bar-desc">{cat.desc}</span>
                                    <span className="uc2-cat-bar-types">{cat.types.length} types</span>
                                    <span className="uc2-cat-bar-action" style={{background:cat.color}}>{t('form_start')||'Démarrer'} →</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Update Form Workspace */}
                          {uc2Step > 0 && uc2Category && (
                            <div className="uc2-form-ws">
                              {/* Breadcrumb */}
                              <div className="uc2-form-breadcrumb">
                                <button className="uc2-breadcrumb-link" onClick={() => { setUc2Category(null); setUc2Step(0); setUc2Type(''); setUc2FormData({}) }}>{UC_CATEGORIES.find(c=>c.key===uc2Category)?.icon} {UC_CATEGORIES.find(c=>c.key===uc2Category)?.label}</button>
                                {uc2Type && <><span className="uc2-breadcrumb-sep">/</span><span className="uc2-breadcrumb-current">{UC_CATEGORIES.find(c=>c.key===uc2Category)?.types.find(t=>t.key===uc2Type)?.label||uc2Type}</span></>}
                              </div>

                              {/* Quick Category Nav */}
                              <div className="uc2-form-cat-nav">
                                {UC_CATEGORIES.find(c => c.key === uc2Category)?.types.map(tp => (
                                  <button key={tp.key} className={`uc2-form-cat-nav-btn${uc2Type === tp.key ? ' active' : ''}`} onClick={() => { setUc2Type(tp.key); setUc2FormData({}) }}>
                                    {tp.icon} {tp.label}
                                  </button>
                                ))}
                              </div>

                              {/* Dynamic Form */}
                              {uc2Type && (() => {
                                const typeDef = UC_CATEGORIES.find(c => c.key === uc2Category)?.types.find(t => t.key === uc2Type)
                                if (!typeDef) return null
                                return (
                                  <>
                                    <div className="uc2-dynamic-form">
                                      <div className="uc2-section-subtitle">{t('uc_fill_form') || 'Remplissez les détails'}</div>
                                      <div className="uc2-dynamic-form-grid">
                                        {typeDef.fields.map(f => (
                                          <div key={f.key} className="uc2-field" style={f.type === 'textarea' ? {gridColumn:'1/-1'} : {}}>
                                            <label className="uc2-field-label">{f.label}{f.required ? ' *' : ''}</label>
                                            {f.type === 'text' && <input className="uc2-input" value={uc2FormData[f.key] || ''} onChange={e => setUc2FormData(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder || ''} />}
                                            {f.type === 'textarea' && <textarea className="uc2-input uc2-textarea" value={uc2FormData[f.key] || ''} onChange={e => setUc2FormData(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder || ''} rows={3} />}
                                            {f.type === 'date' && <input className="uc2-input" type="date" value={uc2FormData[f.key] || ''} onChange={e => setUc2FormData(p => ({...p, [f.key]: e.target.value}))} />}
                                            {f.type === 'select' && (
                                              <select className="uc2-input uc2-select" value={uc2FormData[f.key] || ''} onChange={e => setUc2FormData(p => ({...p, [f.key]: e.target.value}))}>
                                                <option value="">{t('form_select')||'Sélectionnez...'}</option>
                                                {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                                              </select>
                                            )}
                                            {f.type === 'number' && <input className="uc2-input" type="number" value={uc2FormData[f.key] || ''} onChange={e => setUc2FormData(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder || ''} />}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {/* Priority + Reason + Attachments */}
                                    <div className="uc2-form-extras">
                                      <div className="uc2-field">
                                        <label className="uc2-field-label">{t('uc_priority') || 'Priorité'} *</label>
                                        <div className="uc2-priority-group">
                                          {[
                                            { value:'low', label:t('uc_priority_low')||'Basse', color:'#22c55e' },
                                            { value:'normal', label:t('uc_priority_normal')||'Normale', color:'#3b82f6' },
                                            { value:'high', label:t('uc_priority_high')||'Haute', color:'#f59e0b' },
                                            { value:'critical', label:t('uc_priority_critical')||'Critique', color:'#ef4444' },
                                          ].map(p => (
                                            <button key={p.value} className={`uc2-priority-btn${uc2Priority === p.value ? ' active' : ''}`} style={uc2Priority === p.value ? {borderColor:p.color,background:p.color+'20',color:p.color} : {}} onClick={() => setUc2Priority(p.value)}>{p.label}</button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="uc2-field">
                                        <label className="uc2-field-label" htmlFor="uc2-reason">{t('uc_reason') || 'Motif'} *</label>
                                        <textarea id="uc2-reason" className="uc2-input uc2-textarea" value={uc2Reason} onChange={e => setUc2Reason(e.target.value)} placeholder={t('uc_reason_placeholder')||'Expliquez la raison...'} rows={2} />
                                      </div>
                                      <div className="uc2-field">
                                        <label className="uc2-field-label" htmlFor="uc2-comment">{t('uc_comment') || 'Commentaire'}</label>
                                        <textarea id="uc2-comment" className="uc2-input uc2-textarea" value={uc2Comment} onChange={e => setUc2Comment(e.target.value)} placeholder={t('uc_comment_placeholder')||'Notes supplémentaires...'} rows={2} />
                                      </div>
                                      <div className="uc2-field">
                                        <label className="uc2-field-label">{t('uc_attachments') || 'Pièces jointes'}</label>
                                        <div className="uc2-dropzone" onClick={() => document.getElementById('uc2-files')?.click()}>
                                          <input id="uc2-files" type="file" multiple hidden onChange={e => { setUc2Files(prev => [...prev, ...Array.from(e.target.files||[]).map(f => ({ name: f.name, size: f.size, type: f.type }))]) }} />
                                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                          <p>{t('uc_drag_drop')||'Glissez-déposez'}</p>
                                          <span>{t('uc_click_browse')||'ou cliquez'}</span>
                                        </div>
                                        {uc2Files.length > 0 && <div className="uc2-file-list">{uc2Files.map((f, i) => (
                                          <div key={i} className="uc2-file-item"><span>📎 {f.name}</span><span className="uc2-file-size">{(f.size/1024).toFixed(0)} Ko</span><button className="uc2-file-remove" onClick={() => setUc2Files(prev => prev.filter((_, j) => j !== i))}>✕</button></div>
                                        ))}</div>}
                                      </div>
                                    </div>
                                    {/* Save Button */}
                                    <button className="uc2-btn uc2-btn-primary uc2-btn-save" onClick={async () => {
                                      const requiredFields = typeDef.fields.filter(f => f.required)
                                      for (const rf of requiredFields) { if (!uc2FormData[rf.key]?.trim()) { alert(rf.label + ' ' + (t('form_required')||'est requis')); return } }
                                      if (!uc2Reason.trim()) { alert(t('uc_required')||'Motif requis'); return }
                                      setUc2Saving(true)
                                      const token = localStorage.getItem('access_token')
                                      const payload = { category: uc2Category, update_type: uc2Type, title: (t('uc_type_'+uc2Type)||uc2Type.replace(/_/g,' '))+' - '+updateChild.prenom+' '+updateChild.nom, description: JSON.stringify(uc2FormData), previous_value: '', new_value: JSON.stringify(uc2FormData), reason: uc2Reason+' | Priorité: '+uc2Priority+(uc2Comment ? ' | '+uc2Comment : ''), attachments: uc2Files.map(f => f.name) }
                                      try {
                                        const res = await fetch(`${API}/enfants/${updateChild.id}/updates/`, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) }, body:JSON.stringify(payload) })
                                        if (res.ok) { setUc2Saving(false); setUc2Success(true) }
                                        else throw new Error()
                                      } catch {
                                        const updates = JSON.parse(localStorage.getItem('cdo_updates_'+updateChild.uid)||'[]')
                                        updates.unshift({ id:Date.now(), ...payload, created_at: new Date().toISOString(), created_by: (user?.first_name||'')+' '+(user?.last_name||'') })
                                        localStorage.setItem('cdo_updates_'+updateChild.uid, JSON.stringify(updates))
                                        setUc2Saving(false); setUc2Success(true)
                                      }
                                    }} disabled={uc2Saving}>
                                      {uc2Saving ? <span className="uc2-btn-spinner"/> : null}
                                      {uc2Saving ? (t('uc_saving')||'Enregistrement...') : (t('uc_save')||'Enregistrer la mise à jour')}
                                    </button>
                                  </>
                                )
                              })()}
                            </div>
                          )}
                        </div>

                        {/* ═══ RIGHT PANEL: Context & Summary ═══ */}
                        <div className="uc2-right">
                          {/* Child Quick Card */}
                          <div className="uc2-right-card">
                            <div className="uc2-right-card-header">{t('form_summary')||'Résumé'}</div>
                            <div className="uc2-right-child">
                              <div className="uc2-right-avatar">
                                {(() => { const lp = localStorage.getItem('cdo_child_photo_'+updateChild.uid); if (lp) return <img src={lp} alt="" />; return <span>{updateChild.prenom?.[0]||updateChild.nom?.[0]||'?'}</span> })()}
                              </div>
                              <div>
                                <div className="uc2-right-name">{updateChild.prenom||''} {updateChild.nom||''}</div>
                                <div className="uc2-right-uid">#{updateChild.uid}</div>
                              </div>
                            </div>
                            {uc2Category && <div className="uc2-right-row"><span className="uc2-right-label">{t('uc_category')||'Catégorie'}</span><span>{UC_CATEGORIES.find(c=>c.key===uc2Category)?.icon} {UC_CATEGORIES.find(c=>c.key===uc2Category)?.label}</span></div>}
                            {uc2Type && <div className="uc2-right-row"><span className="uc2-right-label">{t('form_type')||'Type'}</span><span>{t('uc_type_'+uc2Type)||uc2Type.replace(/_/g,' ')}</span></div>}
                            {uc2Priority && <div className="uc2-right-row"><span className="uc2-right-label">{t('uc_priority')||'Priorité'}</span><span style={{color:{ low:'#22c55e', normal:'#3b82f6', high:'#f59e0b', critical:'#ef4444' }[uc2Priority]}}>{t('uc_priority_'+uc2Priority)||uc2Priority}</span></div>}
                            {Object.keys(uc2FormData).length > 0 && (
                              <div className="uc2-right-fields">
                                <div className="uc2-right-label">{t('uc_fill_form')||'Données'}</div>
                                {(() => {
                                  const cat = UC_CATEGORIES.find(c => c.key === uc2Category)
                                  const typeDef = cat?.types.find(t => t.key === uc2Type)
                                  return Object.entries(uc2FormData).filter(([_,v]) => v).slice(0,4).map(([k,v]) => {
                                    const fl = typeDef?.fields.find(f => f.key === k)?.label || k
                                    return <div key={k} className="uc2-right-field"><span>{fl}</span><span>{v}</span></div>
                                  })
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Timeline Preview Card */}
                          {uc2Category && uc2Type && Object.keys(uc2FormData).length > 0 && (
                            <div className="uc2-right-card">
                              <div className="uc2-right-card-header">{t('uc_preview')||'Aperçu historique'}</div>
                              <div className="uc2-right-tl">
                                <div className="uc2-right-tl-dot" style={{background:UC_CATEGORIES.find(c=>c.key===uc2Category)?.color}}>{UC_CATEGORIES.find(c=>c.key===uc2Category)?.icon}</div>
                                <div className="uc2-right-tl-content">
                                  <div className="uc2-right-tl-text">{uc2Type ? (t('uc_type_'+uc2Type)||uc2Type.replace(/_/g,' ')) : ''}</div>
                                  <div className="uc2-right-tl-time">{new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Staff Info */}
                          <div className="uc2-right-card">
                            <div className="uc2-right-card-header">{t('form_staff')||'Intervenant'}</div>
                            <div className="uc2-right-staff">
                              <div className="uc2-right-staff-avatar" style={{background:`hsl(${user.first_name ? user.first_name.charCodeAt(0)*37%360 : 200},50%,35%)`}}>{(user.first_name?.[0]||'')+(user.last_name?.[0]||'')}</div>
                              <div>
                                <div className="uc2-right-staff-name">{user?.first_name||''} {user?.last_name||''}</div>
                                <div className="uc2-right-staff-role">{roleLabel}</div>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="uc2-right-actions">
                            {uc2Category && uc2Step > 0 ? (
                              <button className="uc2-right-action" onClick={() => { setUc2Category(null); setUc2Step(0); setUc2Type(''); setUc2FormData({}) }}>
                                ← {t('uc_back_categories')||'Changer de catégorie'}
                              </button>
                            ) : null}
                            {uc2Type && (
                              <button className="uc2-right-action" onClick={() => { setUc2Type(''); setUc2FormData({}) }}>
                                ← {t('uc_back_types')||'Changer de type'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeKey === 'history-center' ? (
                  <div className="hc-wrap hc-standalone">
                    {hcHistoryChild ? <>
                      {/* ── History Center Standalone ── */}
                      <div className="hc-standalone-layout">
                        <div className="hc-standalone-main">
                          {/* Header */}
                          <div className="hc-standalone-header">
                            <button className="dash-back-btn" onClick={() => { setHcHistoryChild(null); setHcEvents([]); setHcFilterCategory(''); setHcFilterType(''); setHcFilterPriority(''); setHcFilterSource(''); setHcSearch(''); setHcDateFrom(''); setHcDateTo(''); setHcStatusOnly(false); setHcExpanded(null); setHcSelectedEvent(null) }}>{'\u2190'} {t('form_back')}</button>
                            <div className="hc-standalone-title">
                              <span className="hc-standalone-icon">📜</span>
                              <span>{t('hc_title')||'Centre d\'Historique'}</span>
                            </div>
                          </div>

                          {/* Child Summary Card */}
                          <div className="hc-child-summary">
                            <div className="hc-child-summary-avatar">
                              {(() => { const lp = localStorage.getItem('cdo_child_photo_' + hcHistoryChild.uid); if (lp) return <img src={lp} alt="" />; if (hcHistoryChild.photo) return <img src={hcHistoryChild.photo} alt="" />; return <span>{hcHistoryChild.prenom?.[0] || hcHistoryChild.nom?.[0] || '?'}</span> })()}
                            </div>
                            <div className="hc-child-summary-info">
                              <div className="hc-child-summary-name">{hcHistoryChild.prenom||''} {hcHistoryChild.nom||''}</div>
                              <div className="hc-child-summary-meta">
                                <span>#{hcHistoryChild.uid}</span>
                                <span>🎂 {hcHistoryChild.date_naissance ? Math.floor((Date.now()-new Date(hcHistoryChild.date_naissance).getTime())/31557600000) + ' ' + (t('form_years')||'ans') : '—'}</span>
                                <span>⚤ {hcHistoryChild.sexe === 'M' ? (t('form_male')||'M') : hcHistoryChild.sexe === 'F' ? (t('form_female')||'F') : '—'}</span>
                                {hcHistoryChild.nationalite && <span>{hcHistoryChild.nationalite}</span>}
                              </div>
                            </div>
                            <span className="hc-child-summary-status" style={{background:hcHistoryChild.status === 'active' ? 'rgba(34,197,94,0.15)' : hcHistoryChild.status === 'hospitalized'||hcHistoryChild.status === 'missing' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)', color:hcHistoryChild.status === 'active' ? '#22c55e' : hcHistoryChild.status === 'hospitalized'||hcHistoryChild.status === 'missing' ? '#ef4444' : '#94a3b8'}}>{hcHistoryChild.status ? (t('child_status_'+hcHistoryChild.status)||hcHistoryChild.status) : (t('form_active')||'Actif')}</span>
                          </div>

                          {/* History content using same logic as profile tab */}
                          {(() => {
                            const hcIcons = {
                              created:'✅', updated:'✏️', update_added:'📝',
                              document_added:'📄', document_verified:'✅', document_replaced:'🔄', document_expired:'⏰',
                              health_update:'💉', vaccination_added:'💉', illness_added:'🤒',
                              treatment_started:'💊', treatment_ended:'✅', consultation_added:'🩺',
                              hospitalization_added:'🏥', allergy_added:'🤧',
                              education_update:'📚', school_enrolled:'🏫', school_changed:'🔄',
                              grade_added:'📊', exam_result_added:'📝',
                              family_update:'👨‍👩‍👧‍👦', guardian_assigned:'👤', parent_identified:'🔍',
                              family_reunified:'🤗', foster_placement:'🏡', adoption_progress:'📋',
                              social_update:'🤝', social_note_added:'📝', home_visit:'🏠',
                              counseling_session:'💬', incident_reported:'⚠️', protection_concern:'🛡️',
                              status_change:'🔄', alert_triggered:'🚨', note_added:'💬', case_note:'📌',
                              file_downloaded:'⬇️', record_approved:'✅', record_rejected:'❌',
                              notification_sent:'🔔', child_archived:'📦', child_restored:'♻️',
                              follow_up:'📋', observation_added:'👁️', transfer_initiated:'🚚', exit_registered:'🚪',
                            }
                            const hcColors = { general:'#64748b', registration:'#22c55e', identity:'#3b82f6', status:'#f59e0b', health:'#22c55e', education:'#3b82f6', family:'#a855f7', documents:'#f59e0b', social:'#ef4444', protection:'#ef4444', alert:'#ef4444', system:'#64748b', follow_up:'#06b6d4' }
                            const criticalEventTypes = ['alert_triggered','protection_concern','incident_reported','hospitalization_added','exit_registered','child_archived','transfer_initiated']
                            const criticalPriorities = ['critical','high']
                            const hcLoad = (child) => {
                              const stored = JSON.parse(localStorage.getItem('cdo_updates_' + child.uid) || '[]')
                              const med = child.extra_data?.medical
                              const vax = med?.vaccinations?.filter(v => v.done).map(v => ({ event_type:'vaccination_added', category:'health', title:`Vaccination ${v.name}`, description:'', old_value:'Non administré', new_value:'Administré le '+(v.dateAdmin||'—'), performed_by_name:'', performed_role:'', department:'', attachments:[], priority:'normal', source_module:'health', event_date:v.dateAdmin||child.created_at })) || []
                              const edu = child.extra_data?.education
                              const grades = edu?.subjects?.filter(s => s.grade).map(s => ({ event_type:'grade_added', category:'education', title:`Note ${s.name}`, description:'', old_value:'', new_value:`${s.grade}/20`, performed_by_name:'', performed_role:'', department:'', attachments:[], priority:'normal', source_module:'education', event_date:child.updated_at })) || []
                              return [...stored.map(s => ({ ...s, event_type:s.event_type||'update_added', performed_by_name:s.created_by||s.created_by_name||'', department:s.department||'', priority:s.priority||'normal', source_module:s.source_module||'update_center', attachments:s.attachments||[], event_date:s.event_date||s.created_at })), ...vax, ...grades, { event_type:'created', category:'registration', title:t('pd_registered')||'Enfant enregistré', description:'Nouvel enregistrement dans le système', old_value:'', new_value:`UID: ${child.uid}`, performed_by_name:(user?.first_name||'')+' '+(user?.last_name||''), performed_role:user?.role||'', department:'', attachments:[], priority:'normal', source_module:'registration', event_date:child.created_at }].sort((a, b) => new Date(b.event_date||0) - new Date(a.event_date||0))
                            }
                            const hcLocal = hcLoad(hcHistoryChild)
                            const hcFiltered = hcLocal.filter(e => {
                              if (hcFilterCategory && e.category !== hcFilterCategory) return false
                              if (hcFilterType && e.event_type !== hcFilterType) return false
                              if (hcFilterPriority && e.priority !== hcFilterPriority) return false
                              if (hcFilterSource && e.source_module !== hcFilterSource) return false
                              if (hcStatusOnly && e.event_type !== 'status_change') return false
                              if (hcDateFrom && new Date(e.event_date||0) < new Date(hcDateFrom)) return false
                              if (hcDateTo && new Date(e.event_date||0) > new Date(hcDateTo+'T23:59:59')) return false
                              if (hcSearch && !(e.title||'').toLowerCase().includes(hcSearch.toLowerCase()) && !(e.description||'').toLowerCase().includes(hcSearch.toLowerCase()) && !(e.performed_by_name||'').toLowerCase().includes(hcSearch.toLowerCase()) && !(e.reason||'').toLowerCase().includes(hcSearch.toLowerCase())) return false
                              return true
                            })
                            const hcStats = { total:hcLocal.length, status_changes:hcLocal.filter(e => e.event_type === 'status_change').length, health_events:hcLocal.filter(e => e.category === 'health').length, education_events:hcLocal.filter(e => e.category === 'education').length, family_events:hcLocal.filter(e => e.category === 'family').length, document_events:hcLocal.filter(e => e.category === 'documents').length, alert_events:hcLocal.filter(e => e.category === 'alert'||e.category === 'protection'||e.priority === 'critical').length }
                            const hcGrouped = (() => { const today=new Date(); today.setHours(0,0,0,0); const yesterday=new Date(today); yesterday.setDate(yesterday.getDate()-1); const ws=new Date(today); ws.setDate(ws.getDate()-ws.getDay()); const ms=new Date(today.getFullYear(),today.getMonth(),1); const g={today:[],yesterday:[],thisWeek:[],thisMonth:[],older:[]}; hcFiltered.forEach(e=>{const d=new Date(e.event_date||0); d.setHours(0,0,0,0); if(d.getTime()===today.getTime()) g.today.push(e); else if(d.getTime()===yesterday.getTime()) g.yesterday.push(e); else if(d>=ws) g.thisWeek.push(e); else if(d>=ms) g.thisMonth.push(e); else g.older.push(e)}); return g })()
                            const hcGL = { today:t('hc_group_today')||"Aujourd'hui", yesterday:t('hc_group_yesterday')||'Hier', thisWeek:t('hc_group_this_week')||'Cette semaine', thisMonth:t('hc_group_this_month')||'Ce mois-ci', older:t('hc_group_older')||'Plus ancien' }
                            const hcDC = hcDensity === 'compact' ? ' hc-density-compact' : hcDensity === 'audit' ? ' hc-density-audit' : ''
                            return (
                              <div className="hc-standalone-body">
                                {/* Stats */}
                                <div className="hc-kpi-row">
                                  {[
                                    { label:t('hc_total_events')||'Événements', value:hcStats.total, icon:'📊', color:'#3b82f6' },
                                    { label:t('hc_status_changes')||'Statuts', value:hcStats.status_changes, icon:'🔄', color:'#f59e0b' },
                                    { label:t('hc_health_events')||'Santé', value:hcStats.health_events, icon:'💉', color:'#22c55e' },
                                    { label:t('hc_education_events')||'Éducation', value:hcStats.education_events, icon:'📚', color:'#3b82f6' },
                                    { label:t('hc_family_events')||'Famille', value:hcStats.family_events, icon:'👨‍👩‍👧‍👦', color:'#a855f7' },
                                    { label:t('hc_alert_events')||'Alertes', value:hcStats.alert_events, icon:'🚨', color:'#ef4444' },
                                  ].map((kpi, i) => (
                                    <div key={i} className="hc-kpi" style={{borderLeftColor:kpi.color}}>
                                      <span className="hc-kpi-icon">{kpi.icon}</span>
                                      <div className="hc-kpi-info"><span className="hc-kpi-value">{kpi.value}</span><span className="hc-kpi-label">{kpi.label}</span></div>
                                    </div>
                                  ))}
                                </div>

                                {/* Toolbar */}
                                <div className="hc-toolbar">
                                  <div className="hc-view-tabs">
                                    {[{ key:'timeline', icon:'📋', label:t('hc_timeline')||'Chronologie' }, { key:'audit', icon:'📋', label:t('hc_audit_log')||'Audit' }, { key:'calendar', icon:'📅', label:t('hc_calendar')||'Calendrier' }, { key:'analytics', icon:'📊', label:t('hc_analytics')||'Analytiques' }].map(v => (
                                      <button key={v.key} className={`hc-view-tab${hcView === v.key ? ' active' : ''}`} onClick={() => setHcView(v.key)}>{v.icon} {v.label}</button>
                                    ))}
                                  </div>
                                  <div className="hc-toolbar-actions">
                                    {hcView === 'timeline' && ['comfortable','compact','audit'].map(d => (
                                      <button key={d} className={`hc-density-btn${hcDensity === d ? ' active' : ''}`} onClick={() => setHcDensity(d)}>
                                        {d === 'comfortable' ? '⋅⋅' : d === 'compact' ? '··' : '━━'} {t('hc_density_'+d)||d}
                                      </button>
                                    ))}
                                    <button className="hc-export-btn" onClick={() => { const csv = [['Date','Catégorie','Type','Titre','Ancien','Nouveau','Par','Motif'].join(',')].concat(hcFiltered.map(e => [e.event_date||'',e.category||'',e.event_type||'',`"${(e.title||'').replace(/"/g,'""')}"`,`"${(e.old_value||'').replace(/"/g,'""')}"`,`"${(e.new_value||'').replace(/"/g,'""')}"`,e.performed_by_name||'',`"${(e.reason||'').replace(/"/g,'""')}"`].join(','))).join('\n'); const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `historique_${hcHistoryChild.uid}.csv`; a.click() }}>{t('hc_export')||'Exporter'} ⬇️</button>
                                  </div>
                                </div>

                                {/* Filters */}
                                <div className="hc-filters">
                                  <select className="hc-filter-select" value={hcFilterCategory} onChange={e => setHcFilterCategory(e.target.value)}>
                                    <option value="">{t('hc_all_categories')||'Toutes'}</option>
                                    {Object.keys(hcColors).map(c => <option key={c} value={c}>{t('uc_category_'+c)||c}</option>)}
                                  </select>
                                  <select className="hc-filter-select" value={hcFilterType} onChange={e => setHcFilterType(e.target.value)}>
                                    <option value="">{t('hc_all_types')||'Tous'}</option>
                                    {Object.entries(hcIcons).map(([k, icon]) => <option key={k} value={k}>{icon} {t('hc_event_'+k)||k}</option>)}
                                  </select>
                                  <select className="hc-filter-select" value={hcFilterPriority} onChange={e => setHcFilterPriority(e.target.value)}>
                                    <option value="">{t('hc_select_priority')||'Priorité'}</option>
                                    {['low','normal','high','critical'].map(p => <option key={p} value={p}>{t('hc_priority_'+p)||p}</option>)}
                                  </select>
                                  <select className="hc-filter-select" value={hcFilterSource} onChange={e => setHcFilterSource(e.target.value)}>
                                    <option value="">{t('hc_filter_source')||'Module'}</option>
                                    {['registration','child_profile','health','education','family','documents','social','update_center','status','system','alert','follow_up'].map(s => <option key={s} value={s}>{t('hc_source_'+s)||s}</option>)}
                                  </select>
                                  <input type="date" className="hc-filter-date" value={hcDateFrom} onChange={e => setHcDateFrom(e.target.value)} title={t('hc_date_from')||'Du'} />
                                  <input type="date" className="hc-filter-date" value={hcDateTo} onChange={e => setHcDateTo(e.target.value)} title={t('hc_date_to')||'Au'} />
                                  <div className="hc-date-presets">
                                    {[
                                      { key:'7d', label:t('hc_preset_7d')||'7 jours', days:7 },
                                      { key:'30d', label:t('hc_preset_30d')||'30 jours', days:30 },
                                      { key:'tm', label:t('hc_preset_this_month')||'Ce mois', fn:()=>{const d=new Date(),y=d.getFullYear(),m=d.getMonth();return{from:new Date(y,m,1).toISOString().split('T')[0],to:d.toISOString().split('T')[0]}} },
                                      { key:'lm', label:t('hc_preset_last_month')||'Mois dernier', fn:()=>{const d=new Date(),y=d.getFullYear(),m=d.getMonth();return{from:new Date(y,m-1,1).toISOString().split('T')[0],to:new Date(y,m,0).toISOString().split('T')[0]}} },
                                    ].map(p => (
                                      <button key={p.key} className="hc-preset-btn" onClick={() => {
                                        if (p.fn) { const r=p.fn(); setHcDateFrom(r.from); setHcDateTo(r.to) }
                                        else { const d=new Date(),f=new Date(d); f.setDate(d.getDate()-p.days); setHcDateFrom(f.toISOString().split('T')[0]); setHcDateTo(d.toISOString().split('T')[0]) }
                                      }}>{p.label}</button>
                                    ))}
                                  </div>
                                  <div className="hc-search-wrap">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                    <input className="hc-search-input" value={hcSearch} onChange={e => setHcSearch(e.target.value)} placeholder={t('hc_search_events')||'Rechercher...'} />
                                  </div>
                                  <label className="hc-status-toggle"><input type="checkbox" checked={hcStatusOnly} onChange={e => setHcStatusOnly(e.target.checked)} /><span>{t('hc_filter_status_only')||'Statuts'}</span></label>
                                  {(hcFilterCategory||hcFilterType||hcFilterPriority||hcFilterSource||hcSearch||hcDateFrom||hcDateTo||hcStatusOnly) && <button className="hc-clear-btn" onClick={() => { setHcFilterCategory(''); setHcFilterType(''); setHcFilterPriority(''); setHcFilterSource(''); setHcSearch(''); setHcDateFrom(''); setHcDateTo(''); setHcStatusOnly(false) }}>{t('hc_clear_filters')||'✕'}</button>}
                                  <span className="hc-filter-count">{hcFiltered.length} / {hcLocal.length}</span>
                                </div>

                                {/* Timeline */}
                                {hcView === 'timeline' && (
                                  <div className={`hc-timeline${hcDC}`}>
                                    {hcFiltered.length === 0 && <div className="hc-empty"><span className="hc-empty-icon">📭</span><p>{t('hc_no_events')||'Aucun événement'}</p></div>}
                                    {hcDensity === 'comfortable' ? Object.entries(hcGrouped).filter(([_,evs])=>evs.length).map(([gk,evs]) => (
                                      <div key={gk} className="hc-tl-group">
                                        <div className="hc-tl-group-header"><span className="hc-tl-group-label">{hcGL[gk]||gk}</span><span className="hc-tl-group-count">{evs.length}</span></div>
                                        {evs.map((e,i) => (
                                          <div key={i} className={`hc-tl-item${hcExpanded===gk+'_'+i?' expanded':''}${criticalEventTypes.includes(e.event_type)||criticalPriorities.includes(e.priority)?' hc-tl-critical':''}${e.event_type==='status_change'?' hc-tl-status-change':''}`} onClick={()=>{setHcExpanded(hcExpanded===gk+'_'+i?null:gk+'_'+i);setHcSelectedEvent(e)}}>
                                            <div className="hc-tl-line" />
                                            <div className="hc-tl-dot" style={{background:hcColors[e.category]||'#64748b'}}>{hcIcons[e.event_type]||'📌'}</div>
                                            <div className="hc-tl-card">
                                              <div className="hc-tl-card-top">
                                                <span className="hc-tl-badge" style={{background:hcColors[e.category]||'#64748b'}}>{e.category?t('uc_category_'+e.category)||e.category:''}</span>
                                                {e.priority&&e.priority!=='normal'&&<span className={`hc-tl-priority hc-tl-priority-${e.priority}`}>{t('hc_priority_'+e.priority)||e.priority}</span>}
                                                <span className="hc-tl-time">{e.event_date?new Date(e.event_date).toLocaleDateString(lang==='en'?'en-US':'fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}</span>
                                              </div>
                                              <div className="hc-tl-title">{e.title}</div>
                                              {e.event_type==='status_change'&&e.old_value&&e.new_value&&<div className="hc-tl-status-beforeafter"><span className="hc-tl-status-badge hc-tl-status-old">{e.old_value}</span><span className="hc-tl-arrow">→</span><span className="hc-tl-status-badge hc-tl-status-new">{e.new_value}</span></div>}
                                              {e.performed_by_name&&<div className="hc-tl-meta">{t('hc_performed_by')||'Par'}: {e.performed_by_name}{e.performed_role?' ('+e.performed_role+')':''}</div>}
                                              {hcExpanded===gk+'_'+i&&<div className="hc-tl-details">
                                                {e.description&&<div className="hc-tl-detail-row"><strong>{t('form_description')||'Description'}:</strong><span>{e.description}</span></div>}
                                                {e.old_value&&e.event_type!=='status_change'&&<div className="hc-tl-detail-row"><strong style={{color:'#ef4444'}}>{t('hc_old_value')||'Ancien'}:</strong><span>{e.old_value}</span></div>}
                                                {e.new_value&&e.event_type!=='status_change'&&<div className="hc-tl-detail-row"><strong style={{color:'#22c55e'}}>{t('hc_new_value')||'Nouveau'}:</strong><span>{e.new_value}</span></div>}
                                                {e.reason&&<div className="hc-tl-detail-row"><strong>{t('hc_reason')||'Motif'}:</strong><span>{e.reason}</span></div>}
                                                {e.department&&<div className="hc-tl-detail-row"><strong>{t('hc_department')||'Département'}:</strong><span>{e.department}</span></div>}
                                                {e.source_module&&<div className="hc-tl-detail-row"><strong>{t('hc_source_module')||'Module'}:</strong><span>{t('hc_source_'+e.source_module)||e.source_module}</span></div>}
                                                {e.attachments?.length>0&&<div className="hc-tl-detail-row"><strong>{t('hc_attachments')||'Fichiers'}:</strong><span>{e.attachments.map((a,ai)=><span key={ai} className="hc-tl-attach-file">📎 {a}</span>)}</span></div>}
                                              </div>}
                                              <div className="hc-tl-expand">{hcExpanded===gk+'_'+i?'▲':'▼'}</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )) : hcFiltered.map((e,i) => (
                                      <div key={i} className={`hc-tl-item${hcExpanded===i?' expanded':''}${criticalEventTypes.includes(e.event_type)||criticalPriorities.includes(e.priority)?' hc-tl-critical':''}${e.event_type==='status_change'?' hc-tl-status-change':''}`} onClick={()=>{setHcExpanded(hcExpanded===i?null:i);setHcSelectedEvent(e)}}>
                                        <div className="hc-tl-line" />
                                        <div className="hc-tl-dot" style={{background:hcColors[e.category]||'#64748b'}}>{hcIcons[e.event_type]||'📌'}</div>
                                        <div className="hc-tl-card">
                                          <div className="hc-tl-card-top">
                                            <span className="hc-tl-badge" style={{background:hcColors[e.category]||'#64748b'}}>{e.category||''}</span>
                                            {e.priority&&e.priority!=='normal'&&<span className={`hc-tl-priority hc-tl-priority-${e.priority}`}>{e.priority}</span>}
                                            <span className="hc-tl-time">{e.event_date?new Date(e.event_date).toLocaleDateString(lang==='en'?'en-US':'fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—'}</span>
                                          </div>
                                          <div className="hc-tl-title">{e.title}</div>
                                          {e.event_type==='status_change'&&e.old_value&&e.new_value&&<div className="hc-tl-status-beforeafter"><span className="hc-tl-status-badge hc-tl-status-old">{e.old_value}</span><span className="hc-tl-arrow">→</span><span className="hc-tl-status-badge hc-tl-status-new">{e.new_value}</span></div>}
                                          {e.performed_by_name&&<div className="hc-tl-meta">{e.performed_by_name}</div>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Audit */}
                                {hcView === 'audit' && (
                                  <div className="hc-audit">
                                    <div className="hc-audit-table">
                                      <div className="hc-audit-header">
                                        <span className="hc-audit-col-date">{t('form_date')||'Date'}</span>
                                        <span className="hc-audit-col-event">{t('form_type')||'Événement'}</span>
                                        <span className="hc-audit-col-cat">{t('uc_category')||'Catégorie'}</span>
                                        <span className="hc-audit-col-priority">{t('hc_priority')||'Priorité'}</span>
                                        <span className="hc-audit-col-user">{t('hc_performed_by')||'Utilisateur'}</span>
                                        <span className="hc-audit-col-role">{t('form_role')||'Rôle'}</span>
                                        <span className="hc-audit-col-source">{t('hc_source_module')||'Module'}</span>
                                        <span className="hc-audit-col-old">{t('hc_old_value')||'Ancien'}</span>
                                        <span className="hc-audit-col-new">{t('hc_new_value')||'Nouveau'}</span>
                                        <span className="hc-audit-col-reason">{t('hc_reason')||'Motif'}</span>
                                      </div>
                                      {hcFiltered.length===0&&<div className="hc-empty"><p>{t('hc_no_events')||'Aucun'}</p></div>}
                                      {hcFiltered.map((e,i)=>(
                                        <div key={i} className={`hc-audit-row${criticalEventTypes.includes(e.event_type)||criticalPriorities.includes(e.priority)?' hc-audit-critical':''}`}>
                                          <span className="hc-audit-col-date">{e.event_date?new Date(e.event_date).toLocaleDateString(lang==='en'?'en-US':'fr-FR',{day:'2-digit',month:'short'}):'—'}</span>
                                          <span className="hc-audit-col-event"><span className="hc-event-badge" style={{background:hcColors[e.category]||'#64748b'}}>{hcIcons[e.event_type]||'📌'} {t('hc_event_'+e.event_type)||e.event_type}</span></span>
                                          <span className="hc-audit-col-cat">{e.category?t('uc_category_'+e.category)||e.category:'—'}</span>
                                          <span className="hc-audit-col-priority">{e.priority?<span className={`hc-tl-priority hc-tl-priority-${e.priority}`}>{t('hc_priority_'+e.priority)||e.priority}</span>:'—'}</span>
                                          <span className="hc-audit-col-user">{e.performed_by_name||'—'}</span>
                                          <span className="hc-audit-col-role">{e.performed_role||'—'}</span>
                                          <span className="hc-audit-col-source">{e.source_module?t('hc_source_'+e.source_module)||e.source_module:'—'}</span>
                                          <span className="hc-audit-col-old" style={{color:'#ef4444',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={e.old_value}>{e.old_value||'—'}</span>
                                          <span className="hc-audit-col-new" style={{color:'#22c55e',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={e.new_value}>{e.new_value||'—'}</span>
                                          <span className="hc-audit-col-reason" style={{maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={e.reason}>{e.reason||'—'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Calendar */}
                                  {hcView === 'calendar' && (
                                    <div className="hc-calendar">
                                      <div className="hc-cal-title">{t('hc_calendar_view')||'Calendrier'}</div>
                                      <div className="hc-cal-grid">
                                        {(() => {
                                          const today = new Date()
                                          const year = today.getFullYear()
                                          const month = today.getMonth()
                                          const firstDay = new Date(year, month, 1).getDay()
                                          const daysInMonth = new Date(year, month + 1, 0).getDate()
                                          const dayNames = lang === 'en' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['Dim','Lun','Mar','Mer','Jeu','Ven','Sat']
                                          const eventMap = {}
                                          hcFiltered.forEach(e => { if (!e.event_date) return; const d = new Date(e.event_date); const k = d.getDate(); if (!eventMap[k]) eventMap[k] = []; eventMap[k].push(e) })
                                          const cells = dayNames.map(d => ({ type: 'header', label: d }))
                                          for (let i = 0; i < firstDay; i++) cells.push({ type: 'empty' })
                                          for (let d = 1; d <= daysInMonth; d++) cells.push({ type: 'day', day: d, events: eventMap[d] || [] })
                                          return cells.map((cell, i) => {
                                            if (cell.type === 'header') return <div key={'h'+i} className="hc-cal-day-header">{cell.label}</div>
                                            if (cell.type === 'empty') return <div key={'e'+i} className="hc-cal-day hc-cal-day-empty" />
                                            const hasCritical = cell.events.some(e => criticalEventTypes.includes(e.event_type))
                                            return (
                                              <div key={'d'+i} className={`hc-cal-day${cell.events.length ? ' hc-cal-day-has' : ''}${hasCritical ? ' hc-cal-day-critical' : ''}`}>
                                                <span className="hc-cal-day-num">{cell.day}</span>
                                                {cell.events.length > 0 && (
                                                  <div className="hc-cal-day-events">
                                                    {cell.events.slice(0, 3).map((e, ei) => (
                                                      <div key={ei} className="hc-cal-day-event" style={{background:hcColors[e.category]||'#64748b'}} title={e.title} onClick={() => setHcSelectedEvent(e)}>{hcIcons[e.event_type]||'📌'}</div>
                                                    ))}
                                                    {cell.events.length > 3 && <span className="hc-cal-day-more">+{cell.events.length - 3}</span>}
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                {/* Analytics */}
                                {hcView === 'analytics' && (
                                  <div className="hc-analytics">
                                    <div className="hc-analytics-grid">
                                      {Object.entries(hcColors).filter(([k])=>k!=='alert'&&k!=='protection'&&k!=='system'&&k!=='follow_up').map(([ck,color])=>{const ct=hcLocal.filter(e=>e.category===ck).length;if(!ct)return null;return(<div key={ck} className="hc-analytics-card" style={{borderLeftColor:color}}><div className="hc-analytics-card-top"><span className="hc-analytics-icon" style={{background:color+'20'}}>{hcIcons[Object.keys(hcIcons).find(k=>k.startsWith(ck))]||'📊'}</span><span className="hc-analytics-count">{ct}</span></div><span className="hc-analytics-label">{t('uc_category_'+ck)||ck}</span><div className="hc-analytics-bar" style={{background:color+'20'}}><div className="hc-analytics-bar-fill" style={{width:hcLocal.length?(ct/hcLocal.length*100)+'%':'0%',background:color}}/></div></div>)})}
                                      {hcLocal.filter(e=>e.category==='alert'||e.category==='protection').length>0&&<div className="hc-analytics-card" style={{borderLeftColor:'#ef4444'}}><div className="hc-analytics-card-top"><span className="hc-analytics-icon" style={{background:'rgba(239,68,68,0.12)'}}>🚨</span><span className="hc-analytics-count">{hcLocal.filter(e=>e.category==='alert'||e.category==='protection').length}</span></div><span className="hc-analytics-label">{t('hc_alert_events')||'Alertes'}</span><div className="hc-analytics-bar" style={{background:'rgba(239,68,68,0.12)'}}><div className="hc-analytics-bar-fill" style={{width:hcLocal.length?(hcLocal.filter(e=>e.category==='alert'||e.category==='protection').length/hcLocal.length*100)+'%':'0%',background:'#ef4444'}}/></div></div>}
                                    </div>
                                    <div className="hc-analytics-summary">
                                      <div className="hc-analytics-summary-item"><span>{t('hc_total_events')||'Total'}</span><strong>{hcLocal.length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_total_updates')||'Updates'}</span><strong>{hcLocal.filter(e=>e.event_type==='update_added').length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_events_today')||"Aujourd'hui"}</span><strong>{hcGrouped.today.length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_events_this_week')||'Semaine'}</span><strong>{hcGrouped.thisWeek.length}</strong></div>
                                      <div className="hc-analytics-summary-item"><span>{t('hc_events_this_month')||'Mois'}</span><strong>{hcGrouped.thisMonth.length}</strong></div>
                                    </div>
                                  </div>
                                )}

                                {/* Event Detail Drawer */}
                                {hcSelectedEvent && (
                                  <div className="hc-drawer-overlay" onClick={() => setHcSelectedEvent(null)}>
                                    <div className="hc-drawer" onClick={e => e.stopPropagation()}>
                                      <button className="hc-drawer-close" onClick={() => setHcSelectedEvent(null)}>✕</button>
                                      <div className="hc-drawer-title">{t('hc_event_detail_title')||"Détails de l'événement"}</div>
                                      <div className="hc-drawer-section">
                                        <div className="hc-drawer-section-title">{t('hc_event_info')||'Événement'}</div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_type')||'Type'}</span><span className="hc-drawer-value">{hcIcons[hcSelectedEvent.event_type]||''} {t('hc_event_'+hcSelectedEvent.event_type)||hcSelectedEvent.event_type}</span></div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('uc_category')||'Catégorie'}</span><span className="hc-drawer-value"><span className="hc-tl-badge" style={{background:hcColors[hcSelectedEvent.category]||'#64748b'}}>{t('uc_category_'+hcSelectedEvent.category)||hcSelectedEvent.category}</span></span></div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_title')||'Titre'}</span><span className="hc-drawer-value">{hcSelectedEvent.title}</span></div>
                                        {hcSelectedEvent.description&&<div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_description')||'Description'}</span><span className="hc-drawer-value">{hcSelectedEvent.description}</span></div>}
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_date')||'Date'}</span><span className="hc-drawer-value">{hcSelectedEvent.event_date?new Date(hcSelectedEvent.event_date).toLocaleDateString(lang==='en'?'en-US':'fr-FR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}</span></div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_priority')||'Priorité'}</span><span className="hc-drawer-value">{hcSelectedEvent.priority?<span className={`hc-tl-priority hc-tl-priority-${hcSelectedEvent.priority}`}>{t('hc_priority_'+hcSelectedEvent.priority)||hcSelectedEvent.priority}</span>:'—'}</span></div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_source_module')||'Module'}</span><span className="hc-drawer-value">{hcSelectedEvent.source_module?t('hc_source_'+hcSelectedEvent.source_module)||hcSelectedEvent.source_module:'—'}</span></div>
                                      </div>
                                      {(hcSelectedEvent.old_value||hcSelectedEvent.new_value)&&<div className="hc-drawer-section"><div className="hc-drawer-section-title">{t('hc_old_value')||'Valeurs'}</div>
                                        {hcSelectedEvent.old_value&&<div className="hc-drawer-row"><span className="hc-drawer-label" style={{color:'#ef4444'}}>{t('hc_old_value')||'Ancien'}</span><span className="hc-drawer-value">{hcSelectedEvent.old_value}</span></div>}
                                        {hcSelectedEvent.new_value&&<div className="hc-drawer-row"><span className="hc-drawer-label" style={{color:'#22c55e'}}>{t('hc_new_value')||'Nouveau'}</span><span className="hc-drawer-value">{hcSelectedEvent.new_value}</span></div>}
                                        {hcSelectedEvent.reason&&<div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_reason')||'Motif'}</span><span className="hc-drawer-value">{hcSelectedEvent.reason}</span></div>}
                                      </div>}
                                      <div className="hc-drawer-section"><div className="hc-drawer-section-title">{t('hc_performed_by')||'Effectué par'}</div>
                                        <div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_name')||'Nom'}</span><span className="hc-drawer-value">{hcSelectedEvent.performed_by_name||'—'}</span></div>
                                        {hcSelectedEvent.performed_role&&<div className="hc-drawer-row"><span className="hc-drawer-label">{t('form_role')||'Rôle'}</span><span className="hc-drawer-value">{hcSelectedEvent.performed_role}</span></div>}
                                        {hcSelectedEvent.department&&<div className="hc-drawer-row"><span className="hc-drawer-label">{t('hc_department')||'Département'}</span><span className="hc-drawer-value">{hcSelectedEvent.department}</span></div>}
                                      </div>
                                      {hcSelectedEvent.attachments?.length>0&&<div className="hc-drawer-section"><div className="hc-drawer-section-title">{t('hc_attachments')||'Pièces jointes'} ({hcSelectedEvent.attachments.length})</div>
                                        <div className="hc-drawer-attachments">{hcSelectedEvent.attachments.map((a,ai)=><div key={ai} className="hc-drawer-attach">📎 {a}</div>)}</div>
                                      </div>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </> : (
                      /* ── Child Selector ── */
                      <div className="hc-premium-select">
                        <div className="uc2-premium-header">
                          <span className="uc2-premium-header-label">history-center</span>
                          <div className="uc2-premium-header-icons">
                            <button className="uc2-premium-icon-btn" title={t('dash_dashboard')||'Dashboard'}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                            </button>
                            <button className="uc2-premium-icon-btn" title={t('notifications')||'Notifications'}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            </button>
                            <button className="uc2-premium-icon-btn" title={t('settings')||'Settings'}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            </button>
                            <div className="uc2-premium-avatar">
                              {user.photo ? <img src={user.photo} alt="" /> : <span>{user?.first_name?.[0]||user?.username?.[0]||'U'}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="uc2-premium-hero">
                          <div className="uc2-premium-hero-left">
                            <div className="uc2-premium-hero-icon">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div className="uc2-premium-hero-text">
                              <h1 className="uc2-premium-hero-title">{t('hc_title')||'Centre d\'Historique'}</h1>
                              <p className="uc2-premium-hero-subtitle">{t('hc_select_child')||'Sélectionnez un enfant pour voir son historique complet'}</p>
                            </div>
                          </div>
                          <div className="uc2-premium-hero-actions">
                            <button className="uc2-premium-hero-btn uc2-premium-hero-btn-primary">{t('uc_view_report')||'Voir le rapport complet'} →</button>
                            <select className="uc2-premium-hero-select" value={hcSortStatus} onChange={e => setHcSortStatus(e.target.value)}>
                              <option value="">{t('uc_sort_by_status')||'Trier par statut'}</option>
                              <option value="active">{t('uc_card_status_active')||'Actif'}</option>
                              <option value="sick">{t('child_status_sick')||'Malade'}</option>
                              <option value="hospitalized">{t('child_status_hospitalized')||'Hospitalisé'}</option>
                            </select>
                          </div>
                        </div>
                        <div className="uc2-premium-filters">
                          <div className="uc2-premium-search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input className="uc2-premium-search-input" value={hcSearch} onChange={e => setHcSearch(e.target.value)} placeholder={t('uc_search_child')||'Rechercher un enfant...'} />
                          </div>
                          <select className="uc2-premium-filter-select" value={hcGender} onChange={e => setHcGender(e.target.value)}>
                            <option value="">{t('uc_filter_gender')||'Genre'}</option>
                            <option value="all">{t('uc_gender_all')||'Tous'}</option>
                            <option value="M">{t('uc_gender_male')||'Masculin'}</option>
                            <option value="F">{t('uc_gender_female')||'Féminin'}</option>
                          </select>
                          <div className="uc2-premium-age-wrap">
                            <span className="uc2-premium-filter-label">{t('uc_filter_age')||'Âge'}</span>
                            <input type="range" className="uc2-premium-age-slider" min="0" max="18" step="1" value={hcAgeRange || '18'} onChange={e => setHcAgeRange(e.target.value === '18' ? '' : e.target.value)} />
                            <span className="uc2-premium-age-value">{hcAgeRange ? hcAgeRange + ' ' + (t('form_years')||'ans') : t('uc_age_all')||'Tous âges'}</span>
                          </div>
                          <select className="uc2-premium-filter-select" value={hcRegion} onChange={e => setHcRegion(e.target.value)}>
                            <option value="">{t('uc_filter_region')||'Région'}</option>
                            <option value="all">{t('uc_region_all')||'Toutes régions'}</option>
                            {AFRICAN_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="uc2-premium-grid">
                          {(() => {
                            let list = registeredChildren.length > 0 ? registeredChildren : []
                            if (hcSearch) list = list.filter(c => (c.prenom||'').toLowerCase().includes(hcSearch.toLowerCase()) || (c.nom||'').toLowerCase().includes(hcSearch.toLowerCase()) || (c.uid||'').toLowerCase().includes(hcSearch.toLowerCase()))
                            if (hcGender && hcGender !== 'all') list = list.filter(c => c.sexe === hcGender)
                            if (hcAgeRange) { const max = parseInt(hcAgeRange); list = list.filter(c => c.date_naissance ? Math.floor((Date.now()-new Date(c.date_naissance).getTime())/31557600000) <= max : false) }
                            if (hcRegion && hcRegion !== 'all') list = list.filter(c => c.nationalite === hcRegion)
                            if (list.length === 0) return <div className="uc2-premium-empty"><span className="uc2-premium-empty-icon">👶</span><p>{t('uc_no_results')||'Aucun enfant trouvé'}</p></div>
                            return list.map(child => {
                              const age = child.date_naissance ? Math.floor((Date.now()-new Date(child.date_naissance).getTime())/31557600000) : null
                              const photo = localStorage.getItem('cdo_child_photo_'+child.uid)
                              const lastMed = child.extra_data?.medical?.lastCheckup || null
                              const crit = ['hospitalized','missing']
                              const bc = crit.includes(child.status) ? 'rgba(239,68,68,0.3)' : child.status === 'sick' ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.25)'
                              const gc = crit.includes(child.status) ? 'rgba(239,68,68,0.06)' : child.status === 'sick' ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.04)'
                              return (
                                <div key={child.id} className="uc2-premium-card" style={{borderColor: bc, boxShadow: `0 0 24px ${gc}`}}>
                                  <div className="uc2-premium-card-top">
                                    <div className="uc2-premium-card-avatar">
                                      {photo ? <img src={photo} alt="" /> : <span className="uc2-premium-card-initial">{child.prenom?.[0]||child.nom?.[0]||'?'}</span>}
                                    </div>
                                    <div className="uc2-premium-card-info">
                                      <div className="uc2-premium-card-name">{child.prenom||''} {child.nom||''}</div>
                                      <div className="uc2-premium-card-uid">#{child.uid}</div>
                                      <div className="uc2-premium-card-meta">
                                        <span>{child.sexe === 'M' ? '♂' : child.sexe === 'F' ? '♀' : ''} {child.sexe === 'M' ? (t('form_male')||'M') : child.sexe === 'F' ? (t('form_female')||'F') : '—'}</span>
                                        <span className="uc2-premium-card-dot">·</span>
                                        <span>{age !== null ? age + ' ' + (t('form_years')||'ans') : '—'}</span>
                                      </div>
                                    </div>
                                    <span className="uc2-premium-card-status" style={{
                                      background: crit.includes(child.status) ? 'rgba(239,68,68,0.12)' : child.status === 'sick' ? 'rgba(245,158,11,0.12)' : child.status === 'active' ? 'rgba(99,102,241,0.12)' : 'rgba(100,116,139,0.12)',
                                      color: crit.includes(child.status) ? '#ef4444' : child.status === 'sick' ? '#f59e0b' : child.status === 'active' ? '#818cf8' : '#94a3b8'
                                    }}>{t('child_status_' + child.status) || child.status}</span>
                                  </div>
                                  <div className="uc2-premium-card-micro">
                                    <div className="uc2-premium-micro-item">
                                      <span className="uc2-premium-micro-label">{t('uc_health_progress')||'Suivi santé'}</span>
                                      <span className="uc2-premium-micro-bar"><span className="uc2-premium-micro-fill" style={{width: child.extra_data?.medical?.vaccinations?.length > 0 ? '70%' : '25%'}}></span></span>
                                    </div>
                                    <div className="uc2-premium-micro-item">
                                      <span className="uc2-premium-micro-label">{t('uc_last_visit')||'Dernière visite'}</span>
                                      <span className="uc2-premium-micro-value">{lastMed ? new Date(lastMed).toLocaleDateString() : '—'}</span>
                                    </div>
                                  </div>
                                  <button className="uc2-premium-card-select" onClick={() => { setHcHistoryChild(child); setHcSearch(''); setHcGender(''); setHcAgeRange(''); setHcRegion(''); setHcSortStatus(''); setHcFilterCategory(''); setHcFilterType(''); setHcFilterPriority(''); setHcFilterSource(''); setHcDateFrom(''); setHcDateTo(''); setHcStatusOnly(false); setHcEvents([]); setHcExpanded(null); setHcSelectedEvent(null); setHcView('timeline') }}>
                                    {t('uc_select_btn')||'Sélectionner'} →
                                  </button>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeKey === 'orphelinats' && role === 'federation' && subKey ? (() => {
                  const orp = orphanageRequests.find(o => String(o.id) === subKey)
                  if (!orp) return null
                  const assignMap = {}
                  orphanageAssignments.forEach(a => { assignMap[a.child] = a })
                  const DOC_API_MAP_S = { registration_cert:'registration_cert', operating_license:'operating_license', director_id:'director_id_doc', tax_doc:'tax_doc', child_protection:'child_protection' }
                  const REQ_KEYS_S = ['registration_cert','operating_license','director_id','tax_doc','child_protection']
                  const requiredDocsCount = REQ_KEYS_S.filter(k => orp[DOC_API_MAP_S[k]]).length
                  const allVerifiedDocs = requiredDocsCount > 0 && REQ_KEYS_S.filter(k => orp[DOC_API_MAP_S[k]]).every(k => docVerified[k])
                  const canApprove = requiredDocsCount === 0 || allVerifiedDocs
                  return (
                  <div>
                    <button type="button" onClick={() => { setSubKey(null); setOrpDetailTab('status') }}
                      style={{background:'rgba(255,255,255,0.05)',border:'none',borderRadius:10,color:'#94a3b8',fontSize:13,padding:'8px 16px',cursor:'pointer',marginBottom:16}}>
                      ← Retour à la liste
                    </button>
                    <div style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'24px',marginBottom:16}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                        <div>
                          <h3 style={{fontSize:22,fontWeight:700,color:'#e2e8f0',margin:0}}>🏛️ {orp.name}</h3>
                          <p style={{fontSize:13,color:'#64748b',margin:'4px 0 0'}}>Directeur: {orp.director_name || '—'}</p>
                        </div>
                        <span style={{fontSize:12,fontWeight:600,padding:'5px 14px',borderRadius:20,background:orp.status==='approved'?'rgba(34,197,94,0.1)':orp.status==='rejected'?'rgba(239,68,68,0.15)':'rgba(239,68,68,0.15)',color:orp.status==='approved'?'#22c55e':orp.status==='rejected'?'#ef4444':'#ef4444'}}>
                          {orp.status === 'approved' ? '🟢 Validé' : orp.status === 'rejected' ? '❌ Rejeté' : '🔴 En attente'}
                        </span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
                      {[{key:'status',label:'📋 Statut'},{key:'documents',label:'📄 Documents'},{key:'enfants',label:'👶 Enfants'},{key:'besoins',label:'📦 Besoins'},{key:'capacite',label:'🏠 Capacité'}].map(tab => (
                        <button type="button" key={tab.key} onClick={()=>setOrpDetailTab(tab.key)}
                          style={{border:'none',borderRadius:10,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer',background:orpDetailTab===tab.key?'linear-gradient(135deg,#3b82f6,#6366f1)':'rgba(255,255,255,0.05)',color:orpDetailTab===tab.key?'#fff':'#94a3b8',transition:'all .2s'}}>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    {orpDetailTab === 'status' && (
                      <div style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px'}}>
                        <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>Informations générales</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:13}}>
                          <div><span style={{color:'#64748b'}}>Adresse:</span><br/><span style={{color:'#cbd5e1'}}>{orp.address || '—'}</span></div>
                          <div><span style={{color:'#64748b'}}>Capacité:</span><br/><span style={{color:'#cbd5e1'}}>{orp.capacity} places</span></div>
                          <div><span style={{color:'#64748b'}}>Date de soumission:</span><br/><span style={{color:'#cbd5e1'}}>{new Date(orp.created_at).toLocaleDateString()}</span></div>
                          <div><span style={{color:'#64748b'}}>Statut:</span><br/><span style={{color:'#cbd5e1'}}>{orp.status === 'pending' ? 'En attente' : orp.status === 'approved' ? 'Validé' : 'Rejeté'}</span></div>
                        </div>
                        {orp.validation_note && (
                          <div style={{marginTop:16,padding:'12px 16px',background:'rgba(255,255,255,0.03)',borderRadius:10}}>
                            <div style={{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:4}}>Note de validation:</div>
                            <div style={{fontSize:13,color:'#cbd5e1'}}>{orp.validation_note}</div>
                          </div>
                        )}
                        {orp.status === 'pending' && (
                          <div style={{display:'flex',gap:8,marginTop:16}}>
                            <button type="button" onClick={()=>{
                              if (!canApprove) { showToast('Veuillez vérifier tous les documents requis avant d\'approuver.', 'error'); return }
                              setOrphanageNote(''); validateOrphanage(orp.id,'approve'); setSubKey(null); setOrpDetailTab('status')
                            }} style={{background:canApprove?'rgba(34,197,94,0.1)':'rgba(100,116,139,0.3)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:10,color:canApprove?'#22c55e':'#64748b',fontSize:13,fontWeight:600,padding:'10px 22px',cursor:canApprove?'pointer':'not-allowed'}}>✅ Approuver</button>
                            <button type="button" onClick={()=>{const r=prompt('Motif du rejet (optionnel):');if(r!==null){validateOrphanage(orp.id,'reject',r||'');setSubKey(null);setOrpDetailTab('status')}}} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,color:'#ef4444',fontSize:13,fontWeight:600,padding:'10px 22px',cursor:'pointer'}}>✗ Rejeter</button>
                          </div>
                        )}
                      </div>
                    )}
                    {orpDetailTab === 'documents' && (
                      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                        <div style={{flex:'1 1 400px',background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px'}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>📄 Documents soumis</div>
                          {(() => {
                            const DOC_LABELS = {
                              registration_cert:'Registration Certificate', operating_license:'Operating License',
                              director_id:'Director ID', tax_doc:'Tax Registration', child_protection:'Child Protection Policy',
                              annual_report:'Annual Report', ngo_accreditation:'NGO Accreditation', partnership_certs:'Partnership Certificates',
                            }
                              const DOC_API_MAP = { registration_cert:'registration_cert', operating_license:'operating_license', director_id:'director_id_doc', tax_doc:'tax_doc', child_protection:'child_protection', annual_report:'annual_report', ngo_accreditation:'ngo_accreditation', partnership_certs:'partnership_certs' }
                              const REQ_KEYS = ['registration_cert','operating_license','director_id','tax_doc','child_protection']
                            const OPT_KEYS = ['annual_report','ngo_accreditation','partnership_certs']
                            const allKeys = [...REQ_KEYS, ...OPT_KEYS]
                            const hasAny = allKeys.some(k => orp[DOC_API_MAP[k]])
                            if (!hasAny && !orp.document_details) {
                              return <div style={{textAlign:'center',padding:30,color:'#64748b',fontSize:14}}>Aucun document soumis.</div>
                            }
                            return (
                              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                {allKeys.map(k => {
                                  const file = orp[DOC_API_MAP[k]]
                                  const isReq = REQ_KEYS.includes(k)
                                  const verified = docVerified[k]
                                  return (
                                    <div key={k} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:verified?'rgba(34,197,94,0.06)':'rgba(255,255,255,0.03)',borderRadius:10,border:verified?'1px solid rgba(34,197,94,0.2)':'1px solid transparent'}}>
                                      <div style={{flex:1}}>
                                        <div style={{fontSize:13,fontWeight:600,color:file?'#e2e8f0':'#64748b',marginBottom:2}}>
                                          {DOC_LABELS[k]} {isReq && <span style={{fontSize:9,color:'#ef4444',fontWeight:700,background:'rgba(239,68,68,0.1)',padding:'1px 6px',borderRadius:4}}>REQUIS</span>}
                                        </div>
                                        {file ? (
                                          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:11}}>
                                            <a href={file} target="_blank" rel="noopener noreferrer" style={{color:'#60a5fa',textDecoration:'underline',cursor:'pointer'}}>📖 Ouvrir</a>
                                            <a href={file} download style={{color:'#22c55e',textDecoration:'underline',cursor:'pointer'}}>⬇ Télécharger</a>
                                          </div>
                                        ) : (
                                          <span style={{fontSize:11,color:'#64748b'}}>Non soumis</span>
                                        )}
                                      </div>
                                      {file && (
                                        <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:verified?'#22c55e':'#94a3b8',background:verified?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.05)',padding:'6px 12px',borderRadius:8,userSelect:'none'}}>
                                          <input type="checkbox" checked={verified} onChange={() => setDocVerified(p => ({...p, [k]: !p[k]}))} style={{accentColor:'#22c55e',width:16,height:16}} />
                                          {verified ? 'Vérifié' : 'Vérifier'}
                                        </label>
                                      )}
                                    </div>
                                  )
                                })}
                                {orp.document_details && (
                                  <div style={{marginTop:12,padding:'12px 14px',background:'rgba(59,130,246,0.06)',borderRadius:10,fontSize:12,color:'#cbd5e1',whiteSpace:'pre-wrap'}}>
                                    <span style={{fontWeight:600,color:'#60a5fa'}}>Détails:</span> {orp.document_details}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                        <div style={{flex:'1 1 280px',background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px',alignSelf:'flex-start'}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>✅ Vérification des documents</div>
                          {(() => {
                            const DOC_API_MAP = { registration_cert:'registration_cert', operating_license:'operating_license', director_id:'director_id_doc', tax_doc:'tax_doc', child_protection:'child_protection' }
                            const REQ_KEYS = ['registration_cert','operating_license','director_id','tax_doc','child_protection']
                            const requiredDocs = REQ_KEYS.filter(k => orp[DOC_API_MAP[k]])
                            const verifiedCount = requiredDocs.filter(k => docVerified[k]).length
                            const allVerified = requiredDocs.length > 0 && verifiedCount === requiredDocs.length
                            return (
                              <div style={{fontSize:13,color:'#94a3b8',lineHeight:2}}>
                                <p>📄 <strong style={{color:'#e2e8f0'}}>{requiredDocs.length}</strong> document(s) requis soumis</p>
                                <p>✅ <strong style={{color:'#22c55e'}}>{verifiedCount}/{requiredDocs.length}</strong> vérifié(s)</p>
                                {allVerified ? (
                                  <div style={{marginTop:12,padding:'10px 14px',background:'rgba(34,197,94,0.1)',borderRadius:10,fontSize:12,color:'#22c55e',fontWeight:600}}>
                                    🟢 Tous les documents requis sont vérifiés
                                  </div>
                                ) : requiredDocs.length > 0 && (
                                  <div style={{marginTop:12,padding:'10px 14px',background:'rgba(239,68,68,0.1)',borderRadius:10,fontSize:12,color:'#ef4444',fontWeight:600}}>
                                    🔴 Veuillez vérifier tous les documents requis
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                    {orpDetailTab === 'enfants' && (
                      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                        <div style={{flex:'1 1 380px',background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px',maxHeight:560,overflowY:'auto'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                            <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0'}}>Enfants ({orphanageChildren.length})</div>
                            <div style={{fontSize:12,fontWeight:600,color:'#22c55e',background:'rgba(34,197,94,0.1)',padding:'4px 10px',borderRadius:20}}>
                              {Object.values(assignMap).length} assigné(s)
                            </div>
                          </div>
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:14,padding:'10px 12px',background:'rgba(99,102,241,0.08)',borderRadius:10}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            <select value={ambSearchQuery} onChange={e=>setAmbSearchQuery(e.target.value)} style={{flex:1,background:'transparent',border:'none',color:'#e2e8f0',fontSize:13,outline:'none',cursor:'pointer'}}>
                              <option value="" style={{background:'#1e293b',color:'#94a3b8'}}>Tous les ambassadeurs</option>
                              {ambassadorsList.filter(a=>a.is_active).map(a => (
                                <option key={a.id} value={a.id} style={{background:'#1e293b',color:'#e2e8f0'}}>{a.full_name || `${a.first_name} ${a.last_name}`}</option>
                              ))}
                            </select>
                            {ambSearchQuery && <button type="button" onClick={()=>setAmbSearchQuery('')} style={{background:'none',border:'none',color:'#64748b',fontSize:13,cursor:'pointer',padding:0}}>✕</button>}
                          </div>
                          {loadingOrpDetails ? (
                            <div style={{textAlign:'center',padding:30,color:'#64748b'}}>Chargement...</div>
                          ) : orphanageChildren.length === 0 ? (
                            <div style={{textAlign:'center',padding:30,color:'#64748b',fontSize:14}}>Aucun enfant dans cet orphelinat.</div>
                          ) : (
                            (() => {
                              const ambId = ambSearchQuery
                              const filtered = ambId
                                ? orphanageChildren.filter(c => {
                                    const a = assignMap[c.id]
                                    return a && String(a.ambassador) === ambId
                                  })
                                : orphanageChildren
                              if (filtered.length === 0) {
                                return <div style={{textAlign:'center',padding:30,color:'#64748b',fontSize:13}}>{ambId ? 'Aucun enfant assigné à cet ambassadeur.' : 'Aucun enfant trouvé.'}</div>
                              }
                              return filtered.map(c => {
                                const assignment = assignMap[c.id]
                                return (
                                  <div key={c.id} style={{background:assignment?'rgba(34,197,94,0.04)':'rgba(255,255,255,0.03)',borderRadius:12,padding:'10px 12px',marginBottom:8,border:assignment?'1px solid rgba(34,197,94,0.15)':'none'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                                      <div style={{flex:1}}>
                                        <div style={{fontSize:13,fontWeight:600,color:assignment?'#22c55e':'#e2e8f0'}}>{c.child_name || `${c.prenom} ${c.nom}`}</div>
                                        <div style={{fontSize:11,color:'#64748b',marginTop:1}}>
                                          {c.age ? `${c.age} ans` : ''} {c.sexe === 'M' ? '♂' : '♀'} {c.nationalite ? `• ${c.nationalite}` : ''}
                                        </div>
                                      </div>
                                      {assignment ? (
                                        <span style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:20,background:'rgba(34,197,94,0.1)',color:'#22c55e',whiteSpace:'nowrap'}}>Assigné</span>
                                      ) : (
                                        <span style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:20,background:'rgba(100,116,139,0.1)',color:'#64748b',whiteSpace:'nowrap'}}>Libre</span>
                                      )}
                                    </div>
                                    {assignment && (
                                      <div style={{marginTop:4,marginLeft:0,padding:'4px 8px',background:'rgba(99,102,241,0.08)',borderRadius:6,fontSize:11,color:'#818cf8'}}>
                                        Ambassadeur: {assignment.ambassador_name}
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            })()
                          )}
                        </div>
                        <div style={{flex:'1 1 300px',background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px',maxHeight:560,overflowY:'auto'}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>📋 Résumé des assignations</div>
                          <div style={{fontSize:13,color:'#94a3b8',lineHeight:1.8}}>
                            <p>👶 <strong style={{color:'#e2e8f0'}}>{orphanageChildren.length}</strong> enfant(s) dans cet orphelinat</p>
                            <p>✅ <strong style={{color:'#22c55e'}}>{Object.values(assignMap).length}</strong> assigné(s) à un ambassadeur</p>
                            <p>⬜ <strong style={{color:'#64748b'}}>{orphanageChildren.length - Object.values(assignMap).length}</strong> libre(s)</p>
                          </div>
                          {Object.values(assignMap).length > 0 && (
                            <div style={{marginTop:16}}>
                              <div style={{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:8}}>Ambassadeurs actifs</div>
                              {(() => {
                                const ambMap = {}
                                Object.values(assignMap).forEach(a => {
                                  const name = a.ambassador_name || 'Inconnu'
                                  ambMap[name] = (ambMap[name] || 0) + 1
                                })
                                return Object.entries(ambMap).map(([name, count]) => (
                                  <div key={name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:'rgba(99,102,241,0.06)',borderRadius:8,marginBottom:4}}>
                                    <span style={{fontSize:12,color:'#818cf8'}}>{name}</span>
                                    <span style={{fontSize:12,fontWeight:600,color:'#22c55e'}}>{count} enfant(s)</span>
                                  </div>
                                ))
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {orpDetailTab === 'besoins' && (
                      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                        <div style={{flex:'1 1 380px',background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px'}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>📦 Besoins soumis</div>
                          {(() => {
                            const needsList = Array.isArray(orp.needs) ? orp.needs : []
                            const icons = { 'Food':'🍚','Clean Water':'💧','Clothing':'👕','School Supplies':'📚','Medicine':'💊','Beds':'🛏️','Electricity':'⚡','Internet':'🌐','Infrastructure':'🏗️','Transportation':'🚌','Sponsorship Programs':'🤝' }
                            if (needsList.length === 0 && !orp.needs_description) {
                              return <div style={{textAlign:'center',padding:30,color:'#64748b',fontSize:14}}>Aucun besoin soumis par l'orphelinat.</div>
                            }
                            return (
                              <>
                                {needsList.length > 0 && (
                                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
                                    {needsList.map(n => (
                                      <span key={n} style={{padding:'6px 12px',background:'rgba(239,68,68,0.1)',borderRadius:20,fontSize:12,fontWeight:600,color:'#f59e0b'}}>
                                        {icons[n] || '📌'} {n}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {orp.needs_priority && (
                                  <div style={{marginBottom:12,padding:'10px 14px',background:'rgba(99,102,241,0.06)',borderRadius:10,fontSize:13}}>
                                    <span style={{color:'#64748b'}}>Priorité: </span>
                                    <span style={{fontWeight:600,color:{low:'#22c55e',medium:'#f59e0b',high:'#f97316',critical:'#ef4444'}[orp.needs_priority] || '#94a3b8'}}>
                                      {orp.needs_priority === 'low' ? '🟢 Faible' : orp.needs_priority === 'medium' ? '🟡 Moyenne' : orp.needs_priority === 'high' ? '🟠 Haute' : orp.needs_priority === 'critical' ? '🔴 Critique' : orp.needs_priority}
                                    </span>
                                  </div>
                                )}
                                {orp.needs_description && (
                                  <div style={{padding:'14px 16px',background:'rgba(255,255,255,0.03)',borderRadius:10,fontSize:13,color:'#cbd5e1',lineHeight:1.6,whiteSpace:'pre-wrap'}}>
                                    {orp.needs_description}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                        <div style={{flex:'1 1 280px',background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px',alignSelf:'flex-start'}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>📋 Résumé</div>
                          <div style={{fontSize:13,color:'#94a3b8',lineHeight:2}}>
                            <p>📌 <strong style={{color:'#e2e8f0'}}>{(Array.isArray(orp.needs) ? orp.needs.length : 0)}</strong> besoin(s) identifié(s)</p>
                            <p>🎯 <strong style={{color:'#e2e8f0'}}>{(Array.isArray(orp.needs) && orp.needs_priority) ? orp.needs_priority : 'Non spécifiée'}</strong> — priorité</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {orpDetailTab === 'capacite' && (
                      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                        <div style={{flex:'1 1 380px',background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px'}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:16}}>🏠 Capacité d'accueil</div>
                          <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:20}}>
                            <div style={{flex:'1',minWidth:140,background:'rgba(59,130,246,0.08)',borderRadius:12,padding:'16px',textAlign:'center'}}>
                              <div style={{fontSize:28,fontWeight:700,color:'#3b82f6'}}>{orp.capacity || 0}</div>
                              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>Capacité totale</div>
                            </div>
                            <div style={{flex:'1',minWidth:140,background:'rgba(34,197,94,0.08)',borderRadius:12,padding:'16px',textAlign:'center'}}>
                              <div style={{fontSize:28,fontWeight:700,color:orphanageChildren.length <= (orp.capacity||0) ? '#22c55e' : '#ef4444'}}>{orphanageChildren.length}</div>
                              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>Enfants enregistrés</div>
                            </div>
                            <div style={{flex:'1',minWidth:140,background:'rgba(245,158,11,0.08)',borderRadius:12,padding:'16px',textAlign:'center'}}>
                              <div style={{fontSize:28,fontWeight:700,color:orphanageChildren.length < (orp.capacity||0) ? '#22c55e' : '#ef4444'}}>
                                {Math.max(0, (orp.capacity||0) - orphanageChildren.length)}
                              </div>
                              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>Places disponibles</div>
                            </div>
                          </div>
                          <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>Répartition des enfants</div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                            {[
                              {label:'Garçons',value:orp.boys,icon:'♂️',color:'#3b82f6'},
                              {label:'Filles',value:orp.girls,icon:'♀️',color:'#ec4899'},
                              {label:'0-5 ans',value:orp.infants_0_5,icon:'👶',color:'#f59e0b'},
                              {label:'6-12 ans',value:orp.children_6_12,icon:'🧒',color:'#22c55e'},
                              {label:'Enfants handicapés',value:orp.children_disabled,icon:'♿',color:'#a855f7'},
                            ].map(d => (
                              <div key={d.label} style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'12px',textAlign:'center'}}>
                                <div style={{fontSize:20,fontWeight:700,color:d.color}}>{d.value ?? '—'}</div>
                                <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{d.icon} {d.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{flex:'1 1 280px',background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px',alignSelf:'flex-start'}}>
                          <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0',marginBottom:12}}>👥 Personnel</div>
                          {(() => {
                            const staff = [
                              {label:'Permanent',key:'staff_permanent',icon:'🏢'},
                              {label:'Bénévoles',key:'staff_volunteers',icon:'🙋'},
                              {label:'Soignants',key:'staff_caregivers',icon:'🤱'},
                              {label:'Enseignants',key:'staff_teachers',icon:'👩‍🏫'},
                            ]
                            const total = staff.reduce((s,f) => s + Number(orp[f.key]||0), 0)
                            return (
                              <>
                                {staff.map(f => (
                                  <div key={f.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'rgba(255,255,255,0.03)',borderRadius:8,marginBottom:6}}>
                                    <span style={{fontSize:12,color:'#94a3b8'}}>{f.icon} {f.label}</span>
                                    <span style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{orp[f.key] || 0}</span>
                                  </div>
                                ))}
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 10px',background:'rgba(245,158,11,0.1)',borderRadius:8,marginTop:8}}>
                                  <span style={{fontSize:13,fontWeight:600,color:'#f59e0b'}}>👥 Total personnel</span>
                                  <span style={{fontSize:16,fontWeight:700,color:'#f59e0b'}}>{total}</span>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  )
                })()
                : activeKey === 'orphelinats' && role === 'federation' ? (() => {
                  const pending = orphanageRequests.filter(o => o.status === 'pending')
                  const processed = orphanageRequests.filter(o => ['approved','rejected'].includes(o.status))
                  return (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                      <div>
                        <h3 style={{fontSize:20,fontWeight:700,color:'#e2e8f0',margin:0}}>🏛️ Gestion des Orphelinats</h3>
                        <p style={{fontSize:13,color:'#64748b',margin:'4px 0 0'}}>{orphanageRequests.length} orphelinat{(orphanageRequests.length>1)?'s':''}</p>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,marginBottom:20}}>
                      <button type="button" onClick={()=>setFedTab('pending')} style={{border:'none',borderRadius:10,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer',background:fedTab==='pending'?'linear-gradient(135deg,#f59e0b,#f97316)':'rgba(255,255,255,0.05)',color:fedTab==='pending'?'#fff':'#94a3b8',transition:'all .2s'}}>📥 En attente ({pending.length})</button>
                      <button type="button" onClick={()=>setFedTab('processed')} style={{border:'none',borderRadius:10,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer',background:fedTab==='processed'?'linear-gradient(135deg,#22c55e,#16a34a)':'rgba(255,255,255,0.05)',color:fedTab==='processed'?'#fff':'#94a3b8',transition:'all .2s'}}>✅ Traités ({processed.length})</button>
                    </div>
                    {fedTab === 'pending' && (
                      pending.length === 0 ? (
                        <div style={{textAlign:'center',padding:40,color:'#64748b',fontSize:14}}>Aucune nouvelle soumission en attente.</div>
                      ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:12}}>
                          {pending.map(o => (
                            <div key={o.id} style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                                <div>
                                  <button type="button" onClick={()=>setSubKey(String(o.id))} style={{background:'none',border:'none',padding:0,cursor:'pointer',textAlign:'left',marginBottom:2}}>
                                    <span style={{fontSize:16,fontWeight:700,color:'#60a5fa',textDecoration:'underline',textUnderlineOffset:3}}>{o.name}</span>
                                  </button>
                                  <div style={{fontSize:12,color:'#64748b'}}>Directeur: {o.director_name || '—'}</div>
                                </div>
                                <span style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,background:'rgba(239,68,68,0.15)',color:'#ef4444'}}>🔴 En attente de validation</span>
                              </div>
                              <div style={{display:'flex',gap:8,marginTop:12}}>
                                <button type="button" onClick={()=>{setOrphanageNote('');validateOrphanage(o.id,'approve')}} style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:10,color:'#22c55e',fontSize:12,fontWeight:600,padding:'8px 18px',cursor:'pointer'}}>✅ Approuver</button>
                                <button type="button" onClick={()=>{const r=prompt('Motif du rejet (optionnel):');validateOrphanage(o.id,'reject',r||'')}} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,color:'#ef4444',fontSize:12,fontWeight:600,padding:'8px 18px',cursor:'pointer'}}>✗ Rejeter</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                    {fedTab === 'processed' && (
                      processed.length === 0 ? (
                        <div style={{textAlign:'center',padding:40,color:'#64748b',fontSize:14}}>Aucun orphelinat traité pour le moment.</div>
                      ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:12}}>
                          {processed.map(o => (
                            <div key={o.id} style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                                <div>
                                  <button type="button" onClick={()=>setSubKey(String(o.id))} style={{background:'none',border:'none',padding:0,cursor:'pointer',textAlign:'left',marginBottom:2}}>
                                    <span style={{fontSize:16,fontWeight:700,color:'#60a5fa',textDecoration:'underline',textUnderlineOffset:3}}>{o.name}</span>
                                  </button>
                                  <div style={{fontSize:12,color:'#64748b'}}>Directeur: {o.director_name || '—'}</div>
                                </div>
                                <span style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,background:o.status==='approved'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.15)',color:o.status==='approved'?'#22c55e':'#ef4444'}}>
                                  {o.status === 'approved' ? '🟢 Validé' : '❌ Rejeté'}
                                </span>
                              </div>
                              {o.validation_note && (
                                <div style={{marginTop:8,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:10}}>
                                  <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:2}}>Note:</div>
                                  <div style={{fontSize:12,color:'#cbd5e1'}}>{o.validation_note}</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                  )})()
                : activeKey === 'ambassadeurs' && (role === 'federation' || role === 'supermaster') ? (() => {
                  if (subKey) {
                    const goBack = () => setSubKey(null)
                    const ambUsers = ambassadorsList
                    const approvedOrps = orphanageRequests.filter(o => o.status === 'approved')
                    const subViews = {
                      'Ambassadeurs actifs': {
                        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                        color: '#22c55e', desc: 'Tous les ambassadeurs enregistrés dans le système.',
                        content: ambUsers.length === 0
                          ? <div style={{textAlign:'center',padding:40,color:'#64748b',fontSize:14}}>Aucun ambassadeur enregistré.</div>
                          : ambUsers.map(a => (
                              <div key={a.id} style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'18px 20px',display:'flex',alignItems:'center',gap:14,marginBottom:10}}>
                                <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>{(a.full_name||a.first_name||'?')[0]?.toUpperCase()}</div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0'}}>{a.full_name || `${a.first_name} ${a.last_name}`}</div>
                                  <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{a.email} {a.country ? `• ${a.country}` : ''}</div>
                                </div>
                                  <span style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,background:a.is_active?'rgba(34,197,94,0.1)':'rgba(100,116,139,0.1)',color:a.is_active?'#22c55e':'#64748b'}}>{a.is_active ? '🟢 Actif' : '⚪ Inactif'}</span>
                              </div>
                            )),
                      },
                      'Orphelinats validés': {
                        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
                        color: '#3b82f6', desc: 'Orphelinats validés par la fédération.',
                        content: approvedOrps.length === 0
                          ? <div style={{textAlign:'center',padding:40,color:'#64748b',fontSize:14}}>Aucun orphelinat validé pour le moment.</div>
                          : approvedOrps.map(o => (
                              <div key={o.id} style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'18px 20px',marginBottom:10}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                                  <div>
                                    <div style={{fontSize:15,fontWeight:700,color:'#e2e8f0'}}>{o.name}</div>
                                    <div style={{fontSize:12,color:'#64748b',marginTop:2}}>Directeur: {o.director_name || '—'}</div>
                                  </div>
                                  <span style={{fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20,background:'rgba(34,197,94,0.1)',color:'#22c55e'}}>🟢 Validé</span>
                                </div>
                                <div style={{fontSize:12,color:'#64748b'}}>Validé le {o.validated_at ? new Date(o.validated_at).toLocaleDateString('fr-FR') : '—'}</div>
                              </div>
                            )),
                      },
                      'Assignation des enfants': {
                        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
                        color: '#a855f7', desc: 'Assigner des enfants à un ambassadeur.',
                        content: (
                          <div>
                            {fedLoadingData && <div className="dash-dash-empty">Chargement...</div>}
                            {!fedLoadingData && (
                              <ChildAssignmentForm
                                API={API}
                                ambassadors={ambUsers.filter(a => a.is_active)}
                                children={fedAllChildren}
                                assignments={fedAllAssignments}
                                setUnassignConfirm={setUnassignConfirm}
                                onAssigned={() => {
                                  const token = localStorage.getItem('access_token')
                                  Promise.all([
                                    fetch(`${API}/enfants/`, { headers: { Authorization: `Bearer ${token}` } }),
                                    fetch(`${API}/assignments/`, { headers: { Authorization: `Bearer ${token}` } })
                                  ]).then(async ([cRes, aRes]) => {
                                    if (cRes.ok) setFedAllChildren(await cRes.json())
          if (aRes.ok) setFedAllAssignments(await aRes.json())
                                  }).catch(() => {})
                                }}
                              />
                            )}
                          </div>
                        ),
                      },
                    }
                    const sv = subViews[subKey]
                    return (
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                          <button type="button" onClick={goBack} style={{background:'rgba(255,255,255,0.05)',border:'none',borderRadius:10,color:'#94a3b8',fontSize:13,padding:'8px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                            Retour
                          </button>
                          <div style={{width:36,height:36,borderRadius:10,background:sv?`${sv.color}15`:0,display:'flex',alignItems:'center',justifyContent:'center',color:sv?.color,flexShrink:0}}>{sv?.icon}</div>
                          <div>
                            <h3 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',margin:0}}>{subKey}</h3>
                            <p style={{fontSize:12,color:'#64748b',margin:'2px 0 0'}}>{sv?.desc}</p>
                          </div>
                        </div>
                        {sv?.content}
                      </div>
                    )
                  }
                  const ambActiveCount = ambassadorsList.length
                  const approvedCount = orphanageRequests.filter(o => o.status === 'approved').length
                  const ambCards = [
                    { id:'A1', label:'Ambassadeurs actifs', value: String(ambActiveCount), status:'Enregistrés', dotColor:'#22c55e', iconColor:'#22c55e', iconBg:'rgba(34,197,94,0.12)',
                      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                    { id:'A2', label:'Orphelinats validés', value: String(approvedCount), status: 'Validés', dotColor:'#3b82f6', iconColor:'#3b82f6', iconBg:'rgba(59,130,246,0.12)',
                      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
                    { id:'A3', label:'Assignation des enfants', value: '—', status: 'Gérer', dotColor:'#a855f7', iconColor:'#a855f7', iconBg:'rgba(168,85,247,0.12)',
                      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
                  ]
                  return (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                      {ambCards.map((c,i) => (
                        <button key={i} className="dash-amb-card" onClick={() => { setSubKey(c.label); window.scrollTo({top:0,behavior:'smooth'}) }}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                            <span style={{fontSize:12,color:'#94A3B8',fontWeight:500,letterSpacing:'0.3px',textTransform:'uppercase'}}>{c.label}</span>
                            <div style={{width:40,height:40,borderRadius:10,background:c.iconBg,display:'flex',alignItems:'center',justifyContent:'center',color:c.iconColor,flexShrink:0}}>
                              {c.svg}
                            </div>
                          </div>
                          <div style={{fontSize:36,fontWeight:700,color:'#fff',lineHeight:1,marginBottom:14}}>{c.value}</div>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{width:8,height:8,borderRadius:'50%',background:c.dotColor,flexShrink:0}} />
                            <span style={{fontSize:11,color:'#64748b',fontWeight:500}}>{c.status}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })()
                : role === 'ambassador' && activeKey === 'multiOrphelinats' ? (() => {
                  return (
                    <div className="dash-sub-form">
                      <div className="dash-validation-head">
                        <p className="dash-page-subtitle">Enfants assignés par la fédération, regroupés par orphelinat.</p>
                        <button className="dash-form-save" disabled={ambLoading}>Actualiser</button>
                      </div>
                      {ambLoading && <div className="dash-dash-empty">Chargement...</div>}
                      {!ambLoading && Object.keys(ambAssignments).length === 0 && (
                        <div className="dash-dash-empty">Aucun enfant assigné pour le moment.</div>
                      )}
                      {Object.entries(ambAssignments).map(([orpName, children]) => (
                        <div key={orpName} style={{marginBottom:20}}>
                          <h3 style={{fontSize:16,fontWeight:700,color:'#f59e0b',margin:'0 0 10px',display:'flex',alignItems:'center',gap:8}}>
                            🏛️ {orpName}
                          </h3>
                          <div style={{display:'flex',flexDirection:'column',gap:8}}>
                            {children.map(a => (
                              <div key={a.id} style={{background:'rgba(30,41,59,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#2563eb)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>
                                  {(a.child_name||'?')[0]?.toUpperCase()}
                                </div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:14,fontWeight:600,color:'#e2e8f0'}}>{a.child_name}</div>
                                  <div style={{fontSize:12,color:'#64748b'}}>UID: {a.child_uid} • Assigné le {new Date(a.assigned_at).toLocaleDateString('fr-FR')}</div>
                                </div>
                                {a.note && <div style={{fontSize:11,color:'#94a3b8',maxWidth:200}}>📝 {a.note}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()
                : activeKey === 'communication' ? (() => {
                  const token = localStorage.getItem('access_token')
                  const myId = user?.id

                  const avatarColor = (str) => {
                    let h = 0
                    for (let i = 0; i < (str || '').length; i++) h = (h * 37 + str.charCodeAt(i)) % 360
                    return `hsl(${h},50%,45%)`
                  }

                  const msgTimeAgo = (iso) => {
                    if (!iso) return ''
                    const diff = (Date.now() - new Date(iso)) / 1000
                    if (diff < 60) return "à l'instant"
                    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
                    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
                    const d = new Date(iso)
                    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
                  }

                  const otherParticipant = (conv) =>
                    (conv.participants || []).find(p => p.id !== myId) || conv.participants?.[0] || { full_name: '?', initials: '?' }

                  const loadConvMessages = async (conv) => {
                    setMsgActiveConv(conv)
                    setMsgMessages([])
                    const res = await fetch(`${API}/conversations/${conv.id}/messages/`, { headers: { Authorization: `Bearer ${token}` } })
                    if (res.status === 401) { onLogout(); return }
                    if (res.ok) {
                      const data = await res.json()
                      setMsgMessages(data)
                    }
                    // mark read
                    fetch(`${API}/conversations/${conv.id}/read/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
                    setMsgConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
                  }

                  const sendMessage = async () => {
                    const text = msgInput.trim()
                    if (!text || msgSending || !msgActiveConv) return
                    setMsgSending(true)
                    const optimistic = { id: `tmp-${Date.now()}`, conversation: msgActiveConv.id, sender: { id: myId, full_name: user?.first_name || 'Vous', initials: ((user?.first_name||'')[0]+(user?.last_name||'')[0]).toUpperCase()||'?' }, content: text, is_read: false, created_at: new Date().toISOString(), _optimistic: true }
                    setMsgMessages(prev => [...prev, optimistic])
                    setMsgInput('')
                    const res = await fetch(`${API}/conversations/${msgActiveConv.id}/messages/`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ content: text }),
                    })
                    setMsgSending(false)
                    if (res.status === 401) { onLogout(); return }
                    if (res.ok) {
                      const created = await res.json()
                      setMsgMessages(prev => prev.map(m => m._optimistic ? created : m))
                      setMsgConversations(prev => {
                        const updated = prev.map(c => c.id === msgActiveConv.id ? { ...c, last_message: { content: created.content, created_at: created.created_at, sender_id: myId }, updated_at: created.created_at } : c)
                        return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                      })
                    } else {
                      setMsgMessages(prev => prev.filter(m => !m._optimistic))
                    }
                  }

                  const startConversation = async (chatUserId) => {
                    const res = await fetch(`${API}/conversations/`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ participant_id: chatUserId }),
                    })
                    if (res.status === 401) { onLogout(); return }
                    if (res.ok || res.status === 201 || res.status === 200) {
                      const conv = await res.json()
                      setMsgConversations(prev => {
                        const exists = prev.find(c => c.id === conv.id)
                        if (exists) return prev
                        return [conv, ...prev]
                      })
                      setMsgNewConv(false)
                      setMsgUserSearch('')
                      loadConvMessages(conv)
                    }
                  }

                  const filteredUsers = msgChatUsers.filter(u =>
                    u.full_name.toLowerCase().includes(msgUserSearch.toLowerCase())
                  )

                  return (
                    <div className="msg-root">
                      {/* LEFT SIDEBAR */}
                      <div className="msg-sidebar">
                        <div className="msg-header">
                          <h2>Messages</h2>
                          <button className="msg-new-btn" onClick={() => setMsgNewConv(v => !v)} title="Nouvelle conversation">
                            {msgNewConv ? '×' : '+'}
                          </button>
                        </div>

                        {msgNewConv && (
                          <div className="msg-new-conv-panel">
                            <input
                              placeholder="Rechercher un utilisateur…"
                              value={msgUserSearch}
                              onChange={e => setMsgUserSearch(e.target.value)}
                              autoFocus
                            />
                            <div className="msg-user-pick-list">
                              {filteredUsers.length === 0 && <div style={{ padding: '8px', color: '#94A3B8', fontSize: '13px' }}>Aucun utilisateur trouvé</div>}
                              {filteredUsers.map(u => (
                                <div key={u.id} className="msg-user-pick-item" onClick={() => startConversation(u.id)}>
                                  <div className="msg-avatar" style={{ width: 32, height: 32, fontSize: 12, background: avatarColor(u.full_name) }}>{u.initials}</div>
                                  <span style={{ fontSize: '14px', color: '#0F172A' }}>{u.full_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="msg-conv-list">
                          {msgLoading
                            ? [1,2,3].map(i => (
                                <div key={i} className="msg-conv-item" style={{ pointerEvents:'none' }}>
                                  <div className="msg-avatar" style={{ background: 'var(--border-card)' }} />
                                  <div className="msg-conv-info">
                                    <div className="skel-line" style={{ width: '60%', marginBottom: 6 }} />
                                    <div className="skel-line" style={{ width: '80%' }} />
                                  </div>
                                </div>
                              ))
                            : msgConversations.length === 0
                              ? <EmptyState icon="💬" title="Aucune conversation" sub="Commencez une nouvelle conversation." />
                              : msgConversations.map(conv => {
                                  const other = otherParticipant(conv)
                                  const isActive = msgActiveConv?.id === conv.id
                                  const hasUnread = conv.unread_count > 0
                                  return (
                                    <div key={conv.id} className={`msg-conv-item${isActive ? ' active' : ''}`} onClick={() => loadConvMessages(conv)}>
                                      <div className="msg-avatar" style={{ background: avatarColor(other.full_name) }}>{other.initials}</div>
                                      <div className="msg-conv-info">
                                        <div className={`msg-conv-name${hasUnread ? ' unread' : ''}`}>{other.full_name}</div>
                                        <div className="msg-conv-preview">{conv.last_message?.content?.slice(0, 40) || 'Aucun message'}</div>
                                      </div>
                                      <div className="msg-conv-meta">
                                        <span className="msg-conv-time">{msgTimeAgo(conv.last_message?.created_at || conv.updated_at)}</span>
                                        {hasUnread && <span className="msg-unread-badge">{conv.unread_count}</span>}
                                      </div>
                                    </div>
                                  )
                                })
                          }
                        </div>
                      </div>

                      {/* RIGHT THREAD */}
                      <div className="msg-thread">
                        {!msgActiveConv ? (
                          <div className="msg-empty-thread">Sélectionnez une conversation pour commencer</div>
                        ) : (
                          <>
                            <div className="msg-thread-header">
                              <div className="msg-avatar" style={{ width: 36, height: 36, fontSize: 13, background: avatarColor(otherParticipant(msgActiveConv).full_name) }}>
                                {otherParticipant(msgActiveConv).initials}
                              </div>
                              <div className="msg-conv-name">{otherParticipant(msgActiveConv).full_name}</div>
                            </div>

                            <div className="msg-messages">
                              {msgMessages.map((m, i) => {
                                const isMine = m.sender?.id === myId
                                return (
                                  <div key={m.id || i} className={`msg-bubble-row${isMine ? ' mine' : ''}`}>
                                    {!isMine && (
                                      <div className="msg-avatar" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0, background: avatarColor(m.sender?.full_name || '') }}>
                                        {m.sender?.initials}
                                      </div>
                                    )}
                                    <div>
                                      <div className={`msg-bubble${isMine ? ' mine' : ' theirs'}`} style={m._optimistic ? { opacity: 0.7 } : {}}>
                                        {m.content}
                                      </div>
                                      <div className="msg-bubble-time">{msgTimeAgo(m.created_at)}</div>
                                    </div>
                                  </div>
                                )
                              })}
                              <div ref={messagesEndRef} />
                            </div>

                            <div className="msg-compose">
                              <textarea
                                rows={1}
                                placeholder="Écrire un message…"
                                value={msgInput}
                                onChange={e => setMsgInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                                style={{ overflowY: 'auto' }}
                              />
                              <button className="msg-send-btn" onClick={sendMessage} disabled={!msgInput.trim() || msgSending} title="Envoyer">
                                ➤
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })()
                : activeKey === 'rapports' ? (() => {
                  const rptStatCards = liveStats || statCards
                  return (
                    <div className="rpt-root">
                      <div className="rpt-header">
                        <h2>Rapports &amp; Statistiques</h2>
                        <span className="rpt-subtitle">Données en temps réel</span>
                      </div>
                      {!liveCharts ? (
                        <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>Chargement des statistiques…</div>
                      ) : (
                        <div className="rpt-grid">
                          <div className="rpt-card">
                            <div className="rpt-card-title">Dons mensuels (6 derniers mois)</div>
                            <BarChart data={liveCharts.donations_monthly} valueKey="total" labelKey="month" color="#6366F1" unit="$" />
                          </div>
                          <div className="rpt-card">
                            <div className="rpt-card-title">Enfants par genre</div>
                            <DonutChart data={[
                              { label: 'Garçons', value: liveCharts.children_gender.M, color: '#3b82f6' },
                              { label: 'Filles', value: liveCharts.children_gender.F, color: '#f472b6' },
                            ]} />
                          </div>
                          <div className="rpt-card">
                            <div className="rpt-card-title">Parrainages par statut</div>
                            <BarChart data={[
                              { label: 'Actifs', total: liveCharts.sponsorships_status.active },
                              { label: 'Suspendus', total: liveCharts.sponsorships_status.paused },
                              { label: 'Annulés', total: liveCharts.sponsorships_status.cancelled },
                            ]} valueKey="total" labelKey="label" color="#22c55e" />
                          </div>
                          <div className="rpt-card rpt-kpi-summary">
                            <div className="rpt-card-title">Indicateurs clés</div>
                            {rptStatCards.map((kpi, i) => (
                              <div key={i} className="rpt-kpi-row">
                                <span className="rpt-kpi-label">{kpi.label}</span>
                                <span className="rpt-kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
                                <span className="rpt-kpi-sub">{kpi.sub}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
                : activeKey === 'dons' ? (() => {
                  const token = localStorage.getItem('access_token')
                  const canCreate = ['sponsor', 'partner', 'ambassador'].includes(role)

                  const submitDonation = async (e) => {
                    e.preventDefault()
                    setDonationFormError('')
                    if (!donationForm.amount || isNaN(Number(donationForm.amount)) || Number(donationForm.amount) <= 0 || !donationForm.orphanage) {
                      setDonationFormError('Montant valide et orphelinat requis.')
                      return
                    }
                    setDonationSubmitting(true)
                    try {
                      const res = await fetch(`${API}/dons/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(donationForm),
                      })
                      if (res.status === 401) { onLogout(); return }
                      if (res.ok) {
                        const created = await res.json()
                        setDonations(prev => [created, ...prev])
                        setDonationForm({ donation_type: 'financier', amount: '', currency: 'USD', orphanage: '' })
                        toast('Don enregistré avec succès.', 'success')
                      } else {
                        const err = await res.json().catch(() => ({}))
                        toast(err.detail || "Erreur lors de l'enregistrement.", 'error')
                      }
                    } finally {
                      setDonationSubmitting(false)
                    }
                  }

                  return (
                    <div className="dash-section">
                      <div className="dash-section-header">
                        <span className="dash-section-title">Dons</span>
                        <span className="dash-section-sub">Suivi des contributions</span>
                      </div>

                      {canCreate && (
                        <div className="dash-card" style={{ marginBottom: 24 }}>
                          <div className="dash-card-title" style={{ marginBottom: 12 }}>Enregistrer un don</div>
                          {donationFormError && <div className="dash-error">{donationFormError}</div>}
                          <form onSubmit={submitDonation} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            <select value={donationForm.donation_type} onChange={e => setDonationForm(f => ({ ...f, donation_type: e.target.value }))} className="dash-input" style={{ flex: '1 1 140px' }}>
                              <option value="financier">Financier</option>
                              <option value="materiel">Matériel</option>
                              <option value="service">Service</option>
                            </select>
                            <input type="number" min="0" step="0.01" placeholder="Montant" value={donationForm.amount} onChange={e => setDonationForm(f => ({ ...f, amount: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
                            <select value={donationForm.currency} onChange={e => setDonationForm(f => ({ ...f, currency: e.target.value }))} className="dash-input" style={{ flex: '0 0 90px' }}>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="CDF">CDF</option>
                              <option value="XAF">XAF</option>
                            </select>
                            <input type="number" placeholder="ID Orphelinat" value={donationForm.orphanage} onChange={e => setDonationForm(f => ({ ...f, orphanage: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={donationSubmitting}>{donationSubmitting && <span className="btn-spinner" />}Enregistrer</button>
                          </form>
                        </div>
                      )}

                      {donationsLoading ? (
                        <div className="dash-empty">Chargement...</div>
                      ) : donations.length === 0 ? (
                        <EmptyState icon="💝" title="Aucun don enregistré" sub="Les dons apparaîtront ici une fois soumis." />
                      ) : (
                        <div className="dash-table-wrap">
                          <table className="dash-table">
                            <thead>
                              <tr><th>Date</th><th>Donateur</th><th>Type</th><th>Montant</th><th>Statut</th><th>Orphelinat</th></tr>
                            </thead>
                            <tbody>
                              {donations.map(d => (
                                <tr key={d.id}>
                                  <td>{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                                  <td>{d.donator_name || '—'}</td>
                                  <td>{d.donation_type_label}</td>
                                  <td>{d.amount} {d.currency}</td>
                                  <td>{d.status_label}</td>
                                  <td>{d.orphanage_name || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })()
                : activeKey === 'finances' ? (() => {
                  const token = localStorage.getItem('access_token')
                  const canWrite = ['director', 'federation', 'supermaster'].includes(role)

                  const submitIncome = async (e) => {
                    e.preventDefault()
                    setFinancesFormError('')
                    if (!incomeForm.source || !incomeForm.amount || isNaN(Number(incomeForm.amount)) || Number(incomeForm.amount) <= 0) { setFinancesFormError('Source et montant valide requis.'); return }
                    setFinancesSubmitting(true)
                    try {
                      const res = await fetch(`${API}/revenus/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(incomeForm),
                      })
                      if (res.status === 401) { onLogout(); return }
                      if (res.ok) {
                        setIncomes(prev => [await res.json(), ...prev])
                        setIncomeForm({ source: '', amount: '', orphanage: '' })
                        toast('Revenu enregistré.', 'success')
                      } else { toast('Erreur lors de l\'enregistrement.', 'error') }
                    } finally {
                      setFinancesSubmitting(false)
                    }
                  }

                  const submitExpense = async (e) => {
                    e.preventDefault()
                    setFinancesFormError('')
                    if (!expenseForm.category || !expenseForm.amount || isNaN(Number(expenseForm.amount)) || Number(expenseForm.amount) <= 0) { setFinancesFormError('Catégorie et montant valide requis.'); return }
                    setFinancesSubmitting(true)
                    try {
                      const res = await fetch(`${API}/depenses/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(expenseForm),
                      })
                      if (res.status === 401) { onLogout(); return }
                      if (res.ok) {
                        setExpenses(prev => [await res.json(), ...prev])
                        setExpenseForm({ category: '', amount: '', description: '', orphanage: '' })
                        toast('Dépense enregistrée.', 'success')
                      } else { toast('Erreur lors de l\'enregistrement.', 'error') }
                    } finally {
                      setFinancesSubmitting(false)
                    }
                  }

                  return (
                    <div className="dash-section">
                      <div className="dash-section-header">
                        <span className="dash-section-title">Finances</span>
                        <span className="dash-section-sub">Revenus et dépenses</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {['revenus', 'depenses'].map(tab => (
                          <button key={tab} className={`btn btn-sm${financesTab === tab ? ' btn-primary' : ''}`} onClick={() => setFinancesTab(tab)}>
                            {tab === 'revenus' ? 'Revenus' : 'Dépenses'}
                          </button>
                        ))}
                      </div>
                      {financesFormError && <div className="dash-error">{financesFormError}</div>}

                      {financesLoading ? <div className="dash-empty">Chargement...</div> : financesTab === 'revenus' ? (
                        <>
                          {canWrite && (
                            <form onSubmit={submitIncome} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                              <input placeholder="Source (Dons, Subventions...)" value={incomeForm.source} onChange={e => setIncomeForm(f => ({ ...f, source: e.target.value }))} className="dash-input" style={{ flex: '2 1 180px' }} />
                              <input type="number" min="0" step="0.01" placeholder="Montant" value={incomeForm.amount} onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
                              <input type="number" placeholder="ID Orphelinat" value={incomeForm.orphanage} onChange={e => setIncomeForm(f => ({ ...f, orphanage: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
                              <button type="submit" className="btn btn-primary btn-sm" disabled={financesSubmitting}>{financesSubmitting && <span className="btn-spinner" />}Ajouter</button>
                            </form>
                          )}
                          {incomes.length === 0 ? <EmptyState icon="💰" title="Aucun revenu enregistré" sub="Les revenus apparaîtront ici." /> : (
                            <table className="dash-table"><thead><tr><th>Date</th><th>Source</th><th>Montant</th><th>Orphelinat</th></tr></thead>
                            <tbody>{incomes.map(r => <tr key={r.id}><td>{r.date}</td><td>{r.source}</td><td>{r.amount}</td><td>{r.orphanage_name || '—'}</td></tr>)}</tbody></table>
                          )}
                        </>
                      ) : (
                        <>
                          {canWrite && (
                            <form onSubmit={submitExpense} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                              <input placeholder="Catégorie (Alimentation, Santé...)" value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} className="dash-input" style={{ flex: '2 1 180px' }} />
                              <input type="number" min="0" step="0.01" placeholder="Montant" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
                              <input placeholder="Description (optionnel)" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="dash-input" style={{ flex: '2 1 180px' }} />
                              <input type="number" placeholder="ID Orphelinat" value={expenseForm.orphanage} onChange={e => setExpenseForm(f => ({ ...f, orphanage: e.target.value }))} className="dash-input" style={{ flex: '1 1 120px' }} />
                              <button type="submit" className="btn btn-primary btn-sm" disabled={financesSubmitting}>{financesSubmitting && <span className="btn-spinner" />}Ajouter</button>
                            </form>
                          )}
                          {expenses.length === 0 ? <EmptyState icon="📊" title="Aucune dépense enregistrée" sub="Les dépenses apparaîtront ici." /> : (
                            <table className="dash-table"><thead><tr><th>Date</th><th>Catégorie</th><th>Montant</th><th>Description</th><th>Orphelinat</th></tr></thead>
                            <tbody>{expenses.map(d => <tr key={d.id}><td>{d.date}</td><td>{d.category}</td><td>{d.amount}</td><td>{d.description || '—'}</td><td>{d.orphanage_name || '—'}</td></tr>)}</tbody></table>
                          )}
                        </>
                      )}
                    </div>
                  )
                })()
                : activeKey === 'parrainages' ? (() => {
                  const token = localStorage.getItem('access_token')
                  const isSponsorRole = ['sponsor', 'partner'].includes(role)

                  const createSponsorship = async (childId) => {
                    setSponsorshipFormError('')
                    if (!sponsorshipForm.amount || isNaN(Number(sponsorshipForm.amount)) || Number(sponsorshipForm.amount) <= 0) { setSponsorshipFormError('Veuillez saisir un montant valide.'); return }
                    setSponsorshipSubmitting(true)
                    try {
                      const res = await fetch(`${API}/parrainages/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ ...sponsorshipForm, child: childId }),
                      })
                      if (res.status === 401) { onLogout(); return }
                      if (res.ok) {
                        const created = await res.json()
                        setMySponsored(prev => [created, ...prev])
                        setSponsorableChildren(prev => prev.filter(c => c.id !== childId))
                        toast('Parrainage créé avec succès.', 'success')
                      } else {
                        const err = await res.json().catch(() => ({}))
                        toast(err.detail || err.error || 'Erreur lors de la création.', 'error')
                      }
                    } finally {
                      setSponsorshipSubmitting(false)
                    }
                  }

                  const loadPayments = async (sponsorshipId) => {
                    const res = await fetch(`${API}/parrainages/${sponsorshipId}/paiements/`, { headers: { Authorization: `Bearer ${token}` } })
                    if (!res.ok) { if (res.status === 401) { onLogout() } return }
                    setSponsorshipPayments(await res.json()); setSelectedSponsorshipId(sponsorshipId)
                  }

                  const updateSponsorshipStatus = async (id, newStatus) => {
                    const res = await fetch(`${API}/parrainages/${id}/`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ status: newStatus }),
                    })
                    if (res.status === 401) { onLogout(); return }
                    if (res.ok) {
                      const updated = await res.json()
                      setMySponsored(prev => prev.map(s => s.id === id ? { ...s, status: updated.status, status_label: updated.status_label } : s))
                    }
                  }

                  return (
                    <div className="dash-section">
                      <div className="dash-section-header">
                        <span className="dash-section-title">Parrainages</span>
                        <span className="dash-section-sub">{isSponsorRole ? 'Parrainer un enfant à distance' : 'Parrainages de votre orphelinat'}</span>
                      </div>

                      {sponsorshipFormError && <div className="dash-error">{sponsorshipFormError}</div>}

                      {isSponsorRole && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                          {['disponibles', 'mes-parrainages'].map(tab => (
                            <button key={tab} className={`btn btn-sm${parrainagesTab === tab ? ' btn-primary' : ''}`} onClick={() => setParrainagesTab(tab)}>
                              {tab === 'disponibles' ? `Enfants disponibles (${sponsorableChildren.length})` : `Mes parrainages (${mySponsored.length})`}
                            </button>
                          ))}
                        </div>
                      )}

                      {parrainagesLoading ? <div className="dash-empty">Chargement...</div> : isSponsorRole && parrainagesTab === 'disponibles' ? (
                        <>
                          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Montant mensuel :</span>
                            <input type="number" min="1" step="1" placeholder="ex: 50" value={sponsorshipForm.amount} onChange={e => setSponsorshipForm(f => ({ ...f, amount: e.target.value }))} className="dash-input" style={{ width: 100 }} />
                            <select value={sponsorshipForm.sponsorship_type} onChange={e => setSponsorshipForm(f => ({ ...f, sponsorship_type: e.target.value }))} className="dash-input" style={{ width: 120 }}>
                              <option value="monthly">Mensuel</option>
                              <option value="annual">Annuel</option>
                            </select>
                          </div>
                          {sponsorableChildren.length === 0 ? (
                            <div className="dash-empty">Aucun enfant disponible pour parrainage.</div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                              {sponsorableChildren.map(child => (
                                <div key={child.id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div style={{ fontWeight: 600 }}>{child.prenom} {child.nom}</div>
                                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{child.uid}</div>
                                  {child.date_naissance && <div style={{ fontSize: 12 }}>Né(e) le {new Date(child.date_naissance).toLocaleDateString('fr-FR')}</div>}
                                  <button className="btn btn-primary btn-sm" style={{ marginTop: 'auto' }} onClick={() => createSponsorship(child.id)} disabled={Number(sponsorshipForm.amount) <= 0 || sponsorshipSubmitting}>{sponsorshipSubmitting && <span className="btn-spinner" />}Parrainer</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : isSponsorRole && parrainagesTab === 'mes-parrainages' ? (
                        mySponsored.length === 0 ? <EmptyState icon="🤝" title="Aucun parrainage" sub="Les parrainages actifs apparaîtront ici." /> : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {mySponsored.map(s => (
                              <div key={s.id} className="dash-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                  <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.child_name}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.sponsorship_type_label} — {s.amount} USD · {s.status_label}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Depuis le {s.start_date}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {s.status === 'active' && <button className="btn btn-sm" onClick={() => updateSponsorshipStatus(s.id, 'paused')}>Suspendre</button>}
                                    {s.status === 'paused' && <button className="btn btn-sm btn-primary" onClick={() => updateSponsorshipStatus(s.id, 'active')}>Reprendre</button>}
                                    {s.status !== 'cancelled' && <button className="btn btn-sm" style={{ color: '#ef4444' }} onClick={() => updateSponsorshipStatus(s.id, 'cancelled')}>Annuler</button>}
                                    <button className="btn btn-sm" onClick={() => loadPayments(s.id)}>Historique</button>
                                  </div>
                                </div>
                                {selectedSponsorshipId === s.id && (
                                  <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Paiements</div>
                                    {sponsorshipPayments.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Aucun paiement.</div> : (
                                      <table className="dash-table">
                                        <thead><tr><th>Date</th><th>Montant</th><th>Réf</th></tr></thead>
                                        <tbody>{sponsorshipPayments.map(p => <tr key={p.id}><td>{new Date(p.date).toLocaleDateString('fr-FR')}</td><td>{p.amount}</td><td>{p.transaction_id || '—'}</td></tr>)}</tbody>
                                      </table>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        mySponsored.length === 0 ? <EmptyState icon="🤝" title="Aucun parrainage" sub="Les parrainages pour cet orphelinat apparaîtront ici." /> : (
                          <table className="dash-table">
                            <thead><tr><th>Enfant</th><th>Parrain</th><th>Type</th><th>Montant</th><th>Statut</th><th>Depuis</th></tr></thead>
                            <tbody>{mySponsored.map(s => <tr key={s.id}><td>{s.child_name}</td><td>{s.sponsor_name}</td><td>{s.sponsorship_type_label}</td><td>{s.amount}</td><td>{s.status_label}</td><td>{s.start_date}</td></tr>)}</tbody>
                          </table>
                        )
                      )}
                    </div>
                  )
                })()
                : !subKey ? (
                  <div className="dash-category-cards">
                    {activeKey === 'parametres' && !subKey && (
                      <div className="dash-category-card" onClick={() => setSubKey('Profil')}>
                        <div className="dash-card-icon-wrap">
                          <img src={avatarSvg} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        </div>
                        <span className="dash-card-title">{user.first_name} {user.last_name}</span>
                        <span className="dash-card-desc">{t('role_' + role) || roleLabel}</span>
                      </div>
                    )}
                    {page?.categories?.map((cat, i) => (
                      <button key={i} className="dash-category-card" onClick={() => {
                        setSubKey(cat.title);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}>
                        <div className="dash-card-icon-wrap">
                          <span className="dash-card-icon">{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</span>
                        </div>
                        <span className="dash-card-title">{t('cat_' + role + '_' + activeKey.replace(/-/g, '_') + '_' + cat.id + '_title') || cat.title}</span>
                        <span className="dash-card-desc">{t('cat_' + role + '_' + activeKey.replace(/-/g, '_') + '_' + cat.id + '_sub') || cat.subtitle}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>

      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setDeleteConfirm(null)}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)', borderRadius:'var(--ag-radius)', padding:'28px 32px', maxWidth:'400px', width:'90%', textAlign:'center', display:'flex', flexDirection:'column', gap:'16px' }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize:'40px' }}>{'\u26A0\uFE0F'}</span>
            <h3 style={{ margin:0, fontSize:'17px', fontWeight:'700', color:'#e2e8f0' }}>{t('delete_confirm_title') || 'Confirmer la suppression'}</h3>
            <p style={{ fontSize:'13px', color:'#94a3b8', margin:0 }}>{t('delete_confirm_msg') || 'Supprimer'} {deleteConfirm.prenom || ''} {deleteConfirm.nom || ''} ?</p>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center', marginTop:'8px' }}>
              <button className="dash-back-btn" onClick={() => setDeleteConfirm(null)} style={{ padding:'8px 24px' }}>{t('delete_cancel') || 'Annuler'}</button>
              <button className="dash-form-delete" onClick={() => deleteChild(deleteConfirm)} style={{ padding:'8px 24px' }}>{t('delete_confirm') || 'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}
      {unassignConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setUnassignConfirm(null)}>
          <div style={{ background:'#1e293b', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'28px 32px', maxWidth:'400px', width:'90%', textAlign:'center', display:'flex', flexDirection:'column', gap:'16px' }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize:'40px' }}>✂️</span>
            <h3 style={{ margin:0, fontSize:'17px', fontWeight:'700', color:'#e2e8f0' }}>Confirmer la désassignation</h3>
            <p style={{ fontSize:'13px', color:'#94a3b8', margin:0 }}>Retirer l'assignation de <strong style={{color:'#f59e0b'}}>{unassignConfirm.childName}</strong> ?</p>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center', marginTop:'8px' }}>
              <button type="button" onClick={() => setUnassignConfirm(null)} style={{background:'rgba(255,255,255,0.05)',border:'none',borderRadius:10,color:'#94a3b8',fontSize:13,fontWeight:600,padding:'8px 24px',cursor:'pointer'}}>Annuler</button>
              <button type="button" onClick={async()=>{const c=unassignConfirm;setUnassignConfirm(null);const token=localStorage.getItem('access_token');try{await fetch(API+'/assignments/'+c.assignmentId+'/',{method:'DELETE',headers:{Authorization:'Bearer '+token}});if(c.orphanageId){const r=await fetch(API+'/assignments/?orphanage_id='+c.orphanageId,{headers:{Authorization:'Bearer '+token}});if(r.ok)setOrphanageAssignments(await r.json())}if(c.onAssigned)c.onAssigned()}catch(_){}}} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,color:'#ef4444',fontSize:13,fontWeight:600,padding:'8px 24px',cursor:'pointer'}}>Désassigner</button>
            </div>
          </div>
        </div>
      )}
      {docConfirmModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }} onClick={() => setDocConfirmModal(null)}>
          <div style={{ background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'32px', maxWidth:'420px', width:'90%', textAlign:'center', display:'flex', flexDirection:'column', gap:'16px', boxShadow:'0 25px 50px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
              <span style={{ fontSize:'28px' }}>🗑️</span>
            </div>
            <h3 style={{ margin:0, fontSize:'18px', fontWeight:'700', color:'#f1f5f9' }}>{docConfirmModal.title}</h3>
            <p style={{ fontSize:'14px', color:'#94a3b8', margin:0, lineHeight:'1.5' }}>{docConfirmModal.message}</p>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center', marginTop:'8px' }}>
              <button onClick={() => setDocConfirmModal(null)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#cbd5e1', fontSize:13, fontWeight:600, padding:'10px 28px', cursor:'pointer', transition:'all .15s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
                Annuler
              </button>
              <button onClick={() => docConfirmModal.onConfirm()} style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'#f87171', fontSize:13, fontWeight:700, padding:'10px 28px', cursor:'pointer', transition:'all .15s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(239,68,68,0.25)'}
                onMouseOut={e => e.currentTarget.style.background='rgba(239,68,68,0.15)'}>
                {docConfirmModal.confirmLabel || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChildAssignmentForm({ API, ambassadors, children, assignments, onAssigned, setUnassignConfirm }) {
  const [selChildren, setSelChildren] = React.useState([])
  const [selectedAmbassador, setSelectedAmbassador] = React.useState('')
  const [note, setNote] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState('')
  const [assignFilter, setAssignFilter] = React.useState('all')

  const assignedChildIds = new Set(assignments.map(a => a.child))
  const unassignedChildren = children.filter(c => !assignedChildIds.has(c.id))
  const assignedChildren = children.filter(c => assignedChildIds.has(c.id))
  const displayChildren = assignFilter === 'all' ? children : assignFilter === 'unassigned' ? unassignedChildren : assignedChildren
  const assignMap = {}
  assignments.forEach(a => { assignMap[a.child] = a })

  const handleAssign = async () => {
    if (selChildren.length === 0 || !selectedAmbassador) {
      setMsg('Veuillez sélectionner au moins un enfant et un ambassadeur.')
      return
    }
    setLoading(true)
    setMsg('')
    const token = localStorage.getItem('access_token')
    try {
      const res = await fetch(`${API}/assignments/bulk/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ child_ids: selChildren, ambassador_id: Number(selectedAmbassador), note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur d'assignation")
      setMsg(`✅ ${data.results.length} enfant(s) assigné(s) avec succès.`)
      setSelChildren([])
      setSelectedAmbassador('')
      setNote('')
      if (onAssigned) onAssigned()
    } catch (err) {
      setMsg('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{flex:'1 1 340px'}}>
          <label style={{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:6,display:'block'}}>Enfants</label>
          <div style={{display:'flex',gap:4,marginBottom:8}}>
            {[{k:'all',l:'Tous'},{k:'unassigned',l:'Non assignés'},{k:'assigned',l:'Assignés'}].map(f => (
              <button key={f.k} type="button" onClick={()=>setAssignFilter(f.k)} style={{border:'none',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer',background:assignFilter===f.k?'rgba(168,85,247,0.2)':'rgba(255,255,255,0.05)',color:assignFilter===f.k?'#a855f7':'#94a3b8'}}>{f.l}</button>
            ))}
          </div>
          <div style={{maxHeight:260,overflowY:'auto',background:'rgba(0,0,0,0.15)',borderRadius:10,padding:'6px',marginBottom:10}}>
            {displayChildren.length === 0 ? (
              <div style={{textAlign:'center',padding:20,color:'#64748b',fontSize:12}}>Aucun enfant trouvé.</div>
            ) : (
              displayChildren.map(c => {
                const checked = selChildren.includes(c.id)
                const assignment = assignMap[c.id]
                return (
                  <div key={c.id} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px',background:checked?'rgba(168,85,247,0.08)':'transparent',borderRadius:8,marginBottom:2}}>
                    <input type="checkbox" checked={checked} disabled={!!assignment} onChange={()=>setSelChildren(prev=>checked?prev.filter(id=>id!==c.id):[...prev,c.id])} style={{width:16,height:16,cursor:assignment?'not-allowed':'pointer',accentColor:'#a855f7',opacity:assignment?0.35:1}} />
                    <div style={{flex:1,fontSize:12,color:assignment?'#22c55e':'#e2e8f0'}}>
                      {c.child_name}
                      <span style={{color:'#64748b',fontSize:10,marginLeft:4}}>({c.orphanage_name || '—'})</span>
                    </div>
                    {assignment ? (
                      <div style={{display:'flex',alignItems:'center',gap:3}}>
                        <span style={{fontSize:10,fontWeight:600,padding:'2px 6px',borderRadius:20,background:'rgba(34,197,94,0.1)',color:'#22c55e'}}>{assignment.ambassador_name?.split(' ')[0]}</span>
                        <button type="button" onClick={()=>setUnassignConfirm?.({childName:c.child_name,assignmentId:assignment.id,onAssigned:onAssigned})} style={{background:'rgba(239,68,68,0.1)',border:'none',borderRadius:4,color:'#ef4444',fontSize:10,cursor:'pointer',padding:'2px 5px'}}>✕</button>
                      </div>
                    ) : (
                      <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'rgba(100,116,139,0.1)',color:'#64748b'}}>Libre</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
          {selChildren.length > 0 && (
            <div style={{fontSize:11,color:'#a855f7',marginBottom:8,fontWeight:600}}>{selChildren.length} enfant(s) sélectionné(s)</div>
          )}
        </div>
        <div style={{flex:'1 1 280px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:4,display:'block'}}>Ambassadeur</label>
              <select value={selectedAmbassador} onChange={e => setSelectedAmbassador(e.target.value)} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#e2e8f0',fontSize:13,padding:'8px 10px',outline:'none'}}>
                <option value="">Sélectionner un ambassadeur</option>
                {ambassadors.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name || `${a.first_name} ${a.last_name}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:4,display:'block'}}>Note (optionnelle)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note pour l'ambassadeur..." style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#e2e8f0',fontSize:13,padding:'8px 10px',outline:'none'}} />
            </div>
            <button type="button" onClick={handleAssign} disabled={loading||selChildren.length===0||!selectedAmbassador} style={{background:'linear-gradient(135deg,#a855f7,#7c3aed)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,padding:'10px 20px',cursor:loading||selChildren.length===0||!selectedAmbassador?'not-allowed':'pointer',opacity:loading||selChildren.length===0||!selectedAmbassador?0.6:1}}>
              {loading ? 'Assignation...' : `Assigner à l'ambassadeur (${selChildren.length})`}
            </button>
            {msg && <div style={{fontSize:12,padding:'8px 12px',borderRadius:8,background:'rgba(0,0,0,0.2)',color:'#e2e8f0'}}>{msg}</div>}
          </div>
        </div>
      </div>
      {assignments.length > 0 && (
        <div style={{marginTop:20}}>
          <h4 style={{fontSize:14,fontWeight:700,color:'#e2e8f0',margin:'0 0 10px'}}>Assignations existantes ({assignments.length})</h4>
          <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:240,overflowY:'auto'}}>
            {assignments.map(a => (
              <div key={a.id} style={{background:'rgba(30,41,59,0.5)',borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,fontSize:13}}>
                <span style={{color:'#e2e8f0',fontWeight:600}}>{a.child_name}</span>
                <span style={{color:'#64748b'}}>→</span>
                <span style={{color:'#a855f7'}}>{a.ambassador_name}</span>
                <span style={{color:'#64748b',fontSize:11,flex:1,textAlign:'right'}}>{new Date(a.assigned_at).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <span className="logo-icon">&#x2726;</span>
            <span className="logo-text">Fédération<span className="accent"> des Orphelinats</span></span>
          </a>
          <p className="footer-desc">{t('footer_tagline')}</p>
        </div>
        <div className="footer-links">
          <a href="#" onClick={e => e.preventDefault()}>{t('footer_privacy')}</a>
          <a href="#" onClick={e => e.preventDefault()}>{t('footer_terms')}</a>
          <a href="#" onClick={e => e.preventDefault()}>{t('footer_faq')}</a>
        </div>
        <div className="footer-copy">
            <p>{t('footer_copyright')}</p>
          <p className="footer-tech">{t('footer_tech')}</p>
        </div>
      </div>
    </footer>
  )
}

function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" opacity=".25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  )
}

/* ===== VERIFY EMAIL ===== */
function VerifyEmail({ params, onDone }) {
  const [status, setStatus] = useState('verifying')
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true
    const verify = async () => {
      try {
        const res = await fetch(`${API}/auth/verify-email/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token, uid: params.uid }),
        })
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          window.history.replaceState({}, document.title, window.location.pathname)
        } else {
          setStatus(data.error || 'Lien invalide ou expiré.')
        }
      } catch (err) {
        setStatus('Erreur de connexion au serveur. Vérifiez que le backend est lancé (python manage.py runserver).')
      }
    }
    verify()
  }, [])

  return (
    <div className="modal-overlay" onClick={onDone}>
      <div className="modal modal-success" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onDone}>&times;</button>
        <div className="modal-header">
          {status === 'verifying' ? (
            <>
              <div className="success-icon" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>{'\u23F3'}</div>
              <h2>Vérification...</h2>
              <p>Activation de votre compte en cours.</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="success-icon">{'\u2713'}</div>
              <h2>Compte activé !</h2>
              <p>Votre compte est maintenant actif. Vous pouvez vous connecter.</p>
            </>
          ) : (
            <>
              <div className="success-icon" style={{ borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}>{'\u2716'}</div>
              <h2>Échec d'activation</h2>
              <p>{status}</p>
            </>
          )}
        </div>
        <button className="btn btn-primary btn-block btn-lg" onClick={onDone}>
          {status === 'success' ? 'Se connecter' : 'Fermer'}
        </button>
      </div>
    </div>
  )
}

/* ===== LOGIN MODAL ===== */
function LoginModal({ onClose, onSwitchToSignup, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.detail?.toLowerCase().includes('no active account')) {
          setFieldErrors({ email: true, password: true })
          setError('Aucun compte trouvé avec cet email.')
        } else if (data.detail?.toLowerCase().includes('unable to log in')) {
          setFieldErrors({ password: true })
          setError('Mot de passe incorrect.')
        } else {
          setError(data.detail || 'Email ou mot de passe incorrect.')
        }
        return
      }
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      const me = await fetch(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      })
      if (me.ok) {
        const userData = await me.json()
        onLogin(userData)
      }
      onClose()
    } catch {
      setError('Erreur de connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <span className="modal-logo">{'\u2726'}</span>
          <h2>Connexion</h2>
          <p>Accédez à votre espace personnel</p>
        </div>
        <form onSubmit={submit} className="modal-form" noValidate>
          {error && (
            <div className="modal-error">
              <span className="modal-error-icon">{'\u26A0'}</span>
              {error}
            </div>
          )}
          <label htmlFor="login-email">Email</label>
          <div className="input-wrap">
            <input id="login-email" type="email" required value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: false })); setError('') }} placeholder="votre@email.com" className={fieldErrors.email ? 'error' : ''} />
            {fieldErrors.email && <span className="input-err-icon">{'\u2716'}</span>}
          </div>
          <label htmlFor="login-pass">Mot de passe</label>
          <div className="input-wrap">
            <input id="login-pass" type="password" required value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: false })); setError('') }} placeholder="Votre mot de passe" className={fieldErrors.password ? 'error' : ''} />
            {fieldErrors.password && <span className="input-err-icon">{'\u2716'}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <><Spinner /> Connexion...</> : 'Se connecter'}
          </button>
        </form>
        <p className="modal-switch">
          Pas encore de compte ?{' '}
          <button className="modal-link" onClick={onSwitchToSignup}>Inscrivez-vous</button>
        </p>
      </div>
    </div>
  )
}

/* ===== SIGNUP MODAL ===== */
function SignupModal({ onClose, onSwitchToLogin }) {
  const [step, setStep] = useState('form')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', country: '', role: '',
    password: '', confirm_password: '',
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const pw = form.password

  const checks = [
    { label: '8 à 16 caractères', pass: pw.length >= 8 && pw.length <= 16 },
    { label: '1 majuscule (A-Z)', pass: /[A-Z]/.test(pw) },
    { label: '1 minuscule (a-z)', pass: /[a-z]/.test(pw) },
    { label: '1 chiffre (0-9)', pass: /\d/.test(pw) },
    { label: '1 caractère spécial (!@#...)', pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pw) },
  ]

  const allChecksPass = checks.every(c => c.pass)
  const passedCount = checks.filter(c => c.pass).length
  const strengthPct = pw.length === 0 ? 0 : Math.round((passedCount / checks.length) * 100)
  const match = form.password && form.confirm_password && form.password === form.confirm_password
  const confirmDirty = form.confirm_password.length > 0

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!form.first_name || !form.last_name || !form.email || !form.country || !form.role || !form.password || !form.confirm_password) {
      setError('Veuillez remplir tous les champs.'); return
    }
    if (!allChecksPass) { setError('Le mot de passe ne respecte pas toutes les contraintes.'); return }
    if (!match) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.email?.[0]?.toLowerCase().includes('already exists')) {
          setFieldErrors(f => ({ ...f, email: true }))
          setError('Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.')
        } else {
          const msg = data.email?.[0] || data.password?.[0] || data.detail || Object.values(data).flat().join(' ')
          setError(msg || 'Erreur lors de l\'inscription.')
        }
        return
      }
      setStep('success')
    } catch {
      setError('Erreur de connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-success" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>&times;</button>
          <div className="modal-header">
            <div className="success-icon">{'\u2713'}</div>
            <h2>Inscription réussie !</h2>
            <p>Un email d'activation a été envoyé à <strong>{form.email}</strong>.</p>
          </div>
          <div className="modal-success-box">
            <p>{'\u2709'} Vérifiez votre boîte de réception</p>
            <p>Valable <strong>2 heures</strong> &middot; Usage unique</p>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>J'ai compris</button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-signup" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <span className="modal-logo">{'\u2726'}</span>
          <h2>Créer un compte</h2>
          <p>Rejoignez la Fédération des Orphelinats</p>
        </div>
        <form onSubmit={submit} className="modal-form" noValidate>
          {error && (
            <div className="modal-error">
              <span className="modal-error-icon">{'\u26A0'}</span>
              {error}
            </div>
          )}

          <div className="form-row">
            <div>
              <label htmlFor="sig-fname">Prénom <span className="req">*</span></label>
              <input id="sig-fname" type="text" required value={form.first_name} onChange={e => { set('first_name')(e); setError('') }} placeholder="Jean" />
            </div>
            <div>
              <label htmlFor="sig-lname">Nom <span className="req">*</span></label>
              <input id="sig-lname" type="text" required value={form.last_name} onChange={e => { set('last_name')(e); setError('') }} placeholder="Dupont" />
            </div>
          </div>

          <label htmlFor="sig-email">Email <span className="req">*</span></label>
          <div className="input-wrap">
            <input id="sig-email" type="email" required value={form.email} onChange={e => { set('email')(e); setFieldErrors(f => ({ ...f, email: false })); setError('') }} placeholder="vous@exemple.com" className={fieldErrors.email ? 'error' : ''} />
            {fieldErrors.email && <span className="input-err-icon">{'\u2716'}</span>}
          </div>

          <label htmlFor="sig-country">Pays <span className="req">*</span></label>
          <select id="sig-country" required value={form.country} onChange={set('country')}>
            <option value="">Sélectionnez votre pays</option>
            {AFRICAN_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>

          <label htmlFor="sig-role">Rôle <span className="req">*</span></label>
          <select id="sig-role" required value={form.role} onChange={set('role')}>
            <option value="">Sélectionnez votre rôle</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          <label htmlFor="sig-pass">Mot de passe <span className="req">*</span></label>
          <div className="input-wrap">
            <input id="sig-pass" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => { set('password')(e); setError('') }} placeholder="8-16 car. dont maj, min, chiffre, spécial" className={form.password && !allChecksPass ? 'error' : ''} />
            {form.password && (
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>}
                </svg>
              </button>
            )}
          </div>
          {pw.length > 0 && (
            <div className="pw-checks">
              {checks.map((c, i) => (
                <span key={i} className={`pw-check${c.pass ? ' ok' : ' no'}`} />
              ))}
            </div>
          )}
          {pw.length > 0 && (
            <div className="pw-strength-bar">
              <div className="pw-strength-fill" style={{ width: `${strengthPct}%`, background: strengthPct < 40 ? '#ef4444' : strengthPct < 80 ? '#f59e0b' : '#22c55e' }} />
            </div>
          )}

          <label htmlFor="sig-confirm">Confirmer le mot de passe <span className="req">*</span></label>
          <div className="input-wrap">
            <input id="sig-confirm" type={showConfirm ? 'text' : 'password'} required value={form.confirm_password} onChange={e => { set('confirm_password')(e); setError('') }} placeholder="Répétez le mot de passe" className={confirmDirty ? (match ? 'ok' : 'error') : ''} />
            {form.confirm_password && (
              <button type="button" className="pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showConfirm ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>}
                </svg>
              </button>
            )}
          </div>
          {confirmDirty && (
            <span className={`pw-match${match ? ' ok' : ''}`}>
              {match ? '\u2713' : '\u25CF'} {match ? 'Mots de passe identiques' : 'Mots de passe différents'}
            </span>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <><Spinner /> Inscription...</> : 'Créer mon compte'}
          </button>
        </form>
        <p className="modal-switch">
          Déjà un compte ?{' '}
          <button className="modal-link" onClick={onSwitchToLogin}>Connectez-vous</button>
        </p>
      </div>
    </div>
  )
}

function useDraggable(id) {
  const posRef = useRef(null)
  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem(id)
    return saved ? JSON.parse(saved) : null
  })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onMouseDown = useRef(null)

  useEffect(() => {
    const el = document.getElementById(id)
    if (!el || !pos) return
    el.style.left = pos.x + 'px'
    el.style.top = pos.y + 'px'
    el.style.right = 'auto'
    el.style.bottom = 'auto'
  }, [pos, id])

  const startDrag = (e) => {
    const el = document.getElementById(id)
    if (!el) return
    const rect = el.getBoundingClientRect()
    offset.current = {
      x: (e.clientX || e.touches[0].clientX) - rect.left,
      y: (e.clientY || e.touches[0].clientY) - rect.top,
    }
    dragging.current = true
    el.style.transition = 'none'
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
    el.style.pointerEvents = 'auto'
  }

  const onMove = (e) => {
    if (!dragging.current) return
    const el = document.getElementById(id)
    if (!el) return
    const cx = e.clientX ?? e.touches?.[0]?.clientX
    const cy = e.clientY ?? e.touches?.[0]?.clientY
    if (cx == null) return
    const x = cx - offset.current.x
    const y = cy - offset.current.y
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    el.style.right = 'auto'
    el.style.bottom = 'auto'
  }

  const stopDrag = () => {
    if (!dragging.current) return
    dragging.current = false
    const el = document.getElementById(id)
    if (!el) return
    el.style.transition = ''
    el.style.cursor = ''
    el.style.userSelect = ''
    const x = parseInt(el.style.left)
    const y = parseInt(el.style.top)
    if (!isNaN(x) && !isNaN(y)) {
      const newPos = { x, y }
      setPos(newPos)
      localStorage.setItem(id, JSON.stringify(newPos))
    }
  }

  useEffect(() => {
    const el = document.getElementById(id)
    if (!el) return
    const md = (e) => { if (e.button === 0) startDrag(e) }
    el.addEventListener('mousedown', md)
    el.addEventListener('touchstart', startDrag, { passive: true })
    return () => { el.removeEventListener('mousedown', md); el.removeEventListener('touchstart', startDrag) }
  }, [id])

  useEffect(() => {
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', stopDrag)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', stopDrag)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', stopDrag)
    }
  }, [])

  return null
}

function WhatsAppFloat() {
  useDraggable('waFloat')

  return (
    <a href="#" className="wa-float" id="waFloat" onClick={e => e.preventDefault()} title="WhatsApp">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.76-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.525 5.852L.525 24l6.403-1.553A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.776 0-3.468-.494-4.94-1.42l-.36-.215-3.8.922.996-3.677-.25-.39A9.963 9.963 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
    </a>
  )
}

const LS_WIDTH = 'cdobot_width'
const MIN_W = 160
const MAX_W = 460

function Chatbot({ collapsed, onToggle }) {
  useDraggable('chatbotFloat')

  const [messages, setMessages] = useState([{ text: 'Bonjour ! Je suis l\'assistant. Puis-je vous aider ?', isUser: false }])
  const [input, setInput] = useState('')
  const [width, setWidth] = useState(() => {
    try { return Math.min(MAX_W, Math.max(MIN_W, Number(localStorage.getItem(LS_WIDTH)) || 220)) } catch { return 220 }
  })
  const msgEndRef = useRef(null)

  const replies = [
    'Merci ! Un agent vous répondra bientôt.',
    'Nous sommes touchés par votre intérêt. Ensemble pour les enfants !',
    'Voulez-vous en savoir plus sur nos programmes de parrainage ?',
    'Chaque geste compte. Merci de soutenir les orphelins d\'Afrique.',
  ]

  const resizeRef = useRef(null)
  const startXRef = useRef(0)
  const startWRef = useRef(0)

  const onResizeStart = (e) => {
    e.stopPropagation()
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX
    startWRef.current = width
    document.addEventListener('mousemove', onResizeMove)
    document.addEventListener('mouseup', onResizeEnd)
    document.addEventListener('touchmove', onResizeMove, { passive: true })
    document.addEventListener('touchend', onResizeEnd)
  }

  const onResizeMove = (e) => {
    const cx = e.clientX ?? e.touches?.[0]?.clientX
    const dx = startXRef.current - cx
    const w = Math.min(MAX_W, Math.max(MIN_W, startWRef.current + dx))
    setWidth(w)
  }

  const onResizeEnd = () => {
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
    document.removeEventListener('touchmove', onResizeMove)
    document.removeEventListener('touchend', onResizeEnd)
    try { localStorage.setItem(LS_WIDTH, String(width)) } catch {}
  }

  const send = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages(prev => [...prev, { text, isUser: true }])
    setTimeout(() => {
      setMessages(prev => [...prev, { text: replies[Math.floor(Math.random() * replies.length)], isUser: false }])
    }, 600)
  }

  const handleKey = (e) => { if (e.key === 'Enter') send() }

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={`chatbot-float${collapsed ? ' collapsed' : ''}`} id="chatbotFloat" style={{ width }}>
      <div className="chatbot-resize-handle" onMouseDown={onResizeStart} onTouchStart={onResizeStart} />
      <div className="chatbot-header" onClick={() => onToggle && onToggle(!collapsed)}>
        <span className="chatbot-avatar">{'\uD83E\uDD16'}</span>
        <span>Assistant</span>
        <span className="chatbot-toggle">{collapsed ? '+' : '\u2013'}</span>
      </div>
      <div className="chatbot-body">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message${m.isUser ? ' user' : ' bot'}`}>{m.text}</div>
        ))}
        <div ref={msgEndRef} />
        <div className="chat-input-area">
          <input className="chat-input" placeholder="Message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
          <button className="chat-send" onClick={send}>{'\u2192'}</button>
        </div>
      </div>
    </div>
  )
}
