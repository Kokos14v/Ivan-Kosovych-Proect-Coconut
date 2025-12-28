
import { Meal, DailyGoals } from './types';

export const DAILY_GOALS: DailyGoals = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
};

export const INITIAL_MEALS: Meal[] = [
  {
    id: 1,
    name: "Вівсянка з ягодами",
    time: "08:30",
    calories: 350,
    protein: 12,
    carbs: 55,
    fat: 8,
    emoji: "🥣",
  },
  {
    id: 2,
    name: "Курка з рисом",
    time: "13:00",
    calories: 520,
    protein: 42,
    carbs: 48,
    fat: 14,
    emoji: "🍗",
  },
  {
    id: 3,
    name: "Грецький салат",
    time: "16:30",
    calories: 280,
    protein: 8,
    carbs: 12,
    fat: 22,
    emoji: "🥗",
  },
];
