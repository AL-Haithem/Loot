import "../CompCss/Games.css"
import { Link } from "react-router"
import { useCart } from "../CartContext.jsx"

const STEAM_APP_URL = "https://store.steampowered.com/app"
const STEAM_ASSET_BASE = "https://shared.akamai.steamstatic.com/"

// Returns a full absolute URL or null (never an empty string)
export function steamAssetUrl(value) {
    if (!value || typeof value !== "string") return null
    if (value.startsWith("https://") || value.startsWith("http://")) return value
    return STEAM_ASSET_BASE + value.replace(/^\/+/, "")
}

function formatReleaseDate(rel) {
    if (!rel) return null
    if (typeof rel === "object") {
        if (rel.coming_soon) return rel.date ? `Coming soon: ${rel.date}` : "Coming soon"
        if (!rel.date) return null
        rel = rel.date
    }

    const date = new Date(rel)
    if (Number.isNaN(date.getTime())) return rel

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    })
}

function formatPrice(priceVal, priceObj) {
    if (priceVal === 0) return "Free"
    if (!priceVal && (!priceObj || !priceObj.final)) return null

    // Use priceVal if available, otherwise fallback to priceObj
    const finalPrice = typeof priceVal === "number" ? priceVal : (priceObj.US?.final || priceObj.final)
    if (!finalPrice || finalPrice <= 0) return null

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: priceObj?.currency || priceObj?.US?.currency || "USD"
    }).format(finalPrice)
}

export function GameCard({
    appid,
    steam_appid,
    name,
    title,
    head,
    is_free,
    Price,
    price,
    discount,
    huntPrice,
    rel,
    recs
}) {
    const finalId = steam_appid || appid
    // Keep gameData compatible with the old cart format if possible
    const gameData = { steam_appid: finalId, appid: finalId, name, title, head, is_free, Price, price, huntPrice, discount, rel, recs }
    const { addToCart } = useCart()
    const reviews = typeof recs === "object" ? (recs?.total || 0) : (recs || 0)
    const gameName = name || title || "Untitled"
    const finalPriceVal = typeof price === "number" ? price : (typeof Price === "number" ? Price : (Price?.US?.final || Price?.final || 0))
    const isFreeGame = is_free !== undefined ? is_free : (finalPriceVal === 0)
    const releaseText = formatReleaseDate(rel)
    const isComingSoon = typeof rel === "object" && rel?.coming_soon
    const hasBuyablePrice = !isFreeGame && !isComingSoon && finalPriceVal > 0
    const steamUrl = `${STEAM_APP_URL}/${finalId}`
    const detailsUrl = `/games/${finalId}`
    const priceText = isComingSoon
        ? releaseText
        : isFreeGame
            ? "Free"
            : formatPrice(price, Price) || "Unavailable"

    const imgSrc = steamAssetUrl(head)

    return (
        <article className="game-card">
            {reviews > 50000 && <div className="player-count">Popular</div>}

            {imgSrc
                ? <img src={imgSrc} alt={gameName} loading="lazy" />
                : <div className="card-img-placeholder"><i className="fab fa-steam" /></div>
            }

            <div className="game-info">
                <h3 className="game-card-title">{gameName}</h3>
                {releaseText && !rel?.coming_soon && <div className="game-meta">Release date: {releaseText}</div>}

                <div className="price-row">
                    {huntPrice > 0 && (
                        <Link to={detailsUrl} className="dh-mini-btn" title="Hunt this deal">
                            <i className="fas fa-satellite-dish" /> Hunt Now with ${huntPrice.toFixed(2)}
                        </Link>
                    )}

                    <div className="game-actions">
                        <div className="price-block">
                            <span className="game-price">{priceText}</span>
                            {discount > 0 && <span className="game-discount">-{discount}%</span>}
                        </div>

                        <div className="game-actions-right">
                            {hasBuyablePrice && (
                                <button
                                    className="cart-btn"
                                    type="button"
                                    title="Add to cart"
                                    onClick={() => addToCart(gameData)}
                                >
                                    <i className="fas fa-cart-plus"></i>
                                </button>
                            )}

                            {hasBuyablePrice ? (
                                <Link to={detailsUrl} state={{ game: gameData }} className="buy-btn">Buy</Link>
                            ) : (
                                <a href={steamUrl} className="buy-btn steam-btn" target="_blank" rel="noreferrer">
                                    Steam
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}
