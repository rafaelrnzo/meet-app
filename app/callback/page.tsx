"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/src/services/auth';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Processing login...');
    const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');

    const effectRan = useRef(false);

    useEffect(() => {
        if (effectRan.current) return;
        effectRan.current = true;

        const code = searchParams.get('code');

        if (code) {
            authService.exchangeToken(code)
                .then((tokens) => {
                    authService.setTokens(tokens);
                    setStatus('Login successful! Redirecting...');
                    setState('success');
                    setTimeout(() => {
                        router.push('/');
                    }, 800);
                })
                .catch((err) => {
                    console.error('Login failed', err);
                    setStatus('Login failed. Please try again.');
                    setState('error');
                    setTimeout(() => {
                        router.push('/login');
                    }, 2500);
                });
        } else {
            setStatus('No authorization code found.');
            setState('error');
            setTimeout(() => {
                router.push('/login');
            }, 2500);
        }
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="w-full max-w-sm border-slate-800 bg-slate-950/50 shadow-xl backdrop-blur-sm">
                    <CardHeader className="items-center text-center pb-2">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-800">
                            {state === 'loading' && (
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                            )}
                            {state === 'success' && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </motion.div>
                            )}
                            {state === 'error' && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <XCircle className="h-8 w-8 text-red-500" />
                                </motion.div>
                            )}
                        </div>
                        <CardTitle className="text-xl text-slate-100">
                            {state === 'loading' ? 'Authenticating' : state === 'success' ? 'Welcome Back' : 'Authentication Error'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Please wait while we set up your session
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-8">
                        <p className={`text-sm font-medium ${state === 'error' ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                            {status}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
