import { defineStore } from 'pinia';
import type { SesionState } from '@/models/SesionStateModel';
import { fetchWrapper } from '@/helpers/fetchWrapper';
import type { Sesion } from '@/models/SesionModel';
import router from '@/router';


const baseUrl = `${import.meta.env.VITE_API_URL}/users`

export const useSesionStore = defineStore({
    id: 'sesion',
    // state: (): SesionState => ({
    //     loading: false,
    //     data: null
    // }),
    state: () => ({
        // State as SesionState type of
        sesion: {
            loading: false,
            data: null,
            tokenTimeout: null
        } as SesionState & { tokenTimeout: number | null }
    }),
    actions: {
        /**
         * @description update session's data with info from sesion model.
         * @param tokenPayload - JWT payload
         * @param creacion - TIME of the creation of the token
         * @param refresh - TIME of the token's last refresh
         * @param expiracion - TIME of token's expiration
         */
        async update(tokenPayload: string, creacion: Date, refresh: Date, expiracion: Date) {
            this.sesion.data = {
                tokenPayload,
                creacion,
                refresh,
                expiracion
            } as Sesion// Assigns type Sesion to data (data is Sesion type of)
            console.log('Datos actualizados', this.sesion.data)
        },
        async refreshToken() {
            this.sesion.loading = true;
            try {
                const tokenResponse = await fetchWrapper.post(`${baseUrl}/refresh-token`, {}, { credentials: 'include' });
                const token = tokenResponse.jwtToken;
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                const creacion = new Date();
                const expiracion = new Date(decodedToken.exp * 1000);
                const refresh = new Date(expiracion.getTime() - 60 * 1000);
                
                console.log(token)

                // Updates session and restarts temp
                this.update(token, creacion, expiracion, refresh);
                this.startTokenTimer(token);
            } catch (error) {
                console.log('Error refrescando token', error)
                throw error;
            }
            this.sesion.loading = false;
        },
        startTokenTimer(token: string) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const creacion = new Date();
            const expiracion = new Date(decodedToken.exp * 1000);
            const refresh = new Date(expiracion.getTime() - (60 * 1000));
            // Updates 'fields' from data with new info
            this.update(token, creacion, refresh, expiracion)

            const timeout = expiracion.getTime() - Date.now() - (60 * 1000);
            
            this.sesion.tokenTimeout = setTimeout(this.refreshToken, timeout);
        },
            // Bind to make sure refresh token is called correctly
        stopTokenTimer(){
            if(this.sesion.tokenTimeout){
                clearTimeout(this.sesion.tokenTimeout);
                this.sesion.tokenTimeout = null
            }
        },
        logout(){
            fetchWrapper.post(`${baseUrl}/revoke-token`, {}, { credentials: 'include'});
            this.stopTokenTimer();
            this.sesion.data = null;
            router.push('/')
            console.log('Cerrando sesion')
        }
    }
})
