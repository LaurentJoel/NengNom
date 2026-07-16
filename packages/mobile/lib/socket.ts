import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let _socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (_socket?.connected) return _socket;
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
  _socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  return _socket;
}

export function disconnectSocket() {
  _socket?.disconnect();
  _socket = null;
}
