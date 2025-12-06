import React from 'react';
import Link from 'next/link';
import { Brain, CheckCircle, ArrowRight, TrendingUp, Zap, Target } from 'lucide-react';

export default function MLSurvivalFeature() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-strong">
                        <Brain className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        ML Survival Models
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Random Forest, Gradient Boosting, and CoxNet with model comparison and variable importance
                    </p>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What are ML Survival Models?</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Machine Learning Survival Models combine the power of modern machine learning algorithms with
                        traditional survival analysis. While classical methods like Cox regression are great, ML models
                        can capture complex, non-linear relationships in your data that traditional methods might miss.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Think of it as upgrading from a basic calculator to a smart computer—ML models can automatically
                        detect patterns, interactions between variables, and make more accurate predictions for complex datasets.
                    </p>
                </div>

                <div className="card bg-indigo-50 border-2 border-indigo-500 mb-8">
                    <h2 className="text-3xl font-bold text-indigo-800 mb-6">Three ML Models Explained</h2>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border-l-4 border-green-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">🌲 Random Survival Forest</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>What it is:</strong> An ensemble of decision trees that vote on survival predictions
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>How it works:</strong> Creates hundreds of decision trees, each trained on a random
                                subset of your data. Each tree makes a prediction, and the final result is the average of all trees.
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Datasets with complex interactions between variables. Handles missing
                                data well and automatically detects important features.
                            </p>
                            <div className="bg-green-50 p-4 rounded mt-3">
                                <p className="text-sm text-gray-700">
                                    <strong>Example:</strong> Predicting life insurance mortality when age, health conditions,
                                    and lifestyle factors interact in complex ways (e.g., smoking + diabetes + age).
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">⚡ Gradient Boosting Survival</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>What it is:</strong> Sequential learning where each model corrects the errors of previous ones
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>How it works:</strong> Builds trees one at a time, where each new tree focuses on fixing
                                the mistakes made by earlier trees. Like a student learning from their errors.
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Maximum prediction accuracy. Often wins machine learning competitions.
                                Great when you need the most precise survival estimates possible.
                            </p>
                            <div className="bg-blue-50 p-4 rounded mt-3">
                                <p className="text-sm text-gray-700">
                                    <strong>Example:</strong> Pricing high-value life insurance policies where small prediction
                                    errors can cost millions. Needs the highest accuracy possible.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border-l-4 border-purple-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">🎯 CoxNet (Regularized Cox)</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>What it is:</strong> Cox regression enhanced with machine learning regularization
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>How it works:</strong> Like traditional Cox regression but with automatic feature selection.
                                It automatically removes unimportant variables and prevents overfitting.
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Datasets with many variables where you want to identify which ones
                                truly matter. Provides interpretable coefficients like traditional Cox models.
                            </p>
                            <div className="bg-purple-50 p-4 rounded mt-3">
                                <p className="text-sm text-gray-700">
                                    <strong>Example:</strong> Analyzing 50+ potential risk factors for policy lapse and
                                    automatically identifying the 10 most important ones.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">How ML Survival Analysis Works</h2>

                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">The ML Survival Process:</h3>

                        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                            <div className="bg-blue-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Upload Data
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-purple-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Auto Feature Detection
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-amber-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Train 3 Models
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-green-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Compare Performance
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-pink-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Get Predictions
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Your Survival Data</h3>
                                <p className="text-gray-700">
                                    Same as traditional survival analysis: you need time-to-event and status columns.
                                    ADaaS automatically detects these.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Automatic Feature Engineering</h3>
                                <p className="text-gray-700">
                                    ADaaS prepares your data: handles missing values, encodes categorical variables,
                                    and scales numeric features—all automatically.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Train All Three Models</h3>
                                <p className="text-gray-700">
                                    With one click, ADaaS trains Random Forest, Gradient Boosting, and CoxNet models
                                    simultaneously. No coding or parameter tuning needed.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                4
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Compare & Choose Best Model</h3>
                                <p className="text-gray-700">
                                    ADaaS shows you which model performs best using C-index scores. Higher is better.
                                    Typically 0.7+ is good, 0.8+ is excellent.
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
                                <h3 className="text-lg font-bold text-gray-900">Variable Importance Rankings</h3>
                                <p className="text-gray-700">
                                    See which factors matter most for survival predictions. For example: "Age is 3x more
                                    important than gender for predicting mortality."
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Model Comparison Charts</h3>
                                <p className="text-gray-700">
                                    Side-by-side C-index scores showing which model is most accurate for your specific dataset.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Survival Curve Predictions</h3>
                                <p className="text-gray-700">
                                    Generate survival curves for any individual based on their characteristics.
                                    "What's the 5-year survival probability for a 45-year-old smoker?"
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Feature Interaction Detection</h3>
                                <p className="text-gray-700">
                                    ML models automatically find interactions (e.g., "smoking + diabetes together
                                    increases risk more than their individual effects combined").
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">ML vs Traditional Survival Analysis</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-4 font-bold">Aspect</th>
                                    <th className="p-4 font-bold">Traditional Cox</th>
                                    <th className="p-4 font-bold">ML Models</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="p-4 font-semibold">Complexity</td>
                                    <td className="p-4">Linear relationships only</td>
                                    <td className="p-4 text-green-700">✓ Captures non-linear patterns</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold">Interactions</td>
                                    <td className="p-4">Must specify manually</td>
                                    <td className="p-4 text-green-700">✓ Detects automatically</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold">Accuracy</td>
                                    <td className="p-4">Good for simple data</td>
                                    <td className="p-4 text-green-700">✓ Better for complex data</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold">Interpretability</td>
                                    <td className="p-4 text-green-700">✓ Clear coefficients</td>
                                    <td className="p-4">Importance scores (less direct)</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold">Best Use</td>
                                    <td className="p-4">Regulatory reporting, simple models</td>
                                    <td className="p-4">Maximum accuracy, complex datasets</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card bg-green-50 border-2 border-green-500 mb-8">
                    <h2 className="text-3xl font-bold text-green-800 mb-6">Common Use Cases</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg">
                            <Target className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">High-Value Life Insurance</h3>
                            <p className="text-gray-700">
                                When pricing million-dollar policies, ML's extra accuracy can save significant money
                                by better identifying low-risk vs high-risk applicants.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Zap className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Complex Health Conditions</h3>
                            <p className="text-gray-700">
                                Predict outcomes for patients with multiple interacting health conditions where
                                traditional models struggle.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Churn Prediction</h3>
                            <p className="text-gray-700">
                                Identify which policyholders are most likely to lapse and when, enabling targeted
                                retention campaigns.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Brain className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Feature Discovery</h3>
                            <p className="text-gray-700">
                                Automatically discover which of 50+ variables actually matter for your predictions,
                                saving analysis time.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/upload" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                        Try ML Survival Models
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-gray-600 mt-4">
                        Upload your data and compare all three models automatically
                    </p>
                </div>
            </div>
        </div>
    );
}
