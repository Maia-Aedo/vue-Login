export { fakeBackend };

import type { User } from '@/models/UserModel'
import type { JwtPayload } from '@/models/JwtModel';
import type { AuthRequestBody } from '@/models/AuthReqModel';


// Users array in localstorage
const usersKey = 'vue-3-jwt-refresh-token-users';
const users: User[] = JSON.parse(localStorage.getItem(usersKey) || '[]');
// localStorage.clear()
// Add a test user in localstorage if there isn't any
const user: User = {
    id: 1,
    firstName: 'Maia',
    lastName: 'Aedo',
    username: 'test',
    password: 'test',
    isAdmin: true,
    refreshTokens: []
}

const user2: User = {
    id: 2,
    firstName: 'Mara',
    lastName: 'prueba',
    username: 'prueba',
    password: 'prueba',
    isAdmin: false,
    refreshTokens: []
}

// If there's no users, create one and save it in localstorage
if (!users.length || users.length < 2) {
    users.push(user);
    users.push(user2);
    if(users.length > 2){
        users.shift();
    }
    localStorage.setItem(usersKey, JSON.stringify(users));
}

if(users.length > 2){
    users.shift();
    localStorage.setItem(usersKey, JSON.stringify(users));
}

function fakeBackend() {
    // Intercept any fetch made
    const realFetch = window.fetch;

    window.fetch = function (url, opts: any = {}): Promise<Response> {
        return new Promise((resolve, reject) => {
            // Wrap the function in a timeout to simulate a delay as in an API request
            // If we don't set a timeout the response works automatically 
            setTimeout(handleRoute, 1000);

            // Handle fake routes as if we are making API calls
            function handleRoute() {
                if (!opts) {
                    return reject(new Error("Opts are undefined"));
                }
                const { method } = opts
                switch (true) {
                    // If the url ends w/route and request certain method, then run fn
                    case url.toString().endsWith('/users/authenticate') && method === 'POST':
                        return authenticate();

                    case url.toString().endsWith('/users/refresh-token') && method === 'POST':
                        return refreshToken();

                    case url.toString().endsWith('/users/revoke-token') && method === 'POST':
                        return revokeToken();

                    case url.toString().endsWith('/users') && method === 'GET':
                        return getUsers();

                    default:
                        // Pass through any requests not handled above
                        return realFetch(url, opts)
                            .then((response) => resolve(response))
                            .catch((error) => reject(error));
                }
            }

            // Routes functions
            function authenticate() {
                // Destructure name and pass from body in model created
                const { username, password } = body<AuthRequestBody>();
                // Tries to find the user
                const user = users.find(x => x.username === username && x.password === password);

                if (!user) return error('Usuario o contraseña incorrectos');

                // Generates refresh token and assigns it to the user
                user.refreshTokens.push(generateRefreshToken());
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok({
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isAdmin: user.isAdmin,
                    jwtToken: generateJwtToken(),
                });
            }


            function refreshToken() {
                const refreshToken = getRefreshToken();
                if (!refreshToken) return unauthorized();

                const user = users.find(x => x.refreshTokens.includes(refreshToken));
                if (!user) return unauthorized();

                // Replace old refresh token for a new one and save it
                user.refreshTokens = user.refreshTokens.filter(x => x !== refreshToken);
                user.refreshTokens.push(generateRefreshToken());
                // Update localstorage
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok({
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isAdmin: user.isAdmin,
                    jwtToken: generateJwtToken(),
                });
            }

            function revokeToken() {
                if (!isLoggedIn()) return unauthorized();

                const refreshToken = getRefreshToken();
                const _user = users.find(x => x.refreshTokens.includes(refreshToken));

                // Revoke token and save in localstorage
                if (_user !== undefined) {
                    _user.refreshTokens = _user.refreshTokens.filter(x => x !== refreshToken);
                    localStorage.setItem(usersKey, JSON.stringify(users));
                }

                return ok({ msg: 'Token revocado' });
            }

            // Obtains users, controls if the user is logged in
            function getUsers() {
                if (!isLoggedIn()) return unauthorized();
                return ok(users);
            }

            // Helper functions
            function ok(body: any) {
                resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(body)) } as Response);
            }

            function unauthorized() {
                resolve({ status: 401, text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })) } as Response);
            }

            function error(message: string) {
                resolve({ status: 400, text: () => Promise.resolve(JSON.stringify({ message })) } as Response);
            }

            function isLoggedIn(): boolean {
                // Checks if the JWT is in auth header
                const authHeader = opts.headers?.['Authorization'] || '';
                if (!authHeader.startsWith('Bearer fake-jwt-token')) return false;

                // Checks if the token expired
                try {
                    const jwtToken = JSON.parse(atob(authHeader.split('.')[1])) as JwtPayload;
                    const tokenExpired = Date.now() > jwtToken.exp * 1000;
                    if (tokenExpired) return false;
                } catch {
                    return false;
                }

                return true;
            }

            function body<T>(): T {
                return opts.body ? JSON.parse(opts.body) : {} as T;
            }

            function generateJwtToken(): string {
                // Creates token expiring in 2 min
                const tokenPayload: JwtPayload = { exp: Math.round(Date.now() / 1000 + 2 * 60) };
                const fakeJwtToken: string = `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
                return fakeJwtToken;
            }

            function generateRefreshToken(): string {
                const token: string = new Date().getTime().toString();
                // Add refresh token expiring in 7 days
                const expires: string = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
                // Insert refresh token into the cookie
                document.cookie = `fakeRefreshToken=${token}; expires=${expires}; path=/`;

                return token;
            }

            function getRefreshToken(): string {
                // Obtains refresh token from the cookie
                return (document.cookie.split(';').find(x => x.includes('fakeRefreshToken')) || '=').split('=')[1];
            }
        });
    };
}