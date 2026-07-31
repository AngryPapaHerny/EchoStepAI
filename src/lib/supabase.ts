import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Supabase 클라이언트.
 *
 * URL과 publishable key는 브라우저에 공개되도록 설계된 값이다.
 * 실제 데이터 보호는 RLS 정책이 담당하므로 여기에 기본값으로 두어도 안전하며,
 * 다른 프로젝트로 붙일 때는 Vercel 환경변수로 덮어쓰면 된다.
 * (GEMINI_API_KEY 같은 비밀 값은 절대 여기에 두지 말 것 — Edge Function 시크릿으로만 관리한다.)
 */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://vkwrinqsjuchiulrgtxh.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  'sb_publishable_LyHbzBBKhbYWGwtWApJwFQ_U4V_qm5V';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
