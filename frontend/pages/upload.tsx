import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import {
    Upload, Bot, CheckCircle, AlertTriangle, Loader2, BarChart3,
    FileText, Database, TrendingUp, Sparkles, LayoutDashboard, Briefcase,
    Activity, Shield
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UploadResponse {
    dataset_id: string;
    file_path: string;
    filename: string;
}

interface AnalysisResult {
    dataset_type: string;
    is_valid: boolean;
    issues: string[];
    recommendations: string[];
    metadata: {
        rows: number;
        columns: number;
        column_names: string[];
        missing_values: number;
    };
    gemini_insights?: any;
    ai_powered?: boolean;
}

function UploadPageContent() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [analyzing, setAnalyzing] = useState<boolean>(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadResult(null);
            setAnalysisResult(null);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post<UploadResponse>(
                `${API_URL}/api/v1/datasets/upload`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setUploadResult(response.data);
            await analyzeDataset(response.data.dataset_id);
        } catch (err: any) {
            setError(`Upload failed: ${err.response?.data?.detail || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const analyzeDataset = async (dataset_id: string) => {
        setAnalyzing(true);
        try {
            const response = await axios.post<AnalysisResult>(
                `${API_URL}/api/v1/datasets/analyze-smart/${dataset_id}`
            );
            setAnalysisResult(response.data);
        } catch (err: any) {
            setError(`Analysis failed: ${err.response?.data?.detail || err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleViewDashboard = () => {
        if (uploadResult) {
            router.push(`/dashboard/summary/${uploadResult.dataset_id}`);
        }
    };

    const getDataTypeInfo = (type: string) => {
        const types: Record<string, { label: string; color: string; icon: any }> = {
            funeral_claims: { label: 'Funeral Claims Data', color: 'bg-purple-500', icon: Briefcase },
            clinical_survival: { label: 'Clinical Survival', color: 'bg-blue-500', icon: Activity },
            insurance_survival: { label: 'Insurance Survival', color: 'bg-cyan-500', icon: Shield },
            survival_analysis: { label: 'Survival Analysis', color: 'bg-green-500', icon: TrendingUp },
            mortality_table: { label: 'Mortality Table', color: 'bg-red-500', icon: FileText },
            claims_triangle: { label: 'Claims Triangle', color: 'bg-orange-500', icon: BarChart3 },
            unknown: { label: 'Unknown Type', color: 'bg-gray-500', icon: Database },
        };
        return types[type] || types.unknown;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light rounded-full mb-4">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Powered by Google Gemini AI</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                        Upload Your Dataset
                    </h1>
                    <p className="text-xl text-gray-600">
                        Upload your CSV for intelligent actuarial analysis
                    </p>
                </div>

                {/* Upload Section */}
                <div className="glass-card mb-8">
                    <div className="border-2 border-dashed border-primary rounded-xl p-8 text-center bg-primary-light/30">
                        <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="mb-4 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer"
                        />
                        {file && (
                            <p className="text-sm text-gray-700 mb-4">
                                Selected: <span className="font-semibold">{file.name}</span>
                            </p>
                        )}
                        <button
                            onClick={handleUpload}
                            disabled={loading || !file}
                            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : analyzing ? (
                                <>
                                    <Bot className="w-5 h-5" />
                                    Analyzing with Gemini AI...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Upload & Analyze
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="card bg-danger-light border-2 border-danger mb-8 animate-slide-up">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-danger mb-1">Error</h3>
                                <p className="text-danger">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Results */}
                {analysisResult && (
                    <div className="card bg-secondary-light border-2 border-secondary animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <Bot className="w-8 h-8 text-secondary" />
                            <h2 className="text-2xl font-bold text-gray-900">
                                {analysisResult.ai_powered ? 'Gemini AI Analysis' : 'Analysis Complete'}
                            </h2>
                            {analysisResult.ai_powered && (
                                <span className="px-3 py-1 bg-secondary text-white rounded-full text-sm font-semibold">
                                    AI POWERED
                                </span>
                            )}
                        </div>

                        {/* Dataset Type */}
                        {(() => {
                            const typeInfo = getDataTypeInfo(analysisResult.dataset_type);
                            const TypeIcon = typeInfo.icon;
                            return (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Detected Type:</h3>
                                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${typeInfo.color} text-white font-bold text-lg`}>
                                        <TypeIcon className="w-6 h-6" />
                                        {typeInfo.label}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Status */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">Status:</span>
                                {analysisResult.is_valid ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                                        <CheckCircle className="w-4 h-4" />
                                        VALID
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                                        <AlertTriangle className="w-4 h-4" />
                                        INVALID
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Database className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold text-gray-700">Rows</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{analysisResult.metadata.rows.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-secondary" />
                                    <span className="text-sm font-semibold text-gray-700">Columns</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{analysisResult.metadata.columns}</p>
                            </div>
                        </div>

                        {/* Column Names */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Column Names:</h3>
                            <div className="flex flex-wrap gap-2">
                                {analysisResult.metadata.column_names.map((col, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Gemini Insights */}
                        {analysisResult.gemini_insights && (
                            <div className="bg-white p-6 rounded-xl border-2 border-secondary mb-6">
                                <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    Gemini AI Insights
                                </h3>
                                {analysisResult.gemini_insights.description && (
                                    <p className="text-gray-700 mb-4 leading-relaxed">
                                        <strong>Description:</strong> {analysisResult.gemini_insights.description}
                                    </p>
                                )}
                                {analysisResult.gemini_insights.key_insights && (
                                    <div>
                                        <strong className="text-gray-900 mb-2 block">Key Insights:</strong>
                                        <ul className="space-y-2">
                                            {analysisResult.gemini_insights.key_insights.map((insight: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-gray-700">
                                                    <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                                                    <span>{insight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* View Dashboard Button */}
                        {analysisResult.is_valid && (
                            <div className="text-center">
                                <button
                                    onClick={handleViewDashboard}
                                    className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 shadow-strong hover-lift"
                                >
                                    <LayoutDashboard className="w-6 h-6" />
                                    View Interactive Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Link */}
                <div className="text-center mt-8">
                    <a
                        href="/jobs"
                        className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                    >
                        <Briefcase className="w-5 h-5" />
                        View All Jobs
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function UploadPage() {
    return (
        <ProtectedRoute>
            <UploadPageContent />
        </ProtectedRoute>
    );
}
