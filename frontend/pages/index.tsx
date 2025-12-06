import React from 'react';
import Link from 'next/link';
import NavBar from '../components/NavBar';
import { useAuth } from '../contexts/AuthContext';
import {
    Bot,
    TrendingUp,
    Zap,
    Shield,
    BarChart3,
    Activity,
    Database,
    Brain,
    Skull,
    TrendingDown,
    Upload,
    Sparkles,
    CheckCircle,
    ArrowRight,
    LayoutDashboard,
    FileText,
    LineChart
} from 'lucide-react';

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            {/* Navigation Bar */}
            <NavBar />

            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
                    <div className="text-center animate-fade-in">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light rounded-full mb-6">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">Powered by Google Gemini AI</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6">
                            AI-Powered
                            <span className="block text-gradient mt-2">Actuarial Analytics</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Transform your actuarial data into actionable insights with Gemini AI.
                            Upload datasets, run survival models, perform GLM pricing, and generate
                            comprehensive reports—all in one platform.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link
                                href="/upload"
                                className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                Upload Dataset
                            </Link>
                            {!user && (
                                <Link
                                    href="/login"
                                    className="btn-outline text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
                                >
                                    <LayoutDashboard className="w-5 h-5" />
                                    Explore Dashboard
                                </Link>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
                            <div className="stat-card">
                                <div className="text-3xl font-bold text-primary mb-1">8+</div>
                                <div className="text-sm text-gray-600">Analysis Types</div>
                            </div>
                            <div className="stat-card">
                                <div className="text-3xl font-bold text-secondary mb-1">AI</div>
                                <div className="text-sm text-gray-600">Powered Insights</div>
                            </div>
                            <div className="stat-card">
                                <div className="text-3xl font-bold text-accent mb-1">NLQ</div>
                                <div className="text-sm text-gray-600">Natural Queries</div>
                            </div>
                            <div className="stat-card">
                                <div className="text-3xl font-bold text-purple mb-1">Auto</div>
                                <div className="text-sm text-gray-600">Dashboards</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary opacity-10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-secondary opacity-10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Key Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16 animate-slide-up">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        Comprehensive Actuarial Toolkit
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Everything you need for professional actuarial analysis, powered by cutting-edge AI
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* AI Insights */}
                    <div className="feature-card hover-lift">
                        <div className="flex items-center justify-center w-14 h-14 bg-gradient-bg-primary rounded-xl mb-4">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">AI Insights</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Natural language queries, Gemini-powered analysis, and intelligent data quality assessment
                        </p>
                        <Link href="/features/ai-insights" className="text-primary font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Dataset Workspace */}
                    <div className="feature-card hover-lift">
                        <div className="flex items-center justify-center w-14 h-14 bg-gradient-bg-secondary rounded-xl mb-4">
                            <Database className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Dataset Workspace</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Comprehensive data profiling, correlation analysis, and auto-generated data dictionaries
                        </p>
                        <Link href="/features/dataset-workspace" className="text-secondary font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Survival Analysis */}
                    <div className="feature-card hover-lift">
                        <div className="flex items-center justify-center w-14 h-14 bg-gradient-bg-accent rounded-xl mb-4">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Survival Analysis</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Kaplan-Meier curves, Nelson-Aalen hazards, life tables, and Cox proportional hazards
                        </p>
                        <Link href="/features/survival-analysis" className="text-accent font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* GLM Pricing */}
                    <div className="feature-card hover-lift">
                        <div className="flex items-center justify-center w-14 h-14 bg-purple-500 rounded-xl mb-4">
                            <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">GLM Pricing</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Poisson, Gamma, and Negative Binomial models with feature importance analysis
                        </p>
                        <Link href="/features/glm-pricing" className="text-purple font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* ML Survival */}
                    <div className="feature-card hover-lift">
                        <div className="flex items-center justify-center w-14 h-14 bg-indigo-500 rounded-xl mb-4">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">ML Survival Models</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Random Forest, Gradient Boosting, and CoxNet with model comparison and variable importance
                        </p>
                        <Link href="/features/ml-survival" className="text-indigo font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Mortality Tables */}
                    <div className="feature-card hover-lift">
                        <div className="flex items-center justify-center w-14 h-14 bg-red-500 rounded-xl mb-4">
                            <Skull className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Mortality Tables</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Complete actuarial life tables, parametric fitting, and graduation methods
                        </p>
                        <Link href="/features/mortality-tables" className="text-danger font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Time-Series Forecasting */}
                    <div className="feature-card hover-lift">
                        <div className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-xl mb-4">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Time-Series Forecasting</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            ARIMA, Prophet, and Holt-Winters models with automatic model selection
                        </p>
                        <Link href="/features/time-series" className="text-secondary font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Reserving */}
                    <div className="feature-card hover-lift">
                        <div className="flex items-center justify-center w-14 h-14 bg-amber-500 rounded-xl mb-4">
                            <TrendingDown className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Reserving</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Chain-ladder method for claims triangles with development factor estimation
                        </p>
                        <Link href="/features/reserving" className="text-accent font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* How ADaaS Works Section */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            How ADaaS Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Get from data to insights in four simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Step 1 */}
                        <div className="relative">
                            <div className="glass-card text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full text-2xl font-bold mb-4">
                                    1
                                </div>
                                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Upload CSV Dataset</h3>
                                <p className="text-gray-600">
                                    Simply drag and drop your actuarial data in CSV format
                                </p>
                            </div>
                            {/* Connector Arrow (hidden on mobile) */}
                            <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                <ArrowRight className="w-8 h-8 text-primary" />
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                            <div className="glass-card text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary text-white rounded-full text-2xl font-bold mb-4">
                                    2
                                </div>
                                <Bot className="w-12 h-12 text-secondary mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">AI Analyzes Data</h3>
                                <p className="text-gray-600">
                                    Gemini AI detects dataset type and analyzes column characteristics
                                </p>
                            </div>
                            <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                <ArrowRight className="w-8 h-8 text-secondary" />
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative">
                            <div className="glass-card text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent text-white rounded-full text-2xl font-bold mb-4">
                                    3
                                </div>
                                <LayoutDashboard className="w-12 h-12 text-accent mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Navigate Dashboard</h3>
                                <p className="text-gray-600">
                                    Access 8 specialized pages for different analysis types
                                </p>
                            </div>
                            <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                <ArrowRight className="w-8 h-8 text-accent" />
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="glass-card text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple text-white rounded-full text-2xl font-bold mb-4">
                                4
                            </div>
                            <FileText className="w-12 h-12 text-purple mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Generate Reports</h3>
                            <p className="text-gray-600">
                                Export comprehensive PDF/DOCX reports with all visualizations
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why Actuaries Use ADaaS Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        Why Actuaries Choose ADaaS
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Trusted by actuaries and data scientists for intelligent analysis
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Benefit 1 */}
                    <div className="card text-center">
                        <div className="flex items-center justify-center w-16 h-16 bg-primary-light rounded-full mx-auto mb-4">
                            <Zap className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Save Hours</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Automate tedious analysis tasks and get instant results instead of spending hours on manual calculations
                        </p>
                    </div>

                    {/* Benefit 2 */}
                    <div className="card text-center">
                        <div className="flex items-center justify-center w-16 h-16 bg-secondary-light rounded-full mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-secondary" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">AI-Powered Accuracy</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Leverage Google's Gemini AI for intelligent insights and automated quality checks
                        </p>
                    </div>

                    {/* Benefit 3 */}
                    <div className="card text-center">
                        <div className="flex items-center justify-center w-16 h-16 bg-accent-light rounded-full mx-auto mb-4">
                            <LineChart className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Comprehensive Reporting</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Generate professional reports with all visualizations, KPIs, and analysis results
                        </p>
                    </div>

                    {/* Benefit 4 */}
                    <div className="card text-center">
                        <div className="flex items-center justify-center w-16 h-16 bg-danger-light rounded-full mx-auto mb-4">
                            <Shield className="w-8 h-8 text-danger" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Enterprise Security</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Firebase authentication ensures your sensitive actuarial data is always protected
                        </p>
                    </div>
                </div>
            </div>

            {/* Final CTA Section */}
            <div className="gradient-bg-primary py-20">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                        Ready to Transform Your Actuarial Workflow?
                    </h2>
                    <p className="text-xl text-white/90 mb-8 leading-relaxed">
                        Join actuaries and data scientists using ADaaS for intelligent, AI-powered analysis.
                        Upload your first dataset and see the difference.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/upload"
                            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-200 shadow-strong hover-lift"
                        >
                            <Upload className="w-5 h-5" />
                            Get Started Free
                        </Link>
                        {!user && (
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-transparent text-white border-2 border-white rounded-lg font-bold text-lg hover:bg-white hover:text-primary transition-all duration-200"
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h3 className="text-3xl font-bold mb-2">ADaaS</h3>
                        <p className="text-gray-400 mb-6 text-lg">Actuarial Dashboard as a Service</p>
                        <p className="text-gray-500 text-sm">
                            © 2025 ADaaS. All rights reserved. Built with ❤️ for actuaries and data scientists.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
