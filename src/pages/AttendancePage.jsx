// src/pages/AttendancePage.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ===== Funções de API (sem alteração) =====
const fetchEventDetails = async (eventoId) => {
    const { data } = await apiClient.get(`/eventos/${eventoId}`);
    return data;
};

const fetchAuthorizationsForAttendance = async (eventoId) => {
  const { data } = await apiClient.get(`/autorizacoes/eventos/${eventoId}/autorizacoes`);
  return data;
};

const markAttendance = async ({ autorizacaoId, data_presenca, updateData }) => {
  const { data } = await apiClient.patch(
    `/autorizacoes/${autorizacaoId}/presenca/${data_presenca}`,
    updateData
  );
  return data;
};

// ===== Componente de Toggle (Interruptor) =====
const ToggleSwitch = ({ checked, onChange, disabled, label }) => {
    return (
        <label className="flex items-center cursor-pointer select-none text-gray-700">
            <span className="mr-3 text-sm font-medium">{label}</span>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="sr-only peer"
                />
                <div className="block h-8 w-14 rounded-full bg-gray-300 peer-checked:bg-green-500 transition-colors"></div>
                <div className="dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform peer-checked:translate-x-6"></div>
            </div>
        </label>
    );
};

// ===== Componente da Página (Layout Aprimorado) =====
const AttendancePage = () => {
  const { eventoId: eventoIdFromParams } = useParams();
  const eventoId = parseInt(eventoIdFromParams, 10);
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(null);

  const isIdValid = !isNaN(eventoId);

  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['eventDetails', eventoId],
    queryFn: () => fetchEventDetails(eventoId),
    enabled: isIdValid,
  });

  const { data: authorizations, isLoading: isLoadingAuths, error } = useQuery({
    queryKey: ['authorizations', eventoId],
    queryFn: () => fetchAuthorizationsForAttendance(eventoId),
    enabled: isIdValid,
  });

  const attendanceMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      toast.success(`Presença atualizada.`);
      queryClient.invalidateQueries({ queryKey: ['authorizations', eventoId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erro ao marcar presença.');
    },
  });

  const eventDates = useMemo(() => {
    if (!event) return [];
    const dates = [];
    const currentDate = new Date(event.data_inicio + 'T12:00:00Z'); // Use UTC para evitar off-by-one
    const endDate = new Date((event.data_fim || event.data_inicio) + 'T12:00:00Z');
    
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }, [event]);
  
  // Efeito para definir a data padrão
  useEffect(() => {
    if (eventDates.length > 0 && !selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        if (eventDates.includes(today)) {
            setSelectedDate(today);
        } else {
            setSelectedDate(eventDates[0]);
        }
    }
  }, [eventDates, selectedDate]);


  const handleTogglePresence = (autorizacaoId, tipo, isChecked) => {
    const updateData = {};
    if (tipo === 'ida') {
        updateData.presente_ida = isChecked;
        if (!isChecked) {
            updateData.presente_volta = false;
        }
    } else { // 'volta'
        updateData.presente_volta = isChecked;
    }
    attendanceMutation.mutate({ autorizacaoId, data_presenca: selectedDate, updateData });
  };
  
  const approvedStudents = authorizations?.filter(auth => auth.status === 'aprovado') || [];

  if (isLoadingEvent || isLoadingAuths) {
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

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Lista de Chamada e Retorno</h1>
            <h2 className="text-lg font-semibold text-gray-600">{event?.titulo}</h2>
        </div>

        {/* Seletor de Datas */}
        <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Selecione o dia da chamada:</p>
            <div className="flex flex-wrap gap-2">
                {eventDates.map(date => (
                    <button 
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`py-2 px-4 rounded-md text-sm font-semibold transition-colors ${selectedDate === date ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </button>
                ))}
            </div>
        </div>
        
        {/* Lista de Alunos para o dia selecionado */}
        {approvedStudents.length > 0 ? (
            <div className="space-y-4">
                {approvedStudents.map(student => {
                    const presencaDoDia = student.presencas.find(p => p.data_presenca === selectedDate);
                    const presenteIda = presencaDoDia?.presente_ida || false;
                    const presenteVolta = presencaDoDia?.presente_volta || false;

                    return (
                        <div key={student.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h3 className="font-bold text-lg text-gray-900 flex-1">{student.nome_aluno}</h3>
                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                <ToggleSwitch
                                    label="Ida"
                                    checked={presenteIda}
                                    onChange={(e) => handleTogglePresence(student.id, 'ida', e.target.checked)}
                                    disabled={attendanceMutation.isPending}
                                />
                                <ToggleSwitch
                                    label="Volta"
                                    checked={presenteVolta}
                                    onChange={(e) => handleTogglePresence(student.id, 'volta', e.target.checked)}
                                    disabled={attendanceMutation.isPending || !presenteIda}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <p className="py-4 text-center text-gray-500">
                Nenhum aluno com autorização aprovada para este evento.
            </p>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;