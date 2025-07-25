// API utilities for connecting to the backend
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw {
          message: errorData.message || `HTTP ${response.status}`,
          status: response.status,
          details: errorData.details
        } as ApiError;
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
        message: 'Success',
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          message: 'Unable to connect to server. Please ensure the backend is running on port 3001.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw {
          message: errorData.message || `HTTP ${response.status}`,
          status: response.status,
          details: errorData.details
        } as ApiError;
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
        message: 'Success',
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          message: 'Unable to connect to server. Please ensure the backend is running.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();

// Auth API methods
export const authApi = {
  signup: (data: any) => apiClient.post('/auth/signup', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  forgotPassword: (data: any) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data),
  me: () => apiClient.get('/auth/me'),
};

// Agent API methods
export const agentApi = {
  list: () => apiClient.get('/agents'),
  get: (id: string) => apiClient.get(`/agents/${id}`),
  create: (data: any) => apiClient.post('/agents', data),
  update: (id: string, data: any) => apiClient.put(`/agents/${id}`, data),
  delete: (id: string) => apiClient.delete(`/agents/${id}`),
  deploy: (id: string, config: any) => apiClient.post(`/agents/${id}/deploy`, config),
};

// Calls API methods
export const callsApi = {
  list: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return apiClient.get(`/calls${queryString}`);
  },
  get: (id: string) => apiClient.get(`/calls/${id}`),
  start: (data: any) => apiClient.post('/calls/start', data),
  end: (id: string) => apiClient.post(`/calls/${id}/end`),
};

// Knowledge Base API methods
export const kbApi = {
  list: () => apiClient.get('/knowledge-bases'),
  get: (id: string) => apiClient.get(`/knowledge-bases/${id}`),
  create: (data: any) => apiClient.post('/knowledge-bases', data),
  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload(`/knowledge-bases/${id}/documents`, formData);
  },
};

// MCP API methods
export const mcpApi = {
  list: () => apiClient.get('/mcps'),
  get: (id: string) => apiClient.get(`/mcps/${id}`),
  uploadSpec: (data: any) => apiClient.post('/mcps/spec', data),
  uploadSpecFile: (file: File) => {
    const formData = new FormData();
    formData.append('specFile', file);
    return apiClient.upload('/mcps/spec', formData);
  },
  getTools: (id: string) => apiClient.get(`/mcps/${id}/tools`),
  updateTool: (id: string, toolId: string, data: any) => 
    apiClient.patch(`/mcps/${id}/tools/${toolId}`, data),
  addTemplate: (id: string, data: any) => apiClient.post(`/mcps/${id}/templates`, data),
  addPrompt: (id: string, data: any) => apiClient.post(`/mcps/${id}/prompts`, data),
};

// Metrics API methods
export const metricsApi = {
  list: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return apiClient.get(`/metrics${queryString}`);
  },
  create: (data: any) => apiClient.post('/metrics', data),
};

// API Keys API methods (admin only)
export const apiKeysApi = {
  list: () => apiClient.get('/api-keys'),
  create: (data: any) => apiClient.post('/api-keys', data),
  update: (id: string, data: any) => apiClient.put(`/api-keys/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api-keys/${id}`),
};