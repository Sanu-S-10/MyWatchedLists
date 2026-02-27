import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await axios.post('/api/users/login', { email, password });
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
    };

    const register = async (username, email, password) => {
        const { data } = await axios.post('/api/users', { username, email, password });
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    const updateProfile = async (updates) => {
        if (!user || !user.token) {
            throw new Error('User not authenticated');
        }
        const config = {
            headers: {
                Authorization: `Bearer ${user.token}`,
            },
        };
        try {
            const { data } = await axios.put('/api/users/profile', updates, config);
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;
        } catch (error) {
            console.error('Error updating profile:', error.response?.data || error.message);
            throw error;
        }
    };

    const updatePreferences = async (theme) => {
        return updateProfile({ theme });
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updatePreferences, updateProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
