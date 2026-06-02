# HY-CoRA Website Backend API Specification

## 1. 개요

본 문서는 `HY-CoRA_website` 프론트엔드에서 필요한 백엔드 API 명세를 정의합니다. 프론트엔드는 본 명세서에 따라 API를 호출하고 응답을 처리합니다.

현재 프론트엔드는 백엔드 API가 없거나 API Base URL이 비어 있으면 기존 기본 데이터와 로컬 fallback으로 동작합니다. 백엔드 API Base URL이 설정되면 서버 조회/저장 API를 우선 호출합니다.

백엔드 데이터 마이그레이션 완료 전까지 프론트의 기본 데이터는 유지됩니다.

## 2. 공통 사항

* Content-Type: JSON 요청은 `application/json` 형식을 사용합니다.
* 파일 업로드 요청은 `multipart/form-data` 형식을 사용합니다.
* 인증: 공개 조회 API를 제외한 모든 어드민 변경 API는 `Authorization` 헤더에 Bearer 토큰을 포함해야 합니다.

      Authorization: Bearer <access_token>

  * `access_token`은 인증 성공 시 발급됩니다.
  * 프론트는 `access_token`을 `sessionStorage("hycora.admin.token")`에 저장할 수 있습니다.
  * 백엔드가 httpOnly cookie 세션을 사용하는 경우에도 프론트는 `credentials: "include"`로 요청합니다.
  * 토큰이 없거나 유효하지 않으면 `401 Unauthorized`를 반환합니다.

* ID 호환:
  * 백엔드는 가능하면 `id` 필드를 내려주세요.
  * MongoDB `_id`만 내려오는 경우에도 프론트는 처리할 수 있습니다.

* 실패 응답:

      {
        "error": "string"
      }

  또는:

      {
        "message": "string"
      }

  * `error` 또는 `message`는 사용자에게 보여줄 수 있는 실패 원인 문자열입니다.

* 상태 코드:
  * 인증 실패: `401 Unauthorized`
  * 권한 부족: `403 Forbidden`
  * 유효하지 않은 입력: `400 Bad Request`
  * 리소스 없음: `404 Not Found`
  * 중복 또는 충돌: `409 Conflict`
  * 파일 용량 초과: `413 Payload Too Large`
  * 서버 오류: `500 Internal Server Error`

* CORS:
  * 운영 프론트 도메인과 로컬 개발 도메인을 허용해야 합니다.

## 3. API 엔드포인트

### 3.1. 현재 관리자 세션 확인 API

현재 로그인한 관리자 정보를 확인합니다.

* Endpoint: `/api/auth/me`
* HTTP Method: `GET`
* Description: 현재 요청의 인증 토큰 또는 세션 쿠키가 유효한지 확인하고 관리자 정보를 반환합니다.

#### 요청 (Input)

* Headers:

      Authorization: Bearer <access_token>

#### 응답 (Output)

* 성공 (200 OK):

      {
        "user": {
          "id": "string",
          "email": "string",
          "role": "owner | admin | editor"
        }
      }

* 상세:
  * `user.id`: 관리자 고유 식별자입니다.
  * `user.email`: 관리자 이메일입니다.
  * `user.role`: 관리자 권한입니다.

* 실패 (401 Unauthorized):

      {
        "error": "string"
      }

### 3.2. 관리자 로그아웃 API

현재 관리자 세션을 종료합니다.

* Endpoint: `/api/auth/logout`
* HTTP Method: `POST`
* Description: 현재 세션 또는 토큰을 만료 처리합니다.

#### 요청 (Input)

* Headers:

      Authorization: Bearer <access_token>

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (401 Unauthorized):

      {
        "error": "string"
      }

### 3.3. Passkey 로그인 옵션 생성 API

관리자 passkey 로그인을 위한 WebAuthn challenge/options를 생성합니다.

* Endpoint: `/api/auth/webauthn/login/options`
* HTTP Method: `POST`
* Description: 이메일을 기준으로 로그인 challenge를 생성하고 WebAuthn `navigator.credentials.get()`에 전달할 options를 반환합니다.

#### 요청 (Input)

* Body:

      {
        "email": "string"
      }

* 상세:
  * `email`: 로그인하려는 관리자 이메일입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "challenge": "string",
        "rpId": "string",
        "allowCredentials": [
          {
            "id": "string",
            "type": "public-key"
          }
        ],
        "userVerification": "preferred | required | discouraged",
        "timeout": "number"
      }

