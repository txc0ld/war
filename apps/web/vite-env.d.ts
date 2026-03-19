/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_ALCHEMY_ID: string;
  readonly VITE_TARGET_CHAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
