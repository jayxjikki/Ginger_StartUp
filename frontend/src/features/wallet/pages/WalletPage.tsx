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
import './WalletPage.css';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

// Demo data
const demoBalance = {
  available: 45200,
  pending: 12800,
  total_earned: 285000,
  total_spent: 32000,
};

const demoTransactions = [
  { id: '1', type: 'earning', amount: 10000, status: 'completed', description: 'Campaign: Himalayan Resort', created_at: '2026-08-21T10:00:00Z' },
  { id: '2', type: 'earning', amount: 5000, status: 'completed', description: 'Campaign: Spice Garden', created_at: '2026-08-20T15:30:00Z' },
  { id: '3', type: 'withdrawal', amount: -25000, status: 'completed', description: 'Bank withdrawal', created_at: '2026-08-19T09:00:00Z' },
  { id: '4', type: 'earning', amount: 2000, status: 'pending', description: 'Campaign: FitZone Gym', created_at: '2026-08-18T14:00:00Z' },
  { id: '5', type: 'deposit', amount: 50000, status: 'completed', description: 'Razorpay deposit', created_at: '2026-08-17T11:00:00Z' },
  { id: '6', type: 'earning', amount: 15000, status: 'completed', description: 'Campaign: EduSpark', created_at: '2026-08-16T16:00:00Z' },
  { id: '7', type: 'commission', amount: -750, status: 'completed', description: 'Platform fee (5%)', created_at: '2026-08-16T16:00:00Z' },
];

const WalletPage: React.FC = () => {
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
                {formatCurrency(demoBalance.available)}
              </motion.h1>
              <div className="balance-pending">
                <FiClock size={12} />
                <span>{formatCurrency(demoBalance.pending)} pending</span>
              </div>
            </div>

            <div className="balance-actions">
              <Button variant="primary" size="md" icon={<FiPlus />} className="balance-btn">
                Add Money
              </Button>
              <Button variant="secondary" size="md" icon={<FiArrowUpRight />} className="balance-btn">
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
              <span className="wallet-stat-value text-success">{formatCurrency(demoBalance.total_earned, true)}</span>
              <span className="wallet-stat-label">Total Earned</span>
            </div>
          </Card>
          <Card variant="default" padding="md" className="wallet-stat">
            <span className="wallet-stat-icon">💸</span>
            <div>
              <span className="wallet-stat-value">{formatCurrency(demoBalance.total_spent, true)}</span>
              <span className="wallet-stat-label">Total Spent</span>
            </div>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">Recent Transactions</h5>
          <div className="transactions-list">
            {demoTransactions.map((tx, idx) => (
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
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WalletPage;
