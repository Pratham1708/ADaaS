import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import {
    LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, Activity, Clock, BarChart3, AlertTriangle,
    CheckCircle, Calendar, Target, Zap, Loader2, Play
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com';

function TimeSeriesPageContent() {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<any>(null);
    const [jobStatus, setJobStatus] = useState<string>('');

    const handleRunTimeSeries = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(`${API_URL}/api/v1/analysis/timeseries`, {
                dataset_id: dataset_id,
                forecast_periods: 12,
                model_type: 'auto'
            });

            const newJobId = response.data.job_id;
            setJobId(newJobId);
            setSuccess(`Time-series forecast started! Job ID: ${newJobId}`);
            
            // Start polling for results
            pollJobStatus(newJobId);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start time-series analysis');
            setLoading(false);
        }
    };

    const pollJobStatus = async (jid: string) => {
        let attempts = 0;
        const maxAttempts = 60;

        const poll = async () => {
            try {
                const jobResponse = await axios.get(`${API_URL}/api/v1/jobs/${jid}`);
                setJobStatus(jobResponse.data.status);

                if (jobResponse.data.status === 'finished') {
                    // Fetch results
                    const resultResponse = await axios.get(`${API_URL}/api/v1/analysis/timeseries/results/${jid}`);
                    setForecastData(resultResponse.data);
                    setLoading(false);
                    setSuccess('Time-series forecast completed!');
                } else if (jobResponse.data.status === 'failed') {
                    setError(jobResponse.data.error || 'Analysis failed');
                    setLoading(false);
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(poll, 2000);
                    } else {
                        setError('Analysis timeout - please try again');
                        setLoading(false);
                    }
                }
            } catch (err: any) {
                setError('Failed to check job status');
                setLoading(false);
            }
        };

        poll();
    };

    // Prepare chart data
    const historicalData = forecastData?.historical?.periods?.map((period: string, idx: number) => ({
        period,
        actual: forecastData.historical.actual[idx],
        fitted: forecastData.historical.fitted[idx]
    })) || [];

    const forecastChartData = forecastData?.forecast?.periods?.map((period: string, idx: number) => ({
        period,
        forecast: forecastData.forecast.values[idx],
        lower: forecastData.forecast.lower_bound[idx],
        upper: forecastData.forecast.upper_bound[idx]
    })) || [];

    const combinedData = [
        ...historicalData.map((d: any) => ({ ...d, forecast: null, lower: null, upper: null })),
        ...forecastChartData.map((d: any) => ({ ...d, actual: null, fitted: null }))
    ];

    const decompositionData = forecastData?.decomposition?.periods?.map((period: string, idx: number) => ({
        period,
        trend: forecastData.decomposition.trend[idx],
        seasonal: forecastData.decomposition.seasonal[idx],
        residual: forecastData.decomposition.residual[idx]
    })) || [];

    const modelComparison = forecastData?.model_comparison || [];
    const bestModel = forecastData?.best_model || forecastData?.model_type;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <TrendingUp className="w-10 h-10 text-primary" />
                    Time-Series Forecasting
                </h1>
                <p className="text-gray-600 mt-2">
                    Forecast future values using ARIMA, SARIMA, Holt-Winters, and Prophet models
                </p>
            </div>

            {/* Run Analysis Section */}
            {!forecastData && (
                <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Start Forecasting</h2>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-blue-200 mb-4">
                        <p className="text-gray-700 mb-4">
                            This dataset contains <strong>time-series data</strong> suitable for forecasting analysis.
                            We'll automatically detect date/time columns and numeric values to generate forecasts.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="text-green-700">{success}</p>
                            </div>
                        )}

                        {loading && jobStatus && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                <p className="text-blue-700">Job Status: {jobStatus}</p>
                            </div>
                        )}

                        <button
                            onClick={handleRunTimeSeries}
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Running Forecast...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Run Time-Series Forecast
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">Models Included:</h3>
                        <ul className="space-y-1 text-sm text-blue-800">
                            <li>• <strong>ARIMA:</strong> AutoRegressive Integrated Moving Average</li>
                            <li>• <strong>SARIMA:</strong> Seasonal ARIMA for data with seasonality</li>
                            <li>• <strong>Holt-Winters:</strong> Exponential smoothing with trend and seasonality</li>
                            <li>• <strong>Prophet:</strong> Facebook's forecasting tool for business time series</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {forecastData && (
                <>
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
                            Model: <span className="font-semibold text-primary">{bestModel?.toUpperCase()}</span>
                            {' '}| Historical data (blue), fitted values (green), and forecast (red) with {(forecastData.forecast.confidence_level * 100).toFixed(0)}% confidence bands
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
                </>
            )}
        </div>
    );
}

export default function TimeSeriesPage() {
    const router = useRouter();
    const { dataset_id } = router.query;

    return (
        <ProtectedRoute>
            {dataset_id && (
                <DashboardLayout datasetId={dataset_id as string}>
                    <TimeSeriesPageContent />
                </DashboardLayout>
            )}
        </ProtectedRoute>
    );
}
