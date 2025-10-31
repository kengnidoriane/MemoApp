import React from 'react';
import { PerformanceDashboard } from './PerformanceDashboard';

export const PerformanceTest: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Monitoring Test</h1>
      <PerformanceDashboard />
    </div>
  );
};