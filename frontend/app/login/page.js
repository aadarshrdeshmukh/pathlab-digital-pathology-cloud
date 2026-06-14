'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Activity, AlertCircle, Loader, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.push('/dashboard');
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error ||
        'Could not connect to the backend server. Make sure it is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
      }}>
        {/* Logo + Title */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Activity style={{ width: '22px', height: '22px', color: '#4f6ef7' }} />
            <span style={{
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              background: 'linear-gradient(135deg, #4f6ef7, #5eaeff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>PATHLAB</span>
          </div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 700,
            color: '#1e254c',
            lineHeight: 1.2,
            margin: 0,
          }}>
            Welcome back
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#7a82a6',
            marginTop: '4px',
            fontWeight: 400,
          }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.65)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 8px 40px rgba(30, 37, 76, 0.06)',
        }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.06)',
              border: '1px solid rgba(244, 63, 94, 0.12)',
              color: '#c0293a',
              fontSize: '13px',
              marginBottom: '18px',
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#474f7a',
                marginBottom: '6px',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="you@pathlab.com"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${focused === 'email' ? '#4f6ef7' : 'rgba(200, 208, 232, 0.6)'}`,
                  background: focused === 'email' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                  fontSize: '14px',
                  color: '#1e254c',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: focused === 'email' ? '0 0 0 3px rgba(79, 110, 247, 0.1)' : 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#474f7a',
                marginBottom: '6px',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${focused === 'password' ? '#4f6ef7' : 'rgba(200, 208, 232, 0.6)'}`,
                  background: focused === 'password' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                  fontSize: '14px',
                  color: '#1e254c',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: focused === 'password' ? '0 0 0 3px rgba(79, 110, 247, 0.1)' : 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: '#4f6ef7',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'inherit',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 2px 12px rgba(79, 110, 247, 0.2)',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#3b5bdb'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#4f6ef7'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials - subtle */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '20px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
          }}>
            <p style={{ fontSize: '11px', color: '#7a82a6', marginBottom: '8px', fontWeight: 500 }}>
              Demo credentials
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#474f7a' }}>
              <span><strong>admin@pathlab.com</strong> / admin123</span>
              <span><strong>tech@pathlab.com</strong> / tech123 &nbsp;·&nbsp; <strong>doc@pathlab.com</strong> / doc123</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
