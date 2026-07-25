import { Link, useNavigate } from "react-router"
import { useCart } from "../CartContext.jsx"
import { steamAssetUrl } from "../StandardComp/GameCard.jsx"
import "../CompCss/Cart.css"
import logo from "../assets/imgs/logo.png"

function CartItemRow({ item, onRemove, onUpdate }) {
    const price = (item.Price?.US?.final || 0) / 100;
    const currency = item.Price?.US?.currency || "USD";
    const lineTotal = price * item.qty;

    const fmt = (val) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);

    return (
        <div className="cart-item" data-appid={item.steam_appid}>
            <img
                src={steamAssetUrl(item.head)}
                alt={item.name || item.title}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="cart-item-info">
                <div className="cart-item-name">{item.name || item.title}</div>
                <div className="cart-item-price">{fmt(price)} <span className="unit-label">each</span></div>
            </div>

            <div className="cart-item-qty">
                <button
                    className="qty-btn"
                    onClick={() => item.qty <= 1 ? onRemove(item.steam_appid) : onUpdate(item.steam_appid, -1)}
                    aria-label="decrease"
                >
                    {item.qty <= 1 ? <i className="fas fa-trash-alt" /> : <i className="fas fa-minus" />}
                </button>
                <span className="qty-value">{item.qty}</span>
                <button
                    className="qty-btn"
                    onClick={() => onUpdate(item.steam_appid, 1)}
                    aria-label="increase"
                >
                    <i className="fas fa-plus" />
                </button>
            </div>

            <div className="cart-item-total">{fmt(lineTotal)}</div>

            <button
                className="cart-item-remove"
                onClick={() => onRemove(item.steam_appid)}
                aria-label="Remove item"
                title="Remove"
            >
                <i className="fas fa-times" />
            </button>
        </div>
    );
}

export default function CartPage() {
    const { cartItems, removeFromCart, updateQty, clearCart, totalCount, totalPrice } = useCart();
    const navigate = useNavigate();

    const currency = cartItems[0]?.Price?.US?.currency || "USD";
    const fmt = (val) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);

    const handleWhatsApp = () => {
        if (!cartItems.length) return;
        const lines = cartItems.map(item => {
            const name = item.name || item.title;
            const price = ((item.Price?.US?.final || 0) / 100).toFixed(2);
            return `• ${name} x${item.qty} — $${price}`;
        });
        const msg = `🛒 *HNK Store Order*\n\n${lines.join('\n')}\n\n*Total: ${fmt(totalPrice)}*`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const isEmpty = cartItems.length === 0;

    return (
        <>
            <header className="cart-header">
                <Link to="/games" className="btn-back">
                    <i className="fas fa-arrow-left" /> Back to Store
                </Link>
                <div className="header-title">
                    <i className="fas fa-shopping-cart" />
                    <h1>Shopping Cart</h1>
                    {!isEmpty && <span className="cart-badge-header">{totalCount}</span>}
                </div>
                <Link to="/" className="cart-logo-link">
                    <img src={logo} alt="HNK Store" className="cart-header-logo" />
                </Link>
            </header>

            <main className="cart-main">
                {isEmpty ? (
                    <div className="empty-cart">
                        <div className="empty-icon">
                            <i className="fas fa-shopping-cart" />
                        </div>
                        <h2>Your cart is empty</h2>
                        <p>Looks like you haven't added any games yet.</p>
                        <Link to="/games" className="btn-browse">
                            <i className="fas fa-gamepad" /> Browse Games
                        </Link>
                    </div>
                ) : (
                    <div className="cart-layout">
                        {/* Items list */}
                        <div className="cart-items-section">
                            <div className="cart-items-header">
                                <h2>
                                    <i className="fas fa-list" /> Items ({totalCount})
                                </h2>
                                <button className="clear-all-btn" onClick={clearCart}>
                                    <i className="fas fa-trash" /> Clear All
                                </button>
                            </div>

                            <div className="cart-items" id="cartItems">
                                {cartItems.map(item => (
                                    <CartItemRow
                                        key={item.steam_appid}
                                        item={item}
                                        onRemove={removeFromCart}
                                        onUpdate={updateQty}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="cart-summary">
                            <h2 className="summary-title">
                                <i className="fas fa-receipt" /> Order Summary
                            </h2>

                            <div className="summary-row">
                                <span>Games</span>
                                <span id="totalCount">{totalCount}</span>
                            </div>
                            <div className="summary-row">
                                <span>Items</span>
                                <span>{cartItems.length}</span>
                            </div>

                            <div className="summary-divider" />

                            <div className="summary-row total">
                                <span>Total</span>
                                <span id="totalPrice">{fmt(totalPrice)}</span>
                            </div>

                            <button
                                id="checkoutWhatsapp"
                                className="checkout-btn whatsapp-btn"
                                type="button"
                                onClick={handleWhatsApp}
                            >
                                <i className="fab fa-whatsapp" />
                                Order via WhatsApp
                            </button>
                            <button
                                className="checkout-btn clear-btn"
                                type="button"
                                onClick={clearCart}
                            >
                                <i className="fas fa-trash" />
                                Clear Cart
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
