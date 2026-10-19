# 상담 범위 판정 실험 보관

2026-10-14에 작성한 청렴 상담 범위 판정·재질문 정책 비교와 진단별 조언 점검 코드입니다.
현재 앱의 상담 정책을 선택하는 실행 경로가 아니며, 서버 빌드나 배포 명령에 연결하지 않습니다.
과거 모델·API·비용 가정은 실험 당시의 조건이고 현재 사용 가능성이나 가격을 보장하지 않습니다.

- `integrity-scope-policy*.mjs`: 비교한 정책과 응답 판정 규칙.
- `decisions-scope-pilot*.mjs`, `decisions-scope-followup-check.mjs`: 실험 실행·후속 확인.
- `scope-pilot-runtime.mjs`, `diagnostic-advice-simulation.mjs`: 소스 로딩·가림·호출 기록을 다루는 실행 보조 코드.
- `fixtures/`: 합성 질문과 기대 판정. 실제 직원 응답을 넣지 않습니다.
- `render-scope-refined-report.mjs`: 기존 결과로 보고서를 만드는 보조 코드.

## 외부 호출 없는 확인

프로젝트의 Windows Node.js와 설치된 의존성을 사용해 루트에서 실행합니다.

```powershell
node --test scripts/experiments/decisions-scope-pilot.test.mjs scripts/experiments/decisions-scope-pilot-v2.test.mjs scripts/experiments/decisions-scope-pilot-v3.test.mjs scripts/experiments/decisions-scope-pilot-v4.test.mjs
```

2026-10-19 통합 검토에서 위 명령의 14개 검사를 통과했습니다. 실제 외부 AI 요청은 재실행하지 않았습니다.
일부 실행기는 `--live`를 주면 프로젝트 `.env.local`의 기존 키를 읽어 외부 API를 호출합니다.
이는 별도 비용과 전송이 발생하는 실험이며 위 검사 명령에는 포함되지 않습니다.
원시 결과·호출 기록은 Git에서 제외한 `artifacts/`에 보관하고 키·실제 개인정보를 커밋하지 않습니다.

## 증거 범위

기존 `docs/ai-chat-scope-pilot*-results.html` 및 출시 QA의 범위 판정 항목과 함께 읽습니다.
코드·합성 검사의 통과는 실제 모델 답변 품질, 사용자 효과, 운영 환경, 법률·안전 적합성의 승인과 구분합니다.
