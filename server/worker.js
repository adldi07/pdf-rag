import { Worker } from 'bullmq';

import { OpenAIEmbeddings } from "@langchain/openai";
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

                console.log('Extracted PDF documents:');
                // console.log('Total pages:', docs);

                const s = 5000 ;
                const splitter = new RecursiveCharacterTextSplitter({ 
                    chunkSize: s, 
                    chunkOverlap: 0 
                });
                const texts = await splitter.splitDocuments(docs);
                console.log('Split texts using chunk size', s, ':', texts.length, 'chunks');

                for (const [index, text] of texts.entries()) {
                    console.log(`Chunk ${index + 1} preview:`, text.pageContent + '...');
                }
                // console.log('First chunk preview:', texts[0].pageContent.substring(0, 200) + '...');

                // console.log('Split texts:', texts);

            }
            catch (error) {
                console.error(`Error processing file: ${error}`);
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