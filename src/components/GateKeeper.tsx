"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock } from "lucide-react";

const ACCESS_KEY = "emtech2025"; // Simple hardcoded key
const ACCESS_STORAGE_KEY = "site_access_key";
const ACCESS_CHANGE_EVENT = "site-access-key-change";

function subscribeAccessKey(callback: () => void) {
    if (typeof window === "undefined") return () => undefined;

    window.addEventListener("storage", callback);
    window.addEventListener(ACCESS_CHANGE_EVENT, callback);

    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(ACCESS_CHANGE_EVENT, callback);
    };
}

function getAccessSnapshot() {
    if (typeof window === "undefined") return "";

    return localStorage.getItem(ACCESS_STORAGE_KEY) ?? "";
}

export function GateKeeper({ children }: { children: React.ReactNode }) {
    const accessKey = useSyncExternalStore(subscribeAccessKey, getAccessSnapshot, () => "");
    const [inputKey, setInputKey] = useState("");
    const [error, setError] = useState(false);
    const isUnlocked = accessKey === ACCESS_KEY;

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKey === ACCESS_KEY) {
            localStorage.setItem(ACCESS_STORAGE_KEY, inputKey);
            window.dispatchEvent(new Event(ACCESS_CHANGE_EVENT));
        } else {
            setError(true);
            setTimeout(() => setError(false), 1000);
        }
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {!isUnlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background text-foreground"
                    >
                        <div className="w-full max-w-md p-8 space-y-8">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight">Access Required</h1>
                                <p className="text-muted-foreground text-sm">
                                    Enter the access key to view this portfolio.
                                </p>
                            </div>

                            <form onSubmit={handleUnlock} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={inputKey}
                                        onChange={(e) => setInputKey(e.target.value)}
                                        className={`w-full px-4 py-3 bg-secondary/50 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${error
                                                ? "border-red-500 focus:ring-red-500/20"
                                                : "border-border focus:ring-primary/20 focus:border-primary"
                                            }`}
                                        placeholder="Enter access key..."
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Unlock className="w-4 h-4" />
                                    Unlock Access
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {isUnlocked && children}
        </>
    );
}
