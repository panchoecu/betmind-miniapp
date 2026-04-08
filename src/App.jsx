import { useState, useEffect, useRef } from 'react'
import './App.css'
import WebApp from '@twa-dev/sdk'
const API_URL = 'https://webhook.tuagentevirtual.info'

// ═══════════════════════════════════════════════════
//  MOCK DATA — reemplazar con llamadas a Supabase
// ═══════════════════════════════════════════════════
const TODAY = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' })

const MOCK_STATS = {
  mes: 'Abril 2026', ganados: 47, perdidos: 18, total: 65,
  pct: 72.3, yield: 18.4, racha: 5, pendientes: 3,
}

async function fetchTrackRecord() {
  try {
    const res = await fetch(`${API_URL}/track-record`)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

async function fetchDailyTips() {
  try {
    const res = await fetch(`${API_URL}/picks`)
    if (!res.ok) return null
    const data = await res.json()
    return data.top_picks || []
  } catch { return null }
}

const MOCK_HISTORY = [
  { mes:'Abr 2026', picks:65,  pct:72.3, yield:18.4 },
  { mes:'Mar 2026', picks:58,  pct:68.1, yield:14.2 },
  { mes:'Feb 2026', picks:62,  pct:71.0, yield:16.8 },
  { mes:'Ene 2026', picks:55,  pct:65.4, yield:11.3 },
  { mes:'Dic 2025', picks:61,  pct:74.2, yield:21.5 },
]

const MOCK_PICKS = [
  {
    id:1, home:'Barcelona', away:'Atlético Madrid', league:'La Liga',
    pick:'Local (Barcelona)', conservador:'Doble Chance 1X',
    odd:1.85, conf:78, ev:7.2, time:'20:45', btts:true, ou:true, locked:false,
    analisis:[
      { t:'🏠 Local — Barcelona', txt:'Excelente forma (4V-1E últimos 5). Pedri y Gavi recuperados. En el Camp Nou: 8 victorias en los últimos 10 como local. Alta presión desde el inicio, posesión dominante.' },
      { t:'✈️ Visitante — Atlético Madrid', txt:'Irregular fuera de casa (2V-2E-1D últimos 5). Sin Griezmann por sanción, pierden el referente ofensivo. Defensa compacta pero vulnerable en transiciones rápidas.' },
      { t:'⚽ Head to Head', txt:'Últimos 10 enfrentamientos: Barcelona 6V · Empates 2 · Atlético 2. En Camp Nou el balance es 7-1-2 en la última década. Partido históricamente disputado y de muchos goles.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 54% · Empate 22% · Visitante 24% · BTTS 68% · Over 2.5: 61%. El modelo favorece al local con margen significativo.' },
      { t:'🔑 Factores clave', txt:'Recuperación de Pedri y Gavi · Ausencia de Griezmann · Forma reciente superior del local · Value positivo @1.85 con EV +7.2% sobre cuota justa de ~1.71' },
    ],
  },
  {
    id:2, home:'PSG', away:'Lyon', league:'Ligue 1',
    pick:'Local (PSG)', conservador:'Handicap PSG -1',
    odd:1.65, conf:82, ev:9.1, time:'21:00', btts:false, ou:true, locked:false,
    analisis:[
      { t:'🏠 Local — PSG', txt:'Mbappé recuperado al 100%. Dembélé en estado de gracia con 6 goles en los últimos 5 partidos. En el Parque de los Príncipes: 18 partidos consecutivos sin perder esta temporada.' },
      { t:'✈️ Visitante — Lyon', txt:'Posición media-tabla sin regularidad. Defensa con al menos 1 gol concedido en los últimos 7 partidos fuera de casa. Sin grandes estrellas disponibles para este partido.' },
      { t:'⚽ Head to Head', txt:'PSG ha ganado los últimos 5 enfrentamientos directos contra Lyon, con una media de 2.8 goles marcados por partido. Dominio claro y consistente del local en casa.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 61% · Empate 20% · Visitante 19% · Over 2.5: 64%. Probabilidad de gol visitante muy reducida dado el sistema defensivo del PSG en casa.' },
      { t:'🔑 Factores clave', txt:'Mbappé y Dembélé imparables · PSG invicto en casa · Lyon sin ganar fuera en 4 partidos · EV +9.1% — una de las mejores apuestas de la jornada' },
    ],
  },
  {
    id:3, home:'Boca Juniors', away:'River Plate', league:'Liga Profesional',
    pick:'BTTS — Sí', conservador:'Over 1.5 goles',
    odd:1.90, conf:71, ev:5.4, time:'18:00', btts:true, ou:true, locked:true,
    analisis:[
      { t:'🏠 Local — Boca Juniors', txt:'Superclásico en La Bombonera. Cavani en buen momento con 3 goles en los últimos 4 partidos. El ambiente local siempre aporta presión ofensiva desde el inicio.' },
      { t:'✈️ Visitante — River Plate', txt:'Borja y Colidio en forma, el equipo visitante ha marcado en sus últimos 8 partidos consecutivos. River no va a La Bombonera a especular.' },
      { t:'⚽ Head to Head', txt:'En los últimos 10 Superclásicos, BTTS se dio en 7 ocasiones. Partido de máximo voltaje emocional donde ambos equipos atacan desde el primer minuto.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 38% · Empate 28% · Visitante 34% · BTTS 72% · Over 2.5: 58%. El modelo Poisson refuerza ampliamente el mercado BTTS.' },
      { t:'🔑 Factores clave', txt:'Superclásico: presión ofensiva de ambos equipos · Ambos con goleadores en forma · H2H muy favorable a BTTS · Cuota @1.90 con excelente valor' },
    ],
  },
  {
    id:4, home:'Bayern Munich', away:'Dortmund', league:'Bundesliga',
    pick:'Over 2.5 Goles', conservador:'BTTS — Sí',
    odd:1.70, conf:75, ev:6.8, time:'17:30', btts:true, ou:true, locked:true,
    analisis:[
      { t:'🏠 Local — Bayern Munich', txt:'Bayern en modo ofensivo: promedia 3.1 goles por partido en casa esta temporada. Kane intratable con 22 goles en liga. Müller y Sané aportan desequilibrio constante.' },
      { t:'✈️ Visitante — Dortmund', txt:'Sancho y Adeyemi de titular. En sus últimas 5 salidas han marcado mínimo 1 gol. Dortmund presiona alto pero deja espacios en su espalda que Bayern explota.' },
      { t:'⚽ Head to Head', txt:'Der Klassiker históricamente lleno de goles: Over 2.5 se cumplió en 8 de los últimos 10 enfrentamientos. Los últimos 3 acabaron con 4+ goles en el marcador.' },
      { t:'📊 Probabilidades Poisson', txt:'Over 2.5: 74% · Over 3.5: 48% · BTTS: 68%. El modelo Poisson es muy claro en el pronóstico de este mercado.' },
      { t:'🔑 Factores clave', txt:'Bayern promedia 3+ goles en casa · Kane en racha goleadora · H2H con muchos goles · Dortmund sin sólida defensa · EV +6.8% @1.70' },
    ],
  },
  {
    id:5, home:'Real Madrid', away:'Sevilla', league:'La Liga',
    pick:'Local (Real Madrid)', conservador:'HC Real Madrid -1',
    odd:1.55, conf:80, ev:8.8, time:'22:00', btts:false, ou:true, locked:true,
    analisis:[
      { t:'🏠 Local — Real Madrid', txt:'Bellingham y Vinícius imparables en el Bernabéu. El equipo no ha perdido en casa en 14 partidos consecutivos esta temporada. Sistema de presión altísima desde el inicio.' },
      { t:'✈️ Visitante — Sevilla', txt:'En reconstrucción: posición media-tabla sin regularidad. Sus últimas 5 salidas: 1V-1E-3D. Defensa permeable que ha concedido 2+ goles en 3 de sus últimas 4 visitas a grandes.' },
      { t:'⚽ Head to Head', txt:'Real Madrid ha ganado 7 de los últimos 10 enfrentamientos directos. En el Bernabéu el balance es 8-1-1 en la última década. Dominio histórico y estadístico del local.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 62% · Empate 22% · Visitante 16%. El modelo otorga una de las probabilidades más altas de la jornada al equipo local.' },
      { t:'🔑 Factores clave', txt:'Bernabéu históricamente inexpugnable · Sevilla en racha negativa · Bellingham y Vinícius en estado de forma · EV +8.8% @1.55 — pick de alta confianza' },
    ],
  },
  {
    id:6, home:'Inter Milan', away:'Napoli', league:'Serie A',
    pick:'Local (Inter Milan)', conservador:'Doble Chance 1X',
    odd:1.95, conf:68, ev:4.3, time:'19:45', btts:false, ou:false, locked:true,
    analisis:[
      { t:'🏠 Local — Inter Milan', txt:'Sólido en casa con sistema defensivo bien estructurado. Lautaro en buena forma (2 goles últimos 3). San Siro: 7V-2E-1D en lo que va de temporada.' },
      { t:'✈️ Visitante — Napoli', txt:'Irregular: 2V-1E-2D en los últimos 5. Osimhen cargado físicamente, rinde por debajo de su nivel habitual. El equipo pierde consistencia lejos de casa.' },
      { t:'⚽ Head to Head', txt:'Inter ha ganado 3 de los últimos 5 enfrentamientos directos. Partidos generalmente muy disputados y con pocos goles (media 1.8 goles totales por partido).' },
      { t:'📊 Probabilidades Poisson', txt:'Local 46% · Empate 26% · Visitante 28%. Partido equilibrado pero con ligera ventaja local. Over 2.5 poco probable (36%).' },
      { t:'🔑 Factores clave', txt:'Inter sólido en San Siro · Osimhen al 70% de su nivel · Napoli irregular fuera · Pick de confianza moderada — staking conservador recomendado' },
    ],
  },
]

const MOCK_RISKY = [
  {
    id:7, home:'Espanyol', away:'Getafe', league:'La Liga',
    pick:'Local (Espanyol)', conservador:'Doble Chance 1X',
    odd:3.40, conf:65, ev:12.1, time:'19:00', btts:false, ou:false, locked:true,
    analisis:[
      { t:'⚠️ Pick de Alto Valor', txt:'Espanyol motivado en casa ante Getafe que lucha por no descender. El modelo Poisson da 48% al local pero la cuota de mercado lo infravalora claramente.' },
      { t:'🔑 Factores clave', txt:'Cuota de valor excepcional (@3.40 con probabilidad real ~48%) · Motivación local alta · Getafe sin moral · EV +12.1% — gestión de bankroll: 1 unidad máximo' },
    ],
  },
  {
    id:8, home:'Huachipato', away:'Colo-Colo', league:'Primera Chile',
    pick:'Visitante +1.5 Goles', conservador:'Over 2.5 goles',
    odd:2.80, conf:67, ev:9.2, time:'22:00', btts:true, ou:true, locked:true,
    analisis:[
      { t:'⚠️ Pick de Alto Valor', txt:'Colo-Colo llega como favorito claro. Huachipato en zona baja sin recursos ofensivos. El visitante ha ganado sus últimas 3 salidas marcando 2+ goles.' },
      { t:'🔑 Factores clave', txt:'Colo-Colo con goleadores en forma · Huachipato sin nivel defensivo · EV +9.2% @2.80 — excelente relación riesgo/retorno' },
    ],
  },
]

// ═══════════════════════════════════════════════════
//  UTILIDADES
// ═══════════════════════════════════════════════════
const confIcon = (c) => c >= 80 ? '🔥' : c >= 70 ? '✅' : '⚡'
const confBar  = (c) => '█'.repeat(Math.floor(c / 10)) + '░'.repeat(10 - Math.floor(c / 10))
const staking  = (c, ev) => {
  if (ev >= 10 && c >= 75) return '3 unidades'
  if (c >= 75 || ev >= 7)  return '2 unidades'
  if (c >= 65)             return '1.5 unidades'
  return '1 unidad'
}
const evLabel  = (ev) =>
  ev >= 10 ? `📈 +${ev}% — valor excelente` :
  ev >= 5  ? `📊 +${ev}% — valor positivo`  :
             `➡️ +${ev}%`

const FREE_PICKS_LIMIT = 2

// ═══════════════════════════════════════════════════
//  ANIMATED NUMBER
// ═══════════════════════════════════════════════════
function AnimNum({ value, suffix = '', dec = 0 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let v = 0
    const step = value / 40
    const t = setInterval(() => {
      v += step
      if (v >= value) { setDisplay(value); clearInterval(t) }
      else setDisplay(dec ? parseFloat(v.toFixed(dec)) : Math.floor(v))
    }, 20)
    return () => clearInterval(t)
  }, [value])
  return <span>{display}{suffix}</span>
}

// ═══════════════════════════════════════════════════
//  LOGO BM SVG
// ═══════════════════════════════════════════════════
function LogoBM({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="#1a0508"/>
      <text x="4" y="26" fontFamily="Bebas Neue,sans-serif" fontSize="21" fill="#C41830" letterSpacing="1">BM</text>
      <line x1="4" y1="29" x2="32" y2="29" stroke="#C41830" strokeWidth="1.2" opacity=".45"/>
      <circle cx="8"  cy="10" r="1"  fill="#C41830" opacity=".6"/>
      <circle cx="30" cy="10" r="1"  fill="#C41830" opacity=".6"/>
      <line x1="8" y1="10" x2="14" y2="10" stroke="#C41830" strokeWidth=".5" opacity=".4"/>
      <line x1="24" y1="10" x2="30" y2="10" stroke="#C41830" strokeWidth=".5" opacity=".4"/>
    </svg>
  )
}

// ═══════════════════════════════════════════════════
//  APP HEADER
// ═══════════════════════════════════════════════════
function AppHeader({ isPremium }) {
  return (
    <div className="app-header">
      <div className="logo-group">
        <LogoBM />
        <div className="brand-name">BET<span className="accent">MIND</span> AI</div>
      </div>
      <div className={`plan-badge ${isPremium ? 'prem' : ''}`}>
        {isPremium ? '👑 PREMIUM' : '🆓 FREE'}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  HOME SCREEN
// ═══════════════════════════════════════════════════
function HomeScreen({ isPremium, onGoToPicks, onGoToPremium, picks }) {
  const s = MOCK_STATS
  const allPicks = (picks || MOCK_PICKS).map(p => ({
    ...p,
    home: p.home || p.home_team,
    away: p.away || p.away_team,
    pick: p.pick || p.pick_principal,
    conf: p.conf || p.confidence,
  }))
  return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="home-datebar">
        {TODAY} &nbsp;·&nbsp; <span className="hl">⚡ {MOCK_PICKS.length} picks listos hoy</span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">ACIERTOS</div>
          <div className="stat-value r"><AnimNum value={s.pct} suffix="%" dec={1} /></div>
          <div className="stat-sub">{s.ganados}W · {s.perdidos}L · {s.mes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">YIELD</div>
          <div className="stat-value g">+<AnimNum value={s.yield} suffix="%" dec={1} /></div>
          <div className="stat-sub">rendimiento neto</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">RACHA</div>
          <div className="stat-value"><AnimNum value={s.racha} /></div>
          <div className="stat-sub">🔥 consecutivos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PICKS HOY</div>
          <div className="stat-value"><AnimNum value={MOCK_PICKS.length} /></div>
          <div className="stat-sub">{isPremium ? 'acceso completo' : `${FREE_PICKS_LIMIT} gratis · ${MOCK_PICKS.length} total`}</div>
        </div>
      </div>

      {/* Preview picks */}
      <div className="section-label">PICKS DESTACADOS HOY</div>
      <div className="preview-picks">
        {allPicks.slice(0, isPremium ? 3 : 2).map((p, i) => {
          const locked = !isPremium && i >= 2
          return (
            <div
              key={p.id}
              className={`preview-card ${locked ? 'locked' : ''}`}
              onClick={() => !locked && onGoToPicks(i)}
            >
              <div className="preview-teams">
                {p.home}<span className="vs">vs</span>{p.away}
              </div>
              <div className="preview-info">
                {locked ? (
                  <>
                    <span className="preview-lock">🔒 PREMIUM</span>
                    <span className="preview-lock-odd">@{p.odd}</span>
                  </>
                ) : (
                  <>
                    <span className="preview-pick">{p.pick}</span>
                    <span className="preview-odd">@{p.odd}</span>
                    <span className="preview-conf">{confIcon(p.conf)} {p.conf}%</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!isPremium && (
        <div className="home-cta" onClick={onGoToPremium}>
          <div className="home-cta-title">👑 Desbloquea {MOCK_PICKS.length} picks + 15 análisis/día</div>
          <div className="home-cta-sub">Desde $19/mes · Acceso inmediato · Sin permanencia</div>
        </div>
      )}
      {isPremium && <div style={{ height: 16 }} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  PICKS SCREEN — 3 views: list / detail / analysis
// ═══════════════════════════════════════════════════
function RenderAnalysis({ text }) {
  const lines = text.split('\n').filter(l => l.trim())
  const sections = []
  let probRows = []
  let inProbs = false
  let currentSection = null

  for (const line of lines) {
    const clean = line.replace(/[*_]/g, '').trim()
    if (!clean || clean.match(/^[━─]+$/) || clean === '```') continue

    if (clean.startsWith('MERCADO') || clean.includes('Victoria Local') && clean.includes('%') && !inProbs) {
      inProbs = true
    }
    if (inProbs && clean.match(/^(Victoria|Empate|Vic\.|BTTS|Over|Under|Goles)/)) {
      const match = clean.match(/^(.+?)\s+([\d.]+%|[\d.]+\s+[\d.]+)$/)
      if (match) probRows.push({ label: match[1], val: match[2] })
      if (clean.startsWith('Goles')) inProbs = false
      continue
    }
    if (clean.startsWith('🥇') || clean.startsWith('🥈') || clean.startsWith('📈')) {
      if (probRows.length > 0) {
        sections.push({ type: 'probs', rows: probRows })
        probRows = []
      }
      sections.push({ type: 'pick', text: clean })
      continue
    }
    if (clean.match(/^(🏠|✈️|📋|🔑|📅)/)) {
      if (currentSection) sections.push(currentSection)
      currentSection = { type: 'section', title: clean, text: '' }
      continue
    }
    if (currentSection) {
      currentSection.text += (currentSection.text ? ' ' : '') + clean
    } else if (clean.length > 30) {
      sections.push({ type: 'conclusion', text: clean })
    }
  }
  if (currentSection) sections.push(currentSection)
  if (probRows.length > 0) sections.push({ type: 'probs', rows: probRows })

  return (
    <div className="ana-rendered">
      {sections.map((s, i) => {
        if (s.type === 'probs') return (
          <div key={i} className="ana-prob-table">
            {s.rows.map((r, j) => (
              <div key={j} className="ana-prob-row">
                <span className="ana-prob-label">{r.label}</span>
                <span className="ana-prob-val">{r.val}</span>
              </div>
            ))}
          </div>
        )
        if (s.type === 'pick') return (
          <div key={i} className="ana-pick-highlight">
            <div className="ana-pick-line">{s.text}</div>
          </div>
        )
        if (s.type === 'section') return (
          <div key={i} className="ana-section">
            <div className="ana-section-title">{s.title}</div>
            <div className="ana-section-text">{s.text}</div>
          </div>
        )
        if (s.type === 'conclusion') return (
          <div key={i} className="ana-conclusion">{s.text}</div>
        )
        return null
      })}
    </div>
  )
}
function PicksScreen({ isPremium, initialIdx, onGoToPremium, picks: realPicksProp }) {
  const [view, setView]     = useState(initialIdx !== null ? 'detail' : 'list')
  const [selIdx, setSelIdx] = useState(initialIdx ?? null)
  const [tab, setTab]       = useState('main')

  const mainPicks = (realPicksProp || MOCK_PICKS).map((p, i) => ({
    ...p,
    home: p.home || p.home_team,
    away: p.away || p.away_team,
    locked: !isPremium && i >= 2,
    pick: p.pick || p.pick_principal,
    conf: p.conf || p.confidence,
    conservador: p.conservador || p.pick_conservador,
    analisis: p.analisis || (p.analysis ? [{t:'📊 Análisis completo', txt: p.analysis.trim()}] : []),
  }))
  const picks = tab === 'risky' ? MOCK_RISKY : mainPicks

  const openDetail = (i) => { setSelIdx(i); setView('detail') }
  const openAnalysis = ()  => setView('analysis')
  const backToList   = ()  => { setView('list'); setSelIdx(null) }
  const backToDetail = ()  => setView('detail')

  /* LIST */
  if (view === 'list') return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="screen-title">PICKS DEL DÍA</div>
      <div className="picks-tabs">
        <button className={`tab-btn ${tab === 'main' ? 'active' : ''}`} onClick={() => setTab('main')}>
          Principales · {MOCK_PICKS.length}
        </button>
        <button
          className={`tab-btn ${tab === 'risky' ? 'active' : ''}`}
          onClick={() => isPremium ? setTab('risky') : onGoToPremium()}
        >
          {isPremium ? `Cuotas Altas · ${MOCK_RISKY.length}` : '🔒 Cuotas Altas'}
        </button>
      </div>

      <div className="picks-list">
        {picks.map((p, i) => {
          const locked = p.locked && !isPremium
          return (
            <div key={p.id} className={`pick-card ${locked ? 'locked' : ''}`} onClick={() => openDetail(i)}>
              <div className="pick-card-top">
                <span className="pick-league">{p.league}</span>
                <span className="pick-time">🕐 {p.time} UTC</span>
              </div>
              <div className="pick-teams">
                {p.home}<span className="vs">vs</span>{p.away}
              </div>
              <div className="pick-card-footer">
                {locked ? (
                  <span className="pick-locked-label">🔒 Solo Premium</span>
                ) : (
                  <>
                    <span className="pick-name">{p.pick}</span>
                    <span className="pick-odd-tag">@{p.odd}</span>
                  </>
                )}
                <span className={`pick-conf-tag ${p.conf < 70 ? 'mid' : ''}`}>
                  {confIcon(p.conf)} {p.conf}%
                </span>
                <span className="pick-arrow">›</span>
              </div>
            </div>
          )
        })}
      </div>

      {!isPremium && (
        <div className="picks-free-note">
          {FREE_PICKS_LIMIT} de {MOCK_PICKS.length} picks desbloqueados ·{' '}
          <span className="link" onClick={onGoToPremium}>Activa Premium →</span>
        </div>
      )}
    </div>
  )

  const p = picks[selIdx]
  const locked = p.locked && !isPremium

  /* DETAIL */
  if (view === 'detail') return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="pick-detail">
        <button className="back-btn" onClick={backToList}>← TODOS LOS PICKS</button>

        <div className="match-header-card">
          <div className="match-league-tag">⚽ {p.league}</div>
          <div className="match-teams-display">
            {p.home}<span className="match-vs-tag">VS</span>{p.away}
          </div>
          <div className="match-time-tag">🕐 {p.time} UTC</div>
        </div>

        {locked ? (
          <div className="locked-pick-box">
            <div className="locked-icon">🔒</div>
            <div className="locked-title">PICK BLOQUEADO</div>
            <div className="locked-sub">
              Activa Premium para ver el pick completo,<br />
              pick conservador y análisis de 7 agentes IA.
            </div>
            <div className="locked-odds">Cuota: @{p.odd} · Confianza: {p.conf}%</div>
            <button className="btn-primary" onClick={onGoToPremium}>👑 VER PLANES PREMIUM</button>
          </div>
        ) : (
          <>
            <div className="data-box">
              <div className="data-row">
                <span className="data-label">PICK PRINCIPAL</span>
                <span className="data-value r">{p.pick}</span>
              </div>
              <div className="data-row">
                <span className="data-label">PICK CONSERVADOR</span>
                <span className="data-value y">{p.conservador}</span>
              </div>
              <div className="data-row">
                <span className="data-label">CUOTA</span>
                <span className="data-value">@{p.odd}</span>
              </div>
              <div className="data-row">
                <span className="data-label">CONFIANZA</span>
                <div style={{ textAlign:'right' }}>
                  <div className="data-value">{confIcon(p.conf)} {p.conf}%</div>
                  <div className="conf-bar">{confBar(p.conf)}</div>
                </div>
              </div>
              <div className="data-row">
                <span className="data-label">EDGE (EV)</span>
                <span className="data-value g">{evLabel(p.ev)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">STAKING</span>
                <span className="data-value">💰 {staking(p.conf, p.ev)}</span>
              </div>
              <div className="market-row">
                <span className={`market-tag ${p.btts ? 'on' : ''}`}>BTTS {p.btts ? '✓' : '✗'}</span>
                <span className={`market-tag ${p.ou   ? 'on' : ''}`}>Over 2.5 {p.ou ? '✓' : '✗'}</span>
              </div>
            </div>

            {/* THE ANALYSIS BUTTON */}
            <button className="analysis-cta" onClick={openAnalysis}>
              <div className="analysis-cta-left">
                <span className="analysis-cta-icon">📋</span>
                <div>
                  <div className="analysis-cta-title">VER ANÁLISIS COMPLETO</div>
                  <div className="analysis-cta-sub">Forma · H2H · Lesiones · Poisson · Factores clave</div>
                </div>
              </div>
              <span className="analysis-cta-arrow">›</span>
            </button>
          </>
        )}

        <p className="disclaimer">⚠️ Apuesta con responsabilidad · Solo mayores de 18 años</p>
      </div>
    </div>
  )

  /* ANALYSIS */
  return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="analysis-screen">
        <button className="back-btn" onClick={backToDetail}>← VOLVER AL PICK</button>

        <div className="analysis-match-mini">
          <div className="analysis-match-teams">{p.home} vs {p.away}</div>
          <div className="analysis-pick-badge">{p.pick}</div>
        </div>

        <div className="analysis-title">ANÁLISIS COMPLETO</div>
        <div className="analysis-meta">Pipeline de 7 agentes IA · {p.league} · {p.time} UTC</div>

        {locked ? (
          <div className="analysis-locked-box">
            <div className="locked-icon">🔒</div>
            <div className="locked-title">ANÁLISIS BLOQUEADO</div>
            <div className="locked-sub">El análisis completo incluye:</div>
            <div className="analysis-locked-list">
              • Forma real últimos 5 partidos<br/>
              • Historial H2H detallado<br/>
              • Lesiones y bajas confirmadas<br/>
              • Probabilidades Poisson (7 agentes IA)<br/>
              • Edge vs mercado (EV)<br/>
              • Factores tácticos y emocionales
            </div>
            <button className="btn-primary" onClick={onGoToPremium}>👑 ACTIVAR PREMIUM</button>
          </div>
        ) : (
          p.analisis.map((block, i) => (
            <div key={i} className="analysis-block">
              <div className="analysis-block-title">{block.t}</div>
              <RenderAnalysis text={block.txt} />
            </div>
          ))
        )}

        <p className="disclaimer">⚠️ Apuesta con responsabilidad · Solo mayores de 18 años</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  STATS SCREEN
// ═══════════════════════════════════════════════════
function StatsScreen({ isPremium }) {
  const [stats, setStats] = useState(MOCK_STATS)
  const [history, setHistory] = useState(MOCK_HISTORY)

  useEffect(() => {
    fetchTrackRecord().then(data => {
      if (!data) return
      setStats({
        mes: data.mes || MOCK_STATS.mes,
        ganados: data.ganados ?? MOCK_STATS.ganados,
        perdidos: data.perdidos ?? MOCK_STATS.perdidos,
        total: data.total ?? MOCK_STATS.total,
        pct: data.pct ?? MOCK_STATS.pct,
        yield: data.yield_pct ?? MOCK_STATS.yield,
        racha: data.racha ?? MOCK_STATS.racha,
        pendientes: data.pendientes ?? 0,
      })
    })
  }, [])

  const s   = stats
  const max = Math.max(...history.map(h => h.pct))
  return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="screen-title">TRACK RECORD</div>

      <div className="stats-month-card">
        <div className="stats-month-label">{s.mes} — estadísticas verificadas</div>
        <div className="stats-big-row">
          <div className="stats-big-item">
            <div className="stats-big-num r">{s.pct}%</div>
            <div className="stats-big-label">ACIERTOS</div>
          </div>
          <div className="stats-divider" />
          <div className="stats-big-item">
            <div className="stats-big-num g">+{s.yield}%</div>
            <div className="stats-big-label">YIELD</div>
          </div>
          <div className="stats-divider" />
          <div className="stats-big-item">
            <div className="stats-big-num">{s.total}</div>
            <div className="stats-big-label">PICKS</div>
          </div>
        </div>
        <div className="stats-wl">
          <span className="w">{s.ganados} GANADOS</span>
          <span className="d">·</span>
          <span className="l">{s.perdidos} PERDIDOS</span>
          <span className="d">·</span>
          <span className="s">🔥 {s.racha} en racha</span>
        </div>
      </div>

      <div className="section-label">HISTORIAL MENSUAL</div>
      <div className="history-chart">
        {MOCK_HISTORY.map((h, i) => (
          <div key={i} className="chart-col">
            <div className="chart-pct">{h.pct}%</div>
            <div className="chart-bar-wrap">
              <div className="chart-bar" style={{ height: `${(h.pct / max) * 100}%` }} />
            </div>
            <div className="chart-label">{h.mes.split(' ')[0]}</div>
          </div>
        ))}
      </div>
      <div className="stats-verified">✅ Verificado con API-Football Pro · Actualizado nightly a las 23:00</div>

      <div className="history-table">
        <div className="history-table-header">
          <span>MES</span><span>PICKS</span><span>ACIERTO</span><span>YIELD</span>
        </div>
        {MOCK_HISTORY.map((h, i) => (
          <div key={i} className="history-table-row">
            <span>{h.mes}</span>
            <span>{h.picks}</span>
            <span className="col-pct">{h.pct}%</span>
            <span className="col-yield">+{h.yield}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  PREMIUM SCREEN
// ═══════════════════════════════════════════════════
function PremiumScreen({ isPremium }) {
  if (isPremium) return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="screen-title">MI CUENTA</div>
      <div className="premium-active-wrap">
        <LogoBM size={56} />
        <div style={{ height: 14 }} />
        <div className="premium-active-title">CUENTA PREMIUM</div>
        <div className="premium-active-status">👑 ACTIVA</div>
        <div className="premium-active-until">Válido hasta: 06 de Mayo, 2026</div>
        <div className="premium-perks">
          {[
            ['📅', 'Picks diarios completos', '10+ picks con análisis por jornada'],
            ['🎲', 'Cuotas Altas', 'Picks de alto valor desbloqueados'],
            ['⚡', 'Análisis on-demand', '15 análisis por día con pipeline IA'],
            ['📋', 'Análisis completo', 'Forma · H2H · Poisson · Factores clave'],
            ['⚽', 'Todos los mercados', '1X2 · BTTS · Over/Under · Doble Chance'],
            ['📊', 'Track record', 'Historial completo verificado con datos reales'],
          ].map(([icon, title, sub], i) => (
            <div key={i} className="premium-perk-row">
              <span className="premium-perk-icon">{icon}</span>
              <div>
                <div className="premium-perk-title">{title}</div>
                <div className="premium-perk-sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="screen-title">HAZTE PREMIUM</div>

      <div className="premium-features-grid">
        {[
          ['⚡', '15 análisis/día', 'on-demand con IA'],
          ['🎯', '10+ picks',       'por jornada'],
          ['📊', 'Track record',    'verificado'],
          ['💎', 'Cuotas Altas',    'valor extremo'],
        ].map(([icon, title, sub], i) => (
          <div key={i} className="premium-feature-card">
            <div className="premium-feature-icon">{icon}</div>
            <div className="premium-feature-title">{title}</div>
            <div className="premium-feature-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="compare-table">
        <div className="compare-header">
          <div></div><div>FREE</div><div>PREMIUM</div>
        </div>
        {[
          ['Picks del día',        '2',     '10+'],
          ['Análisis por pick',    '🔒',    '✅'],
          ['Cuotas Altas',         '🔒',    '✅'],
          ['Análisis on-demand',   '1/día', '15/día'],
          ['BTTS & Over/Under',    '🔒',    '✅'],
          ['Doble Chance picks',   '🔒',    '✅'],
          ['Track record',         '✅',    '✅'],
          ['Staking & Edge (EV)',  '🔒',    '✅'],
        ].map(([feat, free, prem], i) => (
          <div key={i} className="compare-row">
            <div className="compare-feature">{feat}</div>
            <div className="compare-free">{free}</div>
            <div className="compare-prem">{prem}</div>
          </div>
        ))}
      </div>

      <div className="plans-label">ELIGE TU PLAN</div>
      <div className="plans-list">
        <div className="plan-card">
          <div className="plan-name">MENSUAL</div>
          <div style={{ flex:1 }} />
          <div>
            <div className="plan-price">$19<span>/mes</span></div>
            <div className="plan-stars">1,462 ⭐</div>
          </div>
        </div>
        <div className="plan-card featured">
          <div className="plan-popular-badge">MÁS POPULAR</div>
          <div className="plan-name">TRIMESTRAL</div>
          <div style={{ flex:1 }} />
          <div style={{ textAlign:'right' }}>
            <div className="plan-price">$49<span>/3m</span></div>
            <div className="plan-stars">3,769 ⭐</div>
            <div className="plan-saving">Ahorras $8</div>
          </div>
        </div>
        <div className="plan-card">
          <div className="plan-name">ANUAL</div>
          <div style={{ flex:1 }} />
          <div style={{ textAlign:'right' }}>
            <div className="plan-price">$149<span>/año</span></div>
            <div className="plan-stars">11,462 ⭐</div>
            <div className="plan-saving">Ahorras $79</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 18px 8px' }}>
        <button className="btn-primary">⭐ PAGAR CON TELEGRAM STARS</button>
      </div>
      <div style={{ padding:'0 18px 8px' }}>
        <button className="btn-secondary">💳 PAGAR CON TARJETA</button>
      </div>
      <div className="pay-note">✅ Acceso inmediato · ✅ Sin permanencia · ✅ Cancela cuando quieras</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  ANALYZE SCREEN
// ═══════════════════════════════════════════════════
const AGENT_STEPS = [
  'Agente 1 — Recolectando datos del partido...',
  'Agente 2 — Validando estadísticas reales...',
  'Agente 3 — Analizando forma y H2H...',
  'Agente 4 — Generando predicción Poisson...',
  'Agente 5 — Calculando Edge vs mercado...',
  'Agente 6 — Redactando análisis completo...',
  'Agente 7 — Guardando en memoria...',
]

function AnalyzeScreen({ isPremium, onGoToPremium }) {
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [step,     setStep]     = useState(0)
  const [result,   setResult]   = useState(null)
  const remaining = isPremium ? 15 : 1
  const stepRef = useRef(null)

  const canAnalyze = input.toLowerCase().includes('vs') && input.trim().length > 6

  const handleAnalyze = async () => {
    if (!canAnalyze || loading) return
    setLoading(true); setResult(null); setStep(0)
    let s = 0
    stepRef.current = setInterval(() => {
      s++; setStep(s)
      if (s >= AGENT_STEPS.length - 1) clearInterval(stepRef.current)
    }, 400)
    try {
      const parts = input.split(/\svs\.?\s/i)
      const home = parts[0]?.trim()
      const away = parts[1]?.trim()
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_team: home, away_team: away, sport: 'football' })
      })
      const data = await res.json()
      clearInterval(stepRef.current)
      setStep(AGENT_STEPS.length)
      setResult({
        home, away,
        pick: data.pick_principal || 'Local',
        conservador: data.pick_conservador || '',
        confianza: data.confianza || 0,
        ev: data.ev || null,
        analisis: (data.analysis || '').replace(/[*_`]/g, '').replace(/─+/g, '').trim(),
ev: null,
cuota: null,
confianza_real: data.confianza || 0,
      })
    } catch {
      clearInterval(stepRef.current)
      setResult({ error: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="screen-title">ANÁLISIS ON-DEMAND</div>
      <div className="analyze-remaining">
        ⚡ {remaining} análisis restantes hoy &nbsp;·&nbsp; Pipeline de 7 agentes IA
      </div>

      <div className="analyze-form">
        <input
          className="analyze-input"
          placeholder="Barcelona vs Real Madrid"
          value={input}
          onChange={e => { setInput(e.target.value); setResult(null) }}
          onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
        />
        <button className="btn-primary" onClick={handleAnalyze} disabled={!canAnalyze || loading}>
          {loading ? '⏳ ANALIZANDO...' : '⚡ ANALIZAR PARTIDO'}
        </button>
      </div>
      <div className="analyze-hint">Formato: Equipo1 vs Equipo2 &nbsp;·&nbsp; Ej: Bayern vs Dortmund</div>

      {loading && (
        <div className="loading-card">
          <div className="loading-spinner" />
          <div className="loading-title">Procesando 7 agentes IA...</div>
          <div className="loading-sub">Puede tardar 30–60 segundos en producción</div>
          <div className="agent-steps">
            {AGENT_STEPS.map((s, i) => (
              <div key={i} className={`agent-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                <span>{i < step ? '✓' : i === step ? '▶' : ' '}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="result-card">
          <div className="result-match-header">{result.home} vs {result.away}</div>
          <div className="data-box" style={{ borderRadius:0, border:'none', borderTop:'1px solid var(--bg-3)', margin:0 }}>
            <div className="data-row"><span className="data-label">PICK</span><span className="data-value r">Local</span></div>
            <div className="data-row"><span className="data-label">CUOTA</span><span className="data-value">@1.85</span></div>
            <div className="data-row">
              <span className="data-label">CONFIANZA</span>
              <div style={{ textAlign:'right' }}>
                <div className="data-value">✅ 73%</div>
                <div className="conf-bar">{confBar(73)}</div>
              </div>
            </div>
            <div className="data-row"><span className="data-label">EDGE (EV)</span><span className="data-value g">📊 +6.2% — valor positivo</span></div>
            <div className="data-row"><span className="data-label">STAKING</span><span className="data-value">💰 1.5 unidades</span></div>
          </div>
          {isPremium ? (
            <div className="result-analysis-text">
              🏠 El equipo local llega en buena forma (4V-1E últimos 5). Sus delanteros han marcado en todos los partidos de casa recientes.<br /><br />
              ✈️ El visitante arrastra problemas defensivos, 8 goles concedidos en 3 salidas. Moral baja tras 2 derrotas consecutivas.<br /><br />
              ⚽ H2H favorable al local (6-2-2 últimos 10). Probabilidades Poisson: Local 52% · Empate 24% · Visitante 24%.
            </div>
          ) : (
            <div className="result-locked-note">
              🔒 Análisis completo disponible con Premium<br />
              <span style={{ color:'var(--red)', cursor:'pointer' }} onClick={onGoToPremium}>Ver planes →</span>
            </div>
          )}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  BOTTOM NAV
// ═══════════════════════════════════════════════════
const TABS = [
  { id:'home',    icon:'🏠', label:'HOME'     },
  { id:'picks',   icon:'🎯', label:'PICKS'    },
  { id:'stats',   icon:'📊', label:'STATS'    },
  { id:'premium', icon:'💎', label:'PREMIUM'  },
  { id:'analyze', icon:'⚡', label:'ANÁLISIS' },
]

function BottomNav({ active, onNav }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button key={t.id} className={`nav-btn ${active === t.id ? 'active' : ''}`} onClick={() => onNav(t.id)}>
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

// ═══════════════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════════════
export default function App() {
  const [screen,    setScreen]    = useState('home')
  const [isPremium, setIsPremium] = useState(false)
  const [pickIdx,   setPickIdx]   = useState(null)
  const [realPicks, setRealPicks] = useState(null)
  const [chatId,    setChatId]    = useState(null)

  useEffect(() => {
    WebApp.ready()
    const user = WebApp.initDataUnsafe?.user
    if (user?.id) {
      setChatId(user.id)
      fetch(`${API_URL}/user/${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.plan === 'premium' && data.premium_until) {
            const exp = new Date(data.premium_until)
            if (exp > new Date()) setIsPremium(true)
          }
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    fetchDailyTips().then(picks => {
      if (picks && picks.length > 0) setRealPicks(picks)
    })
  }, [])

  const goToPicks = (idx = null) => {
    setPickIdx(idx)
    setScreen('picks')
  }

  const goToPremium = () => setScreen('premium')

  const handleNav = (id) => {
    setScreen(id)
    setPickIdx(null)
  }

  return (
    <div className="app">
      <div className="content">
        {screen === 'home'    && <HomeScreen    isPremium={isPremium} onGoToPicks={goToPicks} onGoToPremium={goToPremium} picks={realPicks || MOCK_PICKS} />}
        {screen === 'picks'   && <PicksScreen   isPremium={isPremium} initialIdx={pickIdx}    onGoToPremium={goToPremium} picks={realPicks || MOCK_PICKS} />}
        {screen === 'stats'   && <StatsScreen   isPremium={isPremium} />}
        {screen === 'premium' && <PremiumScreen isPremium={isPremium} />}
        {screen === 'analyze' && <AnalyzeScreen isPremium={isPremium} onGoToPremium={goToPremium} />}
      </div>

      <BottomNav active={screen} onNav={handleNav} />

      {/* DEV TOGGLE — eliminar en producción */}
      <button className="dev-toggle" onClick={() => setIsPremium(p => !p)}>
        {isPremium ? '→ FREE' : '→ PRO'}
      </button>
    </div>
  )
}