// netlify/identify-track.js

import fetch from 'node-fetch'; // For making HTTP requests from the serverless function
import FormData from 'form-data'; // For handling multipart/form-data for ACRCloud
import { createHmac } from 'crypto'; // Node.js built-in crypto for HMAC-SHA1

// ACRCloud Configuration - These will come from Netlify Environment Variables
const ACRCLOUD_CONFIG = {
    host: process.env.ACRCLOUD_HOST,
    endpoint: '/v1/identify',
    access_key: process.env.ACRCLOUD_ACCESS_KEY,
    access_secret: process.env.ACRCLOUD_ACCESS_SECRET,
    data_type: 'audio',
    signature_version: '1'
};

// Shazam Configuration - These will come from Netlify Environment Variables
const SHAZAM_CONFIG = {
    host: process.env.SHAZAM_HOST,
    key: process.env.SHAZAM_API_KEY
};

// --- Helper Functions (Copied from your audioRecognition.ts, adapted for Node.js) ---

// Convert ArrayBuffer to Base64 for Shazam
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
}

// Generate ACRCloud signature (Node.js crypto equivalent)
const generateACRCloudSignature = (method, uri, accessKey, dataType, signatureVersion, timestamp, accessSecret) => {
    const stringToSign = [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
    return createHmac('sha1', accessSecret)
        .update(stringToSign)
        .digest('base64');
};

// --- API Identification Functions (Server-Side) ---

const identifyWithACRCloudServer = async (audioBuffer) => {
    try {
        console.log('Server: Starting ACRCloud identification');

        const timestamp = Math.floor(Date.now() / 1000);
        const signature = generateACRCloudSignature(
            'POST',
            ACRCLOUD_CONFIG.endpoint,
            ACRCLOUD_CONFIG.access_key,
            ACRCLOUD_CONFIG.data_type,
            ACRCLOUD_CONFIG.signature_version,
            timestamp,
            ACRCLOUD_CONFIG.access_secret
        );

        const formData = new FormData();
        formData.append('sample', Buffer.from(audioBuffer), { filename: 'sample.wav', contentType: 'audio/wav' });
        formData.append('sample_bytes', audioBuffer.byteLength.toString());
        formData.append('access_key', ACRCLOUD_CONFIG.access_key);
        formData.append('data_type', ACRCLOUD_CONFIG.data_type);
        formData.append('signature_version', ACRCLOUD_CONFIG.signature_version);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp.toString());

        const response = await fetch(`https://${ACRCLOUD_CONFIG.host}${ACRCLOUD_CONFIG.endpoint}`, {
            method: 'POST',
            body: formData,
            // Node-fetch handles content-type for FormData automatically
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server: ACRCloud response not ok:', response.status, response.statusText, errorText);
            return null;
        }

        const result = await response.json();
        console.log('Server: ACRCloud response:', result);

        if (result.status.code === 0 && result.metadata?.music?.length > 0) {
            const music = result.metadata.music[0];
            return {
                title: music.title || 'Unknown Title',
                artist: music.artists?.[0]?.name || 'Unknown Artist',
                album: music.album?.name || 'Unknown Album',
                artwork: music.album?.artwork_url_500 || music.album?.artwork_url_300 || null,
                confidence: Math.round(music.score || 0),
                service: 'ACRCloud',
                duration: music.duration_ms ? Math.round(music.duration_ms / 1000) : undefined,
                releaseDate: music.release_date
            };
        }
        return null;

    } catch (error) {
        console.error('Server: ACRCloud identification error:', error);
        return null;
    }
};

const identifyWithShazamServer = async (audioBuffer) => {
    try {
        console.log('Server: Starting Shazam identification');
        const audioBase64 = arrayBufferToBase64(audioBuffer);

        const response = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'X-RapidAPI-Key': SHAZAM_CONFIG.key,
                'X-RapidAPI-Host': SHAZAM_CONFIG.host
            },
            body: audioBase64
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server: Shazam response not ok:', response.status, response.statusText, errorText);
            return null;
        }

        const result = await response.json();
        console.log('Server: Shazam response:', result);

        if (result.track) {
            const track = result.track;
            return {
                title: track.title || 'Unknown Title',
                artist: track.subtitle || 'Unknown Artist',
                album: track.sections?.[0]?.metadata?.find((m) => m.title === 'Album')?.text || 'Unknown Album',
                artwork: track.images?.coverart || track.images?.coverarthq || null,
                confidence: 85, // Shazam doesn't provide confidence score
                service: 'Shazam'
            };
        }
        return null;

    } catch (error) {
        console.error('Server: Shazam identification error:', error);
        return null;
    }
};


// Main Netlify Function Handler
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { audioBase64 } = JSON.parse(event.body);

        if (!audioBase64) {
            return { statusCode: 400, body: 'Missing audio data' };
        }

        // Convert base64 to ArrayBuffer for API calls
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        // Try ACRCloud first
        let result = await identifyWithACRCloudServer(audioBuffer);

        if (result) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track: { ...result, service: 'ACRCloud' } })
            };
        }

        // Fallback to Shazam
        result = await identifyWithShazamServer(audioBuffer);

        if (result) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track: { ...result, service: 'Shazam' } })
            };
        }

        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track: null }) };

    } catch (error) {
        console.error('Serverless Function Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};