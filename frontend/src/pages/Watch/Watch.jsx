import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Film, Tv, Sparkles, Clapperboard, Layers, BookOpen } from 'lucide-react';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import './Watch.css';

const Watch = () => {
    const { history } = useContext(WatchHistoryContext);

    const counts = useMemo(() => {
        const total = history.length;
        const movies = history.filter(item => item.mediaType === 'movie').length;
        const series = history.filter(item => item.mediaType === 'series').length;
        const anime = history.filter(item => item.subType === 'anime').length;
        const animation = history.filter(item => item.subType === 'animation').length;
        const documentary = history.filter(item => item.subType === 'documentary').length;
        return { total, movies, series, anime, animation, documentary };
    }, [history]);

    return (
        <div className="watch-page fade-in">
            <div className="page-header">
                <h1>Watch</h1>
                <p>Choose a section to view your watched media.</p>
            </div>

            <div className="watch-grid">
                <Link to="/all" className="watch-card">
                    <div className="watch-icon"><Layers size={28} /></div>
                    <div className="watch-card-body">
                        <h3>All Watched</h3>
                        <p>{counts.total} titles</p>
                    </div>
                </Link>

                <Link to="/movies" className="watch-card">
                    <div className="watch-icon"><Film size={28} /></div>
                    <div className="watch-card-body">
                        <h3>My Movies</h3>
                        <p>{counts.movies} titles</p>
                    </div>
                </Link>

                <Link to="/series" className="watch-card">
                    <div className="watch-icon"><Tv size={28} /></div>
                    <div className="watch-card-body">
                        <h3>My Series</h3>
                        <p>{counts.series} titles</p>
                    </div>
                </Link>

                <Link to="/anime" className="watch-card">
                    <div className="watch-icon"><Sparkles size={28} /></div>
                    <div className="watch-card-body">
                        <h3>My Anime</h3>
                        <p>{counts.anime} titles</p>
                    </div>
                </Link>

                <Link to="/animation" className="watch-card">
                    <div className="watch-icon"><Clapperboard size={28} /></div>
                    <div className="watch-card-body">
                        <h3>My Animation</h3>
                        <p>{counts.animation} titles</p>
                    </div>
                </Link>

                <Link to="/documentary" className="watch-card">
                    <div className="watch-icon"><BookOpen size={28} /></div>
                    <div className="watch-card-body">
                        <h3>My Documentary</h3>
                        <p>{counts.documentary} titles</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Watch;
