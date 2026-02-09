import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
    const client = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API,
    });

    const result = await client.scroll('pdf-rag', {
        limit: 2,
        with_payload: true,
    });

    console.log(JSON.stringify(result, null, 2));
}

inspect();