* 상세:
  * `challenge`: base64url 인코딩된 WebAuthn challenge입니다.
  * `rpId`: relying party ID입니다.
  * `allowCredentials`: 사용 가능한 credential 목록입니다.
  * `userVerification`: 사용자 검증 정책입니다.
  * `timeout`: 인증 제한 시간입니다.

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.4. Passkey 로그인 검증 API

브라우저에서 생성된 passkey 인증 결과를 검증하고 세션을 발급합니다.

* Endpoint: `/api/auth/webauthn/login/verify`
* HTTP Method: `POST`
* Description: WebAuthn credential 응답을 검증하고 인증 성공 시 토큰 또는 세션 정보를 반환합니다.

#### 요청 (Input)

* Body:

      {
        "email": "string",
        "credential": {
          "id": "string",
          "type": "public-key",
          "rawId": "string",
          "response": {
            "authenticatorData": "string",
            "clientDataJSON": "string",
            "signature": "string",
            "userHandle": "string | null"
          }
        }
      }

* 상세:
  * `email`: 로그인하려는 관리자 이메일입니다.
  * `credential`: `navigator.credentials.get()` 결과를 base64url 문자열로 직렬화한 객체입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "token": "string",
        "user": {
          "id": "string",
          "email": "string",
          "role": "owner | admin | editor"
        }
      }

* 상세:
  * `token`: 이후 변경 API에서 사용할 Bearer 토큰입니다. 쿠키 세션만 사용할 경우 생략 가능합니다.
  * `user`: 로그인한 관리자 정보입니다.

* 실패 (401 Unauthorized):

      {
        "error": "string"
      }

### 3.5. Passkey 등록 옵션 생성 API

관리자 passkey 등록을 위한 WebAuthn challenge/options를 생성합니다.

* Endpoint: `/api/auth/webauthn/register/options`
* HTTP Method: `POST`
* Description: 신규 passkey 등록에 필요한 WebAuthn `navigator.credentials.create()` options를 반환합니다.

#### 요청 (Input)

* Body:

      {
        "email": "string",
        "displayName": "string"
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "challenge": "string",
        "rp": {
          "id": "string",
          "name": "string"
        },
        "user": {
          "id": "string",
          "name": "string",
          "displayName": "string"
        },
        "pubKeyCredParams": [
          {
            "type": "public-key",
            "alg": "number"
          }
        ],
        "authenticatorSelection": {
          "userVerification": "preferred | required | discouraged"
        },
        "timeout": "number"
      }

* 실패 (401 Unauthorized):

      {
        "error": "string"
      }

### 3.6. Passkey 등록 검증 API

브라우저에서 생성된 신규 passkey credential을 검증하고 저장합니다.

* Endpoint: `/api/auth/webauthn/register/verify`
* HTTP Method: `POST`
* Description: WebAuthn registration credential을 검증하고 관리자 계정에 passkey를 등록합니다.

#### 요청 (Input)

