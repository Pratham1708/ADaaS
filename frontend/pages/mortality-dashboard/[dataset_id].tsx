import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Activity, TrendingDown, Users, Calendar, ArrowLeft,
    Heart, AlertCircle, CheckCircle, BarChart3, Target
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com';

function MortalityDashboardContent() {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [mortalityData, setMortalityData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedGraduation, setSelectedGraduation] = useState('whittaker_henderson');

    useEffect(() => {
        if (!dataset_id) return;

        const fetchMortalityAnalysis = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/v1/analysis/mortality/${dataset_id}`);
                setMortalityData(response.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || err.message || 'Failed to load mortality analysis');
            } finally {
                setLoading(false);
            }
        };

        fetchMortalityAnalysis();
    }, [dataset_id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Activity className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-gray-800">Computing Mortality Analytics...</h2>
                    <p className="text-gray-600 mt-2">Calculating life tables and fitting models</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
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
    const rawMortalityData = mortalityData.raw_data.ages.map((age: number, idx: number) => ({
        age,
        raw_qx: mortalityData.raw_data.qx[idx] * 1000, // Convert to per 1000
        whittaker: mortalityData.graduated.whittaker_henderson.qx[idx] * 1000,
        moving_avg: mortalityData.graduated.moving_average.qx[idx] * 1000,
        spline: mortalityData.graduated.penalized_spline.qx[idx] * 1000,
        gompertz: mortalityData.fitted_models.gompertz.success ? 
            mortalityData.fitted_models.gompertz.fitted_qx[idx] * 1000 : null,
        makeham: mortalityData.fitted_models.makeham.success ? 
            mortalityData.fitted_models.makeham.fitted_qx[idx] * 1000 : null
    }));

    // Life table data for lx, dx, ex charts
    const lifeTableData = mortalityData.life_table.map((row: any) => ({
        age: row.age,
        lx: row.lx,
        dx: row.dx,
        ex: row.ex,
        qx: row.qx * 1000
    }));

    const kpis = mortalityData.kpis;
    const gompertz = mortalityData.fitted_models.gompertz;
    const makeham = mortalityData.fitted_models.makeham;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <Heart className="w-10 h-10 text-danger" />
                        Mortality Table Analytics
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Comprehensive actuarial life table analysis with graduation and parametric model fitting
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="kpi-card bg-primary-light border-primary">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-primary-dark mb-1">Life Expectancy at Birth</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {kpis.life_expectancy_at_birth.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">years (e₀)</p>
                            </div>
                            <Heart className="w-12 h-12 text-primary" />
                        </div>
                    </div>

                    <div className="kpi-card bg-secondary-light border-secondary">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-secondary-dark mb-1">Median Age at Death</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {kpis.median_age_at_death.toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">years</p>
                            </div>
                            <Calendar className="w-12 h-12 text-secondary" />
                        </div>
                    </div>

                    <div className="kpi-card bg-accent-light border-accent">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-accent-dark mb-1">Total Population</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {kpis.total_population.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">radix (l₀)</p>
                            </div>
                            <Users className="w-12 h-12 text-accent" />
                        </div>
                    </div>

                    <div className="kpi-card bg-purple-light border-purple">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-purple-dark mb-1">Age Range</h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {kpis.age_range.min}-{kpis.age_range.max}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">years</p>
                            </div>
                            <TrendingDown className="w-12 h-12 text-purple" />
                        </div>
                    </div>
                </div>

                {/* Raw vs Graduated Mortality Rates */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        Raw vs Graduated Mortality Rates
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Comparison of raw mortality rates (qₓ) with graduated rates using different smoothing methods
                    </p>
                    
                    {/* Graduation Method Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Graduation Method:
                        </label>
                        <select
                            value={selectedGraduation}
                            onChange={(e) => setSelectedGraduation(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="whittaker_henderson">Whittaker-Henderson</option>
                            <option value="moving_average">Moving Average</option>
                            <option value="penalized_spline">Penalized Spline</option>
                        </select>
                    </div>

                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={rawMortalityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                                <YAxis label={{ value: 'Mortality Rate (per 1000)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="raw_qx" 
                                    stroke="#94a3b8" 
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    name="Raw qₓ"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey={selectedGraduation === 'whittaker_henderson' ? 'whittaker' : 
                                             selectedGraduation === 'moving_average' ? 'moving_avg' : 'spline'} 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    dot={false}
                                    name="Graduated qₓ"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Fitted Parametric Models */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Target className="w-6 h-6 text-secondary" />
                        Parametric Model Fits
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Gompertz and Makeham mortality laws fitted to observed data
                    </p>

                    <div className="h-96 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={rawMortalityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                                <YAxis label={{ value: 'Mortality Rate (per 1000)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="raw_qx" 
                                    stroke="#94a3b8" 
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    name="Observed"
                                />
                                {gompertz.success && (
                                    <Line 
                                        type="monotone" 
                                        dataKey="gompertz" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        name="Gompertz"
                                    />
                                )}
                                {makeham.success && (
                                    <Line 
                                        type="monotone" 
                                        dataKey="makeham" 
                                        stroke="#f59e0b" 
                                        strokeWidth={3}
                                        strokeDasharray="3 3"
                                        dot={false}
                                        name="Makeham"
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Model Parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Gompertz Parameters */}
                        {gompertz.success && (
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Gompertz Model
                                </h3>
                                <p className="text-sm text-gray-700 mb-4 font-mono">{gompertz.formula}</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">α (alpha):</span>
                                        <span className="font-bold">{gompertz.parameters.alpha.toExponential(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">β (beta):</span>
                                        <span className="font-bold">{gompertz.parameters.beta.toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-700">R²:</span>
                                        <span className="font-bold text-green-700">{gompertz.r_squared.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">RMSE:</span>
                                        <span className="font-bold">{gompertz.rmse.toFixed(6)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Makeham Parameters */}
                        {makeham.success && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Makeham Model
                                </h3>
                                <p className="text-sm text-gray-700 mb-4 font-mono">{makeham.formula}</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">A:</span>
                                        <span className="font-bold">{makeham.parameters.A.toExponential(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">B:</span>
                                        <span className="font-bold">{makeham.parameters.B.toExponential(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">C:</span>
                                        <span className="font-bold">{makeham.parameters.C.toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-700">R²:</span>
                                        <span className="font-bold text-amber-700">{makeham.r_squared.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">RMSE:</span>
                                        <span className="font-bold">{makeham.rmse.toFixed(6)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Survival Curve (lx) */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-6 h-6 text-accent" />
                        Survival Curve (lₓ)
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Number of survivors at each age from initial cohort of {kpis.total_population.toLocaleString()}
                    </p>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={lifeTableData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                                <YAxis label={{ value: 'Survivors (lₓ)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Area 
                                    type="monotone" 
                                    dataKey="lx" 
                                    stroke="#8b5cf6" 
                                    fill="#c4b5fd"
                                    fillOpacity={0.6}
                                    name="Survivors"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Deaths Curve (dx) */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-6 h-6 text-danger" />
                        Deaths Distribution (dₓ)
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Number of deaths occurring at each age
                    </p>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lifeTableData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                                <YAxis label={{ value: 'Deaths (dₓ)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Bar 
                                    dataKey="dx" 
                                    fill="#ef4444"
                                    name="Deaths"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Life Expectancy Curve (ex) */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-primary" />
                        Life Expectancy by Age (eₓ)
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Remaining life expectancy at each age
                    </p>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lifeTableData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                                <YAxis label={{ value: 'Life Expectancy (eₓ)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="ex" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    dot={{ r: 2 }}
                                    name="Life Expectancy"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Life Table */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-secondary" />
                        Complete Life Table
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Full actuarial life table with all computed values
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr className="border-b-2 border-gray-300">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Age (x)</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">qₓ</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">pₓ</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">lₓ</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">dₓ</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Lₓ</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Tₓ</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">eₓ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mortalityData.life_table.slice(0, 20).map((row: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-4 py-2 font-semibold text-gray-900">{row.age}</td>
                                        <td className="px-4 py-2 text-right text-gray-900">{row.qx.toFixed(6)}</td>
                                        <td className="px-4 py-2 text-right text-gray-900">{row.px.toFixed(6)}</td>
                                        <td className="px-4 py-2 text-right text-gray-900">{row.lx.toFixed(0)}</td>
                                        <td className="px-4 py-2 text-right text-gray-900">{row.dx.toFixed(0)}</td>
                                        <td className="px-4 py-2 text-right text-gray-900">{row.Lx.toFixed(0)}</td>
                                        <td className="px-4 py-2 text-right text-gray-900">{row.Tx.toFixed(0)}</td>
                                        <td className="px-4 py-2 text-right text-gray-900">{row.ex.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {mortalityData.life_table.length > 20 && (
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                Showing first 20 rows of {mortalityData.life_table.length} total ages
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => router.back()} className="btn-secondary flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <button onClick={() => router.push('/upload')} className="btn-primary flex items-center justify-center gap-2">
                        <Activity className="w-5 h-5" />
                        Analyze Another Dataset
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MortalityDashboard() {
    return (
        <ProtectedRoute>
            <MortalityDashboardContent />
        </ProtectedRoute>
    );
}
