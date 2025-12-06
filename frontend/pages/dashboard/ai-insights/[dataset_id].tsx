import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import NaturalLanguageQuery from '../../../components/NaturalLanguageQuery';
import DataQualityCleaning from '../../../components/DataQualityCleaning';
import RecommendedChart from '../../../components/RecommendedChart';
import {
    Bot, TrendingUp, CheckCircle, FileText, BarChart3, AlertTriangle, Loader2, Database
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function AIInsightsPageContent() {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [datasetData, setDatasetData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!dataset_id) return;

        const fetchData = async () => {
            try {
                // Fetch analysis data
                const analysisResponse = await axios.post(`${API_URL}/api/v1/datasets/analyze-smart/${dataset_id}`);
                setAnalysisData(analysisResponse.data);

                // Fetch raw dataset for recommended charts
                try {
                    const dataResponse = await axios.get(`${API_URL}/api/v1/datasets/${dataset_id}/data`);
                    if (dataResponse.data && Array.isArray(dataResponse.data)) {
                        setDatasetData(dataResponse.data);
                    }
                } catch (dataErr) {
                    console.log('Could not fetch dataset:', dataErr);
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load AI insights');
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
                    <h2 className="text-2xl font-bold text-gray-800">Loading AI Insights...</h2>
                    <p className="text-gray-600 mt-2">Analyzing with Gemini AI</p>
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
    const recommendedGraphs = geminiInsights?.recommended_graphs || [];

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <Bot className="w-10 h-10 text-primary" />
                    AI Insights & Analysis
                </h1>
                <p className="text-gray-600 mt-2">Gemini AI-powered dataset analysis and recommendations</p>
            </div>

            {/* Gemini AI Insights */}
            {analysisData?.ai_powered && (
                <div className="card bg-secondary-light border-2 border-secondary mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Bot className="w-8 h-8 text-secondary" />
                        <h2 className="text-2xl font-bold text-gray-900">Gemini AI Analysis</h2>
                        <span className="px-3 py-1 bg-secondary text-white rounded-full text-sm font-semibold">
                            AI POWERED
                        </span>
                    </div>

                    {geminiInsights.description && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-secondary-dark mb-2 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Description
                            </h3>
                            <p className="text-gray-700 leading-relaxed">{geminiInsights.description}</p>
                        </div>
                    )}

                    {geminiInsights.key_insights && geminiInsights.key_insights.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-secondary-dark mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Key Insights
                            </h3>
                            <ul className="space-y-2">
                                {geminiInsights.key_insights.map((insight: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                        <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {geminiInsights.business_insights && geminiInsights.business_insights.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-secondary-dark mb-3 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Business Insights
                            </h3>
                            <ul className="space-y-2">
                                {geminiInsights.business_insights.map((insight: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700 font-medium">
                                        <TrendingUp className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {geminiInsights.recommended_analysis && geminiInsights.recommended_analysis.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-dark mb-3">Recommended Analysis</h3>
                            <div className="flex flex-wrap gap-2">
                                {geminiInsights.recommended_analysis.map((analysis: string, idx: number) => (
                                    <span key={idx} className="px-4 py-2 bg-secondary text-white rounded-full text-sm font-medium">
                                        {analysis}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Column Details with AI Descriptions */}
            {geminiInsights.column_purposes && Object.keys(geminiInsights.column_purposes).length > 0 && (
                <div className="card bg-purple-light border-2 border-purple mb-8">
                    <h2 className="text-2xl font-bold text-purple-dark mb-6 flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        AI Column Descriptions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(geminiInsights.column_purposes).map(([column, purpose]: [string, any]) => (
                            <div key={column} className="bg-white p-4 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-purple-dark mb-2 flex items-center gap-2">
                                    <Database className="w-4 h-4" />
                                    {column}
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed">{purpose}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Quality & Cleaning Section */}
            {metadata.column_names && metadata.column_names.length > 0 && (
                <DataQualityCleaning datasetId={dataset_id as string} />
            )}

            {/* Natural Language Query Section */}
            {metadata.column_names && metadata.column_names.length > 0 && (
                <NaturalLanguageQuery
                    datasetId={dataset_id as string}
                    datasetColumns={metadata.column_names}
                />
            )}

            {/* Recommended Visualizations */}
            {recommendedGraphs.length > 0 && datasetData.length > 0 && (
                <div className="mb-8">
                    <RecommendedChart graphs={recommendedGraphs} data={datasetData} />
                </div>
            )}

            {/* Data Quality Assessment */}
            {geminiInsights.data_quality && (
                <div className="card bg-accent-light border-2 border-accent">
                    <h2 className="text-2xl font-bold text-accent-dark mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Data Quality Assessment
                    </h2>

                    {geminiInsights.data_quality.strengths && geminiInsights.data_quality.strengths.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-secondary mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Strengths
                            </h3>
                            <ul className="space-y-2">
                                {geminiInsights.data_quality.strengths.map((strength: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-secondary">
                                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <span>{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {geminiInsights.data_quality.issues && geminiInsights.data_quality.issues.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-danger mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Issues
                            </h3>
                            <ul className="space-y-2">
                                {geminiInsights.data_quality.issues.map((issue: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-danger">
                                        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <span>{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AIInsightsPage() {
    const router = useRouter();
    const { dataset_id } = router.query;

    return (
        <ProtectedRoute>
            {dataset_id && (
                <DashboardLayout datasetId={dataset_id as string}>
                    <AIInsightsPageContent />
                </DashboardLayout>
            )}
        </ProtectedRoute>
    );
}
