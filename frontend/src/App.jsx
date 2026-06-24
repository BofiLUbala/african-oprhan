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
    const rolesWithDashboard = ['director', 'ambassador', 'supermaster', 'federation', 'partner']
    if (rolesWithDashboard.includes(roleLower)) {
      return (
        <LangProvider>
          <div className="app">
            <DashboardHeader user={user} roleLower={roleLower} roleLabel={ROLES.find(r => r.value === roleLower)?.label || roleLower} activeKey={activeKey} subKey={subKey} setActiveKey={setActiveKey} setSubKey={setSubKey} />
            <main><DashboardShell user={user} role={roleLower} onLogout={logout} activeKey={activeKey} setActiveKey={setActiveKey} subKey={subKey} setSubKey={setSubKey} /></main>
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

function DashboardHeader({ user, roleLower, roleLabel, activeKey, subKey, setActiveKey, setSubKey }) {
  const { t, lang, setLang } = useTranslation()
  const [time, setTime] = useState(new Date())
  const [profileImg, setProfileImg] = useState(localStorage.getItem('cdo_profile_img') || null)
  const [localOrpName, setLocalOrpName] = useState(localStorage.getItem('cdo_orphanage_name') || '')
  const [notifCount] = useState(3)
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

  const NOTIFS = [
    { icon: '📋', text: t('dash_notif_new_report'), time: t('dash_notif_5min') },
    { icon: '👤', text: t('dash_notif_profile_updated'), time: t('dash_notif_20min') },
    { icon: '✅', text: t('dash_notif_approved'), time: t('dash_notif_1h') },
  ]

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
                  <div className="hd-dropdown-header">{t('dash_notifications')}</div>
                  {NOTIFS.map((n, i) => (
                    <div key={i} className="hd-dropdown-item">
                      <span className="hd-dropdown-icon">{n.icon}</span>
                      <div className="hd-dropdown-body">
                        <div className="hd-dropdown-text">{n.text}</div>
                        <div className="hd-dropdown-time">{n.time}</div>
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

function DashboardShell({ user, role, onLogout, activeKey, setActiveKey, subKey, setSubKey }) {
  const [registeredChildren, setRegisteredChildren] = useState([])
  const [selectedRegChild, setSelectedRegChild] = useState(null)
  const [editingChild, setEditingChild] = useState(null)
  const [childSearchQuery, setChildSearchQuery] = useState('')
  const [childGenderFilter, setChildGenderFilter] = useState('')
  const [childSortBy, setChildSortBy] = useState('date')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [profileImg, setProfileImg] = useState(localStorage.getItem('cdo_profile_img') || null)
  const uidRef = useRef(genChildUid())
  const [dashTime, setDashTime] = useState(new Date())

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
    if (activeKey !== 'projets') return
    setProjectLoading(true)
    const token = localStorage.getItem('access_token')
    fetch(`${API}/projets/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setProjects(Array.isArray(data) ? data : data?.results || MOCK_PROJECTS)
        setProjectLoading(false)
      })
      .catch(() => { setProjects(MOCK_PROJECTS); setProjectLoading(false) })
  }, [activeKey])

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
                  return (
                    <div key={i} className="dash-dash-kpi">
                      <div className="dash-dash-kpi-icon" style={{ background: `rgba(${i === 3 ? '239,68,68' : i === 1 ? '168,85,247' : i === 2 ? '59,130,246' : i === 4 ? '34,197,94' : '245,158,11'},0.1)` }}>{kpiIcons[i % kpiIcons.length]}</div>
                      <div className="dash-dash-kpi-body">
                        <span className="dash-dash-kpi-label">{t('stat_' + role + '_' + i + '_label') || card.label}</span>
                        <span className="dash-dash-kpi-value">{card.value}</span>
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
                                <select id="prof-nationalite" className="dash-prof-input" defaultValue={getFieldValue('Nationalité')} onChange={() => updateProfCompletion()}>
                                  <option value="">{t('form_select_placeholder') || 'Sélectionner...'}</option>
                                  {AFRICAN_COUNTRIES.map((c, ci) => <option key={ci} value={c.name}>{c.name}</option>)}
                                </select>
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
                              if (hasPhoto) {
                                const fd = new FormData()
                                fd.append('uid', uid)
                                fd.append('nom', nom)
                                fd.append('prenom', prenom)
                                fd.append('sexe', sexe === 'Masculin' ? 'M' : sexe === 'Féminin' ? 'F' : '')
                                fd.append('date_naissance', dateNaiss || '')
                                fd.append('nationalite', nationalite)
                                fd.append('adresse', adresse)
                                fd.append('photo', dataToFile(photoData, 'photo.jpg'))
                                if (editingChild) fd.append('extra_data', JSON.stringify(editingChild.extra_data || {}))
                                body = fd
                                headers = { Authorization: `Bearer ${token}` }
                              } else {
                                body = JSON.stringify({
                                  uid, nom, prenom,
                                  sexe: sexe === 'Masculin' ? 'M' : sexe === 'Féminin' ? 'F' : '',
                                  date_naissance: dateNaiss || null,
                                  nationalite, adresse,
                                  photo: editingChild ? editingChild.photo : null,
                                  extra_data: editingChild ? { ...editingChild.extra_data } : {},
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
                                setSubKey(null)
                                setEditingChild(saved)
                                uidRef.current = saved.uid
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
                                      setSubKey(null); setEditingChild(saved); uidRef.current = saved.uid
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
                          <div className="dash-prof-id-avatar">
                            {(() => {
                              const uid = editingChild ? editingChild.uid : uidRef.current
                              const saved = localStorage.getItem('cdo_child_photo_' + uid)
                              if (saved) return <img src={saved} alt="" className="dash-prof-id-img" />
                              const inits = ((getFieldValue('Prénom')?.[0] || '') + (getFieldValue('Nom')?.[0] || '')).toUpperCase() || '?'
                              const colors = ['#f59e0b','#22c55e','#a855f7','#3b82f6','#ef4444','#ec4899','#14b8a6']
                              const c = colors[(inits.charCodeAt(0) || 0) % colors.length]
                              return <div className="dash-prof-id-inits" style={{ background: c }}>{inits}</div>
                            })()}
                            <span className="dash-prof-id-badge">{'\u2713'} {t('prof_active') || 'Profil Actif'}</span>
                          </div>
                          <div className="dash-prof-id-body">
                            <h3 className="dash-prof-id-name">{getFieldValue('Prénom') || 'Prénom'} {getFieldValue('Nom') || 'Nom'}</h3>
                            <div className="dash-prof-id-field">
                              <span className="dash-prof-id-label">{t('form_unique_id') || 'ID Unique'}</span>
                              <span className="dash-prof-id-value">{editingChild ? editingChild.uid : uidRef.current}</span>
                            </div>
                            <div className="dash-prof-id-field">
                              <span className="dash-prof-id-label">{t('form_nationality') || 'Nationalité'}</span>
                              <span className="dash-prof-id-value">{(() => {
                                const nat = getFieldValue('Nationalité')
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
                            setSubKey(null); setEditingChild(saved); uidRef.current = saved.uid
                          } catch (e) {
                            if (method === 'POST' && e.message?.includes('dupliquée')) {
                              uidRef.current = genChildUid(); body.uid = uidRef.current
                              try {
                                let retry = await fetch(`${API}/enfants/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` }, body: JSON.stringify(body) })
                                if (retry.ok) { const saved = await retry.json(); setRegisteredChildren(prev => [...prev, saved]); if (btn) btn.classList.remove('dash-fam-btn-loading'); setSubKey(null); setEditingChild(saved); uidRef.current = saved.uid; return }
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
                          setEditingChild(saved); uidRef.current = saved.uid
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
                            setSubKey(null)
                            setEditingChild(saved)
                            uidRef.current = saved.uid
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

                            {/* ── HISTORY TAB ── */}
                            {profileTab === 'history' && (
                              <div className="pd-card">
                                <div className="pd-card-header"><div className="pd-card-icon" style={{background:'rgba(139,92,246,0.15)'}}>📜</div><span className="pd-card-title">{t('pd_history') || 'Historique'}</span></div>
                                <div className="pd-card-body">
                                  <div className="pd-timeline">
                                    {[
                                      { icon:'✅', text: t('pd_registered') || 'Enfant enregistré dans le système', time: selectedRegChild.created_at ? new Date(selectedRegChild.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—', color:'blue' },
                                      { icon:'📄', text: t('pd_docs_added') || 'Documents administratifs ajoutés', time: selectedRegChild.updated_at ? new Date(selectedRegChild.updated_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—', color:'amber' },
                                    ].concat(
                                      selectedRegChild.extra_data?.medical?.vaccinations?.filter(v => v.done).map(v => ({ icon:'💉', text: `Vaccin ${v.name} administré`, time: v.dateAdmin || '—', color:'green' })) || [],
                                      selectedRegChild.extra_data?.education?.subjects?.filter(s => s.grade).map(s => ({ icon:'📊', text: `Note en ${s.name} : ${s.grade}/20`, time: '—', color:'purple' })) || [],
                                    ).filter(Boolean).map((event, i) => (
                                      <div key={i} className="pd-tl-item">
                                        <div className={`pd-tl-dot ${event.color}`}>{event.icon}</div>
                                        <div className="pd-tl-content">
                                          <div className="pd-tl-text">{event.text}</div>
                                          <div className="pd-tl-time">{event.time}</div>
                                        </div>
                                      </div>
                                    ))}
                                    {(!selectedRegChild.created_at && !selectedRegChild.extra_data?.medical?.vaccinations?.length) && <div style={{fontSize:'12px',color:'#64748B',textAlign:'center',padding:'16px 0'}}>{t('pd_no_history') || 'Aucun historique disponible'}</div>}
                                  </div>
                                </div>
                              </div>
                            )}
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
                        <div className="dash-category-cards" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                          {PROJECT_TYPES.map(pt => (
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
