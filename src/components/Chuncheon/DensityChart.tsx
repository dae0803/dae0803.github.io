'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Layout, Data } from 'plotly.js';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface DensityChartProps {
    clusterId: string;
}

interface PlotlyData {
    data: Data[];
    layout: Layout;
}

const DensityChart: React.FC<DensityChartProps> = ({ clusterId }) => {
    const [chartData, setChartData] = useState<PlotlyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/data/chuncheon/cluster_${clusterId}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load data for cluster ${clusterId}`);
                }
                const jsonData = await response.json();
                setChartData(jsonData);
            } catch (err) {
                console.error(err);
                setError('Failed to load chart data.');
            } finally {
                setLoading(false);
            }
        };

        if (clusterId) {
            loadData();
        }
    }, [clusterId]);

    if (loading) {
        return <div className="flex items-center justify-center h-full text-white">Loading data...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
    }

    if (!chartData) {
        return <div className="flex items-center justify-center h-full text-white">No data available.</div>;
    }

    return (
        <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
            <Plot
                data={chartData.data}
                layout={{
                    ...chartData.layout,
                    autosize: true,
                    margin: { l: 50, r: 20, t: 50, b: 50 },
                    showlegend: true,
                    legend: { orientation: 'h', y: -0.2 },
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true }}
            />
        </div>
    );
};

export default DensityChart;
