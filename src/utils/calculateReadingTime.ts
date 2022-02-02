import PrismicDOM from 'prismic-dom';

interface calculateReadingTimeParams {
  heading: string;
  body: {
    text: string;
  }[];
}

export function calculateRedingTime(
  content: calculateReadingTimeParams[]
): number {
  const heading = content.map(data => data.heading);
  const body = content.map(data => PrismicDOM.RichText.asText(data.body));

  const text = [...heading, ...body].join(' ');
  const arrayWords = text.split(' ');
  const totalWords = arrayWords.length;

  const readingTime = Math.ceil(totalWords / 200);

  return readingTime;
}
