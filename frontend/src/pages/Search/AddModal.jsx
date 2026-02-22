import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Heart, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import { ToastContext } from '../../context/ToastContext';
import StarRating from '../../components/UI/StarRating';
import Button from '../../components/UI/Button';
import './AddModal.css';

const AddModal = ({ item, onClose }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const [rating, setRating] = useState(0);
    const [userNotes, setUserNotes] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [watchDate, setWatchDate] = useState(new Date().toISOString().split('T')[0]);
    const [isUnknownDate, setIsUnknownDate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandOverview, setExpandOverview] = useState(false);

    const isMovie = item.media_type === 'movie';

    const [fullSeasonsData, setFullSeasonsData] = useState([]);
    const [selectedEpisodes, setSelectedEpisodes] = useState(new Set()); // e.g. "S1E1"
    const [expandedSeason, setExpandedSeason] = useState(null);

    const { addItem, removeItem, history } = useContext(WatchHistoryContext);
    const { addToast } = useContext(ToastContext);
    const [existingItem, setExistingItem] = useState(null);

    useEffect(() => {
        // Check if item already exists in watch history
        const foundItem = history.find(
            (historyItem) =>
                historyItem.tmdbId === item.id &&
                historyItem.mediaType === (item.media_type === 'movie' ? 'movie' : 'series')
        );
        setExistingItem(foundItem || null);
    }, [item, history]);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const type = item.media_type === 'movie' ? 'movie' : 'tv';
                const API_KEY = import.meta.env.VITE_TMDB_API_KEY; // Replace with env key later

                if (API_KEY) {
                    const { data } = await axios.get(`https://api.themoviedb.org/3/${type}/${item.id}?api_key=${API_KEY}`);
                    setDetails(data);

                    if (type === 'tv' && data.seasons) {
                        const standardSeasons = data.seasons.filter(s => s.season_number > 0);

                        // Fetch all seasons to get precise episode air dates and names
                        const seasonPromises = standardSeasons.map(s =>
                            axios.get(`https://api.themoviedb.org/3/tv/${item.id}/season/${s.season_number}?api_key=${API_KEY}`)
                                .then(res => res.data)
                                .catch(() => null)
                        );

                        const resolvedSeasons = (await Promise.all(seasonPromises)).filter(Boolean);
                        setFullSeasonsData(resolvedSeasons);

                        // By default select all aired episodes
                        const defaultSelected = new Set();
                        const today = new Date();
                        resolvedSeasons.forEach(season => {
                            if (season.episodes) {
                                season.episodes.forEach(ep => {
                                    if (ep.air_date && new Date(ep.air_date) <= today) {
                                        defaultSelected.add(`S${ep.season_number}E${ep.episode_number}`);
                                    }
                                });
                            }
                        });
                        setSelectedEpisodes(defaultSelected);
                    }
                } else {
                    // Mock Data
                    const mockSeasons = [1, 2];
                    setDetails({
                        id: item.id,
                        genres: [{ id: 1, name: 'Action' }],
                        runtime: 120, // movie
                        number_of_seasons: 2, // tv
                        number_of_episodes: 20, // tv
                        episode_run_time: [45], // tv
                        seasons: [
                            { season_number: 1, episode_count: 10 },
                            { season_number: 2, episode_count: 10 }
                        ],
                        overview: 'This is a mocked detail overview since TMDB API Key is missing.'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch details', error);
            } finally {
                setLoading(false);
            }
        };

        if (item) {
            fetchDetails();
        }
    }, [item]);

    const toggleExpandSeason = (seasonNumber) => {
        setExpandedSeason(prev => prev === seasonNumber ? null : seasonNumber);
    };

    const handleSeasonCheck = (seasonNumber, airedEpisodes, isChecked) => {
        setSelectedEpisodes(prev => {
            const newSet = new Set(prev);
            airedEpisodes.forEach(ep => {
                const id = `S${seasonNumber}E${ep.episode_number}`;
                if (isChecked) newSet.add(id);
                else newSet.delete(id);
            });
            return newSet;
        });
    };

    const handleEpisodeCheck = (seasonNumber, episodeNumber) => {
        const id = `S${seasonNumber}E${episodeNumber}`;
        setSelectedEpisodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            addToast('Please login to manage your watch list', 'warning');
            navigate('/login');
            return;
        }

        setIsSubmitting(true);

        // If item already exists, remove it
        if (existingItem) {
            const result = await removeItem(existingItem._id);
            setIsSubmitting(false);

            if (result.success) {
                addToast('Removed from your watch list!', 'success');
                onClose();
            } else {
                addToast(result.message, 'error');
            }
            return;
        }

        // Otherwise, proceed with adding the item

        let runtimeParams = {};

        if (isMovie) {
            runtimeParams = {
                runtime: details?.runtime || 0,
                watchTimeMinutes: details?.runtime || 0,
            };
        } else {
            let calculatedEpisodes = 0;
            let totalWatchTime = 0;

            selectedEpisodes.forEach(epStr => {
                const [s, e] = epStr.replace('S', '').split('E').map(Number);
                const seasonData = fullSeasonsData.find(sec => sec.season_number === s);
                if (seasonData && seasonData.episodes) {
                    const epData = seasonData.episodes.find(ep => ep.episode_number === e);
                    if (epData) {
                        calculatedEpisodes++;
                        totalWatchTime += epData.runtime || details?.episode_run_time?.[0] || 45;
                    }
                }
            });

            const watchedEpisodesArray = Array.from(selectedEpisodes);

            runtimeParams = {
                seasons: details?.number_of_seasons || 1,
                episodes: calculatedEpisodes,
                episodeDuration: details?.episode_run_time?.[0] || 45,
                watchTimeMinutes: totalWatchTime,
                watchedSeasons: [],
                watchedEpisodes: watchedEpisodesArray
            };
        }

        let calculatedSubType = 'live_action';
        const isAnimation = details?.genres?.some(g => g.id === 16) || item.genre_ids?.includes(16);

        if (isAnimation) {
            const isJapanese =
                item.original_language === 'ja' ||
                details?.original_language === 'ja' ||
                details?.origin_country?.includes('JP') ||
                item.origin_country?.includes('JP');

            calculatedSubType = isJapanese ? 'anime' : 'animation';
        }

        const originCountryCode = isMovie
            ? details?.production_countries?.[0]?.iso_3166_1
            : details?.origin_country?.[0] || item.origin_country?.[0];

        const payload = {
            tmdbId: item.id,
            mediaType: isMovie ? 'movie' : 'series', // Strictly movie or series for runtime features
            subType: calculatedSubType, // Classifies sub-genre
            title: item.title || item.name,
            posterPath: item.poster_path,
            originCountry: originCountryCode || '',
            releaseDate: item.release_date || item.first_air_date,
            genres: details?.genres || [],
            rating,
            userNotes,
            isFavorite,
            watchDate: isUnknownDate ? null : watchDate,
            ...runtimeParams,
        };

        const result = await addItem(payload);
        setIsSubmitting(false);

        if (result.success) {
            addToast('Added to your watch list!', 'success');
            onClose();
        } else {
            addToast(result.message, 'error');
        }
    };

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {loading ? (
                    <div className="modal-loading"><span className="loader"></span></div>
                ) : (
                    <form className="modal-form" onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <div className="modal-poster">
                                {item.poster_path ? (
                                    <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} alt="" />
                                ) : (
                                    <div className="no-poster">No Poster</div>
                                )}
                            </div>
                            <div className="modal-info">
                                <h2>{item.title || item.name}</h2>
                                <span className="modal-meta">
                                    {item.media_type === 'movie' ? 'Movie' : 'Series'} •{' '}
                                    {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}
                                </span>
                                <div style={{ marginTop: '4px' }}>
                                    <p className={`modal-overview ${expandOverview ? 'expanded' : ''}`}>{details?.overview || item.overview}</p>
                                    {(details?.overview || item.overview) && (details?.overview || item.overview).length > 150 && (
                                        <button
                                            type="button"
                                            onClick={() => setExpandOverview(!expandOverview)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--accent-color)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                fontWeight: '500',
                                                marginTop: '4px',
                                                padding: '0',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            {expandOverview ? 'Show Less' : 'Show More'}
                                        </button>
                                    )}
                                </div>

                                <div className="stats-preview">
                                    {item.media_type === 'movie' ? (
                                        <span>Runtime: {details ? (details.runtime || '?') : '?'} min</span>
                                    ) : (
                                        <span>{details ? (details.number_of_seasons || '?') : '?'} Seasons, {details ? (details.number_of_episodes || '?') : '?'} Episodes</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Watch Date</label>
                                    <div className="date-input-wrapper">
                                        <Calendar className="input-icon" size={18} />
                                        <input
                                            type="date"
                                            value={watchDate}
                                            onChange={(e) => setWatchDate(e.target.value)}
                                            required={!isUnknownDate}
                                            disabled={isUnknownDate}
                                            style={{ opacity: isUnknownDate ? 0.5 : 1 }}
                                        />
                                    </div>
                                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={isUnknownDate}
                                            onChange={(e) => setIsUnknownDate(e.target.checked)}
                                            style={{ width: 'auto' }}
                                        />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'none' }}>I don't remember the date</span>
                                    </label>
                                </div>

                                <div className="form-group flex-row-center">
                                    <label>Favorite</label>
                                    <button
                                        type="button"
                                        className={`fav-toggle ${isFavorite ? 'active' : ''}`}
                                        onClick={() => setIsFavorite(!isFavorite)}
                                    >
                                        <Heart size={24} fill={isFavorite ? 'var(--danger-color)' : 'transparent'} color={isFavorite ? 'var(--danger-color)' : 'var(--text-secondary)'} />
                                    </button>
                                </div>
                            </div>

                            {!isMovie && fullSeasonsData.length > 0 && (
                                <div className="form-group" style={{ marginTop: '16px', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px' }}>
                                    <label style={{ marginBottom: '12px', display: 'block' }}>Which episodes did you watch?</label>

                                    <div className="seasons-accordion">
                                        {fullSeasonsData.map(season => {
                                            const today = new Date();
                                            const airedEpisodes = season.episodes?.filter(ep => ep.air_date && new Date(ep.air_date) <= today) || [];
                                            const unreleasedEpisodes = season.episodes?.filter(ep => !ep.air_date || new Date(ep.air_date) > today) || [];

                                            const isFullyReleased = unreleasedEpisodes.length === 0;
                                            const hasAiredEpisodes = airedEpisodes.length > 0;
                                            const isAllAiredSelected = hasAiredEpisodes && airedEpisodes.every(ep => selectedEpisodes.has(`S${season.season_number}E${ep.episode_number}`));

                                            return (
                                                <div key={season.season_number} className="season-container" style={{ marginBottom: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                                                    <div className="season-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', alignItems: 'center' }} onClick={() => toggleExpandSeason(season.season_number)}>
                                                        <label onClick={e => e.stopPropagation()} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', cursor: isFullyReleased && hasAiredEpisodes ? 'pointer' : 'not-allowed', opacity: isFullyReleased && hasAiredEpisodes ? 1 : 0.6 }}>
                                                            <input
                                                                type="checkbox"
                                                                disabled={!isFullyReleased || !hasAiredEpisodes}
                                                                checked={isFullyReleased && isAllAiredSelected}
                                                                onChange={(e) => handleSeasonCheck(season.season_number, airedEpisodes, e.target.checked)}
                                                                style={{ width: 'auto' }}
                                                            />
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                                                                Season {season.season_number}
                                                                {!isFullyReleased && hasAiredEpisodes && <span style={{ fontSize: '0.7rem', color: 'var(--warning-color)' }}>Currently Airing (Select individual episodes)</span>}
                                                                {!hasAiredEpisodes && <span style={{ fontSize: '0.7rem', color: 'var(--warning-color)' }}>Upcoming Season</span>}
                                                            </span>
                                                        </label>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{season.episodes?.length || 0} Episodes</span>
                                                            <span style={{ transform: expandedSeason === season.season_number ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.8rem' }}>▼</span>
                                                        </div>
                                                    </div>

                                                    {expandedSeason === season.season_number && (
                                                        <div className="episodes-list" style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                                            {(season.episodes || []).map(ep => {
                                                                const isAired = ep.air_date && new Date(ep.air_date) <= today;
                                                                return (
                                                                    <label key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: isAired ? 'pointer' : 'not-allowed', margin: 0, padding: '4px 0', opacity: isAired ? 1 : 0.5 }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            disabled={!isAired}
                                                                            checked={isAired && selectedEpisodes.has(`S${season.season_number}E${ep.episode_number}`)}
                                                                            onChange={() => handleEpisodeCheck(season.season_number, ep.episode_number)}
                                                                            style={{ width: 'auto' }}
                                                                        />
                                                                        <span style={{ color: 'var(--text-secondary)', minWidth: '35px' }}>Ep {ep.episode_number}</span>
                                                                        <span style={{ color: isAired && selectedEpisodes.has(`S${season.season_number}E${ep.episode_number}`) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                                            {ep.name} {!isAired && <span style={{ fontSize: '0.75rem', marginLeft: '8px', color: 'var(--warning-color)' }}>(Unreleased)</span>}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                            {(!season.episodes || season.episodes.length === 0) && (
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                    Episode details are not available yet.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '16px' }}>
                                <label>Your Rating</label>
                                <StarRating rating={rating} setRating={setRating} />
                            </div>

                            <div className="form-group">
                                <label>Personal Notes</label>
                                <textarea
                                    placeholder="What did you think of it?"
                                    value={userNotes}
                                    onChange={(e) => setUserNotes(e.target.value)}
                                    rows={3}
                                ></textarea>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                            <Button variant={existingItem ? 'danger' : 'primary'} type="submit" isLoading={isSubmitting}>
                                {existingItem ? 'Remove from List' : 'Add to List'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AddModal;
