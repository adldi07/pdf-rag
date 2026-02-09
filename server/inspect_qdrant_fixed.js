import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
    try {
        const client = new QdrantClient({
            url: process.env.QDRANT_URL,
            apiKey: process.env.QDRANT_API,
        });

        console.log("Fetching points from 'pdf-rag'...");
        const response = await client.scroll('pdf-rag', {
            limit: 5,
            with_payload: true,
            with_vector: false,
        });

        if (response.points.length === 0) {
            console.log("No points found in collection.");
            return;
        }

        console.log("Found Points:", response.points.length);
        response.points.forEach((point, i) => {
            console.log(`\nPoint ${i + 1} Payload:`, JSON.stringify(point.payload, null, 2));
        });
    } catch (err) {
        console.error("Inspection Error:", err.message);
    }
}

inspect();
