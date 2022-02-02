import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaCalendarAlt, FaUserAlt, FaRegClock } from 'react-icons/fa';
import PrismicDOM from 'prismic-dom';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../../services/prismic';
import { usePostsContext } from '../../hooks/usePostsContext';
import { Comments } from '../../components/Comments';

import { calculateRedingTime } from '../../utils/calculateReadingTime';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

interface PostItem {
  uid: string;
  title: string;
}

export default function Post({ post, preview = false }: PostProps) {
  const [nextPost, setNextPost] = useState({
    uid: '',
    title: '',
  } as PostItem);
  const [previousPost, setPreviousPost] = useState({
    uid: '',
    title: '',
  } as PostItem);

  const router = useRouter();
  const { query } = router;

  const { posts } = usePostsContext();

  useEffect(() => {
    posts.forEach((postItem, index) => {
      if (postItem.uid === query.slug) {
        if (index === 0) {
          setNextPost({
            uid: posts[index + 1].uid,
            title: posts[index + 1].data.title,
          });
        } else if (index === posts.length - 1) {
          setPreviousPost({
            uid: posts[index - 1].uid,
            title: posts[index - 1].data.title,
          });
        } else {
          setPreviousPost({
            uid: posts[index - 1].uid,
            title: posts[index - 1].data.title,
          });

          setNextPost({
            uid: posts[index + 1].uid,
            title: posts[index + 1].data.title,
          });
        }
      }
    });
  }, [posts, query.slug]);

  const formattedPost = {
    ...post,
    time: calculateRedingTime(post.data.content),
    data: {
      ...post.data,
      content: {
        heading: post.data.content.map(data => data.heading),
        body: post.data.content.map(data =>
          PrismicDOM.RichText.asText(data.body)
        ),
      },
    },
  };

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={styles.post_container}>
      <header>
        <Link href="/">
          <img src="/Logo.svg" alt="logo" />
        </Link>
      </header>

      <main>
        <div className={styles.banner_container}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>

        <section className={styles.content}>
          <h1 className={styles.title}>{post.data.title}</h1>

          <div className={styles.info}>
            <p>
              <FaCalendarAlt />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </p>
            <p>
              <FaUserAlt />
              {post.data.author}
            </p>
            <p>
              <FaRegClock />
              {formattedPost.time} min
            </p>
          </div>

          {post.last_publication_date && (
            <div className={styles.last_publication_date}>
              <i>
                * editado em{' '}
                {format(
                  new Date(post.first_publication_date),
                  'dd MMM yyyy, ',
                  {
                    locale: ptBR,
                  }
                )}
                às
                {format(new Date(post.first_publication_date), ' k:m', {
                  locale: ptBR,
                })}
              </i>
            </div>
          )}

          <div className={styles.post_text}>
            {formattedPost.data.content.heading.map((data, index) => (
              <article key={data}>
                <h1 className={styles.heading}>{data}</h1>
                <p className={styles.body}>
                  {formattedPost.data.content.body[index]}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <hr className={styles.divider} />

      <section className={styles.actions}>
        {previousPost.uid ? (
          <Link href={`/post/${previousPost.uid}`}>
            <div>
              <h3>{previousPost.title}</h3>
              <p>Post anterior</p>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextPost.uid ? (
          <Link href={`/post/${nextPost.uid}`}>
            <div>
              <h3>{nextPost.title}</h3>
              <p>Próximo post</p>
            </div>
          </Link>
        ) : (
          <div />
        )}
      </section>

      <Comments />

      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.title',
        'post.subtitle',
        'post.author',
        'post.banner',
        'post.content',
      ],
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post = { ...response };

  return {
    props: { post, preview },
  };
};
