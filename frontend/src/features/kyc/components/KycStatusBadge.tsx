import { KycStatus } from '../types';

interface KycStatusBadgeProps {
  status: KycStatus;
}

const STATUS_CONFIG: Record<
  KycStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  NONE: {
    label: 'Not verified',
    bgColor: 'bg-[#FEE2E2]',
    textColor: 'text-[#991B1B]',
  },
  PENDING: {
    label: 'Pending review',
    bgColor: 'bg-[#E9E3D8]',
    textColor: 'text-[#804200]',
  },
  APPROVED: {
    label: 'Verified',
    bgColor: 'bg-[#DFE6E1]',
    textColor: 'text-[#004D1A]',
  },
  REJECTED: {
    label: 'Action required',
    bgColor: 'bg-[#FEE2E2]',
    textColor: 'text-[#991B1B]',
  },
};

export function KycStatusBadge({ status }: KycStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-2 text-[13px] font-bold ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
}
