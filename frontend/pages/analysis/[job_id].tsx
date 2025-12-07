import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import KMChart from '../../components/KMChart';
import LifeTable from '../../components/LifeTable';
import { BarChart3, AlertTriangle, Loader2, Upload, Activity } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com';

export default function AnalysisPage() {
    const router = useRouter();
    const { job_id } = router.query;
    const [jobData, setJobData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!job_id) return;

        const fetchJobData = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/v1/analysis/results/${job_id}`);
                setJobData(response.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load analysis');
            } finally {
                setLoading(false);
            }
        };

        fetchJobData();
    }, [job_id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center animate-fade-in">
                    <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Loading Dashboard...</h2>
                    <p className="text-gray-600 mt-2">Please wait while we prepare your interactive dashboard</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-danger">Error</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <button
                        onClick={() => router.push('/upload')}
                        className="btn-primary mt-6 inline-flex items-center gap-2"
                    >
                        <Upload className="w-5 h-5" />
                        Back to Upload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <BarChart3 className="w-10 h-10 text-primary" />
                        Interactive Actuarial Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">Job ID: {job_id}</p>
                </div>

                {/* Kaplan-Meier Curve */}
                {jobData?.kaplan_meier && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-primary" />
                            Kaplan-Meier Survival Curve
                        </h2>
                        <KMChart data={jobData.kaplan_meier} />
                    </div>
                )}

                {/* Life Table */}
                {jobData?.life_table && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-secondary" />
                            Life Table
                        </h2>
                        <LifeTable data={jobData.life_table} />
                    </div>
                )}

                {/* Cox Model */}
                {jobData?.cox_model && (
                    <div className="card bg-purple-light border-2 border-purple mb-8">
                        <h2 className="text-2xl font-bold text-purple-dark mb-6">
                            Cox Proportional Hazards Model
                        </h2>
                        <pre className="bg-white p-4 rounded-lg overflow-x-auto text-sm">
                            {JSON.stringify(jobData.cox_model, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Action Button */}
                <div className="flex justify-center">
                    <button
                        onClick={() => router.push('/upload')}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Upload className="w-5 h-5" />
                        Upload Another Dataset
                    </button>
                </div>
            </div>
        </div>
    );
}
