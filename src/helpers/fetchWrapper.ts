import { useAuthStore } from '@/stores/authStore';

export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE')
}

function request(method: string){
    return (url: string, body?: any, {credentials}:{ credentials?: RequestCredentials } = {}) =>{
        const requestOptions: RequestInit = {
            method,
            headers: authHeader(url),
        };
        if(body){
            requestOptions.headers = {
                ...requestOptions.headers,
                'Content-Type': 'applicatino/json'
            };
            requestOptions.body = JSON.stringify(body);
        }
        if(credentials){
            requestOptions.credentials = credentials;
        }
        return fetch(url, requestOptions).then(handleResponse)
    }
}

/**
 * @description this function prepares the header to make a request
 */
function authHeader(url: string): Record<string, string>{
    const { auth } = useAuthStore();
    // Si tiene un jwtToken significa que está logueado
    const isLoggedIn = !!auth.data?.jwtToken;
    // Si existe url que empiece por (localhost)
    const isApiUrl = url.startsWith(import.meta.env.VITE_API_URL);

    if(isLoggedIn && isApiUrl){
        return { Authorization: `Bearer ${auth.data?.jwtToken}`};
    } else{
        return {};
    }
}

async function handleResponse(response: Response): Promise<any>{
    // Recibimos texto de la response
    const text = await response.text();
    const data: any = text ? JSON.parse(text): null;

    /**
     * @param error manages errors in the function
     * @returns message that can be 'token rovocado/encontrado/etc'
     */

    if(!response.ok){
        const { auth, logout } = useAuthStore();
        if([401, 403].includes(response.status) && auth.data){
            logout();
        }

        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }
}
