import { useEffect, useState, useRef, useLayoutEffect } from "react"
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

/* ─── Expandable Box ──────────────────────── */
function ExpandableBox({ title, icon, children }) {
    const [expanded, setExpanded] = useState(false)
    const [needsExpand, setNeedsExpand] = useState(false)
    const contentRef = useRef(null)

    useLayoutEffect(() => {
        const checkHeight = () => {
            if (contentRef.current) {
                if (contentRef.current.scrollHeight > 100) {
                    setNeedsExpand(true)
                } else {
                    setNeedsExpand(false)
                }
            }
        }
        
        checkHeight()
        // Wait for images or slow renders
        const timer = setTimeout(checkHeight, 100)
        return () => clearTimeout(timer)
    }, [children])

    return (
        <div className="dt-detail-card">
            <h3 className="dt-detail-heading">
                <i className={icon} /> {title}
            </h3>
            <div 
                className={`dt-expand-content ${expanded ? "expanded" : ""}`} 
                ref={contentRef}
            >
                {children}
            </div>
            {needsExpand && (
                <button 
                    className="dt-expand-btn" 
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? "Show Less" : "Show More"} <i className={`fas fa-chevron-${expanded ? "up" : "down"}`} />
                </button>
            )}
        </div>
    )
}

/* ─── Skeleton ──────────────────────────── */
function PageSkeleton() {
    return (
        <div className="dt-skeleton">
            <div className="dt-sk-hero-area">
                <div className="dt-sk-pulse dt-sk-title" />
                <div className="dt-sk-pulse dt-sk-badges" />
            </div>
            <div className="dt-sk-main-area">
                <div className="dt-sk-pulse" style={{ height: 300 }} />
                <div className="dt-sk-pulse" style={{ height: 300 }} />
                <div className="dt-sk-pulse" style={{ height: 300 }} />
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

    const bg = game?.background_raw || game?.background || "https://store.akamai.steamstatic.com/images/storepagebackground/app/413150?t=1754692865"
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
                    <div className="dt-page-wrapper dt-wide">

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
                                    
                                    <a
                                        href={`https://store.steampowered.com/app/${appId}`}
                                        target="_blank" rel="noreferrer"
                                        className="dt-steam-ext-link"
                                    >
                                        <i className="fab fa-steam" /> View on Steam
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* ══ 3-COLUMN MAIN LAYOUT ══ */}
                        <section className="dt-three-col-layout">
                            
                            {/* LEFT COLUMN: Categories */}
                            <div className="dt-side-column">
                                {game.categories && game.categories.length > 0 && (
                                    <ExpandableBox title="Categories" icon="fas fa-tags">
                                        <div className="dt-tags-list">
                                            {game.categories.map(c => (
                                                <span key={c.id} className="dt-tag">{c.description}</span>
                                            ))}
                                        </div>
                                    </ExpandableBox>
                                )}
                            </div>

                            {/* CENTER COLUMN: Purchase Hero (Instant + Deal Hunt) */}
                            <div className="dt-center-column">
                                <PurchaseSection game={gameForPurchase} priceLoading={loading} />
                            </div>

                            {/* RIGHT COLUMN: Languages */}
                            <div className="dt-side-column">
                                {game.supported_languages && (
                                    <ExpandableBox title="Languages" icon="fas fa-language">
                                        <p
                                            className="dt-languages-text"
                                            dangerouslySetInnerHTML={{ __html: game.supported_languages }}
                                        />
                                    </ExpandableBox>
                                )}
                            </div>

                        </section>

                    </div>
                )}
            </main>
        </div>
    )
}
