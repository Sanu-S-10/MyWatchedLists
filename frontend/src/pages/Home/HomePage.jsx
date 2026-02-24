import { useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Film, Tv, Star, TrendingUp, Heart, Clock } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="home-page">
            {/* Background Elements */}
            <div className="home-bg-elements">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            {/* Navigation */}
            <nav className="home-nav">
                <div className="nav-logo">
                    <Film size={28} />
                    <span>MyWatchedList</span>
                </div>
                <div className="nav-links">
                    <Link to="/login" className="nav-btn nav-login">Sign In</Link>
                    <Link to="/register" className="nav-btn nav-signup">Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Star size={16} />
                        <span>Track Your Entertainment</span>
                    </div>
                    <h1 className="hero-title">
                        Your Personal
                        <span className="gradient-text"> Movie & Series</span>
                        <br />Watchlist Companion
                    </h1>
                    <p className="hero-description">
                        Keep track of every movie and series you've watched. Rate, organize, and discover your next favorite entertainment with our intelligent tracking system.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary">
                            Start Tracking Now
                        </Link>
                        <Link to="/login" className="btn btn-secondary">
                            Sign In
                        </Link>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="floating-card card-1">
                        <Film size={24} />
                        <span>Movies</span>
                    </div>
                    <div className="floating-card card-2">
                        <Tv size={24} />
                        <span>Series</span>
                    </div>
                    <div className="floating-card card-3">
                        <Star size={24} />
                        <span>Rated</span>
                    </div>
                    <div className="floating-card card-4">
                        <Heart size={24} />
                        <span>Favorites</span>
                    </div>
                    <div className="floating-card card-5">
                        <Clock size={24} />
                        <span>Tracking</span>
                    </div>
                    <div className="floating-card card-6">
                        <TrendingUp size={24} />
                        <span>Trending</span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2>Why You'll Love It</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Film />
                        </div>
                        <h3>Track Everything</h3>
                        <p>Keep a detailed record of every movie and series you watch. Never forget what you've seen.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Star />
                        </div>
                        <h3>Rate & Review</h3>
                        <p>Give ratings to your watched content and build your personal entertainment preferences.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Tv />
                        </div>
                        <h3>Organize Collections</h3>
                        <p>Categorize by movies, series, anime, and more. Filter by genre, year, country, and rating.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <TrendingUp />
                        </div>
                        <h3>Discover Trends</h3>
                        <p>Analyze your watching patterns and discover what genres and types you love most.</p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-item">
                    <h3>10K+</h3>
                    <p>Titles Available</p>
                </div>
                <div className="stats-item">
                    <h3>100%</h3>
                    <p>Data Privacy</p>
                </div>
                <div className="stats-item">
                    <h3>Instant</h3>
                    <p>Sync & Update</p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <h2>Ready to Start Tracking?</h2>
                <p>Join thousands of movie and series enthusiasts tracking their entertainment</p>
                <div className="cta-actions">
                    <Link to="/register" className="btn btn-primary btn-large">
                        Create Free Account
                    </Link>
                    <Link to="/login" className="btn btn-secondary btn-large">
                        Already Have Account?
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <p>&copy; 2024 MyWatchedList. All rights reserved. | Powered by Movie & Series Enthusiasts</p>
            </footer>
        </div>
    );
};

export default HomePage;
