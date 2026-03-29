import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import AskPage from './pages/AskPage';
import { getAuthToken } from './authToken';
import StudyPlanPage from './pages/StudyPlanPage';

function ProtectedRoute({ children }) {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/quiz/:documentId"
        element={(
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/ask/:documentId"
        element={(
          <ProtectedRoute>
            <AskPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/study-plan/:documentId"
        element={(
          <ProtectedRoute>
            <StudyPlanPage />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}

export default App;