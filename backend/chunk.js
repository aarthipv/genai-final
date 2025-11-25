import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkText(text) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,       // target chunk size
    chunkOverlap: 150,     // keeps context between chunks
  });

  const chunks = await splitter.createDocuments([text]);

  // Convert docs → plain string array
  return chunks.map(doc => doc.pageContent);
}
