import { AppProps } from 'next/app';
import { PostsProvider } from '../contexts/PostsContext';
import '../styles/globals.scss';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <PostsProvider>
      <Component {...pageProps} />
    </PostsProvider>
  );
}

export default MyApp;
