import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import './Layout.css';

const Layout = ({ children }) => {
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
