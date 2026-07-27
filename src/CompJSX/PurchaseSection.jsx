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

const SERVICE_FEE = 1.0   // $1 – shown in UI, not charged yet
const EXPIRY_HRS  = 48
const WINDOW_HRS  = 24    // window to complete payment after offer is found

/* ─── Status Badge ──────────────────────────── */
function StatusBadge({ status }) {
    if (!status) return null
    const map = {
        searching:  { label: "Searching…",    cls: "dh-status dh-searching",  icon: "fas fa-radar" },
        found:      { label: "Offer Found!",   cls: "dh-status dh-found",      icon: "fas fa-check-circle" },
        failed:     { label: "Not Found",      cls: "dh-status dh-failed",     icon: "fas fa-times-circle" },
        completed:  { label: "Completed",      cls: "dh-status dh-completed",  icon: "fas fa-trophy" },
        expired:    { label: "Expired",        cls: "dh-status dh-expired",    icon: "fas fa-clock" },
        awaiting:   { label: "Awaiting Payment", cls: "dh-status dh-found",   icon: "fas fa-credit-card" },
    }
    const m = map[status] || { label: status, cls: "dh-status", icon: "fas fa-circle" }
    return (
        <span className={m.cls}>
            {status === "searching" && <span className="dh-pulse-dot" />}
            <i className={m.icon} /> {m.label}
        </span>
    )
}

/* ─── Deal Hunt Request Card (after creation) ─ */
function DealHuntActive({ request, priceText, onPayNow, onCancel }) {
    const { status, gamePrice, serviceFee, remaining } = request
    const canPay  = status === "found" || status === "awaiting"
    const isDone  = status === "completed" || status === "expired"
    const isFail  = status === "failed"

    return (
        <div className="dh-active-card">
            <div className="dh-active-header">
                <span className="dh-active-title">
                    <i className="fas fa-satellite-dish" /> Deal Hunt Request
                </span>
                <StatusBadge status={status} />
            </div>

            {/* Progress steps */}
            <div className="dh-steps">
                {[
                    { key: "searching", icon: "fas fa-search",        label: "Searching" },
                    { key: "found",     icon: "fas fa-tag",            label: "Offer Found" },
                    { key: "awaiting",  icon: "fas fa-credit-card",    label: "Pay Now" },
                    { key: "completed", icon: "fas fa-check-circle",   label: "Delivered" },
                ].map((step, i) => {
                    const order = ["searching", "found", "awaiting", "completed"]
                    const curIdx = order.indexOf(status)
                    const stepIdx = i
                    const done    = stepIdx < curIdx
                    const active  = step.key === status || (status === "found" && step.key === "found")
                    return (
                        <div
                            key={step.key}
                            className={`dh-step ${active ? "active" : ""} ${done ? "done" : ""} ${isFail && step.key === "searching" ? "failed-step" : ""}`}
                        >
                            <div className="dh-step-dot">
                                <i className={step.icon} />
                            </div>
                            <span>{step.label}</span>
                            {i < 3 && <div className={`dh-step-line ${done ? "done" : ""}`} />}
                        </div>
                    )
                })}
            </div>

            {/* Payment breakdown */}
            <div className="dh-breakdown">
                <div className="dh-breakdown-row">
                    <span><i className="fas fa-gamepad" /> Game Price</span>
                    <strong>{gamePrice}</strong>
                </div>
                <div className="dh-breakdown-row">
                    <span><i className="fas fa-wrench" /> Service Fee</span>
                    <strong className="dh-fee">${serviceFee.toFixed(2)}</strong>
                </div>
                <div className="dh-breakdown-row total-row">
                    <span><i className="fas fa-receipt" /> Total Paid</span>
                    <strong className="dh-total">${(serviceFee).toFixed(2)} <small>(service fee charged)</small></strong>
                </div>
                {canPay && remaining > 0 && (
                    <div className="dh-breakdown-row remaining-row">
                        <span><i className="fas fa-money-bill-wave" /> Remaining Balance</span>
                        <strong className="dh-remaining">${remaining.toFixed(2)}</strong>
                    </div>
                )}
            </div>

            {/* Refund notice for failed */}
            {isFail && (
                <div className="dh-notice dh-notice-refund">
                    <i className="fas fa-rotate-left" />
                    <span>Game price will be refunded within 24–48 hours. Service fee may apply per policy.</span>
                </div>
            )}

            {/* Expiry window for found */}
            {canPay && (
                <div className="dh-notice dh-notice-warn">
                    <i className="fas fa-clock" />
                    <span>Complete your payment within <strong>{WINDOW_HRS} hours</strong> or the offer will expire.</span>
                </div>
            )}

            {/* Actions */}
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
                    <span>Your game has been delivered! Check your email for delivery details.</span>
                </div>
            )}
        </div>
    )
}

