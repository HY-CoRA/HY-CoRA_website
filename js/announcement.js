document.addEventListener("DOMContentLoaded", async () => {
    const noticesTableBody = document.querySelector(".notices-table tbody");
    const navButtons = document.querySelectorAll(".notices-nav .nav-button");
    const sortButtons = document.querySelectorAll(".notices-sort .sort-button");
    const paginationEl = document.getElementById("pagination");
    if (!noticesTableBody) return;

    const PAGE_SIZE = 20;
    const categoryMap = { 행사: "event", 모집: "recruitment", 기타: "etc" };
    let announcements = normalizeAnnouncements(
        await window.HYCorAData.getAnnouncements(false)
    );
    let currentFilter = "전체";
    let currentSortOrder = "desc";
    let currentPage = 1;

    function normalizeAnnouncements(items) {
        return (Array.isArray(items) ? items : []).map((item, index) => ({
            id: item.id || item._id || index + 1,
            published: item.published !== false,
            category_ko: item.category_ko || categoryKo(item.category),
            lastModified: item.lastModified || item.updatedAt || item.date || "",
            summary: item.summary || summarize(item.content),
            ...item,
        }));
    }

    function categoryKo(category) {
        return { event: "행사", recruitment: "모집", etc: "기타" }[category] || "기타";
    }

    function summarize(content) {
        return String(content || "").replace(/\s+/g, " ").trim().slice(0, 80);
    }

    function getFilteredItems() {
        if (currentFilter === "전체") return announcements;
        return announcements.filter(
            (item) => item.category === categoryMap[currentFilter]
        );
    }

    function getSortedItems(items) {
        return [...items].sort((a, b) => {
            const dateA = new Date(a.lastModified || a.date || 0);
            const dateB = new Date(b.lastModified || b.date || 0);
            return currentSortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
    }

    function detailHref(item) {
        const id = encodeURIComponent(item.id || item._id || "");
        const suffix = id ? `?id=${id}` : "";
        if (item.category === "recruitment") return `announcement_recruitment_detail.html${suffix}`;
        if (item.category === "event") return `announcement_notice_detail.html${suffix}`;
        return `announcement_etc_detail.html${suffix}`;
    }

    function renderAnnouncements(itemsSlice) {
        noticesTableBody.innerHTML = "";

        if (!itemsSlice.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 4;
            td.textContent = "표시할 공지가 없습니다.";
            td.style.textAlign = "center";
            tr.appendChild(td);
            noticesTableBody.appendChild(tr);
            return;
        }

        itemsSlice.forEach((item) => {
            const tr = document.createElement("tr");
            tr.style.cursor = "pointer";
            tr.title = "상세 보기";
            tr.addEventListener("click", () => {
                sessionStorage.setItem("announcement.current", JSON.stringify(item));
                window.location.href = detailHref(item);
            });

            const titleCell = document.createElement("td");
            titleCell.textContent = item.title || "제목 없음";

            const summaryCell = document.createElement("td");
            summaryCell.textContent = item.summary || "";

            const dateCell = document.createElement("td");
            dateCell.textContent = item.lastModified || item.date || "";

            const categoryCell = document.createElement("td");
            const tag = document.createElement("div");
            tag.classList.add("notice-tag", item.category || "etc");
            tag.textContent = item.category_ko || categoryKo(item.category);
            categoryCell.appendChild(tag);

            tr.append(titleCell, summaryCell, dateCell, categoryCell);
            noticesTableBody.appendChild(tr);
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
        const sorted = getSortedItems(getFilteredItems());
        const start = (currentPage - 1) * PAGE_SIZE;
        renderAnnouncements(sorted.slice(start, start + PAGE_SIZE));
        renderPagination(sorted.length, PAGE_SIZE, currentPage);
    }

    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            navButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            currentFilter = button.dataset.filter || button.textContent.trim();
            currentPage = 1;
            applyAndRender();
        });
    });

    sortButtons.forEach((button) => {
        button.addEventListener("click", () => {
            sortButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            currentSortOrder = button.dataset.sort || "desc";
            currentPage = 1;
            applyAndRender();
        });
    });

    window.renderAnnouncements = (items) => {
        announcements = normalizeAnnouncements(items).filter(
            (item) => item.published !== false
        );
        currentPage = 1;
        applyAndRender();
    };

    applyAndRender();
});
