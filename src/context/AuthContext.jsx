import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import apiClient from '../api';
import { AuthContext } from './AuthContextContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ email: decoded.sub, tipo: decoded.tipo }); // Assumindo que o tipo está no token
        } else {
          localStorage.removeItem('authToken');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Falha ao inicializar autenticação:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await apiClient.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;
      localStorage.setItem('authToken', access_token);
      const decoded = jwtDecode(access_token);
      setUser({ email: decoded.sub, tipo: decoded.tipo });
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error(error.response?.data?.detail || 'Email ou senha inválidos.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    toast.success('Logout realizado com sucesso!');
  };

  const authContextValue = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
