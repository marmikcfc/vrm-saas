import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mcpApi } from '../lib/api';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'draft' | 'error' | 'archived';
  lastUpdated: string;
  url: string;
  endpoints?: number;
  uptime?: string;
  responseTime?: string;
  tools?: MCPTool[];
  templates?: MCPTemplate[];
  prompts?: MCPPrompt[];
  created_at: string;
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
  url: string;
  authType?: string;
  apiKey?: string;
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
    mutationFn: (file: File) => mcpApi.uploadSpecFile(file),
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