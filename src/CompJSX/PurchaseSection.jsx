import { useState } from "react"
import { useCart } from "../CartContext.jsx"
import "../CompCss/DealHunt.css"

/* ─── Helpers ───────────────────────────────── */
function fmt(priceObj) {
    if (!priceObj?.final || priceObj.final <= 0) return null
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: priceObj.currency || "USD",
    }).format(priceObj.final / 100)
}

const SERVICE_FEE = 1.0
const EXPIRY_HRS  = 48
const WINDOW_HRS  = 24

/* ─── Status Badge ──────────────────────────── */
function StatusBadge({ status }) {
    if (!status) return null
    const map = {
        searching:  { label: "Searching…",       cls: "dh-status dh-searching",  icon: "fas fa-radar" },
        found:      { label: "Offer Found!",      cls: "dh-status dh-found",      icon: "fas fa-check-circle" },
        failed:     { label: "Not Found",         cls: "dh-status dh-failed",     icon: "fas fa-times-circle" },
        completed:  { label: "Completed",         cls: "dh-status dh-completed",  icon: "fas fa-trophy" },
        expired:    { label: "Expired",           cls: "dh-status dh-expired",    icon: "fas fa-clock" },
        awaiting:   { label: "Awaiting Payment",  cls: "dh-status dh-found",      icon: "fas fa-credit-card" },
    }
    const m = map[status] || { label: status, cls: "dh-status", icon: "fas fa-circle" }
    return (
        <span className={m.cls}>
            {status === "searching" && <span className="dh-pulse-dot" />}
            <i className={m.icon} /> {m.label}
        </span>
    )
}

/* ─── Deal Hunt Active ──────────────────────── */
function DealHuntActive({ request, priceText, onPayNow, onCancel }) {
    const { status, gamePrice, serviceFee, remaining } = request
    const canPay = status === "found" || status === "awaiting"
    const isDone = status === "completed" || status === "expired"
    const isFail = status === "failed"

    return (
        <div className="dh-active-card">
            <div className="dh-active-header">
                <span className="dh-active-title">
                    <i className="fas fa-satellite-dish" /> Deal Hunt Request
                </span>
                <StatusBadge status={status} />
            </div>

            <div className="dh-steps">
                {[
                    { key: "searching", icon: "fas fa-search",      label: "Searching" },
                    { key: "found",     icon: "fas fa-tag",          label: "Offer Found" },
                    { key: "awaiting",  icon: "fas fa-credit-card",  label: "Pay Now" },
                    { key: "completed", icon: "fas fa-check-circle", label: "Delivered" },
                ].map((step, i) => {
                    const order = ["searching", "found", "awaiting", "completed"]
                    const curIdx = order.indexOf(status)
                    const done   = i < curIdx
                    const active = step.key === status
                    return (
                        <div key={step.key} className={`dh-step ${active ? "active" : ""} ${done ? "done" : ""} ${isFail && step.key === "searching" ? "failed-step" : ""}`}>
                            <div className="dh-step-dot"><i className={step.icon} /></div>
                            <span>{step.label}</span>
                            {i < 3 && <div className={`dh-step-line ${done ? "done" : ""}`} />}
                        </div>
                    )
                })}
            </div>

            <div className="dh-breakdown">
                <div className="dh-breakdown-row"><span><i className="fas fa-gamepad" /> Game Price</span><strong>{gamePrice}</strong></div>
                <div className="dh-breakdown-row"><span><i className="fas fa-wrench" /> Service Fee</span><strong className="dh-fee">${serviceFee.toFixed(2)}</strong></div>
                <div className="dh-breakdown-row total-row"><span><i className="fas fa-receipt" /> Total Paid</span><strong className="dh-total">${serviceFee.toFixed(2)} <small>(service fee charged)</small></strong></div>
                {canPay && remaining > 0 && (
                    <div className="dh-breakdown-row remaining-row"><span><i className="fas fa-money-bill-wave" /> Remaining Balance</span><strong className="dh-remaining">${remaining.toFixed(2)}</strong></div>
                )}
            </div>

            {isFail && (
                <div className="dh-notice dh-notice-refund">
                    <i className="fas fa-rotate-left" />
                    <span>Game price will be refunded within 24–48 hours.</span>
                </div>
            )}
            {canPay && (
                <div className="dh-notice dh-notice-warn">
                    <i className="fas fa-clock" />
                    <span>Complete payment within <strong>{WINDOW_HRS} hours</strong> or the offer will expire.</span>
                </div>
            )}

            {!isDone && (
                <div className="dh-active-actions">
                    {canPay && (
                        <button className="dh-btn dh-btn-pay" onClick={onPayNow}>
                            <i className="fas fa-credit-card" /> Pay ${remaining?.toFixed(2)} Now
                        </button>
                    )}
                    {!isFail && !canPay && (
                        <button className="dh-btn dh-btn-cancel" onClick={onCancel}>
                            <i className="fas fa-xmark" /> Cancel Request
                        </button>
                    )}
                </div>
            )}

            {status === "completed" && (
                <div className="dh-success-msg">
                    <i className="fas fa-trophy" />
                    <span>Your game has been delivered! Check your email for details.</span>
                </div>
            )}
        </div>
    )
}

