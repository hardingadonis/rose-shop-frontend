import axios from 'axios';

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Don't redirect if this is a login request that failed
			if (!error.config?.url?.includes('/auth/login')) {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				// Only redirect if not already on login page to prevent reload
				if (window.location.pathname !== '/login') {
					window.location.href = '/login';
				}
			}
		}
		return Promise.reject(error);
	},
);

export default apiClient;
