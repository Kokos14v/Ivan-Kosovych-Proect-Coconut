
import React from 'react';

export const Header: React.FC = () => {
  const today = new Date().toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="py-8 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Привіт, Олександре! 👋</h1>
          <p className="text-slate-500 capitalize">{today}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold border-2 border-green-200">
          OA
        </div>
      </div>
    </header>
  );
};
