import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, Suspense, lazy } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WatchHistoryProvider } from './context/WatchHistoryContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout/Layout';

const HomePage = lazy(() => import('./pages/Home/HomePage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const SearchPage = lazy(() => import('./pages/Search/SearchPage'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const ContentList = lazy(() => import('./pages/ContentList/ContentList'));
const Watch = lazy(() => import('./pages/Watch/Watch'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const AIFilter = lazy(() => import('./pages/AIFilter/AIFilter'));

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
        <Suspense fallback={<div>Loading...</div>}>
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
                <Route path="/aifilter" element={<ProtectedRoute><AIFilter /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
        </Suspense>
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
