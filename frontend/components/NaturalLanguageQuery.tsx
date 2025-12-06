import React, { useState } from 'react';
import { Bar, Line, Scatter, Pie, Bubble } from 'react-chartjs-2';
import { MessageSquare, Send, Loader, Sparkles, Info, AlertCircle } from 'lucide-react';
import axios from 'axios';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface NLQProps {
    datasetId: string;
    datasetColumns: string[];
}

interface ChartResult {
    chart_type: string;
    chart_data: any;
    reasoning: string;
    columns_used: string[];
    title: string;
}

const NaturalLanguageQuery: React.FC<NLQProps> = ({ datasetId, datasetColumns }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ChartResult | null>(null);
    const [error, setError] = useState('');

    const exampleQueries = [
        "Plot claim severity by age",
        "Show distribution of claim amounts",
        "Bar chart of frequency by region",
        "Heatmap of age vs status"
    ];


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) {
            setError('Please enter a query');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            console.log('[NLQ] Sending query:', query);
            const response = await axios.post(`${API_URL}/api/v1/nlq`, {
                dataset_id: datasetId,
                query: query
            });

            console.log('[NLQ] Response:', response.data);
            setResult(response.data);
        } catch (err: any) {
            console.error('[NLQ] Error:', err);
            setError(err.response?.data?.detail || 'Failed to process query. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExampleClick = (exampleQuery: string) => {
        setQuery(exampleQuery);
    };

    const renderChart = () => {
        if (!result) return null;

        const chartOptions: any = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: true,
                    text: result.title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
            },
        };

        // Add scales for scatter plots
        if (result.chart_type === 'scatter') {
            chartOptions.scales = {
                x: { title: { display: true, text: result.columns_used[0] || 'X' } },
                y: { title: { display: true, text: result.columns_used[1] || 'Y' } },
            };
        }

        // Add scales for heatmap (bubble chart representation)
        if (result.chart_type === 'heatmap') {
            // Prepare heatmap data with colors
            const heatmapData = result.chart_data.datasets[0].data;
            const maxValue = Math.max(...heatmapData.map((d: any) => d.v));

            // Generate colors based on value intensity
            const colors = heatmapData.map((d: any) => {
                const intensity = d.v / maxValue;
                const r = Math.floor(255 * intensity);
                const b = Math.floor(255 * (1 - intensity));
                return `rgba(${r}, 100, ${b}, 0.7)`;
            });

            result.chart_data.datasets[0].backgroundColor = colors;
            result.chart_data.datasets[0].borderColor = colors.map((c: string) => c.replace('0.7', '1'));


            chartOptions.scales = {
                x: {
                    type: 'category',
                    title: { display: true, text: result.columns_used[0] || 'X' }
                },
                y: {
                    type: 'category',
                    title: { display: true, text: result.columns_used[1] || 'Y' }
                },
            };
        }

        switch (result.chart_type) {
            case 'bar':
            case 'histogram':
                return <Bar data={result.chart_data} options={chartOptions} />;
            case 'line':
                return <Line data={result.chart_data} options={chartOptions} />;
            case 'scatter':
                return <Scatter data={result.chart_data} options={chartOptions} />;
            case 'pie':
                return <Pie data={result.chart_data} options={chartOptions} />;
            case 'heatmap':
                return <Bubble data={result.chart_data} options={chartOptions} />;
            default:
                return <Bar data={result.chart_data} options={chartOptions} />;
        }

    };

    return (
        <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 mb-8">
            <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Ask Questions About Your Data</h2>
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-semibold">
                    AI POWERED
                </span>
            </div>

            <div className="bg-white p-6 rounded-lg border border-indigo-200 mb-4">
                <p className="text-gray-700 mb-4">
                    Ask questions in natural language and get instant visualizations powered by Gemini AI.
                    <strong> Focus on visualization requests</strong> like "plot", "show distribution", "compare", or "heatmap".
                </p>

                {/* Example Queries */}
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Example queries:</p>
                    <div className="flex flex-wrap gap-2">
                        {exampleQueries.map((example, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleExampleClick(example)}
                                className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-full text-sm transition-colors"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Query Input */}
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., Plot claim severity by age..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Ask
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Results Display */}
                {result && (
                    <div className="space-y-4">
                        {/* AI Reasoning */}
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <div className="flex items-start gap-2 mb-2">
                                <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-indigo-900 mb-1">AI Analysis</h3>
                                    <p className="text-indigo-800 text-sm leading-relaxed">{result.reasoning}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-sm text-indigo-700">
                                <span className="font-semibold">Columns used:</span>
                                <div className="flex gap-1">
                                    {result.columns_used.map((col, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-indigo-200 rounded text-xs font-mono">
                                            {col}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chart Display */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="h-96">
                                {renderChart()}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Available Columns Info */}
            <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2 text-sm">Available columns in your dataset:</h3>
                <div className="flex flex-wrap gap-1">
                    {datasetColumns.slice(0, 10).map((col, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white text-indigo-700 rounded text-xs border border-indigo-200">
                            {col}
                        </span>
                    ))}
                    {datasetColumns.length > 10 && (
                        <span className="px-2 py-1 text-indigo-600 text-xs">
                            +{datasetColumns.length - 10} more
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NaturalLanguageQuery;
