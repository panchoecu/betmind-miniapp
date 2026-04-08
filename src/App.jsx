import { useState, useEffect, useRef } from 'react'
import './App.css'
import WebApp from '@twa-dev/sdk'

const API_URL = 'https://webhook.tuagentevirtual.info'

// ═══════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════
const TODAY = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' })

const MOCK_STATS = {
  mes: 'Abril 2026', ganados: 47, perdidos: 18, total: 65,
  pct: 72.3, yield: 18.4, racha: 5,
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
      { t:'🏠 Local — Barcelona', txt:'Excelente forma (4V-1E últimos 5). Pedri y Gavi recuperados. En el Camp Nou: 8 victorias en los últimos 10 como local.' },
      { t:'✈️ Visitante — Atlético Madrid', txt:'Irregular fuera de casa (2V-2E-1D últimos 5). Sin Griezmann por sanción. Defensa compacta pero vulnerable en transiciones.' },
      { t:'⚽ Head to Head', txt:'Últimos 10: Barcelona 6V · Empates 2 · Atlético 2. En Camp Nou 7-1-2 en la última década.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 54% · Empate 22% · Visitante 24% · BTTS 68% · Over 2.5: 61%.' },
      { t:'🔑 Factores clave', txt:'Recuperación de Pedri y Gavi · Ausencia de Griezmann · Value positivo @1.85 con EV +7.2%' },
    ],
  },
  {
    id:2, home:'PSG', away:'Lyon', league:'Ligue 1',
    pick:'Local (PSG)', conservador:'Handicap PSG -1',
    odd:1.65, conf:82, ev:9.1, time:'21:00', btts:false, ou:true, locked:false,
    analisis:[
      { t:'🏠 Local — PSG', txt:'Mbappé recuperado al 100%. Dembélé en estado de gracia con 6 goles en los últimos 5. 18 partidos sin perder en casa.' },
      { t:'✈️ Visitante — Lyon', txt:'Media-tabla sin regularidad. Defensa con al menos 1 gol concedido en los últimos 7 fuera.' },
      { t:'⚽ Head to Head', txt:'PSG ganó los últimos 5 directos con media de 2.8 goles.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 61% · Empate 20% · Visitante 19% · Over 2.5: 64%.' },
      { t:'🔑 Factores clave', txt:'Mbappé y Dembélé imparables · PSG invicto en casa · EV +9.1%' },
    ],
  },
  {
    id:3, home:'Boca Juniors', away:'River Plate', league:'Liga Profesional',
    pick:'BTTS — Sí', conservador:'Over 1.5 goles',
    odd:1.90, conf:71, ev:5.4, time:'18:00', btts:true, ou:true, locked:true,
    analisis:[
      { t:'🏠 Local — Boca Juniors', txt:'Superclásico en La Bombonera. Cavani en buen momento con 3 goles en los últimos 4.' },
      { t:'✈️ Visitante — River Plate', txt:'Borja y Colidio en forma. River ha marcado en sus últimos 8 consecutivos.' },
      { t:'⚽ Head to Head', txt:'BTTS se dio en 7 de los últimos 10 Superclásicos.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 38% · Empate 28% · Visitante 34% · BTTS 72%.' },
      { t:'🔑 Factores clave', txt:'Presión ofensiva de ambos · H2H muy favorable a BTTS · @1.90' },
    ],
  },
  {
    id:4, home:'Bayern Munich', away:'Dortmund', league:'Bundesliga',
    pick:'Over 2.5 Goles', conservador:'BTTS — Sí',
    odd:1.70, conf:75, ev:6.8, time:'17:30', btts:true, ou:true, locked:true,
    analisis:[
      { t:'🏠 Local — Bayern Munich', txt:'Promedia 3.1 goles por partido en casa. Kane con 22 goles en liga.' },
      { t:'✈️ Visitante — Dortmund', txt:'Han marcado mínimo 1 gol en sus últimas 5 salidas.' },
      { t:'⚽ Head to Head', txt:'Over 2.5 en 8 de los últimos 10 Der Klassiker.' },
      { t:'📊 Probabilidades Poisson', txt:'Over 2.5: 74% · Over 3.5: 48% · BTTS: 68%.' },
      { t:'🔑 Factores clave', txt:'Bayern 3+ goles en casa · Kane en racha · EV +6.8% @1.70' },
    ],
  },
  {
    id:5, home:'Real Madrid', away:'Sevilla', league:'La Liga',
    pick:'Local (Real Madrid)', conservador:'HC Real Madrid -1',
    odd:1.55, conf:80, ev:8.8, time:'22:00', btts:false, ou:true, locked:true,
    analisis:[
      { t:'🏠 Local — Real Madrid', txt:'Bellingham y Vinícius imparables. 14 partidos sin perder en casa.' },
      { t:'✈️ Visitante — Sevilla', txt:'1V-1E-3D en las últimas 5 salidas. Defensa permeable.' },
      { t:'⚽ Head to Head', txt:'Madrid ganó 7 de los últimos 10. Bernabéu: 8-1-1 en la última década.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 62% · Empate 22% · Visitante 16%.' },
      { t:'🔑 Factores clave', txt:'Bernabéu inexpugnable · Sevilla en racha negativa · EV +8.8% @1.55' },
    ],
  },
  {
    id:6, home:'Inter Milan', away:'Napoli', league:'Serie A',
    pick:'Local (Inter Milan)', conservador:'Doble Chance 1X',
    odd:1.95, conf:68, ev:4.3, time:'19:45', btts:false, ou:false, locked:true,
    analisis:[
      { t:'🏠 Local — Inter Milan', txt:'Sólido en casa. Lautaro en forma (2 goles últimos 3). San Siro: 7V-2E-1D.' },
      { t:'✈️ Visitante — Napoli', txt:'Osimhen cargado físicamente, irregular fuera de casa.' },
      { t:'⚽ Head to Head', txt:'Inter ganó 3 de los últimos 5. Media 1.8 goles por partido.' },
      { t:'📊 Probabilidades Poisson', txt:'Local 46% · Empate 26% · Visitante 28%. Over 2.5: 36%.' },
      { t:'🔑 Factores clave', txt:'Inter sólido en casa · Osimhen al 70% · Staking conservador recomendado' },
    ],
  },
]

