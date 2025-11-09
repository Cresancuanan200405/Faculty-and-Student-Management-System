import React, { useEffect } from 'react';
import '../../sass/ConfirmModal.scss';

const ConfirmModal = ({ open, title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel && onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="cm-overlay" role="dialog" aria-modal="true" aria-labelledby="cm-title">
      <div className="cm-modal" role="document">
        <div className="cm-header">
          <h3 className="cm-title" id="cm-title">{title}</h3>
        </div>
        {message && <div className="cm-body">{message}</div>}
        <div className="cm-actions">
          <button type="button" className="cm-btn cm-btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button type="button" className="cm-btn cm-btn-danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
