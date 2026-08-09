import { useState, useEffect } from "react"
import axios from "axios"
import { Link } from "react-router"
import logo from "../assets/imgs/logo.png"
import "../CompCss/Games.css"
import { FilterButton, NavButton } from "../StandardComp/Buttons.jsx"
import { GameCard } from "../StandardComp/GameCard.jsx"
import { FiltersObjs, NavBarObjs } from "../StateTemps.js"
import { API_BASE } from "../api.js"
import { useCart } from "../CartContext.jsx"

const MIN_CHECKOUT = 10 // $10 minimum

function fmtPrice(val) {
    if (!val && val !== 0) return "—"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val)
}

/* ─── Cart Sidebar ───────────────────────────── */
function CartSidebar() {
    const { cartItems, totalPrice, totalCount, removeFromCart } = useCart()
    const canCheckout = totalPrice >= MIN_CHECKOUT
    const progress = Math.min((totalPrice / MIN_CHECKOUT) * 100, 100)
    const remaining = Math.max(MIN_CHECKOUT - totalPrice, 0)

    return (
        <aside className="gp-cart-panel">
            <div className="gp-cart-box">
                <div className="gp-cart-title">
                    <i className="fas fa-shopping-bag" />
                    Cart
                    {totalCount > 0 && <span className="gp-cart-badge">{totalCount}</span>}
                </div>

                {cartItems.length === 0 ? (
                    <div className="gp-cart-empty">
                        <i className="fas fa-cart-shopping" />
                        Your cart is empty
                    </div>
                ) : (
                    <>
                        <div className="gp-cart-items">
                            {cartItems.map(item => {
                                const id = item.steam_appid || item.appid
                                const itemPrice = item.price ?? (item.Price?.US?.final ? item.Price.US.final / 100 : 0)
                                return (
                                    <div key={id} className="gp-cart-item">
                                        <span className="gp-cart-item-name">{item.name || item.title || "Unknown"}</span>
                                        <span className="gp-cart-item-price">{fmtPrice(itemPrice)}</span>
                                        <button
                                            className="gp-cart-item-remove"
                                            title="Remove"
                                            onClick={() => removeFromCart(id)}
                                        >
                                            <i className="fas fa-xmark" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="gp-cart-totals">
                            <div className="gp-cart-total-row">
                                <span className="gp-cart-total-label">Total Added</span>
                                <span className="gp-cart-total-value">{fmtPrice(totalPrice)}</span>
                            </div>
                        </div>

                        {!canCheckout && (
                            <div className="gp-cart-min-notice">
                                <i className="fas fa-info-circle" />
                                <div>
                                    Add {fmtPrice(remaining)} more to checkout
                                    <div className="gp-min-bar-track">
                                        <div className="gp-min-bar-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Link to="/cart">
                            <button className="gp-cart-checkout" disabled={!canCheckout}>
                                <i className="fas fa-credit-card" />
                                {canCheckout ? "Checkout" : `Min. ${fmtPrice(MIN_CHECKOUT)}`}
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </aside>
    )
}

export default function GamesPage() {
    const [filters, setFilters] = useState(FiltersObjs)
    const [navFilter] = useState(NavBarObjs)
    const [isOpen, setIsOpen] = useState(false)
    const [gamesData, setGamesData] = useState([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const activeFilter = filters.find(f => f.active)
    const { totalCount } = useCart()

    function toggleMenu() {
        setIsOpen(prev => !prev)
    }

    // Reset page to 1 when filter changes
    useEffect(() => {
        setPage(1)
    }, [activeFilter?.id])

    useEffect(() => {
        let isMounted = true

        const fetchGames = async () => {
            setIsLoading(true)
            setError("")

            try {
                const res = await axios.get(`${API_BASE}/api/public/games`, {
                    params: { page, filter: activeFilter?.filter }
                })

                if (isMounted) {
                    setGamesData(res.data.data || [])
                    setTotalPages(res.data.pages || 1)
                }
            } catch {
                if (isMounted) {
                    setGamesData([])
                    setTotalPages(1)
                    setError("Unable to load games")
                }
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        fetchGames()

        return () => {
            isMounted = false
        }
    }, [activeFilter?.id, activeFilter?.filter, page])

    return (
        <>
            {/* ── Sidebar overlay ── */}
            <div className={`overlay ${isOpen ? "show" : ""}`} onClick={toggleMenu}></div>

            <div className={`sidebar ${isOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <div>
                        <div className="logo-circle">H</div>
                        <img src={logo} alt="Logo" />
                    </div>
                    <h3>Hnk Store</h3>
                    <button className="close-btn" onClick={toggleMenu}>x</button>
                </div>

                <nav>{navFilter.map((item) => (<NavButton key={item.id} {...item} />))}</nav>

                <div className="sidebar-footer">
                    <a href="/login" className="btn auth-btn-primary" style={{width: '100%', marginBottom: '15px', justifyContent: 'center'}}>
                        <i className="fa-solid fa-user"></i> My Account
                    </a>
                    <p>Version v1.0.0</p>
                </div>
            </div>

            {/* ══ Header ══ */}
            <header className="gp-header">
                <a href="/" className="dt-back">
                    <i className="fas fa-arrow-left" /> Home
                </a>

                <a href="/" className="dt-header-brand">
                    <img src={logo} alt="HNK Store" />
                    <span>HNK Store</span>
                </a>

                <div className="gp-header-right">
                    <div className="gp-search-wrapper">
                        <i className="fas fa-magnifying-glass" />
                        <input
                            type="text"
                            className="gp-search"
                            placeholder="Find your game..."
                        />
                    </div>

                    <a href="/login" className="dt-header-account">
                        <i className="fas fa-user" />
                        <span className="account-text">Account</span>
                    </a>

                    <a href="/cart" className="dt-header-cart" style={{ textDecoration: 'none' }}>
                        <i className="fas fa-shopping-bag"></i>
                        {totalCount > 0 && <span className="dt-cart-badge">{totalCount}</span>}
                    </a>

                    <button className="gp-menu-btn" onClick={toggleMenu}>
                        <i className="fas fa-bars" />
                    </button>
                </div>
            </header>

            <div className="filter-bar">
                {filters.map((filter) => (
                    <FilterButton
                        key={filter.id}
                        {...filter}
                        setFilterStatus={setFilters}
                        filters={filters}
                    />
                ))}
            </div>

            {/* ── Main layout with cart sidebar ── */}
            <div className="gp-layout">
                <div className="gp-main-content">
                    <section className="games">
                        {isLoading && Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="game-card skeleton-card">
                                <div className="skeleton-image"></div>
                                <div className="game-info">
                                    <div className="skeleton-title"></div>
                                    <div className="price-row">
                                        <div className="skeleton-price"></div>
                                        <div className="skeleton-button"></div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isLoading && error && <p className="games-message">{error}</p>}

                        {!isLoading && !error && gamesData.slice(0, 24).map((game) => (
                            <GameCard key={game.appid || game.steam_appid} {...game} />
                        ))}

                        {!isLoading && !error && gamesData.length === 0 && (
                            <p className="games-message">No games to display</p>
                        )}
                    </section>

                    <div className="pagination-container">
                        <div className="pagination-controls">
                            <button
                                className="pg-btn"
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <i className="fas fa-chevron-left" /> Prev
                            </button>
                            <span className="pg-info">Page {page} of {totalPages}</span>
                            <button
                                className="pg-btn"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next <i className="fas fa-chevron-right" />
                            </button>
                        </div>
                    </div>
                </div>

                <CartSidebar />
            </div>
        </>
    )
}

