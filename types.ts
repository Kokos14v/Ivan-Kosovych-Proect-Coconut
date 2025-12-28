
export interface Meal {
  id: number;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SmartMealResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
}
