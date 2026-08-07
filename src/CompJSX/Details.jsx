import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import axios from "axios"
import logo from "../assets/imgs/logo.png"
import "../CompCss/Details.css"
import PurchaseSection from "./PurchaseSection.jsx"
import { useCart } from "../CartContext.jsx"
import { API_BASE } from "../api.js"

/* ─── Platform Badges ─────────────────────── */
function Platforms({ plt }) {
    if (!plt) return null
    const icons = [
        { key: "windows", icon: "fab fa-windows", label: "Windows" },
        { key: "mac",     icon: "fab fa-apple",   label: "Mac"     },
        { key: "linux",   icon: "fab fa-linux",   label: "Linux"   },
    ]
    const available = icons.filter(({ key }) => plt?.[key])
    if (!available.length) return null
    return (
        <div className="dt-platforms">
            {available.map(({ key, icon, label }) => (
                <span key={key} className="dt-platform-badge" title={label}>
                    <i className={icon} /> {label}
                </span>
            ))}
        </div>
    )
}

/* ─── Release Date ────────────────────────── */
function formatRelease(rel) {
    if (!rel) return "Unknown"
    // rel can be a timestamp (ms) or a date string
    if (typeof rel === "number") {
        return new Date(rel).toLocaleDateString("en-GB", {
            year: "numeric", month: "short", day: "numeric"
        })
    }
    return String(rel)
}

/* ─── Skeleton ──────────────────────────── */
function PageSkeleton() {
    return (
        <div className="dt-hero-layout">
            <div className="dt-hero-left">
                <div className="dt-sk-pulse" style={{ height: 24, width: "30%", borderRadius: 8, marginBottom: 16 }} />
                <div className="dt-sk-pulse" style={{ height: 80, width: "85%", borderRadius: 12, marginBottom: 24 }} />
                <div className="dt-sk-pulse" style={{ height: 20, width: "60%", borderRadius: 8, marginBottom: 16 }} />
                <div className="dt-sk-pulse" style={{ height: 20, width: "50%", borderRadius: 8, marginBottom: 40 }} />
                <div className="dt-sk-pulse" style={{ height: 48, width: "40%", borderRadius: 12 }} />
            </div>
            <div className="dt-hero-right">
                <div className="dt-sk-pulse" style={{ height: 520, borderRadius: 20 }} />
            </div>
        </div>
    )
}

/* ─── Main Page ──────────────────────────── */
export default function DetailsPage() {
    const { appId } = useParams()
    const { totalCount } = useCart()
    const location = useLocation()
    const stateGame = location.state?.game

    const [game, setGame] = useState(null)
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let alive = true
        setLoading(true)
        setFailed(false)
        setGame(null)

        axios.get(`${API_BASE}/api/public/games/${appId}`)
            .then(res => {
                if (!alive) return
                // New API shape: { data: { price, discount, appid, name, rec, rel, bg, age, plt } }
                const gameData = res.data?.data || res.data
                if (gameData && Object.keys(gameData).length > 0) {
                    setGame(gameData)
                } else {
                    setFailed(true)
                }
            })
            .catch(() => { if (alive) setFailed(true) })
            .finally(() => { if (alive) setLoading(false) })

        return () => { alive = false }
    }, [appId])

    // New API fields
    const bg      = game?.bg
    const relStr  = formatRelease(game?.rel)
    const age     = game?.age || 0
    const rec     = game?.rec || 0
    const plt     = game?.plt

    return (
        <div className="dt-root">
            {bg && <div className="dt-bg" style={{ backgroundImage: `url("${bg}")` }} />}
            <div className="dt-bg-overlay" />

            {/* ── Header ── */}
            <header className="dt-header">
                <Link to="/games" className="dt-back">
                    <i className="fas fa-arrow-left" /> Store
                </Link>
                <Link to="/" className="dt-header-brand">
                    <img src={logo} alt="HNK Store" />
                    <span>HNK Store</span>
                </Link>
                <div className="dt-header-right">
                    <Link to="/login" className="dt-header-account">
                        <i className="fas fa-user" /><span>Account</span>
                    </Link>
                    <Link to="/cart" className="dt-header-cart">
                        <i className="fas fa-shopping-bag" />
                        {totalCount > 0 && <span className="dt-cart-badge">{totalCount}</span>}
                    </Link>
                </div>
            </header>

            <main className="dt-main">
                {loading ? (
                    <PageSkeleton />
                ) : failed || !game ? (
                    <div className="dt-failed-msg">
                        <i className="fas fa-exclamation-triangle" />
                        <h2>Game not found</h2>
                        <p>The game might not exist or the server is unreachable.</p>
                        <Link to="/games" className="dt-back-btn">
                            <i className="fas fa-arrow-left" /> Back to Store
                        </Link>
                    </div>
                ) : (
                    <div className="dt-hero-layout">

                        {/* ══ LEFT: Game Info Hero ══ */}
                        <div className="dt-hero-left">

                            {/* Decorative label */}
                            <div className="dt-hero-label">
                                <i className="fab fa-steam" /> Steam Game
                            </div>

                            {/* Game title */}
                            <h1 className="dt-game-title">{game.name}</h1>

                            {/* Age restriction */}
                            {age > 0 && (
                                <div className="dt-age-warning">
                                    <i className="fas fa-user-shield" />
                                    <span>Rated <strong>{age}+</strong> — Mature content</span>
                                </div>
                            )}

                            {/* Meta info */}
                            <div className="dt-meta-grid">
                                <div className="dt-meta-item">
                                    <i className="fas fa-calendar-alt" />
                                    <div>
                                        <span className="dt-meta-label">Release Date</span>
                                        <span className="dt-meta-value">{relStr}</span>
                                    </div>
                                </div>
                                {rec > 0 && (
                                    <div className="dt-meta-item dt-meta-positive">
                                        <i className="fas fa-thumbs-up" />
                                        <div>
                                            <span className="dt-meta-label">Recommendations</span>
                                            <span className="dt-meta-value">
                                                {Number(rec).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Platforms */}
                            <Platforms plt={plt} />

                            {/* Steam link */}
                            <a
                                href={`https://store.steampowered.com/app/${game.appid || appId}`}
                                target="_blank" rel="noreferrer"
                                className="dt-steam-ext-link"
                            >
                                <i className="fab fa-steam" /> View on Steam
                            </a>
                        </div>

                        {/* ══ RIGHT: Purchase Panel ══ */}
                        <div className="dt-hero-right">
                            <PurchaseSection game={game} />
                        </div>

                    </div>
                )}
            </main>
        </div>
    )
}
