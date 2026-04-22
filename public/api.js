// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// API Helper Functions
const api = {
  // Authentication
  async login(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return await response.json();
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
  },

  async checkAuth() {
    const response = await fetch(`${API_BASE_URL}/auth/check`, {
      credentials: 'include'
    });
    return await response.json();
  },

  async register(email, password, role, enrollment) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, role, enrollment })
    });
    return await response.json();
  },

  // Profile
  async updateProfile(department) {
    const response = await fetch(`${API_BASE_URL}/users/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ department })
    });
    return await response.json();
  },

  // Complaints
  async getComplaints() {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      credentials: 'include'
    });
    return await response.json();
  },

  async getComplaint(id) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      credentials: 'include'
    });
    return await response.json();
  },

  async createComplaint(formData) {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      credentials: 'include',
      body: formData // allow browser to set Content-Type with boundary
    });
    return await response.json();
  },

  async updateComplaint(id, formData) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });
    return await response.json();
  },

  async updateComplaintStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    return await response.json();
  },

  async deleteComplaint(id) {
    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return await response.json();
  },

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/complaints/stats/summary`, {
      credentials: 'include'
    });
    return await response.json();
  }
};
