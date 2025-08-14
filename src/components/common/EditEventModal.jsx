import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../api';
import Modal from './Modal';

// Mesmo esquema de validação da criação
const EventSchema = Yup.object().shape({
  titulo: Yup.string().min(3, 'O título é muito curto!').max(255, 'O título é muito longo!').required('O título é obrigatório'),
  descricao: Yup.string().optional(),
  data_evento: Yup.string().required('A data e a hora são obrigatórias'),
  local_evento: Yup.string().max(500, 'O local é muito longo!').optional(),
});

// Função que chama a API para ATUALIZAR o evento
const updateEvent = async ({ id, ...eventData }) => {
  const { data } = await apiClient.put(`/eventos/${id}`, eventData);
  return data;
};

const EditEventModal = ({ isOpen, onClose, event }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      toast.success('Evento atualizado com sucesso!');
      // Invalida a query de eventos para buscar a lista atualizada
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // Invalida os detalhes do evento específico, caso a página de detalhes esteja aberta
      queryClient.invalidateQueries({ queryKey: ['eventDetails', event.id] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar o evento.');
    },
  });

  const formik = useFormik({
    initialValues: {
      titulo: '',
      descricao: '',
      data_evento: '',
      local_evento: '',
    },
    validationSchema: EventSchema,
    onSubmit: (values) => {
      const formattedValues = {
        ...values,
        data_evento: new Date(values.data_evento).toISOString(),
      };
      mutation.mutate({ id: event.id, ...formattedValues });
    },
  });
  
  // Efeito para popular o formulário quando o modal for aberto com os dados do evento
  useEffect(() => {
    if (event) {
      // Formata a data para o formato esperado pelo input datetime-local
      const localDate = new Date(event.data_evento).toLocaleString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(' ', 'T');

      formik.setValues({
        titulo: event.titulo,
        descricao: event.descricao || '',
        data_evento: localDate,
        local_evento: event.local_evento || '',
      });
    }
  }, [event]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Evento">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Campos do formulário (iguais ao de criação) */}
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título do Evento</label>
          <input id="titulo" type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('titulo')} />
          {formik.touched.titulo && formik.errors.titulo && <div className="text-red-500 text-xs mt-1">{formik.errors.titulo}</div>}
        </div>

        <div>
          <label htmlFor="data_evento" className="block text-sm font-medium text-gray-700">Data e Hora</label>
          <input id="data_evento" type="datetime-local" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('data_evento')} />
          {formik.touched.data_evento && formik.errors.data_evento && <div className="text-red-500 text-xs mt-1">{formik.errors.data_evento}</div>}
        </div>

        <div>
          <label htmlFor="local_evento" className="block text-sm font-medium text-gray-700">Local (Opcional)</label>
          <input id="local_evento" type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('local_evento')} />
        </div>

        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
          <textarea id="descricao" rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('descricao')}></textarea>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
            {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditEventModal;