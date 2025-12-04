'use client';

import React from 'react';
import DensityChart from '@/components/Chuncheon/DensityChart';
import Link from 'next/link';

interface DensityPageClientProps {
    id: string;
}

export default function DensityPageClient({ id }: DensityPageClientProps) {
    const clusterId = parseInt(id);

    // Assuming clusters range from 1 to 201 based on file list
    const minCluster = 1;
    const maxCluster = 201;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
            <div className="bg-secondary border-b border-border p-4 flex justify-between items-center z-10">
                <h1 className="text-xl font-bold text-foreground">Density Map Cluster {id}</h1>
                <div className="space-x-4">
                    <Link
                        href={`/panoviewer/chuncheon/density/${Math.max(minCluster, clusterId - 1)}`}
                        className={`px-4 py-2 rounded border border-border text-sm font-medium transition-colors ${clusterId <= minCluster
                            ? 'bg-muted text-muted-foreground pointer-events-none'
                            : 'bg-secondary text-foreground hover:bg-muted hover:text-primary'
                            }`}
                    >
                        &larr; Previous
                    </Link>
                    <Link
                        href="/panoviewer"
                        className="px-4 py-2 rounded border border-border bg-secondary text-foreground hover:bg-muted hover:text-primary text-sm font-medium transition-colors"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href={`/panoviewer/chuncheon/density/${Math.min(maxCluster, clusterId + 1)}`}
                        className={`px-4 py-2 rounded border border-border text-sm font-medium transition-colors ${clusterId >= maxCluster
                            ? 'bg-muted text-muted-foreground pointer-events-none'
                            : 'bg-secondary text-foreground hover:bg-muted hover:text-primary'
                            }`}
                    >
                        Next &rarr;
                    </Link>
                </div>
            </div>
            <div className="flex-1 overflow-hidden p-4 bg-background">
                <div className="w-full h-full bg-secondary rounded-lg border border-border overflow-hidden">
                    <DensityChart clusterId={id} />
                </div>
            </div>
        </div>
    );
}