/* ─── Deal Hunt Form (before creation) ─────── */
function DealHuntForm({ game, priceText, priceObj, onConfirm }) {
    const [email, setEmail]       = useState("")
    const [agreed, setAgreed]     = useState(false)
    const [emailErr, setEmailErr] = useState("")

    const gamePrice  = priceObj?.final ? priceObj.final / 100 : 0
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
        if (!validate()) return
        onConfirm({ email, gamePrice, serviceFee: SERVICE_FEE })
    }

    return (
        <form className="dh-form" onSubmit={handleSubmit}>
            {/* Info rows */}
            <div className="dh-info-grid">
                <div className="dh-info-item">
                    <i className="fas fa-tag" />
                    <div>
                        <span>Expected Price</span>
                        <strong>{priceText}</strong>
                    </div>
                </div>
                <div className="dh-info-item">
                    <i className="fas fa-clock" />
                    <div>
                        <span>Search Window</span>
                        <strong>Up to {EXPIRY_HRS} hours</strong>
                    </div>
                </div>
                <div className="dh-info-item">
                    <i className="fas fa-wrench" />
                    <div>
                        <span>Service Fee</span>
                        <strong>${SERVICE_FEE.toFixed(2)}</strong>
                    </div>
                </div>
                <div className="dh-info-item dh-info-refund">
                    <i className="fas fa-rotate-left" />
                    <div>
                        <span>No Offer?</span>
                        <strong>Full Refund</strong>
                    </div>
                </div>
            </div>

            {/* Payment preview */}
            <div className="dh-cost-preview">
                <div className="dh-cost-row">
                    <span>Game Price</span>
                    <span>{priceText}</span>
                </div>
                <div className="dh-cost-row">
                    <span>Service Fee (due now)</span>
                    <span className="dh-fee">${SERVICE_FEE.toFixed(2)}</span>
                </div>
                <div className="dh-cost-row dh-cost-total">
                    <span>Charged Today</span>
                    <span>${totalCharge.toFixed(2)}</span>
                </div>
                <p className="dh-cost-note">
                    Remaining game price is charged only after an offer is found and you confirm.
                </p>
            </div>

            {/* Email */}
            <div className="dh-field">
                <label htmlFor="dh-email">
                    <i className="fas fa-envelope" /> Notification Email
                </label>
                <input
                    id="dh-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={emailErr ? "dh-input error" : "dh-input"}
                    autoComplete="email"
                />
                {emailErr && <span className="dh-input-err">{emailErr}</span>}
            </div>

            {/* Terms */}
            <label className="dh-checkbox">
                <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                />
                <span>
                    I understand the service fee (${SERVICE_FEE.toFixed(2)}) is charged upfront.
                    The game price is charged only when an offer is found.
                    Service fee may not be refunded if a successful offer was found and declined.
                </span>
            </label>

            <button
                type="submit"
                className="dh-btn dh-btn-primary"
                disabled={!agreed}
            >
                <i className="fas fa-satellite-dish" />
                Create Deal Hunt — ${totalCharge.toFixed(2)} Now
            </button>
        </form>
    )
}

