import { Worker } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const worker = new Worker('file-upload-queue', async (job) => {
    console.log(`Received job with name: ${job.name} and data: ${JSON.stringify(job.data)}`);
    if (job.name === 'file-ready') {
        async function processFile() {
            try {
                const { fileName, destination, filePath } = job.data;
                console.log(`Processing file: ${fileName} at path: ${filePath}`);

                const path = filePath;

                const loader = new PDFLoader(path);
                const docs = await loader.load();

                // console.log('Extracted PDF documents:');
                // console.log('Total pages:', docs);

                const s = 500;
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: s,
                    chunkOverlap: 0
                });
                
                const texts = await splitter.splitDocuments(docs);
                // console.log('Split texts using chunk size', s, ':', texts.length, 'chunks');

                const embeddings = new OpenAIEmbeddings({
                    model: "text-embedding-3-large",
                    openAIApiKey: process.env.OPENAI_API_KEY,
                });

                const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
                    url: process.env.QDRANT_URL,
                    collectionName: "pdf-rag",
                });

                // console.log('First chunk preview:', texts[0].pageContent.substring(0, 200) + '...');

                // console.log('Split texts:', texts);

                const result = await vectorStore.addDocuments(texts);
                console.log('Documents added to Qdrant vector store:', result);

            }
            catch (error) {
                console.error( `Error processing file: ${error}`);
            }
        }
        await processFile();
    }
},
    {
        connection: {
            host: 'localhost',
            port: 6379,
        },
    }
);