import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Heart, Search, Settings, LogOut, Disc, Smile } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">MWL</div>
                <h2>MyWatchedList</h2>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li className={isActive('/') ? 'active' : ''}>
                        <Link to="/"><Home size={20} /> <span>Dashboard</span></Link>
                    </li>
                    <li className={isActive('/search') ? 'active' : ''}>
                        <Link to="/search"><Search size={20} /> <span>Search / Add</span></Link>
                    </li>
                    <li className={isActive('/movies') ? 'active' : ''}>
                        <Link to="/movies"><Film size={20} /> <span>Movies</span></Link>
                    </li>
                    <li className={isActive('/series') ? 'active' : ''}>
                        <Link to="/series"><Tv size={20} /> <span>Series</span></Link>
                    </li>
                    <li className={isActive('/anime') ? 'active' : ''}>
                        <Link to="/anime"><Disc size={20} /> <span>Anime</span></Link>
                    </li>
                    <li className={isActive('/animation') ? 'active' : ''}>
                        <Link to="/animation"><Smile size={20} /> <span>Animation</span></Link>
                    </li>
                    <li className={isActive('/favorites') ? 'active' : ''}>
                        <Link to="/favorites"><Heart size={20} /> <span>Favorites</span></Link>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-bottom">
                {user ? (
                    <>
                        <Link to="/settings" className={`bottom-link ${isActive('/settings') ? 'active' : ''}`}>
                            <Settings size={20} /> <span>Settings</span>
                        </Link>
                        <button onClick={logout} className="bottom-link logout-btn">
                            <LogOut size={20} /> <span>Logout</span>
                        </button>
                    </>
                ) : (
                    <Link to="/login" className={`bottom-link ${isActive('/login') ? 'active' : ''}`}>
                        <LogOut size={20} style={{ transform: 'rotate(180deg)' }} /> <span>Sign In</span>
                    </Link>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
