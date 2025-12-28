
import React from 'react';

interface MacroProgressProps {
  label: string;
  current: number;
  goal: number;
  variant: 'protein' | 'carbs' | 'fat';
}

export const MacroProgress: React.FC<MacroProgressProps> = ({ label, current, goal, variant }) => {
  const colors = {
    protein: 'bg-blue-500',
    carbs: 'bg-orange-400',
    fat: 'bg-yellow-400',
  };

  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">
          <span className="font-bold text-slate-900">{current}г</span> / {goal}г
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[variant]} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
