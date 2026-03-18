# 보완된 웹 가계부 앱 기획안

## 1. 서비스 정의
개인이 자신의 서버에 직접 설치해 운영하면서, 빠르게 거래를 입력하고 자산 흐름을 안전하게 기록·조회·백업할 수 있는 자기 호스팅형 웹 가계부 앱.

---

## 2. 핵심 목표 / 비목표

### 핵심 목표
- 모바일과 PC 브라우저에서 빠르게 거래를 입력할 수 있어야 한다.
- 계정(현금, 은행, 카드 등) 기준으로 자산 상태를 분리해 관리할 수 있어야 한다.
- 월별/일별 거래 조회와 기본 합계를 안정적으로 제공해야 한다.
- 데이터 내보내기(CSV Export)로 백업과 외부 활용이 쉬워야 한다.
- 운영이 단순하고 유지보수가 쉬운 구조여야 한다.

### 비목표
- 금융기관 자동 연동
- 다중 사용자 권한 체계
- 복잡한 예산 시뮬레이션
- OCR, 첨부파일, 알림, 자동 반복거래의 초기 포함
- MVP 단계에서의 계정 간 이체(Transfer) 정식 지원

---

## 3. 핵심 가정
- 단일 사용자 또는 매우 소규모 사용 환경이다.
- 리버스 프록시 및 TLS 종료는 인프라 단에서 처리한다.
- 운영자는 Linux, Docker, Git 기반 배포/백업을 수행할 수 있다.
- MVP 단계에서는 통화를 KRW 1종으로 가정한다.
- 금액은 소수점 없는 정수(원 단위)만 지원한다.

---

## 4. 범위 재정의

## 4.1 MVP 범위
- 단일 관리자 로그인
- Accounts CRUD
- Categories CRUD
- Transactions CRUD
- 월별/일별 거래 내역 조회
- 월별 수입/지출/순합계 요약
- CSV Export
- 반응형 UI

## 4.2 MVP-1.5 범위
- CSV Import
- Import Preview
- Import History
- Import 결과 요약(성공/실패/중복 스킵)
- 기본 통계 차트

## 4.3 Later 범위
- 반복 거래
- 예산 설정
- 태그
- 고급 검색
- OCR / 첨부파일
- 알림
- 계정 간 이체(Transfer) 정식 지원

---

## 5. 핵심 사용자 플로우

### 5.1 로그인
1. 로그인 페이지 접속
2. 관리자 비밀번호 입력
3. 세션 발급
4. 대시보드 진입

### 5.2 거래 입력
1. 대시보드 또는 거래 목록에서 추가 버튼 클릭
2. 날짜, 유형, 계정, 카테고리, 금액, 설명 입력
3. 저장
4. 목록 및 합계 갱신

### 5.3 CSV Export
1. 설정 페이지 이동
2. CSV Export 실행
3. 현재 데이터 기준 CSV 다운로드

### 5.4 CSV Import (MVP-1.5)
1. 설정 > Import 페이지 진입
2. CSV 업로드
3. Preview 및 오류/중복 결과 확인
4. 정상 건만 반영 또는 취소

---

## 6. 화면 목록 및 역할

## 6.1 MVP 화면
- **Login**
  - 관리자 로그인
- **Home / Dashboard**
  - 당월 요약
  - 최근 거래
  - 계정별 잔액
- **Transactions List**
  - 날짜/월 기준 목록 조회
  - 필터 및 정렬(기본 수준)
- **Transaction Form**
  - 거래 등록/수정
- **Accounts Settings**
  - 계정 추가/수정/비활성
- **Categories Settings**
  - 카테고리 추가/수정/비활성
- **Settings**
  - CSV Export
  - 비밀번호 변경
  - 앱 정보 / 백업 가이드

## 6.2 MVP-1.5 화면
- **Import Upload**
  - CSV 파일 업로드
- **Import Preview**
  - 정상/오류/중복 행 구분 표시
- **Import History**
  - 업로드 파일별 결과 이력 조회
- **Stats**
  - 월별 카테고리 통계
  - 기간별 합계

---

## 7. 정보 구조 (IA)

## 7.1 MVP
- Login
- Home
- Transactions
  - List
  - Add / Edit
- Settings
  - Accounts
  - Categories
  - CSV Export
  - Password Change

