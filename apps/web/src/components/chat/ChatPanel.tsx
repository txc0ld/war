import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { ChatMessage } from './ChatMessage';

export interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MockMessage {
  id: string;
  address: string;
  message: string;
  timestamp: number;
  color: string;
}

const ADDRESS_COLORS = ['#00FFFF', '#CCFF00', '#FF00FF', '#FFD700'] as const;

const MOCK_MESSAGES: MockMessage[] = [
  {
    id: '1',
    address: '0x1a2B...9f3C',
    message: 'GG that was intense',
    timestamp: 1710700000,
    color: ADDRESS_COLORS[0],
  },
  {
    id: '2',
    address: '0xdEaD...bEEf',
    message: 'wagmi',
    timestamp: 1710700030,
    color: ADDRESS_COLORS[1],
  },
  {
    id: '3',
    address: '0x42fA...11aB',
    message: 'Bet on the underdog next round',
    timestamp: 1710700060,
    color: ADDRESS_COLORS[2],
  },
  {
    id: '4',
    address: '0x00Cc...77dD',
    message: 'That crit was insane',
    timestamp: 1710700090,
    color: ADDRESS_COLORS[3],
  },
  {
    id: '5',
    address: '0xaBcD...eF01',
    message: 'first time watching, this is sick',
    timestamp: 1710700120,
    color: ADDRESS_COLORS[0],
  },
];

export function ChatPanel({ isOpen, onToggle }: ChatPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className={cn(
            'fixed right-0 top-0 z-40 flex h-full w-80 flex-col',
            'border-l border-bg-border bg-bg-card/95 backdrop-blur',
          )}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-bg-border px-4 py-3">
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-text-primary">
              Spectator Chat
            </h2>
            <button
              type="button"
              onClick={onToggle}
              className="font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              CLOSE
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {MOCK_MESSAGES.map((msg) => (
              <ChatMessage
                key={msg.id}
                address={msg.address}
                message={msg.message}
                color={msg.color}
              />
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-bg-border px-4 py-3">
            <input
              type="text"
              disabled
              placeholder="Chat coming soon..."
              className={cn(
                'w-full rounded border border-bg-border bg-bg-card px-3 py-2',
                'font-mono text-xs text-text-muted placeholder:text-text-muted/50',
                'cursor-not-allowed',
              )}
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
