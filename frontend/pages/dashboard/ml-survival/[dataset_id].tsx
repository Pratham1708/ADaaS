import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Brain, Loader2, Info, Activity, TrendingUp, BarChart3, CheckCircle, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function MLSurvivalPageContent() {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [survivalData, setSurvivalData] = useState<any>(null);
    const [mlJobs, setMlJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [comparing, setComparing] = useState(false);

    useEffect(() => {
        if (!dataset_id) return;

        const fetchData = async () => {
            try {
                // Fetch analysis data
                const analysisResponse = await axios.post(`${API_URL}/api/v1/datasets/analyze-smart/${dataset_id}`);
                setAnalysisData(analysisResponse.data);

                // Check for survival data
                try {
                    const survivalResponse = await axios.get(`${API_URL}/api/v1/datasets/survival-analysis/${dataset_id}`);
                    if (survivalResponse.data.has_survival_data) {
                        setSurvivalData(survivalResponse.data.survival_analysis);
                    }
                } catch (survErr) {
                    console.log('No survival data available');
                }

                // Fetch ML survival jobs
                try {
                    const jobsResponse = await axios.get(`${API_URL}/api/v1/jobs`);
                    const datasetMlJobs = jobsResponse.data.filter((job: any) =>
                        job.analysis_type === 'ml_survival' && job.params?.dataset_id === dataset_id
                    );
                    setMlJobs(datasetMlJobs);
                } catch (jobErr) {
                    console.log('Could not fetch ML jobs:', jobErr);
                }
            } catch (err: any) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dataset_id]);

    const handleRunMLSurvival = async (modelType: string) => {
        if (!dataset_id) {
            alert('Error: No dataset ID found');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/v1/analysis/ml-survival/train`, {
                dataset_id: dataset_id,
                time_col: 'time',
                event_col: 'event',
                model_type: modelType
            });

            const jobId = response.data.job_id;
            alert(`ML Survival model training started! Job ID: ${jobId}\n\nNote: The ML survival dashboard page needs to be created.`);

            // Refresh jobs list
            const jobsResponse = await axios.get(`${API_URL}/api/v1/jobs`);
            const datasetMlJobs = jobsResponse.data.filter((job: any) =>
                job.analysis_type === 'ml_survival' && job.params?.dataset_id === dataset_id
            );
            setMlJobs(datasetMlJobs);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to start ML survival training';
            alert(`Error: ${errorMsg}\n\nPlease check:\n1. Backend is running\n2. scikit-survival is installed\n3. Dataset has 'time' and 'event' columns`);
        }
    };

    const handleCompareAllModels = async () => {
        if (!dataset_id) {
            alert('Error: No dataset ID found');
            return;
        }

        setComparing(true);
        try {
            const response = await axios.post(`${API_URL}/api/v1/analysis/ml-survival/compare`, {
                dataset_id: dataset_id,
                time_col: 'time',
                event_col: 'event'
            });

            const results = response.data;
            const bestModel = results.best_model || 'N/A';
            const cIndices = results.comparison?.concordance_indices || {};

            let message = `Model Comparison Complete!\n\nBest Model: ${bestModel}\n\nConcordance Indices:\n`;
            for (const [model, cIndex] of Object.entries(cIndices)) {
                message += `- ${model}: ${typeof cIndex === 'number' ? cIndex.toFixed(4) : cIndex}\n`;
            }

            alert(message);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to compare models';
            alert(`Error: ${errorMsg}`);
        } finally {
            setComparing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Loading ML Survival...</h2>
                </div>
            </div>
        );
    }

    const hasSurvivalData = survivalData !== null;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <Brain className="w-10 h-10 text-primary" />
                    ML Survival Models
                </h1>
                <p className="text-gray-600 mt-2">Machine learning-based survival analysis</p>
            </div>

            {/* Survival Data Check */}
            {!hasSurvivalData ? (
                <div className="card bg-yellow-50 border-2 border-yellow-300">
                    <div className="flex items-start gap-3">
                        <Info className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No Survival Data Available
                            </h3>
                            <p className="text-gray-700">
                                This dataset does not appear to contain survival data required for ML survival models.
                                ML survival analysis requires time-to-event data with columns like 'time' and 'event'.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Train Models */}
                    <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Brain className="w-8 h-8 text-emerald-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Train ML Survival Models</h2>
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
                                    onClick={handleCompareAllModels}
                                    disabled={comparing}
                                    className="btn-primary flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 border-purple-600 disabled:opacity-50"
                                >
                                    {comparing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Comparing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Compare All Models
                                        </>
                                    )}
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

                    {/* ML Jobs History */}
                    {mlJobs.length > 0 && (
                        <div className="card">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary" />
                                ML Survival Training History
                            </h2>
                            <div className="space-y-3">
                                {mlJobs.map((job: any) => (
                                    <div
                                        key={job.job_id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 capitalize">
                                                {job.params?.model_type?.replace(/_/g, ' ') || 'ML Survival Model'}
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
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function MLSurvivalPage() {
    const router = useRouter();
    const { dataset_id } = router.query;

    return (
        <ProtectedRoute>
            {dataset_id && (
                <DashboardLayout datasetId={dataset_id as string}>
                    <MLSurvivalPageContent />
                </DashboardLayout>
            )}
        </ProtectedRoute>
    );
}
