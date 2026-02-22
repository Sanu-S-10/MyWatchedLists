import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import axios from 'axios';
import './SearchBar.css';

const SearchBar = ({ onResultClick, placeholder = 'Search movies or series...' }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // We will call TMDB API directly for search, or through our backend if we made a route.
                // Assuming we have TMDB_API_KEY in frontend env vars, or just simulate it for layout purposes here.
                // For real implementation, we'll hit TMDB API:
                const API_KEY = import.meta.env.VITE_TMDB_API_KEY; // We'll need to set this
                if (API_KEY) {
                    const { data } = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}`);
                    const filtered = data.results.filter(
                        (item) => item.media_type === 'movie' || item.media_type === 'tv'
                    );
                    setResults(filtered.slice(0, 5));
                } else {
                    // Mock data for UI development if no key yet
                    setResults([
                        { id: 1, title: `Mock Movie for ${query}`, media_type: 'movie', release_date: '2023-01-01' },
                        { id: 2, name: `Mock Series for ${query}`, media_type: 'tv', first_air_date: '2022-01-01' }
                    ]);
                }
            } catch (error) {
                console.error('Search error', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            if (query) fetchResults();
        }, 500); // debounce

        return () => clearTimeout(timer);
    }, [query]);

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setShowDropdown(false);
    };

    const handleSelect = (item) => {
        setShowDropdown(false);
        setQuery('');
        if (onResultClick) onResultClick(item);
    };

    return (
        <div className="search-container" ref={dropdownRef}>
            <div className="search-input-wrapper">
                <SearchIcon className="search-icon" size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                />
                {query && (
                    <button className="search-clear" onClick={handleClear}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {showDropdown && (query || isLoading) && (
                <div className="search-dropdown">
                    {isLoading ? (
                        <div className="search-loading">Searching...</div>
                    ) : results.length > 0 ? (
                        <ul className="search-results">
                            {results.map((item) => (
                                <li key={item.id} onClick={() => handleSelect(item)}>
                                    <div className="search-result-poster">
                                        {item.poster_path ? (
                                            <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" />
                                        ) : (
                                            <div className="search-result-no-poster"></div>
                                        )}
                                    </div>
                                    <div className="search-result-info">
                                        <h4>{item.title || item.name}</h4>
                                        <span>
                                            {item.media_type === 'movie' ? 'Movie' : 'Series'} •{' '}
                                            {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || 'N/A'}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : query ? (
                        <div className="search-no-results">No results found for "{query}"</div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
