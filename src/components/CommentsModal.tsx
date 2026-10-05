import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  PanResponder,
  TextInput,
} from 'react-native';
import {
  getPostComments,
  likeComment,
  addComment,
  fetchTimelineComments,
  addTimelineComment,
  toggleTimelineCommentLike,
  fetchCommentsByEducationId,
  addCommentsReplies,
  addLikeToCommentandReply,
  fetchSkillComments,
  addSkillCommentReply,
  likeSkillCommentReply,
  fetchHobbyComments,
  addHobbyCommentReply,
  likeHobbyCommentReply,
  fetchAspirationComments,
  addAspirationCommentReply,
  likeAspirationCommentReply,
  fetchCommentSectionAchievement,
  addCommentSectionAchievement,
  likeCommentSectionAchievement,
  fetchSocialCommentsById,
} from '../api/service';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface ApiComment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    profilePicture: string | null;
    company: string | null;
    designation: string | null;
  };
  isReply: boolean;
  repliesCount: number;
  likesCount: number;
  isLiked: boolean;
  isVerified: boolean;
  replies: ApiReply[];
}

interface ApiReply {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    profilePicture: string | null;
    company: string | null;
    designation: string | null;
  };
  isReply: boolean;
  likesCount: number;
  isLiked: boolean;
}

