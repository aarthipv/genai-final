import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { extractPDFText } from "./pdfutils.js";
import { chunkText } from "./chunk.js";
import { saveBatchToFaiss, askSubject } from "./rag.js";

import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5003;

// Enable CORS
app.use(cors());

// Add middleware to parse JSON
app.use(express.json());

// Root endpoint to check if server is running
app.get("/", (req, res) => {
  res.json({ status: "running", message: "GenAI Project Backend is running!" });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subjectName = req.params.subject_name;
    const subjectDir = path.join(uploadsDir, subjectName);

    // Create subject directory if it doesn't exist
    if (!fs.existsSync(subjectDir)) {
      fs.mkdirSync(subjectDir, { recursive: true });
    }

    cb(null, subjectDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename or add timestamp
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

// File filter to accept only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload endpoint - Extract, chunk, and save to FAISS
app.post("/upload/:subject_name", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const subjectName = req.params.subject_name;
    const filePath = req.file.path;
    const fileName = req.file.filename;

    console.log(`\n📄 File uploaded: ${filePath}`);
    console.log(`📚 Subject: ${subjectName}`);

    // Step 1: Extract text from PDF
    console.log(`\n🔄 Extracting text from PDF...`);
    const pdfText = await extractPDFText(filePath);

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    console.log(`✅ PDF text extracted successfully`);
    console.log(`   📝 Text length: ${pdfText.length} characters`);

    // Step 2: Chunk the text
    console.log(`\n🔄 Chunking text...`);
    const chunks = await chunkText(pdfText);

    console.log(`✅ Text chunked successfully`);
    console.log(`   📦 Number of chunks: ${chunks.length}`);

    // Step 3: Prepare documents for batch saving to FAISS
    const documents = chunks.map((chunk, index) => ({
      text: chunk,
      id: `${subjectName}_${fileName}_chunk_${index}_${Date.now()}`,
      metadata: {
        filename: fileName,
        uploadDate: new Date().toISOString(),
        chunkIndex: index,
        totalChunks: chunks.length,
        filepath: filePath
      }
    }));

    // Step 4: Generate embeddings and save to FAISS
    console.log(`\n🔄 Generating embeddings and saving to FAISS...`);
    const result = await saveBatchToFaiss(documents, subjectName);

    console.log(`\n🎉 Complete pipeline finished successfully!`);

    res.json({
      message: "PDF uploaded, chunked, and embeddings saved successfully!",
      subject: subjectName,
      filename: fileName,
      path: filePath,
      size: req.file.size,
      textLength: pdfText.length,
      chunksCount: chunks.length,
      result: result
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      error: "Upload, chunking, or embedding generation failed",
      details: error.message
    });
  }
});

// Ask endpoint - Query a subject with RAG
app.post("/ask/:subject_name", async (req, res) => {
  try {
    const subjectName = req.params.subject_name;
    const { question, topK = 5 } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`\n💬 Received question for subject "${subjectName}"`);
    console.log(`   Question: "${question}"`);
    console.log(`   Top K: ${topK}`);

    // Ask the question using RAG
    const answer = await askSubject(question, subjectName, topK);

    res.json({
      subject: subjectName,
      question: question,
      answer: answer.answer,
      sources: answer.sources,
      confidence: answer.confidence,
      sourceCount: answer.sources.length
    });

  } catch (error) {
    console.error("❌ Ask error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to answer question",
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Upload endpoint: POST /upload/:subject_name`);
  console.log(`✓ Ask endpoint: POST /ask/:subject_name`);
});