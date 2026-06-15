'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import {
  Users, FlaskConical, FileCheck, ArrowRight, Loader, AlertTriangle,
  LayoutDashboard, BarChart3, Activity, Inbox
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingTests: 0,
    completedReports: 0,
  });
  const [recentTests, setRecentTests] = useState([]);
  const [chartData, setChartData] = useState({ days: [], values: [], counts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [statsRes, testsRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/tests?limit=5')
        ]);

        setStats(statsRes.data);
        const tests = testsRes.data.data || testsRes.data || [];
        setRecentTests(tests);

        // Build chart data from real test data — group by day of week
        const dayMap = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        tests.forEach(t => {
          const day = dayNames[new Date(t.created_at).getDay()];
          dayMap[day] = (dayMap[day] || 0) + 1;
        });
        const workDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const counts = workDays.map(d => dayMap[d] || 0);
        const maxCount = Math.max(...counts, 1);
        const values = counts.map(c => Math.round((c / maxCount) * 80) + 10);
        setChartData({ days: workDays, values, counts });
      } catch (err) {
        console.error('Fetch dashboard error:', err);
        setError('Failed to fetch dashboard data. Make sure the API server is online.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);



  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Medium':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'processing':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  // Chart data derived from real test records
  const chartDays = chartData.days;
  const chartValues = chartData.values;
  const chartCounts = chartData.counts;

  return (
    <div className="portal-shell">
      <Navbar />

      {/* Glass Container */}
      <div className="portal-glass-container">

      {/* Page Title Bar */}
      <div className="page-title-bar">
        <h1>Dashboard</h1>
      </div>

      {/* Page Layout */}
      <div style={{ padding: 'var(--content-padding)', flex: 1 }}>

        <main className="content-card animate-slide-up">
          {/* Content Header */}
          <div className="content-card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h2 className="card-title">Clinical Insights</h2>
            </div>
          </div>

          {/* Section Label */}
          <p className="section-label">Overview</p>
          <p style={{ fontSize: '13px', color: '#6c759d', marginBottom: '20px', fontWeight: 500 }}>
            Real-time status of pathology processing queues and patients database.
          </p>

          {error && (
            <div className="form-error" style={{ marginBottom: '20px' }}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                <p style={{ fontWeight: 600 }}>Connection Alert</p>
                <p style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Loader className="h-8 w-8 text-indigo-500 animate-spin" />
                <p style={{ fontSize: '13px', color: '#6c759d', fontWeight: 500 }}>Loading clinical intelligence...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stat Cards Grid */}
              <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <StatCard
                  title="Total Registered Patients"
                  value={stats.totalPatients}
                  icon={Users}
                  color="indigo"
                  description="Database aggregate of enrolled patients"
                  style={{ opacity: 0, animation: 'slideUp 0.45s cubic-bezier(0.4,0,0.2,1) forwards' }}
                />
                <StatCard
                  title="Active Test Requests"
                  value={stats.pendingTests}
                  icon={FlaskConical}
                  color="amber"
                  description="Tests processing or awaiting technicians"
                  style={{ opacity: 0, animation: 'slideUp 0.45s cubic-bezier(0.4,0,0.2,1) 60ms forwards' }}
                />
                <StatCard
                  title="Completed PDF Reports"
                  value={stats.completedReports}
                  icon={FileCheck}
                  color="emerald"
                  description="Uploaded pathology records hosted on S3"
                  style={{ opacity: 0, animation: 'slideUp 0.45s cubic-bezier(0.4,0,0.2,1) 120ms forwards' }}
                />
                <StatCard
                  title="Active Staff Members"
                  value={stats.activeStaff || 0}
                  icon={Activity}
                  color="rose"
                  description="Registered operational staff on system"
                  style={{ opacity: 0, animation: 'slideUp 0.45s cubic-bezier(0.4,0,0.2,1) 180ms forwards' }}
                />
              </div>

              {/* Chart & Recent Activity */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px',
                opacity: 0, animation: 'slideUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.25s forwards',
              }}>
                {/* Workload Chart */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(79,110,247,0.03) 100%)',
                  border: '1px solid rgba(79, 110, 247, 0.1)',
                  borderLeft: '3px solid rgba(79, 110, 247, 0.4)',
                  borderRadius: '20px',
                  padding: '24px',
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(79,110,247,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e254c', marginBottom: '4px' }}>Workload Statistics</h3>
                    <p style={{ fontSize: '12px', color: '#6c759d' }}>Test request queue volume over the last 5 operational days</p>
                  </div>

                  <div style={{
                    position: 'relative',
                    marginTop: '20px',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(79, 110, 247, 0.08)',
                    height: '180px',
                  }}>
                    {/* Horizontal gridlines */}
                    {[0.25, 0.5, 0.75].map((fraction, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        left: '24px',
                        right: '24px',
                        bottom: `${8 + (180 - 8) * fraction}px`,
                        borderTop: '1px dashed rgba(79, 110, 247, 0.07)',
                        pointerEvents: 'none',
                      }} />
                    ))}

                    {chartValues.map((heightPercent, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', position: 'relative' }} className="group">
                        {/* Count label above bar */}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#4f6ef7',
                          marginBottom: '4px',
                          opacity: chartCounts[index] > 0 ? 0.8 : 0,
                        }}>
                          {chartCounts[index]}
                        </span>
                        <div
                          style={{
                            height: `${heightPercent}%`,
                            width: '48px',
                            borderRadius: '12px 12px 4px 4px',
                            background: 'linear-gradient(180deg, #7bb8ff 0%, #4f6ef7 100%)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(79, 110, 247, 0.18)',
                            animation: `barGrow 0.6s cubic-bezier(0.4,0,0.2,1) ${0.3 + index * 0.08}s both`,
                          }}
                          title={`${chartCounts[index]} tests`}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scaleY(1.04)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 110, 247, 0.28)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scaleY(1)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 110, 247, 0.18)';
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px 0', fontSize: '12px', fontWeight: 600, color: '#6c759d' }}>
                    {chartDays.map((day, idx) => (
                      <span key={idx} style={{ width: '20%', textAlign: 'center' }}>{day}</span>
                    ))}
                  </div>
                </div>

                {/* Recent Queue */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(16,185,129,0.03) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  borderLeft: '3px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(16,185,129,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e254c' }}>Recent Queue</h3>
                      <Link
                        href="/tests"
                        style={{ fontSize: '12px', fontWeight: 700, color: '#4f6ef7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>Manage</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {recentTests.length === 0 ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '36px 16px',
                          gap: '10px',
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: 'rgba(79, 110, 247, 0.06)',
                            border: '1px solid rgba(79, 110, 247, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Inbox style={{ width: '22px', height: '22px', color: '#a5b4fc' }} />
                          </div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#6c759d', textAlign: 'center' }}>
                            Queue is clear
                          </p>
                          <p style={{ fontSize: '11px', color: '#9ca3c4', textAlign: 'center', lineHeight: 1.5 }}>
                            No pending test requests at the moment.{' '}
                            <Link href="/tests" style={{ color: '#4f6ef7', fontWeight: 600, textDecoration: 'none' }}>Submit one →</Link>
                          </p>
                        </div>
                      ) : (
                        recentTests.map((test) => (
                          <div
                            key={test.id}
                            style={{
                              padding: '12px',
                              borderRadius: '14px',
                              background: 'rgba(255, 255, 255, 0.35)',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'transform 0.2s ease',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                              <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e254c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {test.patient_name}
                              </p>
                              <p style={{ fontSize: '10px', color: '#6c759d', fontWeight: 600, marginTop: '2px' }}>
                                {test.test_type}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${getPriorityColor(test.priority)}`}>
                                {test.priority}
                              </span>
                              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusColor(test.status)}`}>
                                {test.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(79, 110, 247, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#6c759d',
                  }}>
                    <span>Last updated: just now</span>
                    <button
                      onClick={() => window.location.reload()}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#4f6ef7', fontSize: '10px', fontFamily: 'inherit' }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      </div>
    </div>
  );
}
