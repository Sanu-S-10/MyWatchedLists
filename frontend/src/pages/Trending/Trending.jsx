import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Flame } from 'lucide-react';
import AddModal from '../Search/AddModal';
import './Trending.css';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

const TrendingSection = ({ title, items, onSelect }) => (
    <section className="trending-section">
        <h2>{title}</h2>
        {items.length === 0 ? (
            <p className="trending-empty">No trending titles available right now.</p>
        ) : (
            <div className="trending-grid">
                {items.map((item) => (
                    <article
                        key={`${item.media_type}-${item.id}`}
                        className="trending-card"
                        onClick={() => onSelect(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelect(item);
                            }
                        }}
                    >
                        <img
                            src={item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster'}
                            alt={item.title || item.name}
                        />
                        <div className="trending-card-body">
                            <h3>{item.title || item.name}</h3>
                            <p>
                                {(item.release_date || item.first_air_date || '').slice(0, 4) || 'N/A'}
                                {' • '}
                                ⭐ {Number(item.vote_average || 0).toFixed(1)}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        )}
    </section>
);

const Trending = () => {
    const [movies, setMovies] = useState([]);
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.reopenItem) {
            setSelectedItem(location.state.reopenItem);
            // Clear state to avoid reopening on refresh
            window.history.replaceState({ ...location.state, reopenItem: null }, '');
        }
    }, [location.state]);
    const [selectedType, setSelectedType] = useState('movie');

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const apiKey = import.meta.env.VITE_TMDB_API_KEY;
                if (!apiKey) {
                    setError('TMDB API key is missing. Add VITE_TMDB_API_KEY to use trending.');
                    setLoading(false);
                    return;
                }

                const [movieRes, seriesRes] = await Promise.all([
                    axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`),
                    axios.get(`https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}`),
                ]);

                const movieItems = (movieRes.data?.results || []).slice(0, 20).map((item) => ({ ...item, media_type: 'movie' }));
                const seriesItems = (seriesRes.data?.results || []).slice(0, 20).map((item) => ({ ...item, media_type: 'tv' }));

                setMovies(movieItems);
                setSeries(seriesItems);
                setError('');
            } catch (err) {
                setError('Failed to load trending data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
    }, []);

    return (
        <div className="trending-page fade-in">
            <div className="page-header">
                <h1><Flame size={26} /> Trending</h1>
                <p>Weekly trending movies and series.</p>
            </div>

            {loading && <div className="trending-loading"><span className="loader"></span></div>}
            {!loading && error && <div className="trending-error">{error}</div>}

            {!loading && !error && (
                <>
                    <div className="trending-toggle" role="tablist" aria-label="Select trending type">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={selectedType === 'movie'}
                            className={`trending-type-btn ${selectedType === 'movie' ? 'active' : ''}`}
                            onClick={() => setSelectedType('movie')}
                        >
                            Movies
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={selectedType === 'series'}
                            className={`trending-type-btn ${selectedType === 'series' ? 'active' : ''}`}
                            onClick={() => setSelectedType('series')}
                        >
                            Series
                        </button>
                    </div>

                    {selectedType === 'movie' ? (
                        <TrendingSection title="Trending Movies" items={movies} onSelect={setSelectedItem} />
                    ) : (
                        <TrendingSection title="Trending Series" items={series} onSelect={setSelectedItem} />
                    )}
                </>
            )}

            {selectedItem && (
                <AddModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
};

export default Trending;
