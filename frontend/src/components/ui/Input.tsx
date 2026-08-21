// ═══════════════════════════════════════════════════════════
// GINGER — Input Component
// Sleek dark-theme input with floating labels
// ═══════════════════════════════════════════════════════════

import React, { useState } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`input-wrapper ${error ? 'input-error' : ''} ${className}`}>
      <div className={`input-container input-${variant} ${focused ? 'input-focused' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={inputId}
          className="input-field"
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={`input-label ${focused || props.value ? 'input-label-float' : ''}`}
          >
            {label}
          </label>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default Input;

// ── Textarea Variant ────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`input-wrapper ${error ? 'input-error' : ''} ${className}`}>
      <div className={`input-container input-default ${focused ? 'input-focused' : ''}`}>
        <textarea
          id={textareaId}
          className="input-field textarea-field"
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        {label && (
          <label
            htmlFor={textareaId}
            className={`input-label ${focused || props.value ? 'input-label-float' : ''}`}
          >
            {label}
          </label>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};
