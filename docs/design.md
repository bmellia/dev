# 가계부 거래 입력 화면 상세 명세서

## 1. 디자인 개요 (Overview)
- **컨셉**: 미니멀리즘, 깨끗한 화이트 테마, 직관적인 UX
- **주요 컬러**:
  - Primary: `#5D81AC` (Muted Blue - 저장 버튼, 활성 탭)
  - Background: `#F8F9FA` (Soft Grey - 앱 배경)
  - Card: `#FFFFFF` (Pure White - 입력 폼 카드)
  - Text: `#333333` (Main), `#888888` (Placeholder)
- **폰트**: Pretendard 또는 Noto Sans KR (Sans-serif 계열)

## 2. 레이아웃 구조 (Layout Structure)
- **Header**: 중앙 정렬된 페이지 타이틀 ("거래 및 데이터 입력 (2026.04월)")
- **Main Content**: 중앙에 배치된 둥근 모서리(Border-radius: 16px)의 입력 카드
- **Floating Widget**: 우측 하단에 위치한 '빠른 요약' 카드 (입력 시 실시간 업데이트)
- **Bottom Navigation**: 5개의 아이콘 메뉴 (홈, 내역, 입력, 보고서, 설정)

## 3. 컴포넌트별 상세 사양 (Component Details)

### A. 입력 폼 (Input Form)
1. **날짜 (Date)**:
   - 타입: Date Picker
   - 형식: `YYYY년 MM월 DD일`
   - 인터랙션: 클릭 시 캘린더 모달 호출
2. **카테고리 (Category)**:
   - 타입: Custom Dropdown
   - 항목: 외식, 장보기, 쇼핑, 교통, 의료, 문화 등
   - 스타일: 선택 시 하단 리스트가 부드럽게 펼쳐짐 (Z-index 처리 필요)
3. **거래처 / 출처 (Merchant)**:
   - 타입: Text Input
   - Placeholder: "예: 60계치킨"
4. **금액 및 타입 (Amount & Toggle)**:
   - **지출/수입 토글**: 세그먼트 컨트롤 형태. 활성화된 상태는 `#5D81AC` 배경색 적용
   - **금액 입력**: Number Input, 우측 정렬, '원' 단위 고정 표시. 숫자 입력 시 천 단위 콤마(`,`) 자동 삽입
5. **메모 (Notes)**:
   - 타입: Textarea (Multi-line)
   - 높이: 가변형 또는 고정(약 100px)

### B. 저장 버튼 (Action Button)
- **Label**: "거래 저장"
- **Style**: Full-width, Background `#5D81AC`, Text `#FFFFFF`, Border-radius `8px`
- **Hover/Active**: 클릭 시 약간 어두워지는 효과 적용

### C. 빠른 요약 위젯 (Quick Summary Widget)
- **지출/수입 요약**: 현재 월의 누계 데이터를 시각화
- **그래프**: 우측에 아주 작은 꺾은선형(Sparkline) 차트를 배치하여 이번 달 추이 표시 (Green/Red 컬러 적용)

## 4. 프론트엔드 구현 가이드 (Frontend Tips)
- **반응형**: 모바일 화면에 최적화하되, 웹 브라우저에서는 중앙 최대 너비를 `500px` 내외로 제한하여 모바일 앱 느낌 유지
- **상태 관리**: 금액 입력이나 타입 변경 시 하단 '빠른 요약' 위젯의 숫자가 즉시 반영되도록 `State` 연동
- **유효성 검사**: '금액' 필드가 비어있거나 0인 경우 '거래 저장' 버튼 비활성화 처리

## 5. 백엔드 API 엔드포인트 제안 (API Interface)
- **GET** `/api/summary?month=2026-04`: 빠른 요약 카드용 데이터 호출
- **POST** `/api/transactions`: 폼 데이터를 JSON 형태로 전송
  ```json
  {
    "date": "2026-04-25",
    "category": "외식",
    "merchant": "60계치킨",
    "type": "expense",
    "amount": 26100,
    "note": "저녁 식사"
  }
  ```
