import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NewsCard from './NewsCard';
import { getCurrentUserPosts, getUserPostsById } from '../api/service';
import { useAuth } from '../context/AuthContext';

const { height, width } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (size * factor - size) * factor;

interface ProfileFeedProps {
  key?: string | number;
  userId?: number; // Add userId prop to determine which API to call
}

const ProfileFeed: React.FC<ProfileFeedProps> = ({ key, userId }) => {
  const { token, user, isAuthenticated, loading: authLoading } = useAuth();
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

  const fetchUserPosts = async (page: number = 1) => {
    try {
      if (page === 1) {
        setPostsLoading(true);
      } else {
        setLoadingMore(true);
      }

      let response;

      if (userId) {
        // If userId is provided, fetch posts for that specific user
        response = await getUserPostsById(userId, page);
      } else {
        // If no userId is provided, fetch current user's posts
        response = await getCurrentUserPosts(page);
      }

      console.log('[ProfileFeed] User Posts API Response:', response.data);
      if (response.data && response.data.data.posts) {
        if (page === 1) {
          setPosts(response.data.data.posts);
        } else {
          // Append new posts to existing posts
          setPosts(prevPosts => [...prevPosts, ...response.data.data.posts]);
        }
        // Update pagination data
        if (response.data.data.pagination) {
          console.log(
            '[ProfileFeed] Pagination data:',
            response.data.data.pagination,
          );
          setPagination(response.data.data.pagination);
        } else {
          console.log('[ProfileFeed] No pagination data in response');
          // If no pagination data, estimate based on number of posts returned
          // If we got 10+ posts, there might be more (assuming standard page size)
          const defaultPageSize = 10;
          const hasMore = response.data.data.posts.length >= defaultPageSize;
          setPagination({
            currentPage: page,
            totalPages: 0, // Unknown
            totalPosts: response.data.data.posts.length, // Current page count
            hasNext: hasMore,
            hasPrev: page > 1,
          });
        }
      } else {
        if (page === 1) {
          setPosts([]);
        }
        setPagination({
          currentPage: page,
          totalPages: 1,
          totalPosts: 0,
          hasNext: false,
          hasPrev: page > 1,
        });
      }
    } catch (error) {
      console.error('[ProfileFeed] Error fetching user posts:', error);
      if (page === 1) {
        setPosts([]);
      }
    } finally {
      setPostsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Only fetch posts if user is authenticated (for current user) or if userId is provided (for specific user)
    if (!authLoading && (isAuthenticated || userId)) {
      fetchUserPosts();
    }
  }, [authLoading, isAuthenticated, key, userId]);
  console.log(posts, 'eeeeeeeeeeeeee');

  const navigation = useNavigation<any>();

  // Determine if the profile being viewed is the current user's profile
  const isCurrentUserProfile = user && userId && user.id === userId;

  const renderPost = (post: any, index: number) => {
    // Parse comma-separated attachment URLs and separate images, videos, and PDFs
    let imageUrls: { uri: string }[] = [];
    let videoUrls: { uri: string }[] = [];
    let pdfUrls: { uri: string }[] = [];

    if (post.attachmentUrl) {
      // Split comma-separated URLs and classify as images, videos, or PDFs based on extension
      const urls = post.attachmentUrl.split(',');
      urls.forEach((url: string) => {
        const trimmedUrl = url.trim();
        const lowerCaseUrl = trimmedUrl.toLowerCase();

        // Check if URL has video extension
        if (
          lowerCaseUrl.endsWith('.mp4') ||
          lowerCaseUrl.endsWith('.mov') ||
          lowerCaseUrl.endsWith('.avi') ||
          lowerCaseUrl.endsWith('.mkv') ||
          lowerCaseUrl.endsWith('.wmv')
        ) {
          videoUrls.push({ uri: trimmedUrl });
        }
        // Check if URL has PDF extension
        else if (lowerCaseUrl.endsWith('.pdf')) {
          pdfUrls.push({ uri: trimmedUrl });
        }
        // Assume it's an image if not a known video or PDF format
        else {
          imageUrls.push({ uri: trimmedUrl });
        }
      });
    }

    // Format post data to match NewsCard props - keep PDFs separate from images
    const formattedPost = {
      author: post.user?.fullName || 'Unknown User',
      timeAgo: formatDateAgo(post.createdAt),
      description: post.content || post.title || '',
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined, // First image for single image display
      imageUrls: imageUrls.length > 1 ? imageUrls : undefined, // Multiple images if more than one
      videoUrl: videoUrls.length > 0 ? videoUrls[0] : undefined, // First video for single video display
      videoUrls: videoUrls.length > 1 ? videoUrls : undefined, // Multiple videos if more than one
      pdfUrl: pdfUrls.length > 0 ? pdfUrls[0] : undefined, // First PDF for single PDF display
      pdfUrls: pdfUrls.length > 1 ? pdfUrls : undefined, // Multiple PDFs if more than one
      achievement: post.title && !post.content ? post.title : null,
      achievementDate: post.createdAt ? formatDate(post.createdAt) : null,
      stats: post.stats || {},
      recentComments: post.recentComments || [],
      id: post.id,
      userId: post.user?.id, // Pass userId for navigation
      isVerified: post.user?.idVerified,
      company: post.user?.company,
      designation: post.user?.designation,
    };

    return (
      <NewsCard
        key={post.id || index}
        author={formattedPost.author}
        timeAgo={formattedPost.timeAgo}
        description={formattedPost.description}
        imageUrl={formattedPost.imageUrl}
        imageUrls={formattedPost.imageUrls} // Pass multiple images
        videoUrl={formattedPost.videoUrl} // Pass single video
        videoUrls={formattedPost.videoUrls} // Pass multiple videos
        pdfUrl={formattedPost.pdfUrl} // Pass single PDF
        pdfUrls={formattedPost.pdfUrls} // Pass multiple PDFs
        achievement={formattedPost.achievement}
        achievementDate={formattedPost.achievementDate}
        postId={post.id}
        initialLikeStatus={post.stats?.isLiked || false}
        initialLikeCount={post.stats?.likes || 0}
        recentComments={formattedPost.recentComments}
        title={post.title}
        stats={formattedPost.stats}
        userId={formattedPost.userId} // Pass userId to NewsCard for navigation
        profilePicture={post.user?.profilePicture}
        isVerified={formattedPost.isVerified}
        company={formattedPost.company}
        designation={formattedPost.designation}
      />
    );
  };

  // Helper function to format date as time ago
  const formatDateAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 360)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const loadMorePosts = async () => {
    if (pagination.hasNext && !loadingMore) {
      const nextPage = pagination.currentPage + 1;
      await fetchUserPosts(nextPage);
    }
  };

  const LoadMoreButton = () => {
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
  };

  const navigateToPost = () => {
    navigation.navigate('Post'); // Navigate to Post screen
  };

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

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {postsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : posts.length > 0 ? (
          <>
            {posts.map((post, index) => renderPost(post, index))}
            <LoadMoreButton />
          </>
        ) : (
          // <NewsCard
          //   author="No Posts"
          //   timeAgo=""
          //   description="You haven't made any posts yet. Create your first post!"
          // />
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 16, color: '#000' }}>
              {isCurrentUserProfile
                ? "You haven't made any posts yet."
                : userId
                ? "This user hasn't made any posts yet."
                : "You haven't made any posts yet."}
            </Text>
          </View>
        )}
      </ScrollView>
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
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },
  loadMoreButton: {
    backgroundColor: '#b4b4b4ff',
    paddingHorizontal: verticalScale(20),
    paddingVertical: verticalScale(12),
    borderRadius: verticalScale(8),
    minWidth: 150,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: verticalScale(16),
    fontWeight: '600',
  },
  addPostButton: {
    backgroundColor: '#000000',
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(20),
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: -moderateScale(25),
  },
  addPostButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  loadingMoreText: {
    color: '#b4b4b4ff',
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
