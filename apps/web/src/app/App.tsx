import { Providers } from './Providers';
import { AppRouter } from './Router';

export function App(): React.ReactNode {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
