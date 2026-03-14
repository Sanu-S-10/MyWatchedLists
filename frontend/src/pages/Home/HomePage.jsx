import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import thanosSnapSfx from '../../../sound effect/thanos-snap-sound-effect.mp3';
import './HomePage.css';

// Easing: cubic ease-in-out
function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

const HomePage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const homeRef = useRef(null);
    const [activePoster, setActivePoster] = useState(null);
    const [focusStage, setFocusStage] = useState('idle');
    const [isPosterFlipped, setIsPosterFlipped] = useState(false);
    const [isSnapping, setIsSnapping] = useState(false);
    const [isSnapFadeComplete, setIsSnapFadeComplete] = useState(false);
    const [snapParticles, setSnapParticles] = useState([]);
    const [snapOrigin, setSnapOrigin] = useState({ x: 0, y: 0 });
    const timerIdsRef = useRef([]);
    const snapTimerIdsRef = useRef([]);
    const snapAudioRef = useRef(null);
    const isSnapPendingRef = useRef(false);

    // ── Scroll-driven cinematic poster refs ──────────────────────────────────
    // Source positions (hero stack)
    const srcLeftRef = useRef(null);
    const srcCenterRef = useRef(null);
    const srcRightRef = useRef(null);
    // Target positions (lead poster in each feature card)
    const tgtDiscoverRef = useRef(null);
    const tgtTrackRef = useRef(null);
    const tgtOrganizeRef = useRef(null);
    // The three flying overlay elements
    const flyerLeftRef = useRef(null);
    const flyerCenterRef = useRef(null);
    const flyerRightRef = useRef(null);
    // Scroll scroll sentinel (bottom of hero / top of feature section)
    const heroSectionRef = useRef(null);
    const featureSectionRef = useRef(null);

    const clearAnimationTimers = () => {
        timerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
        timerIdsRef.current = [];
    };

    const queueAnimation = (callback, delay) => {
        const timerId = window.setTimeout(callback, delay);
        timerIdsRef.current.push(timerId);
    };

    const clearSnapTimers = () => {
        snapTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
        snapTimerIdsRef.current = [];
    };

    const queueSnapAnimation = (callback, delay) => {
        const timerId = window.setTimeout(callback, delay);
        snapTimerIdsRef.current.push(timerId);
    };

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        const audio = new Audio(thanosSnapSfx);
        audio.preload = 'auto';
        audio.volume = 0.95;
        snapAudioRef.current = audio;

        return () => {
            if (snapAudioRef.current) {
                snapAudioRef.current.pause();
                snapAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    // Using some iconic, high-quality posters for the central overlap effect.
    const centerPoster = "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg"; // Avengers
    const leftPoster = "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"; // The Dark Knight
    const rightPoster = "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"; // Interstellar

    const heroPosterFacts = {
        left: {
            leadPoster: leftPoster,
            movieTitle: 'The Dark Knight',
            movieFact: 'Heath Ledger developed the Joker voice and mannerisms during weeks of isolated rehearsal, including a private character diary.'
        },
        center: {
            leadPoster: centerPoster,
            movieTitle: 'Avengers: Infinity War',
            movieFact: 'The Wakanda battlefield was built with large practical terrain sections, then extended with digital armies for massive scale.'
        },
        right: {
            leadPoster: rightPoster,
            movieTitle: 'Interstellar',
            movieFact: 'Christopher Nolan projected real space visuals on giant set screens so actors could react to practical imagery instead of green screen.'
        }
    };

    const featureCards = [
        {
            id: 'discover',
            title: 'Discover Faster',
            subtitle: 'AI-powered picks and trend-based suggestions tailored to your watch vibe.',
            movieTitle: 'The Suicide Squad',
            movieFact: 'James Gunn hid over 30 tiny visual Easter eggs in props, graffiti, and background TV clips.',
            leadPoster: 'https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg',
            sidePoster: 'https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg',
            sideMovieTitle: 'Doctor Strange in the Multiverse of Madness',
            sideMovieFact: 'Sam Raimi layered practical smoke, miniatures, and rapid zooms to echo classic horror style in MCU scale scenes.'
        },
        {
            id: 'track',
            title: 'Track Everything',
            subtitle: 'One timeline for movies, series, anime, and your watch history highlights.',
            movieTitle: 'A Quiet Place Part II',
            movieFact: 'Most creature scenes were staged in near silence on set, so actors could react to real practical effects cues.',
            leadPoster: 'https://image.tmdb.org/t/p/w500/4q2hz2m8hubgvijz8Ez0T2Os2Yv.jpg',
            sidePoster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
            sideMovieTitle: 'Parasite',
            sideMovieFact: 'The house set was custom-built in layers so camera movement and blocking could reinforce class distance in every frame.'
        },
        {
            id: 'organize',
            title: 'Organize Like A Curator',
            subtitle: 'Build custom lists, rate instantly, and share your best collections.',
            movieTitle: 'The Godfather',
            movieFact: 'Marlon Brando stuffed tissue in his cheeks for camera tests before the makeup team built his iconic jaw prosthetic.',
            leadPoster: 'https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
            sidePoster: 'https://image.tmdb.org/t/p/w500/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg',
            sideMovieTitle: 'Avengers: Endgame',
            sideMovieFact: 'The final battle used a hybrid of large practical sets and dense digital crowd simulation to stage dozens of heroes in one sequence.'
        }
    ];

    const openPosterFocusFromRect = (card, posterType, targetRect) => {
        const selectedPoster = posterType === 'side'
            ? {
                posterSrc: card.sidePoster,
                movieTitle: card.sideMovieTitle || card.movieTitle,
                movieFact: card.sideMovieFact || card.movieFact
            }
            : {
                posterSrc: card.leadPoster,
                movieTitle: card.movieTitle,
                movieFact: card.movieFact
            };

        clearAnimationTimers();
        setIsPosterFlipped(false);
        setActivePoster({ ...selectedPoster, rect: targetRect });
        setFocusStage('opening');

        queueAnimation(() => setFocusStage('centered'), 24);
        queueAnimation(() => setIsPosterFlipped(true), 680);
    };

    const openPosterFocus = (card, posterType, event) => {
        const targetRect = event.currentTarget.getBoundingClientRect();
        openPosterFocusFromRect(card, posterType, targetRect);
    };

    const closePosterFocus = () => {
        if (!activePoster || focusStage === 'closing' || focusStage === 'returning') return;

        clearAnimationTimers();
        setFocusStage('closing');
        setIsPosterFlipped(false);

        queueAnimation(() => setFocusStage('returning'), 340);
        queueAnimation(() => {
            setActivePoster(null);
            setFocusStage('idle');
        }, 920);
    };

    const triggerThanosSnap = (event) => {
        if (isSnapping || isSnapPendingRef.current) return;
        isSnapPendingRef.current = true;

        const snapAudio = snapAudioRef.current;
        if (snapAudio) {
            snapAudio.currentTime = 0;
            const playPromise = snapAudio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                    // Ignore autoplay-policy errors; this is user-click initiated.
                });
            }
        }

        const rect = event.currentTarget.getBoundingClientRect();
        setSnapOrigin({
            x: rect.left + rect.width * 0.74,
            y: rect.top + rect.height * 0.63
        });

        if (activePoster) {
            setActivePoster(null);
            setFocusStage('idle');
            setIsPosterFlipped(false);
        }

        setIsSnapFadeComplete(false);

        // Start disintegration after the audible snap beat.
        queueSnapAnimation(() => {
            setIsSnapping(true);
            isSnapPendingRef.current = false;
        }, 720);
    };

    // ── Scroll-driven cinematic poster flight ────────────────────────────────
    useEffect(() => {
        /**
         * applyFlyer: positions a fixed flyer image to interpolate between
         * the hero source element and the feature-card target element.
         * All positions come from getBoundingClientRect(), which already returns
         * viewport-relative coords — perfect for `position: fixed` elements.
         */
        const applyFlyer = (flyerEl, srcEl, tgtEl, progress, srcRotZ, tgtRotZ) => {
            if (!flyerEl || !srcEl || !tgtEl) return;

            const srcRect = srcEl.getBoundingClientRect();
            const tgtRect = tgtEl.getBoundingClientRect();
            const scrollY = window.scrollY;

            // Use linear progress for transform so motion tracks scroll directly.
            const motion = Math.max(0, Math.min(1, progress));
            // Keep eased values for lighting/shadow only.
            const polish = easeInOut(motion);

            // Interpolate in document space, then convert back to viewport space.
            // This keeps the path stable and guarantees a precise landing on target.
            const srcAbsX = srcRect.left + srcRect.width / 2;
            const srcAbsY = srcRect.top + scrollY + srcRect.height / 2;
            const tgtAbsX = tgtRect.left + tgtRect.width / 2;
            const tgtAbsY = tgtRect.top + scrollY + tgtRect.height / 2;

            const absX = lerp(srcAbsX, tgtAbsX, motion);
            const absY = lerp(srcAbsY, tgtAbsY, motion);
            const viewX = absX;
            const viewY = absY - scrollY;

            const rotZ = lerp(srcRotZ, tgtRotZ, motion);
            // Scale to the target poster's actual CSS box so final size matches
            // the poster already rendered inside each feature card.
            const targetW = tgtEl.offsetWidth;
            const targetH = tgtEl.offsetHeight;
            const scaleX = lerp(1, targetW / srcRect.width, motion);
            const scaleY = lerp(1, targetH / srcRect.height, motion);

            // Subtle arc/depth: peaks at midpoint for cinematic feel
            const midArc = Math.sin(motion * Math.PI);
            const parallaxZ = midArc * 60;
            const rotX = midArc * -4; // slight tip forward at midpoint

            // Keep flyer at source size and scale down gradually to target size.
            flyerEl.style.width = `${srcRect.width}px`;
            flyerEl.style.height = `${srcRect.height}px`;
            flyerEl.style.transform = [
                `translate(${viewX}px, ${viewY}px)`,
                `translate(-50%, -50%)`,
                `perspective(900px)`,
                `rotateZ(${rotZ}deg)`,
                `rotateX(${rotX}deg)`,
                `scaleX(${scaleX})`,
                `scaleY(${scaleY})`,
                `translateZ(${parallaxZ}px)`,
            ].join(' ');

            const shadowY = lerp(30, 12, polish);
            const shadowBlur = lerp(64, 20, polish);
            const shadowAlpha = lerp(0.82, 0.42, polish);
            const glowAlpha = lerp(0.22, 0.05, polish);
            flyerEl.style.boxShadow = [
                `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha.toFixed(2)})`,
                `0 0 ${lerp(22, 6, polish).toFixed(1)}px rgba(193,18,31,${glowAlpha.toFixed(2)})`,
            ].join(', ');

            // Subtle brightness dip in the middle of the journey
            const brightness = 1 - midArc * 0.08;
            flyerEl.style.filter = `brightness(${brightness.toFixed(3)})`;

            flyerEl.style.display = 'block';
        };

        const onScroll = () => {
            const hero = heroSectionRef.current;
            const feature = featureSectionRef.current;
            if (!hero || !feature) return;

            // Scroll range tuned so posters fully land once feature cards are reached.
            const featureTopAbs = feature.getBoundingClientRect().top + window.scrollY;
            const startScroll = 24;
            const endScroll = featureTopAbs - window.innerHeight * 0.08;
            const range = Math.max(1, endScroll - startScroll);
            const progress = Math.max(0, Math.min(1, (window.scrollY - startScroll) / range));

            // Hero source rotation values (matching CSS)
            applyFlyer(flyerLeftRef.current, srcLeftRef.current, tgtDiscoverRef.current, progress, -5, 5);
            applyFlyer(flyerCenterRef.current, srcCenterRef.current, tgtTrackRef.current, progress, 0, 5);
            applyFlyer(flyerRightRef.current, srcRightRef.current, tgtOrganizeRef.current, progress, 5, 5);

            // Short crossfade handoff so transition feels continuous with no hard jump.
            const handoffEnd = 0.06;
            const flyerOpacity = progress <= 0
                ? 0
                : progress < handoffEnd
                    ? progress / handoffEnd
                    : 1;
            const originalOpacity = progress <= 0
                ? 1
                : progress < handoffEnd
                    ? 1 - (progress / handoffEnd)
                    : 0;

            [flyerLeftRef, flyerCenterRef, flyerRightRef].forEach(ref => {
                if (ref.current) ref.current.style.opacity = String(flyerOpacity);
            });

            const isLandedInteractive = progress >= 0.92;
            [flyerLeftRef, flyerCenterRef, flyerRightRef].forEach(ref => {
                if (!ref.current) return;
                ref.current.style.pointerEvents = isLandedInteractive ? 'auto' : 'none';
                ref.current.style.cursor = isLandedInteractive ? 'pointer' : 'default';
            });

            [srcLeftRef, srcCenterRef, srcRightRef].forEach(ref => {
                if (ref.current) ref.current.style.opacity = String(originalOpacity);
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        // Run once immediately to initialize positions correctly
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const reveals = document.querySelectorAll('.feature-reveal');
        if (!reveals.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );

        reveals.forEach((item) => observer.observe(item));

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        return () => {
            clearAnimationTimers();
            clearSnapTimers();
        };
    }, []);

    useEffect(() => {
        if (!activePoster) return;

        const onKeydown = (event) => {
            if (event.key === 'Escape') {
                closePosterFocus();
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeydown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKeydown);
        };
    }, [activePoster, focusStage]);

    useEffect(() => {
        if (!isSnapping) return;

        const root = homeRef.current;
        if (!root) return;

        const viewportWidth = Math.max(window.innerWidth, 1);
        const snapTargets = root.querySelectorAll('[data-snap-target]');

        const generatedParticles = [];

        snapTargets.forEach((target, targetIndex) => {
            const rect = target.getBoundingClientRect();
            const centerX = rect.left + (rect.width / 2);
            const waveDelay = (centerX / viewportWidth) * 920;
            const jitter = Math.random() * 220;
            const driftX = ((Math.random() - 0.5) * 130).toFixed(2);
            const driftY = (-35 - Math.random() * 170).toFixed(2);
            const seed = Math.random().toFixed(3);

            target.style.setProperty('--snap-delay', `${Math.round(waveDelay + jitter)}ms`);
            target.style.setProperty('--snap-drift-x', `${driftX}px`);
            target.style.setProperty('--snap-drift-y', `${driftY}px`);
            target.style.setProperty('--snap-seed', seed);

            const particleCount = Math.max(28, Math.round((rect.width * rect.height) / 2600));
            for (let i = 0; i < particleCount; i += 1) {
                const relX = 0.55 + (Math.random() * 0.45);
                const relY = Math.random();
                const sweepDelay = (1 - relX) * 520;
                generatedParticles.push({
                    id: `dust-${targetIndex}-${i}-${Math.random().toString(36).slice(2, 8)}`,
                    x: rect.left + (relX * rect.width),
                    y: rect.top + (relY * rect.height),
                    size: 1.4 + Math.random() * 4.6,
                    delay: sweepDelay + (Math.random() * 420),
                    duration: 1500 + Math.random() * 1700,
                    dx: 160 + Math.random() * 320,
                    dy: -120 + (Math.random() * 180),
                    sway: (Math.random() - 0.5) * 90,
                    driftRotate: (Math.random() - 0.5) * 90,
                    alpha: 0.32 + Math.random() * 0.36,
                    blur: 0.8 + Math.random() * 2.8
                });
            }
        });

        setSnapParticles(generatedParticles);

        clearSnapTimers();
        queueSnapAnimation(() => setIsSnapFadeComplete(true), 2900);

        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = '';
            clearSnapTimers();
            setSnapParticles([]);
        };
    }, [isSnapping]);

    return (
        <div
            ref={homeRef}
            className={`modern-home ${isSnapping ? 'is-snapping' : ''} ${isSnapFadeComplete ? 'is-snap-fade-complete' : ''}`}
        >
            {/* Top Navigation */}
            <nav className="modern-nav" data-snap-target>
                <div className="nav-logo-modern">
                    <div className="original-logo-icon">MWL</div>
                    <span className="logo-text">MyWatchedList</span>
                </div>
                <div className="nav-right">
                    <Link to="/register" className="nav-btn-outline">Join Now</Link>
                </div>
            </nav>

            {/* Main Hero Section */}
            <main className="modern-hero" ref={heroSectionRef}>
                <div className="hero-top-text" data-snap-target>
                    <p>TRACK EVERY MOVIE</p>
                    <p>AND SERIES YOU WATCH</p>
                </div>

                {/* The massive background text that gets overlapped */}
                <div className="massive-bg-text" data-snap-target>
                    WATCHLIST
                </div>

                {/* Central Overlapping Elements */}
                <div className="center-overlap-container">
                    <div className="poster-stack">
                        <img ref={srcLeftRef} src={leftPoster} alt="The Dark Knight" className="stacked-poster poster-left" data-snap-target />
                        <img ref={srcRightRef} src={rightPoster} alt="Interstellar" className="stacked-poster poster-right" data-snap-target />
                        <img
                            ref={srcCenterRef}
                            src={centerPoster}
                            alt="Avengers: Infinity War"
                            className={`stacked-poster poster-center ${isSnapping ? 'is-snap-triggered' : ''}`}
                            data-snap-target
                            role="button"
                            tabIndex={0}
                            aria-label="Trigger Thanos snap"
                            onClick={triggerThanosSnap}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    triggerThanosSnap(event);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Bottom Elements */}
                <div className="hero-bottom" data-snap-target>
                    <div className="bottom-left-info">
                        {/* Only show on desktop */}
                        <div className="mobile-hide">
                            <p className="info-title">NEVER FORGET</p>
                            <p className="info-sub">WHAT TO WATCH NEXT</p>
                            <Link to="/register" className="info-link">
                                Sign up today <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    <div className="bottom-center-action">
                        {/* Elegant Auth Buttons */}
                        <div className="auth-action-group">
                            <Link to="/login" className="action-btn action-signin">
                                Sign In
                            </Link>
                            <Link to="/register" className="action-btn action-signup">
                                Sign Up
                            </Link>
                        </div>
                    </div>

                    <div className="bottom-right-info">
                        <p className="info-title">YOUR ENTERTAINMENT</p>
                        <p className="info-sub">CURATED & TRACKED</p>
                        <Link to="/login" className="info-link">
                            Go to dashboard <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </main>

            <section className="feature-showcase" ref={featureSectionRef} aria-label="Website Features">
                <div className="feature-showcase-head feature-reveal" data-snap-target>
                    <p className="feature-kicker">SCROLL TO FEEL THE FLOW</p>
                    <h2>Built to keep your watch world in motion</h2>
                </div>

                <div className="feature-grid">
                    {featureCards.map((card, index) => {
                        const tgtRef = index === 0 ? tgtDiscoverRef : index === 1 ? tgtTrackRef : tgtOrganizeRef;
                        return (
                        <article
                            key={card.id}
                            className="feature-card feature-reveal"
                            data-snap-target
                            style={{ '--delay': `${index * 120}ms` }}
                        >
                            <button
                                type="button"
                                className="feature-poster-trigger"
                                onClick={(event) => openPosterFocus(card, 'lead', event)}
                                aria-label={`View ${card.movieTitle} cinematic fact card`}
                            >
                                <div className="feature-poster-3d" aria-hidden="true">
                                    <img
                                        src={card.sidePoster}
                                        alt={card.sideMovieTitle || card.movieTitle}
                                        className="poster-side"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openPosterFocus(card, 'side', event);
                                        }}
                                    />
                                    <div
                                        ref={tgtRef}
                                        className="poster-landing-slot"
                                        aria-hidden="true"
                                    />
                                </div>
                            </button>
                            <div className="feature-copy">
                                <h3>{card.title}</h3>
                                <p>{card.subtitle}</p>
                            </div>
                        </article>
                        );
                    })}
                </div>
            </section>

            {isSnapping && (
                <div
                    className={`snap-overlay ${isSnapFadeComplete ? 'is-dark' : ''}`}
                    style={{
                        '--snap-x': `${snapOrigin.x}px`,
                        '--snap-y': `${snapOrigin.y}px`
                    }}
                    aria-hidden="true"
                >
                    <span className="snap-flash" />
                    <span className="snap-wave" />

                    <div className="snap-dust-cloud">
                        {snapParticles.map((particle) => (
                            <span
                                key={particle.id}
                                className="snap-dust-particle"
                                style={{
                                    '--dust-x': `${particle.x}px`,
                                    '--dust-y': `${particle.y}px`,
                                    '--dust-size': `${particle.size}px`,
                                    '--dust-delay': `${particle.delay}ms`,
                                    '--dust-duration': `${particle.duration}ms`,
                                    '--dust-dx': `${particle.dx}px`,
                                    '--dust-dy': `${particle.dy}px`,
                                    '--dust-sway': `${particle.sway}px`,
                                    '--dust-rotate': `${particle.driftRotate}deg`,
                                    '--dust-alpha': `${particle.alpha}`,
                                    '--dust-blur': `${particle.blur}px`
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {activePoster && (
                <div
                    className={`poster-focus-overlay ${focusStage !== 'idle' ? 'is-active' : ''}`}
                    role="presentation"
                    onClick={closePosterFocus}
                >
                    <div
                        className={`poster-focus-card ${(focusStage === 'centered' || focusStage === 'closing') ? 'is-centered' : ''} ${focusStage === 'returning' ? 'is-returning' : ''}`}
                        style={{
                            '--origin-top': `${activePoster.rect.top}px`,
                            '--origin-left': `${activePoster.rect.left}px`,
                            '--origin-width': `${activePoster.rect.width}px`,
                            '--origin-height': `${activePoster.rect.height}px`
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${activePoster.movieTitle} fact card`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={`poster-flip-inner ${isPosterFlipped ? 'is-flipped' : ''}`}>
                            <div className="poster-face poster-face-front">
                                <img src={activePoster.posterSrc} alt={activePoster.movieTitle} />
                            </div>

                            <div className="poster-face poster-face-back">
                                <p className="poster-fact-label">CINEMA FACT</p>
                                <h4>{activePoster.movieTitle}</h4>
                                <p>{activePoster.movieFact}</p>
                                <span>Click outside to return</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Scroll-driven cinematic flying posters overlay ── */}
            <div className="poster-flyers-layer" aria-hidden="true">
                <img
                    ref={flyerLeftRef}
                    src={leftPoster}
                    alt=""
                    className="poster-flyer"
                    onClick={() => {
                        if (!flyerLeftRef.current) return;
                        openPosterFocusFromRect(heroPosterFacts.left, 'lead', flyerLeftRef.current.getBoundingClientRect());
                    }}
                />
                <img
                    ref={flyerCenterRef}
                    src={centerPoster}
                    alt=""
                    className="poster-flyer"
                    onClick={() => {
                        if (!flyerCenterRef.current) return;
                        openPosterFocusFromRect(heroPosterFacts.center, 'lead', flyerCenterRef.current.getBoundingClientRect());
                    }}
                />
                <img
                    ref={flyerRightRef}
                    src={rightPoster}
                    alt=""
                    className="poster-flyer"
                    onClick={() => {
                        if (!flyerRightRef.current) return;
                        openPosterFocusFromRect(heroPosterFacts.right, 'lead', flyerRightRef.current.getBoundingClientRect());
                    }}
                />
            </div>
        </div>
    );
};

export default HomePage;
