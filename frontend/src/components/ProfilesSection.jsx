import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../i18n'

const TICK_MS = 6000

const H = ['#f59e0b','#22c55e','#a855f7','#3b82f6','#ef4444','#ec4899','#14b8a6','#f97316']

const COUNTRY_CODES = [
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

function hueIndex(str) {
  if (!str) return 0
  const code = typeof str === 'string' ? str.charCodeAt(0) : 0
  return Math.abs(code % H.length)
}

function countryCodeOf(child) {
  if (child.code) return child.code
  const name = child.nationalite || child.country || ''
  const c = COUNTRY_CODES.find(c => c.name === name)
  return c ? c.code : null
}

function flagUrl(code) {
  return code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : null
}

const STEPPED_CLIP = 'polygon(0% 0%, 100% 0%, 100% 90%, 80% 90%, 80% 100%, 0% 100%)'

// layer positions: back (left tilt), middle (straight), front (right tilt, active)
const LAYER_CONFIG = [
  { key: 'back',   rotate: -45, x: -128, y: 34,  scale: 0.86, opacity: 0.55, z: 1 },
  { key: 'middle', rotate: 0,   x: 0,    y: -22, scale: 0.95, opacity: 0.8,  z: 2 },
  { key: 'front',  rotate: 45,  x: 128,  y: 34,  scale: 1,    opacity: 1,    z: 3 },
]

function photoUrlOf(child) {
  const url = child.photo_url || child.photo || ''
  return typeof url === 'string' && url.startsWith('http') ? url : ''
}

function CardFace({ child, color, onBroken }) {
  const photoUrl = photoUrlOf(child)
  const initial = (child.prenom?.[0] || child.nom?.[0] || child.name?.[0] || '?').toUpperCase()
  const name = child.prenom ? `${child.prenom} ${child.nom || ''}`.trim() : child.name
  const flag = flagUrl(countryCodeOf(child))
  const accent = color || H[0]

  return (
    <>
      <div className="deck-card-photo">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="deck-card-img"
            onError={() => onBroken?.(photoUrl)}
            onLoad={e => {
              // reject junk uploads (solid-color test squares are 50-100px)
              if (e.currentTarget.naturalWidth < 120 || e.currentTarget.naturalHeight < 120) onBroken?.(photoUrl)
            }}
          />
        ) : (
          <div className="deck-card-avatar" style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent}88)` }}>
            <span>{initial}</span>
          </div>
        )}
      </div>

      <div className="deck-card-info">
        <div className="deck-card-name">
          {flag && <img src={flag} alt="" className="deck-card-flag" />}
          <span>{name}</span>
        </div>
      </div>

      <div className="deck-card-glow" style={{ background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` }} />
    </>
  )
}

function childKeyOf(c) {
  return c.id || c.uid || c.prenom || c.name || 'x'
}

function DeckLayerCard({ child, color, layer, onBroken }) {
  const [displayed, setDisplayed] = useState({ child, color })
  const [incoming, setIncoming] = useState(null)
  const [fadeIn, setFadeIn] = useState(false)
  const timeoutRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (childKeyOf(child) === childKeyOf(displayed.child)) return

    setIncoming({ child, color })
    setFadeIn(false)

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setFadeIn(true))
    })

    timeoutRef.current = setTimeout(() => {
      setDisplayed({ child, color })
      setIncoming(null)
      setFadeIn(false)
    }, 2800)

    return () => {
      clearTimeout(timeoutRef.current)
      cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childKeyOf(child)])

  return (
    <div
      className="deck-layer"
      style={{
        transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotate}deg) scale(${layer.scale})`,
        opacity: layer.opacity,
        zIndex: layer.z,
      }}
    >
      <div className="deck-card" style={{ clipPath: STEPPED_CLIP }}>
        <CardFace child={displayed.child} color={displayed.color} onBroken={onBroken} />
        {incoming && (
          <div className="deck-card-crossfade" style={{ opacity: fadeIn ? 1 : 0 }}>
            <CardFace child={incoming.child} color={incoming.color} onBroken={onBroken} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilesSection({ pool, onBroken }) {
  const { t } = useTranslation()
  const [slots, setSlots] = useState([])
  const poolRef = useRef([])
  const cursorRef = useRef(0)
  const nextSlotRef = useRef(0)

  poolRef.current = pool

  // Show at most 3 cards, but never more than there are distinct children —
  // no child appears twice on screen at once.
  const slotCount = Math.min(LAYER_CONFIG.length, pool.length)

  // (Re)seed the visible slots whenever the number of available children
  // crosses a card-count threshold (first photos arrive, or new children
  // get registered while only 1-2 cards were showing).
  useEffect(() => {
    if (slots.length !== slotCount && slotCount > 0) {
      setSlots(pool.slice(0, slotCount))
      cursorRef.current = slotCount
      nextSlotRef.current = 0
    }
  }, [slotCount, slots.length])

  // Conveyor: every tick, pull ONE new child into ONE slot (round-robin),
  // so only a single card crossfades at a time while the others hold
  // still. The cursor walks the entire pool before wrapping, so every
  // child from every chef d'orphelinat eventually pops up, then repeats.
  useEffect(() => {
    const id = setInterval(() => {
      const currentPool = poolRef.current
      setSlots(prev => {
        if (prev.length === 0 || currentPool.length <= prev.length) return prev
        const slotIdx = nextSlotRef.current % prev.length
        // skip children already visible in another slot
        let next = null
        for (let step = 0; step < currentPool.length; step++) {
          const candidate = currentPool[(cursorRef.current + step) % currentPool.length]
          const key = candidate.id ?? candidate.uid
          if (!prev.some((s, si) => si !== slotIdx && (s.id ?? s.uid) === key)) {
            next = candidate
            cursorRef.current = (cursorRef.current + step + 1) % currentPool.length
            break
          }
        }
        if (!next) return prev
        nextSlotRef.current = (slotIdx + 1) % prev.length
        const copy = [...prev]
        copy[slotIdx] = next
        return copy
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Pick layer poses that look right for the card count:
  // 1 card -> straight middle; 2 cards -> back + front tilt; 3 -> full deck.
  const activeLayers = slotCount === 1 ? [LAYER_CONFIG[1]]
    : slotCount === 2 ? [LAYER_CONFIG[0], LAYER_CONFIG[2]]
    : LAYER_CONFIG

  const deckChildren = slots.slice(0, slotCount).map((child, i) => {
    if (!child) return null
    const layer = activeLayers[i] || LAYER_CONFIG[i]
    const color = child.color || H[(hueIndex(child.prenom || child.name) + i * 3) % H.length]
    return { layer, child, color }
  }).filter(Boolean)

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

          <div className="profiles-deck">
            {deckChildren.map(({ layer, child, color }) => (
              <DeckLayerCard
                key={layer.key}
                layer={layer}
                child={child}
                color={color}
                onBroken={onBroken}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
