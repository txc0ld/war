export interface ChatMessageProps {
  address: string;
  message: string;
  color: string;
}

export function ChatMessage({ address, message, color }: ChatMessageProps) {
  return (
    <div className="flex gap-2 font-mono text-xs leading-relaxed">
      <span className="shrink-0 font-semibold" style={{ color }}>
        {address}
      </span>
      <span className="text-text-secondary break-words">{message}</span>
    </div>
  );
}
