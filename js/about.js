document.addEventListener("DOMContentLoaded", async () => {
    setupSectionNav();
    await renderAboutBanner();
    renderLeaderPhotos();
});

function setupSectionNav() {
    const navButtons = document.querySelectorAll(".about-nav .nav-button");

    navButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            navButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");

            const targetId = button.getAttribute("data-target");
            document.getElementById(targetId)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    });
}

async function renderAboutBanner() {
    const data = window.HYCorAData;
    const header = document.querySelector(".top-header");
    if (!data || !header) return;

    const config = await data.getConfig("about-banner");
    if (!config?.imageUrl) return;

    header.classList.add("has-banner-image");
    header.style.setProperty("--top-header-bg", `url("${config.imageUrl}")`);
    header.setAttribute("aria-label", config.altText || "HY-CoRA 소개 페이지 배너");
}

function renderLeaderPhotos() {
    const apiBase = window.HYCorAData?.apiBase?.() || "";

    document.querySelectorAll(".leader-card").forEach((card) => {
        const name =
            card.querySelector(".avatar")?.dataset.leaderName ||
            card.querySelector(".name")?.textContent?.trim();
        const avatar = card.querySelector(".avatar");
        if (!name || !avatar) return;

        // localStorage에서 저장된 사진 우선 로드
        const saved = localStorage.getItem(`hycora.leader.photo.${name}`);
        if (saved) {
            setAvatarImage(avatar, name, saved);
        } else {
            const img = document.createElement("img");
            img.className = "avatar-img";
            img.alt = name;
            img.src = apiBase
                ? `${apiBase}/uploads/leaders/${encodeURIComponent(name)}.jpg`
                : `uploads/leaders/${encodeURIComponent(name)}.jpg`;
            img.onerror = () => {
                img.remove();
                avatar.classList.add("avatar-fallback");
            };
            avatar.innerHTML = "";
            avatar.appendChild(img);
        }
    });
}

function setAvatarImage(avatar, name, dataUrl) {
    avatar.classList.remove("avatar-fallback");
    const img = document.createElement("img");
    img.className = "avatar-img";
    img.alt = name;
    img.src = dataUrl;
    avatar.innerHTML = "";
    avatar.appendChild(img);
}
