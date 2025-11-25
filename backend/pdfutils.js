import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function extractPDFText(path) {
  try {
    const loader = new PDFLoader(path);
    const docs = await loader.load();
    return docs.map(d => d.pageContent).join("\n\n");
  } catch (err) {
    console.error("PDF parsing failed:", err);
    return "";
  }
}
