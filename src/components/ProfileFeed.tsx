import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NewsCard from './NewsCard';
import { getCurrentUserPosts, getUserPostsById } from '../api/service';
import { useAuth } from '../context/AuthContext';
import { mapPostToNewsCardProps } from '../util/postFormatter';
import { getCachedPosts, setCachedPosts } from '../lib/postsCache';

const { height } = Dimensions.get('window');
const guidelineBaseHeight = 812;

const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (size * factor - size) * factor;

interface ProfileFeedProps {
  key?: string | number;
  userId?: number | string;
}

const ProfilePostItem = React.memo(({ post }: { post: any }) => {
  const cardProps = useMemo(() => mapPostToNewsCardProps(post), [post]);
  return <NewsCard {...cardProps} />;
});

const ProfileFeed: React.FC<ProfileFeedProps> = ({ userId }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const cacheKey = useMemo(
    () => `profile_feed:${userId ?? user?.id ?? 'me'}:page1`,
    [userId, user?.id],
  );

  const fetchUserPosts = useCallback(
    async (page: number = 1, options?: { silent?: boolean }) => {
      try {
        if (page === 1) {
          if (!options?.silent) {
            setPostsLoading(true);
          }
        } else {
          setLoadingMore(true);
        }

        const response = userId
          ? await getUserPostsById(userId, page)
          : await getCurrentUserPosts(page);

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
            setCachedPosts(cacheKey, fetchedPosts, nextPagination);
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
        console.error('[ProfileFeed] Error fetching user posts:', error);
        if (page === 1 && !options?.silent) {
          setPosts([]);
        }
      } finally {
        setPostsLoading(false);
        setLoadingMore(false);
      }
    },
    [userId, cacheKey],
  );

  useEffect(() => {
    if (authLoading || (!isAuthenticated && !userId)) return;
    let cancelled = false;

    const loadInitial = async () => {
      const cached = await getCachedPosts<any[]>(cacheKey);
      if (cancelled) return;
      if (cached && cached.posts.length > 0) {
        setPosts(cached.posts);
        if (cached.pagination) {
          setPagination(cached.pagination);
        }
        setPostsLoading(false);
        fetchUserPosts(1, { silent: true });
      } else {
        fetchUserPosts(1);
      }
    };

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, userId, cacheKey, fetchUserPosts]);

  const navigation = useNavigation<any>();
  const isCurrentUserProfile = user && userId && user.id === userId;

  const loadMorePosts = useCallback(async () => {
    if (pagination.hasNext && !loadingMore) {
      const nextPage = pagination.currentPage + 1;
      await fetchUserPosts(nextPage);
    }
  }, [pagination.hasNext, pagination.currentPage, loadingMore, fetchUserPosts]);

  const navigateToPost = useCallback(() => {
    navigation.navigate('Post');
  }, [navigation]);

  return (
    <View style={styles.feedContainer}>
      {!userId && (
        <TouchableOpacity style={styles.addPostButton} onPress={navigateToPost}>
          <Text style={styles.addPostButtonText}>+ Add Post</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.sectionTitle}>
        {isCurrentUserProfile
          ? 'My Posts'
          : userId
          ? "User's Posts"
          : 'My Posts'}
      </Text>

      <View style={[styles.container, styles.scrollContent]}>
        {postsLoading && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : posts.length > 0 ? (
          <>
            {posts.map((post, index) => (
              <ProfilePostItem
                key={String(post?.id ?? post?._id ?? index)}
                post={post}
              />
            ))}
            {pagination?.hasNext && (
              <View style={styles.loadMoreContainer}>
                {loadingMore && (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingMoreText}>
                      Loading more posts...
                    </Text>
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
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isCurrentUserProfile
                ? "You haven't made any posts yet."
                : userId
                ? "This user hasn't made any posts yet."
                : "You haven't made any posts yet."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    marginTop: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
    marginHorizontal: 16,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(20),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#000',
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },
  loadMoreButton: {
    backgroundColor: '#191C1F',
    paddingHorizontal: verticalScale(24),
    paddingVertical: verticalScale(10),
    borderRadius: 9999,
    minWidth: 150,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: verticalScale(14),
    fontWeight: '600',
  },
  addPostButton: {
    backgroundColor: '#191C1F',
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(20),
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: -moderateScale(25),
  },
  addPostButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(50),
  },
});

export default ProfileFeed;
