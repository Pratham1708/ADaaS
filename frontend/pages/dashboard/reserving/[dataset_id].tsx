import React from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { TrendingDown, Construction, Info } from 'lucide-react';

function ReservingPageContent() {
    const router = useRouter();
    const { dataset_id } = router.query;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <TrendingDown className="w-10 h-10 text-primary" />
                    Reserving & Chain Ladder
                </h1>
                <p className="text-gray-600 mt-2">Claims triangle analysis and reserve estimation</p>
            </div>

            {/* Coming Soon Notice */}
            <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
                <div className="text-center py-12">
                    <Construction className="w-24 h-24 text-yellow-600 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
                    <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
                        The Reserving & Chain Ladder module is currently under development.
                        This page will feature comprehensive claims triangle analysis, loss development factors,
                        and reserve adequacy metrics.
                    </p>

                    <div className="bg-white p-6 rounded-lg border border-yellow-200 max-w-2xl mx-auto">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                            <Info className="w-5 h-5 text-yellow-600" />
                            Planned Features
                        </h3>
                        <ul className="text-left space-y-2 text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span>Loss development triangles visualization</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span>Chain ladder reserve calculations</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span>Development factor analysis</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span>Ultimate loss estimates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span>Reserve adequacy metrics and diagnostics</span>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-8">
                        <p className="text-sm text-gray-600">
                            In the meantime, you can explore other analysis modules using the sidebar navigation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ReservingPage() {
    const router = useRouter();
    const { dataset_id } = router.query;

    return (
        <ProtectedRoute>
            {dataset_id && (
                <DashboardLayout datasetId={dataset_id as string}>
                    <ReservingPageContent />
                </DashboardLayout>
            )}
        </ProtectedRoute>
    );
}
