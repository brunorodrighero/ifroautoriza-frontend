import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PublicEventPage from './pages/PublicEventPage';
import EventDetailPage from './pages/EventDetailPage';
import AttendancePage from './pages/AttendancePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="bg-gray-50 min-h-screen">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/evento/:linkUnico" element={<PublicEventPage />} />

          {/* Rotas Protegidas */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/evento/detalhes/:eventoId" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
          <Route path="/evento/chamada/:eventoId" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
          
          {/* Rota Padrão */}
          <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;