import { ChromaClient } from "chromadb";

const client = new ChromaClient({
  path: "http://localhost:8000"
});

export async function getCollection(name) {
  try {
    // Try to get existing collection first
    return await client.getCollection({
      name: name
    });
  } catch (error) {
    // If collection doesn't exist, create it
    console.log(`Creating new collection: ${name}`);
    return await client.createCollection({
      name: name
    });
  }
}