import React, { useState } from 'react';
import { Question } from '../types';
import { ArrowRight, ArrowLeft, Check, X, AlertCircle, BookmarkX, Flag, MapPin, CornerDownLeft, Target, LogOut } from 'lucide-react';

interface QuizViewProps {
  questions: Question[];
  initialAnswers: Record<string, string>;
  isReviewMode: boolean; // If true, shows answers immediately and disables editing
  onComplete: (answers: Record<string, string>) => void;
  onExit: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ 
    questions, 
    initialAnswers, 
    isReviewMode, 
    onComplete, 
    onExit
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Track all answers in local state until submission
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  // Track marked questions
  const [markedQuestionIds, setMarkedQuestionIds] = useState<Set<string>>(new Set());
  // Jump input state
  const [jumpInput, setJumpInput] = useState("");

  const currentQuestion = questions[currentIndex];
  // Calculate progress based on answered questions, not just index
  const answeredCount = Object.keys(answers).length;

  const handleOptionSelect = (option: string) => {
    if (isReviewMode) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  const handleClearAnswer = () => {
      if (isReviewMode) return;
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestion.id];
      setAnswers(newAnswers);
  };

  const toggleMarkQuestion = () => {
      const newSet = new Set(markedQuestionIds);
      if (newSet.has(currentQuestion.id)) {
          newSet.delete(currentQuestion.id);
      } else {
          newSet.add(currentQuestion.id);
      }
      setMarkedQuestionIds(newSet);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const target = parseInt(jumpInput);
      if (!isNaN(target) && target >= 1 && target <= questions.length) {
          setCurrentIndex(target - 1);
          setJumpInput("");
      }
  };

  const handleFinish = () => {
      if (isReviewMode) {
          onExit();
      } else {
          // Confirm if not all questions answered? Optional, but direct for now as requested.
          onComplete(answers);
      }
  };

  const selectedAnswer = answers[currentQuestion.id];
  const isMarked = markedQuestionIds.has(currentQuestion.id);

  const cardBg = 'bg-slate-900 border-slate-800';
  const textColor = 'text-slate-100';
  const subTextColor = 'text-slate-400';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 min-h-screen flex flex-col pt-4 md:pt-8">
      
      {/* Top Bar: Info & Progress */}
      <div className="mb-6">
         {/* Desktop Header */}
         <div className="hidden md:flex flex-row items-end justify-between mb-3 gap-2">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {currentQuestion.category}
                </span>
                <span className="text-xl font-bold text-white">
                    Soru {currentIndex + 1} <span className="text-slate-500 text-sm">/ {questions.length}</span>
                </span>
            </div>
         </div>

         {/* Mobile Header (Compact) */}
         <div className="flex md:hidden justify-between items-center mb-4">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-[150px]">
                    {currentQuestion.category}
                </span>
                <span className="text-lg font-bold text-white">
                    Soru {currentIndex + 1} <span className="text-slate-500 text-sm">/ {questions.length}</span>
                </span>
             </div>
             
             <div className="flex gap-2">
                {!isReviewMode && (
                    <button 
                        onClick={handleFinish} 
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        <Check className="w-3 h-3" />
                        Bitir
                    </button>
                )}
                <button 
                    onClick={onExit} 
                    className="flex items-center gap-1 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                    <LogOut className="w-3 h-3" />
                    Çıkış
                </button>
             </div>
         </div>

         {/* Segmented Progress Bar */}
         <div className="w-full h-2 rounded-full flex gap-0.5 bg-slate-800/50">
            {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentIndex;
                const isQMarked = markedQuestionIds.has(q.id);
                
                let colorClass = 'bg-slate-800'; // Default / Empty
                
                if (isCurrent) {
                    colorClass = 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] z-10 scale-y-125';
                } else if (isQMarked) {
                    colorClass = 'bg-amber-500'; // Marked
                } else if (isAnswered) {
                    colorClass = 'bg-emerald-600'; // Answered
                }
                
