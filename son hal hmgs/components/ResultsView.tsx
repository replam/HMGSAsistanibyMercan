import React from 'react';
import { QuizState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { RotateCcw, Award, CheckCircle, XCircle, MinusCircle, Eye } from 'lucide-react';

interface ResultsViewProps {
  quizState: QuizState;
  onRestart: () => void;
  onReview: () => void;
}

const COLORS = ['#10b981', '#ef4444', '#64748b']; // Green, Red, Slate-500 (Empty)

const ResultsView: React.FC<ResultsViewProps> = ({ quizState, onRestart, onReview }) => {
  const { questions, answers, score } = quizState;
  
  // Calculate stats
  const totalQuestions = questions.length;
  const correctCount = score;
  const answeredCount = Object.keys(answers).length;
  const emptyCount = totalQuestions - answeredCount;
  const incorrectCount = answeredCount - correctCount;

  // Dynamic Score Calculation
  // Total possible score is always 100.
  // Value per question = 100 / totalQuestions
  const scorePerQuestion = 100 / totalQuestions;
  const finalScoreRaw = correctCount * scorePerQuestion;
  // Format to max 1 decimal place if needed, or integer if whole
  const finalScore = Math.round(finalScoreRaw * 10) / 10;

  const performanceData = [
    { name: 'Doğru', value: correctCount },
    { name: 'Yanlış', value: incorrectCount },
    { name: 'Boş', value: emptyCount },
  ];

  // Grading Logic
  let gradeText = "";
  let gradeColor = "";
  
  if (finalScore >= 0 && finalScore < 25) {
      gradeText = "Kötü";
      gradeColor = "text-red-500";
  } else if (finalScore >= 25 && finalScore < 50) {
      gradeText = "Mehh";
      gradeColor = "text-orange-500";
  } else if (finalScore >= 50 && finalScore < 75) {
      gradeText = "Vasat";
      gradeColor = "text-yellow-500";
  } else {
      gradeText = "Güzel";
      gradeColor = "text-emerald-500";
  }

  // Category Breakdown
  const categoryStats: Record<string, { total: number; correct: number; incorrect: number; empty: number }> = {};
  
  questions.forEach(q => {
    if (!categoryStats[q.category]) {
      categoryStats[q.category] = { total: 0, correct: 0, incorrect: 0, empty: 0 };
    }
    categoryStats[q.category].total += 1;
    
    const givenAnswer = answers[q.id];
    if (!givenAnswer) {
        categoryStats[q.category].empty += 1;
    } else if (givenAnswer === q.correctAnswer) {
        categoryStats[q.category].correct += 1;
    } else {
        categoryStats[q.category].incorrect += 1;
    }
  });

  const categoryChartData = Object.keys(categoryStats).map(cat => ({
    name: cat,
    Doğru: categoryStats[cat].correct,
    Yanlış: categoryStats[cat].incorrect,
    Boş: categoryStats[cat].empty
  }));

  const cardClass = 'bg-slate-900 border-slate-800 text-slate-100';
  const subTextClass = 'text-slate-400';

  return (
    <div className="max-w-4xl mx-auto p-6 pt-12 animate-fade-in">
      <div className={`rounded-2xl shadow-2xl p-8 mb-8 border ${cardClass}`}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 rounded-full mb-4 bg-indigo-900/30 border border-indigo-500/20">
            <Award className="w-12 h-12 text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold text-white">Sınav Tamamlandı</h2>
          <p className={`mt-2 ${subTextClass}`}>HMGS deneme performans analizin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Main Score Card */}
          <div className="col-span-1 rounded-xl p-6 flex flex-col items-center justify-center border bg-slate-950 border-slate-800 shadow-inner">
            <span className={`text-sm uppercase tracking-wide font-semibold ${subTextClass}`}>Toplam Puan</span>
            <span className={`text-6xl font-black mt-2 ${gradeColor}`}>
              {finalScore}
            </span>
            <span className={`text-xl font-bold mt-1 ${gradeColor}`}>{gradeText}</span>
            <span className={`text-sm mt-4 ${subTextClass}`}>{correctCount} Doğru / {totalQuestions} Soru</span>
          </div>

          {/* Pie Chart */}
          <div className="col-span-1 h-64">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }}/>
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
             </ResponsiveContainer>
          </div>

           {/* Detailed Breakdown */}
           <div className="col-span-1 flex flex-col justify-center space-y-4">
              <div className="flex items-center space-x-3 text-emerald-400 bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/20">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Doğru: {correctCount}</span>
              </div>
              <div className="flex items-center space-x-3 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Yanlış: {incorrectCount}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <MinusCircle className="w-5 h-5" />
                <span className="font-medium">Boş: {emptyCount}</span>
              </div>
           </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-8">
            <h3 className="text-lg font-bold mb-6 text-slate-200">Alanlara Göre Performans</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fill: '#cbd5e1'}} stroke="none" />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="Doğru" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Yanlış" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Boş" stackId="a" fill="#64748b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">
            <button
                onClick={onReview}
                className="inline-flex items-center justify-center px-8 py-3 font-semibold rounded-lg shadow-lg transition-colors duration-200 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            >
                <Eye className="w-5 h-5 mr-2" />
                Soruları İncele
            </button>
            <button
                onClick={onRestart}
                className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 transition-colors duration-200"
            >
                <RotateCcw className="w-5 h-5 mr-2" />
                Yeni Sınav Başlat
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;