// src/api.js
import axios from 'axios';

// Create a custom axios instance specifically for your backend API
const api = axios.create({
  baseURL: 'http://localhost:8000/', // Set the base URL for this instance
  timeout: 10000, // Optional: Set a timeout (in milliseconds)
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers needed for your backend
  },
});

export default api;