* Body:

      {
        "email": "string",
        "credential": {
          "id": "string",
          "type": "public-key",
          "rawId": "string",
          "response": {
            "attestationObject": "string",
            "clientDataJSON": "string"
          }
        }
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (400 Bad Request):

      {
        "error": "string"
      }

### 3.7. Magic Link 요청 API

Passkey 등록 전 또는 복구 상황에서 관리자 이메일로 로그인 링크를 발송합니다.

* Endpoint: `/api/auth/magic-link/request`
* HTTP Method: `POST`
* Description: 관리자 이메일로 1회용 로그인 링크 또는 인증 코드를 발송합니다.

#### 요청 (Input)

* Body:

      {
        "email": "string"
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.8. Magic Link 검증 API

Magic link 또는 1회용 코드를 검증하고 관리자 세션을 발급합니다.

* Endpoint: `/api/auth/magic-link/verify`
* HTTP Method: `POST`
* Description: 이메일로 받은 토큰 또는 코드를 검증하고 인증 토큰을 반환합니다.

#### 요청 (Input)

* Body:

      {
        "token": "string"
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "token": "string",
        "user": {
          "id": "string",
          "email": "string",
          "role": "owner | admin | editor"
        }
      }

* 실패 (401 Unauthorized):

      {
        "error": "string"
      }

### 3.9. 사이트 설정 조회 API

메인 배너, 소개 배너, 지원 링크 등의 사이트 설정을 조회합니다.

* Endpoint: `/api/config/:key`
* HTTP Method: `GET`
* Description: `key`에 해당하는 사이트 설정값을 프론트가 바로 사용할 수 있는 형태로 반환합니다.

#### 요청 (Input)

* Path Parameters:
  * `key`: `main-banner | about-banner | apply-links`

#### 응답 (Output)

* 성공 (200 OK) - 배너 설정:

      {
        "imageUrl": "string",
        "altText": "string"
      }

* 성공 (200 OK) - 지원 링크 설정:

      {
        "newMember": {
          "url": "string",
          "label": "string"
        },
        "returning": {
          "url": "string",
          "label": "string"
        }
      }

* 상세:
  * `imageUrl`: 배너 이미지 URL입니다.
  * `altText`: 배너 대체 텍스트입니다.
  * `newMember.url`: 신규 지원 링크입니다.
  * `newMember.label`: 신규 지원 버튼 문구입니다.
  * `returning.url`: 재가입 링크입니다.
  * `returning.label`: 재가입 버튼 문구입니다.

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.10. 사이트 설정 저장 API

메인 배너, 소개 배너, 지원 링크 등의 사이트 설정을 저장합니다.

* Endpoint: `/api/config/:key`
* HTTP Method: `PUT`
* Description: `key`에 해당하는 사이트 설정값을 저장합니다.

#### 요청 (Input)

* Path Parameters:
  * `key`: `main-banner | about-banner | apply-links`

* Body - 배너 설정:

      {
        "imageUrl": "string",
        "altText": "string"
      }

* Body - 지원 링크 설정:

      {
        "newMember": {
          "url": "string",
          "label": "string"
        },
        "returning": {
          "url": "string",
          "label": "string"
        }
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (400 Bad Request):

      {
        "error": "string"
      }

### 3.11. Past Events 목록 조회 API

메인 페이지 Past Events 카드 목록을 조회합니다.

* Endpoint: `/api/events/past`
* HTTP Method: `GET`
* Description: Past Events 목록을 표시 순서대로 반환합니다.

#### 요청 (Input)

* 없음

#### 응답 (Output)

* 성공 (200 OK):

      [
        {
          "id": "string",
          "imageUrl": "string",
          "title": "string",
          "description": "string",
          "order": "number"
        }
      ]

* 상세:
  * `id`: 이벤트 고유 식별자입니다.
  * `imageUrl`: 이벤트 이미지 URL입니다.
  * `title`: 이벤트 제목입니다.
  * `description`: 이벤트 설명입니다.
  * `order`: 표시 순서입니다.

* 실패 (500 Internal Server Error):

      {
        "error": "string"
      }

### 3.12. Past Events 생성 API

Past Events 항목을 생성합니다.

* Endpoint: `/api/events/past`
* HTTP Method: `POST`
* Description: 새 Past Event를 생성합니다.

#### 요청 (Input)

* Body:

      {
        "imageUrl": "string",
        "title": "string",
        "description": "string",
        "order": "number"
      }

#### 응답 (Output)

* 성공 (201 Created):

      {
        "id": "string",
        "imageUrl": "string",
        "title": "string",
        "description": "string",
        "order": "number"
      }

* 실패 (400 Bad Request):

      {
        "error": "string"
      }

### 3.13. Past Events 수정 API

Past Events 항목을 수정합니다.

* Endpoint: `/api/events/past/:id`
* HTTP Method: `PUT`
* Description: `id`에 해당하는 Past Event를 수정합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: Past Event 고유 식별자입니다.

* Body:

      {
        "imageUrl": "string",
        "title": "string",
        "description": "string",
        "order": "number"
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "id": "string",
        "imageUrl": "string",
        "title": "string",
        "description": "string",
        "order": "number"
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.14. Past Events 삭제 API

Past Events 항목을 삭제합니다.

* Endpoint: `/api/events/past/:id`
* HTTP Method: `DELETE`
* Description: `id`에 해당하는 Past Event를 삭제합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: Past Event 고유 식별자입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.15. Past Events 정렬 API

Past Events 표시 순서를 저장합니다.

* Endpoint: `/api/events/past/reorder`
* HTTP Method: `PUT`
* Description: 전달받은 ID 배열 순서대로 Past Events 표시 순서를 변경합니다.

#### 요청 (Input)

* Body:

      {
        "ids": ["string"]
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (400 Bad Request):

      {
        "error": "string"
      }

### 3.16. 활동내용 목록 조회 API

활동내용 카드 목록을 조회합니다.

* Endpoint: `/api/activities`
* HTTP Method: `GET`
* Description: 활동내용 목록을 반환합니다. 서버에서 상태 필터를 지원할 수 있습니다.

#### 요청 (Input)

* Query Parameters:
  * `status` (선택): `scheduled | recruiting | ongoing | completed`

#### 응답 (Output)

* 성공 (200 OK):

      [
        {
          "id": "string",
          "status": "scheduled | recruiting | ongoing | completed",
          "statusLabel": "string",
          "title": "string",
          "desc": "string",
          "intro": "string",
          "mentor": "string",
          "role": "string",
          "place": "string",
          "participants": "string",
          "recruitStart": "string | null",
          "recruitEnd": "string | null",
          "periodText": "string",
          "schedule": ["string"],
          "images": ["string"]
        }
      ]

* 상세:
  * `status`: 서버 표준 상태값입니다.
  * `statusLabel`: 화면에 표시할 한국어 상태 라벨입니다.
  * `schedule`: 상세 페이지 진행 일정 배열입니다.
  * `images`: 상세 페이지 이미지 URL 배열입니다.

* 실패 (500 Internal Server Error):

      {
        "error": "string"
      }

### 3.17. 활동내용 상세 조회 API

활동내용 상세 페이지 데이터를 조회합니다.

* Endpoint: `/api/activities/:id`
* HTTP Method: `GET`
* Description: `id`에 해당하는 활동내용 상세 데이터를 반환합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 활동내용 고유 식별자입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "id": "string",
        "status": "scheduled | recruiting | ongoing | completed",
        "statusLabel": "string",
        "title": "string",
        "desc": "string",
        "intro": "string",
        "mentor": "string",
        "role": "string",
        "place": "string",
        "participants": "string",
        "recruitStart": "string | null",
        "recruitEnd": "string | null",
        "periodText": "string",
        "schedule": ["string"],
        "images": ["string"]
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.18. 활동내용 생성 API

활동내용을 생성합니다.

* Endpoint: `/api/activities`
* HTTP Method: `POST`
* Description: 어드민이 입력한 활동내용을 생성합니다.

#### 요청 (Input)

* Body:

      {
        "status": "scheduled | recruiting | ongoing | completed",
        "title": "string",
        "desc": "string",
        "intro": "string",
        "mentor": "string",
        "role": "string",
        "place": "string",
        "participants": "string",
        "recruitStart": "string | null",
        "recruitEnd": "string | null",
        "periodText": "string",
        "schedule": ["string"],
        "images": ["string"]
      }

#### 응답 (Output)

* 성공 (201 Created):

      {
        "id": "string"
      }

* 실패 (400 Bad Request):

      {
        "error": "string"
      }

### 3.19. 활동내용 수정 API

활동내용을 수정합니다.

* Endpoint: `/api/activities/:id`
* HTTP Method: `PUT`
* Description: `id`에 해당하는 활동내용을 수정합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 활동내용 고유 식별자입니다.

* Body:

      {
        "status": "scheduled | recruiting | ongoing | completed",
        "title": "string",
        "desc": "string",
        "intro": "string",
        "mentor": "string",
        "role": "string",
        "place": "string",
        "participants": "string",
        "recruitStart": "string | null",
        "recruitEnd": "string | null",
        "periodText": "string",
        "schedule": ["string"],
        "images": ["string"]
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "id": "string"
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.20. 활동내용 삭제 API

활동내용을 삭제합니다.

* Endpoint: `/api/activities/:id`
* HTTP Method: `DELETE`
* Description: `id`에 해당하는 활동내용을 삭제합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 활동내용 고유 식별자입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.21. 활동 이미지 업로드 API

활동내용 상세 페이지에 표시할 이미지를 업로드합니다.

* Endpoint: `/api/activities/:id/images`
* HTTP Method: `POST`
* Description: 활동 이미지 파일을 업로드하고 접근 가능한 이미지 URL 목록을 반환합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 활동내용 고유 식별자입니다.

* Body:
  * `multipart/form-data`
  * field name: `images`

#### 응답 (Output)

* 성공 (200 OK):

      {
        "images": ["string"]
      }

* 상세:
  * `images`: 업로드된 이미지 URL 배열입니다.

* 실패 (413 Payload Too Large):

      {
        "error": "string"
      }

### 3.22. 공지사항 공개 목록 조회 API

공개 공지사항 목록을 조회합니다.

* Endpoint: `/api/announcements`
* HTTP Method: `GET`
* Description: 공개 상태인 공지사항만 반환합니다.

#### 요청 (Input)

* Query Parameters:
  * `category` (선택): `event | recruitment | etc`

#### 응답 (Output)

* 성공 (200 OK):

      [
        {
          "id": "string",
          "title": "string",
          "category": "event | recruitment | etc",
          "category_ko": "string",
          "date": "string",
          "summary": "string",
          "content": "string",
          "capacity": "string",
          "link": "string",
          "published": "boolean",
          "lastModified": "string",
          "source": "manual | kakao_bot"
        }
      ]

* 상세:
  * `published`가 `false`인 공지는 공개 목록에 포함하지 않습니다.

* 실패 (500 Internal Server Error):

      {
        "error": "string"
      }

### 3.23. 공지사항 어드민 목록 조회 API

어드민에서 공지사항 전체 목록을 조회합니다.

* Endpoint: `/api/admin/announcements`
* HTTP Method: `GET`
* Description: 발행 공지와 임시저장 공지를 모두 반환합니다.

#### 요청 (Input)

* Headers:

      Authorization: Bearer <access_token>

#### 응답 (Output)

* 성공 (200 OK):

      [
        {
          "id": "string",
          "title": "string",
          "category": "event | recruitment | etc",
          "category_ko": "string",
          "date": "string",
          "summary": "string",
          "content": "string",
          "capacity": "string",
          "link": "string",
          "published": "boolean",
          "lastModified": "string",
          "source": "manual | kakao_bot"
        }
      ]

* 실패 (401 Unauthorized):

      {
        "error": "string"
      }

### 3.24. 공지사항 상세 조회 API

공지사항 상세 페이지 데이터를 조회합니다.

* Endpoint: `/api/announcements/:id`
* HTTP Method: `GET`
* Description: `id`에 해당하는 공개 공지사항 상세 데이터를 반환합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 공지사항 고유 식별자입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "id": "string",
        "title": "string",
        "category": "event | recruitment | etc",
        "category_ko": "string",
        "date": "string",
        "summary": "string",
        "content": "string",
        "capacity": "string",
        "link": "string",
        "published": "boolean",
        "lastModified": "string",
        "source": "manual | kakao_bot"
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.25. 공지사항 어드민 상세 조회 API

임시저장을 포함한 공지사항 상세 데이터를 조회합니다.

* Endpoint: `/api/admin/announcements/:id`
* HTTP Method: `GET`
* Description: `id`에 해당하는 공지사항 상세 데이터를 어드민 권한으로 반환합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 공지사항 고유 식별자입니다.

* Headers:

      Authorization: Bearer <access_token>

#### 응답 (Output)

* 성공 (200 OK):

      {
        "id": "string",
        "title": "string",
        "category": "event | recruitment | etc",
        "category_ko": "string",
        "date": "string",
        "summary": "string",
        "content": "string",
        "capacity": "string",
        "link": "string",
        "published": "boolean",
        "lastModified": "string",
        "source": "manual | kakao_bot"
      }

* 실패 (401 Unauthorized):

      {
        "error": "string"
      }

### 3.26. 공지사항 생성 API

공지사항을 생성합니다.

* Endpoint: `/api/announcements`
* HTTP Method: `POST`
* Description: 어드민이 입력한 공지사항을 생성합니다.

#### 요청 (Input)

* Body:

      {
        "title": "string",
        "category": "event | recruitment | etc",
        "category_ko": "string",
        "date": "string",
        "summary": "string",
        "content": "string",
        "capacity": "string",
        "link": "string",
        "published": "boolean",
        "lastModified": "string",
        "source": "manual | kakao_bot"
      }

#### 응답 (Output)

* 성공 (201 Created):

      {
        "id": "string"
      }

* 실패 (400 Bad Request):

      {
        "error": "string"
      }

* note:
  * 카카오톡 공지 원문 파싱은 프론트 어드민 페이지에서 처리합니다.
  * 프론트가 파싱한 결과를 이 API로 저장합니다.
  * 프론트 파싱으로 생성된 공지는 `source` 값을 `kakao_bot` 또는 백엔드가 합의한 동등한 값으로 전달할 수 있습니다.

### 3.27. 공지사항 수정 API

공지사항을 수정합니다.

* Endpoint: `/api/announcements/:id`
* HTTP Method: `PUT`
* Description: `id`에 해당하는 공지사항을 수정합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 공지사항 고유 식별자입니다.

* Body:

      {
        "title": "string",
        "category": "event | recruitment | etc",
        "category_ko": "string",
        "date": "string",
        "summary": "string",
        "content": "string",
        "capacity": "string",
        "link": "string",
        "published": "boolean",
        "lastModified": "string",
        "source": "manual | kakao_bot"
      }

#### 응답 (Output)

* 성공 (200 OK):

      {
        "id": "string"
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.28. 공지사항 삭제 API

공지사항을 삭제합니다.

* Endpoint: `/api/announcements/:id`
* HTTP Method: `DELETE`
* Description: `id`에 해당하는 공지사항을 삭제합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 공지사항 고유 식별자입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.29. 임원진 사진 업로드 API

소개 페이지 임원진 사진을 업로드합니다.

* Endpoint: `/api/leaders/:name/photo`
* HTTP Method: `POST`
* Description: 임원진 이름 기준으로 사진을 업로드하고 접근 가능한 이미지 URL을 반환합니다.

#### 요청 (Input)

* Path Parameters:
  * `name`: URL 인코딩된 임원진 이름입니다.

* Body:
  * `multipart/form-data`
  * field name: `photo`

#### 응답 (Output)

* 성공 (200 OK):

      {
        "url": "string"
      }

* 상세:
  * `url`: 업로드된 임원진 사진 URL입니다.

* 실패 (400 Bad Request):

      {
        "error": "string"
      }

### 3.30. 임원진 사진 삭제 API

소개 페이지 임원진 사진을 삭제합니다.

* Endpoint: `/api/leaders/:name/photo`
* HTTP Method: `DELETE`
* Description: 임원진 이름 기준으로 등록된 사진을 삭제합니다.

#### 요청 (Input)

* Path Parameters:
  * `name`: URL 인코딩된 임원진 이름입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

### 3.31. 활동 이미지 삭제 API

활동내용에 등록된 특정 이미지를 삭제합니다.

* Endpoint: `/api/activities/:id/images/:imageId`
* HTTP Method: `DELETE`
* Description: 활동내용에 연결된 특정 이미지를 삭제합니다.

#### 요청 (Input)

* Path Parameters:
  * `id`: 활동내용 고유 식별자입니다.
  * `imageId`: 이미지 고유 식별자입니다.

#### 응답 (Output)

* 성공 (200 OK):

      {
        "success": true
      }

* 실패 (404 Not Found):

      {
        "error": "string"
      }

## 4. 정적 파일 서빙

이미지 업로드 API가 반환하는 URL은 프론트에서 직접 접근 가능해야 합니다.

* Required Path: `/uploads/*`
* Description: 업로드된 배너, 임원진 사진, 활동 이미지를 정적으로 제공합니다.

### 응답 요구사항

* 이미지 URL은 절대 URL 또는 API Base URL 기준 경로여야 합니다.
* 접근 가능한 이미지 파일은 `200 OK`로 반환합니다.
* 존재하지 않는 파일은 `404 Not Found`를 반환합니다.
* 실행 가능한 스크립트 파일 업로드 또는 실행은 차단해야 합니다.

## 5. 백엔드 완료 후 확인 항목

* API Base URL을 운영값으로 설정했을 때 공개 페이지가 서버 데이터로 렌더링되어야 합니다.
* 어드민 passkey 로그인과 magic link 복구 흐름이 동작해야 합니다.
* 배너, Past Events, 활동, 공지, 지원 링크 저장 후 새 브라우저에서 반영되어야 합니다.
* 활동/공지 상세 URL 직접 접근이 동작해야 합니다.
* 임원진/활동 이미지 업로드 및 삭제가 동작해야 합니다.
