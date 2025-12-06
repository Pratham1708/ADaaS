import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ExportReportButton from '../../../components/ExportReportButton';
import {
    Database, AlertTriangle, CheckCircle, FileText, TrendingUp,
    Activity, BarChart3, Brain, Loader2, Play, Clock
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function SummaryPageContent() {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!dataset_id) return;

        const fetchData = async () => {
            try {
                // Fetch analysis data
                const analysisResponse = await axios.post(`${API_URL}/api/v1/datasets/analyze-smart/${dataset_id}`);
                setAnalysisData(analysisResponse.data);

                // Fetch recent jobs
                try {
                    const jobsResponse = await axios.get(`${API_URL}/api/v1/jobs`);
                    // Filter jobs for this dataset
                    const datasetJobs = jobsResponse.data.filter((job: any) =>
                        job.params?.dataset_id === dataset_id
                    ).slice(0, 5); // Get last 5 jobs
                    setRecentJobs(datasetJobs);
                } catch (jobErr) {
                    console.log('Could not fetch jobs:', jobErr);
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load analysis');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dataset_id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Loading Summary...</h2>
                    <p className="text-gray-600 mt-2">Analyzing your data with Gemini AI</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-danger">Error</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    const geminiInsights = analysisData?.gemini_insights || {};
    const metadata = analysisData?.metadata || {};
    const datasetType = analysisData?.dataset_type || 'unknown';

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                            <Database className="w-10 h-10 text-primary" />
                            Dataset Summary
                        </h1>
                        <p className="text-gray-600 mt-2">Dataset ID: {dataset_id}</p>
                        {datasetType && datasetType !== 'unknown' && (
                            <p className="text-sm text-primary font-semibold mt-1 capitalize">
                                Type: {datasetType.replace(/_/g, ' ')}
                            </p>
                        )}
                    </div>

                    {/* Export Buttons */}
                    <div className="flex gap-3">
                        <ExportReportButton
                            datasetId={dataset_id as string}
                            analysisType={datasetType === 'mortality_table' ? 'mortality' : 'survival'}
                            format="pdf"
                            variant="primary"
                            size="md"
                        />
                        <ExportReportButton
                            datasetId={dataset_id as string}
                            analysisType={datasetType === 'mortality_table' ? 'mortality' : 'survival'}
                            format="docx"
                            variant="outline"
                            size="md"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="kpi-card bg-primary-light border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-primary-dark mb-1">Total Rows</h3>
                            <p className="text-3xl font-bold text-gray-900">
                                {metadata.rows?.toLocaleString() || 'N/A'}
                            </p>
                        </div>
                        <Database className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <div className="kpi-card bg-secondary-light border-secondary">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-secondary-dark mb-1">Columns</h3>
                            <p className="text-3xl font-bold text-gray-900">
                                {metadata.columns || 'N/A'}
                            </p>
                        </div>
                        <FileText className="w-12 h-12 text-secondary" />
                    </div>
                </div>

                <div className="kpi-card bg-accent-light border-accent">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-accent-dark mb-1">Missing Values</h3>
                            <p className="text-3xl font-bold text-gray-900">
                                {metadata.missing_values?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-accent" />
                    </div>
                </div>

                <div className="kpi-card bg-purple-light border-purple">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-purple-dark mb-1">Data Quality</h3>
                            <p className="text-3xl font-bold text-gray-900">
                                {geminiInsights.data_quality?.completeness_score || 'N/A'}%
                            </p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-purple" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Play className="w-6 h-6 text-primary" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/survival/${dataset_id}`)}
                        className="btn-outline flex items-center justify-center gap-2 py-4"
                    >
                        <Activity className="w-5 h-5" />
                        Survival Analysis
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/glm/${dataset_id}`)}
                        className="btn-outline flex items-center justify-center gap-2 py-4"
                    >
                        <BarChart3 className="w-5 h-5" />
                        GLM Pricing
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/ml-survival/${dataset_id}`)}
                        className="btn-outline flex items-center justify-center gap-2 py-4"
                    >
                        <Brain className="w-5 h-5" />
                        ML Models
                    </button>
                    {datasetType === 'time_series' && (
                        <button
                            onClick={() => router.push(`/dashboard/timeseries/${dataset_id}`)}
                            className="btn-outline flex items-center justify-center gap-2 py-4 border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                            <TrendingUp className="w-5 h-5" />
                            Time Series
                        </button>
                    )}
                    <button
                        onClick={() => router.push(`/dashboard/workspace/${dataset_id}`)}
                        className="btn-outline flex items-center justify-center gap-2 py-4"
                    >
                        <Database className="w-5 h-5" />
                        Explore Data
                    </button>
                </div>
            </div>

            {/* AI Insights Summary */}
            {analysisData?.ai_powered && geminiInsights.description && (
                <div className="card bg-secondary-light border-2 border-secondary mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-6 h-6 text-secondary" />
                        <h2 className="text-2xl font-bold text-gray-900">AI-Powered Insights</h2>
                        <span className="px-3 py-1 bg-secondary text-white rounded-full text-sm font-semibold">
                            GEMINI AI
                        </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">{geminiInsights.description}</p>
                    {geminiInsights.key_insights && geminiInsights.key_insights.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Key Insights:</h3>
                            <ul className="space-y-2">
                                {geminiInsights.key_insights.slice(0, 3).map((insight: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                        <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                            {geminiInsights.key_insights.length > 3 && (
                                <button
                                    onClick={() => router.push(`/dashboard/ai-insights/${dataset_id}`)}
                                    className="text-secondary font-semibold mt-3 hover:underline"
                                >
                                    View all insights →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Recent Jobs */}
            {recentJobs.length > 0 && (
                <div className="card">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-primary" />
                        Recent Analysis Jobs
                    </h2>
                    <div className="space-y-3">
                        {recentJobs.map((job: any) => (
                            <div
                                key={job.job_id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 capitalize">
                                        {job.analysis_type?.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-sm text-gray-600">Job ID: {job.job_id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${job.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : job.status === 'failed'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {job.status}
                                    </span>
                                    {job.status === 'completed' && (
                                        <button
                                            onClick={() => {
                                                if (job.analysis_type === 'glm') {
                                                    router.push(`/glm-dashboard/${job.job_id}?dataset_id=${dataset_id}`);
                                                } else if (job.analysis_type === 'timeseries') {
                                                    router.push(`/timeseries-dashboard/${job.job_id}`);
                                                }
                                            }}
                                            className="btn-primary text-sm"
                                        >
                                            View Results
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SummaryPage() {
    const router = useRouter();
    const { dataset_id } = router.query;

    return (
        <ProtectedRoute>
            {dataset_id && (
                <DashboardLayout datasetId={dataset_id as string}>
                    <SummaryPageContent />
                </DashboardLayout>
            )}
        </ProtectedRoute>
    );
}
