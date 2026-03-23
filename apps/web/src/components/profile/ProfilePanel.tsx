import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import { createProfileUpdateMessage, type ProfileUpdatePayload } from '@warpath/shared';
import {
  createSignedProfileUpdateRequest,
  getProfile,
  saveProfile,
} from '@/lib/api';

function shortenAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

async function resizeAvatar(file: File): Promise<string> {
  const fileUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = fileUrl;
    });

    const size = 192;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to process image');
    }

    const shortestSide = Math.min(image.width, image.height);
    const sourceX = (image.width - shortestSide) / 2;
    const sourceY = (image.height - shortestSide) / 2;

    context.drawImage(
      image,
      sourceX,
      sourceY,
      shortestSide,
      shortestSide,
      0,
      0,
      size,
      size
    );

    const dataUrl = canvas.toDataURL('image/webp', 0.82);
    if (dataUrl.length > 180_000) {
      throw new Error('Image is too large after compression');
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(fileUrl);
  }
}

interface ProfileDraft {
  displayName: string;
  avatarUrl: string;
  statusMessage: string;
  showBattleResults: boolean;
  showChatPresence: boolean;
}

const defaultDraft: ProfileDraft = {
  displayName: '',
  avatarUrl: '',
  statusMessage: '',
  showBattleResults: true,
  showChatPresence: true,
};

export function ProfilePanel(): React.ReactNode {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(defaultDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      return getProfile(address);
    },
    enabled: isConnected && !!address,
    staleTime: 30_000,
  });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      setDraft(defaultDraft);
      return;
    }

    setDraft({
      displayName: profile.displayName ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      statusMessage: profile.statusMessage ?? '',
      showBattleResults: profile.showBattleResults,
      showChatPresence: profile.showChatPresence,
    });
  }, [profileQuery.data]);

  const identityLabel = useMemo(() => {
    const displayName = profileQuery.data?.displayName?.trim();
    if (displayName) {
      return displayName;
    }

    const ensName = profileQuery.data?.ensName?.trim();
    if (ensName) {
      return ensName;
    }

    return address ? shortenAddress(address) : 'Profile';
  }, [address, profileQuery.data?.displayName, profileQuery.data?.ensName]);

  if (!isConnected || !address) {
    return null;
  }

  async function handleAvatarFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const avatarUrl = await resizeAvatar(file);
      setDraft((current) => ({
        ...current,
        avatarUrl,
      }));
      setSuccess('Profile image ready to save.');
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to prepare profile image'
      );
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!address) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const currentAddress = address;
      const payload: ProfileUpdatePayload = {
        address: currentAddress,
        displayName: draft.displayName.trim() || null,
        avatarUrl: draft.avatarUrl.trim() || null,
        statusMessage: draft.statusMessage.trim() || null,
        showBattleResults: draft.showBattleResults,
        showChatPresence: draft.showChatPresence,
        issuedAt: new Date().toISOString(),
      };
      const signature = await signMessageAsync({
        message: createProfileUpdateMessage(payload),
      });
      await saveProfile(createSignedProfileUpdateRequest(payload, signature));
      await queryClient.invalidateQueries({ queryKey: ['profile', currentAddress] });
      await queryClient.invalidateQueries({ queryKey: ['chat'] });
      await queryClient.invalidateQueries({ queryKey: ['killfeed'] });
      setSuccess('Profile updated.');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to save profile'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="site-header__profile-trigger"
        onClick={() => setIsOpen(true)}
      >
        <span className="site-header__profile-trigger-label">Profile</span>
        <span className="site-header__profile-trigger-value">{identityLabel}</span>
      </button>

      {isOpen ? (
        <div
          className="profile-panel-backdrop"
          role="presentation"
          onClick={() => setIsOpen(false)}
        >
          <section
            className="profile-panel"
            aria-label="Profile settings"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="profile-panel__header">
              <div>
                <p className="panel-label">Operator Profile</p>
                <h2 className="panel-title">IDENTITY</h2>
                <p className="panel-copy">
                  Configure how your wallet appears in global chat and the live killfeed.
                </p>
              </div>
              <button
                type="button"
                className="profile-panel__close"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </header>

            <form className="profile-panel__form" onSubmit={handleSubmit}>
              <label className="profile-panel__field">
                <span>Display name</span>
                <input
                  value={draft.displayName}
                  maxLength={280}
                  placeholder={profileQuery.data?.ensName?.trim() || 'Set a custom display name'}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="profile-panel__field">
                <span>Profile picture</span>
                <div className="profile-panel__avatar-row">
                  <div className="profile-panel__avatar-preview">
                    {draft.avatarUrl ? (
                      <img src={draft.avatarUrl} alt={identityLabel} />
                    ) : (
                      <span>{identityLabel.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="profile-panel__avatar-controls">
                    <label className="profile-panel__upload">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(event) => {
                          void handleAvatarFileChange(event);
                        }}
                      />
                      <span>
                        {isUploadingAvatar ? 'Processing…' : 'Upload image'}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="profile-panel__avatar-clear"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          avatarUrl: '',
                        }))
                      }
                    >
                      Remove image
                    </button>
                  </div>
                </div>
                <input
                  value={draft.avatarUrl.startsWith('data:image/') ? '' : draft.avatarUrl}
                  type="url"
                  maxLength={1000}
                  placeholder="Or paste an image URL"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      avatarUrl: event.target.value,
                    }))
                  }
                />
              </div>

              <label className="profile-panel__field">
                <span>Status message</span>
                <textarea
                  value={draft.statusMessage}
                  maxLength={280}
                  rows={3}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      statusMessage: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="profile-panel__toggle">
                <input
                  type="checkbox"
                  checked={draft.showBattleResults}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      showBattleResults: event.target.checked,
                    }))
                  }
                />
                <span>Show my battle results in the global killfeed</span>
              </label>

              <label className="profile-panel__toggle">
                <input
                  type="checkbox"
                  checked={draft.showChatPresence}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      showChatPresence: event.target.checked,
                    }))
                  }
                />
                <span>Show my display name and picture in global chat</span>
              </label>

              <div className="profile-panel__meta">
                <span className="profile-panel__address">{shortenAddress(address)}</span>
                {profileQuery.data?.ensName?.trim() ? (
                  <span className="profile-panel__status">
                    ENS: {profileQuery.data.ensName}
                  </span>
                ) : null}
                {profileQuery.isLoading ? (
                  <span className="profile-panel__status">Loading profile…</span>
                ) : null}
                {error ? <span className="profile-panel__status profile-panel__status--error">{error}</span> : null}
                {success ? (
                  <span className="profile-panel__status profile-panel__status--success">{success}</span>
                ) : null}
              </div>

              <div className="profile-panel__actions">
                <button
                  type="button"
                  className="warpath-button warpath-button--ghost"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="warpath-button"
                  disabled={isSaving || isUploadingAvatar}
                >
                  {isSaving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
