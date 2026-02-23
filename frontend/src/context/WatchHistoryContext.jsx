import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const WatchHistoryContext = createContext();

export const WatchHistoryProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchHistory();
        } else {
            setHistory([]);
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('/api/watch-history', config);
            setHistory(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const addItem = async (itemData) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.post('/api/watch-history', itemData, config);
            setHistory([data, ...history]);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Error adding item' };
        }
    };

    const updateItem = async (id, updateData) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put(`/api/watch-history/${id}`, updateData, config);
            setHistory(history.map((item) => (item._id === id ? data : item)));
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error updating' };
        }
    };

    const removeItem = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/watch-history/${id}`, config);
            setHistory(history.filter((item) => item._id !== id));
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error removing' };
        }
    };

    const clearHistory = async (mediaTypes = []) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            let url = '/api/watch-history';
            
            // If specific media types are provided, add as query parameter
            if (mediaTypes && mediaTypes.length > 0) {
                url += `?mediaType=${mediaTypes.join(',')}`;
            }
            
            const { data } = await axios.delete(url, config);
            
            // Update local state based on what was deleted
            if (mediaTypes && mediaTypes.length > 0 && mediaTypes.length < 2) {
                // Only specific types were cleared
                setHistory(history.filter(item => !mediaTypes.includes(item.mediaType)));
            } else {
                // All history cleared
                setHistory([]);
            }
            
            return { success: true, deletedCount: data?.deletedCount || 0 };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Error clearing history' };
        }
    };

    return (
        <WatchHistoryContext.Provider value={{ history, loading, addItem, updateItem, removeItem, clearHistory, fetchHistory }}>
            {children}
        </WatchHistoryContext.Provider>
    );
};
