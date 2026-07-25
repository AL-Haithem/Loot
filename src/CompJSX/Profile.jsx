import { Link, useNavigate } from 'react-router';
import { useClientAuth } from '../ClientAuthContext.jsx';
import '../CompCss/Profile.css';
import logo from '../assets/imgs/logo.png';

const TECH_STACK = [
    { icon: 'fab fa-react',        label: 'React 19',         color: '#61dafb' },
    { icon: 'fas fa-bolt',         label: 'Vite',             color: '#fbbf24' },
    { icon: 'fab fa-node-js',      label: 'Node.js',          color: '#68d391' },
    { icon: 'fas fa-server',       label: 'Express',          color: '#a78bfa' },
    { icon: 'fas fa-database',     label: 'Redis / Postgres',  color: '#f87171' },
    { icon: 'fab fa-steam',        label: 'Steam API',        color: '#00f0ff' },
];

const FEATURES = [
    { icon: 'fa-gamepad',       title: 'PC Game Store',         desc: 'Browse thousands of Steam games with live pricing synced from global markets.' },
    { icon: 'fa-cart-shopping', title: 'Smart Cart',            desc: 'Add games, adjust quantities, and place orders via WhatsApp in seconds.' },
    { icon: 'fa-robot',         title: 'Automated Crawler',     desc: 'A high-performance crawler continuously refreshes game data from Steam.' },
    { icon: 'fa-shield-halved', title: 'Secure Auth',          desc: 'CSRF protection, HttpOnly cookies, and JWT-based session management.' },
    { icon: 'fa-chart-line',    title: 'Live Monitoring',       desc: 'Real-time admin dashboard with system metrics, CPU, RAM, and crawler health.' },
    { icon: 'fa-gem',           title: 'Digital Services',      desc: 'Currency top-ups and premium accounts — more services coming soon.' },
];

export default function Profile() {
    const { logout } = useClientAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="profile-bg">
            {/* Background glow orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />

            <div className="profile-wrapper">

                {/* ── Top Nav ── */}
                <nav className="profile-nav">
                    <Link to="/" className="profile-nav-logo">
                        <img src={logo} alt="HNK Store" />
                        <span>HNK Store</span>
                    </Link>
                    <div className="profile-nav-actions">
                        <Link to="/games" className="pnav-btn pnav-outline">
                            <i className="fas fa-store" /> Browse Store
                        </Link>
                        <Link to="/cart" className="pnav-btn pnav-outline">
                            <i className="fas fa-shopping-cart" /> My Cart
                        </Link>
                        <button className="pnav-btn pnav-danger" onClick={handleLogout}>
                            <i className="fas fa-right-from-bracket" /> Logout
                        </button>
                    </div>
                </nav>

                {/* ── Hero ── */}
                <section className="profile-hero">
                    <div className="profile-hero-badge">
                        <i className="fab fa-steam" /> Powered by Steam API
                    </div>
                    <h1 className="profile-hero-title">
                        Your <span className="gradient-text">Digital Game</span> Marketplace
                    </h1>
                    <p className="profile-hero-sub">
                        HNK Store is a modern platform for buying PC games and digital services
                        at competitive global prices — with instant delivery and secure payments.
                    </p>
                    <div className="profile-hero-cta">
                        <Link to="/games" className="pnav-btn pnav-primary">
                            <i className="fas fa-gamepad" /> Start Shopping
                        </Link>
                    </div>
                </section>

                {/* ── Features ── */}
                <section className="profile-section">
                    <div className="section-label">
                        <i className="fas fa-star" /> Platform Features
                    </div>
                    <div className="features-grid">
                        {FEATURES.map((feat, i) => (
                            <div className="feature-card" key={i}>
                                <div className="feature-icon">
                                    <i className={`fas ${feat.icon}`} />
                                </div>
                                <h3>{feat.title}</h3>
                                <p>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Tech Stack ── */}
                <section className="profile-section">
                    <div className="section-label">
                        <i className="fas fa-code" /> Built With
                    </div>
                    <div className="tech-grid">
                        {TECH_STACK.map((tech, i) => (
                            <div className="tech-chip" key={i} style={{ '--chip-clr': tech.color }}>
                                <i className={tech.icon} style={{ color: tech.color }} />
                                <span>{tech.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── About ── */}
                <section className="profile-section about-section">
                    <div className="about-card">
                        <div className="about-icon">
                            <i className="fas fa-store" />
                        </div>
                        <div className="about-content">
                            <h2>About This Project</h2>
                            <p>
                                HNK Store was built to simplify the process of purchasing digital games
                                for players in regions where global payment methods are restrictive.
                                By aggregating live data directly from the Steam platform, we offer
                                accurate pricing and a seamless shopping experience backed by local
                                payment solutions and fast customer support via WhatsApp.
                            </p>
                            <div className="about-stats">
                                <div className="stat-item">
                                    <span className="stat-num">50K+</span>
                                    <span className="stat-label">Games Listed</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-num">Live</span>
                                    <span className="stat-label">Prices Updated</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-num">24/7</span>
                                    <span className="stat-label">Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="profile-footer">
                    <img src={logo} alt="logo" className="footer-logo-sm" />
                    <p>© 2026 HNK Store. All rights reserved.</p>
                    <div className="footer-socials">
                        <i className="fab fa-discord" />
                        <i className="fab fa-instagram" />
                        <i className="fab fa-facebook" />
                    </div>
                </footer>

            </div>
        </div>
    );
}
