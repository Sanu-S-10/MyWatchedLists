import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Film, Heart, Settings, LogIn } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const isActive = (path) => {
        if (path === '/watch') {
            return (
                location.pathname === '/watch' ||
                location.pathname === '/all' ||
                location.pathname === '/movies' ||
                location.pathname === '/series' ||
                location.pathname === '/anime' ||
                location.pathname === '/animation'
            );
        }
        return location.pathname === path;
    };

    return (
        <nav className="bottom-nav">
            <ul>
                <li className={isActive('/') ? 'active' : ''}>
                    <Link to="/">
                        <Home size={24} />
                        <span>Home</span>
                    </Link>
                </li>
                <li className={isActive('/search') ? 'active' : ''}>
                    <Link to="/search">
                        <Search size={24} />
                        <span>Add</span>
                    </Link>
                </li>
                <li className={isActive('/watch') ? 'active' : ''}>
                    <Link to="/watch">
                        <Film size={24} />
                        <span>Watch</span>
                    </Link>
                </li>
                <li className={isActive('/favorites') ? 'active' : ''}>
                    <Link to="/favorites">
                        <Heart size={24} />
                        <span>Favs</span>
                    </Link>
                </li>
                {user ? (
                    <li className={isActive('/settings') ? 'active' : ''}>
                        <Link to="/settings">
                            <Settings size={24} />
                            <span>Menu</span>
                        </Link>
                    </li>
                ) : (
                    <li className={isActive('/login') ? 'active' : ''}>
                        <Link to="/login">
                            <LogIn size={24} />
                            <span>Login</span>
                        </Link>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default BottomNav;
