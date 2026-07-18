import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import axios from "axios"
import logo from "../assets/imgs/logo.png"
import "../CompCss/Details.css"
import { steamAssetUrl } from "../StandardComp/GameCard.jsx"

function formatPrice(price) {
    if (!price?.final || price.final <= 0) return "Unavailable"

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.currency || "USD"
    }).format(price.final / 100)
}

function formatDate(rel) {
    if (!rel?.date) return "Not specified"
    const date = new Date(rel.date)
    if (Number.isNaN(date.getTime())) return rel.date

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    })
}

export default function DetailsPage() {
    const { appId } = useParams()
    const location = useLocation()
    const stateGame = location.state?.game
    const [game, setGame] = useState(stateGame || null)
    const [isLoading, setIsLoading] = useState(!stateGame)
    const [error, setError] = useState("")

    useEffect(() => {
        let isMounted = true

        if (stateGame?.steam_appid === Number(appId) && game?.steam_appid !== stateGame.steam_appid) {
            setGame(stateGame)
            setIsLoading(false)
            setError("")
        }

        async function fetchGame() {
            setIsLoading(!stateGame)
            setError("")

            try {
                const res = await axios.get(`https://loot-api.alhaithem.site/api/public/games/${appId}`)
                if (isMounted) {
                    setGame(res.data.data)
                }
            } catch (err) {
                if (isMounted) {
                    setGame(null)
                    setError(err?.response?.status === 404 ? "Game not found" : "Unable to load game details")
                }
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        fetchGame()
        return () => { isMounted = false }
    }, [appId, stateGame])

    const usPrice = game?.Price?.US
    const priceText = useMemo(() => formatPrice(usPrice), [usPrice])
    const releaseText = useMemo(() => formatDate(game?.rel), [game?.rel])
    const steamUrl = `https://store.steampowered.com/app/${appId}`
    const whatsappText = encodeURIComponent(`I want to buy ${game?.name || appId} for ${priceText}`)

    return (
        <>
            {game?.bg && <div className="hero-bg" style={{ backgroundImage: `url(${steamAssetUrl(game.bg)})` }}></div>}

            <header className="details-header">
                <Link to="/games" className="btn-back"><span className="fa fa-arrow-left"> Back</span></Link>

                <div className="logo-wrapper">
                    <div id="detailLogo" className="logo-text">Hnk Store</div>
                    <img src={logo} className="header-logo" alt="Logo" />
                </div>

                <Link to="/cart" className="cart-icon-link">
                    <i className="fas fa-shopping-cart"></i>
                    <span id="cartBadge" className="cart-badge">0</span>
                </Link>
            </header>

            <main className="main-container">
                {isLoading && (
                    <>
                        <aside className="poster-section">
                            <div className="sticky-wrapper">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-info-poster">
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line"></div>
                                </div>
                            </div>
                        </aside>
                        <section className="info-section">
                            <div className="skeleton-title-large"></div>
                            <div className="skeleton-description">
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line-short"></div>
                            </div>
                        </section>
                    </>
                )}

                {!isLoading && error && <p className="details-message">{error}</p>}

                {!isLoading && game && (
                    <>
                        <aside className="poster-section">
                            <div className="sticky-wrapper">
                                <img className="game-img" src={steamAssetUrl(game.head)} alt={game.name || "Game poster"} />

                                <div className="basic-info-poster">
                                    <a href={steamUrl} target="_blank" rel="noreferrer">Open on Steam</a>
                                </div>
                            </div>
                        </aside>

                        <section className="info-section details-panel">
                            <div className="badges-row">
                                <span className="badge">Original Game</span>
                                <span className="badge">Global Activation</span>
                                <span className="badge">Fast Delivery</span>
                            </div>

                            <h1 className="details-title">{game.name || "Untitled"}</h1>

                            <div className="details-stats">
                                <div>
                                    <span>Price</span>
                                    <strong>{priceText}</strong>
                                </div>
                                <div>
                                    <span>Release</span>
                                    <strong>{releaseText}</strong>
                                </div>
                                <div>
                                    <span>Reviews</span>
                                    <strong>{game.recs?.total?.toLocaleString("en-US") || "0"}</strong>
                                </div>
                            </div>

                            <div className="description-card">
                                <p className="short-desc">This game is available to order through HnK Store. Use the purchase options below to complete your request.</p>
                            </div>

                            <div className="purchase-box">
                                <div className="final-price-wrapper">
                                    <span className="label">Lowest Price</span>
                                    <div id="finalPrice">{priceText}</div>
                                </div>
                                <div className="buy-actions">
                                    <a
                                        href={`https://wa.me/?text=${whatsappText}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="buy-button whatsapp"
                                    >
                                        <i className="fab fa-whatsapp"></i> Buy via WhatsApp
                                    </a>
                                    <button className="buy-button cart" type="button">
                                        <i className="fas fa-cart-plus"></i> Add to cart
                                    </button>
                                </div>
                            </div>

                            <p className="disclaimer">Prices include store commission. Delivery is fast and secure.</p>

                            <div className="extra-info">
                                <div className="extra-grid">
                                    <div><span className="info-label">Publisher</span>{game.publ?.join(", ") || "Not specified"}</div>
                                    <div>
                                        <span className="info-label">Genres</span>
                                        {game.gn?.flat().map(item => item.description).join(", ") || "Not specified"}
                                    </div>
                                    <div><span className="info-label">Platforms</span>{Object.entries(game.plt || {}).filter(([, enabled]) => enabled).map(([key]) => key).join(", ") || "Not specified"}</div>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </>
    )
}
