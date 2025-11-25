import React, { useState, useEffect } from 'react';
import { Question, QuestionSet, RawGeminiQuestion } from '../types';
import { 
  Play, 
  Trash2, 
  Check, 
  Settings2, 
  Library, 
  ShieldCheck, 
  Leaf, 
  Save,
  BookOpen,
  PieChart
} from 'lucide-react';
import { INITIAL_LIBRARY } from '../constants';

interface SetupViewProps {
  onStartQuiz: (questions: Question[], limit: number) => void;
  onOpenAnalysis: () => void;
}

type Tab = 'EXAM' | 'MANAGE';

const SetupView: React.FC<SetupViewProps> = ({ onStartQuiz, onOpenAnalysis }) => {
  const [activeTab, setActiveTab] = useState<Tab>('EXAM');
  
  // Library State
  const [library, setLibrary] = useState<QuestionSet[]>([]);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  
  // New Set State
  const [newSetTitle, setNewSetTitle] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  
  // Exam Config State
  const [examLimit, setExamLimit] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load library
  useEffect(() => {
    const savedLib = localStorage.getItem('hmgs_library');
    if (savedLib) {
      try {
        const parsedLib = JSON.parse(savedLib);
        // Merge with INITIAL_LIBRARY if not already present (checking by ID)
        const combinedLib = [...INITIAL_LIBRARY];
        
        parsedLib.forEach((savedSet: QuestionSet) => {
            if (!combinedLib.find(i => i.id === savedSet.id)) {
                combinedLib.push(savedSet);
            }
        });
        
        setLibrary(combinedLib);
      } catch (e) {
        console.error("Failed to load library", e);
        setLibrary(INITIAL_LIBRARY);
      }
    } else {
      setLibrary(INITIAL_LIBRARY);
    }
  }, []);

  // Save library (custom sets only, ideally)
  useEffect(() => {
    if (library.length > 0) {
      // We only save sets that are NOT in the initial library to avoid duplication in local storage
      const customSets = library.filter(set => !INITIAL_LIBRARY.find(init => init.id === set.id));
      localStorage.setItem('hmgs_library', JSON.stringify(customSets));
    }
  }, [library]);

  // Calculate totals
  const totalAvailableQuestions = library
    .filter(set => selectedSetIds.includes(set.id))
    .reduce((acc, set) => acc + set.questions.length, 0);

  // Auto-adjust slider
  useEffect(() => {
    if (totalAvailableQuestions > 0) {
      if (examLimit > totalAvailableQuestions) {
        setExamLimit(totalAvailableQuestions);
      }
    } else {
        setExamLimit(0);
    }
  }, [totalAvailableQuestions]);

  const handleJsonSubmit = () => {
    try {
      setError(null);
      setSuccessMsg(null);
      if (!newSetTitle.trim()) throw new Error("Ders/Konu başlığı yazmalısın.");
      if (!jsonInput.trim()) throw new Error("JSON kodunu yapıştırmalısın.");

      let parsed: any;
      try {
          parsed = JSON.parse(jsonInput);
      } catch (jsonErr) {
          throw new Error("JSON formatı hatalı. Parantezleri kontrol et.");
      }

      if (!Array.isArray(parsed)) throw new Error("Bu kod bir liste (array) olmalı: [...]");
      if (parsed.length === 0) throw new Error("Liste boş.");

      let convertedQuestions: Question[] = [];

      // Check format type
      const firstItem = parsed[0];
      
      // Format 1: User's Gemini Format (id, alan, soru, siklar: {}, cevap: "A")
      if ('alan' in firstItem && 'siklar' in firstItem && !Array.isArray(firstItem.siklar)) {
          convertedQuestions = (parsed as RawGeminiQuestion[]).map((item, idx) => {
              const options = Object.values(item.siklar);
              // Map "A" to options[0], "B" to options[1], etc.
              const answerIndex = item.cevap.toUpperCase().charCodeAt(0) - 65; 
              const correctAnswerText = options[answerIndex] || "";

              // Clean category name (remove parenthesis details for aggregation)
              // e.g. "ANAYASA HUKUKU (1961 Yenilikleri)" -> "Anayasa Hukuku"
              let category = item.alan.split('(')[0].trim();
              // Capitalize nicely if fully uppercase
              if (category === category.toUpperCase()) {
                  category = category.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
              }

              return {
                  id: `custom-${Date.now()}-${idx}`,
                  category: category,
                  text: item.soru,
                  options: options,
                  correctAnswer: correctAnswerText,
                  explanation: item.cozum || "Cevap anahtarına göre."
              };
          });
      } 
      // Format 2: App's Native Format
      else if ('options' in firstItem && Array.isArray(firstItem.options)) {
          convertedQuestions = parsed as Question[];
      } 
      else {
          throw new Error("Tanınmayan JSON formatı. 'alan', 'soru', 'siklar' (obje) içeren formatı kullanın.");
      }
      
      const newSet: QuestionSet = {
        id: Date.now().toString(),
        title: newSetTitle,
        dateAdded: Date.now(),
        questions: convertedQuestions
      };

      setLibrary(prev => [...prev, newSet]);
      setJsonInput('');
      setNewSetTitle('');
      setSuccessMsg(`Başarılı! ${convertedQuestions.length} soru eklendi.`);
      
      // Auto select newly added
      if (!selectedSetIds.includes(newSet.id)) {
          setSelectedSetIds(prev => [...prev, newSet.id]);
      }

    } catch (e: any) {
      setError(`Hata: ${e.message}`);
    }
  };

  const toggleSetSelection = (id: string) => {
    setSelectedSetIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllSets = () => {
      setSelectedSetIds(library.map(s => s.id));
  };

  const deselectAllSets = () => {
      setSelectedSetIds([]);
  };

  const deleteSet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Bu dersi ve içindeki tüm soruları silmek istiyor musun?")) {
      setLibrary(prev => prev.filter(set => set.id !== id));
      setSelectedSetIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleStart = () => {
    if (selectedSetIds.length === 0) {
        setError("Lütfen en az bir ders seç.");
        return;
    }
    
    let pool: Question[] = [];
    library.forEach(set => {
        if (selectedSetIds.includes(set.id)) {
            pool = [...pool, ...set.questions];
        }
    });

    onStartQuiz(pool, examLimit);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen flex flex-col pt-8 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative">
        <button 
            onClick={onOpenAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
        >
            <PieChart className="w-4 h-4" />
            Analiz
        </button>

        <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                HMGS <span className="text-indigo-500">Hazırlık</span>
            </h1>
        </div>

        {/* Placeholder to balance the left button for centering */}
        <div className="w-[88px] hidden md:block"></div> 

        {/* Fixed Nane Logo */}
        <div className="absolute top-[-10px] right-0 md:right-[-40px] transform rotate-12 flex flex-col items-center opacity-90 pointer-events-none select-none">
             <Leaf className="w-8 h-8 text-emerald-500 fill-emerald-500/20" />
             <span className="font-handwriting text-emerald-400 font-bold -rotate-6 text-xs bg-slate-800/90 px-2 py-0.5 rounded border border-emerald-500/30">Nane</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800">
            <button 
                onClick={() => setActiveTab('EXAM')}
                className={`flex-1 py-4 font-bold text-sm md:text-base flex items-center justify-center transition-colors ${activeTab === 'EXAM' ? 'bg-slate-800/50 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
            >
                <Settings2 className="w-5 h-5 mr-2" />
                Sınav Oluştur
            </button>
            <button 
                onClick={() => setActiveTab('MANAGE')}
                className={`flex-1 py-4 font-bold text-sm md:text-base flex items-center justify-center transition-colors ${activeTab === 'MANAGE' ? 'bg-slate-800/50 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
            >
                <Library className="w-5 h-5 mr-2" />
                Soru Ekle / Yönet
            </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow flex flex-col">
            
            {/* EXAM TAB */}
            {activeTab === 'EXAM' && (
                <div className="flex flex-col h-full animate-fade-in space-y-8">
                    
                    {/* Step 1: Selection */}
                    <div className="flex-grow flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center">
                                1. Hangi Konulardan Soru Çıksın?
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={selectAllSets} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors">Tümünü Seç</button>
                                <button onClick={deselectAllSets} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors">Temizle</button>
                            </div>
                        </div>
                        
                        {library.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                                <p className="text-slate-500 mb-4">Henüz hiç soru eklemedin.</p>
                                <button onClick={() => setActiveTab('MANAGE')} className="text-emerald-400 hover:underline font-medium">
                                    Buraya tıkla ve soru ekle
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar flex-grow max-h-[350px]">
                                {library.map(set => {
                                    const isSelected = selectedSetIds.includes(set.id);
                                    // Determine if it's a system set or user set
                                    const isSystem = INITIAL_LIBRARY.some(lib => lib.id === set.id);
                                    
                                    return (
                                        <div 
                                            key={set.id}
                                            onClick={() => toggleSetSelection(set.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group select-none ${
                                                isSelected 
                                                ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 bg-slate-900'}`}>
                                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className={`font-bold truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>{set.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500">{set.questions.length} Soru</span>
                                                        {!isSystem && <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded">Eklenen</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Slider */}
                    <div className={`transition-opacity duration-300 pt-4 ${totalAvailableQuestions === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                         <h2 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-4 flex justify-between items-center">
                            <span>2. Soru Sayısı</span>
                            <span className="text-indigo-400 bg-indigo-900/30 px-3 py-1 rounded-full text-lg font-black">{examLimit}</span>
                        </h2>
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                             <input 
                                type="range" 
                                min="1" 
                                max={totalAvailableQuestions || 1} 
                                value={examLimit} 
                                onChange={(e) => setExamLimit(parseInt(e.target.value))}
                                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                             />
                             <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                                <span>1</span>
                                <span>Havuz: {totalAvailableQuestions}</span>
                             </div>
                        </div>
                    </div>

                    {/* Start Button */}
                    <div className="pt-4">
                        {error && <div className="text-red-400 text-sm mb-3 text-center bg-red-900/20 p-2 rounded">{error}</div>}
                        <button
                            onClick={handleStart}
                            disabled={totalAvailableQuestions === 0 || selectedSetIds.length === 0}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center transition-all transform active:scale-95 ${
                                totalAvailableQuestions === 0 || selectedSetIds.length === 0
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'
                            }`}
                        >
                            <Play className="w-6 h-6 mr-3 fill-current" />
                            Sınavı Başlat
                        </button>
                    </div>
                </div>
            )}

            {/* MANAGE TAB */}
            {activeTab === 'MANAGE' && (
                <div className="flex flex-col h-full animate-fade-in">
                    
                    {/* Info Box */}
                    <div className="bg-emerald-900/20 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 mb-6">
                        <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="text-emerald-400 font-bold text-sm">Gizli ve Güvenli Mod</h4>
                            <p className="text-emerald-200/70 text-xs mt-1 leading-relaxed">
                                Veriler tarayıcında saklanır. Gemini'den aldığın JSON kodlarını buraya yapıştırarak kendi arşivini oluşturabilirsin.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-4 flex-grow">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Ders / Konu Adı</label>
                            <input 
                                type="text"
                                placeholder="Örn: Ticaret Hukuku Çalışma Soruları"
                                value={newSetTitle}
                                onChange={(e) => setNewSetTitle(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="flex flex-col h-64">
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">JSON Kodu (Gemini Çıktısı)</label>
                            <textarea 
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder='[ { "alan": "...", "soru": "...", "siklar": {...}, ... } ]'
                                className="w-full flex-grow bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:border-indigo-500 outline-none resize-none custom-scrollbar"
                            ></textarea>
                        </div>
                        
                        {successMsg && (
                            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm text-center font-medium">
                                {successMsg}
                            </div>
                        )}
                        {error && (
                            <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm text-center font-medium">
                                {error}
                            </div>
                        )}

                        <button 
                            onClick={handleJsonSubmit}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Kütüphaneye Kaydet
                        </button>
                    </div>

                    {/* Mini List of Existing Sets */}
                    <div className="mt-8 pt-6 border-t border-slate-800">
                        <h3 className="text-slate-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Eklediğin Kitapçıklar
                        </h3>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                            {library.filter(s => !INITIAL_LIBRARY.some(init => init.id === s.id)).length === 0 && (
                                <p className="text-slate-600 text-xs italic">Henüz özel bir kitapçık eklemedin.</p>
                            )}
                            {library.filter(s => !INITIAL_LIBRARY.some(init => init.id === s.id)).map(set => (
                                <div key={set.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 group">
                                    <div className="flex flex-col truncate">
                                        <span className="text-slate-300 text-sm font-medium truncate max-w-[200px]">{set.title}</span>
                                        <span className="text-xs text-slate-600">{set.questions.length} Soru</span>
                                    </div>
                                    <button 
                                        onClick={(e) => deleteSet(set.id, e)}
                                        className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SetupView;