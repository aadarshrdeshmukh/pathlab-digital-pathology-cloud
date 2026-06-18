'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';

import {
  Shield, BarChart3, Users, FlaskConical, FileCheck, Activity,
  AlertTriangle, Loader, TrendingUp, PieChart
} from 'lucide-react';

export default function ExecutiveReportPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError('Access denied. This page is restricted to administrators only.');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/executive');
        setReport(res.data);
      } catch (err) {
        console.error('Executive report fetch error:', err);
        setError(err.response?.data?.error || 'Failed to load executive report.');
      } finally { setLoading(false); }
    };
    fetchReport();
  }, [router]);



  const getCompletionColor = (rate) => {
    const r = parseFloat(rate);
    if (r >= 75) return '#059669';
    if (r >= 50) return '#d97706';
    return '#e11d48';
  };

  return (
    <div className="portal-shell">
      <Navbar />
      <div className="portal-glass-container">
        <div className="page-title-bar">
          <h1>Executive Report</h1>
        </div>

        <div style={{ padding: 'var(--content-padding)', flex: 1 }}>

          <main className="content-card animate-slide-up">
            <div className="content-card-header">
              <div className="card-title-group">
                <div className="card-title-icon"><Shield className="h-5 w-5" /></div>
                <h2 className="card-title">Executive Summary — Admin Only</h2>
              </div>
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
                  <p style={{ fontSize: '13px', color: '#6c759d', fontWeight: 500 }}>Generating executive intelligence...</p>
                </div>
              </div>
            ) : report ? (
              <>
                {/* Section: KPI Cards */}
                <div style={{
                  background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(79,110,247,0.12)',
                  borderRadius: '18px', padding: '24px', marginBottom: '20px',
                  boxShadow: '0 2px 12px rgba(79,110,247,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <BarChart3 style={{ width: '18px', height: '18px', color: '#4f6ef7' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e254c', margin: 0 }}>Organizational KPIs</h3>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6c759d', marginBottom: '20px', fontWeight: 500, paddingLeft: '28px' }}>
                    Aggregated operational metrics across all PathLab services.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                    {[
                      { label: 'Total Patients', value: report.overview.totalPatients, icon: Users, color: '#4f6ef7', bg: 'rgba(79,110,247,0.06)' },
                      { label: 'Total Tests', value: report.overview.totalTests, icon: FlaskConical, color: '#d97706', bg: 'rgba(245,158,11,0.06)' },
                      { label: 'Completed Reports', value: report.overview.totalReports, icon: FileCheck, color: '#059669', bg: 'rgba(16,185,129,0.06)' },
                      { label: 'Active Staff', value: report.overview.totalStaff, icon: Activity, color: '#e11d48', bg: 'rgba(244,63,94,0.06)' },
                    ].map((kpi, i) => (
                      <div key={i} style={{
                        background: kpi.bg, border: `1px solid ${kpi.color}22`,
                        borderRadius: '14px', padding: '18px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <kpi.icon style={{ width: '16px', height: '16px', color: kpi.color }} />
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#6c759d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</span>
                        </div>
                        <p style={{ fontSize: '32px', fontWeight: 800, color: '#1e254c', margin: 0 }}>{kpi.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Test Completion Rate */}
                <div style={{
                  background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(79,110,247,0.12)',
                  borderRadius: '18px', padding: '24px', marginBottom: '20px',
                  boxShadow: '0 2px 12px rgba(79,110,247,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <TrendingUp style={{ width: '18px', height: '18px', color: getCompletionColor(report.overview.completionRate) }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e254c', margin: 0 }}>Test Completion Rate</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{
                      width: '90px', height: '90px', borderRadius: '50%',
                      border: `5px solid ${getCompletionColor(report.overview.completionRate)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${getCompletionColor(report.overview.completionRate)}08`,
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: getCompletionColor(report.overview.completionRate) }}>
                        {report.overview.completionRate}%
                      </span>
                    </div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      {[
                        { label: 'Pending', value: report.overview.pendingTests, color: '#d97706', bg: 'rgba(245,158,11,0.06)' },
                        { label: 'Processing', value: report.overview.processingTests, color: '#0284c7', bg: 'rgba(14,165,233,0.06)' },
                        { label: 'Completed', value: report.overview.completedTests, color: '#059669', bg: 'rgba(16,185,129,0.06)' },
                      ].map((s, i) => (
                        <div key={i} style={{
                          background: s.bg, border: `1px solid ${s.color}22`,
                          borderRadius: '12px', padding: '14px', textAlign: 'center',
                        }}>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#6c759d', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</p>
                          <p style={{ fontSize: '24px', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section: Priority + Staff Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* Tests by Priority */}
                  <div style={{
                    background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(79,110,247,0.12)',
                    borderRadius: '18px', padding: '24px',
                    boxShadow: '0 2px 12px rgba(79,110,247,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                      <PieChart style={{ width: '18px', height: '18px', color: '#4f6ef7' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e254c', margin: 0 }}>Tests by Priority</h3>
                    </div>
                    {report.priorityBreakdown.map((item, i) => {
                      const colors = { Critical: '#e11d48', High: '#d97706', Medium: '#4f6ef7', Low: '#64748b' };
                      const bgs = { Critical: 'rgba(244,63,94,0.05)', High: 'rgba(245,158,11,0.05)', Medium: 'rgba(79,110,247,0.05)', Low: 'rgba(100,116,139,0.05)' };
                      return (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', marginBottom: '6px',
                          background: bgs[item.priority] || bgs.Low,
                          borderRadius: '10px', border: `1px solid ${colors[item.priority] || colors.Low}15`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[item.priority] || colors.Low }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: colors[item.priority] || '#64748b' }}>{item.priority}</span>
                          </div>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e254c' }}>{item.count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Staff by Role */}
                  <div style={{
                    background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(79,110,247,0.12)',
                    borderRadius: '18px', padding: '24px',
                    boxShadow: '0 2px 12px rgba(79,110,247,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                      <Users style={{ width: '18px', height: '18px', color: '#059669' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e254c', margin: 0 }}>Staff by Role</h3>
                    </div>
                    {report.staffBreakdown.map((item, i) => {
                      const roleColors = { admin: '#e11d48', technician: '#4f6ef7', doctor: '#059669' };
                      const roleBgs = { admin: 'rgba(244,63,94,0.05)', technician: 'rgba(79,110,247,0.05)', doctor: 'rgba(16,185,129,0.05)' };
                      return (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', marginBottom: '6px',
                          background: roleBgs[item.role] || 'rgba(100,116,139,0.05)',
                          borderRadius: '10px', border: `1px solid ${roleColors[item.role] || '#64748b'}15`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: roleColors[item.role] || '#64748b' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#474f7a', textTransform: 'capitalize' }}>{item.role}</span>
                          </div>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e254c' }}>{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Recent Activity */}
                <div style={{
                  background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(79,110,247,0.12)',
                  borderRadius: '18px', padding: '24px',
                  boxShadow: '0 2px 12px rgba(79,110,247,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <Activity style={{ width: '18px', height: '18px', color: '#d97706' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e254c', margin: 0 }}>Recent Activity</h3>
                  </div>
                  <div className="portal-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Patient</th>
                          <th>Test</th>
                          <th>Priority</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.recentActivity.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f6ef7', fontSize: '12px' }}>#{item.id}</td>
                            <td style={{ fontWeight: 700, color: '#1e254c' }}>{item.patient_name}</td>
                            <td>{item.test_type}</td>
                            <td>
                              <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                                background: item.priority === 'Critical' ? 'rgba(244,63,94,0.1)' : item.priority === 'High' ? 'rgba(245,158,11,0.1)' : item.priority === 'Medium' ? 'rgba(79,110,247,0.1)' : 'rgba(100,116,139,0.1)',
                                color: item.priority === 'Critical' ? '#e11d48' : item.priority === 'High' ? '#d97706' : item.priority === 'Medium' ? '#4f6ef7' : '#64748b',
                              }}>{item.priority}</span>
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                                background: item.status === 'completed' ? 'rgba(16,185,129,0.1)' : item.status === 'processing' ? 'rgba(14,165,233,0.1)' : 'rgba(245,158,11,0.1)',
                                color: item.status === 'completed' ? '#059669' : item.status === 'processing' ? '#0284c7' : '#d97706',
                              }}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
