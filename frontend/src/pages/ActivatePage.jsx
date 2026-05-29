import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ActivatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Verifying activation link...');

    useEffect(() => {
        const uid = searchParams.get('uid');
        const token = searchParams.get('token');

        if (!uid || !token) {
            setMessage('Activation failed: Missing required URL parameters.');
            return;
        }

        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
        const url = `${apiBase}/accounts/api/activate/?uid=${uid}&token=${encodeURIComponent(token)}`;

        fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (ok) {
                    setMessage(data.message || 'Congrats! Your account has been successfully activated. Redirecting to login...');
                    setTimeout(() => navigate('/'), 3500);
                } else {
                    setMessage(data.detail || 'Activation failed. This link may be expired or invalid.');
                }
            })
            .catch(err => {
                console.error('Network error during activation:', err);
                setMessage('Could not reach the server. Please check your internet connection or backend deployment.');
            });
    }, [searchParams, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md">
                <h2 className="mb-4 text-xl font-bold text-gray-800">Account Activation</h2>
                <p className="text-base leading-relaxed text-gray-600">{message}</p>
            </div>
        </div>
    );
}