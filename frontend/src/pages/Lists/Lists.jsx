import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Check, Link2, Plus, Save, Trash2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import { ToastContext } from '../../context/ToastContext';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import './Lists.css';

const getPosterUrl = (posterPath) => (
    posterPath
        ? `https://image.tmdb.org/t/p/w300${posterPath}`
        : 'https://via.placeholder.com/300x450?text=No+Poster'
);

const PickerPosterItem = memo(({ item, selected, onToggle }) => (
    <button
        type="button"
        className={`picker-poster-item ${selected ? 'selected' : ''}`}
        onClick={() => onToggle(item._id)}
    >
        <div className="picker-poster-wrap">
            <img src={getPosterUrl(item.posterPath)} alt={item.title || item.name} loading="lazy" />
            {selected && (
                <span className="picker-selected-badge">
                    <Check size={12} />
                </span>
            )}
        </div>
        <span className="picker-poster-title">{item.title || item.name}</span>
    </button>
));

PickerPosterItem.displayName = 'PickerPosterItem';

const Lists = () => {
    const { user } = useContext(AuthContext);
    const { history } = useContext(WatchHistoryContext);
    const { addToast } = useContext(ToastContext);

    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showCreateSection, setShowCreateSection] = useState(false);
    const [mediaFilter, setMediaFilter] = useState('movie');
    const [searchTerm, setSearchTerm] = useState('');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [expandedListId, setExpandedListId] = useState(null);

    const authConfig = useMemo(
        () => ({ headers: { Authorization: `Bearer ${user?.token}` } }),
        [user?.token]
    );

    const fetchLists = async () => {
        if (!user?.token) return;
        try {
            setLoading(true);
            const { data } = await axios.get('/api/custom-lists', authConfig);
            setLists(data || []);
        } catch (error) {
            addToast('Failed to load lists', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLists();
    }, [user?.token]);

    const toggleItem = useCallback((id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }, []);

    const resetForm = () => {
        setName('');
        setDescription('');
        setSelectedIds([]);
        setEditingId(null);
        setMediaFilter('movie');
        setSearchTerm('');
    };

    const startEdit = (list) => {
        setShowCreateSection(true);
        setEditingId(list._id);
        setName(list.name || '');
        setDescription(list.description || '');
        setSelectedIds((list.items || []).map((item) => item.watchItem));
    };

    const openCreateSection = () => {
        resetForm();
        setShowCreateSection(true);
    };

    const closeCreateSection = () => {
        resetForm();
        setShowCreateSection(false);
    };

    const normalizedSearch = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

    const filteredItems = useMemo(
        () => history.filter((item) => {
            const matchesType = item.mediaType === mediaFilter;
            if (!matchesType) return false;
            if (!normalizedSearch) return true;
            const itemTitle = (item.title || item.name || '').toLowerCase();
            return itemTitle.includes(normalizedSearch);
        }),
        [history, mediaFilter, normalizedSearch]
    );

    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const saveList = async (event) => {
        event.preventDefault();
        if (!name.trim()) {
            addToast('List name is required', 'warning');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                name: name.trim(),
                description: description.trim(),
                itemIds: selectedIds,
                isPublic: true,
            };

            if (editingId) {
                const { data } = await axios.put(`/api/custom-lists/${editingId}`, payload, authConfig);
                setLists((prev) => prev.map((list) => (list._id === editingId ? data : list)));
                addToast('List updated', 'success');
            } else {
                const { data } = await axios.post('/api/custom-lists', payload, authConfig);
                setLists((prev) => [data, ...prev]);
                addToast('List created', 'success');
            }

            resetForm();
            setShowCreateSection(false);
        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to save list', 'error');
        } finally {
            setSaving(false);
        }
    };

    const removeList = async (id) => {
        try {
            await axios.delete(`/api/custom-lists/${id}`, authConfig);
            setLists((prev) => prev.filter((list) => list._id !== id));
            addToast('List removed', 'success');
            if (editingId === id) resetForm();
            if (expandedListId === id) {
                setExpandedListId(null);
            }
        } catch (error) {
            addToast('Failed to remove list', 'error');
        }
    };

    const copyShareLink = async (shareId) => {
        const shareUrl = `${window.location.origin}/shared-list/${shareId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            addToast('Share link copied', 'success');
        } catch (error) {
            addToast('Copy failed. Please copy manually.', 'warning');
        }
    };

    return (
        <div className={`lists-page fade-in ${showCreateSection ? 'create-open' : ''}`}>
            <div className="page-header">
                <h1>Custom Lists</h1>
                <p>Create recommendation lists from your watched movies and series, then share with friends.</p>
            </div>

            {!showCreateSection ? (
                <div className="create-list-button-row">
                    <Button type="button" onClick={openCreateSection}>
                        <Plus size={16} /> Create List
                    </Button>
                </div>
            ) : (
                <section className="lists-card">
                    <h2>{editingId ? 'Edit List' : 'Create New List'}</h2>
                    <form onSubmit={saveList} className="list-form">
                        <div className="list-form-top-row">
                            <Input
                                label="List Name"
                                placeholder="e.g. Weekend Sci-Fi Picks"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                            />
                            <Input
                                label="Description"
                                placeholder="Short description for your friends"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>

                        <div className="list-picker">
                            <div className="picker-header-row">
                                <h3>Select watched items</h3>
                                <div className="picker-type-switch">
                                    <button
                                        type="button"
                                        className={mediaFilter === 'movie' ? 'active' : ''}
                                        onClick={() => setMediaFilter('movie')}
                                    >
                                        Movies
                                    </button>
                                    <button
                                        type="button"
                                        className={mediaFilter === 'series' ? 'active' : ''}
                                        onClick={() => setMediaFilter('series')}
                                    >
                                        Series
                                    </button>
                                </div>
                            </div>

                            <div className="picker-search-row">
                                <input
                                    type="text"
                                    className="picker-search-input"
                                    placeholder={`Search ${mediaFilter === 'movie' ? 'movies' : 'series'}...`}
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>

                            {history.length === 0 ? (
                                <p className="empty-msg">No watched items available yet.</p>
                            ) : filteredItems.length === 0 ? (
                                <p className="empty-msg">
                                    {searchTerm.trim()
                                        ? `No ${mediaFilter === 'movie' ? 'movies' : 'series'} found for "${searchTerm.trim()}".`
                                        : `No watched ${mediaFilter === 'movie' ? 'movies' : 'series'} available yet.`}
                                </p>
                            ) : (
                                <div className="picker-poster-grid">
                                    {filteredItems.map((item) => (
                                        <PickerPosterItem
                                            key={item._id}
                                            item={item}
                                            selected={selectedIdSet.has(item._id)}
                                            onToggle={toggleItem}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="list-form-actions">
                            <p className="selected-count">{selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} selected</p>
                            <Button type="submit" isLoading={saving}>
                                {editingId ? <><Save size={16} /> Update List</> : <><Plus size={16} /> Create List</>}
                            </Button>
                            <Button type="button" variant="secondary" onClick={closeCreateSection}>
                                {editingId ? 'Cancel Edit' : 'Cancel'}
                            </Button>
                        </div>
                    </form>
                </section>
            )}

            {!showCreateSection && (
                <section className="lists-card">
                    <h2>My Lists</h2>
                    {loading ? (
                        <div className="lists-loading"><span className="loader"></span></div>
                    ) : lists.length === 0 ? (
                        <p className="empty-msg">No custom lists yet.</p>
                    ) : (
                        <div className="my-lists-grid">
                            {lists.map((list) => (
                                <article
                                    key={list._id}
                                    className={`my-list-item ${expandedListId === list._id ? 'expanded' : ''}`}
                                    onClick={() => setExpandedListId((prev) => (prev === list._id ? null : list._id))}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setExpandedListId((prev) => (prev === list._id ? null : list._id));
                                        }
                                    }}
                                >
                                    <div className="my-list-summary">
                                        <div className="my-list-summary-left">
                                            <div className="my-list-poster-thumb">
                                                <img
                                                    src={getPosterUrl(((list.items || []).find((item) => item.mediaType === 'movie') || list.items?.[0])?.posterPath)}
                                                    alt={list.name}
                                                    loading="lazy"
                                                />
                                            </div>

                                            <div className="my-list-summary-text">
                                                <h3>{list.name}</h3>
                                                <p>{list.description || 'No description'}</p>
                                                <small>{list.itemCount} items</small>
                                            </div>
                                        </div>

                                        <div className="my-list-summary-right" onClick={(event) => event.stopPropagation()}>
                                            <Button variant="secondary" onClick={() => copyShareLink(list.shareId)}>
                                                <Link2 size={16} /> Share
                                            </Button>
                                        </div>
                                    </div>

                                    {expandedListId === list._id && (
                                        <>
                                            {list.items?.length ? (
                                                <div className="shared-items-grid list-items-grid">
                                                    {list.items.map((item, index) => (
                                                        <article key={`${item.watchItem || item.tmdbId || index}`} className="shared-item">
                                                            <img
                                                                src={item.posterPath ? `https://image.tmdb.org/t/p/w200${item.posterPath}` : 'https://via.placeholder.com/200x300?text=No+Poster'}
                                                                alt={item.title || item.name || 'List item'}
                                                            />
                                                            <div>
                                                                <h3>{item.title || item.name || 'Untitled'}</h3>
                                                                <p>
                                                                    {item.mediaType === 'movie' ? 'Movie' : 'Series'}
                                                                    {item.releaseDate ? ` • ${item.releaseDate.slice(0, 4)}` : ''}
                                                                </p>
                                                            </div>
                                                        </article>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="empty-msg">No items in this list.</p>
                                            )}

                                            <div className="list-actions-bottom" onClick={(event) => event.stopPropagation()}>
                                                <div className="list-actions-left">
                                                    <Button variant="secondary" onClick={() => startEdit(list)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="danger" onClick={() => removeList(list._id)}>
                                                        <Trash2 size={16} /> Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default Lists;
