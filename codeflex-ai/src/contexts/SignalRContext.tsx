"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { createHubConnection, HubConnection, ChatMessage, Notification } from '@/lib/signalr/hubConnection';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/toast';

// Remove /api suffix for SignalR hub connections
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5025/api').replace('/api', '');

interface SignalRContextType {
  chatConnection: HubConnection | null;
  notificationConnection: HubConnection | null;
  chatConnectionState: HubConnectionState;
  notificationConnectionState: HubConnectionState;
  sendMessageToCoach: (coachId: number, message: string) => Promise<void>;
  sendMessageToMember: (memberId: number, message: string) => Promise<void>;
  onChatMessage: (callback: (message: ChatMessage) => void) => void;
  offChatMessage: (callback: (message: ChatMessage) => void) => void;
  onNotification: (callback: (notification: Notification) => void) => void;
  offNotification: (callback: (notification: Notification) => void) => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [chatConnection, setChatConnection] = useState<HubConnection | null>(null);
  const [notificationConnection, setNotificationConnection] = useState<HubConnection | null>(null);
  const [chatConnectionState, setChatConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected);
  const [notificationConnectionState, setNotificationConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected);

  const chatRef = useRef<HubConnection | null>(null);
  const notificationRef = useRef<HubConnection | null>(null);
  const showToastRef = useRef(showToast);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track processed message IDs to prevent duplicates on the client
  const processedMessageIds = useRef<Set<number>>(new Set());

  // Keep the ref updated
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Helper function to attempt reconnection
  const attemptReconnect = useCallback(async (conn: HubConnection, hubName: string): Promise<boolean> => {
    if (!conn || conn.state === HubConnectionState.Connected || conn.state === HubConnectionState.Connecting) {
      return conn?.state === HubConnectionState.Connected;
    }

    try {
      console.log(`Attempting to reconnect to ${hubName}...`);
      await conn.start();
      console.log(`Reconnected to ${hubName}`);
      return true;
    } catch (err) {
      console.error(`Failed to reconnect to ${hubName}:`, err);
      return false;
    }
  }, []);

  useEffect(() => {
    // Cancel any previous connection attempt
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this connection attempt
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (!user || !token) {
      // Cleanup when user logs out
      const cleanup = async () => {
        try {
          // Clear any pending reconnect timeouts
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          const chat = chatRef.current;
          if (chat) {
            const gh = (chat as any)._globalReceiveHandler;
            if (gh) {
              try { chat.off('ReceiveMessage', gh); } catch { }
              (chat as any)._globalReceiveHandler = undefined;
            }
            try { await chat.stop(); } catch (e) { console.warn('Error stopping chat connection', e); }
            chatRef.current = null;
            setChatConnection(null);
          }

          const notification = notificationRef.current;
          if (notification) {
            try { await notification.stop(); } catch (e) { console.warn('Error stopping notification connection', e); }
            notificationRef.current = null;
            setNotificationConnection(null);
          }

          // Clear processed messages on logout
          processedMessageIds.current.clear();
        } catch (err) {
          console.error('Error during SignalR cleanup', err);
        }
      };
      void cleanup();
      return;
    }

    // Don't create new connections if they already exist and are connected/connecting
    if (chatRef.current && chatRef.current.state !== HubConnectionState.Disconnected) {
      console.log('Chat connection already exists, state:', chatRef.current.state);
      return;
    }

    // Check if aborted before proceeding
    if (abortController.signal.aborted) return;

    console.log('Creating new SignalR connections...');
    const chat = createHubConnection(`${API_BASE}/hubs/chat`);
    chatRef.current = chat;
    setChatConnection(chat);

    const notification = createHubConnection(`${API_BASE}/hubs/notifications`);
    notificationRef.current = notification;
    setNotificationConnection(notification);

    const updateChatState = () => {
      if (!abortController.signal.aborted) setChatConnectionState(chat.state);
    };
    const updateNotificationState = () => {
      if (!abortController.signal.aborted) setNotificationConnectionState(notification.state);
    };

    chat.onreconnecting(() => updateChatState());
    chat.onreconnected(() => updateChatState());
    chat.onclose((error) => {
      updateChatState();
      // If connection closed unexpectedly (not during cleanup), try to reconnect after a delay
      if (!abortController.signal.aborted && user && token && error) {
        console.log('Chat connection closed unexpectedly, scheduling reconnect...');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (chatRef.current?.state === HubConnectionState.Disconnected) {
            attemptReconnect(chatRef.current, 'chat hub');
          }
        }, 5000); // Wait 5 seconds before trying to reconnect
      }
    });

    notification.onreconnecting(() => updateNotificationState());
    notification.onreconnected(() => updateNotificationState());
    notification.onclose((error) => {
      updateNotificationState();
      // If connection closed unexpectedly, try to reconnect
      if (!abortController.signal.aborted && user && token && error) {
        console.log('Notification connection closed unexpectedly, scheduling reconnect...');
        setTimeout(() => {
          if (notificationRef.current?.state === HubConnectionState.Disconnected) {
            attemptReconnect(notificationRef.current, 'notification hub');
          }
        }, 5000);
      }
    });

    // Helper function to check if error is expected during cleanup
    const isExpectedError = (err: any) => {
      const expectedMessages = [
        'stopped during negotiation',
        'Failed to start the HttpConnection before stop',
        'The connection was stopped',
        'connection was stopped'
      ];
      return expectedMessages.some(msg => err?.message?.toLowerCase().includes(msg.toLowerCase()));
    };

