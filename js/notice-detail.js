document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(".notices-section .container");
    if (!container) return;

    const data = await loadAnnouncementDetail();
    if (!data) {
        container.innerHTML = emptyHTML("잘못된 접근입니다.");
        return;
    }

    // 모집 공고만 보여주기
    if (data.category !== "event") {
        container.innerHTML = emptyHTML("행사 공고가 아닙니다.");
        return;
    }

    // 안전 이스케이프
    const esc = escapeHTML;

    // recruit-card 마크업 구성
    const card = document.createElement("section");
    card.className = "notice-detail-card";
    card.innerHTML = `
    <div class="notice-detail-title">${esc(data.title)}</div>

  <div class="notice-detail-pills">
    <div class="notice-detail-pill">
      <!-- calendar icon -->
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1h3V2Zm12 6H5v12h14V8Z"/>
      </svg>
      <div class="notice-detail-pill-text">${esc(data.time)}</div>
    </div>

    <div class="notice-detail-pill">
      <!-- clock icon -->
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path fill="currentColor" d="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20Zm1 5h-2v6l5 3l1-1.73l-4-2.27V7Z"/>
      </svg>
      <div class="notice-detail-pill-text">${esc(data.date)}</div>
    </div>

    <div class="notice-detail-pill">
      <!-- pin icon -->
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path fill="currentColor" d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Zm0 9.5A2.5 2.5 0 1 0 12 6a2.5 2.5 0 0 0 0 5.5Z"/>
      </svg>
      <div class="notice-detail-pill-text">${esc(data.location)}</div>
    </div>
  </div>

  <!-- 클릭하면 확대되는 이미지 플레이스홀더 (CSS-only :target) -->
  <a href="#evimg" class="event-photo">
    <div class="photo-inner">
      <div class="photo-text">
        행사 사진<br/>
        <small>(이 부분은 홍보용으로 만들어진 자료를 올려두려는 목적으로 만든 건데<br/>
        여기 있는 자료를 클릭해서 크게 볼 수 있게 구현 되었으면 좋겠어요)</small>
      </div>
    </div>
  </a>

  <!-- 모달 -->
  <div id="evimg" class="lightbox">
    <a href="#" class="lightbox-close" aria-label="닫기">×</a>
    <div class="lightbox-content">
      <!-- 실제 이미지가 있으면 아래 div 대신 <img src="...">로 교체 -->
      <div class="lightbox-placeholder">이미지 자리 (가로 1200 × 세로 800 예시)</div>
    </div>
  </div>
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
