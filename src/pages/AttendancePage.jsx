import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ===== Funções de API =====
const fetchAuthorizationsForAttendance = async (eventoId) => {
  // CORREÇÃO: Usando a rota correta e passando o ID como query param
  const { data } = await apiClient.get(`/autorizacoes/eventos/${eventoId}/autorizacoes`, {
    params: { event_id: eventoId }
  });
  return data;
};

const markAttendance = async ({ autorizacaoId, presente }) => {
  const { data } = await apiClient.patch(`/autorizacoes/${autorizacaoId}/presenca`, { presente });
  return data;
};

// ===== Componente da Página =====
const AttendancePage = () => {
  const { eventoId: eventoIdFromParams } = useParams();
  const eventoId = parseInt(eventoIdFromParams, 10);
  const queryClient = useQueryClient();

  const isIdValid = !isNaN(eventoId);

  const { data: authorizations, isLoading, error } = useQuery({
    queryKey: ['authorizations', eventoId],
    queryFn: () => fetchAuthorizationsForAttendance(eventoId),
    enabled: isIdValid,
  });

  const attendanceMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: (updatedAuth) => {
      const studentName = updatedAuth.nome_aluno;
      const status = updatedAuth.presente ? 'presente' : 'ausente';
      toast.success(`${studentName} marcado(a) como ${status}.`);
      
      queryClient.setQueryData(['authorizations', eventoId], (oldData) =>
        oldData.map((auth) => (auth.id === updatedAuth.id ? updatedAuth : auth))
      );
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erro ao marcar presença.');
    },
  });

  const handleTogglePresence = (autorizacaoId, currentPresence) => {
    attendanceMutation.mutate({ autorizacaoId, presente: !currentPresence });
  };
  
  const approvedStudents = authorizations?.filter(auth => auth.status === 'aprovado') || [];

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error || !isIdValid) {
    return (
        <div className="container mx-auto p-8 text-center">
            <p className="text-red-500">Erro ao carregar a lista de chamada.</p>
            <Link to={`/evento/detalhes/${eventoId}`} className="text-blue-600 hover:underline mt-4 inline-block">
                &larr; Voltar
            </Link>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link to={`/evento/detalhes/${eventoId}`} className="text-blue-600 hover:underline">
          &larr; Voltar aos Detalhes do Evento
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Lista de Chamada</h1>
        <p className="text-sm text-gray-500 mb-6">Marque a presença dos alunos aprovados que compareceram ao evento.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Presente</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedStudents.length > 0 ? (
                approvedStudents.map(student => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.nome_aluno}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <label htmlFor={`presenca-${student.id}`} className="flex justify-center items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id={`presenca-${student.id}`}
                            className="sr-only"
                            checked={student.presente}
                            onChange={() => handleTogglePresence(student.id, student.presente)}
                            disabled={attendanceMutation.isPending}
                          />
                          <div className={`block w-14 h-8 rounded-full transition-colors ${student.presente ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${student.presente ? 'translate-x-6' : ''}`}></div>
                        </div>
                      </label>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                    Nenhum aluno com autorização aprovada para este evento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;