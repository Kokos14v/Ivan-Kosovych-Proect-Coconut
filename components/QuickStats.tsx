
import React from 'react';

interface QuickStatsProps {
  burnedCalories: number;
  water: number;
  steps: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ burnedCalories, water, steps }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="gradient-card p-3 rounded-2xl flex flex-col items-center justify-center text-center">
        <span className="text-xl mb-1">🔥</span>
        <span className="text-sm font-bold text-slate-900 leading-none">{burnedCalories}</span>
        <span className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-wider">Спалено</span>
      </div>
      <div className="gradient-card p-3 rounded-2xl flex flex-col items-center justify-center text-center">
        <span className="text-xl mb-1">💧</span>
        <span className="text-sm font-bold text-slate-900 leading-none">{water}л</span>
        <span className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-wider">Вода</span>
      </div>
      <div className="gradient-card p-3 rounded-2xl flex flex-col items-center justify-center text-center">
        <span className="text-xl mb-1">👣</span>
        <span className="text-sm font-bold text-slate-900 leading-none">{steps}</span>
        <span className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-wider">Кроки</span>
      </div>
    </div>
  );
};