                return (
                    <div 
                        key={q.id} 
                        onClick={() => setCurrentIndex(idx)}
                        className={`flex-1 h-full first:rounded-l-full last:rounded-r-full transition-all duration-200 cursor-pointer hover:opacity-80 ${colorClass}`} 
                        title={`Soru ${idx + 1}`}
                    />
                )
            })}
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT COLUMN: Question Card */}
          <div className="flex-1 w-full">
            {/* Review Mode Banner */}
            {isReviewMode && (
                <div className="mb-4 p-3 bg-amber-900/20 text-amber-500 border border-amber-500/20 rounded-lg flex items-center justify-center text-sm font-medium animate-fade-in">
                    <Flag className="w-4 h-4 mr-2" />
                    Test İnceleme Modu
                </div>
            )}

            {/* Question Card */}
            <div className={`rounded-2xl shadow-xl p-6 md:p-8 border relative ${cardBg} min-h-[400px] flex flex-col`}>
                
                {/* Flag Button (Inside Card) */}
                <button 
                    onClick={toggleMarkQuestion}
                    className={`absolute top-4 right-4 p-2 rounded-lg transition-colors border ${
                        isMarked 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                        : 'bg-slate-800/50 border-transparent text-slate-600 hover:text-slate-400'
                    }`}
                    title={isMarked ? "İşareti Kaldır" : "Soruyu İşaretle"}
                >
                    <Flag className={`w-5 h-5 ${isMarked ? 'fill-current' : ''}`} />
                </button>

                <h2 className={`text-lg md:text-xl font-medium mb-8 leading-relaxed pr-8 ${textColor}`}>
                    {currentQuestion.text}
                </h2>

                <div className="space-y-3 flex-grow">
                    {currentQuestion.options.map((option, idx) => {
                        let optionClass = `w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group `;
                        
                        const isSelected = selectedAnswer === option;
                        const isCorrect = option === currentQuestion.correctAnswer;
                        
                        if (isReviewMode) {
                            if (isCorrect) {
                                optionClass += "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
                            } else if (isSelected && !isCorrect) {
                                optionClass += "border-red-500/50 bg-red-500/10 text-red-400";
                            } else {
                                optionClass += "border-slate-800 text-slate-600 opacity-50";
                            }
                        } else {
                            // EXAM MODE
                            if (isSelected) {
                                optionClass += "border-indigo-500 bg-indigo-900/20 text-indigo-300 shadow-sm shadow-indigo-500/10";
                            } else {
                                optionClass += "border-slate-800 hover:border-slate-600 hover:bg-slate-800 text-slate-300";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(option)}
                                disabled={isReviewMode}
                                className={optionClass}
                            >
                                <div className="flex items-center">
                                    <span className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold mr-4 transition-colors ${
                                        isReviewMode
                                            ? (isCorrect ? 'bg-emerald-900 text-emerald-300' : (isSelected ? 'bg-red-900 text-red-300' : 'bg-slate-800 text-slate-600'))
                                            : (isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700')
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="font-medium text-sm md:text-base">{option}</span>
                                </div>
                                {isReviewMode && isCorrect && <Check className="w-5 h-5 text-emerald-500" />}
                                {isReviewMode && isSelected && !isCorrect && <X className="w-5 h-5 text-red-500" />}
                            </button>
                        );
                    })}
                </div>

                {/* Footer Actions inside Card (Clear Answer) */}
                {!isReviewMode && selectedAnswer && (
                    <div className="mt-6 flex justify-end pt-4 border-t border-slate-800/50">
                        <button 
                            onClick={handleClearAnswer}
                            className="text-xs text-slate-500 hover:text-red-400 flex items-center transition-colors"
                        >
                            <BookmarkX className="w-4 h-4 mr-1" />
                            Bu soruyu boş bırak
                        </button>
                    </div>
                )}
                
                {/* Explanation Area (Review Mode Only) */}
                {isReviewMode && currentQuestion.explanation && (
                    <div className="mt-6 p-4 border rounded-lg animate-fade-in bg-slate-800/50 border-slate-700">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-indigo-400 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                                <h4 className={`font-semibold text-sm mb-1 ${textColor}`}>Açıklama</h4>
                                <p className={`text-sm leading-relaxed ${subTextColor}`}>{currentQuestion.explanation}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons (Bottom of Left Column) */}
            <div className="mt-6 flex justify-between items-center">
                <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                        currentIndex === 0 
                            ? 'text-slate-700 cursor-not-allowed' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Önceki
                </button>

                <button
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                        currentIndex === questions.length - 1
                        ? 'text-slate-700 cursor-not-allowed bg-slate-800/50 border border-slate-800'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    }`}
                >
                    Sonraki
                    <ArrowRight className="w-5 h-5 ml-2" />
                </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Control Panel / Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
              
              {/* Tool: Jump to Question */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                      <MapPin className="w-3 h-3 mr-2" />
                      Soruya Git
                  </h3>
                  <form onSubmit={handleJumpSubmit} className="flex gap-2">
                      <input 
                          type="number" 
                          min="1" 
                          max={questions.length}
                          placeholder="#"
                          value={jumpInput}
                          onChange={(e) => setJumpInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button 
                        type="submit"
                        disabled={!jumpInput}
                        className="bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-lg px-3 flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                          <CornerDownLeft className="w-4 h-4" />
                      </button>
                  </form>
              </div>

               {/* Tool: Finish Exam (Always Visible) */}
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                      <Target className="w-3 h-3 mr-2" />
                      Sınav İşlemleri
                  </h3>
                  
                  {!isReviewMode ? (
                      <button
                        onClick={handleFinish}
                        className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Sınavı Bitir
                      </button>
                  ) : (
                      <button
                        onClick={onExit}
                        className="w-full flex items-center justify-center px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-lg shadow transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Sonuçlara Dön
                      </button>
                  )}

                  {!isReviewMode && (
                      <button
                        onClick={onExit}
                        className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 font-medium text-xs rounded-lg border border-transparent hover:border-slate-700 transition-colors"
                      >
                        Kaydetmeden Çık
                      </button>
                  )}
               </div>

               {/* Legend / Info */}
               <div className="bg-slate-900/50 border border-slate-800/50 p-4 rounded-xl">
                   <div className="space-y-2 text-xs text-slate-500 font-medium">
                       <div className="flex items-center">
                           <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                           Şu Anki Soru
                       </div>
                       <div className="flex items-center">
                           <div className="w-3 h-3 rounded-full bg-emerald-600 mr-2"></div>
                           Cevaplanmış
                       </div>
                       <div className="flex items-center">
                           <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                           İşaretlenmiş
                       </div>
                       <div className="flex items-center">
                           <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700 mr-2"></div>
                           Boş
                       </div>
                   </div>
               </div>

          </div>

      </div>
    </div>
  );
};

export default QuizView;