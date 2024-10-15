import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/authStore'
import { fakeBackend } from './helpers/fakebackend'

import App from './App.vue'
import router from './router'

fakeBackend();
startApp();

async function startApp() {
    const app = createApp(App)

    app.use(createPinia())
    app.use(router)

    // Before showing the app
    try {
        const authStore = useAuthStore();
        await authStore.refreshToken();
    } catch (error) {
        console.warn('No hay datos de autenticación para el usuario');
        console.info('Redirigiendo a login page');
        router.push('/')
    }

    app.mount('#app')
}
