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

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            await withBusy(button, "저장 중...", async () => {
                data.setApiBase(form.apiBase.value);
                await data.saveConfig("main-banner", {
                    imageUrl: form.mainImageUrl.value.trim(),
                    altText: form.mainAltText.value.trim() || "HY-CoRA 메인 배너",
                });
                await data.saveConfig("about-banner", {
                    imageUrl: form.aboutImageUrl.value.trim(),
                    altText:
                        form.aboutAltText.value.trim() || "HY-CoRA 소개 페이지 배너",
                });
                toast("배너 설정을 저장했습니다.");
            });
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
        document.getElementById("save-past-events").addEventListener("click", async (event) => {
            await withBusy(event.currentTarget, "저장 중...", async () => {
                currentEvents = await data.savePastEvents(
                    currentEvents.map((item, index) => ({ ...item, order: index + 1 }))
                );
                toast("Past Events를 저장했습니다.");
                renderEvents();
            });
        });

        renderEvents();
        initLeaderPhotos();

        // 비밀번호 변경
        const pwForm = document.getElementById("change-password-form");
        const pwMsg = document.getElementById("change-password-msg");
        if (pwForm) {
            pwForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const current = pwForm.currentPassword.value;
                const next = pwForm.newPassword.value;
                const confirm = pwForm.confirmPassword.value;

                pwMsg.hidden = false;
                pwMsg.style.color = "#c0392b";

                if (!current || !next) {
                    pwMsg.textContent = "모든 항목을 입력해 주세요.";
                    return;
                }
                if (next !== confirm) {
                    pwMsg.textContent = "새 비밀번호가 일치하지 않습니다.";
                    return;
                }
                if (next.length < 6) {
                    pwMsg.textContent = "새 비밀번호는 6자 이상이어야 합니다.";
                    return;
                }

                const result = await window.AdminAuth.changePassword(current, next);
                if (result.success) {
                    pwMsg.style.color = "#177a3c";
                    pwMsg.textContent = "비밀번호가 변경되었습니다.";
                    pwForm.reset();
                } else {
                    pwMsg.textContent = result.message;
                }
            });
        }
    }

    async function initLeaderPhotos() {
        const grid = document.getElementById("leader-photos-grid");
        if (!grid) return;

        let names = [];
        try {
            const res = await fetch("../about.html");
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, "text/html");
            names = [...doc.querySelectorAll(".avatar[data-leader-name]")]
                .map((el) => el.dataset.leaderName)
                .filter(Boolean);
        } catch {
            grid.innerHTML = "<p>임원진 정보를 불러올 수 없습니다.</p>";
            return;
        }

        if (names.length === 0) {
            grid.innerHTML = "<p>등록된 임원진이 없습니다.</p>";
            return;
        }

        names.forEach((name) => {
            const saved = localStorage.getItem(`hycora.leader.photo.${name}`);

            const card = document.createElement("div");
            card.className = "admin-leader-photo-card";

            const preview = document.createElement("div");
            preview.className = "admin-leader-preview";
            if (saved) {
                const img = document.createElement("img");
                img.src = saved;
                img.alt = name;
                preview.appendChild(img);
            } else if (data.apiReady()) {
                const img = document.createElement("img");
                img.src = `${data.apiBase()}/uploads/leaders/${encodeURIComponent(name)}.jpg`;
                img.alt = name;
                img.onerror = () => img.remove();
                preview.appendChild(img);
            }

            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.style.display = "none";

            const nameLabel = document.createElement("div");
            nameLabel.className = "admin-leader-name";
            nameLabel.textContent = name;

            const uploadBtn = document.createElement("button");
            uploadBtn.type = "button";
            uploadBtn.className = "admin-btn";
            uploadBtn.textContent = "사진 업로드";
            uploadBtn.addEventListener("click", () => fileInput.click());

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "admin-btn admin-btn-danger";
            deleteBtn.textContent = "사진 삭제";
            deleteBtn.disabled = !saved && !data.apiReady();
            deleteBtn.addEventListener("click", async () => {
                if (!confirm(`${name}의 사진을 삭제할까요?`)) return;
                await withBusy(deleteBtn, "삭제 중...", async () => {
                    await data.deleteLeaderPhoto(name);
                    preview.innerHTML = "";
                    deleteBtn.disabled = true;
                    toast(`${name} 사진이 삭제되었습니다.`);
                });
            });

            fileInput.addEventListener("change", async () => {
                const file = fileInput.files[0];
                if (!file) return;
                await withBusy(uploadBtn, "업로드 중...", async () => {
                    const result = await data.uploadLeaderPhoto(name, file);
                    const imageUrl =
                        result?.url ||
                        result?.imageUrl ||
                        `${data.apiBase()}/uploads/leaders/${encodeURIComponent(name)}.jpg`;
                    preview.innerHTML = "";
                    const img = document.createElement("img");
                    img.src = imageUrl;
                    img.alt = name;
                    preview.appendChild(img);
                    deleteBtn.disabled = false;
                    toast(`${name} 사진이 저장되었습니다.`);
                });
                fileInput.value = "";
            });

            const btnRow = document.createElement("div");
            btnRow.className = "admin-leader-btn-row";
            btnRow.appendChild(uploadBtn);
            btnRow.appendChild(deleteBtn);

            card.appendChild(fileInput);
            card.appendChild(preview);
            card.appendChild(nameLabel);
            card.appendChild(btnRow);
            grid.appendChild(card);
        });
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
            button.addEventListener("click", async () => {
                if (!confirm("활동을 삭제할까요?")) return;
                await withBusy(button, "삭제 중...", async () => {
                    await data.deleteActivity(button.dataset.delete);
                    location.reload();
                });
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
        form.imageFiles?.addEventListener("change", async () => {
            const files = form.imageFiles.files;
            if (!files?.length) return;
            if (!data.apiReady()) {
                toast("백엔드 API Base URL 설정 후 업로드할 수 있습니다.");
                form.imageFiles.value = "";
                return;
            }
            const activityId = form.id.value || id;
            if (!activityId) {
                toast("활동을 먼저 저장한 뒤 사진을 업로드해 주세요.");
                form.imageFiles.value = "";
                return;
            }

            await withBusy(form.imageFiles, "업로드 중...", async () => {
                const result = await data.uploadActivityImages(activityId, files);
                const urls = normalizeUploadedUrls(result);
                const current = lines(form.images.value);
                form.images.value = [...current, ...urls].join("\n");
                renderActivityPreview();
                toast("활동 사진을 업로드했습니다.");
            });
            form.imageFiles.value = "";
        });
        renderActivityPreview();

        form.addEventListener("submit", async (event) => {
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
            const button = form.querySelector('button[type="submit"]');
            await withBusy(button, "저장 중...", async () => {
                await data.saveActivity(next);
                location.href = "activity-list.html";
            });
        });
    }

    async function initApplyLinks() {
        const form = document.getElementById("apply-form");
        const links = await data.getConfig("apply-links");

        form.newUrl.value = links.newMember?.url || "";
        form.newLabel.value = links.newMember?.label || "신규 지원하기";
        form.returningUrl.value = links.returning?.url || "";
        form.returningLabel.value = links.returning?.label || "재가입 신청하기";

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            await withBusy(button, "저장 중...", async () => {
                await data.saveConfig("apply-links", {
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
            button.addEventListener("click", async () => {
                if (!confirm("공지를 삭제할까요?")) return;
                await withBusy(button, "삭제 중...", async () => {
                    await data.deleteAnnouncement(button.dataset.delete);
                    location.reload();
                });
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

        document.getElementById("parse-kakao").addEventListener("click", async (event) => {
            const raw = prompt("카카오톡 공지 메시지를 붙여넣어 주세요.");
            if (!raw) return;
            const parsed = await parseKakao(raw, event.currentTarget);
            form.title.value = parsed.title;
            form.category.value = parsed.category;
            form.date.value = parsed.date;
            form.summary.value = parsed.summary;
            form.content.value = parsed.content;
            form.capacity.value = parsed.capacity || form.capacity.value;
            form.link.value = parsed.link || form.link.value;
            form.published.checked = false;
        });

        form.addEventListener("submit", async (event) => {
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
            const button = form.querySelector('button[type="submit"]');
            await withBusy(button, "저장 중...", async () => {
                await data.saveAnnouncement(next);
                location.href = "announcement-list.html";
            });
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

    async function parseKakao(raw, button) {
        return withBusy(button, "파싱 중...", async () =>
            normalizeParsedKakao(parseKakaoLocal(raw), raw)
        );
    }

    function parseKakaoLocal(raw) {
        const text = raw.trim();
        const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
        const firstLine = lines.find((line) => !/^[-=*_\s]+$/.test(line)) || "공지사항";
        const category = /모집|지원|신청|동아리원|신입/.test(text)
            ? "recruitment"
            : /행사|특강|세미나|견학|MT|엠티|야식|열공단/.test(text)
            ? "event"
            : "etc";
        const dateMatch = text.match(
            /(\d{4}[.-]\d{1,2}[.-]\d{1,2}|\d{1,2}월\s*\d{1,2}일)(\s*[~\-–]\s*(\d{4}[.-]\d{1,2}[.-]\d{1,2}|\d{1,2}월\s*\d{1,2}일))?/
        );
        const capacityMatch = text.match(/(?:정원|인원|모집\s*인원)\s*[:：]?\s*([0-9]+명?)/);
        const linkMatch = text.match(/https?:\/\/[^\s)]+/);
        const labeledTitle = lines.find((line) => /^(제목|공지명)\s*[:：]/.test(line));
        const labeledDate = lines.find((line) => /^(일시|일자|기간|날짜)\s*[:：]/.test(line));
        const labeledCapacity = lines.find((line) => /^(정원|인원|모집\s*인원)\s*[:：]/.test(line));
        const labeledLink = lines.find((line) => /^(링크|신청|지원)\s*[:：]/.test(line));

        return {
            category,
            title: cleanLabeledValue(labeledTitle) || firstLine.replace(/\[(행사|모집|기타|공지)\]/g, "").trim(),
            date: cleanLabeledValue(labeledDate) || (dateMatch ? dateMatch[0].replaceAll("-", ".") : ""),
            summary: text.replace(/\s+/g, " ").slice(0, 80),
            content: text,
            capacity: cleanLabeledValue(labeledCapacity) || (capacityMatch ? capacityMatch[1] : ""),
            link: cleanLabeledValue(labeledLink) || (linkMatch ? linkMatch[0] : ""),
        };
    }

    function normalizeParsedKakao(parsed, raw) {
        const local = parseKakaoLocal(raw);
        return {
            category: parsed?.category || local.category,
            title: parsed?.title || local.title,
            date: parsed?.date || local.date,
            summary: parsed?.summary || local.summary,
            content: parsed?.content || parsed?.body || local.content,
            capacity: parsed?.capacity || local.capacity,
            link: parsed?.link || parsed?.url || local.link,
        };
    }

    function normalizeUploadedUrls(result) {
        if (Array.isArray(result)) {
            return result
                .map((item) => (typeof item === "string" ? item : item.url || item.imageUrl))
                .filter(Boolean);
        }
        if (Array.isArray(result?.images)) {
            return result.images
                .map((item) => (typeof item === "string" ? item : item.url || item.imageUrl))
                .filter(Boolean);
        }
        return [result?.url || result?.imageUrl].filter(Boolean);
    }

    function cleanLabeledValue(line) {
        return String(line || "").replace(/^[^:：]+[:：]\s*/, "").trim();
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

    async function withBusy(button, label, task) {
        if (!button) return task();
        const original = button.textContent;
        button.disabled = true;
        button.textContent = label;
        try {
            return await task();
        } catch (error) {
            toast(error.status === 401 ? "로그인이 필요합니다." : error.message || "처리 중 오류가 발생했습니다.");
            if (error.status === 401) {
                window.AdminAuth?.clearServerSession?.();
            }
            throw error;
        } finally {
            button.disabled = false;
            button.textContent = original;
        }
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
