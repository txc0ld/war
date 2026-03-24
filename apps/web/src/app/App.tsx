import { Providers } from './Providers';
import { AppRouter } from './Router';
import { AmbientAudio } from '@/components/app/AmbientAudio';
import { SiteFooter } from '@/components/layout/SiteFooter';

export function App(): React.ReactNode {
  return (
    <Providers>
      <AmbientAudio />
      <AppRouter />
      <SiteFooter />
    </Providers>
  );
}
