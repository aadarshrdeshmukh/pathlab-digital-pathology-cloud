'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token && pathname !== '/login') {
      router.push('/login');
    } else if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Hide navbar on login and landing pages
  if (pathname === '/login' || pathname === '/') return null;

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Patients', href: '/patients' },
    { name: 'Test Requests', href: '/tests' },
    { name: 'Reports', href: '/reports' },
    ...(user?.role === 'admin' ? [
      { name: 'Staff', href: '/staff' },
      { name: 'Audit Logs', href: '/audit-logs' },
      { name: 'Executive', href: '/executive' },
    ] : []),
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="portal-navbar" role="banner">
      {/* Logo pill — matches landing .glass-logo-pill */}
      <Link href="/dashboard" className="portal-logo-pill" aria-label="PathLab Home">
        <img
          src="/images/pathlab-logo.png"
          alt="PathLab Logo"
          width={24}
          height={24}
          draggable="false"
          style={{ objectFit: 'contain' }}
        />
        <span className="portal-logo-text">PathLab</span>
      </Link>

      {/* Nav links pill — matches landing .nav-links-pill */}
      <nav className="portal-links-pill" aria-label="Primary Navigation">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`portal-nav-link ${isActive ? 'portal-nav-link-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {link.name}
              {isActive && <span className="portal-nav-dot" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      {/* Branch selector — Scalability Indicator */}
      <div className="portal-auth-pill" style={{ gap: '10px' }}>
        <select
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'inherit',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          defaultValue="mumbai"
          aria-label="Select branch"
        >
          <option value="mumbai">🏥 Mumbai HQ</option>
          <option value="delhi" disabled>🏥 Delhi (Coming Soon)</option>
          <option value="bangalore" disabled>🏥 Bangalore (Coming Soon)</option>
        </select>
        {user && (
          <span className="portal-user-name">{user.name}</span>
        )}
        <button onClick={handleLogout} className="portal-logout-btn">
          Log out
        </button>
      </div>
    </header>
  );
}
