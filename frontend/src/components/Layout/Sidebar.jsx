import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Heart, Search, Settings, LogOut, Zap, Smile, Sparkles, ChevronRight, ChevronLeft, Flame, ListOrdered, MoreHorizontal, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const primaryItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/search', label: 'Search / Add', icon: Search },
    { path: '/movies', label: 'Movies', icon: Film },
    { path: '/series', label: 'Series', icon: Tv },
    { path: '/anime', label: 'Anime', icon: Zap },
    { path: '/animation', label: 'Animation', icon: Smile },
    { path: '/favorites', label: 'Favorites', icon: Heart },
    { path: '/aifilter', label: 'AI Filter', icon: Sparkles },
];

const moreItems = [
    { path: '/trending', label: 'Trending', icon: Flame },
    { path: '/lists', label: 'List', icon: ListOrdered },
];

const Sidebar = () => {
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const wrapperRef = useRef(null);

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const isMoreRoute = moreItems.some((item) => item.path === location.pathname);

    useEffect(() => {
        if (isCollapsed) {
            document.documentElement.classList.add('sidebar-collapsed');
        } else {
            document.documentElement.classList.remove('sidebar-collapsed');
        }
    }, [isCollapsed]);

    useEffect(() => {
        if (!isMoreRoute) {
            setIsMoreOpen(false);
        }
    }, [isMoreRoute, location.pathname]);

    useEffect(() => {
        if (!isMoreOpen || !isCollapsed) {
            return undefined;
        }

        const handleOutsideClick = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsMoreOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, [isMoreOpen, isCollapsed]);

    const handleToggleSidebar = () => {
        setIsCollapsed((prev) => !prev);
        if (!isCollapsed) {
            setIsMoreOpen(false);
        }
    };

    const renderBottomRailLink = () => {
        if (user) {
            return (
                <NavLink to="/settings" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} aria-label="Settings" data-tooltip="Settings">
                    <Settings size={20} />
                </NavLink>
            );
        }

        return (
            <NavLink to="/login" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} aria-label="Sign In" data-tooltip="Sign In">
                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
            </NavLink>
        );
    };

    return (
        <aside ref={wrapperRef} className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {isCollapsed ? (
                <div className="sidebar-rail">
                    <div className="sidebar-logo sidebar-logo-rail">
                        <div className="logo-icon">MWL</div>
                    </div>

                    <button className="sidebar-toggle-btn" onClick={handleToggleSidebar} type="button" aria-label="Expand sidebar" data-tooltip="Expand sidebar">
                        <PanelLeftOpen size={20} />
                    </button>

                    <nav className="sidebar-nav-rail">
                        <ul>
                            {primaryItems.map(({ path, icon: Icon, label }) => (
                                <li key={path}>
                                    <NavLink to={path} className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} aria-label={label} data-tooltip={label}>
                                        <Icon size={20} />
                                    </NavLink>
                                </li>
                            ))}
                            <li className="more-menu-rail">
                                <button
                                    className={`rail-link rail-more ${isMoreRoute && !isMoreOpen ? 'active' : ''}`}
                                    onClick={() => setIsMoreOpen((prev) => !prev)}
                                    type="button"
                                    aria-label="More"
                                    data-tooltip="More"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {isMoreOpen && (
                                    <ul className="submenu-list submenu-list-rail">
                                        {moreItems.map(({ path, icon: Icon, label }) => (
                                            <li key={path}>
                                                <NavLink
                                                    to={path}
                                                    className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}
                                                    onClick={() => setIsMoreOpen(false)}
                                                >
                                                    <Icon size={18} /> <span>{label}</span>
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        </ul>
                    </nav>

                    <div className="sidebar-bottom-rail">{renderBottomRailLink()}</div>
                </div>
            ) : (
                <div className="sidebar-full">
                    <div className="sidebar-header">
                        <div className="sidebar-logo">
                            <div className="logo-icon">MWL</div>
                            <h2>MyWatchedList</h2>
                        </div>
                        <button className="sidebar-collapse-btn" onClick={handleToggleSidebar} type="button" aria-label="Collapse sidebar">
                            <PanelLeftClose size={20} />
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        <ul>
                            {primaryItems.map(({ path, icon: Icon, label }) => (
                                <li key={path} className={location.pathname === path ? 'active' : ''}>
                                    <Link to={path}>
                                        <Icon size={20} /> <span>{label}</span>
                                    </Link>
                                </li>
                            ))}

                            <li className="more-menu">
                                <button className={`more-trigger ${isMoreRoute && !isMoreOpen ? 'active' : ''}`} onClick={() => setIsMoreOpen((prev) => !prev)} type="button">
                                    <MoreHorizontal size={20} />
                                    <span>More</span>
                                    <ChevronRight size={18} className={`more-chevron ${isMoreOpen ? 'open' : ''}`} />
                                </button>

                                {isMoreOpen && (
                                    <ul className="submenu-list">
                                        {moreItems.map(({ path, icon: Icon, label }) => (
                                            <li key={path}>
                                                <NavLink
                                                    to={path}
                                                    className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}
                                                    onClick={() => setIsMoreOpen(false)}
                                                >
                                                    <Icon size={18} /> <span>{label}</span>
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        </ul>
                    </nav>

                    <div className="sidebar-bottom">
                        {user ? (
                            <Link to="/settings" className={`bottom-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                                <Settings size={20} /> <span>Settings</span>
                            </Link>
                        ) : (
                            <Link to="/login" className={`bottom-link ${location.pathname === '/login' ? 'active' : ''}`}>
                                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} /> <span>Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
