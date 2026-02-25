import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


export async function indexTheDocuments(filePath) {
    const loader = new PDFLoader(filePath,{ splitPages: false }); // making into one page to avoid token limit issues
    const doc = await loader.load();
    
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
    });
    const texts = await textSplitter.splitText(doc[0].pageContent);
    console.log(texts.length);
}