import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from './Sidebar';
import NavBar from './NavBar';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com';

interface DashboardLayoutProps {
    children: React.ReactNode;
    datasetId: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, datasetId }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [datasetType, setDatasetType] = useState<string>('unknown');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchDatasetType = async () => {
            if (!datasetId) return;

            try {
                const response = await axios.post(`${API_URL}/api/v1/datasets/analyze-smart/${datasetId}`);
                setDatasetType(response.data.dataset_type || 'unknown');
            } catch (error) {
                console.error('Failed to fetch dataset type:', error);
                setDatasetType('unknown');
            } finally {
                setLoading(false);
            }
        };

        fetchDatasetType();
    }, [datasetId]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const toggleCollapse = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <NavBar />

            {/* Sidebar */}
            <Sidebar
                datasetId={datasetId}
                datasetType={datasetType}
                isOpen={sidebarOpen}
                onToggle={toggleSidebar}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            {/* Main Content */}
            <main className={`pt-16 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
