import React from 'react';
import Link from 'next/link';
import { Briefcase, CheckCircle, ArrowRight, TrendingUp, Calculator, Shield } from 'lucide-react';

export default function ReservingFeature() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-strong">
                        <Briefcase className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        Reserving
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Chain-ladder method for claims triangles with development factor estimation
                    </p>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What is Reserving?</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Insurance reserving is the process of estimating how much money an insurance company needs to
                        set aside to pay future claims. Even though claims have already occurred, they often aren't
                        fully settled yet—reserving helps predict the final cost.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Think of it like budgeting for a home renovation: you know you'll have costs, but you don't
                        know the exact final bill yet. Reserving uses historical patterns to estimate what you'll
                        ultimately need to pay.
                    </p>
                </div>

                <div className="card bg-amber-50 border-2 border-amber-500 mb-8">
                    <h2 className="text-3xl font-bold text-amber-800 mb-6">Understanding Claims Triangles</h2>

                    <div className="bg-white p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">What is a Claims Triangle?</h3>
                        <p className="text-gray-700 mb-4">
                            A claims triangle (also called a loss triangle or run-off triangle) is a table showing
                            how claims develop over time. Each row represents an accident year (when claims occurred),
                            and each column represents a development period (how many years since the accident).
                        </p>

                        <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                            <h4 className="font-bold text-gray-900 mb-3">Example Claims Triangle ($000s):</h4>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border p-2">Accident Year</th>
                                        <th className="border p-2">12 months</th>
                                        <th className="border p-2">24 months</th>
                                        <th className="border p-2">36 months</th>
                                        <th className="border p-2">48 months</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border p-2 font-semibold">2020</td>
                                        <td className="border p-2 bg-green-50">1,000</td>
                                        <td className="border p-2 bg-green-50">1,200</td>
                                        <td className="border p-2 bg-green-50">1,300</td>
                                        <td className="border p-2 bg-green-50">1,350</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">2021</td>
                                        <td className="border p-2 bg-green-50">1,100</td>
                                        <td className="border p-2 bg-green-50">1,320</td>
                                        <td className="border p-2 bg-green-50">1,430</td>
                                        <td className="border p-2 bg-yellow-100">?</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">2022</td>
                                        <td className="border p-2 bg-green-50">1,150</td>
                                        <td className="border p-2 bg-green-50">1,380</td>
                                        <td className="border p-2 bg-yellow-100">?</td>
                                        <td className="border p-2 bg-yellow-100">?</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">2023</td>
                                        <td className="border p-2 bg-green-50">1,200</td>
                                        <td className="border p-2 bg-yellow-100">?</td>
                                        <td className="border p-2 bg-yellow-100">?</td>
                                        <td className="border p-2 bg-yellow-100">?</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p className="text-xs text-gray-600 mt-3">
                                <span className="inline-block w-4 h-4 bg-green-50 border mr-1"></span> Known values
                                <span className="inline-block w-4 h-4 bg-yellow-100 border ml-3 mr-1"></span> Values to estimate
                            </p>
                        </div>

                        <p className="text-gray-700 mt-4">
                            The triangle shape appears because recent years don't have enough time to develop fully.
                            The goal is to fill in the yellow "?" cells to estimate ultimate claim costs.
                        </p>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">The Chain-Ladder Method</h2>

                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">How Chain-Ladder Works:</h3>

                        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                            <div className="bg-blue-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Claims Triangle
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-purple-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Calculate LDFs
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-amber-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Project Future
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-green-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Calculate Reserves
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Organize Data into Triangle</h3>
                                <p className="text-gray-700">
                                    Arrange your claims data by accident year (rows) and development period (columns).
                                    ADaaS does this automatically from your raw data.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Calculate Development Factors (LDFs)</h3>
                                <p className="text-gray-700">
                                    For each development period, calculate how much claims typically grow. For example:
                                    "Claims at 24 months are typically 1.20x claims at 12 months."
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Project Missing Values</h3>
                                <p className="text-gray-700">
                                    Apply development factors to fill in the triangle. If 2023 claims are $1,200 at
                                    12 months and the factor is 1.20, we project $1,440 at 24 months.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                4
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Calculate Required Reserves</h3>
                                <p className="text-gray-700">
                                    Ultimate claims minus paid-to-date equals reserves needed. This tells you how much
                                    to set aside for future payments.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-blue-50 border-2 border-blue-500 mb-8">
                    <h2 className="text-3xl font-bold text-blue-800 mb-6">What ADaaS Provides</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Automatic Triangle Construction</h3>
                                <p className="text-gray-700">
                                    Upload raw claims data and ADaaS automatically creates cumulative and incremental
                                    triangles. No manual Excel work needed.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Development Factor Calculation</h3>
                                <p className="text-gray-700">
                                    Age-to-age factors, selected factors, and cumulative development factors (CDFs)
                                    calculated using multiple averaging methods (simple, weighted, volume-weighted).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Ultimate Loss Projections</h3>
                                <p className="text-gray-700">
                                    Projected ultimate claims for each accident year, showing how much you'll
                                    ultimately pay once all claims are settled.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Reserve Estimates</h3>
                                <p className="text-gray-700">
                                    Total reserves needed (IBNR + case reserves) broken down by accident year.
                                    Includes both point estimates and ranges.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Diagnostic Charts</h3>
                                <p className="text-gray-700">
                                    Visualizations showing development patterns, residual plots to check assumptions,
                                    and comparison of actual vs expected development.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Concepts Explained</h2>
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">📊 IBNR (Incurred But Not Reported)</h3>
                            <p className="text-gray-700">
                                Claims that have occurred but haven't been reported to the insurance company yet.
                                For example, a car accident happened in December but the claim isn't filed until January.
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-teal-50 p-5 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">📈 Development Factor (LDF)</h3>
                            <p className="text-gray-700">
                                The ratio showing how much claims grow from one period to the next. If claims at 24 months
                                are $1,200 and at 12 months were $1,000, the LDF is 1.20 (20% growth).
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">🎯 Ultimate Loss</h3>
                            <p className="text-gray-700">
                                The final total amount that will be paid for all claims from a particular accident year,
                                once everything is fully settled (which might take years).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card bg-green-50 border-2 border-green-500 mb-8">
                    <h2 className="text-3xl font-bold text-green-800 mb-6">Common Use Cases</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg">
                            <Calculator className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Financial Reporting</h3>
                            <p className="text-gray-700">
                                Calculate reserves for quarterly and annual financial statements. Required by
                                accounting standards and regulators.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Shield className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Regulatory Compliance</h3>
                            <p className="text-gray-700">
                                Meet statutory reserve requirements. Provide actuarial opinions and supporting
                                documentation for insurance regulators.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Pricing Analysis</h3>
                            <p className="text-gray-700">
                                Understand ultimate loss ratios to inform pricing decisions. See if current premiums
                                are adequate for expected claims.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Briefcase className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Portfolio Management</h3>
                            <p className="text-gray-700">
                                Monitor reserve adequacy over time. Identify lines of business with deteriorating
                                or improving loss development.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/upload" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                        Calculate Reserves
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-gray-600 mt-4">
                        Upload your claims triangle and get instant reserve estimates
                    </p>
                </div>
            </div>
        </div>
    );
}
