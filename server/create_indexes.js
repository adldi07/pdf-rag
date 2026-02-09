import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
dotenv.config();

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API,
});

async function createIndex() {
    try {
        console.log("Creating payload index for 'userId'...");
        await client.createPayloadIndex('pdf-rag', {
            field_name: 'userId',
            field_schema: 'keyword',
            wait: true,
        });
        console.log("✅ Payload index for 'userId' created successfully.");

        console.log("Creating payload index for 'uploadId'...");
        await client.createPayloadIndex('pdf-rag', {
            field_name: 'uploadId',
            field_schema: 'keyword',
            wait: true,
        });
        console.log("✅ Payload index for 'uploadId' created successfully.");
    } catch (err) {
        console.error("❌ Failed to create index:", err.message);
    }
}

createIndex();
