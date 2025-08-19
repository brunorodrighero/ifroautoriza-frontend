// src/components/common/CreateEventModal.jsx
import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../api';
import Modal from './Modal';

const EventSchema = Yup.object().shape({
  titulo: Yup.string().min(3, 'O título é muito curto!').max(255, 'O título é muito longo!').required('O título é obrigatório'),
  descricao: Yup.string().optional(),
  data_inicio: Yup.date().required('A data de início é obrigatória'),
  data_fim: Yup.date().optional().min(Yup.ref('data_inicio'), 'A data final não pode ser anterior à data de início.'),
  horario: Yup.string().optional(),
  local_evento: Yup.string().max(500, 'O local é muito longo!').optional(),
});

const createEvent = async (eventData) => {
  const { data } = await apiClient.post('/eventos/', eventData);
  return data;
};

const CreateEventModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast.success('Evento criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erro ao criar o evento.');
    },
  });

  const formik = useFormik({
    initialValues: {
      titulo: '',
      descricao: '',
      data_inicio: '',
      data_fim: '',
      horario: '',
      local_evento: '',
    },
    validationSchema: EventSchema,
    onSubmit: (values) => {
      const formattedValues = {
        ...values,
        data_fim: values.data_fim || null, // Envia nulo se o campo estiver vazio
      };
      mutation.mutate(formattedValues);
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Evento">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título do Evento</label>
          <input id="titulo" type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('titulo')} />
          {formik.touched.titulo && formik.errors.titulo && <div className="text-red-500 text-xs mt-1">{formik.errors.titulo}</div>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700">Data de Início</label>
                <input id="data_inicio" type="date" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('data_inicio')} />
                {formik.touched.data_inicio && formik.errors.data_inicio && <div className="text-red-500 text-xs mt-1">{formik.errors.data_inicio}</div>}
            </div>
            <div>
                <label htmlFor="data_fim" className="block text-sm font-medium text-gray-700">Data Final (Opcional)</label>
                <input id="data_fim" type="date" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('data_fim')} />
                {formik.touched.data_fim && formik.errors.data_fim && <div className="text-red-500 text-xs mt-1">{formik.errors.data_fim}</div>}
            </div>
        </div>

        <div>
            <label htmlFor="horario" className="block text-sm font-medium text-gray-700">Horário (Opcional)</label>
            <input id="horario" type="text" placeholder="Ex: 08:00 às 12:00" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('horario')} />
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
          <button type="submit" disabled={mutation.isPending} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
            {mutation.isPending ? 'Criando...' : 'Criar Evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateEventModal;