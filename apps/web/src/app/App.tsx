import { Providers } from './Providers';
import { AppRouter } from './Router';
import { AmbientAudio } from '@/components/app/AmbientAudio';

export function App(): React.ReactNode {
  return (
    <Providers>
      <AmbientAudio />
      <AppRouter />
    </Providers>
  );
}
