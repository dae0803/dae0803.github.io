"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Projects", href: "/projects", icon: Folder },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-secondary rounded-md"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Sidebar Container */}
            <motion.aside
                className={cn(
                    "fixed lg:sticky top-0 left-0 z-40 h-screen bg-secondary border-r border-border transition-all duration-300 ease-in-out flex flex-col",
                    !isOpen && "-translate-x-full lg:translate-x-0"
                )}
                initial={false}
                animate={{ width: isOpen ? 256 : 80 }}
            >
                {/* Desktop Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="hidden lg:flex absolute -right-3 top-9 z-50 w-6 h-6 bg-background border border-border rounded-full items-center justify-center shadow-sm hover:bg-secondary transition-colors"
                >
                    {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                <div className="flex flex-col h-full p-4 overflow-hidden">
                    {/* Logo / Brand */}
                    <div className={cn("flex items-center gap-3 mb-10 px-2 h-10", !isOpen && "justify-center")}>
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                            <span className="font-bold text-white">J</span>
                        </div>
                        {isOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap"
                            >
                                JUN's Blog
                            </motion.span>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 flex-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden whitespace-nowrap",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                                        !isOpen && "justify-center"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 bg-primary/10 border-r-2 border-primary"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={cn("w-5 h-5 shrink-0 relative z-10", isActive && "text-primary")} />
                                    {isOpen && (
                                        <span className="relative z-10 font-medium">{item.name}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / User Info */}
                    <div className={cn("mt-auto pt-4 border-t border-border", !isOpen && "hidden")}>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                            <p className="font-medium text-foreground">© 2025 Hyungjun Cho</p>
                            <p>BIM / 3D Scan / Development</p>
                        </div>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
