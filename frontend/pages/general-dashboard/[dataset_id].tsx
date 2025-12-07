import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import KMChart from '../../components/KMChart';
import RecommendedChart from '../../components/RecommendedChart';
import ProtectedRoute from '../../components/ProtectedRoute';
import ExportReportButton from '../../components/ExportReportButton';
import NaturalLanguageQuery from '../../components/NaturalLanguageQuery';
import DataQualityCleaning from '../../components/DataQualityCleaning';
import {
    BarChart3, Database, AlertTriangle, CheckCircle, Bot,
    TrendingUp, Users, Skull, Clock, FileText, ArrowLeft, Upload, Activity
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com';

function GeneralDashboardContent() {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [survivalData, setSurvivalData] = useState<any>(null);
    const [datasetData, setDatasetData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [glmLoading, setGlmLoading] = useState(false);
    const [glmError, setGlmError] = useState('');
    const [glmSuccess, setGlmSuccess] = useState('');
    const [selectedTarget, setSelectedTarget] = useState('');
    const [selectedFamily, setSelectedFamily] = useState('auto');
    const [tsLoading, setTsLoading] = useState(false);
    const [tsError, setTsError] = useState('');
    const [tsSuccess, setTsSuccess] = useState('');

    useEffect(() => {
        if (!dataset_id) return;

        const fetchData = async () => {
            try {
                // Fetch analysis data
                const analysisResponse = await axios.post(`${API_URL}/api/v1/datasets/analyze-smart/${dataset_id}`);
                setAnalysisData(analysisResponse.data);

                // Fetch survival analysis data
                try {
                    console.log('[INFO] Fetching survival analysis for dataset:', dataset_id);
                    const survivalResponse = await axios.get(`${API_URL}/api/v1/datasets/survival-analysis/${dataset_id}`);
                    console.log('[INFO] Survival response:', survivalResponse.data);

                    if (survivalResponse.data.has_survival_data) {
                        console.log('[INFO] Setting survival data:', survivalResponse.data.survival_analysis);
                        setSurvivalData(survivalResponse.data.survival_analysis);
                    } else {
                        console.log('[INFO] No survival data available:', survivalResponse.data.message);
                    }
                } catch (survErr) {
                    console.log('[INFO] Survival analysis not available for this dataset:', survErr);
                }

                // Fetch raw dataset for recommended charts
                try {
                    const dataResponse = await axios.get(`${API_URL}/api/v1/datasets/${dataset_id}/data`);
                    if (dataResponse.data && Array.isArray(dataResponse.data)) {
                        setDatasetData(dataResponse.data);
                    }
                } catch (dataErr) {
                    console.log('[WARN] Could not fetch dataset for charts:', dataErr);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Loading Dashboard...</h2>
                    <p className="text-gray-600 mt-2">Analyzing your data with Gemini AI</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-danger">Error</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <button onClick={() => router.push('/upload')} className="btn-primary mt-6">
                        <ArrowLeft className="w-5 h-5 inline mr-2" />
                        Back to Upload
                    </button>
                </div>
            </div>
        );
    }

    const geminiInsights = analysisData?.gemini_insights || {};
    const metadata = analysisData?.metadata || {};
    const recommendedGraphs = geminiInsights?.recommended_graphs || [];
    const datasetType = analysisData?.dataset_type || '';

    // Get numeric columns for GLM target selection
    const numericColumns = metadata.column_names?.filter((col: string) => {
        if (!datasetData || datasetData.length === 0) return false;
        const firstValue = datasetData[0][col];
        return typeof firstValue === 'number';
    }) || [];

    // GLM compatibility check - include unknown datasets with enough numeric columns
    const isGlmCompatible =
        ['glm_frequency', 'glm_severity', 'glm_compatible', 'insurance_claims'].includes(datasetType) ||
        (datasetType === 'unknown' && numericColumns.length >= 2);

    // Time-series compatibility check
    const isTimeSeries = datasetType === 'time_series';

    // Debug logging
    console.log('[DEBUG] Dataset Type:', datasetType);
    console.log('[DEBUG] Is GLM Compatible:', isGlmCompatible);
    console.log('[DEBUG] Analysis Data:', analysisData);
    console.log('[DEBUG] Numeric Columns:', numericColumns);
    console.log('[DEBUG] Should show GLM UI:', isGlmCompatible && numericColumns.length > 0);

    const handleRunGLM = async () => {
        if (!selectedTarget) {
            setGlmError('Please select a target column');
            return;
        }

        setGlmLoading(true);
        setGlmError('');
        setGlmSuccess('');

        try {
            const response = await axios.post(`${API_URL}/api/v1/analysis/glm`, {
                dataset_id: dataset_id,
                target_col: selectedTarget,
                family: selectedFamily
            });

            const jobId = response.data.job_id;
            setGlmSuccess(`GLM analysis started! Redirecting to dashboard...`);

            // Wait a moment then redirect
            setTimeout(() => {
                router.push(`/glm-dashboard/${jobId}?dataset_id=${dataset_id}`);
            }, 1500);
        } catch (err: any) {
            setGlmError(err.response?.data?.detail || 'Failed to start GLM analysis');
        } finally {
            setGlmLoading(false);
        }
    };

    const handleRunTimeSeries = async () => {
        setTsLoading(true);
        setTsError('');
        setTsSuccess('');

        try {
            const response = await axios.post(`${API_URL}/api/v1/analysis/timeseries`, {
                dataset_id: dataset_id,
                forecast_periods: 12,
                model_type: 'auto'
            });

            const jobId = response.data.job_id;
            setTsSuccess(`Time-series forecast started! Redirecting to dashboard...`);

            // Wait a moment then redirect
            setTimeout(() => {
                router.push(`/timeseries-dashboard/${jobId}`);
            }, 1500);
        } catch (err: any) {
            setTsError(err.response?.data?.detail || 'Failed to start time-series analysis');
        } finally {
            setTsLoading(false);
        }
    };

    const handleRunMLSurvival = async (modelType: string) => {
        console.log('[ML Survival] Button clicked, model type:', modelType);
        console.log('[ML Survival] Dataset ID:', dataset_id);
        console.log('[ML Survival] API URL:', API_URL);

        if (!dataset_id) {
            alert('Error: No dataset ID found');
            return;
        }

        try {
            console.log('[ML Survival] Sending request to:', `${API_URL}/api/v1/analysis/ml-survival/train`);

            const response = await axios.post(`${API_URL}/api/v1/analysis/ml-survival/train`, {
                dataset_id: dataset_id,
                time_col: 'time',
                event_col: 'event',
                model_type: modelType
            });

            console.log('[ML Survival] Response:', response.data);

            const jobId = response.data.job_id;
            alert(`ML Survival model training started! Job ID: ${jobId}\n\nNote: The ML survival dashboard page needs to be created.`);

            // For now, just show success - dashboard page doesn't exist yet
            console.log('[ML Survival] Job ID:', jobId);
            console.log('[ML Survival] Would redirect to:', `/ml-survival-dashboard/${jobId}?dataset_id=${dataset_id}`);

            // Uncomment when dashboard page is created:
            // setTimeout(() => {
            //     router.push(`/ml-survival-dashboard/${jobId}?dataset_id=${dataset_id}`);
            // }, 1500);
        } catch (err: any) {
            console.error('[ML Survival] Error:', err);
            console.error('[ML Survival] Error response:', err.response);
            console.error('[ML Survival] Error response data:', err.response?.data);
            console.error('[ML Survival] Error response detail:', err.response?.data?.detail);

            const errorMsg = err.response?.data?.detail || err.message || 'Failed to start ML survival training';
            const errorDetail = err.response?.data?.detail || 'No detail provided';

            alert(`Error: ${errorMsg}\n\nBackend says: ${errorDetail}\n\nPlease check:\n1. Backend is running\n2. scikit-survival is installed (pip install scikit-survival)\n3. Dataset has 'time' and 'event' columns\n4. Dataset exists in backend (try re-uploading)`);
        }
    };

    const handleCompareAllModels = async () => {
        console.log('[Model Comparison] Button clicked');
        console.log('[Model Comparison] Dataset ID:', dataset_id);

        if (!dataset_id) {
            alert('Error: No dataset ID found');
            return;
        }

        try {
            console.log('[Model Comparison] Sending request to:', `${API_URL}/api/v1/analysis/ml-survival/compare`);

            const response = await axios.post(`${API_URL}/api/v1/analysis/ml-survival/compare`, {
                dataset_id: dataset_id,
                time_col: 'time',
                event_col: 'event'
            });

            console.log('[Model Comparison] Response:', response.data);

            // Show results in a more user-friendly way
            const results = response.data;
            const bestModel = results.best_model || 'N/A';
            const cIndices = results.comparison?.concordance_indices || {};

            let message = `Model Comparison Complete!\n\nBest Model: ${bestModel}\n\nConcordance Indices:\n`;
            for (const [model, cIndex] of Object.entries(cIndices)) {
                message += `- ${model}: ${typeof cIndex === 'number' ? cIndex.toFixed(4) : cIndex}\n`;
            }

            alert(message);
            console.log('[Model Comparison] Full results:', results);

        } catch (err: any) {
            console.error('[Model Comparison] Error:', err);
            console.error('[Model Comparison] Error response:', err.response);

            const errorMsg = err.response?.data?.detail || err.message || 'Failed to compare models';
            alert(`Error: ${errorMsg}\n\nPlease check:\n1. Backend is running\n2. scikit-survival is installed\n3. Dataset has 'time' and 'event' columns\n4. Dataset has numeric feature columns`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                                <BarChart3 className="w-10 h-10 text-primary" />
                                Interactive Data Dashboard
                            </h1>
                            <p className="text-gray-600 mt-2">Dataset ID: {dataset_id}</p>
                        </div>

                        {/* Export Report Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push(`/workspace/${dataset_id}`)}
                                className="btn-outline flex items-center gap-2"
                            >
                                <Database className="w-5 h-5" />
                                Dataset Workspace
                            </button>
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

                {/* Summary KPI Cards */}
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

                {/* Mortality Table - Special Dashboard Available */}
                {
                    datasetType === 'mortality_table' && (
                        <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="w-8 h-8 text-red-600" />
                                <h2 className="text-2xl font-bold text-gray-900">Mortality Table Analytics</h2>
                                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-semibold">
                                    SPECIALIZED DASHBOARD AVAILABLE
                                </span>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-red-200 mb-4">
                                <p className="text-gray-700 mb-4">
                                    This dataset has been identified as a <strong>mortality table</strong>.
                                    A specialized dashboard is available with comprehensive actuarial analytics including:
                                </p>

                                <ul className="space-y-2 text-gray-700 mb-6">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <span><strong>Life Table Computations:</strong> Full qₓ → lₓ → dₓ → eₓ calculations</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <span><strong>Parametric Models:</strong> Gompertz and Makeham mortality law fitting</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <span><strong>Graduation Methods:</strong> Whittaker-Henderson, Moving Average, Penalized Splines</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <span><strong>Visualizations:</strong> Survival curves, death distributions, life expectancy charts</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => router.push(`/mortality-dashboard/${dataset_id}`)}
                                    className="btn-primary w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 border-red-600 text-white text-lg py-4"
                                >
                                    <Activity className="w-6 h-6" />
                                    Open Mortality Analytics Dashboard
                                </button>
                            </div>

                            <div className="bg-red-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-red-900 mb-2">Features Include:</h3>
                                <ul className="space-y-1 text-sm text-red-800">
                                    <li>• Life expectancy at birth (e₀) and by age</li>
                                    <li>• Median age at death calculations</li>
                                    <li>• Raw vs graduated mortality rate comparisons</li>
                                    <li>• Parametric model goodness-of-fit metrics (R², RMSE)</li>
                                    <li>• Interactive life table with all actuarial functions</li>
                                </ul>
                            </div>
                        </div>
                    )
                }

                {/* Gemini AI Insights */}
                {
                    analysisData?.ai_powered && (
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
                    )
                }

                {/* Column Details with AI Descriptions */}
                {
                    geminiInsights.column_purposes && Object.keys(geminiInsights.column_purposes).length > 0 && (
                        <div className="card bg-purple-light border-2 border-purple mb-8">
                            <h2 className="text-2xl font-bold text-purple-dark mb-6 flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                Column Details
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
                    )
                }


                {/* Data Quality & Cleaning Section */}
                {
                    metadata.column_names && metadata.column_names.length > 0 && (
                        <DataQualityCleaning datasetId={dataset_id as string} />
                    )
                }


                {/* Natural Language Query Section */}
                {
                    metadata.column_names && metadata.column_names.length > 0 && (
                        <NaturalLanguageQuery
                            datasetId={dataset_id as string}
                            datasetColumns={metadata.column_names}
                        />
                    )
                }

                {/* Survival Analysis Section */}
                {
                    survivalData && (
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Activity className="w-8 h-8 text-primary" />
                                Survival Analysis
                            </h2>

                            {/* Survival KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="kpi-card bg-primary-light border-primary">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-primary-dark mb-1">Total Observations</h3>
                                            <p className="text-3xl font-bold text-gray-900">{survivalData.meta.n.toLocaleString()}</p>
                                        </div>
                                        <Users className="w-12 h-12 text-primary" />
                                    </div>
                                </div>

                                <div className="kpi-card bg-danger-light border-danger">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-danger-dark mb-1">Events (Deaths)</h3>
                                            <p className="text-3xl font-bold text-gray-900">{survivalData.meta.n_events.toLocaleString()}</p>
                                        </div>
                                        <Skull className="w-12 h-12 text-danger" />
                                    </div>
                                </div>

                                <div className="kpi-card bg-secondary-light border-secondary">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-secondary-dark mb-1">Censored</h3>
                                            <p className="text-3xl font-bold text-gray-900">{survivalData.meta.n_censored.toLocaleString()}</p>
                                        </div>
                                        <CheckCircle className="w-12 h-12 text-secondary" />
                                    </div>
                                </div>

                                <div className="kpi-card bg-purple-light border-purple">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-purple-dark mb-1">Median Follow-up</h3>
                                            <p className="text-3xl font-bold text-gray-900">{survivalData.meta.median_follow_up.toFixed(1)}</p>
                                        </div>
                                        <Clock className="w-12 h-12 text-purple" />
                                    </div>
                                </div>
                            </div>

                            {/* Kaplan-Meier Curve */}
                            {survivalData.overall_km && (
                                <div className="card mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Kaplan-Meier Survival Curve</h3>
                                    <p className="text-gray-600 mb-6">Probability of survival over time with 95% confidence intervals</p>
                                    <div className="h-96">
                                        <KMChart data={survivalData.overall_km} isHazard={false} />
                                    </div>
                                </div>
                            )}

                            {/* Nelson-Aalen Cumulative Hazard */}
                            {survivalData.nelson_aalen && (
                                <div className="card mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Nelson-Aalen Cumulative Hazard</h3>
                                    <p className="text-gray-600 mb-6">Cumulative hazard function over time</p>
                                    <div className="h-96">
                                        <KMChart data={survivalData.nelson_aalen} isHazard={true} />
                                    </div>
                                </div>
                            )}

                            {/* Life Table */}
                            {survivalData.life_table && survivalData.life_table.length > 0 && (
                                <div className="card">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Life Table</h3>
                                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                        <table className="w-full">
                                            <thead className="sticky top-0 bg-gray-100">
                                                <tr className="border-b-2 border-gray-300">
                                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">At Risk</th>
                                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Events</th>
                                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Censored</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {survivalData.life_table.slice(0, 50).map((row: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                                        <td className="px-6 py-3 text-gray-900">{row.time.toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-right text-gray-900">{row.at_risk}</td>
                                                        <td className="px-6 py-3 text-right text-danger font-semibold">{row.observed}</td>
                                                        <td className="px-6 py-3 text-right text-secondary">{row.censored}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {survivalData.life_table.length > 50 && (
                                            <p className="text-center text-gray-600 text-sm mt-4 italic">
                                                Showing first 50 of {survivalData.life_table.length} time points
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ML Survival Models Section */}
                            {numericColumns.length > 0 && (
                                <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 mt-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Activity className="w-8 h-8 text-emerald-600" />
                                        <h2 className="text-2xl font-bold text-gray-900">ML Survival Models</h2>
                                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-semibold">
                                            ADVANCED
                                        </span>
                                    </div>

                                    <div className="bg-white p-6 rounded-lg border border-emerald-200 mb-4">
                                        <p className="text-gray-700 mb-4">
                                            Train machine learning-based survival models for enhanced prediction accuracy and variable importance analysis.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <button
                                                onClick={() => handleRunMLSurvival('random_survival_forest')}
                                                className="btn-primary flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                                            >
                                                <Activity className="w-5 h-5" />
                                                Train Random Survival Forest
                                            </button>

                                            <button
                                                onClick={() => handleRunMLSurvival('gradient_boosted')}
                                                className="btn-primary flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 border-teal-600"
                                            >
                                                <TrendingUp className="w-5 h-5" />
                                                Train Gradient Boosted Survival
                                            </button>

                                            <button
                                                onClick={() => handleRunMLSurvival('coxnet')}
                                                className="btn-primary flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 border-cyan-600"
                                            >
                                                <BarChart3 className="w-5 h-5" />
                                                Train CoxNet (Penalized)
                                            </button>

                                            <button
                                                onClick={() => handleCompareAllModels()}
                                                className="btn-primary flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 border-purple-600"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Compare All Models
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-emerald-900 mb-2">ML Model Features:</h3>
                                        <ul className="space-y-1 text-sm text-emerald-800">
                                            <li>• <strong>Random Survival Forest:</strong> Ensemble method with variable importance</li>
                                            <li>• <strong>Gradient Boosted:</strong> Sequential boosting for high accuracy</li>
                                            <li>• <strong>CoxNet:</strong> Penalized Cox with automatic feature selection</li>
                                            <li>• <strong>Model Comparison:</strong> Benchmark all models with concordance indices</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Recommended Charts - Show when KM/NA curves missing OR no survival data */}
                {
                    (recommendedGraphs.length > 0 && datasetData.length > 0 && (!survivalData || (!survivalData.overall_km && !survivalData.nelson_aalen))) && (
                        <div className="mb-8">
                            <RecommendedChart graphs={recommendedGraphs} data={datasetData} />
                        </div>
                    )
                }

                {/* Data Quality Assessment */}
                {
                    geminiInsights.data_quality && (
                        <div className="card bg-accent-light border-2 border-accent mb-8">
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
                    )
                }

                {/* GLM Analysis Section */}
                {
                    isGlmCompatible && numericColumns.length > 0 && (
                        <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="w-8 h-8 text-purple-600" />
                                <h2 className="text-2xl font-bold text-gray-900">GLM Pricing Analysis</h2>
                                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-semibold">
                                    AVAILABLE
                                </span>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-purple-200 mb-4">
                                <p className="text-gray-700 mb-4">
                                    This dataset is compatible with <strong>Generalized Linear Models (GLM)</strong> for actuarial pricing analysis.
                                    Select a target variable and model family to begin.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Target Column
                                        </label>
                                        <select
                                            value={selectedTarget}
                                            onChange={(e) => setSelectedTarget(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="">Select target variable...</option>
                                            {numericColumns.map((col: string) => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Model Family
                                        </label>
                                        <select
                                            value={selectedFamily}
                                            onChange={(e) => setSelectedFamily(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="auto">Auto-detect</option>
                                            <option value="poisson">Poisson (Frequency)</option>
                                            <option value="negativebinomial">Negative Binomial (Overdispersed)</option>
                                            <option value="gamma">Gamma (Severity)</option>
                                        </select>
                                    </div>
                                </div>

                                {glmError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <p className="text-red-700">{glmError}</p>
                                    </div>
                                )}

                                {glmSuccess && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <p className="text-green-700">{glmSuccess}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleRunGLM}
                                    disabled={glmLoading || !selectedTarget}
                                    className="btn-primary w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {glmLoading ? (
                                        <>
                                            <Clock className="w-5 h-5 animate-spin" />
                                            Running GLM Analysis...
                                        </>
                                    ) : (
                                        <>
                                            <Activity className="w-5 h-5" />
                                            Run GLM Analysis
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-purple-900 mb-2">Model Recommendations:</h3>
                                <ul className="space-y-1 text-sm text-purple-800">
                                    <li>• <strong>Poisson:</strong> Use for count data (claims, incidents)</li>
                                    <li>• <strong>Negative Binomial:</strong> Use for overdispersed counts</li>
                                    <li>• <strong>Gamma:</strong> Use for continuous positive values (amounts, costs)</li>
                                    <li>• <strong>Auto-detect:</strong> System will choose the best model</li>
                                </ul>
                            </div>
                        </div>
                    )
                }

                {/* Time-Series Forecasting Section */}
                {
                    isTimeSeries && (
                        <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="w-8 h-8 text-blue-600" />
                                <h2 className="text-2xl font-bold text-gray-900">Time-Series Forecasting</h2>
                                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                                    AVAILABLE
                                </span>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-blue-200 mb-4">
                                <p className="text-gray-700 mb-4">
                                    This dataset contains <strong>time-series data</strong> suitable for forecasting analysis.
                                    We'll automatically detect date/time columns and numeric values to generate forecasts using
                                    ARIMA, SARIMA, Holt-Winters, and Prophet models.
                                </p>

                                {tsError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <p className="text-red-700">{tsError}</p>
                                    </div>
                                )}

                                {tsSuccess && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <p className="text-green-700">{tsSuccess}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleRunTimeSeries}
                                    disabled={tsLoading}
                                    className="btn-primary w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {tsLoading ? (
                                        <>
                                            <Clock className="w-5 h-5 animate-spin" />
                                            Generating Forecast...
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="w-5 h-5" />
                                            Generate Forecast (Auto Model Selection)
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-blue-900 mb-2">Forecast Features:</h3>
                                <ul className="space-y-1 text-sm text-blue-800">
                                    <li>• <strong>ARIMA:</strong> Auto-regressive integrated moving average</li>
                                    <li>• <strong>SARIMA:</strong> Seasonal ARIMA with automatic seasonality detection</li>
                                    <li>• <strong>Holt-Winters:</strong> Triple exponential smoothing</li>
                                    <li>• <strong>Prophet:</strong> Facebook's forecasting algorithm</li>
                                    <li>• <strong>Auto-selection:</strong> System chooses the best model based on AIC/BIC</li>
                                </ul>
                            </div>
                        </div>
                    )
                }

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => router.push('/upload')} className="btn-secondary flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Analysis
                    </button>
                    <button onClick={() => router.push('/upload')} className="btn-primary flex items-center justify-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload Another Dataset
                    </button>
                </div>
            </div>
        </div >
    );
}

export default function GeneralDashboard() {
    return (
        <ProtectedRoute>
            <GeneralDashboardContent />
        </ProtectedRoute>
    );
}
