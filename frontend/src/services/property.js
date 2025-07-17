import api from './api';

export const getProperties = async () => (await api.get('/api/properties/')).data;

export const getProperty = async (id) => (await api.get(`/api/properties/${id}/`)).data;

export const createProperty = async (data) => (await api.post('/api/properties/', data)).data;

export const deleteProperty = async (id) => await api.delete(`/api/properties/${id}/`);

export const getOffers = async () => (await api.get('/api/offers/')).data;

export const submitOffer = async (data) => (await api.post('/api/offers/', data)).data;

export const acceptOffer = async (id) => (await api.post(`/api/offers/${id}/accept/`)).data;

export const rejectOffer = async (id) => (await api.post(`/api/offers/${id}/reject/`)).data;

export const updateInspection = async (id, isPassed) => (await api.patch(`/api/properties/${id}/update_inspection_status/`, { is_inspection_passed: isPassed })).data;

export const updateAppraisal = async (id, marketValue) => (await api.patch(`/api/properties/${id}/update_appraisal/`, { market_value: marketValue })).data;

export const completeTransaction = async (id) => (await api.post(`/api/properties/${id}/complete_transaction/`)).data; 