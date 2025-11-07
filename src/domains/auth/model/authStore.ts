// src/domains/auth/model/authStore.ts

const ACCESS_TOKEN_KEY = "access_token";
const USERNAME_KEY = "username";

/**
 * Guarda el token y el nombre de usuario en localStorage.
 */
export function saveSession(token: string, username: string) {
    if (!token || token.trim() === "") {
        console.warn("⚠️ Intento de guardar token vacío, se omitió.");
        return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, token.trim());
    localStorage.setItem(USERNAME_KEY, username.trim());
}

/**
 * Limpia completamente la sesión del usuario (logout).
 */
export function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
}

/**
 * Obtiene el token y el username actuales.
 * Si alguno no existe, devuelve null para forzar reautenticación.
 */
export function getSession() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const username = localStorage.getItem(USERNAME_KEY);

    if (!token || !username) {
        console.warn("⚠️ Sesión inválida o incompleta. Requiere iniciar sesión nuevamente.");
        return { token: null, username: null };
    }

    return { token, username };
}

/**
 * Devuelve los headers estándar con Authorization si hay sesión.
 */
export function getAuthHeaders(): HeadersInit {
    const { token } = getSession();
    return token
        ? {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        }
        : {
            "Content-Type": "application/json",
        };
}