const MOCK_RISKY = [
  {
    id:7, home:'Espanyol', away:'Getafe', league:'La Liga',
    pick:'Local (Espanyol)', conservador:'Doble Chance 1X',
    odd:3.40, conf:65, ev:12.1, time:'19:00', btts:false, ou:false, locked:true,
    analisis:[
      { t:'⚠️ Pick de Alto Valor', txt:'Espanyol motivado en casa ante Getafe. El modelo Poisson da 48% al local pero la cuota lo infravalora.' },
      { t:'🔑 Factores clave', txt:'@3.40 con probabilidad real ~48% · EV +12.1% · Bankroll: 1 unidad máximo' },
    ],
  },
  {
    id:8, home:'Huachipato', away:'Colo-Colo', league:'Primera Chile',
    pick:'Visitante +1.5 Goles', conservador:'Over 2.5 goles',
    odd:2.80, conf:67, ev:9.2, time:'22:00', btts:true, ou:true, locked:true,
    analisis:[
      { t:'⚠️ Pick de Alto Valor', txt:'Colo-Colo favorito claro. Huachipato en zona baja. Visitante ganó las últimas 3 salidas marcando 2+.' },
      { t:'🔑 Factores clave', txt:'Colo-Colo en forma · EV +9.2% @2.80 · Excelente relación riesgo/retorno' },
    ],
  },
]

// ═══════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════
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

const confLevel = (c) => c >= 78 ? 'HIGH' : c >= 68 ? 'MEDIUM' : 'LOW'
const confClass = (c) => c >= 78 ? 'high' : c >= 68 ? 'mid' : 'low'
const confColor = (c) => c >= 78 ? 'var(--green)' : c >= 68 ? 'var(--gold)' : 'var(--orange)'
const confBar   = (c) => '█'.repeat(Math.floor(c / 10)) + '░'.repeat(10 - Math.floor(c / 10))
const aiEdge    = (ev, conf) => ((ev * 0.4 + conf * 0.06)).toFixed(1)

