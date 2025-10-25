import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon,
  DocumentTextIcon,
  DocumentIcon,
  CodeBracketIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useExportData, useExportHistory } from '../../hooks/useAnalytics';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { useToast } from '../../providers/ToastProvider';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'txt' | 'json'>('pdf');
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeProgress, setIncludeProgress] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);

  const { mutate: exportData, isPending: isExporting } = useExportData();
  const { data: exportHistory, refetch: refetchHistory } = useExportHistory();
  const { showToast } = useToast();

  const formatOptions = [
    {
      value: 'pdf' as const,
      label: 'PDF Document',
      description: 'Formatted document with all content',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      value: 'txt' as const,
      label: 'Plain Text',
      description: 'Simple text format for easy reading',
      icon: <DocumentIcon className="w-5 h-5" />,
      color: 'text-gray-600 dark:text-gray-400',
    },
    {
      value: 'json' as const,
      label: 'JSON Data',
      description: 'Structured data for developers',
      icon: <CodeBracketIcon className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
  ];

  const handleExport = () => {
    const options = {
      format: selectedFormat,
      includeCategories,
      includeProgress,
      ...(useCustomDateRange && dateRange.start && dateRange.end && {
        dateRange: {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end),
        },
      }),
    };

    exportData(options, {
      onSuccess: (result) => {
        showToast({
          type: 'success',
          title: 'Export Started',
          message: 'Your data export has been initiated. You can download it from the history below.',
        });
        refetchHistory();
        
        // Auto-download if URL is immediately available
        if (result.downloadUrl) {
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = `memo-app-export-${Date.now()}.${selectedFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      onError: (error) => {
        showToast({
          type: 'error',
          title: 'Export Failed',
          message: 'Failed to export your data. Please try again.',
        });
        console.error('Export error:', error);
      },
    });
  };

  const handleDownload = (downloadUrl: string, format: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `memo-app-export-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Processing</Badge>;
      case 'expired':
        return <Badge variant="error">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Export Your Data
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Export Format
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedFormat === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={selectedFormat === option.value}
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                    className="sr-only"
                  />
                  <div className={`mr-3 ${option.color}`}>
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Include in Export
            </h3>
            <div className="space-y-3">
              <Checkbox
                id="include-categories"
                checked={includeCategories}
                onChange={setIncludeCategories}
                label="Categories and tags"
              />
              <Checkbox
                id="include-progress"
                checked={includeProgress}
                onChange={setIncludeProgress}
                label="Learning progress and statistics"
              />
              <Checkbox
                id="custom-date-range"
                checked={useCustomDateRange}
                onChange={setUseCustomDateRange}
                label="Use custom date range"
              />
            </div>
          </div>

          {/* Date Range */}
          <AnimatePresence>
            {useCustomDateRange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Export History */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Recent Exports
            </h3>
            <Card className="p-4">
              {exportHistory && exportHistory.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {exportHistory.map((export_) => (
                    <div
                      key={export_.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {export_.format.toUpperCase()} Export
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(export_.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(export_.status)}
                        {export_.status === 'completed' && export_.downloadUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(export_.downloadUrl!, export_.format)}
                            className="flex items-center gap-1"
                          >
                            <ArrowDownTrayIcon className="w-3 h-3" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ArrowDownTrayIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No exports yet</p>
                </div>
              )}
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <Spinner size="sm" />
              ) : (
                <ArrowDownTrayIcon className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Start Export'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DataExportModal;