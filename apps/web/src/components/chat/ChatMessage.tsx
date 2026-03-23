import './chatPanel.css';

export interface ChatMessageProps {
  address: string;
  message: string;
  displayName?: string | null;
  ensName?: string | null;
  avatarUrl?: string | null;
  timestamp?: number | string;
}

function shortenAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function normalizeTimestamp(value: number | string): Date {
  return new Date(
    typeof value === 'number' && value < 1_000_000_000_000
      ? value * 1000
      : value
  );
}

function formatAbsoluteLocalTime(value: Date): string {
  return value.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelativeTime(value: Date): string {
  const diffMs = value.getTime() - Date.now();
  const absDiffMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (absDiffMs < 45_000) {
    return 'just now';
  }

  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute');
  }

  const hours = Math.round(diffMs / 3_600_000);
  if (Math.abs(hours) < 24) {
    return rtf.format(hours, 'hour');
  }

  const days = Math.round(diffMs / 86_400_000);
  if (Math.abs(days) < 7) {
    return rtf.format(days, 'day');
  }

  return formatAbsoluteLocalTime(value);
}

export function ChatMessage({
  address,
  message,
  displayName,
  ensName,
  avatarUrl,
  timestamp,
}: ChatMessageProps) {
  const timeLabel =
    timestamp !== undefined
      ? formatRelativeTime(normalizeTimestamp(timestamp))
      : null;
  const absoluteTimeLabel =
    timestamp !== undefined
      ? formatAbsoluteLocalTime(normalizeTimestamp(timestamp))
      : null;
  const identityLabel =
    displayName?.trim() || ensName?.trim() || shortenAddress(address);
  const avatarFallback = (
    displayName?.trim()?.[0] ??
    ensName?.trim()?.[0] ??
    address.slice(2, 3) ??
    '?'
  ).toUpperCase();

  return (
    <div className="warpath-chat-message">
      <div className="warpath-chat-message__avatar">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={identityLabel}
            className="warpath-chat-avatar-image"
          />
        ) : (
          <span className="warpath-chat-avatar-fallback">{avatarFallback}</span>
        )}
      </div>
      <div className="warpath-chat-message__body">
        <div className="warpath-chat-message__topline">
          <span className="warpath-chat-address">{identityLabel}</span>
          <span className="warpath-chat-address-secondary">
            {shortenAddress(address)}
          </span>
          {timeLabel ? (
            <span
              className="warpath-chat-timestamp"
              title={absoluteTimeLabel ?? undefined}
              aria-label={absoluteTimeLabel ?? timeLabel}
            >
              {timeLabel}
            </span>
          ) : null}
        </div>
        <p className="warpath-chat-copy">{message}</p>
      </div>
    </div>
  );
}
