import { Worker } from 'bullmq';

const worker = new Worker('file-upload-queue', async (job) => {
    if (job.name === 'file-ready') {
        async function processFile() {
            const { fileName, destination, filePath } = job.data;
            console.log(`Processing file: ${fileName} at path: ${filePath}`);
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