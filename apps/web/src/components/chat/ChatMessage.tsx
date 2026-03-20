import './chatPanel.css';

export interface ChatMessageProps {
  address: string;
  message: string;
  timestamp?: number;
}

export function ChatMessage({
  address,
  message,
  timestamp,
}: ChatMessageProps) {
  const timeLabel =
    typeof timestamp === 'number'
      ? new Date(timestamp * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  return (
    <div className="warpath-chat-message">
      <div className="warpath-chat-message__topline">
        <span className="warpath-chat-address">
          {address}
        </span>
        {timeLabel ? (
          <span className="warpath-chat-timestamp">{timeLabel}</span>
        ) : null}
      </div>
      <p className="warpath-chat-copy">{message}</p>
    </div>
  );
}
