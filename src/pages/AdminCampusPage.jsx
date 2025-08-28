// src/pages/AdminCampusPage.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { getCampuses, createCampus, updateCampus, deleteCampus } from '../api/campusService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

// Schema de validação com Yup
const CampusSchema = Yup.object().shape({
  nome: Yup.string().min(3, 'O nome é muito curto').max(255, 'O nome é muito longo').required('O nome do campus é obrigatório'),
});

const AdminCampusPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCampus, setCurrentCampus] = useState(null); // Para edição
  const [campusToDelete, setCampusToDelete] = useState(null); // Para deleção
  const queryClient = useQueryClient();

  const { data: campuses, isLoading, error } = useQuery({
    queryKey: ['campuses'],
    queryFn: getCampuses,
    retry: false,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campuses'] });
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Ocorreu um erro.');
    },
  };

  const createMutation = useMutation({
    mutationFn: createCampus,
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Campus criado com sucesso!');
      mutationOptions.onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCampus(id, data),
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Campus atualizado com sucesso!');
      mutationOptions.onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampus,
    onSuccess: () => {
      toast.success('Campus deletado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['campuses'] });
      setCampusToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Erro ao deletar campus.');
      setCampusToDelete(null);
    },
  });

  const formik = useFormik({
    initialValues: { nome: '' },
    validationSchema: CampusSchema,
    onSubmit: (values) => {
      if (currentCampus) {
        updateMutation.mutate({ id: currentCampus.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  useEffect(() => {
    if (currentCampus) {
      formik.setValues({ nome: currentCampus.nome });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus]);


  const openModalForCreate = () => {
    setCurrentCampus(null);
    formik.resetForm();
    setIsModalOpen(true);
  };

  const openModalForEdit = (campus) => {
    setCurrentCampus(campus);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCampus(null);
  };

  const handleConfirmDelete = () => {
    if (campusToDelete) {
      deleteMutation.mutate(campusToDelete.id);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (error) return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
        <p className="text-gray-700">Não foi possível carregar os dados dos campi.</p>
        <Link to="/dashboard" className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm">
          Voltar para o Dashboard
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Campi</h1>
          <p className="text-gray-600 mt-1">Crie, edite e visualize os campi do sistema.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
            <Link to="/dashboard" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                Voltar
            </Link>
            <button onClick={openModalForCreate} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            + Novo Campus
            </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Campus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campuses?.map((campus) => (
              <tr key={campus.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campus.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campus.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                  <button onClick={() => openModalForEdit(campus)} className="text-indigo-600 hover:text-indigo-900">
                    Editar
                  </button>
                  <button onClick={() => setCampusToDelete(campus)} className="text-red-600 hover:text-red-900">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentCampus ? 'Editar Campus' : 'Adicionar Novo Campus'}>
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Campus</label>
            <input
              id="nome"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              {...formik.getFieldProps('nome')}
            />
            {formik.touched.nome && formik.errors.nome && <div className="text-red-500 text-xs mt-1">{formik.errors.nome}</div>}
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={closeModal} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
      
      <Modal isOpen={!!campusToDelete} onClose={() => setCampusToDelete(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
            <p>Tem certeza que deseja deletar permanentemente o campus <strong>{campusToDelete?.nome}</strong>?</p>
            <p className="text-sm font-medium text-red-600">Atenção: Esta ação não pode ser desfeita e pode falhar se houver usuários ou eventos associados a este campus.</p>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setCampusToDelete(null)} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                    Cancelar
                </button>
                <button onClick={handleConfirmDelete} disabled={deleteMutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                    {deleteMutation.isPending ? 'Deletando...' : 'Deletar Campus'}
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCampusPage;