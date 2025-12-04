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
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-white">Project Access</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter password"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <button
                            type="submit"
                            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Unlock
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Project Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
                    >
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 63 Square Card */}
                    <Link href="/panoviewer/63sq" className="block group">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform group-hover:scale-105">
                            <div className="h-48 bg-gray-300 flex items-center justify-center">
                                {/* Placeholder for project image */}
                                <span className="text-gray-500 text-lg">63 Square Preview</span>
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">여의도 63스퀘어</h3>
                                <p className="text-gray-600">3D Panorama Viewer for 63 Square project.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Chuncheon Premium Village Card */}
                    <Link href="/panoviewer/chuncheon/density/1" className="block group">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform group-hover:scale-105">
                            <div className="h-48 bg-gray-300 flex items-center justify-center">
                                {/* Placeholder for project image */}
                                <span className="text-gray-500 text-lg">Chuncheon Preview</span>
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">춘천 프리미엄 빌리지</h3>
                                <p className="text-gray-600">Density Map Analysis and 3D Scan Data.</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PanoDashboard;
