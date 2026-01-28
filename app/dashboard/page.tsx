'use client';

import ProtectedRoute from '@/src/components/ProtectedRoute';
import { authService } from '@/src/services/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/src/services/api';

interface UserProfile {
    name: string;
    email: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState('');

    const handleLogout = () => {
        authService.logout();
    };

    const fetchProfile = async () => {
        try {
            // This endpoint will be implemented in the backend section
            const res = await api.get('/profile');
            setProfile(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch profile from backend');
        }
    };

    return (
        <ProtectedRoute>
            <div style={{ padding: '40px' }}>
                <h1>Dashboard</h1>
                <p>You are securely logged in.</p>

                <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <h3>User Info (from Backend)</h3>
                    <button onClick={fetchProfile} style={{ marginRight: '10px' }}>Fetch Profile</button>
                    {profile && (
                        <pre>{JSON.stringify(profile, null, 2)}</pre>
                    )}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </div>
        </ProtectedRoute>
    );
}
