import { Plus, MessageSquare, BookOpen, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
    isOpen: boolean;
    onNewChat: () => void;
    subjects: string[];
    currentSubject: string;
    onSelectSubject: (subject: string) => void;
    recentChats: { id: string; title: string }[];
    onSelectChat: (id: string) => void;
    onClearChats: () => void;
    onCreateQuiz: () => void;
    myRooms: { id: string; title: string }[];
}

export function Sidebar({
    isOpen,
    onNewChat,
    subjects,
    currentSubject,
    onSelectSubject,
    recentChats,
    onSelectChat,
    onClearChats,
    onCreateQuiz,
    myRooms,
}: SidebarProps) {
    return (
        <div
            className={cn(
                "fixed inset-y-0 left-0 z-50 w-[260px] bg-[#202123] text-gray-100 transform transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full",
                "md:relative md:translate-x-0"
            )}
        >
            {/* New Chat Button */}
            <div className="p-3">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-3 px-3 py-3 bg-transparent hover:bg-[#2A2B32] rounded-md border border-white/20 transition-colors text-sm text-white mb-4"
                >
                    <Plus size={16} />
                    New chat
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar">

                {/* Subjects */}
                <div>
                    <div className="text-xs font-medium text-gray-500 mb-3 px-3 uppercase">Subject</div>
                    <div className="relative">
                        <select
                            value={currentSubject}
                            onChange={(e) => onSelectSubject(e.target.value)}
                            className="w-full appearance-none bg-[#202123] text-white py-2 pl-3 pr-8 rounded-md hover:bg-[#2A2B32] cursor-pointer focus:outline-none text-sm truncate"
                        >
                            <option value="" disabled>Select Subject</option>
                            {subjects.map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                            <option value="new">+ Upload New PDF</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <BookOpen size={14} />
                        </div>
                    </div>
                </div>

                {/* Recent Chats */}
                <div>
                    <div className="text-xs font-medium text-gray-500 mb-2 px-3 uppercase">Recent</div>
                    <div className="space-y-1">
                        {recentChats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => onSelectChat(chat.id)}
                                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#2A2B32] rounded-md transition-colors text-sm text-gray-100 text-left truncate group"
                            >
                                <MessageSquare size={16} className="shrink-0 text-gray-400 group-hover:text-white" />
                                <span className="truncate">{chat.title}</span>
                            </button>
                        ))}
                        {recentChats.length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-sm italic">No recent chats</div>
                        )}
                    </div>
                </div>

                {/* My Quizzes */}
                <div>
                    <div className="text-xs font-medium text-gray-500 mb-2 px-3 uppercase">My Quizzes</div>
                    <div className="space-y-1">
                        {myRooms.map((room) => (
                            <a
                                key={room.id}
                                href={`/quiz/${room.id}`}
                                className="block w-full flex items-center gap-3 px-3 py-3 hover:bg-[#2A2B32] rounded-md transition-colors text-sm text-gray-100 text-left truncate group"
                            >
                                <BookOpen size={16} className="shrink-0 text-gray-400 group-hover:text-white" />
                                <span className="truncate">{room.title}</span>
                            </a>
                        ))}
                        {myRooms.length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-sm italic">No quizzes created</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-white/10 space-y-1">
                <button
                    onClick={onCreateQuiz}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#2A2B32] rounded-md transition-colors text-sm text-gray-100 text-left"
                >
                    <Plus size={16} />
                    Create Quiz Room
                </button>
                <button
                    onClick={onClearChats}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#2A2B32] rounded-md transition-colors text-sm text-gray-100 text-left"
                >
                    <Trash2 size={16} />
                    Clear conversations
                </button>
            </div>
        </div>
    );
}
