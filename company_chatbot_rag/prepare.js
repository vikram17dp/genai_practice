import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CohereEmbeddings } from "@langchain/cohere";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import dotenv from "dotenv";

dotenv.config();

// 1️⃣ Initialize Pinecone (v3 way)
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// 2️⃣ Get index
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

// 3️⃣ Initialize embeddings
const embeddings = new CohereEmbeddings({
  model: "embed-english-v3.0",
  apiKey: process.env.COHERE_API_KEY,
});

// 4️⃣ Create vector store
const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
});

export async function indexTheDocuments(filePath) {
  const loader = new PDFLoader(filePath, {
    splitPages: false,
  });

  const docs = await loader.load();

  if (!docs || docs.length === 0) {
    throw new Error("No documents loaded from PDF.");
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const splitDocs = await textSplitter.splitDocuments(docs);

  console.log("Chunks created:", splitDocs.length);

  await vectorStore.addDocuments(splitDocs);

  console.log("Documents indexed successfully");
}
