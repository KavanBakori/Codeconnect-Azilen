import {io} from 'socket.io-client';

export const initSocket = () => {
    const options = {
      'force new connection': true,
      reconnectionAttempts: Infinity,
      timeout: 10000,
      transports: ['websocket'],
    };
    
    console.log('Attempting to connect to:', process.env.REACT_APP_BACKEND_URL);
    const socket = io(process.env.REACT_APP_BACKEND_URL, options);
    
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    return socket;
  };