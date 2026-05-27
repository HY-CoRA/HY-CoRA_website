(async function () {
    const data = window.HYCorAData;
    const page = document.body.dataset.adminPage;
    const qs = new URLSearchParams(location.search);

    const categoryKo = { event: "행사", recruitment: "모집", etc: "기타" };
    const statusKo = {
        scheduled: "예정",
        recruiting: "모집중",
        ongoing: "진행중",
        completed: "완료",
    };

    if (page === "site-content") initSiteContent();
    if (page === "activity-list") initActivityList();
    if (page === "activity-form") initActivityForm();
    if (page === "apply-links") initApplyLinks();
    if (page === "announcement-list") initAnnouncementList();
    if (page === "announcement-form") initAnnouncementForm();

    async function initSiteContent() {
        const form = document.getElementById("banner-form");
        const main = await data.getConfig("main-banner");
        const about = await data.getConfig("about-banner");
        const events = await data.getPastEvents();

        form.apiBase.value = data.apiBase();
        form.mainImageUrl.value = main?.imageUrl || "";
        form.mainAltText.value = main?.altText || "HY-CoRA 메인 배너";
        form.aboutImageUrl.value = about?.imageUrl || "";
        form.aboutAltText.value = about?.altText || "HY-CoRA 소개 페이지 배너";

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            data.setApiBase(form.apiBase.value);
            data.saveConfig("main-banner", {
                imageUrl: form.mainImageUrl.value.trim(),
                altText: form.mainAltText.value.trim() || "HY-CoRA 메인 배너",
            });
            data.saveConfig("about-banner", {
                imageUrl: form.aboutImageUrl.value.trim(),
                altText:
                    form.aboutAltText.value.trim() || "HY-CoRA 소개 페이지 배너",
            });
            toast("배너 설정을 저장했습니다.");
        });

        let currentEvents = events.slice();
        const renderEvents = () => {
            const editor = document.getElementById("past-events-editor");
            editor.innerHTML = "";
            currentEvents.forEach((item, index) => {
                const row = document.createElement("div");
                row.className = "admin-inline-card";
                row.innerHTML = `
                    <label>이미지 URL<input data-field="imageUrl" data-index="${index}" value="${escapeAttr(item.imageUrl)}"></label>
                    <label>제목<input data-field="title" data-index="${index}" value="${escapeAttr(item.title)}"></label>
                    <label>설명<textarea data-field="description" data-index="${index}" rows="2">${escapeHtml(item.description)}</textarea></label>
                    <button type="button" data-remove="${index}">삭제</button>
                `;
                editor.appendChild(row);
            });

            editor.querySelectorAll("[data-field]").forEach((input) => {
                input.addEventListener("input", () => {
                    currentEvents[Number(input.dataset.index)][input.dataset.field] =
                        input.value;
                });
            });
            editor.querySelectorAll("[data-remove]").forEach((button) => {
                button.addEventListener("click", () => {
                    currentEvents.splice(Number(button.dataset.remove), 1);
                    renderEvents();
                });
            });
        };

        document.getElementById("add-past-event").addEventListener("click", () => {
            currentEvents.push({
                id: Date.now(),
                imageUrl: "",
                title: "",
                description: "",
            });
            renderEvents();
        });
        document.getElementById("save-past-events").addEventListener("click", () => {
            data.savePastEvents(
                currentEvents.map((item, index) => ({ ...item, order: index + 1 }))
            );
            toast("Past Events를 저장했습니다.");
        });

        renderEvents();
    }

    async function initActivityList() {
        const tbody = document.getElementById("activity-list");
        const activities = await data.getActivities();
        tbody.innerHTML = "";

        activities.forEach((item) => {
            const status = item.status === "done" ? "completed" : item.status;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${statusKo[status] || "예정"}</td>
                <td>${escapeHtml(item.title)}</td>
                <td>${escapeHtml(item.place || "")}</td>
                <td>
                    <a href="activity-form.html?id=${encodeURIComponent(item.id || item._id)}">수정</a>
                    <button type="button" data-delete="${escapeAttr(item.id || item._id)}">삭제</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll("[data-delete]").forEach((button) => {
            button.addEventListener("click", () => {
                if (!confirm("활동을 삭제할까요?")) return;
                data.saveActivities(
                    activities.filter(
                        (item) => String(item.id || item._id) !== button.dataset.delete
                    )
                );
                location.reload();
            });
        });
    }

    async function initActivityForm() {
        const form = document.getElementById("activity-form");
        const activities = await data.getActivities();
        const id = qs.get("id");
        const current = activities.find((item) => String(item.id || item._id) === id);

        if (current) {
            form.id.value = current.id || current._id;
            form.status.value = current.status === "done" ? "completed" : current.status;
            form.title.value = current.title || "";
            form.desc.value = current.desc || "";
            form.intro.value = current.intro || "";
            form.mentor.value = current.mentor || "";
            form.role.value = current.role || "";
            form.place.value = current.place || "";
            form.participants.value = current.participants || "";
            form.recruitStart.value = current.recruitStart || "";
            form.recruitEnd.value = current.recruitEnd || "";
            form.schedule.value = (current.schedule || []).join("\n");
            form.images.value = (current.images || []).join("\n");
        }

        const syncFields = () => {
            const status = form.status.value;
            const recruiting = status === "recruiting";
            form.recruitStart.disabled = !recruiting;
            form.recruitEnd.disabled = !recruiting;
            if (!recruiting) {
                form.recruitStart.value = "";
                form.recruitEnd.value = "";
            }
        };
        form.status.addEventListener("change", syncFields);
        syncFields();

        form.images.addEventListener("input", renderActivityPreview);
        renderActivityPreview();

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const next = {
                id: form.id.value || Date.now(),
                status: form.status.value,
                statusLabel: statusKo[form.status.value],
                title: form.title.value.trim(),
                desc: form.desc.value.trim(),
                intro: form.intro.value.trim(),
                mentor: form.mentor.value.trim(),
                role: form.role.value.trim(),
                place: form.place.value.trim(),
                participants: form.participants.value.trim(),
                recruitStart: form.recruitStart.value || null,
                recruitEnd: form.recruitEnd.value || null,
                periodText:
                    form.status.value === "scheduled"
                        ? "미정"
                        : [form.recruitStart.value, form.recruitEnd.value]
                              .filter(Boolean)
                              .join(" ~ "),
                schedule: lines(form.schedule.value),
                images: lines(form.images.value),
            };
            const exists = activities.some(
                (item) => String(item.id || item._id) === String(next.id)
            );
            data.saveActivities(
                exists
                    ? activities.map((item) =>
                          String(item.id || item._id) === String(next.id)
                              ? next
                              : item
                      )
                    : [...activities, next]
            );
            location.href = "activity-list.html";
        });
    }

    async function initApplyLinks() {
        const form = document.getElementById("apply-form");
        const schedule = await data.getConfig("recruitment-schedule");
        const links = await data.getConfig("apply-links");

        form.year.value = schedule.year || new Date().getFullYear();
        form.s1Start.value = schedule.semester1?.regularStart || "";
        form.s1End.value = schedule.semester1?.regularEnd || "";
        form.s2Start.value = schedule.semester2?.regularStart || "";
        form.s2End.value = schedule.semester2?.regularEnd || "";
        form.newUrl.value = links.newMember?.url || "";
        form.newLabel.value = links.newMember?.label || "신규 지원하기";
        form.returningUrl.value = links.returning?.url || "";
        form.returningLabel.value = links.returning?.label || "재가입 신청하기";

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            data.saveConfig("recruitment-schedule", {
                year: Number(form.year.value),
                semester1: {
                    regularStart: form.s1Start.value || null,
                    regularEnd: form.s1End.value || null,
                    reregistrationDate: "02.15",
                },
                semester2: {
                    regularStart: form.s2Start.value || null,
                    regularEnd: form.s2End.value || null,
                    reregistrationDate: "08.15",
                },
            });
            data.saveConfig("apply-links", {
                newMember: {
                    url: form.newUrl.value.trim(),
                    label: form.newLabel.value.trim() || "신규 지원하기",
                },
                returning: {
                    url: form.returningUrl.value.trim(),
                    label: form.returningLabel.value.trim() || "재가입 신청하기",
                },
            });
            toast("모집안내 설정을 저장했습니다.");
        });
    }

    async function initAnnouncementList() {
        const tbody = document.getElementById("announcement-list");
        const announcements = await data.getAnnouncements(true);
        tbody.innerHTML = "";

        announcements.forEach((item) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${item.published === false ? "임시저장" : "발행"}</td>
                <td>${categoryKo[item.category] || "기타"}</td>
                <td>${escapeHtml(item.title)}</td>
                <td>${escapeHtml(item.lastModified || item.date || "")}</td>
                <td>
                    <a href="announcement-form.html?id=${encodeURIComponent(item.id || item._id)}">수정</a>
                    <button type="button" data-delete="${escapeAttr(item.id || item._id)}">삭제</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll("[data-delete]").forEach((button) => {
            button.addEventListener("click", () => {
                if (!confirm("공지를 삭제할까요?")) return;
                data.saveAnnouncements(
                    announcements.filter(
                        (item) => String(item.id || item._id) !== button.dataset.delete
                    )
                );
                location.reload();
            });
        });
    }

    async function initAnnouncementForm() {
        const form = document.getElementById("announcement-form");
        const announcements = await data.getAnnouncements(true);
        const id = qs.get("id");
        const current = announcements.find(
            (item) => String(item.id || item._id) === id
        );

        if (current) {
            form.id.value = current.id || current._id;
            form.title.value = current.title || "";
            form.category.value = current.category || "etc";
            form.date.value = current.date || "";
            form.summary.value = current.summary || "";
            form.content.value = current.content || "";
            form.capacity.value = current.capacity || "";
            form.link.value = current.link || "";
            form.published.checked = current.published !== false;
        } else {
            form.published.checked = true;
        }

        document.getElementById("parse-kakao").addEventListener("click", () => {
            const raw = prompt("카카오톡 공지 메시지를 붙여넣어 주세요.");
            if (!raw) return;
            const parsed = parseKakao(raw);
            form.title.value = parsed.title;
            form.category.value = parsed.category;
            form.date.value = parsed.date;
            form.summary.value = parsed.summary;
            form.content.value = parsed.content;
            form.published.checked = false;
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const now = new Date().toISOString().slice(0, 10).replaceAll("-", ".");
            const next = {
                id: form.id.value || Date.now(),
                title: form.title.value.trim(),
                category: form.category.value,
                category_ko: categoryKo[form.category.value],
                date: form.date.value.trim(),
                summary: form.summary.value.trim(),
                content: form.content.value.trim(),
                capacity: form.capacity.value.trim(),
                link: form.link.value.trim(),
                published: form.published.checked,
                lastModified: now,
                source: "manual",
            };
            const exists = announcements.some(
                (item) => String(item.id || item._id) === String(next.id)
            );
            data.saveAnnouncements(
                exists
                    ? announcements.map((item) =>
                          String(item.id || item._id) === String(next.id)
                              ? next
                              : item
                      )
                    : [...announcements, next]
            );
            location.href = "announcement-list.html";
        });
    }

    function renderActivityPreview() {
        const form = document.getElementById("activity-form");
        const preview = document.getElementById("activity-image-preview");
        if (!form || !preview) return;
        preview.innerHTML = "";
        lines(form.images.value).forEach((src) => {
            const img = document.createElement("img");
            img.src = src;
            img.alt = "활동 사진 미리보기";
            preview.appendChild(img);
        });
    }

    function parseKakao(raw) {
        const text = raw.trim();
        const firstLine = text.split(/\n/).find(Boolean) || "공지사항";
        const category = firstLine.includes("모집")
            ? "recruitment"
            : firstLine.includes("행사")
            ? "event"
            : "etc";
        const dateMatch = text.match(/\d{4}[.-]\d{1,2}[.-]\d{1,2}|\d{1,2}월\s*\d{1,2}일/);
        return {
            category,
            title: firstLine.replace(/\[(행사|모집|기타)\]/g, "").trim(),
            date: dateMatch ? dateMatch[0].replaceAll("-", ".") : "",
            summary: text.replace(/\s+/g, " ").slice(0, 80),
            content: text,
        };
    }

    function lines(value) {
        return String(value || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
    }

    function toast(message) {
        let el = document.querySelector(".admin-toast");
        if (!el) {
            el = document.createElement("div");
            el.className = "admin-toast";
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.classList.add("show");
        setTimeout(() => el.classList.remove("show"), 1800);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, "&#096;");
    }
})();
