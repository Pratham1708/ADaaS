import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
    Database, BarChart3, Activity, FileText, AlertTriangle,
    CheckCircle, TrendingUp, Grid, ArrowLeft, Loader, Sparkles
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ColumnProfile {
    name: string;
    dtype: string;
    missing_count: number;
    missing_percentage: number;
    unique_count: number;
    unique_percentage: number;
    type: string;
    stats?: any;
    top_values?: any[];
    sample_values?: any[];
}

interface DataQuality {
    overall_score: number;
    completeness_score: number;
    uniqueness_score: number;
    consistency_score: number;
    grade: string;
}

interface Overview {
    total_rows: number;
    total_columns: number;
    numeric_columns: number;
    categorical_columns: number;
    total_missing: number;
    missing_percentage: number;
    memory_usage_mb: number;
    duplicate_rows: number;
}

interface Profile {
    overview: Overview;
    columns: ColumnProfile[];
    data_quality: DataQuality;
    sample_data: any[];
}

interface DictionaryEntry {
    column_name: string;
    data_type: string;
    missing_count: number;
    missing_percentage: number;
    unique_values: number;
    sample_values: any[];
    description: string;
    quality_flags: string[];
    value_range?: string;
    mean?: number;
    cardinality?: number;
    most_common?: string;
    ai_generated?: boolean;
}

