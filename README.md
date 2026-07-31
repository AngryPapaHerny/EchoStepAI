# EchoStep AI

AI 상황별 **과업 수행 기반 학습(TBLT)** 및 **구두 성찰 언어 학습(MALL)** 웹앱.
학습자가 AI와 실제 상황(공항·카페·비즈니스 미팅 등)을 롤플레이하고, 대화가 끝나면
AI가 실수 교정 · 핵심 표현 · CAF 지표를 담은 **성찰 일지(Exit Ticket)** 를 만들어 준다.

## 아키텍처

```
브라우저 (React 19 + Vite + Tailwind 4)
        │
        ├── @supabase/supabase-js ──► Supabase Auth (이메일/비밀번호)
        │                        └──► Postgres + RLS
        │                             profiles / exit_tickets / vocabulary / caf_daily
        │
        └── functions.invoke ────────► Edge Function `ai` (Deno)
                                        ├─ /ai/roleplay      TBLT 대화 한 턴
                                        ├─ /ai/exit-ticket   세션 분석
                                        └─ /ai/translate     빠른 번역
                                              └──► Gemini API (키는 서버 시크릿)
```

| 레이어 | 호스팅 | 비고 |
| --- | --- | --- |
| 프론트엔드 | **Vercel** (정적 SPA) | `vite build` → `dist/` |
| 인증 / DB | **Supabase** | 프로젝트 `EchoStepAI` (`vkwrinqsjuchiulrgtxh`) |
| AI 백엔드 | **Supabase Edge Functions** | `ai` 함수 하나가 3개 경로를 라우팅 |

Gemini API 키는 **Edge Function 시크릿에만** 존재하며 브라우저 번들에 포함되지 않는다.
시크릿이 없으면 세 엔드포인트 모두 데모 응답으로 폴백하므로 키 없이도 시연이 가능하다.

## 데이터 모델

| 테이블 | 설명 |
| --- | --- |
| `profiles` | 학습자 프로필 · 코인 · 연속 학습일 · 배지. `auth.users`와 1:1, 가입 시 트리거로 자동 생성 |
| `exit_tickets` | 세션별 AI 성찰 일지 (점수, 실수 교정, CAF 점수, 자기 성찰문) |
| `vocabulary` | 세션에서 추출된 표현 저장소. `exit_ticket_id`로 티켓과 연결 |
| `caf_daily` (뷰) | 일 단위 CAF 평균 추이. `security_invoker`로 RLS 상속 |

모든 테이블에 RLS가 걸려 있어 학습자는 자신의 행만 읽고 쓸 수 있다.

`save_exit_ticket(...)` RPC가 **티켓 저장 + 신규 표현 어휘 적재 + 프로필 지표/연속일/배지 갱신**을
한 트랜잭션으로 처리한다. 같은 표현은 배치 안에서도, 기존 저장소와 비교해서도 중복 적재되지 않는다.

## 로컬 실행

```bash
npm install
npm run dev          # http://localhost:5173
```

Supabase URL과 publishable key는 `src/lib/supabase.ts`에 기본값이 들어 있어 별도 설정 없이 동작한다.
다른 Supabase 프로젝트에 붙이려면 `.env.local`에 `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`를 지정한다.

```bash
npm run lint         # tsc --noEmit
npm run build        # dist/ 생성
```

## 배포

### 프론트엔드 (Vercel)

`vercel.json`에 SPA rewrite와 마이크 권한 정책이 설정되어 있다.
Git 연동 시 push마다 자동 배포되며, 수동 배포는 다음과 같다.

```bash
npx vercel --prod
```

### 백엔드 (Supabase)

```bash
# 스키마
npx supabase db push --project-ref vkwrinqsjuchiulrgtxh

# Edge Function
npm run fn:deploy

# Gemini 키 등록 (필수)
npx supabase secrets set GEMINI_API_KEY=... --project-ref vkwrinqsjuchiulrgtxh
```

`GEMINI_MODEL` 시크릿으로 모델을 바꿀 수 있다 (기본값 `gemini-3.6-flash`).

스키마를 수정했다면 프론트 타입도 다시 생성한다.

```bash
npm run db:types
```

## 주요 디렉터리

```
src/
  components/          화면 단위 컴포넌트 (Home / Practice / Roleplay / Review / Profile / Auth)
  data/scenarios.ts    기본 제공 롤플레이 시나리오
  lib/
    supabase.ts        Supabase 클라이언트
    api.ts             Edge Function 호출 래퍼
    db.ts              Postgres 조회·저장 (RLS 기반)
    speech.ts          Web Speech API (STT/TTS)
    database.types.ts  스키마에서 생성된 타입
supabase/
  migrations/          DB 스키마 이력
  functions/ai/        Edge Function 소스
```
