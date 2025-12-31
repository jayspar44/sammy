import axios from 'axios';
import { getAuth } from 'firebase/auth';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

client.interceptors.request.use(async (config) => {
    const auth = getAuth();
    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;
