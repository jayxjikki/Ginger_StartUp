-- ═══════════════════════════════════════════════════════════
-- GINGER — Fix Wallet RLS
-- ═══════════════════════════════════════════════════════════

-- Ensure RLS is enabled on wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any permissive policies if they exist (just to be safe)
DROP POLICY IF EXISTS "Users can read their own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Users can insert their own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Users can update their own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Users can delete their own wallet transactions" ON wallet_transactions;

-- Wallet Transactions SELECT policy
CREATE POLICY "Users can read their own wallet transactions"
ON wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Wallet Transactions INSERT policy (if needed for client creation, though typically done securely in backend)
CREATE POLICY "Users can insert their own wallet transactions"
ON wallet_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Wallet Transactions UPDATE policy (Strict)
CREATE POLICY "Users can update their own wallet transactions"
ON wallet_transactions FOR UPDATE
USING (auth.uid() = user_id);

-- Wallet Transactions DELETE policy (Strict)
CREATE POLICY "Users can delete their own wallet transactions"
ON wallet_transactions FOR DELETE
USING (auth.uid() = user_id);
