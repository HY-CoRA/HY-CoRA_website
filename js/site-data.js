(function () {
    const STORAGE_PREFIX = "hycora.";
    const API_BASE_KEY = `${STORAGE_PREFIX}apiBase`;

    const defaults = {
        configs: {
            "main-banner": {
                imageUrl: "/images/index-background1.jpg",
                altText: "HY-CoRA 메인 배너",
            },
            "about-banner": {
                imageUrl: "/images/index-background2.jpg",
                altText: "HY-CoRA 소개 페이지 배너",
            },
            "apply-links": {
                newMember: {
                    url: "https://forms.gle/Vghs8HVJj976smZDA",
                    label: "신규 지원하기",
                },
                returning: {
                    url: "",
                    label: "재가입 신청하기",
                },
            },
        },
        pastEvents: [
            {
                id: 1,
                imageUrl: "/images/mentoring.jpg",
                title: "Event 1. 멘토링",
                description:
                    "다양한 코딩 강좌를 통해 멘토의 수업을 듣고 실력을 향상시킵니다.",
            },
            {
                id: 2,
                imageUrl: "/images/field_trip.jpg",
                title: "Event 2. 회사(exam) 견학",
                description:
                    "다양한 부서를 둘러보며 회사의 업무환경과 문화를 직접 체험합니다.",
            },
            {
                id: 3,
                imageUrl: "/images/mt.jpg",
                title: "Event 3. 엠티(MT)",
                description: "팀워크를 다지고 친목을 쌓는 단체활동 시간입니다.",
            },
        ],
        activities: [
            {
                id: 1,
                status: "scheduled",
                statusLabel: "예정",
                title: "2026년 1학기 파이썬 교양반 스터디",
                desc: "교양수업을 파이썬 스터디",
                periodText: "미정",
                place: "융합교육관",
                participants: "0명",
                intro: "교양수업을 위주로 진행하는 파이썬 스터디입니다.",
                schedule: [],
                images: [],
                mentor: "최현우",
                role: "멘토",
            },
            {
                id: 2,
                status: "scheduled",
                statusLabel: "예정",
                title: "2026년 1학기 C언어 스터디",
                desc: "기초 C언어 스터디",
                periodText: "미정",
                place: "융합교육관",
                participants: "0명",
                intro: "백준 문제풀이를 위주로 진행하는 C언어 스터디입니다.",
                schedule: [],
                images: [],
                mentor: "최관우",
                role: "멘토",
                phone: "010-3410-4697",
            },
            {
                id: 3,
                status: "scheduled",
                statusLabel: "예정",
                title: "2026년 1학기 자바 스터디",
                desc: "자바 스터디",
                periodText: "미정",
                place: "융합교육관",
                participants: "0명",
                intro: "백준 문제풀이를 위주로 진행하는 자바 스터디입니다.",
                schedule: [],
                images: [],
                mentor: "김한결",
                role: "멘토",
            },
            {
                id: 4,
                status: "scheduled",
                statusLabel: "예정",
                title: "2026년 1학기 자율 스터디 그룹",
                desc: "자율 스터디",
                periodText: "미정",
                place: "융합교육관",
                participants: "0명",
                intro: "자유롭게 진행되는 스터디 그룹입니다.",
                schedule: [],
                images: [],
                mentor: "강지원",
                role: "멘토",
            },
        ],
        announcements: [
            {
                id: 1,
                category: "recruitment",
                category_ko: "모집",
                title: "2026년 1학기 신규 동아리원 모집",
                summary: "HY-CoRA에서 열정적인 동아리원을 모집합니다.",
                content: `# 2026-1 HY-CoRA 등록 안내
회비: 20,000원
총무 계좌: 3333364616010 카카오뱅크 (최관우)

1학기에는 파이썬, C/C++, 자바 스터디와 야식 사업, 코라코라 열공단, MT 등이 예정되어 있습니다.

많은 참여 부탁드립니다.`,
                date: "2026.03.01 ~ 2026.06.30",
                lastModified: "2026.02.28",
                published: true,
                capacity: "0명",
                link: "https://forms.gle/Vghs8HVJj976smZDA",
            },
        ],
    };

    const clone = (value) => JSON.parse(JSON.stringify(value));

    function storageKey(name) {
        return `${STORAGE_PREFIX}${name}`;
    }

    function readLocal(name, fallback) {
        try {
            const raw = localStorage.getItem(storageKey(name));
            return raw ? JSON.parse(raw) : clone(fallback);
        } catch (error) {
            console.warn(`HY-CoRA local data read failed: ${name}`, error);
            return clone(fallback);
        }
    }

    function writeLocal(name, value) {
        localStorage.setItem(storageKey(name), JSON.stringify(value));
    }

    function apiBase() {
        return (localStorage.getItem(API_BASE_KEY) || "").replace(/\/$/, "");
    }

    function authToken() {
        return sessionStorage.getItem("hycora.admin.token") || "";
    }

    function apiReady() {
        return Boolean(apiBase());
    }

    function normalizeAssetUrl(value) {
        const url = String(value || "").trim();
        if (!url) return url;
        if (/^(https?:|data:|blob:|#)/i.test(url)) return url;
        if (url.startsWith("/")) return url;
        if (url.startsWith("../../images/")) return url.replace("../..", "");
        if (url.startsWith("../images/")) return url.replace("..", "");
        if (url.startsWith("images/")) return `/${url}`;
        if (url.startsWith("../../uploads/")) return url.replace("../..", "");
        if (url.startsWith("../uploads/")) return url.replace("..", "");
        if (url.startsWith("uploads/")) return `/${url}`;
        return url;
    }

    function normalizeConfigValue(value) {
        if (!value || typeof value !== "object") return value;
        if (!("imageUrl" in value)) return value;
        return {
            ...value,
            imageUrl: normalizeAssetUrl(value.imageUrl),
        };
    }

    function normalizePastEvent(item) {
        return {
            ...item,
            imageUrl: normalizeAssetUrl(item?.imageUrl),
        };
    }

    function normalizeActivityAssets(item) {
        if (!item || typeof item !== "object") return item;
        return {
            ...item,
            imageUrl: normalizeAssetUrl(item.imageUrl),
            mentorImg: normalizeAssetUrl(item.mentorImg),
            avatarUrl: normalizeAssetUrl(item.avatarUrl),
            images: Array.isArray(item.images)
                ? item.images.map(normalizeAssetUrl)
                : item.images,
        };
    }

    function normalizeId(item, fallback) {
        if (!item || typeof item !== "object") return item;
        return {
            id: item.id || item._id || fallback,
            ...item,
        };
    }

    function normalizeList(items) {
        return Array.isArray(items)
            ? items.map((item, index) => normalizeId(item, index + 1))
            : [];
    }

    async function requestJson(path, options = {}) {
        const base = apiBase();
        if (!base) return null;

        const headers = { ...(options.headers || {}) };
        const token = authToken();
        let body = options.body;

        if (body && !(body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(body);
        }

        if (token) headers.Authorization = `Bearer ${token}`;

        try {
            const response = await fetch(`${base}${path}`, {
                ...options,
                headers,
                body,
                credentials: options.credentials || "include",
            });
            const text = await response.text();
            const payload = text ? JSON.parse(text) : null;

            if (!response.ok) {
                const error = new Error(
                    payload?.message || payload?.error || `${response.status}`
                );
                error.status = response.status;
                error.payload = payload;
                throw error;
            }

            return payload;
        } catch (error) {
            if (error instanceof SyntaxError) {
                const parseError = new Error("API 응답을 해석할 수 없습니다.");
                parseError.cause = error;
                throw parseError;
            }
            throw error;
        }
    }

    async function fetchJson(path) {
        if (!apiReady()) return null;
        try {
            return await requestJson(path);
        } catch (error) {
            console.warn(`HY-CoRA API fallback: ${path}`, error);
            return null;
        }
    }

    async function getConfig(key) {
        const local = readLocal(`config.${key}`, defaults.configs[key] || null);
        const api = await fetchJson(`/api/config/${key}`);
        return normalizeConfigValue(api || local);
    }

    async function getPastEvents() {
        const local = readLocal("pastEvents", defaults.pastEvents);
        const api = await fetchJson("/api/events/past");
        const items = Array.isArray(api) ? api : local;
        return items.map(normalizePastEvent);
    }

    async function getActivities() {
        const local = readLocal("activities", defaults.activities);
        const api = await fetchJson("/api/activities");
        const items = Array.isArray(api) ? normalizeList(api) : local;
        return items.map(normalizeActivityAssets);
    }

    async function getActivity(id) {
        const local = readLocal("activities", defaults.activities);
        if (apiReady() && id) {
            const api = await fetchJson(`/api/activities/${encodeURIComponent(id)}`);
            if (api) return normalizeActivityAssets(normalizeId(api));
        }
        const item =
            local.find((entry) => String(entry.id || entry._id) === String(id)) ||
            null;
        return normalizeActivityAssets(item);
    }

    async function getAnnouncements(includeDrafts) {
        const local = readLocal("announcements", defaults.announcements);
        const api = await fetchJson(
            includeDrafts ? "/api/admin/announcements" : "/api/announcements"
        );
        const data = Array.isArray(api) ? normalizeList(api) : local;
        return includeDrafts ? data : data.filter((item) => item.published !== false);
    }

    async function getAnnouncement(id, includeDrafts = false) {
        const local = readLocal("announcements", defaults.announcements);
        if (apiReady() && id) {
            const path = includeDrafts
                ? `/api/admin/announcements/${encodeURIComponent(id)}`
                : `/api/announcements/${encodeURIComponent(id)}`;
            const api = await fetchJson(path);
            if (api) return normalizeId(api);
        }
        const item =
            local.find((entry) => String(entry.id || entry._id) === String(id)) ||
            null;
        return item && (includeDrafts || item.published !== false) ? item : null;
    }

    async function saveConfig(key, value) {
        if (!apiReady()) {
            writeLocal(`config.${key}`, value);
            return value;
        }
        const saved = await requestJson(`/api/config/${encodeURIComponent(key)}`, {
            method: "PUT",
            body: value,
        });
        return saved || value;
    }

    async function savePastEvents(value) {
        if (!apiReady()) {
            writeLocal("pastEvents", value);
            return value;
        }

        const saved = [];
        for (const item of value) {
            const id = item.id || item._id;
            const path = id
                ? `/api/events/past/${encodeURIComponent(id)}`
                : "/api/events/past";
            const method = id ? "PUT" : "POST";
            saved.push(await requestJson(path, { method, body: item }));
        }

        await requestJson("/api/events/past/reorder", {
            method: "PUT",
            body: { ids: saved.map((item) => item.id || item._id).filter(Boolean) },
        });
        return saved;
    }

    async function saveActivities(value) {
        if (!apiReady()) {
            writeLocal("activities", value);
            return value;
        }
        return value;
    }

    async function saveActivity(item) {
        if (!apiReady()) {
            const activities = readLocal("activities", defaults.activities);
            const id = item.id || item._id || Date.now();
            const next = { ...item, id };
            const exists = activities.some(
                (entry) => String(entry.id || entry._id) === String(id)
            );
            const updated = exists
                ? activities.map((entry) =>
                      String(entry.id || entry._id) === String(id) ? next : entry
                  )
                : [...activities, next];
            writeLocal("activities", updated);
            return next;
        }

        const id = item.id || item._id;
        const saved = await requestJson(
            id ? `/api/activities/${encodeURIComponent(id)}` : "/api/activities",
            {
                method: id ? "PUT" : "POST",
                body: item,
            }
        );
        return normalizeId(saved);
    }

    async function deleteActivity(id) {
        if (!apiReady()) {
            const activities = readLocal("activities", defaults.activities);
            writeLocal(
                "activities",
                activities.filter((item) => String(item.id || item._id) !== String(id))
            );
            return true;
        }
        await requestJson(`/api/activities/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });
        return true;
    }

    async function saveAnnouncements(value) {
        if (!apiReady()) {
            writeLocal("announcements", value);
            return value;
        }
        return value;
    }

    async function saveAnnouncement(item) {
        if (!apiReady()) {
            const announcements = readLocal("announcements", defaults.announcements);
            const id = item.id || item._id || Date.now();
            const next = { ...item, id };
            const exists = announcements.some(
                (entry) => String(entry.id || entry._id) === String(id)
            );
            const updated = exists
                ? announcements.map((entry) =>
                      String(entry.id || entry._id) === String(id) ? next : entry
                  )
                : [...announcements, next];
            writeLocal("announcements", updated);
            return next;
        }

        const id = item.id || item._id;
        const saved = await requestJson(
            id
                ? `/api/announcements/${encodeURIComponent(id)}`
                : "/api/announcements",
            {
                method: id ? "PUT" : "POST",
                body: item,
            }
        );
        return normalizeId(saved);
    }

    async function deleteAnnouncement(id) {
        if (!apiReady()) {
            const announcements = readLocal("announcements", defaults.announcements);
            writeLocal(
                "announcements",
                announcements.filter(
                    (item) => String(item.id || item._id) !== String(id)
                )
            );
            return true;
        }
        await requestJson(`/api/announcements/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });
        return true;
    }

    async function uploadLeaderPhoto(name, file) {
        const formData = new FormData();
        formData.append("photo", file);

        if (!apiReady()) {
            const dataUrl = await fileToDataUrl(file);
            localStorage.setItem(`hycora.leader.photo.${name}`, dataUrl);
            return { url: dataUrl };
        }

        return requestJson(`/api/leaders/${encodeURIComponent(name)}/photo`, {
            method: "POST",
            body: formData,
        });
    }

    async function deleteLeaderPhoto(name) {
        if (!apiReady()) {
            localStorage.removeItem(`hycora.leader.photo.${name}`);
            return true;
        }
        await requestJson(`/api/leaders/${encodeURIComponent(name)}/photo`, {
            method: "DELETE",
        });
        return true;
    }

    async function uploadActivityImages(activityId, files) {
        const formData = new FormData();
        Array.from(files || []).forEach((file) => formData.append("images", file));
        return requestJson(`/api/activities/${encodeURIComponent(activityId)}/images`, {
            method: "POST",
            body: formData,
        });
    }

    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    window.HYCorAData = {
        defaults,
        apiBase,
        apiReady,
        requestJson,
        authToken,
        setApiBase(value) {
            localStorage.setItem(API_BASE_KEY, (value || "").trim());
        },
        getConfig,
        saveConfig,
        getPastEvents,
        savePastEvents,
        getActivities,
        getActivity,
        saveActivities,
        saveActivity,
        deleteActivity,
        getAnnouncements,
        getAnnouncement,
        saveAnnouncements,
        saveAnnouncement,
        deleteAnnouncement,
        uploadLeaderPhoto,
        deleteLeaderPhoto,
        uploadActivityImages,
        readLocal,
        clone,
    };
})();
