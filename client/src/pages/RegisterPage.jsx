import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthToken, setAuthUser } from '../authToken';
import './RegisterPage.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('https://ai-study-assistant-server.onrender.com/api/auth/register', {
        name,
        email,
        password,
      });

      const token = response.data?.token;
      if (!token) {
        setError('Registration succeeded but token was not returned.');
        return;
      }

      setAuthToken(token);
      setAuthUser(response.data?.user || null);
      navigate('/dashboard');
    } catch (_err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <h1 className="register-title">Create account</h1>
        <p className="register-subtitle">Sign up to start building your study plan.</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="register-button" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {error ? <p className="register-error">{error}</p> : null}

        <p className="register-footer">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;

