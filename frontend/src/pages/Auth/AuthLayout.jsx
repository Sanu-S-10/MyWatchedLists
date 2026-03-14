import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const authPosterColumns = {
    left: [
        'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        'https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg',
        'https://image.tmdb.org/t/p/w500/4q2hz2m8hubgvijz8Ez0T2Os2Yv.jpg',
        'https://image.tmdb.org/t/p/w500/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg'
    ],
    center: [
        'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
        'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        'https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
        'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'
    ],
    right: [
        'https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg',
        'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        'https://image.tmdb.org/t/p/w500/4q2hz2m8hubgvijz8Ez0T2Os2Yv.jpg',
        'https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg'
    ]
};

const AuthLayout = ({
    eyebrow,
    headline,
    description,
    cardTitle,
    cardSubtitle,
    highlights,
    footer,
    children
}) => {
    return (
        <div className="auth-scene">
            <div className="auth-background" aria-hidden="true">
                <div className="auth-ambient auth-ambient-left"></div>
                <div className="auth-ambient auth-ambient-right"></div>
                <div className="auth-grid"></div>
                <div className="auth-massive-text">MYWATCHEDLIST</div>
                <div className="auth-poster-cloud">
                    {Object.entries(authPosterColumns).map(([columnName, posters]) => (
                        <div key={columnName} className={`auth-poster-column auth-poster-column-${columnName}`}>
                            {posters.map((posterSrc, index) => (
                                <div
                                    key={`${columnName}-${index}`}
                                    className="auth-poster-frame"
                                    style={{ '--poster-order': index + 1 }}
                                >
                                    <img src={posterSrc} alt="" loading="lazy" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="auth-shell">
                <div className="auth-topbar">
                    <Link to="/" className="auth-brand">
                        <span className="auth-brand-badge">MW</span>
                        <span className="auth-brand-text">MyWatchedList</span>
                    </Link>

                    <Link to="/" className="auth-back-link">
                        <ArrowLeft size={16} />
                        Back to home
                    </Link>
                </div>

                <div className="auth-content">
                    <section className="auth-story">
                        <p className="auth-eyebrow">{eyebrow}</p>
                        <h1>{headline}</h1>
                        <p className="auth-description">{description}</p>

                        {highlights?.length > 0 && (
                            <div className="auth-highlights">
                                {highlights.map((highlight) => (
                                    <div key={highlight.label} className="auth-highlight">
                                        <span>{highlight.value}</span>
                                        <p>{highlight.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="auth-panel">
                        <div className="auth-card">
                            <div className="auth-header">
                                <h2>{cardTitle}</h2>
                                <p>{cardSubtitle}</p>
                            </div>

                            {children}

                            <div className="auth-footer">{footer}</div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;