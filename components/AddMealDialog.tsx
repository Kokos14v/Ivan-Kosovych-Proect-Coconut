
import React, { useState } from 'react';
import { Meal } from '../types';
import { analyzeMealDescription } from '../services/geminiService';

interface AddMealDialogProps {
  onAddMeal: (meal: Omit<Meal, 'id' | 'time'>) => void;
}

export const AddMealDialog: React.FC<AddMealDialogProps> = ({ onAddMeal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'smart'>('smart');
  const [smartInput, setSmartInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    emoji: '🍴'
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMeal({
      name: formData.name || 'Страва',
      calories: Number(formData.calories),
      protein: Number(formData.protein),
      carbs: Number(formData.carbs),
      fat: Number(formData.fat),
      emoji: formData.emoji
    });
    resetForm();
  };

  const handleSmartAnalyze = async () => {
    if (!smartInput) return;
    setIsLoading(true);
    const result = await analyzeMealDescription(smartInput);
    setIsLoading(false);
    
    if (result) {
      onAddMeal(result);
      resetForm();
    } else {
      alert("Не вдалося розпізнати страву. Спробуйте ще раз або введіть дані вручну.");
    }
  };

  const resetForm = () => {
    setFormData({ name: '', calories: '', protein: '', carbs: '', fat: '', emoji: '🍴' });
    setSmartInput('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
      >
        <span className="text-xl">+</span> Додати прийом їжі
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-fade-up">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Нова страва</h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('smart')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'smart' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Smart Швидко
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Вручну
            </button>
          </div>

          {activeTab === 'smart' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Просто напишіть, що ви з'їли (наприклад: "Сендвіч з тунцем та овочами")</p>
              <textarea
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                placeholder="Введіть опис страви..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none"
              />
              <button
                disabled={isLoading}
                onClick={handleSmartAnalyze}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all ${isLoading ? 'bg-slate-300' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isLoading ? 'Аналіз AI...' : 'Аналізувати та додати ✨'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Назва</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Наприклад: Салат Цезар"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Калорії</label>
                  <input
                    required
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({...formData, calories: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Білки</label>
                  <input
                    required
                    type="number"
                    value={formData.protein}
                    onChange={(e) => setFormData({...formData, protein: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Вуглеводи</label>
                  <input
                    required
                    type="number"
                    value={formData.carbs}
                    onChange={(e) => setFormData({...formData, carbs: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Жири</label>
                  <input
                    required
                    type="number"
                    value={formData.fat}
                    onChange={(e) => setFormData({...formData, fat: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all mt-4"
              >
                Зберегти страву
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
