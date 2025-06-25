'use server';

import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import transferStore from '@/lib/transfer-store';

const EXPIRATION_TIME_MS = 5 * 60 * 1000; // 5 minutes

function generateId(length = 6) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * @route POST /api/transfer
 * @description Receives user data, stores it temporarily, and returns a unique ID.
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const id = generateId();
        const expires = Date.now() + EXPIRATION_TIME_MS;
        
        transferStore.set(id, { data, expires });
        
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

    const record = transferStore.get(id);

    // Check if the record exists and if it has expired.
    if (!record || Date.now() > record.expires) {
        // If the record exists but is expired, delete it.
        if (record) {
            transferStore.delete(id);
        }
        return NextResponse.json({ error: 'Data not found. It may have expired.' }, { status: 404 });
    }
    
    // The data has been retrieved, so we delete it for secure, one-time use.
    transferStore.delete(id);
    
    return NextResponse.json(record.data);
}
