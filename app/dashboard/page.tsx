'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute';
import { authService } from '@/src/services/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/src/services/api';
import { motion } from 'framer-motion';
import { LogOut, User, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface UserProfile {
    name: string;
    email: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        authService.logout();
    };

    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
            // This endpoint will be implemented in the backend section
            const res = await api.get('/profile');
            setProfile(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch profile from backend');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                Dashboard
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Welcome back! You are securely logged in.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="w-full md:w-auto gap-2 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </motion.div>

                    {/* Main Content Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="grid gap-6 md:grid-cols-2"
                    >
                        {/* Profile Card */}
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                                    <User className="h-5 w-5 text-emerald-400" />
                                    User Profile
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Fetch your profile information from the secure backend.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-4 min-h-[120px] flex items-center justify-center relative overflow-hidden group">
                                    {loading ? (
                                        <div className="flex flex-col items-center gap-2 text-emerald-400">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <span className="text-sm font-medium">Fetching data...</span>
                                        </div>
                                    ) : profile ? (
                                        <div className="w-full space-y-2 text-left">
                                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                                <span className="text-sm text-slate-400">Name</span>
                                                <span className="font-medium text-slate-200">{profile.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-400">Email</span>
                                                <span className="font-medium text-slate-200">{profile.email}</span>
                                            </div>
                                        </div>
                                    ) : error ? (
                                        <div className="text-center">
                                            <p className="text-red-400 text-sm font-medium mb-1">{error}</p>
                                            <p className="text-slate-500 text-xs">Is the backend running?</p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-500">
                                            <p className="text-sm">No profile data loaded</p>
                                            <p className="text-xs mt-1">Click the button below to fetch</p>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={fetchProfile}
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    {loading ? 'Fetching...' : 'Fetch Profile Data'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Status Card */}
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl text-slate-100">
                                    <ShieldCheck className="h-5 w-5 text-cyan-400" />
                                    System Status
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Current session status and system information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 mr-3 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-200">Session Active</p>
                                            <p className="text-xs text-slate-500">You have a valid authentication token</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                                        <div className="h-2 w-2 rounded-full bg-cyan-500 mr-3 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-200">Secure Connection</p>
                                            <p className="text-xs text-slate-500">End-to-end encryption enabled</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
