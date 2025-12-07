import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

interface ExportReportButtonProps {
    jobId?: string;
    datasetId?: string;
    analysisType?: 'survival' | 'glm' | 'ml_survival' | 'mortality' | 'timeseries' | 'chainladder';
    format?: 'pdf' | 'docx';
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const ExportReportButton: React.FC<ExportReportButtonProps> = ({
    jobId,
    datasetId,
    analysisType,
    format = 'pdf',
    variant = 'primary',
    size = 'md',
    className = '',
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExportReport = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            let url: string;

            if (jobId) {
                // Generate report from job ID
                url = `${API_BASE}/api/v1/analysis/report/${jobId}?format=${format}`;
            } else if (datasetId && analysisType) {
                // Generate report by running analysis
                url = `${API_BASE}/api/v1/analysis/${analysisType}/report?dataset_id=${datasetId}&format=${format}`;
            } else {
                throw new Error('Either jobId or (datasetId + analysisType) must be provided');
            }

            const response = await fetch(url, {
                method: jobId ? 'GET' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to generate report' }));
                throw new Error(errorData.detail || 'Failed to generate report');
            }

            // Download the file
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Get filename from Content-Disposition header or create default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `report_${Date.now()}.${format}`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

        } catch (err: any) {
            console.error('Report generation error:', err);
            setError(err.message || 'Failed to generate report');
        } finally {
            setIsGenerating(false);
        }
    };

    // Variant styles
    const variantStyles = {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl',
        secondary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    };

    // Size styles
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24,
    };

    return (
        <div className="relative">
            <button
                onClick={handleExportReport}
                disabled={isGenerating}
                className={`
          inline-flex items-center gap-2 rounded-lg font-semibold
          transition-all duration-200 transform hover:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
                title={`Export ${format.toUpperCase()} Report`}
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={iconSizes[size]} className="animate-spin" />
                        <span>Generating...</span>
                    </>
                ) : (
                    <>
                        {format === 'pdf' ? (
                            <FileText size={iconSizes[size]} />
                        ) : (
                            <Download size={iconSizes[size]} />
                        )}
                        <span>Export AI Report ({format.toUpperCase()})</span>
                    </>
                )}
            </button>

            {error && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[300px] p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg z-10">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportReportButton;
