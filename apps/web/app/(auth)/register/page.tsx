'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setPending(true);
    setError('');
    try {
      const res = await register({ username, email, password });
      if (res.data) {
        setToken(res.data.token);
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally { setPending(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
        <h1 className="font-display font-bold text-2xl mb-1">Join Hiaisha!</h1>
        <p className="text-sm text-muted mb-6">Create your account and start makan hunting</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
              maxLength={20} pattern="[a-zA-Z0-9_]+"
              placeholder="e.g. makanking99"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            <p className="text-xs text-muted mt-0.5">Alphanumeric and underscore only, max 20 chars</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
            <p className="text-xs text-muted mt-0.5">Minimum 8 characters</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={pending}
            className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
            {pending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-sm text-center text-muted mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
