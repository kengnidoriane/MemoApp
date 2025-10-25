import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ProgressChartProps {
  data?: {
    totalReviews: number;
    averageRetention: number;
    streakDays: number;
    memosLearned: number;
    difficultMemos: string[];
  };
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No progress data available
      </div>
    );
  }

  // Create chart data based on learning progress
  const chartData = [
    {
      name: 'Learned',
      value: data.memosLearned,
      color: '#10B981', // green
    },
    {
      name: 'In Progress',
      value: Math.max(0, data.totalReviews - data.memosLearned),
      color: '#F59E0B', // amber
    },
    {
      name: 'Difficult',
      value: data.difficultMemos.length,
      color: '#EF4444', // red
    },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            {data.name}: {data.value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {((data.value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Start Learning!</p>
          <p className="text-sm">Create some memos and take quizzes to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }} className="text-sm font-medium">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Progress Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.round(data.averageRetention * 100)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.streakDays}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;