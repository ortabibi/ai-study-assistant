import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../authToken';
import axios from 'axios';

export default function AskPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:3001/api/ai/ask',
        { documentId, question: q },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setHistory(prev => [...prev, { question: q, answer: res.data.answer }]);
    } catch (err) {
      setHistory(prev => [...prev, { question: q, answer: 'Error — could not get answer.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={styles.title}>Ask AI</h2>
        <div style={styles.history}>
          {history.length === 0 && <p style={styles.empty}>Ask anything about your document!</p>}
          {history.map((item, i) => (
            <div key={i}>
              <div style={styles.userMsg}>{item.question}</div>
              <div style={styles.aiMsg}>{item.answer}</div>
            </div>
          ))}
          {loading && <div style={styles.aiMsg}>Thinking...</div>}
        </div>
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Type your question..."
          />
          <button style={styles.btn} onClick={handleAsk}>Send</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f0f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '650px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  back: { background: 'none', border: 'none', color: '#5c5ce0', cursor: 'pointer', fontSize: '15px', marginBottom: '16px' },
  title: { fontSize: '24px', marginBottom: '24px' },
  history: { minHeight: '300px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: '80px' },
  userMsg: { background: '#5c5ce0', color: 'white', padding: '12px 16px', borderRadius: '12px 12px 4px 12px', marginBottom: '4px' },
  aiMsg: { background: '#f0f0f0', padding: '12px 16px', borderRadius: '12px 12px 12px 4px', marginBottom: '8px' },
  inputRow: { display: 'flex', gap: '12px' },
  input: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' },
  btn: { padding: '12px 24px', background: '#5c5ce0', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' },
};