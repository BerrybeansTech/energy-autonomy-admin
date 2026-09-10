import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  itemPreview = null,
  isLoading = false,
}) => {
  // Prevent background scroll when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Visual styling based on type
  const typeStyles = {
    danger: {
      iconBg: 'bg-gradient-to-tr from-rose-100 to-rose-50 border-rose-200/80 text-rose-600 shadow-rose-200/50',
      confirmBtn: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/25',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    warning: {
      iconBg: 'bg-gradient-to-tr from-amber-100 to-amber-50 border-amber-200/80 text-amber-600 shadow-amber-200/50',
      confirmBtn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/25',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      iconBg: 'bg-gradient-to-tr from-purple-100 to-purple-50 border-purple-200/80 text-[#8F3EC9] shadow-purple-200/50',
      confirmBtn: 'bg-gradient-to-r from-[#8F3EC9] to-[#A06BC6] hover:from-[#7B2EB3] hover:to-[#8F3EC9] text-white shadow-purple-500/25',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      iconBg: 'bg-gradient-to-tr from-emerald-100 to-emerald-50 border-emerald-200/80 text-emerald-600 shadow-emerald-200/50',
      confirmBtn: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/25',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  };

  const currentStyle = typeStyles[type] || typeStyles.danger;

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in"
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full border border-slate-100 animate-scale-in relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-sm cursor-pointer disabled:opacity-50"
          title="Close dialog"
        >
          ✕
        </button>

        {/* Themed Icon Badge */}
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto shadow-sm mb-3.5 ${currentStyle.iconBg}`}>
          {currentStyle.icon}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed max-w-sm mx-auto">
          {message}
        </p>

        {/* Optional Item Preview (e.g. thumbnail, title, category) */}
        {itemPreview && (
          <div className="my-4 p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl text-left">
            {itemPreview}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-center disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-75 ${currentStyle.confirmBtn}`}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
