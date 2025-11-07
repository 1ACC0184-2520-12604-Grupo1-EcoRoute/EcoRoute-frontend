export function saveSession(token: string, username: string) {
    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("token", token);
}

export function clearSession() {
    sessionStorage.clear();
    localStorage.clear();
}

export function isLoggedIn(): boolean {
    return sessionStorage.getItem("loggedIn") === "true";
}

export function getUsername(): string | null {
    return sessionStorage.getItem("username");
}

export function getToken(): string | null {
    return sessionStorage.getItem("token");
}
