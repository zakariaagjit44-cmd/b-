import React from 'react';

interface ScoreCardProps {
  score: number;
  feedback: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ score, feedback }) => {
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  }

  return (
    <div className="p-4 sm:p-6 bg-blue-50 border-t border-gray-200 animate-fade-in-up">
      <h3 className="text-lg font-bold text-center text-gray-700 mb-4">التقييم النهائي</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28" viewBox="0 0 100 100">
            <circle
              className="text-gray-200"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
            />
            <circle
              className={`${getScoreColor()} transition-all duration-1000 ease-out`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <span className={`absolute text-3xl font-bold ${getScoreColor()}`}>{score}</span>
        </div>
        <div className="flex-1 text-center sm:text-right">
          <p className="text-sm text-gray-600 leading-relaxed">{feedback}</p>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
