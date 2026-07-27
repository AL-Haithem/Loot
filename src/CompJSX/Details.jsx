import { useEffect, useState, useRef } from "react"
import { Link, useParams } from "react-router"
import axios from "axios"
import logo from "../assets/imgs/logo.png"
import "../CompCss/Details.css"
import PurchaseSection from "./PurchaseSection.jsx"
import { useCart } from "../CartContext.jsx"
import { API_BASE } from "../api.js"

/* ─── Constants ──────────────────────────────── */
const STEAM_STORE_API = "https://store.steampowered.com/api/appdetails"

/* ─── Helpers ────────────────────────────────── */
function fmtDate(str) {
    if (!str) return null
    const d = new Date(str)
    return isNaN(d) ? str : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function scoreColor(score) {
    if (score >= 75) return "#4ade80"
    if (score >= 50) return "#fbbf24"
    return "#f87171"
}

/* ─── Skeleton ───────────────────────────────── */
function Skeleton() {
    return (
        <div className="dt-skeleton">
            <div className="dt-sk dt-sk-hero" />
            <div className="dt-sk-body">
                <div className="dt-sk-left">
                    <div className="dt-sk dt-sk-cover" />
                    <div className="dt-sk dt-sk-line" style={{ width: "80%", height: 14 }} />
                    <div className="dt-sk dt-sk-line" style={{ width: "60%", height: 12 }} />
                    <div className="dt-sk dt-sk-block" />
                </div>
                <div className="dt-sk-right">
                    <div className="dt-sk dt-sk-line" style={{ width: "70%", height: 40 }} />
                    <div className="dt-sk dt-sk-line" style={{ width: "90%", height: 16 }} />
                    <div className="dt-sk dt-sk-line" style={{ width: "75%", height: 16 }} />
                    <div className="dt-sk dt-sk-block" style={{ height: 120 }} />
                    <div className="dt-sk dt-sk-block" style={{ height: 200 }} />
                </div>
            </div>
        </div>
    )
}

/* ─── Screenshots Gallery ─────────────────────── */
function Gallery({ shots }) {
    const [active, setActive] = useState(0)
    if (!shots?.length) return null

    return (
        <div className="dt-gallery">
            <div className="dt-gallery-main">
                <img
                    key={active}
                    src={shots[active].path_full}
                    alt={`screenshot ${active + 1}`}
                    className="dt-gallery-main-img"
                />
                <div className="dt-gallery-overlay">
                    <button
                        className="dt-gallery-nav"
                        onClick={() => setActive(p => Math.max(0, p - 1))}
                        disabled={active === 0}
                    >
                        <i className="fas fa-chevron-left" />
                    </button>
                    <span className="dt-gallery-count">{active + 1} / {shots.length}</span>
                    <button
                        className="dt-gallery-nav"
                        onClick={() => setActive(p => Math.min(shots.length - 1, p + 1))}
                        disabled={active === shots.length - 1}
                    >
                        <i className="fas fa-chevron-right" />
                    </button>
                </div>
            </div>
            <div className="dt-gallery-thumbs">
                {shots.slice(0, 8).map((s, i) => (
                    <button
                        key={s.id}
                        className={`dt-thumb-btn ${i === active ? "active" : ""}`}
                        onClick={() => setActive(i)}
                    >
                        <img src={s.path_thumbnail} alt="" />
                    </button>
                ))}
            </div>
        </div>
    )
}

/* ─── Platform Icons ─────────────────────────── */
function Platforms({ platforms }) {
    const icons = [
        { key: "windows", icon: "fab fa-windows", label: "Windows" },
        { key: "mac",     icon: "fab fa-apple",   label: "Mac" },
        { key: "linux",   icon: "fab fa-linux",   label: "Linux" },
    ]
    return (
        <div className="dt-platforms">
            {icons.map(({ key, icon, label }) =>
                platforms?.[key] ? (
                    <span key={key} className="dt-platform-badge" title={label}>
                        <i className={icon} /> {label}
                    </span>
                ) : null
            )}
        </div>
    )
}

/* ─── Main Page ──────────────────────────────── */
export default function DetailsPage() {
    const { appId } = useParams()
    const { totalCount } = useCart()

    /* Steam data (from browser direct) */
    const [steam, setSteam]     = useState(null)
    const [steamErr, setSteamErr] = useState(false)
    const [steamLoading, setSteamLoading] = useState(true)

    /* Price data (from our backend) */
    const [priceData, setPriceData] = useState(null)

    useEffect(() => {
        let alive = true
        setSteam(null)
        setSteamErr(false)
        setSteamLoading(true)

        /* Fetch game details from Steam store API */
        fetch(`${STEAM_STORE_API}?appids=${appId}&l=english`)
            .then(r => r.json())
            .then(json => {
                if (!alive) return
                const entry = json?.[appId]
                if (entry?.success && entry.data) {
                    setSteam(entry.data)
                } else {
                    setSteamErr(true)
                }
            })
            .catch(() => { if (alive) setSteamErr(true) })
            .finally(() => { if (alive) setSteamLoading(false) })

        /* Fetch price from our backend — run in parallel */
        axios.get(`${API_BASE}/api/public/games/${appId}`)
            .then(res => { if (alive) setPriceData(res.data?.data) })
            .catch(() => { /* price remains null; PurchaseSection will handle gracefully */ })

        return () => { alive = false }
    }, [appId])

    /* Derived values */
    const bg       = steam?.background_raw || steam?.background
    const cover    = steam?.header_image
    const name     = steam?.name || "Unknown Game"
    const genres   = steam?.genres?.map(g => g.description) || []
    const cats     = steam?.categories?.map(c => c.description) || []
    const devs     = steam?.developers || []
    const pubs     = steam?.publishers || []
    const mc       = steam?.metacritic
    const rel      = steam?.release_date
    const shots    = steam?.screenshots || []
    const shortDesc = steam?.short_description || ""
    const platforms = steam?.platforms

    /* Build a merged game object for PurchaseSection (needs Price from backend) */
    const gameForPurchase = priceData
        ? { ...priceData, steam_appid: Number(appId), head: cover, name }
        : { steam_appid: Number(appId), head: cover, name, is_free: steam?.is_free, Price: null }

    const steamUrl = `https://store.steampowered.com/app/${appId}`

    const isLoading = steamLoading
    const isError   = !steamLoading && steamErr

    return (
        <div className="dt-root">
            {/* ── Hero blur background ── */}
            {bg && <div className="dt-bg" style={{ backgroundImage: `url(${bg})` }} />}
            <div className="dt-bg-overlay" />

            {/* ── Sticky Header ── */}
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

            {/* ── Content ── */}
            <main className="dt-main">
                {isLoading && <Skeleton />}

                {isError && (
                    <div className="dt-error">
                        <i className="fas fa-circle-exclamation" />
                        <h2>Game not found</h2>
                        <p>This game may not be available or the Steam API is unreachable.</p>
                        <Link to="/games" className="dt-error-btn">Back to Store</Link>
                    </div>
                )}

                {!isLoading && !isError && steam && (
                    <>
                        {/* ── Hero strip (cover + title + quick tags) ── */}
                        <div className="dt-hero-strip">
                            <div className="dt-hero-cover">
                                <img src={cover} alt={name} className="dt-cover-img" />
                                {mc && (
                                    <a
                                        href={mc.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="dt-metascore"
                                        style={{ "--mc-clr": scoreColor(mc.score) }}
                                    >
                                        <span className="dt-metascore-num">{mc.score}</span>
                                        <span className="dt-metascore-label">Metacritic</span>
                                    </a>
                                )}
                            </div>

                            <div className="dt-hero-info">
                                <div className="dt-store-badges">
                                    <span className="dt-sbadge dt-sbadge-original"><i className="fas fa-shield-halved" /> Original</span>
                                    <span className="dt-sbadge dt-sbadge-global"><i className="fas fa-globe" /> Global</span>
                                    <span className="dt-sbadge dt-sbadge-fast"><i className="fas fa-bolt" /> Fast Delivery</span>
                                </div>

                                <h1 className="dt-title">{name}</h1>

                                {genres.length > 0 && (
                                    <div className="dt-genres">
                                        {genres.map(g => <span key={g} className="dt-genre-tag">{g}</span>)}
                                    </div>
                                )}

                                {shortDesc && (
                                    <p className="dt-short-desc">{shortDesc}</p>
                                )}

                                <div className="dt-meta-row">
                                    {rel && (
                                        <div className="dt-meta-item">
                                            <i className="fas fa-calendar-days" />
                                            <div>
                                                <span>{rel.coming_soon ? "Coming Soon" : "Released"}</span>
                                                <strong>{rel.date || "TBA"}</strong>
                                            </div>
                                        </div>
                                    )}
                                    {devs.length > 0 && (
                                        <div className="dt-meta-item">
                                            <i className="fas fa-code" />
                                            <div>
                                                <span>Developer</span>
                                                <strong>{devs.join(", ")}</strong>
                                            </div>
                                        </div>
                                    )}
                                    {pubs.length > 0 && (
                                        <div className="dt-meta-item">
                                            <i className="fas fa-building" />
                                            <div>
                                                <span>Publisher</span>
                                                <strong>{pubs.join(", ")}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Platforms platforms={platforms} />

                                <a href={steamUrl} target="_blank" rel="noreferrer" className="dt-steam-link">
                                    <i className="fab fa-steam" /> View on Steam
                                </a>
                            </div>
                        </div>

                        {/* ── Two-column body ── */}
                        <div className="dt-body">
                            {/* ── Left column: gallery + categories ── */}
                            <div className="dt-left-col">
                                {shots.length > 0 && (
                                    <section className="dt-section">
                                        <h2 className="dt-section-title">
                                            <i className="fas fa-images" /> Screenshots
                                        </h2>
                                        <Gallery shots={shots} />
                                    </section>
                                )}

                                {cats.length > 0 && (
                                    <section className="dt-section">
                                        <h2 className="dt-section-title">
                                            <i className="fas fa-tags" /> Features
                                        </h2>
                                        <div className="dt-cats-grid">
                                            {cats.map(c => (
                                                <span key={c} className="dt-cat-chip">
                                                    <i className="fas fa-check-circle" /> {c}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* ── Right column: purchase ── */}
                            <div className="dt-right-col">
                                <div className="dt-purchase-sticky">
                                    <PurchaseSection game={gameForPurchase} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
