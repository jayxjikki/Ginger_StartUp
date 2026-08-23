// ═══════════════════════════════════════════════════════════
// GINGER — Wallet Page
// Balance, transactions, deposit & withdraw
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiArrowDownLeft, FiPlus, FiClock } from 'react-icons/fi';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { formatCurrency, formatRelativeTime } from '../../../utils/formatters';
import { useAuthStore } from '../../../store/authStore';
import { useWalletStore } from '../../../store/walletStore';
import AddMoneyModal from '../components/AddMoneyModal';
import WithdrawModal from '../components/WithdrawModal';
import './WalletPage.css';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

const WalletPage: React.FC = () => {
  const { user } = useAuthStore();
  const { balance, transactions, isLoading, fetchWalletData } = useWalletStore();
  
  const [isAddMoneyOpen, setIsAddMoneyOpen] = React.useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false);

  React.useEffect(() => {
    if (user?.id) {
      fetchWalletData(user.id);
    }
  }, [user?.id, fetchWalletData]);

  if (isLoading) {
    return (
      <div className="page-content flex justify-center items-center h-full">
        <p>Loading Wallet...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <motion.div
        className="container wallet-page"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div className="wallet-header" variants={fadeUp}>
          <h3>Wallet</h3>
        </motion.div>

        {/* Balance Card */}
        <motion.div variants={fadeUp}>
          <Card variant="ginger" padding="lg" className="balance-card">
            <div className="balance-top">
              <span className="balance-label">Available Balance</span>
              <motion.h1
                className="balance-amount"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' as const, stiffness: 200, damping: 20 }}
              >
                {formatCurrency(balance.available)}
              </motion.h1>
              <div className="balance-pending">
                <FiClock size={12} />
                <span>{formatCurrency(balance.pending)} pending</span>
              </div>
            </div>

            <div className="balance-actions">
              <Button 
                variant="primary" 
                size="md" 
                icon={<FiPlus />} 
                className="balance-btn"
                onClick={() => setIsAddMoneyOpen(true)}
              >
                Add Money
              </Button>
              <Button 
                variant="secondary" 
                size="md" 
                icon={<FiArrowUpRight />} 
                className="balance-btn"
                onClick={() => setIsWithdrawOpen(true)}
              >
                Withdraw
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div className="wallet-stats" variants={fadeUp}>
          <Card variant="default" padding="md" className="wallet-stat">
            <span className="wallet-stat-icon">📈</span>
            <div>
              <span className="wallet-stat-value text-success">{formatCurrency(balance.total_earned, true)}</span>
              <span className="wallet-stat-label">Total Earned</span>
            </div>
          </Card>
          <Card variant="default" padding="md" className="wallet-stat">
            <span className="wallet-stat-icon">💸</span>
            <div>
              <span className="wallet-stat-value">{formatCurrency(balance.total_spent, true)}</span>
              <span className="wallet-stat-label">Total Spent</span>
            </div>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">Recent Transactions</h5>
          <div className="transactions-list">
            {transactions.length > 0 ? transactions.map((tx, idx) => (
              <motion.div
                key={tx.id}
                className="transaction-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.04, type: 'spring' as const, stiffness: 300, damping: 30 }}
              >
                <div className={`tx-icon tx-${tx.type}`}>
                  {tx.amount > 0 ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                </div>
                <div className="tx-info">
                  <span className="tx-desc">{tx.description}</span>
                  <span className="tx-time">{formatRelativeTime(tx.created_at)}</span>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${tx.amount > 0 ? 'tx-positive' : 'tx-negative'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                  <Badge
                    variant={tx.status === 'completed' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {tx.status}
                  </Badge>
                </div>
              </motion.div>
            )) : (
              <p className="text-secondary text-sm">No transactions yet.</p>
            )}
          </div>
        </motion.div>
      </motion.div>

      <AddMoneyModal 
        isOpen={isAddMoneyOpen} 
        onClose={() => setIsAddMoneyOpen(false)} 
      />
      
      <WithdrawModal 
        isOpen={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={balance.available}
      />
    </div>
  );
};

export default WalletPage;
