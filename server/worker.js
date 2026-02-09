import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const worker = new Worker('file-upload-queue', async (job) => {
    console.log(`[Queue] Received job: ${job.id} for ${job.data.fileName}`);
    if (job.name === 'file-ready') {
        try {
            const { fileKey, fileName } = job.data;

            // 1. Download from S3 securely
            console.log(`[1/5] Downloading from S3: ${fileKey}...`);
            const command = new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: fileKey,
            });

            const { Body } = await s3.send(command);
            const arrayBuffer = await Body.transformToByteArray();
            const buffer = Buffer.from(arrayBuffer);

            // 2. Save Temp
            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }
            const tempPath = path.join(tempDir, `${Date.now()}-${fileName}`);
            fs.writeFileSync(tempPath, buffer);
            console.log(`[2/5] Saved to temp storage for processing`);

            // 3. Load PDF
            const loader = new PDFLoader(tempPath);
            const docs = await loader.load();
            console.log(`[3/5] Successfully loaded PDF. Found ${docs.length} pages.`);

            // 4. Split Text
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 500,
                chunkOverlap: 50
            });
            const texts = await splitter.splitDocuments(docs);
            console.log(`[4/5] Split PDF into ${texts.length} text chunks`);

            if (texts.length === 0) {
                console.warn("⚠️ Warning: No text content extracted from PDF.");
                return;
            }

            // 5. Vector Store
            console.log(`[5/5] Initializing embeddings and connecting to Qdrant...`);
            console.log(`Target URL: ${process.env.QDRANT_URL}`);

            const embeddings = new OpenAIEmbeddings({
                model: "text-embedding-3-large",
                openAIApiKey: process.env.OPENAI_API_KEY,
            });

            console.log(`[6/5] Connecting to Qdrant collection 'pdf-rag'...`);

            const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
                url: process.env.QDRANT_URL,
                apiKey: process.env.QDRANT_API,
                collectionName: "pdf-rag",
                checkCompatibility: false, // Disabling version check to avoid compatibility errors
            });

            console.log(`Adding ${texts.length} chunks to Qdrant...`);
            const result = await vectorStore.addDocuments(texts);
            console.log('✅ SUCCESS: Documents added to Qdrant vector store:', result);

            // Clean up temp file
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }

        } catch (error) {
            console.error(`❌ WORKER FAILED at job ${job.id}:`, error.message);
        }
    }
},
    {
        connection: {
            url: process.env.REDIS_URL,
            tls: {
                rejectUnauthorized: false
            }
        },
    }
);