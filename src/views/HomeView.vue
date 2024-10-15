<script setup lang="ts">
import { useUserStore } from '@/stores/userStore';
import type { User } from '@/models/UserModel';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import { useSesionStore } from '@/stores/sesionStore';


const router = useRouter();
const authStore = useAuthStore();
const sesionStore = useSesionStore();
const userStore = useUserStore();

// Users stored in localstorage - the same as in fakebackend
const usersKey = 'vue-3-jwt-refresh-token-users';
const users = JSON.parse(localStorage.getItem(usersKey) || '[]');

function logout() {
    authStore.logout();
    sesionStore.logout();
    router.push('/');
}

</script>

<template>
    <div class="homeview">
        <!--- User info -->
        <div class="user-info">
            <h1 class="title">Hola, {{ authStore.auth.data?.firstName }}</h1>
            <h3 class="subtitle">Información de tu usuario:</h3>
            <p class="content"><span>Nombre:</span> {{ authStore.auth.data?.firstName }} {{
                authStore.auth.data?.lastName }} </p>
            <p class="content"><span>Rol:</span> {{ authStore.auth.data?.isAdmin ? 'Administrador' : 'usuario' }}</p>
        </div>
        <!-- Session info -->
        <div class="session-info">
            <h3 class="subtitle">Información de la sesión:</h3><span v-if="sesionStore.sesion.loading" class="loader"></span>
            <p class="content"><span>JWT Payload:</span> {{ sesionStore.sesion.data?.tokenPayload }}</p>
            <p class="content"><span>JWT creado a las:</span> {{ sesionStore.sesion.data?.creacion }}</p>
            <p class="content"><span>JWT expira a las:</span> {{ sesionStore.sesion.data?.expiracion }}</p>
            <p class="content"><span>JWT se refresará a las:</span> {{ sesionStore.sesion.data?.refresh }}</p>
        </div>
        <!--- List of users -->
        <div class="user-list">
            <h3 class="subtitle">Lista de usuarios:</h3>
            <ul>
                <li v-for="user in users" :key="user.id">
                    {{ user.firstName }} {{ user.lastName }} [{{ user.isAdmin ? 'Administrador' : 'Usuario' }}]
                </li>
            </ul>
            <!-- Button only visible for admin -->
            <button v-if="authStore.auth.data?.isAdmin">+Agregar usuario</button>
        </div>
        <button @click="logout()">Salir</button>
    </div>
</template>

<style scoped>
.home-view {
    padding: 10px;
    background: #2e0331;
    color: white;
    border-radius: 10px;
}

h1,
h3 {
    color: #fff;
}

.user-info,
.session-info,
.user-list {
    margin: 15px 0;
    border-radius: 10px;
    color: #fff;
}

button {
    padding: 5px 10px;
    font-size: 15px;
    border: none;
    border-radius: 5px;
    background-color: #ddd7dd;
    color: black;
    cursor: pointer;
}

button:hover {
    background-color: #d14aa4;
    color: white;
}

ul {
    list-style-type: none;
    padding: 0;
}

ul li {
    margin: 5px 0;
}
</style>
