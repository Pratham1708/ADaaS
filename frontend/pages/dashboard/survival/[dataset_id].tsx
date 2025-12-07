import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import KMChart from '../../../components/KMChart';
import {
    Activity, Users, Skull, CheckCircle, Clock, Loader2, AlertTriangle, Info
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com';

function SurvivalPageContent() {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [survivalData, setSurvivalData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!dataset_id) return;

        const fetchData = async () => {
            try {
                console.log('[Survival Page] Fetching survival analysis for dataset:', dataset_id);
                const survivalResponse = await axios.get(`${API_URL}/api/v1/datasets/survival-analysis/${dataset_id}`);
                console.log('[Survival Page] Response:', survivalResponse.data);

                if (survivalResponse.data.has_survival_data) {
                    setSurvivalData(survivalResponse.data.survival_analysis);
                } else {
                    setError(survivalResponse.data.message || 'No survival data available for this dataset');
                }
            } catch (err: any) {
                console.error('[Survival Page] Error:', err);
                setError(err.response?.data?.detail || 'Failed to load survival analysis');
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
                    <h2 className="text-2xl font-bold text-gray-800">Loading Survival Analysis...</h2>
                    <p className="text-gray-600 mt-2">Computing Kaplan-Meier curves</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-2xl">
                    <Info className="w-16 h-16 text-accent mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">No Survival Data Available</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <div className="mt-6 p-4 bg-accent-light rounded-lg border border-accent">
                        <p className="text-sm text-gray-700">
                            <strong>Note:</strong> Survival analysis requires datasets with time-to-event data,
                            typically including columns like 'time', 'duration', 'event', or 'status'.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <Activity className="w-10 h-10 text-primary" />
                    Survival Analysis
                </h1>
                <p className="text-gray-600 mt-2">Kaplan-Meier curves, life tables, and hazard functions</p>
            </div>

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
                <div className="card mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Kaplan-Meier Survival Curve</h3>
                    <p className="text-gray-600 mb-6">Probability of survival over time with 95% confidence intervals</p>
                    <div className="h-96">
                        <KMChart data={survivalData.overall_km} isHazard={false} />
                    </div>
                </div>
            )}

            {/* Nelson-Aalen Cumulative Hazard */}
            {survivalData.nelson_aalen && (
                <div className="card mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Nelson-Aalen Cumulative Hazard</h3>
                    <p className="text-gray-600 mb-6">Cumulative hazard function over time</p>
                    <div className="h-96">
                        <KMChart data={survivalData.nelson_aalen} isHazard={true} />
                    </div>
                </div>
            )}

            {/* Life Table */}
            {survivalData.life_table && survivalData.life_table.length > 0 && (
                <div className="card">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Life Table</h3>
                    <p className="text-gray-600 mb-6">Detailed survival statistics at each time point</p>
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
        </div>
    );
}

export default function SurvivalPage() {
    const router = useRouter();
    const { dataset_id } = router.query;

    return (
        <ProtectedRoute>
            {dataset_id && (
                <DashboardLayout datasetId={dataset_id as string}>
                    <SurvivalPageContent />
                </DashboardLayout>
            )}
        </ProtectedRoute>
    );
}
