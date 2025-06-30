import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kbApi } from '../lib/api';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  category: 'product' | 'support' | 'training';
  status: 'draft' | 'processing' | 'active' | 'error' | 'archived';
  sources: any[];
  sourceCount: number;
  config: any;
  last_updated: string;
  created_at: string;
  linkedAgents?: any[];
}

export interface CreateKnowledgeBaseData {
  name: string;
  description: string;
  category: 'product' | 'support' | 'training';
  sources?: any[];
  config?: any;
}

export function useKnowledgeBases() {
  return useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () => kbApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useKnowledgeBase(id: string) {
  return useQuery({
    queryKey: ['knowledge-base', id],
    queryFn: () => kbApi.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateKnowledgeBaseData) => kbApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    },
  });
}

export function useUpdateKnowledgeBase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateKnowledgeBaseData> }) => 
      kbApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    },
  });
}

export function useDeleteKnowledgeBase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => kbApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    },
  });
}

export function useUploadToKnowledgeBase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: FileList }) => 
      kbApi.uploadFiles(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    },
  });
}

export function useAddUrlToKnowledgeBase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, url, name }: { id: string; url: string; name?: string }) => 
      kbApi.addUrl(id, url, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    },
  });
} 