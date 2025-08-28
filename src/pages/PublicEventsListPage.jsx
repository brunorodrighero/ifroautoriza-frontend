// src/pages/PublicEventsListPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom'; // CORREÇÃO AQUI
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { getCampuses } from '../api/campusService';

const fetchPublicEvents = async (campusId) => {
  const params = {};
  if (campusId) {
    params.campus_id = campusId;
  }
  const { data } = await apiClient.get('/eventos/publicos', { params });
  return data;
};

// Componente para o botão de filtro (Desktop)
const DesktopFilterButton = ({ label, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 ${
            isActive 
            ? 'bg-blue-600 text-white shadow' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        }`}
    >
        {label}
    </button>
);

// Componente para o botão de filtro (Modal Mobile)
const MobileFilterButton = ({ label, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-md transition-colors duration-200 ${
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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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

  const handleSelectCampus = (campusId) => {
      setSelectedCampus(campusId);
      setIsFilterModalOpen(false);
  }

  const isLoading = isLoadingEvents || isLoadingCampuses;
  const selectedCampusName = campuses?.find(c => c.id === selectedCampus)?.nome || 'Todos os Campi';

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
            <div className="mb-6">
                {/* Botão para abrir o Modal no Celular */}
                <div className="sm:hidden">
                    <button 
                        onClick={() => setIsFilterModalOpen(true)}
                        className="w-full flex justify-between items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <span>Filtrar por: <strong>{selectedCampusName}</strong></span>
                        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Botões visíveis e CENTRALIZADOS no Desktop */}
                <div className="hidden sm:block text-center">
                    <p className="block text-sm font-semibold text-gray-700 mb-3">Filtrar por Campus:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <DesktopFilterButton label="Todos os Campi" onClick={() => handleSelectCampus('')} isActive={selectedCampus === ''} />
                        {campuses?.map(campus => (
                            <DesktopFilterButton key={campus.id} label={campus.nome} onClick={() => handleSelectCampus(campus.id)} isActive={selectedCampus === campus.id} />
                        ))}
                    </div>
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

      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filtrar por Campus">
        <div className="space-y-2">
            <MobileFilterButton label="Todos os Campi" onClick={() => handleSelectCampus('')} isActive={selectedCampus === ''} />
            {campuses?.map(campus => (
                <MobileFilterButton key={campus.id} label={campus.nome} onClick={() => handleSelectCampus(campus.id)} isActive={selectedCampus === campus.id} />
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default PublicEventsListPage;