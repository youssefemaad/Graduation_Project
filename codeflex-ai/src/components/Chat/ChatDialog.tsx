"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { HubConnectionState } from '@microsoft/signalr';
import { useSignalR } from '@/contexts/SignalRContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from '@/lib/signalr/hubConnection';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getChatHistory, markMessagesAsRead, ChatMessageDto } from '@/lib/api/chat';

interface ChatDialogProps {
  recipientId: number;
  recipientName: string;
  recipientRole: 'coach' | 'member';
  onClose: () => void;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({
  recipientId,
  recipientName,
  recipientRole,
  onClose,
}) => {
  const { user } = useAuth();
  const { 
    sendMessageToCoach, 
    sendMessageToMember, 
    onChatMessage, 
    offChatMessage,
    chatConnectionState 
  } = useSignalR();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (instant = false) => {
    if (instant && messagesContainerRef.current) {
      // Instant scroll for initial load
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        console.log('Loading chat history with user:', recipientId);
        const history = await getChatHistory(recipientId);
        console.log('Chat history loaded:', history.length, 'messages');
        
        // Convert API response to ChatMessage format
        const chatMessages: ChatMessage[] = history.map((msg: ChatMessageDto) => ({
          senderId: msg.senderId,
          senderName: msg.senderName,
          message: msg.message,
          timestamp: msg.createdAt,
          conversationId: msg.conversationId
        }));
        
        setMessages(chatMessages);
        
        // Mark messages as read
        await markMessagesAsRead(recipientId);
        
        // Scroll to bottom after loading history (with small delay to ensure DOM is updated)
        setTimeout(() => scrollToBottom(true), 50);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [recipientId]);

  // Listen for incoming messages
  useEffect(() => {
    const handleMessage = (message: ChatMessage) => {
      console.log('Received message via SignalR:', message);
      // Only add message if it's from/to this conversation
      if (message.senderId === recipientId || 
          (user?.userId && message.senderId === user.userId)) {
        setMessages(prev => {
          // Avoid duplicates
          const isDuplicate = prev.some(m => 
            m.message === message.message && 
            m.senderId === message.senderId &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000
          );
          if (isDuplicate) return prev;
          return [...prev, message];
        });
        
        // Mark as read if message is from recipient
        if (message.senderId === recipientId) {
          markMessagesAsRead(recipientId).catch(console.error);
        }
      }
    };

    console.log('Setting up message listener for chat with:', recipientName);
    onChatMessage(handleMessage);

    return () => {
      console.log('Removing message listener');
      offChatMessage(handleMessage);
    };
  }, [onChatMessage, offChatMessage, recipientName, recipientId, user?.userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending || chatConnectionState !== HubConnectionState.Connected) {
      return;
    }

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear immediately for better UX
    
    try {
      // Send message via SignalR
      console.log(`Sending message to ${recipientRole} (ID: ${recipientId}):`, messageText);
      
      if (recipientRole === 'coach') {
        console.log('Calling sendMessageToCoach with:', { coachId: recipientId, message: messageText });
        await sendMessageToCoach(recipientId, messageText);
        console.log('Message sent to coach successfully');
      } else {
        console.log('Calling sendMessageToMember with:', { memberId: recipientId, message: messageText });
        await sendMessageToMember(recipientId, messageText);
        console.log('Message sent to member successfully');
      }

      // Add to local messages immediately for better UX
      // The server will also send back MessageSent event, but we show it immediately
      setMessages(prev => [...prev, {
        senderId: user?.userId || 0,
        senderName: user?.name || 'You',
        message: messageText,
        timestamp: new Date().toISOString(),
      }]);

    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageText); // Restore message on error
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const isConnected = chatConnectionState === HubConnectionState.Connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle>Chat with {recipientName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isConnected ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  {chatConnectionState}
                </span>
              )}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading chat history...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwnMessage = msg.senderId === user?.userId;
                  return (
                    <div
                      key={index}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {isOwnMessage ? 'You' : msg.senderName}
                        </p>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                disabled={!isConnected || isSending}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!isConnected || !newMessage.trim() || isSending}
                size="icon"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
