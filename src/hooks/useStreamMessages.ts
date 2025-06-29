import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  components?: any[];
}

interface UseStreamMessagesOptions {
  agentId: string;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export function useStreamMessages({ agentId, onMessage, onError }: UseStreamMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `ws://localhost:5173/ws/chat/${agentId}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          const message: Message = {
            id: data.id || Math.random().toString(36).substr(2, 9),
            role: data.role,
            content: data.content,
            timestamp: new Date(data.timestamp || Date.now()),
            components: data.components,
          };
          
          setMessages(prev => [...prev, message]);
          onMessage?.(message);
        }
        
        if (data.type === 'error') {
          onError?.(new Error(data.message));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(new Error('WebSocket connection error'));
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };
    
    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const sendMessage = (content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const message = {
      type: 'message',
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Send to server
    wsRef.current.send(JSON.stringify(message));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  };
}