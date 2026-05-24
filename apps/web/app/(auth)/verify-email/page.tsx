'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/api';

type Status = 'loading' | 'success' | 'error' | 'missing';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(res => {
        setStatus('success');
        setMessage(res.data?.message ?? 'Email verified!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message ?? 'Verification failed');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm shadow-sm text-center">
        {status === 'loading' && (
          <>
            <div className="text-5xl mb-4 animate-pulse">🔄</div>
            <h1 className="font-display font-bold text-2xl mb-2">Verifying...</h1>
            <p className="text-sm text-muted">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="font-display font-bold text-2xl mb-2 text-green-700">Email Verified!</h1>
            <p className="text-sm text-muted mb-6">
              Your email has been verified. You now have full access to Hiaisha — go find some makan!
            </p>
            <Link
              href="/"
              className="block w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark text-center"
            >
              Go to Hiaisha 🌶️
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="font-display font-bold text-2xl mb-2 text-red-700">Verification Failed</h1>
            <p className="text-sm text-muted mb-2">{message}</p>
            <p className="text-sm text-muted mb-6">
              Your link may have expired (links are valid for 24 hours). Try requesting a new one from your account settings.
            </p>
            <Link
              href="/"
              className="block w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark text-center mb-3"
            >
              Back to Hiaisha
            </Link>
            <Link href="/settings" className="text-sm text-primary hover:underline">
              Resend from Settings
            </Link>
          </>
        )}

        {status === 'missing' && (
          <>
            <div className="text-5xl mb-4">🔗</div>
            <h1 className="font-display font-bold text-2xl mb-2">Invalid Link</h1>
            <p className="text-sm text-muted mb-6">
              This verification link is incomplete. Please use the link from your verification email.
            </p>
            <Link
              href="/"
              className="block w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark text-center"
            >
              Back to Hiaisha
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
