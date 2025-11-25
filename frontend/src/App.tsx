import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { InputBox } from "./components/InputBox";
import { UploadModal } from "./components/UploadModal";
import { QuizRoom } from "./components/QuizRoom";
import { askQuestion, generateQuiz, createQuizRoom } from "./lib/api";
import { Menu, Copy, Check, Loader2 } from "lucide-react";

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

  // Quiz State
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizLink, setQuizLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    const savedSubjects = localStorage.getItem("subjects");
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));

    const savedChats = localStorage.getItem("chatSessions");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChatSessions(parsedChats);
    }
  }, []);

  // Save state to local storage
  useEffect(() => {
    localStorage.setItem("subjects", JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
  }, [chatSessions]);

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
      const newAiMessage: Message = { role: "ai", content: response.answer };
      const finalMessages = [...updatedMessages, newAiMessage];
      setMessages(finalMessages);

      if (!currentChatId) {
        const newChatId = Date.now().toString();
        const newChat: ChatSession = {
          id: newChatId,
          title: content.substring(0, 30) + (content.length > 30 ? "..." : ""),
          subject: currentSubject,
          messages: finalMessages,
          timestamp: Date.now(),
        };
        setChatSessions((prev) => [newChat, ...prev]);
        setCurrentChatId(newChatId);
      } else {
        setChatSessions((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: finalMessages, timestamp: Date.now() }
              : chat
          )
        );
      }
    } catch (error) {
      console.error("Failed to get answer:", error);
      const errorMessage: Message = {
        role: "ai",
        content: "Sorry, I encountered an error while processing your request. Please try again.",
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChats = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      setChatSessions([]);
      handleNewChat();
    }
  };

  const handleCreateQuiz = async () => {
    if (!currentSubject) return;

    setIsGeneratingQuiz(true);
    setQuizLink("");

    try {
      // 1. Generate Quiz Questions
      const questions = await generateQuiz(currentSubject);

      // 2. Create Quiz Room
      const { roomId } = await createQuizRoom(currentSubject, questions);

      // 3. Set Link
      const link = `${window.location.origin}/quiz/${roomId}`;
      setQuizLink(link);

    } catch (error) {
      console.error("Quiz creation failed:", error);
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
    <div className="flex h-screen bg-white dark:bg-[#343541] overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        onUpload={() => setIsUploadModalOpen(true)}
        subjects={subjects}
        currentSubject={currentSubject}
        onSelectSubject={setCurrentSubject}
        recentChats={chatSessions.map((c) => ({ id: c.id, title: c.title }))}
        onSelectChat={handleSelectChat}
        onClearChats={handleClearChats}
        onCreateQuiz={handleCreateQuiz}
      />

      <div className="flex-1 flex flex-col h-full relative">
        <div className="md:hidden flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541]">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold text-gray-700 dark:text-gray-200">StudyMate AI</span>
        </div>

        <div className="hidden md:flex items-center justify-center p-2 text-sm text-gray-500 border-b border-black/5 dark:border-white/5">
          <span className="font-medium">
            {currentSubject ? `Current Subject: ${currentSubject}` : "Select a subject to start"}
          </span>
        </div>

        <ChatArea messages={messages} isLoading={isLoading} />

        <InputBox onSend={handleSendMessage} disabled={isLoading || !currentSubject} />

        {/* Quiz Link Modal / Overlay */}
        {(isGeneratingQuiz || quizLink) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
              {isGeneratingQuiz ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 size={48} className="animate-spin text-blue-500" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Generating Quiz...</p>
                  <p className="text-sm text-gray-500">Analyzing your documents</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quiz Room Ready!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Share this link with others to join the quiz room.
                  </p>

                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      readOnly
                      value={quizLink}
                      className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <a
                      href={quizLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Open Quiz
                    </a>
                    <button
                      onClick={() => setQuizLink("")}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
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
