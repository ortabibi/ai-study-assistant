import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthToken } from '../authToken';

export default function QuizPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = getAuthToken();
        const res = await axios.post(
          'https://ai-study-assistant-server.onrender.com/api/ai/quiz',
          { documentId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuestions(res.data.quiz);
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [documentId]);

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === questions[current].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  if (loading) return <div style={styles.center}>Generating quiz...</div>;
  if (error) return <div style={styles.center}>{error}</div>;
  if (finished) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Quiz Complete! 🎉</h2>
        <p style={styles.score}>Score: {score} / {questions.length}</p>
        <button style={styles.btn} onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  );

  const q = questions[current];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.progress}>Question {current + 1} of {questions.length}</p>
        <h3 style={styles.question}>{q.question}</h3>
        <div style={styles.options}>
          {q.options.map((opt, i) => {
            let bg = '#f0f0f0';
            if (selected) {
              if (opt === q.correctAnswer) bg = '#c8f7c5';
              else if (opt === selected) bg = '#f7c5c5';
            }
            return (
              <button
                key={i}
                style={{ ...styles.option, background: bg }}
                onClick={() => handleAnswer(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {selected && (
          <div style={styles.explanation}>
            <strong>{selected === q.correctAnswer ? '✅ Correct!' : '❌ Wrong!'}</strong>
            <p>{q.explanation}</p>
            <button style={styles.btn} onClick={handleNext}>
              {current + 1 >= questions.length ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f0f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '600px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '18px' },
  progress: { color: '#888', marginBottom: '8px' },
  question: { fontSize: '20px', marginBottom: '24px' },
  options: { display: 'flex', flexDirection: 'column', gap: '12px' },
  option: { padding: '14px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', textAlign: 'left', fontSize: '15px' },
  explanation: { marginTop: '20px', padding: '16px', background: '#f8f8f8', borderRadius: '8px' },
  btn: { marginTop: '16px', padding: '12px 24px', background: '#5c5ce0', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' },
  score: { fontSize: '24px', fontWeight: 'bold', color: '#5c5ce0', margin: '20px 0' },
};