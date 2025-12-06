import React from 'react';
import Link from 'next/link';
import { Activity, CheckCircle, ArrowRight, TrendingUp, BarChart3, Users } from 'lucide-react';

export default function SurvivalAnalysisFeature() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-strong">
                        <Activity className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        Survival Analysis
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Kaplan-Meier curves, Nelson-Aalen hazards, life tables, and Cox proportional hazards models
                    </p>
                </div>

                {/* What is it? */}
                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What is Survival Analysis?</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Survival analysis is a statistical method used to analyze the time until an event occurs.
                        In actuarial science, this "event" could be death, policy lapse, claim occurrence, or any
                        other time-dependent outcome you want to study.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        For example, if you're analyzing life insurance data, survival analysis helps you understand:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>How long policyholders typically live after purchasing a policy</li>
                        <li>What percentage of people survive to different ages</li>
                        <li>How survival rates differ between groups (e.g., smokers vs. non-smokers)</li>
                        <li>Which factors increase or decrease the risk of the event occurring</li>
                    </ul>
                </div>

                {/* Key Concepts */}
                <div className="card bg-green-50 border-2 border-green-500 mb-8">
                    <h2 className="text-3xl font-bold text-green-800 mb-6">Key Concepts Explained</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">📊 Kaplan-Meier Curves</h3>
                            <p className="text-gray-700 mb-2">
                                <strong>What it is:</strong> A step-by-step graph showing the probability of survival over time.
                            </p>
                            <p className="text-gray-700">
                                <strong>Why it's useful:</strong> Easily visualize how many people survive at each time point.
                                The curve drops each time someone experiences the event (e.g., death). You can compare multiple
                                groups on the same graph to see which has better survival rates.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">⚡ Nelson-Aalen Hazard</h3>
                            <p className="text-gray-700 mb-2">
                                <strong>What it is:</strong> The cumulative hazard function—essentially the accumulated risk over time.
                            </p>
                            <p className="text-gray-700">
                                <strong>Why it's useful:</strong> While Kaplan-Meier shows survival probability, Nelson-Aalen shows
                                accumulated risk. It's particularly useful for understanding how risk builds up over time and for
                                comparing hazard rates between groups.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Life Tables</h3>
                            <p className="text-gray-700 mb-2">
                                <strong>What it is:</strong> A detailed table showing survival statistics at each time interval.
                            </p>
                            <p className="text-gray-700">
                                <strong>Why it's useful:</strong> Provides exact numbers for survival probability, number at risk,
                                number of events, and hazard rates at each time point. Essential for actuarial calculations and
                                regulatory reporting.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">🎯 Cox Proportional Hazards</h3>
                            <p className="text-gray-700 mb-2">
                                <strong>What it is:</strong> A regression model that identifies which factors affect survival time.
                            </p>
                            <p className="text-gray-700">
                                <strong>Why it's useful:</strong> Answers questions like "Does smoking increase mortality risk?"
                                or "How much does age affect survival?" Provides hazard ratios that quantify the impact of each factor.
                            </p>
                        </div>
                    </div>
                </div>

                {/* What You Need */}
                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">What Data Do You Need?</h2>
                    <p className="text-gray-700 mb-4">
                        To perform survival analysis, your dataset should contain:
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Time Variable</h3>
                                <p className="text-gray-700">
                                    The duration from start to event (or end of observation). Examples: age at death,
                                    years since policy issue, months until claim.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Event Indicator (Status)</h3>
                                <p className="text-gray-700">
                                    A column indicating whether the event occurred (1) or the observation was censored (0).
                                    Censored means we stopped observing before the event happened.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Optional: Grouping Variables</h3>
                                <p className="text-gray-700">
                                    Variables to compare groups (e.g., gender, smoking status, policy type).
                                    ADaaS will create separate survival curves for each group.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Use Cases */}
                <div className="card bg-blue-50 border-2 border-blue-500 mb-8">
                    <h2 className="text-3xl font-bold text-blue-800 mb-6">Real-World Use Cases</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg">
                            <Users className="w-8 h-8 text-blue-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Life Insurance Pricing</h3>
                            <p className="text-gray-700">
                                Analyze mortality patterns to set appropriate premiums. Compare survival rates across
                                different risk classes and age groups.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Policy Lapse Analysis</h3>
                            <p className="text-gray-700">
                                Study how long customers keep their policies before lapsing. Identify factors that
                                lead to early termination.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Claims Occurrence</h3>
                            <p className="text-gray-700">
                                Analyze time until first claim for health or disability insurance. Understand claim
                                patterns and risk factors.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Activity className="w-8 h-8 text-blue-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Pension Planning</h3>
                            <p className="text-gray-700">
                                Estimate retirement duration and longevity for pension fund planning. Calculate
                                expected benefit payments.
                            </p>
                        </div>
                    </div>
                </div>

                {/* How ADaaS Helps */}
                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">How ADaaS Makes It Easy</h2>

                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">The Survival Analysis Process:</h3>

                        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                            <div className="bg-blue-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Upload Data
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-purple-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Auto Detect Columns
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-amber-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Run Analysis
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-green-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Get Results
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <p className="text-gray-700">
                                <strong>Automatic Detection:</strong> Upload your data and ADaaS automatically identifies
                                time and status columns using AI.
                            </p>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <p className="text-gray-700">
                                <strong>One-Click Analysis:</strong> Generate Kaplan-Meier curves, life tables, and Cox models
                                with a single click—no coding required.
                            </p>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <p className="text-gray-700">
                                <strong>Interactive Visualizations:</strong> Explore survival curves with hover tooltips,
                                zoom capabilities, and group comparisons.
                            </p>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <p className="text-gray-700">
                                <strong>Export-Ready Reports:</strong> Generate professional PDF/DOCX reports with all
                                survival analysis results for stakeholders.
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
                        Start Survival Analysis
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-gray-600 mt-4">
                        Upload your survival data and get instant insights
                    </p>
                </div>
            </div>
        </div>
    );
}
