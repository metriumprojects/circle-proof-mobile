import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { Video } from 'react-native-video';
import Pdf from 'react-native-pdf';
import LikesModal from './LikesModal';
import CommentsModal from './CommentsModal';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { likePost, getPostComments } from '../api/service';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface NewsCardProps {
  author: string;
  timeAgo: string;
  description: string;
  imageUrl?: any; // For single image
  imageUrls?: any[]; // For multiple images
  videoUrl?: any; // For single video
  videoUrls?: any[]; // For multiple videos
  pdfUrl?: any; // For single PDF
  pdfUrls?: any[]; // For multiple PDFs
  authorAvatar?: string;
  profilePicture?: string; // Add profilePicture prop
  achievement?: any;
  achievementDate?: any;
  postId?: number; // Add postId for like functionality
  initialLikeStatus?: boolean; // Add initial like status
  initialLikeCount?: number; // Add initial like count
  recentComments?: any[]; // Added recent comments prop
  title?: string; // Added title prop
  stats?: any; // Added stats prop
  userId?: number; // Add userId for profile navigation
  isVerified?: boolean;
  company?: string;
  designation?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({
  author,
  timeAgo,
  description,
  imageUrl,
  imageUrls, // Added support for multiple images
  videoUrl,
  videoUrls, // Added support for multiple videos
  pdfUrl, // Added support for single PDF
  pdfUrls, // Added support for multiple PDFs
  authorAvatar,
  profilePicture, // Add profilePicture prop
  achievement,
  achievementDate,
  postId, // Add postId
  initialLikeStatus = false, // Add initial like status with default
  initialLikeCount = 0, // Add initial like count with default
  recentComments,
  title,
  stats,
  userId, // Add userId
  isVerified,
  company,
  designation,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [likesModalVisible, setLikesModalVisible] = React.useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = React.useState(false);
  const [isAddingComment, setIsAddingComment] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0); // For carousel
  const [isLiked, setIsLiked] = React.useState(initialLikeStatus); // Add like status state
  const [likeCount, setLikeCount] = React.useState(initialLikeCount); // Add like count state
  const [fetchedComments, setFetchedComments] = React.useState<any[]>([]); // State for fetched comments
  const [loadingComments, setLoadingComments] = React.useState(false); // State for loading comments
  const [pdfLoading, setPdfLoading] = React.useState(true);
  const [pdfPages, setPdfPages] = React.useState(0);
  const [pdfError, setPdfError] = React.useState(false);
  const [commentCount, setCommentCount] = React.useState(
    stats?.commentsCount || 0,
  ); // Local comment count state

  console.log(stats, title, recentComments, postId, 'ujuj');

  const navigation = useNavigation<any>();

  const handleLike = async () => {
    if (!postId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Post ID is missing',
      });
      return;
    }

    try {
      await likePost(postId);
      // Toggle the like status and update the count
      setIsLiked(!isLiked);
      setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error('Error liking post:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to like post',
      });
    }
  };

  const fetchComments = async () => {
    if (!postId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Post ID is missing',
      });
      return [];
    }

    setLoadingComments(true);
    try {
      const response = await getPostComments(postId);
      if (response.data.success) {
        const comments = response.data.data.comments;
        setFetchedComments(comments);
        return comments; // Return the comments data
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch comments',
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch comments',
      });
      return [];
    } finally {
      setLoadingComments(false);
    }
  };

  const maxLength = moderateScale(300);

  const toggleDescription = () => {
    setExpanded(!expanded);
  };

  const renderDescription = () => {
    if (!expanded && description.length > maxLength) {
      return (
        <>
          <Text style={cardStyles.description}>
            {description.substring(0, maxLength)}...
          </Text>
          <TouchableOpacity onPress={toggleDescription}>
            <Text style={cardStyles.seeMoreText}>See more</Text>
          </TouchableOpacity>
        </>
      );
    } else if (expanded) {
      return (
        <>
          <Text style={cardStyles.description}>{description}</Text>
          <TouchableOpacity onPress={toggleDescription}>
            <Text style={cardStyles.seeMoreText}>See less</Text>
          </TouchableOpacity>
        </>
      );
    }
    return <Text style={cardStyles.description}>{description}</Text>;
  };

  // Create a unified carousel for all attachment types (images, videos, PDFs)
  const renderAttachmentsCarousel = () => {
    // Define type for attachment objects
    type Attachment = {
      type: 'image' | 'video' | 'pdf';
      uri: any;
    };

    // Prepare an array of all attachments with their types
    const allAttachments: Attachment[] = [];

    // Add single image if exists
    if (imageUrl) {
      // Check if this single image is actually a PDF (for backward compatibility)
      const isPdf =
        (typeof imageUrl === 'object' &&
          imageUrl.uri?.toLowerCase().endsWith('.pdf')) ||
        (typeof imageUrl === 'string' &&
          imageUrl.toLowerCase().endsWith('.pdf'));

      if (isPdf) {
        // If it's a PDF, add it to the PDF section instead of image section
        const pdfUri = typeof imageUrl === 'object' ? imageUrl.uri : imageUrl;
        allAttachments.push({ type: 'pdf', uri: pdfUri });
      } else {
        allAttachments.push({ type: 'image', uri: imageUrl });
      }
    }
    // Add multiple images if exists
    if (imageUrls && Array.isArray(imageUrls)) {
      imageUrls.forEach(url => {
        // Check if this image URL is actually a PDF (for backward compatibility)
        const isPdf =
          (typeof url === 'object' &&
            url.uri?.toLowerCase().endsWith('.pdf')) ||
          (typeof url === 'string' && url.toLowerCase().endsWith('.pdf'));

        if (isPdf) {
          const pdfUri = typeof url === 'object' ? url.uri : url;
          allAttachments.push({ type: 'pdf', uri: pdfUri });
        } else {
          allAttachments.push({ type: 'image', uri: url });
        }
      });
    }

    // Add single video if exists
    if (videoUrl) {
      allAttachments.push({ type: 'video', uri: videoUrl });
    }
    // Add multiple videos if exists
    if (videoUrls && Array.isArray(videoUrls)) {
      videoUrls.forEach(url =>
        allAttachments.push({ type: 'video', uri: url }),
      );
    }

    // Add single PDF if exists
    if (
      pdfUrl &&
      typeof pdfUrl === 'object' &&
      pdfUrl.uri?.toLowerCase().endsWith('.pdf')
    ) {
      allAttachments.push({ type: 'pdf', uri: pdfUrl.uri });
    } else if (
      pdfUrl &&
      typeof pdfUrl === 'string' &&
      pdfUrl.toLowerCase().endsWith('.pdf')
    ) {
      allAttachments.push({ type: 'pdf', uri: pdfUrl });
    }
    // Add multiple PDFs if exists
    if (pdfUrls && Array.isArray(pdfUrls)) {
      const pdfUrlsFromProps = pdfUrls
        .filter(
          item =>
            item &&
            typeof item === 'object' &&
            item.uri &&
            item.uri.toLowerCase().endsWith('.pdf'),
        )
        .map(item => item.uri);
      pdfUrlsFromProps.forEach(url =>
        allAttachments.push({ type: 'pdf', uri: url }),
      );
    }

    // Remove duplicates while preserving order
    const uniqueAttachments: Attachment[] = [];
    const seenUris = new Set();
    allAttachments.forEach(attachment => {
      const uri = attachment.uri;
      if (!seenUris.has(uri)) {
        seenUris.add(uri);
        uniqueAttachments.push(attachment);
      }
    });

    // If we have no attachments, return null
    if (uniqueAttachments.length === 0) {
      return null;
    }

    // Calculate item width to match container width
    const itemWidth = width - moderateScale(32); // Account for margins (16 * 2)

    // If we have only one attachment, still render it in the carousel container for consistency
    // but without pagination indicators if there's only one item
    if (uniqueAttachments.length === 1) {
      const attachment = uniqueAttachments[0];
      return (
        <View style={cardStyles.carouselContainer}>
          <FlatList
            data={uniqueAttachments}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={itemWidth}
            decelerationRate="fast"
            onScroll={event => {
              const contentOffset = event.nativeEvent.contentOffset.x;
              const index = Math.round(contentOffset / itemWidth);
              setCurrentIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={[cardStyles.carouselItem, { width: itemWidth }]}>
                {item.type === 'image' && (
                  <Image
                    source={item.uri}
                    style={cardStyles.carouselImage}
                    resizeMode="cover"
                  />
                )}
                {item.type === 'video' && (
                  <Video
                    source={item.uri}
                    style={cardStyles.carouselVideo}
                    resizeMode="contain"
                    controls={true}
                    repeat={false}
                    paused={false}
                    playWhenInactive={false}
                    playInBackground={false}
                  />
                )}
                {item.type === 'pdf' && (
                  <TouchableOpacity
                    style={cardStyles.pdfPreview}
                    onPress={() => openPDFViewer(item.uri)}
                  >
                    <View style={cardStyles.pdfPreviewContainer}>
                      <View style={cardStyles.pdfThumbnailArea}>
                        {!pdfError ? (
                          <Pdf
                            source={{ uri: item.uri }}
                            trustAllCerts={false}
                            style={cardStyles.pdfMiniView}
                            page={1}
                            scale={2.0}
                            minScale={2.0}
                            maxScale={2.0}
                            enablePaging={false}
                            singlePage={true}
                            onLoadComplete={(numberOfPages, filePath) => {
                              setPdfPages(numberOfPages);
                              setPdfLoading(false);
                              console.log(`PDF loaded: ${numberOfPages} pages`);
                            }}
                            onError={error => {
                              console.log('PDF preview error:', error);
                              setPdfLoading(false);
                              setPdfError(true);
                            }}
                          />
                        ) : (
                          <View style={cardStyles.pdfFallback}>
                            <Text style={cardStyles.pdfFallbackIcon}>📄</Text>
                            <Text style={cardStyles.pdfFallbackText}>
                              PDF Preview
                            </Text>
                          </View>
                        )}
                        {pdfLoading && !pdfError && (
                          <View style={cardStyles.pdfLoadingContainer}>
                            <ActivityIndicator size="small" color="#666" />
                            <Text style={cardStyles.pdfLoadingText}>
                              Loading PDF preview...
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={cardStyles.pdfInfoSection}>
                        <View style={cardStyles.pdfHeader}>
                          <View style={cardStyles.pdfIconContainer}>
                            <Text style={cardStyles.pdfIcon}>📄</Text>
                          </View>
                          <View style={cardStyles.pdfDetails}>
                            <Text
                              style={cardStyles.pdfFileName}
                              numberOfLines={1}
                            >
                              {item.uri.split('/').pop() || 'document.pdf'}
                            </Text>
                            <Text style={cardStyles.pdfMeta}>
                              {pdfPages > 0
                                ? `${pdfPages} page${pdfPages > 1 ? 's' : ''}`
                                : 'PDF Document'}{' '}
                              • Tap to view full document
                            </Text>
                          </View>
                          <View style={cardStyles.pdfAction}>
                            <Text style={cardStyles.pdfActionArrow}>→</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
            keyExtractor={(item, index) => `${index}-${item.type}`}
          />
          {/* Only show dots indicator if there's more than one item */}
          {uniqueAttachments.length > 1 && (
            <View style={cardStyles.dotsContainer}>
              {uniqueAttachments.map((_, index) => (
                <View
                  key={index}
                  style={[
                    cardStyles.dot,
                    {
                      backgroundColor: index === currentIndex ? '#000' : '#ccc',
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      );
    }

    // Multiple attachments - render as unified carousel
    return (
      <View style={cardStyles.carouselContainer}>
        <FlatList
          data={uniqueAttachments}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          onScroll={event => {
            const contentOffset = event.nativeEvent.contentOffset.x;
            const index = Math.round(contentOffset / itemWidth);
            setCurrentIndex(index);
          }}
          renderItem={({ item }) => (
            <View style={[cardStyles.carouselItem, { width: itemWidth }]}>
              {item.type === 'image' && (
                <Image
                  source={item.uri}
                  style={cardStyles.carouselImage}
                  resizeMode="cover"
                />
              )}
              {item.type === 'video' && (
                <Video
                  source={item.uri}
                  style={cardStyles.carouselVideo}
                  resizeMode="contain"
                  controls={true}
                  repeat={false}
                  paused={false}
                  playWhenInactive={false}
                  playInBackground={false}
                />
              )}
              {item.type === 'pdf' && (
                <TouchableOpacity
                  style={cardStyles.pdfPreview}
                  onPress={() => openPDFViewer(item.uri)}
                >
                  <View style={cardStyles.pdfPreviewContainer}>
                    <View style={cardStyles.pdfThumbnailArea}>
                      {!pdfError ? (
                        <Pdf
                          source={{ uri: item.uri }}
                          trustAllCerts={false}
                          style={cardStyles.pdfMiniView}
                          page={1}
                          scale={2.0}
                          minScale={2.0}
                          maxScale={2.0}
                          enablePaging={false}
                          singlePage={true}
                          onLoadComplete={(numberOfPages, filePath) => {
                            setPdfPages(numberOfPages);
                            setPdfLoading(false);
                            console.log(`PDF loaded: ${numberOfPages} pages`);
                          }}
                          onError={error => {
                            console.log('PDF preview error:', error);
                            setPdfLoading(false);
                            setPdfError(true);
                          }}
                        />
                      ) : (
                        <View style={cardStyles.pdfFallback}>
                          <Text style={cardStyles.pdfFallbackIcon}>📄</Text>
                          <Text style={cardStyles.pdfFallbackText}>
                            PDF Preview
                          </Text>
                        </View>
                      )}
                      {pdfLoading && !pdfError && (
                        <View style={cardStyles.pdfLoadingContainer}>
                          <ActivityIndicator size="small" color="#666" />
                          <Text style={cardStyles.pdfLoadingText}>
                            Loading PDF preview...
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={cardStyles.pdfInfoSection}>
                      <View style={cardStyles.pdfHeader}>
                        <View style={cardStyles.pdfIconContainer}>
                          <Text style={cardStyles.pdfIcon}>📄</Text>
                        </View>
                        <View style={cardStyles.pdfDetails}>
                          <Text
                            style={cardStyles.pdfFileName}
                            numberOfLines={1}
                          >
                            {item.uri.split('/').pop() || 'document.pdf'}
                          </Text>
                          <Text style={cardStyles.pdfMeta}>
                            {pdfPages > 0
                              ? `${pdfPages} page${pdfPages > 1 ? 's' : ''}`
                              : 'PDF Document'}{' '}
                            • Tap to view full document
                          </Text>
                        </View>
                        <View style={cardStyles.pdfAction}>
                          <Text style={cardStyles.pdfActionArrow}>→</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
          keyExtractor={(item, index) => `${index}-${item.type}`}
        />
        {/* Dots indicator */}
        <View style={cardStyles.dotsContainer}>
          {uniqueAttachments.map((_, index) => (
            <View
              key={index}
              style={[
                cardStyles.dot,
                { backgroundColor: index === currentIndex ? '#000' : '#ccc' },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // Render single PDF (used for single PDF or in carousel)
  const renderSinglePDF = (pdfUri: string) => {
    const fileName = pdfUri.split('/').pop() || 'document.pdf';

    return (
      <View style={cardStyles.pdfContainer}>
        <TouchableOpacity
          style={cardStyles.pdfPreview}
          onPress={() => openPDFViewer(pdfUri)}
        >
          <View style={cardStyles.pdfPreviewContainer}>
            <View style={cardStyles.pdfThumbnailArea}>
              {!pdfError ? (
                <Pdf
                  source={{ uri: pdfUri }}
                  trustAllCerts={false}
                  style={cardStyles.pdfMiniView}
                  page={1}
                  scale={2.0}
                  minScale={2.0}
                  maxScale={2.0}
                  enablePaging={false}
                  singlePage={true}
                  onLoadComplete={(numberOfPages, filePath) => {
                    setPdfPages(numberOfPages);
                    setPdfLoading(false);
                    console.log(`PDF loaded: ${numberOfPages} pages`);
                  }}
                  onError={error => {
                    console.log('PDF preview error:', error);
                    setPdfLoading(false);
                    setPdfError(true);
                  }}
                />
              ) : (
                <View style={cardStyles.pdfFallback}>
                  <Text style={cardStyles.pdfFallbackIcon}>📄</Text>
                  <Text style={cardStyles.pdfFallbackText}>PDF Preview</Text>
                </View>
              )}

              {pdfLoading && !pdfError && (
                <View style={cardStyles.pdfLoadingContainer}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={cardStyles.pdfLoadingText}>
                    Loading PDF preview...
                  </Text>
                </View>
              )}
            </View>

            <View style={cardStyles.pdfInfoSection}>
              <View style={cardStyles.pdfHeader}>
                <View style={cardStyles.pdfIconContainer}>
                  <Text style={cardStyles.pdfIcon}>📄</Text>
                </View>
                <View style={cardStyles.pdfDetails}>
                  <Text style={cardStyles.pdfFileName} numberOfLines={1}>
                    {fileName}
                  </Text>
                  <Text style={cardStyles.pdfMeta}>
                    {pdfPages > 0
                      ? `${pdfPages} page${pdfPages > 1 ? 's' : ''}`
                      : 'PDF Document'}{' '}
                    • Tap to view full document
                  </Text>
                </View>
                <View style={cardStyles.pdfAction}>
                  <Text style={cardStyles.pdfActionArrow}>→</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const openPDFViewer = (pdfUrl: string) => {
    // Try using the navigation object directly
    navigation.navigate('PDFViewer', {
      pdfUrl,
      title: pdfUrl.split('/').pop(),
    });
  };

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={cardStyles.authorSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileView', { userId })}
          >
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={cardStyles.avatar}
              />
            ) : (
              <View style={cardStyles.avatar}>
                <Text style={cardStyles.avatarText}>
                  {authorAvatar || author.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {isVerified && (
            <View style={cardStyles.verifiedIcon}>
              <Text style={cardStyles.verifiedText}>
                <Image
                  source={require('../assets/icons/tick.png')}
                  style={cardStyles.verifiedImage}
                />
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileView', { userId })}
          >
            <View style={cardStyles.authorInfo}>
              <View style={cardStyles.nameContainer}>
                <Text style={cardStyles.authorName}>{author}</Text>
                <Image
                  source={require('../assets/icons/dot.png')}
                  style={cardStyles.dotIcon}
                />
                <Text style={cardStyles.timeAgo}>{timeAgo}</Text>
              </View>
              <Text style={cardStyles.designation}>
                {designation} {company}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {renderAttachmentsCarousel()}

      {achievement ? (
        <View style={cardStyles.achievementContainer}>
          <Image
            source={require('../assets/icons/marks.png')}
            style={cardStyles.marksIcon}
          />
          <Image
            source={require('../assets/icons/achievement.png')}
            style={cardStyles.achievementIcon}
          />
          <Text style={cardStyles.achievementText}>{achievement}</Text>
        </View>
      ) : null}

      {achievementDate ? (
        <View style={cardStyles.achievementDateContainer}>
          <Image
            source={require('../assets/icons/calendar.png')}
            style={cardStyles.calendarIcon}
          />
          <Text style={cardStyles.achievementDateText}>{achievementDate}</Text>
        </View>
      ) : null}

      <View style={cardStyles.content}>{renderDescription()}</View>

      <View style={cardStyles.actions}>
        <View style={cardStyles.likeContainer}>
          <TouchableOpacity
            style={cardStyles.actionButton}
            onPress={handleLike}
          >
            <Image
              source={
                isLiked
                  ? require('../assets/icons/like2.png')
                  : require('../assets/icons/like1.png')
              }
              style={cardStyles.actionIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={cardStyles.actionButton}
            onPress={() => setLikesModalVisible(true)}
          >
            <Text style={cardStyles.actionText}>{likeCount} likes</Text>
          </TouchableOpacity>
        </View>

        {/* Updated comment button to open CommentsModal */}
        <TouchableOpacity
          style={cardStyles.actionButton}
          onPress={async () => {
            await fetchComments();
            setCommentsModalVisible(true);
            setIsAddingComment(true); // Always show input field in modal
          }}
        >
          <Image
            source={require('../assets/icons/comment.png')}
            style={cardStyles.actionIcon}
          />
          <Text style={cardStyles.actionText}>{commentCount} Comments</Text>
        </TouchableOpacity>
      </View>
      <View style={cardStyles.divider}></View>

      {/* Existing LikesModal */}
      <LikesModal
        visible={likesModalVisible}
        onClose={() => setLikesModalVisible(false)}
        postId={postId}
      />

      {/* New CommentsModal */}
      <CommentsModal
        visible={commentsModalVisible}
        onClose={() => {
          setCommentsModalVisible(false);
          setIsAddingComment(false); // Reset on close
        }}
        isAddingComment={isAddingComment}
        recentComments={
          Array.isArray(fetchedComments) && fetchedComments.length > 0
            ? fetchedComments
            : Array.isArray(recentComments)
            ? recentComments
            : []
        }
        title={title}
        stats={stats}
        postId={postId}
        onCommentAdded={() => setCommentCount((prev: number) => prev + 1)} // Increment comment count when a comment is added
      />
    </View>
  );
};

export default NewsCard;

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: moderateScale(10),
    marginVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  avatarText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#666',
  },
  verifiedIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(5),
  },
  verifiedImage: {
    width: moderateScale(12),
    height: moderateScale(12),
  },
  verifiedText: {
    color: '#fff',
    fontSize: moderateScale(10),
    fontWeight: 'bold',
  },
  authorInfo: {
    flex: 1,
    marginLeft: moderateScale(10),
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(2),
    gap: moderateScale(6),
  },
  dotIcon: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: '#e0e0e0',
  },
  authorName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000',
    marginRight: moderateScale(4),
  },
  designation: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: verticalScale(2),
  },
  timeAgo: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  imageContainer: {
    marginBottom: verticalScale(12),
  },
  image: {
    width: '100%',
    height: verticalScale(300),
    borderRadius: moderateScale(8),
  },
  content: {
    marginBottom: verticalScale(16),
  },
  description: {
    fontSize: moderateScale(14),
    color: '#000',
    lineHeight: moderateScale(20),
    marginTop: verticalScale(20),
  },
  seeMoreText: {
    color: '#000000',
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginTop: verticalScale(4),
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  achievementText: {
    fontSize: moderateScale(16),
    color: '#000',
    fontWeight: 'bold',
    flex: 1,
  },
  achievementIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginRight: moderateScale(8),
  },
  calendarIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginRight: moderateScale(8),
  },
  marksIcon: {
    width: moderateScale(38),
    height: moderateScale(38),
    marginRight: moderateScale(8),
  },
  achievementDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  achievementDateText: {
    fontSize: moderateScale(14),
    color: '#000',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: verticalScale(10),
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: moderateScale(12),
    paddingTop: verticalScale(8),
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderRadius: moderateScale(4),
  },
  actionIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: moderateScale(0),
    resizeMode: 'contain',
    paddingRight: moderateScale(12),
  },
  actionText: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  carouselContainer: {
    marginBottom: verticalScale(12),
  },
  carouselItem: {
    width: width - moderateScale(32), // Account for margins
    height: verticalScale(300),
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
  },
  videoContainer: {
    marginBottom: verticalScale(12),
  },
  video: {
    width: '100%',
    height: verticalScale(300),
    borderRadius: moderateScale(8),
  },
  carouselVideo: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(8),
  },
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginHorizontal: moderateScale(4),
  },

  // PDF Styles
  pdfContainer: {
    marginBottom: verticalScale(12),
  },
  pdfPreview: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#e1e5e9',
    overflow: 'hidden',
  },
  pdfPreviewContainer: {
    width: '100%',
  },
  pdfThumbnailArea: {
    width: '100%',
    height: verticalScale(240),
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    position: 'relative',
  },
  pdfMiniView: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  pdfLoadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    width: '100%',
    height: '100%',
  },
  pdfLoadingText: {
    fontSize: moderateScale(12),
    color: '#666',
    marginTop: moderateScale(8),
  },
  pdfFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  pdfFallbackIcon: {
    fontSize: moderateScale(32),
    marginBottom: moderateScale(8),
  },
  pdfFallbackText: {
    fontSize: moderateScale(14),
    color: '#666',
    fontWeight: '500',
  },
  pdfInfoSection: {
    padding: moderateScale(12),
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  pdfIcon: {
    fontSize: moderateScale(18),
  },
  pdfDetails: {
    flex: 1,
  },
  pdfFileName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000',
    marginBottom: moderateScale(2),
  },
  pdfMeta: {
    fontSize: moderateScale(11),
    color: '#666',
  },
  pdfAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#f0f0f0',
  },
  pdfActionArrow: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#666',
  },
  multipleFilesIndicator: {
    marginTop: moderateScale(8),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    backgroundColor: '#e8f5e8',
    borderRadius: moderateScale(6),
    alignSelf: 'flex-start',
  },
  multipleFilesText: {
    fontSize: moderateScale(11),
    color: '#2e7d32',
    fontWeight: '500',
  },
});
