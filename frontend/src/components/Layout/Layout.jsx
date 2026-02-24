import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import './Layout.css';

const Layout = ({ children }) => {
    const { user } = useContext(AuthContext);

    // Only show sidebar and bottom nav for authenticated users
    if (!user) {
        return <div className="layout-container">{children}</div>;
    }

    return (
        <div className="layout-container">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
