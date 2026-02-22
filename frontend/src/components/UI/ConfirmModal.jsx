import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';
import '../../pages/Search/AddModal.css';

const ConfirmModal = ({ title, message, onConfirm, onCancel, isLoading }) => {
    const modalContent = (
        <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 10000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '24px' }}>
                <button className="modal-close" onClick={onCancel} disabled={isLoading}>
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }}>
                        <AlertTriangle size={32} />
                    </div>

                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{message}</p>

                    <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
                        <Button variant="ghost" onClick={onCancel} disabled={isLoading} style={{ flex: 1 }}>Cancel</Button>
                        <Button variant="primary" onClick={onConfirm} isLoading={isLoading} style={{ flex: 1, backgroundColor: 'var(--danger-color)' }}>Remove</Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ConfirmModal;