function DatasetWorkspaceContent() {
    const router = useRouter();
    const { dataset_id } = router.query;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'dictionary'>('overview');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!dataset_id) return;

        const fetchData = async () => {
            try {
                // Fetch profile
                const profileResponse = await axios.get(`${API_URL}/api/v1/datasets/${dataset_id}/profile`);
                setProfile(profileResponse.data);

                // Fetch data dictionary
                const dictResponse = await axios.get(`${API_URL}/api/v1/datasets/${dataset_id}/data-dictionary`);
                setDictionary(dictResponse.data);

            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load workspace data');
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
                    <Loader className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-800">Loading Workspace...</h2>
                    <p className="text-gray-600 mt-2">Profiling your dataset</p>
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

    if (!profile) return null;

    const filteredColumns = profile.columns.filter(col =>
        col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDictionary = dictionary.filter(entry =>
        entry.column_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getQualityColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-100';
        if (score >= 75) return 'text-blue-600 bg-blue-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getQualityFlagColor = (flag: string) => {
        if (flag === 'GOOD_QUALITY') return 'bg-green-100 text-green-800';
        if (flag.includes('HIGH_MISSING')) return 'bg-red-100 text-red-800';
        if (flag.includes('MODERATE_MISSING')) return 'bg-yellow-100 text-yellow-800';
        if (flag.includes('OUTLIERS')) return 'bg-orange-100 text-orange-800';
        if (flag.includes('SKEWED')) return 'bg-purple-100 text-purple-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <button
                                    onClick={() => router.push(`/general-dashboard/${dataset_id}`)}
                                    className="text-primary hover:text-primary-dark mb-2 flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </button>
                                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                                    <Database className="w-10 h-10 text-primary" />
                                    Dataset Workspace
                                </h1>
                                <p className="text-gray-600 mt-2">Dataset ID: {dataset_id}</p>
                            </div>

                            {/* Quality Score Badge */}
                            <div className={`px-6 py-4 rounded-lg ${getQualityColor(profile.data_quality.overall_score)}`}>
                                <div className="text-sm font-semibold">Data Quality</div>
                                <div className="text-3xl font-bold">{profile.data_quality.overall_score}%</div>
                                <div className="text-sm">{profile.data_quality.grade}</div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="flex gap-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`pb-4 px-2 font-semibold transition-colors ${activeTab === 'overview'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <BarChart3 className="w-5 h-5 inline mr-2" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('columns')}
                                className={`pb-4 px-2 font-semibold transition-colors ${activeTab === 'columns'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Grid className="w-5 h-5 inline mr-2" />
                                Column Profiling
                            </button>
                            <button
                                onClick={() => setActiveTab('dictionary')}
                                className={`pb-4 px-2 font-semibold transition-colors ${activeTab === 'dictionary'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <FileText className="w-5 h-5 inline mr-2" />
                                Data Dictionary
                            </button>
                        </nav>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Overview KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="kpi-card bg-primary-light border-primary">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-primary-dark mb-1">Total Rows</h3>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {profile.overview.total_rows.toLocaleString()}
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
                                                {profile.overview.total_columns}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {profile.overview.numeric_columns} numeric, {profile.overview.categorical_columns} categorical
                                            </p>
                                        </div>
                                        <Grid className="w-12 h-12 text-secondary" />
                                    </div>
                                </div>

                                <div className="kpi-card bg-accent-light border-accent">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-accent-dark mb-1">Missing Values</h3>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {profile.overview.total_missing.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {profile.overview.missing_percentage.toFixed(2)}% of total
                                            </p>
                                        </div>
                                        <AlertTriangle className="w-12 h-12 text-accent" />
                                    </div>
                                </div>

                                <div className="kpi-card bg-purple-light border-purple">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-purple-dark mb-1">Duplicates</h3>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {profile.overview.duplicate_rows.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {((profile.overview.duplicate_rows / profile.overview.total_rows) * 100).toFixed(2)}% of rows
                                            </p>
                                        </div>
                                        <Activity className="w-12 h-12 text-purple" />
                                    </div>
                                </div>
                            </div>

                            {/* Quality Metrics */}
                            <div className="card">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-primary" />
                                    Data Quality Metrics
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">Completeness</span>
                                            <span className="text-lg font-bold text-primary">
                                                {profile.data_quality.completeness_score.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{ width: `${profile.data_quality.completeness_score}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">Uniqueness</span>
                                            <span className="text-lg font-bold text-secondary">
                                                {profile.data_quality.uniqueness_score.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-secondary h-2 rounded-full"
                                                style={{ width: `${profile.data_quality.uniqueness_score}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">Consistency</span>
                                            <span className="text-lg font-bold text-purple">
                                                {profile.data_quality.consistency_score.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple h-2 rounded-full"
                                                style={{ width: `${profile.data_quality.consistency_score}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sample Data */}
                            <div className="card">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sample Data (First 10 Rows)</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                {profile.sample_data.length > 0 &&
                                                    Object.keys(profile.sample_data[0]).map((key) => (
                                                        <th key={key} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                            {key}
                                                        </th>
                                                    ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {profile.sample_data.map((row, idx) => (
                                                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                                    {Object.values(row).map((value: any, cellIdx) => (
                                                        <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900">
                                                            {value === null || value === undefined ? (
                                                                <span className="text-gray-400 italic">null</span>
                                                            ) : (
                                                                String(value)
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Column Profiling Tab */}
                    {activeTab === 'columns' && (
                        <div className="space-y-6">
                            {/* Search */}
                            <div className="card">
                                <input
                                    type="text"
                                    placeholder="Search columns..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            {/* Column Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredColumns.map((col) => (
                                    <div key={col.name} className="card hover:shadow-lg transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{col.name}</h3>
                                                <p className="text-sm text-gray-600">{col.dtype}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${col.type === 'numeric' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {col.type}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Missing:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {col.missing_count} ({col.missing_percentage.toFixed(1)}%)
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Unique:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {col.unique_count} ({col.unique_percentage.toFixed(1)}%)
                                                </span>
                                            </div>

                                            {col.type === 'numeric' && col.stats && (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Mean:</span>
                                                        <span className="font-semibold text-gray-900">{col.stats.mean?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Median:</span>
                                                        <span className="font-semibold text-gray-900">{col.stats.median?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Std Dev:</span>
                                                        <span className="font-semibold text-gray-900">{col.stats.std?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Range:</span>
                                                        <span className="font-semibold text-gray-900">
                                                            [{col.stats.min?.toFixed(2)}, {col.stats.max?.toFixed(2)}]
                                                        </span>
                                                    </div>
                                                    {col.stats.outlier_count > 0 && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Outliers:</span>
                                                            <span className="font-semibold text-orange-600">
                                                                {col.stats.outlier_count} ({col.stats.outlier_percentage?.toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {col.type === 'categorical' && col.stats && (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Mode:</span>
                                                        <span className="font-semibold text-gray-900">{col.stats.mode}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Cardinality:</span>
                                                        <span className="font-semibold text-gray-900">{col.stats.cardinality}</span>
                                                    </div>
                                                </>
                                            )}

                                            {col.sample_values && col.sample_values.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs text-gray-600 mb-1">Sample values:</p>
                                                    <p className="text-sm text-gray-900 font-mono">
                                                        {col.sample_values.slice(0, 3).map(v => String(v)).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data Dictionary Tab */}
                    {activeTab === 'dictionary' && (
                        <div className="space-y-6">
                            {/* Search */}
                            <div className="card">
                                <input
                                    type="text"
                                    placeholder="Search data dictionary..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            {/* Dictionary Table */}
                            <div className="card">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Column</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quality</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDictionary.map((entry) => (
                                                <tr key={entry.column_name} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        <div className="font-semibold text-gray-900">{entry.column_name}</div>
                                                        <div className="text-xs text-gray-600">
                                                            {entry.unique_values} unique
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                                                            {entry.data_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-700 max-w-md">
                                                        {entry.description}
                                                        {entry.ai_generated && (
                                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Generated by Gemini AI">
                                                                <Sparkles className="w-3 h-3 mr-1" />
                                                                AI
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {entry.quality_flags.map((flag) => (
                                                                <span
                                                                    key={flag}
                                                                    className={`px-2 py-1 rounded text-xs font-semibold ${getQualityFlagColor(flag)}`}
                                                                >
                                                                    {flag.replace(/_/g, ' ')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-700">
                                                        {entry.value_range && (
                                                            <div>Range: {entry.value_range}</div>
                                                        )}
                                                        {entry.mean !== undefined && (
                                                            <div>Mean: {entry.mean.toFixed(2)}</div>
                                                        )}
                                                        {entry.most_common && (
                                                            <div>Mode: {entry.most_common}</div>
                                                        )}
                                                        {entry.missing_percentage > 0 && (
                                                            <div className="text-orange-600">
                                                                Missing: {entry.missing_percentage.toFixed(1)}%
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function DatasetWorkspace() {
    return (
        <ProtectedRoute>
            <DatasetWorkspaceContent />
        </ProtectedRoute>
    );
}
