import { fetchWrapper } from "@/helpers/fetchWrapper";
import type { User } from "@/models/UserModel";
import { defineStore } from "pinia";
import router from "@/router";

const baseUrl = `${import.meta.env.VITE_API_URL}/users`

/**
 * @param logout revokes token so it can't be used after logout
 */

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        auth: {} as { loading: boolean, data?: User | null, refreshTokenTimeout: number | null }
    }),
    actions: {
        // Setting up a timeout in backend means the fn will have to wait for a resp
        // Therefore, handleResponse in fetchWrapper is async and so is login
        async login(username: string, password: string) {
            this.auth.data = await fetchWrapper.post(`${baseUrl}/authenticate`, { username, password }, { credentials: 'include' });
            // This executes the cicle (RT fn and SRTT fn below)
            this.startRefreshTokenTimer();
        },
        logout() {
            fetchWrapper.post(`${baseUrl}/revoke-token`, {}, { credentials: 'include' });
            this.stopRefreshTokenTimer();
            // The user data goes empty
            this.auth.data = null;
            router.push({ name: 'login' })
        },
        async refreshToken() {
            try {
                this.auth.data = await fetchWrapper.post(`${baseUrl}/refresh-token`, {}, { credentials: 'include' });
                this.startRefreshTokenTimer();
            } catch(error){
                console.log('Error al refrescar token', error);
                throw error;
            }
        },
        startRefreshTokenTimer() {
            if (!this.auth.data || !this.auth.data.jwtToken) return;

            // Parse a base64 JSON obj 
            const jwtBase64 = this.auth.data.jwtToken.split('.')[1]; // split returns array, index 1 is where the payload is
            const decodedJwtToken = JSON.parse(atob(jwtBase64))

            // timeout to refesh the token before it expires
            const expires = new Date(decodedJwtToken.exp * 1000) // get exp from decoded and multiply to get it in seconds
            const timeout = expires.getTime() - Date.now() - (60 * 1000);
            this.auth.refreshTokenTimeout = setTimeout(this.refreshToken, timeout);
        },
        stopRefreshTokenTimer() {
            if (this.auth.refreshTokenTimeout) {
                clearTimeout(this.auth.refreshTokenTimeout);
                this.auth.refreshTokenTimeout = null
            }
        }
    }
})
