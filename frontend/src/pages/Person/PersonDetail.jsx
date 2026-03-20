import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, MapPin, Film, Tv, Star } from 'lucide-react';
import AddModal from '../Search/AddModal';
import './PersonDetail.css';

const PersonDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [person, setPerson] = useState(null);
    const [credits, setCredits] = useState([]);
    const [knownFor, setKnownFor] = useState([]);
    const [socialMedia, setSocialMedia] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPersonData = async () => {
            setLoading(true);
            try {
                const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
                if (!API_KEY) {
                    throw new Error('TMDB API Key is missing');
                }

                const [personRes, creditsRes, socialRes] = await Promise.all([
                    axios.get(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}`),
                    axios.get(`https://api.themoviedb.org/3/person/${id}/combined_credits?api_key=${API_KEY}`),
                    axios.get(`https://api.themoviedb.org/3/person/${id}/external_ids?api_key=${API_KEY}`)
                ]);

                setPerson(personRes.data);
                setSocialMedia(socialRes.data);

                // Combine and sort credits
                const allCredits = [
                    ...(creditsRes.data.cast || []),
                    ...(creditsRes.data.crew || [])
                ];

                // Remove duplicates (sometimes a person can be both cast and crew)
                const uniqueCredits = allCredits.reduce((acc, current) => {
                    const x = acc.find(item => item.id === current.id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                const sortedCredits = uniqueCredits.sort((a, b) => {
                    const dateA = a.release_date || a.first_air_date || '0000-00-00';
                    const dateB = b.release_date || b.first_air_date || '0000-00-00';
                    return dateB.localeCompare(dateA);
                });

                setCredits(sortedCredits);

                // Extract top 8 for "Known For"
                // Prioritize their primary department and sort by vote count/popularity
                let knownForWorks = [...uniqueCredits];

                if (personRes.data.known_for_department === 'Acting') {
                    // Pre-filter to prioritize acting roles that aren't "Self" or "Extra" (if possible)
                    knownForWorks = uniqueCredits.filter(c => c.character && !c.character.toLowerCase().includes('self'));
                    if (knownForWorks.length < 4) knownForWorks = [...uniqueCredits];
                } else if (personRes.data.known_for_department === 'Directing') {
                    // Prioritize directing jobs
                    knownForWorks = uniqueCredits.filter(c => c.job === 'Director');
                    if (knownForWorks.length < 4) knownForWorks = [...uniqueCredits];
                } else if (personRes.data.known_for_department === 'Writing') {
                    // Prioritize writing jobs
                    knownForWorks = uniqueCredits.filter(c => c.department === 'Writing' || c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story');
                    if (knownForWorks.length < 4) knownForWorks = [...uniqueCredits];
                } else if (personRes.data.known_for_department === 'Production') {
                    // Prioritize producing jobs
                    knownForWorks = uniqueCredits.filter(c => c.job === 'Producer' || c.job === 'Executive Producer');
                    if (knownForWorks.length < 4) knownForWorks = [...uniqueCredits];
                }

                const popularCredits = knownForWorks
                    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                    .slice(0, 8);
                    
                setKnownFor(popularCredits);
            } catch (err) {
                console.error('Failed to fetch person details:', err);
                setError('Failed to load person details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPersonData();
        }
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return (
            <div className="person-detail-loading">
                <span className="loader"></span>
            </div>
        );
    }

    if (error || !person) {
        return (
            <div className="person-detail-error">
                <p>{error || 'Person not found'}</p>
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} /> Back
                </button>
            </div>
        );
    }

    return (
        <div className="person-detail-container fade-in">
            <button onClick={() => navigate(-1)} className="back-btn">
                <ArrowLeft size={20} /> Back
            </button>

            <div className="person-header">
                <div className="person-profile-img">
                    {person.profile_path ? (
                        <img src={`https://image.tmdb.org/t/p/w300${person.profile_path}`} alt={person.name} />
                    ) : (
                        <div className="no-profile">No Image</div>
                    )}
                </div>
                <div className="person-info">
                    <h1>{person.name}</h1>
                    <div className="person-meta">
                        {person.birthday && (
                            <div className="meta-item">
                                <Calendar size={16} />
                                <span>Born: {formatDate(person.birthday)}</span>
                            </div>
                        )}
                        {person.place_of_birth && (
                            <div className="meta-item">
                                <MapPin size={16} />
                                <span>{person.place_of_birth}</span>
                            </div>
                        )}
                        {person.known_for_department && (
                            <div className="meta-item">
                                <Star size={16} />
                                <span>{person.known_for_department}</span>
                            </div>
                        )}
                    </div>

                    {socialMedia && (
                        <div className="person-socials">
                            {socialMedia.instagram_id && (
                                <a href={`https://instagram.com/${socialMedia.instagram_id}`} target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                </a>
                            )}
                            {socialMedia.twitter_id && (
                                <a href={`https://twitter.com/${socialMedia.twitter_id}`} target="_blank" rel="noopener noreferrer" className="social-icon" title="Twitter">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                                </a>
                            )}
                            {socialMedia.facebook_id && (
                                <a href={`https://facebook.com/${socialMedia.facebook_id}`} target="_blank" rel="noopener noreferrer" className="social-icon" title="Facebook">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                </a>
                            )}
                            {socialMedia.youtube_id && (
                                <a href={`https://youtube.com/channel/${socialMedia.youtube_id}`} target="_blank" rel="noopener noreferrer" className="social-icon" title="YouTube">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                                </a>
                            )}
                            {person.homepage && (
                                <a href={person.homepage} target="_blank" rel="noopener noreferrer" className="social-icon" title="Website">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {person.biography && (
                    <div className="person-bio-section">
                        <h3>Biography</h3>
                        <p>{person.biography}</p>
                    </div>
                )}
            </div>

            {knownFor.length > 0 && (
                <div className="person-known-for">
                    <h2>Known For</h2>
                    <div className="known-for-grid">
                        {knownFor.map((item) => (
                            <div 
                                key={`known-${item.id}`} 
                                className="known-for-card"
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="known-for-poster">
                                    {item.poster_path ? (
                                        <img src={`https://image.tmdb.org/t/p/w185${item.poster_path}`} alt={item.title || item.name} />
                                    ) : (
                                        <div className="no-poster-medium">No Poster</div>
                                    )}
                                </div>
                                <div className="known-for-info">
                                    <p className="known-for-title">{item.title || item.name}</p>
                                    <p className="known-for-year">
                                        {(item.release_date || item.first_air_date || '').substring(0, 4)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="person-filmography">
                <h2>Filmography</h2>
                <div className="filmography-list">
                    {credits.length > 0 ? (
                        credits.map((item) => (
                            <div 
                                key={`${item.id}-${item.credit_id || Math.random()}`} 
                                className="film-card"
                                onClick={() => setSelectedItem(item)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="film-poster">
                                    {item.poster_path ? (
                                        <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title || item.name} />
                                    ) : (
                                        <div className="no-poster-small">No Poster</div>
                                    )}
                                </div>
                                <div className="film-details">
                                    <h4>{item.title || item.name}</h4>
                                    <div className="film-meta">
                                        <span className="film-type">
                                            {item.media_type === 'movie' ? <Film size={14} /> : <Tv size={14} />}
                                            {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                                        </span>
                                        <span className="film-year">
                                            {(item.release_date || item.first_air_date || '').substring(0, 4) || 'N/A'}
                                        </span>
                                    </div>
                                    {item.character && (
                                        <p className="film-role">As: <span>{item.character}</span></p>
                                    )}
                                    {item.job && (
                                        <p className="film-role">Role: <span>{item.job}</span></p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No credits found.</p>
                    )}
                </div>
            </div>

            {selectedItem && (
                <AddModal 
                    item={{
                        ...selectedItem,
                        id: selectedItem.id,
                        media_type: selectedItem.media_type,
                        poster_path: selectedItem.poster_path,
                        title: selectedItem.title,
                        name: selectedItem.name,
                        overview: selectedItem.overview,
                        release_date: selectedItem.release_date,
                        first_air_date: selectedItem.first_air_date
                    }} 
                    onClose={() => setSelectedItem(null)} 
                />
            )}
        </div>
    );
};

export default PersonDetail;
