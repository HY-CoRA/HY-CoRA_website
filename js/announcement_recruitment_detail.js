document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("main");
    if (!container) return;

    const data = await loadAnnouncementDetail();
    if (!data) {
        container.innerHTML = emptyHTML("상세 데이터를 찾을 수 없습니다.");
        return;
    }

    // 안전 이스케이프
    const esc = escapeHTML;

    const escURL = (url = "") => {
        const u = url.trim();
        if (!u) return "";
        if (/^https?:\/\//i.test(u)) return u; // http/https면 통과
        return "https://" + u.replace(/^\/+/, ""); // 그 외는 https로 보정
    };

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
              <path fill="currentColor" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3
        -3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0
        3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0
        2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8
        0c-.29 0-.62.02-.97.05 1.16.84 1.97
        1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <div class="notice-detail-pill-text">${esc(data.capacity)}</div>
          </div>

          <div class="notice-detail-pill">
            <!-- link icon (Lucide) -->
            <svg xmlns="http://www.w3.org/2000/svg"
              width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>

            <!-- ✅ 텍스트처럼 보이는 앵커 -->
            <a class="pill-link" href="${escURL(
                data.link
            )}" target="_blank" rel="noopener" title="지원하기"> 
              ${esc(data.link)}
            </a>
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
