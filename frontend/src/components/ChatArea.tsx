import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react";

interface Message {
    role: "user" | "ai";
    content: string;
}

interface ChatAreaProps {
    messages: Message[];
    isLoading: boolean;
}

export function ChatArea({ messages, isLoading }: ChatAreaProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-800 dark:text-gray-100 p-4">
                <h1 className="text-4xl font-bold mb-8">StudyMate AI</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
                    <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <span className="text-xl mb-2">📚</span>
                        <h3 className="font-medium mb-2">Upload PDFs</h3>
                        <p className="text-sm text-center opacity-70">Upload your study materials by subject</p>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <span className="text-xl mb-2">💡</span>
                        <h3 className="font-medium mb-2">Ask Questions</h3>
                        <p className="text-sm text-center opacity-70">Get instant answers from your documents</p>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <span className="text-xl mb-2">🔒</span>
                        <h3 className="font-medium mb-2">Private & Local</h3>
                        <p className="text-sm text-center opacity-70">No login required, runs locally</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto scroll-smooth">
            <div className="flex flex-col pb-32">
                {messages.map((msg, index) => (
                    <MessageBubble key={index} role={msg.role} content={msg.content} />
                ))}
                {isLoading && (
                    <div className="flex w-full items-start gap-4 py-6 px-4 md:px-8 bg-gray-50 dark:bg-[#444654] border-b border-black/5 dark:border-white/5">
                        <div className="w-8 h-8 rounded-sm bg-green-500 flex items-center justify-center">
                            <Loader2 size={20} className="text-white animate-spin" />
                        </div>
                        <div className="flex items-center h-8">
                            <span className="animate-pulse">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
