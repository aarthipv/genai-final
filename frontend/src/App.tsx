import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { InputBox } from "./components/InputBox";
import { UploadModal } from "./components/UploadModal";
import { QuizRoom } from "./components/QuizRoom";
import { askQuestion, generateQuiz, createQuizRoom, getSubjects, getMyRooms } from "./lib/api";
import { Menu, Sun, Moon, Copy, Check, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  subject: string;
  messages: Message[];
  timestamp: number;
}

function ChatLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [myRooms, setMyRooms] = useState<{ id: string; title: string }[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Quiz State
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizLink, setQuizLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Initialize Session, Theme and Load Data
  useEffect(() => {
    // 0. Theme
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    // 1. Session ID
    let sid = localStorage.getItem("sessionId");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("sessionId", sid);
    }
    setSessionId(sid);

    // 2. Load Subjects from Backend
    getSubjects().then((data) => {
      if (data && Array.isArray(data)) {
        // Backend returns object array with metadata, we just need names for now
        // Or if backend returns array of objects {name, createdAt}
        // Let's check persistence.js: returns array of objects {name, ...}
        const subjectNames = data.map((s: any) => s.name);
        setSubjects(subjectNames);
      }
    }).catch(err => console.error("Failed to load subjects", err));

    // 3. Load User's Rooms
    if (sid) {
      getMyRooms(sid).then((rooms) => {
        if (rooms) setMyRooms(rooms);
      }).catch(err => console.error("Failed to load rooms", err));
    }

    // 4. Load Chat History (Local)
    const savedChats = localStorage.getItem("chatSessions");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChatSessions(parsedChats);
    }
  }, []);

  // Save Chats to local storage
  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
  }, [chatSessions]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setCurrentSubject("");
    setQuizLink("");
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectChat = (id: string) => {
    const chat = chatSessions.find((c) => c.id === id);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setCurrentSubject(chat.subject);
      setQuizLink("");
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const handleUploadComplete = (subject: string) => {
    if (!subjects.includes(subject)) {
      setSubjects((prev) => [...prev, subject]);
    }
    setCurrentSubject(subject);
    handleNewChat();
    setCurrentSubject(subject);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSubject) {
      alert("Please select a subject or upload a document first.");
      return;
    }

    const newUserMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await askQuestion(content, currentSubject);
      const aiMessage: Message = { role: "ai", content: response.answer };
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Update or Create Session
      if (currentChatId) {
        setChatSessions((prev) =>
          prev.map((c) =>
            c.id === currentChatId
              ? { ...c, messages: finalMessages, timestamp: Date.now() }
              : c
          )
        );
      } else {
        const newId = crypto.randomUUID();
        const newSession: ChatSession = {
          id: newId,
          title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
          subject: currentSubject,
          messages: finalMessages,
          timestamp: Date.now(),
        };
        setChatSessions((prev) => [newSession, ...prev]);
        setCurrentChatId(newId);
      }
    } catch (error) {
      console.error("Failed to get answer:", error);
      const errorMessage: Message = { role: "ai", content: "Sorry, I encountered an error. Please try again." };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!currentSubject) return;

    setIsGeneratingQuiz(true);

    try {
      // 1. Generate Quiz Questions
      const questions = await generateQuiz(currentSubject);

      // 2. Create Quiz Room
      const response = await createQuizRoom(currentSubject, questions, sessionId);
      setQuizLink(`${window.location.origin}/quiz/${response.roomId}`);

      // Refresh my rooms
      getMyRooms(sessionId).then(setMyRooms);

    } catch (error) {
      console.error("Failed to create quiz:", error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(quizLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        subjects={subjects}
        currentSubject={currentSubject}
        onSelectSubject={(sub) => {
          if (sub === "new") {
            setIsUploadModalOpen(true);
          } else {
            setCurrentSubject(sub);
            handleNewChat();
            setCurrentSubject(sub);
          }
        }}
        recentChats={chatSessions.map(c => ({ id: c.id, title: c.title }))}
        onSelectChat={handleSelectChat}
        onClearChats={() => {
          setChatSessions([]);
          handleNewChat();
        }}
        onCreateQuiz={handleCreateQuiz}
        myRooms={myRooms}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-2 md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            <Menu size={24} />
          </button>
          <span className="font-medium text-sm">StudyMate AI</span>
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        {/* Desktop Theme Toggle (Absolute Top Right) */}
        <div className="hidden md:block absolute top-4 right-4 z-10">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <ChatArea messages={messages} isLoading={isLoading} />

        <InputBox onSend={handleSendMessage} disabled={isLoading || !currentSubject} />

        {/* Quiz Link Modal */}
        {quizLink && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4">Quiz Room Created!</h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Share this link with your friends:</p>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
                <code className="flex-1 text-sm truncate text-blue-600 dark:text-blue-400 font-mono">{quizLink}</code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-500" />}
                </button>
              </div>
              <button
                onClick={() => setQuizLink("")}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay for Quiz Gen */}
        {isGeneratingQuiz && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col items-center animate-in zoom-in-95">
              <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
              <p className="font-medium text-gray-900 dark:text-gray-100">Generating Quiz...</p>
            </div>
          </div>
        )}
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        subjects={subjects}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatLayout />} />
        <Route path="/quiz/:roomId" element={<QuizRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
