import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import './MediaCard.css';

const MediaCard = ({ item, onClick }) => {
    const posterUrl = item.posterPath
        ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
        : 'https://via.placeholder.com/500x750?text=No+Poster';

    return (
        <div className="media-card" onClick={() => onClick && onClick(item)}>
            <div className="media-poster">
                <img src={posterUrl} alt={item.title || item.name} loading="lazy" />

                <div className="media-overlay">
                    <div className="media-actions">
                        {item.isFavorite && <Heart className="favorite-icon" size={24} fill="var(--danger-color)" color="var(--danger-color)" />}
                    </div>
                </div>
            </div>

            <div className="media-info">
                <h3 className="media-title">{item.title || item.name}</h3>
                <div className="media-meta">
                    <span className="media-year">
                        {item.releaseDate ? item.releaseDate.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A'}
                    </span>
                    <span className="media-type">
                        {item.subType === 'anime' ? 'Anime ' : item.subType === 'animation' ? 'Animated ' : ''}
                        {item.mediaType === 'movie' ? 'Movie' : 'Series'}
                    </span>
                </div>

                {item.rating > 0 && (
                    <div className="media-rating">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={14}
                                fill={i < item.rating ? 'var(--star-color)' : 'transparent'}
                                color={i < item.rating ? 'var(--star-color)' : 'var(--text-secondary)'}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaCard;
