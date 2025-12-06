import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Bar, Scatter, Line } from 'react-chartjs-2';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface GraphConfig {
    type: string;
    fields: string[];
    reason: string;
    params?: Record<string, any>;
}

interface RecommendedChartProps {
    graphs: GraphConfig[];
    data: any[];
}

const RecommendedChart: React.FC<RecommendedChartProps> = ({ graphs, data }) => {
    if (!graphs || graphs.length === 0) {
        return null;
    }

    const renderChart = (graph: GraphConfig, index: number) => {
        const { type, fields, reason, params } = graph;

        // Prepare data based on chart type
        let chartData: any = null;
        let chartOptions: ChartOptions<any> = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: true,
                    text: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${fields.join(' vs ')}`,
                },
            },
        };

        try {
            switch (type) {
                case 'histogram':
                case 'bar':
                    if (fields.length === 1) {
                        // Single field - frequency distribution
                        const values = data.map(row => row[fields[0]]).filter(v => v !== null && v !== undefined);
                        const uniqueValues = Array.from(new Set(values));
                        const counts = uniqueValues.map(val => values.filter(v => v === val).length);

                        chartData = {
                            labels: uniqueValues.slice(0, 20), // Limit to 20 categories
                            datasets: [{
                                label: fields[0],
                                data: counts.slice(0, 20),
                                backgroundColor: 'rgba(33, 150, 243, 0.6)',
                                borderColor: 'rgba(33, 150, 243, 1)',
                                borderWidth: 1,
                            }],
                        };
                    } else if (fields.length === 2) {
                        // Two fields - categorical vs numeric
                        const categories = Array.from(new Set(data.map(row => row[fields[0]]))).slice(0, 10);
                        const values = categories.map(cat => {
                            const filtered = data.filter(row => row[fields[0]] === cat);
                            const nums = filtered.map(row => row[fields[1]]).filter(v => typeof v === 'number');
                            return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
                        });

                        chartData = {
                            labels: categories,
                            datasets: [{
                                label: fields[1],
                                data: values,
                                backgroundColor: 'rgba(76, 175, 80, 0.6)',
                                borderColor: 'rgba(76, 175, 80, 1)',
                                borderWidth: 1,
                            }],
                        };
                    }
                    return chartData ? <Bar key={index} data={chartData} options={chartOptions} /> : null;

                case 'scatter':
                    if (fields.length >= 2) {
                        const scatterData = data
                            .filter(row => typeof row[fields[0]] === 'number' && typeof row[fields[1]] === 'number')
                            .map(row => ({ x: row[fields[0]], y: row[fields[1]] }))
                            .slice(0, 500); // Limit to 500 points

                        chartData = {
                            datasets: [{
                                label: `${fields[0]} vs ${fields[1]}`,
                                data: scatterData,
                                backgroundColor: 'rgba(255, 152, 0, 0.6)',
                                borderColor: 'rgba(255, 152, 0, 1)',
                            }],
                        };

                        chartOptions.scales = {
                            x: { title: { display: true, text: fields[0] } },
                            y: { title: { display: true, text: fields[1] } },
                        };
                    }
                    return chartData ? <Scatter key={index} data={chartData} options={chartOptions} /> : null;

                case 'line':
                    if (fields.length >= 2) {
                        const sortedData = [...data]
                            .filter(row => row[fields[0]] !== null && row[fields[1]] !== null)
                            .sort((a, b) => a[fields[0]] - b[fields[0]])
                            .slice(0, 100);

                        chartData = {
                            labels: sortedData.map(row => row[fields[0]]),
                            datasets: [{
                                label: fields[1],
                                data: sortedData.map(row => row[fields[1]]),
                                borderColor: 'rgba(156, 39, 176, 1)',
                                backgroundColor: 'rgba(156, 39, 176, 0.2)',
                                tension: 0.1,
                            }],
                        };
                    }
                    return chartData ? <Line key={index} data={chartData} options={chartOptions} /> : null;

                case 'boxplot':
                    // Simplified boxplot as bar chart showing quartiles
                    if (fields.length >= 1) {
                        const values = data.map(row => row[fields[0]]).filter(v => typeof v === 'number').sort((a, b) => a - b);
                        if (values.length > 0) {
                            const q1 = values[Math.floor(values.length * 0.25)];
                            const median = values[Math.floor(values.length * 0.5)];
                            const q3 = values[Math.floor(values.length * 0.75)];
                            const min = values[0];
                            const max = values[values.length - 1];

                            chartData = {
                                labels: ['Min', 'Q1', 'Median', 'Q3', 'Max'],
                                datasets: [{
                                    label: fields[0],
                                    data: [min, q1, median, q3, max],
                                    backgroundColor: 'rgba(244, 67, 54, 0.6)',
                                    borderColor: 'rgba(244, 67, 54, 1)',
                                    borderWidth: 1,
                                }],
                            };
                        }
                    }
                    return chartData ? <Bar key={index} data={chartData} options={chartOptions} /> : null;

                default:
                    return null;
            }
        } catch (error) {
            console.error('[ERROR] Chart rendering failed:', error);
            return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-gray-900">Recommended Visualizations</h2>
            </div>

            {graphs.slice(0, 3).map((graph, index) => (
                <div key={index} className="card">
                    <div className="flex items-start space-x-3 mb-4">
                        <Info className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                {graph.type.charAt(0).toUpperCase() + graph.type.slice(1)} Chart
                            </h3>
                            <p className="text-gray-600 text-sm">{graph.reason}</p>
                        </div>
                    </div>
                    <div className="h-96">
                        {renderChart(graph, index)}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecommendedChart;
