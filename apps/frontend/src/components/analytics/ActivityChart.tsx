import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ActivityTrend } from '@memo-app/shared/types';

interface ActivityChartProps {
  data: ActivityTrend[];
  period: 'week' | 'month' | 'year';
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data, period }) => {
  const formatXAxisLabel = (dateString: string) => {
    const date = parseISO(dateString);
    switch (period) {
      case 'week':
        return format(date, 'EEE'); // Mon, Tue, etc.
      case 'month':
        return format(date, 'MMM d'); // Jan 1, Jan 2, etc.
      case 'year':
        return format(date, 'MMM'); // Jan, Feb, etc.
      default:
        return format(date, 'MMM d');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = parseISO(label);
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-2">
            {format(date, 'PPP')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Activity Data</p>
          <p className="text-sm">Start creating memos and taking quizzes to see your activity trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            className="text-xs text-gray-600 dark:text-gray-400"
          />
          <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="memosCreated"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Memos Created"
          />
          <Line
            type="monotone"
            dataKey="quizzesCompleted"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Quizzes Completed"
          />
          <Line
            type="monotone"
            dataKey="reviewsCompleted"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Reviews Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityChart;