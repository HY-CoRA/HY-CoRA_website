document.addEventListener("DOMContentLoaded", async () => {
    setupSectionNav();
    setupInlineLinks();
    setupFaqToggle();
    renderRecruitmentSchedule();
    await renderApplyLinks();
});

function setupFaqToggle() {
    document.querySelectorAll(".FAQ-card .faq-question").forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".FAQ-card");
            const isOpen = card.classList.contains("open");
            card.classList.toggle("open", !isOpen);
            btn.setAttribute("aria-expanded", String(!isOpen));
        });
    });
}

function setupSectionNav() {
    const navButtons = document.querySelectorAll(".about-nav .nav-button");

    navButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            navButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");

            const targetId = button.getAttribute("data-target");
            scrollToId(targetId);
        });
    });
}

function setupInlineLinks() {
    document.getElementById("FAQ-hyperlink")?.addEventListener("click", () => {
        scrollToId("faq");
    });
    document.getElementById("apply_schedule")?.addEventListener("click", () => {
        scrollToId("Schedule");
    });
    document.getElementById("inquiry")?.addEventListener("click", () => {
        scrollToId("contact");
    });
}

function scrollToId(targetId) {
    document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });
}

function getCurrentSemester() {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    // 1학기: 3/1 ~ 8/30
    if (m >= 3 && (m < 8 || (m === 8 && d <= 30))) return "semester1";
    // 2학기: 9/1 ~ 2/말일
    if (m >= 9 || m <= 2) return "semester2";
    return null; // 8/31 공백일
}

function renderRecruitmentSchedule() {
    const card = document.querySelector(".recruitment-card");
    if (!card) return;

    const year = new Date().getFullYear();
    const nextYear = year + 1;
    const febLastDay = new Date(nextYear, 2, 0).getDate(); // 윤년 자동 처리

    card.innerHTML = '<div class="recruitment-line"></div>';
    [
        { label: "1학기 정규 모집",    text: `${year}.3.1 ~ ${year}.8.30` },
        { label: "재등록 기간 (1학기)", text: `${year}.2.15` },
        { label: "2학기 정규 모집",    text: `${year}.9.1 ~ ${nextYear}.2.${febLastDay}` },
        { label: "재등록 기간 (2학기)", text: `${year}.8.15` },
    ].forEach((item) => {
        const box = document.createElement("div");
        box.className = "recruitment-box";
        box.textContent = `${item.text}: ${item.label}`;
        card.appendChild(box);
    });
}

async function renderApplyLinks() {
    const links = await window.HYCorAData.getConfig("apply-links");
    const box = document.querySelector(".apply-box");
    if (!box) return;

    const isOpen = getCurrentSemester() !== null;

    box.innerHTML = "";
    [
        {
            title: "신규 지원",
            desc: "처음 HY-CoRA에 지원하는 분들을 위한 신청 경로입니다.",
            link: links?.newMember || {},
        },
        {
            title: "재가입",
            desc: "이전 활동 이력이 있는 부원을 위한 재가입 신청 경로입니다.",
            link: links?.returning || {},
        },
    ].forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "apply-row apply-branch-row";

        const circle = document.createElement("div");
        circle.className = "apply-circle";
        circle.innerHTML = `<h2>${index + 1}</h2>`;

        const order = document.createElement("div");
        order.className = "apply-order";

        const text = document.createElement("div");
        text.className = "apply-text";
        text.innerHTML = `<h3>${item.title}</h3><p>${item.desc}</p>`;

        const button = document.createElement("a");
        button.className = "apply-button";

        if (isOpen && item.link.url) {
            button.href = item.link.url;
            button.target = "_blank";
            button.rel = "noopener";
            button.textContent = item.link.label || "지원하기";
        } else {
            button.classList.add("disabled");
            button.removeAttribute("href");
            button.textContent = "모집 기간이 아닙니다";
        }

        order.append(text, button);
        row.append(circle, order);
        box.appendChild(row);
    });
}
