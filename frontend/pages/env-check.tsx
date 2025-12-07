import React from 'react';

export default function EnvCheck() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Environment Variable Check</h1>
            <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                <h2>NEXT_PUBLIC_API_URL:</h2>
                <p style={{
                    fontSize: '18px',
                    color: apiUrl === 'http://localhost:8000' ? 'red' : 'green',
                    fontWeight: 'bold'
                }}>
                    {apiUrl || 'NOT SET'}
                </p>

                <h2>Expected Value:</h2>
                <p style={{ fontSize: '18px', color: 'green', fontWeight: 'bold' }}>
                    https://adaas-backend.onrender.com
                </p>

                <h2>Status:</h2>
                <p style={{
                    fontSize: '18px',
                    color: apiUrl === 'https://adaas-backend.onrender.com' ? 'green' : 'red',
                    fontWeight: 'bold'
                }}>
                    {apiUrl === 'https://adaas-backend.onrender.com'
                        ? '✅ CORRECT - Environment variable is set properly!'
                        : '❌ INCORRECT - Environment variable is NOT set in Vercel dashboard'}
                </p>

                <h2>Instructions:</h2>
                <ol style={{ lineHeight: '1.8' }}>
                    <li>Go to: <a href="https://vercel.com/team_YWTffpoPK2bC6VuWlJSeiL3Y/adaas/settings/environment-variables" target="_blank">Vercel Environment Variables</a></li>
                    <li>Add: <code>NEXT_PUBLIC_API_URL</code> = <code>https://adaas-backend.onrender.com</code></li>
                    <li>Enable for: Production, Preview, Development</li>
                    <li>Click Save</li>
                    <li>Redeploy your application</li>
                    <li>Refresh this page</li>
                </ol>
            </div>
        </div>
    );
}
