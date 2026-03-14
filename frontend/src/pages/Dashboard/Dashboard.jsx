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
const HEATMAP_WEEKS = 52;
const HEATMAP_DAYS = HEATMAP_WEEKS * 7;

const toDayKey = (date) => {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const mondayIndex = (day) => (day + 6) % 7;

const formatTime = (totalMinutes) => {
    if (!totalMinutes) return { value: 0, unit: 'hrs', subValue: 0, subUnit: '', thirdValue: 0, thirdUnit: '' };

    if (totalMinutes < 60) {
        return { value: totalMinutes, unit: 'min', subValue: 0, subUnit: '', thirdValue: 0, thirdUnit: '' };
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return { value: days, unit: 'days', subValue: remainingHours, subUnit: 'hrs', thirdValue: minutes, thirdUnit: 'min' };
    }

    return { value: hours, unit: 'hrs', subValue: minutes, subUnit: 'min', thirdValue: 0, thirdUnit: '' };
};

const formatTimeStr = (totalMinutes) => {
    if (!totalMinutes) return '0 hrs';
    if (totalMinutes < 60) return `${totalMinutes} min`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        let str = `${days} days`;
        if (remainingHours > 0) str += ` ${remainingHours} hrs`;
        if (minutes > 0) str += ` ${minutes} min`;
        return str;
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

    const watchHeatmap = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Show activity for approximately 6 months and align columns to Monday.
        const firstDate = new Date(today);
        firstDate.setDate(today.getDate() - (HEATMAP_DAYS - 1));
        const firstDateDayIndex = mondayIndex(firstDate.getDay());
        firstDate.setDate(firstDate.getDate() - firstDateDayIndex);

        const dailyMap = {};

        history.forEach((item) => {
            const rawDate = item.watchDate || item.lastWatchedDate || item.createdAt;
            if (!rawDate) return;

            const date = new Date(rawDate);
            if (Number.isNaN(date.getTime())) return;

            date.setHours(0, 0, 0, 0);
            if (date < firstDate || date > today) return;

            const key = toDayKey(date);
            const itemMinutes = Math.max(0, item.watchTimeMinutes || 0);

            if (!dailyMap[key]) {
                dailyMap[key] = { minutes: 0, score: 0, count: 0 };
            }

            dailyMap[key].minutes += itemMinutes;
            dailyMap[key].score += itemMinutes > 0 ? itemMinutes : 1;
            dailyMap[key].count += 1;
        });

        const scoreValues = Object.values(dailyMap)
            .map((v) => v.score)
            .filter((v) => v > 0)
            .sort((a, b) => a - b);

        const q1 = scoreValues[Math.floor((scoreValues.length - 1) * 0.25)] || 0;
        const q2 = scoreValues[Math.floor((scoreValues.length - 1) * 0.5)] || 0;
        const q3 = scoreValues[Math.floor((scoreValues.length - 1) * 0.75)] || 0;

        const getLevel = (score) => {
            if (!score || score <= 0) return 0;
            if (score <= q1) return 1;
            if (score <= q2) return 2;
            if (score <= q3) return 3;
            return 4;
        };

        const totalDays = Math.floor((today - firstDate) / (1000 * 60 * 60 * 24)) + 1;
        const totalWeeks = Math.ceil(totalDays / 7);
        const weeks = [];
        const monthLabels = [];
        let lastMonthIndex = -1;

        for (let week = 0; week < totalWeeks; week += 1) {
            const weekDays = [];

            for (let row = 0; row < 7; row += 1) {
                const dayOffset = (week * 7) + row;
                const date = new Date(firstDate);
                date.setDate(firstDate.getDate() + dayOffset);

                if (date > today) {
                    weekDays.push(null);
                    continue;
                }

                const key = toDayKey(date);
                const value = dailyMap[key] || { minutes: 0, score: 0, count: 0 };

                weekDays.push({
                    key,
                    date,
                    count: value.count,
                    minutes: value.minutes,
                    level: getLevel(value.score)
                });
            }

            const weekStart = weekDays.find((d) => d)?.date;
            if (weekStart) {
                const month = weekStart.getMonth();
                if (month !== lastMonthIndex) {
                    monthLabels.push({
                        column: week,
                        label: weekStart.toLocaleString(undefined, { month: 'short' })
                    });
                    lastMonthIndex = month;
                }
            }

            weeks.push(weekDays);
        }

        return {
            weeks,
            monthLabels,
            activeDays: Object.values(dailyMap).filter((v) => v.count > 0).length
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
                        <div className="time-display">
                            <span className="primary-time">{stats.totalTime.value}<small>{stats.totalTime.unit}</small></span>
                            {(stats.totalTime.subValue > 0 || stats.totalTime.thirdValue > 0) && (
                                <span className="secondary-time">
                                    {stats.totalTime.subValue > 0 && `${stats.totalTime.subValue}${stats.totalTime.subUnit} `}
                                    {stats.totalTime.thirdValue > 0 && `${stats.totalTime.thirdValue}${stats.totalTime.thirdUnit}`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Film size={28} /></div>
                    <div className="stat-info">
                        <h4>Movie Time</h4>
                        <div className="time-display">
                            <span className="primary-time">{stats.movieTime.value}<small>{stats.movieTime.unit}</small></span>
                            {(stats.movieTime.subValue > 0 || stats.movieTime.thirdValue > 0) && (
                                <span className="secondary-time">
                                    {stats.movieTime.subValue > 0 && `${stats.movieTime.subValue}${stats.movieTime.subUnit} `}
                                    {stats.movieTime.thirdValue > 0 && `${stats.movieTime.thirdValue}${stats.movieTime.thirdUnit}`}
                                </span>
                            )}
                        </div>
                        <span>({stats.moviesCount} movies)</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Tv size={28} /></div>
                    <div className="stat-info">
                        <h4>Series Time</h4>
                        <div className="time-display">
                            <span className="primary-time">{stats.seriesTime.value}<small>{stats.seriesTime.unit}</small></span>
                            {(stats.seriesTime.subValue > 0 || stats.seriesTime.thirdValue > 0) && (
                                <span className="secondary-time">
                                    {stats.seriesTime.subValue > 0 && `${stats.seriesTime.subValue}${stats.seriesTime.subUnit} `}
                                    {stats.seriesTime.thirdValue > 0 && `${stats.seriesTime.thirdValue}${stats.seriesTime.thirdUnit}`}
                                </span>
                            )}
                        </div>
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
                                <BarChart data={stats.genreData} layout="vertical" margin={{ left: 40, right: 20 }} barCategoryGap="20%">
                                    <XAxis type="number" dataKey="hoursFloat" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(value, name, props) => [formatTimeStr(props.payload.time), 'Time']} />
                                    <Bar
                                        dataKey="hoursFloat"
                                        fill="var(--accent-color)"
                                        background={{ fill: 'var(--bg-tertiary)', radius: 999 }}
                                        radius={[999, 999, 999, 999]}
                                        maxBarSize={24}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No data yet</div>
                        )}
                    </div>
                </div>

                <div className="chart-card full-width">
                    <div className="heatmap-header">
                        <h3>Watching Time Heatmap</h3>
                        <span>{watchHeatmap.activeDays} active days in the last 12 months</span>
                    </div>

                    <div className="watch-heatmap-wrapper">
                        <div className="heatmap-months" style={{ gridTemplateColumns: `repeat(${watchHeatmap.weeks.length}, 12px)` }}>
                            {watchHeatmap.weeks.map((_, index) => {
                                const month = watchHeatmap.monthLabels.find((m) => m.column === index);
                                return (
                                    <span key={`month-${index}`} className="heatmap-month-label">
                                        {month ? month.label : ''}
                                    </span>
                                );
                            })}
                        </div>

                        <div className="heatmap-body">
                            <div className="heatmap-day-labels">
                                <span>Mon</span>
                                <span></span>
                                <span>Wed</span>
                                <span></span>
                                <span>Fri</span>
                                <span></span>
                                <span></span>
                            </div>

                            <div className="heatmap-columns">
                                {watchHeatmap.weeks.map((week, weekIndex) => (
                                    <div key={`week-${weekIndex}`} className="heatmap-week">
                                        {week.map((day, dayIndex) => {
                                            if (!day) {
                                                return <span key={`empty-${weekIndex}-${dayIndex}`} className="heatmap-cell heatmap-cell-empty" />;
                                            }

                                            const dateLabel = day.date.toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            });

                                            let title = `${dateLabel}: No watching activity`;
                                            if (day.count > 0 && day.minutes > 0) {
                                                title = `${dateLabel}: ${day.count} item${day.count > 1 ? 's' : ''}, ${formatTimeStr(day.minutes)}`;
                                            } else if (day.count > 0) {
                                                title = `${dateLabel}: ${day.count} item${day.count > 1 ? 's' : ''} watched`;
                                            }

                                            return (
                                                <span
                                                    key={day.key}
                                                    className={`heatmap-cell level-${day.level}`}
                                                    title={title}
                                                    aria-label={title}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="heatmap-legend">
                            <span>Less</span>
                            <span className="heatmap-cell level-0" />
                            <span className="heatmap-cell level-1" />
                            <span className="heatmap-cell level-2" />
                            <span className="heatmap-cell level-3" />
                            <span className="heatmap-cell level-4" />
                            <span>More</span>
                        </div>
                    </div>
                </div>

                <div className="chart-card full-width">
                    <h3>Watch Time by Release Year</h3>
                    <div className="chart-container">
                        {stats.yearData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.yearData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <XAxis
                                        dataKey="year"
                                        stroke="var(--text-secondary)"
                                        angle={-45}
                                        textAnchor="end"
                                        height={50}
                                        tick={{ fontSize: 12 }}
                                        minTickGap={20}
                                    />
                                    <YAxis stroke="var(--text-secondary)" width={40} tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} formatter={(value, name, props) => [formatTimeStr(props.payload.time), 'Time']} />
                                    <Line type="monotone" dataKey="hoursFloat" stroke="var(--success-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--success-color)' }} activeDot={{ r: 6 }} />
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
