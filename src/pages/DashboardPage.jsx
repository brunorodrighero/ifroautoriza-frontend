import React, { useState } from 'react'; // Importe o useState
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CreateEventModal from '../components/common/CreateEventModal'; // Importe o novo modal

const fetchEvents = async () => {
  const { data } = await apiClient.get('/eventos/');
  return data;
};

const DashboardPage = () => {
  const { logout, user } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false); // Estado para controlar a visibilidade do modal

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

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
      
      <div className="mb-6">
        {/* Adicione o evento onClick para abrir o modal */}
        <button onClick={() => setModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          + Criar Novo Evento
        </button>
      </div>

      {/* Renderize o componente do modal */}
      <CreateEventModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Seus Eventos</h2>
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-red-500">Erro ao carregar eventos.</p>}
        
        <div className="space-y-4">
          {events && events.length > 0 ? (
            events.map(event => (
              <div key={event.id} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-600">{event.titulo}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(event.data_evento).toLocaleDateString('pt-BR')} - {event.local_evento}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{event.autorizacoes_count} autorizações</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Link to={`/evento/detalhes/${event.id}`} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded">
                    Gerenciar
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Nenhum evento criado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;