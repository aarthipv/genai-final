import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Loader2, AlertCircle, CheckCircle, XCircle, Trophy, Home, Users, Clock, Play } from "lucide-react";
import { cn } from "../lib/utils";

const SOCKET_URL = "http://localhost:5003";

interface Player {
    id: string;
    username: string;
    score: number;
}

interface Question {
    question: string;
    options: string[];
    index: number;
    total: number;
    timeLeft: number;
}

type GameState = "LOBBY" | "PLAYING" | "LEADERBOARD";

export function QuizRoom() {
    const { roomId } = useParams<{ roomId: string }>();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<GameState>("LOBBY");
    const [username, setUsername] = useState("");
    const [joined, setJoined] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<Player[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Connected to socket server");
        });

        newSocket.on("player_joined", (updatedPlayers: Player[]) => {
            setPlayers(updatedPlayers);
        });

        newSocket.on("quiz_started", () => {
            setGameState("PLAYING");
        });

        newSocket.on("new_question", (question: Question) => {
            setCurrentQuestion(question);
            setTimeLeft(question.timeLeft);
            setSelectedOption(null);
        });

        newSocket.on("quiz_ended", ({ leaderboard }: { leaderboard: Player[] }) => {
            setGameState("LEADERBOARD");
            setLeaderboard(leaderboard);
        });

        newSocket.on("error", (msg: string) => {
            setError(msg);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (gameState === "PLAYING" && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, timeLeft]);

    const handleJoin = () => {
        if (!username.trim() || !socket) return;
        socket.emit("join_room", { roomId, username });
        setJoined(true);
    };

    const handleStartQuiz = () => {
        if (!socket) return;
        socket.emit("start_quiz", { roomId });
    };

    const handleAnswer = (option: string) => {
        if (!socket || selectedOption || timeLeft <= 0) return;
        setSelectedOption(option);
        socket.emit("submit_answer", {
            roomId,
            questionIndex: currentQuestion?.index,
            answer: option
        });
    };

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#343541]">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
                    <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Error</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                    <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#343541] py-8 px-4 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Room: <span className="text-blue-600 dark:text-blue-400">{roomId}</span>
                    </h1>
                    <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                        <Home size={20} />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                </div>

                {/* LOBBY STATE */}
                {gameState === "LOBBY" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center">
                        {!joined ? (
                            <div className="max-w-sm mx-auto space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Join Quiz</h2>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleJoin}
                                    disabled={!username.trim()}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Join Room
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse">
                                        <Users size={40} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Waiting for host...</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mt-1">{players.length} players joined</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-w-md mx-auto">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Players</h3>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {players.map((p) => (
                                            <span key={p.id} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700">
                                                {p.username} {p.id === socket?.id && "(You)"}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartQuiz}
                                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg transition-transform hover:scale-105 flex items-center gap-2 mx-auto"
                                >
                                    <Play size={20} />
                                    Start Quiz (Host)
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* PLAYING STATE */}
                {gameState === "PLAYING" && currentQuestion && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-500">
                                Question {currentQuestion.index + 1} / {currentQuestion.total}
                            </span>
                            <div className="flex items-center gap-2 text-orange-600 font-bold">
                                <Clock size={20} />
                                <span>{timeLeft}s</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6">
                                {currentQuestion.question}
                            </h3>
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option)}
                                        disabled={selectedOption !== null || timeLeft === 0}
                                        className={cn(
                                            "w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between group",
                                            selectedOption === option
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                                                : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        )}
                                    >
                                        <span className="text-gray-700 dark:text-gray-200">{option}</span>
                                        {selectedOption === option && <CheckCircle size={18} className="text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* LEADERBOARD STATE */}
                {gameState === "LEADERBOARD" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center animate-in fade-in zoom-in-95">
                        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy size={40} className="text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Quiz Completed!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Here are the final results</p>

                        <div className="max-w-md mx-auto space-y-3">
                            {leaderboard.map((player, idx) => (
                                <div
                                    key={player.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border",
                                        idx === 0
                                            ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/50"
                                            : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm",
                                            idx === 0 ? "bg-yellow-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                        )}>
                                            {idx + 1}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {player.username} {player.id === socket?.id && "(You)"}
                                        </span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{player.score} pts</span>
                                </div>
                            ))}
                        </div>

                        <Link
                            to="/"
                            className="inline-block mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
