-- 트리거 전용 함수는 REST(rpc)로 직접 호출될 필요가 없으므로 실행 권한 회수
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
