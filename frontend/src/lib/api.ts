import axios from "axios";

const API_BASE_URL = "http://localhost:5003";

export const api = axios.create({
    baseURL: API_BASE_URL,
});

export const checkServerStatus = async () => {
    try {
        const response = await api.get("/");
        return response.data;
    } catch (error) {
        console.error("Server check failed:", error);
        return null;
    }
};

export const uploadPDF = async (file: File, subject: string) => {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await api.post(`/upload/${subject}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const askQuestion = async (question: string, subject: string) => {
    const response = await api.post(`/ask/${subject}`, { question });
    return response.data;
};
