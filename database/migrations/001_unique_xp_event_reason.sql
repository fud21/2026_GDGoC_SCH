-- 기존 P0/P1 데이터베이스에만 1회 적용한다.
-- 중복 보상 이력이 이미 있다면 먼저 원인을 확인하고 정리한 뒤 실행한다.

USE gdgoc_sch;

ALTER TABLE xp_events
  ADD UNIQUE KEY uq_xp_events_user_reason (user_id, reason);
