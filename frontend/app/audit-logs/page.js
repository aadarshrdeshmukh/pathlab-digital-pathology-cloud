'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import { Shield, AlertTriangle, Loader, ScrollText, Clock, User, Database } from 'lucide-react';

export default function AuditLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

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
      setError('Access denied. Audit logs are restricted to administrators.');
      setLoading(false);
      return;
    }

    fetchLogs(1);
  }, [router]);

  const fetchLogs = async (pageNum) => {
    try {
      setLoading(true);
      const res = await api.get(`/audit-logs?page=${pageNum}&limit=20`);
      setLogs(res.data.data || []);
      setPagination(res.data.pagination || { page: pageNum, totalPages: 1, total: 0 });
      setPage(pageNum);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setError(err.response?.data?.error || 'Failed to load audit logs.');
    } finally { setLoading(false); }
  };

  const actionColors = {
    CREATE: { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
    UPDATE: { bg: 'rgba(79,110,247,0.1)', color: '#4f6ef7' },
    DELETE: { bg: 'rgba(244,63,94,0.1)', color: '#e11d48' },
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="portal-shell">
      <Navbar />
      <div className="portal-glass-container">
        <div className="page-title-bar">
          <h1>Audit Logs</h1>
        </div>

        <div style={{ padding: 'var(--content-padding)', flex: 1 }}>
          <main className="content-card animate-slide-up">
            <div className="content-card-header">
              <div className="card-title-group">
                <div className="card-title-icon"><ScrollText className="h-5 w-5" /></div>
                <h2 className="card-title">System Activity Trail</h2>
              </div>
              {pagination.total > 0 && (
                <span style={{ fontSize: '12px', color: '#6c759d', fontWeight: 600 }}>
                  {pagination.total} total entries
                </span>
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
                  <p style={{ fontSize: '13px', color: '#6c759d', fontWeight: 500 }}>Loading audit trail...</p>
                </div>
              </div>
            ) : !error && (
              <>
                <div className="portal-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Staff</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Entity ID</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6c759d' }}>No audit logs recorded yet.</td></tr>
                      ) : logs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '12px', color: '#6c759d', whiteSpace: 'nowrap' }}>
                            <Clock style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            {formatDate(log.timestamp)}
                          </td>
                          <td style={{ fontWeight: 600, color: '#1e254c' }}>{log.staff_name || `Staff #${log.staff_id}`}</td>
                          <td>
                            <span style={{
                              padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                              background: (actionColors[log.action] || actionColors.UPDATE).bg,
                              color: (actionColors[log.action] || actionColors.UPDATE).color,
                            }}>{log.action}</span>
                          </td>
                          <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>{log.entity?.replace('_', ' ')}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f6ef7', fontSize: '12px' }}>#{log.entity_id}</td>
                          <td style={{ fontSize: '11px', color: '#6c759d', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    <button
                      className="portal-logout-btn"
                      style={{ opacity: page <= 1 ? 0.4 : 1, fontSize: '12px', padding: '6px 14px' }}
                      onClick={() => fetchLogs(page - 1)}
                      disabled={page <= 1}
                    >Previous</button>
                    <span style={{ fontSize: '12px', color: '#6c759d', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      className="portal-logout-btn"
                      style={{ opacity: page >= pagination.totalPages ? 0.4 : 1, fontSize: '12px', padding: '6px 14px' }}
                      onClick={() => fetchLogs(page + 1)}
                      disabled={page >= pagination.totalPages}
                    >Next</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