## 7.2 MVP-1.5 추가
- Settings
  - CSV Import
  - Import History
- Stats

---

## 8. 데이터 모델 재설계

MVP에서는 거래 유형을 `income`, `expense` 두 가지로 제한한다.  
`transfer`는 계정 간 이동을 제대로 표현하려면 `from_account_id`, `to_account_id` 또는 별도 전표 구조가 필요하므로 MVP에서는 제외한다.

### 핵심 설계 원칙
- 계정은 텍스트가 아니라 `accounts` 테이블로 관리한다.
- 거래는 실제 발생 시각(`occurred_at`)과 생성 시각(`created_at`)을 구분한다.
- 금액은 항상 양의 정수로 저장한다.
- 수입/지출 구분은 `transaction_type`으로 처리한다.
- CSV Import를 고려해 `source_type`, `import_batch_id`, `dedupe_hash`를 둔다.
- 삭제는 초기에는 hard delete 대신 soft delete 검토 가능하지만, MVP에서는 단순화를 위해 hard delete 또는 `is_deleted` 중 하나를 선택한다. 권장안은 **MVP에서는 hard delete + 감사 로그 미적용**이다.

---

## 9. 주요 테이블 초안

## 9.1 accounts
| 컬럼명 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK | 계정 ID |
| name | VARCHAR(100) | UNIQUE, NOT NULL | 계정명 |
| account_type | VARCHAR(30) | NOT NULL | `cash`, `bank`, `card`, `ewallet`, `liability` |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 사용 여부 |
| created_at | DATETIME | NOT NULL | 생성 시각 |
| updated_at | DATETIME | NOT NULL | 수정 시각 |

## 9.2 categories
| 컬럼명 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK | 카테고리 ID |
| name | VARCHAR(100) | NOT NULL | 카테고리명 |
| category_type | VARCHAR(20) | NOT NULL | `income`, `expense` |
| parent_id | BIGINT | NULL | 상위 카테고리 |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 사용 여부 |
| created_at | DATETIME | NOT NULL | 생성 시각 |
| updated_at | DATETIME | NOT NULL | 수정 시각 |

## 9.3 transactions
| 컬럼명 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK | 거래 ID |
| occurred_at | DATETIME | NOT NULL | 실제 거래 시각 |
| transaction_type | VARCHAR(20) | NOT NULL | `income`, `expense` |
| account_id | BIGINT | FK, NOT NULL | 거래 계정 |
| category_id | BIGINT | FK, NULL | 카테고리 |
| amount | BIGINT | NOT NULL | 양의 정수, 원 단위 |
| description | VARCHAR(255) | NULL | 메모 |
| source_type | VARCHAR(20) | NOT NULL DEFAULT 'manual' | `manual`, `csv_import` |
| import_batch_id | BIGINT | FK, NULL | import_jobs 연결 |
| dedupe_hash | CHAR(64) | NULL | CSV 중복 판정용 |
| created_at | DATETIME | NOT NULL | 생성 시각 |
| updated_at | DATETIME | NOT NULL | 수정 시각 |

### transactions 규칙
- `amount`는 항상 1 이상의 양수 정수
- `transaction_type=income`이면 수입
- `transaction_type=expense`이면 지출
- 화면 표시와 통계 계산 시 타입 기준으로 부호를 해석

## 9.4 import_jobs (MVP-1.5)
| 컬럼명 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK | Import 작업 ID |
| filename | VARCHAR(255) | NOT NULL | 업로드 파일명 |
| status | VARCHAR(30) | NOT NULL | `pending`, `success`, `failed`, `partial_success` |
| total_rows | INT | NOT NULL DEFAULT 0 | 전체 행 수 |
| success_rows | INT | NOT NULL DEFAULT 0 | 성공 행 수 |
| skipped_rows | INT | NOT NULL DEFAULT 0 | 중복 스킵 수 |
| error_rows | INT | NOT NULL DEFAULT 0 | 오류 행 수 |
| created_at | DATETIME | NOT NULL | 생성 시각 |
| finished_at | DATETIME | NULL | 종료 시각 |

---

## 10. CSV Import / Export 상세 기획

## 10.1 최종 권장안
- **MVP:** CSV Export만 포함
- **MVP-1.5:** CSV Import 추가

