import React from "react";
import { Plus, MessageSquare, Upload, Settings, BookOpen, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
    isOpen: boolean;
    onNewChat: () => void;
    onUpload: () => void;
    subjects: string[];
    currentSubject: string;
    onSelectSubject: (subject: string) => void;
    recentChats: { id: string; title: string }[];
    onSelectChat: (id: string) => void;
    onClearChats: () => void;
}

export function Sidebar({
    isOpen,
    onNewChat,
    onUpload,
    subjects,
    currentSubject,
    onSelectSubject,
    recentChats,
    onSelectChat,
    onClearChats,
}: SidebarProps) {
    return (
        <div
            className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-gray-100 transform transition-transform duration-200 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full",
                "md:relative md:translate-x-0"
            )}
        >
            {/* Header / New Chat */}
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    New Chat
                </button>
            </div>

            {/* Subject Selector */}
            <div className="px-4 py-2">
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    Subject
                </div>
                <div className="relative">
                    <select
                        value={currentSubject}
                        onChange={(e) => onSelectSubject(e.target.value)}
                        className="w-full appearance-none bg-gray-800 border border-gray-700 text-gray-200 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="" disabled>Select Subject</option>
                        {subjects.map((sub) => (
                            <option key={sub} value={sub}>
                                {sub}
                            </option>
                        ))}
                        <option value="new">+ Add New Subject</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <BookOpen size={14} />
                    </div>
                </div>
            </div>

            {/* Recent Chats */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
                <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">
                    Recent
                </div>
                <div className="space-y-1">
                    {recentChats.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-800 rounded-lg transition-colors text-sm text-gray-300 text-left truncate"
                        >
                            <MessageSquare size={16} className="shrink-0" />
                            <span className="truncate">{chat.title}</span>
                        </button>
                    ))}
                    {recentChats.length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-sm italic">
                            No recent chats
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-800 space-y-2">
                <button
                    onClick={onUpload}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-sm text-gray-300"
                >
                    <Upload size={16} />
                    Upload PDF
                </button>
                <button
                    onClick={onClearChats}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-sm text-gray-300"
                >
                    <Trash2 size={16} />
                    Clear History
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-sm text-gray-300">
                    <Settings size={16} />
                    Settings
                </button>
            </div>
        </div>
    );
}
