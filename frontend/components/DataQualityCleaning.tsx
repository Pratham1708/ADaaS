import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    AlertTriangle, CheckCircle, Sparkles, TrendingUp, Download,
    RefreshCw, ChevronDown, ChevronUp, Zap, Info
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com';

interface Recommendation {
    id: string;
    type: string;
    column: string;
    issue: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
    method: string;
}

interface QualityAnalysis {
    dataset_info: {
        rows: number;
        columns: number;
        column_names: string[];
    };
    quality_score: number;
    issues: {
        missing_values: any[];
        outliers: any[];
        skewness: any[];
        type_issues: any[];
        encoding_issues: any[];
    };
    recommendations: Recommendation[];
    gemini_insights: {
        available: boolean;
        summary?: string;
        priority_actions?: string[];
        business_impact?: string;
    };
}

interface DataQualityCleaningProps {
    datasetId: string;
}

const DataQualityCleaning: React.FC<DataQualityCleaningProps> = ({ datasetId }) => {
    const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRecs, setSelectedRecs] = useState<Set<string>>(new Set());
    const [applying, setApplying] = useState(false);
    const [cleaningResult, setCleaningResult] = useState<any>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['recommendations']));

    useEffect(() => {
        fetchQualityAnalysis();
    }, [datasetId]);

    const fetchQualityAnalysis = async () => {
        try {
            setLoading(true);
            setError('');
            // Use cleaned dataset ID if available, otherwise use original ID
            const targetId = cleaningResult?.cleaned_dataset_id || datasetId;
            console.log('[Data Quality] Fetching analysis for:', targetId);

            const response = await axios.get(`${API_URL}/api/v1/datasets/${targetId}/data-quality`);
            setAnalysis(response.data);

            // Auto-select high priority recommendations
            const highPriority = response.data.recommendations
                .filter((r: Recommendation) => r.priority === 'high')
                .map((r: Recommendation) => r.id);
            setSelectedRecs(new Set(highPriority));

            console.log('[Data Quality] Analysis loaded:', response.data);
        } catch (err: any) {
            console.error('[Data Quality] Error:', err);
            setError(err.response?.data?.detail || 'Failed to analyze data quality');
        } finally {
            setLoading(false);
        }
    };

    const toggleRecommendation = (recId: string) => {
        const newSelected = new Set(selectedRecs);
        if (newSelected.has(recId)) {
            newSelected.delete(recId);
        } else {
            newSelected.add(recId);
        }
        setSelectedRecs(newSelected);
    };

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const applyTransformations = async () => {
        if (selectedRecs.size === 0) {
            alert('Please select at least one transformation to apply');
            return;
        }

        try {
            setApplying(true);
            console.log('[Data Quality] Applying transformations:', Array.from(selectedRecs));

            const response = await axios.post(`${API_URL}/api/v1/datasets/${datasetId}/apply-cleaning`, {
                transformations: Array.from(selectedRecs),
                recommendations: analysis?.recommendations || []
            });

            setCleaningResult(response.data);
            console.log('[Data Quality] Cleaning completed:', response.data);

            // Remove applied recommendations from the list
            if (analysis) {
                const remainingRecommendations = analysis.recommendations.filter(
                    rec => !selectedRecs.has(rec.id)
                );
                setAnalysis({
                    ...analysis,
                    recommendations: remainingRecommendations
                });
            }

            // Clear selection
            setSelectedRecs(new Set());

            // Show success message
            alert(`Data cleaning completed!\n\nQuality Score: ${response.data.quality_improvement.before_score} → ${response.data.quality_improvement.after_score}\n\nCleaned dataset ID: ${response.data.cleaned_dataset_id}`);
        } catch (err: any) {
            console.error('[Data Quality] Cleaning error:', err);
            alert(`Cleaning failed: ${err.response?.data?.detail || err.message}`);
        } finally {
            setApplying(false);
        }
    };

    const downloadCleanedDataset = () => {
        if (cleaningResult) {
            window.open(`${API_URL}/api/v1/datasets/${cleaningResult.cleaned_dataset_id}/data?download=true`, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
                <div className="flex items-center gap-3 mb-4">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-900">Analyzing Data Quality...</h2>
                </div>
                <p className="text-gray-600">AI is examining your dataset for quality issues...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card bg-red-50 border-2 border-red-300">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <h2 className="text-2xl font-bold text-red-900">Analysis Error</h2>
                </div>
                <p className="text-red-700">{error}</p>
                <button onClick={fetchQualityAnalysis} className="btn-primary mt-4">
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Retry Analysis
                </button>
            </div>
        );
    }

    if (!analysis) return null;

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            high: 'bg-red-100 text-red-800 border-red-300',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            low: 'bg-blue-100 text-blue-800 border-blue-300'
        };
        return colors[priority as keyof typeof colors] || colors.low;
    };

    const totalIssues =
        analysis.issues.missing_values.length +
        analysis.issues.outliers.length +
        analysis.issues.skewness.length +
        analysis.issues.type_issues.length +
        analysis.issues.encoding_issues.length;

    return (
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Data Quality & Cleaning</h2>
                        <p className="text-sm text-gray-600">AI-powered data quality analysis and preprocessing</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                        AI POWERED
                    </span>
                </div>
                <button onClick={fetchQualityAnalysis} className="btn-outline" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Quality Score Card */}
            <div className="bg-white p-6 rounded-lg border-2 border-blue-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Quality Score</h3>
                        <p className={`text-5xl font-bold ${getScoreColor(analysis.quality_score)}`}>
                            {analysis.quality_score}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">out of 100</p>
                    </div>
                    <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Issues Found</h3>
                        <p className="text-5xl font-bold text-orange-600">{totalIssues}</p>
                        <p className="text-sm text-gray-500 mt-1">across {analysis.dataset_info.columns} columns</p>
                    </div>
                    <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Recommendations</h3>
                        <p className="text-5xl font-bold text-blue-600">{analysis.recommendations.length}</p>
                        <p className="text-sm text-gray-500 mt-1">{selectedRecs.size} selected</p>
                    </div>
                </div>
            </div>

            {/* Gemini AI Insights */}
            {analysis.gemini_insights.available && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-purple-900">Gemini AI Insights</h3>
                    </div>

                    {analysis.gemini_insights.summary && (
                        <p className="text-gray-700 mb-4">{analysis.gemini_insights.summary}</p>
                    )}

                    {analysis.gemini_insights.priority_actions && analysis.gemini_insights.priority_actions.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-semibold text-purple-900 mb-2">Priority Actions:</h4>
                            <ul className="space-y-2">
                                {analysis.gemini_insights.priority_actions.map((action, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                        <Zap className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <span>{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysis.gemini_insights.business_impact && (
                        <div className="bg-purple-100 p-4 rounded-lg">
                            <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Business Impact
                            </h4>
                            <p className="text-purple-800 text-sm">{analysis.gemini_insights.business_impact}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Issues Summary */}
            <div className="bg-white p-6 rounded-lg border-2 border-blue-200 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Issues Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-900">Missing Values</span>
                            <span className="text-2xl font-bold text-red-600">{analysis.issues.missing_values.length}</span>
                        </div>
                        <p className="text-xs text-red-700">columns affected</p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-orange-900">Outliers</span>
                            <span className="text-2xl font-bold text-orange-600">{analysis.issues.outliers.length}</span>
                        </div>
                        <p className="text-xs text-orange-700">columns affected</p>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-yellow-900">Skewness</span>
                            <span className="text-2xl font-bold text-yellow-600">{analysis.issues.skewness.length}</span>
                        </div>
                        <p className="text-xs text-yellow-700">columns affected</p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">Type Issues</span>
                            <span className="text-2xl font-bold text-blue-600">{analysis.issues.type_issues.length}</span>
                        </div>
                        <p className="text-xs text-blue-700">columns affected</p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-900">Encoding Issues</span>
                            <span className="text-2xl font-bold text-purple-600">{analysis.issues.encoding_issues.length}</span>
                        </div>
                        <p className="text-xs text-purple-700">columns affected</p>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-lg border-2 border-blue-200 mb-6">
                <div
                    className="flex items-center justify-between cursor-pointer mb-4"
                    onClick={() => toggleSection('recommendations')}
                >
                    <h3 className="text-lg font-bold text-gray-900">Cleaning Recommendations</h3>
                    {expandedSections.has('recommendations') ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                </div>

                {expandedSections.has('recommendations') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysis.recommendations.length === 0 ? (
                            <div className="col-span-full text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                <p className="text-gray-600">No cleaning recommendations - your data quality is excellent!</p>
                            </div>
                        ) : (
                            analysis.recommendations.map((rec) => (
                                <div
                                    key={rec.id}
                                    className={`p-4 rounded-lg border-2 transition-all h-full ${selectedRecs.has(rec.id)
                                        ? 'bg-blue-50 border-blue-400'
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedRecs.has(rec.id)}
                                            onChange={() => toggleRecommendation(rec.id)}
                                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityBadge(rec.priority)}`}>
                                                    {rec.priority.toUpperCase()}
                                                </span>
                                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                                                    {rec.column}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {rec.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 mb-1">
                                                <strong>Issue:</strong> {rec.issue}
                                            </p>
                                            <p className="text-sm text-blue-700 mb-1">
                                                <strong>Action:</strong> {rec.action}
                                            </p>
                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                {rec.impact}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {analysis.recommendations.length > 0 && (
                <div className="flex gap-4">
                    <button
                        onClick={applyTransformations}
                        disabled={applying || selectedRecs.size === 0}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {applying ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Applying Transformations...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                Apply {selectedRecs.size} Selected Transformation{selectedRecs.size !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setSelectedRecs(new Set())}
                        className="btn-outline"
                        disabled={selectedRecs.size === 0}
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            {/* Cleaning Result */}
            {cleaningResult && (
                <div className="mt-6 bg-green-50 p-6 rounded-lg border-2 border-green-300">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-bold text-green-900">Cleaning Completed!</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Before</p>
                            <p className="text-2xl font-bold text-gray-900">{cleaningResult.quality_improvement.before_score}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">After</p>
                            <p className="text-2xl font-bold text-green-600">{cleaningResult.quality_improvement.after_score}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Improvement</p>
                            <p className="text-2xl font-bold text-blue-600">+{cleaningResult.quality_improvement.improvement}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">{cleaningResult.changes_summary}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={downloadCleanedDataset}
                            className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 border-green-600"
                        >
                            <Download className="w-4 h-4" />
                            Download Cleaned Dataset
                        </button>

                        <button
                            onClick={() => window.location.href = `/general-dashboard/${cleaningResult.cleaned_dataset_id}`}
                            className="btn-outline"
                        >
                            Analyze Cleaned Dataset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataQualityCleaning;
