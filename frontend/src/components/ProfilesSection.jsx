import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useTranslation } from '../i18n'

const WS_URL = 'http://localhost:8000'

const H = ['#f59e0b','#22c55e','#a855f7','#3b82f6','#ef4444','#ec4899','#14b8a6','#f97316']

function hueIndex(str) {
  if (!str) return 0
  const code = typeof str === 'string' ? str.charCodeAt(0) : 0
  return Math.abs(code % H.length)
}

function svgUrl(letter, bg, w, h) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg}dd"/><stop offset="100%" stop-color="${bg}88"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)" rx="8"/><text x="${w/2}" y="${h*0.58}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="${Math.round(Math.min(w,h)*0.45)}" font-weight="bold" font-family="Arial,sans-serif">${letter}</text></svg>`)}`
}

const fallbackData = [
  { name: 'Aminata', age: 7, country: 'Sénégal', code: 'SN', color: '#f59e0b', img: svgUrl('A', '#f59e0b', 400, 500) },
  { name: 'Kofi',    age: 10, country: 'Ghana', code: 'GH', color: '#22c55e', img: svgUrl('K', '#22c55e', 400, 500) },
  { name: 'Zara',    age: 6, country: 'Éthiopie', code: 'ET', color: '#a855f7', img: svgUrl('Z', '#a855f7', 400, 500) },
  { name: 'Moussa',  age: 12, country: 'Mali', code: 'ML', color: '#3b82f6', img: svgUrl('M', '#3b82f6', 400, 500) },
]

const STEPPED_CLIP = 'polygon(0% 0%, 100% 0%, 100% 72%, 78% 72%, 78% 100%, 0% 100%)'

const DECK_LAYERS = [
  { rotate: '-3deg', x: '-6px', y: '-6px', z: 0 },
  { rotate: '2deg',  x: '5px', y: '-3px', z: 1 },
]

function DeckCard({ child, color, index, isNew }) {
  const photoUrl = (child.photo_url || child.photo || child.img || '').startsWith('http') || (child.img || '').startsWith('data:')
    ? (child.photo_url || child.photo || child.img)
    : ''
  const initial = (child.prenom?.[0] || child.nom?.[0] || child.name?.[0] || '?').toUpperCase()
  const name = child.prenom ? `${child.prenom} ${child.nom || ''}`.trim() : child.name
  const nat = child.nationalite || child.country || ''
  const age = child.age != null ? child.age : ''
  const accent = color || H[0]

  return (
    <div
      className={`relative w-[155px] h-[228px] sm:w-[172px] sm:h-[250px] ${isNew ? 'animate-card-entry' : ''}`}
      style={{
        animationDelay: isNew ? '0ms' : `${index * 90}ms`,
        animationFillMode: 'backwards',
      }}
    >
      {DECK_LAYERS.map((layer, li) => (
        <div
          key={li}
          className="absolute inset-0 rounded-[10px]"
          style={{
            background: 'linear-gradient(160deg, rgba(30,41,59,0.45), rgba(15,23,42,0.65))',
            border: '1px solid rgba(255,255,255,0.04)',
            transform: `rotate(${layer.rotate}) translateX(${layer.x}) translateY(${layer.y})`,
            zIndex: layer.z,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(4px)',
          }}
        />
      ))}

      <div
        className="relative z-[2] w-full h-full rounded-[10px] flex flex-col overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(160deg, rgba(30,41,59,0.92), rgba(15,23,42,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
          transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = `0 14px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = ''
          e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`
        }}
      >
        <div
          className="w-full flex-shrink-0 overflow-hidden"
          style={{ clipPath: STEPPED_CLIP, height: '158px' }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-full h-full object-cover"
              style={{ transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent}88)` }}
            >
              <span
                className="font-bold text-white/85 select-none"
                style={{ fontSize: '52px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                {initial}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-2.5 py-2 gap-0.5">
          <div
            className="font-semibold text-center truncate w-full text-[13px] sm:text-[14px]"
            style={{ color: '#e2e8f0' }}
          >
            {name}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px]" style={{ color: '#94a3b8' }}>
            {age != null && age !== '' && <span>{age} ans</span>}
            {age != null && age !== '' && nat && <span>·</span>}
            {nat && <span>{nat}</span>}
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` }}
        />
      </div>
    </div>
  )
}

export default function ProfilesSection({ children: initialChildren }) {
  const { t } = useTranslation()
  const [children, setChildren] = useState([])
  const [newIds, setNewIds] = useState(new Set())
  const [mounted, setMounted] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (initialChildren && initialChildren.length > 0) {
      setChildren(prev => {
        if (prev.length === 0) return initialChildren
        const existing = new Map()
        initialChildren.forEach(c => existing.set(c.id || c.uid, c))
        const merged = [...initialChildren]
        prev.forEach(c => { if (!existing.has(c.id || c.uid)) merged.unshift(c) })
        return merged
      })
    }
  }, [initialChildren])

  useEffect(() => {
    let socket = null
    try {
      socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })

      socket.on('connect', () => {
        console.log('[ProfilesSection] WebSocket connected')
      })

      socket.on('child_updated', (payload) => {
        if (!payload || (!payload.id && !payload.uid)) return
        setChildren(prev => {
          const idx = prev.findIndex(c =>
            (c.id != null && c.id === payload.id) ||
            (c.uid != null && c.uid === payload.uid)
          )
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], ...payload }
            return copy
          }
          return [payload, ...prev]
        })
      })

      socket.on('enfant_enregistre', (payload) => {
        if (!payload || (!payload.id && !payload.uid)) return
        const uid = payload.id || payload.uid
        setChildren(prev => {
          if (prev.some(c =>
            (c.id != null && c.id === payload.id) ||
            (c.uid != null && c.uid === payload.uid)
          )) return prev
          setNewIds(prevIds => new Set([...prevIds, uid]))
          setTimeout(() => {
            setNewIds(prevIds => { const next = new Set(prevIds); next.delete(uid); return next })
          }, 800)
          return [payload, ...prev]
        })
      })

      socket.on('disconnect', () => {
        console.log('[ProfilesSection] WebSocket disconnected')
      })

      socketRef.current = socket
    } catch (err) {
      console.warn('[ProfilesSection] WebSocket unavailable — offline mode', err)
    }

    return () => { if (socket) socket.disconnect() }
  }, [])

  const pool = children.length > 0 ? children : fallbackData
  const visible = pool.slice(0, 4)

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

          <div className="flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-5 sm:gap-7 md:gap-9">
              {visible.map((c, i) => {
                const key = c.id || c.uid || i
                const color = c.color || H[(hueIndex(c.prenom || c.name) + i * 3) % H.length]
                return (
                  <DeckCard
                    key={key}
                    child={c}
                    color={color}
                    index={i}
                    isNew={mounted && newIds.has(c.id || c.uid)}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
