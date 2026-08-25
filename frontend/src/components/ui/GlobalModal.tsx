import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalModalStore } from '../../store/globalModalStore';
import { FiAlertCircle, FiHelpCircle } from 'react-icons/fi';
import './GlobalModal.css';

const GlobalModal: React.FC = () => {
  const { modalConfig } = useGlobalModalStore();

  if (!modalConfig) return null;

  const isAlert = modalConfig.type === 'alert';

  return (
    <AnimatePresence>
      <div className="global-modal-overlay" onClick={modalConfig.onCancel}>
        <motion.div 
          className="global-modal-content glass-strong"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="global-modal-header">
            {isAlert ? (
              <div className="global-modal-icon alert-icon">
                <FiAlertCircle size={24} />
              </div>
            ) : (
              <div className="global-modal-icon confirm-icon">
                <FiHelpCircle size={24} />
              </div>
            )}
            <h2 className="global-modal-title">{modalConfig.title}</h2>
          </div>
          
          <div className="global-modal-body">
            <p>{modalConfig.message}</p>
          </div>
          
          <div className="global-modal-actions">
            {!isAlert && (
              <button className="btn btn-secondary" onClick={modalConfig.onCancel}>
                {modalConfig.cancelText}
              </button>
            )}
            <button className={`btn ${isAlert ? 'btn-primary' : 'btn-primary'}`} onClick={modalConfig.onConfirm}>
              {modalConfig.confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GlobalModal;
