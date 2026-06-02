/**
 * HY-CoRA Admin 인증 모듈
 * - 백엔드 API가 설정되면 passkey(WebAuthn) 우선 인증을 사용한다.
 * - 백엔드 API가 아직 없으면 기존 로컬 비밀번호를 개발 fallback으로만 사용한다.
 */
(function () {
    const LEGACY_HASH_KEY = "hycora.admin.passwordHash";
    const LEGACY_SESSION_KEY = "hycora.admin.authed";
    const TOKEN_KEY = "hycora.admin.token";
    const USER_KEY = "hycora.admin.user";
    const DEFAULT_PASSWORD = "hycora2026";

    const data = window.HYCorAData;

    async function sha256(text) {
        const encoded = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    async function getStoredHash() {
        const stored = localStorage.getItem(LEGACY_HASH_KEY);
        return stored || sha256(DEFAULT_PASSWORD);
    }

    function isApiMode() {
        return Boolean(data?.apiReady?.());
    }

    async function apiMe() {
        if (!isApiMode()) return null;
        try {
            return await data.requestJson("/api/auth/me");
        } catch {
            clearServerSession();
            return null;
        }
    }

    function setServerSession(payload) {
        if (payload?.token) sessionStorage.setItem(TOKEN_KEY, payload.token);
        if (payload?.user) sessionStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    }

    function clearServerSession() {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    }

    function bufferToBase64Url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
    }

    function base64UrlToBuffer(value) {
        const padded = String(value).replace(/-/g, "+").replace(/_/g, "/");
        const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }
        return bytes.buffer;
    }

    function decodeCredentialOptions(options) {
        const decoded = { ...options };
        if (decoded.challenge) decoded.challenge = base64UrlToBuffer(decoded.challenge);
        if (decoded.user?.id) {
            decoded.user = {
                ...decoded.user,
                id: base64UrlToBuffer(decoded.user.id),
            };
        }
        if (Array.isArray(decoded.allowCredentials)) {
            decoded.allowCredentials = decoded.allowCredentials.map((item) => ({
                ...item,
                id: base64UrlToBuffer(item.id),
            }));
        }
        if (Array.isArray(decoded.excludeCredentials)) {
            decoded.excludeCredentials = decoded.excludeCredentials.map((item) => ({
                ...item,
                id: base64UrlToBuffer(item.id),
            }));
        }
        return decoded;
    }

    function encodeCredential(credential) {
        const json = {
            id: credential.id,
            type: credential.type,
            rawId: bufferToBase64Url(credential.rawId),
            response: {},
        };

        Object.entries(credential.response || {}).forEach(([key, value]) => {
            if (value instanceof ArrayBuffer) {
                json.response[key] = bufferToBase64Url(value);
            }
        });

        if (credential.getClientExtensionResults) {
            json.clientExtensionResults = credential.getClientExtensionResults();
        }

        return json;
    }

    async function loginWithPasskey(email) {
        if (!navigator.credentials?.get) {
            throw new Error("이 브라우저는 passkey 로그인을 지원하지 않습니다.");
        }

        const options = await data.requestJson("/api/auth/webauthn/login/options", {
            method: "POST",
            body: { email },
        });
        const credential = await navigator.credentials.get({
            publicKey: decodeCredentialOptions(options),
        });
        const result = await data.requestJson("/api/auth/webauthn/login/verify", {
            method: "POST",
            body: { email, credential: encodeCredential(credential) },
        });
        setServerSession(result);
        return result;
    }

    async function requestMagicLink(email) {
        if (!email) throw new Error("이메일을 입력해 주세요.");
        return data.requestJson("/api/auth/magic-link/request", {
            method: "POST",
            body: { email },
        });
    }

    async function verifyLegacyPassword(password) {
        const [hash, stored] = await Promise.all([sha256(password), getStoredHash()]);
        if (hash !== stored) throw new Error("비밀번호가 올바르지 않습니다.");
        sessionStorage.setItem(LEGACY_SESSION_KEY, "1");
    }

    function showLoginOverlay() {
        const apiMode = isApiMode();
        const overlay = document.createElement("div");
        overlay.id = "admin-login-overlay";
        overlay.innerHTML = `
            <div class="admin-login-box">
                <div class="admin-login-logo">HY-CoRA</div>
                <h2 class="admin-login-title">관리자 로그인</h2>
                <form id="admin-login-form" novalidate>
                    <label class="admin-login-label">
                        이메일
                        <input
                            type="email"
                            id="admin-email-input"
                            placeholder="admin@hycora.com"
                            autocomplete="email"
                        />
                    </label>
                    ${
                        apiMode
                            ? ""
                            : `<label class="admin-login-label">
                                임시 로컬 비밀번호
                                <input
                                    type="password"
                                    id="admin-password-input"
                                    placeholder="백엔드 연결 전 개발용"
                                    autocomplete="current-password"
                                />
                            </label>`
                    }
                    <div id="admin-login-error" class="admin-login-error" hidden></div>
                    ${
                        apiMode
                            ? `<button type="submit" class="admin-login-btn">Passkey로 로그인</button>
                               <button type="button" id="admin-magic-link-btn" class="admin-login-btn secondary">Magic link 받기</button>`
                            : `<button type="submit" class="admin-login-btn">임시 로컬 로그인</button>`
                    }
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        const form = document.getElementById("admin-login-form");
        const emailInput = document.getElementById("admin-email-input");
        const passwordInput = document.getElementById("admin-password-input");
        const errorEl = document.getElementById("admin-login-error");
        const magicBtn = document.getElementById("admin-magic-link-btn");

        const showError = (message) => {
            errorEl.hidden = false;
            errorEl.textContent = message;
            (passwordInput || emailInput).classList.add("admin-login-shake");
            setTimeout(
                () => (passwordInput || emailInput).classList.remove("admin-login-shake"),
                500
            );
        };

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            errorEl.hidden = true;

            try {
                if (apiMode) {
                    await loginWithPasskey(emailInput.value.trim());
                } else {
                    await verifyLegacyPassword(passwordInput.value);
                }
                overlay.remove();
                document.documentElement.style.visibility = "";
                addLogoutButton();
            } catch (error) {
                showError(error.message || "로그인에 실패했습니다.");
            }
        });

        magicBtn?.addEventListener("click", async () => {
            errorEl.hidden = true;
            try {
                await requestMagicLink(emailInput.value.trim());
                errorEl.hidden = false;
                errorEl.style.color = "#177a3c";
                errorEl.textContent = "로그인 링크를 보냈습니다. 메일함을 확인해 주세요.";
            } catch (error) {
                errorEl.style.color = "";
                showError(error.message || "Magic link 요청에 실패했습니다.");
            }
        });

        (apiMode ? emailInput : passwordInput)?.focus();
    }

    function addLogoutButton() {
        const nav = document.querySelector(".admin-header nav");
        if (!nav || nav.querySelector(".admin-logout-btn")) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "admin-button secondary admin-logout-btn";
        btn.textContent = "로그아웃";
        btn.addEventListener("click", async () => {
            try {
                if (isApiMode()) {
                    await data.requestJson("/api/auth/logout", { method: "POST" });
                }
            } catch {
                // 클라이언트 세션은 항상 정리한다.
            }
            clearServerSession();
            sessionStorage.removeItem(LEGACY_SESSION_KEY);
            location.reload();
        });
        nav.appendChild(btn);
    }

    window.AdminAuth = {
        async changePassword(currentPassword, newPassword) {
            if (isApiMode()) {
                return {
                    success: false,
                    message: "비밀번호 대신 passkey 관리 기능을 사용해 주세요.",
                };
            }
            const [currentHash, storedHash] = await Promise.all([
                sha256(currentPassword),
                getStoredHash(),
            ]);
            if (currentHash !== storedHash) {
                return { success: false, message: "현재 비밀번호가 올바르지 않습니다." };
            }
            const newHash = await sha256(newPassword);
            localStorage.setItem(LEGACY_HASH_KEY, newHash);
            return { success: true };
        },
        clearServerSession,
    };

    document.documentElement.style.visibility = "hidden";

    document.addEventListener("DOMContentLoaded", async () => {
        const authed = isApiMode()
            ? Boolean(await apiMe())
            : sessionStorage.getItem(LEGACY_SESSION_KEY) === "1";

        if (authed) {
            document.documentElement.style.visibility = "";
            addLogoutButton();
        } else {
            showLoginOverlay();
            document.documentElement.style.visibility = "visible";
        }
    });
})();
