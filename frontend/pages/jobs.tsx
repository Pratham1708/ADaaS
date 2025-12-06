import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Job {
    job_id: string;
    dataset_id: string;
    analysis_type: string;
    status: string;
    created_at: string;
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await axios.get<Job[]>(`${API_URL}/api/v1/jobs`);
            setJobs(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '40px' }}>Loading jobs...</div>;
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>All Jobs</h1>

            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    Error: {error}
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <a href="/upload" style={{ color: 'blue', textDecoration: 'underline' }}>
                    Upload New Dataset
                </a>
            </div>

            {jobs.length === 0 ? (
                <p style={{ marginTop: '20px' }}>No jobs found.</p>
            ) : (
                <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Job ID</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Dataset ID</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Created</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job.job_id}>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{job.job_id}</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{job.dataset_id}</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{job.analysis_type}</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                    <span
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: '3px',
                                            backgroundColor:
                                                job.status === 'finished'
                                                    ? '#d4edda'
                                                    : job.status === 'failed'
                                                        ? '#f8d7da'
                                                        : '#fff3cd',
                                            color:
                                                job.status === 'finished'
                                                    ? '#155724'
                                                    : job.status === 'failed'
                                                        ? '#721c24'
                                                        : '#856404',
                                        }}
                                    >
                                        {job.status}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                    {new Date(job.created_at).toLocaleString()}
                                </td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                    {job.analysis_type === 'survival' && (
                                        <a
                                            href={`/analysis/${job.job_id}`}
                                            style={{ color: 'blue', textDecoration: 'underline' }}
                                        >
                                            View Results
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
