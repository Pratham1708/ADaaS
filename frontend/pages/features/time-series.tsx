import React from 'react';
import Link from 'next/link';
import { TrendingUp, CheckCircle, ArrowRight, LineChart, BarChart3, Zap } from 'lucide-react';

export default function TimeSeriesFeature() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl mb-6 shadow-strong">
                        <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        Time-Series Forecasting
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        ARIMA, Prophet, and Holt-Winters models with automatic model selection
                    </p>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What is Time-Series Forecasting?</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Time-series forecasting predicts future values based on historical patterns over time. In
                        actuarial work, this is essential for forecasting claim volumes, premium trends, reserve
                        requirements, and financial metrics.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Instead of just looking at static snapshots, time-series analysis understands how things change
                        over time—capturing trends, seasonal patterns, and cyclical behaviors to make accurate predictions.
                    </p>
                </div>

                <div className="card bg-green-50 border-2 border-green-500 mb-8">
                    <h2 className="text-3xl font-bold text-green-800 mb-6">Three Forecasting Models Explained</h2>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">📈 ARIMA (AutoRegressive Integrated Moving Average)</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>What it is:</strong> A classical statistical model that uses past values and past
                                errors to predict future values
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>How it works:</strong> Combines three components: AR (uses past values), I (removes
                                trends), and MA (uses past forecast errors). It's like learning from both what happened
                                and what you got wrong before.
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Data with clear trends and patterns. Works well for monthly/quarterly
                                business metrics like claim counts or premium revenue.
                            </p>
                            <div className="bg-blue-50 p-4 rounded mt-3">
                                <p className="text-sm text-gray-700">
                                    <strong>Example:</strong> Forecasting next quarter's claim volume based on the past 3 years
                                    of monthly claims, accounting for seasonal spikes.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border-l-4 border-purple-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">🔮 Prophet (Facebook's Algorithm)</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>What it is:</strong> A modern forecasting tool designed for business time series with
                                strong seasonal patterns
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>How it works:</strong> Decomposes your data into trend + seasonality + holidays.
                                Automatically detects weekly, monthly, and yearly patterns. Very robust to missing data.
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Business data with multiple seasonal patterns (daily, weekly, yearly).
                                Handles holidays and special events automatically.
                            </p>
                            <div className="bg-purple-50 p-4 rounded mt-3">
                                <p className="text-sm text-gray-700">
                                    <strong>Example:</strong> Predicting daily website traffic for an insurance portal,
                                    accounting for weekday/weekend patterns and holiday effects.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border-l-4 border-orange-500">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">❄️ Holt-Winters (Exponential Smoothing)</h3>
                            <p className="text-gray-700 mb-3">
                                <strong>What it is:</strong> A smoothing technique that gives more weight to recent observations
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>How it works:</strong> Uses exponentially decreasing weights for older data. Captures
                                level, trend, and seasonal components. Simple but effective.
                            </p>
                            <p className="text-gray-700 mb-3">
                                <strong>Best for:</strong> Data with clear seasonal patterns and trends. Fast to compute and
                                easy to interpret. Great for short-term forecasts.
                            </p>
                            <div className="bg-orange-50 p-4 rounded mt-3">
                                <p className="text-sm text-gray-700">
                                    <strong>Example:</strong> Forecasting next month's claim costs when you have consistent
                                    seasonal patterns (e.g., higher claims in winter).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">How Time-Series Forecasting Works</h2>

                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">The Forecasting Process:</h3>

                        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                            <div className="bg-blue-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Upload Time Data
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-purple-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Detect Patterns
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-amber-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Train 3 Models
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-green-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Select Best
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-pink-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Generate Forecast
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Your Time-Series Data</h3>
                                <p className="text-gray-700">
                                    Provide data with a date/time column and a value column (e.g., monthly claims,
                                    daily premiums). ADaaS automatically detects the time frequency.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Automatic Pattern Detection</h3>
                                <p className="text-gray-700">
                                    ADaaS analyzes your data for trends (upward/downward), seasonality (repeating patterns),
                                    and stationarity (stability over time).
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Train Multiple Models</h3>
                                <p className="text-gray-700">
                                    ARIMA, Prophet, and Holt-Winters models are all trained on your data. Each model
                                    makes predictions for a test period.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                4
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Select Best Performer</h3>
                                <p className="text-gray-700">
                                    ADaaS compares models using MAPE (Mean Absolute Percentage Error). Lower is better.
                                    The best model is automatically selected for your forecast.
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
                                <h3 className="text-lg font-bold text-gray-900">Future Predictions with Confidence Intervals</h3>
                                <p className="text-gray-700">
                                    Get point forecasts plus upper/lower bounds showing the range of likely outcomes.
                                    For example: "Next month: 1,200 claims (range: 1,050-1,350)."
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Model Comparison Charts</h3>
                                <p className="text-gray-700">
                                    See how each model performed on historical data. Compare MAPE scores to understand
                                    which model is most accurate for your specific data.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Trend & Seasonality Decomposition</h3>
                                <p className="text-gray-700">
                                    Visualize your data broken down into trend, seasonal, and residual components.
                                    Understand what drives your time series.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Interactive Forecast Charts</h3>
                                <p className="text-gray-700">
                                    Zoom, pan, and explore your historical data and future forecasts. Export charts
                                    for presentations and reports.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-purple-50 border-2 border-purple-500 mb-8">
                    <h2 className="text-3xl font-bold text-purple-800 mb-6">Common Use Cases</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg">
                            <LineChart className="w-8 h-8 text-purple-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Claims Volume Forecasting</h3>
                            <p className="text-gray-700">
                                Predict future claim counts to plan staffing, set reserves, and manage cash flow.
                                Essential for operational planning.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Revenue Projection</h3>
                            <p className="text-gray-700">
                                Forecast premium income for budgeting and financial planning. Understand seasonal
                                patterns in policy sales.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Zap className="w-8 h-8 text-purple-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Loss Ratio Trends</h3>
                            <p className="text-gray-700">
                                Track and predict loss ratios over time. Identify deteriorating trends early to
                                adjust pricing or underwriting.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Reserve Forecasting</h3>
                            <p className="text-gray-700">
                                Project future reserve requirements based on historical claim development patterns
                                and trends.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/upload" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                        Start Forecasting
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-gray-600 mt-4">
                        Upload your time-series data and get instant forecasts
                    </p>
                </div>
            </div>
        </div>
    );
}
