// ═══════════════════════════════════════════════════════════
// GINGER — Dual Range Slider Component
// Modern dual-thumb interactive slider for ranges (e.g., price, followers)
// ═══════════════════════════════════════════════════════════

import React, { useRef, useCallback } from 'react';
import './DualRangeSlider.css';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (val: number, isMaxThumb?: boolean) => string;
  unitPrefix?: string;
  unitSuffix?: string;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue,
  unitPrefix = '',
  unitSuffix = '',
}) => {
  const [minVal, maxVal] = value;
  const minValRef = useRef(minVal);
  const maxValRef = useRef(maxVal);

  minValRef.current = minVal;
  maxValRef.current = maxVal;

  const getPercent = useCallback(
    (valueToConvert: number) => {
      const p = Math.round(((valueToConvert - min) / (max - min)) * 100);
      return Math.max(0, Math.min(100, p));
    },
    [min, max]
  );

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  const defaultFormatter = (val: number, isMax?: boolean) => {
    let formatted = val.toLocaleString();
    if (isMax && val >= max) {
      formatted += '+';
    }
    return `${unitPrefix}${formatted}${unitSuffix}`;
  };

  const formatter = formatValue || defaultFormatter;

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(event.target.value), maxValRef.current - step);
    onChange([val, maxValRef.current]);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(event.target.value), minValRef.current + step);
    onChange([minValRef.current, val]);
  };

  return (
    <div className="dual-slider-container">
      {/* Value Display Badge */}
      <div className="dual-slider-readout">
        <span className="dual-slider-val-range">
          {formatter(minVal, false)} – {formatter(maxVal, true)}
        </span>
      </div>

      {/* Slider Track and Thumb inputs */}
      <div className="dual-slider-track-wrap">
        <div className="dual-slider-track-bg" />
        <div
          className="dual-slider-track-fill"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="dual-slider-input dual-slider-min"
          style={{ zIndex: minVal > max - 100 ? '5' : '3' }}
          aria-label="Minimum value"
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="dual-slider-input dual-slider-max"
          style={{ zIndex: '4' }}
          aria-label="Maximum value"
        />
      </div>

      {/* Track Min/Max Bounds Indicators */}
      <div className="dual-slider-bounds">
        <span>{formatter(min, false)}</span>
        <span>{formatter(max, true)}</span>
      </div>
    </div>
  );
};

export default DualRangeSlider;
