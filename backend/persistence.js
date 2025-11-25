import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SUBJECTS_FILE = path.join(DATA_DIR, 'subjects.json');
const UPLOADS_FILE = path.join(DATA_DIR, 'uploads.json');
const QUIZ_ROOMS_FILE = path.join(DATA_DIR, 'quiz_rooms.json');

// Helper to read JSON file
function readJSON(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return {};
    }
}

// Helper to write JSON file
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
}

// --- Subjects ---

export function getSubjects() {
    const subjects = readJSON(SUBJECTS_FILE);
    return Object.keys(subjects).map(name => ({
        name,
        ...subjects[name]
    }));
}

export function saveSubject(name) {
    const subjects = readJSON(SUBJECTS_FILE);
    if (!subjects[name]) {
        subjects[name] = {
            createdAt: new Date().toISOString()
        };
        writeJSON(SUBJECTS_FILE, subjects);
    }
}

// --- Uploads ---

export function saveUploadMetadata(subject, metadata) {
    const uploads = readJSON(UPLOADS_FILE);
    if (!uploads[subject]) {
        uploads[subject] = [];
    }
    uploads[subject].push(metadata);
    writeJSON(UPLOADS_FILE, uploads);

    // Also ensure subject exists
    saveSubject(subject);
}

export function getUploads(subject) {
    const uploads = readJSON(UPLOADS_FILE);
    return uploads[subject] || [];
}

// --- Quiz Rooms ---

export function saveQuizRoom(roomData) {
    const rooms = readJSON(QUIZ_ROOMS_FILE);
    rooms[roomData.id] = roomData;
    writeJSON(QUIZ_ROOMS_FILE, rooms);
}

export function getQuizRoom(roomId) {
    const rooms = readJSON(QUIZ_ROOMS_FILE);
    return rooms[roomId] || null;
}

export function getAllQuizRooms() {
    return readJSON(QUIZ_ROOMS_FILE);
}

export function getUserRooms(sessionId) {
    const rooms = readJSON(QUIZ_ROOMS_FILE);
    return Object.values(rooms).filter(room => room.sessionId === sessionId);
}
