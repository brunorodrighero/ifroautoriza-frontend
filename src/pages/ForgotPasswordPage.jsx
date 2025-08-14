import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Email inválido').required('O e-mail é obrigatório'),
});

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: ForgotPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await apiClient.post('/auth/password-reset/request-code', values);
        toast.success('Código de recuperação enviado!');
        // Navega para a página de verificação, passando o email e o tipo de fluxo
        navigate('/verificar-codigo', { state: { email: values.email, flow: 'reset' } });
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Erro ao solicitar código.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Recuperar Senha</h1>
        <p className="text-center text-sm text-gray-600 mb-4">
          Informe seu e-mail institucional para receber um código de recuperação.
        </p>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              {...formik.getFieldProps('email')}
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="text-red-500 text-xs mt-1">{formik.errors.email}</div>
            ) : null}
          </div>
          <button type="submit" disabled={formik.isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
            {formik.isSubmitting ? 'Enviando...' : 'Enviar Código'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
