import { useState, useEffect } from "react"
import axios from "axios"
import logo from "../assets/imgs/logo.png"
import "../CompCss/Games.css"
import { FilterButton, NavButton } from "../StandardComp/Buttons.jsx"
import { GameCard } from "../StandardComp/GameCard.jsx"
import { FiltersObjs, NavBarObjs } from "../StateTemps.js"
import { API_BASE } from "../api.js"
import { useCart } from "../CartContext.jsx"

export default function GamesPage() {
    const [filters, setFilters] = useState(FiltersObjs)
    const [navFilter] = useState(NavBarObjs)
    const [isOpen, setIsOpen] = useState(false)
    const [gamesData, setGamesData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const activeFilter = filters.find(f => f.active)
    const { totalCount } = useCart()

    function toggleMenu() {
        setIsOpen(prev => !prev)
    }

    useEffect(() => {
        let isMounted = true

        const fetchGames = async () => {
            setIsLoading(true)
            setError("")

            try {
                const res = await axios.get(`${API_BASE}/api/public/games`, {
                    params: { page: 1, filter: activeFilter?.filter }
                })

                if (isMounted) setGamesData(res.data.data || [])
            } catch {
                if (isMounted) {
                    setGamesData([])
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
    }, [activeFilter?.id, activeFilter?.filter])

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

            {/* ══ Header matching Details page style ══ */}
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

                {!isLoading && !error && gamesData.map((game) => (
                    <GameCard key={game.steam_appid} {...game} />
                ))}

                {!isLoading && !error && gamesData.length === 0 && (
                    <p className="games-message">No games to display</p>
                )}
            </section>

            <div className="pagination-container">
                <div className="pagination-controls"></div>
            </div>
        </>
    )
}
