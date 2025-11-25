import React from "react";
import Markdown from "react-markdown";
import { User, Bot } from "lucide-react";
import { cn } from "../lib/utils";

interface MessageBubbleProps {
    role: "user" | "ai";
    content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    return (
        <div
            className={cn(
                "flex w-full items-start gap-4 py-6 px-4 md:px-8 border-b border-black/5 dark:border-white/5",
                role === "ai" ? "bg-gray-50 dark:bg-[#444654]" : "bg-white dark:bg-[#343541]"
            )}
        >
            <div className="flex-shrink-0 flex flex-col relative items-end">
                <div
                    className={cn(
                        "w-8 h-8 rounded-sm flex items-center justify-center",
                        role === "ai" ? "bg-green-500" : "bg-gray-500"
                    )}
                >
                    {role === "ai" ? (
                        <Bot size={20} className="text-white" />
                    ) : (
                        <User size={20} className="text-white" />
                    )}
                </div>
            </div>
            <div className="relative flex-1 overflow-hidden">
                <div className="prose dark:prose-invert max-w-none leading-7">
                    <Markdown>{content}</Markdown>
                </div>
            </div>
        </div>
    );
}
