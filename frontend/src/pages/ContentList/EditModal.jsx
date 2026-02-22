import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Heart, Calendar } from 'lucide-react';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import { ToastContext } from '../../context/ToastContext';
import StarRating from '../../components/UI/StarRating';
import Button from '../../components/UI/Button';
import '../Search/AddModal.css';

const EditModal = ({ item, onClose }) => {
    // Initialize states with existing values!
    const [rating, setRating] = useState(item.rating || 0);
    const [userNotes, setUserNotes] = useState(item.userNotes || '');
    const [isFavorite, setIsFavorite] = useState(item.isFavorite || false);

    // Check if original date was null/unknown
    const isOriginallyUnknown = item.watchDate === null;
    const [isUnknownDate, setIsUnknownDate] = useState(isOriginallyUnknown);

    // If it was unknown, default the date picker to today so if they uncheck it, it has a value
    const defaultDateStr = item.watchDate
        ? new Date(item.watchDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

    const [watchDate, setWatchDate] = useState(defaultDateStr);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Season Tracking logic
    const isMovie = item.mediaType === 'movie';
    const [fullSeasonsData, setFullSeasonsData] = useState([]);
    const [selectedEpisodes, setSelectedEpisodes] = useState(new Set());
    const [expandedSeason, setExpandedSeason] = useState(null);

    const { updateItem } = useContext(WatchHistoryContext);
    const { addToast } = useContext(ToastContext);

    useEffect(() => {
        const fetchDetails = async () => {
            if (isMovie) return; // No need to fetch details for movies on Edit

            setLoadingDetails(true);
            try {
                const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
                if (API_KEY) {
                    const { data } = await axios.get(`https://api.themoviedb.org/3/tv/${item.tmdbId}?api_key=${API_KEY}`);
                    const standardSeasons = data.seasons.filter(s => s.season_number > 0);
                    const seasonPromises = standardSeasons.map(s =>
                        axios.get(`https://api.themoviedb.org/3/tv/${item.tmdbId}/season/${s.season_number}?api_key=${API_KEY}`)
                            .then(res => res.data)
                            .catch(() => null)
                    );

                    const resolvedSeasons = (await Promise.all(seasonPromises)).filter(Boolean);
                    setFullSeasonsData(resolvedSeasons);

                    // Hydrate selected episodes backwards-compatibility
                    const initialSelected = new Set();
                    const today = new Date();

                    if (item.watchedEpisodes && item.watchedEpisodes.length > 0) {
                        item.watchedEpisodes.forEach(ep => {
                            initialSelected.add(typeof ep === 'string' ? ep : `S${ep.season}E${ep.episode}`);
                        });
                    } else if (item.watchedSeasons && item.watchedSeasons.length > 0) {
                        resolvedSeasons.forEach(season => {
                            if (item.watchedSeasons.includes(season.season_number) && season.episodes) {
                                season.episodes.forEach(ep => {
                                    if (ep.air_date && new Date(ep.air_date) <= today) {
                                        initialSelected.add(`S${season.season_number}E${ep.episode_number}`);
                                    }
                                });
                            }
                        });
                    } else {
                        // "All Seasons" empty array legacy check
                        resolvedSeasons.forEach(season => {
                            if (season.episodes) {
                                season.episodes.forEach(ep => {
                                    if (ep.air_date && new Date(ep.air_date) <= today) {
                                        initialSelected.add(`S${season.season_number}E${ep.episode_number}`);
                                    }
                                });
                            }
                        });
                    }
                    setSelectedEpisodes(initialSelected);
                } else {
                    // Mock Data fallback
                    setDetails({
                        seasons: [
                            { season_number: 1, episode_count: 10 },
                            { season_number: 2, episode_count: 10 }
                        ],
                        number_of_episodes: 20,
                        number_of_seasons: 2,
                        episode_run_time: [45]
                    });
                }
            } catch (error) {
                console.error('Failed to fetch TMDB details for edit', error);
            } finally {
                setLoadingDetails(false);
            }
        };

        fetchDetails();
    }, [item, isMovie]);

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
        setIsSubmitting(true);

        let runtimeParams = {};

        // If it's a TV Show, recalculate the runtime dynamically based on new season selections
        if (!isMovie) {
            let calculatedEpisodes = 0;
            let totalWatchTime = 0;

            selectedEpisodes.forEach(epStr => {
                const [s, e] = epStr.replace('S', '').split('E').map(Number);
                const seasonData = fullSeasonsData.find(sec => sec.season_number === s);
                if (seasonData && seasonData.episodes) {
                    const epData = seasonData.episodes.find(ep => ep.episode_number === e);
                    if (epData) {
                        calculatedEpisodes++;
                        totalWatchTime += epData.runtime || details?.episode_run_time?.[0] || item.episodeDuration || 45;
                    }
                }
            });

            const watchedEpisodesArray = Array.from(selectedEpisodes);

            runtimeParams = {
                episodes: calculatedEpisodes,
                watchTimeMinutes: totalWatchTime,
                watchedSeasons: [],
                watchedEpisodes: watchedEpisodesArray
            };
        }

        const updateData = {
            rating,
            userNotes,
            isFavorite,
            watchDate: isUnknownDate ? null : watchDate,
            ...runtimeParams
        };

        const result = await updateItem(item._id, updateData);
        setIsSubmitting(false);

        if (result.success) {
            addToast('Updated watch details!', 'success');
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

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <div className="modal-poster">
                            {item.posterPath ? (
                                <img src={`https://image.tmdb.org/t/p/w200${item.posterPath}`} alt={item.title} />
                            ) : (
                                <div className="no-poster">No Poster</div>
                            )}
                        </div>
                        <div className="modal-info">
                            <h2>{item.title}</h2>
                            <span className="modal-meta">
                                {item.mediaType === 'movie' ? 'Movie' : 'Series'} •{' '}
                                {item.releaseDate ? item.releaseDate.substring(0, 4) : 'Unknown'}
                            </span>

                            <div className="stats-preview" style={{ marginTop: '16px' }}>
                                <span>Editing Watched Details</span>
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

                        {!isMovie && fullSeasonsData.length > 0 && !loadingDetails && (
                            <div className="form-group" style={{ marginTop: '16px', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px' }}>
                                <label style={{ marginBottom: '12px', display: 'block' }}>Which episodes did you watch?</label>

                                <div className="seasons-accordion">
                                    {fullSeasonsData.map(season => {
                                        const today = new Date();
                                        const airedEpisodes = season.episodes?.filter(ep => ep.air_date && new Date(ep.air_date) <= today) || [];
                                        const unreleasedEpisodes = season.episodes?.filter(ep => !ep.air_date || new Date(ep.air_date) > today) || [];

                                        // Completely unreleased season
                                        if (airedEpisodes.length === 0) return null;

                                        const isFullyReleased = unreleasedEpisodes.length === 0;
                                        const isAllAiredSelected = airedEpisodes.length > 0 && airedEpisodes.every(ep => selectedEpisodes.has(`S${season.season_number}E${ep.episode_number}`));

                                        return (
                                            <div key={season.season_number} className="season-container" style={{ marginBottom: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                                                <div className="season-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', alignItems: 'center' }} onClick={() => toggleExpandSeason(season.season_number)}>
                                                    <label onClick={e => e.stopPropagation()} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', cursor: isFullyReleased ? 'pointer' : 'not-allowed', opacity: isFullyReleased ? 1 : 0.6 }}>
                                                        <input
                                                            type="checkbox"
                                                            disabled={!isFullyReleased}
                                                            checked={isFullyReleased && isAllAiredSelected}
                                                            onChange={(e) => handleSeasonCheck(season.season_number, airedEpisodes, e.target.checked)}
                                                            style={{ width: 'auto' }}
                                                        />
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                                                            Season {season.season_number}
                                                            {!isFullyReleased && <span style={{ fontSize: '0.7rem', color: 'var(--warning-color)' }}>Currently Airing (Select individual episodes)</span>}
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
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
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
                        <Button variant="primary" type="submit" isLoading={isSubmitting}>Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default EditModal;
