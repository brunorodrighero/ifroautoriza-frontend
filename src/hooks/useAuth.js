import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Importe o contexto

// Hook customizado para consumir o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};