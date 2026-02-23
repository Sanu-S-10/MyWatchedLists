import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WatchHistoryProvider } from './context/WatchHistoryContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout/Layout';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import SearchPage from './pages/Search/SearchPage';
import Dashboard from './pages/Dashboard/Dashboard';
import ContentList from './pages/ContentList/ContentList';
import Watch from './pages/Watch/Watch';

import Settings from './pages/Settings/Settings';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/watch" element={<Watch />} />
            <Route path="/all" element={<ContentList type="all" title="All Watched Media" />} />
            <Route path="/movies" element={<ContentList type="movies" title="My Movies" />} />
            <Route path="/series" element={<ContentList type="series" title="My Series" />} />
            <Route path="/anime" element={<ContentList type="anime" title="My Anime" />} />
            <Route path="/animation" element={<ContentList type="animation" title="My Animation" />} />
            <Route path="/documentary" element={<ContentList type="documentary" title="My Documentary" />} />
            <Route path="/favorites" element={<ContentList type="favorites" title="My Favorites" />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ToastProvider>
                    <WatchHistoryProvider>
                        <Router>
                            <Layout>
                                <AppRoutes />
                            </Layout>
                        </Router>
                    </WatchHistoryProvider>
                </ToastProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
