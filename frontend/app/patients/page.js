'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

import Navbar from '../../components/Navbar';
import { Search, UserPlus, X, AlertCircle, Loader, UserCheck, Users, Clock } from 'lucide-react';

export default function PatientsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, total: 0, totalPages: 1
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [contact, setContact] = useState('');
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
  }, [router]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients(currentPage, searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchQuery]);

  const fetchPatients = async (page = 1, search = '') => {
    try {
      setLoading(true); setError('');
      const response = await api.get(`/patients?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (response.data && response.data.pagination) {
        setPatients(response.data.data || []);
        setPagination(response.data.pagination);
      } else {
        setPatients(response.data || []);
        setPagination({ page: 1, limit: 10, total: response.data ? response.data.length : 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Fetch patients error:', err);
      setError('Failed to fetch patient registry.');
    } finally { setLoading(false); }
  };

  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    if (!name || !age || !gender || !contact) { setFormError('All fields are required'); setSubmitting(false); return; }
    try {
      await api.post('/patients', { name, age: parseInt(age), gender, contact });
      setName(''); setAge(''); setGender('Male'); setContact(''); setIsModalOpen(false);
      fetchPatients(currentPage, searchQuery);
    } catch (err) {
      console.error('Create patient error:', err);
      setFormError(err.response?.data?.error || 'Failed to add patient.');
    } finally { setSubmitting(false); }
  };

  const canAddPatient = user?.role === 'admin' || user?.role === 'technician';



  return (
    <div className="portal-shell">
      <Navbar />

      <div className="portal-glass-container">
      <div className="page-title-bar">
        <h1>Patients</h1>
      </div>

      <div style={{ padding: 'var(--content-padding)', flex: 1 }}>

        <main className="content-card animate-slide-up">
          <div className="content-card-header">
            <div className="card-title-group">
              <div className="card-title-icon"><Users className="h-5 w-5" /></div>
              <h2 className="card-title">Patient Registry</h2>
            </div>
            {canAddPatient && (
              <button className="card-action-btn" onClick={() => setIsModalOpen(true)}>
                <UserPlus className="h-4 w-4" />
                <span>Register Patient</span>
              </button>
            )}
          </div>

          <p className="section-label">Search</p>

          {/* Search Bar */}
          <div className="portal-search" style={{ marginBottom: '20px' }}>
            <Search className="search-icon h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or contact number..."
              aria-label="Search patients"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '250px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Loader className="h-7 w-7 text-indigo-500 animate-spin" />
                <p style={{ fontSize: '12px', color: '#6c759d', fontWeight: 500 }}>Loading patients directory...</p>
              </div>
            </div>
          ) : error ? (
            <div className="form-error">{error}</div>
          ) : (
            <>
              <p className="section-label">Records</p>
              <div className="portal-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Contact</th>
                      <th>Registration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: '#6c759d', fontSize: '13px' }}>
                          No patients found matching current parameters.
                        </td>
                      </tr>
                    ) : (
                      patients.map((patient) => (
                        <tr key={patient.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f6ef7', fontSize: '12px' }}>
                            #{patient.id}
                          </td>
                          <td style={{ fontWeight: 700, color: '#1e254c' }}>{patient.name}</td>
                          <td>{patient.age}</td>
                          <td>
                            <span style={{
                              padding: '2px 10px',
                              borderRadius: '20px',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: patient.gender === 'Male' ? 'rgba(79, 110, 247, 0.1)' :
                                patient.gender === 'Female' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                              color: patient.gender === 'Male' ? '#4f6ef7' :
                                patient.gender === 'Female' ? '#ec4899' : '#64748b',
                              border: `1px solid ${patient.gender === 'Male' ? 'rgba(79, 110, 247, 0.15)' :
                                patient.gender === 'Female' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(100, 116, 139, 0.15)'}`,
                            }}>
                              {patient.gender}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{patient.contact}</td>
                          <td style={{ fontSize: '12px', color: '#6c759d' }}>
                            {new Date(patient.created_at).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {pagination.totalPages > 1 && (
                  <div className="portal-pagination">
                    <p className="pagination-info">
                      Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
                    </p>
                    <div className="pagination-btns">
                      <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                        Previous
                      </button>
                      <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))} disabled={currentPage === pagination.totalPages}>
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="portal-modal-backdrop" role="dialog" aria-modal="true">
          <div className="portal-modal">
            <button className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>

            <div className="modal-header">
              <div className="modal-icon"><UserCheck className="h-5 w-5" /></div>
              <h3 className="modal-title">Register New Patient</h3>
            </div>

            {formError && (
              <div className="form-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="patient-name" className="form-label">Full Name</label>
                <input id="patient-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className="form-input" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="patient-age" className="form-label">Age</label>
                  <input id="patient-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 35" min="0" max="150" className="form-input" required />
                </div>
                <div>
                  <label htmlFor="patient-gender" className="form-label">Gender</label>
                  <select id="patient-gender" value={gender} onChange={(e) => setGender(e.target.value)} className="form-input" style={{ cursor: 'pointer' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="patient-contact" className="form-label">Contact Info</label>
                <input id="patient-contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. +1 555-0199" className="form-input" required />
              </div>

              <button type="submit" disabled={submitting} className="form-btn-primary" style={{ marginTop: '4px' }}>
                {submitting ? (<><Loader className="h-4 w-4 animate-spin" /><span>Saving...</span></>) : (<span>Save Record</span>)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
