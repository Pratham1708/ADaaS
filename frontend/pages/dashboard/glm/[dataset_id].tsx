import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { BarChart3, Loader2, Info, Play, Clock, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function GLMPageContent() {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [datasetData, setDatasetData] = useState<any[]>([]);
    const [glmJobs, setGlmJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [glmLoading, setGlmLoading] = useState(false);
    const [glmError, setGlmError] = useState('');
    const [glmSuccess, setGlmSuccess] = useState('');
    const [selectedTarget, setSelectedTarget] = useState('');
    const [selectedFamily, setSelectedFamily] = useState('auto');

    useEffect(() => {
        if (!dataset_id) return;

        const fetchData = async () => {
            try {
                // Fetch analysis data
                const analysisResponse = await axios.post(`${API_URL}/api/v1/datasets/analyze-smart/${dataset_id}`);
                setAnalysisData(analysisResponse.data);

                // Fetch raw dataset for column detection
                try {
                    const dataResponse = await axios.get(`${API_URL}/api/v1/datasets/${dataset_id}/data`);
                    if (dataResponse.data && Array.isArray(dataResponse.data)) {
                        setDatasetData(dataResponse.data);
                    }
                } catch (dataErr) {
                    console.log('Could not fetch dataset:', dataErr);
                }

                // Fetch GLM jobs
                try {
                    const jobsResponse = await axios.get(`${API_URL}/api/v1/jobs`);
                    const datasetGlmJobs = jobsResponse.data.filter((job: any) =>
                        job.analysis_type === 'glm' && job.params?.dataset_id === dataset_id
                    );
                    setGlmJobs(datasetGlmJobs);
                } catch (jobErr) {
                    console.log('Could not fetch GLM jobs:', jobErr);
                }
            } catch (err: any) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dataset_id]);

    const metadata = analysisData?.metadata || {};
    const datasetType = analysisData?.dataset_type || 'unknown';

    // Get numeric columns for GLM target selection
    const numericColumns = metadata.column_names?.filter((col: string) => {
        if (!datasetData || datasetData.length === 0) return false;
        const firstValue = datasetData[0][col];
        return typeof firstValue === 'number';
    }) || [];

    // GLM compatibility check
    const isGlmCompatible =
        ['glm_frequency', 'glm_severity', 'glm_compatible', 'insurance_claims'].includes(datasetType) ||
        (datasetType === 'unknown' && numericColumns.length >= 2);

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

            setTimeout(() => {
                router.push(`/glm-dashboard/${jobId}?dataset_id=${dataset_id}`);
            }, 1500);
        } catch (err: any) {
            setGlmError(err.response?.data?.detail || 'Failed to start GLM analysis');
        } finally {
            setGlmLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Loading GLM Analysis...</h2>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <BarChart3 className="w-10 h-10 text-primary" />
                    GLM Pricing Analysis
                </h1>
                <p className="text-gray-600 mt-2">Generalized Linear Models for actuarial pricing</p>
            </div>

            {/* Compatibility Check */}
            {!isGlmCompatible ? (
                <div className="card bg-yellow-50 border-2 border-yellow-300">
                    <div className="flex items-start gap-3">
                        <Info className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Dataset Not Compatible with GLM Analysis
                            </h3>
                            <p className="text-gray-700">
                                This dataset does not appear to be suitable for GLM pricing analysis.
                                GLM analysis requires datasets with numeric target variables and predictor columns.
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                <strong>Detected columns:</strong> {numericColumns.length} numeric columns
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Run GLM Analysis */}
                    <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Play className="w-8 h-8 text-purple-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Run GLM Analysis</h2>
                            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-semibold">
                                AVAILABLE
                            </span>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-purple-200 mb-4">
                            <p className="text-gray-700 mb-4">
                                Configure and run a Generalized Linear Model for pricing analysis.
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
                                        <option value="">Select target column...</option>
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
                                        <option value="gaussian">Gaussian (Normal)</option>
                                        <option value="poisson">Poisson (Count)</option>
                                        <option value="gamma">Gamma (Continuous Positive)</option>
                                        <option value="tweedie">Tweedie (Insurance)</option>
                                    </select>
                                </div>
                            </div>

                            {glmError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    {glmError}
                                </div>
                            )}

                            {glmSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                    {glmSuccess}
                                </div>
                            )}

                            <button
                                onClick={handleRunGLM}
                                disabled={glmLoading || !selectedTarget}
                                className="btn-primary w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {glmLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Starting Analysis...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        Run GLM Analysis
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* GLM Jobs History */}
                    {glmJobs.length > 0 && (
                        <div className="card">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary" />
                                GLM Analysis History
                            </h2>
                            <div className="space-y-3">
                                {glmJobs.map((job: any) => (
                                    <div
                                        key={job.job_id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">
                                                Target: {job.params?.target_col || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Family: {job.params?.family || 'auto'} • Job ID: {job.job_id}
                                            </p>
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
                                                    onClick={() => router.push(`/glm-dashboard/${job.job_id}?dataset_id=${dataset_id}`)}
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
                </>
            )}
        </div>
    );
}

export default function GLMPage() {
    const router = useRouter();
    const { dataset_id } = router.query;

    return (
        <ProtectedRoute>
            {dataset_id && (
                <DashboardLayout datasetId={dataset_id as string}>
                    <GLMPageContent />
                </DashboardLayout>
            )}
        </ProtectedRoute>
    );
}
