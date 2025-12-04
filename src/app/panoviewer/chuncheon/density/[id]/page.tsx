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
    params: {
        id: string;
    };
}

export default function DensityMapPage({ params }: PageProps) {
    return <DensityPageClient id={params.id} />;
}
