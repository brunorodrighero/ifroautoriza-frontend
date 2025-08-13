import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../api';
import Modal from './Modal';

// Esquema de validação para o formulário do evento, baseado no schema do backend
//
const EventSchema = Yup.object().shape({
  titulo: Yup.string().min(3, 'O título é muito curto!').max(255, 'O título é muito longo!').required('O título é obrigatório'),
  descricao: Yup.string().optional(),
  data_evento: Yup.string().required('A data e a hora são obrigatórias'),
  local_evento: Yup.string().max(500, 'O local é muito longo!').optional(),
});

// Função que faz a chamada à API para criar o evento
const createEvent = async (eventData) => {
  // O endpoint é POST para /eventos/
  const { data } = await apiClient.post('/eventos/', eventData);
  return data;
};

const CreateEventModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  // useMutation do React Query para lidar com a criação do evento de forma assíncrona
  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast.success('Evento criado com sucesso!');
      // Invalida a query 'events', forçando o React Query a buscar a lista atualizada de eventos
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose(); // Fecha o modal após o sucesso
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erro ao criar o evento.');
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
      // O backend espera a data no formato ISO 8601
      const formattedValues = {
        ...values,
        data_evento: new Date(values.data_evento).toISOString(),
      };
      mutation.mutate(formattedValues);
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Evento">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título do Evento</label>
          <input
            id="titulo"
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            {...formik.getFieldProps('titulo')}
          />
          {formik.touched.titulo && formik.errors.titulo && <div className="text-red-500 text-xs mt-1">{formik.errors.titulo}</div>}
        </div>

        <div>
          <label htmlFor="data_evento" className="block text-sm font-medium text-gray-700">Data e Hora</label>
          <input
            id="data_evento"
            type="datetime-local"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            {...formik.getFieldProps('data_evento')}
          />
          {formik.touched.data_evento && formik.errors.data_evento && <div className="text-red-500 text-xs mt-1">{formik.errors.data_evento}</div>}
        </div>

        <div>
          <label htmlFor="local_evento" className="block text-sm font-medium text-gray-700">Local (Opcional)</label>
          <input
            id="local_evento"
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            {...formik.getFieldProps('local_evento')}
          />
          {formik.touched.local_evento && formik.errors.local_evento && <div className="text-red-500 text-xs mt-1">{formik.errors.local_evento}</div>}
        </div>

        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
          <textarea
            id="descricao"
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            {...formik.getFieldProps('descricao')}
          ></textarea>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
            {mutation.isPending ? 'Criando...' : 'Criar Evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateEventModal;