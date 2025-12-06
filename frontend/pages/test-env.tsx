export default function TestEnv() {
    return (
        <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Environment Variables Test</h1>
            <p style={{ marginBottom: '30px', color: '#666' }}>
                This page checks if your Firebase environment variables are loaded correctly.
            </p>

            <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Firebase Configuration Status:</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <strong>API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing'}
                        {process.env.NEXT_PUBLIC_FIREBASE_API_KEY && (
                            <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                                ({process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10)}...)
                            </span>
                        )}
                    </li>
                    <li style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Loaded' : '❌ Missing'}
                        {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && (
                            <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                                ({process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN})
                            </span>
                        )}
                    </li>
                    <li style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ Missing'}
                        {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && (
                            <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                                ({process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID})
                            </span>
                        )}
                    </li>
                    <li style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <strong>Storage Bucket:</strong> {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Loaded' : '❌ Missing'}
                        {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET && (
                            <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                                ({process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET})
                            </span>
                        )}
                    </li>
                    <li style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                        <strong>Messaging Sender ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Loaded' : '❌ Missing'}
                        {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && (
                            <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                                ({process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID})
                            </span>
                        )}
                    </li>
                    <li style={{ padding: '10px' }}>
                        <strong>App ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Loaded' : '❌ Missing'}
                        {process.env.NEXT_PUBLIC_FIREBASE_APP_ID && (
                            <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                                ({process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 20)}...)
                            </span>
                        )}
                    </li>
                </ul>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                <h3 style={{ marginTop: 0 }}>⚠️ Troubleshooting Tips:</h3>
                <ol>
                    <li>Ensure your <code>.env.local</code> file is in the <code>frontend/</code> directory</li>
                    <li>All variables must start with <code>NEXT_PUBLIC_</code></li>
                    <li>No quotes around values in <code>.env.local</code></li>
                    <li>Restart the dev server after changing <code>.env.local</code></li>
                </ol>
            </div>

            <div style={{ marginTop: '20px' }}>
                <a href="/" style={{ color: '#2196F3', textDecoration: 'none' }}>← Back to Home</a>
            </div>
        </div>
    );
}
