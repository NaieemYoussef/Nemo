import React from 'react';

interface TextAreaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  disabled?: boolean;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ value, onChange, placeholder, rows = 10, disabled = false }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full p-4 text-sm sm:text-base bg-teal-800 border border-teal-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-slate-100 placeholder-teal-300 disabled:opacity-70 disabled:cursor-not-allowed"
      aria-label={placeholder}
    />
  );
};

export default TextAreaInput;
