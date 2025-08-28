// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CreateEventModal from '../components/common/CreateEventModal';
import EditEventModal from '../components/common/EditEventModal';
import Modal from '../components/common/Modal';

// API Functions
const fetchEvents = async () => {
  const { data } = await apiClient.get('/eventos/');
  return data;
};

const deleteEvent = async (eventId) => {
  await apiClient.delete(`/eventos/${eventId}`);
};

const DashboardPage = () => {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      toast.success('Evento deletado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEventToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Erro ao deletar o evento.');
      setEventToDelete(null);
    },
  });

  const handleOpenEditModal = (event) => {
    setSelectedEvent(event);
    setEditModalOpen(true);
  };

  const handleCopyPublicLink = (linkUnico) => {
    const url = `${window.location.origin}/evento/publico/${linkUnico}`;
    navigator.clipboard.writeText(url);
    toast.success('Link público copiado!');
  };
  
  const handleConfirmDelete = () => {
    if (eventToDelete) {
      deleteMutation.mutate(eventToDelete.id);
    }
  };

  const formatDisplayDate = (event) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Manaus' };
    const startDate = new Date(event.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR', options);

    if (event.data_fim && event.data_fim !== event.data_inicio) {
        const endDate = new Date(event.data_fim + 'T00:00:00').toLocaleDateString('pt-BR', options);
        return `${startDate} a ${endDate}`;
    }
    
    return startDate;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Bem-vindo(a), {user?.email}!</p>
        </div>
        <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
          Sair
        </button>
      </header>
      
      <div className="mb-6 flex space-x-2">
        <button onClick={() => setCreateModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          + Criar Novo Evento
        </button>
        {user?.tipo === 'admin' && (
          <>
            <Link to="/admin/usuarios" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded flex items-center">
              Gerenciar Usuários
            </Link>
            {/* ADICIONADO O LINK PARA GERENCIAR CAMPI */}
            <Link to="/admin/campus" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded flex items-center">
              Gerenciar Campi
            </Link>
          </>
        )}
      </div>

      <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
      {selectedEvent && <EditEventModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} event={selectedEvent} />}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Seus Eventos</h2>
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-red-500">Erro ao carregar eventos.</p>}
        <div className="space-y-4">
          {events?.map(event => (
            <div key={event.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h3 className="text-lg font-semibold text-blue-600">{event.titulo}</h3>
                <p className="text-sm text-gray-500">{formatDisplayDate(event)} - {event.local_evento || 'Local a definir'}</p>
                <p className="text-sm text-gray-600 mt-1">{event.autorizacoes_count} autorizações</p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-2 flex-wrap gap-2">
                <button onClick={() => handleCopyPublicLink(event.link_unico)} className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold py-2 px-4 rounded">
                  Copiar Link
                </button>
                <button onClick={() => handleOpenEditModal(event)} className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded">
                  Editar
                </button>
                <Link to={`/evento/detalhes/${event.id}`} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded">
                  Gerenciar
                </Link>
                {user?.tipo === 'admin' && (
                  <button onClick={() => setEventToDelete(event)} className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded" disabled={deleteMutation.isPending}>
                    Deletar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={!!eventToDelete} onClose={() => setEventToDelete(null)} title="Confirmar Exclusão de Evento">
        <div className="space-y-4">
          <p>Tem certeza que deseja deletar permanentemente o evento <strong>{eventToDelete?.titulo}</strong>?</p>
          <p className="text-sm font-medium text-red-600">Atenção: Todas as autorizações e arquivos associados a este evento serão perdidos. Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={() => setEventToDelete(null)} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
              Cancelar
            </button>
            <button onClick={handleConfirmDelete} disabled={deleteMutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
              {deleteMutation.isPending ? 'Deletando...' : 'Deletar Evento'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;