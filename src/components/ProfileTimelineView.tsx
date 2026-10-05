import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchTimeLineByUserId, likeUnlikeTimeline } from '../api/service';
import LikesModal from './LikesModal';
import CommentsModal from './CommentsModal';
import ValidationsListModal from './modal/ValidationsListModal';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 1)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (size * factor - size) * factor;

// API Response Types (based on ProfileTimeline.tsx)
interface Company {
  id: number;
  name: string;
  logo: string;
  uniqueAddress: string;
  isVerified?: boolean; // Added optional to matching ProfileTimelineView data, but ValidationsListModal might expect it.
}

interface Stats {
  likesCount: number;
  commentsCount: number;
}

interface Validator {
  id: number;
  fullName: string;
  profilePicture: string | null;
  currentDesignation: string | null;
  credibilityScore: number;
  positions: Array<{
    id: number;
    title: string;
    company: {
      id: number;
      name: string;
    };
  }>;
}

interface Skill {
  skillName: string;
}

interface Validation {
  validatorReference: any;
  id: number;
  positionId: number;
  validatorUserId: number;
  validatorPositionId: number;
  validationRequestId: number;
  positionVersion: number;
  status: 'verified' | 'pending' | 'rejected';
  relationship: string;
  recommendation: string;
  validatedAt: string;
  createdAt: string;
  updatedAt: string;
  achievementId: number | null;
  validator: Validator;
  skills: Skill[];
}

interface Achievement {
  id: number;
  type: 'achievement';
  title: string;
  description: string;
  startMonth: number | null;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrentlyWorking: boolean;
  mediaUrl: string | null;
  validationStatus: 'verified' | 'pending' | 'rejected';
  validationScore: number;
  dateRange: string;
  company: Company;
  stats: Stats;
  isLiked: boolean;
  validations: Validation[];
}

interface Position {
  id: number | string;
  type: 'position';
  title: string;
  description: string;
  startMonth: number | null;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrentlyWorking: boolean;
  mediaUrl: string | null;
  validationStatus: 'verified' | 'pending' | 'rejected';
  validationScore: number;
  dateRange: string;
  company: Company;
  stats: Stats;
  isLiked: boolean;
  validations: Validation[];
  achievements: Achievement[];
  hrVerified?: boolean;
}

interface TimelineCompany {
  company: Company;
  positions: Position[];
}

interface TimelineResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    timeline: TimelineCompany[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error: null | string;
}

interface ProfileTimelineViewProps {
  userId: number;
}

