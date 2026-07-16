-- 모의투자 라이브 모드 종목 시드 (P2)
-- 적용: mysql -u root -p gdgoc_sch < database/seed_sim.sql

USE gdgoc_sch;

INSERT INTO instruments (mode, symbol, display_name) VALUES
  ('live', 'KRW-BTC',  '비트코인'),
  ('live', 'KRW-ETH',  '이더리움'),
  ('live', 'KRW-XRP',  '리플'),
  ('live', 'KRW-SOL',  '솔라나'),
  ('live', 'KRW-DOGE', '도지코인'),
  ('live', 'KRW-ADA',  '에이다')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);
