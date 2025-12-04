'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import DensityChart from '@/components/Chuncheon/DensityChart';
import Link from 'next/link';

export default function DensityMapPage() {
    const params = useParams();
    const id = params.id as string;
    const clusterId = parseInt(id);

    // Assuming clusters range from 1 to 201 based on file list
    const minCluster = 1;
    const maxCluster = 201;

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="bg-white shadow p-4 flex justify-between items-center z-10">
                <h1 className="text-xl font-bold">Density Map Cluster {id}</h1>
                <div className="space-x-4">
                    <Link
                        href={`/panoviewer/chuncheon/density/${Math.max(minCluster, clusterId - 1)}`}
                        className={`px-4 py-2 rounded border ${clusterId <= minCluster ? 'bg-gray-200 text-gray-400 pointer-events-none' : 'bg-white hover:bg-gray-50'}`}
                    >
                        &larr; Previous
                    </Link>
                    <Link href="/panoviewer" className="px-4 py-2 rounded border bg-white hover:bg-gray-50">
                        Dashboard
                    </Link>
                    <Link
                        href={`/panoviewer/chuncheon/density/${Math.min(maxCluster, clusterId + 1)}`}
                        className={`px-4 py-2 rounded border ${clusterId >= maxCluster ? 'bg-gray-200 text-gray-400 pointer-events-none' : 'bg-white hover:bg-gray-50'}`}
                    >
                        Next &rarr;
                    </Link>
                </div>
            </div>
            <div className="flex-1 overflow-hidden p-4">
                <DensityChart clusterId={id} />
            </div>
        </div>
    );
}
