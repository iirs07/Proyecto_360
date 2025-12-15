import React from "react";
import "../css/ConfirmModal.css";

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className="confirm-modal" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
        
        {/* Header con botón de cerrar */}
        <div className="confirm-modal-header">
          <button 
            className="close-button" 
            onClick={onCancel}
            aria-label="Cerrar modal"
          >
            ×
          </button>
          
          <div className="confirm-modal-icon" aria-hidden="true"></div>
          <h3 id="modal-title" className="confirm-modal-title">{title}</h3>
        </div>
        
        <p id="modal-description" className="confirm-modal-message">{message}</p>
        
        <div className="confirm-modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;