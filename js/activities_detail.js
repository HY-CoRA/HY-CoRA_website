// js/activities_detail.js
document.addEventListener("DOMContentLoaded", async () => {
    const q = (sel, root = document) => root.querySelector(sel);
    const esc = (s) => String(s ?? "");
    const norm = (s) =>
        String(s ?? "")
            .replace(/\s+/g, "")
            .trim();
    const byH2 = (label) => {
        const h2s = Array.from(document.querySelectorAll("h2"));
        const hit = h2s.find((h) => norm(h.textContent) === norm(label));
        return hit ? hit.closest(".info-box") : null;
    };

    // === URL id 우선, 기존 세션 데이터는 fallback ===
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const raw =
        sessionStorage.getItem("activities.current") ||
        sessionStorage.getItem("activity.current");
    let data = null;
    if (id && window.HYCorAData?.getActivity) {
        data = await window.HYCorAData.getActivity(id);
    }
    if (!data && raw) data = JSON.parse(raw);
    if (!data) return;

    // === 상단 타이틀/메타 ===
    const h2 = q(".top-header h2");
    const h5 = q(".top-header h5:last-of-type");
    if (h2) h2.textContent = data.title || "";
    if (h5)
        h5.textContent = [
            data.status === "scheduled"
                ? "일정: 미정"
                : data.periodText || data.date,
            data.place,
        ]
            .filter(Boolean)
            .join(" · ");

    // === 활동소개: intro 우선, 없으면 desc ===
    const secIntro = byH2("활동소개") || byH2("활동 소개");
    if (secIntro) {
        const p = q(".info-card > p", secIntro);
        if (p) p.textContent = data.intro || "소개 미등록";
        const durBadge = q(".info-subbox:nth-of-type(2) .badge", secIntro);
        if (durBadge && data.duration)
            durBadge.textContent = esc(data.duration);
    }

    // === 진행일정 ===
    const secTime = byH2("진행일정");
    if (secTime) {
        const ol = q("ol.custom-list, ol", secTime);
        const items = Array.isArray(data.schedule)
            ? data.schedule
            : typeof data.timeline === "string"
            ? data.timeline
                  .split("|")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [];
        if (ol) {
            const lis = (items || []).map((txt) => {
                const li = document.createElement("li");
                li.textContent = txt;
                return li;
            });
            if (!lis.length) {
                const li = document.createElement("li");
                li.textContent =
                    data.status === "scheduled" ? "미정" : "일정 미등록";
                lis.push(li);
            }
            ol.replaceChildren(...lis);
        }
    }

    // === 담당자 (멘토 사진 있으면 사진, 없거나 로드 실패면 아이콘) === check
    (function renderMentor() {
        const secMentor = byH2("담당자 정보") || byH2("담당자정보");
        if (!secMentor) return;

        // 아바타 컨테이너 (둘 중 있는 쪽 사용)
        const avatarBox =
            q(".contact-card .avatar-mentor", secMentor) ||
            q(".contact-card .avatar", secMentor);
        if (!avatarBox) return;

        const nameEl = q(
            ".contact-card .avatar-1 p:nth-of-type(1) strong",
            secMentor
        );
        const roleEl = q(".contact-card .avatar-1 p:nth-of-type(2)", secMentor);
        const phoneEl = q(
            ".contact-card .avatar-1 p:nth-of-type(3)",
            secMentor
        );

        const mentor = (data.mentor ?? "담당자 정보 미등록").trim();
        const role = (data.role ?? "").trim();
        const phone = (data.phone ?? "연락처 미등록").trim();
        const mentorImg = (data.mentorImg || data.avatarUrl || "").trim();

        // 아이콘 인라인 SVG (Lucide circle-user-round)
        const ICON_SVG = `
      <svg xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 24 24" fill="none" stroke="#000"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           class="lucide lucide-circle-user-round"
           style="width:100%;height:100%;display:block;">
        <path d="M18 20a6 6 0 0 0-12 0"/>
        <circle cx="12" cy="10" r="4"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    `;

        // 아이콘으로 채우는 함수
        function showIcon() {
            avatarBox.innerHTML = ICON_SVG;
        }

        // 먼저 박스 비우고 시작 (중복 DOM 방지)
        avatarBox.innerHTML = "";

        if (mentorImg) {
            // 이미지 시도: 실패(onerror)하면 즉시 아이콘 폴백
            const imgEl = document.createElement("img");
            imgEl.alt = "멘토 사진";
            imgEl.style.width = "100%";
            imgEl.style.height = "100%";
            imgEl.style.objectFit = "cover";
            imgEl.onerror = showIcon;
            imgEl.src = mentorImg;
            avatarBox.appendChild(imgEl);
        } else {
            // 경로 자체가 없으면 바로 아이콘
            showIcon();
        }

        if (nameEl && mentor) nameEl.textContent = mentor;
        if (roleEl && role) roleEl.textContent = role;
        if (phoneEl && phone) phoneEl.textContent = phone;
    })();

    // === 행사 사진 (원래 구조 유지) ===
    const galleryCard =
        q(".info-box.gallery .info-card") ||
        (byH2("행사 사진") || byH2("행사사진"))?.querySelector(".info-card");

    const imgs = Array.isArray(data.images)
        ? data.images.filter(Boolean)
        : data.imageUrl
        ? [data.imageUrl]
        : [];

    if (galleryCard) {
        galleryCard.innerHTML = "";
        if (imgs.length) {
            const cover = document.createElement("img");
            cover.className = "event-cover";
            cover.src = imgs[0];
            cover.alt = (data.title || "행사") + " 대표 이미지";
            cover.style.width = "100%";
            cover.style.display = "block";
            cover.style.objectFit = "cover";
            galleryCard.appendChild(cover);
        }
        // 이미지가 없으면 비워둠 (요청대로)
    }
});
