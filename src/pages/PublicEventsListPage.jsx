// src/pages/PublicEventsListPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getCampuses } from '../api/campusService';

const fetchPublicEvents = async (campusId) => {
  const params = {};
  if (campusId) {
    params.campus_id = campusId;
  }
  const { data } = await apiClient.get('/eventos/publicos', { params });
  return data;
};

// Componente para o botão de filtro, para evitar repetição de código
const FilterButton = ({ label, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
            isActive 
            ? 'bg-blue-600 text-white shadow' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
    >
        {label}
    </button>
);


const PublicEventsListPage = () => {
  const [selectedCampus, setSelectedCampus] = useState('');

  const { data: events, isLoading: isLoadingEvents, error: errorEvents } = useQuery({
    queryKey: ['publicEvents', selectedCampus],
    queryFn: () => fetchPublicEvents(selectedCampus),
  });
  
  const { data: campuses, isLoading: isLoadingCampuses } = useQuery({
      queryKey: ['campuses'],
      queryFn: getCampuses,
  });

  const formatDate = (dateString) => {
    return new Date(dateString + 'T00:00:00-04:00').toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isLoading = isLoadingEvents || isLoadingCampuses;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <header className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/IFROAutoriza_menor-removebg-preview.png" alt="Logo IFRO Autoriza" className="h-28 sm:h-32" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Eventos Abertos</h1>
            <p className="text-gray-600 mt-2">Veja os próximos eventos e participe!</p>
          </header>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* 1. CONTAINER DO FILTRO CENTRALIZADO */}
            <div className="mb-6 text-center"> {/* Adicionado text-center aqui */}
                <p className="block text-sm font-semibold text-gray-700 mb-3">
                    Filtrar por Campus:
                </p>
                <div className="flex flex-wrap justify-center gap-2"> {/* Adicionado justify-center aqui */}
                    <FilterButton 
                        label="Todos os Campi"
                        onClick={() => setSelectedCampus('')}
                        isActive={selectedCampus === ''}
                    />
                    {campuses?.map(campus => (
                        <FilterButton 
                            key={campus.id}
                            label={campus.nome}
                            onClick={() => setSelectedCampus(campus.id)}
                            isActive={selectedCampus === campus.id}
                        />
                    ))}
                </div>
            </div>


            {isLoading && <LoadingSpinner />}
            {errorEvents && <p className="text-red-500 text-center">Não foi possível carregar os eventos no momento.</p>}
            
            <div className="space-y-4">
              {events && events.length > 0 ? (
                events.map(event => (
                  <div key={event.link_unico} className="border border-gray-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-600">{event.titulo}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.data_inicio)}
                        {event.data_fim && event.data_fim !== event.data_inicio && ` a ${formatDate(event.data_fim)}`}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>
                            {event.campus?.nome || 'Campus não informado'}
                            {event.local_evento && ` - ${event.local_evento}`}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0">
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
                !isLoading && <p className="text-gray-500 text-center">Nenhum evento encontrado para o campus selecionado.</p>
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
      </main>

      <footer className="w-full py-4 mt-2">
        <div className="container mx-auto flex justify-center items-center">
          <img src="/LOGO_IFRO_ARI.png" alt="Logo IFRO Campus Ariquemes" className="h-14 sm:h-16" />
        </div>
      </footer>
    </div>
  );
};

export default PublicEventsListPage;