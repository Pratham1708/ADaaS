import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
    BarChart3, TrendingUp, CheckCircle, AlertTriangle,
    ArrowLeft, Database, Activity, Target, Zap
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Scatter, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function GLMDashboardContent() {
    const router = useRouter();
    const { dataset_id, job_id } = router.query;
    const [glmData, setGlmData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!job_id) return;

        const fetchGLMResults = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/v1/analysis/glm-results/${job_id}`);
                setGlmData(response.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load GLM results');
            } finally {
                setLoading(false);
            }
        };

        fetchGLMResults();
    }, [job_id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Activity className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Loading GLM Results...</h2>
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

    const modelInfo = glmData?.model_info || {};
    const coefficients = glmData?.coefficients || [];
    const gof = glmData?.goodness_of_fit || {};
    const residuals = glmData?.residuals || {};
    const featureImportance = glmData?.feature_importance || [];
    const partialDependence = glmData?.partial_dependence || {};
    const predictions = glmData?.predictions || {};

    // Prepare fitted vs observed scatter data
    const fittedVsObservedData = {
        datasets: [{
            label: 'Fitted vs Observed',
            data: residuals.fitted_values?.map((fitted: number, idx: number) => ({
                x: fitted,
                y: residuals.fitted_values[idx] + residuals.deviance_residuals[idx]
            })) || [],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
        }]
    };

    const fittedVsObservedOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            x: { title: { display: true, text: 'Fitted Values' } },
            y: { title: { display: true, text: 'Observed Values' } }
        }
    };

    // Prepare feature importance bar chart
    const topFeatures = featureImportance.slice(0, 10);
    const featureImportanceData = {
        labels: topFeatures.map((f: any) => f.feature),
        datasets: [{
            label: 'Importance (|z-score|)',
            data: topFeatures.map((f: any) => f.importance),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
        }]
    };

    const featureImportanceOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            x: { title: { display: true, text: 'Importance Score' } }
        }
    };

    // Residual plot
    const residualPlotData = {
        datasets: [{
            label: 'Deviance Residuals',
            data: residuals.fitted_values?.map((fitted: number, idx: number) => ({
                x: fitted,
                y: residuals.deviance_residuals[idx]
            })) || [],
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgba(239, 68, 68, 1)',
        }]
    };

    const residualPlotOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            x: { title: { display: true, text: 'Fitted Values' } },
            y: {
                title: { display: true, text: 'Deviance Residuals' },
                grid: { color: (context: any) => context.tick.value === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)' }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <Target className="w-10 h-10 text-primary" />
                        GLM Analysis Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">Dataset ID: {dataset_id} | Job ID: {job_id}</p>
                </div>

                {/* Model Summary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="kpi-card bg-primary-light border-primary">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-primary-dark mb-1">Model Family</h3>
                                <p className="text-2xl font-bold text-gray-900 capitalize">{modelInfo.family}</p>
                            </div>
                            <Database className="w-12 h-12 text-primary" />
                        </div>
                    </div>

                    <div className="kpi-card bg-secondary-light border-secondary">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-secondary-dark mb-1">Observations</h3>
                                <p className="text-2xl font-bold text-gray-900">{modelInfo.n_observations?.toLocaleString()}</p>
                            </div>
                            <BarChart3 className="w-12 h-12 text-secondary" />
                        </div>
                    </div>

                    <div className="kpi-card bg-accent-light border-accent">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-accent-dark mb-1">AIC</h3>
                                <p className="text-2xl font-bold text-gray-900">{gof.aic?.toFixed(2)}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-accent" />
                        </div>
                    </div>

                    <div className="kpi-card bg-purple-light border-purple">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-purple-dark mb-1">Pseudo R²</h3>
                                <p className="text-2xl font-bold text-gray-900">{(gof.pseudo_r2 * 100)?.toFixed(1)}%</p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-purple" />
                        </div>
                    </div>
                </div>

                {/* Goodness of Fit */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-primary" />
                        Goodness of Fit
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">AIC</p>
                            <p className="text-xl font-bold text-gray-900">{gof.aic?.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">BIC</p>
                            <p className="text-xl font-bold text-gray-900">{gof.bic?.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Deviance</p>
                            <p className="text-xl font-bold text-gray-900">{gof.deviance?.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Pearson χ²</p>
                            <p className="text-xl font-bold text-gray-900">{gof.pearson_chi2?.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Pseudo R²</p>
                            <p className="text-xl font-bold text-gray-900">{(gof.pseudo_r2 * 100)?.toFixed(2)}%</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Null Deviance</p>
                            <p className="text-xl font-bold text-gray-900">{gof.null_deviance?.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Coefficients Table */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Database className="w-6 h-6 text-primary" />
                        Model Coefficients
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr className="border-b-2 border-gray-300">
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Feature</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Coefficient</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Std Error</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">z-value</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">p-value</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Exp(Coef)</th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Significance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coefficients.map((coef: any, idx: number) => (
                                    <tr key={idx} className={`border-b border-gray-200 hover:bg-gray-50 ${coef.p_value < 0.05 ? 'bg-green-50' : ''}`}>
                                        <td className="px-6 py-3 text-gray-900 font-medium">{coef.feature}</td>
                                        <td className="px-6 py-3 text-right text-gray-900">{coef.coef.toFixed(4)}</td>
                                        <td className="px-6 py-3 text-right text-gray-600">{coef.std_err.toFixed(4)}</td>
                                        <td className="px-6 py-3 text-right text-gray-900">{coef.z.toFixed(3)}</td>
                                        <td className="px-6 py-3 text-right text-gray-900">{coef.p_value.toFixed(4)}</td>
                                        <td className="px-6 py-3 text-right text-gray-900">{coef.exp_coef.toFixed(4)}</td>
                                        <td className="px-6 py-3 text-center">
                                            {coef.p_value < 0.001 ? (
                                                <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">***</span>
                                            ) : coef.p_value < 0.01 ? (
                                                <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">**</span>
                                            ) : coef.p_value < 0.05 ? (
                                                <span className="px-2 py-1 bg-green-400 text-white rounded text-xs font-bold">*</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs">ns</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-600 mt-4">
                        Significance codes: *** p &lt; 0.001, ** p &lt; 0.01, * p &lt; 0.05, ns = not significant
                    </p>
                </div>

                {/* Predictions Summary */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Target className="w-6 h-6 text-primary" />
                        Prediction Summary
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Mean Predicted</p>
                            <p className="text-xl font-bold text-primary">{predictions.mean_predicted?.toFixed(3)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Mean Observed</p>
                            <p className="text-xl font-bold text-secondary">{predictions.mean_observed?.toFixed(3)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Correlation</p>
                            <p className="text-xl font-bold text-accent">{predictions.correlation?.toFixed(3)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Max Predicted</p>
                            <p className="text-xl font-bold text-gray-900">{predictions.max_predicted?.toFixed(3)}</p>
                        </div>
                    </div>
                </div>

                {/* Fitted vs Observed Plot */}
                <div className="card mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Fitted vs Observed Values</h3>
                    <p className="text-gray-600 mb-6">Scatter plot comparing model predictions to actual values</p>
                    <div className="h-96">
                        <Scatter data={fittedVsObservedData} options={fittedVsObservedOptions} />
                    </div>
                </div>

                {/* Residual Diagnostics */}
                <div className="card mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Residual Diagnostics</h3>
                    <p className="text-gray-600 mb-6">Deviance residuals vs fitted values (should be randomly scattered around zero)</p>
                    <div className="h-96">
                        <Scatter data={residualPlotData} options={residualPlotOptions} />
                    </div>
                </div>

                {/* Feature Importance */}
                {featureImportance.length > 0 && (
                    <div className="card mb-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Feature Importance</h3>
                        <p className="text-gray-600 mb-6">Top 10 features ranked by absolute z-score</p>
                        <div className="h-96">
                            <Bar data={featureImportanceData} options={featureImportanceOptions} />
                        </div>
                    </div>
                )}

                {/* Partial Dependence Plots */}
                {Object.keys(partialDependence).length > 0 && (
                    <div className="card mb-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Partial Dependence Plots</h3>
                        <p className="text-gray-600 mb-6">Marginal effect of each feature on predictions</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(partialDependence).map(([feature, data]: [string, any]) => (
                                <div key={feature} className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">{feature}</h4>
                                    <div className="h-64">
                                        <Line
                                            data={{
                                                labels: data.values,
                                                datasets: [{
                                                    label: 'Predicted Value',
                                                    data: data.predictions,
                                                    borderColor: 'rgba(59, 130, 246, 1)',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                    tension: 0.4
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false }
                                                },
                                                scales: {
                                                    x: { title: { display: true, text: feature } },
                                                    y: { title: { display: true, text: 'Prediction' } }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => router.push('/upload')} className="btn-secondary flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Upload
                    </button>
                    <button onClick={() => router.push(`/general-dashboard/${dataset_id}`)} className="btn-primary flex items-center justify-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        View General Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GLMDashboard() {
    return (
        <ProtectedRoute>
            <GLMDashboardContent />
        </ProtectedRoute>
    );
}
