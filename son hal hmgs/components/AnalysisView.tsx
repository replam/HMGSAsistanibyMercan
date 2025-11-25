import React, { useEffect, useState } from 'react';
import { ExamResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowLeft, TrendingUp, CheckCircle, Brain, Target } from 'lucide-react';

interface AnalysisViewProps {
  onBack: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ onBack }) => {
  const [history, setHistory] = useState<ExamResult[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('hmgs_history');
    if (savedHistory) {
      try {
        // Sort by date ascending
        const parsed = JSON.parse(savedHistory) as ExamResult[];
        setHistory(parsed.sort((a, b) => a.date - b.date));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
  }, []);

  // --- Calculations ---

  const totalExams = history.length;
  
  const totalQuestionsSolved = history.reduce((acc, curr) => acc + curr.totalQuestions, 0);
  const totalCorrectAnswers = history.reduce((acc, curr) => acc + curr.correctCount, 0);
  
  const overallAccuracy = totalQuestionsSolved > 0 
    ? Math.round((totalCorrectAnswers / totalQuestionsSolved) * 100) 
    : 0;

  // Category Breakdown
  const categoryAggregates: Record<string, { total: number; correct: number }> = {};

  history.forEach(exam => {
    Object.entries(exam.categoryStats).forEach(([cat, stats]) => {
      // Explicitly typing stats to avoid 'unknown' error
      const s = stats as { total: number; correct: number };
      if (!categoryAggregates[cat]) {
        categoryAggregates[cat] = { total: 0, correct: 0 };
      }
      categoryAggregates[cat].total += s.total;
      categoryAggregates[cat].correct += s.correct;
    });
  });

  const categoryChartData = Object.keys(categoryAggregates).map(cat => ({
    name: cat,
    successRate: Math.round((categoryAggregates[cat].correct / categoryAggregates[cat].total) * 100),
    totalSolved: categoryAggregates[cat].total
  })).sort((a, b) => b.successRate - a.successRate); // Best topics first

  // Progress Over Time (Last 10 exams)
  const progressData = history.slice(-10).map((exam, index) => ({
    name: `Sınav ${index + 1}`,
    puan: exam.score,
    date: new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }));

  const cardClass = "bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl";

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen flex flex-col pt-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center mb-8">
        <button 
          onClick={onBack}
          className="mr-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-indigo-500" />
            Gelişim Analizi
          </h1>
          <p className="text-slate-400 text-sm">Çözdüğün sorulara göre başarı durumun</p>
        </div>
      </div>

      {totalExams === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
          <Brain className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">Henüz analiz yapılacak veri yok.</p>
          <p className="text-slate-500 text-sm mt-2">Biraz soru çözdükten sonra buraya tekrar gel!</p>
          <button onClick={onBack} className="mt-6 text-indigo-400 hover:text-indigo-300 font-medium">
            Soru Çözmeye Başla
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`${cardClass} flex items-center space-x-4`}>
              <div className="p-3 bg-indigo-500/10 rounded-lg">
                <Target className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase">Toplam Soru</p>
                <p className="text-2xl font-bold text-white">{totalQuestionsSolved}</p>
              </div>
            </div>

            <div className={`${cardClass} flex items-center space-x-4`}>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase">Genel Başarı</p>
                <p className="text-2xl font-bold text-emerald-400">%{overallAccuracy}</p>
              </div>
            </div>

            <div className={`${cardClass} flex items-center space-x-4`}>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Brain className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase">Bitirilen Sınav</p>
                <p className="text-2xl font-bold text-white">{totalExams}</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Performance Bar Chart */}
            <div className={`${cardClass} min-h-[400px]`}>
              <h3 className="text-lg font-bold text-slate-200 mb-6 border-b border-slate-800 pb-2">
                Ders Bazlı Başarı Oranı (%)
              </h3>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                    <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" />
                    <Tooltip 
                      cursor={{fill: '#1e293b'}} 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                    />
                    <Bar dataKey="successRate" name="Başarı %" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center italic">
                * En başarılı olduğun dersler en üstte listelenir.
              </p>
            </div>

            {/* Progress Line Chart */}
            <div className={`${cardClass} min-h-[400px]`}>
              <h3 className="text-lg font-bold text-slate-200 mb-6 border-b border-slate-800 pb-2">
                Son Sınav Puanları (100 üzerinden)
              </h3>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis domain={[0, 100]} stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="puan" 
                      name="Puan" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#10b981' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center italic">
                * İlerlemeyi görmek için düzenli soru çözmelisin.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;