import { useState, useContext, useMemo } from 'react';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import { ToastContext } from '../../context/ToastContext';
import MediaCard from '../../components/UI/MediaCard';
import Skeleton from '../../components/UI/Skeleton';
import EditModal from './EditModal';
import DetailsModal from './DetailsModal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { Filter, SortDesc, Edit2, Search } from 'lucide-react';
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
    const [sortBy, setSortBy] = useState('watchDateDesc'); // watchDateDesc, ratingDesc, yearDesc
    const [showFilters, setShowFilters] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Extract unique genres for the filter dropdown
    const availableGenres = useMemo(() => {
        const genres = new Set();
        history.forEach(item => {
            if (item.genres) {
                item.genres.forEach(g => genres.add(g.name));
            }
        });
        return Array.from(genres).sort();
    }, [history]);

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

    // Extract unique countries (store ISO codes, display full names)
    const availableCountries = useMemo(() => {
        const countries = new Map();
        history.forEach(item => {
            if (item.originCountry) {
                const label = getCountryLabel(item.originCountry);
                countries.set(item.originCountry, label);
            }
        });
        return Array.from(countries.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [history, regionNames]);

    const filteredItems = useMemo(() => {
        let items = [...history];

        // Filter by main type
        if (type === 'movies') items = items.filter(item => item.mediaType === 'movie');
        if (type === 'series') items = items.filter(item => item.mediaType === 'series');
        if (type === 'anime') items = items.filter(item => item.subType === 'anime');
        if (type === 'animation') items = items.filter(item => item.subType === 'animation');
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
    }, [history, type, filterTitle, filterGenre, filterRating, filterYear, filterCountry, filterMediaType, sortBy]);

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
                    <div className="filter-group">
                        <label>Country</label>
                        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                            <option value="">All Countries</option>
                            {availableCountries.map(([code, label]) => (
                                <option key={code} value={code}>{label}</option>
                            ))}
                        </select>
                    </div>
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
                            setSortBy('watchDateDesc');
                        }}>Clear All</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid-container">
                    <Skeleton type="card" count={8} />
                </div>
            ) : filteredItems.length > 0 ? (
                <div className="grid-container">
                    {filteredItems.map((item) => (
                        <div key={item._id} className="card-wrapper">
                            <MediaCard item={item} onClick={() => setViewingItem(item)} />
                            <div className="card-actions-hover">
                                <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} title="Edit">
                                    <Edit2 size={14} />
                                </button>
                                <button className="delete-btn" onClick={(e) => handleDeleteRequest(item, e)} title="Remove">×</button>
                            </div>
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
