import { useState, useEffect, useRef } from 'react'
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
  return String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65, 0x1F1E6 + code.charCodeAt(1) - 65)
}
function countryName(code) {
  const c = AFRICAN_COUNTRIES.find(c => c.code === code)
  return c ? c.name : code
}

const ROLES = [
  { value: 'ambassador', label: 'Ambassadeur' },
  { value: 'supermaster', label: 'Super Master' },
  { value: 'partner', label: 'Partenaire' },
  { value: 'director', label: "Chef d'orphelinat" },
  { value: 'federation', label: 'Fédération' },
]

const CATEGORY_ICONS = ['\u{1F4CB}', '\u{1F4C8}', '\u{26A1}', '\u{1F4C5}', '\u{1F4C4}', '\u{1F3EB}', '\u{1F4E2}', '\u{1F91D}', '\u{1F464}', '\u{1F3E0}']

export default function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [chatbotCollapsed, setChatbotCollapsed] = useState(true)
  const [verifyParams, setVerifyParams] = useState(null)
  const [user, setUser] = useState(null)

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
    const rolesWithDashboard = ['director', 'ambassador', 'supermaster', 'federation', 'partner']
    if (rolesWithDashboard.includes(roleLower)) {
      return (
        <LangProvider>
          <div className="app">
            <DashboardHeader user={user} roleLower={roleLower} roleLabel={ROLES.find(r => r.value === roleLower)?.label || roleLower} />
            <main><DashboardShell user={user} role={roleLower} onLogout={logout} /></main>
          </div>
        </LangProvider>
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
                      <span className="hero-slide-age">{y.age} ans &middot; {countryFlag(y.code)} {y.country}</span>
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
              <span className="stat-label">{countryFlag(c.code)} {c.name}</span>
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
    { label: 'Projets', key: 'projets' },
    { label: 'Documents', key: 'documents' },
    { label: 'Ambassadeurs', key: 'ambassadeurs' },
    { label: 'Demandes', key: 'demandes' },
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
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  federation: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Utilisateurs', key: 'users' },
    { label: 'Orphelinats', key: 'orphelinats' },
    { label: 'Ambassadeurs', key: 'ambassadeurs' },
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
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
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

function DashboardHeader({ user, roleLower, roleLabel }) {
  const { t, lang, setLang } = useTranslation()
  const [time, setTime] = useState(new Date())
  const [profileImg, setProfileImg] = useState(localStorage.getItem('cdo_profile_img') || null)
  const [localOrpName, setLocalOrpName] = useState(localStorage.getItem('cdo_orphanage_name') || '')
  const [countryDropOpen, setCountryDropOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(user.country || 'CD')
  const [notifCount] = useState(3)
  const [notifOpen, setNotifOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('cdo_theme') || 'dark')
  const fileInputRef = useRef(null)
  const countryDropRef = useRef(null)
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (countryDropRef.current && !countryDropRef.current.contains(e.target)) setCountryDropOpen(false)
      if (notifDropRef.current && !notifDropRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const NOTIFS = [
    { icon: '📋', text: t('dash_notif_new_report'), time: t('dash_notif_5min') },
    { icon: '👤', text: t('dash_notif_profile_updated'), time: t('dash_notif_20min') },
    { icon: '✅', text: t('dash_notif_approved'), time: t('dash_notif_1h') },
  ]

  return (
    <header className="dash-header">
      <div className="dash-header-inner">

        {/* LEFT — Avatar + Info */}
        <div className="dash-header-left">
          <div className="dash-avatar-row">
            <div className="dash-avatar-wrapper" onClick={() => fileInputRef.current?.click()} title={t('dash_edit_photo')}>
              <img src={profileImg || avatarSvg} alt="" className="dash-avatar" />
              <div className="dash-avatar-overlay">+</div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            </div>
            {roleLower === 'director' && localOrpName && (
              <span className="dash-header-orp-name">{localOrpName}</span>
            )}
          </div>
          <div className="dash-profile-text">
            <span className="dash-profile-name">{user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}</span>
            <span className="dash-profile-role">{t('role_' + roleLower) || roleLabel}</span>
          </div>
        </div>

        {/* CENTER — System Status */}
        <div className="dash-header-center">
          <span className="dash-status-dot"></span>
          <span className="dash-status-text">{t('dash_system_status')}</span>
          <span className="dash-status-star">★</span>
        </div>

        {/* RIGHT — Country · Notifications · Time · Theme */}
        <div className="dash-header-right">

          {/* Country Selector */}
          <div className="dh-country-wrap" ref={countryDropRef}>
            <button
              id="dh-country-btn"
              className="dh-country-btn"
              onClick={() => { setCountryDropOpen(v => !v); setNotifOpen(false) }}
              title={t('dash_change_country')}
            >
              <span className="dh-country-flag">{countryFlag(selectedCountry)}</span>
              <span className="dh-country-name">{countryName(selectedCountry)}</span>
              <svg className={`dh-chevron${countryDropOpen ? ' open' : ''}`} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {countryDropOpen && (
              <div className="dh-dropdown dh-country-drop">
                {AFRICAN_COUNTRIES.map(c => (
                  <button key={c.code} className={`dh-drop-item${c.code === selectedCountry ? ' active' : ''}`} onClick={() => { setSelectedCountry(c.code); setCountryDropOpen(false) }}>
                    <span>{countryFlag(c.code)}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logo */}
          <img src="/logo.jpg" alt="Logo" className="dash-logo" />

          {/* Language Select */}
          <div className="dh-lang-wrap">
            <select className="dh-lang-select" value={lang} onChange={e => setLang(e.target.value)}>
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="sw">SW</option>
              <option value="ln">LN</option>
              <option value="kg">KG</option>
              <option value="tl">TL</option>
            </select>
          </div>

          {/* Notification Bell */}
          <div className="dh-notif-wrap" ref={notifDropRef}>
            <button
              id="dh-notif-btn"
              className="dh-notif-btn"
              onClick={() => { setNotifOpen(v => !v); setCountryDropOpen(false) }}
              title={t('dash_notifications')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {notifCount > 0 && <span className="dh-notif-badge">{notifCount}</span>}
            </button>
            {notifOpen && (
              <div className="dh-dropdown dh-notif-drop">
                <div className="dh-notif-header">{t('dash_notifications')}</div>
                {NOTIFS.map((n, i) => (
                  <div key={i} className="dh-notif-item">
                    <span className="dh-notif-icon">{n.icon}</span>
                    <div className="dh-notif-body">
                      <div className="dh-notif-text">{n.text}</div>
                      <div className="dh-notif-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clock */}
          <div className="dash-header-time">
            <span className="dash-time-label">{t('dash_time_label')}</span>
            <span className="dash-time-value">{time.toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR')}</span>
          </div>

          {/* Theme Toggle */}
          <button
            id="dh-theme-btn"
            className="dh-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('dash_theme_light') : t('dash_theme_dark')}
          >
            {theme === 'dark'
              ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
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

/* ===== L'ÉCLAT SOCIAL APP ===== */
function EclatSocialApp({ user, onReturn }) {
  const [esView, setEsView] = useState('home')
  const [esModal, setEsModal] = useState(null) // 'create' | 'detail' | null
  const [esSelectedPost, setEsSelectedPost] = useState(null)
  const [esNavActive, setEsNavActive] = useState('home')

  const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '')
  const hue = user.first_name ? user.first_name.charCodeAt(0) * 37 % 360 : 200
  const avatarSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="hsl(${hue},50%,45%)"/><text x="20" y="20" dominant-baseline="central" text-anchor="middle" fill="white" font-size="16" font-weight="700" font-family="system-ui">${initials}</text></svg>`)}`
  const displayName = user.first_name ? `${user.first_name} ${user.last_name?.[0] || ''}`.trim() : 'DarloK'

  const ES_STORIES = [
    { name: 'Vous', avatar: avatarSvg, isYou: true, active: false },
    { name: 'Sarah', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#F472B6"/><text x="32" y="32" dominant-baseline="central" text-anchor="middle" fill="white" font-size="24" font-weight="700">SM</text></svg>')}`, active: true },
    { name: 'Johnson', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#60A5FA"/><text x="32" y="32" dominant-baseline="central" text-anchor="middle" fill="white" font-size="24" font-weight="700">JN</text></svg>')}`, active: true },
    { name: 'Mike', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#34D399"/><text x="32" y="32" dominant-baseline="central" text-anchor="middle" fill="white" font-size="24" font-weight="700">MT</text></svg>')}`, active: false },
    { name: 'Emma', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#A78BFA"/><text x="32" y="32" dominant-baseline="central" text-anchor="middle" fill="white" font-size="24" font-weight="700">EW</text></svg>')}`, active: true },
    { name: 'David', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#FBBF24"/><text x="32" y="32" dominant-baseline="central" text-anchor="middle" fill="white" font-size="24" font-weight="700">DK</text></svg>')}`, active: false },
  ]

  const ES_POSTS = [
    {
      id: 1,
      author: 'Johnson',
      avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="20" fill="#60A5FA"/><text x="20" y="20" dominant-baseline="central" text-anchor="middle" fill="white" font-size="16" font-weight="700">JN</text></svg>')}`,
      time: 'Il y a 2 heures',
      text: 'Nouvelle interface de monitoring en cours de développement. 🚀',
      image: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="680" height="380" viewBox="0 0 680 380"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect width="680" height="380" fill="url(#bg)"/><rect x="40" y="40" width="200" height="120" rx="12" fill="#1E40AF" opacity="0.4"/><rect x="40" y="60" width="120" height="8" rx="4" fill="#60A5FA"/><rect x="40" y="80" width="80" height="6" rx="3" fill="#94A3B8"/><rect x="40" y="100" width="160" height="40" rx="8" fill="#1E40AF" opacity="0.6"/><rect x="260" y="40" width="380" height="120" rx="12" fill="#1E40AF" opacity="0.3"/><rect x="280" y="60" width="200" height="8" rx="4" fill="#60A5FA"/><rect x="280" y="80" width="340" height="60" rx="8" fill="#1E40AF" opacity="0.5"/><rect x="40" y="180" width="600" height="160" rx="12" fill="#1E40AF" opacity="0.25"/><rect x="60" y="200" width="100" height="8" rx="4" fill="#60A5FA"/><circle cx="110" cy="280" r="40" fill="#3B82F6" opacity="0.3"/><rect x="200" y="200" width="420" height="6" rx="3" fill="#475569"/><rect x="200" y="220" width="380" height="6" rx="3" fill="#334155"/><rect x="200" y="240" width="300" height="6" rx="3" fill="#334155"/><text x="340" y="300" text-anchor="middle" fill="#60A5FA" font-size="18" font-family="system-ui" font-weight="600">▶ Video Preview</text></svg>')}`,
      isVideo: true,
      duration: '2:34',
      likes: 124,
      comments: 12,
      views: '1.2K'
    },
    {
      id: 2,
      author: 'Sarah M.',
      avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="20" fill="#F472B6"/><text x="20" y="20" dominant-baseline="central" text-anchor="middle" fill="white" font-size="16" font-weight="700">SM</text></svg>')}`,
      time: 'Il y a 5 heures',
      text: 'Setup de la journée 💻',
      image: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="680" height="380" viewBox="0 0 680 380"><defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F8FAFC"/><stop offset="100%" stop-color="#E2E8F0"/></linearGradient></defs><rect width="680" height="380" fill="url(#bg2)"/><rect x="180" y="80" width="320" height="200" rx="12" fill="#CBD5E1"/><rect x="200" y="100" width="280" height="160" rx="8" fill="#1E293B"/><rect x="220" y="120" width="100" height="6" rx="3" fill="#60A5FA"/><rect x="220" y="136" width="240" height="4" rx="2" fill="#475569"/><rect x="220" y="150" width="200" height="4" rx="2" fill="#475569"/><rect x="220" y="164" width="160" height="4" rx="2" fill="#475569"/><rect x="220" y="190" width="60" height="20" rx="4" fill="#3B82F6"/><rect x="290" y="190" width="60" height="20" rx="4" fill="#1E40AF"/><rect x="280" y="290" width="120" height="8" rx="4" fill="#94A3B8"/><text x="340" y="340" text-anchor="middle" fill="#64748B" font-size="14" font-family="system-ui" font-weight="500">💻 Setup</text></svg>')}`,
      isVideo: false,
      likes: 342,
      comments: 45,
      views: '3.8K'
    },
  ]

  const ES_SUGGESTIONS = [
    { name: 'Mike T.', role: 'Designer UI', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="20" fill="#34D399"/><text x="20" y="20" dominant-baseline="central" text-anchor="middle" fill="white" font-size="16" font-weight="700">MT</text></svg>')}` },
    { name: 'Emma W.', role: 'DevOps', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="20" fill="#A78BFA"/><text x="20" y="20" dominant-baseline="central" text-anchor="middle" fill="white" font-size="16" font-weight="700">EW</text></svg>')}` },
  ]

  const ES_COMMENTS = [
    { author: 'Sarah M.', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="16" fill="#F472B6"/><text x="16" y="16" dominant-baseline="central" text-anchor="middle" fill="white" font-size="12" font-weight="700">SM</text></svg>')}`, text: 'Magnifique ! Hâte de voir le résultat final 🔥', time: 'il y a 1h', likes: 5 },
    { author: 'Mike T.', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="16" fill="#34D399"/><text x="16" y="16" dominant-baseline="central" text-anchor="middle" fill="white" font-size="12" font-weight="700">MT</text></svg>')}`, text: 'Super clean! Les animations sont fluides.', time: 'il y a 45min', likes: 3 },
    { author: 'Emma W.', avatar: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="16" fill="#A78BFA"/><text x="16" y="16" dominant-baseline="central" text-anchor="middle" fill="white" font-size="12" font-weight="700">EW</text></svg>')}`, text: 'Le pipeline CI/CD est prêt pour ça 💪', time: 'il y a 30min', likes: 2 },
  ]

  const openPostDetail = (post) => {
    setEsSelectedPost(post)
    setEsModal('detail')
  }

  return (
    <div className="es-wrapper">
      {/* LEFT SIDEBAR */}
      <aside className="es-sidebar">
        <div className="es-logo-area">
          <span className="es-logo-icon">✦</span>
          <h2>L'Éclat</h2>
        </div>

        <div className="es-sidebar-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '24px' }}>
          <img src={avatarSvg} alt="" className="es-avatar-sm" />
          <div>
            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>{displayName}</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>Développeur Fullstack</div>
          </div>
        </div>

        <nav className="es-nav">
          <button className={esNavActive === 'home' ? 'active' : ''} onClick={() => setEsNavActive('home')}><span className="es-nav-icon">🏠</span> Accueil</button>
          <button className={esNavActive === 'profil' ? 'active' : ''} onClick={() => setEsNavActive('profil')}><span className="es-nav-icon">👤</span> Profil</button>
          <button className={esNavActive === 'messages' ? 'active' : ''} onClick={() => setEsNavActive('messages')}><span className="es-nav-icon">💬</span> Messages <span className="es-badge">3</span></button>
          <button className={esNavActive === 'notifs' ? 'active' : ''} onClick={() => setEsNavActive('notifs')}><span className="es-nav-icon">🔔</span> Notifications</button>
          <button className={esNavActive === 'settings' ? 'active' : ''} onClick={() => setEsNavActive('settings')}><span className="es-nav-icon">⚙️</span> Paramètres</button>
        </nav>

        <div className="es-sidebar-bottom">
          <button className="es-return-btn" onClick={onReturn}>← Retourner au dashboard</button>
        </div>
      </aside>

      {/* MAIN FEED */}
      <main className="es-main">
        {/* Mobile Header */}
        <div className="es-mobile-header">
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>L'Éclat</h2>
          <div className="es-header-actions">
            <button onClick={onReturn} title="Retourner au dashboard">🚪</button>
            <button onClick={() => setEsModal('create')}>✏️</button>
          </div>
        </div>

        <div className="es-feed-container">
          {/* STORIES ROW */}
          <div className="es-stories-row">
            {ES_STORIES.map((s, i) => (
              <div key={i} className="es-story">
                <div className={`es-story-avatar${s.active ? ' active' : ''}`}>
                  <img src={s.avatar} alt={s.name} />
                  {s.isYou && <span className="es-story-add-icon">+</span>}
                </div>
                <span>{s.name}</span>
              </div>
            ))}
          </div>

          {/* QUICK CREATE */}
          <div className="es-quick-create" onClick={() => setEsModal('create')}>
            <img src={avatarSvg} alt="" className="es-avatar-sm" />
            <div className="es-quick-input">Quoi de neuf ?</div>
            <button className="es-publish-btn" style={{ fontSize: '13px' }}>Publier</button>
          </div>

          {/* POSTS */}
          <div className="es-posts">
            {ES_POSTS.map(post => (
              <article key={post.id} className="es-post">
                <div className="es-post-header">
                  <img src={post.avatar} alt={post.author} className="es-avatar-sm" />
                  <div className="es-post-meta">
                    <span className="es-post-author">{post.author}</span>
                    <span className="es-author-time">{post.time}</span>
                  </div>
                  <button className="es-post-options">⋮</button>
                </div>
                <div className="es-post-content" onClick={() => openPostDetail(post)}>
                  <p>{post.text}</p>
                  {post.isVideo ? (
                    <div className="es-video-preview">
                      <img src={post.image} alt="Video preview" className="es-post-image" />
                      <span className="es-play-icon">▶</span>
                      {post.duration && <span className="es-duration">{post.duration}</span>}
                    </div>
                  ) : (
                    <img src={post.image} alt="Post" className="es-post-image" />
                  )}
                </div>
                <div className="es-post-actions-bar">
                  <button>❤️ {post.likes}</button>
                  <button>💬 {post.comments}</button>
                  <button>➦ Partager</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="es-right-sidebar">
        <div className="es-search-bar">
          <span>🔍</span>
          <input placeholder="Rechercher..." />
        </div>

        <div className="es-suggestions-widget">
          <h3>Suggestions</h3>
          {ES_SUGGESTIONS.map((s, i) => (
            <div key={i} className="es-suggestion">
              <img src={s.avatar} alt={s.name} className="es-avatar-sm" />
              <div className="es-suggestion-info">
                <span className="es-sugg-name">{s.name}</span>
                <span className="es-sugg-mutual">{s.role}</span>
              </div>
              <button className="es-sugg-add">+</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '16px', color: '#0F172A', margin: '0 0 16px 0' }}>Tendances</h3>
          {['#WebDevelopment', '#ReactJS', '#UIUX'].map((tag, i) => (
            <div key={i} style={{ padding: '8px 0', color: '#2563EB', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>{tag}</div>
          ))}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="es-bottom-nav">
        <button className={esNavActive === 'home' ? 'active' : ''} onClick={() => setEsNavActive('home')}>
          <span className="es-nav-icon">🏠</span>
          <span className="es-nav-label">Accueil</span>
        </button>
        <button className={esNavActive === 'search' ? 'active' : ''} onClick={() => setEsNavActive('search')}>
          <span className="es-nav-icon">🔍</span>
          <span className="es-nav-label">Explorer</span>
        </button>
        <button className="es-nav-publish" onClick={() => setEsModal('create')}>
          <span className="es-nav-icon">+</span>
          <span className="es-nav-label">Publier</span>
        </button>
        <button className={esNavActive === 'notifs' ? 'active' : ''} onClick={() => setEsNavActive('notifs')}>
          <span className="es-nav-icon">🔔</span>
          <span className="es-nav-label">Notifs</span>
        </button>
        <button className={esNavActive === 'profil' ? 'active' : ''} onClick={() => setEsNavActive('profil')}>
          <span className="es-nav-icon">👤</span>
          <span className="es-nav-label">Profil</span>
        </button>
      </nav>

      {/* CREATE POST MODAL */}
      {esModal === 'create' && (
        <div className="es-modal-overlay" onClick={() => setEsModal(null)}>
          <div className="es-create-modal" onClick={e => e.stopPropagation()}>
            <div className="es-modal-header">
              <button className="es-close-btn" onClick={() => setEsModal(null)}>✕</button>
              <h3>Créer une publication</h3>
              <button className="es-publish-btn">Publier</button>
            </div>
            <div className="es-create-tabs">
              <button className="active">📷 Image</button>
              <button>🎬 Vidéo</button>
              <button>📝 Texte</button>
            </div>
            <div className="es-create-media-area">
              <div className="es-upload-placeholder">
                <span className="es-upload-icon">📁</span>
                <p>Glissez vos fichiers ici ou cliquez pour parcourir</p>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>JPG, PNG, MP4 · Max 50 Mo</span>
              </div>
            </div>
            <div className="es-create-input-area">
              <div className="es-post-author-row">
                <img src={avatarSvg} alt="" className="es-avatar-sm" />
                <div className="es-author-info">
                  <span className="es-author-name">{displayName}</span>
                  <span className="es-author-visibility">🌍 Tout le monde</span>
                </div>
              </div>
              <textarea placeholder="Quoi de neuf ?" rows={3}></textarea>
            </div>
            <div className="es-create-options">
              <button>📍 Ajouter un lieu <span>›</span></button>
              <button>🏷️ Taguer des personnes <span>›</span></button>
              <button>😊 Humeur / Activité <span>›</span></button>
            </div>
          </div>
        </div>
      )}

      {/* POST DETAIL MODAL */}
      {esModal === 'detail' && esSelectedPost && (
        <div className="es-modal-overlay" onClick={() => { setEsModal(null); setEsSelectedPost(null) }}>
          <div className="es-post-modal" onClick={e => e.stopPropagation()}>
            <div className="es-modal-header">
              <button className="es-back-btn" onClick={() => { setEsModal(null); setEsSelectedPost(null) }}>← Retour</button>
              <h3>{esSelectedPost.author}</h3>
              <button className="es-more-btn">⋮</button>
            </div>
            <div className="es-modal-content">
              {/* LEFT: MEDIA */}
              <div className="es-modal-media">
                <div className="es-post-header" style={{ padding: '0 0 16px 0' }}>
                  <img src={esSelectedPost.avatar} alt="" className="es-avatar-sm" />
                  <div className="es-post-meta">
                    <span className="es-post-author">{esSelectedPost.author}</span>
                    <span className="es-author-time">{esSelectedPost.time}</span>
                  </div>
                  <button className="es-follow-btn-sm">Suivre</button>
                </div>
                <p className="es-post-caption">{esSelectedPost.text}</p>
                <div className="es-video-container">
                  <img src={esSelectedPost.image} alt="" className="es-media-img" />
                  {esSelectedPost.isVideo && <span className="es-play-icon-large">▶</span>}
                  <span className="es-views-badge">👁️ {esSelectedPost.views} vues</span>
                </div>
                <div className="es-post-actions-bar" style={{ borderTop: 'none', padding: '16px 0' }}>
                  <button>❤️ {esSelectedPost.likes}</button>
                  <button>💬 {esSelectedPost.comments}</button>
                  <button>➦ Partager</button>
                  <button className="es-save-btn">🔖</button>
                </div>
                <div className="es-likes-summary">
                  <div className="es-avatar-stack">
                    {ES_COMMENTS.slice(0, 3).map((c, i) => (
                      <img key={i} src={c.avatar} alt="" />
                    ))}
                  </div>
                  <span>Aimé par <b>Sarah M.</b> et <b>{esSelectedPost.likes - 1} autres</b></span>
                </div>
              </div>

              {/* RIGHT: COMMENTS */}
              <div className="es-modal-comments">
                <div className="es-comments-header">
                  <h4>Commentaires ({ES_COMMENTS.length})</h4>
                  <span>Les plus récents ▾</span>
                </div>
                <div className="es-comments-list">
                  {ES_COMMENTS.map((c, i) => (
                    <div key={i} className="es-comment">
                      <img src={c.avatar} alt="" className="es-comment-avatar" />
                      <div>
                        <div className="es-comment-body">
                          <span className="es-comment-author">{c.author}</span>
                          <p>{c.text}</p>
                        </div>
                        <div className="es-comment-actions">
                          <span>{c.time}</span>
                          <button>❤️ {c.likes}</button>
                          <button>Répondre</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="es-comment-input-area">
                  <img src={avatarSvg} alt="" className="es-comment-avatar" />
                  <input placeholder="Écrire un commentaire..." />
                  <button className="es-send-btn">➤</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DashboardShell({ user, role, onLogout }) {
  const [activeKey, setActiveKey] = useState('dashboard')
  const [subKey, setSubKey] = useState(null)
  const [registeredChildren, setRegisteredChildren] = useState([])
  const [selectedRegChild, setSelectedRegChild] = useState(null)
  const [editingChild, setEditingChild] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [profileImg, setProfileImg] = useState(localStorage.getItem('cdo_profile_img') || null)
  const uidRef = useRef(genChildUid())
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
  const [theme, setTheme] = useState(localStorage.getItem('cdo_theme') || 'dark')
  const [orphanageName, setOrphanageName] = useState(localStorage.getItem('cdo_orphanage_name') || '')
  const [bgTheme, setBgTheme] = useState(localStorage.getItem('cdo_bg') || '')

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
        { label: 'Vaccinations', type: 'textarea' },
        { label: 'Allergies', type: 'textarea' },
        { label: 'Traitements', type: 'textarea' },
      ]
    },
    'Scolarité': {
      title: 'Scolarité',
      fields: [
        { label: 'Établissement', type: 'text' },
        { label: 'Classe', type: 'text' },
        { label: 'Résultats', type: 'textarea' },
        { label: 'Bulletins', type: 'file' },
      ]
    },
  }

  if (activeKey === 'communication') {
    return <EclatSocialApp user={user} onReturn={() => { setActiveKey('dashboard'); setSubKey(null) }} />
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
                onClick={() => { setActiveKey(item.key); setSubKey(null); setEditingChild(null); }}
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

        <main className="dash-main">
          {activeKey === 'dashboard' ? (
            <div className="dash-features-grid">
              <div className="dash-title-bar" style={{ marginBottom: '24px' }}>
                <div>
                  <h2 className="dash-page-title">{t('page_' + role + '_' + activeKey.replace(/-/g, '_') + '_title') || page?.title || 'Tableau de bord'}</h2>
                  <p className="dash-page-subtitle">{t('page_' + role + '_' + activeKey.replace(/-/g, '_') + '_sub') || page?.subtitle}</p>
                </div>
                <button className="dash-export-btn">{'\u{1F4E4}'} {t('dash_export')}</button>
              </div>
              <div className="dash-stat-row">
                {statCards.map((card, i) => (
                  <div key={i} className="dash-stat-card" style={{ '--card-color': card.color }}>
                    <span className="dash-stat-card-value">{card.value}</span>
                    <div className="dash-stat-card-info">
                      <span className="dash-stat-card-label">{t('stat_' + role + '_' + i + '_label') || card.label}</span>
                      <span className="dash-stat-card-sub" style={{ color: card.color }}>{t('stat_' + role + '_' + i + '_sub') || card.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dash-section-header" style={{ marginBottom: '16px' }}>
                <span className="dash-section-title">{t('dash_quick_access')}</span>
              </div>
              <div className="dash-grid-cards">
                {navItems.filter(n => n.key !== 'dashboard' && n.key !== 'parametres').map((item, i) => {
                  const color = statCards[i]?.color || '#f59e0b'
                  return (
                    <div key={item.key} className="dash-stat-card" style={{ '--card-color': color, cursor: 'pointer' }} onClick={() => { setActiveKey(item.key); setSubKey(null); setEditingChild(null); }}>
                      <h3 className="dash-stat-card-label" style={{ fontSize: '14px', marginBottom: '8px' }}>{(t('nav_' + item.key.replace(/-/g, '_')) || item.label).toUpperCase()}</h3>
                      <p className="dash-stat-card-sub">{t('dash_access_to')} {(t('nav_' + item.key.replace(/-/g, '_')) || item.label).toLowerCase()}</p>
                    </div>
                  )
                })}
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

                {subKey === 'Profil' && activeKey === 'parametres' ? (
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
                ) : subKey && activeKey === 'enfants' ? (
                  <div className="dash-sub-form">
                    <div className="dash-sub-form-top">
                      <button className="dash-back-btn" onClick={() => { setSubKey(null); }}>{'\u2190'} {t('form_back')}</button>
                      <h3 className="dash-sub-form-title">{subKey}</h3>
                    </div>
                    <div className="dash-sub-form-fields">
                      {CHILD_FORMS[subKey]?.fields.map((f, i) => (
                        <div key={i} className="dash-form-field">
                          <label className="dash-form-label">{f.label}</label>
                          {f.type === 'uid' ? (
                            <input type="text" className="dash-form-input dash-form-uid" value={editingChild ? editingChild.uid : uidRef.current} readOnly />
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
                                      const uid = editingChild ? editingChild.uid : uidRef.current
                                      localStorage.setItem('cdo_child_photo_' + uid, ev.target.result)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }} />
                                {(() => {
                                  const uid = editingChild ? editingChild.uid : uidRef.current
                                  const saved = localStorage.getItem('cdo_child_photo_' + uid)
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
                      ))}
                      <button className="dash-form-save" onClick={async () => {
                        const data = {}
                        document.querySelectorAll('.dash-sub-form .dash-form-field').forEach(field => {
                          const label = field.querySelector('.dash-form-label')?.textContent || ''
                          const input = field.querySelector('input, select, textarea')
                          if (input) data[label] = input.value || input.files?.[0]?.name || ''
                        })
                        if (!Object.keys(data).length) return

                        const uid = editingChild ? editingChild.uid : uidRef.current

                        const body = {
                          uid: uid,
                          nom: data['Nom'] !== undefined ? data['Nom'] : (editingChild ? editingChild.nom : ''),
                          prenom: data['Prénom'] !== undefined ? data['Prénom'] : (editingChild ? editingChild.prenom : ''),
                          sexe: data['Sexe'] !== undefined ? (data['Sexe'] === 'Masculin' ? 'M' : data['Sexe'] === 'Féminin' ? 'F' : '') : (editingChild ? editingChild.sexe : ''),
                          date_naissance: data['Date de naissance'] !== undefined ? (data['Date de naissance'] || null) : (editingChild ? editingChild.date_naissance : null),
                          nationalite: data['Nationalité'] !== undefined ? data['Nationalité'] : (editingChild ? editingChild.nationalite : ''),
                          adresse: data["Adresse d'origine"] !== undefined ? data["Adresse d'origine"] : (editingChild ? editingChild.adresse : ''),
                          photo: localStorage.getItem('cdo_child_photo_' + uid) || (editingChild ? editingChild.photo : ''),
                          extra_data: editingChild ? { ...editingChild.extra_data, ...data } : data,
                        }

                        let url = `${API}/enfants/`
                        let method = 'POST'
                        if (editingChild) {
                          url = `${API}/enfants/${editingChild.id}/`
                          method = 'PUT'
                        }

                        let token = localStorage.getItem('access_token')
                        if (!token) { alert('Session expirée'); return }
                        try {
                          let res = await fetch(url, {
                            method: method,
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify(body),
                          })
                          if (res.status === 401) {
                            const refresh = localStorage.getItem('refresh_token')
                            if (!refresh) throw new Error('Session expirée')
                            const refRes = await fetch(`${API}/token/refresh/`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ refresh }),
                            })
                            if (!refRes.ok) throw new Error('Session expirée')
                            const tokens = await refRes.json()
                            localStorage.setItem('access_token', tokens.access)
                            res = await fetch(url, {
                              method: method,
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access}` },
                              body: JSON.stringify(body),
                            })
                          }
                          if (!res.ok) {
                            const errData = await res.json().catch(() => ({}))
                            const errMsg = errData.error || Object.values(errData).flat().join(' ') || 'Erreur sauvegarde'
                            throw new Error(errMsg)
                          }
                          const saved = await res.json()
                          setRegisteredChildren(prev => {
                            if (prev.some(c => c.id === saved.id)) {
                              return prev.map(c => c.id === saved.id ? saved : c)
                            }
                            return [...prev, saved]
                          })
                          setSubKey(null)
                          setEditingChild(saved)
                          uidRef.current = saved.uid
                        } catch (e) {
                          if (method === 'POST' && e.message && e.message.includes('dupliquée')) {
                            uidRef.current = genChildUid()
                            body.uid = uidRef.current
                            try {
                              let retry = await fetch(`${API}/enfants/`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                                body: JSON.stringify(body),
                              })
                              if (retry.ok) {
                                const saved = await retry.json()
                                setRegisteredChildren(prev => [...prev, saved])
                                setSubKey(null)
                                setEditingChild(saved)
                                uidRef.current = saved.uid
                                return
                              }
                            } catch (_) {}
                          }
                          alert(e.message || 'Erreur lors de l\'enregistrement')
                        }
                      }}>Enregistrer</button>
                    </div>
                  </div>
                ) : activeKey === 'enfants-enregistres' ? (
                  <div className="dash-content-grid">
                    <div className="dash-content-left">
                      {selectedRegChild ? (
                        <div className="dash-sub-form">
                          <div className="dash-sub-form-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <button className="dash-back-btn" onClick={() => setSelectedRegChild(null)}>{'\u2190'} {t('form_back')}</button>
                              <h3 className="dash-sub-form-title" style={{ margin: 0 }}>{selectedRegChild.prenom || ''} {selectedRegChild.nom || ''}</h3>
                            </div>
                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                              {selectedRegChild.created_at ? new Date(selectedRegChild.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + t('form_at') + ' ' + new Date(selectedRegChild.created_at).toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <button className="dash-form-delete" style={{ margin: 0, padding: '6px 16px', fontSize: '14px' }} onClick={() => setDeleteConfirm(selectedRegChild)}>Effacer</button>
                          </div>
                          <div className="dash-reg-child-detail">
                            <div className="dash-reg-child-detail-header">
                              <div className="dash-reg-child-detail-avatar">
                                <img src={(() => {
                                  const localPhoto = localStorage.getItem('cdo_child_photo_' + selectedRegChild.uid)
                                  if (localPhoto) return localPhoto
                                  const src = selectedRegChild.photo
                                  if (src && src.startsWith('http')) return src
                                  const childColors = ['#f59e0b','#22c55e','#a855f7','#3b82f6','#ef4444','#ec4899','#14b8a6','#f97316']
                                  const cc = childColors[(selectedRegChild.prenom?.charCodeAt(0) || 0) % childColors.length]
                                  const inits = (selectedRegChild.prenom?.[0] || selectedRegChild.nom?.[0] || '?').toUpperCase()
                                  return svgUrl(inits, cc, 72, 72)
                                })()} alt="" />
                              </div>
                              <div className="dash-reg-child-detail-id">
                                <span className="dash-reg-child-detail-label">UID</span>
                                <span className="dash-reg-child-detail-value">{selectedRegChild.uid}</span>
                              </div>
                            </div>
                            <div className="dash-reg-child-detail-groups">
                              {Object.values(CHILD_FORMS).map(section => {
                                const cv = (label) => {
                                  if (label === 'Nom') return selectedRegChild.nom
                                  if (label === 'Prénom') return selectedRegChild.prenom
                                  if (label === 'Sexe') return selectedRegChild.sexe === 'M' ? 'Masculin' : selectedRegChild.sexe === 'F' ? 'Féminin' : null
                                  if (label === 'Date de naissance') return selectedRegChild.date_naissance
                                  if (label === 'Nationalité') return selectedRegChild.nationalite
                                  if (label === "Adresse d'origine") return selectedRegChild.adresse
                                  return selectedRegChild.extra_data?.[label]
                                }
                                const fields = section.fields.filter(f => f.label !== 'Numéro unique' && f.label !== 'Photo' && cv(f.label))
                                if (!fields.length) return null
                                return (
                                  <div key={section.title} className="dash-reg-child-detail-group">
                                    <div className="dash-reg-child-detail-group-title">
                                      <span>{section.title}</span>
                                      <select className="dash-group-select" onChange={(e) => {
                                        if (e.target.value === 'edit') {
                                          setEditingChild(selectedRegChild)
                                          setActiveKey('enfants')
                                          setSubKey(section.title)
                                          setSelectedRegChild(null)
                                        }
                                        e.target.value = ''
                                      }}>
                                        <option value="">Actions...</option>
                                        <option value="edit">Modifier</option>
                                      </select>
                                    </div>
                                    <div className="dash-reg-child-detail-group-fields">
                                      {fields.map(f => (
                                        <div key={f.label} className="dash-reg-child-detail-row">
                                          <span className="dash-reg-child-detail-row-label">{f.label}</span>
                                          <span className="dash-reg-child-detail-row-value">{cv(f.label)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="dash-group-actions">
                                      <label className="dash-group-checkbox-label">
                                        <input type="checkbox" className="dash-group-checkbox" />
                                        <span>Sélectionner</span>
                                      </label>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      ) : registeredChildren.length === 0 ? (
                        <div className="dash-empty-state">
                          <span className="dash-empty-icon">{'\u{1F466}'}</span>
                          <p className="dash-empty-text">Aucun enfant enregistré pour le moment.</p>
                          <p className="dash-empty-hint">Remplissez le formulaire dans "Gestion des enfants" pour ajouter un enfant.</p>
                        </div>
                      ) : (
                        <div className="dash-reg-child-list">
                          {registeredChildren.map(child => {
                            const childColors = ['#f59e0b','#22c55e','#a855f7','#3b82f6','#ef4444','#ec4899','#14b8a6','#f97316']
                            const cc = childColors[(child.prenom?.charCodeAt(0) || 0) % childColors.length]
                            const initial = (child.prenom?.[0] || child.nom?.[0] || '?').toUpperCase()
                            return (
                            <div key={child.uid} className="dash-reg-child-item" onClick={() => setSelectedRegChild(child)}>
                              <div className="dash-reg-child-item-avatar">
                                <img src={(() => {
                                  const localPhoto = localStorage.getItem('cdo_child_photo_' + child.uid)
                                  if (localPhoto) return localPhoto
                                  if (child.photo?.startsWith('http')) return child.photo
                                  return svgUrl(initial, cc, 48, 48)
                                })()} alt="" />
                              </div>
                              <div className="dash-reg-child-item-info">
                                <span className="dash-reg-child-item-name">{child.prenom || ''} {child.nom || ''}</span>
                                <span className="dash-reg-child-item-id">UID: {child.uid}</span>
                              </div>
                              <span className="dash-reg-child-item-arrow">{'\u203A'}</span>
                            </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
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
                          <span>{countryFlag(user.country || 'CD')} {countryName(user.country || 'CD')}</span>
                          <span>Directeur: {user.first_name} {user.last_name}</span>
                          <span>ID: {user.id}</span>
                        </div>
                      </div>
                    </div>
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
                ) : (
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
                )}
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
            {AFRICAN_COUNTRIES.map(c => <option key={c.code} value={c.code}>{countryFlag(c.code)} {c.name}</option>)}
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
