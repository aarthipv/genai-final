import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { InputBox } from "./components/InputBox";
import { UploadModal } from "./components/UploadModal";
import { askQuestion } from "./lib/api";
import { Menu } from "lucide-react";

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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

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
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectChat = (id: string) => {
    const chat = chatSessions.find((c) => c.id === id);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setCurrentSubject(chat.subject);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const handleUploadComplete = (subject: string) => {
    if (!subjects.includes(subject)) {
      setSubjects((prev) => [...prev, subject]);
    }
    setCurrentSubject(subject);
    // Start a new chat with this subject
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

      // Save or update chat session
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
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541]">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold text-gray-700 dark:text-gray-200">StudyMate AI</span>
        </div>

        {/* Top Bar (Desktop) */}
        <div className="hidden md:flex items-center justify-center p-2 text-sm text-gray-500 border-b border-black/5 dark:border-white/5">
          <span className="font-medium">
            {currentSubject ? `Current Subject: ${currentSubject}` : "Select a subject to start"}
          </span>
        </div>

        <ChatArea messages={messages} isLoading={isLoading} />

        <InputBox onSend={handleSendMessage} disabled={isLoading || !currentSubject} />
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

export default App;
