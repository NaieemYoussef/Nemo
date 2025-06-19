import React from 'react';

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  Icon?: React.ElementType;
  isActive?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, isLoading = false, Icon, isActive = false }) => {
  const baseClasses = "w-full text-sm sm:text-base text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75";
  // Updated colors: Default is a darker teal, active is a brighter cyan
  const activeClasses = isActive ? "bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-300" : "bg-teal-600 hover:bg-teal-500 focus:ring-teal-300";
  const disabledClasses = "opacity-60 cursor-not-allowed bg-teal-500"; // Slightly different disabled look

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`${baseClasses} ${isLoading ? disabledClasses : activeClasses}`}
      aria-pressed={isActive}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          جارٍ المعالجة...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {Icon && <Icon className="w-5 h-5 mr-2" />}
          {label}
        </div>
      )}
    </button>
  );
};

export default ActionButton;
