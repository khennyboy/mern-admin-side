import toast from "./toast";

let refreshPromise: Promise<boolean> | null = null;

const refreshSession = async () => {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    return res.ok;
};

export const api = async (
    path: string,
    options: { method?: string; body?: unknown; signal?: AbortSignal } = {}
) => {
    const send = () =>
        fetch(`/api${path}`, {
            signal: options.signal,
            method: options.method ?? "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

    let res = await send();

    // Access token expired? Get a new one, then try again.
    if (res.status === 401 && !path.startsWith("/auth/login")) {
        refreshPromise ??= refreshSession().finally(() => {
            refreshPromise = null;
        });

        const refreshed = await refreshPromise;
        if (!refreshed) {
            const isTabActive = document.visibilityState === "visible" && sessionStorage.getItem("app_loaded");

            if (isTabActive) {
                toast(false, "Session expired. Redirecting...");
                setTimeout(() => window.location.replace("/login"), 1500);
            } else {
                window.location.replace("/login");
            }

            throw new Error("Session expired");
        }

        res = await send();
    }

    const data = await res.json().catch(() => ({
        success: false,
        message: "An unknown network error occurred",
    }));

    if (!res.ok) throw new Error(data?.message ?? "Something went wrong");

    sessionStorage.setItem("app_loaded", "true");
    return data;
};