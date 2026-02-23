import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';
import '../../pages/Search/AddModal.css';

const ClearHistoryModal = ({ onConfirm, onCancel, isLoading }) => {
    const [clearMovies, setClearMovies] = useState(true);
    const [clearSeries, setClearSeries] = useState(true);

    const handleConfirm = () => {
        if (!clearMovies && !clearSeries) {
            return; // No selection
        }
        onConfirm({ clearMovies, clearSeries });
    };

    const modalContent = (
        <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 10000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', padding: '24px' }}>
                <button className="modal-close" onClick={onCancel} disabled={isLoading}>
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Clear Watch History</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Select what you want to remove from your watch history.
                        </p>
                    </div>

                    {/* Checkboxes */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '8px'
                    }}>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem'
                        }}>
                            <input
                                type="checkbox"
                                checked={clearMovies}
                                onChange={(e) => setClearMovies(e.target.checked)}
                                disabled={isLoading}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: 'var(--accent-color)'
                                }}
                            />
                            <span>🎬 Clear Movies</span>
                        </label>

                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem'
                        }}>
                            <input
                                type="checkbox"
                                checked={clearSeries}
                                onChange={(e) => setClearSeries(e.target.checked)}
                                disabled={isLoading}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: 'var(--accent-color)'
                                }}
                            />
                            <span>📺 Clear Series</span>
                        </label>
                    </div>

                    {/* Warning */}
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                    }}>
                        This action cannot be undone. Selected items will be permanently removed.
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                        <Button variant="ghost" onClick={onCancel} disabled={isLoading} style={{ flex: 1 }}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleConfirm} 
                            isLoading={isLoading} 
                            style={{ flex: 1, backgroundColor: 'var(--danger-color)' }}
                            disabled={!clearMovies && !clearSeries}
                        >
                            Delete Selected
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ClearHistoryModal;
