import { useState, useEffect, useRef } from 'react'
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

const ROLES = [
  { value: 'ambassador', label: 'Ambassadeur' },
  { value: 'supermaster', label: 'Super Master' },
  { value: 'partner', label: 'Partenaire' },
  { value: 'director', label: "Chef d'orphelinat" },
]

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

  if (user && user.role === 'director') {
    return (
      <div className="app">
        <DirectorHeader user={user} onLogout={logout} />
        <main><DirectorDashboard user={user} /></main>
      </div>
    )
  }

  return (
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
  )
}

function Header({ onLoginClick, onSignupClick, onVirtualAssist }) {
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
          <span className="logo-icon">&#x2726;</span>
          <span className="logo-text">Confédération<span className="accent"> des Orphelinats</span></span>
        </a>
        <nav className={`nav${menuOpen ? ' open' : ''}`}>
          <a href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('hero') }}>Accueil</a>
          <a href="#profiles" onClick={(e) => { e.preventDefault(); scrollTo('profiles') }}>Profils</a>
          <a href="#support" onClick={(e) => { e.preventDefault(); scrollTo('support') }}>Soutenir</a>
          <a href="#stats" onClick={(e) => { e.preventDefault(); scrollTo('stats') }}>Statistiques</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact') }}>Contact</a>
        </nav>
        <div className="header-actions">
          <button className="btn btn-ghost-sm" onClick={onVirtualAssist} title="Assistant virtuel">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Assistance
          </button>
          <button className="btn btn-outline" onClick={onLoginClick}>Login</button>
          <button className="btn btn-primary" onClick={onSignupClick}>Sign Up</button>
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
  { name: 'Aminata', age: 7, country: 'Sénégal', color: '#f59e0b', img: svgUrl('A', '#f59e0b', 500, 600) },
  { name: 'Kofi', age: 10, country: 'Ghana', color: '#22c55e', img: svgUrl('K', '#22c55e', 500, 600) },
  { name: 'Zara', age: 6, country: 'Éthiopie', color: '#a855f7', img: svgUrl('Z', '#a855f7', 500, 600) },
  { name: 'Moussa', age: 12, country: 'Mali', color: '#3b82f6', img: svgUrl('M', '#3b82f6', 500, 600) },
  { name: 'Fatou', age: 8, country: 'RDC', color: '#ef4444', img: svgUrl('F', '#ef4444', 500, 600) },
]

