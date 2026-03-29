import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../authToken';
import axios from 'axios';

export default function StudyPlanPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await axios.post(
          'http://localhost:3001/api/ai/study-plan',
          { documentId },
          { headers: { Authorization: `Bearer ${getAuthToken()}` } }
        );
        setPlan(res.data.studyPlan);
      } catch (_) {
        setError('Failed to generate study plan. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, [documentId]);

  if (loading) return <div style={styles.center}>Generating your study plan... ⏳</div>;
  if (error) return <div style={styles.center}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={styles.title}>{plan.title}</h2>
        <p style={styles.overview}>{plan.overview}</p>
        <div style={styles.days}>
          {plan.days.map((day) => (
            <div key={day.day} style={styles.dayCard}>
              <h3 style={styles.dayTitle}>Day {day.day} — {day.focus}</h3>
              <p style={styles.hours}>⏱ {day.estimatedHours}h estimated</p>
              <ul style={styles.tasks}>
                {day.tasks.map((task, i) => (
                  <li key={i} style={styles.task}>✓ {task}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f0f2ff', padding: '40px 20px' },
  card: { background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '750px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '18px' },
  back: { background: 'none', border: 'none', color: '#5c5ce0', cursor: 'pointer', fontSize: '15px', marginBottom: '16px' },
  title: { fontSize: '26px', marginBottom: '12px' },
  overview: { color: '#666', marginBottom: '32px', lineHeight: '1.6' },
  days: { display: 'flex', flexDirection: 'column', gap: '16px' },
  dayCard: { background: '#f8f8ff', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #5c5ce0' },
  dayTitle: { fontSize: '17px', marginBottom: '6px', color: '#333' },
  hours: { color: '#888', fontSize: '14px', marginBottom: '12px' },
  tasks: { paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' },
  task: { color: '#444', fontSize: '14px' },
};