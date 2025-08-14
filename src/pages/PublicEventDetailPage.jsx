import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import apiClient from '../api';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ===== Funções de API =====
const fetchPublicEventByLink = async (linkUnico) => {
  const { data } = await apiClient.get(`/eventos/publico/${linkUnico}`);
  return data;
};

const fetchPreregisteredStudents = async (eventoId) => {
  if (!eventoId) return [];
  const { data } = await apiClient.get(`/autorizacoes/eventos/${eventoId}/pre-cadastrados`);
  return data;
};

const submitPreregistered = async ({ autorizacaoId, formData }) => {
  const { data } = await apiClient.put(`/autorizacoes/${autorizacaoId}/submeter`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

const submitSelfRegistration = async ({ eventoId, formData }) => {
  const { data } = await apiClient.post(`/autorizacoes/evento/${eventoId}/inscrever-se`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ===== Componente Principal da Página =====
const PublicEventDetailPage = () => {
  const { linkUnico } = useParams();
  const [activeTab, setActiveTab] = useState('self-register');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const { data: event, isLoading: isLoadingEvent, error: errorEvent } = useQuery({
    queryKey: ['publicEvent', linkUnico],
    queryFn: () => fetchPublicEventByLink(linkUnico),
    retry: false,
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['preregisteredStudents', event?.id],
    queryFn: () => fetchPreregisteredStudents(event.id),
    enabled: !!event?.id,
  });

  // Formulários como componentes internos para acessar o estado da página principal
  const SelfRegisterForm = () => {
    const mutation = useMutation({
        mutationFn: (formData) => submitSelfRegistration({ eventoId: event.id, formData }),
        onSuccess: () => setSubmissionSuccess(true),
        onError: (err) => toast.error(err.response?.data?.detail || 'Falha ao se inscrever.'),
    });

    const formik = useFormik({
        initialValues: { nome_aluno: '', matricula_aluno: '', email_aluno: '', nome_responsavel: '', email_responsavel: '', arquivo: null },
        validationSchema: Yup.object({
            nome_aluno: Yup.string().required('O nome do aluno é obrigatório.'),
            matricula_aluno: Yup.string().optional(),
            email_aluno: Yup.string().email('Email inválido').required('O email do aluno é obrigatório.'),
            nome_responsavel: Yup.string().required('O nome do responsável é obrigatório.'),
            email_responsavel: Yup.string().email('Email inválido').required('O email do responsável é obrigatório.'),
            arquivo: Yup.mixed().required('O arquivo de autorização é obrigatório.'),
        }),
        onSubmit: (values) => {
            const formData = new FormData();
            Object.keys(values).forEach(key => formData.append(key, values[key]));
            mutation.mutate(formData);
        },
    });

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4 pt-4">
            <input name="nome_aluno" placeholder="Nome Completo do Aluno" {...formik.getFieldProps('nome_aluno')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            {formik.touched.nome_aluno && formik.errors.nome_aluno && <div className="text-red-500 text-xs mt-1">{formik.errors.nome_aluno}</div>}
            <input name="matricula_aluno" placeholder="Matrícula (Opcional)" {...formik.getFieldProps('matricula_aluno')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            <input name="nome_responsavel" placeholder="Nome do Responsável" {...formik.getFieldProps('nome_responsavel')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            {formik.touched.nome_responsavel && formik.errors.nome_responsavel && <div className="text-red-500 text-xs mt-1">{formik.errors.nome_responsavel}</div>}
            <input name="email_aluno" placeholder="Email do Aluno" {...formik.getFieldProps('email_aluno')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            {formik.touched.email_aluno && formik.errors.email_aluno && <div className="text-red-500 text-xs mt-1">{formik.errors.email_aluno}</div>}
            <input name="email_responsavel" placeholder="Email do Responsável" {...formik.getFieldProps('email_responsavel')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            {formik.touched.email_responsavel && formik.errors.email_responsavel && <div className="text-red-500 text-xs mt-1">{formik.errors.email_responsavel}</div>}
            <label htmlFor="arquivo_self" className="block text-sm font-medium text-gray-700">Anexar Autorização Assinada</label>
            <input id="arquivo_self" name="arquivo" type="file" onChange={(event) => formik.setFieldValue("arquivo", event.currentTarget.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {formik.touched.arquivo && formik.errors.arquivo && <div className="text-red-500 text-xs mt-1">{formik.errors.arquivo}</div>}
            <button type="submit" disabled={mutation.isPending} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{mutation.isPending ? 'Enviando...' : 'Inscrever-se e Enviar'}</button>
        </form>
    );
  };
  
  const PreregisteredForm = () => {
    const mutation = useMutation({
        mutationFn: submitPreregistered,
        onSuccess: () => setSubmissionSuccess(true),
        onError: (err) => toast.error(err.response?.data?.detail || 'Falha ao enviar autorização.'),
    });

    const formik = useFormik({
        initialValues: { autorizacao_id: '', email_aluno: '', nome_responsavel: '', email_responsavel: '', arquivo: null },
        validationSchema: Yup.object({
            autorizacao_id: Yup.string().required('Selecione o nome do aluno.'),
            email_aluno: Yup.string().email('Email inválido').required('O email do aluno é obrigatório.'),
            nome_responsavel: Yup.string().required('O nome do responsável é obrigatório.'),
            email_responsavel: Yup.string().email('Email inválido').required('O email do responsável é obrigatório.'),
            arquivo: Yup.mixed().required('O arquivo é obrigatório.'),
        }),
        onSubmit: (values) => {
            const formData = new FormData();
            formData.append('email_aluno', values.email_aluno);
            formData.append('nome_responsavel', values.nome_responsavel);
            formData.append('email_responsavel', values.email_responsavel);
            formData.append('arquivo', values.arquivo);
            mutation.mutate({ autorizacaoId: values.autorizacao_id, formData });
        },
    });

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4 pt-4">
            <select id="autorizacao_id" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" {...formik.getFieldProps('autorizacao_id')}>
                <option value="">Selecione seu nome...</option>
                {students?.map(s => (<option key={s.id} value={s.id}>{s.nome_aluno}</option>))}
            </select>
            {formik.touched.autorizacao_id && formik.errors.autorizacao_id && <div className="text-red-500 text-xs mt-1">{formik.errors.autorizacao_id}</div>}
            {formik.values.autorizacao_id && <>
                <input name="nome_responsavel" placeholder="Nome do Responsável" {...formik.getFieldProps('nome_responsavel')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                {formik.touched.nome_responsavel && formik.errors.nome_responsavel && <div className="text-red-500 text-xs mt-1">{formik.errors.nome_responsavel}</div>}
                <input name="email_aluno" placeholder="Email do Aluno" {...formik.getFieldProps('email_aluno')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                {formik.touched.email_aluno && formik.errors.email_aluno && <div className="text-red-500 text-xs mt-1">{formik.errors.email_aluno}</div>}
                <input name="email_responsavel" placeholder="Email do Responsável" {...formik.getFieldProps('email_responsavel')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                {formik.touched.email_responsavel && formik.errors.email_responsavel && <div className="text-red-500 text-xs mt-1">{formik.errors.email_responsavel}</div>}
                <label htmlFor="arquivo_pre" className="block text-sm font-medium text-gray-700">Anexar Autorização</label>
                <input id="arquivo_pre" name="arquivo" type="file" onChange={(e) => formik.setFieldValue("arquivo", e.currentTarget.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {formik.touched.arquivo && formik.errors.arquivo && <div className="text-red-500 text-xs mt-1">{formik.errors.arquivo}</div>}
                <button type="submit" disabled={mutation.isPending} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{mutation.isPending ? 'Enviando...' : 'Enviar'}</button>
            </>}
        </form>
    );
  };
  
  if (isLoadingEvent || isLoadingStudents) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (errorEvent) {
    return (
        <div className="container mx-auto p-8 text-center">
            <p className="text-red-500">Evento não encontrado. Verifique se o link está correto.</p>
            <Link to="/eventos" className="text-blue-600 hover:underline mt-4 inline-block">
                &larr; Voltar para a lista de eventos
            </Link>
        </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 max-w-lg w-full bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Inscrição Enviada!</h1>
          <p className="text-gray-700">Sua autorização foi enviada para análise. Você receberá um e-mail de confirmação em breve.</p>
          <Link to="/eventos" className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm">Voltar para a Lista</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-12 px-4">
      <div className="w-full max-w-lg mb-4">
        <Link to="/eventos" className="text-blue-600 hover:underline text-sm">
          &larr; Voltar para a lista de eventos
        </Link>
      </div>
      <div className="p-8 max-w-lg w-full bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">{event.titulo}</h1>
          <p className="text-sm text-gray-500 mt-1">{new Date(event.data_evento).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
          <p className="text-sm text-gray-600 mt-1">📍 {event.local_evento || 'Local a definir'}</p>
          {event.descricao && <p className="text-gray-700 mt-4">{event.descricao}</p>}
          <a href={`${apiClient.defaults.baseURL}/eventos/${event.id}/modelo/?evento_id=${event.id}`} download className="mt-6 inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm">
            Baixar Modelo de Autorização
          </a>
        </div>
        <div className="border-b border-gray-200 mt-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('self-register')} className={`${activeTab === 'self-register' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
              Quero me inscrever
            </button>
            {students && students.length > 0 && (
              <button onClick={() => setActiveTab('preregistered')} className={`${activeTab === 'preregistered' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                Já sou pré-cadastrado
              </button>
            )}
          </nav>
        </div>
        <div>
          {activeTab === 'preregistered' ? 
            (students && students.length > 0 ? <PreregisteredForm /> : <p className="text-center text-gray-500 pt-4">Não há alunos pré-cadastrados para este evento.</p>) : 
            <SelfRegisterForm />
          }
        </div>
      </div>
    </div>
  );
};

export default PublicEventDetailPage;
