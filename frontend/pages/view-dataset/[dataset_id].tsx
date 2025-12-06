import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ArrowLeft, FileText, Database, Download, AlertTriangle } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';

const ViewDatasetContent = () => {
    const router = useRouter();
    const { dataset_id } = router.query;
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const rowsPerPage = 50;

    useEffect(() => {
        if (!dataset_id) return;

        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/datasets/${dataset_id}/data`);
                setData(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching dataset:", err);
                setError("Failed to load dataset. Please try again.");
                setLoading(false);
            }
        };

        fetchData();
    }, [dataset_id]);

    const totalPages = Math.ceil(data.length / rowsPerPage);
    const currentData = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-gray-600 font-medium">Loading dataset...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
                        <AlertTriangle className="w-8 h-8 text-danger" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => router.back()} className="btn-primary flex items-center gap-2 mx-auto">
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <button
                            onClick={() => router.push(`/general-dashboard/${dataset_id}`)}
                            className="text-gray-500 hover:text-primary flex items-center gap-2 mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Database className="w-8 h-8 text-primary" />
                            Dataset Viewer
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Viewing {data.length.toLocaleString()} rows • {columns.length} columns
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button className="btn-secondary flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-900 w-16">#</th>
                                    {columns.map((col) => (
                                        <th key={col} className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentData.map((row, idx) => (
                                    <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-500">
                                            {((page - 1) * rowsPerPage) + idx + 1}
                                        </td>
                                        {columns.map((col) => (
                                            <td key={`${idx}-${col}`} className="px-6 py-4 text-gray-700 whitespace-nowrap">
                                                {row[col]?.toString() || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                            Showing <span className="font-medium">{((page - 1) * rowsPerPage) + 1}</span> to <span className="font-medium">{Math.min(page * rowsPerPage, data.length)}</span> of <span className="font-medium">{data.length}</span> results
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ViewDataset() {
    return (
        <ProtectedRoute>
            <ViewDatasetContent />
        </ProtectedRoute>
    );
}
