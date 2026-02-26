import { useState, useContext } from 'react';
import { ToastContext } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import MediaCard from '../../components/UI/MediaCard';
import Skeleton from '../../components/UI/Skeleton';
import DetailsModal from '../ContentList/DetailsModal';
import EditModal from '../ContentList/EditModal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import { Search, Sparkles, Grid3x3, Edit2 } from 'lucide-react';
import '../ContentList/ContentList.css';
import './AIFilter.css';

const AIFilter = () => {
    const { user } = useContext(AuthContext);
    const { removeItem, updateItem } = useContext(WatchHistoryContext);
    const { addToast } = useContext(ToastContext);

    const [prompt, setPrompt] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Modal states
    const [viewingItem, setViewingItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAIFilter = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            const res = await fetch('/api/watch-history/ai-filter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();

            if (res.ok) {
                setFilteredItems(Array.isArray(data) ? data : []);
                if (data.length === 0) {
                    addToast('No matching items found', 'info');
                } else {
                    addToast(`Found ${data.length} matching items`, 'success');
                }
            } else {
                throw new Error(data.message || 'Failed to filter items');
            }
        } catch (error) {
            console.error('AI Filter Error:', error);
            addToast(error.message || 'Error processing your request', 'error');
            setFilteredItems([]);
        } finally {
            setIsLoading(false);
        }
    };

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
            setFilteredItems(prev => prev.filter(i => i._id !== itemToDelete._id));
            setItemToDelete(null);
        } else {
            addToast('Failed to remove item', 'error');
        }
    };

    const handleEditComplete = async (updatedItem) => {
        // Find and replace the item in the local state so UI updates
        setFilteredItems(prev => prev.map(item =>
            item._id === updatedItem._id ? { ...item, ...updatedItem } : item
        ));
        setEditingItem(null);
    };

    return (
        <div className="content-list-page fade-in">
            <div className="page-header flex-between ai-header">
                <div>
                    <h1><Sparkles size={24} className="inline-icon gemini-icon" /> AI Smart Filter</h1>
                    <p>Filter your watched list using natural language with Gemini AI.</p>
                </div>
            </div>

            <div className="ai-search-container">
                <form onSubmit={handleAIFilter} className="ai-search-form">
                    <div className="ai-input-wrapper">
                        <input
                            type="text"
                            placeholder="e.g., Movies directed by Christopher Nolan, or anime from 2023..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isLoading}
                            className="ai-search-input"
                        />
                    </div>
                    <button type="submit" disabled={isLoading || !prompt.trim()} className="ai-search-btn">
                        <Search size={18} className="search-icon-btn" />
                        {isLoading ? 'Filtering...' : 'Filter'}
                    </button>
                </form>
            </div>

            {!hasSearched && !isLoading && (
                <div className="ai-suggestions">
                    <p className="suggestions-title">Try asking...</p>
                    <div className="suggestions-grid">
                        <button className="suggestion-chip" onClick={() => setPrompt("Movies where Leonardo DiCaprio acts")}>
                            "Movies where Leonardo DiCaprio acts"
                        </button>
                        <button className="suggestion-chip" onClick={() => setPrompt("Series produced by HBO")}>
                            "Series produced by HBO"
                        </button>
                        <button className="suggestion-chip" onClick={() => setPrompt("Action movies from the 90s")}>
                            "Action movies from the 90s"
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="grid-container" style={{ marginTop: '0' }}>
                    <Skeleton type="card" count={8} />
                </div>
            ) : hasSearched ? (
                <div style={{ marginTop: '0' }}>
                    <div className="results-header">
                        <h2>Results</h2>
                        <span className="results-count">{filteredItems.length} items</span>
                    </div>

                    {filteredItems.length > 0 ? (
                        <div className="grid-container mt-4">
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
                        <div className="empty-state mt-4">
                            <div className="empty-state-icon">🤖</div>
                            <h3>No matches found</h3>
                            <p>Gemini couldn't find any items in your list matching that description.</p>
                        </div>
                    )}
                </div>
            ) : null}

            {editingItem && (
                <EditModal
                    item={editingItem}
                    onClose={() => setEditingItem(null)}
                    onSaved={handleEditComplete}
                />
            )}

            {viewingItem && (
                <DetailsModal
                    item={viewingItem}
                    onClose={() => setViewingItem(null)}
                    onEdit={(item) => {
                        setViewingItem(null);
                        setEditingItem(item);
                    }}
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

export default AIFilter;
