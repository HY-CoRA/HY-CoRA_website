document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("main");
    if (!container) return;

    const data = await loadAnnouncementDetail();
    if (!data) {
        container.innerHTML = emptyHTML("잘못된 접근입니다.");
        return;
    }

    // 안전 이스케이프
    const esc = escapeHTML;

    // recruit-card 마크업 구성
    const card = document.createElement("section");
    card.className = "main";
    card.innerHTML = `
    <!-- 상단 소개 배너 -->
    <div class="top-header">
      <div class="top-title">
        <h2>${esc(data.title)}</h2>
      </div>
      <div class="top-subtitle">
        <p>${esc(data.summary)}</p>
      </div>
    </div>

    <section class="notices-section">
      <div class="notice-detail-card">
        <div class="notice-detail-pills">
          <div class="notice-detail-pill">
            <!-- calendar icon -->
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1h3V2Zm12 6H5v12h14V8Z"/>
            </svg>
            <div class="notice-detail-pill-text">${esc(data.date)}</div>
          </div>

          <div class="notice-detail-pill">
            <!-- clock icon -->
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20Zm1 5h-2v6l5 3l1-1.73l-4-2.27V7Z"/>
            </svg>
            <div class="notice-detail-pill-text">${esc(data.time)}</div>
          </div>

          <div class="notice-detail-pill">
            <!-- pin icon -->
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Zm0 9.5A2.5 2.5 0 1 0 12 6a2.5 2.5 0 0 0 0 5.5Z"/>
            </svg>
            <div class="notice-detail-pill-text">${esc(data.location)}</div>
          </div>

          <div class="notice-detail-pill">
            <!-- clock icon -->
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M3 17.25V21h3.75l11.06-11.06a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/>
            </svg>
            <div class="notice-detail-pill-text">${esc(data.lastModified)}</div>
          </div>

        </div>

        <!-- ✅ pills와 같은 좌우 여백을 쓰는 래퍼 -->
        <div class="notice-detail-body">
        <article class="notice-paper" aria-label="공지 본문">
          <div class="np-header">
            <div class="np-title">${esc(data.title || "공지사항")}</div>
            <div class="np-meta">${esc(data.department || "HY-CoRA")}</div>
          </div>

          ${renderBodyHTML(data)}
        </article>
      </div>
      
      </div>

    </section>
  `;

    container.innerHTML = "";
    container.appendChild(card);
});

async function loadAnnouncementDetail() {
    const id = new URLSearchParams(location.search).get("id");
    if (id && window.HYCorAData?.getAnnouncement) {
        const api = await window.HYCorAData.getAnnouncement(id);
        if (api) return api;
    }
    const raw = sessionStorage.getItem("announcement.current");
    return raw ? JSON.parse(raw) : null;
}

// 공통: 빈 상태 UI
function emptyHTML(msg) {
    return `
    <div class="notice-detail-empty" style="text-align:center; padding:2rem;">
      <p>${escapeHTML(msg)}</p>
      <p><a href="announcement.html" class="btn">목록으로 돌아가기</a></p>
    </div>
  `;
}

// 간단 XSS 방지
function escapeHTML(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

// 본문 렌더링 유틸: 문자열/배열/리치텍스트 다 대응
function renderBodyHTML(data) {
    const esc = escapeHTML;

    // 우선순위: data.contentHTML(이미 안전한 HTML) > data.content(문자열) > data.paragraphs(배열) > data.summary
    if (data.contentHTML) {
        // 신뢰 가능한 사내/내부 생성 HTML이라면 그대로 사용 (외부 입력이면 XSS 주의)
        return data.contentHTML;
    }

    if (typeof data.content === "string" && data.content.trim()) {
        // 개행 유지
        return `<div class="nd-paragraph">${esc(data.content).replace(
            /\n/g,
            "<br>"
        )}</div>`;
    }

    if (Array.isArray(data.paragraphs) && data.paragraphs.length) {
        return data.paragraphs
            .map((p) => `<p class="nd-paragraph">${esc(p)}</p>`)
            .join("");
    }

    if (data.summary) {
        return `<p class="nd-paragraph">${esc(data.summary)}</p>`;
    }

    // 아무것도 없을 때 기본 문구
    return `<p class="nd-paragraph">상세 내용은 추후 업데이트될 예정입니다.</p>`;
}
