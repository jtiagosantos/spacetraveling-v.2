import { useState } from 'react';
import { FaCalendarAlt, FaUserAlt } from 'react-icons/fa';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [urlToNextPage, setUrlToNextPage] = useState(postsPagination.next_page);

  async function handleLoadMorePosts() {
    const response = await fetch(urlToNextPage);
    const data = await response.json();

    const { results } = data;
    setPosts([...posts, ...results]);

    const { next_page } = data;
    setUrlToNextPage(next_page);
  }

  return (
    <main className={styles.home_container}>
      <Header />

      <section className={styles.posts_container}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <article className={styles.post}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <p>
                  <FaCalendarAlt />
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </p>
                <p>
                  <FaUserAlt />
                  {post.data.author}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </section>

      {urlToNextPage && (
        <button type="button" onClick={handleLoadMorePosts}>
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.title',
        'post.subtitle',
        'post.author',
        'post.banner',
        'post.content',
      ],
      pageSize: 5,
    }
  );

  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
