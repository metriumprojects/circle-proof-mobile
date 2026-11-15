import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '../config/appConfig';
import { getActiveToken } from '../util/authController';

let socket: Socket | null = null;
let pendingSocketPromise: Promise<Socket> | null = null;

export const getExistingChatSocket = (): Socket | null => socket;

export const getChatSocket = async (): Promise<Socket> => {
  if (pendingSocketPromise) {
    return pendingSocketPromise;
  }

  pendingSocketPromise = (async () => {
    const token = await getActiveToken();
    const authToken = token ? `Bearer ${token.trim()}` : undefined;

    if (socket) {
      if (!authToken) {
        if (socket.connected) {
          socket.disconnect();
        }
        return socket;
      }

      const currentToken = (socket.auth as { token?: string } | undefined)?.token;
      if (currentToken !== authToken) {
        socket.auth = { token: authToken };
        if (socket.connected) {
          socket.disconnect();
        }
        socket.connect();
      } else if (!socket.connected) {
        socket.connect();
      }
      return socket;
    }

    socket = io(APP_CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: Boolean(authToken),
      reconnection: Boolean(authToken),
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 10000,
      auth: {
        token: authToken,
      },
    });

    socket.on('connect_error', err => {
      if (__DEV__) {
        console.warn('[chatSocket] Connection warning:', err?.message || err);
      }
    });

    return socket;
  })();

  try {
    return await pendingSocketPromise;
  } finally {
    pendingSocketPromise = null;
  }
};

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

