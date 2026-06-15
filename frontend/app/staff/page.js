'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import { Users, UserPlus, X, AlertTriangle, Loader, Shield, Mail, Calendar } from 'lucide-react';

export default function StaffPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('technician');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }

    let parsedUser = null;
    if (savedUser) {
      try { parsedUser = JSON.parse(savedUser); setUser(parsedUser); }
      catch { localStorage.removeItem('user'); localStorage.removeItem('token'); router.push('/login'); return; }
    }

    if (parsedUser?.role !== 'admin') {
      setError('Access denied. Staff management is restricted to administrators.');
      setLoading(false);
      return;
    }

    fetchStaff();
  }, [router]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/staff');
      setStaff(res.data.data || res.data || []);
    } catch (err) {
      console.error('Fetch staff error:', err);
      setError(err.response?.data?.error || 'Failed to load staff data.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('All fields are required.');
      return;
    }
    try {
      setFormLoading(true);
      await api.post('/auth/register', { name: name.trim(), email: email.trim(), password, role });
      setIsModalOpen(false);
      setName(''); setEmail(''); setPassword(''); setRole('technician');
      fetchStaff();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Registration failed.');
    } finally { setFormLoading(false); }
  };

  const roleColors = {
    admin: { bg: 'rgba(244,63,94,0.1)', color: '#e11d48' },
    technician: { bg: 'rgba(79,110,247,0.1)', color: '#4f6ef7' },
    doctor: { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="portal-shell">
      <Navbar />
      <div className="portal-glass-container">
        <div className="page-title-bar">
          <h1>Staff Management</h1>
        </div>

        <div style={{ padding: 'var(--content-padding)', flex: 1 }}>
          <main className="content-card animate-slide-up">
            <div className="content-card-header">
              <div className="card-title-group">
                <div className="card-title-icon"><Users className="h-5 w-5" /></div>
                <h2 className="card-title">Registered Staff Members</h2>
              </div>
              {user?.role === 'admin' && (
                <button className="card-action-btn" onClick={() => setIsModalOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  <span>Register Staff</span>
                </button>
              )}
            </div>

            {error && (
              <div className="form-error" style={{ marginBottom: '20px' }}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div>
                  <p style={{ fontWeight: 600 }}>Access Restricted</p>
                  <p style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>{error}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p style={{ fontSize: '13px', color: '#6c759d', fontWeight: 500 }}>Loading staff directory...</p>
                </div>
              </div>
            ) : !error && (
              <div className="portal-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6c759d' }}>No staff members found.</td></tr>
                    ) : staff.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f6ef7', fontSize: '12px' }}>#{s.id}</td>
                        <td style={{ fontWeight: 700, color: '#1e254c' }}>{s.name}</td>
                        <td style={{ fontSize: '12px', color: '#6c759d' }}>
                          <Mail style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                          {s.email}
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'capitalize',
                            background: (roleColors[s.role] || roleColors.technician).bg,
                            color: (roleColors[s.role] || roleColors.technician).color,
                          }}>{s.role}</span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#6c759d' }}>
                          <Calendar style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                          {formatDate(s.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Register Staff Modal */}
      {isModalOpen && (
        <div className="portal-modal-backdrop" role="dialog" aria-modal="true">
          <div className="portal-modal">
            <button onClick={() => setIsModalOpen(false)} className="modal-close">
              <X className="h-4 w-4" />
            </button>
            <div className="modal-header">
              <div className="modal-icon"><UserPlus /></div>
              <h3>Register New Staff Member</h3>
            </div>
            <form onSubmit={handleRegister}>
              {formError && (
                <div className="form-error">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Smith" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@pathlab.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="technician">Technician</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="form-submit" disabled={formLoading}>
                {formLoading ? 'Registering...' : 'Register Staff Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