/* ─── Deal Hunt Form ────────────────────────── */
function DealHuntForm({ game, priceText, priceObj, onConfirm }) {
    const [email, setEmail]       = useState("")
    const [agreed, setAgreed]     = useState(false)
    const [emailErr, setEmailErr] = useState("")

    const gamePrice   = priceObj?.final ? priceObj.final / 100 : 0
    const totalCharge = SERVICE_FEE

    function validate() {
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailErr("Please enter a valid email address.")
            return false
        }
        setEmailErr("")
        return true
    }

    function handleSubmit(e) {
        e.preventDefault()
        e.stopPropagation()
        if (!validate()) return
        onConfirm({ email, gamePrice, serviceFee: SERVICE_FEE })
    }

    return (
        <form className="dh-form" onSubmit={handleSubmit}>
            <div className="dh-info-grid">
                <div className="dh-info-item">
                    <i className="fas fa-tag" />
                    <div><span>Expected Price</span><strong>{priceText}</strong></div>
                </div>
                <div className="dh-info-item">
                    <i className="fas fa-clock" />
                    <div><span>Search Window</span><strong>Up to {EXPIRY_HRS} hours</strong></div>
                </div>
                <div className="dh-info-item">
                    <i className="fas fa-wrench" />
                    <div><span>Service Fee</span><strong>${SERVICE_FEE.toFixed(2)}</strong></div>
                </div>
                <div className="dh-info-item dh-info-refund">
                    <i className="fas fa-rotate-left" />
                    <div><span>No Offer?</span><strong>Full Refund</strong></div>
                </div>
            </div>

            <div className="dh-cost-preview">
                <div className="dh-cost-row"><span>Game Price</span><span>{priceText}</span></div>
                <div className="dh-cost-row"><span>Service Fee (due now)</span><span className="dh-fee">${SERVICE_FEE.toFixed(2)}</span></div>
                <div className="dh-cost-row dh-cost-total"><span>Charged Today</span><span>${totalCharge.toFixed(2)}</span></div>
                <p className="dh-cost-note">Remaining game price is charged only after an offer is found and you confirm.</p>
            </div>

            <div className="dh-field">
                <label htmlFor="dh-email"><i className="fas fa-envelope" /> Notification Email</label>
                <input
                    id="dh-email" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className={emailErr ? "dh-input error" : "dh-input"}
                    autoComplete="email"
                />
                {emailErr && <span className="dh-input-err">{emailErr}</span>}
            </div>

            <label className="dh-checkbox">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                <span>
                    I understand the service fee (${SERVICE_FEE.toFixed(2)}) is charged upfront.
                    The game price is charged only when an offer is found.
                </span>
            </label>

            <button type="submit" className="dh-btn dh-btn-primary" disabled={!agreed}>
                <i className="fas fa-satellite-dish" /> Create Deal Hunt — ${totalCharge.toFixed(2)} Now
            </button>
        </form>
    )
}

/* ══════════════════════════════════════════════
   MAIN PURCHASE SECTION
   ══════════════════════════════════════════════ */
