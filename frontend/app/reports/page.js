'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

import Navbar from '../../components/Navbar';
import { FileText, FileUp, X, AlertCircle, Loader, Eye, ExternalLink, Search, Clock } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeTests, setActiveTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [resultSummary, setResultSummary] = useState('');
  const [file, setFile] = useState(null);
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
    const fetchTestsList = async () => {
      try { const res = await api.get('/tests?status=pending&status=processing'); setActiveTests(res.data || []); }
      catch (err) { console.error('Fetch active tests error:', err); }
    };
    fetchTestsList();
  }, [router]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchReports(currentPage, searchQuery); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchQuery]);

  const fetchReports = async (page = 1, search = '') => {
    try {
      setLoading(true); setError('');
      const res = await api.get(`/reports?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.data && res.data.pagination) {
        setReports(res.data.data || []); setPagination(res.data.pagination);
      } else {
        setReports(res.data || []);
        setPagination({ page: 1, limit: 10, total: res.data ? res.data.length : 0, totalPages: 1 });
      }
    } catch (err) { console.error('Fetch reports error:', err); setError('Failed to fetch diagnostics reports.'); }
    finally { setLoading(false); }
  };

  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') { setFormError('Please select a valid PDF file.'); setFile(null); }
      else { setFile(selectedFile); setFormError(''); }
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    if (!selectedTestId || !resultSummary || !file) { setFormError('Please select a test, fill in the summary, and select a PDF.'); setSubmitting(false); return; }

    const formData = new FormData();
    formData.append('test_id', selectedTestId);
    formData.append('result_summary', resultSummary);
    formData.append('file', file);

    try {
      await api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSelectedTestId(''); setResultSummary(''); setFile(null); setIsModalOpen(false);
      fetchReports(currentPage, searchQuery);
      const res = await api.get('/tests?status=pending&status=processing');
      setActiveTests(res.data || []);
    } catch (err) { console.error('Upload report error:', err); setFormError(err.response?.data?.error || 'Failed to upload report.'); }
    finally { setSubmitting(false); }
  };

  const canUploadReports = user?.role === 'admin' || user?.role === 'technician';



  return (
    <div className="portal-shell">
      <Navbar />
      <div className="portal-glass-container">
      <div className="page-title-bar">
        <h1>Reports</h1>
      </div>

      <div style={{ padding: 'var(--content-padding)', flex: 1 }}>

        <main className="content-card animate-slide-up">
          <div className="content-card-header">
            <div className="card-title-group">
              <div className="card-title-icon"><FileText className="h-5 w-5" /></div>
              <h2 className="card-title">Pathology Reports</h2>
            </div>
            {canUploadReports && (
              <button className="card-action-btn" onClick={() => setIsModalOpen(true)}>
                <FileUp className="h-4 w-4" /><span>Upload Report</span>
              </button>
            )}
          </div>

          <p className="section-label">Search</p>
          <div className="portal-search" style={{ marginBottom: '20px' }}>
            <Search className="search-icon h-4 w-4" />
            <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search by patient, test type, or summary..." aria-label="Search reports" />
          </div>

          {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '250px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Loader className="h-7 w-7 text-indigo-500 animate-spin" />
                <p style={{ fontSize: '12px', color: '#6c759d', fontWeight: 500 }}>Loading clinical records archive...</p>
              </div>
            </div>
          ) : (
            <>
              <p className="section-label">Records</p>

              {reports.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6c759d', fontSize: '14px' }}>
                  No diagnostic reports found in registry.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {reports.map((report) => (
                    <div key={report.id} style={{
                      background: 'rgba(255, 255, 255, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: '18px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <span style={{
                            padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                            background: 'rgba(79, 110, 247, 0.1)', color: '#4f6ef7', border: '1px solid rgba(79, 110, 247, 0.15)',
                          }}>
                            {report.test_type}
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#6c759d' }}>
                            ID: #{report.id}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e254c', marginBottom: '4px' }}>
                          {report.patient_name}
                        </h4>
                        <p style={{ fontSize: '10px', color: '#6c759d', fontWeight: 600, marginBottom: '12px' }}>
                          Test ref: #{report.test_id}
                        </p>

                        <div style={{
                          padding: '10px',
                          background: 'rgba(255, 255, 255, 0.35)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          marginBottom: '16px',
                        }}>
                          <p style={{ fontSize: '12px', color: '#474f7a', lineHeight: 1.5, fontStyle: 'italic' }}>
                            &ldquo;{report.result_summary}&rdquo;
                          </p>
                        </div>
                      </div>

                      <a
                        href={report.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          padding: '10px', borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.6)',
                          fontSize: '12px', fontWeight: 700, color: '#474f7a',
                          textDecoration: 'none', transition: 'all 0.2s ease',
                        }}
                      >
                        <Eye style={{ width: '16px', height: '16px' }} />
                        <span>View PDF Report</span>
                        <ExternalLink style={{ width: '14px', height: '14px', color: '#6c759d' }} />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="portal-pagination" style={{ borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
                  <p className="pagination-info">Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)</p>
                  <div className="pagination-btns">
                    <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                    <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages}>Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      </div>

      {/* Upload Report Modal */}
      {isModalOpen && (
        <div className="portal-modal-backdrop" role="dialog" aria-modal="true">
          <div className="portal-modal">
            <button className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
            <div className="modal-header">
              <div className="modal-icon"><FileText className="h-5 w-5" /></div>
              <h3 className="modal-title">Upload Diagnostics Report</h3>
            </div>

            {formError && (<div className="form-error"><AlertCircle className="h-4 w-4 shrink-0" /><span>{formError}</span></div>)}

            <form onSubmit={handleUploadReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="report-test" className="form-label">Select Test Request</label>
                <select id="report-test" value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)} className="form-input" style={{ cursor: 'pointer' }} required>
                  <option value="">Choose test request...</option>
                  {activeTests.map((test) => (<option key={test.id} value={test.id}>{test.patient_name} — {test.test_type} (Ref: #{test.id})</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="report-summary" className="form-label">Result Summary</label>
                <textarea id="report-summary" value={resultSummary} onChange={(e) => setResultSummary(e.target.value)} placeholder="Provide a clinical brief on the test outcomes..." rows="3" className="form-input" style={{ resize: 'none' }} required />
              </div>
              <div>
                <label htmlFor="report-file" className="form-label">Upload PDF Document</label>
                <div style={{
                  marginTop: '4px', display: 'flex', justifyContent: 'center',
                  padding: '24px 20px', border: '2px dashed rgba(79, 110, 247, 0.2)',
                  borderRadius: '16px', transition: 'all 0.2s ease', position: 'relative',
                  background: 'rgba(255, 255, 255, 0.3)',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileUp style={{ width: '36px', height: '36px', color: 'rgba(79, 110, 247, 0.6)', margin: '0 auto 8px' }} />
                    <div style={{ display: 'flex', fontSize: '12px', color: '#6c759d', justifyContent: 'center' }}>
                      <label style={{ cursor: 'pointer', fontWeight: 700, color: '#4f6ef7' }}>
                        <span>Upload a file</span>
                        <input id="report-file" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} required />
                      </label>
                      <p style={{ paddingLeft: '4px' }}>or drag and drop</p>
                    </div>
                    <p style={{ fontSize: '10px', color: '#6c759d', marginTop: '4px' }}>PDF up to 10MB</p>
                    {file && (
                      <div style={{
                        marginTop: '8px', fontSize: '12px', fontWeight: 700, color: '#059669',
                        background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '8px', padding: '4px 10px',
                      }}>
                        Selected: {file.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="form-btn-primary" style={{ marginTop: '4px' }}>
                {submitting ? (<><Loader className="h-4 w-4 animate-spin" /><span>Uploading to S3...</span></>) : (<span>Submit & Upload</span>)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
