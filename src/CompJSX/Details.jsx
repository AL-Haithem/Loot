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
        <div className="dt-skeleton">
            <div className="dt-sk-hero-area">
                <div className="dt-sk-pulse dt-sk-title" />
                <div className="dt-sk-pulse dt-sk-sub" />
                <div className="dt-sk-pulse dt-sk-badges" />
            </div>
            <div className="dt-sk-purchase-area">
                <div className="dt-sk-pulse" style={{ height: 220 }} />
            </div>
            <div className="dt-sk-info-area">
                <div className="dt-sk-pulse" style={{ height: 80 }} />
                <div className="dt-sk-pulse" style={{ height: 120 }} />
                <div className="dt-sk-pulse" style={{ height: 80 }} />
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

    const bg         = game?.background_raw || game?.background
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
            {bg && <div className="dt-bg" style={{ backgroundImage: `url(${bg})` }} />}
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
                    <div className="dt-page-wrapper">

                        {/* ══ TOP HERO: Title + Quick Info ══ */}
                        <section className="dt-hero-section">
                            <div className="dt-hero-text">
                                <h1 className="dt-game-title">{game.name}</h1>

                                <div className="dt-hero-badges">
                                    <Platforms platforms={game.platforms} />

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
                                </div>
                            </div>

                            {/* Steam link subtle */}
                            <a
                                href={`https://store.steampowered.com/app/${appId}`}
                                target="_blank" rel="noreferrer"
                                className="dt-steam-ext-link"
                            >
                                <i className="fab fa-steam" /> View on Steam
                            </a>
                        </section>

                        {/* ══ PURCHASE — HERO OF THE PAGE ══ */}
                        <section className="dt-purchase-hero">
                            <PurchaseSection game={gameForPurchase} priceLoading={loading} />
                        </section>

                        {/* ══ DETAILS GRID: Categories + Languages ══ */}
                        <section className="dt-details-grid">

                            {game.categories && game.categories.length > 0 && (
                                <div className="dt-detail-card">
                                    <h3 className="dt-detail-heading">
                                        <i className="fas fa-tags" /> Categories
                                    </h3>
                                    <div className="dt-tags-list">
                                        {game.categories.map(c => (
                                            <span key={c.id} className="dt-tag">{c.description}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {game.supported_languages && (
                                <div className="dt-detail-card">
                                    <h3 className="dt-detail-heading">
                                        <i className="fas fa-language" /> Supported Languages
                                    </h3>
                                    <p
                                        className="dt-languages-text"
                                        dangerouslySetInnerHTML={{ __html: game.supported_languages }}
                                    />
                                </div>
                            )}

                        </section>

                    </div>
                )}
            </main>
        </div>
    )
}
