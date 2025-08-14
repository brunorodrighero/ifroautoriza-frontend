import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api';

const SetPasswordSchema = Yup.object().shape({
  password: Yup.string().min(8, 'A senha deve ter no mínimo 8 caracteres').required('Obrigatório'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'As senhas não coincidem')
    .required('Confirme sua senha'),
});

const SetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, codigo } = location.state || {};
  
  if (!email || !codigo) {
    navigate('/login');
  }

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: SetPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await apiClient.post('/auth/register/set-password', {
          email,
          codigo,
          password: values.password,
        });
        toast.success('Senha definida com sucesso! Você já pode fazer o login.');
        navigate('/login');
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Não foi possível definir a senha.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Crie sua Senha</h1>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Nova Senha</label>
            <input
              id="password"
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              {...formik.getFieldProps('password')}
            />
            {formik.touched.password && formik.errors.password ? (
              <div className="text-red-500 text-xs mt-1">{formik.errors.password}</div>
            ) : null}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirme a Nova Senha</label>
            <input
              id="confirmPassword"
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              {...formik.getFieldProps('confirmPassword')}
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
              <div className="text-red-500 text-xs mt-1">{formik.errors.confirmPassword}</div>
            ) : null}
          </div>
          <button type="submit" disabled={formik.isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
            {formik.isSubmitting ? 'Salvando...' : 'Salvar Senha e Concluir'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordPage;
