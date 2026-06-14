'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  Shield, BarChart3, Users, FlaskConical, FileCheck, Activity,
  AlertTriangle, Loader, Settings, TrendingUp, PieChart
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

  const sidebarItems = [
    { id: 'overview', name: 'Summary', icon: PieChart },
    { id: 'priority', name: 'Priority', icon: TrendingUp },
    { id: 'staff', name: 'Staff', icon: Users },
  ];

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
          <button className="title-gear left" aria-label="Settings"><Settings className="h-4 w-4" /></button>
          <h1>Executive Report</h1>
          <button className="title-gear right" aria-label="Settings"><Settings className="h-4 w-4" /></button>
        </div>

        <div className="page-layout">
          <Sidebar items={sidebarItems} activeId="overview" />

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
                <p className="section-label">Organizational KPIs</p>
                <p style={{ fontSize: '13px', color: '#6c759d', marginBottom: '20px', fontWeight: 500 }}>
                  Aggregated operational metrics across all PathLab services.
                </p>

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Total Patients', value: report.overview.totalPatients, icon: Users, color: '#4f6ef7' },
                    { label: 'Total Tests', value: report.overview.totalTests, icon: FlaskConical, color: '#d97706' },
                    { label: 'Completed Reports', value: report.overview.totalReports, icon: FileCheck, color: '#059669' },
                    { label: 'Active Staff', value: report.overview.totalStaff, icon: Activity, color: '#e11d48' },
                  ].map((kpi, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)',
                      borderRadius: '18px', padding: '20px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <kpi.icon style={{ width: '18px', height: '18px', color: kpi.color }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#6c759d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</span>
                      </div>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: '#1e254c' }}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Completion Rate */}
                <div style={{
                  background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: '18px', padding: '24px', marginBottom: '24px',
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e254c', marginBottom: '12px' }}>Test Completion Rate</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      border: `4px solid ${getCompletionColor(report.overview.completionRate)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: getCompletionColor(report.overview.completionRate) }}>
                        {report.overview.completionRate}%
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#6c759d', textTransform: 'uppercase' }}>Pending</p>
                          <p style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>{report.overview.pendingTests}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#6c759d', textTransform: 'uppercase' }}>Processing</p>
                          <p style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>{report.overview.processingTests}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: '#6c759d', textTransform: 'uppercase' }}>Completed</p>
                          <p style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{report.overview.completedTests}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Breakdown + Staff Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '18px', padding: '24px',
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e254c', marginBottom: '16px' }}>Tests by Priority</h3>
                    {report.priorityBreakdown.map((item, i) => {
                      const colors = { Critical: '#e11d48', High: '#d97706', Medium: '#4f6ef7', Low: '#64748b' };
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: colors[item.priority] || '#64748b' }}>{item.priority}</span>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e254c' }}>{item.count}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '18px', padding: '24px',
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e254c', marginBottom: '16px' }}>Staff by Role</h3>
                    {report.staffBreakdown.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#474f7a', textTransform: 'capitalize' }}>{item.role}</span>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e254c' }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Table */}
                <p className="section-label">Recent Activity</p>
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
                              background: item.priority === 'Critical' ? 'rgba(244,63,94,0.1)' : item.priority === 'High' ? 'rgba(245,158,11,0.1)' : 'rgba(79,110,247,0.1)',
                              color: item.priority === 'Critical' ? '#e11d48' : item.priority === 'High' ? '#d97706' : '#4f6ef7',
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
              </>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
