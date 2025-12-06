import React from 'react';
import Link from 'next/link';
import { Bot, Sparkles, CheckCircle, ArrowRight, TrendingUp, FileText, BarChart3 } from 'lucide-react';

export default function AIInsightsFeature() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-bg-primary rounded-2xl mb-6 shadow-strong">
                        <Bot className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        AI Insights
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Natural language queries, Gemini-powered analysis, and intelligent data quality assessment
                    </p>
                </div>

                {/* What is it? */}
                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-primary" />
                        What is AI Insights?
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        AI Insights is your intelligent assistant for understanding and analyzing actuarial data.
                        Powered by Google's Gemini AI, it automatically examines your datasets and provides
                        human-readable explanations, recommendations, and insights without requiring any
                        technical knowledge.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Think of it as having an expert data scientist who can instantly understand your data
                        and explain it to you in plain English, highlighting important patterns, potential issues,
                        and suggesting the best analysis approaches.
                    </p>
                </div>

                {/* Key Features */}
                <div className="card bg-secondary-light border-2 border-secondary mb-8">
                    <h2 className="text-3xl font-bold text-secondary-dark mb-6">Key Features</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Natural Language Queries</h3>
                                <p className="text-gray-700">
                                    Ask questions about your data in plain English. No need to write SQL or code.
                                    Just type "Show me the average claim amount by age group" and get instant visualizations.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Automatic Data Understanding</h3>
                                <p className="text-gray-700">
                                    Gemini AI automatically detects what type of data you have (survival data, claims data,
                                    mortality tables, etc.) and provides relevant insights specific to that data type.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Generated Column Descriptions</h3>
                                <p className="text-gray-700">
                                    Each column in your dataset gets an AI-generated description explaining what it represents,
                                    making it easy to understand unfamiliar datasets.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Data Quality Assessment</h3>
                                <p className="text-gray-700">
                                    Automatically identifies data quality issues like missing values, outliers, and
                                    inconsistencies, with AI-powered recommendations for cleaning and improvement.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Recommended Visualizations</h3>
                                <p className="text-gray-700">
                                    AI suggests the most appropriate charts and graphs for your data, automatically
                                    creating visualizations that highlight key patterns and trends.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How it Works */}
                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>

                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">The AI Insights Process:</h3>

                        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                            <div className="bg-blue-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Upload Data
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-purple-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                AI Analysis
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-amber-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Get Insights
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-green-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Ask Questions
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Your Data</h3>
                                <p className="text-gray-700">
                                    Simply upload your CSV file. ADaaS supports various actuarial data types including
                                    survival data, claims data, mortality tables, and more.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-xl">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analyzes Automatically</h3>
                                <p className="text-gray-700">
                                    Gemini AI examines your data structure, detects the data type, identifies key columns,
                                    and generates comprehensive insights about your dataset.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-xl">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Get Instant Insights</h3>
                                <p className="text-gray-700">
                                    View AI-generated descriptions, key insights, business recommendations, and data quality
                                    assessments—all in plain language that anyone can understand.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple text-white rounded-full flex items-center justify-center font-bold text-xl">
                                4
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Ask Questions</h3>
                                <p className="text-gray-700">
                                    Use natural language to query your data. Ask anything from simple questions like
                                    "What's the average age?" to complex ones like "Show me survival curves by gender."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Use Cases */}
                <div className="card bg-purple-light border-2 border-purple mb-8">
                    <h2 className="text-3xl font-bold text-purple-dark mb-6">Common Use Cases</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-purple mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Data Exploration</h3>
                            <p className="text-gray-700">
                                Quickly understand a new dataset without spending hours manually exploring it.
                                Get instant summaries and key statistics.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <FileText className="w-8 h-8 text-purple mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Data Quality Checks</h3>
                            <p className="text-gray-700">
                                Identify data quality issues before running complex analyses. Get AI recommendations
                                for data cleaning and preparation.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <BarChart3 className="w-8 h-8 text-purple mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Ad-hoc Analysis</h3>
                            <p className="text-gray-700">
                                Answer quick questions from stakeholders without writing code. Generate charts and
                                insights on-demand using natural language.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Bot className="w-8 h-8 text-purple mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Learning Tool</h3>
                            <p className="text-gray-700">
                                New to actuarial analysis? AI Insights explains concepts and patterns in your data,
                                helping you learn while you work.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href="/upload"
                        className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
                    >
                        Try AI Insights Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-gray-600 mt-4">
                        Upload your first dataset and experience AI-powered insights
                    </p>
                </div>
            </div>
        </div>
    );
}
