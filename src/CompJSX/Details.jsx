import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import axios from "axios"
import logo from "../assets/imgs/logo.png"
import "../CompCss/Details.css"
import PurchaseSection from "./PurchaseSection.jsx"
import { useCart } from "../CartContext.jsx"
import { API_BASE } from "../api.js"

/* ─── Platform Badges ─────────────────────── */
function Platforms({ platforms }) {
    const icons = [
        { key: "windows", icon: "fab fa-windows", label: "Windows" },
        { key: "mac",     icon: "fab fa-apple",   label: "Mac"     },
        { key: "linux",   icon: "fab fa-linux",   label: "Linux"   },
    ]
    const available = icons.filter(({ key }) => platforms?.[key])
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

/* ─── Skeleton ──────────────────────────── */
function PageSkeleton() {
    return (
        <div className="dt-purchase-focused-wrapper">
            <div className="dt-sk-pulse" style={{ height: 60, width: "50%", marginBottom: 16, borderRadius: 12 }} />
            <div className="dt-sk-pulse" style={{ height: 32, width: "70%", marginBottom: 32, borderRadius: 8 }} />
            <div className="dt-sk-pulse" style={{ height: 420, borderRadius: 20 }} />
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

    const bg = game?.background_raw || game?.background
    const releaseStr = game?.release_date?.date || "Unknown"
    const isComingSoon = game?.release_date?.coming_soon

    const gameForPurchase = {
        ...(game ?? {}),
        steam_appid: Number(appId),
        head: game?.header_image || stateGame?.head,
        name: game?.name || stateGame?.name || `App ${appId}`,
        is_free: game?.is_free,
        price_overview: game?.price_overview,
        Price: game?.Price,
    }

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

            <main className="dt-main dt-new-layout">
                {loading ? (
                    <PageSkeleton />
                ) : failed || !game ? (
                    <div className="dt-failed-msg">
                        <i className="fas fa-exclamation-triangle" />
                        <h2>Game not found</h2>
                        <p>The game might not exist or the server is unreachable.</p>
                        <Link to="/games" className="dt-back-btn"><i className="fas fa-arrow-left" /> Back to Store</Link>
                    </div>
                ) : (
                    <div className="dt-purchase-focused-wrapper">

                        {/* ══ HERO: Title + Badges ══ */}
                        <section className="dt-hero-section">
                            <h1 className="dt-game-title">{game.name}</h1>

                            <div className="dt-hero-badges">
                                <Platforms platforms={game.platforms} />

                                {/* Required Age — show badge only if > 0 */}
                                {game.required_age > 0 && (
                                    <span className="dt-badge dt-age-badge">
                                        <i className="fas fa-user-shield" /> {game.required_age}+
                                    </span>
                                )}

                                {game.recommendations?.total > 0 && (
                                    <span className="dt-badge dt-recommend-badge">
                                        <i className="fas fa-thumbs-up" />
                                        {game.recommendations.total.toLocaleString()} Recommended
                                    </span>
                                )}

                                <span className="dt-badge dt-release-badge">
                                    <i className="fas fa-calendar" />
                                    {isComingSoon ? "Coming Soon" : releaseStr}
                                </span>

                                <a
                                    href={`https://store.steampowered.com/app/${appId}`}
                                    target="_blank" rel="noreferrer"
                                    className="dt-steam-ext-link"
                                >
                                    <i className="fab fa-steam" /> View on Steam
                                </a>
                            </div>
                        </section>

                        {/* ══ PURCHASE — full width, the star of the page ══ */}
                        <section className="dt-purchase-section">
                            <PurchaseSection game={gameForPurchase} priceLoading={loading} />
                        </section>

                    </div>
                )}
            </main>
        </div>
    )
}
