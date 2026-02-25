import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Heart, Calendar, Star, Clock } from 'lucide-react';
import Button from '../../components/UI/Button';
import '../Search/AddModal.css'; // Reusing CSS for consistent style

const DetailsModal = ({ item, onClose, onEdit }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandOverview, setExpandOverview] = useState(false);
    const [director, setDirector] = useState(null);
    const [cast, setCast] = useState([]);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const type = item.mediaType === 'movie' ? 'movie' : 'tv';
                const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

                if (API_KEY) {
                    const { data } = await axios.get(`https://api.themoviedb.org/3/${type}/${item.tmdbId}?api_key=${API_KEY}&append_to_response=credits`);
                    setDetails(data);
                    
                    // Extract director and cast
                    if (data.credits) {
                        const directorObj = data.credits.crew?.find(person => person.job === 'Director');
                        setDirector(directorObj || null);
                        setCast(data.credits.cast?.slice(0, 8) || []);
                    }
                } else {
                    setDetails({});
                }
            } catch (error) {
                console.error('Failed to fetch details', error);
                setDetails({});
            } finally {
                setLoading(false);
            }
        };

        if (item && item.tmdbId) {
            fetchDetails();
        }
    }, [item]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown Date';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
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
                    <div className="modal-form">
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
                                {details?.overview && (
                                    <div style={{ marginTop: '8px' }}>
                                        <p className={`modal-overview ${expandOverview ? 'expanded' : ''}`} style={{ margin: 0 }}>{details.overview}</p>
                                        {details.overview && details.overview.length > 150 && (
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
                                )}

                                {(director || cast.length > 0) && (
                                    <div style={{ marginTop: '12px' }}>
                                        {director && (
                                            <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Director:</span>
                                                <span style={{ marginLeft: '8px', fontWeight: '500' }}>{director.name}</span>
                                            </p>
                                        )}
                                        {cast.length > 0 && (
                                            <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Cast:</span>
                                                <span style={{ marginLeft: '8px', fontWeight: '500' }}>{cast.map(c => c.name).join(', ')}</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="stats-preview" style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {item.watchTimeMinutes > 0 && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} />
                                            {item.mediaType === 'movie' ? `${item.watchTimeMinutes} min` : `${item.episodes} eps × ${item.episodeDuration}m`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-body">
                            <div className="form-row" style={{ padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                                <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Watched On</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                                        <Calendar size={18} color="var(--accent-color)" />
                                        {formatDate(item.watchDate)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderLeft: '1px solid var(--border-color)' }}>
                                    <Heart size={28} fill={item.isFavorite ? 'var(--danger-color)' : 'transparent'} color={item.isFavorite ? 'var(--danger-color)' : 'var(--border-color)'} />
                                </div>
                            </div>

                            {item.mediaType !== 'movie' && item.watchedEpisodes && item.watchedEpisodes.length > 0 && (
                                <div className="form-group" style={{ marginTop: '16px', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Episodes Watched</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {(() => {
                                            const seasonMap = {};
                                            item.watchedEpisodes.forEach(ep => {
                                                let s, e;
                                                if (typeof ep === 'string') {
                                                    const match = ep.match(/S(\d+)E(\d+)/);
                                                    if (match) {
                                                        s = parseInt(match[1]);
                                                        e = parseInt(match[2]);
                                                    } else {
                                                        if (!seasonMap['Other']) seasonMap['Other'] = [];
                                                        seasonMap['Other'].push(ep);
                                                        return;
                                                    }
                                                } else {
                                                    s = parseInt(ep.season);
                                                    e = parseInt(ep.episode);
                                                }

                                                if (s !== undefined && !isNaN(s) && e !== undefined && !isNaN(e)) {
                                                    if (!seasonMap[s]) seasonMap[s] = [];
                                                    seasonMap[s].push(e);
                                                }
                                            });

                                            return Object.entries(seasonMap).sort((a, b) => a[0] === 'Other' ? 1 : b[0] === 'Other' ? -1 : Number(a[0]) - Number(b[0])).map(([s, eps]) => {
                                                if (s === 'Other') {
                                                    return (
                                                        <div key={s} style={{ display: 'flex', alignItems: 'flex-start', fontSize: '0.85rem', padding: '6px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', width: '70px', flexShrink: 0 }}>Extras</span>
                                                            <span style={{ color: 'var(--text-secondary)' }}>{eps.join(', ')}</span>
                                                        </div>
                                                    );
                                                }

                                                eps.sort((a, b) => a - b);
                                                let epText = eps.length > 5 ? `${eps.length} episodes` : `Ep ${eps.join(', ')}`;
                                                return (
                                                    <div key={s} style={{ display: 'flex', alignItems: 'flex-start', fontSize: '0.85rem', padding: '6px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', width: '70px', flexShrink: 0 }}>Season {s}</span>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{epText}</span>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Your Rating</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={24} fill={i < item.rating ? 'var(--star-color)' : 'transparent'} color={i < item.rating ? 'var(--star-color)' : 'var(--border-color)'} />
                                    ))}
                                </div>
                            </div>

                            {item.userNotes && (
                                <div className="form-group" style={{ marginTop: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Personal Notes</span>
                                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        {item.userNotes}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0' }}>
                            <Button variant="ghost" onClick={onClose} type="button">Close</Button>
                            <Button variant="primary" onClick={() => { onClose(); onEdit(item); }}>Edit Details</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default DetailsModal;
