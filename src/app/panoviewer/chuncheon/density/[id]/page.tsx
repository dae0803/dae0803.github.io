import React from 'react';
import DensityPageClient from '@/components/Chuncheon/DensityPageClient';

export async function generateStaticParams() {
    // Generate params for clusters 1 to 201
    const clusters = Array.from({ length: 201 }, (_, i) => ({
        id: (i + 1).toString(),
    }));
    return clusters;
}

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function DensityMapPage({ params }: PageProps) {
    const { id } = await params;

    return <DensityPageClient id={id} />;
}
