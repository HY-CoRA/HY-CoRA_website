document.addEventListener("DOMContentLoaded", async () => {
    const data = window.HYCorAData;
    const banner = await data.getConfig("main-banner");
    renderMainBanner(banner);
    renderPastEvents(await data.getPastEvents());
});

function renderMainBanner(config) {
    const placeholder = document.querySelector(".intro-image-placeholder");
    if (!placeholder) return;

    const imageUrl = config?.imageUrl || "";
    const altText = config?.altText || "HY-CoRA 메인 배너";
    placeholder.innerHTML = "";

    if (!imageUrl) {
        placeholder.classList.add("is-empty");
        return;
    }

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = altText;
    img.onerror = () => {
        placeholder.classList.add("is-empty");
        img.remove();
    };
    placeholder.appendChild(img);
}

function renderPastEvents(events) {
    const grid = document.querySelector(".past-events-grid");
    if (!grid) return;

    grid.innerHTML = "";
    if (!Array.isArray(events) || events.length === 0) {
        grid.innerHTML =
            '<p class="empty-message">등록된 이벤트가 없습니다.</p>';
        return;
    }

    events
        .slice()
        .sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0))
        .forEach((event) => {
            const card = document.createElement("div");
            card.className = "event-card";

            const imageWrap = document.createElement("div");
            imageWrap.className = "event-image-placeholder";

            if (event.imageUrl) {
                const img = document.createElement("img");
                img.src = event.imageUrl;
                img.alt = event.title || "Past Event";
                img.onerror = () => {
                    imageWrap.classList.add("is-empty");
                    img.remove();
                };
                imageWrap.appendChild(img);
            } else {
                imageWrap.classList.add("is-empty");
            }

            const title = document.createElement("h4");
            title.textContent = event.title || "제목 없음";

            const desc = document.createElement("p");
            desc.textContent = event.description || "";

            card.append(imageWrap, title, desc);
            grid.appendChild(card);
        });
}

window.renderPastEvents = renderPastEvents;
