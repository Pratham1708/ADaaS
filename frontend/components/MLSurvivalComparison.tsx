import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Award, Activity, Zap } from 'lucide-react';

interface VariableImportance {
    feature: string;
    importance: number;
}

interface ModelResult {
    model_type: string;
    train_c_index?: number;
    test_c_index?: number;
    concordance?: number;
    variable_importance?: VariableImportance[];
    predictions?: any[];
    error?: string;
}

interface MLSurvivalComparisonProps {
    comparisonData: {
        models: {
            [key: string]: ModelResult;
        };
        comparison?: {
            concordance_indices: { [key: string]: number };
            best_model: string;
            best_c_index: number;
        };
        best_model?: string;
    };
}

const MLSurvivalComparison: React.FC<MLSurvivalComparisonProps> = ({ comparisonData }) => {
    if (!comparisonData || !comparisonData.models) {
        return null;
    }

    const { models, comparison, best_model } = comparisonData;

    // Prepare concordance index comparison data
    const concordanceData = Object.entries(models)
        .filter(([_, result]) => !result.error)
        .map(([modelName, result]) => {
            const cIndex = result.test_c_index || result.concordance || 0;
            return {
                model: formatModelName(modelName),
                'C-Index': cIndex,
                isBest: modelName === (comparison?.best_model || best_model)
            };
        })
        .sort((a, b) => b['C-Index'] - a['C-Index']);

    // Get variable importance from best ML model
    const mlModels = ['random_survival_forest', 'gradient_boosted_survival', 'coxnet'];
    const bestMLModel = mlModels.find(m => models[m] && !models[m].error && models[m].variable_importance);
    const variableImportance = bestMLModel ? models[bestMLModel].variable_importance : null;

    // Get predictions from best model for visualization
    const predictions = bestMLModel && models[bestMLModel].predictions
        ? models[bestMLModel].predictions.slice(0, 5)
        : null;

    return (
        <div className="space-y-8">
            {/* Model Comparison Header */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                <div className="flex items-center gap-3 mb-6">
                    <Award className="w-8 h-8 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-900">ML Survival Model Comparison</h2>
                    {comparison?.best_model && (
                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
                            BEST: {formatModelName(comparison.best_model)}
                        </span>
                    )}
                </div>

                {/* Concordance Index Comparison */}
                <div className="bg-white p-6 rounded-lg border border-green-200 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                        Concordance Index Comparison
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Higher C-index indicates better model discrimination (0.5 = random, 1.0 = perfect)
                    </p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={concordanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="model"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis domain={[0, 1]} />
                                <Tooltip
                                    formatter={(value: number) => value.toFixed(4)}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="C-Index"
                                    fill="#10b981"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Model Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {Object.entries(models).map(([modelName, result]) => {
                        if (result.error) return null;

                        const cIndex = result.test_c_index || result.concordance;
                        const isBest = modelName === (comparison?.best_model || best_model);

                        return (
                            <div
                                key={modelName}
                                className={`p-4 rounded-lg border-2 ${isBest
                                        ? 'bg-green-100 border-green-500'
                                        : 'bg-white border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className={`w-5 h-5 ${isBest ? 'text-green-600' : 'text-gray-600'}`} />
                                    <h4 className="font-semibold text-sm text-gray-900">
                                        {formatModelName(modelName)}
                                    </h4>
                                </div>
                                {cIndex !== undefined && (
                                    <p className="text-2xl font-bold text-gray-900">
                                        {cIndex.toFixed(4)}
                                    </p>
                                )}
                                {isBest && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold">
                                        BEST
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Variable Importance */}
            {variableImportance && variableImportance.length > 0 && (
                <div className="card">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-600" />
                        Variable Importance ({formatModelName(bestMLModel!)})
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Features ranked by their importance in predicting survival outcomes
                    </p>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={variableImportance.slice(0, 10)}
                                layout="vertical"
                                margin={{ left: 100 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="feature"
                                    type="category"
                                    width={90}
                                />
                                <Tooltip
                                    formatter={(value: number) => value.toFixed(4)}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                                />
                                <Bar
                                    dataKey="importance"
                                    fill="#f59e0b"
                                    radius={[0, 8, 8, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Sample Predictions */}
            {predictions && predictions.length > 0 && (
                <div className="card">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-600" />
                        Sample Predicted Survival Curves
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Individual survival predictions for sample observations
                    </p>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="time"
                                    label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis
                                    domain={[0, 1]}
                                    label={{ value: 'Survival Probability', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                                />
                                <Legend />
                                {predictions.map((pred, idx) => {
                                    const data = pred.timeline.map((t: number, i: number) => ({
                                        time: t,
                                        [`Sample ${idx + 1}`]: pred.survival_prob[i]
                                    }));

                                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

                                    return (
                                        <Line
                                            key={idx}
                                            data={data}
                                            type="stepAfter"
                                            dataKey={`Sample ${idx + 1}`}
                                            stroke={colors[idx % colors.length]}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    );
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Model Details Table */}
            <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Model Details</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr className="border-b-2 border-gray-300">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Model</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Train C-Index</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Test C-Index</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Features</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(models).map(([modelName, result]) => (
                                <tr key={modelName} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {formatModelName(modelName)}
                                    </td>
                                    <td className="px-6 py-3 text-right text-gray-900">
                                        {result.train_c_index ? result.train_c_index.toFixed(4) : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right text-gray-900">
                                        {result.test_c_index ? result.test_c_index.toFixed(4) :
                                            result.concordance ? result.concordance.toFixed(4) : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right text-gray-900">
                                        {(result as any).n_features || '-'}
                                    </td>
                                    <td className="px-6 py-3">
                                        {result.error ? (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                                Error
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                Success
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">About ML Survival Models</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>
                        <strong>Random Survival Forest:</strong> Ensemble of survival trees, handles non-linear relationships and interactions
                    </li>
                    <li>
                        <strong>Gradient Boosted Survival:</strong> Sequential ensemble method, often achieves highest accuracy
                    </li>
                    <li>
                        <strong>CoxNet:</strong> Penalized Cox model with L1/L2 regularization, performs feature selection
                    </li>
                    <li>
                        <strong>Cox PH:</strong> Traditional parametric baseline model
                    </li>
                    <li>
                        <strong>Kaplan-Meier:</strong> Non-parametric baseline for overall survival estimation
                    </li>
                </ul>
            </div>
        </div>
    );
};

function formatModelName(name: string): string {
    const nameMap: { [key: string]: string } = {
        'kaplan_meier': 'Kaplan-Meier',
        'cox_ph': 'Cox PH',
        'random_survival_forest': 'Random Survival Forest',
        'gradient_boosted_survival': 'Gradient Boosted',
        'coxnet': 'CoxNet (Penalized)'
    };
    return nameMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default MLSurvivalComparison;
