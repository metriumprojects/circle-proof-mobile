import {
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import HomeFeedBox from '../components/HomeFeedBox';
import NewsCard from '../components/NewsCard';
import { useAuth } from '../context/AuthContext';
import { getAllPosts } from '../api/service';
import { mapPostToNewsCardProps } from '../util/postFormatter';
import { getCachedPosts, setCachedPosts } from '../lib/postsCache';

const { height } = Dimensions.get('window');
const guidelineBaseHeight = 812;

const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const HOME_FEED_CACHE_KEY = 'home_feed:page1';

const FeedPostItem = React.memo(({ post }: { post: any }) => {
  const cardProps = useMemo(() => mapPostToNewsCardProps(post), [post]);
  return <NewsCard {...cardProps} />;
});

const HomeScreen = () => {
  const { isAuthenticated, loading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const isFetchingMoreRef = useRef(false);

  const fetchPosts = useCallback(
    async (page: number = 1, options?: { silent?: boolean }) => {
      try {
        if (page === 1) {
          if (!options?.silent) {
            setPostsLoading(true);
          }
        } else {
          isFetchingMoreRef.current = true;
          setLoadingMore(true);
        }

        const response = await getAllPosts(page);
        const fetchedPosts = response.data?.data?.posts;

        if (Array.isArray(fetchedPosts)) {
          let nextPagination = response.data?.data?.pagination;
          if (!nextPagination) {
            const defaultPageSize = 10;
            nextPagination = {
              currentPage: page,
              totalPages: 0,
              totalPosts: fetchedPosts.length,
              hasNext: fetchedPosts.length >= defaultPageSize,
              hasPrev: page > 1,
            };
          }

          if (page === 1) {
            setPosts(fetchedPosts);
            setCachedPosts(HOME_FEED_CACHE_KEY, fetchedPosts, nextPagination);
          } else {
            setPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
          }
          setPagination(nextPagination);
        } else if (page === 1 && !options?.silent) {
          setPosts([]);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalPosts: 0,
            hasNext: false,
            hasPrev: false,
          });
        }
      } catch (error) {
        console.error('[HomeScreen] Error fetching posts:', error);
        if (page === 1 && !options?.silent) {
          setPosts([]);
        }
      } finally {
        setPostsLoading(false);
        setLoadingMore(false);
        isFetchingMoreRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    let cancelled = false;

    const loadInitial = async () => {
      const cached = await getCachedPosts<any[]>(HOME_FEED_CACHE_KEY);
      if (cancelled) return;
      if (cached && cached.posts.length > 0) {
        setPosts(cached.posts);
        if (cached.pagination) {
          setPagination(cached.pagination);
        }
        setPostsLoading(false);
        fetchPosts(1, { silent: true });
      } else {
        fetchPosts(1);
      }
    };

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [loading, isAuthenticated, fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(1, { silent: true });
    setRefreshing(false);
  }, [fetchPosts]);

  const loadMorePosts = useCallback(async () => {
    if (
      pagination.hasNext &&
      !loadingMore &&
      !isFetchingMoreRef.current &&
      !postsLoading
    ) {
      const nextPage = pagination.currentPage + 1;
      await fetchPosts(nextPage);
    }
  }, [pagination.hasNext, pagination.currentPage, loadingMore, postsLoading, fetchPosts]);

  const renderFeedItem = useCallback(
    ({ item }: { item: any }) => <FeedPostItem post={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) => String(item?.id ?? item?._id ?? index),
    [],
  );

  const renderFooter = useCallback(() => {
    if (!pagination?.hasNext) return null;

    return (
      <View style={styles.loadMoreContainer}>
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingMoreText}>Loading more posts...</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMorePosts}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreText}>Load More Posts</Text>
        </TouchableOpacity>
      </View>
    );
  }, [pagination?.hasNext, loadingMore, loadMorePosts]);

  const renderEmpty = useCallback(
    () => (
      <NewsCard
        author="No Posts"
        timeAgo=""
        description="No posts available yet. Be the first to share!"
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Feed" showSearchBar={true} showNotification={true} />
      <HomeFeedBox />
      {postsLoading && posts.length === 0 ? (
        <View style={[styles.container, styles.scrollContent]}>
          <NewsCard
            author="Loading..."
            timeAgo=""
            description="Fetching posts..."
          />
        </View>
      ) : (
        <FlatList
          style={styles.container}
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderFeedItem}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(24),
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(14),
  },
  loadMoreButton: {
    backgroundColor: '#191C1F',
    paddingHorizontal: verticalScale(24),
    paddingVertical: verticalScale(10),
    borderRadius: 9999,
    minWidth: 150,
    alignItems: 'center',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: verticalScale(14),
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  loadingMoreText: {
    color: '#667085',
    fontSize: verticalScale(14),
    fontWeight: '500',
    marginLeft: verticalScale(8),
  },
});

export default HomeScreen;
