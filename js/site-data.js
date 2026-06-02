(function () {
    const STORAGE_PREFIX = "hycora.";
    const API_BASE_KEY = `${STORAGE_PREFIX}apiBase`;

    const defaults = {
        configs: {
            "main-banner": {
                imageUrl: "images/index-background1.jpg",
                altText: "HY-CoRA 메인 배너",
            },
            "about-banner": {
                imageUrl: "images/index-background2.jpg",
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
                imageUrl: "images/mentoring.jpg",
                title: "Event 1. 멘토링",
                description:
                    "다양한 코딩 강좌를 통해 멘토의 수업을 듣고 실력을 향상시킵니다.",
            },
            {
                id: 2,
                imageUrl: "images/field_trip.jpg",
                title: "Event 2. 회사(exam) 견학",
                description:
                    "다양한 부서를 둘러보며 회사의 업무환경과 문화를 직접 체험합니다.",
            },
            {
                id: 3,
                imageUrl: "images/mt.jpg",
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

    async function fetchJson(path) {
        const base = apiBase();
        if (!base) return null;

        try {
            const response = await fetch(`${base}${path}`);
            if (!response.ok) throw new Error(`${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`HY-CoRA API fallback: ${path}`, error);
            return null;
        }
    }

    async function getConfig(key) {
        const local = readLocal(`config.${key}`, defaults.configs[key] || null);
        const api = await fetchJson(`/api/config/${key}`);
        return api || local;
    }

    async function getPastEvents() {
        const local = readLocal("pastEvents", defaults.pastEvents);
        const api = await fetchJson("/api/events/past");
        return Array.isArray(api) ? api : local;
    }

    async function getActivities() {
        const local = readLocal("activities", defaults.activities);
        const api = await fetchJson("/api/activities");
        return Array.isArray(api) ? api : local;
    }

    async function getAnnouncements(includeDrafts) {
        const local = readLocal("announcements", defaults.announcements);
        const api = await fetchJson(
            includeDrafts ? "/api/admin/announcements" : "/api/announcements"
        );
        const data = Array.isArray(api) ? api : local;
        return includeDrafts ? data : data.filter((item) => item.published !== false);
    }

    window.HYCorAData = {
        defaults,
        apiBase,
        setApiBase(value) {
            localStorage.setItem(API_BASE_KEY, (value || "").trim());
        },
        getConfig,
        saveConfig(key, value) {
            writeLocal(`config.${key}`, value);
        },
        getPastEvents,
        savePastEvents(value) {
            writeLocal("pastEvents", value);
        },
        getActivities,
        saveActivities(value) {
            writeLocal("activities", value);
        },
        getAnnouncements,
        saveAnnouncements(value) {
            writeLocal("announcements", value);
        },
        readLocal,
        clone,
    };
})();
