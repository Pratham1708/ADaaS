// API route to check environment variables
// Access this at: /api/check-env

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
}
