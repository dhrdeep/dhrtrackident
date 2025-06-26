// src/services/audioRecognition.ts (modified)

import CryptoJS from 'crypto-js'; // Keep this if other parts of your app use it, otherwise can remove if not used after this.

// DHR Logo URL (keep this)
const DHR_LOGO_URL = 'https://static.wixstatic.com/media/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.png/v1/fill/w_292,h_292,al_c,q_95,usm_0.66_1.00_0.01,enc_avif,quality_auto/da966a_f5f97999e9404436a2c30e3336a3e307~mv2.2.png'; // Corrected URL: .2.png instead of .01, consistent with other usage

export interface Track {
    id: string;
    title: string;
    album: string;
    artist: string;
    artwork?: string;
    timestamp: string;
    confidence?: number;
    service: 'ACRCloud' | 'Shazam';
    duration?: number;
    genre?: string;
    releaseDate?: string;
}

// Helper function to convert audio blob to base64 for sending to Netlify Function
const audioToBase64 = (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
            const base64 = btoa(binaryString);
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(audioBlob);
    });
};

// Get Dublin timezone timestamp as ISO string (keep this)
const getDublinTimestamp = (): string => {
    const now = new Date();
    const dublinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Dublin' }));
    return dublinTime.toISOString();
};

// Artwork resolution helper (simplifying as most will come from the API now)
const resolveArtwork = async (primaryArtwork: string | undefined, artist: string, title: string, album?: string): Promise<string> => {
    if (primaryArtwork) {
        return primaryArtwork; // Use artwork from API if available
    }
    return DHR_LOGO_URL; // Fallback to DHR logo
};

// Main identification function: Now calls the Netlify Function
export const identifyTrack = async (audioBlob: Blob): Promise<Track | null> => {
    try {
        console.log('Frontend: Starting track identification process via Netlify Function...');

        const audioBase64 = await audioToBase64(audioBlob);

        const response = await fetch('/.netlify/functions/identify-track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audioBase64 })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Could not parse error response' })); // Handle non-JSON errors
            console.error('Frontend: Error calling Netlify Function:', response.status, errorData);
            return null;
        }

        const result = await response.json();
        console.log('Frontend: Response from Netlify Function:', result);

        if (result.track) {
            // Enhance artwork (if needed, though function should return good artwork)
            result.track.artwork = await resolveArtwork(
                result.track.artwork,
                result.track.artist,
                result.track.title,
                result.track.album
            );
            // Add id and timestamp here as they are frontend-specific for history management
            return {
                id: `${result.track.service.toLowerCase()}_${Date.now()}`,
                timestamp: getDublinTimestamp(),
                ...result.track
            };
        }

        return null;

    } catch (error) {
        console.error('Frontend: Error during track identification via Netlify Function:', error);
        return null;
    }
};