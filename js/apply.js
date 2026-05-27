document.addEventListener("DOMContentLoaded", async () => {
    setupSectionNav();
    setupInlineLinks();
    await renderRecruitmentSchedule();
    await renderApplyLinks();
});

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

async function renderRecruitmentSchedule() {
    const schedule = await window.HYCorAData.getConfig("recruitment-schedule");
    const card = document.querySelector(".recruitment-card");
    if (!card || !schedule) return;

    const year = Number(schedule.year) || new Date().getFullYear();
    const semester1 = schedule.semester1 || {};
    const semester2 = schedule.semester2 || {};

    card.innerHTML = '<div class="recruitment-line"></div>';
    [
        {
            label: "1학기 정규 모집",
            text: formatRegular(semester1.regularStart, semester1.regularEnd),
        },
        {
            label: "재등록 기간 (1학기)",
            text: `${year}.${semester1.reregistrationDate || "02.15"}`,
        },
        {
            label: "2학기 정규 모집",
            text: formatRegular(semester2.regularStart, semester2.regularEnd),
        },
        {
            label: "재등록 기간 (2학기)",
            text: `${year}.${semester2.reregistrationDate || "08.15"}`,
        },
    ].forEach((item) => {
        const box = document.createElement("div");
        box.className = "recruitment-box";
        box.textContent = `${item.text}: ${item.label}`;
        card.appendChild(box);
    });
}

function formatRegular(start, end) {
    if (!start && !end) return "미정 (일정에 따라 달라질 수 있음)";
    if (start && end) return `${formatDate(start)} ~ ${formatDate(end)}`;
    return formatDate(start || end);
}

function formatDate(value) {
    return String(value || "").replaceAll("-", ".");
}

async function renderApplyLinks() {
    const links = await window.HYCorAData.getConfig("apply-links");
    const box = document.querySelector(".apply-box");
    if (!box || !links) return;

    box.innerHTML = "";
    [
        {
            title: "신규 지원",
            desc: "처음 HY-CoRA에 지원하는 분들을 위한 신청 경로입니다.",
            link: links.newMember || {},
        },
        {
            title: "재가입",
            desc: "이전 활동 이력이 있는 부원을 위한 재가입 신청 경로입니다.",
            link: links.returning || {},
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
        button.textContent = item.link.label || "지원하기";

        if (item.link.url) {
            button.href = item.link.url;
            button.target = "_blank";
            button.rel = "noopener";
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
