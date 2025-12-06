import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, Activity, Clock, BarChart3, AlertTriangle,
    CheckCircle, ArrowLeft, Calendar, Target, Zap
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function TimeSeriesDashboardContent() {
    const router = useRouter();
    const { job_id } = router.query;
    const [forecastData, setForecastData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!job_id) return;

        const fetchForecast = async () => {
            try {
                // Poll for job completion
                let jobComplete = false;
                let attempts = 0;
                const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes

                while (!jobComplete && attempts < maxAttempts) {
                    const jobResponse = await axios.get(`${API_URL}/api/v1/jobs/${job_id}`);

                    if (jobResponse.data.status === 'finished') {
                        jobComplete = true;
                        // Fetch results
                        const resultResponse = await axios.get(`${API_URL}/api/v1/analysis/timeseries/results/${job_id}`);
                        setForecastData(resultResponse.data);
                    } else if (jobResponse.data.status === 'failed') {
                        throw new Error(jobResponse.data.error || 'Analysis failed');
                    } else {
                        // Wait 2 seconds before next attempt
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        attempts++;
                    }
                }

                if (!jobComplete) {
                    throw new Error('Analysis timeout - please try again');
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || err.message || 'Failed to load forecast');
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, [job_id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Generating Forecast...</h2>
                    <p className="text-gray-600 mt-2">Analyzing time-series data and fitting models</p>
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
                    <button onClick={() => router.back()} className="btn-primary mt-6">
                        <ArrowLeft className="w-5 h-5 inline mr-2" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const historicalData = forecastData.historical.periods.map((period: string, idx: number) => ({
        period,
        actual: forecastData.historical.actual[idx],
        fitted: forecastData.historical.fitted[idx]
    }));

    const forecastChartData = forecastData.forecast.periods.map((period: string, idx: number) => ({
        period,
        forecast: forecastData.forecast.values[idx],
        lower: forecastData.forecast.lower_bound[idx],
        upper: forecastData.forecast.upper_bound[idx]
    }));

    // Combine historical and forecast for full view
    const combinedData = [
        ...historicalData.map((d: any) => ({ ...d, forecast: null, lower: null, upper: null })),
        ...forecastChartData.map((d: any) => ({ ...d, actual: null, fitted: null }))
    ];

    // Decomposition data
    const decompositionData = forecastData.decomposition?.periods?.map((period: string, idx: number) => ({
        period,
        trend: forecastData.decomposition.trend[idx],
        seasonal: forecastData.decomposition.seasonal[idx],
        residual: forecastData.decomposition.residual[idx]
    })) || [];

    const modelComparison = forecastData.model_comparison || [];
    const bestModel = forecastData.best_model || forecastData.model_type;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <TrendingUp className="w-10 h-10 text-primary" />
                        Time-Series Forecast
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Model: <span className="font-semibold text-primary">{bestModel.toUpperCase()}</span>
                        {forecastData.metadata && (
                            <> | {forecastData.metadata.value_column} over {forecastData.metadata.date_column}</>
                        )}
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="kpi-card bg-primary-light border-primary">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-primary-dark mb-1">Observations</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {forecastData.metadata?.n_observations || 'N/A'}
                                </p>
                            </div>
                            <BarChart3 className="w-12 h-12 text-primary" />
                        </div>
                    </div>

                    <div className="kpi-card bg-secondary-light border-secondary">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-secondary-dark mb-1">Forecast Periods</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {forecastData.metadata?.forecast_periods || 'N/A'}
                                </p>
                            </div>
                            <Calendar className="w-12 h-12 text-secondary" />
                        </div>
                    </div>

                    <div className="kpi-card bg-accent-light border-accent">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-accent-dark mb-1">RMSE</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {forecastData.metrics?.rmse != null ? forecastData.metrics.rmse.toFixed(2) : 'N/A'}
                                </p>
                            </div>
                            <Target className="w-12 h-12 text-accent" />
                        </div>
                    </div>

                    <div className="kpi-card bg-purple-light border-purple">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-purple-dark mb-1">MAPE</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {forecastData.metrics?.mape != null ? forecastData.metrics.mape.toFixed(2) + '%' : 'N/A'}
                                </p>
                            </div>
                            <Zap className="w-12 h-12 text-purple" />
                        </div>
                    </div>
                </div>

                {/* Main Forecast Chart */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        Forecast with Confidence Intervals
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Historical data (blue), fitted values (green), and forecast (red) with {(forecastData.forecast.confidence_level * 100).toFixed(0)}% confidence bands
                    </p>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={combinedData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="period"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />

                                {/* Confidence interval area */}
                                <Area
                                    type="monotone"
                                    dataKey="upper"
                                    stroke="none"
                                    fill="#fca5a5"
                                    fillOpacity={0.3}
                                    name="Upper Bound"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="lower"
                                    stroke="none"
                                    fill="#fca5a5"
                                    fillOpacity={0.3}
                                    name="Lower Bound"
                                />

                                {/* Actual values */}
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name="Actual"
                                />

                                {/* Fitted values */}
                                <Line
                                    type="monotone"
                                    dataKey="fitted"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    name="Fitted"
                                />

                                {/* Forecast */}
                                <Line
                                    type="monotone"
                                    dataKey="forecast"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    name="Forecast"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Seasonality Info */}
                {forecastData.seasonality && (
                    <div className="card bg-secondary-light border-2 border-secondary mb-8">
                        <h2 className="text-2xl font-bold text-secondary-dark mb-4 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6" />
                            Seasonality Analysis
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-600 mb-1">Detected</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {forecastData.seasonality.detected ? (
                                        <span className="text-green-600 flex items-center gap-2">
                                            <CheckCircle className="w-6 h-6" /> Yes
                                        </span>
                                    ) : (
                                        <span className="text-gray-500">No</span>
                                    )}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-600 mb-1">Period</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {forecastData.seasonality.period}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-600 mb-1">Strength</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(forecastData.seasonality.strength * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Decomposition Charts */}
                {decompositionData.length > 0 && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            Trend Decomposition
                        </h2>

                        {/* Trend Component */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Trend Component</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={decompositionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="trend" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Seasonal Component */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Seasonal Component</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={decompositionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="seasonal" stroke="#10b981" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Residual Component */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Residual Component</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={decompositionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="residual" stroke="#ef4444" strokeWidth={1} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Model Comparison Table */}
                {modelComparison.length > 0 && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            Model Comparison
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr className="border-b-2 border-gray-300">
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Model</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">AIC</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">BIC</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">RMSE</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">MAE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modelComparison.map((model: any, idx: number) => (
                                        <tr
                                            key={idx}
                                            className={`border-b border-gray-200 hover:bg-gray-50 ${model.model === bestModel ? 'bg-green-50' : ''}`}
                                        >
                                            <td className="px-6 py-3 font-semibold text-gray-900">
                                                {model.model.toUpperCase()}
                                                {model.model === bestModel && (
                                                    <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">BEST</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-900">{model.aic.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right text-gray-900">{model.bic.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right text-gray-900">{model.rmse.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right text-gray-900">{model.mae.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Model Metrics */}
                <div className="card bg-purple-light border-2 border-purple mb-8">
                    <h2 className="text-2xl font-bold text-purple-dark mb-4 flex items-center gap-2">
                        <Target className="w-6 h-6" />
                        Model Performance Metrics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600 mb-1">RMSE</h3>
                            <p className="text-2xl font-bold text-gray-900">
                                {forecastData.metrics?.rmse != null ? forecastData.metrics.rmse.toFixed(3) : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Root Mean Squared Error</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600 mb-1">MAE</h3>
                            <p className="text-2xl font-bold text-gray-900">
                                {forecastData.metrics?.mae != null ? forecastData.metrics.mae.toFixed(3) : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Mean Absolute Error</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600 mb-1">MAPE</h3>
                            <p className="text-2xl font-bold text-gray-900">
                                {forecastData.metrics?.mape != null ? forecastData.metrics.mape.toFixed(2) + '%' : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Mean Absolute Percentage Error</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600 mb-1">AIC</h3>
                            <p className="text-2xl font-bold text-gray-900">
                                {forecastData.metrics?.aic != null ? forecastData.metrics.aic.toFixed(2) : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Akaike Information Criterion</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => router.back()} className="btn-secondary flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <button onClick={() => router.push('/upload')} className="btn-primary flex items-center justify-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Analyze Another Dataset
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TimeSeriesDashboard() {
    return (
        <ProtectedRoute>
            <TimeSeriesDashboardContent />
        </ProtectedRoute>
    );
}