interface Comment {
  isVerified: boolean;
  id: string | number;
  author: string;
  designation: string;
  timeAgo: string;
  createdAt: string; // Added original date string for proper sorting
  text: string;
  likes: number;
  isLiked: boolean;
  avatar?: string;
  company?: string | null;
  replies?: Comment[];
  repliesCount?: number;
  currentPage?: number;
  totalPages?: number;
  showReplies?: boolean;
  isExpanded?: boolean;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  isAddingComment?: boolean;
  recentComments?: ApiComment[]; // Added recentComments prop
  title?: string; // Added title prop
  stats?: any; // Added stats prop
  postId?: number; // Added postId prop for API call
  timelineId?: number; // Added timelineId prop for timeline comments API call
  educationId?: number; // Added educationId prop for education comments API call
  skillId?: number; // Added skillId prop for skill comments API call
  hobbyId?: number; // Added hobbyId prop for hobby comments API call
  aspirationId?: number; // Added aspirationId prop for aspiration comments API call
  achievementId?: number; // Added achievementId prop for achievement comments
  onCommentAdded?: () => void; // Function to call after comment is added to refresh data
  entityType?:
  | 'timeline'
  | 'position'
  | 'education'
  | 'skill'
  | 'hobby'
  | 'aspiration'
  | 'achievement'
  | 'post';
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  onClose,
  isAddingComment,
  recentComments,
  title,
  stats,
  postId,
  timelineId,
  educationId,
  skillId,
  hobbyId,
  aspirationId,
  achievementId,
  onCommentAdded,
  entityType,
}) => {
  const [slideAnim] = useState(new Animated.Value(height)); // Start completely off-screen
  const [commentText, setCommentText] = useState('');
  const [sortOption, setSortOption] = React.useState<'recent' | 'alphabetical'>(
    'recent',
  );
  const [sortModalVisible, setSortModalVisible] = React.useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<
    string | number | null
  >(null);
  const [commentsData, setCommentsData] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingToAuthor, setReplyingToAuthor] = useState<string | null>(null);

  console.log(
    {
      postId,
      timelineId,
      educationId,
      skillId,
      hobbyId,
      aspirationId,
      achievementId,
    },
    'CommentsModal mount/update IDs',
  );

  React.useEffect(() => {
    if (visible) {
      // Animate the modal up from below the screen
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (isAddingComment) {
        setIsReplying(false);
        setActiveCommentId(null);
        setCommentText('');
        setReplyingToAuthor(null);
      }

      // Use recentComments if available and not empty, otherwise fetch from API
      if (
        recentComments &&
        Array.isArray(recentComments) &&
        recentComments.length > 0
      ) {
        // Convert recentComments to UI format
        const convertedComments = recentComments.map(comment =>
          convertApiCommentToUiComment(comment),
        );
        setCommentsData(convertedComments);
      } else if (
        postId ||
        timelineId ||
        educationId ||
        skillId ||
        hobbyId ||
        aspirationId ||
        achievementId
      ) {
        fetchComments();
      }
    } else {
      // Reset everything on close
      setIsReplying(false);
      setActiveCommentId(null);
      setCommentText('');
      Animated.timing(slideAnim, {
        toValue: height, // Animate back down below the screen
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [
    visible,
    isAddingComment,
    recentComments,
    postId,
    timelineId,
    educationId,
    skillId,
    hobbyId,
    aspirationId,
    achievementId,
    entityType, // Add entityType to dependency array to ensure refresh when it changes
  ]);

  const fetchComments = async () => {
    if (
      !postId &&
      !timelineId &&
      !educationId &&
      !skillId &&
      !hobbyId &&
      !aspirationId &&
      !achievementId
    )
      return;

    setLoading(true);
    try {
      let response;
      if (timelineId && entityType) {
        response = await fetchTimelineComments(timelineId, entityType);
      } else if (educationId) {
        response = await fetchCommentsByEducationId(
          Number(educationId),
          entityType || 'education',
        );
      } else if (achievementId || entityType === 'achievement') {
        response = await fetchCommentSectionAchievement(
          Number(
            achievementId || educationId || skillId || hobbyId || aspirationId,
          ),
        );
      } else if (skillId) {
        response = await fetchSkillComments(Number(skillId));
      } else if (hobbyId) {
        response = await fetchHobbyComments(Number(hobbyId));
      } else if (aspirationId) {
        response = await fetchAspirationComments(Number(aspirationId));
      } else if (postId) {
        response = await getPostComments(postId);
      } else {
        setLoading(false);
        return;
      }

      if (response.data.success) {
        const apiComments = response.data.data.comments || [];
        // Convert API comments to UI comments
        const convertedComments = apiComments.map((comment: ApiComment) =>
          convertApiCommentToUiComment(comment),
        );
        setCommentsData(convertedComments);
      } else {
        // Set empty array if API response indicates failure
        setCommentsData([]);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load comments',
        });
      }
    } catch (error) {
      console.log('Error fetching comments:', error);
      // Set empty array in case of error
      setCommentsData([]);
      // Toast.show({
      //   type: 'error',
      //   text1: 'Error',
      //   text2: 'Failed to load comments',
      // });
    } finally {
      setLoading(false);
    }
  };

  const convertApiCommentToUiComment = (apiComment: any): Comment => {
    // Handle case where apiComment might be undefined or null
    if (!apiComment) {
      return {
        id: 'unknown',
        author: 'Unknown User',
        designation: 'User',
        timeAgo: 'Just now',
        createdAt: new Date().toISOString(), // Add createdAt for default object
        text: '',
        likes: 0,
        isLiked: false,
        company: null, // Add company field
        isVerified: false,
        replies: [],
      };
    }

    return {
      id: apiComment.id || 'unknown',
      author: apiComment.user?.fullName || 'Unknown User',
      designation: apiComment.user?.designation || 'User',
      timeAgo: formatTimeAgo(apiComment.createdAt),
      createdAt: apiComment.createdAt,
      avatar: apiComment.user?.profilePicture || undefined, // Use profilePicture from API response
      company: apiComment.user?.company || null, // Include company from API
      text: apiComment.content,
      likes: apiComment.likesCount || 0,
      isLiked: apiComment.isLiked || false,
      isVerified: apiComment.user?.isVerified || false,
      repliesCount: apiComment.repliesCount || 0,
      currentPage: 1,
      totalPages: 1,
      showReplies: false,
      replies: Array.isArray(apiComment.replies)
        ? apiComment.replies.map((reply: any) => ({
          id: reply.id || 'unknown-reply',
          author: reply.user?.fullName || 'Unknown User',
          designation: reply.user?.designation || 'User',
          timeAgo: formatTimeAgo(reply.createdAt),
          createdAt: reply.createdAt,
          avatar: reply.user?.profilePicture || undefined, // Use profilePicture from API response for replies
          company: reply.user?.company || null, // Include company from API for replies
          text: reply.content,
          likes: reply.likesCount || 0,
          isLiked: reply.isLiked || false,
          isVerified: reply.user?.isVerified || false,
          repliesCount: reply.repliesCount || 0,
          currentPage: 1,
          totalPages: 1,
          showReplies: false,
        }))
        : [],
    };
  };

  // Sort the comments data based on the selected sort option
  const getSortedCommentsData = () => {
    const sortedData = [...commentsData]; // Create a copy to avoid mutating the original array

    switch (sortOption) {
      case 'recent':
        // Sort by createdAt in descending order (most recent first)
        return sortedData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;

          return dateB - dateA; // Descending order (most recent first)
        });
      case 'alphabetical':
        // Sort by user's full name in ascending order (A to Z)
        return sortedData.sort((a, b) => {
          const nameA = a.author?.toLowerCase() || '';
          const nameB = b.author?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
      default:
        return sortedData;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31104000)
      return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31104000)}y ago`;
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0 && gestureState.dy > Math.abs(gestureState.dx);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0 && visible) {
        // Move the modal down from its current position when visible
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        // Dismiss the modal if dragged down far enough
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onClose());
      } else {
        // Return to original position
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleReplyPress = (commentId: string | number, authorName: string) => {
    setIsReplying(true);
    setActiveCommentId(commentId);
    setCommentText(`@${authorName} `);
    setReplyingToAuthor(authorName);
  };

  const handleSend = async () => {
    if (
      !commentText.trim() ||
      (!postId &&
        !timelineId &&
        !educationId &&
        !skillId &&
        !hobbyId &&
        !aspirationId &&
        !achievementId)
    )
      return;
    try {
      // Prepare final content by stripping the tag if present
      let finalContent = commentText;
      if (
        isReplying &&
        replyingToAuthor &&
        finalContent.startsWith(`@${replyingToAuthor}`)
      ) {
        finalContent = finalContent
          .substring(replyingToAuthor.length + 2)
          .trimStart();
      }

      if (!finalContent.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please enter a comment',
        });
        return;
      }

      const commentData: any = {
        content: finalContent,
      };

      // Add parentCommentId only for replies
      if (isReplying && activeCommentId) {
        commentData.parentCommentId =
          typeof activeCommentId === 'number'
            ? activeCommentId
            : Number(activeCommentId);
      }

      // Determine which ID to use for the API call
      const idToUse =
        timelineId ||
        postId ||
        educationId ||
        skillId ||
        hobbyId ||
        aspirationId ||
        achievementId;

      if (!idToUse) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No valid ID provided for comment',
        });
        return;
      }

      // Call the appropriate API to add the comment
      let response;
      const combinedId = Number(
        achievementId ||
        hobbyId ||
        skillId ||
        aspirationId ||
        educationId ||
        timelineId ||
        postId,
      );

      if (timelineId && entityType) {
        response = await addTimelineComment(
          Number(timelineId),
          commentData,
          entityType,
        );
      } else if (educationId) {
        response = await addCommentsReplies(
          Number(educationId),
          commentData,
          entityType || 'education',
        );
      } else if (achievementId || entityType === 'achievement') {
        response = await addCommentSectionAchievement(combinedId, commentData);
      } else if (skillId) {
        response = await addSkillCommentReply(Number(skillId), commentData);
      } else if (hobbyId) {
        response = await addHobbyCommentReply(Number(hobbyId), commentData);
      } else if (aspirationId) {
        response = await addAspirationCommentReply(
          Number(aspirationId),
          commentData,
        );
      } else {
        response = await addComment(Number(postId), commentData);
      }

      if (response.data.success) {
        // Create a new comment object from the API response
        const newCommentFromApi = response.data?.data?.comment;

        const newComment: Comment = {
          id: newCommentFromApi?.id || `temp-${Date.now()}`,
          author: newCommentFromApi?.user?.fullName || 'Me',
          designation: newCommentFromApi?.user?.designation || 'User',
          timeAgo: 'Just now',
          createdAt: newCommentFromApi?.createdAt || new Date().toISOString(),
          avatar: newCommentFromApi?.user?.profilePicture || undefined,
          company: newCommentFromApi?.user?.company || null,
          text: newCommentFromApi?.content || finalContent,
          likes: newCommentFromApi?.likesCount || 0,
          isLiked: false,
          isVerified: newCommentFromApi?.user?.isVerified || false,
          replies: [],
        };

        // Add the new comment to the comments data
        if (isReplying && activeCommentId) {
          // Add reply to existing comment (recursive)
          const updatedComments = addReplyToComment(
            commentsData,
            activeCommentId,
            newComment,
          );
          setCommentsData(updatedComments);
        } else {
          // Add new top-level comment
          setCommentsData([newComment, ...commentsData]);
        }

        // Clear the input and reset state
        setCommentText('');
        setIsReplying(false);
        setActiveCommentId(null);
        setReplyingToAuthor(null);
        // Call the onCommentAdded callback if provided
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to add comment',
        });
      }
    } catch (error) {
      console.log('Error adding comment:', error);
      // Toast.show({
      //   type: 'error',
      //   text1: 'Error',
      //   text2: 'Failed to add comment',
      // });
    }
  };

  const addReplyToComment = (
    commentsArray: Comment[],
    targetId: string | number,
    newReply: Comment,
  ): Comment[] => {
    let wasFound = false;
    const result = commentsArray.map(comment => {
      if (comment.id === targetId) {
        wasFound = true;
        return {
          ...comment,
          replies: [newReply, ...(comment.replies || [])],
          repliesCount: (comment.repliesCount || 0) + 1,
          showReplies: true,
          isExpanded: true,
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        const updatedNested = addReplyToComment(
          comment.replies,
          targetId,
          newReply,
        );
        if (updatedNested !== comment.replies) {
          wasFound = true;
          return {
            ...comment,
            replies: updatedNested,
            showReplies: true,
          };
        }
      }
      return comment;
    });
    return wasFound ? result : commentsArray;
  };

  const handleToggleReplies = (commentId: string | number) => {
    const updateToggle = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const newShowReplies = !comment.showReplies;
          // If we're showing replies and we don't have all of them (or none), load them
          const currentRepliesCount = comment.replies?.length || 0;
          if (
            newShowReplies &&
            currentRepliesCount < (comment.repliesCount || 0)
          ) {
            // Fetch the appropriate page. If we have none or just a few, fetch page 1.
            const targetPage =
              currentRepliesCount === 0 ? 1 : comment.currentPage || 1;
            handleLoadMoreReplies(commentId, targetPage, false); // Don't auto-expand to all replies
          }
          return {
            ...comment,
            showReplies: newShowReplies,
            isExpanded: newShowReplies ? comment.isExpanded : false,
          };
        }
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateToggle(comment.replies) };
        }
        return comment;
      });
    };
    setCommentsData(prev => updateToggle(prev));
  };

  const handleLoadMoreReplies = async (
    commentId: string | number,
    page?: number,
    shouldExpand = true,
  ) => {
    const updateCommentWithReplies = (
      comments: Comment[],
      targetId: string | number,
      newReplies: Comment[],
      currentPage: number,
      totalPages: number,
      expand: boolean,
    ): Comment[] => {
      return comments.map(comment => {
        if (comment.id === targetId) {
          // If it's page 1, we might be refreshing or loading initial
          const existingReplies = comment.replies || [];
          const combinedReplies =
            currentPage === 1 && existingReplies.length === 0
              ? newReplies
              : [...existingReplies, ...newReplies];

          const uniqueReplies = combinedReplies.filter(
            (reply, index, self) =>
              index === self.findIndex(r => r.id === reply.id),
          );

          return {
            ...comment,
            replies: uniqueReplies,
            currentPage,
            totalPages,
            showReplies: true,
            isExpanded: expand || comment.isExpanded,
          };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentWithReplies(
              comment.replies,
              targetId,
              newReplies,
              currentPage,
              totalPages,
              expand,
            ),
          };
        }
        return comment;
      });
    };

    try {
      // Find current page for this comment
      let targetPage = page;
      if (!targetPage) {
        const findComment = (
          comments: Comment[],
          id: string | number,
        ): Comment | null => {
          for (const c of comments) {
            if (c.id === id) return c;
            if (c.replies) {
              const found = findComment(c.replies, id);
              if (found) return found;
            }
          }
          return null;
        };
        const targetComment = findComment(commentsData, commentId);

        // If we are on the last page already, don't fetch next
        if (
          targetComment &&
          (targetComment.currentPage || 1) >= (targetComment.totalPages || 1)
        ) {
          // But if we still have more replies according to total count that aren't loaded,
          // it might be a partial page 1.
          if (
            (targetComment.replies?.length || 0) <
            (targetComment.repliesCount || 0)
          ) {
            targetPage = targetComment.currentPage || 1;
          } else {
            return; // No more to fetch
          }
        } else {
          targetPage = (targetComment?.currentPage || 1) + 1;
        }
      }

      const response = await fetchSocialCommentsById(
        Number(commentId),
        targetPage,
      );
      if (response.data.success) {
        const { replies, page: respPage, totalPages } = response.data.data;
        const convertedReplies = replies.map((r: any) =>
          convertApiCommentToUiComment(r),
        );
        setCommentsData(prev =>
          updateCommentWithReplies(
            prev,
            commentId,
            convertedReplies,
            respPage,
            totalPages,
            shouldExpand,
          ),
        );
      }
    } catch (error) {
      console.log('Error loading more replies:', error);
    }
  };

  const handleLike = async (
    commentId: string | number,
    isReply = false,
    parentId?: string | number,
  ) => {
    if (!commentId) return; // Guard clause to ensure commentId exists

    try {
      const idToUse = Number(commentId);
      // Call the appropriate API based on whether it's a timeline comment or post comment
      if (achievementId || entityType === 'achievement') {
        // Use achievement comment like API if achievementId is provided
        await likeCommentSectionAchievement(idToUse);
      } else if (timelineId) {
        // Use timeline comment like API if timelineId is provided
        await toggleTimelineCommentLike(idToUse);
      } else if (educationId) {
        // Use education comment like API if educationId is provided
        await addLikeToCommentandReply(idToUse);
      } else if (skillId) {
        // Use skill comment like API if skillId is provided
        await likeSkillCommentReply(idToUse);
      } else if (hobbyId) {
        // Use hobby comment like API if hobbyId is provided
        await likeHobbyCommentReply(idToUse);
      } else if (aspirationId) {
        // Use aspiration comment like API if aspirationId is provided
        await likeAspirationCommentReply(idToUse);
      } else {
        // Use regular comment like API for post comments
        await likeComment(idToUse);
      }

      // Update the UI state only after successful API call
      // setCommentsData(prevComments =>
      //   prevComments.map(comment => {
      //     if (!isReply && comment.id === commentId) {
      //       return {
      //         ...comment,
      //         isLiked: !comment.isLiked,
      //         likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
      //       };
      //     }

      //     if (isReply && comment.id === parentId) {
      //       return {
      //         ...comment,
      //         replies: comment.replies?.map(reply =>
      //           reply.id === commentId
      //             ? {
      //               ...reply,
      //               isLiked: !reply.isLiked,
      //               likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
      //             }
      //             : reply,
      //         ),
      //       };
      //     }

      //     return comment;
      //   }),
      // );

      const toggleLikeRecursive = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          // If we find the specific comment/reply, toggle its like status
          if (c.id === commentId) {
            return {
              ...c,
              isLiked: !c.isLiked,
              likes: c.isLiked ? c.likes - 1 : c.likes + 1,
            };
          }
          // If it has deeper replies, traverse into them
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: toggleLikeRecursive(c.replies) };
          }
          return c;
        });
      };

      setCommentsData(prevComments => toggleLikeRecursive(prevComments));


    } catch (error) {
      console.log('Error liking comment:', error);
      // Toast.show({
      //   type: 'error',
      //   text1: 'Error',
      //   text2: 'Failed to like comment',
      // });
    }
  };

  const renderComment = (
    comment: Comment,
    isReply = false,
    parentId?: string | number,
    parentAuthor?: string,
  ) => {
    const repliesCount = comment.repliesCount || 0;
    const loadedRepliesCount = comment.replies?.length || 0;
    const showViewReplies = repliesCount > 0;
    const hasMoreReplies = loadedRepliesCount < repliesCount;

    // Filter replies based on expanded state
    const repliesToShow = comment.showReplies
      ? comment.isExpanded
        ? comment.replies
        : comment.replies?.slice(0, 5)
      : [];

    return (
      <View
        key={comment.id}
        style={[styles.commentContainer, isReply && styles.replyContainer]}
      >
        <View style={styles.commentHeader}>
          <View style={styles.leftSection}>
            {comment.avatar ? (
              <Image
                source={{ uri: comment.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {comment.author.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {comment.isVerified && (
              <Image
                source={require('../assets/icons/tick.png')}
                style={styles.verifiedIcon}
              />
            )}
            <View style={styles.commentInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{comment.author}</Text>
                <Text style={styles.timeAgo}>{comment.timeAgo}</Text>
                <TouchableOpacity>
                  <Text style={styles.moreIcon}>•••</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.designation}>
                {comment.designation &&
                  comment.designation !== 'User' &&
                  comment.designation !== null ? (
                  <>
                    {comment.designation}
                    {comment.designation && comment.company ? ' at ' : ''}
                  </>
                ) : null}
                {comment.company && comment.company !== null
                  ? comment.company
                  : ''}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.commentText}>
          {isReply &&
            parentAuthor &&
            comment.text.startsWith(`@${parentAuthor}`)
            ? comment.text.substring(parentAuthor.length + 2).trimStart()
            : comment.text}
        </Text>

        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLike(comment.id, isReply, parentId)}
          >
            <Image
              source={
                comment.isLiked
                  ? require('../assets/icons/like2.png')
                  : require('../assets/icons/like1.png')
              }
              style={styles.likeIcon}
            />
            <Text style={styles.likeCount}>{comment.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => handleReplyPress(comment.id, comment.author)}
          >
            <Image
              source={require('../assets/icons/comment.png')}
              style={styles.replyIcon}
            />
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>

          {!isReply && (
            <TouchableOpacity style={styles.replyButton}>
              <Image
                source={require('../assets/icons/time.png')}
                style={styles.replyIcon}
              />
              <Text style={styles.timeText}>{comment.timeAgo}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* View Replies Toggle */}
        {showViewReplies && (
          <TouchableOpacity
            onPress={() => handleToggleReplies(comment.id)}
            style={styles.viewRepliesButton}
          >
            <Text style={styles.viewRepliesText}>
              {comment.showReplies
                ? 'Hide replies'
                : `View ${repliesCount} ${repliesCount === 1 ? 'reply' : 'replies'
                }`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Reply List */}
        {comment.showReplies &&
          Array.isArray(repliesToShow) &&
          repliesToShow.length > 0 && (
            <View style={styles.replyList}>
              {repliesToShow.map(reply =>
                renderComment(reply, true, comment.id, comment.author),
              )}

              {/* Show more replies button */}
              {(hasMoreReplies ||
                (loadedRepliesCount > 5 && !comment.isExpanded)) && (
                  <TouchableOpacity
                    onPress={() => {
                      if (loadedRepliesCount > 5 && !comment.isExpanded) {
                        // Just expand if we already have more than 5 in the list
                        const updateExpanded = (
                          comments: Comment[],
                        ): Comment[] => {
                          return comments.map(c => {
                            if (c.id === comment.id)
                              return { ...c, isExpanded: true };
                            if (c.replies)
                              return { ...c, replies: updateExpanded(c.replies) };
                            return c;
                          });
                        };
                        setCommentsData(prev => updateExpanded(prev));
                      } else if (hasMoreReplies) {
                        handleLoadMoreReplies(comment.id, undefined, true);
                      }
                    }}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>Show more replies</Text>
                  </TouchableOpacity>
                )}
            </View>
          )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Image
                source={require('../assets/icons/back.png')}
                style={styles.backIcon}
              />
              <Text style={styles.headerTitle}>Comments</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sortSection}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortModalVisible(true)}
            >
              <Text style={styles.modalSubtitle}>
                {sortOption === 'recent'
                  ? 'Most recent'
                  : sortOption === 'alphabetical'
                    ? 'Alphabetical'
                    : 'Most recent'}
              </Text>
              <Image
                source={require('../assets/icons/down.png')}
                style={styles.downIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.commentsContainer}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <Text style={styles.loadingText}>Loading comments...</Text>
            ) : getSortedCommentsData().length > 0 ? (
              getSortedCommentsData().map(comment => renderComment(comment))
            ) : (
              <Text style={styles.noCommentsText}>No comments yet</Text>
            )}
          </ScrollView>

          {(isReplying || isAddingComment) && (
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    isReplying ? 'Add a reply...' : 'Add a comment...'
                  }
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline={true}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !commentText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!commentText.trim()}
              >
                <Text style={styles.sendButtonText}>
                  {isReplying ? 'Reply' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>

      <Modal
        transparent={true}
        animationType="slide"
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.sortOverlay}
          activeOpacity={1}
          onPressOut={() => setSortModalVisible(false)}
        >
          <View style={styles.sortModal}>
            <TouchableOpacity
              onPress={() => {
                setSortOption('recent');
                setSortModalVisible(false);
              }}
              style={styles.sortOption}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortOption === 'recent' && styles.selectedSort,
                ]}
              >
                Most recent
              </Text>
              <Text>See all likes, the most recent likes are first</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSortOption('alphabetical');
                setSortModalVisible(false);
              }}
              style={styles.sortOption}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortOption === 'alphabetical' && styles.selectedSort,
                ]}
              >
                Alphabetical
              </Text>
              <Text>See all comments sorted alphabetically by name</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    width: '100%',
    height: height * 0.8,
    overflow: 'hidden',
    paddingHorizontal: moderateScale(14),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    width: '100%',
    height: height * 0.8,
    overflow: 'hidden',
    paddingHorizontal: moderateScale(14),
  },
  dragHandle: {
    width: moderateScale(40),
    height: moderateScale(4),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginRight: moderateScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  sortText: {
    fontSize: moderateScale(14),
    color: '#66',
    marginRight: moderateScale(4),
  },
  dropdownIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
  },
  commentContainer: {
    paddingVertical: moderateScale(16),
  },
  replyContainer: {
    marginLeft: moderateScale(40),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 0,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(7),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  avatarImage: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    marginRight: moderateScale(10),
  },
  avatarText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#666',
  },
  verifiedIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(8),
    marginTop: moderateScale(8),
  },
  commentInfo: {
    flex: 1,
    marginLeft: moderateScale(4),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -moderateScale(6),
  },
  authorName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000',
    marginRight: moderateScale(8),
  },
  timeAgo: {
    fontSize: moderateScale(12),
    color: '#66',
    marginRight: moderateScale(8),
    marginLeft: 'auto',
  },
  moreIcon: {
    fontSize: moderateScale(16),
    color: '#666',
    marginLeft: 'auto',
  },
  designation: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  commentText: {
    fontSize: moderateScale(14),
    color: '#000',
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(8),
    marginTop: verticalScale(8),
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginRight: moderateScale(30),
    // backgroundColor:'red'
  },
  likeIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: moderateScale(4),
    objectFit: 'contain',
  },
  likeCount: {
    fontSize: moderateScale(12),
    color: '#66',
    marginLeft: moderateScale(4),
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(30),
  },
  replyIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(4),
  },
  replyText: {
    fontSize: moderateScale(12),
    color: '#66',
  },
  timeText: {
    fontSize: moderateScale(12),
    color: '#66',
  },
  inputContainer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#ffffff',
  },
  inputWrapper: {
    backgroundColor: 'rgba(221, 214, 221, 1)',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    marginBottom: moderateScale(10),
  },
  textInput: {
    fontSize: moderateScale(14),
    color: '#000',
    maxHeight: moderateScale(100),
    paddingVertical: moderateScale(4),
  },
  sendButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#57B915',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: '#000',
    marginBottom: verticalScale(10),
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: verticalScale(10),
  },
  downIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    marginLeft: moderateScale(6),
    marginBottom: verticalScale(8),
    tintColor: '#000',
  },
  sortOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sortModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    width: '100%',
  },
  sortOption: {
    paddingVertical: verticalScale(10),
  },
  sortOptionText: {
    fontSize: moderateScale(14),
    color: '#000',
  },
  selectedSort: {
    fontWeight: 'bold',
    color: '#000',
  },
  replyList: {
    marginTop: moderateScale(10),
  },
  viewRepliesButton: {
    marginTop: moderateScale(8),
    marginLeft: moderateScale(40),
  },
  viewRepliesText: {
    fontSize: moderateScale(13),
    color: '#000000', // Standard action blue
    fontWeight: '600',
  },
  showMoreButton: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(0),
    marginTop: moderateScale(5),
    marginLeft: moderateScale(40),
  },
  showMoreText: {
    fontSize: moderateScale(13),
    color: '#000000',
    fontWeight: '600',
  },
  noCommentsText: {
    fontSize: moderateScale(14),
    color: '#666',
    textAlign: 'center',
    marginTop: verticalScale(20),
    paddingHorizontal: moderateScale(16),
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: '#666',
    textAlign: 'center',
    marginTop: verticalScale(8),
    paddingHorizontal: moderateScale(16),
  },
});

export default CommentsModal;
