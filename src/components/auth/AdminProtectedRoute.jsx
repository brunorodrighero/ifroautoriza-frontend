import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated || user?.tipo !== 'admin') {
    // Redireciona para o dashboard se não for admin, ou para login se não estiver logado
    return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;