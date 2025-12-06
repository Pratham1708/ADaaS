import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    LayoutDashboard,
    Activity,
    TrendingDown,
    TrendingUp,
    BarChart3,
    Brain,
    Skull,
    Bot,
    Database,
    ChevronLeft,
    ChevronRight,
    Menu
} from 'lucide-react';

interface SidebarProps {
    datasetId: string;
    datasetType?: string;
    isOpen: boolean;
    onToggle: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    showForTypes?: string[]; // If specified, only show for these dataset types
}

const Sidebar: React.FC<SidebarProps> = ({ datasetId, datasetType = 'unknown', isOpen, onToggle, isCollapsed, onToggleCollapse }) => {
    const router = useRouter();

    const navItems: NavItem[] = [
        {
            name: 'Summary',
            href: `/dashboard/summary/${datasetId}`,
            icon: LayoutDashboard,
            description: 'Overview & KPIs'
        },
        {
            name: 'Survival Analysis',
            href: `/dashboard/survival/${datasetId}`,
            icon: Activity,
            description: 'KM Curves & Life Tables'
        },
        {
            name: 'Reserving',
            href: `/dashboard/reserving/${datasetId}`,
            icon: TrendingDown,
            description: 'Chain Ladder & Triangles'
        },
        {
            name: 'Time Series',
            href: `/dashboard/timeseries/${datasetId}`,
            icon: TrendingUp,
            description: 'Forecasting & Trends',
            showForTypes: ['time_series']
        },
        {
            name: 'GLM Pricing',
            href: `/dashboard/glm/${datasetId}`,
            icon: BarChart3,
            description: 'Generalized Linear Models'
        },
        {
            name: 'ML Survival',
            href: `/dashboard/ml-survival/${datasetId}`,
            icon: Brain,
            description: 'Machine Learning Models'
        },
        {
            name: 'Mortality Tables',
            href: `/dashboard/mortality/${datasetId}`,
            icon: Skull,
            description: 'Actuarial Life Tables',
            showForTypes: ['mortality_table']
        },
        {
            name: 'AI Insights',
            href: `/dashboard/ai-insights/${datasetId}`,
            icon: Bot,
            description: 'Gemini Analysis & NLQ'
        },
        {
            name: 'Dataset Workspace',
            href: `/dashboard/workspace/${datasetId}`,
            icon: Database,
            description: 'Data Exploration'
        }
    ];

    // Filter nav items based on dataset type
    const filteredNavItems = navItems.filter(item => {
        if (!item.showForTypes) return true;
        return item.showForTypes.includes(datasetType);
    });

    const isActive = (href: string) => {
        return router.pathname === href || router.asPath === href;
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-50
                    transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
                    w-64
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    {!isCollapsed && (
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-primary">ADaaS</span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <Link href="/" className="flex items-center justify-center w-full">
                            <span className="text-2xl font-bold text-primary">A</span>
                        </Link>
                    )}
                    {/* Mobile close button */}
                    <button
                        onClick={onToggle}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    {/* Desktop collapse button */}
                    <button
                        onClick={onToggleCollapse}
                        className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        ) : (
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>

                {/* Dataset Info */}
                {!isCollapsed && (
                    <div className="p-4 bg-primary-light border-b border-gray-200">
                        <p className="text-xs font-semibold text-primary-dark uppercase tracking-wide mb-1">
                            Current Dataset
                        </p>
                        <p className="text-sm text-gray-700 font-mono truncate" title={datasetId}>
                            {datasetId}
                        </p>
                        {datasetType && datasetType !== 'unknown' && (
                            <p className="text-xs text-gray-600 mt-1 capitalize">
                                Type: {datasetType.replace(/_/g, ' ')}
                            </p>
                        )}
                    </div>
                )}
                {isCollapsed && (
                    <div className="p-2 bg-primary-light border-b border-gray-200 flex justify-center">
                        <Database className="w-5 h-5 text-primary" />
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-2">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`
                                            flex items-start gap-3 rounded-lg transition-all duration-200
                                            ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'}
                                            ${active
                                                ? 'bg-primary text-white shadow-md'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                                            }
                                        `}
                                        title={isCollapsed ? `${item.name} - ${item.description}` : ''}
                                    >
                                        <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mt-0.5'} flex-shrink-0 ${active ? 'text-white' : 'text-primary'}`} />
                                        {!isCollapsed && (
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-900'}`}>
                                                    {item.name}
                                                </p>
                                                <p className={`text-xs mt-0.5 ${active ? 'text-white/80' : 'text-gray-500'}`}>
                                                    {item.description}
                                                </p>
                                            </div>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    {!isCollapsed ? (
                        <Link
                            href="/upload"
                            className="btn-outline w-full flex items-center justify-center gap-2 text-sm"
                        >
                            <Database className="w-4 h-4" />
                            Upload New Dataset
                        </Link>
                    ) : (
                        <Link
                            href="/upload"
                            className="btn-outline w-full flex items-center justify-center p-2"
                            title="Upload New Dataset"
                        >
                            <Database className="w-5 h-5" />
                        </Link>
                    )}
                </div>
            </aside>

            {/* Toggle Button (Mobile) */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="fixed top-4 left-4 z-40 lg:hidden p-2 bg-white rounded-lg shadow-lg border border-gray-200"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            )}
        </>
    );
};

export default Sidebar;
