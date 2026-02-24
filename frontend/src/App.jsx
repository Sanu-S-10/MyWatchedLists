import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WatchHistoryProvider } from './context/WatchHistoryContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout/Layout';

import HomePage from './pages/Home/HomePage';
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
    if (!user) return <Navigate to="/" />;
    return children;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    if (user) return <Navigate to="/dashboard" />;
    return children;
};

const AppRoutes = () => {
    const { user } = useContext(AuthContext);

    return (
        <Routes>
            {/* Public routes - only for unauthenticated users */}
            <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Protected routes - only for authenticated users */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/watch" element={<ProtectedRoute><Watch /></ProtectedRoute>} />
            <Route path="/all" element={<ProtectedRoute><ContentList type="all" title="All Watched Media" /></ProtectedRoute>} />
            <Route path="/movies" element={<ProtectedRoute><ContentList type="movies" title="My Movies" /></ProtectedRoute>} />
            <Route path="/series" element={<ProtectedRoute><ContentList type="series" title="My Series" /></ProtectedRoute>} />
            <Route path="/anime" element={<ProtectedRoute><ContentList type="anime" title="My Anime" /></ProtectedRoute>} />
            <Route path="/animation" element={<ProtectedRoute><ContentList type="animation" title="My Animation" /></ProtectedRoute>} />
            <Route path="/documentary" element={<ProtectedRoute><ContentList type="documentary" title="My Documentary" /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><ContentList type="favorites" title="My Favorites" /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
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
