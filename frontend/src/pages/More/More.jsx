import { Link } from 'react-router-dom';
import { Sparkles, Flame, ListOrdered } from 'lucide-react';
import './More.css';

const More = () => {
    return (
        <div className="more-page fade-in">
            <div className="page-header">
                <h1>More</h1>
                <p>Explore additional features.</p>
            </div>

            <div className="more-grid">
                <Link to="/aifilter" className="more-card">
                    <div className="more-icon"><Sparkles size={28} /></div>
                    <div className="more-card-body">
                        <h3>AI Filter</h3>
                        <p>Smart recommendations</p>
                    </div>
                </Link>

                <Link to="/trending" className="more-card">
                    <div className="more-icon"><Flame size={28} /></div>
                    <div className="more-card-body">
                        <h3>Trending</h3>
                        <p>Popular now</p>
                    </div>
                </Link>

                <Link to="/lists" className="more-card">
                    <div className="more-icon"><ListOrdered size={28} /></div>
                    <div className="more-card-body">
                        <h3>Lists</h3>
                        <p>Your custom lists</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default More;
