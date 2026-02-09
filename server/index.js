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

        console.log(`Adding job to queue for file: ${req.file.originalname}`);
        const job = await queue.add('file-ready', {
            fileUrl,
            fileKey: key, // Added this
            fileName: req.file.originalname,
        });
        console.log(`Job added: ${job.id}`);

        return res.send("File uploaded successfully");

    } catch (err) {

        console.error(`Error uploading file: ${err}`);

        return res.status(500).json({ error: "Upload failed" });

    }
});

app.get('/chat', async (req, res) => {
    const userQuery = req.query.message;
    // const userQuery = `what is lorem ipsum?`;


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


    const retriever = vectorStore.asRetriever({
        // Optional filtering parameters can be added here
        k: 2,
    });

    const result = await retriever.invoke(userQuery);

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