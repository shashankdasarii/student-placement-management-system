// Centralized API Base URL using IPv4 address to prevent macOS IPv6 localhost resolution conflicts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default API_BASE_URL;
