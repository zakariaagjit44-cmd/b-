import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="text-center p-4 sm:p-5 bg-white border-b border-gray-200">
      <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
        <span role="img" aria-label="microphone" className="mr-2">🎙️</span>
        Telc Speaking Trainer
      </h1>
      <p className="text-sm text-gray-500 mt-1">مدربك الذكي لاجتياز امتحان Telc الشفوي</p>
    </div>
  );
};

export default Header;