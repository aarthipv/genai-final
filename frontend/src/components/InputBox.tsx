import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface InputBoxProps {
    onSend: (message: string) => void;
    disabled: boolean;
}

export function InputBox({ onSend, disabled }: InputBoxProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput("");
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    return (
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 pt-10 pb-6 px-4">
            <div className="max-w-3xl mx-auto relative">
                <div className="relative flex items-end w-full p-3 bg-white dark:bg-[#40414F] border border-black/10 dark:border-none rounded-xl shadow-md overflow-hidden ring-offset-2 focus-within:ring-2 ring-blue-500/50">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder="Ask me anything about your uploaded study materials..."
                        className="w-full max-h-[200px] py-2 pr-10 bg-transparent border-none focus:ring-0 resize-none outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                        style={{ minHeight: "24px" }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || disabled}
                        className="absolute right-3 bottom-3 p-1 rounded-md text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                        <Send size={18} className={input.trim() ? "text-blue-500" : ""} />
                    </button>
                </div>
                <div className="text-center text-xs text-gray-400 mt-2">
                    StudyMate AI can make mistakes. Consider checking important information.
                </div>
            </div>
        </div>
    );
}