const ProfileTimelineView: React.FC<ProfileTimelineViewProps> = ({
  userId,
}) => {
  const navigation = useNavigation<any>();
  const [timelineData, setTimelineData] = useState<TimelineCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false); // Added state for adding comment mode
  const [currentItemId, setCurrentItemId] = useState<number | string | null>(
    null,
  );
  const [currentItemType, setCurrentItemType] = useState<
    'position' | 'achievement' | null
  >(null);
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const needsTruncation = (text: string) => text.length > 100;

  const truncateText = (text: string) => text.substring(0, 100) + '...';

  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Achievement | null>(
    null,
  );

  const openValidationsModal = (item: any) => {
    if (item.type === 'achievement') {
      setSelectedEntity(item);
      setIsValidationsModalOpen(true);
    }
  };

  // Helper function to handle stats press (likes/comments)
  const handleStatsPress = async (
    itemId: number | string,
    itemType: 'position' | 'achievement',
  ) => {
    setCurrentItemId(itemId);
    setCurrentItemType(itemType);
  };

  const updateCommentCount = useCallback(
    (itemId: number | string, increment: number, type: string) => {
      setTimelineData(prevData => {
        return prevData.map(companyData => ({
          ...companyData,
          positions: companyData.positions.map(pos => {
            if (type === 'position' && pos.id === itemId) {
              return {
                ...pos,
                stats: {
                  ...pos.stats,
                  commentsCount: (pos.stats.commentsCount || 0) + increment,
                },
              };
            }
            if (
              type === 'achievement' &&
              pos.achievements &&
              pos.achievements.length > 0
            ) {
              const updatedAchievements = pos.achievements.map(ach => {
                if (Number(ach.id) === Number(itemId)) {
                  return {
                    ...ach,
                    stats: {
                      ...ach.stats,
                      commentsCount: (ach.stats.commentsCount || 0) + increment,
                    },
                  };
                }
                return ach;
              });

              // Check if any achievement was actually updated
              const isAchievementUpdated = pos.achievements.some(
                ach => Number(ach.id) === Number(itemId),
              );

              if (isAchievementUpdated) {
                return { ...pos, achievements: updatedAchievements };
              }
            }
            return pos;
          }),
        }));
      });
    },
    [],
  );

  const handleLikeUnlike = async (
    id: any,
    type: 'position' | 'achievement',
  ) => {
    try {
      // First, find the current item to get its current state
      let currentItem: Position | Achievement | null = null;
      let currentIsLiked = false;
      let currentLikesCount = 0;

      // Search for the item in the current timeline data
      for (const companyData of timelineData) {
        for (const position of companyData.positions) {
          if (position.id === id && position.type === type) {
            currentItem = position;
            currentIsLiked = position.isLiked;
            currentLikesCount = position.stats.likesCount || 0;
            break;
          }
          // Check achievements within this position
          for (const achievement of position.achievements) {
            if (achievement.id === id && achievement.type === type) {
              currentItem = achievement;
              currentIsLiked = achievement.isLiked;
              currentLikesCount = achievement.stats.likesCount || 0;
              break;
            }
          }
          if (currentItem) break;
        }
        if (currentItem) break;
      }

      if (!currentItem) {
        console.log('Item not found for like/unlike');
        return;
      }

      // Calculate new values optimistically
      const newIsLiked = !currentIsLiked;
      const newLikesCount = newIsLiked
        ? currentLikesCount + 1
        : Math.max(0, currentLikesCount - 1);

      // Optimistically update the state
      setTimelineData(prevData => {
        return prevData.map(companyData => ({
          ...companyData,
          positions: companyData.positions.map(pos => {
            // Check if this is the position being liked/unliked
            if (pos.id === id && pos.type === type) {
              return {
                ...pos,
                isLiked: newIsLiked,
                stats: {
                  ...pos.stats,
                  likesCount: newLikesCount,
                },
              };
            }

            // Check achievements within this position
            const updatedAchievements = pos.achievements.map(ach => {
              if (ach.id === id && ach.type === type) {
                return {
                  ...ach,
                  isLiked: newIsLiked,
                  stats: {
                    ...ach.stats,
                    likesCount: newLikesCount,
                  },
                };
              }
              return ach;
            });

            return {
              ...pos,
              achievements: updatedAchievements,
            };
          }),
        }));
      });

      // Make API call in background
      likeUnlikeTimeline(id, type)
        .then(response => {
          if (response.data.success) {
            const serverIsLiked = response.data.data.action === 'liked';
            const serverLikesCount = response.data.data.likesCount;

            console.log('API response:', response.data.data);

            // If server response differs from our optimistic update, update with server data
            if (
              serverIsLiked !== newIsLiked ||
              (serverLikesCount !== undefined &&
                serverLikesCount !== newLikesCount)
            ) {
              console.log('Updating with server data...');

              setTimelineData(prevData => {
                return prevData.map(companyData => ({
                  ...companyData,
                  positions: companyData.positions.map(pos => {
                    if (pos.id === id && pos.type === type) {
                      return {
                        ...pos,
                        isLiked: serverIsLiked,
                        stats: {
                          ...pos.stats,
                          likesCount:
                            serverLikesCount !== undefined
                              ? serverLikesCount
                              : newLikesCount,
                        },
                      };
                    }

                    const updatedAchievements = pos.achievements.map(ach => {
                      if (ach.id === id && ach.type === type) {
                        return {
                          ...ach,
                          isLiked: serverIsLiked,
                          stats: {
                            ...ach.stats,
                            likesCount:
                              serverLikesCount !== undefined
                                ? serverLikesCount
                                : newLikesCount,
                          },
                        };
                      }
                      return ach;
                    });

                    return {
                      ...pos,
                      achievements: updatedAchievements,
                    };
                  }),
                }));
              });
            }
          }
        })
        .catch(error => {
          console.log(
            'Error in like/unlike API call:',
            error.response || error,
          );
          // If API fails, revert to original state after a delay
          setTimeout(() => {
            setTimelineData(prevData => {
              return prevData.map(companyData => ({
                ...companyData,
                positions: companyData.positions.map(pos => {
                  if (pos.id === id && pos.type === type) {
                    return {
                      ...pos,
                      isLiked: currentIsLiked,
                      stats: {
                        ...pos.stats,
                        likesCount: currentLikesCount,
                      },
                    };
                  }

                  const updatedAchievements = pos.achievements.map(ach => {
                    if (ach.id === id && ach.type === type) {
                      return {
                        ...ach,
                        isLiked: currentIsLiked,
                        stats: {
                          ...ach.stats,
                          likesCount: currentLikesCount,
                        },
                      };
                    }
                    return ach;
                  });

                  return {
                    ...pos,
                    achievements: updatedAchievements,
                  };
                }),
              }));
            });
          }, 1000); // Revert after 1 second if API fails
        });
    } catch (error: any) {
      console.log('Error in handleLikeUnlike:', error.response || error);
    }
  };

  // Function to fetch timeline data with pagination support
  const fetchTimelineData = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      console.log('Fetching timeline for user:', userId, 'page:', page);
      const response = await fetchTimeLineByUserId(userId, page);
      console.log('API Response:', response);

      // Check if response structure matches what we expect
      if (
        response &&
        response.data &&
        response.data.data &&
        response.data.data.timeline
      ) {
        if (page === 1) {
          setTimelineData(response.data.data.timeline);
        } else {
          // Append new data to existing data
          setTimelineData(prevData => [
            ...prevData,
            ...response.data.data.timeline,
          ]);
        }

        // Update pagination data if available
        if (response.data.data.pagination) {
          setPagination(response.data.data.pagination);
        } else {
          // If no pagination data, estimate based on number of items returned
          const defaultPageSize = 10;
          const hasMore = response.data.data.timeline.length >= defaultPageSize;
          setPagination(prev => ({
            currentPage: page,
            totalPages: prev.totalPages,
            totalItems: prev.totalItems,
            hasNext: hasMore,
            hasPrev: page > 1,
          }));
        }
      } else if (response && response.data && response.data.timeline) {
        if (page === 1) {
          setTimelineData(response.data.timeline);
        } else {
          // Append new data to existing data
          setTimelineData(prevData => [...prevData, ...response.data.timeline]);
        }

        // Update pagination data if available
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        } else {
          const defaultPageSize = 10;
          const hasMore = response.data.timeline.length >= defaultPageSize;
          setPagination(prev => ({
            currentPage: page,
            totalPages: prev.totalPages,
            totalItems: prev.totalItems,
            hasNext: hasMore,
            hasPrev: page > 1,
          }));
        }
      } else if (response && Array.isArray(response)) {
        // If the response is directly the timeline array
        if (page === 1) {
          setTimelineData(response);
        } else {
          setTimelineData(prevData => [...prevData, ...response]);
        }

        // Estimate pagination data
        const defaultPageSize = 10;
        const hasMore = response.length >= defaultPageSize;
        setPagination(prev => ({
          currentPage: page,
          totalPages: prev.totalPages,
          totalItems: prev.totalItems,
          hasNext: hasMore,
          hasPrev: page > 1,
        }));
      } else if (response && response.data && Array.isArray(response.data)) {
        // If data is directly the timeline array
        if (page === 1) {
          setTimelineData(response.data);
        } else {
          setTimelineData(prevData => [...prevData, ...response.data]);
        }

        // Estimate pagination data
        const defaultPageSize = 10;
        const hasMore = response.data.length >= defaultPageSize;
        setPagination(prev => ({
          currentPage: page,
          totalPages: prev.totalPages,
          totalItems: prev.totalItems,
          hasNext: hasMore,
          hasPrev: page > 1,
        }));
      } else {
        console.log('Unexpected response structure:', response);
        setError('Unexpected response format from server');
      }
    } catch (err: any) {
      console.error('Error fetching timeline data:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load timeline data');
    } finally {
      if (loadingMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Function to refresh the timeline data (first page)
  const refreshTimeline = async () => {
    await fetchTimelineData(1);
  };

  // Function to load more timeline data
  const loadMoreTimeline = async () => {
    if (pagination.hasNext && !loadingMore) {
      const nextPage = pagination.currentPage + 1;
      await fetchTimelineData(nextPage);
    }
  };

  // Load More Button Component
  const LoadMoreButton = () => {
    if (!pagination?.hasNext) return null;

    return (
      <View style={styles.loadMoreContainer}>
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingMoreText}>Loading more items...</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMoreTimeline}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Fetch timeline data from API
  useEffect(() => {
    refreshTimeline();
  }, [userId]);

  // Helper function to render company items
  const renderCompanyItem = (
    timelineCompany: TimelineCompany,
    companyIndex: number,
  ) => {
    const { company, positions } = timelineCompany;
    const isLastCompany = companyIndex === timelineData.length - 1;
    const hasPositions = positions && positions.length > 0;
    const lastPosition = hasPositions ? positions[positions.length - 1] : null;
    const hasAchievementsInLastPosition =
      lastPosition &&
      lastPosition.achievements &&
      lastPosition.achievements.length > 0;

    return (
      <View key={`company-${company.id}`}>
        {/* Company Header */}
        <View style={[styles.timelineItem, styles.companyItem]}>
          <View style={styles.timelineLeft}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CompanyProfile', { company })}
            >
              <View style={[styles.timelineIconContainer, styles.companyIcon]}>
                <Image
                  source={
                    company.logo
                      ? { uri: company.logo }
                      : require('../assets/icons/google.png')
                  }
                  style={styles.timelineIcon}
                />
              </View>
            </TouchableOpacity>
            {(!isLastCompany || hasPositions) && (
              <View style={styles.timelineLine} />
            )}
          </View>

          <View style={styles.timelineContent}>
            <View style={styles.contentHeader}>
              <View style={styles.dateContainer}>
                <Text style={styles.companyText}>{company.name}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Positions for this company */}
        {positions.map((position, positionIndex) =>
          renderPositionItem(
            position,
            company,
            positionIndex,
            positions.length,
            // Pass whether this is the last position in the last company
            isLastCompany &&
              positionIndex === positions.length - 1 &&
              !hasAchievementsInLastPosition,
          ),
        )}
      </View>
    );
  };

  // Helper function to render position items
  // Update the renderPositionItem function - Stats section
  const renderPositionItem = (
    position: Position,
    company: Company,
    index: number,
    total: number,
    isLastOverallItem: boolean = false,
  ) => {
    const isLastPosition = index === total - 1;
    const hasAchievements =
      position.achievements && position.achievements.length > 0;
    const shouldShowTimelineLine =
      !isLastPosition || hasAchievements || !isLastOverallItem;

    return (
      <View
        style={[styles.timelineItem, styles.roleItem]}
        key={`position-${position.id}`}
      >
        {/* Timeline Line and Icon */}
        <View style={styles.timelineLeft}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CompanyProfile', { company })}
          >
            <View style={[styles.timelineIconContainer, styles.roleIcon]}>
              <Image
                source={
                  company.logo
                    ? { uri: company.logo }
                    : require('../assets/icons/marks.png')
                }
                style={styles.timelineIcon}
              />
            </View>
          </TouchableOpacity>
          {shouldShowTimelineLine && <View style={styles.timelineLine} />}
        </View>

        {/* Content */}
        <View style={styles.timelineContent}>
          {/* Header with Date and Action Buttons */}
          <View style={styles.contentHeader}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, styles.roleTitle]}>
                {position.title}
              </Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {position.isCurrentlyWorking && (
              <View style={styles.currentlyWorkingTag}>
                <Text style={styles.currentlyWorkingText}>Currently</Text>
              </View>
            )}
            {position.hrVerified !== undefined && (
              <View style={styles.badgeContainer}>
                <View style={styles.badgeContent}>
                  {/* Text Badge */}
                  <View
                    style={
                      position.hrVerified
                        ? styles.verifiedBadge
                        : styles.notVerifiedBadge
                    }
                  >
                    <Text style={styles.badgeText}>
                      {position.hrVerified ? 'HR Verified' : 'Not Verified'}
                    </Text>
                  </View>

                  {/* Image - positioned to overlap */}
                  <View style={styles.badgeIconContainer}>
                    <Image
                      source={
                        position.hrVerified
                          ? require('../assets/icons/verifiedShield.png')
                          : require('../assets/icons/unverifiedShield.png')
                      }
                      style={styles.badgeIcon}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Title */}
          <View style={styles.dateContainer}>
            <Image
              source={require('../assets/icons/calendar.png')}
              style={styles.calendarIcon}
            />
            <Text style={styles.dateText}>{position.dateRange}</Text>
          </View>

          {renderImages(position.mediaUrl)}

          {/* Description */}
          {position.description && (
            <Text style={styles.subtitle}>{position.description}</Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            {/* Like Section - Two separate containers */}
            <View style={styles.likeSection}>
              {/* Like Icon Container */}
              <TouchableOpacity
                style={styles.statIconContainer}
                onPress={() =>
                  handleLikeUnlike(position.id as number, 'position')
                }
              >
                <Image
                  source={
                    position.isLiked
                      ? require('../assets/icons/like2.png')
                      : require('../assets/icons/like1.png')
                  }
                  style={styles.statIcon}
                />
              </TouchableOpacity>

              {/* Like Count Container - Opens modal */}
              <TouchableOpacity
                style={styles.statCountContainer}
                onPress={() => {
                  handleStatsPress(position.id, 'position');
                  setLikesModalVisible(true);
                }}
              >
                <Text style={styles.statText}>{position.stats.likesCount}</Text>
              </TouchableOpacity>
            </View>

            {/* Comment Section - Single container */}
            <TouchableOpacity
              style={styles.commentContainer}
              onPress={() => {
                handleStatsPress(position.id, 'position');
                setIsAddingComment(true); // Always show input in modal
                setCommentsModalVisible(true);
              }}
            >
              <Image
                source={require('../assets/icons/comment.png')}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>
                {position.stats.commentsCount} Comments
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verified Section */}
          {position.validations.length > 0 &&
            renderVerifiedSection(position.validations, position)}

          {/* Render achievements for this position */}
          {position.achievements.map((achievement, achievementIndex) =>
            renderAchievementItem(
              achievement,
              company,
              achievementIndex,
              position.achievements.length,
              // Pass whether this is the last achievement in the last position of the last company
              isLastOverallItem &&
                achievementIndex === position.achievements.length - 1,
            ),
          )}
        </View>
      </View>
    );
  };

  // Update the renderAchievementItem function - Stats section
  const renderAchievementItem = (
    achievement: Achievement,
    company: Company,
    index: number,
    total: number,
    isLastOverallItem: boolean = false,
  ) => {
    const isLastAchievement = index === total - 1;
    const itemId = `achievement-${achievement.id}`;
    const isExpanded = expandedItems.has(itemId);
    const description = achievement.description || '';
    const shouldTruncate = needsTruncation(description);

    // Only show timeline line if this is not the last achievement OR not the last overall item
    const shouldShowTimelineLine = !isLastAchievement || !isLastOverallItem;

    return (
      <View style={[styles.timelineItem, styles.achievementItem]} key={itemId}>
        {/* Timeline Line and Icon */}
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineIconContainer, styles.achievementIcon]}>
            <Image
              source={require('../assets/icons/achievement.png')}
              style={styles.timelineIcon}
            />
          </View>
          {shouldShowTimelineLine && <View style={styles.timelineLine} />}
        </View>

        {/* Content - Wrapped in Card */}
        <View style={styles.timelineContent}>
          <View style={styles.achievementCardContainer}>
            {/* Header with Title and Achievement Badge */}
            <View>
              {/* Achievement Badge */}
              <View style={styles.achievementBadgeContainer}>
                <View style={styles.badgeContent}>
                  <View
                    style={[
                      styles.verifiedBadge,
                      { backgroundColor: '#000000' },
                    ]}
                  >
                    <Text style={styles.badgeText}>Achievement</Text>
                  </View>
                  <View style={styles.badgeIconContainer}>
                    <Image
                      source={require('../assets/icons/achievement_badge.png')}
                      style={styles.badgeIcon}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, styles.achievementTitle]}>
                  {achievement.title}
                </Text>
              </View>

              {achievement.isCurrentlyWorking && (
                <Image
                  source={require('../assets/icons/tick.png')}
                  style={styles.checkedIcon}
                />
              )}
            </View>

            <View style={styles.headerActionsRow}>
              <View style={styles.dateContainer1}>
                <Image
                  source={require('../assets/icons/calendar.png')}
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>{achievement.dateRange}</Text>
              </View>
              {/* Render actions if defined, else skip */}
            </View>

            {/* Images */}
            {renderImages(achievement.mediaUrl)}

            {/* Description */}
            {description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.subtitle}>
                  {isExpanded
                    ? description
                    : shouldTruncate
                    ? truncateText(description)
                    : description}
                </Text>
                {shouldTruncate && (
                  <TouchableOpacity
                    onPress={() => toggleExpand(itemId)}
                    style={styles.seeMoreButton}
                  >
                    <Text style={styles.seeMore}>
                      {isExpanded ? ' ...see less' : ' ...see more'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              {/* Like Section - Two separate containers */}
              <View style={styles.likeSection}>
                {/* Like Icon Container */}
                <TouchableOpacity
                  style={styles.statIconContainer}
                  onPress={() =>
                    handleLikeUnlike(achievement.id as number, 'achievement')
                  }
                >
                  <Image
                    source={
                      achievement.isLiked
                        ? require('../assets/icons/like2.png')
                        : require('../assets/icons/like1.png')
                    }
                    style={styles.statIcon}
                  />
                </TouchableOpacity>

                {/* Like Count Container - Opens modal */}
                <TouchableOpacity
                  style={styles.statCountContainer}
                  onPress={() => {
                    handleStatsPress(achievement.id, 'achievement');
                    setLikesModalVisible(true);
                  }}
                >
                  <Text style={styles.statText}>
                    {achievement.stats.likesCount}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Comment Section - Single container */}
              <TouchableOpacity
                style={styles.commentContainer}
                onPress={() => {
                  handleStatsPress(achievement.id, 'achievement');
                  setIsAddingComment(true); // Always show input in modal
                  setCommentsModalVisible(true);
                }}
              >
                <Image
                  source={require('../assets/icons/comment.png')}
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  {achievement.stats.commentsCount} Comments
                </Text>
              </TouchableOpacity>
            </View>

            {/* Total Validations Badge */}
            <TouchableOpacity onPress={() => openValidationsModal(achievement)}>
              <View style={styles.badgeContent}>
                <View
                  style={
                    achievement?.validations?.length > 0
                      ? [styles.verifiedBadge, { width: '60%' }]
                      : [
                          styles.verifiedBadge,
                          { width: '60%', backgroundColor: '#7E7E7E' },
                        ]
                  }
                >
                  <Text style={styles.badgeText}>
                    {achievement.validations
                      ? achievement.validations.length
                      : 0}{' '}
                    Verifications
                  </Text>
                </View>
                <View style={styles.badgeIconContainer}>
                  <Image
                    source={
                      achievement?.validations?.length > 0
                        ? require('../assets/icons/verifiedShield.png')
                        : require('../assets/icons/no_verification_badge.png')
                    }
                    style={styles.badgeIcon}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Helper function to render images
  const renderImages = (mediaUrl: string | null) => {
    if (!mediaUrl) return null;

    // Split the mediaUrl by comma to handle multiple URLs
    const urls = mediaUrl
      .split(',')
      .map(url => url.trim())
      .filter(url => url !== '');

    return (
      <View style={styles.imagesContainer}>
        {urls.map((url, index) => (
          <Image
            key={index}
            source={{ uri: url }}
            style={styles.achievementImage}
            resizeMode="cover"
          />
        ))}
      </View>
    );
  };

  // Helper function to render verified section
  const renderVerifiedSection = (
    validations: Validation[],
    parentItem: Position | Achievement,
  ) => {
    if (!validations || validations.length === 0) return null;

    const MAX_VISIBLE_VALIDATIONS = 2;
    const visibleValidations = validations.slice(0, MAX_VISIBLE_VALIDATIONS);
    const hiddenValidations = validations.slice(MAX_VISIBLE_VALIDATIONS);

    const renderValidationCard = (validation: Validation) => {
      const validator = validation.validator;
      const validatorRef = validation.validatorReference;

      // Format the date range for the validator's position
      let validatorDateRange = '';
      if (validatorRef) {
        const startMonth = validatorRef.startMonth
          ? [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ][validatorRef.startMonth - 1]
          : '';
        const endMonth = validatorRef.endMonth
          ? [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ][validatorRef.endMonth - 1]
          : '';

        if (startMonth && validatorRef.startYear) {
          validatorDateRange = `${startMonth} ${validatorRef.startYear}`;
          if (endMonth && validatorRef.endYear) {
            validatorDateRange += ` - ${endMonth} ${validatorRef.endYear}`;
          } else {
            validatorDateRange += ' - Present';
          }
        }
      }

      return (
        <View key={validation.id} style={styles.verificationCard}>
          {/* HR Verification Status */}
          {validatorRef && validatorRef.hrVerified !== undefined && (
            <View style={styles.badgeContainer1}>
              <View style={styles.badgeContent}>
                {/* Text Badge */}
                <View
                  style={
                    validatorRef.hrVerified
                      ? styles.verifiedBadge
                      : styles.notVerifiedBadge
                  }
                >
                  <Text style={styles.badgeText}>
                    {validatorRef.hrVerified ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>

                {/* Image - positioned to overlap */}
                <View style={styles.badgeIconContainer}>
                  <Image
                    source={
                      validatorRef.hrVerified
                        ? require('../assets/icons/verifiedShield.png')
                        : require('../assets/icons/unverifiedShield.png')
                    }
                    style={styles.badgeIcon}
                  />
                </View>
              </View>
              <View style={styles.verifiedProfile}>
                {validator?.profilePicture ? (
                  <Image
                    source={{ uri: validator.profilePicture }}
                    style={styles.verifiedAvatar}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {validator?.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                )}
                <View style={styles.verifiedInfo}>
                  <Text style={styles.verifiedName}>{validator?.fullName}</Text>
                  {/* <Text style={styles.verifiedPosition}>
                                  {validator?.currentDesignation || 'Validator'}
                                </Text>
                                {validator?.credibilityScore !== undefined && (
                                  <Text style={styles.credibilityScore}>
                                    Credibility Score: {validator.credibilityScore}
                                  </Text>
                                )} */}
                </View>
              </View>
            </View>
          )}

          {/* Skills section - render as badges */}
          {validation.skills && validation.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {validation.skills.map((skill, skillIndex) => (
                <View key={skillIndex} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{skill.skillName}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Verified Company Info */}
          {validatorRef && validatorRef.company && (
            <View style={styles.verifiedCompanyInfo}>
              {/* <Text style={styles.verifiedLabel}>
                {validatorRef.isVerified ? 'Verified:' : 'Unverified:'}{' '}
              </Text> */}
              <Text style={styles.verifiedText}>
                {' '}
                Worked at {validatorRef.company.name} from {validatorDateRange}{' '}
              </Text>
              {/* <Image
                source={
                  validatorRef.company.logo 
                    ? { uri: validatorRef.company.logo } 
                    : require('../assets/icons/google.png')
                }
                style={styles.verifiedCompanyLogo}
              />
              <Text style={styles.verifiedCompanyName}>
                {validatorRef.company.name}
              </Text>
              {validatorDateRange && (
                <Text style={styles.verifiedCompanyDate}>
                  {' '}
                  from {validatorDateRange}
                </Text>
              )} */}
            </View>
          )}

          {/* Relationship and Recommendation */}
          <View style={styles.verifiedDetails}>
            <View style={styles.relationshipInfo}>
              <Text style={styles.relationshipText}>
                <Text style={styles.relationshipLabel}>Relationship: </Text>
                {validation.relationship}
              </Text>
            </View>

            {validation.recommendation && (
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationLabel}>Recommendation: </Text>
                <Text style={styles.recommendationText}>
                  {validation.recommendation}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    };

    return (
      <View style={styles.verifiedSection}>
        <View style={styles.verifiedTitleContainer}>
          <TouchableOpacity
            onPress={() => openValidationsModal(parentItem)}
            disabled={parentItem.type !== 'achievement'}
          >
            <Text style={styles.verifiedTitle}>
              Verified by {validations.length}{' '}
              {validations.length === 1 ? 'person' : 'people'}
            </Text>
          </TouchableOpacity>
          {hiddenValidations.length > 0 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setExpanded(!expanded)}
            >
              <View style={styles.showMoreContainer}>
                <Text style={styles.showMoreText}>
                  {expanded ? 'Show Less' : `+${hiddenValidations.length} more`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {visibleValidations.map(renderValidationCard)}

        {expanded && hiddenValidations.map(renderValidationCard)}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        {/* <Text style={styles.loadingText}>Loading timeline...</Text> */}
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            // Re-fetch data
            const loadTimelineData = async () => {
              try {
                const response = await fetchTimeLineByUserId(userId);
                if (response && response.data && response.data.timeline) {
                  setTimelineData(response.data.timeline);
                } else if (response && Array.isArray(response)) {
                  setTimelineData(response);
                } else if (
                  response &&
                  response.data &&
                  Array.isArray(response.data)
                ) {
                  setTimelineData(response.data);
                } else {
                  setError('Unexpected response format from server');
                }
              } catch (err) {
                setError('Failed to load timeline data');
              } finally {
                setLoading(false);
              }
            };
            loadTimelineData();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!timelineData || timelineData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No timeline data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {timelineData.map((timelineCompany, index) =>
          renderCompanyItem(timelineCompany, index),
        )}
        <LoadMoreButton />
      </ScrollView>
      {/* Likes and Comments Modals */}
      <LikesModal
        visible={likesModalVisible}
        onClose={() => setLikesModalVisible(false)}
        timelineId={currentItemId ? Number(currentItemId) : undefined}
        entityType={
          currentItemType === 'achievement' ? 'achievement' : 'position'
        }
      />
      <CommentsModal
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        isAddingComment={isAddingComment}
        timelineId={currentItemId ? Number(currentItemId) : undefined}
        entityType={
          currentItemType === 'achievement' ? 'achievement' : 'position'
        }
        onCommentAdded={() => {
          if (currentItemId !== null && currentItemType) {
            updateCommentCount(currentItemId, 1, currentItemType);
          }
        }}
      />

      <ValidationsListModal
        visible={isValidationsModalOpen}
        onClose={() => {
          setIsValidationsModalOpen(false);
          refreshTimeline();
        }}
        item={selectedEntity}
        readOnly={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingVertical: verticalScale(10),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(25),
    paddingHorizontal: moderateScale(15),
  },
  companyItem: {
    marginBottom: verticalScale(15),
  },
  roleItem: {
    marginLeft: moderateScale(25),
  },
  achievementItem: {
    marginLeft: moderateScale(1),
  },
  timelineLeft: {
    width: moderateScale(40),
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  timelineIconContainer: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(17.5),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 2,
  },
  companyIcon: {
    borderColor: '#4285F4',
    borderWidth: 2,
  },
  roleIcon: {
    // borderColor: '#34A853',
    // backgroundColor: '#34A853',
  },
  achievementIcon: {
    borderColor: '#FBBC05',
    backgroundColor: '#FFFFFF',
  },
  timelineIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#EBEBEB',
    marginTop: verticalScale(5),
    minHeight: verticalScale(20),
  },
  timelineContent: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  //  contentHeader1: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   marginBottom: verticalScale(8),
  //   marginTop: -verticalScale(20),
  // },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(-14),
  },
  companyText: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(22),
  },
  calendarIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    marginRight: moderateScale(6),
  },
  dateText: {
    fontSize: moderateScale(14),
    color: '#666666',
    fontWeight: '500',
    paddingTop: verticalScale(1),
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  companyTitle: {
    color: '#4285F4',
    fontSize: moderateScale(18),
  },
  roleTitle: {
    color: '#000000',
    fontSize: moderateScale(16),
  },
  achievementTitle: {
    color: '#22222',
    fontSize: moderateScale(14),
    width: '75%',
  },
  imagesContainer: {
    marginVertical: verticalScale(8),
  },
  achievementImage: {
    width: '100%',
    height: verticalScale(120),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: '#2A2A2A',
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(12),
  },
  seeMore: {
    color: '#4285F4',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(12),
    justifyContent: 'flex-start',
    gap: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
    minWidth: moderateScale(40),
    alignItems: 'center',
  },

  // Like Section - contains both icon and count in separate containers
  likeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(16), // Space between like and comment sections
  },

  // Individual stat icon container (for like icon)
  statIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
    // marginRight: moderateScale(4), // Small space between icon and count
  },

  // Like count container - opens modal
  statCountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },

  // Comment container - single container for both icon and count
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  addcommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
    marginLeft: moderateScale(14),
  },

  statIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(6), // Space between icon and text in comment container
  },

  statText: {
    fontSize: moderateScale(14),
    color: '#66666',
    fontWeight: '500',
  },
  verifiedSection: {
    backgroundColor: '#F8F9FA',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
    marginTop: verticalScale(8),
  },
  verifiedTitle: {
    fontSize: moderateScale(16),
    color: '#666666',
    marginBottom: verticalScale(12),
    fontWeight: '600',
  },
  verificationCard: {
    backgroundColor: '#E9EAEE',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  verifiedProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    position: 'relative',
    marginTop: verticalScale(8),
  },
  verifiedAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    position: 'absolute',
    left: moderateScale(8),
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    position: 'absolute',
    left: moderateScale(8),
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    textAlign: 'center',
    color: '#ffffff',
    backgroundColor: '#000000',
  },
  verifiedInfo: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(12),
    paddingLeft: moderateScale(32),
    marginLeft: moderateScale(20),
    backgroundColor: '#000000',
    borderRadius: moderateScale(12),
    alignSelf: 'flex-start',
  },
  verifiedName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#ffffff',
  },
  verifiedPosition: {
    fontSize: moderateScale(14),
    color: '#666666',
    marginBottom: verticalScale(2),
  },
  credibilityScore: {
    fontSize: moderateScale(12),
    color: '#34A853',
    fontWeight: '600',
  },
  verifiedCompanyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: moderateScale(8),
  },
  verifiedLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000000',
  },
  verifiedText: {
    fontSize: moderateScale(16),
    color: '#000000',
  },
  verifiedCompanyLogo: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(4),
  },
  verifiedCompanyName: {
    fontSize: moderateScale(14),
    color: '#000000',
  },
  verifiedCompanyDate: {
    fontSize: moderateScale(13),
    color: '#000000',
  },
  verifiedDetails: {
    paddingTop: verticalScale(8),
    paddingHorizontal: moderateScale(8),
  },
  relationshipInfo: {
    marginBottom: verticalScale(8),
  },
  relationshipText: {
    fontSize: moderateScale(14),
    color: '#000000',
    lineHeight: moderateScale(20),
  },
  relationshipLabel: {
    fontWeight: '600',
    color: '#000000',
  },
  recommendationInfo: {
    // marginTop: verticalScale(4),
  },
  recommendationLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000000',
    marginBottom: verticalScale(4),
  },
  recommendationText: {
    fontSize: moderateScale(14),
    color: '#000000',
    lineHeight: moderateScale(20),
  },
  googleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  googleIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(6),
  },
  googleText: {
    fontSize: moderateScale(12),
    color: '#000000',
    fontWeight: '600',
  },
  googleDates: {
    fontSize: moderateScale(11),
    color: '#66666',
    marginBottom: verticalScale(8),
  },
  relationshipIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    marginRight: moderateScale(6),
    marginTop: verticalScale(1),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#66666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF000',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  loadingMoreText: {
    color: '#000000',
    fontSize: verticalScale(14),
    fontWeight: '500',
    marginLeft: verticalScale(8),
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
  verificationItem: {
    marginBottom: verticalScale(16),
  },
  verificationSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: verticalScale(12),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(8),
  },
  pendingBadge: {
    backgroundColor: '#FFF3CD',
  },
  rejectedBadge: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#000000',
  },
  validationMeta: {
    marginTop: verticalScale(8),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  validationDate: {
    fontSize: moderateScale(12),
    color: '#999999',
    fontStyle: 'italic',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: verticalScale(8),
  },
  // Achievement Card Styles
  achievementCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: verticalScale(10),
  },
  headerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  dateContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow it to take available space
    flexShrink: 1, // Allow shrinking if needed
    marginTop: -verticalScale(18),
  },
  checkedIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginLeft: moderateScale(8),
  },
  achievementBadgeContainer: {
    width: '60%',
    marginLeft: -moderateScale(10),
    marginBottom: verticalScale(8),
  },
  descriptionContainer: {
    // marginBottom: verticalScale(12),
  },
  seeMoreButton: {
    alignSelf: 'flex-start',
    // marginTop: verticalScale(4),
  },
  skillBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(14),
  },
  skillBadgeText: {
    fontSize: moderateScale(12),
    color: '#ffffff',
  },
  verifiedTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  showMoreButton: {
    marginTop: verticalScale(8),
    alignItems: 'center',
  },
  showMoreContainer: {
    backgroundColor: '#67C40C',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
  },
  showMoreText: {
    fontSize: moderateScale(14),
    color: '#ffffff',
    fontWeight: '500',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  currentlyWorkingTag: {
    backgroundColor: '#E9EAEE',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(8),
  },
  currentlyWorkingText: {
    fontSize: moderateScale(12),
    color: '#000000',
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  badgeContainer1: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // marginBottom: verticalScale(8),
    marginLeft: -moderateScale(20),
  },
  badgeContent: {
    position: 'relative',
  },
  badgeIconContainer: {
    position: 'absolute',
    top: -verticalScale(0.5),
    left: moderateScale(12),
    zIndex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#57B915',
    paddingHorizontal: moderateScale(12),
    paddingLeft: moderateScale(30),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(20),
  },
  notVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0031',
    paddingHorizontal: moderateScale(12),
    paddingLeft: moderateScale(30),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(20),
  },
  badgeIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
  },
  badgeText: {
    fontSize: moderateScale(12),
    color: '#ffffff',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // gap: moderateScale(6),
    marginBottom: verticalScale(18),
    marginTop: verticalScale(-20),
    marginLeft: -moderateScale(8),
  },
});

export default ProfileTimelineView;
