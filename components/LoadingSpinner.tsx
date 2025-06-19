import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-4" role="status" aria-label="جار التحميل">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-400"></div>
      <p className="ms-3 text-cyan-300">جار التحميل...</p>
    </div>
  );
};

export default LoadingSpinner;
