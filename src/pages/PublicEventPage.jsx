import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ===== Funções de API (Apenas Endpoints Públicos) =====

const fetchPreregisteredStudents = async eventoId => {
  const { data } = await apiClient.get(
    `/autorizacoes/eventos/${eventoId}/pre-cadastrados`
  );
  return data;
};

const submitAuthorization = async ({ autorizacaoId, formData }) => {
  const { data } = await apiClient.put(
    `/autorizacoes/${autorizacaoId}/submeter`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data;
};

// ===== Componente da Página =====

const PublicEventPage = () => {
  const { linkUnico: eventoIdFromParams } = useParams();
  const eventoId = parseInt(eventoIdFromParams, 10);

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(false);

  const isIdValid = !isNaN(eventoId);

  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['preregistered', eventoId],
    queryFn: () => fetchPreregisteredStudents(eventoId),
    enabled: isIdValid,
  });

  const mutation = useMutation({
    mutationFn: submitAuthorization,
    onSuccess: () => {
      setSubmissionSuccess(true);
      toast.success(
        'Autorização enviada com sucesso! Você receberá um e-mail de confirmação.'
      );
    },
    onError: error => {
      toast.error(
        error.response?.data?.detail || 'Falha ao enviar autorização.'
      );
    },
  });

  const formik = useFormik({
    initialValues: {
      autorizacao_id: '',
      email_aluno: '',
      nome_responsavel: '',
      email_responsavel: '',
      arquivo: null,
    },
    validationSchema: Yup.object({
      autorizacao_id: Yup.string().required(
        'Por favor, selecione o nome do aluno na lista.'
      ),
      email_aluno: Yup.string()
        .email('Email inválido')
        .required('O email do aluno é obrigatório.'),
      nome_responsavel: Yup.string().required(
        'O nome do responsável é obrigatório.'
      ),
      email_responsavel: Yup.string()
        .email('Email inválido')
        .required('O email do responsável é obrigatório.'),
      arquivo: Yup.mixed().required('O arquivo de autorização é obrigatório.'),
    }),
    onSubmit: values => {
      const formData = new FormData();
      formData.append('email_aluno', values.email_aluno);
      formData.append('nome_responsavel', values.nome_responsavel);
      formData.append('email_responsavel', values.email_responsavel);
      formData.append('arquivo', values.arquivo);

      mutation.mutate({ autorizacaoId: values.autorizacao_id, formData });
    },
  });

  useEffect(() => {
    setSelectedStudent(!!formik.values.autorizacao_id);
  }, [formik.values.autorizacao_id]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !isIdValid) {
    return (
      <div className='container mx-auto p-8 text-center'>
        <p className='text-red-500'>
          Não foi possível carregar os dados deste evento. Verifique se o link
          está correto.
        </p>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-100'>
        <div className='p-8 max-w-lg w-full bg-white rounded-lg shadow-md text-center'>
          <h1 className='text-2xl font-bold text-green-600 mb-4'>
            ✅ Sucesso!
          </h1>
          <p className='text-gray-700'>
            Sua autorização foi enviada. Por favor, verifique seu e-mail e o do
            responsável para a confirmação de recebimento.
          </p>
          {/* CORREÇÃO 2: Adicionando um link para voltar */}
          <Link
            to='/'
            className='mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm'
          >
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100'>
      <div className='p-8 max-w-lg w-full bg-white rounded-lg shadow-md'>
        <h1 className='text-2xl font-bold text-center text-gray-800 mb-2'>
          Formulário de Autorização de Evento
        </h1>
        <p className='text-center text-gray-500 mb-6'>
          Preencha os dados abaixo para submeter sua autorização.
        </p>

        <div className='bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r-lg mb-6 text-sm'>
          <p>
            <strong>Instruções:</strong>
          </p>
          <ol className='list-decimal list-inside mt-2'>
            <li>Clique em "Baixar Modelo" para obter o arquivo.</li>
            <li>Imprima, preencha e assine o documento.</li>
            <li>Digitalize ou tire uma foto legível do documento assinado.</li>
            <li>
              Selecione o nome do aluno, preencha seus dados e anexe o arquivo
              abaixo.
            </li>
          </ol>
        </div>

        <div className='text-center mb-6'>
          {/* CORREÇÃO 1: Adicionando a barra final (/) na URL para corresponder à API. */}
<a 
                href={`${apiClient.defaults.baseURL}/eventos/${eventoId}/modelo/?evento_id=${eventoId}`}
                download
                className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm"
            >
                Baixar Modelo de Autorização (.docx)
            </a>
        </div>

        <form onSubmit={formik.handleSubmit} className='space-y-4'>
          <div>
            <label
              htmlFor='autorizacao_id'
              className='block text-sm font-medium text-gray-700'
            >
              Selecione o Nome do Aluno(a)
            </label>
            <select
              id='autorizacao_id'
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm'
              {...formik.getFieldProps('autorizacao_id')}
            >
              <option value=''>Selecione seu nome na lista...</option>
              {students?.map(student => (
                <option key={student.id} value={student.id}>
                  {student.nome_aluno}
                </option>
              ))}
            </select>
            {formik.touched.autorizacao_id && formik.errors.autorizacao_id && (
              <div className='text-red-500 text-xs mt-1'>
                {formik.errors.autorizacao_id}
              </div>
            )}
          </div>

          {selectedStudent && (
            <>
              <div>
                <label
                  htmlFor='nome_responsavel'
                  className='block text-sm font-medium text-gray-700'
                >
                  Nome Completo do Responsável
                </label>
                <input
                  id='nome_responsavel'
                  type='text'
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm'
                  {...formik.getFieldProps('nome_responsavel')}
                />
                {formik.touched.nome_responsavel &&
                  formik.errors.nome_responsavel && (
                    <div className='text-red-500 text-xs mt-1'>
                      {formik.errors.nome_responsavel}
                    </div>
                  )}
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='email_aluno'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Email do Aluno(a)
                  </label>
                  <input
                    id='email_aluno'
                    type='email'
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm'
                    {...formik.getFieldProps('email_aluno')}
                  />
                  {formik.touched.email_aluno && formik.errors.email_aluno && (
                    <div className='text-red-500 text-xs mt-1'>
                      {formik.errors.email_aluno}
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor='email_responsavel'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Email do Responsável
                  </label>
                  <input
                    id='email_responsavel'
                    type='email'
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm'
                    {...formik.getFieldProps('email_responsavel')}
                  />
                  {formik.touched.email_responsavel &&
                    formik.errors.email_responsavel && (
                      <div className='text-red-500 text-xs mt-1'>
                        {formik.errors.email_responsavel}
                      </div>
                    )}
                </div>
              </div>

              <div>
                <label
                  htmlFor='arquivo'
                  className='block text-sm font-medium text-gray-700'
                >
                  Anexar Autorização Assinada (PDF, PNG, JPG)
                </label>
                <input
                  id='arquivo'
                  name='arquivo'
                  type='file'
                  onChange={event =>
                    formik.setFieldValue(
                      'arquivo',
                      event.currentTarget.files[0]
                    )
                  }
                  className='mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                />
                {formik.touched.arquivo && formik.errors.arquivo && (
                  <div className='text-red-500 text-xs mt-1'>
                    {formik.errors.arquivo}
                  </div>
                )}
              </div>

              <button
                type='submit'
                disabled={mutation.isPending}
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
              >
                {mutation.isPending ? 'Enviando...' : 'Enviar Autorização'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublicEventPage;
