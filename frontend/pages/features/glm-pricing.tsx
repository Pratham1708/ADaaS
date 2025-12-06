import React from 'react';
import Link from 'next/link';
import { BarChart3, CheckCircle, ArrowRight, TrendingUp, Calculator, Target } from 'lucide-react';

export default function GLMPricingFeature() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-6 shadow-strong">
                        <BarChart3 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        GLM Pricing
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Generalized Linear Models for insurance pricing: Poisson, Gamma, and Negative Binomial
                    </p>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What is GLM Pricing?</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        GLM (Generalized Linear Model) is a statistical technique used in insurance to predict claim costs
                        and set appropriate premiums. It helps answer questions like: "How much should we charge a 30-year-old
                        male driver?" or "What's the expected claim amount for a homeowner in California?"
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Instead of charging everyone the same price, GLM allows you to adjust premiums based on risk factors
                        like age, location, coverage type, and more—making pricing fairer and more accurate.
                    </p>
                </div>

                <div className="card bg-purple-50 border-2 border-purple-500 mb-8">
                    <h2 className="text-3xl font-bold text-purple-800 mb-6">Three Model Types Explained</h2>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">📊 Poisson Model</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Predicting the <em>number</em> of claims (frequency)
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Example use case:</strong> "How many auto insurance claims will we receive from drivers aged 25-30?"
                            </p>
                            <p className="text-gray-700">
                                <strong>Why it works:</strong> Poisson distribution is designed for count data (0, 1, 2, 3 claims...).
                                It assumes that claims are rare events that occur independently.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg border-l-4 border-green-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">💰 Gamma Model</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Predicting the <em>average cost</em> of claims (severity)
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Example use case:</strong> "What's the expected dollar amount when a claim occurs?"
                            </p>
                            <p className="text-gray-700">
                                <strong>Why it works:</strong> Gamma distribution handles positive continuous values (claim amounts)
                                and naturally models right-skewed data (most claims are small, few are large).
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg border-l-4 border-orange-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">🎯 Negative Binomial Model</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Predicting claim counts when there's high variability (overdispersion)
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Example use case:</strong> "How many claims for customers with very different risk profiles?"
                            </p>
                            <p className="text-gray-700">
                                <strong>Why it works:</strong> Like Poisson but allows for more variance. Better when some
                                policyholders have way more claims than others.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">How GLM Pricing Works</h2>

                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">The GLM Pricing Process:</h3>

                        <div className="flex items-center justify-between gap-2 text-sm">
                            <div className="bg-blue-100 p-4 rounded-lg flex-1 text-center font-semibold">
                                Historical Data
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-purple-100 p-4 rounded-lg flex-1 text-center font-semibold">
                                Select Risk Factors
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-amber-100 p-4 rounded-lg flex-1 text-center font-semibold">
                                Choose Model
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-green-100 p-4 rounded-lg flex-1 text-center font-semibold">
                                Train GLM
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-pink-100 p-4 rounded-lg flex-1 text-center font-semibold">
                                Get Coefficients
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-cyan-100 p-4 rounded-lg flex-1 text-center font-semibold">
                                Calculate Premium
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Collect Historical Data</h3>
                                <p className="text-gray-700">
                                    Gather past claims data including: number of claims, claim amounts, policyholder characteristics
                                    (age, location, coverage type), and exposure (time insured).
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Select Risk Factors</h3>
                                <p className="text-gray-700">
                                    Choose variables that might affect claims: age, gender, location, vehicle type, credit score, etc.
                                    ADaaS helps identify the most important factors automatically.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Build the Model</h3>
                                <p className="text-gray-700">
                                    ADaaS fits Poisson (for frequency), Gamma (for severity), or Negative Binomial models to your data.
                                    The model learns how each risk factor affects claims.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                4
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Get Predictions</h3>
                                <p className="text-gray-700">
                                    Use the model to predict expected claims for new policies. Multiply frequency × severity to get
                                    expected total cost, then add profit margin and expenses to set premium.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-blue-50 border-2 border-blue-500 mb-8">
                    <h2 className="text-3xl font-bold text-blue-800 mb-6">What You'll Get from ADaaS</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Model Coefficients</h3>
                                <p className="text-gray-700">
                                    See exactly how much each risk factor affects the outcome. For example: "Being male increases
                                    expected claims by 15%"
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Feature Importance Charts</h3>
                                <p className="text-gray-700">
                                    Visual ranking of which variables matter most for predictions. Focus on the factors that
                                    truly drive claims.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Model Performance Metrics</h3>
                                <p className="text-gray-700">
                                    AIC, BIC, deviance, and other statistics to evaluate how well your model fits the data.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Predicted vs Actual Charts</h3>
                                <p className="text-gray-700">
                                    Visualize how well your model predictions match reality. Identify areas where the model
                                    might need improvement.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Exportable Results</h3>
                                <p className="text-gray-700">
                                    Download comprehensive PDF/DOCX reports with all model results, charts, and interpretations
                                    for stakeholders.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Real-World Example</h2>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Auto Insurance Pricing Scenario:</h3>
                        <div className="space-y-3 text-gray-700">
                            <p>
                                <strong>Goal:</strong> Set fair premiums for auto insurance based on driver characteristics
                            </p>
                            <p>
                                <strong>Step 1 - Frequency Model (Poisson):</strong> Predict how many claims each driver will file
                                <br />
                                <span className="text-sm italic">Result: Young drivers (age 18-25) have 2.3x more claims than older drivers</span>
                            </p>
                            <p>
                                <strong>Step 2 - Severity Model (Gamma):</strong> Predict average cost when a claim occurs
                                <br />
                                <span className="text-sm italic">Result: Urban drivers have $1,200 higher average claim costs</span>
                            </p>
                            <p>
                                <strong>Step 3 - Calculate Premium:</strong> Frequency × Severity × Profit Margin
                                <br />
                                <span className="text-sm italic">Result: 22-year-old urban driver: $1,800/year vs 45-year-old rural driver: $650/year</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card bg-green-50 border-2 border-green-500 mb-8">
                    <h2 className="text-3xl font-bold text-green-800 mb-6">Common Use Cases</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg">
                            <Calculator className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Calculation</h3>
                            <p className="text-gray-700">
                                Set risk-based premiums for auto, home, health, or commercial insurance products.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Target className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Risk Segmentation</h3>
                            <p className="text-gray-700">
                                Identify high-risk vs low-risk customer segments for targeted underwriting.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Rate Review</h3>
                            <p className="text-gray-700">
                                Analyze whether current rates are adequate or need adjustment based on recent claims.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <BarChart3 className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Regulatory Filing</h3>
                            <p className="text-gray-700">
                                Generate actuarially sound rate filings with statistical justification for regulators.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/upload" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                        Build Your GLM Model
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-gray-600 mt-4">
                        Upload your claims data and get instant pricing insights
                    </p>
                </div>
            </div>
        </div>
    );
}