### 이유
- Export는 구조가 단순하고 사용자에게 즉시 백업 가치를 제공한다.
- Import는 예외 상황과 검증 비용이 크므로 MVP 속도를 해친다.
- 먼저 Export 포맷을 확정한 뒤 Import를 설계하면 데이터 구조가 안정된다.

## 10.2 Export 정책
- UTF-8
- 구분자 `,`
- 헤더 포함
- 날짜 포맷 `YYYY-MM-DD`
- 금액은 정수
- 모든 거래를 표준 포맷으로 출력
- 선택적으로 월 범위 필터 지원 가능

## 10.3 Import 정책 (MVP-1.5)
- 표준 템플릿 1종부터 시작
- 업로드 즉시 반영하지 않고 Preview 단계 필수
- 정상/오류/중복 분리
- 사용자가 확인 후 반영

---

## 11. CSV 템플릿 권장안

### 11.1 표준 규격
- 인코딩: UTF-8
- 구분자: `,`
- 헤더: 필수
- 날짜 형식: `YYYY-MM-DD`
- 금액 형식: 정수
- 줄바꿈: LF 또는 CRLF 모두 허용

### 11.2 표준 컬럼 정의
| 필드명 | 필수 | 타입 | 설명 | 예시 |
|---|---|---|---|---|
| Date | Y | Date | 거래일 | 2026-03-15 |
| Type | Y | Text | `income` 또는 `expense` | expense |
| Account | Y | Text | 계정명 | 신한카드 |
| Category | N | Text | 카테고리명, 비어 있으면 미분류 | 식비 |
| Amount | Y | Integer | 양의 정수 | 15000 |
| Description | N | Text | 거래 설명 | 점심식사 |

### 11.3 예시 행
```csv
Date,Type,Account,Category,Amount,Description
2026-03-15,expense,신한카드,식비,15000,점심식사
2026-03-16,income,국민은행,급여,3000000,3월 급여
2026-03-17,expense,현금,교통비,2000,버스비
```

---

## 12. CSV 검증 및 오류 처리 정책

## 12.1 검증 규칙
- `Date`는 `YYYY-MM-DD` 형식이어야 한다.
- `Type`은 `income` 또는 `expense`만 허용한다.
- `Account`는 비어 있을 수 없다.
- `Amount`는 양의 정수여야 한다.
- `Category`가 비어 있으면 `미분류`로 처리 가능하다.
- 존재하지 않는 `Account`는 기본 정책상 오류 처리한다.
- 존재하지 않는 `Category`는 정책 선택이 필요하다.

## 12.2 Category 처리 권장안
- MVP-1.5 초기 권장안: 존재하지 않는 카테고리는 오류 처리
- 이후 확장안: “자동 생성 허용” 옵션 제공

## 12.3 중복 처리 정책
`Date + Type + Account + Amount + Description` 조합으로 정규화 문자열을 만들고 SHA-256 해시를 생성한다.

### 권장 기본 정책
- 동일 `dedupe_hash` 존재 시 **스킵**
- 결과 요약에서 스킵 건수 별도 표시

## 12.4 오류 처리 UX
- 전체 반영 전 Preview
- 오류 행은 빨간색 하이라이트
- 오류 사유 표시
- 정상 행만 반영 가능
- 전체 취소 가능

---

## 13. 인증 / 권한 방식

## 13.1 비교
### JWT
- 장점: API 분리, 모바일 앱 확장에 유리
- 단점: 단일 사용자 설치형에 과함, 토큰 관리 번거로움

### 세션 쿠키
- 장점: 단순하고 즉시 무효화 가능
- 단점: 서버 세션 저장 필요

## 13.2 최종 권장안
**세션 쿠키 기반 인증**

### 운영 상세 규칙
- 관리자 1계정만 지원
- 초기 관리자 비밀번호는 환경변수 또는 최초 실행 시 설정
- 최초 로그인 후 비밀번호 변경 권장
- Secure / HttpOnly / SameSite=Lax 쿠키 적용
- 세션 만료 시간 예: 12시간 또는 24시간
- 로그인 실패 횟수 제한은 초기엔 단순 로그 기록 수준, 추후 확장

---

## 14. 로그 / 모니터링 / 백업 전략

## 14.1 로그 경로 분리
기존 운영 규칙과 일치하도록 `/data/log` 기준으로 분리한다.

