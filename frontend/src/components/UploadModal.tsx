import React, { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { uploadPDF } from "../lib/api";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: string[];
    onUploadComplete: (subject: string) => void;
}

export function UploadModal({ isOpen, onClose, subjects, onUploadComplete }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [subject, setSubject] = useState("");
    const [isNewSubject, setIsNewSubject] = useState(false);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                setErrorMessage("");
            } else {
                setErrorMessage("Please upload a valid PDF file.");
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                setErrorMessage("");
            } else {
                setErrorMessage("Please upload a valid PDF file.");
            }
        }
    };

    const handleUpload = async () => {
        if (!file || !subject) return;

        setStatus("uploading");
        try {
            await uploadPDF(file, subject);
            setStatus("success");
            setTimeout(() => {
                onUploadComplete(subject);
                handleClose();
            }, 1500);
        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.response?.data?.error || "Upload failed. Please try again.");
        }
    };

    const handleClose = () => {
        setFile(null);
        setSubject("");
        setIsNewSubject(false);
        setStatus("idle");
        setErrorMessage("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Upload Study Material</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Subject Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Subject
                        </label>
                        {!isNewSubject ? (
                            <select
                                value={subject}
                                onChange={(e) => {
                                    if (e.target.value === "new") {
                                        setIsNewSubject(true);
                                        setSubject("");
                                    } else {
                                        setSubject(e.target.value);
                                    }
                                }}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                disabled={status === "uploading"}
                            >
                                <option value="" disabled>Select a subject</option>
                                {subjects.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                                <option value="new">+ Create New Subject</option>
                            </select>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Enter subject name (e.g., Biology)"
                                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={status === "uploading"}
                                />
                                <button
                                    onClick={() => setIsNewSubject(false)}
                                    className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* File Drop Zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                            file ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        )}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="application/pdf"
                            className="hidden"
                        />

                        {file ? (
                            <div className="flex flex-col items-center text-blue-600 dark:text-blue-400">
                                <FileText size={48} className="mb-2" />
                                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                                <span className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                                <Upload size={48} className="mb-2" />
                                <span className="font-medium">Click to upload or drag & drop</span>
                                <span className="text-xs mt-1">PDF files only</span>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {status === "success" && (
                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <CheckCircle size={16} />
                            <span>File uploaded and indexed successfully!</span>
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || !subject || status === "uploading"}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {status === "uploading" ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Indexing Document...
                            </>
                        ) : (
                            "Upload & Index"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
