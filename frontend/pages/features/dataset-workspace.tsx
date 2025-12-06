import React from 'react';
import Link from 'next/link';
import { Database, CheckCircle, ArrowRight, BarChart3, FileText, Grid } from 'lucide-react';

export default function DatasetWorkspaceFeature() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-strong">
                        <Database className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        Dataset Workspace
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Comprehensive data profiling, correlation analysis, and auto-generated data dictionaries
                    </p>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What is Dataset Workspace?</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Dataset Workspace is your command center for understanding and exploring your data. It automatically
                        profiles your dataset, generates comprehensive statistics, creates data dictionaries, and helps you
                        understand relationships between variables—all without writing a single line of code.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Think of it as getting a complete health checkup for your data: you'll see exactly what's in your
                        dataset, what's missing, what's unusual, and how different variables relate to each other.
                    </p>
                </div>

                <div className="card bg-cyan-50 border-2 border-cyan-500 mb-8">
                    <h2 className="text-3xl font-bold text-cyan-800 mb-6">Key Features</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Automatic Data Profiling</h3>
                                <p className="text-gray-700">
                                    Get instant statistics for every column: mean, median, min, max, missing values, unique counts,
                                    and distribution patterns. No manual calculations needed.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Generated Data Dictionary</h3>
                                <p className="text-gray-700">
                                    Every column gets an AI-written description explaining what it represents, its data type,
                                    quality flags, and sample values. Perfect for understanding unfamiliar datasets.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Data Quality Scoring</h3>
                                <p className="text-gray-700">
                                    Get an overall data quality score (0-100) with breakdowns for completeness, uniqueness,
                                    and consistency. Quickly identify problem areas.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Column-Level Analysis</h3>
                                <p className="text-gray-700">
                                    Detailed profiling for each column including distribution charts, top values for categorical
                                    data, and outlier detection for numeric data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">What You'll See</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Grid className="w-6 h-6 text-cyan-600" />
                                Overview Tab
                            </h3>
                            <p className="text-gray-700 mb-2">High-level summary of your entire dataset:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                <li>Total rows and columns</li>
                                <li>Number of numeric vs categorical columns</li>
                                <li>Total missing values and percentage</li>
                                <li>Duplicate rows count</li>
                                <li>Memory usage</li>
                                <li>Data quality metrics with progress bars</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <BarChart3 className="w-6 h-6 text-cyan-600" />
                                Column Profiling Tab
                            </h3>
                            <p className="text-gray-700 mb-2">Detailed analysis for each column:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                <li>Data type and column type (numeric/categorical)</li>
                                <li>Missing value count and percentage</li>
                                <li>Unique value count and percentage</li>
                                <li>For numeric: mean, min, max, standard deviation</li>
                                <li>For categorical: top values and their frequencies</li>
                                <li>Sample values from the column</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-cyan-600" />
                                Data Dictionary Tab
                            </h3>
                            <p className="text-gray-700 mb-2">Comprehensive documentation for your dataset:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                <li>AI-generated description for each column</li>
                                <li>Data type and cardinality information</li>
                                <li>Quality flags (good quality, high missing, outliers, etc.)</li>
                                <li>Value ranges for numeric columns</li>
                                <li>Most common values for categorical columns</li>
                                <li>Searchable and filterable table</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="card bg-blue-50 border-2 border-blue-500 mb-8">
                    <h2 className="text-3xl font-bold text-blue-800 mb-6">Why It's Useful</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Save Hours of Manual Work</h3>
                            <p className="text-gray-700">
                                What would take hours of manual exploration and documentation is done automatically in seconds.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Understand New Datasets Quickly</h3>
                            <p className="text-gray-700">
                                Receive a dataset from a colleague or client? Understand it completely within minutes.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Identify Data Issues Early</h3>
                            <p className="text-gray-700">
                                Catch missing values, outliers, and quality issues before they affect your analysis.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Documentation Automatically</h3>
                            <p className="text-gray-700">
                                Generate professional data dictionaries for compliance, audits, or team collaboration.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/upload" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                        Explore Your Data Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-gray-600 mt-4">
                        Upload a dataset and see comprehensive profiling instantly
                    </p>
                </div>
            </div>
        </div>
    );
}
