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

export const getSubjects = async () => {
    const response = await api.get("/subjects");
    return response.data;
};

export const generateQuiz = async (subject: string) => {
    const response = await api.post(`/quiz/generate/${subject}`);
    return response.data.quiz;
};

export const createQuizRoom = async (subject: string, questions: any[], sessionId: string, title?: string) => {
    const response = await api.post("/quiz/create", { subject, questions, title, sessionId });
    return response.data;
};

export const getQuizRoom = async (roomId: string) => {
    const response = await api.get(`/quiz/${roomId}`);
    return response.data;
};

export const getMyRooms = async (sessionId: string) => {
    const response = await api.get(`/quiz/my-rooms?sessionId=${sessionId}`);
    return response.data;
};
