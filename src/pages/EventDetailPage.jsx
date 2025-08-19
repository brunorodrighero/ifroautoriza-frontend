// src/pages/EventDetailPage.jsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

// ===== Funções de API (sem alteração) =====
const fetchEventDetails = async (eventoId) => {
  const { data } = await apiClient.get(`/eventos/${eventoId}`);
  return data;
};

const fetchAuthorizations = async (eventoId) => {
  const { data } = await apiClient.get(`/autorizacoes/eventos/${eventoId}/autorizacoes`);
  return data;
};

const updateAuthorizationStatus = async ({ autorizacaoId, status, motivo }) => {
  const { data } = await apiClient.patch(`/autorizacoes/${autorizacaoId}/status`, { status, motivo });
  return data;
};

const preregisterStudent = async ({ eventoId, studentData }) => {
    const { data } = await apiClient.post(`/autorizacoes/eventos/${eventoId}/pre-cadastrar`, studentData);
    return data;
}

// ===== Componente da Página (Layout Otimizado) =====
const EventDetailPage = () => {
  const { eventoId: eventoIdFromParams } = useParams();
  const eventoId = parseInt(eventoIdFromParams, 10);
  const queryClient = useQueryClient();
  
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, autorizacaoId: null, motivo: '' });
  const [preregisterModal, setPreregisterModal] = useState({ isOpen: false, nome_aluno: '', matricula_aluno: '' });

  const isIdValid = !isNaN(eventoId);

  const { data: event, isLoading: isLoadingEvent, error: errorEvent } = useQuery({
    queryKey: ['eventDetails', eventoId],
    queryFn: () => fetchEventDetails(eventoId),
    enabled: isIdValid,
    retry: false,
  });

  const { data: authorizations, isLoading: isLoadingAuths, error: errorAuths } = useQuery({
    queryKey: ['authorizations', eventoId],
    queryFn: () => fetchAuthorizations(eventoId),
    enabled: isIdValid,
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: updateAuthorizationStatus,
    onSuccess: (data) => {
      toast.success(`Autorização ${data.status === 'aprovado' ? 'aprovada' : 'rejeitada'}!`);
      queryClient.invalidateQueries({ queryKey: ['authorizations', eventoId] });
      setRejectionModal({ isOpen: false, autorizacaoId: null, motivo: '' });
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Erro ao atualizar status.'),
  });

  const preregisterMutation = useMutation({
      mutationFn: preregisterStudent,
      onSuccess: () => {
          toast.success("Aluno pré-cadastrado com sucesso!");
          queryClient.invalidateQueries({ queryKey: ['authorizations', eventoId] });
          setPreregisterModal({ isOpen: false, nome_aluno: '', matricula_aluno: '' });
      },
      onError: (error) => {
        const errorDetail = error.response?.data?.detail;
        let errorMsg = "Erro ao pré-cadastrar aluno.";
        if (typeof errorDetail === 'string') {
          errorMsg = errorDetail;
        } else if (Array.isArray(errorDetail) && errorDetail[0]?.msg) {
          errorMsg = errorDetail[0].msg;
        }
        toast.error(errorMsg);
      },
  });

  const handleDownload = async (autorizacao) => {
    try {
      const response = await apiClient.get(`/autorizacoes/${autorizacao.id}/arquivo`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', autorizacao.nome_arquivo_original || `autorizacao_${autorizacao.nome_aluno}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error("Não foi possível baixar o arquivo.");
      console.error(err);
    }
  };

  const handleApprove = (autorizacaoId) => {
    statusMutation.mutate({ autorizacaoId, status: 'aprovado' });
  };
  
  const handleOpenRejectionModal = (autorizacaoId) => {
    setRejectionModal({ isOpen: true, autorizacaoId, motivo: '' });
  };

  const handleReject = () => {
    if (!rejectionModal.motivo) {
        toast.error("O motivo da rejeição é obrigatório.");
        return;
    }
    statusMutation.mutate({ 
        autorizacaoId: rejectionModal.autorizacaoId, 
        status: 'rejeitado', 
        motivo: rejectionModal.motivo 
    });
  };

  const handlePreregisterSubmit = (e) => {
    e.preventDefault();
    const payload = {
      nome_aluno: preregisterModal.nome_aluno,
      matricula_aluno: preregisterModal.matricula_aluno || null
    };
    preregisterMutation.mutate({
        eventoId,
        studentData: payload
    });
  }

  const formatHeaderDate = (eventData) => {
    if (!eventData) return '';
    const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Manaus' };
    const startDate = new Date(eventData.data_inicio + 'T12:00:00Z').toLocaleDateString('pt-BR', options);

    if (eventData.data_fim && eventData.data_fim !== eventData.data_inicio) {
        const endDate = new Date(eventData.data_fim + 'T12:00:00Z').toLocaleDateString('pt-BR', options);
        return `📅 ${startDate} a ${endDate}`;
    }
    return `📅 ${startDate}`;
  }


  const statusStyles = {
    'pré-cadastrado': { text: 'Pré-cadastrado', bg: 'bg-gray-200', textColor: 'text-gray-800' },
    'submetido': { text: 'Submetido', bg: 'bg-yellow-100', textColor: 'text-yellow-800' },
    'aprovado': { text: 'Aprovado', bg: 'bg-green-100', textColor: 'text-green-800' },
    'rejeitado': { text: 'Rejeitado', bg: 'bg-red-100', textColor: 'text-red-800' },
  };

  if (isLoadingEvent || isLoadingAuths) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }
  
  if (errorEvent || errorAuths || !isIdValid) {
    return (
        <div className="container mx-auto p-8 text-center">
            <p className="text-red-500">Erro ao carregar dados do evento. Verifique se o link está correto.</p>
            <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
                &larr; Voltar para o Dashboard
            </Link>
        </div>
    );
  }

    return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline">&larr; Voltar para o Dashboard</Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{event?.titulo}</h1>
                <p className="text-gray-600 mt-2">{event?.descricao}</p>
                <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-500 mt-4">
                    <span>{formatHeaderDate(event)}</span>
                    <span>📍 {event?.local_evento}</span>
                    {event?.horario && <span>⏰ {event.horario}</span>}
                </div>
            </div>
            <Link to={`/evento/chamada/${eventoId}`} className="mt-4 sm:mt-0 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm w-full sm:w-auto text-center">
                Ir para Chamada
            </Link>
        </div>
      </div>
      
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-700">Autorizações dos Alunos</h2>
            <button onClick={() => setPreregisterModal({...preregisterModal, isOpen: true})} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 text-sm rounded w-full sm:w-auto">
                + Pré-cadastrar Aluno
            </button>
        </div>

        <div className="space-y-4">
            {authorizations?.length > 0 ? authorizations.map(auth => (
                <div key={auth.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div>
                            <p className="font-bold text-gray-900">{auth.nome_aluno}</p>
                            <p className="text-sm text-gray-500">{auth.matricula_aluno || 'Matrícula não informada'}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs leading-5 font-semibold rounded-full ${statusStyles[auth.status]?.bg} ${statusStyles[auth.status]?.textColor}`}>
                            {statusStyles[auth.status]?.text}
                        </span>
                    </div>

                    <div className="border-t my-4"></div>

                    <div className="flex flex-wrap items-center gap-2">
                        {auth.status === 'submetido' && (
                            <>
                                <button onClick={() => handleApprove(auth.id)} className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-4 rounded flex-1 sm:flex-none" disabled={statusMutation.isPending}>Aprovar</button>
                                <button onClick={() => handleOpenRejectionModal(auth.id)} className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded flex-1 sm:flex-none" disabled={statusMutation.isPending}>Rejeitar</button>
                            </>
                        )}
                        {auth.caminho_arquivo && (
                            <button onClick={() => handleDownload(auth)} className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded flex-1 sm:flex-none">
                                {auth.status === 'submetido' ? 'Baixar' : 'Ver Arquivo'}
                            </button>
                        )}
                    </div>
                </div>
            )) : (
                <p className="text-center text-gray-500 py-4">Nenhum aluno cadastrado para este evento ainda.</p>
            )}
        </div>
      </div>

      <Modal isOpen={rejectionModal.isOpen} onClose={() => setRejectionModal({ isOpen: false, autorizacaoId: null, motivo: '' })} title="Rejeitar Autorização">
        <form onSubmit={(e) => { e.preventDefault(); handleReject(); }}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">Por favor, informe o motivo da rejeição. Esta informação será enviada por e-mail para o responsável.</p>
                <textarea
                    value={rejectionModal.motivo}
                    onChange={(e) => setRejectionModal({ ...rejectionModal, motivo: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="Ex: Assinatura do responsável não confere."
                ></textarea>
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setRejectionModal({ isOpen: false, autorizacaoId: null, motivo: '' })} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                        Cancelar
                    </button>
                    <button type="submit" disabled={statusMutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300">
                        {statusMutation.isPending ? 'Confirmando...' : 'Confirmar Rejeição'}
                    </button>
                </div>
            </div>
        </form>
      </Modal>

      <Modal isOpen={preregisterModal.isOpen} onClose={() => setPreregisterModal({ isOpen: false, nome_aluno: '', matricula_aluno: '' })} title="Pré-cadastrar Aluno">
            <form onSubmit={handlePreregisterSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="nome_aluno" className="block text-sm font-medium text-gray-700">Nome Completo do Aluno</label>
                        <input
                            id="nome_aluno"
                            type="text"
                            value={preregisterModal.nome_aluno}
                            onChange={(e) => setPreregisterModal({ ...preregisterModal, nome_aluno: e.target.value })}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="matricula_aluno" className="block text-sm font-medium text-gray-700">Matrícula (Opcional)</label>
                        <input
                            id="matricula_aluno"
                            type="text"
                            value={preregisterModal.matricula_aluno}
                            onChange={(e) => setPreregisterModal({ ...preregisterModal, matricula_aluno: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-5">
                    <button type="button" onClick={() => setPreregisterModal({ isOpen: false, nome_aluno: '', matricula_aluno: '' })} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                        Cancelar
                    </button>
                    <button type="submit" disabled={preregisterMutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                        {preregisterMutation.isPending ? 'Salvando...' : 'Salvar Aluno'}
                    </button>
                </div>
            </form>
        </Modal>
    </div>
  );
};

export default EventDetailPage;