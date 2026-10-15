import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { FEED_PAGE_SIZE, fetchFeed, toggleCheers, type FeedItem } from './feedApi';

type FeedStatus = 'loading' | 'ready' | 'error';

// The friends feed, page by page. It loads again each time its screen comes
// into view, so what friends shared meanwhile is there without a pull.
export function useFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Every first page asked for gets a number; only the latest may land, so a
  // slow answer never replaces a newer one.
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const page = await fetchFeed();
      if (mine !== generation.current) return;
      setItems(page);
      setHasMore(page.length === FEED_PAGE_SIZE);
      setStatus('ready');
    } catch {
      if (mine === generation.current) setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const loadMore = useCallback(async () => {
    const last = items.at(-1);
    if (!hasMore || loadingMore || !last) return;
    const mine = generation.current;
    setLoadingMore(true);
    try {
      const page = await fetchFeed(last);
      if (mine !== generation.current) return;
      setItems((current) => [...current, ...page.filter((item) => !current.some((other) => other.id === item.id))]);
      setHasMore(page.length === FEED_PAGE_SIZE);
    } catch {
      // Scrolling to the end again tries once more.
    } finally {
      setLoadingMore(false);
    }
  }, [items, hasMore, loadingMore]);

  // Shows the change at once and puts it back if the save fails.
  const cheer = useCallback(async (item: FeedItem) => {
    const apply = (cheered: boolean) =>
      setItems((current) =>
        current.map((other) =>
          other.id === item.id
            ? { ...other, cheered, cheers: Math.max(0, other.cheers + (cheered === other.cheered ? 0 : cheered ? 1 : -1)) }
            : other,
        ),
      );
    apply(!item.cheered);
    try {
      apply(await toggleCheers(item.id));
    } catch (error) {
      apply(item.cheered);
      throw error;
    }
  }, []);

  // For someone just blocked: their coffees leave the feed straight away.
  const dropAuthor = useCallback((authorId: string) => {
    setItems((current) => current.filter((item) => item.author.id !== authorId));
  }, []);

  return { items, status, hasMore, loadingMore, reload, loadMore, cheer, dropAuthor };
}
