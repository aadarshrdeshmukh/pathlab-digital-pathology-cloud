'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

import Navbar from '../../components/Navbar';
import { ClipboardList, Plus, X, AlertCircle, Loader, Search, Clock, CheckCircle2 } from 'lucide-react';

export default function TestsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [testType, setTestType] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); }
      catch { localStorage.removeItem('user'); localStorage.removeItem('token'); router.push('/login'); return; }
    }
    const fetchPatientsList = async () => {
      try { const res = await api.get('/patients?limit=200'); setPatients(res.data?.data || res.data || []); }
      catch (err) { console.error('Fetch dropdown patients error:', err); }
    };
    fetchPatientsList();
  }, [router]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchTests(currentPage, searchQuery); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchQuery]);

  const fetchTests = async (page = 1, search = '') => {
    try {
      setLoading(true); setError('');
      const res = await api.get(`/tests?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.data && res.data.pagination) {
        setTests(res.data.data || []); setPagination(res.data.pagination);
      } else {
        setTests(res.data || []);
        setPagination({ page: 1, limit: 10, total: res.data ? res.data.length : 0, totalPages: 1 });
      }
    } catch (err) { console.error('Fetch tests error:', err); setError('Failed to fetch test requests.'); }
    finally { setLoading(false); }
  };

  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };

  const handleCreateTest = async (e) => {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    if (!selectedPatientId || !testType || !priority) { setFormError('All fields are required'); setSubmitting(false); return; }
    try {
      await api.post('/tests', { patient_id: parseInt(selectedPatientId), test_type: testType, priority });
      setSelectedPatientId(''); setTestType(''); setPriority('Medium'); setIsModalOpen(false);
      fetchTests(currentPage, searchQuery);
    } catch (err) { console.error('Create test error:', err); setFormError(err.response?.data?.error || 'Failed to create test request.'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (testId, newStatus) => {
    try {
      await api.patch(`/tests/${testId}`, { status: newStatus });
      setTests(prevTests => prevTests.map(test => test.id === testId ? { ...test, status: newStatus } : test));
    } catch (err) { console.error('Update status error:', err); alert('Failed to update test status.'); }
  };

  const getPriorityStyle = (p) => {
    const map = {
      Critical: { bg: 'rgba(244, 63, 94, 0.1)', color: '#e11d48', border: 'rgba(244, 63, 94, 0.15)' },
      High: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.15)' },
      Medium: { bg: 'rgba(79, 110, 247, 0.1)', color: '#4f6ef7', border: 'rgba(79, 110, 247, 0.15)' },
      Low: { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: 'rgba(100, 116, 139, 0.15)' },
    };
    return map[p] || map.Low;
  };

  const getStatusStyle = (s) => {
    const map = {
      completed: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: 'rgba(16, 185, 129, 0.15)' },
      processing: { bg: 'rgba(14, 165, 233, 0.1)', color: '#0284c7', border: 'rgba(14, 165, 233, 0.15)' },
      pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.15)' },
    };
    return map[s] || map.pending;
  };

  const canModifyTests = user?.role === 'admin' || user?.role === 'technician';



  return (
    <div className="portal-shell">
      <Navbar />
      <div className="portal-glass-container">
      <div className="page-title-bar">
        <h1>Test Requests</h1>
      </div>

      <div style={{ padding: 'var(--content-padding)', flex: 1 }}>

        <main className="content-card animate-slide-up">
          <div className="content-card-header">
            <div className="card-title-group">
              <div className="card-title-icon"><ClipboardList className="h-5 w-5" /></div>
              <h2 className="card-title">Pathology Test Requests</h2>
            </div>
            {canModifyTests && (
              <button className="card-action-btn" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" /><span>Create Request</span>
              </button>
            )}
          </div>

          <p className="section-label">Search</p>
          <div className="portal-search" style={{ marginBottom: '20px' }}>
            <Search className="search-icon h-4 w-4" />
            <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search by patient name or test description..." aria-label="Search tests" />
          </div>

          {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '250px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Loader className="h-7 w-7 text-indigo-500 animate-spin" />
                <p style={{ fontSize: '12px', color: '#6c759d', fontWeight: 500 }}>Loading clinical requests...</p>
              </div>
            </div>
          ) : (
            <>
              <p className="section-label">Records</p>
              <div className="portal-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Patient</th>
                      <th>Test Description</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      {canModifyTests && <th>Update Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tests.length === 0 ? (
                      <tr><td colSpan={canModifyTests ? 7 : 6} style={{ textAlign: 'center', padding: '40px 20px', color: '#6c759d', fontSize: '13px' }}>No test requests scheduled yet.</td></tr>
                    ) : (
                      tests.map((test) => {
                        const ps = getPriorityStyle(test.priority);
                        const ss = getStatusStyle(test.status);
                        return (
                          <tr key={test.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f6ef7', fontSize: '12px' }}>#{test.id}</td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#1e254c' }}>{test.patient_name}</div>
                              <div style={{ fontSize: '10px', color: '#6c759d', fontWeight: 600, marginTop: '2px' }}>{test.patient_age} yrs • {test.patient_gender}</div>
                            </td>
                            <td style={{ fontWeight: 500, color: '#1e254c' }}>{test.test_type}</td>
                            <td>
                              <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
                                {test.priority}
                              </span>
                            </td>
                            <td>
                              <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                                {test.status}
                              </span>
                            </td>
                            <td style={{ fontWeight: 500, color: test.assigned_to_name ? '#1e254c' : '#6c759d', fontStyle: test.assigned_to_name ? 'normal' : 'italic', fontSize: '12px' }}>
                              {test.assigned_to_name || 'Unassigned'}
                            </td>
                            {canModifyTests && (
                              <td>
                                {test.status === 'completed' ? (
                                  <span style={{ fontSize: '11px', color: '#6c759d', fontStyle: 'italic' }}>Completed</span>
                                ) : (
                                  <select
                                    value={test.status}
                                    onChange={(e) => handleStatusChange(test.id, e.target.value)}
                                    className="form-input"
                                    style={{ padding: '6px 10px', fontSize: '12px', cursor: 'pointer', maxWidth: '140px' }}
                                    aria-label={`Update status for request ${test.id}`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {pagination.totalPages > 1 && (
                  <div className="portal-pagination">
                    <p className="pagination-info">Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)</p>
                    <div className="pagination-btns">
                      <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                      <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      </div>

      {/* Create Test Modal */}
      {isModalOpen && (
        <div className="portal-modal-backdrop" role="dialog" aria-modal="true">
          <div className="portal-modal">
            <button className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
            <div className="modal-header">
              <div className="modal-icon"><ClipboardList className="h-5 w-5" /></div>
              <h3 className="modal-title">Schedule Pathology Test</h3>
            </div>

            {formError && (<div className="form-error"><AlertCircle className="h-4 w-4 shrink-0" /><span>{formError}</span></div>)}

            <form onSubmit={handleCreateTest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="test-patient" className="form-label">Select Patient</label>
                <select id="test-patient" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="form-input" style={{ cursor: 'pointer' }} required>
                  <option value="">Choose patient...</option>
                  {patients.map((p) => (<option key={p.id} value={p.id}>{p.name} (ID: #{p.id})</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="test-type" className="form-label">Test Description / Type</label>
                <input id="test-type" type="text" value={testType} onChange={(e) => setTestType(e.target.value)} placeholder="e.g. Complete Blood Count (CBC)" className="form-input" required />
              </div>
              <div>
                <label htmlFor="test-priority" className="form-label">Priority Level</label>
                <select id="test-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="form-input" style={{ cursor: 'pointer' }}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <button type="submit" disabled={submitting} className="form-btn-primary" style={{ marginTop: '4px' }}>
                {submitting ? (<><Loader className="h-4 w-4 animate-spin" /><span>Creating Queue...</span></>) : (<span>Schedule Request</span>)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
