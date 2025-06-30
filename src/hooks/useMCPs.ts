import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcpApi } from '../lib/api';

export interface MCPEndpoint {
  method: string;
  path: string;
  operationId: string;
  summary?: string;
  parameters?: any[];
}

export interface MCPServer {
  id: string;
  user_id: string;
  name: string;
  description: string;
  version?: string;
  status: 'active' | 'draft' | 'error' | 'archived';
  hosting_status?: 'inactive' | 'generating' | 'starting' | 'running' | 'error' | 'stopped' | 'paused';
  host_port?: number;
  host_url?: string;
  process_id?: number;
  server_directory?: string;
  generated_at?: string;
  hosted_at?: string;
  last_health_check?: string;
  error_message?: string;
  base_url: string;
  auth_config?: any;
  endpoints?: MCPEndpoint[];
  tools?: MCPTool[];
  templates?: MCPTemplate[];
  prompts?: MCPPrompt[];
  created_at: string;
  updated_at: string;
  
  // Legacy/computed fields for backwards compatibility
  lastUpdated?: string;
  url?: string;
  uptime?: string;
  responseTime?: string;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config?: any;
}

export interface MCPTemplate {
  id: string;
  name: string;
  type: 'ui' | 'prompt' | 'workflow';
  description: string;
  content: string;
  linkedPrompt?: string;
  created_at: string;
}

export interface MCPPrompt {
  id: string;
  name: string;
  content: string;
  category: 'system' | 'user' | 'tool' | 'error';
  linkedTemplates: string[];
  lastUpdated: string;
  created_at: string;
}

export interface CreateMCPServerData {
  name: string;
  description: string;
  base_url: string;
  version?: string;
  auth_config?: {
    type: string;
    credentials: any;
    headers: any;
  };
}

export function useMCPs() {
  return useQuery({
    queryKey: ['mcps'],
    queryFn: () => mcpApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMCP(id: string) {
  return useQuery({
    queryKey: ['mcp', id],
    queryFn: () => mcpApi.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMCPTools(id: string) {
  return useQuery({
    queryKey: ['mcp-tools', id],
    queryFn: () => mcpApi.getTools(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadMCPSpec() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, additionalData }: { file: File; additionalData?: any }) => 
      mcpApi.uploadSpecFile(file, additionalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
    },
  });
}

export function useUploadMCPSpecFromUrl() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { url: string; name?: string; description?: string; base_url?: string }) => 
      mcpApi.uploadSpecFromUrl(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
    },
  });
}

export function useCreateMCPServer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMCPServerData) => mcpApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
    },
  });
}

// Hosting management hooks
export interface MCPHostingStatus {
  database: {
    hosting_status: string;
    host_port?: number;
    host_url?: string;
    process_id?: number;
    server_directory?: string;
    generated_at?: string;
    hosted_at?: string;
    last_health_check?: string;
    error_message?: string;
  };
  runtime: {
    port: number;
    processId: number;
    isRunning: boolean;
    startedAt: string;
    lastHealthCheck: string;
  } | null;
}

export function useStartMCPHosting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mcpId: string) => mcpApi.startHosting(mcpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-hosting'] });
    },
  });
}

export function useStopMCPHosting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mcpId: string) => mcpApi.stopHosting(mcpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-hosting'] });
    },
  });
}

export function useRestartMCPHosting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mcpId: string) => mcpApi.restartHosting(mcpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-hosting'] });
    },
  });
}

export function useMCPHostingStatus(mcpId: string) {
  return useQuery<MCPHostingStatus>({
    queryKey: ['mcp-hosting', mcpId],
    queryFn: async () => {
      const response = await mcpApi.getHostingStatus(mcpId);
      return response.data as MCPHostingStatus;
    },
    enabled: !!mcpId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useAllMCPHostingStatus() {
  return useQuery({
    queryKey: ['mcp-hosting', 'all'],
    queryFn: async () => {
      const response = await mcpApi.getAllHostingStatus();
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useUpdateMCPTool() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ mcpId, toolId, data }: { mcpId: string; toolId: string; data: any }) => 
      mcpApi.updateTool(mcpId, toolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-tools'] });
    },
  });
}

export function useAddMCPTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ mcpId, data }: { mcpId: string; data: any }) => 
      mcpApi.addTemplate(mcpId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
    },
  });
}

export function useAddMCPPrompt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ mcpId, data }: { mcpId: string; data: any }) => 
      mcpApi.addPrompt(mcpId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
    },
  });
}

export function useDeleteMCPServer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mcpId: string) => mcpApi.delete(mcpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-hosting'] });
    },
  });
}

export function usePauseMCPHosting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mcpId: string) => mcpApi.pauseHosting(mcpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-hosting'] });
    },
  });
}

export function useUnpauseMCPHosting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mcpId: string) => mcpApi.unpauseHosting(mcpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-hosting'] });
    },
  });
} 