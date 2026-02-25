import { useState, useContext, useMemo, useEffect } from 'react';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import { ToastContext } from '../../context/ToastContext';
import MediaCard from '../../components/UI/MediaCard';
import Skeleton from '../../components/UI/Skeleton';
import EditModal from './EditModal';
import DetailsModal from './DetailsModal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { Filter, SortDesc, Edit2, Search, Grid3x3, List } from 'lucide-react';
import './ContentList.css';

const ContentList = ({ type = 'all', title = 'My Watched List' }) => {
    const { history, loading, removeItem } = useContext(WatchHistoryContext);
    const { addToast } = useContext(ToastContext);

    const [filterGenre, setFilterGenre] = useState('');
    const [filterRating, setFilterRating] = useState(0); // 0 means all
    const [filterYear, setFilterYear] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [filterMediaType, setFilterMediaType] = useState(''); // 'movie', 'series', or ''
    const [filterTitle, setFilterTitle] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // 'upcoming', 'progress', 'active', or ''
    const [sortBy, setSortBy] = useState('watchDateDesc'); // watchDateDesc, ratingDesc, yearDesc
    const [showFilters, setShowFilters] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Create unique keys for each list type
    const viewModeKey = `contentListViewMode_${type}`;
    const filterStateKey = `contentListFilters_${type}`;

    // Load view preference and filters from localStorage
    useEffect(() => {
        const savedViewMode = localStorage.getItem(viewModeKey);
        if (savedViewMode) {
            setViewMode(savedViewMode);
        }

        const savedFilters = localStorage.getItem(filterStateKey);
        let newFilterState = {
            genre: '',
            rating: 0,
            year: '',
            country: '',
            mediaType: '',
            title: '',
            status: '',
            sortBy: 'watchDateDesc'
        };

        if (savedFilters) {
            try {
                newFilterState = JSON.parse(savedFilters);
                setFilterGenre(newFilterState.genre || '');
                setFilterRating(newFilterState.rating || 0);
                setFilterYear(newFilterState.year || '');
                setFilterCountry(newFilterState.country || '');
                setFilterMediaType(newFilterState.mediaType || '');
                setFilterTitle(newFilterState.title || '');
                setFilterStatus(newFilterState.status || '');
                setSortBy(newFilterState.sortBy || 'watchDateDesc');
            } catch (error) {
                console.error('Failed to load filters:', error);
            }
        }

        // Check if current type has active filters and open filter panel accordingly
        const hasActiveFilters = 
            newFilterState.genre !== '' || 
            newFilterState.rating > 0 || 
            newFilterState.year !== '' || 
            newFilterState.country !== '' || 
            newFilterState.mediaType !== '' || 
            newFilterState.title !== '' || 
            newFilterState.status !== '' ||
            newFilterState.sortBy !== 'watchDateDesc';

        setShowFilters(hasActiveFilters);
    }, [type, viewModeKey, filterStateKey]);

    // Save view preference to localStorage
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem(viewModeKey, mode);
    };

    // Save filters to localStorage whenever they change
    useEffect(() => {
        const filters = {
            genre: filterGenre,
            rating: filterRating,
            year: filterYear,
            country: filterCountry,
            mediaType: filterMediaType,
            title: filterTitle,
            status: filterStatus,
            sortBy: sortBy,
        };
        localStorage.setItem(filterStateKey, JSON.stringify(filters));
    }, [filterGenre, filterRating, filterYear, filterCountry, filterMediaType, filterTitle, filterStatus, sortBy, filterStateKey]);

    // Extract unique genres for the filter dropdown - only for current list type
    const availableGenres = useMemo(() => {
        let items = [...history];

        // Filter by main type first
        if (type === 'movies') items = items.filter(item => item.mediaType === 'movie');
        if (type === 'series') items = items.filter(item => item.mediaType === 'series');
        if (type === 'anime') items = items.filter(item => item.subType === 'anime');
        if (type === 'animation') items = items.filter(item => item.subType === 'animation');
        if (type === 'documentary') items = items.filter(item => item.subType === 'documentary');
        if (type === 'favorites') items = items.filter(item => item.isFavorite);

        const genres = new Set();
        items.forEach(item => {
            if (item.genres) {
                item.genres.forEach(g => genres.add(g.name));
            }
        });
        return Array.from(genres).sort();
    }, [history, type]);

    const regionNames = useMemo(() => {
        try {
            return new Intl.DisplayNames(['en'], { type: 'region' });
        } catch (error) {
            return null;
        }
    }, []);

    const getCountryLabel = (code) => {
        if (!code) return '';
        if (!regionNames) return code;
        return regionNames.of(code) || code;
    };

    // Determine series status based on watched episodes
    const getSeriesStatus = (item) => {
        if (item.mediaType !== 'series') return null;
        
        const watchedEpisodeCount = item.watchedEpisodes?.length || 0;
        const totalEpisodes = item.episodes || 0;

        if (watchedEpisodeCount === 0) {
            return 'upcoming'; // Not started
        } else if (watchedEpisodeCount >= totalEpisodes && totalEpisodes > 0) {
            return 'active'; // Completed/Active
        } else {
            return 'progress'; // Partially watched
        }
    };

    // Extract unique countries (store ISO codes, display full names) - only for current list type
    const availableCountries = useMemo(() => {
        let items = [...history];

        // Filter by main type first
        if (type === 'movies') items = items.filter(item => item.mediaType === 'movie');
        if (type === 'series') items = items.filter(item => item.mediaType === 'series');
        if (type === 'anime') items = items.filter(item => item.subType === 'anime');
        if (type === 'animation') items = items.filter(item => item.subType === 'animation');
        if (type === 'documentary') items = items.filter(item => item.subType === 'documentary');
        if (type === 'favorites') items = items.filter(item => item.isFavorite);

        const countries = new Map();
        items.forEach(item => {
            if (item.originCountry) {
                const label = getCountryLabel(item.originCountry);
                countries.set(item.originCountry, label);
            }
        });
        return Array.from(countries.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [history, regionNames, type]);

    // Extract available series statuses - only for series list type
    const availableStatuses = useMemo(() => {
        let items = [...history];

        // Filter by main type first
        if (type === 'movies') items = items.filter(item => item.mediaType === 'movie');
        if (type === 'series') items = items.filter(item => item.mediaType === 'series');
        if (type === 'anime') items = items.filter(item => item.subType === 'anime');
        if (type === 'animation') items = items.filter(item => item.subType === 'animation');
        if (type === 'documentary') items = items.filter(item => item.subType === 'documentary');
        if (type === 'favorites') items = items.filter(item => item.isFavorite);

        const statuses = new Set();
        items.forEach(item => {
            const status = getSeriesStatus(item);
            if (status) {
                statuses.add(status);
            }
        });
        return Array.from(statuses).sort();
    }, [history, type]);

    const filteredItems = useMemo(() => {
        let items = [...history];

        // Filter by main type
        if (type === 'movies') items = items.filter(item => item.mediaType === 'movie');
        if (type === 'series') items = items.filter(item => item.mediaType === 'series');
        if (type === 'anime') items = items.filter(item => item.subType === 'anime');
        if (type === 'animation') items = items.filter(item => item.subType === 'animation');
        if (type === 'documentary') items = items.filter(item => item.subType === 'documentary');
        if (type === 'favorites') items = items.filter(item => item.isFavorite);

        // Apply secondary filters
        if (filterTitle) {
            items = items.filter(item =>
                item.title && item.title.toLowerCase().includes(filterTitle.toLowerCase())
            );
        }

        if (filterGenre) {
            items = items.filter(item => item.genres?.some(g => g.name === filterGenre));
        }

        if (filterRating > 0) {
            items = items.filter(item => item.rating >= filterRating);
        }

        if (filterYear) {
            items = items.filter(item => {
                const year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
                return year === filterYear;
            });
        }

        if (filterCountry) {
            items = items.filter(item => item.originCountry === filterCountry);
        }

        if (filterStatus) {
            items = items.filter(item => getSeriesStatus(item) === filterStatus);
        }

        // Apply media type filter for anime/animation
        if ((type === 'anime' || type === 'animation') && filterMediaType) {
            items = items.filter(item => item.mediaType === filterMediaType);
        }

        // Sort
        items.sort((a, b) => {
            switch (sortBy) {
                case 'ratingDesc':
                    return b.rating - a.rating;
                case 'yearDesc':
                    const yearA = a.releaseDate ? parseInt(a.releaseDate.substring(0, 4)) : 0;
                    const yearB = b.releaseDate ? parseInt(b.releaseDate.substring(0, 4)) : 0;
                    return yearB - yearA;
                case 'watchDateDesc':
                default:
                    const dateA = a.watchDate ? new Date(a.watchDate).getTime() : 0;
                    const dateB = b.watchDate ? new Date(b.watchDate).getTime() : 0;
                    return dateB - dateA;
            }
        });

        return items;
    }, [history, type, filterTitle, filterGenre, filterRating, filterYear, filterCountry, filterStatus, filterMediaType, sortBy, getSeriesStatus]);

    const handleDeleteRequest = (item, e) => {
        e.stopPropagation();
        setItemToDelete(item);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        const result = await removeItem(itemToDelete._id);
        setIsDeleting(false);
        if (result.success) {
            addToast('Removed from history', 'success');
            setItemToDelete(null);
        } else {
            addToast('Failed to remove item', 'error');
        }
    };

    return (
        <div className="content-list-page fade-in">
            <div className="page-header flex-between">
                <div>
                    <h1>{title}</h1>
                    <p>{filteredItems.length} items found</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search titles..."
                            value={filterTitle}
                            onChange={(e) => setFilterTitle(e.target.value)}
                            className="title-search-input"
                        />
                        {filterTitle && (
                            <button className="clear-search" onClick={() => setFilterTitle('')}>
                                ×
                            </button>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => handleViewModeChange('grid')}
                            title="Grid View"
                        >
                            <Grid3x3 size={20} />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => handleViewModeChange('list')}
                            title="List View"
                        >
                            <List size={20} />
                        </button>
                    </div>
                    <button className="icon-btn" onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={20} />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-group">
                        <label>Genre</label>
                        <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                            <option value="">All Genres</option>
                            {availableGenres.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Min Rating</label>
                        <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))}>
                            <option value="0">Any Rating</option>
                            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                            <option value="4">⭐⭐⭐⭐+ (4+)</option>
                            <option value="3">⭐⭐⭐+ (3+)</option>
                            <option value="2">⭐⭐+ (2+)</option>
                            <option value="1">⭐+ (1+)</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Release Year</label>
                        <input
                            type="number"
                            placeholder="e.g. 2023"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="year-input"
                        />
                    </div>
                    {type !== 'anime' && (
                        <div className="filter-group">
                            <label>Country</label>
                            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                                <option value="">All Countries</option>
                                {availableCountries.map(([code, label]) => (
                                    <option key={code} value={code}>{label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {(type === 'series' || type === 'anime' || type === 'all') && (
                        availableStatuses.length > 0 && (
                            <div className="filter-group">
                                <label>Series Status</label>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="">All Statuses</option>
                                    {availableStatuses.map(status => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )
                    )}
                    {(type === 'anime' || type === 'animation') && (
                        <div className="filter-group">
                            <label>Type</label>
                            <select value={filterMediaType} onChange={(e) => setFilterMediaType(e.target.value)}>
                                <option value="">All Types</option>
                                <option value="movie">{type === 'anime' ? 'Anime' : 'Animation'} Movies</option>
                                <option value="series">{type === 'anime' ? 'Anime' : 'Animation'} Series</option>
                            </select>
                        </div>
                    )}
                    <div className="filter-group">
                        <label>Sort By</label>
                        <div className="sort-wrapper">
                            <SortDesc size={16} className="sort-icon" />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                                <option value="watchDateDesc">Recent Watches</option>
                                <option value="ratingDesc">Highest Rated</option>
                                <option value="yearDesc">Newest Release</option>
                            </select>
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button className="clear-filters-btn" onClick={() => {
                            setFilterTitle('');
                            setFilterGenre('');
                            setFilterRating(0);
                            setFilterYear('');
                            setFilterCountry('');
                            setFilterMediaType('');
                            setFilterStatus('');
                            setSortBy('watchDateDesc');
                        }}>Clear All</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className={`${viewMode}-container`}>
                    <Skeleton type="card" count={8} />
                </div>
            ) : filteredItems.length > 0 ? (
                <div className={`${viewMode}-container`}>
                    {filteredItems.map((item) => (
                        <div key={item._id} className="card-wrapper">
                            {viewMode === 'grid' ? (
                                <>
                                    <MediaCard item={item} onClick={() => setViewingItem(item)} />
                                    <div className="card-actions-hover">
                                        <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} title="Edit">
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="delete-btn" onClick={(e) => handleDeleteRequest(item, e)} title="Remove">×</button>
                                    </div>
                                </>
                            ) : (
                                <div className="list-item">
                                    <div className="list-item-poster">
                                        <img
                                            src={item.posterPath ? `https://image.tmdb.org/t/p/w92${item.posterPath}` : 'https://via.placeholder.com/92x138?text=No+Poster'}
                                            alt={item.title || item.name}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="list-item-content" onClick={() => setViewingItem(item)}>
                                        <h3>{item.title || item.name}</h3>
                                        <div className="list-item-meta">
                                            <span className="meta-year">
                                                {item.releaseDate ? item.releaseDate.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A'}
                                            </span>
                                            <span className="meta-type">
                                                {item.subType === 'anime' ? 'Anime ' : item.subType === 'animation' ? 'Animated ' : ''}
                                                {item.mediaType === 'movie' ? 'Movie' : 'Series'}
                                            </span>
                                            {getSeriesStatus(item) && (
                                                <span className={`meta-status ${getSeriesStatus(item)}`}>
                                                    {getSeriesStatus(item).charAt(0).toUpperCase() + getSeriesStatus(item).slice(1)}
                                                </span>
                                            )}
                                            {item.rating > 0 && (
                                                <span className="meta-rating">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`star ${i < item.rating ? 'filled' : ''}`}>★</span>
                                                    ))}
                                                </span>
                                            )}
                                        </div>
                                        {item.genres && item.genres.length > 0 && (
                                            <div className="list-item-genres">
                                                {item.genres.slice(0, 3).map(g => (
                                                    <span key={g.id} className="genre-tag">{g.name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="list-item-actions">
                                        <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="delete-btn" onClick={(e) => handleDeleteRequest(item, e)} title="Remove">×</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">{type === 'favorites' ? '❤️' : '🎬'}</div>
                    <h3>No items found</h3>
                    <p>
                        {type === 'favorites'
                            ? "You haven't added any favorites yet."
                            : "Try adjusting your filters or search to add new items."}
                    </p>
                </div>
            )}

            {editingItem && (
                <EditModal item={editingItem} onClose={() => setEditingItem(null)} />
            )}

            {viewingItem && (
                <DetailsModal
                    item={viewingItem}
                    onClose={() => setViewingItem(null)}
                    onEdit={(item) => setEditingItem(item)}
                />
            )}

            {itemToDelete && (
                <ConfirmModal
                    title="Remove Title"
                    message={`Are you sure you want to remove "${itemToDelete.title}" from your watched list? This cannot be undone.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setItemToDelete(null)}
                    isLoading={isDeleting}
                />
            )}
        </div>
    );
};

export default ContentList;
