import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '../../components/UI/SearchBar';
import AddModal from './AddModal';
import './SearchPage.css';

const SearchPage = () => {
    const [selectedItem, setSelectedItem] = useState(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.reopenItem) {
            setSelectedItem(location.state.reopenItem);
            // Clear state to avoid reopening on refresh
            window.history.replaceState({ ...location.state, reopenItem: null }, '');
        }
    }, [location.state]);

    const handleSelectResult = (item) => {
        setSelectedItem(item);
    };

    const handleCloseModal = () => {
        setSelectedItem(null);
    };

    return (
        <div className="search-page fade-in">
            <div className="page-header">
                <h1>Find & Add Content</h1>
                <p>Search for movies, series, or anime to add to your watched list.</p>
            </div>

            <div className="search-area">
                <SearchBar onResultClick={handleSelectResult} placeholder="Search for titles..." />
            </div>

            <div className="search-illustrations">
                <div className="empty-state">
                    <div className="empty-state-icon">🍿</div>
                    <h3>What will you watch next?</h3>
                    <p>Use the search bar above to find your favorite media and track your progress.</p>
                </div>
            </div>

            {selectedItem && (
                <AddModal item={selectedItem} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default SearchPage;
