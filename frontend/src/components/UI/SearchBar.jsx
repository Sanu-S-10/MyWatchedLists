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
                const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
                if (API_KEY) {
                    // Parse year from query if format is "Title (Year)"
                    const yearMatch = query.match(/\((\d{4})\)$/);
                    let searchQuery = query;
                    let filterYear = null;
                    
                    if (yearMatch) {
                        filterYear = yearMatch[1];
                        searchQuery = query.replace(/\s*\(\d{4}\)\s*$/, '').trim();
                    }
                    
                    const encodedQuery = encodeURIComponent(searchQuery);
                    const movieYearParam = filterYear ? `&year=${filterYear}` : '';
                    const tvYearParam = filterYear ? `&first_air_date_year=${filterYear}` : '';
                    
                    // Search both movies and TV shows (all languages)
                    const [movieRes, tvRes] = await Promise.all([
                        axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodedQuery}${movieYearParam}`),
                        axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodedQuery}${tvYearParam}`)
                    ]);

                    // Combine results with proper media_type
                    let combinedResults = [
                        ...movieRes.data.results.map(item => ({ ...item, media_type: 'movie' })),
                        ...tvRes.data.results.map(item => ({ ...item, media_type: 'tv' }))
                    ];

                    // Filter by year if provided
                    if (filterYear) {
                        combinedResults = combinedResults.filter(item => {
                            const itemYear = item.media_type === 'movie' 
                                ? item.release_date?.substring(0, 4)
                                : item.first_air_date?.substring(0, 4);
                            return itemYear === filterYear;
                        });
                    }

                    // Do tolerant matching/ranking instead of strict startsWith filtering.
                    // This keeps results like "X2" visible for queries like "xmen 2".
                    const normalize = (value = '') =>
                        value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '');

                    const normalizedQuery = normalize(searchQuery);
                    const queryTokens = searchQuery
                        .toLowerCase()
                        .split(/\s+/)
                        .map(token => token.replace(/[^a-z0-9]/g, ''))
                        .filter(Boolean);

                    const getScore = (item) => {
                        const titles = [item.title, item.name, item.original_title, item.original_name]
                            .filter(Boolean)
                            .map(value => value.toLowerCase());

                        const normalizedTitles = titles.map(normalize);

                        // Highest priority: exact normalized match.
                        if (normalizedTitles.some(title => title === normalizedQuery)) {
                            return 400;
                        }

                        // Prefix match on normalized title.
                        if (normalizedTitles.some(title => title.startsWith(normalizedQuery))) {
                            return 300;
                        }

                        // Substring match on normalized title.
                        if (normalizedTitles.some(title => title.includes(normalizedQuery))) {
                            return 220;
                        }

                        // Token overlap gives softer matching for human query variations.
                        const tokenOverlap = queryTokens.reduce((count, token) => {
                            return normalizedTitles.some(title => title.includes(token)) ? count + 1 : count;
                        }, 0);

                        // Small fallback score for broad TMDB hits so we don't hide plausible results.
                        return tokenOverlap > 0 ? 120 + tokenOverlap * 15 : 40;
                    };

                    const sorted = combinedResults.sort((a, b) => {
                        const scoreA = getScore(a);
                        const scoreB = getScore(b);

                        if (scoreA !== scoreB) {
                            return scoreB - scoreA;
                        }

                        return (b.popularity || 0) - (a.popularity || 0);
                    });
                    
                    // Always limit to 8 results
                    const filtered = sorted.slice(0, 8);
                    
                    setResults(filtered);
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

    const getMediaLabel = (item) => {
        const isAnimation = item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16);
        const isDocumentary = item.genre_ids?.includes(99) || item.genres?.some(g => g.id === 99);
        const isJapanese = item.original_language === 'ja';

        if (isDocumentary) {
            return 'Documentary';
        } else if (isAnimation && isJapanese) {
            return 'Anime';
        } else if (isAnimation) {
            return 'Animated';
        }
        return item.media_type === 'movie' ? 'Movie' : 'Series';
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
                                            {getMediaLabel(item)} •{' '}
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
