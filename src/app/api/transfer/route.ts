'use server';

import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

// In-memory store for the transfer data.
// In a production environment on a stateless platform like Vercel,
// you'd replace this with a proper cache like Redis or a temporary database record.
// For this app, this will work as long as the same serverless instance is hit.
const storage = new Map<string, { data: any; expires: number }>();
const EXPIRATION_TIME_MS = 5 * 60 * 1000; // 5 minutes

function generateId(length = 6) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Periodically clean up expired entries to prevent memory leaks if codes are generated but not used.
setInterval(() => {
    const now = Date.now();
    for (const [id, { expires }] of storage.entries()) {
        if (now > expires) {
            storage.delete(id);
        }
    }
}, 60 * 1000); // Check every minute


/**
 * @route POST /api/transfer
 * @description Receives user data, stores it temporarily, and returns a unique ID.
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const id = generateId();
        const expires = Date.now() + EXPIRATION_TIME_MS;
        
        storage.set(id, { data, expires });
        
        return NextResponse.json({ id });
    } catch (error) {
        console.error('API Error (POST /api/transfer):', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

/**
 * @route GET /api/transfer
 * @description Retrieves user data using a unique ID and then deletes it.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'An ID is required.' }, { status: 400 });
    }

    const record = storage.get(id);

    if (!record) {
        return NextResponse.json({ error: 'Data not found. It may have expired.' }, { status: 404 });
    }
    
    const now = Date.now();
    if (now > record.expires) {
        storage.delete(id);
        return NextResponse.json({ error: 'Data not found. It may have expired.' }, { status: 404 });
    }

    // The data has been retrieved, so we delete it for secure, one-time use.
    storage.delete(id);
    
    return NextResponse.json(record.data);
}
