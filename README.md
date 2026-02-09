# PDF RAG (Retrieval-Augmented Generation)

A modern, full-stack PDF-based Retrieval-Augmented Generation (RAG) application. This project allows users to upload PDF documents, which are then processed, indexed into a vector store, and used to provide context-aware answers via an AI chat interface.

## 🚀 Features

- **Authenticated PDF Upload**: Securely upload documents using Clerk for authentication.
- **Background Processing**: PDF text extraction, chunking, and embedding generation handled by BullMQ workers.
- **Vector Search**: High-performance similarity search using Qdrant.
- **AI Chat interface**: Context-aware chat powered by OpenAI's `gpt-4o`.
- **Automatic Cleanup**: Temporary documents and their embeddings are automatically deleted after 24 hours.
- **Multi-tenant Architecture**: Strict document isolation between users using metadata filtering.

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Clerk (Auth).
- **Backend**: Node.js, Express.js.
- **Worker**: BullMQ (with Redis/Valkey).
- **Storage**: AWS S3.
- **Vector Database**: Qdrant.
- **AI Models**:
  - Embeddings: `text-embedding-3-large` (OpenAI).
  - LLM: `gpt-4o` (OpenAI).

## 📂 Project Structure

```text
├── client/          # Next.js Frontend application
├── server/          # Express.js API & BullMQ Worker
│   ├── index.js     # API Server
│   └── worker.js    # Background processor
├── docker-compose.yml # Local service configuration (Qdrant & Valkey)
└── package.json     # Root management and scripts
```

## ⚙️ Prerequisites

- **Node.js** (v18+)
- **Docker** (For running local Qdrant/Redis services)
- **AWS S3 Bucket** (For document storage)
- **OpenAI API Key**
- **Clerk API Keys** (For authentication)

## 🔧 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd pdf-rag2
   ```

2. **Install dependencies**:
   ```bash
   npm install        # Root
   cd client && npm install
   cd ../server && npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root and server directories with the following structure:
   ```env
   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...

   # AI Configuration
   OPENAI_API_KEY=...

   # Vector Store (Qdrant)
   QDRANT_URL=...
   QDRANT_API=...

   # Database/Queue (Redis)
   REDIS_URL=...

   # Storage (AWS S3)
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=...
   AWS_S3_BUCKET=...

   # URLs
   FRONTEND_URL=http://localhost:3000
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

4. **Run Local Services**:
   ```bash
   docker-compose up -d
   ```

## 🏃 Running the Application

You can use the root `package.json` scripts to run the different parts of the application:

- **Full Project (Dev Mode)**:
  ```bash
  npm run dev          # Starts Backend with nodemon
  npm run startworker  # Starts the Worker
  npm run startfrontend # Starts the Next.js Frontend
  ```

- **Production Mode**:
  ```bash
  npm run startserver  # Starts Backend with node
  npm run startworker  # Starts the Worker
  ```

## 📝 Background Processing Flow

1. User uploads a PDF via the Frontend.
2. Backend receives the file, uploads it to **AWS S3**, and adds a job to the **BullMQ** queue.
3. The **Worker** picks up the job, downloads the PDF, and extracts text.
4. Text is split into chunks and converted into embeddings using **OpenAI**.
5. Embeddings are stored in **Qdrant** with user-specific metadata.
6. A cleanup job is scheduled to delete the document and embeddings after 24 hours.

## 🔒 Security & Optimization

- **Isolation**: Every vector point in Qdrant is tagged with a `userId`. Chat queries are strictly filtered by this ID.
- **Cleanup**: Prevents storage bloat by automatically removing processed data.
- **Scalability**: Decoupled API and Worker allowing independent scaling.

## 📄 License

ISC
