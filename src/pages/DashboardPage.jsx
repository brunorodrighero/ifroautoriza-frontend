import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CreateEventModal from '../components/common/CreateEventModal';
import EditEventModal from '../components/common/EditEventModal';

const fetchEvents = async () => {
  const { data } = await apiClient.get('/eventos/');
  return data;
};

const DashboardPage = () => {
  const { logout, user } = useAuth(); // 'user' contém o tipo (admin/professor)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
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
        {/* Botão condicional que só aparece para administradores */}
        {user?.tipo === 'admin' && (
          <Link to="/admin/usuarios" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded flex items-center">
            Gerenciar Usuários
          </Link>
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
                <p className="text-sm text-gray-500">{new Date(event.data_evento).toLocaleDateString('pt-BR')} - {event.local_evento || 'Local a definir'}</p>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