/* ─── Purchase Mode Toggle ──────────────────── */
function ModeToggle({ mode, onChange }) {
    return (
        <div className="purchase-mode-toggle">
            <button
                type="button"
                className={`pmt-btn ${mode === "instant" ? "pmt-active" : ""}`}
                onClick={() => onChange("instant")}
            >
                <i className="fas fa-bolt" />
                <div>
                    <span className="pmt-label">Instant Delivery</span>
                    <span className="pmt-sub">Fixed price · Pay &amp; receive now</span>
                </div>
            </button>
            <button
                type="button"
                className={`pmt-btn ${mode === "deal" ? "pmt-active" : ""}`}
                onClick={() => onChange("deal")}
            >
                <i className="fas fa-satellite-dish" />
                <div>
                    <span className="pmt-label">Deal Hunt</span>
                    <span className="pmt-sub">Best price search · Up to {EXPIRY_HRS}h</span>
                </div>
            </button>
        </div>
    )
}

/* ─── Main PurchaseSection ──────────────────── */
export default function PurchaseSection({ game }) {
    const { addToCart } = useCart()
    const [mode, setMode]         = useState("instant")
    const [dhRequest, setDhRequest] = useState(null)   // null | { status, email, serviceFee, gamePrice, remaining }

    const priceObj  = game?.Price?.US
    const priceText = fmt(priceObj) || "Unavailable"
    const isFree    = game?.is_free
    const hasBuyable = !isFree && priceObj?.final > 0

    /* Simulate creating a Deal Hunt request (pure UI mock) */
    function handleDHCreate({ email, gamePrice, serviceFee }) {
        setDhRequest({
            status:     "searching",
            email,
            gamePrice:  fmt(priceObj) || `$${gamePrice.toFixed(2)}`,
            serviceFee,
            remaining:  gamePrice,   // full game price remains after service fee
        })
    }

    /* Simulate "Pay Now" (UI only) */
    function handlePayNow() {
        setDhRequest(prev => ({ ...prev, status: "completed" }))
    }

    /* Cancel request */
    function handleCancel() {
        setDhRequest(null)
        setMode("instant")
    }

    /* Add to normal cart */
    function handleAddToCart() {
        addToCart(game)
    }

    return (
        <div className="purchase-section-wrapper">

            {/* Mode toggle */}
            <ModeToggle mode={mode} onChange={m => { setMode(m); setDhRequest(null) }} />

            {/* ── INSTANT DELIVERY ── */}
            {mode === "instant" && (
                <div className="purchase-box instant-box">
                    <div className="final-price-wrapper">
                        <span className="label">
                            {isFree ? "Free to Play" : "Store Price"}
                        </span>
                        <div id="finalPrice">
                            {isFree ? "Free" : priceText}
                        </div>
                    </div>

                    <div className="instant-features">
                        <span><i className="fas fa-check" /> Fixed price guaranteed</span>
                        <span><i className="fas fa-check" /> Instant delivery</span>
                        <span><i className="fas fa-check" /> No waiting period</span>
                    </div>

                    {hasBuyable && (
                        <div className="buy-actions">
                            <button
                                className="buy-button cart"
                                type="button"
                                onClick={handleAddToCart}
                            >
                                <i className="fas fa-cart-plus" /> Add to Cart
                            </button>
                        </div>
                    )}
                    {!hasBuyable && !isFree && (
                        <p className="dh-unavail">
                            <i className="fas fa-info-circle" /> Price unavailable — try Deal Hunt
                        </p>
                    )}

                    <p className="disclaimer">
                        Prices include store commission. Delivery is fast and secure.
                    </p>
                </div>
            )}

            {/* ── DEAL HUNT ── */}
            {mode === "deal" && (
                <div className="purchase-box deal-hunt-box">
                    <div className="dh-box-header">
                        <span className="dh-box-title">
                            <i className="fas fa-satellite-dish" /> Deal Hunt
                        </span>
                        <span className="dh-box-tagline">
                            We search · You save
                        </span>
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

                    <p className="disclaimer">
                        Service fee charged upfront. Game price due only after a successful offer.
                    </p>
                </div>
            )}

        </div>
    )
}