const staking = (c, ev) => {
  if (ev >= 10 && c >= 75) return '3 unidades'
  if (c >= 75 || ev >= 7)  return '2 unidades'
  if (c >= 65)             return '1.5 unidades'
  return '1 unidad'
}
const evLabel = (ev) =>
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
//  CONFIDENCE BAR
// ═══════════════════════════════════════════════════
function ConfBar({ value }) {
  const cls = confClass(value)
  return (
    <div className="prob-bar-wrap">
      <div className="prob-bar-track">
        <div className={`prob-bar-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
      <span className="prob-bar-pct" style={{ color: confColor(value) }}>
        {value}%
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  AI EDGE BADGE
// ═══════════════════════════════════════════════════
function AIEdgeBadge({ ev, conf }) {
  const edge = aiEdge(ev, conf)
  const level = confLevel(conf)
  return (
    <div className="ai-edge-badge">
      <div className="ai-edge-item">
        <div className="ai-edge-label">AI EDGE</div>
        <div className="ai-edge-value">{edge}/10</div>
      </div>
      <div className="ai-edge-sep" />
      <div className="ai-edge-item">
        <div className="ai-edge-label">Confidence</div>
        <div className="ai-edge-value">{level}</div>
      </div>
      <div className="ai-edge-sep" />
      <div className="ai-edge-item">
        <div className="ai-edge-label">EV Edge</div>
        <div className="ai-edge-value">+{ev}%</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  APP HEADER
// ═══════════════════════════════════════════════════
function AppHeader({ isPremium }) {
  return (
    <div className="app-header">
      <div className="brand-name">
        Bet<span className="accent">Mind</span>
        <span className="brand-ai">AI</span>
      </div>
      <div className={`plan-badge ${isPremium ? 'prem' : ''}`}>
        {isPremium ? '👑 PREMIUM' : '⚡ FREE'}
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

  const topPick = allPicks[0]
  const restPicks = allPicks.slice(1, isPremium ? 3 : 2)

  return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />

      <div className="home-datebar">
        <span>{TODAY}</span>
        <span>·</span>
        <span className="hl">✅ {allPicks.length} picks verificados hoy</span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">ACIERTOS</div>
          <div className="stat-value r"><AnimNum value={s.pct} suffix="%" dec={1} /></div>
          <div className="stat-sub">{s.ganados}W · {s.perdidos}L</div>
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
          <div className="stat-sub">
            {isPremium ? 'acceso completo' : `${FREE_PICKS_LIMIT} gratis · ${MOCK_PICKS.length} total`}
          </div>
        </div>
      </div>

      {/* TOP PICK */}
      <div className="section-label">🔥 TOP PICK DEL DÍA</div>
      {topPick && (
        <div className="top-pick-card" onClick={() => onGoToPicks(0)}>
          <div className="top-pick-badge">🔥 TOP PICK · HIGH CONFIDENCE</div>
          <div className="top-pick-league">{topPick.league} · {topPick.time} UTC</div>
          <div className="top-pick-teams">
            {topPick.home} <span style={{color:'var(--t3)', fontWeight:300}}>vs</span> {topPick.away}
          </div>
          <div className="top-pick-info">
            <span className="top-pick-pick">{topPick.pick}</span>
            <span className="top-pick-odd">@{topPick.odd}</span>
          </div>
          <AIEdgeBadge ev={topPick.ev} conf={topPick.conf} />
        </div>
      )}

      {/* More Picks */}
      <div className="section-label">PICKS DESTACADOS</div>
      <div className="preview-picks">
        {restPicks.map((p, i) => {
          const locked = !isPremium && i >= 1
          return (
            <div
              key={p.id}
              className={`preview-card ${locked ? 'locked' : ''}`}
              onClick={() => !locked && onGoToPicks(i + 1)}
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
                    <span className="preview-conf" style={{ color: confColor(p.conf) }}>
                      {p.conf}%
                    </span>
                  </>
                )}
              </div>
              {!locked && <ConfBar value={p.conf} />}
            </div>
          )
        })}
      </div>

      {!isPremium && (
        <div className="home-cta" onClick={onGoToPremium}>
          <div className="home-cta-title">👑 Bet like a pro — Unlock Elite Picks</div>
          <div className="home-cta-sub">
            {MOCK_PICKS.length} picks · 15 análisis IA/día · Desde $19/mes
          </div>
        </div>
      )}

      {isPremium && <div style={{ height: 16 }} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  RENDER ANALYSIS
// ═══════════════════════════════════════════════════
function RenderAnalysis({ text }) {
  const lines = text.split('\n').filter(l => l.trim())
  const sections = []
  let currentSection = null

  for (const line of lines) {
    const clean = line.replace(/[*_]/g, '').trim()
    if (!clean) continue
    if (clean.match(/^(🏠|✈️|📋|🔑|📅|⚽|📊|⚠️)/)) {
      if (currentSection) sections.push(currentSection)
      currentSection = { type: 'section', title: clean, text: '' }
    } else if (currentSection) {
      currentSection.text += (currentSection.text ? ' ' : '') + clean
    } else {
      sections.push({ type: 'conclusion', text: clean })
    }
  }
  if (currentSection) sections.push(currentSection)

  return (
    <div className="ana-rendered">
      {sections.map((s, i) => {
        if (s.type === 'section') return (
          <div key={i} className="ana-section">
            <div className="ana-section-title">{s.title}</div>
            <div className="ana-section-text">{s.text}</div>
          </div>
        )
        return <div key={i} className="ana-conclusion">{s.text}</div>
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  PICKS SCREEN
// ═══════════════════════════════════════════════════
function PicksScreen({ isPremium, initialIdx, onGoToPremium, picks: realPicksProp }) {
  const [view,   setView]   = useState(initialIdx !== null ? 'detail' : 'list')
  const [selIdx, setSelIdx] = useState(initialIdx ?? null)
  const [tab,    setTab]    = useState('main')

  const mainPicks = (realPicksProp || MOCK_PICKS).map((p, i) => ({
    ...p,
    home:        p.home || p.home_team,
    away:        p.away || p.away_team,
    locked:      !isPremium && i >= 2,
    pick:        p.pick || p.pick_principal,
    conf:        p.conf || p.confidence,
    conservador: p.conservador || p.pick_conservador,
    analisis:    p.analisis || (p.analysis ? [{ t:'📊 Análisis', txt: p.analysis.trim() }] : []),
  }))

  const picks = tab === 'risky' ? MOCK_RISKY : mainPicks

  const openDetail   = (i) => { setSelIdx(i); setView('detail') }
  const openAnalysis = ()  => setView('analysis')
  const backToList   = ()  => { setView('list'); setSelIdx(null) }
  const backToDetail = ()  => setView('detail')

  /* ── LIST ── */
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
          const isTop = i === 0 && tab === 'main'
          return (
            <div
              key={p.id}
              className={`pick-card ${locked ? 'locked' : ''}`}
              style={isTop ? { borderLeftColor:'var(--green)', boxShadow:'var(--green-glow)' } : {}}
              onClick={() => openDetail(i)}
            >
              <div className="pick-card-top">
                <span className="pick-league">
                  {isTop ? '🔥 TOP · ' : ''}{p.league}
                </span>
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
                <span className="pick-arrow">›</span>
              </div>
              {!locked && <ConfBar value={p.conf} />}
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

  /* ── DETAIL ── */
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
            <div className="locked-odds">Cuota: @{p.odd} · Conf: {p.conf}%</div>
            <button className="btn-primary" onClick={onGoToPremium}>👑 VER PLANES PREMIUM</button>
          </div>
        ) : (
          <>
            <div className="data-box">
              <div className="data-row">
                <span className="data-label">PICK PRINCIPAL</span>
                <span className="data-value o">{p.pick}</span>
              </div>
              <div className="data-row">
                <span className="data-label">PICK CONSERVADOR</span>
                <span className="data-value y">{p.conservador}</span>
              </div>
              <div className="data-row">
                <span className="data-label">CUOTA BET365</span>
                <span className="data-value">@{p.odd}</span>
              </div>
              <div className="data-row">
                <span className="data-label">CONFIANZA</span>
                <div style={{ flex:1, marginLeft:16 }}>
                  <ConfBar value={p.conf} />
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
                <span className={`market-tag ${p.ou ? 'on' : ''}`}>Over 2.5 {p.ou ? '✓' : '✗'}</span>
              </div>
            </div>

            <AIEdgeBadge ev={p.ev} conf={p.conf} />

            <div style={{ height: 14 }} />

            <button className="analysis-cta" onClick={openAnalysis}>
              <div className="analysis-cta-left">
                <span className="analysis-cta-icon">📋</span>
                <div>
                  <div className="analysis-cta-title">VER ANÁLISIS COMPLETO</div>
                  <div className="analysis-cta-sub">Forma · H2H · Poisson · 7 Agentes IA</div>
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

  /* ── ANALYSIS ── */
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
        <div className="analysis-meta">Pipeline 7 agentes IA · {p.league} · {p.time} UTC</div>

        {locked ? (
          <div className="analysis-locked-box">
            <div className="locked-icon">🔒</div>
            <div className="locked-title">ANÁLISIS BLOQUEADO</div>
            <div className="locked-sub">El análisis completo incluye:</div>
            <div className="analysis-locked-list">
              • Forma real últimos 5 partidos<br />
              • Historial H2H detallado<br />
              • Lesiones y bajas confirmadas<br />
              • Probabilidades Poisson (7 agentes IA)<br />
              • Edge vs mercado (EV)<br />
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
  const [stats,   setStats]   = useState(MOCK_STATS)
  const [history, setHistory] = useState(MOCK_HISTORY)

  useEffect(() => {
    fetchTrackRecord().then(data => {
      if (!data || !data.available) return
      setStats({
        mes:      data.mes || MOCK_STATS.mes,
        ganados:  data.wins ?? MOCK_STATS.ganados,
        perdidos: (data.total - data.wins) ?? MOCK_STATS.perdidos,
        total:    data.total ?? MOCK_STATS.total,
        pct:      data.pct ?? MOCK_STATS.pct,
        yield:    data.avg_roi ?? MOCK_STATS.yield,
        racha:    data.streak ?? MOCK_STATS.racha,
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
        <div className="stats-month-label">✅ {s.mes} — verificado</div>
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
          <span className="s">🔥 {s.racha} racha</span>
        </div>
      </div>

      <div className="section-label">HISTORIAL MENSUAL</div>
      <div className="history-chart">
        {history.map((h, i) => (
          <div key={i} className="chart-col">
            <div className="chart-pct">{h.pct}%</div>
            <div className="chart-bar-wrap">
              <div className="chart-bar" style={{ height: `${(h.pct / max) * 100}%` }} />
            </div>
            <div className="chart-label">{h.mes.split(' ')[0]}</div>
          </div>
        ))}
      </div>
      <div className="stats-verified">✅ Verificado API-Football Pro · Actualizado nightly 23:00</div>

      <div className="history-table">
        <div className="history-table-header">
          <span>MES</span><span>PICKS</span><span>ACIERTO</span><span>YIELD</span>
        </div>
        {history.map((h, i) => (
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
function PremiumScreen({ isPremium, chatId }) {
  const lemonUrl = `https://nura.lemonsqueezy.com/checkout/buy/ac29116a-8103-4236-9287-621edda68e5c?checkout%5Bcustom%5D%5Bchat_id%5D=${chatId || ''}`

  if (isPremium) return (
    <div className="screen">
      <AppHeader isPremium={isPremium} />
      <div className="screen-title">MI CUENTA</div>
      <div className="premium-active-wrap">
        <div className="premium-active-title">CUENTA PREMIUM</div>
        <div className="premium-active-status">👑 ACTIVA</div>
        <div className="premium-active-until">Válido hasta: 06 de Mayo, 2026</div>
        <div className="premium-perks">
          {[
            ['📅', 'Picks diarios completos', '10+ picks con análisis por jornada'],
            ['🎲', 'Cuotas Altas', 'Picks de alto valor desbloqueados'],
            ['⚡', 'Análisis on-demand', '15 análisis por día con pipeline IA'],
            ['📋', 'Análisis completo', 'Forma · H2H · Poisson · 7 Agentes'],
            ['⚽', 'Todos los mercados', '1X2 · BTTS · Over/Under · Doble Chance'],
            ['📊', 'Track record', 'Historial verificado con datos reales'],
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
          ['Picks del día',       '2',     '10+'],
          ['Análisis por pick',   '🔒',    '✅'],
          ['Cuotas Altas',        '🔒',    '✅'],
          ['Análisis on-demand',  '1/día', '15/día'],
          ['BTTS & Over/Under',   '🔒',    '✅'],
          ['AI Edge badge',       '🔒',    '✅'],
          ['Staking & Edge (EV)', '🔒',    '✅'],
          ['Track record',        '✅',    '✅'],
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
        <button className="btn-secondary" onClick={() => window.open(lemonUrl, '_blank')}>
          💳 PAGAR CON TARJETA
        </button>
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
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [step,    setStep]    = useState(0)
  const [result,  setResult]  = useState(null)
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
    }, 500)
    try {
      const parts = input.split(/\svs\.?\s/i)
      const home  = parts[0]?.trim()
      const away  = parts[1]?.trim()
      const res   = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_team: home, away_team: away, sport: 'football' }),
      })
      const data = await res.json()
      clearInterval(stepRef.current)
      setStep(AGENT_STEPS.length)
      setResult({
        home, away,
        pick:      data.pick_principal || 'Local',
        confianza: data.confianza || 73,
        ev:        data.value_edge || 6.2,
        odd:       data.odd_pick || 1.85,
        analisis:  (data.analysis || '').replace(/[*_`]/g, '').trim(),
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
        ✅ {remaining} análisis restantes · Pipeline de 7 agentes IA
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
      <div className="analyze-hint">Formato: Equipo1 vs Equipo2 · Ej: Bayern vs Dortmund</div>

      {loading && (
        <div className="loading-card">
          <div className="loading-spinner" />
          <div className="loading-title">Procesando 7 agentes IA...</div>
          <div className="loading-sub">Puede tardar 30–60 segundos</div>
          <div className="agent-steps">
            {AGENT_STEPS.map((s, i) => (
              <div key={i} className={`agent-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                <span>{i < step ? '✓' : i === step ? '▶' : '·'}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && !loading && !result.error && (
        <div className="result-card">
          <div className="result-match-header">{result.home} vs {result.away}</div>
          <div className="data-box" style={{ borderRadius:0, border:'none', borderTop:'1px solid var(--bg-3)', margin:0 }}>
            <div className="data-row">
              <span className="data-label">PICK</span>
              <span className="data-value o">{result.pick}</span>
            </div>
            <div className="data-row">
              <span className="data-label">CUOTA</span>
              <span className="data-value">@{result.odd}</span>
            </div>
            <div className="data-row">
              <span className="data-label">CONFIANZA</span>
              <div style={{ flex:1, marginLeft:16 }}>
                <ConfBar value={result.confianza} />
              </div>
            </div>
            <div className="data-row">
              <span className="data-label">EDGE (EV)</span>
              <span className="data-value g">{evLabel(result.ev)}</span>
            </div>
            <div className="data-row">
              <span className="data-label">STAKING</span>
              <span className="data-value">💰 {staking(result.confianza, result.ev)}</span>
            </div>
          </div>
          <div style={{ padding:'14px 18px' }}>
            <AIEdgeBadge ev={result.ev} conf={result.confianza} />
          </div>
          {isPremium && result.analisis ? (
            <div className="result-analysis-text">
              <RenderAnalysis text={result.analisis} />
            </div>
          ) : (
            <div className="result-locked-note">
              🔒 Análisis completo disponible con Premium<br />
              <span style={{ color:'var(--orange)', cursor:'pointer' }} onClick={onGoToPremium}>
                Ver planes →
              </span>
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div className="result-card" style={{ padding:20, textAlign:'center' }}>
          <div style={{ color:'var(--t3)', fontFamily:'var(--fm)', fontSize:11 }}>
            ⚠️ Error al conectar con la API. Verifica tu conexión.
          </div>
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
        <button
          key={t.id}
          className={`nav-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onNav(t.id)}
        >
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
    try { WebApp.ready() } catch(e) {}
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

  const goToPicks   = (idx = null) => { setPickIdx(idx); setScreen('picks') }
  const goToPremium = () => setScreen('premium')
  const handleNav   = (id) => { setScreen(id); setPickIdx(null) }

  return (
    <div className="app">
      <div className="content">
        {screen === 'home'    && <HomeScreen    isPremium={isPremium} onGoToPicks={goToPicks}    onGoToPremium={goToPremium} picks={realPicks || MOCK_PICKS} />}
        {screen === 'picks'   && <PicksScreen   isPremium={isPremium} initialIdx={pickIdx}        onGoToPremium={goToPremium} picks={realPicks || MOCK_PICKS} />}
        {screen === 'stats'   && <StatsScreen   isPremium={isPremium} />}
        {screen === 'premium' && <PremiumScreen isPremium={isPremium} chatId={chatId} />}
        {screen === 'analyze' && <AnalyzeScreen isPremium={isPremium} onGoToPremium={goToPremium} />}
      </div>
      <BottomNav active={screen} onNav={handleNav} />
      <button className="dev-toggle" onClick={() => setIsPremium(p => !p)}>
        {isPremium ? '→ FREE' : '→ PRO'}
      </button>
    </div>
  )
}