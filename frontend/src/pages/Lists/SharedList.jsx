import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Lists.css';

const SharedList = () => {
    const { shareId } = useParams();
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSharedList = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/api/custom-lists/shared/${shareId}`);
                setList(data);
                setError('');
            } catch (err) {
                setError('This shared list is not available.');
            } finally {
                setLoading(false);
            }
        };

        fetchSharedList();
    }, [shareId]);

    return (
        <div className="lists-page fade-in">
            {loading && <div className="lists-loading"><span className="loader"></span></div>}
            {!loading && error && <div className="lists-error">{error}</div>}
            {!loading && !error && list && (
                <>
                    <div className="page-header">
                        <h1>{list.name}</h1>
                        <p>{list.description || 'Shared recommendation list'}</p>
                    </div>

                    <section className="lists-card">
                        <h2>Recommended Titles ({list.itemCount})</h2>
                        {list.items.length === 0 ? (
                            <p className="empty-msg">No items in this list.</p>
                        ) : (
                            <div className="shared-items-grid">
                                {list.items.map((item, index) => (
                                    <article key={`${item.tmdbId}-${index}`} className="shared-item">
                                        <img
                                            src={item.posterPath ? `https://image.tmdb.org/t/p/w200${item.posterPath}` : 'https://via.placeholder.com/200x300?text=No+Poster'}
                                            alt={item.title}
                                        />
                                        <div>
                                            <h3>{item.title}</h3>
                                            <p>
                                                {item.mediaType === 'movie' ? 'Movie' : 'Series'}
                                                {item.releaseDate ? ` • ${item.releaseDate.slice(0, 4)}` : ''}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default SharedList;
