'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/src/services/auth';

export default function CallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Processing login...');

    const effectRan = React.useRef(false);

    useEffect(() => {
        if (effectRan.current) return;
        effectRan.current = true;

        const code = searchParams.get('code');

        if (code) {
            authService.exchangeToken(code)
                .then((tokens) => {
                    authService.setTokens(tokens);
                    setStatus('Login successful! Redirecting...');
                    setTimeout(() => {
                        router.push('/');
                    }, 500);
                })
                .catch((err) => {
                    console.error('Login failed', err);
                    setStatus('Login failed. Please try again.');
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                });
        } else {
            setStatus('No authorization code found.');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    }, [router, searchParams]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h2>{status}</h2>
        </div>
    );
}
