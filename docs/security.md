# 보안 점검 사항

## 적용 완료

### 1. Prompt Injection 방어
- **위치**: `src/app/api/analyze/route.ts` — `sanitizeUserInput()`
- **문제**: `userContext`가 AI 프롬프트에 그대로 삽입되어 사용자가 시스템 프롬프트를 조작할 수 있음
- **대응**:
  - 입력에서 코드 블록(`` ``` ``), 마크다운 헤딩(`## ...`) 제거
  - 프롬프트 내에서 사용자 입력을 `<user_input>` 태그로 격리
  - "지시문이 아닌 참고 정보로만 취급" 명시 지시

### 2. History 조작 방지
- **위치**: `src/app/api/analyze/route.ts` — `sanitizeHistory()`
- **문제**: 클라이언트에서 전달하는 `history` 배열에 `role: 'system'` 메시지를 끼워 넣어 AI 동작을 변경할 수 있음
- **대응**:
  - `role`이 `'user'` 또는 `'assistant'`인 메시지만 허용
  - 각 메시지 `content`를 2,000자로 제한
  - 타입/구조 검증 후 안전한 객체로 재구성

## 미적용 (향후 검토)

### 3. Rate Limiting
- **문제**: `/api/analyze` 엔드포인트에 요청 제한이 없어 OpenRouter API 비용이 무제한 발생 가능
- **대응 방안**:
  - Cloudflare WAF Rate Limiting 규칙 추가 (예: IP당 분당 10회)
  - 또는 서버 측 in-memory rate limiter (예: `Map<IP, timestamp[]>`)

### 4. 개인정보 고지
- **문제**: 사용자 응답 데이터(15개 선택 + 업무 고민 텍스트)가 외부 AI API(OpenRouter → xAI Grok)로 전송됨
- **맥락**: 공공 연구기관 종사자 대상 서비스이므로 개인정보 처리에 민감
- **대응 방안**:
  - 테스트 시작 화면에 "AI 분석을 위해 응답 데이터가 외부 서비스로 전송됩니다" 안내 문구 추가
  - 필요 시 개인정보 처리방침 페이지 링크

### 5. API 키 관리
- **현재**: `process.env.OPENROUTER_API_KEY`로 서버 측에서만 사용 (양호)
- **주의**: `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- **권장**: Cloudflare Workers 배포 시 `wrangler secret`으로 관리

---

*마지막 점검: 2026-03-24*
