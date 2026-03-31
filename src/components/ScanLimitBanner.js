import React from 'react';
import { getScanStatus } from '../utils/scanLimit';

export default function ScanLimitBanner() {
  const status = getScanStatus();

  if (status.isAtLimit) {
    return (
      <div className="scan-limit scan-limit--exceeded" role="status">
        <p className="scan-limit__title">You&apos;ve reached today&apos;s free scan limit.</p>
        <p className="scan-limit__text">
          Pro and Business plans are coming soon with higher limits and team tools.
        </p>
      </div>
    );
  }

  return (
    <div className="scan-limit" role="status">
      <p className="scan-limit__title">
        Free plan includes {status.dailyLimit} scans per day.
      </p>
      <p className="scan-limit__text">
        {status.remaining} of {status.dailyLimit} scans remaining today.
      </p>
    </div>
  );
}
