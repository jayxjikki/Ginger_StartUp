import React, { useEffect, useState, useMemo } from 'react';
import { FiClock, FiAlertCircle } from 'react-icons/fi';
import './CampaignCountdownTimer.css';

interface CampaignCountdownTimerProps {
  createdAt?: string;
  endDate?: string | null;
  durationDays?: number; // e.g. campaign.verification_days || 35
  status?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isEnded: boolean;
  progressPercent: number;
}

export const CampaignCountdownTimer: React.FC<CampaignCountdownTimerProps> = ({
  createdAt,
  endDate,
  durationDays = 35,
  status = 'active',
}) => {
  // Determine absolute target end timestamp
  const { targetEndTime, startTime, totalDurationMs } = useMemo(() => {
    const start = createdAt ? new Date(createdAt).getTime() : Date.now();
    let end: number;

    if (endDate) {
      const parsedEnd = new Date(endDate).getTime();
      end = !isNaN(parsedEnd) ? parsedEnd : start + durationDays * 24 * 60 * 60 * 1000;
    } else {
      end = start + (durationDays || 35) * 24 * 60 * 60 * 1000;
    }

    return {
      startTime: start,
      targetEndTime: end,
      totalDurationMs: Math.max(1000, end - start),
    };
  }, [createdAt, endDate, durationDays]);

  // Calculate remaining time
  const calculateTimeRemaining = (): TimeRemaining => {
    const now = Date.now();
    const diff = Math.max(0, targetEndTime - now);
    const isEnded = diff <= 0 || status === 'completed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const elapsed = Math.max(0, now - startTime);
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDurationMs) * 100));

    return {
      days,
      hours,
      minutes,
      seconds,
      totalMs: diff,
      isEnded,
      progressPercent,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeRemaining);

  useEffect(() => {
    // Initial compute
    setTimeLeft(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetEndTime, startTime, totalDurationMs, status]);

  const formattedEndDate = useMemo(() => {
    return new Date(targetEndTime).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [targetEndTime]);

  return (
    <div className="campaign-timer-card glass-strong">
      {/* Top Header */}
      <div className="timer-header-row">
        <div className="timer-badge">
          <span className="pulse-timer-dot" />
          <FiClock size={13} className="timer-clock-icon" />
          <span className="timer-badge-text">
            {timeLeft.isEnded ? 'CAMPAIGN CONCLUDED' : 'CAMPAIGN ENDS IN'}
          </span>
        </div>
      </div>

      {/* Countdown Digits Row */}
      {timeLeft.isEnded ? (
        <div className="timer-ended-box">
          <FiAlertCircle size={20} className="text-warning" />
          <div>
            <div className="font-bold text-white text-sm">Campaign Duration Has Ended</div>
            <div className="text-xs text-secondary mt-0.5">Ended on {formattedEndDate}</div>
          </div>
        </div>
      ) : (
        <div className="timer-grid">
          <div className="timer-digit-box">
            <div className="timer-digit-value">{timeLeft.days}</div>
            <div className="timer-digit-label">DAYS</div>
          </div>

          <div className="timer-separator">:</div>

          <div className="timer-digit-box">
            <div className="timer-digit-value">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="timer-digit-label">HOURS</div>
          </div>

          <div className="timer-separator">:</div>

          <div className="timer-digit-box">
            <div className="timer-digit-value">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="timer-digit-label">MINS</div>
          </div>

          <div className="timer-separator">:</div>

          <div className="timer-digit-box">
            <div className="timer-digit-value text-accent">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="timer-digit-label">SECS</div>
          </div>
        </div>
      )}

      {/* Progress Bar & Subtext */}
      {!timeLeft.isEnded && (
        <div className="timer-footer">
          <div className="timer-progress-track">
            <div
              className="timer-progress-fill"
              style={{ width: `${Math.max(4, 100 - timeLeft.progressPercent)}%` }}
            />
          </div>

          <div className="timer-subtext-row">
            <span className="timer-subtext-left">
              {Math.max(0, 100 - timeLeft.progressPercent).toFixed(1)}% time remaining
            </span>
            <span className="timer-subtext-right">
              Ends on {formattedEndDate}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignCountdownTimer;
