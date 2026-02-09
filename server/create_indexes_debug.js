import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
dotenv.config();

console.log("QDRANT_URL length:", process.env.QDRANT_URL?.length);

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API,
});

async function createIndex() {
    try {
        console.log("Checking collections...");
        const collections = await client.getCollections();
        console.log("Collections:", collections);

        console.log("Creating payload index for 'userId'...");
        const result = await client.createPayloadIndex('pdf-rag', {
            field_name: 'userId',
            field_schema: 'keyword',
            wait: true,
        });
        console.log("Result:", result);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
        if (err.response) {
            console.error("Response body:", await err.response.text());
        }
    }
}

createIndex();
