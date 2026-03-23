import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Header } from '@/components/layout/Header';
import {
  getGlobalChat,
  postGlobalChat,
} from '@/lib/api';

const CHAT_LIMIT = 50;

export default function ChatPage(): React.ReactNode {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatQuery = useQuery({
    queryKey: ['chat', CHAT_LIMIT],
    queryFn: () => getGlobalChat(CHAT_LIMIT),
    refetchInterval: 7_500,
  });

  const orderedMessages = useMemo(
    () => [...(chatQuery.data?.messages ?? [])].reverse(),
    [chatQuery.data?.messages]
  );

  useEffect(() => {
    if (isConnected) {
      setError(null);
    }
  }, [isConnected]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!address || !isConnected || !draft.trim()) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const body = draft.trim();
      await postGlobalChat({ address, body });

      setDraft('');
      await queryClient.invalidateQueries({ queryKey: ['chat'] });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send chat');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="social-page">
      <Header />
      <main className="social-page__content">
        <section className="social-page__masthead">
          <p className="panel-label">Global Comms</p>
          <h1 className="panel-title">COMMS</h1>
          <p className="panel-copy">
            Live operator channel across every active wallet in the war room.
          </p>
        </section>

        <section className="social-panel" aria-label="Global comms">
          <div className="social-panel__header">
            <div>
              <p className="social-panel__eyebrow">Live Channel</p>
              <p className="social-panel__copy">
                Connected wallets can post here immediately without a second prompt.
              </p>
            </div>
            <span className="social-panel__meta">
              {isConnected
                ? 'comms ready'
                : `${orderedMessages.length} messages`}
            </span>
          </div>

          <div className="social-chat-feed">
            {chatQuery.isLoading ? (
              <div className="social-panel__empty">LOADING CHANNEL…</div>
            ) : null}
            {chatQuery.error ? (
              <div className="social-panel__empty">
                {chatQuery.error instanceof Error
                  ? chatQuery.error.message
                  : 'Failed to load chat'}
              </div>
            ) : null}
            {!chatQuery.isLoading && !chatQuery.error && orderedMessages.length === 0 ? (
              <div className="social-panel__empty">No transmissions yet.</div>
            ) : null}
            {!chatQuery.isLoading &&
              !chatQuery.error &&
              orderedMessages.map((entry) => (
                <ChatMessage
                  key={entry.id}
                  address={entry.address}
                  displayName={
                    entry.profile.showChatPresence ? entry.profile.displayName : null
                  }
                  ensName={
                    entry.profile.showChatPresence ? entry.profile.ensName : null
                  }
                  avatarUrl={
                    entry.profile.showChatPresence ? entry.profile.avatarUrl : null
                  }
                  message={entry.body}
                  timestamp={entry.createdAt}
                />
              ))}
          </div>

          <form className="social-chat-composer" onSubmit={handleSend}>
            <textarea
              className="social-chat-composer__field"
              value={draft}
              rows={3}
              maxLength={280}
              placeholder={
                isConnected
                  ? 'Send a message to the global channel…'
                  : 'Connect a wallet from home to join global comms.'
              }
              disabled={!isConnected || isSending}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="social-chat-composer__footer">
              <span className="social-chat-composer__hint">
                {error ?? `${draft.trim().length}/280`}
              </span>
              <button
                type="submit"
                className="warpath-button"
                disabled={
                  !isConnected ||
                  isSending ||
                  draft.trim().length === 0
                }
              >
                {isSending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
