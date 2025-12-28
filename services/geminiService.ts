import { GoogleGenAI, Type } from "@google/genai";
import { SmartMealResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PhotoAnalysisResult {
  dish_name: string;
  portion_guess: string;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  health_score_0_10: number;
  health_label: "корисна" | "нейтральна" | "небажана";
  why_short: string;
  tips: string[];
}

export interface RecipeNutrition {
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  health_score_0_10: number;
  health_label: "корисна" | "нейтральна" | "небажана";
  notes_short: string;
}

/**
 * Legacy function stub to satisfy build requirements.
 * Not used in the Coconut MVP version.
 */
export async function analyzeMealDescription(description: string): Promise<SmartMealResult | null> {
  console.warn("analyzeMealDescription is a legacy function");
  throw new Error("Legacy function not used in Coconut MVP");
}

/**
 * Estimates nutritional value for a given recipe.
 * Returns structured KBZhV data and health label.
 */
export async function estimateRecipeNutrition(input: {
  title: string;
  ingredients: string[];
  steps?: string[];
}): Promise<RecipeNutrition | null> {
  try {
    const prompt = `Проаналізуй цей рецепт та оціни харчову цінність на ОДНУ порцію.
Назва: ${input.title}
Інгредієнти: ${input.ingredients.join(", ")}
${input.steps ? `Кроки: ${input.steps.join(" ")}` : ""}

Поверни ПРАВИЛЬНИЙ JSON об'єкт українською мовою. Оцінюй обережно.
Схема: 
{
  "calories_kcal": number|null,
  "protein_g": number|null,
  "carbs_g": number|null,
  "fat_g": number|null,
  "health_score_0_10": number,
  "health_label": "корисна"|"нейтральна"|"небажана",
  "notes_short": string
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories_kcal: { type: Type.NUMBER, nullable: true },
            protein_g: { type: Type.NUMBER, nullable: true },
            carbs_g: { type: Type.NUMBER, nullable: true },
            fat_g: { type: Type.NUMBER, nullable: true },
            health_score_0_10: { type: Type.NUMBER },
            health_label: { type: Type.STRING, enum: ["корисна", "нейтральна", "небажана"] },
            notes_short: { type: Type.STRING }
          },
          required: ["calories_kcal", "protein_g", "carbs_g", "fat_g", "health_score_0_10", "health_label", "notes_short"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as RecipeNutrition;
    }
    return null;
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.message?.includes("quota")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    console.error(`Error estimating nutrition for ${input.title}:`, error);
    return null;
  }
}

/**
 * Generates a photorealistic food image for a recipe.
 * Uses the specified template and gemini-2.5-flash-image model.
 */
export async function generateRecipeImage(title: string, category: string, ingredients: string[]): Promise<string | null> {
  try {
    const prompt = `Фотореалістичне food-photo однієї готової страви.

Назва страви: ${title}
Категорія: ${category}
Ключові інгредієнти: ${ingredients.join(", ")}

Стиль і подача:
– реалістична food photography (НЕ ілюстрація)
– мʼяке природне світло
– вигляд як у сучасному healthy-café
– акуратна, мінімалістична подача
– нейтральний або світлий фон (дерево / камінь)
– кут зйомки: 30–45° або легкий top-down
– фокус на текстурі та апетитності
– натуральні, неперенасичені кольори

Обмеження:
– без людей, рук, облич
– без тексту, логотипів, водяних знаків
– без зайвого реквізиту
– одна страва в кадрі

Технічні вимоги:
– квадратне зображення (1:1)
– висока деталізація, sharp focus
– єдиний стиль для всього меню (consistent style)`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error generating image for ${title}:`, error);
    return null;
  }
}

/**
 * Analyzes a photo of a meal using Gemini 3 Flash.
 * Returns estimated nutritional data and health insights in a structured JSON format.
 */
export const analyzeMealPhoto = async (base64Image: string, mimeType: string): Promise<PhotoAnalysisResult | null> => {
  try {
    const prompt = `Аналізуй це зображення їжі. Оціни калорійність, порцію та корисність. 
    Будь ОБЕРЕЖНИМ у оцінках. Без медичних тверджень. Враховуй невизначеність.
    Якщо на фото не їжа, вкажи calories_kcal як null.
    Шкала корисності: 0-3 небажана, 4-6 нейтральна, 7-10 корисна.
    Відповідай українською мовою ПРАВИЛЬНИМ JSON об'єктом.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dish_name: { type: Type.STRING },
            portion_guess: { type: Type.STRING },
            calories_kcal: { type: Type.NUMBER, nullable: true },
            protein_g: { type: Type.NUMBER, nullable: true },
            carbs_g: { type: Type.NUMBER, nullable: true },
            fat_g: { type: Type.NUMBER, nullable: true },
            health_score_0_10: { type: Type.NUMBER },
            health_label: { type: Type.STRING, enum: ["корисна", "нейтральна", "небажана"] },
            why_short: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["dish_name", "portion_guess", "health_score_0_10", "health_label", "why_short", "tips"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as PhotoAnalysisResult;
    }
    return null;
  } catch (error) {
    console.error("Error analyzing photo:", error);
    return null;
  }
};