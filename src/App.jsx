import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PublicEventPage from './pages/PublicEventPage';
import EventDetailPage from './pages/EventDetailPage';
import AttendancePage from './pages/AttendancePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Novos imports para as páginas de admin e eventos públicos
import PublicEventsListPage from './pages/PublicEventsListPage';
import PublicEventDetailPage from './pages/PublicEventDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="bg-gray-50 min-h-screen">
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/eventos" element={<PublicEventsListPage />} />
          <Route path="/evento/publico/:linkUnico" element={<PublicEventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rota antiga para links de pré-cadastro que usam o ID numérico */}
          <Route path="/evento/:linkUnico" element={<PublicEventPage />} />

          {/* Rotas Protegidas para Professores e Admins */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/evento/detalhes/:eventoId" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
          <Route path="/evento/chamada/:eventoId" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
          
          {/* Rota Protegida Apenas para Admins */}
          <Route path="/admin/usuarios" element={<AdminProtectedRoute><AdminUsersPage /></AdminProtectedRoute>} />
          
          {/* Rota Padrão: Redireciona para a lista de eventos ou para o dashboard */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/eventos" />
            } 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" />} // Redireciona qualquer rota não encontrada
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
