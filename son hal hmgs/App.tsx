import React, { useState } from 'react';
import SetupView from './components/SetupView';
import QuizView from './components/QuizView';
import ResultsView from './components/ResultsView';
import AnalysisView from './components/AnalysisView';
import { Question, QuizState, ExamResult } from './types';

type ViewState = 'SETUP' | 'QUIZ' | 'RESULTS' | 'ANALYSIS';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('SETUP');
  const [isReviewMode, setIsReviewMode] = useState(false);
  
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    answers: {},
    isFinished: false
  });

  // Fisher-Yates Shuffle Algorithm
  const shuffleArray = (array: Question[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleStartQuiz = (allQuestions: Question[], limit: number) => {
    // 1. Soruları karıştır (Shuffle)
    const shuffledQuestions = shuffleArray(allQuestions);
    
    // 2. İstenilen sayı kadar soruyu al
    const examQuestions = shuffledQuestions.slice(0, limit);
    
    setQuizState({
      questions: examQuestions,
      currentIndex: 0,
      score: 0,
      answers: {},
      isFinished: false
    });
    setIsReviewMode(false);
    setView('QUIZ');
  };

  const saveExamResult = (questions: Question[], answers: Record<string, string>, correctCount: number) => {
    const totalQuestions = questions.length;
    // Score out of 100
    const scoreRaw = (correctCount / totalQuestions) * 100;
    const score = Math.round(scoreRaw * 10) / 10;

    // Calculate category breakdown
    const categoryStats: Record<string, { total: number; correct: number }> = {};
    
    questions.forEach(q => {
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { total: 0, correct: 0 };
      }
      categoryStats[q.category].total += 1;
      
      if (answers[q.id] === q.correctAnswer) {
        categoryStats[q.category].correct += 1;
      }
    });

    const newResult: ExamResult = {
      id: Date.now().toString(),
      date: Date.now(),
      totalQuestions,
      correctCount,
      score,
      categoryStats
    };

    // Save to LocalStorage
    try {
      const existingHistoryStr = localStorage.getItem('hmgs_history');
      const existingHistory: ExamResult[] = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
      const updatedHistory = [...existingHistory, newResult];
      localStorage.setItem('hmgs_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save exam history", e);
    }
  };

  const handleQuizComplete = (answers: Record<string, string>) => {
    // Raw score calculation (number of correct answers)
    let correctCount = 0;
    quizState.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    // Save Stats
    saveExamResult(quizState.questions, answers, correctCount);

    setQuizState(prev => ({
      ...prev,
      answers,
      score: correctCount,
      isFinished: true
    }));
    setView('RESULTS');
  };

  const handleReviewQuiz = () => {
    setIsReviewMode(true);
    setView('QUIZ');
  };

  const handleRestart = () => {
    setView('SETUP');
    setIsReviewMode(false);
    setQuizState({
      questions: [],
      currentIndex: 0,
      score: 0,
      answers: {},
      isFinished: false
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {view === 'SETUP' && (
        <SetupView 
          onStartQuiz={handleStartQuiz} 
          onOpenAnalysis={() => setView('ANALYSIS')}
        />
      )}
      
      {view === 'QUIZ' && (
        <QuizView 
          questions={quizState.questions} 
          initialAnswers={quizState.answers}
          isReviewMode={isReviewMode}
          onComplete={handleQuizComplete}
          onExit={handleRestart}
        />
      )}

      {view === 'RESULTS' && (
        <ResultsView 
          quizState={quizState} 
          onRestart={handleRestart} 
          onReview={handleReviewQuiz}
        />
      )}

      {view === 'ANALYSIS' && (
        <AnalysisView onBack={() => setView('SETUP')} />
      )}
    </div>
  );
};

export default App;