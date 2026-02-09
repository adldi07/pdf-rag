import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
dotenv.config();

console.log("Starting inspection...");
console.log("URL:", process.env.QDRANT_URL);

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API,
});

async function run() {
    try {
        const collections = await client.getCollections();
        console.log("Collections:", JSON.stringify(collections, null, 2));

        const response = await client.scroll('pdf-rag', {
            limit: 1,
            with_payload: true,
        });
        console.log("Sample Point:", JSON.stringify(response.points[0], null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
