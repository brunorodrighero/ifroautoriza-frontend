import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

// API Functions
const fetchUsers = async () => {
  const { data } = await apiClient.get('/usuarios/');
  return data;
};

const createUser = async (userData) => {
  const { data } = await apiClient.post('/usuarios/', userData);
  return data;
};

const AdminUsersPage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Erro ao criar usuário.');
    },
  });

  const formik = useFormik({
    initialValues: { nome: '', email: '', password: '', tipo: 'professor' },
    validationSchema: Yup.object({
      nome: Yup.string().required('Nome é obrigatório.'),
      email: Yup.string().email('Email inválido').required('Email é obrigatório.'),
      password: Yup.string().min(8, 'Mínimo de 8 caracteres').required('Senha é obrigatória.'),
      tipo: Yup.string().oneOf(['professor', 'admin']).required('Tipo é obrigatório.'),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (error) return <div className="container mx-auto p-8 text-center"><p className="text-red-500">Você não tem permissão para ver esta página.</p></div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Usuários</h1>
        <button onClick={() => setModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          + Novo Usuário
        </button>
      </header>

      {/* Tabela de Usuários */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
            {/* ... (cabeçalho da tabela) ... */}
        </table>
      </div>
      
      {/* Modal de Criação */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Criar Novo Usuário">
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Campos do formulário: Nome, Email, Senha, Tipo */}
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Criando...' : 'Criar Usuário'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;