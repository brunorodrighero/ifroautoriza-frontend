import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const fetchPublicEvents = async () => {
  const { data } = await apiClient.get('/eventos/publicos');
  return data;
};

const PublicEventsListPage = () => {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['publicEvents'],
    queryFn: fetchPublicEvents,
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Eventos Abertos</h1>
        <p className="text-gray-600 mt-2">Veja os próximos eventos e participe!</p>
      </header>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-red-500 text-center">Não foi possível carregar os eventos no momento.</p>}
        
        <div className="space-y-4">
          {events && events.length > 0 ? (
            events.map(event => (
              <div key={event.link_unico} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-600">{event.titulo}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(event.data_evento).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">📍 {event.local_evento || 'Local a definir'}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  {/* CORREÇÃO AQUI: Garantindo que o link aponte para a rota correta */}
                  <Link 
                    to={`/evento/publico/${event.link_unico}`} 
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded"
                  >
                    Ver Detalhes e Inscrever-se
                  </Link>
                </div>
              </div>
            ))
          ) : (
            !isLoading && <p className="text-gray-500 text-center">Nenhum evento disponível no momento.</p>
          )}
        </div>
      </div>
       <p className="mt-6 text-center text-sm text-gray-600">
          Você é um professor?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Acesse o painel
          </Link>
        </p>
    </div>
  );
};

export default PublicEventsListPage;