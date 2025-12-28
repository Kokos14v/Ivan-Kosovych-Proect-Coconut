
import React from 'react';

interface CaloriesRingProps {
  consumed: number;
  goal: number;
}

export const CaloriesRing: React.FC<CaloriesRingProps> = ({ consumed, goal }) => {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(consumed / goal, 1);
  const offset = circumference - percentage * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <span className="block text-4xl font-extrabold text-slate-900">
          {Math.max(0, goal - consumed)}
        </span>
        <span className="text-sm text-slate-500 font-medium">залишилось ккал</span>
      </div>
    </div>
  );
};
