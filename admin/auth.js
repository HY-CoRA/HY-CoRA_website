/**
 * HY-CoRA Admin 인증 모듈
 * - 기본 비밀번호: hycora2026
 * - 커스텀 비밀번호는 localStorage("hycora.admin.passwordHash")에 SHA-256 해시로 저장
 * - 로그인 상태는 sessionStorage에 보관 (탭/브라우저 종료 시 자동 만료)
 */
(function () {
    const HASH_KEY = "hycora.admin.passwordHash";
    const SESSION_KEY = "hycora.admin.authed";
    const DEFAULT_PASSWORD = "hycora2026";

    /* ── SHA-256 (Web Crypto API) ─────────────────────────── */
    async function sha256(text) {
        const encoded = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    async function getStoredHash() {
        const stored = localStorage.getItem(HASH_KEY);
        return stored || sha256(DEFAULT_PASSWORD);
    }

    /* ── 로그인 오버레이 ────────────────────────────────────── */
    function showLoginOverlay() {
        const overlay = document.createElement("div");
        overlay.id = "admin-login-overlay";
        overlay.innerHTML = `
            <div class="admin-login-box">
                <div class="admin-login-logo">HY-CoRA</div>
                <h2 class="admin-login-title">관리자 로그인</h2>
                <form id="admin-login-form" novalidate>
                    <label class="admin-login-label">
                        비밀번호
                        <input
                            type="password"
                            id="admin-password-input"
                            placeholder="비밀번호 입력"
                            autocomplete="current-password"
                        />
                    </label>
                    <div id="admin-login-error" class="admin-login-error" hidden>
                        비밀번호가 올바르지 않습니다.
                    </div>
                    <button type="submit" class="admin-login-btn">로그인</button>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        const form = document.getElementById("admin-login-form");
        const input = document.getElementById("admin-password-input");
        const errorEl = document.getElementById("admin-login-error");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const password = input.value;
            if (!password) return;

            const [hash, stored] = await Promise.all([
                sha256(password),
                getStoredHash(),
            ]);

            if (hash === stored) {
                sessionStorage.setItem(SESSION_KEY, "1");
                overlay.remove();
                document.documentElement.style.visibility = "";
            } else {
                errorEl.hidden = false;
                input.value = "";
                input.focus();
                input.classList.add("admin-login-shake");
                setTimeout(() => input.classList.remove("admin-login-shake"), 500);
            }
        });

        input.focus();
    }

    /* ── 로그아웃 버튼 주입 ─────────────────────────────────── */
    function addLogoutButton() {
        const nav = document.querySelector(".admin-header nav");
        if (!nav) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "admin-button secondary admin-logout-btn";
        btn.textContent = "로그아웃";
        btn.addEventListener("click", () => {
            sessionStorage.removeItem(SESSION_KEY);
            location.reload();
        });
        nav.appendChild(btn);
    }

    /* ── 공개 API ─────────────────────────────────────────── */
    window.AdminAuth = {
        /**
         * 비밀번호 변경
         * @returns {{ success: boolean, message?: string }}
         */
        changePassword: async function (currentPassword, newPassword) {
            const [currentHash, storedHash] = await Promise.all([
                sha256(currentPassword),
                getStoredHash(),
            ]);
            if (currentHash !== storedHash) {
                return { success: false, message: "현재 비밀번호가 올바르지 않습니다." };
            }
            const newHash = await sha256(newPassword);
            localStorage.setItem(HASH_KEY, newHash);
            return { success: true };
        },
    };

    /* ── 초기화 ───────────────────────────────────────────── */
    const isAuthed = sessionStorage.getItem(SESSION_KEY) === "1";

    if (!isAuthed) {
        // 인증 전: 페이지 내용 숨기기 (로그인 오버레이 표시 전 플래시 방지)
        document.documentElement.style.visibility = "hidden";
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (isAuthed) {
            addLogoutButton();
        } else {
            showLoginOverlay();
            document.documentElement.style.visibility = "visible";
        }
    });
})();
