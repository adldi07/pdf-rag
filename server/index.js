import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import {OpenAIEmbeddings} from "@langchain/openai";
import {QdrantVectorStore} from "@langchain/qdrant";

dotenv.config();

const queue = new Queue('file-upload-queue',
    {
        connection: {
            host: 'localhost',
            port: 6379,
        },
    }
);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send("Hello World");
});

app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
    await queue.add('file-ready', {
        fileName: req.file.originalname,
        destination: req.file.destination,
        filePath: req.file.path,
    });

    return res.send("File uploaded successfully");
});

app.get('/chat', async (req, res) => {
    const userQuery = `what is lorem ipsum?`;


    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
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