function Hero() {
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
                      <span className="hero-slide-age">{y.age} ans &middot; {y.country}</span>
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
              <span>1 240+ enfants aidés dans 12 pays</span>
            </div>
          </div>
        </div>
        <div className="hero-text">
          <span className="hero-tagline">ENSEMBLE POUR EUX</span>
          <h1>Chaque enfant mérite <span className="accent">un avenir</span></h1>
          <p>Nous œuvrons à travers l'Afrique pour offrir un toit, une éducation et de l'amour aux orphelins. Votre soutien transforme des vies.</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}>
              Soutenir maintenant
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => document.getElementById('profiles')?.scrollIntoView({ behavior: 'smooth' })}>
              Voir les profils &rarr;
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
            <span className="section-tag">DÉCOUVREZ</span>
            <h2>Chaque visage a une <span className="accent">histoire</span></h2>
            <p>Parcourez les profils des enfants de nos différents centres. Lisez leur histoire, voyez leurs sourires et devenez le héros de leur vie.</p>
            <button className="btn btn-primary btn-xl">Voir les profils des orphelins &nbsp;&#x2192;</button>
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
  const [activePill, setActivePill] = useState(1)
  const pills = ['15 €', '30 €', '50 €', '100 €']

  return (
    <section className="support" id="support">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">AGISSEZ</span>
          <h2>Comment <span className="accent">nous aider</span></h2>
        </div>
        <div className="support-grid">
          <div className="support-card join">
            <div className="support-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <h3>Rejoignez-nous</h3>
            <p>Devenez bénévole dans nos centres à travers l'Afrique. Donnez de votre temps, partagez vos compétences.</p>
            <ul className="support-list">
              <li><span className="check-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span> Missions de 2 semaines à 6 mois</li>
              <li><span className="check-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span> Enseignement & animation</li>
              <li><span className="check-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span> Aide médicale & psychologique</li>
            </ul>
            <button className="btn btn-outline btn-block">Rejoindre l'équipe</button>
          </div>
          <div className="support-card donate">
            <div className="support-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="#ef4444">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3>Supportez-nous</h3>
            <p>Chaque don compte. 100% des fonds vont directement aux enfants : nourriture, éducation, soins.</p>
            <div className="donate-pills">
              {pills.map((p, i) => (
                <span key={i} className={`pill${i === activePill ? ' active' : ''}`} onClick={() => setActivePill(i)}>
                  {p}
                </span>
              ))}
            </div>
            <button className="btn btn-primary btn-block">Faire un don</button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stats() {
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
    { name: 'Rép. Dém. Congo', count: 342, pct: 85 },
    { name: 'Côte d\'Ivoire', count: 218, pct: 55 },
    { name: 'Cameroun', count: 307, pct: 77 },
    { name: 'Sénégal', count: 195, pct: 49 },
    { name: 'Burkina Faso', count: 178, pct: 45 },
    { name: 'Madagascar', count: 412, pct: 100 },
  ]

  return (
    <section className="stats" id="stats" ref={statsRef}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">IMPACT</span>
          <h2>Enfants pris en charge <span className="accent">par pays</span></h2>
        </div>
        <div className="stats-row">
          {countries.map((c, i) => (
            <div key={i} className="stat-item">
              <span className="stat-number">{c.count}</span>
              <span className="stat-label">{c.name}</span>
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
  return (
    <section className="contact" id="contact">
      <div className="contact-grid container">
        <div className="contact-form-area">
          <span className="section-tag">CONTACT</span>
          <h2>Écrivez-<span className="accent">nous</span></h2>
          <form className="contact-form" onSubmit={e => e.preventDefault()}>
            <div className="form-row">
              <input type="text" placeholder="Votre nom" required />
              <input type="email" placeholder="Votre email" required />
            </div>
            <input type="text" placeholder="Sujet" />
            <textarea placeholder="Votre message..." rows={5} />
            <button type="submit" className="btn btn-primary">Envoyer le message</button>
          </form>
        </div>
        <div className="social-area">
          <span className="section-tag">SUIVEZ-NOUS</span>
          <h2>Réseaux <span className="accent">sociaux</span></h2>
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

/* ===== DIRECTOR DASHBOARD ===== */
const TASKS = [
  {
    icon: '\u{1F465}', title: 'Gestion des enfants',
    desc: 'Inscription, suivi et répartition des enfants dans l\'orphelinat.',
    items: ['Ajouter un enfant', 'Liste des enfants', 'Répartition par classe d\'âge', 'Transfert entre orphelinats'],
  },
  {
    icon: '\u{1F4E2}', title: 'Publication des besoins',
    desc: 'Lancer des appels aux dons, signaler les urgences et besoins matériels.',
    items: ['Publier un besoin urgent', 'Campagne de collecte', 'État des dons reçus', 'Historique des publications'],
  },
  {
    icon: '\u{1F4C4}', title: 'Gestion des documents',
    desc: 'Archiver les actes de naissance, rapports médicaux et documents administratifs.',
    items: ['Actes de naissance', 'Rapports médicaux', 'Documents administratifs', 'Archives'],
  },
  {
    icon: '\u{1F3EB}', title: 'Suivi scolaire et médical',
    desc: 'Coordonner la scolarité et les soins de santé des enfants.',
    items: ['Calendrier scolaire', 'Bulletins et notes', 'Rendez-vous médicaux', 'Carnet de vaccination'],
  },
  {
    icon: '\u{1F3D7}', title: 'Gestion des projets locaux',
    desc: 'Planifier et exécuter les projets de développement de l\'orphelinat.',
    items: ['Nouveau projet', 'Projets en cours', 'Budget et financement', 'Rapport d\'impact'],
  },
  {
    icon: '\u{1F91D}', title: 'Communication avec les ambassadeurs',
    desc: 'Échanger avec les ambassadeurs et partenaires sur l\'évolution des projets.',
    items: ['Messagerie', 'Liste des ambassadeurs', 'Rapports mensuels', 'Demandes de parrainage'],
  },
]

function DirectorHeader({ user, onLogout }) {
  return (
    <header className="dash-header">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, color: '#f59e0b' }}>{'\u2699'}</span>
          <span style={{ fontSize: 17, fontWeight: 800 }}>Orphelinat<span style={{ color: '#f59e0b' }}> · Pilotage</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{user.first_name} {user.last_name}</span>
          <button className="btn btn-ghost-sm" onClick={onLogout}>Déconnexion</button>
        </div>
      </div>
    </header>
  )
}

function DirectorDashboard({ user }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const t = TASKS[activeIdx]

  return (
    <div className="dash">
      <div className="dash-top">
        <div className="container">
          <div className="dash-greeting">
            <span className="dash-badge">CHEF D'ORPHELINAT</span>
            <h2><span className="accent">{user.first_name}</span> · Centre de commandement</h2>
          </div>
          <div className="dash-stats">
            <div className="dash-stat"><span className="dash-stat-nb">24</span><span className="dash-stat-lb">Enfants</span></div>
            <div className="dash-stat"><span className="dash-stat-nb">6</span><span className="dash-stat-lb">Projets</span></div>
            <div className="dash-stat"><span className="dash-stat-nb">12</span><span className="dash-stat-lb">Ambassadeurs</span></div>
            <div className="dash-stat"><span className="dash-stat-nb">8</span><span className="dash-stat-lb">Demandes</span></div>
          </div>
        </div>
      </div>
      <div className="container" style={{ marginTop: 28 }}>
        <div className="dash-panel">
          <div className="dash-nav">
            {TASKS.map((task, i) => (
              <button key={i} className={`dash-btn${i === activeIdx ? ' active' : ''}`} onClick={() => setActiveIdx(i)}>
                <span className="dash-btn-icon">{task.icon}</span>
                <span className="dash-btn-label">{task.title}</span>
                {i === activeIdx && <span className="dash-btn-ind" />}
              </button>
            ))}
          </div>
          <div className="dash-board">
            <div className="dash-board-top">
              <span style={{ fontSize: 32 }}>{t.icon}</span>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{t.title}</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{t.desc}</p>
              </div>
            </div>
            <div className="dash-actions">
              {t.items.map((item, i) => (
                <button key={i} className="dash-action">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="dash-action-n">{String(i + 1).padStart(2, '0')}</span>
                    <span>{item}</span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <span className="logo-icon">&#x2726;</span>
            <span className="logo-text">Confédération<span className="accent"> des Orphelinats</span></span>
          </a>
          <p className="footer-desc">Confédération des Orphelinats – Africa</p>
        </div>
        <div className="footer-links">
          <a href="#" onClick={e => e.preventDefault()}>Politique de confidentialité</a>
          <a href="#" onClick={e => e.preventDefault()}>Conditions d'utilisation</a>
          <a href="#" onClick={e => e.preventDefault()}>FAQ</a>
        </div>
        <div className="footer-copy">
            <p>&copy; 2026 Confédération des Orphelinats &mdash; v2.4.1</p>
          <p className="footer-tech">Built on <span>Backend</span> &middot; <span>Frontend</span> &middot; <span>Desktop</span> &middot; <span>Mobile</span></p>
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
          <p>Rejoignez la Confédération des Orphelinats</p>
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
