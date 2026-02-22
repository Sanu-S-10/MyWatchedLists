import { useContext, useMemo } from 'react';
import { WatchHistoryContext } from '../../context/WatchHistoryContext';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { Link } from 'react-router-dom';
import { Film, Tv, Clock, Star, List } from 'lucide-react';
import './Dashboard.css';

const COLORS = ['var(--accent-color)', 'var(--warning-color)', 'var(--success-color)', 'var(--danger-color)', '#8884d8'];

const formatTime = (totalMinutes) => {
    if (!totalMinutes) return { value: 0, unit: 'hrs', subValue: 0, subUnit: '' };

    if (totalMinutes < 60) {
        return { value: totalMinutes, unit: 'min', subValue: 0, subUnit: '' };
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return { value: days, unit: 'days', subValue: remainingHours, subUnit: 'hrs' };
    }

    return { value: hours, unit: 'hrs', subValue: minutes, subUnit: 'min' };
};

const formatTimeStr = (totalMinutes) => {
    if (!totalMinutes) return '0 hrs';
    if (totalMinutes < 60) return `${totalMinutes} min`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days} days ${remainingHours} hrs` : `${days} days`;
    }

    return minutes > 0 ? `${hours} hrs ${minutes} min` : `${hours} hrs`;
};

const Dashboard = () => {
    const { history, loading } = useContext(WatchHistoryContext);

    const stats = useMemo(() => {
        let totals = {
            watchTime: 0,
            movieTime: 0,
            seriesTime: 0,
            favoriteTime: 0,
            ratingSum: 0,
            ratingCount: 0,
            moviesCount: 0,
            seriesCount: 0,
        };

        const genreMap = {};
        const yearMap = {};

        history.forEach(item => {
            const time = item.watchTimeMinutes || 0;
            totals.watchTime += time;

            if (item.mediaType === 'movie') {
                totals.movieTime += time;
                totals.moviesCount += 1;
            } else {
                totals.seriesTime += time;
                totals.seriesCount += 1;
            }

            if (item.isFavorite) {
                totals.favoriteTime += time;
            }

            if (item.rating > 0) {
                totals.ratingSum += item.rating;
                totals.ratingCount += 1;
            }

            // Genres mapping for Bar Chart
            if (item.genres) {
                item.genres.forEach(g => {
                    genreMap[g.name] = (genreMap[g.name] || 0) + time;
                });
            }

            // Year mapping for Line Chart - grouped by release year
            const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'Unknown';
            yearMap[releaseYear] = (yearMap[releaseYear] || 0) + time;
        });

        // Formatting for charts
        const typeData = [
            { name: 'Movies', value: totals.movieTime },
            { name: 'Series', value: totals.seriesTime }
        ].filter(d => d.value > 0);

        const genreData = Object.entries(genreMap)
            .map(([name, time]) => ({ name, time, hoursFloat: parseFloat((time / 60).toFixed(1)) }))
            .sort((a, b) => b.time - a.time)
            .slice(0, 5); // top 5

        const yearData = Object.entries(yearMap)
            .map(([year, time]) => ({ year, time, hoursFloat: parseFloat((time / 60).toFixed(1)) }))
            .sort((a, b) => (a.year === 'Unknown' ? -1 : a.year.localeCompare(b.year)));

        return {
            totalTime: formatTime(totals.watchTime),
            movieTime: formatTime(totals.movieTime),
            seriesTime: formatTime(totals.seriesTime),
            favoriteHours: Math.floor(totals.favoriteTime / 60),
            avgRating: totals.ratingCount > 0 ? (totals.ratingSum / totals.ratingCount).toFixed(1) : 0,
            moviesCount: totals.moviesCount,
            seriesCount: totals.seriesCount,
            typeData,
            genreData,
            yearData
        };
    }, [history]);

    if (loading) {
        return <div className="dashboard-loading"><span className="loader"></span></div>;
    }

    return (
        <div className="dashboard-page fade-in">
            <div className="dashboard-header">
                <h1>Overview Dashboard</h1>
                <p>Your watching statistics at a glance.</p>

                <Link to="/all" className="view-all-btn">
                    <List size={18} /> View All Media
                </Link>
            </div>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon"><Clock size={28} /></div>
                    <div className="stat-info">
                        <h4>Total Watch Time</h4>
                        <h2>
                            {stats.totalTime.value} <span>{stats.totalTime.unit}</span>
                            {stats.totalTime.subValue > 0 && <span style={{ fontSize: '0.9rem', marginLeft: '4px' }}>{stats.totalTime.subValue} {stats.totalTime.subUnit}</span>}
                        </h2>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Film size={28} /></div>
                    <div className="stat-info">
                        <h4>Movie Time</h4>
                        <h2>
                            {stats.movieTime.value} <span>{stats.movieTime.unit}</span>
                            {stats.movieTime.subValue > 0 && <span style={{ fontSize: '0.9rem', marginLeft: '4px' }}>{stats.movieTime.subValue} {stats.movieTime.subUnit}</span>}
                        </h2>
                        <span>({stats.moviesCount} movies)</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Tv size={28} /></div>
                    <div className="stat-info">
                        <h4>Series Time</h4>
                        <h2>
                            {stats.seriesTime.value} <span>{stats.seriesTime.unit}</span>
                            {stats.seriesTime.subValue > 0 && <span style={{ fontSize: '0.9rem', marginLeft: '4px' }}>{stats.seriesTime.subValue} {stats.seriesTime.subUnit}</span>}
                        </h2>
                        <span>({stats.seriesCount} series)</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Star size={28} /></div>
                    <div className="stat-info">
                        <h4>Avg Rating</h4>
                        <h2>{stats.avgRating} <span>/ 5</span></h2>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Movie vs Series Time</h3>
                    <div className="chart-container">
                        {stats.typeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.typeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={true}
                                    >
                                        {stats.typeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatTimeStr(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No data yet</div>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Top Genres (Hours)</h3>
                    <div className="chart-container">
                        {stats.genreData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.genreData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                    <XAxis type="number" dataKey="hoursFloat" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(value, name, props) => [formatTimeStr(props.payload.time), 'Time']} />
                                    <Bar dataKey="hoursFloat" fill="var(--accent-color)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No data yet</div>
                        )}
                    </div>
                </div>

                <div className="chart-card full-width">
                    <h3>Watch Time by Release Year</h3>
                    <div className="chart-container">
                        {stats.yearData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.yearData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="year" stroke="var(--text-secondary)" />
                                    <YAxis stroke="var(--text-secondary)" />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} formatter={(value, name, props) => [formatTimeStr(props.payload.time), 'Time']} />
                                    <Line type="monotone" dataKey="hoursFloat" stroke="var(--success-color)" strokeWidth={3} dot={{ r: 5, fill: 'var(--success-color)' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No data yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
