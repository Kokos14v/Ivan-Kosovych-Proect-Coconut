import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  analyzeMealPhoto, 
  PhotoAnalysisResult, 
  generateRecipeImage, 
  estimateRecipeNutrition,
  RecipeNutrition 
} from "./services/geminiService";
import { recipesData } from "./30_recipes_breakfast_lunch_dinner";

type TabKey = "book" | "photo";

interface Recipe {
  id: string;
  category: string;
  title: string;
  ingredients: string[];
  steps: string[];
  image_file: string;
  source_page: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: "Сніданки",
  lunch: "Обіди",
  dinner: "Вечері",
  snack: "Перекуси"
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("book");
  const [activeCategory, setActiveCategory] = useState<string>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoResult, setPhotoResult] = useState<PhotoAnalysisResult | null>(null);
  
  // State for AI-generated images
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  
  // State for AI-estimated nutrition
  const [nutritionCache, setNutritionCache] = useState<Record<string, RecipeNutrition>>(() => {
    const saved = localStorage.getItem("nutritionById");
    return saved ? JSON.parse(saved) : {};
  });
  
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  const processingImages = useRef<Set<string>>(new Set());
  const processingNutrition = useRef<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recipes = recipesData as Recipe[];

  // Sync nutrition to localStorage
  useEffect(() => {
    localStorage.setItem("nutritionById", JSON.stringify(nutritionCache));
  }, [nutritionCache]);

  // Filtered recipes for the current view
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => 
      r.category === activeCategory && 
      (searchQuery === "" || r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [activeCategory, searchQuery, recipes]);

  // Background Auto-Generation Logic (Images & Nutrition)
  useEffect(() => {
    let isMounted = true;

    const runBackgroundTasks = async () => {
      // Nutrition first (highest priority)
      for (const recipe of recipes) {
        if (!isMounted || quotaExceeded) break;
        
        if (!nutritionCache[recipe.id] && !processingNutrition.current.has(recipe.id)) {
          processingNutrition.current.add(recipe.id);
          try {
            const data = await estimateRecipeNutrition({
              title: recipe.title,
              ingredients: recipe.ingredients,
              steps: recipe.steps
            });
            if (data && isMounted) {
              setNutritionCache(prev => ({ ...prev, [recipe.id]: data }));
            }
          } catch (err: any) {
            if (err.message === "QUOTA_EXCEEDED") {
              setQuotaExceeded(true);
              break;
            }
          } finally {
            // Rate limit: 1.5 - 2.5s delay
            await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
            processingNutrition.current.delete(recipe.id);
          }
        }
      }

      // Then Images
      for (const recipe of recipes) {
        if (!isMounted) break;
        if (generatedImages[recipe.id] || processingImages.current.has(recipe.id)) continue;

        processingImages.current.add(recipe.id);
        try {
          const categoryLabel = CATEGORY_LABELS[recipe.category] || recipe.category;
          const imageUrl = await generateRecipeImage(recipe.title, categoryLabel, recipe.ingredients);
          if (imageUrl && isMounted) {
            setGeneratedImages(prev => ({ ...prev, [recipe.id]: imageUrl }));
          }
        } catch (err) {
          console.error(`Image fail for ${recipe.id}`);
        } finally {
          await new Promise(resolve => setTimeout(resolve, 500));
          processingImages.current.delete(recipe.id);
        }
      }
    };

    runBackgroundTasks();
    return () => { isMounted = false; };
  }, [recipes, nutritionCache, generatedImages, quotaExceeded]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        setPhotoResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!capturedImage) return;
    setIsAnalyzingPhoto(true);
    try {
      const base64Data = capturedImage.split(',')[1];
      const mimeType = capturedImage.split(',')[0].split(':')[1].split(';')[0];
      const result = await analyzeMealPhoto(base64Data, mimeType);
      if (result) setPhotoResult(result);
      else alert("Не вдалося проаналізувати страву.");
    } catch (e) {
      console.error(e);
      alert("Сталася помилка при аналізі.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  return (
    <div className="coco-bg">
      <div className="max-w-[430px] mx-auto px-5 pt-8 pb-32 min-h-screen relative">
        <header className="flex items-center gap-3 mb-8 animate-fade-up">
          <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(22,242,208,0.2)]">
            🥥
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Coconut</h1>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#16f2d0] opacity-80">Smart Nutrition</p>
          </div>
        </header>

        {quotaExceeded && (
          <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-[10px] font-bold uppercase tracking-wider text-center animate-fade-up">
            ⚠️ Ліміт AI вичерпано, спробуй пізніше
          </div>
        )}

        <nav className="flex gap-2 p-1.5 glass rounded-2xl mb-8 animate-fade-up">
          <button 
            onClick={() => setActiveTab("book")}
            className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "book" ? 'pill-active text-[#16f2d0]' : 'text-white/60 hover:text-white'}`}
          >
            📖 Книга
          </button>
          <button 
            onClick={() => setActiveTab("photo")}
            className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "photo" ? 'pill-active text-[#16f2d0]' : 'text-white/60 hover:text-white'}`}
          >
            📸 Фото
          </button>
        </nav>

        {activeTab === "book" ? (
          <div className="space-y-6 animate-fade-up">
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Збірка рецептів</h2>
              
              <div className="flex overflow-x-auto gap-2 pb-2 scroll-hide mb-4">
                {Object.keys(CATEGORY_LABELS).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'pill-active border-[#16f2d0] text-[#16f2d0]' : 'pill opacity-60 text-white'}`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              <div className="glass rounded-2xl h-11 flex items-center px-4 border-white/5">
                <span className="mr-3 opacity-30 text-sm">🔎</span>
                <input 
                  type="text"
                  placeholder="Пошук рецепта..."
                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredRecipes.map(recipe => {
                const nutrition = nutritionCache[recipe.id];
                return (
                  <button 
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className="glass p-3 rounded-2xl flex items-center gap-4 text-left transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(22,242,208,0.15)] active:scale-[0.98] group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/5 shrink-0 transition-all flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(22,242,208,0.3)]">
                      {generatedImages[recipe.id] ? (
                        <img 
                          src={generatedImages[recipe.id]} 
                          className="w-full h-full object-cover animate-fade-up" 
                          alt={recipe.title}
                        />
                      ) : (
                        <div className="w-10 h-10 border-2 border-white/5 border-t-[#16f2d0]/30 rounded-full animate-spin opacity-20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight truncate">{recipe.title}</h4>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-black text-[#16f2d0] uppercase tracking-widest opacity-50">{CATEGORY_LABELS[recipe.category]}</p>
                          {nutrition ? (
                            <span className="text-[9px] font-bold text-white/40">≈ {nutrition.calories_kcal} ккал</span>
                          ) : null}
                        </div>
                        <p className="text-[8px] font-medium text-white/30 italic">
                          AI-оцінка корисності: {nutrition ? `${Math.round(Math.max(0, Math.min(10, nutrition.health_score_0_10)))}/10` : 'Розрахунок...'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredRecipes.length === 0 && (
                <div className="py-20 text-center opacity-30 italic text-white text-sm">Нічого не знайдено</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-up">
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">AI Аналіз Страви</h2>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handlePhotoCapture} 
              />
              {!capturedImage ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="glass w-full h-44 rounded-[32px] border-dashed border-2 border-white/10 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-all group"
                >
                  <div className="text-5xl group-hover:scale-110 transition-transform">📸</div>
                  <span className="text-xs font-black text-white/30 uppercase tracking-widest">Зробити фото їжі</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Meal" />
                    <button 
                      onClick={() => { setCapturedImage(null); setPhotoResult(null); }} 
                      className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 backdrop-blur-xl text-white font-bold flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                    >
                      ✕
                    </button>
                  </div>
                  <button 
                    disabled={isAnalyzingPhoto} 
                    onClick={handleAnalyzePhoto} 
                    className="primary-btn w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    {isAnalyzingPhoto ? "Аналіз..." : "✨ Аналізувати"}
                  </button>
                </div>
              )}
            </div>

            {photoResult && (
              <div className="glass rounded-3xl p-6 animate-fade-up space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h3 className="text-xl font-black text-white leading-tight">{photoResult.dish_name}</h3>
                    <p className="text-xs text-white/50 mt-1">{photoResult.portion_guess}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-[#16f2d0]">{photoResult.calories_kcal || "—"}</div>
                    <div className="text-[9px] font-black uppercase text-white/30 tracking-widest">Ккал</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="glass p-3 rounded-2xl text-center">
                    <div className="text-sm font-bold text-white">{photoResult.protein_g ?? "0"}г</div>
                    <div className="text-[8px] uppercase font-black opacity-30 text-white mt-0.5">Білки</div>
                  </div>
                  <div className="glass p-3 rounded-2xl text-center">
                    <div className="text-sm font-bold text-white">{photoResult.carbs_g ?? "0"}г</div>
                    <div className="text-[8px] uppercase font-black opacity-30 text-white mt-0.5">Вуглевод.</div>
                  </div>
                  <div className="glass p-3 rounded-2xl text-center">
                    <div className="text-sm font-bold text-white">{photoResult.fat_g ?? "0"}г</div>
                    <div className="text-[8px] uppercase font-black opacity-30 text-white mt-0.5">Жири</div>
                  </div>
                </div>

                <div className="p-5 glass rounded-2xl border-l-2 border-[#16f2d0]/40 text-sm text-white/80 leading-relaxed font-medium">
                  {photoResult.why_short}
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                      <span>Корисність ({photoResult.health_label})</span>
                      <span>{photoResult.health_score_0_10}/10</span>
                   </div>
                   <div className="h-2 w-full glass rounded-full overflow-hidden">
                      <div className="h-full bg-[#16f2d0] transition-all duration-700" style={{ width: `${photoResult.health_score_0_10 * 10}%` }} />
                   </div>
                   <p className="text-[9px] text-white/20 italic text-center">* Оцінки приблизні. Для точності потрібні вага та точний склад.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedRecipe && (
          <div className="fixed inset-0 z-[100] bg-[#031a1c]/95 backdrop-blur-2xl flex items-end justify-center animate-fade-up">
            <div className="glass w-full max-w-[430px] h-[92vh] rounded-t-[40px] overflow-hidden flex flex-col border-white/10">
              <div className="p-6 flex justify-between items-center border-b border-white/5 shrink-0">
                <div className="min-w-0 pr-4">
                  <span className="text-[9px] font-black text-[#16f2d0] uppercase tracking-widest opacity-60">{CATEGORY_LABELS[selectedRecipe.category]}</span>
                  <h2 className="text-lg font-bold text-white leading-tight truncate">{selectedRecipe.title}</h2>
                </div>
                <button onClick={() => setSelectedRecipe(null)} className="h-10 w-10 rounded-full glass flex items-center justify-center text-white shrink-0 hover:bg-white/10">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto scroll-hide">
                <div className="w-full bg-black/40 aspect-[4/3] flex items-center justify-center border-b border-white/5 overflow-hidden">
                   {generatedImages[selectedRecipe.id] ? (
                      <img 
                        src={generatedImages[selectedRecipe.id]} 
                        loading="lazy"
                        className="w-full h-full object-cover animate-fade-up" 
                        alt={selectedRecipe.title} 
                      />
                   ) : (
                      <div className="absolute text-white/20 flex flex-col items-center gap-2 pointer-events-none">
                        <div className="w-12 h-12 border-4 border-white/5 border-t-[#16f2d0] rounded-full animate-spin" />
                        <span className="text-[10px] uppercase font-black tracking-widest opacity-30 mt-4">Генерація фото...</span>
                      </div>
                   )}
                </div>

                <div className="p-8 pb-36 space-y-8">
                   {/* Nutrition Stats Section */}
                   <section className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-1 h-5 bg-[#16f2d0] rounded-full" />
                         <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Харчова цінність</h3>
                      </div>
                      {nutritionCache[selectedRecipe.id] ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-2">
                            <div className="glass p-3 rounded-2xl text-center">
                              <div className="text-xs font-bold text-white">{nutritionCache[selectedRecipe.id].calories_kcal}</div>
                              <div className="text-[7px] uppercase font-black opacity-30 text-white mt-0.5">Ккал</div>
                            </div>
                            <div className="glass p-3 rounded-2xl text-center">
                              <div className="text-xs font-bold text-white">{nutritionCache[selectedRecipe.id].protein_g}г</div>
                              <div className="text-[7px] uppercase font-black opacity-30 text-white mt-0.5">Білки</div>
                            </div>
                            <div className="glass p-3 rounded-2xl text-center">
                              <div className="text-xs font-bold text-white">{nutritionCache[selectedRecipe.id].carbs_g}г</div>
                              <div className="text-[7px] uppercase font-black opacity-30 text-white mt-0.5">Вугл.</div>
                            </div>
                            <div className="glass p-3 rounded-2xl text-center">
                              <div className="text-xs font-bold text-white">{nutritionCache[selectedRecipe.id].fat_g}г</div>
                              <div className="text-[7px] uppercase font-black opacity-30 text-white mt-0.5">Жири</div>
                            </div>
                          </div>
                          
                          <div className="p-5 glass rounded-2xl border-l-2 border-[#16f2d0]/30 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-[#16f2d0] tracking-widest">AI-оцінка корисності</span>
                              <span className="text-[11px] font-black text-white">{Math.round(Math.max(0, Math.min(10, nutritionCache[selectedRecipe.id].health_score_0_10)))}/10</span>
                            </div>
                            <div className="h-1.5 w-full glass rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#16f2d0] shadow-[0_0_10px_rgba(22,242,208,0.4)] transition-all duration-700" 
                                style={{ width: `${Math.max(0, Math.min(10, nutritionCache[selectedRecipe.id].health_score_0_10)) * 10}%` }} 
                              />
                            </div>
                            <div className="pt-2">
                              <span className="text-[9px] font-black uppercase text-[#16f2d0] tracking-widest opacity-60">{nutritionCache[selectedRecipe.id].health_label}</span>
                              <p className="text-xs text-white/60 leading-relaxed italic mt-1">"{nutritionCache[selectedRecipe.id].notes_short}"</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="glass p-6 rounded-2xl text-center space-y-2">
                           <div className="w-5 h-5 border-2 border-[#16f2d0]/20 border-t-[#16f2d0] rounded-full animate-spin mx-auto" />
                           <p className="text-[10px] uppercase font-black tracking-widest text-white/20">AI розраховує КБЖВ...</p>
                        </div>
                      )}
                   </section>

                   <section className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-1 h-5 bg-[#16f2d0] rounded-full" />
                         <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Інгредієнти</h3>
                      </div>
                      <ul className="space-y-3">
                        {selectedRecipe.ingredients.map((ing, i) => (
                          <li key={i} className="text-sm text-white/80 flex gap-3 leading-relaxed">
                            <span className="text-[#16f2d0]">•</span>
                            {ing}
                          </li>
                        ))}
                      </ul>
                   </section>

                   <section className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-1 h-5 bg-[#16f2d0] rounded-full" />
                         <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Приготування</h3>
                      </div>
                      <div className="space-y-4">
                        {selectedRecipe.steps.map((step, i) => (
                          <p key={i} className="text-sm text-white/70 leading-relaxed font-medium">
                            {step}
                          </p>
                        ))}
                      </div>
                   </section>

                   <div className="pt-8 border-t border-white/5">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Сторінка в книзі: {selectedRecipe.source_page}</p>
                   </div>
                </div>
              </div>

              <div className="p-6 pt-4 bg-gradient-to-t from-[#031a1c] absolute bottom-0 left-0 right-0 pointer-events-none">
                <button 
                  onClick={() => setSelectedRecipe(null)} 
                  className="primary-btn w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest pointer-events-auto"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
