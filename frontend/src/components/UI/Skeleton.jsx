import './Skeleton.css';

const Skeleton = ({ type = 'text', count = 1, className = '' }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className={`skeleton skeleton-card ${className}`}>
                        <div className="skeleton-image"></div>
                        <div className="skeleton-text title"></div>
                        <div className="skeleton-text meta"></div>
                    </div>
                );
            case 'circular':
                return <div className={`skeleton skeleton-circular ${className}`}></div>;
            case 'text':
            default:
                return <div className={`skeleton skeleton-text ${className}`}></div>;
        }
    };

    if (count === 1) return renderSkeleton();

    return (
        <>
            {[...Array(count)].map((_, i) => (
                <div key={i}>{renderSkeleton()}</div>
            ))}
        </>
    );
};

export default Skeleton;
