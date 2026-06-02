'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid username or password');
      setLoading(false);
      return;
    }

    // Fetch session to determine role
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();

    if (session?.user?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '25%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src="/logo.png"
            alt="AreoQuiz Logo"
            style={{ width: 52, height: 52, margin: '0 auto 16px', display: 'block' }}
          />
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Quiz<span style={{ color: 'var(--accent)' }}>Dash</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4, padding: '13px 20px', fontSize: 15 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 24 }}>
          AreoQuiz · Internal Use Only
        </p>
      </div>
    </div>
  );
}