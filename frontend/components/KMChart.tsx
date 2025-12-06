import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface KMChartProps {
    data: {
        timeline: number[];
        survival?: number[];
        cumhaz?: number[];
        lower_ci?: number[];
        upper_ci?: number[];
    };
    isHazard?: boolean;
}

export default function KMChart({ data, isHazard = false }: KMChartProps) {
    console.log('=== KMChart Debug ===');
    console.log('Full data object:', JSON.stringify(data, null, 2));
    console.log('isHazard:', isHazard);

    const yData = isHazard ? data.cumhaz : data.survival;
    const yLabel = isHazard ? 'Cumulative Hazard' : 'Survival Probability';

    console.log('yData:', yData);
    console.log('yData length:', yData?.length);
    console.log('timeline:', data.timeline);
    console.log('timeline length:', data.timeline?.length);
    console.log('===================');

    if (!yData || yData.length === 0) {
        console.warn('No yData available for chart');
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999', border: '1px dashed #ccc', borderRadius: '8px' }}>
                <p><strong>No survival data available</strong></p>
                <p style={{ fontSize: '14px' }}>The dataset may not have enough time points for survival analysis.</p>
            </div>
        );
    }

    if (yData.length === 1) {
        console.warn('Only 1 data point available - chart may not be meaningful');
    }

    const chartData = {
        labels: data.timeline,
        datasets: [
            {
                label: yLabel,
                data: yData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
                tension: 0,
                stepped: true,
            },
            ...(data.lower_ci && data.upper_ci
                ? [
                    {
                        label: '95% CI Lower',
                        data: data.lower_ci,
                        borderColor: 'rgba(75, 192, 192, 0.3)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0,
                        stepped: true,
                        pointRadius: 0,
                    },
                    {
                        label: '95% CI Upper',
                        data: data.upper_ci,
                        borderColor: 'rgba(75, 192, 192, 0.3)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderDash: [5, 5],
                        fill: '-1',
                        tension: 0,
                        stepped: true,
                        pointRadius: 0,
                    },
                ]
                : []),
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time',
                },
            },
            y: {
                title: {
                    display: true,
                    text: yLabel,
                },
                min: 0,
                max: isHazard ? undefined : 1,
            },
        },
    };

    return <Line data={chartData} options={options} />;
}
