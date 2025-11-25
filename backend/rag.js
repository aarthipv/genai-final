import dotenv from 'dotenv';
import { HfInference } from '@huggingface/inference';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// HuggingFace Embedding Client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Embeddings model for FAISS - Use HuggingFace API instead
class HuggingFaceEmbeddings {
  async embedDocuments(texts) {
    const embeddings = await Promise.all(
      texts.map(text => this.embedQuery(text))
    );
    return embeddings;
  }

  async embedQuery(text) {
    const embedding = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text,
    });
    return Array.isArray(embedding[0]) ? embedding[0] : embedding;
  }
}

const embeddings = new HuggingFaceEmbeddings();

// Directory to store FAISS indexes
const FAISS_DIR = path.join(__dirname, 'faiss_indexes');

// Create FAISS directory if it doesn't exist
if (!fs.existsSync(FAISS_DIR)) {
  fs.mkdirSync(FAISS_DIR, { recursive: true });
}

/**
 * Generate embedding for a chunk of text
 */
export async function saveEmbeddings(text) {
  console.log(`\n🔄 Embedding chunk (${text.length} chars)...`);

  const embedding = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: text,
  });

  console.log(`   ✔ Embedding size: ${embedding.length}`);
  return embedding;
}

/**
 * Save batch of READY-MADE chunks to FAISS
 * documents = [
 *   { id: "chunk_1", text: "...", metadata: {...} },
 *   { id: "chunk_2", text: "...", metadata: {...} },
 * ]
 */
export async function saveBatchToFaiss(documents, subjectName) {
  try {
    const collectionName = subjectName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const faissPath = path.join(FAISS_DIR, collectionName);

    console.log(`\n📚 Saving ${documents.length} chunks to FAISS: ${collectionName}`);

    // Prepare documents for FAISS
    const texts = documents.map(d => d.text);
    const metadatas = documents.map(d => ({
      ...(d.metadata || {}),
      id: d.id,
      subject: subjectName
    }));

    console.log(`\n🔄 Generating embeddings for all ${documents.length} chunks...\n`);

    // Check if FAISS index already exists
    let vectorStore;

    if (fs.existsSync(faissPath)) {
      console.log(`   📂 Loading existing FAISS index from: ${faissPath}`);
      // Load existing vector store
      vectorStore = await FaissStore.load(faissPath, embeddings);

      // Add new documents
      await vectorStore.addDocuments(
        texts.map((text, i) => ({
          pageContent: text,
          metadata: metadatas[i]
        }))
      );

      console.log(`   ✅ Added ${documents.length} new documents to existing index`);
    } else {
      console.log(`   📝 Creating new FAISS index`);
      // Create new vector store
      vectorStore = await FaissStore.fromTexts(
        texts,
        metadatas,
        embeddings
      );

      console.log(`   ✅ Created new index with ${documents.length} documents`);
    }

    // Save the vector store
    console.log(`\n💾 Saving FAISS index to disk...`);
    await vectorStore.save(faissPath);

    console.log(`\n✅ Successfully saved ${documents.length} chunks to FAISS: ${collectionName}`);
    console.log(`   📁 Index saved at: ${faissPath}`);

    return {
      success: true,
      count: documents.length,
      collection: collectionName,
      indexPath: faissPath
    };

  } catch (err) {
    console.error("\n❌ Failed saving chunks to FAISS", err);
    throw err;
  }
}

/**
 * Query FAISS vector store
 */
export async function queryFaiss(queryText, subjectName, topK = 10) {
  try {
    const collectionName = subjectName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const faissPath = path.join(FAISS_DIR, collectionName);

    console.log(`\n🔍 Querying FAISS index: ${collectionName}`);
    console.log(`   Query: "${queryText}"`);
    console.log(`   Top K results: ${topK}`);

    if (!fs.existsSync(faissPath)) {
      throw new Error(`FAISS index not found for subject: ${subjectName}`);
    }

    // Load the vector store
    const vectorStore = await FaissStore.load(faissPath, embeddings);

    // Perform similarity search
    const results = await vectorStore.similaritySearchWithScore(queryText, topK);

    console.log(`\n✅ Query completed!`);
    console.log(`   📊 Results found: ${results.length}`);

    return results.map(([doc, score]) => ({
      text: doc.pageContent,
      metadata: doc.metadata,
      score: score
    }));

  } catch (err) {
    console.error("\n❌ Failed querying FAISS", err);
    throw err;
  }
}

/**
 * Ask a question about a subject using FAISS RAG
 */export async function askSubject(question, subjectName, topK = 5) {
  try {
    console.log(`\n💬 Answering question for subject "${subjectName}": ${question}`);

    // Step 1: Retrieve relevant documents from FAISS
    const results = await queryFaiss(question, subjectName, topK);

    if (!results || results.length === 0) {
      console.log(`⚠️  No documents found for subject "${subjectName}"`);
      return {
        answer: "I don't have enough information to answer this question. Please upload relevant documents first.",
        sources: [],
        confidence: 0
      };
    }

    // Step 2: Prepare context
    const context = results.map(r => r.text).join("\n\n");

    console.log(`\n📖 Retrieved ${results.length} relevant documents`);
    console.log(`🤖 Generating answer using LLaMA 3.2...\n`);

    // Step 3: ChatCompletion (correct for this model)
    const prompt = `You are a helpful expert. Answer the question based strictly on the context.

Context:
${context}

Question: ${question}

Answer:`;


    const hfResponse = await hf.chatCompletion({
      model: "meta-llama/Llama-3.2-3B-Instruct",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const finalAnswer = hfResponse.choices[0].message.content;

    // Score relevance
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    console.log("Generated answer:", finalAnswer.substring(0, 150), "...\n");

    return {
      answer: finalAnswer,
      sources: results.map(r => ({
        text: r.text,
        metadata: r.metadata,
        relevance: r.score
      })),
      confidence: avgScore
    };

  } catch (err) {
    console.error("❌ Error in askSubject:", err);
    throw err;
  }
}
/**
 * Generate a 5-question MCQ quiz for a subject
 */
export async function generateQuiz(subjectName) {
  try {
    console.log(`\n🧠 Generating quiz for subject "${subjectName}"...`);

    // Step 1: Retrieve broad context (query for "key concepts")
    const results = await queryFaiss("key concepts definitions summary importance", subjectName, 8);

    if (!results || results.length === 0) {
      throw new Error(`No content found for subject: ${subjectName}`);
    }

    const context = results.map(r => r.text).join("\n\n");

    // Step 2: Prompt LLaMA to generate JSON quiz
    const prompt = `You are a teacher. Create a quiz with 5 multiple-choice questions based strictly on the context below.
Return ONLY a raw JSON array. Do not include markdown formatting like \`\`\`json.

Format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A" // Must match one of the options exactly
  }
]

Context:
${context}

JSON Output:`;

    console.log(`🤖 Asking LLaMA to generate quiz JSON...`);

    const hfResponse = await hf.chatCompletion({
      model: "meta-llama/Llama-3.2-3B-Instruct",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.5 // Lower temperature for more structured output
    });

    let content = hfResponse.choices[0].message.content.trim();

    // Clean up potential markdown code blocks
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    // Extract JSON array if there's extra text
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    // Parse JSON
    try {
      const quiz = JSON.parse(content);
      console.log(`✅ Generated ${quiz.length} questions successfully`);
      return quiz;
    } catch (parseError) {
      console.error("❌ Failed to parse quiz JSON:", content);
      throw new Error("Failed to generate valid quiz JSON");
    }

  } catch (err) {
    console.error("❌ Error in generateQuiz:", err);
    throw err;
  }
}
