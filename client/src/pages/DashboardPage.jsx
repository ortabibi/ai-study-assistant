import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getAuthUser, clearAuth } from '../authToken';
import './DashboardPage.css';

function DashboardPage() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const userName = useMemo(() => user?.name || 'there', [user]);
  const [file, setFile] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await axios.get('http://localhost:3001/api/documents', {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        setUploadedDocs(res.data.documents || []);
      } catch (_) {}
      finally {
        setFetchLoading(false);
      }
    }
    fetchDocs();
  }, []);

  async function handleUpload() {
    if (!file) { setError('Please select a PDF or TXT file.'); return; }
    const token = getAuthToken();
    if (!token) { setError('Missing auth token. Please login again.'); return; }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(
        'http://localhost:3001/api/documents/upload',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const doc = response.data?.document;
      if (doc) setUploadedDocs((prev) => [doc, ...prev]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (_err) {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`http://localhost:3001/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setUploadedDocs(prev => prev.filter(d => d.id !== id));
    } catch (_) {
      setError('Delete failed. Please try again.');
    }
  }

  return (
    <div className="dash-root">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">📚 StudyAI</div>
        <button className="dash-logout" onClick={() => { clearAuth(); navigate('/'); }}>Logout</button>
      </header>

      {/* Hero greeting */}
      <section className="dash-hero">
        <div className="dash-avatar">🤖</div>
        <div className="dash-greeting">
          <h1>Hey {userName}, I'm your study assistant.</h1>
          <p>Upload a document and I'll help you study smarter — quizzes, study plans, and instant answers.</p>
        </div>
      </section>

      {/* Upload */}
      <section className="dash-upload-section">
        <div className="dash-upload-box">
          <span className="dash-upload-icon">📄</span>
          <div className="dash-upload-text">
            <strong>Upload a document</strong>
            <span>PDF or TXT, up to 10MB</span>
          </div>
          <input
            ref={fileInputRef}
            className="dash-file-input"
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button className="dash-upload-btn" onClick={handleUpload} disabled={loading}>
            {loading ? 'Uploading...' : file ? `Upload "${file.name}"` : 'Choose File'}
          </button>
        </div>
        {error && <p className="dash-error">{error}</p>}
      </section>

      {/* Documents */}
      <section className="dash-docs-section">
        <h2 className="dash-docs-heading">Your Documents</h2>
        {fetchLoading ? (
          <p className="dash-empty">Loading your documents...</p>
        ) : uploadedDocs.length === 0 ? (
          <p className="dash-empty">No documents yet — upload one above to get started!</p>
        ) : (
          <div className="dash-docs-grid">
            {uploadedDocs.map((doc) => (
              <div className="dash-doc-card" key={doc.id}>
                <div className="dash-doc-icon">📝</div>
                <div className="dash-doc-info">
                  <span className="dash-doc-name">{doc.filename}</span>
                  <span className="dash-doc-date">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <div className="dash-doc-actions">
                  <button className="dash-action-btn study" onClick={() => navigate(`/study-plan/${doc.id}`)}>📅 Study Plan</button>
                  <button className="dash-action-btn quiz" onClick={() => navigate(`/quiz/${doc.id}`)}>🧠 Quiz</button>
                  <button className="dash-action-btn ask" onClick={() => navigate(`/ask/${doc.id}`)}>💬 Ask AI</button>
                  <button className="dash-action-btn delete" onClick={() => handleDelete(doc.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
