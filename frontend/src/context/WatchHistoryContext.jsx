import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const WatchHistoryContext = createContext();

export const WatchHistoryProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState(() => {
        // Load initial data from cache if present
        const cached = localStorage.getItem('watchHistory');
        return cached ? JSON.parse(cached) : [];
    });
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (user) {
            fetchHistory();
        } else {
            setHistory([]);
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            // Show full-page loader ONLY if we have no cached data
            if (history.length === 0) {
                setLoading(true);
            }
            setIsRefreshing(true);

            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('/api/watch-history', config);
            
            setHistory(data);
            // Update local cache
            localStorage.setItem('watchHistory', JSON.stringify(data));
            
            setLoading(false);
            setIsRefreshing(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const addItem = async (itemData) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.post('/api/watch-history', itemData, config);
            const newHistory = [data, ...history];
            setHistory(newHistory);
            localStorage.setItem('watchHistory', JSON.stringify(newHistory));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Error adding item' };
        }
    };

    const updateItem = async (id, updateData) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put(`/api/watch-history/${id}`, updateData, config);
            const newHistory = history.map((item) => (item._id === id ? data : item));
            setHistory(newHistory);
            localStorage.setItem('watchHistory', JSON.stringify(newHistory));
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error updating' };
        }
    };

    const removeItem = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/watch-history/${id}`, config);
            const newHistory = history.filter((item) => item._id !== id);
            setHistory(newHistory);
            localStorage.setItem('watchHistory', JSON.stringify(newHistory));
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error removing' };
        }
    };

    const clearHistory = async (mediaTypes = []) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            let url = '/api/watch-history';
            
            if (mediaTypes && mediaTypes.length > 0) {
                url += `?mediaType=${mediaTypes.join(',')}`;
            }
            
            const { data } = await axios.delete(url, config);
            
            let newHistory = [];
            if (mediaTypes && mediaTypes.length > 0 && mediaTypes.length < 2) {
                newHistory = history.filter(item => !mediaTypes.includes(item.mediaType));
            }
            
            setHistory(newHistory);
            localStorage.setItem('watchHistory', JSON.stringify(newHistory));
            
            return { success: true, deletedCount: data?.deletedCount || 0 };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Error clearing history' };
        }
    };

    return (
        <WatchHistoryContext.Provider value={{ history, loading, isRefreshing, addItem, updateItem, removeItem, clearHistory, fetchHistory }}>
            {children}
        </WatchHistoryContext.Provider>
    );
};
