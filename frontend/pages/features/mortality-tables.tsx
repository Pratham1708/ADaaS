import React from 'react';
import Link from 'next/link';
import { Skull, CheckCircle, ArrowRight, TrendingDown, BarChart3, Calculator } from 'lucide-react';

export default function MortalityTablesFeature() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl mb-6 shadow-strong">
                        <Skull className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                        Mortality Tables
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Complete actuarial life tables, parametric fitting, and graduation methods
                    </p>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">What are Mortality Tables?</h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                        Mortality tables (also called life tables) are fundamental tools in actuarial science that show
                        the probability of death at each age. They're essential for pricing life insurance, calculating
                        pension obligations, and understanding population longevity trends.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        Think of a mortality table as a detailed roadmap of human lifespan—it tells you at each age:
                        how many people are alive, how many die, and what's the probability of surviving to the next age.
                    </p>
                </div>

                <div className="card bg-red-50 border-2 border-red-500 mb-8">
                    <h2 className="text-3xl font-bold text-red-800 mb-6">Key Components of a Life Table</h2>

                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">📊 lx (Number Living)</h3>
                            <p className="text-gray-700">
                                The number of people alive at the beginning of each age. Starts with a base number
                                (usually 100,000) and decreases as people die.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">💀 dx (Number Dying)</h3>
                            <p className="text-gray-700">
                                The number of people who die during each age interval. This is lx minus lx+1.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">⚡ qx (Mortality Rate)</h3>
                            <p className="text-gray-700">
                                The probability of dying within one year for someone at age x. This is the key metric
                                for insurance pricing. Formula: qx = dx / lx
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">✅ px (Survival Probability)</h3>
                            <p className="text-gray-700">
                                The probability of surviving one more year. This is 1 - qx. Used to calculate
                                multi-year survival probabilities.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">⏳ ex (Life Expectancy)</h3>
                            <p className="text-gray-700">
                                The average number of years remaining for someone at age x. For example, e65 might
                                be 20 years, meaning a 65-year-old can expect to live to 85 on average.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">How Mortality Tables are Built</h2>

                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">The Life Table Construction Process:</h3>

                        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                            <div className="bg-blue-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Raw Death Data
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-purple-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Calculate qx
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-amber-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Graduation
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="bg-green-100 p-4 rounded-lg flex-1 min-w-[120px] text-center font-semibold">
                                Build Full Table
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                1
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Collect Death Statistics</h3>
                                <p className="text-gray-700">
                                    Gather data on deaths and exposures (person-years) by age. This could be from
                                    insurance company experience or population statistics.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                2
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Calculate Raw Mortality Rates</h3>
                                <p className="text-gray-700">
                                    Compute qx = deaths / exposures for each age. These raw rates often have random
                                    fluctuations due to small sample sizes.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                3
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Graduate (Smooth) the Rates</h3>
                                <p className="text-gray-700">
                                    Apply mathematical methods to smooth out random fluctuations while preserving
                                    the underlying mortality pattern. ADaaS uses Whittaker-Henderson graduation.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                4
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Build Complete Life Table</h3>
                                <p className="text-gray-700">
                                    Using graduated qx values, calculate all other columns: lx, dx, px, ex, and more.
                                    ADaaS does this automatically.
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
                                <h3 className="text-lg font-bold text-gray-900">Complete Life Tables</h3>
                                <p className="text-gray-700">
                                    All standard columns: age, lx, dx, qx, px, Lx (person-years lived), Tx (total
                                    person-years remaining), and ex (life expectancy).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Parametric Model Fitting</h3>
                                <p className="text-gray-700">
                                    Fit Gompertz, Makeham, and Weibull models to your mortality data. These mathematical
                                    functions describe mortality patterns with just a few parameters.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Graduation Methods</h3>
                                <p className="text-gray-700">
                                    Whittaker-Henderson graduation to smooth raw mortality rates while maintaining
                                    the overall shape of the mortality curve.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Visualization Charts</h3>
                                <p className="text-gray-700">
                                    Interactive charts showing qx by age, survival curves, and comparisons between
                                    raw and graduated rates.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Exportable Tables</h3>
                                <p className="text-gray-700">
                                    Download complete life tables in CSV or Excel format for use in pricing models
                                    and regulatory filings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-green-50 border-2 border-green-500 mb-8">
                    <h2 className="text-3xl font-bold text-green-800 mb-6">Common Use Cases</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg">
                            <Calculator className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Life Insurance Pricing</h3>
                            <p className="text-gray-700">
                                Use mortality tables to calculate expected death benefits and set appropriate premiums
                                for term life and whole life policies.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <BarChart3 className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Pension Valuations</h3>
                            <p className="text-gray-700">
                                Estimate how long retirees will live to calculate pension fund liabilities and
                                required contributions.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <TrendingDown className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Experience Studies</h3>
                            <p className="text-gray-700">
                                Compare your company's actual mortality experience against standard tables to
                                identify if your portfolio is riskier or safer.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg">
                            <Skull className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Regulatory Compliance</h3>
                            <p className="text-gray-700">
                                Generate standardized life tables for regulatory submissions and reserve calculations
                                required by insurance authorities.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/upload" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                        Build Mortality Tables
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-gray-600 mt-4">
                        Upload your mortality data and generate complete life tables
                    </p>
                </div>
            </div>
        </div>
    );
}
