-- ═══════════════════════════════════════════════════════════
-- GINGER — Fix Wallet Transactions Amounts
-- Convert positive withdrawal amounts to negative
-- ═══════════════════════════════════════════════════════════

UPDATE public.wallet_transactions
SET amount = -amount
WHERE type = 'withdrawal' AND amount > 0;
