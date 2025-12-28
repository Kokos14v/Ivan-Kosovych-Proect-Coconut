
import React from 'react';
import { Meal } from '../types';

export const MealCard: React.FC<Omit<Meal, 'id'>> = ({ name, time, calories, protein, carbs, fat, emoji }) => {
  return (
    <div className="gradient-card p-4 rounded-xl flex items-center gap-4 transition-all hover:translate-x-1">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl shadow-sm border border-slate-100">
        {emoji}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-slate-900 leading-none">{name}</h4>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 uppercase tracking-tight">
            {calories} ккал
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
          <span>{time}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Б: {protein}г • В: {carbs}г • Ж: {fat}г</span>
        </div>
      </div>
    </div>
  );
};
