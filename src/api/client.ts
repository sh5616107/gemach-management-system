import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // הוסף token לכל בקשה
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth
  async login(username: string, password: string) {
    const response = await this.client.post('/api/auth/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  }

  async logout() {
    localStorage.removeItem('token');
  }

  // Borrowers
  async getBorrowers() {
    const response = await this.client.get('/api/borrowers');
    return response.data;
  }

  async getBorrower(id: number) {
    const response = await this.client.get(`/api/borrowers/${id}`);
    return response.data;
  }

  async createBorrower(data: any) {
    const response = await this.client.post('/api/borrowers', data);
    return response.data;
  }

  async updateBorrower(id: number, data: any) {
    const response = await this.client.put(`/api/borrowers/${id}`, data);
    return response.data;
  }

  async deleteBorrower(id: number) {
    const response = await this.client.delete(`/api/borrowers/${id}`);
    return response.data;
  }

  // Loans
  async getLoans() {
    const response = await this.client.get('/api/loans');
    return response.data;
  }

  async getLoan(id: number) {
    const response = await this.client.get(`/api/loans/${id}`);
    return response.data;
  }

  async createLoan(data: any) {
    const response = await this.client.post('/api/loans', data);
    return response.data;
  }

  async updateLoan(id: number, data: any) {
    const response = await this.client.put(`/api/loans/${id}`, data);
    return response.data;
  }

  async deleteLoan(id: number) {
    const response = await this.client.delete(`/api/loans/${id}`);
    return response.data;
  }

  // Settings
  async getSettings() {
    const response = await this.client.get('/api/settings');
    return response.data;
  }

  async updateSettings(data: any) {
    const response = await this.client.put('/api/settings', data);
    return response.data;
  }

  // Depositors
  async getDepositors() {
    const response = await this.client.get('/api/depositors');
    return response.data;
  }

  async getDepositor(id: number) {
    const response = await this.client.get(`/api/depositors/${id}`);
    return response.data;
  }

  async createDepositor(data: any) {
    const response = await this.client.post('/api/depositors', data);
    return response.data;
  }

  async updateDepositor(id: number, data: any) {
    const response = await this.client.put(`/api/depositors/${id}`, data);
    return response.data;
  }

  async deleteDepositor(id: number) {
    const response = await this.client.delete(`/api/depositors/${id}`);
    return response.data;
  }

  // Deposits
  async getDeposits(status?: string) {
    const response = await this.client.get('/api/deposits', { params: { status } });
    return response.data;
  }

  async getDeposit(id: number) {
    const response = await this.client.get(`/api/deposits/${id}`);
    return response.data;
  }

  async createDeposit(data: any) {
    const response = await this.client.post('/api/deposits', data);
    return response.data;
  }

  async updateDeposit(id: number, data: any) {
    const response = await this.client.put(`/api/deposits/${id}`, data);
    return response.data;
  }

  async deleteDeposit(id: number) {
    const response = await this.client.delete(`/api/deposits/${id}`);
    return response.data;
  }

  async createWithdrawal(depositId: number, data: any) {
    const response = await this.client.post(`/api/deposits/${depositId}/withdrawals`, data);
    return response.data;
  }

  // Donations
  async getDonations() {
    const response = await this.client.get('/api/donations');
    return response.data;
  }

  async getDonation(id: number) {
    const response = await this.client.get(`/api/donations/${id}`);
    return response.data;
  }

  async createDonation(data: any) {
    const response = await this.client.post('/api/donations', data);
    return response.data;
  }

  async updateDonation(id: number, data: any) {
    const response = await this.client.put(`/api/donations/${id}`, data);
    return response.data;
  }

  async deleteDonation(id: number) {
    const response = await this.client.delete(`/api/donations/${id}`);
    return response.data;
  }
}

export const api = new ApiClient();
