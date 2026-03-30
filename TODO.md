# Clean_style TODO

## 우선 확인

### API 키 설정
- [ ] OpenRouter API 키 확인 — https://openrouter.ai/settings/keys 에서 Active 상태 + 크레딧 잔액 확인
- [ ] 로컬: `.env.local`에 `OPENROUTER_API_KEY=sk-or-v1-...` 설정
- [ ] 배포: GitHub repo Settings → Secrets → `OPENROUTER_API_KEY` 설정 (deploy.yml이 Workers에 자동 반영)

## 보안: 악의적 API 반복 호출 대응

### 현재 적용된 방어 (2026-03-30)

| 계층 | 방법 | 대상 | 상태 |
|------|------|------|------|
| 인프라 | Cloudflare WAF / DDoS 방어 | 전체 트래픽 | 자동 적용 (CF 뒤에 배포) |
| 앱 | In-memory rate-limit (IP별) | `/api/chat` 20req/60s | 적용 |
| 앱 | In-memory rate-limit (IP별) | `/api/summarize` 20req/60s | 적용 |
| 앱 | In-memory rate-limit (IP별) | `/api/results` 5req/60s | 적용 |

### 악의적 호출 시나리오와 대응

**시나리오 1: curl 등으로 `/api/chat` 반복 호출**
- 위험: OpenRouter API 크레딧 소모
- 현재 대응: IP별 60초당 20회 제한 + 429 응답 + Retry-After 헤더
- API 키는 서버 사이드에서만 사용 → 클라이언트에 노출 안 됨

**시나리오 2: `/api/results` 반복 호출로 DB 쓰기 폭주**
- 위험: D1 쓰기 비용 증가, 통계 오염
- 현재 대응: IP별 60초당 5회 제한 (정상 사용: 테스트 완료 시 1회)

**시나리오 3: IP 우회 (VPN/프록시) 대량 호출**
- 현재 대응 없음 (in-memory rate-limit은 IP 기반)
- 추후 필요 시: Cloudflare Rate Limiting Rules (WAF 레벨) 또는 접속 코드(1단계) 도입

### 한계와 추후 고려

- **In-memory 방식**: Workers cold start 시 초기화됨 (fail-open). 영구 차단 필요 시 D1에 IP 기록 필요
- **현재 미보호**: `/api/questions` GET (공개 데이터라 영향 낮음)
- **비용 관점**: 현재 트래픽 규모에서는 in-memory rate-limit으로 충분. 기관 확대 시 접속 코드(아래 1단계) 병행 권장

## 나중에 할 것

### PWA 지원
- [ ] favicon 추가 (탭 구분용)
- [ ] manifest.json 생성 (앱 이름, 테마 색상, 아이콘)
- [ ] 아이콘 제작 (192x192, 512x512, apple-touch-icon 180x180)
- [ ] Service Worker 설정 (next-pwa 등)
- [ ] 판단 기준: 사용자 재방문 패턴이 확인되면 도입


### 접근 제한 / 기관 관리 (사용자 증가 대비)

사용자 증가 시 소속 명시·API 비용 통제·기관 한정 접속이 필요해질 수 있음.
단계별로 도입 가능하며, 상황에 맞는 단계를 선택.

**1단계: 접속 코드 (가장 간단)**
- [ ] 기관별 고유 접속 코드 발급 (예: `KAIST2026`)
- [ ] 테스트 시작 전 코드 입력 UI 추가
- [ ] 코드 목록을 환경변수 또는 D1 테이블에 저장
- [ ] `/api/chat`, `/api/summarize`에서 코드 검증 미들웨어 추가
- [ ] 결과 저장 시 기관 코드 함께 기록 → 기관별 사용량 추적
- 장점: 구현 간단, DB 변경 최소 / 단점: 코드 공유 시 통제 불가

**2단계: 이메일 도메인 제한 (중간)**
- [ ] 시작 전 이메일 입력 → 도메인 체크 (비밀번호 불필요)
- [ ] 허용 도메인 목록 D1 관리 (예: `@kaist.ac.kr`, `@snu.ac.kr`)
- [ ] 선택: Magic Link 인증 메일 발송
- 장점: 기관 소속 확인 가능 / 단점: 개인 메일 사용 시 우회 가능

**3단계: 기관 계정 + 사용량 관리 (본격)**
- [ ] D1에 기관 테이블 생성 (`org_id`, `name`, `monthly_quota`, `used`)
- [ ] 기관별 월간 AI 호출 횟수/토큰 상한 설정
- [ ] 상한 도달 시 AI 채팅만 비활성화 (테스트 자체는 허용)
- [ ] 관리자 대시보드: 기관별 사용량 확인 페이지
- 장점: 비용 통제·정산 가능 / 단점: 구현 복잡

**도입 판단 기준:**
- 몇 개 기관만 → 1단계
- 기관 확정 + 비용 추적 → 1단계 + 사용량 로그
- 불특정 다수 기관 → 2단계
- 과금/정산 필요 → 3단계
