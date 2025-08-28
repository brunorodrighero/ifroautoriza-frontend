// src/api/campusService.js
import apiClient from './index';

// As funções agora retornam diretamente a promessa do axios.
// O react-query cuidará do .then (data) e do .catch (error).

export const getCampuses = async () => {
  const response = await apiClient.get('/campus/');
  return response.data;
};

export const createCampus = async (campusData) => {
  const response = await apiClient.post('/campus/', campusData);
  return response.data;
};

export const updateCampus = async (id, campusData) => {
  const response = await apiClient.put(`/campus/${id}`, campusData);
  return response.data;
};

export const deleteCampus = async (id) => {
  const response = await apiClient.delete(`/campus/${id}`);
  return response.data;
};