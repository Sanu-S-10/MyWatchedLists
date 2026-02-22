import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

const StarRating = ({ rating, setRating, readOnly = false }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className={`star-rating ${readOnly ? 'readonly' : ''}`}>
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;

                return (
                    <button
                        type="button"
                        key={index}
                        className={ratingValue <= (hover || rating) ? 'star on' : 'star off'}
                        onClick={() => !readOnly && setRating(ratingValue)}
                        onMouseEnter={() => !readOnly && setHover(ratingValue)}
                        onMouseLeave={() => !readOnly && setHover(rating)}
                        disabled={readOnly}
                    >
                        <Star
                            size={24}
                            fill={ratingValue <= (hover || rating) ? 'var(--star-color)' : 'transparent'}
                            color={ratingValue <= (hover || rating) ? 'var(--star-color)' : 'var(--text-secondary)'}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