- 앱 로그: `/data/log/app/YYYY-MM-DD-app.log`
- Codex 작업 로그: `/data/log/codex/YYYY-MM-DD-job.log`
- 백업 로그: `/data/log/backup/YYYY-MM-DD-backup.log`

## 14.2 모니터링
MVP에서는 단순화한다.
- 앱 시작/종료 로그
- 인증 실패 로그
- API 예외 로그
- CSV Export / Import 실행 로그

## 14.3 백업
- MariaDB dump를 일 1회 수행
- 백업 보관 주기 예: 7일 / 30일
- CSV Export는 사용자 수동 백업 수단
- 자동 백업은 DB dump 기준으로 운영

---

## 15. 프론트엔드 구조 원칙

MVP 속도를 해치지 않으면서도 코드가 무너지지 않도록 최소 원칙을 둔다.

- Pages와 Components 분리
- API 호출 레이어 분리
- Form validation 로직 분리
- Accounts / Categories / Transactions UI 로직 분리
- CSV 관련 UI는 MVP-1.5부터 독립 모듈화

---

## 16. 기술 스택 최종 권장안

## 16.1 권장안
- **Frontend:** React + Vite
- **Backend:** FastAPI
- **Database:** MariaDB
- **Infra:** Docker Compose

## 16.2 권장 이유
- 운영자 환경이 Python/Linux에 더 친숙하다.
- FastAPI는 CRUD와 명세화에 빠르다.
- React는 반응형 입력 UX와 화면 확장에 유리하다.
- Docker Compose로 로컬/서버 운영 일관성을 맞추기 쉽다.

## 16.3 대안
- Backend를 Node.js(Express)로 통일
- 장점: JS 단일 언어
- 단점: 현재 운영자 친숙도 기준으로는 FastAPI보다 이점이 크지 않음

---

## 17. 단계별 개발 로드맵

## 17.1 1단계
- 저장소 구조 생성
- Docker Compose 구성
- MariaDB 연결
- 기본 DDL 작성

## 17.2 2단계
- Accounts / Categories / Transactions API 구현
- 로그인/세션 API 구현
- Health Check 구현

## 17.3 3단계
- React 기본 레이아웃
- 로그인 화면
- 대시보드
- 거래 목록 / 등록 / 수정 화면

## 17.4 4단계
- Settings 화면
- CSV Export
- 비밀번호 변경
- 반응형 정리

## 17.5 5단계
- CSV Import
- Preview / Validation / Import History
- 기본 통계

---

## 18. 백로그

### Must
- Docker Compose 환경
- FastAPI 앱 골격
- MariaDB 스키마
- 세션 로그인
- Accounts CRUD
- Categories CRUD
- Transactions CRUD
- 월별/일별 조회
- CSV Export
- 반응형 UI

### Should
- 기본 통계
- 월간 요약 카드
- 카테고리별 합계
- 비밀번호 변경
- 오류 로그 정리

### Could
- CSV Import
- Import History
- 다크 모드
- 예산 기능
- 반복 거래

---

## 19. Codex CLI용 첫 구현 작업 목록

1. 프로젝트 디렉터리 구조와 Docker Compose 파일 생성
2. FastAPI + MariaDB 연결 초기화
3. accounts, categories, transactions 테이블 DDL 작성
4. 세션 기반 로그인 API와 비밀번호 해시 처리 추가
5. Accounts CRUD API 작성
6. Categories CRUD API 작성
7. Transactions CRUD API 작성
8. 월별 거래 조회 및 합계 API 작성
9. CSV Export API 작성
10. React 기본 화면(Login, Dashboard, Transactions, Settings) 스캐폴드 생성

---

## 20. 최종 추천안 요약
- MVP에서는 `income`, `expense`만 지원하고 `transfer`는 제외한다.
- CSV는 Export를 먼저 넣고 Import는 MVP-1.5로 미룬다.
- 금액은 KRW 기준 양의 정수로 통일한다.
- `accounts`를 도입해 계정 중심 자산 관리를 한다.
- 인증은 단일 사용자 설치형에 맞춰 세션 쿠키를 사용한다.
- 로그는 `/data/log/app`, `/data/log/codex`, `/data/log/backup`으로 분리한다.
- 백엔드는 FastAPI, 프론트는 React, DB는 MariaDB를 권장한다.
- 구현은 CRUD → 로그인 → 대시보드 → CSV Export 순으로 간다.

