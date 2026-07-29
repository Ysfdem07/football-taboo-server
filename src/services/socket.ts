// src/services/socket.ts
import { io } from 'socket.io-client';
import Constants from 'expo-constants';

// Default production URL - Railway (has tournament events)
export let SOCKET_URL = 'https://footballtaboo-server-production.up.railway.app';
// export let SOCKET_URL = 'https://futtaboo.onrender.com'; // old Render fallback

// Override with local development URL when running in Expo Go (debug mode)
// Commented out to force Expo Go to connect to Render.com for cross-play testing
/*
if (__DEV__) {
  const manifest = (Constants as any).manifest || (Constants as any).expoConfig || (Constants as any).manifest2;
  const debuggerHost = manifest?.debuggerHost || manifest?.hostUri;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (
      host.includes('loca.lt') || 
      host.includes('ngrok') || 
      host.includes('serveo') || 
      host.includes('lhr.life') ||
      host.includes('localhost.run')
    ) {
      // It's a tunnel! Socket server is proxied on the same host
      SOCKET_URL = `https://${host}`;
    } else {
      // It's local LAN! Connect to port 3000 of the debugger host IP
      SOCKET_URL = `http://${host}:3000`;
    }
  }
}
*/

let socket: any = null;

const socketOptions = {
  extraHeaders: {
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true'
  }
};

// Geriye dönük uyumluluk için boş bir fonksiyon (Lobby ekranı hata vermesin diye)
export const fetchTunnelUrl = async (): Promise<string | null> => {
  return SOCKET_URL;
};

export const initSocketWithUrl = (url: string) => {
  SOCKET_URL = url;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(SOCKET_URL, socketOptions);
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, socketOptions);
  }
  return socket;
};
