const API_BASE =
    (import.meta as any).env?.VITE_API_BASE || "https://ecoroute-backend-production.up.railway.app";

export async function loginRequest(username: string, password: string) {
    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Credenciales inválidas");
    }

    return res.json(); // { access_token, token_type }
}

export async function registerRequest(
    username: string,
    email: string,
    password: string
) {
    const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al registrar usuario");
    }

    return res.json();
}

export function getGoogleAuthUrl() {
    return `${API_BASE}/auth/google/login`;
}
