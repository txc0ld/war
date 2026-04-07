import { Providers } from './Providers';
import { AppRouter } from './Router';
import { AmbientAudio } from '@/components/app/AmbientAudio';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PasswordGate } from '@/components/auth/PasswordGate';

export function App(): React.ReactNode {
  return (
    <PasswordGate>
      <Providers>
        <AmbientAudio />
        <AppRouter />
        <SiteFooter />
      </Providers>
    </PasswordGate>
  );
}
