import "../CompCss/Games.css"
import { Link } from "react-router"
import { useCart } from "../CartContext.jsx"

const STEAM_APP_URL = "https://store.steampowered.com/app"
const STEAM_ASSET_BASE = "https://shared.akamai.steamstatic.com/"

export function steamAssetUrl(value) {
    if (!value || typeof value !== "string") return ""
    if (value.startsWith("https://")) return value
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

function formatPrice(price) {
    if (!price) return null
    // If it's a number (cents), use it directly
    const finalPrice = typeof price === "number" ? price : (price.US?.final || price.final)
    if (!finalPrice || finalPrice <= 0) return null

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.currency || price.US?.currency || "USD"
    }).format(finalPrice / 100)
}

export function GameCard({
    appid,
    steam_appid,
    name,
    title,
    head,
    is_free,
    Price,
    rel,
    recs
}) {
    const finalId = steam_appid || appid
    const gameData = { steam_appid: finalId, appid: finalId, name, title, head, is_free, Price, rel, recs }
    const { addToCart } = useCart()
    const reviews = typeof recs === "object" ? (recs?.total || 0) : (recs || 0)
    const gameName = name || title || "Untitled"
    const finalPriceVal = typeof Price === "number" ? Price : (Price?.US?.final || Price?.final || 0)
    const releaseText = formatReleaseDate(rel)
    const isComingSoon = typeof rel === "object" && rel?.coming_soon
    const hasBuyablePrice = !is_free && !isComingSoon && finalPriceVal > 0
    const steamUrl = `${STEAM_APP_URL}/${finalId}`
    const detailsUrl = `/games/${finalId}`
    const priceText = isComingSoon
        ? releaseText
        : is_free
            ? "Free"
            : formatPrice(Price) || "Unavailable"

    return (
        <article className="game-card">
            {reviews > 50000 && <div className="player-count">Popular</div>}

            <img src={steamAssetUrl(head)} alt={gameName} loading="lazy" />

            <div className="game-info">
                <h3 className="game-card-title">{gameName}</h3>
                {releaseText && !rel?.coming_soon && <div className="game-meta">Release date: {releaseText}</div>}

                <div className="price-row">
                    <span className="game-price">{priceText}</span>

                    <div className="game-actions">
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
        </article>
    )
}
