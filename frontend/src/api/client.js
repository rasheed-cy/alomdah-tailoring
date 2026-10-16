import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data)

// Customers
export const listCustomers = (skip = 0, limit = 200) =>
  api.get('/customers?skip=' + skip + '&limit=' + limit).then(r => r.data)
export const listArchived = (skip = 0, limit = 200) =>
  api.get('/customers/archived?skip=' + skip + '&limit=' + limit).then(r => r.data)
export const countCustomers = () => api.get('/customers/count').then(r => r.data)
export const countArchived = () => api.get('/customers/count-archived').then(r => r.data)
export const searchCustomers = (q, limit = 100) =>
  api.get('/customers/search', { params: { q, limit } }).then(r => r.data)
export const getCustomer = (id) => api.get('/customers/' + id).then(r => r.data)
export const createCustomer = (data) => api.post('/customers', data).then(r => r.data)
export const updateCustomer = (id, data) => api.put('/customers/' + id, data).then(r => r.data)
export const archiveCustomer = (id, reason = '') =>
  api.post('/customers/' + id + '/archive?reason=' + encodeURIComponent(reason)).then(r => r.data)
export const restoreCustomer = (id) => api.post('/customers/' + id + '/restore').then(r => r.data)
export const deleteCustomerPermanent = (id) => api.delete('/customers/' + id).then(r => r.data)
export const deleteCustomer = (id) => api.delete('/customers/' + id).then(r => r.data)

// Images
export const listCustomerImages = (customerId) =>
  api.get('/customers/' + customerId + '/images').then(r => r.data)
export const getImageUrl = (imageId) => '/api/images/' + imageId
export const getPrimaryImageUrl = (customerId) =>
  '/api/customers/' + customerId + '/images/primary'
export const uploadCustomerImage = (customerId, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/customers/' + customerId + '/images', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}
export const deleteImage = (imageId) => api.delete('/images/' + imageId).then(r => r.data)

// Backup
export const createBackup = () => api.post('/backup/create').then(r => r.data)
export const listBackups = () => api.get('/backup/list').then(r => r.data)
export const getBackup = (id) => api.get('/backup/' + id).then(r => r.data)
export const downloadBackupUrl = (id) => '/api/backup/' + id + '/download'
export const verifyBackup = (id) => api.post('/backup/' + id + '/verify').then(r => r.data)
export const restoreBackup = (id) => api.post('/backup/' + id + '/restore').then(r => r.data)
export const deleteBackup = (id) => api.delete('/backup/' + id).then(r => r.data)

// Settings
export const getSystemInfo = () => api.get('/settings/system-info').then(r => r.data)
export const testConnection = () => api.post('/settings/test-connection').then(r => r.data)
export const getDbStats = () => api.get('/settings/db-stats').then(r => r.data)

// App Settings
export const getAppSettings = () => api.get('/app-settings').then(r => r.data)
export const updateAppSettings = (settings) =>
  api.put('/app-settings', { settings }).then(r => r.data)
export const resetAppSettings = () => api.post('/app-settings/reset').then(r => r.data)

// Backup Schedule
export const getBackupSchedule = () => api.get('/app-settings/backup/schedule').then(r => r.data)
export const setBackupSchedule = (data) =>
  api.post('/app-settings/backup/schedule', data).then(r => r.data)
export const runBackupNow = () => api.post('/app-settings/backup/run-now').then(r => r.data)

// Camera Settings
export const getCameraSettings = () => api.get('/app-settings/camera').then(r => r.data)
export const saveCameraSettings = (device_id, device_label) =>
  api.post('/app-settings/camera', { device_id, device_label }).then(r => r.data)
export const clearCameraSettings = () => api.delete('/app-settings/camera').then(r => r.data)

// Roles
export const listRoles = () => api.get('/roles').then(r => r.data)
export const getRole = (id) => api.get('/roles/' + id).then(r => r.data)
export const createRole = (data) => api.post('/roles', data).then(r => r.data)
export const updateRole = (id, data) => api.put('/roles/' + id, data).then(r => r.data)
export const deleteRole = (id) => api.delete('/roles/' + id).then(r => r.data)

// Users
export const listUsers = () => api.get('/users').then(r => r.data)
export const getUser = (id) => api.get('/users/' + id).then(r => r.data)
export const createUser = (data) => api.post('/users', data).then(r => r.data)
export const updateUser = (id, data) => api.put('/users/' + id, data).then(r => r.data)
export const changeUserPassword = (id, newPassword) =>
  api.post('/users/' + id + '/password', { new_password: newPassword }).then(r => r.data)
export const deleteUser = (id) => api.delete('/users/' + id).then(r => r.data)

export default api