    // Start chat connection with race condition protection
    if (!abortController.signal.aborted) {
      chat.start()
        .then(() => {
          if (abortController.signal.aborted) return;
          console.log('Connected to chat hub');
          updateChatState();

          try {
            const globalHandler = (payload: any) => {
              try {
                // Check for duplicate messages using messageId
                const messageId = payload?.messageId || payload?.MessageId;
                if (messageId && processedMessageIds.current.has(messageId)) {
                  console.log('Skipping duplicate message:', messageId);
                  return;
                }
                if (messageId) {
                  processedMessageIds.current.add(messageId);
                  // Clean up old message IDs after 5 minutes
                  setTimeout(() => processedMessageIds.current.delete(messageId), 5 * 60 * 1000);
                }

                const sender = payload?.senderName || payload?.sender || 'Someone';
                const text = payload?.message || payload?.text || '';
                if (text) showToastRef.current(`${sender}: ${text}`, 'info', 5000);
              } catch (inner) {
                console.error('Error processing global chat payload', inner);
              }
            };

            chat.on('ReceiveMessage', globalHandler);
            (chat as any)._globalReceiveHandler = globalHandler;
          } catch (err) {
            console.error('Failed to register global ReceiveMessage handler', err);
          }
        })
        .catch(err => {
          // Only log if not aborted and it's not an expected error
          if (!abortController.signal.aborted && !isExpectedError(err)) {
            console.error('Failed to connect to chat hub:', err);
          }
          updateChatState();
        });
    }

    // Start notification connection with race condition protection
    if (!abortController.signal.aborted) {
      notification.start()
        .then(() => {
          if (abortController.signal.aborted) return;
          console.log('Connected to notification hub');
          updateNotificationState();
        })
        .catch(err => {
          // Only log if not aborted and it's not an expected error
          if (!abortController.signal.aborted && !isExpectedError(err)) {
            console.error('Failed to connect to notification hub:', err);
          }
          updateNotificationState();
        });
    }

    return () => {
      abortController.abort();
      // Clear any pending reconnect timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Cleanup on unmount
      const cleanupOnUnmount = async () => {
        try {
          if (chat) {
            const gh = (chat as any)._globalReceiveHandler;
            if (gh) {
              try { chat.off('ReceiveMessage', gh); } catch { }
              (chat as any)._globalReceiveHandler = undefined;
            }
            try { await chat.stop(); } catch { }
          }
          if (notification) {
            try { await notification.stop(); } catch { }
          }
        } catch { }
      };
      void cleanupOnUnmount();
    };
  }, [user, token, attemptReconnect]); // Removed showToast from dependencies

  const sendMessageToCoach = useCallback(async (coachId: number, message: string) => {
    const conn = chatRef.current;
    console.log('sendMessageToCoach - conn:', conn ? 'exists' : 'null', 'state:', conn?.state);

    if (!conn) {
      throw new Error('Chat connection is not established (no connection)');
    }

    // Wait for connection if it's connecting
    if (conn.state === HubConnectionState.Connecting) {
      console.log('Connection is still connecting, waiting...');
      // Wait up to 5 seconds for connection
      const startTime = Date.now();
      while (conn.state === HubConnectionState.Connecting && Date.now() - startTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Try to reconnect if disconnected
    if (conn.state === HubConnectionState.Disconnected) {
      console.log('Connection disconnected, attempting to reconnect...');
      const reconnected = await attemptReconnect(conn, 'chat hub');
      if (!reconnected) {
        throw new Error('Chat connection lost. Please refresh the page.');
      }
    }

    if (conn.state !== HubConnectionState.Connected) {
      throw new Error(`Chat connection is not ready (state: ${conn.state})`);
    }

    await conn.invoke('SendMessageToCoach', coachId, message);
  }, [attemptReconnect]);

  const sendMessageToMember = useCallback(async (memberId: number, message: string) => {
    const conn = chatRef.current;
    console.log('sendMessageToMember - conn:', conn ? 'exists' : 'null', 'state:', conn?.state);

    if (!conn) {
      throw new Error('Chat connection is not established (no connection)');
    }

    // Wait for connection if it's connecting
    if (conn.state === HubConnectionState.Connecting) {
      console.log('Connection is still connecting, waiting...');
      const startTime = Date.now();
      while (conn.state === HubConnectionState.Connecting && Date.now() - startTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Try to reconnect if disconnected
    if (conn.state === HubConnectionState.Disconnected) {
      console.log('Connection disconnected, attempting to reconnect...');
      const reconnected = await attemptReconnect(conn, 'chat hub');
      if (!reconnected) {
        throw new Error('Chat connection lost. Please refresh the page.');
      }
    }

    if (conn.state !== HubConnectionState.Connected) {
      throw new Error(`Chat connection is not ready (state: ${conn.state})`);
    }
    await conn.invoke('SendMessageToMember', memberId, message);
  }, [attemptReconnect]);

  const onChatMessage = useCallback((callback: (message: ChatMessage) => void) => {
    const conn = chatRef.current;
    if (conn) conn.on('ReceiveMessage', callback as any);
  }, []);

  const offChatMessage = useCallback((callback: (message: ChatMessage) => void) => {
    const conn = chatRef.current;
    if (conn) conn.off('ReceiveMessage', callback as any);
  }, []);

  const onNotification = useCallback((callback: (notification: Notification) => void) => {
    const conn = notificationRef.current;
    if (conn) conn.on('ReceiveNotification', callback as any);
  }, []);

  const offNotification = useCallback((callback: (notification: Notification) => void) => {
    const conn = notificationRef.current;
    if (conn) conn.off('ReceiveNotification', callback as any);
  }, []);

  return (
    <SignalRContext.Provider
      value={{
        chatConnection,
        notificationConnection,
        chatConnectionState,
        notificationConnectionState,
        sendMessageToCoach,
        sendMessageToMember,
        onChatMessage,
        offChatMessage,
        onNotification,
        offNotification,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};
