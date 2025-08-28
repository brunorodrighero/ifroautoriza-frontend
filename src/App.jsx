// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PublicEventPage from './pages/PublicEventPage';
import EventDetailPage from './pages/EventDetailPage';
import AttendancePage from './pages/AttendancePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Imports para o novo fluxo
import PublicEventsListPage from './pages/PublicEventsListPage';
import PublicEventDetailPage from './pages/PublicEventDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import RegisterProfessorPage from './pages/RegisterProfessorPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyCodePage from './pages/VerifyCodePage';
import SetPasswordPage from './pages/SetPasswordPage';
import AdminCampusPage from './pages/AdminCampusPage'; // 1. IMPORTAR A NOVA PÁGINA

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
          <Route path="/evento/:linkUnico" element={<PublicEventPage />} />
          
          {/* Novas Rotas de Cadastro e Recuperação */}
          <Route path="/cadastro-professor" element={<RegisterProfessorPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/verificar-codigo" element={<VerifyCodePage />} />
          <Route path="/definir-senha" element={<SetPasswordPage />} />

          {/* Rotas Protegidas */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/evento/detalhes/:eventoId" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
          <Route path="/evento/chamada/:eventoId" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
          
          {/* Rota de Admin */}
          <Route path="/admin/usuarios" element={<AdminProtectedRoute><AdminUsersPage /></AdminProtectedRoute>} />
          {/* 2. ADICIONAR A NOVA ROTA DE ADMIN */}
          <Route path="/admin/campus" element={<AdminProtectedRoute><AdminCampusPage /></AdminProtectedRoute>} />

          
          {/* Rota Padrão */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/eventos" />
            } 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;