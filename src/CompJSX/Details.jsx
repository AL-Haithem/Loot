import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import axios from "axios"
import logo from "../assets/imgs/logo.png"
import "../CompCss/Details.css"
import PurchaseSection from "./PurchaseSection.jsx"
import { useCart } from "../CartContext.jsx"
import { API_BASE } from "../api.js"

/* ─── Constants ──────────────────────────────── */
const STEAM_STORE_API = "https://store.steampowered.com/api/appdetails"

/* ─── Helpers ────────────────────────────────── */
function scoreColor(score) {
    if (score >= 75) return "#4ade80"
    if (score >= 50) return "#fbbf24"
    return "#f87171"
}

/* ─── Inline section skeleton ────────────────── */
function SectionSkeleton({ lines = 3, height = 14 }) {
    return (
        <div className="dt-inline-sk">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="dt-sk dt-sk-line"
                    style={{ width: `${100 - i * 15}%`, height }}
                />
            ))}
        </div>
    )
}

function BlockSkeleton({ height = 200 }) {
    return <div className="dt-sk dt-sk-block" style={{ height }} />
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

/* ─── Cover image area ───────────────────────── */
function CoverArea({ src, name, mc, loading, failed }) {
    if (loading) return <div className="dt-sk dt-sk-cover" />
    if (failed || !src) return (
        <div className="dt-cover-placeholder">
            <i className="fab fa-steam" />
            <span>No cover art</span>
        </div>
    )
    return (
        <div className="dt-hero-cover">
            <img src={src} alt={name} className="dt-cover-img" />
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
    )
}

/* ─── Main Page ──────────────────────────────── */
export default function DetailsPage() {
    const { appId }     = useParams()
    const location      = useLocation()
    const stateGame     = location.state?.game   // basic data from GameCard
    const { totalCount } = useCart()

    /* ── Steam data (fetched in browser from Steam API) ── */
    const [steam, setSteam]           = useState(null)
    const [steamLoading, setSteamLoading] = useState(true)
    const [steamFailed, setSteamFailed]   = useState(false)

    /* ── Price data from our backend ── */
    // Initialise with stateGame price if navigated from GameCard
    const [priceData, setPriceData]   = useState(stateGame ?? null)
    const [priceLoading, setPriceLoading] = useState(!stateGame)

    useEffect(() => {
        let alive = true
        setSteam(null)
        setSteamLoading(true)
        setSteamFailed(false)

        // If the stateGame doesn't match current appId, clear it
        if (stateGame?.steam_appid !== Number(appId)) {
            setPriceData(null)
            setPriceLoading(true)
        }

        /* Fetch rich game details from Steam store API (browser-direct) */
        fetch(`${STEAM_STORE_API}?appids=${appId}&l=english`)
            .then(r => r.json())
            .then(json => {
                if (!alive) return
                const entry = json?.[appId]
                if (entry?.success && entry.data) {
                    setSteam(entry.data)
                } else {
                    setSteamFailed(true)
                }
            })
            .catch(() => { if (alive) setSteamFailed(true) })
            .finally(() => { if (alive) setSteamLoading(false) })

        /* Fetch price-only from our backend — in parallel */
        if (!stateGame || stateGame.steam_appid !== Number(appId)) {
            axios.get(`${API_BASE}/api/public/games/${appId}`)
                .then(res => { if (alive) setPriceData(res.data?.data ?? null) })
                .catch(() => { if (alive) setPriceData(null) })
                .finally(() => { if (alive) setPriceLoading(false) })
        }

        return () => { alive = false }
    }, [appId]) // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Derived from Steam data ── */
    const bg        = steam?.background_raw || steam?.background
    const cover     = steam?.header_image
    const name      = steam?.name || stateGame?.name || `App ${appId}`
    const genres    = steam?.genres?.map(g => g.description) || []
    const cats      = steam?.categories?.map(c => c.description) || []
    const devs      = steam?.developers || []
    const pubs      = steam?.publishers || []
    const mc        = steam?.metacritic
    const rel       = steam?.release_date
    const shots     = steam?.screenshots || []
    const shortDesc = steam?.short_description || ""
    const platforms = steam?.platforms
    const steamUrl  = `https://store.steampowered.com/app/${appId}`

    /* ── Merged game object for PurchaseSection ── */
    const gameForPurchase = {
        ...(priceData ?? {}),
        steam_appid: Number(appId),
        head:        cover || stateGame?.head,
        name,
        is_free:     steam?.is_free ?? priceData?.is_free,
    }

    return (
        <div className="dt-root">
            {/* ── Blurred background from Steam art ── */}
            {bg && <div className="dt-bg" style={{ backgroundImage: `url(${bg})` }} />}
            <div className="dt-bg-overlay" />

            {/* ══ Sticky Header ════════════════════════════ */}
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

            {/* ══ Main Content ════════════════════════════ */}
            <main className="dt-main">

                {/* ── Hero strip — always rendered ── */}
                <div className="dt-hero-strip">

                    {/* Cover column */}
                    <CoverArea
                        src={cover}
                        name={name}
                        mc={mc}
                        loading={steamLoading}
                        failed={steamFailed}
                    />

                    {/* Info column */}
                    <div className="dt-hero-info">
                        {/* Trust badges — always shown */}
                        <div className="dt-store-badges">
                            <span className="dt-sbadge dt-sbadge-original"><i className="fas fa-shield-halved" /> Original</span>
                            <span className="dt-sbadge dt-sbadge-global"><i className="fas fa-globe" /> Global</span>
                            <span className="dt-sbadge dt-sbadge-fast"><i className="fas fa-bolt" /> Fast Delivery</span>
                        </div>

                        {/* Title */}
                        {steamLoading
                            ? <div className="dt-sk dt-sk-line" style={{ width: "70%", height: 40, marginBottom: 8 }} />
                            : <h1 className="dt-title">{name}</h1>
                        }

                        {/* Genres */}
                        {steamLoading && <SectionSkeleton lines={1} height={22} />}
                        {!steamLoading && genres.length > 0 && (
                            <div className="dt-genres">
                                {genres.map(g => <span key={g} className="dt-genre-tag">{g}</span>)}
                            </div>
                        )}

                        {/* Short description */}
                        {steamLoading && <SectionSkeleton lines={3} height={13} />}
                        {!steamLoading && steamFailed && (
                            <p className="dt-steam-notice">
                                <i className="fas fa-triangle-exclamation" /> Game details unavailable from Steam API
                            </p>
                        )}
                        {!steamLoading && !steamFailed && shortDesc && (
                            <p className="dt-short-desc">{shortDesc}</p>
                        )}

                        {/* Meta row */}
                        {steamLoading
                            ? <SectionSkeleton lines={2} height={14} />
                            : (
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
                            )
                        }

                        {/* Platforms */}
                        {!steamLoading && <Platforms platforms={platforms} />}

                        {/* Steam link */}
                        <a href={steamUrl} target="_blank" rel="noreferrer" className="dt-steam-link">
                            <i className="fab fa-steam" /> View on Steam
                        </a>
                    </div>
                </div>

                {/* ── Two-column body ── */}
                <div className="dt-body">

                    {/* Left: gallery + categories */}
                    <div className="dt-left-col">
                        <section className="dt-section">
                            <h2 className="dt-section-title">
                                <i className="fas fa-images" /> Screenshots
                            </h2>
                            {steamLoading && <BlockSkeleton height={240} />}
                            {!steamLoading && steamFailed && (
                                <div className="dt-section-fail">
                                    <i className="fas fa-image-slash" />
                                    <span>Screenshots unavailable</span>
                                </div>
                            )}
                            {!steamLoading && !steamFailed && shots.length === 0 && (
                                <div className="dt-section-fail">
                                    <i className="fas fa-image" />
                                    <span>No screenshots available</span>
                                </div>
                            )}
                            {!steamLoading && !steamFailed && shots.length > 0 && (
                                <Gallery shots={shots} />
                            )}
                        </section>

                        {(steamLoading || cats.length > 0) && (
                            <section className="dt-section">
                                <h2 className="dt-section-title">
                                    <i className="fas fa-tags" /> Features
                                </h2>
                                {steamLoading && <SectionSkeleton lines={4} height={32} />}
                                {!steamLoading && cats.length > 0 && (
                                    <div className="dt-cats-grid">
                                        {cats.map(c => (
                                            <span key={c} className="dt-cat-chip">
                                                <i className="fas fa-check-circle" /> {c}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Right: purchase — always rendered */}
                    <div className="dt-right-col">
                        <div className="dt-purchase-sticky">
                            <PurchaseSection game={gameForPurchase} priceLoading={priceLoading} />
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}
