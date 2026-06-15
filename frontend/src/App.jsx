import { useState, useEffect, useRef } from 'react'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <Profiles />
        <Support />
        <Stats />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
      <Chatbot />
    </div>
  )
}

function Header() {
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
          <span className="logo-text">Hope<span className="accent">Horizons</span></span>
        </a>
        <nav className={`nav${menuOpen ? ' open' : ''}`}>
          <a href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('hero') }}>Accueil</a>
          <a href="#profiles" onClick={(e) => { e.preventDefault(); scrollTo('profiles') }}>Profils</a>
          <a href="#support" onClick={(e) => { e.preventDefault(); scrollTo('support') }}>Soutenir</a>
          <a href="#stats" onClick={(e) => { e.preventDefault(); scrollTo('stats') }}>Statistiques</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact') }}>Contact</a>
        </nav>
        <div className="header-actions">
          <button className="btn btn-outline">Login</button>
          <button className="btn btn-primary">Sign Up</button>
        </div>
        <button className={`hamburger${menuOpen ? ' active' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}

const youthData = [
  { name: 'Aminata', age: 7, country: 'Sénégal', color: '#f59e0b', img: 'https://picsum.photos/seed/aminata/500/600' },
  { name: 'Kofi', age: 10, country: 'Ghana', color: '#22c55e', img: 'https://picsum.photos/seed/kofi/500/600' },
  { name: 'Zara', age: 6, country: 'Éthiopie', color: '#a855f7', img: 'https://picsum.photos/seed/zara/500/600' },
  { name: 'Moussa', age: 12, country: 'Mali', color: '#3b82f6', img: 'https://picsum.photos/seed/moussa/500/600' },
  { name: 'Fatou', age: 8, country: 'RDC', color: '#ef4444', img: 'https://picsum.photos/seed/fatou/500/600' },
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
    { name: 'Aminata', color: '#f59e0b', img: 'https://picsum.photos/seed/amina-profile/200/250' },
    { name: 'Kofi', color: '#22c55e', img: 'https://picsum.photos/seed/kofi-profile/200/250' },
    { name: 'Zara', color: '#a855f7', img: 'https://picsum.photos/seed/zara-profile/200/250' },
  ],
  [
    { name: 'Moussa', color: '#3b82f6', img: 'https://picsum.photos/seed/moussa-profile/200/250' },
    { name: 'Fatou', color: '#ef4444', img: 'https://picsum.photos/seed/fatou-profile/200/250' },
    { name: 'Ekua', color: '#06b6d4', img: 'https://picsum.photos/seed/ekua-profile/200/250' },
  ],
  [
    { name: 'Thabo', color: '#eab308', img: 'https://picsum.photos/seed/thabo-profile/200/250' },
    { name: 'Aminata', color: '#f59e0b', img: 'https://picsum.photos/seed/amina-profile/200/250' },
    { name: 'Kofi', color: '#22c55e', img: 'https://picsum.photos/seed/kofi-profile/200/250' },
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
            <p>&#9993; contact@hopehorizons.africa</p>
            <p>&#9742; +243 800 123 456</p>
            <p>&#127758; Kinshasa, RDC</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <span className="logo-icon">&#x2726;</span>
            <span className="logo-text">Hope<span className="accent">Horizons</span></span>
          </a>
          <p className="footer-desc">Orphelinat Network – Africa</p>
        </div>
        <div className="footer-links">
          <a href="#" onClick={e => e.preventDefault()}>Politique de confidentialité</a>
          <a href="#" onClick={e => e.preventDefault()}>Conditions d'utilisation</a>
          <a href="#" onClick={e => e.preventDefault()}>FAQ</a>
        </div>
        <div className="footer-copy">
          <p>&copy; 2026 Hope Horizons &mdash; v2.4.1</p>
          <p className="footer-tech">Built on <span>Backend</span> &middot; <span>Frontend</span> &middot; <span>Desktop</span> &middot; <span>Mobile</span></p>
        </div>
      </div>
    </footer>
  )
}

function WhatsAppFloat() {
  return (
    <a href="#" className="wa-float" onClick={e => e.preventDefault()} title="WhatsApp">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.76-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.525 5.852L.525 24l6.403-1.553A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.776 0-3.468-.494-4.94-1.42l-.36-.215-3.8.922.996-3.677-.25-.39A9.963 9.963 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
    </a>
  )
}

function Chatbot() {
  const [collapsed, setCollapsed] = useState(false)
  const [messages, setMessages] = useState([{ text: 'Bonjour ! Je suis l\'assistant Hope. Comment puis-je vous aider ?', isUser: false }])
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const replies = [
    'Merci pour votre message ! Un de nos agents vous répondra bientôt.',
    'Nous sommes touchés par votre intérêt. Ensemble pour les enfants !',
    'Voulez-vous en savoir plus sur nos programmes de parrainage ?',
    'Chaque geste compte. Merci de soutenir les orphelins d\'Afrique.',
  ]

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
    if (inputRef.current) inputRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={`chatbot-float${collapsed ? ' collapsed' : ''}`}>
      <div className="chatbot-header" onClick={() => setCollapsed(v => !v)}>
        <span className="chatbot-avatar">&#x1F916;</span>
        <span>Assistant Hope</span>
        <span className="chatbot-toggle">{collapsed ? '+' : '–'}</span>
      </div>
      <div className="chatbot-body">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message${m.isUser ? ' user' : ' bot'}`}>{m.text}</div>
        ))}
        <div ref={inputRef} className="chat-input-area">
          <input ref={inputRef} className="chat-input" placeholder="Écrivez un message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
          <button className="chat-send" onClick={send}>&rarr;</button>
        </div>
      </div>
    </div>
  )
}
