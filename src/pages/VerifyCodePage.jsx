import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api';

const VerifyCodeSchema = Yup.object().shape({
  codigo: Yup.string()
    .matches(/^[0-9]+$/, "Apenas números")
    .min(4, 'O código tem 4 dígitos')
    .max(4, 'O código tem 4 dígitos')
    .required('O código é obrigatório'),
});

const VerifyCodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, flow } = location.state || {}; // 'flow' pode ser 'register' ou 'reset'

  const [resendCooldown, setResendCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);
  
  // Se não houver email, redireciona para a página de login
  if (!email) {
      navigate('/login');
  }

  const formik = useFormik({
    initialValues: { codigo: '' },
    validationSchema: VerifyCodeSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await apiClient.post('/auth/register/verify-code', { email, codigo: values.codigo });
        toast.success('Código verificado com sucesso!');
        navigate('/definir-senha', { state: { email, codigo: values.codigo } });
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Erro ao verificar código.');
      } finally {
        setSubmitting(false);
      }
    },
  });
  
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    const endpoint = flow === 'register' ? '/auth/register/request-code' : '/auth/password-reset/request-code';
    try {
        // Para reenviar o código de registro, precisamos do nome, que não temos aqui.
        // O ideal seria o backend ter uma rota de reenvio que só precise do email.
        // Por enquanto, vamos assumir que o usuário no DB já tem o nome.
        await apiClient.post(endpoint, { email, nome: 'Usuário' }); // 'nome' pode não ser necessário para reset
        toast.success('Um novo código foi enviado!');
        setResendCooldown(30);
    } catch(error) {
        toast.error(error.response?.data?.detail || 'Não foi possível reenviar o código.');
    } finally {
        setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Verifique seu E-mail</h1>
        <p className="text-center text-sm text-gray-600 mb-4">
          Enviamos um código de 4 dígitos para <strong>{email}</strong>.
        </p>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código de Verificação</label>
            <input
              id="codigo"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-center tracking-[1em]"
              {...formik.getFieldProps('codigo')}
            />
            {formik.touched.codigo && formik.errors.codigo ? (
              <div className="text-red-500 text-xs mt-1">{formik.errors.codigo}</div>
            ) : null}
          </div>
          <button type="submit" disabled={formik.isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
            {formik.isSubmitting ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
            Não recebeu?{' '}
            <button 
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isResending}
                className="font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                {isResending ? 'Enviando...' : (resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCodePage;
