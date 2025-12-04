'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PanoDashboard: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const auth = sessionStorage.getItem('pano_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'eunmin') {
            sessionStorage.setItem('pano_auth', 'true');
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Incorrect password');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('pano_auth');
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="w-full max-w-md p-8 space-y-6 bg-secondary border border-border rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-foreground">Project Access</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-1 text-foreground bg-input border border-border rounded focus:ring-primary focus:border-primary outline-none transition-colors"
                                placeholder="Enter password"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <button
                            type="submit"
                            className="w-full px-4 py-2 font-bold text-primary-foreground bg-primary rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                        >
                            Unlock
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Dashboard</h1>
                    <p className="text-muted-foreground">
                        3D Scan & Panorama Viewer Projects
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded hover:bg-muted hover:text-foreground transition-colors"
                >
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 63 Square Card */}
                <Link href="/panoviewer/63sq" className="block group">
                    <div className="bg-secondary border border-border rounded-lg overflow-hidden transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10">
                        <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <span className="text-muted-foreground text-lg z-20 font-medium group-hover:text-foreground transition-colors">63 Square Preview</span>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">여의도 63스퀘어</h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                                파노라마 뷰어 및 마감 레벨 분석. 현장의 360도 파노라마 뷰와 바닥 레벨 분석 데이터를 제공합니다.
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Chuncheon Premium Village Card */}
                <Link href="/panoviewer/chuncheon/density/1" className="block group">
                    <div className="bg-secondary border border-border rounded-lg overflow-hidden transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10">
                        <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <span className="text-muted-foreground text-lg z-20 font-medium group-hover:text-foreground transition-colors">Chuncheon Preview</span>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">춘천 프리미엄 빌리지</h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                                폴대 위치 선정을 위한 3D 스캔 데이터 시각화 및 분석 통합 뷰어.
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default PanoDashboard;
