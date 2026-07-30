import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import axios from "axios"
import logo from "../assets/imgs/logo.png"
import "../CompCss/Details.css"
import PurchaseSection from "./PurchaseSection.jsx"
import { useCart } from "../CartContext.jsx"
import { API_BASE } from "../api.js"

/* ─── Platform Badges ────────────────────────── */
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

/* ─── Skeleton Loader ────────────────────────── */
function DetailSkeleton() {
    return (
        <div className="dt-skeleton-loader">
            <div className="dt-sk-line" style={{ width: "40%", height: 40, marginBottom: 20 }} />
            <div className="dt-sk-line" style={{ width: "80%", height: 20, marginBottom: 10 }} />
            <div className="dt-sk-line" style={{ width: "60%", height: 20, marginBottom: 30 }} />
            
            <div className="dt-sk-grid">
                <div className="dt-sk-box" style={{ height: 100 }} />
                <div className="dt-sk-box" style={{ height: 100 }} />
            </div>
        </div>
    )
}

/* ─── Main Page ──────────────────────────────── */
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

        // Fetch full game details from our backend
        axios.get(`${API_BASE}/api/public/games/${appId}`)
            .then(res => {
                if (!alive) return
                // Assuming data is inside res.data.data or res.data
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

    // Format Release Date
    const releaseStr = game?.release_date?.date || "Unknown"
    const isComingSoon = game?.release_date?.coming_soon

    // Purchase game object compatibility
    const gameForPurchase = {
        ...(game ?? {}),
        steam_appid: Number(appId),
        head: game?.header_image || stateGame?.head,
        name: game?.name || stateGame?.name || `App ${appId}`,
        is_free: game?.is_free,
        // Map price_overview directly for the purchase component if needed
        price_overview: game?.price_overview
    }

    return (
        <div className="dt-root">
            {/* Background Image */}
            {bg && <div className="dt-bg" style={{ backgroundImage: `url(${bg})` }} />}
            <div className="dt-bg-overlay" />

            {/* Header */}
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
                        <i className="fas fa-user" />
                        <span>Account</span>
                    </Link>
                    <Link to="/cart" className="dt-header-cart">
                        <i className="fas fa-shopping-bag" />
                        {totalCount > 0 && <span className="dt-cart-badge">{totalCount}</span>}
                    </Link>
                </div>
            </header>

            <main className="dt-main dt-new-layout">
                {loading ? (
                    <DetailSkeleton />
                ) : failed || !game ? (
                    <div className="dt-failed-msg">
                        <i className="fas fa-exclamation-triangle" />
                        <h2>Failed to load game details.</h2>
                        <p>The game might not exist or the server is unreachable.</p>
                    </div>
                ) : (
                    <div className="dt-content-grid">
                        
                        {/* LEFT COLUMN: Game Information */}
                        <div className="dt-info-column">
                            <h1 className="dt-title">{game.name}</h1>
                            
                            <div className="dt-meta-row">
                                <Platforms platforms={game.platforms} />
                                
                                {game.required_age > 0 && (
                                    <span className="dt-badge dt-age-badge" title="Required Age">
                                        <i className="fas fa-user-shield" /> {game.required_age}+
                                    </span>
                                )}
                                
                                {game.recommendations?.total > 0 && (
                                    <span className="dt-badge dt-recommend-badge" title="Recommendations">
                                        <i className="fas fa-thumbs-up" /> {game.recommendations.total.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            <div className="dt-info-box">
                                <h3><i className="fas fa-calendar-alt" /> Release Date</h3>
                                <p className="dt-release-date">
                                    {isComingSoon ? <span className="dt-coming-soon">Coming Soon</span> : null}
                                    {releaseStr}
                                </p>
                            </div>

                            {game.categories && game.categories.length > 0 && (
                                <div className="dt-info-box">
                                    <h3><i className="fas fa-tags" /> Categories</h3>
                                    <div className="dt-tags-list">
                                        {game.categories.map(c => (
                                            <span key={c.id} className="dt-tag">{c.description}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {game.supported_languages && (
                                <div className="dt-info-box dt-languages">
                                    <h3><i className="fas fa-language" /> Supported Languages</h3>
                                    <p dangerouslySetInnerHTML={{ __html: game.supported_languages }} />
                                </div>
                            )}

                        </div>

                        {/* RIGHT COLUMN: Purchase Component */}
                        <div className="dt-purchase-column">
                            <div className="dt-purchase-sticky">
                                <PurchaseSection game={gameForPurchase} priceLoading={loading} />
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    )
}
