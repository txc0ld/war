import { type FormEvent, type ReactNode, useCallback, useState } from 'react';

const STORAGE_KEY = 'warpath-site-auth';
const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD?.trim() ?? '';

function isAuthenticated(): boolean {
  if (SITE_PASSWORD === '') return true;
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === SITE_PASSWORD;
}

interface PasswordGateProps {
  children: ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps): ReactNode {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (value.trim() === SITE_PASSWORD) {
        window.localStorage.setItem(STORAGE_KEY, SITE_PASSWORD);
        setAuthed(true);
        setError(false);
      } else {
        setError(true);
      }
    },
    [value],
  );

  if (authed) return <>{children}</>;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <h1
        style={{
          fontSize: '1.25rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#fff',
          marginBottom: '2rem',
        }}
      >
        WAR ROOM
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          width: '100%',
          maxWidth: '20rem',
          padding: '0 1rem',
        }}
      >
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Enter access code"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: '#0a0a0a',
            border: error ? '1px solid #f87171' : '1px solid #2a2a2a',
            borderRadius: '0.25rem',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            letterSpacing: '0.08em',
            outline: 'none',
            textAlign: 'center',
          }}
        />

        <button
          type="submit"
          style={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: '#00BDFE',
            background: 'transparent',
            border: '1px solid #00BDFE',
            borderRadius: '0.25rem',
            padding: '0.625rem 2rem',
            cursor: 'pointer',
          }}
        >
          Enter
        </button>

        {error ? (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#f87171',
              margin: 0,
              letterSpacing: '0.04em',
            }}
          >
            Invalid access code
          </p>
        ) : null}
      </form>
    </div>
  );
}