export default function PurchaseSection({ game }) {
    const { addToCart } = useCart()
    const [mode, setMode]           = useState("instant")
    const [dhRequest, setDhRequest] = useState(null)

    const priceObj  = game?.Price?.US || game?.price_overview
    const priceText = fmt(priceObj) || "Unavailable"
    const isFree    = game?.is_free
    const hasBuyable = !isFree && priceObj?.final > 0

    function handleDHCreate({ email, gamePrice, serviceFee }) {
        setDhRequest({
            status:     "searching",
            email,
            gamePrice:  fmt(priceObj) || `$${gamePrice.toFixed(2)}`,
            serviceFee,
            remaining:  gamePrice,
        })
    }

    function handlePayNow() {
        setDhRequest(prev => ({ ...prev, status: "completed" }))
    }

    function handleCancel(e) {
        e.stopPropagation()
        setDhRequest(null)
    }

    function handleAddToCart(e) {
        e.stopPropagation()
        addToCart(game)
    }

    return (
        <div className="ps-panels-container">

            {/* ── INSTANT DELIVERY panel ── */}
            <div 
                className={`ps-panel ps-panel-instant ${mode === "instant" ? "active" : "unselected"}`}
                onClick={() => setMode("instant")}
            >
                {mode === "instant" && <div className="ps-check-mark"><i className="fas fa-check-circle" /></div>}
                <div className="ps-panel-header">
                    <div className="ps-mode-icon ps-icon-instant"><i className="fas fa-bolt" /></div>
                    <div className="ps-mode-text">
                        <span className="ps-mode-title">Instant Delivery</span>
                        <span className="ps-mode-sub">Fixed price · Pay & receive now</span>
                    </div>
                </div>

                <div className="ps-price-block">
                    <span className="ps-price-label">
                        {isFree ? "Free to Play" : "Store Price"}
                    </span>
                    <div className="ps-price-value">
                        {isFree ? "Free" : priceText}
                    </div>
                    {priceObj?.discount_percent > 0 && (
                        <span className="ps-discount-badge">-{priceObj.discount_percent}%</span>
                    )}
                </div>

                <ul className="ps-features">
                    <li><i className="fas fa-check-circle" /> Fixed price guaranteed</li>
                    <li><i className="fas fa-check-circle" /> Instant delivery</li>
                    <li><i className="fas fa-check-circle" /> No waiting period</li>
                    <li><i className="fas fa-check-circle" /> Secure transaction</li>
                </ul>

                <div className="ps-spacer" />

                {hasBuyable ? (
                    <div className="ps-actions">
                        <button
                            id="btn-buy-now"
                            className="ps-btn ps-btn-primary"
                            type="button"
                            onClick={handleAddToCart}
                        >
                            <i className="fas fa-credit-card" /> Buy Now
                        </button>
                        <button
                            id="btn-add-cart"
                            className="ps-btn ps-btn-secondary"
                            type="button"
                            onClick={handleAddToCart}
                        >
                            <i className="fas fa-cart-plus" /> Add to Cart
                        </button>
                    </div>
                ) : isFree ? (
                    <button id="btn-free-play" className="ps-btn ps-btn-primary" type="button">
                        <i className="fas fa-play" /> Play Free
                    </button>
                ) : (
                    <p className="ps-unavailable">
                        <i className="fas fa-info-circle" /> Price unavailable — try Deal Hunt
                    </p>
                )}
            </div>

            {/* ── DEAL HUNT panel ── */}
            <div 
                className={`ps-panel ps-panel-deal ${mode === "deal" ? "active" : "unselected"}`}
                onClick={() => setMode("deal")}
            >
                {mode === "deal" && <div className="ps-check-mark"><i className="fas fa-check-circle" /></div>}
                <div className="ps-panel-header">
                    <div className="ps-mode-icon ps-icon-deal"><i className="fas fa-satellite-dish" /></div>
                    <div className="ps-mode-text">
                        <span className="ps-mode-title">Deal Hunt</span>
                        <span className="ps-mode-sub">Best price search · Up to {EXPIRY_HRS}h</span>
                    </div>
                </div>

                {!dhRequest ? (
                    <DealHuntForm
                        game={game}
                        priceText={priceText}
                        priceObj={priceObj}
                        onConfirm={handleDHCreate}
                    />
                ) : (
                    <DealHuntActive
                        request={dhRequest}
                        priceText={priceText}
                        onPayNow={handlePayNow}
                        onCancel={handleCancel}
                    />
                )}
            </div>

        </div>
    )
}
