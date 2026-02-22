import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
    return (
        <div className={`input-wrapper ${className}`}>
            {label && <label className="input-label">{label}</label>}
            <input
                ref={ref}
                className={`input-field ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && <span className="error-message">{error}</span>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
