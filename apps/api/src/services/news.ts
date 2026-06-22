/**
 * news.ts — EBE's news sense. Uses NewsAPI when NEWS_API_KEY is set, else free Hacker News.
 * Degrades gracefully to a labelled sample when offline.
 */
import 'dotenv/config';

export type Headline = { title: string; url?: string; source?: string };
export type News = { available: boolean; source: string; headlines: Headline[]; note?: string };

async function fromNewsApi(key: string, topic?: string): Promise<Headline[]> {
  const url = topic
    ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${key}`
    : `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&apiKey=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`newsapi ${r.status}`);
  const d = (await r.json()) as { articles?: { title: string; url: string; source?: { name?: string } }[] };
  return (d.articles ?? []).map((a) => ({ title: a.title, url: a.url, source: a.source?.name }));
}

async function fromHackerNews(): Promise<Headline[]> {
  const r = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  if (!r.ok) throw new Error(`hn ${r.status}`);
  const ids = ((await r.json()) as number[]).slice(0, 10);
  const items = await Promise.all(
    ids.map(async (id) => {
      const ir = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const it = (await ir.json()) as { title?: string; url?: string };
      return { title: it.title ?? '(untitled)', url: it.url, source: 'Hacker News' };
    })
  );
  return items;
}

export async function getNews(topic?: string): Promise<News> {
  const key = process.env.NEWS_API_KEY;
  try {
    if (key) return { available: true, source: 'NewsAPI', headlines: await fromNewsApi(key, topic) };
    return { available: true, source: 'Hacker News', headlines: await fromHackerNews() };
  } catch (e) {
    return {
      available: false,
      source: 'sample',
      note: e instanceof Error ? e.message : 'news unavailable',
      headlines: [
        { title: 'Connect a news source — set NEWS_API_KEY or enable egress', source: 'EBE' },
        { title: 'Markets steady ahead of data (sample)', source: 'sample' },
        { title: 'Local: supply costs ease for small businesses (sample)', source: 'sample' }
      ]
    };
  }
}
