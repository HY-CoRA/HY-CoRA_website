# HY-CoRA Website 기능 명세서

## 모집 일정 자동화 (TODO)

### 배경

기존 어드민 패널(`admin/apply-links.html`)에는 학기별 모집 시작·종료일을 수동으로 입력하는 UI가 있었으나, 이 날짜는 매년 고정값이므로 어드민이 직접 설정할 필요가 없다.

- **1학기 정규 모집 기간**: 3월 1일 ~ 8월 30일
- **2학기 정규 모집 기간**: 9월 1일 ~ 2월 말일(윤년 2월 29일, 평년 2월 28일)

→ 해당 날짜 입력 UI는 어드민에서 제거 완료.

---

### 구현해야 할 로직 (`js/apply.js`)

#### 1. 현재 학기 판별 함수 추가

```js
/**
 * 오늘 날짜 기준으로 현재 모집 학기를 반환한다.
 * @returns {"semester1" | "semester2" | null}
 *   - "semester1": 3월 1일 ~ 8월 30일
 *   - "semester2": 9월 1일 ~ 2월 말일(다음 연도)
 *   - null: 해당 없음 (이론상 발생하지 않으나 예외 처리용)
 */
function getCurrentSemester() {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-indexed
    const day = today.getDate();

    // 1학기: 3/1 ~ 8/30
    if (month >= 3 && month <= 8) {
        if (month === 8 && day > 30) return null;
        return "semester1";
    }

    // 2학기: 9/1 ~ 2/말일
    return "semester2";
}
```

#### 2. `renderApplyLinks()` 수정

- `getCurrentSemester()`를 호출하여 현재 학기를 판별한다.
- 현재 학기가 판별된 경우: 어드민에서 설정한 지원 링크 URL이 있으면 활성 버튼, 없으면 비활성("모집 기간이 아닙니다") 버튼을 렌더링한다.
- 모집 기간 외(null 반환)인 경우: 모든 지원 버튼을 비활성 상태로 렌더링한다.

#### 3. `renderRecruitmentSchedule()` 수정

- 현재 `recruitment-schedule` localStorage 설정에서 날짜를 읽어 표시하는 방식은 제거한다.
- 고정 날짜값을 코드에 직접 정의하여 표시한다.

  | 항목 | 날짜 |
  |---|---|
  | 1학기 정규 모집 | 3.1 ~ 8.30 |
  | 재등록 기간 (1학기) | 2.15 (연도 동적) |
  | 2학기 정규 모집 | 9.1 ~ 2.말일 |
  | 재등록 기간 (2학기) | 8.15 (연도 동적) |

- 연도는 `new Date().getFullYear()`로 현재 연도를 사용하되, 2학기(9월~) 재등록 기간의 연도는 다음 연도로 표시한다.

---

### 어드민 데이터 변경 사항

`recruitment-schedule` localStorage 키는 더 이상 날짜 필드를 사용하지 않는다. 해당 config 저장/로드 로직은 `admin.js`에서 제거 완료.

`apply-links` config 구조는 유지:

```json
{
  "newMember":   { "url": "...", "label": "신규 지원하기" },
  "returning":   { "url": "...", "label": "재가입 신청하기" }
}
```

---

### 완료 여부

| 항목 | 상태 |
|---|---|
| 어드민 날짜 입력 UI 제거 | ✅ 완료 |
| `admin.js` 날짜 저장/로드 코드 제거 | ✅ 완료 |
| `apply.js` 고정 날짜 기반 학기 판별 로직 | ✅ 완료 |
| `apply.js` `renderRecruitmentSchedule()` 정적 날짜로 교체 | ✅ 완료 |
