import { StyleSheet, ScrollView, Dimensions, RefreshControl, View, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import HomeFeedBox from '../components/HomeFeedBox';
import NewsCard from '../components/NewsCard';
import { useAuth } from '../context/AuthContext';
import { getAllPosts } from '../api/service';

const { height } = Dimensions.get('window');
const guidelineBaseHeight = 812;

const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

const HomeScreen = () => {
  const { token, user, isAuthenticated, loading } = useAuth();
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

  useEffect(() => {
    if (!loading) {
      console.log('[HomeScreen] Auth Status:', {
        isAuthenticated,
        token: token ? `${token.substring(0, 10)}...${token.slice(-5)}` : null, // Log partial token for security
        user: user ? { ...user, password: user.password ? '[HIDDEN]' : undefined } : null // Hide password if present
      });
    }
  }, [token, user, isAuthenticated, loading]);

  const fetchPosts = async (page: number = 1) => {
    try {
      if (page === 1) {
        setPostsLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await getAllPosts(page);
      console.log('[HomeScreen] Posts API Response:', response.data);
      
      if (response.data && response.data.data.posts) {
        if (page === 1) {
          setPosts(response.data.data.posts);
        } else {
          // Append new posts to existing posts
          setPosts(prevPosts => [...prevPosts, ...response.data.data.posts]);
        }
        // Update pagination data
        if (response.data.data.pagination) {
          console.log('[HomeScreen] Pagination data:', response.data.data.pagination);
          setPagination(response.data.data.pagination);
        } else {
          console.log('[HomeScreen] No pagination data in response');
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
      console.error('[HomeScreen] Error fetching posts:', error);
      if (page === 1) {
        setPosts([]);
      }
    } finally {
      setPostsLoading(false);
      setLoadingMore(false);
    }
 };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchPosts();
    }
  }, [loading, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const renderPost = (post: any, index: number) => {
    console.log(post,"jj");
    
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
        if (lowerCaseUrl.endsWith('.mp4') || lowerCaseUrl.endsWith('.mov') || lowerCaseUrl.endsWith('.avi') || lowerCaseUrl.endsWith('.mkv') || lowerCaseUrl.endsWith('.wmv')) {
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
      id: post.id
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
        initialLikeCount={post.stats?.likesCount || 0}
        recentComments={formattedPost.recentComments}
        title ={post.title}
        stats ={formattedPost.stats}
        userId ={post.user?.id}
        profilePicture={post.user?.profilePicture}
        isVerified={post.user?.idVerified}
        company ={post.user?.company}
        designation ={post.user?.designation}
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
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
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
      await fetchPosts(nextPage);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Feed" showSearchBar={true} showNotification={true} />
      <HomeFeedBox />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {postsLoading ? (
          <NewsCard
            author="Loading..."
            timeAgo=""
            description="Fetching posts..."
          />
        ) : posts.length > 0 ? (
          <>
            {posts.map((post, index) => renderPost(post, index))}
            <LoadMoreButton />
          </>
        ) : (
          <NewsCard
            author="No Posts"
            timeAgo=""
            description="No posts available yet. Be the first to share!"
          />
        )}
      </ScrollView>
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
    backgroundColor: '#ffffff',
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
});

export default HomeScreen;
