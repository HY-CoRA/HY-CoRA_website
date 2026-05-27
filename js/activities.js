document.addEventListener("DOMContentLoaded", async () => {
    const navButtons = document.querySelectorAll(".activities-nav .nav-button");
    const container = document.querySelector(".activities-container");
    const paginationEl = document.getElementById("pagination");
    if (!container) return;

    const PAGE_SIZE = 9;
    const statusMap = {
        모집중: "recruiting",
        진행중: "ongoing",
        예정: "scheduled",
        완료: "completed",
    };
    const statusLabels = {
        scheduled: "예정",
        recruiting: "모집중",
        ongoing: "진행중",
        completed: "완료",
    };

    let activities = normalizeActivities(await window.HYCorAData.getActivities());
    let currentFilter = "전체";
    let currentPage = 1;

    function normalizeActivities(items) {
        return (Array.isArray(items) ? items : []).map((item, index) => {
            const status = item.status === "done" ? "completed" : item.status || "scheduled";
            return {
                id: item.id || item._id || index + 1,
                ...item,
                status,
                statusLabel: item.statusLabel || statusLabels[status] || "예정",
                periodText:
                    item.periodText ||
                    item.date ||
                    formatPeriod(item.recruitStart, item.recruitEnd) ||
                    "미정",
                place: stripLabel(item.place, "장소:"),
                participants: item.participants || "",
                schedule: Array.isArray(item.schedule) ? item.schedule : [],
                images: Array.isArray(item.images) ? item.images : [],
            };
        });
    }

    function stripLabel(value, label) {
        return String(value || "").replace(label, "").trim();
    }

    function formatPeriod(start, end) {
        if (!start && !end) return "";
        if (start && end) return `${start} ~ ${end}`;
        return start || end || "";
    }

    function getFilteredItems() {
        if (currentFilter === "전체") return activities;
        return activities.filter((item) => item.status === statusMap[currentFilter]);
    }

    function renderActivities(items) {
        container.innerHTML = "";
        if (!items.length) {
            container.innerHTML =
                '<p class="empty-message">표시할 활동이 없습니다.</p>';
            return;
        }

        items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "activity-card";

            const statusDiv = document.createElement("div");
            statusDiv.className = `status ${item.status}`;
            statusDiv.textContent = item.statusLabel;

            const contentDiv = document.createElement("div");
            contentDiv.className = "card-content";

            const rows = [
                item.desc,
                item.status === "scheduled" ? "일정: 미정" : item.periodText,
                item.place ? `장소: ${item.place}` : "",
                item.participants,
            ].filter(Boolean);

            contentDiv.innerHTML = `
                <h4>${escapeHtml(item.title || "제목 없음")}</h4>
                ${rows.map((row) => `<p>${escapeHtml(row)}</p>`).join("")}
            `;

            const btn = document.createElement("button");
            btn.className = "detail-button";
            btn.type = "button";
            btn.textContent = "세부 사항";
            btn.addEventListener("click", (event) => {
                event.stopPropagation();
                sessionStorage.setItem("activities.current", JSON.stringify(item));
                window.location.href = "activities_detail.html";
            });

            card.append(statusDiv, contentDiv, btn);
            container.appendChild(card);
        });
    }

    function renderPagination(totalItems, pageSize, current) {
        if (!paginationEl) return;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        currentPage = Math.min(current, totalPages);

        const makeBtn = (label, page, disabled = false, aria = "") => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "page-btn";
            btn.textContent = label;
            if (aria) btn.setAttribute("aria-label", aria);
            if (disabled) {
                btn.disabled = true;
                btn.classList.add("disabled");
            } else {
                btn.addEventListener("click", () => {
                    currentPage = page;
                    applyAndRender();
                });
            }
            return btn;
        };

        const wrapper = document.createElement("div");
        wrapper.className = "pagination-inner";
        wrapper.appendChild(makeBtn("«", 1, currentPage === 1, "첫 페이지"));
        wrapper.appendChild(
            makeBtn("‹", Math.max(1, currentPage - 1), currentPage === 1, "이전 페이지")
        );
        for (let page = 1; page <= totalPages; page += 1) {
            const btn = makeBtn(String(page), page, false, `페이지 ${page}`);
            if (page === currentPage) btn.classList.add("active");
            wrapper.appendChild(btn);
        }
        wrapper.appendChild(
            makeBtn(
                "›",
                Math.min(totalPages, currentPage + 1),
                currentPage === totalPages,
                "다음 페이지"
            )
        );
        wrapper.appendChild(
            makeBtn("»", totalPages, currentPage === totalPages, "마지막 페이지")
        );

        paginationEl.replaceChildren(wrapper);
    }

    function applyAndRender() {
        const filtered = getFilteredItems();
        const start = (currentPage - 1) * PAGE_SIZE;
        const slice = filtered.slice(start, start + PAGE_SIZE);
        renderActivities(slice);
        renderPagination(filtered.length, PAGE_SIZE, currentPage);
    }

    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            navButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            currentFilter = button.textContent.trim();
            currentPage = 1;
            applyAndRender();
        });
    });

    window.renderActivities = (items) => {
        activities = normalizeActivities(items);
        currentPage = 1;
        applyAndRender();
    };

    applyAndRender();
});

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
