import React from 'react';

interface LifeTableRow {
    time: number;
    at_risk: number;
    observed: number;
    censored: number;
}

interface LifeTableProps {
    data: LifeTableRow[];
}

export default function LifeTable({ data }: LifeTableProps) {
    if (!data || data.length === 0) {
        return <div>No life table data available</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>Time</th>
                        <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>At Risk</th>
                        <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>Observed</th>
                        <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'right' }}>Censored</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={idx}>
                            <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>
                                {row.time.toFixed(1)}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>
                                {row.at_risk}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>
                                {row.observed}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>
                                {row.censored}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
