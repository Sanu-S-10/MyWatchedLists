import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, Calendar, Star, Clock, Heart, 
    User, Film, Tv, ExternalLink, Edit2, Trash2,
    Info, Users, Play, List, ChevronDown, ChevronUp
} from 'lucide-react';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import { ToastContext } from '../../context/ToastContext';
import Button from '../../components/UI/Button';
import EditModal from '../ContentList/EditModal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import './MediaDetail.css';

const MediaDetail = () => {
    const { id } = useParams(); // This will be the tmdbId
    const navigate = useNavigate();
    const location = useLocation();
    const { history, removeItem, updateItem } = useContext(WatchHistoryContext);
    const { addToast } = useContext(ToastContext);

    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cast, setCast] = useState([]);
    const [crew, setCrew] = useState([]);
    const [showAllCrew, setShowAllCrew] = useState(false);
    const [showCrew, setShowCrew] = useState(false);
    const [showAllCast, setShowAllCast] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [watchProvider, setWatchProvider] = useState(null);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [seasonDetails, setSeasonDetails] = useState(null);
    const [loadingSeason, setLoadingSeason] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get media type from URL query or state
    const queryParams = new URLSearchParams(location.search);
    const mediaType = queryParams.get('type') || (location.state?.fromMedia?.mediaType) || 'movie';

    // Find if this item is in our history
    const historyItem = history.find(item => String(item.tmdbId) === String(id));

    useEffect(() => {
        const fetchMediaDetails = async () => {
            setLoading(true);
            try {
                const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
                if (!API_KEY) throw new Error('API Key missing');

                const type = mediaType === 'movie' ? 'movie' : 'tv';
                
                const [detailsRes, creditsRes, recsRes, providersRes] = await Promise.all([
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}`),
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}`),
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${API_KEY}`),
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${API_KEY}`)
                ]);

                setDetails(detailsRes.data);
                setCast(creditsRes.data.cast?.slice(0, 20) || []);
                setCrew(creditsRes.data.crew || []);
                setRecommendations(recsRes.data.results?.slice(0, 8) || []);

                // Find top streaming provider (IN preferred over US, then any)
                const pData = providersRes.data.results?.IN || providersRes.data.results?.US || Object.values(providersRes.data.results || {})[0];
                if (pData) {
                    const provider = pData.flatrate?.[0] || pData.rent?.[0] || pData.buy?.[0];
                    if (provider) setWatchProvider({ ...provider, link: pData.link });
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching details:', err);
                setError('Failed to load media details.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMediaDetails();
        }
        
        window.scrollTo(0, 0);
    }, [id, mediaType]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleSeasonClick = async (seasonNumber) => {
        if (selectedSeason === seasonNumber) {
            setSelectedSeason(null);
            setSeasonDetails(null);
            return;
        }
        
        setSelectedSeason(seasonNumber);
        setLoadingSeason(true);
        setSeasonDetails(null);
        
        try {
            const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
            const res = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${API_KEY}`);
            setSeasonDetails(res.data);
        } catch (err) {
            console.error('Failed to fetch season details', err);
            addToast('Failed to load episodes', 'error');
        } finally {
            setLoadingSeason(false);
        }
    };

    const formatRuntime = (minutes) => {
        if (!minutes) return 'N/A';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        const result = await removeItem(itemToDelete._id);
        setIsDeleting(false);
        if (result.success) {
            addToast('Removed from history', 'success');
            setItemToDelete(null);
            navigate(-1);
        } else {
            addToast('Failed to remove item', 'error');
        }
    };

    if (loading) return <div className="media-detail-loading"><span className="loader"></span></div>;
    if (error || !details) return (
        <div className="media-detail-error">
            <Info size={48} />
            <h2>{error || 'Media not found'}</h2>
            <Button onClick={() => navigate(-1)} variant="primary">Go Back</Button>
        </div>
    );

    const backdropUrl = details.backdrop_path 
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null;
    const posterUrl = details.poster_path
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Poster';

    const directors = crew.filter(person => person.job === 'Director');
    const writers = crew.filter(person => ['Screenplay', 'Writer', 'Story'].includes(person.job));
    const producers = crew.filter(person => ['Producer', 'Executive Producer'].includes(person.job));

    // Combine into specific roles for display
    const keyCrew = [
        ...directors.map(p => ({ ...p, role: 'Director' })),
        ...writers.slice(0, 2).map(p => ({ ...p, role: 'Writer' })),
        ...producers.slice(0, 2).map(p => ({ ...p, role: 'Producer' }))
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Unique

    const keyCrewIds = new Set(keyCrew.map(p => p.id));
    const remainingCrew = crew.filter(p => !keyCrewIds.has(p.id));

    return (
        <div className="media-detail-page fade-in">
            {/* Hero Section with Backdrop */}
            <div className="media-hero">
                {backdropUrl && (
                    <div className="hero-backdrop">
                        <img src={backdropUrl} alt="" />
                        <div className="backdrop-overlay"></div>
                    </div>
                )}
                
                <div className="hero-content">
                    <button 
                        type="button" 
                        className="back-circle-btn" 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTimeout(() => {
                                if (window.history.length > 2) {
                                    navigate(-1);
                                } else {
                                    navigate('/dashboard');
                                }
                            }, 50); // Small 50ms frame gap to allow immediate visual :active shrinking feedback to draw
                        }}
                        aria-label="Go Back"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <div className="hero-main-info">
                        <div className="hero-poster">
                            <img src={posterUrl} alt={details.title || details.name} />
                        </div>
                        <div className="hero-text">
                            <div className="type-badge">
                                {mediaType === 'movie' ? <Film size={14} /> : <Tv size={14} />}
                                {mediaType === 'movie' ? 'Movie' : 'TV Series'}
                            </div>
                            <h1>{details.title || details.name}</h1>
                            <div className="hero-meta">
                                <span className="meta-item">
                                    <Calendar size={16} />
                                    {formatDate(details.release_date || details.first_air_date)}
                                </span>
                                <span className="meta-item">
                                    <Clock size={16} />
                                    {mediaType === 'movie' 
                                        ? formatRuntime(details.runtime) 
                                        : `${details.number_of_seasons} Seasons • ${details.number_of_episodes} Episodes`}
                                </span>
                                <span className="meta-item">
                                    <Star size={16} fill="var(--star-color)" color="var(--star-color)" />
                                    {details.vote_average?.toFixed(1)} <small>({details.vote_count} votes)</small>
                                </span>
                            </div>
                            
                            <div className="genres-list">
                                {details.genres?.map(genre => (
                                    <span key={genre.id} className="genre-tag">{genre.name}</span>
                                ))}
                            </div>

                            {details.tagline && <p className="tagline">"{details.tagline}"</p>}
                            
                            <div className="hero-actions">
                                {historyItem ? (
                                    <>
                                        <Button variant="primary" onClick={() => setEditingItem(historyItem)}>
                                            <Edit2 size={18} /> Edit Activity
                                        </Button>
                                        <Button variant="danger" onClick={() => setItemToDelete(historyItem)}>
                                            <Trash2 size={18} /> Remove
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="primary" onClick={() => navigate('/search', { state: { query: details.title || details.name, reopenItem: details } })}>
                                        <Play size={18} /> Add to List
                                    </Button>
                                )}
                                {watchProvider ? (
                                    <a href={watchProvider.link || details.homepage} target="_blank" rel="noopener noreferrer" className="provider-link-btn" title={`Watch on ${watchProvider.provider_name}`}>
                                        <img src={`https://image.tmdb.org/t/p/original${watchProvider.logo_path}`} alt={watchProvider.provider_name} />
                                    </a>
                                ) : details.homepage && (
                                    <a href={details.homepage} target="_blank" rel="noopener noreferrer" className="external-link-btn">
                                        <ExternalLink size={20} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="detail-container">
                <div className="detail-grid">
                    {/* Left Column: Story & User Info */}
                    <div className="detail-main">
                        <section className="detail-section">
                            <h2>Overview</h2>
                            <p className="overview-text">{details.overview}</p>
                        </section>

                        {historyItem && (
                            <section className="detail-section user-activity-section">
                                <div className="section-header">
                                    <h2>Your Activity</h2>
                                    <Heart size={24} fill={historyItem.isFavorite ? "var(--danger-color)" : "transparent"} color={historyItem.isFavorite ? "var(--danger-color)" : "var(--text-secondary)"} />
                                </div>
                                <div className="activity-grid">
                                    <div className="activity-item">
                                        <span className="label">Watched On</span>
                                        <span className="value">{formatDate(historyItem.watchDate)}</span>
                                    </div>
                                    <div className="activity-item">
                                        <span className="label">Your Rating</span>
                                        <div className="rating-stars">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    size={20} 
                                                    fill={i < historyItem.rating ? 'var(--star-color)' : 'transparent'} 
                                                    color={i < historyItem.rating ? 'var(--star-color)' : 'var(--border-color)'} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {historyItem.userNotes && (
                                        <div className="activity-item full-width">
                                            <span className="label">Personal Notes</span>
                                            <p className="notes-text">{historyItem.userNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {details.seasons && details.seasons.length > 0 && (
                            <section className="detail-section">
                                <h2>Seasons</h2>
                                <div className="seasons-grid">
                                    {details.seasons.filter(s => s.season_number > 0).map(season => (
                                        <React.Fragment key={season.id}>
                                            <div 
                                                className={`season-card ${selectedSeason === season.season_number ? 'active' : ''}`}
                                                onClick={() => handleSeasonClick(season.season_number)}
                                            >
                                                <div className="season-img">
                                                    {season.poster_path ? (
                                                        <img src={`https://image.tmdb.org/t/p/w185${season.poster_path}`} alt={season.name} />
                                                    ) : (
                                                        <div className="no-img"><Tv size={24} /></div>
                                                    )}
                                                </div>
                                                <div className="season-info">
                                                    <h3 className="name">{season.name}</h3>
                                                    <p className="episodes">{season.episode_count} Episodes</p>
                                                    {season.air_date && <span className="year">{String(season.air_date).substring(0, 4)}</span>}
                                                </div>
                                            </div>
                                            
                                            {selectedSeason === season.season_number && (
                                                <div className="season-episodes-container fade-in full-width-grid-span">
                                                    {loadingSeason ? (
                                                        <div className="episodes-loading"><span className="loader small"></span>Loading episodes...</div>
                                                    ) : seasonDetails ? (
                                                        <div className="episodes-list">
                                                            <h3>{seasonDetails.name} Episodes</h3>
                                                            <div className="episodes-list-view">
                                                                {seasonDetails.episodes.map(episode => (
                                                                    <div key={episode.id} className="episode-list-item">
                                                                        <div className="episode-info">
                                                                            <h4>{episode.episode_number}. {episode.name}</h4>
                                                                        </div>
                                                                        <div className="episode-meta">
                                                                            <span className="episode-date">
                                                                                {episode.air_date ? formatDate(episode.air_date) : 'TBA'}
                                                                            </span>
                                                                            {episode.runtime > 0 && <span className="episode-runtime">{episode.runtime}m</span>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="detail-section">
                            <div className="section-header">
                                <h2>Cast</h2>
                                {cast.length > 5 && (
                                    <button 
                                        className="text-btn desktop-only" 
                                        onClick={() => setShowAllCast(!showAllCast)}
                                    >
                                        {showAllCast ? 'Show Less' : `View Full Cast (${cast.length})`}
                                    </button>
                                )}
                            </div>
                            <div className={`cast-grid ${showAllCast ? 'expanded' : ''}`}>
                                {cast.map(person => (
                                    <Link to={`/person/${person.id}`} key={person.id} className="cast-card">
                                        <div className="cast-img">
                                            {person.profile_path ? (
                                                <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt={person.name} />
                                            ) : (
                                                <div className="no-img"><User size={24} /></div>
                                            )}
                                        </div>
                                        <div className="cast-info">
                                            <p className="name">{person.name}</p>
                                            <p className="character">{person.character}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {keyCrew.length > 0 && (
                            <section className="detail-section">
                                <h2>Director & Producers</h2>
                                <div className="cast-grid">
                                    {keyCrew.map((person, idx) => (
                                        <Link to={`/person/${person.id}`} key={`keycrew-${person.id}-${idx}`} className="cast-card">
                                            <div className="cast-img">
                                                {person.profile_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt={person.name} />
                                                ) : (
                                                    <div className="no-img"><User size={24} /></div>
                                                )}
                                            </div>
                                            <div className="cast-info">
                                                <p className="name">{person.name}</p>
                                                <p className="character">{person.role}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {remainingCrew.length > 0 && (
                            <section className="detail-section">
                                <div className="section-header clickable" onClick={() => setShowCrew(!showCrew)}>
                                    <h2>Crew</h2>
                                    {showCrew ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                                {showCrew && (
                                    <div className="fade-in">
                                        <div className={`crew-grid ${showAllCrew ? 'expanded' : ''}`}>
                                            {(showAllCrew ? remainingCrew : remainingCrew.slice(0, 12)).map((person, idx) => (
                                                <Link to={`/person/${person.id}`} key={`${person.id}-${idx}`} className="crew-item">
                                                    <div className="crew-img">
                                                        {person.profile_path ? (
                                                            <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt={person.name} />
                                                        ) : (
                                                            <div className="no-img"><User size={20} /></div>
                                                        )}
                                                    </div>
                                                    <div className="crew-info">
                                                        <span className="job">{person.job}</span>
                                                        <span className="name">{person.name}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                        {remainingCrew.length > 12 && (
                                            <button className="text-btn show-more-crew-btn" onClick={() => setShowAllCrew(!showAllCrew)}>
                                                {showAllCrew ? 'Show Less' : `View Full Crew (${remainingCrew.length})`}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Right Column: Sidebar Stats */}
                    <aside className="detail-sidebar">
                        <section className="sidebar-section details-block">
                            <h3>Details</h3>
                            <div className="info-list">
                                <div className="info-item">
                                    <span className="label">Status</span>
                                    <span className="value">{details.status}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Original Language</span>
                                    <span className="value">{details.original_language?.toUpperCase()}</span>
                                </div>
                                {mediaType === 'movie' && details.budget > 0 && (
                                    <div className="info-item">
                                        <span className="label">Budget</span>
                                        <span className="value">${details.budget.toLocaleString()}</span>
                                    </div>
                                )}
                                {mediaType === 'movie' && details.revenue > 0 && (
                                    <div className="info-item">
                                        <span className="label">Revenue</span>
                                        <span className="value">${details.revenue.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="info-item">
                                    <span className="label">Production</span>
                                    <span className="value">{details.production_companies?.slice(0, 2).map(c => c.name).join(', ')}</span>
                                </div>
                            </div>
                        </section>

                        {recommendations.length > 0 && (
                            <section className="sidebar-section recs-block">
                                <h3>Recommendations</h3>
                                <div className="recs-list">
                                    {recommendations.map(item => (
                                        <Link 
                                            to={`/media/${item.id}?type=${item.media_type || mediaType}`} 
                                            key={item.id} 
                                            className="rec-card"
                                        >
                                            <img src={`https://image.tmdb.org/t/p/w185${item.poster_path}`} alt="" />
                                            <div className="rec-info">
                                                <p>{item.title || item.name}</p>
                                                <span>{(item.release_date || item.first_air_date || '').substring(0, 4)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </aside>
                </div>
            </div>

            {editingItem && (
                <EditModal item={editingItem} onClose={() => setEditingItem(null)} />
            )}

            {itemToDelete && (
                <ConfirmModal
                    title="Remove Title"
                    message={`Are you sure you want to remove "${itemToDelete.title}" from your watched list?`}
                    onConfirm={handleDelete}
                    onCancel={() => setItemToDelete(null)}
                    isLoading={isDeleting}
                />
            )}
        </div>
    );
};

export default MediaDetail;
