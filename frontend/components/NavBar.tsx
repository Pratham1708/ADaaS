import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

const NavBar: React.FC = () => {
    const { user, signOut } = useAuth();

    return (
        <nav className="bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-primary">ADaaS</span>
                    </Link>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded-lg">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt="User avatar"
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-gray-600" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">
                                        {user.email}
                                    </span>
                                </div>
                                <button
                                    onClick={signOut}
                                    className="flex items-center space-x-2 px-4 py-2 text-danger hover:bg-danger-light rounded-lg transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className="btn-primary">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
