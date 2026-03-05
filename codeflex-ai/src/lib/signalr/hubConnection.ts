import * as signalR from '@microsoft/signalr';
import { getAuthToken } from '../api/client';

// Re-export types from SignalR
export type HubConnection = signalR.HubConnection;
export { HubConnectionState as ConnectionState } from '@microsoft/signalr';

export interface ChatMessage {
  senderId: string | number;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface Notification {
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

/**
 * Custom logger that filters out expected errors during navigation/unmount
 */
class FilteredLogger implements signalR.ILogger {
  private minLevel: signalR.LogLevel;

  constructor(minLevel: signalR.LogLevel) {
    this.minLevel = minLevel;
  }

  log(logLevel: signalR.LogLevel, message: string): void {
    if (logLevel < this.minLevel) {
      return;
    }

    // Filter out expected errors that occur during navigation
    const suppressedMessages = [
      'stopped during negotiation',
      'The connection was stopped',
      'WebSocket closed',
      'Server timeout elapsed',
      'Failed to start the HttpConnection before stop',
      'HttpConnection started',
      'Error starting HttpConnection'
    ];

    if (logLevel === signalR.LogLevel.Error) {
      const shouldSuppress = suppressedMessages.some(msg =>
        message.toLowerCase().includes(msg.toLowerCase())
      );
      if (shouldSuppress) {
        return; // Silently ignore these expected errors
      }
    }

    // Log based on level
    switch (logLevel) {
      case signalR.LogLevel.Critical:
      case signalR.LogLevel.Error:
        console.error(`[SignalR] ${message}`);
        break;
      case signalR.LogLevel.Warning:
        console.warn(`[SignalR] ${message}`);
        break;
      case signalR.LogLevel.Information:
        console.info(`[SignalR] ${message}`);
        break;
      default:
        console.debug(`[SignalR] ${message}`);
        break;
    }
  }
}

/**
 * Create a SignalR hub connection using the official Microsoft SignalR client
 */
export function createHubConnection(hubUrl: string): HubConnection {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => {
        const token = getAuthToken();
        return token || '';
      },
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        // More aggressive reconnection strategy
        // 0s, 2s, 5s, 10s, 30s, then keep trying every 30s up to 10 times
        const delays = [0, 2000, 5000, 10000, 30000];
        if (retryContext.previousRetryCount < delays.length) {
          return delays[retryContext.previousRetryCount];
        }
        // Keep trying every 30 seconds for up to 10 more attempts
        if (retryContext.previousRetryCount < 15) {
          return 30000;
        }
        // Stop retrying after 15 attempts (about 5 minutes total)
        return null;
      },
    })
    .withServerTimeout(60000) // 60 second server timeout (default is 30s)
    .withKeepAliveInterval(15000) // Send ping every 15 seconds to keep connection alive
    .configureLogging(new FilteredLogger(signalR.LogLevel.Warning))
    .build();

  // Log connection state changes (only for successful events)
  connection.onreconnecting((error) => {
    if (error && !error.message?.includes('stopped during negotiation')) {
      console.log(`SignalR reconnecting to ${hubUrl}:`, error);
    }
  });

  connection.onreconnected((connectionId) => {
    console.log(`SignalR reconnected to ${hubUrl}. Connection ID: ${connectionId}`);
  });

  connection.onclose((error) => {
    // Only log unexpected close errors
    if (error && !error.message?.includes('stopped during negotiation')) {
      console.log(`SignalR connection to ${hubUrl} closed:`, error);
    }
  });

  return connection;
}
