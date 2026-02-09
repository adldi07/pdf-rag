import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

const queue = new Queue('file-upload-queue', {
    connection: {
        url: process.env.REDIS_URL,
        tls: {
            rejectUnauthorized: false // Required for some older Node versions/environments with Upstash TLS
        }
    }
});

// const storage = multer.diskStorage({
//     destination: function (req, file , cb) {
//         cb(null, 'uploads/')
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//         cb(null, `${uniqueSuffix}-${file.originalname}`);
//     }
// });


const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});



// const upload = multer({ storage: storage });

const upload = multer({
    storage: multer.memoryStorage(),
});

const app = express();

// Initialize Qdrant Indexes
const initializeQdrant = async () => {
    try {
        const client = new QdrantVectorStore(new OpenAIEmbeddings(), {
            url: process.env.QDRANT_URL,
            apiKey: process.env.QDRANT_API,
            collectionName: "pdf-rag",
        }).client;

        console.log("🛠️ Checking Qdrant Payload Indexes...");

        await client.createPayloadIndex('pdf-rag', {
            field_name: 'metadata.userId',
            field_schema: 'keyword',
            wait: true,
        });

        await client.createPayloadIndex('pdf-rag', {
            field_name: 'metadata.uploadId',
            field_schema: 'keyword',
            wait: true,
        });

        console.log("✅ Qdrant Indexes Verified/Created.");
    } catch (err) {
        console.warn("⚠️ Qdrant index initialization note:", err.message);
    }
};

initializeQdrant();

// Configure CORS for production
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000', // for local development
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.get('/', (req, res) => {
    res.json({ status: "ok", message: "PDF RAG Backend is running" });
});

app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const key = `temp/${Date.now()}-${req.file.originalname}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            })
        );

        const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        const { userId } = req.body;
        const uploadId = Date.now().toString();
        const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 Hours

        console.log(`Adding job to queue for file: ${req.file.originalname} (User: ${userId}, ID: ${uploadId})`);

        // 1. Job to process the PDF
        const job = await queue.add('file-ready', {
            fileUrl,
            fileKey: key,
            fileName: req.file.originalname,
            userId,
            uploadId
        });

        // 2. Job to delete the PDF after expiration
        await queue.add('cleanup-doc', {
            userId,
            uploadId,
            fileName: req.file.originalname,
            fileKey: key
        }, {
            delay: EXPIRATION_TIME
        });

        console.log(`Job added: ${job.id}. Cleanup scheduled in 24h.`);

        return res.send("File uploaded successfully");

    } catch (err) {

        console.error(`Error uploading file: ${err}`);

        return res.status(500).json({ error: "Upload failed" });

    }
});

app.get('/chat', async (req, res) => {
    const userQuery = req.query.message;
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: "Authentication required: userId missing" });
    }

    console.log(`[Chat] Query from User: ${userId} - "${userQuery}"`);

    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API,
        checkCompatibility: false,
        collectionName: "pdf-rag",
    });

    const filter = {
        must: [
            {
                key: "metadata.userId",
                match: {
                    value: userId
                }
            }
        ]
    };

    console.log("[Chat] Using Filter:", JSON.stringify(filter, null, 2));

    const retriever = vectorStore.asRetriever({
        filter: filter,
        k: 5,
    });

    let result = [];
    try {
        result = await retriever.invoke(userQuery);
        console.log(`[Chat] Filtered search returned ${result.length} chunks.`);
    } catch (e) {
        console.error("❌ Retriever Error Details:", e.message);
        // Minimal fallback for safety
        result = await vectorStore.similaritySearch(userQuery, 2);
    }

    const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the following retrieved information: ${result}`;

    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const chatRes = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT,
            },
            {
                role: "user",
                content: `Question: ${userQuery}`,
            }
        ],
    });
    console.log('Retriever response:', result);

    return res.json({
        response: chatRes.choices[0].message.content,
        retrievedInfo: result,
    });
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});