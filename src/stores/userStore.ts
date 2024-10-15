/**
 * Store lets create a fn that defines reactive properties and methods to show an obj
 * Abstraccion de los datos de una app en un momento dato
 *  
 */
// Usamos store de pinia que nos permite pasar un fn que 
// defina propiedades y métodos reactivos para devolver - abstraccion de los datos de la app en un momento dato
// un obj con lo que queremos mostrar
import { defineStore } from "pinia";
// traemos el modelo
import type { User } from "@/models/UserModel";

// Definimos store user
export const useUserStore = defineStore('user', {
  // state devuelve obj representando estado INICIAL
  state: () => ({
    /* user is defined as User(interface) type of structure
    Saves user's info after login */
    users: [] as User[], // Starts as empty array
  }),
  // actions son métodos que permiten modificar el state de store
  actions: {
    /* setUserInfo actualiza info del usuario
    Recibe el objeto userInfo de tipo logindata */
    setUsers(users: User[]) {
      // Actualizamos el state de userInfo con los datos ingresados
      this.users = users;
    },
  },
});
