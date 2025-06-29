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

  constructor(baseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
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
          message: 'Unable to connect to server. Please ensure the backend is running.',
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
}

export const apiClient = new ApiClient();

// Agent API methods
export const agentApi = {
  list: () => apiClient.get('/agents'),
  get: (id: string) => apiClient.get(`/agents/${id}`),
  create: (data: any) => apiClient.post('/agents', data),
  update: (id: string, data: any) => apiClient.patch(`/agents/${id}`, data),
  delete: (id: string) => apiClient.delete(`/agents/${id}`),
  deploy: (id: string, config: any) => apiClient.post(`/agents/${id}/deploy`, config),
};

// Knowledge Base API methods
export const kbApi = {
  list: () => apiClient.get('/knowledge-bases'),
  get: (id: string) => apiClient.get(`/knowledge-bases/${id}`),
  create: (data: any) => apiClient.post('/knowledge-bases', data),
  upload: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${apiClient['baseUrl']}/knowledge-bases/${id}/documents`, {
      method: 'POST',
      body: formData,
    });
  },
};

// MCP API methods
export const mcpApi = {
  list: () => apiClient.get('/mcps'),
  get: (id: string) => apiClient.get(`/mcps/${id}`),
  uploadSpec: (data: any) => apiClient.post('/mcps/spec', data),
  getTools: (id: string) => apiClient.get(`/mcps/${id}/tools`),
  updateTool: (id: string, toolId: string, data: any) => 
    apiClient.patch(`/mcps/${id}/tools/${toolId}`, data),
};

// Calls API methods
export const callsApi = {
  list: (params?: any) => apiClient.get('/calls' + (params ? `?${new URLSearchParams(params)}` : '')),
  get: (id: string) => apiClient.get(`/calls/${id}`),
  start: (agentId: string) => apiClient.post('/calls/start', { agentId }),
  end: (id: string) => apiClient.post(`/calls/${id}/end`),
};

// Metrics API methods
export const metricsApi = {
  list: (params?: any) => apiClient.get('/metrics' + (params ? `?${new URLSearchParams(params)}` : '')),
  create: (data: any) => apiClient.post('/metrics', data),
};