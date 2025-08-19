// src/pages/AdminUsersPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { useAuth } from '../hooks/useAuth';

// Funções da API
const fetchUsers = async () => {
  const { data } = await apiClient.get('/usuarios/');
  return data;
};

const createUser = async (userData) => {
  const { data } = await apiClient.post('/usuarios/', userData);
  return data;
};

const updateUser = async ({ userId, userData }) => {
    const { data } = await apiClient.put(`/usuarios/${userId}`, userData);
    return data;
};

const deleteUser = async (userId) => {
  await apiClient.delete(`/usuarios/${userId}`);
};

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Erro ao criar usuário.'),
  });
  
  const editMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
        toast.success('Usuário atualizado com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setEditModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Erro ao atualizar usuário.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('Usuário deletado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Erro ao deletar usuário.'),
  });

  const createFormik = useFormik({
    initialValues: { nome: '', email: '', password: '', tipo: 'professor', ativo: true },
    validationSchema: Yup.object({
      nome: Yup.string().required('Nome é obrigatório.'),
      email: Yup.string().email('Email inválido').required('Email é obrigatório.'),
      password: Yup.string().min(8, 'A senha deve ter no mínimo 8 caracteres').required('Senha é obrigatória.'),
      tipo: Yup.string().oneOf(['professor', 'admin']).required(),
      ativo: Yup.boolean(),
    }),
    onSubmit: (values) => createMutation.mutate(values),
  });

  const editFormik = useFormik({
    initialValues: { nome: '', email: '', password: '', tipo: 'professor', ativo: true },
    validationSchema: Yup.object({
        nome: Yup.string().required('Nome é obrigatório.'),
        email: Yup.string().email('Email inválido').required('Email é obrigatório.'),
        password: Yup.string().min(8, 'A senha deve ter no mínimo 8 caracteres').optional().nullable(),
        tipo: Yup.string().oneOf(['professor', 'admin']).required(),
        ativo: Yup.boolean(),
    }),
    onSubmit: (values) => {
        const payload = {...values};
        if (!payload.password) {
            delete payload.password; // Não envia a senha se o campo estiver vazio
        }
        editMutation.mutate({ userId: selectedUser.id, userData: payload });
    }
  });

  useEffect(() => {
    if (selectedUser) {
        editFormik.setValues({
            nome: selectedUser.nome,
            email: selectedUser.email,
            password: '', // Senha sempre vazia ao editar
            tipo: selectedUser.tipo,
            ativo: selectedUser.ativo,
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);


  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  }

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };
  
  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (error) return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
        <p className="text-gray-700">Você não tem permissão para acessar esta página.</p>
        <Link to="/dashboard" className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm">
          Voltar para o Dashboard
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-1">Crie, edite e visualize os usuários do sistema.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
            <Link to="/dashboard" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                Voltar
            </Link>
            <button onClick={() => { createFormik.resetForm(); setCreateModalOpen(true); }} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            + Novo Usuário
            </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.tipo}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                  <button onClick={() => handleOpenEditModal(user)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                  {currentUser?.email !== user.email && (
                    <button onClick={() => setUserToDelete(user)} className="text-red-600 hover:text-red-900" disabled={deleteMutation.isPending}>
                      Deletar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Criar Novo Usuário">
        <form onSubmit={createFormik.handleSubmit} className="space-y-4">
          <input id="nome" placeholder="Nome Completo" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...createFormik.getFieldProps('nome')} />
          {createFormik.touched.nome && createFormik.errors.nome && <div className="text-red-500 text-xs mt-1">{createFormik.errors.nome}</div>}
          
          <input id="email" type="email" placeholder="Email" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...createFormik.getFieldProps('email')} />
          {createFormik.touched.email && createFormik.errors.email && <div className="text-red-500 text-xs mt-1">{createFormik.errors.email}</div>}
          
          <input id="password" type="password" placeholder="Senha" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...createFormik.getFieldProps('password')} />
          {createFormik.touched.password && createFormik.errors.password && <div className="text-red-500 text-xs mt-1">{createFormik.errors.password}</div>}
          
          <select id="tipo" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...createFormik.getFieldProps('tipo')}>
              <option value="professor">Professor</option>
              <option value="admin">Administrador</option>
          </select>
          <div className="flex items-center">
            <input type="checkbox" id="ativo" className="h-4 w-4 rounded" {...createFormik.getFieldProps('ativo')} />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">Usuário Ativo</label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Usuário">
        <form onSubmit={editFormik.handleSubmit} className="space-y-4">
            <input id="edit-nome" placeholder="Nome Completo" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...editFormik.getFieldProps('nome')} />
            {editFormik.touched.nome && editFormik.errors.nome && <div className="text-red-500 text-xs mt-1">{editFormik.errors.nome}</div>}
            
            <input id="edit-email" type="email" placeholder="Email" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...editFormik.getFieldProps('email')} />
            {editFormik.touched.email && editFormik.errors.email && <div className="text-red-500 text-xs mt-1">{editFormik.errors.email}</div>}
            
            <input id="edit-password" type="password" placeholder="Nova Senha (deixe em branco para não alterar)" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...editFormik.getFieldProps('password')} />
            {editFormik.touched.password && editFormik.errors.password && <div className="text-red-500 text-xs mt-1">{editFormik.errors.password}</div>}
            
            <select id="edit-tipo" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...editFormik.getFieldProps('tipo')}>
                <option value="professor">Professor</option>
                <option value="admin">Administrador</option>
            </select>
            <div className="flex items-center">
                <input type="checkbox" id="edit-ativo" className="h-4 w-4 rounded" {...editFormik.getFieldProps('ativo')} />
                <label htmlFor="edit-ativo" className="ml-2 block text-sm text-gray-900">Usuário Ativo</label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setEditModalOpen(false)} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={editMutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                {editMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p>Tem certeza que deseja deletar permanentemente o usuário <strong>{userToDelete?.nome}</strong> ({userToDelete?.email})?</p>
          <p className="text-sm font-medium text-red-600">Atenção: Todos os eventos criados por este usuário também serão deletados. Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={() => setUserToDelete(null)} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">Cancelar</button>
            <button onClick={handleConfirmDelete} disabled={deleteMutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
              {deleteMutation.isPending ? 'Deletando...' : 'Deletar Usuário'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;