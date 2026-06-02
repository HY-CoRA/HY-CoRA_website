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
