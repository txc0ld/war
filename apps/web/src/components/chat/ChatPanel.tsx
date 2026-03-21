import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import './chatPanel.css';

export interface ChatPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  embedded?: boolean;
  messages?: Array<{
    author?: string;
    body?: string;
    address?: string;
    message?: string;
    timestamp?: number;
  }>;
}

const MOCK_MESSAGES = [
  {
    id: '1',
    address: '0x1a2B...9f3C',
    message: 'GG that was intense',
    timestamp: 1710700000,
  },
  {
    id: '2',
    address: '0xdEaD...bEEf',
    message: 'Sector blue is heating up',
    timestamp: 1710700030,
  },
  {
    id: '3',
    address: '0x42fA...11aB',
    message: 'Bet on the underdog next round',
    timestamp: 1710700060,
  },
];

export function ChatPanel({
  isOpen = true,
  onToggle,
  embedded = false,
  messages,
}: ChatPanelProps): React.ReactNode {
  const entries: Array<{
    id: string;
    address: string;
    message: string;
    timestamp?: number;
  }> =
    messages?.map((entry, index) => ({
      id: `${entry.address ?? entry.author ?? 'chat'}-${index}`,
      address: entry.address ?? entry.author ?? 'Observer',
      message: entry.message ?? entry.body ?? '',
      timestamp: entry.timestamp,
    })) ?? MOCK_MESSAGES;

  const visibleEntries = embedded ? entries.slice(-3) : entries;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          className={`warpath-chat-panel ${embedded ? 'warpath-chat-panel--embedded' : ''}`}
          initial={embedded ? { opacity: 0, y: 12 } : { x: '100%' }}
          animate={embedded ? { opacity: 1, y: 0 } : { x: 0 }}
          exit={embedded ? { opacity: 0, y: 12 } : { x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          aria-label="Battle log"
        >
          <div className="warpath-chat-header">
            <div>
              <h2 className="warpath-chat-title">{embedded ? 'Signal' : 'Field Chat'}</h2>
              <p className="warpath-chat-subtitle">
                {embedded ? 'Latest exchange' : 'Live battle chatter'}
              </p>
            </div>
            {onToggle ? (
              <button type="button" onClick={onToggle} className="warpath-chat-close">
                Close
              </button>
            ) : null}
          </div>

          <div className="warpath-chat-feed">
            {visibleEntries.map((msg) => (
              <ChatMessage
                key={msg.id}
                address={msg.address}
                message={msg.message}
                timestamp={msg.timestamp}
              />
            ))}
          </div>

          {!embedded ? (
            <div className="warpath-chat-input">
              <input
                type="text"
                disabled
                placeholder="Chat coming soon..."
                className="warpath-chat-input__field"
              />
            </div>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
