import React, { useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  fetchHobbiesByUserId,
  addHobbyLikeUnlike,
  addEducationLikesUnlike,
  toggleLikeSectionAchievement,
} from '../api/service';
import { useState, useEffect } from 'react';
import CommentsModal from './CommentsModal';
import LikesModal from './LikesModal';
import ValidationsListModal from './modal/ValidationsListModal';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (size * factor - size) * factor;

interface Stats {
  likesCount: number;
  commentsCount: number;
  topLevelCommentsCount: number;
}

interface Validator {
  id: number;
  fullName: string;
  profilePicture: string | null;
  currentDesignation: string | null;
  credibilityScore: number;
}

interface Validation {
  id: number;
  status: string;
  relationship: string;
  recommendation: string;
  validatedAt: string;
  validator: Validator;
}

interface Achievement {
  id: number;
  userId: number;
  achievementType: string;
  referenceId: number;
  title: string;
  description: string;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrentlyActive: boolean;
  status: boolean;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  verificationCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  mediaUrls: string | null;
  validations: Validation[];
  stats: Stats;
  isLiked: boolean;
  type?: string;
  dateRange?: string;
}

interface HobbyEntry {
  id: number;
  userId: number;
  hobbyId: number;
  title: string;
  skillLevel: string;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isHobbyActive: boolean;
  location: string;
  description: string;
  mediaUrl: string | null;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  verificationCount: number;
  createdAt: string;
  updatedAt: string;
  hobby: {
    id: number;
    name: string;
    image: string;
  };
  user: {
    id: number;
    fullName: string;
    profilePicture: string;
    headline: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  validations: any[];
  achievements: Achievement[];
}

interface HobbyGroup {
  id: number;
  name: string;
  image: string;
  stats: {
    totalEntries: number;
    totalLikes: number;
    totalComments: number;
  };
  entries: HobbyEntry[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalGroups: number;
  totalEntries: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ProfileHobbyView = ({ userId }: { userId?: number }) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const targetUserId = userId || route.params?.userId;
  const [hobbyGroups, setHobbyGroups] = useState<HobbyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: number]: boolean;
  }>({});
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalGroups: 0,
    totalEntries: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [currentItemType, setCurrentItemType] = useState<
    'hobby' | 'achievement' | null
  >(null);
  const [expandedValidations, setExpandedValidations] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedEntity, setSelectedEntity] = useState<
    HobbyEntry | Achievement | null
  >(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);

  // Function to update comment count in local state when a comment is added
  const updateCommentCount = useCallback(
    (itemId: number, increment: number, type: string = 'hobby') => {
      setHobbyGroups(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          entries: group.entries.map(entry => {
            if (type === 'hobby' && entry.id === itemId) {
              return {
                ...entry,
                commentsCount: entry.commentsCount + increment,
              };
            }
            if (
              type === 'achievement' &&
              entry.achievements &&
              entry.achievements.length > 0
            ) {
              const updatedAchievements = entry.achievements.map(ach => {
                if (Number(ach.id) === Number(itemId)) {
                  return {
                    ...ach,
                    stats: {
                      ...ach.stats,
                      commentsCount:
                        (ach.stats?.commentsCount || 0) + increment,
                      topLevelCommentsCount:
                        (ach.stats?.topLevelCommentsCount || 0) + increment,
                    },
                  };
                }
                return ach;
              });

              // Check if any achievement was actually updated
              const isAchievementUpdated = entry.achievements.some(
                ach => Number(ach.id) === Number(itemId),
              );

              if (isAchievementUpdated) {
                return { ...entry, achievements: updatedAchievements };
              }
            }
            return entry;
          }),
        }));
      });
    },
    [],
  );

  const fetchHobbies = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log('Fetching hobbies for userId:', targetUserId);
      if (!targetUserId) return;
      const response = await fetchHobbiesByUserId(targetUserId);
      console.log(
        'Fetch Hobbies Response:',
        JSON.stringify(response.data, null, 2),
      );
      if (response.data && response.data.data && response.data.data.hobbies) {
        if (page === 1) {
          setHobbyGroups(response.data.data.hobbies);
        } else {
          setHobbyGroups(prev => [...prev, ...response.data.data.hobbies]);
        }

        // Update pagination if available in response
        if (response.data.data.pagination) {
          setPagination(response.data.data.pagination);
        }
      } else {
        console.log('Invalid response structure:', response.data);
      }
    } catch (error) {
      console.error('Error fetching hobbies:', error);
    } finally {
      if (loadingMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMoreHobbies = async () => {
    if (pagination.hasNext && !loadingMore) {
      const nextPage = pagination.currentPage + 1;
      await fetchHobbies(nextPage);
    }
  };

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
          onPress={loadMoreHobbies}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    console.log('ProfileHobbyView mounted with targetUserId:', targetUserId);
    if (targetUserId) {
      fetchHobbies();
    } else {
      console.log('No targetUserId provided to ProfileHobbyView');
    }
  }, [targetUserId]);

  const handleLike = async (id: number, type: string = 'hobby') => {
    try {
      // Optimistically update the UI before making the API call
      setHobbyGroups(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          entries: group.entries.map(entry => {
            if (type === 'hobby' && entry.id === id) {
              const newIsLiked = !entry.isLiked;
              const newLikesCount = newIsLiked
                ? entry.likesCount + 1
                : entry.likesCount - 1;
              return {
                ...entry,
                isLiked: newIsLiked,
                likesCount: newLikesCount,
              };
            }
            if (entry.achievements) {
              const updatedAchievements = entry.achievements.map(ach => {
                if (type === 'achievement' && ach.id === id) {
                  const newIsLiked = !ach.isLiked;
                  return {
                    ...ach,
                    isLiked: newIsLiked,
                    stats: {
                      ...ach.stats,
                      likesCount: newIsLiked
                        ? (ach.stats?.likesCount || 0) + 1
                        : (ach.stats?.likesCount || 0) - 1,
                    },
                  };
                }
                return ach;
              });
              return { ...entry, achievements: updatedAchievements };
            }
            return entry;
          }),
        }));
      });

      // Make the API call to update the like status on the server
      if (type === 'hobby') {
        await addHobbyLikeUnlike(id);
      } else if (type === 'achievement') {
        const response = await toggleLikeSectionAchievement(id);
        console.log('Achievement like response:', response.data);
      }
    } catch (error) {
      console.error('Error liking hobby:', error);
      fetchHobbies();
    }
  };

  const handleStatsPress = (
    id: number,
    type: 'hobby' | 'achievement' = 'hobby',
  ) => {
    setCurrentItemId(id);
    setCurrentItemType(type);
  };

  const toggleDescription = (id: number) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderVerifiedSection = (
    validations: Validation[],
    parentItem: HobbyEntry | Achievement,
  ) => {
    if (!validations || validations?.length === 0) return null;

    const sectionKey = validations[0]?.id
      ? `validation-${validations[0].id}`
      : 'validation-section';

    const MAX_VISIBLE_VALIDATIONS = 2;
    const visibleValidations = validations.slice(0, MAX_VISIBLE_VALIDATIONS);
    const hiddenValidations = validations.slice(MAX_VISIBLE_VALIDATIONS);

    const renderValidationCard = (validation: Validation) => {
      const validator = validation?.validator;

      return (
        <View key={validation?.id} style={styles.verificationCard}>
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
            </View>
          </View>

          <View style={styles.verifiedDetails}>
            {validation?.relationship && (
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationLabel}>Relationship: </Text>
                <Text style={styles.recommendationText}>
                  {validation?.relationship}
                </Text>
              </View>
            )}
            {validation?.recommendation && (
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationLabel}>Recommendation: </Text>
                <Text style={styles.recommendationText}>
                  {validation?.recommendation}
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
          <Text style={styles.verifiedTitle}>
            Verified by {validations.length}{' '}
            {validations?.length === 1 ? 'person' : 'people'}
          </Text>
          <View style={styles.verifiedControlsRow}>
            {hiddenValidations.length > 0 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() =>
                  setExpandedValidations(prev => ({
                    ...prev,
                    [sectionKey]: !prev[sectionKey],
                  }))
                }
              >
                <View style={styles.showMoreContainer}>
                  <Text style={styles.showMoreText}>
                    {expandedValidations[sectionKey]
                      ? 'Show Less'
                      : `+${hiddenValidations.length} more`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {visibleValidations.map(renderValidationCard)}
        {expandedValidations[sectionKey] &&
          hiddenValidations.map(renderValidationCard)}
      </View>
    );
  };

  const renderEntryImages = (mediaUrl: string | null) => {
    if (!mediaUrl) return null;
    const urls = mediaUrl
      .split(',')
      .map(url => url.trim())
      .filter(url => url !== '');
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {urls.map((url, index) => (
          <Image
            key={index}
            source={{ uri: url }}
            style={{
              width: moderateScale(100),
              height: moderateScale(100),
              marginRight: moderateScale(8),
              marginBottom: moderateScale(8),
              borderRadius: moderateScale(8),
            }}
          />
        ))}
      </View>
    );
  };

  const formatDateRange = (item: any) => {
    const monthNames = [
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
    ];
    const getMonthName = (month: number) => monthNames[month - 1] || '';

    const start = `${getMonthName(item.startMonth)} ${item.startYear}`;
    const end = item.isCurrentlyActive
      ? 'Present'
      : item.endMonth && item.endYear
      ? `${getMonthName(item.endMonth)} ${item.endYear}`
      : 'Present';
    return `${start} - ${end}`;
  };

  const renderEntry = (
    entry: HobbyEntry | Achievement,
    isAchievement = false,
  ) => {
    const isExpanded = expandedDescriptions[entry.id] || false;
    let displayDescription = entry.description;
    let showSeeMore = false;
    const descriptionLength = entry.description ? entry.description.length : 0;

    if (descriptionLength > 100 && !isExpanded) {
      displayDescription = entry.description.substring(0, 100) + '...';
      showSeeMore = true;
    }

    if (isExpanded) {
      displayDescription = entry.description;
    }

    if (isAchievement) {
      const achievement = entry as Achievement;
      return (
        <View
          style={[styles.timelineItem, { paddingHorizontal: 0 }]}
          key={entry.id}
        >
          <View style={styles.timelineLeft1}>
            <View
              style={[styles.timelineIconContainer, styles.achievementIcon]}
            >
              <Image
                source={require('../assets/icons/achievement.png')}
                style={styles.achievementIcon1}
              />
            </View>
          </View>

          <View style={styles.timelineContent}>
            <View style={styles.achievementCardContainer}>
              <View style={styles.achievementCardHeader}>
                <View style={styles.titleContainer}>
                  <View style={styles.achievementBadgeContainer}>
                    <View style={styles.badgeContent}>
                      <View
                        style={[
                          styles.verifiedBadgeLabel,
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
                  <Text style={styles.achievementTitle}>
                    {achievement.title}
                  </Text>
                </View>
              </View>

              <View style={styles.dateContainer1}>
                <Image
                  source={require('../assets/icons/calendar.png')}
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>
                  {formatDateRange(achievement)}
                </Text>
              </View>

              {renderEntryImages(achievement.mediaUrls)}

              {achievement.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.subtitle1}>
                    {displayDescription}
                    {showSeeMore && (
                      <TouchableOpacity
                        onPress={() => toggleDescription(entry.id)}
                      >
                        <Text style={styles.seeMore}> see more</Text>
                      </TouchableOpacity>
                    )}
                    {isExpanded && descriptionLength > 100 && (
                      <TouchableOpacity
                        onPress={() => toggleDescription(entry.id)}
                      >
                        <Text style={styles.seeMore}> see less</Text>
                      </TouchableOpacity>
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.statsContainerAchievement}>
                <View style={styles.likeSection}>
                  <TouchableOpacity
                    style={styles.statIconContainer}
                    onPress={() => handleLike(achievement.id, 'achievement')}
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
                  <TouchableOpacity
                    style={styles.statCountContainer}
                    onPress={() => {
                      handleStatsPress(achievement.id, 'achievement');
                      setLikesModalVisible(true);
                    }}
                  >
                    <Text style={styles.statText}>
                      {achievement.stats?.likesCount || 0}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.commentContainer1}
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
                    {achievement.stats?.commentsCount || 0} Comments
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setSelectedEntity(achievement);
                  setIsReadOnly(true);
                  setIsValidationsModalOpen(true);
                }}
              >
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
    }
    return null;
  };

  const renderHobbyEntry = (entry: HobbyEntry) => {
    // Define month abbreviations for formatting
    const monthAbbreviations = [
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
    ];

    // Format start date with month abbreviation
    const startMonthAbbr = monthAbbreviations[entry.startMonth - 1] || '';
    let dateRange = `${startMonthAbbr} ${entry.startYear}`;

    if (entry.isHobbyActive) {
      dateRange += ' - Present';
    } else if (entry.endMonth && entry.endYear) {
      const endMonthAbbr = monthAbbreviations[entry.endMonth - 1] || '';
      dateRange += ` - ${endMonthAbbr} ${entry.endYear}`;
    } else {
      dateRange += ' - Present';
    }

    const images = entry.mediaUrl
      ? entry.mediaUrl.split(',').map((url: string) => ({ uri: url.trim() }))
      : [];

    // Truncate description if it's too long and not expanded
    const isExpanded = expandedDescriptions[entry.id] || false;
    let displayDescription = entry.description;
    let showSeeMore = false;

    // Check if description exists and is long enough to truncate
    const descriptionLength = entry.description ? entry.description.length : 0;

    // Only show "see more" if description is longer than 100 characters
    if (descriptionLength > 100 && !isExpanded) {
      displayDescription = entry.description.substring(0, 100) + '...';
      showSeeMore = true;
    }

    // Always show full description if expanded
    if (isExpanded) {
      displayDescription = entry.description;
    }

    return (
      <View style={styles.timelineItem} key={entry.id}>
        {/* Timeline Line and Icon */}
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineIconContainer, styles.hobbyIconBg]}>
            <Image
              source={
                entry.hobby.image
                  ? { uri: entry.hobby.image }
                  : require('../assets/icons/timeline.png')
              }
              style={styles.timelineIcon}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.timelineContent}>
          {/* Header with Date and Action Buttons */}
          <View style={styles.contentHeader}>
            {/* Title */}
            <Text style={[styles.title, styles.hobbyTitle]}>{entry.title}</Text>
          </View>

          <View style={styles.dateContainer}>
            <Image
              source={require('../assets/icons/calendar.png')}
              style={styles.calendarIcon}
            />
            <Text style={styles.dateText}>{dateRange}</Text>
          </View>

          {/* Images for achievements - NOW FULL WIDTH */}
          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <Image
                  key={index}
                  source={image}
                  style={styles.achievementImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* Description - NOW BELOW IMAGES */}
          {entry.description && (
            <Text style={styles.subtitle}>
              {displayDescription}
              {showSeeMore && (
                <TouchableOpacity onPress={() => toggleDescription(entry.id)}>
                  <Text style={styles.seeMore}> see more</Text>
                </TouchableOpacity>
              )}
              {isExpanded && descriptionLength > 100 && (
                <TouchableOpacity onPress={() => toggleDescription(entry.id)}>
                  <Text style={styles.seeMore}> see less</Text>
                </TouchableOpacity>
              )}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.likeSection}>
              <TouchableOpacity
                style={styles.statIconContainer}
                onPress={() => {
                  handleStatsPress(Number(entry.id));
                  handleLike(Number(entry.id));
                }}
              >
                <Image
                  source={
                    entry.isLiked
                      ? require('../assets/icons/like2.png')
                      : require('../assets/icons/like1.png')
                  }
                  style={styles.statIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCountContainer}
                onPress={() => {
                  handleStatsPress(Number(entry.id));
                  setLikesModalVisible(true);
                }}
              >
                <Text style={styles.statText}>{entry.likesCount}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.commentContainer}
              onPress={() => {
                handleStatsPress(Number(entry.id));
                setIsAddingComment(true); // Always show input in modal
                setCommentsModalVisible(true);
              }}
            >
              <Image
                source={require('../assets/icons/comment.png')}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>
                {entry.commentsCount} Comments
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verified Section */}
          {entry?.validations &&
            entry?.validations?.length > 0 &&
            renderVerifiedSection(entry?.validations, entry)}

          {/* Achievements Cards */}
          {entry.achievements && entry.achievements.length > 0 && (
            <View style={styles.groupedAchievementContainer}>
              {entry.achievements.map(achievement =>
                renderEntry(achievement, true),
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHobbyGroup = (group: HobbyGroup, index: number) => {
    return (
      <View key={index} style={styles.groupContainer}>
        {/* Hobby Header */}
        <View style={[styles.timelineItem, styles.hobbyHeaderItem]}>
          <View style={styles.timelineLeft}>
            <View style={[styles.timelineIconContainer, styles.hobbyIcon]}>
              <Image
                source={
                  group.image
                    ? { uri: group.image }
                    : require('../assets/icons/timeline.png')
                }
                style={styles.timelineIcon}
              />
            </View>
            <View style={styles.timelineLine} />
          </View>
          <View style={styles.timelineContent}>
            <View style={styles.contentHeader}>
              <Text style={styles.hobbyName}>{group.name}</Text>
            </View>
          </View>
        </View>

        {/* Entries with indentation */}
        <View style={styles.groupedEntriesContainer}>
          {group.entries.map(entry => (
            <View key={entry.id} style={styles.groupedEntry}>
              {renderHobbyEntry(entry)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {hobbyGroups.map((group, groupIndex) =>
          renderHobbyGroup(group, groupIndex),
        )}
        <LoadMoreButton />
        {hobbyGroups.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
            No hobby data found.
          </Text>
        )}
      </ScrollView>
      <CommentsModal
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        isAddingComment={isAddingComment}
        hobbyId={
          currentItemType === 'hobby' ? currentItemId || undefined : undefined
        }
        achievementId={
          currentItemType === 'achievement'
            ? currentItemId || undefined
            : undefined
        }
        entityType={currentItemType === 'achievement' ? 'achievement' : 'hobby'}
        onCommentAdded={() => {
          if (currentItemId !== null) {
            updateCommentCount(currentItemId, 1, currentItemType || 'hobby');
          }
        }}
      />
      <LikesModal
        visible={likesModalVisible}
        onClose={() => setLikesModalVisible(false)}
        hobbyId={
          currentItemType === 'hobby' ? currentItemId || undefined : undefined
        }
        achievementId={
          currentItemType === 'achievement'
            ? currentItemId || undefined
            : undefined
        }
        entityType={currentItemType === 'achievement' ? 'achievement' : 'hobby'}
      />
      <ValidationsListModal
        visible={isValidationsModalOpen}
        onClose={() => {
          setIsValidationsModalOpen(false);
          fetchHobbies(1);
        }}
        item={selectedEntity as any}
        readOnly={isReadOnly}
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
  groupContainer: {
    marginBottom: verticalScale(10),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(15),
    paddingHorizontal: moderateScale(15),
  },
  hobbyHeaderItem: {
    marginBottom: verticalScale(10),
  },
  timelineLeft: {
    width: moderateScale(40),
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  timelineIconContainer: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(27.5),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 2,
    marginHorizontal: moderateScale(10),
  },
  hobbyIcon: {
    borderColor: '#34A853',
    borderWidth: 2,
  },
  hobbyIconBg: {
    borderColor: '#34A853',
    borderWidth: 2,
  },
  timelineIcon: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(24),
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
  groupedEntriesContainer: {
    marginLeft: moderateScale(20), // Add indentation for all entries in the group
  },
  groupedEntry: {
    // Additional styling for individual entries within the group if needed
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: verticalScale(8),
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  calendarIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(6),
  },
  dateText: {
    fontSize: moderateScale(14),
    color: '#66666',
    fontWeight: '500',
  },
  hobbyName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
    marginTop: verticalScale(6),
  },
  title: {
    fontSize: moderateScale(17),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  hobbyTitle: {
    color: '#000000',
  },
  subtitle: {
    fontSize: moderateScale(15),
    color: '#000000',
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(4),
  },
  seeMore: {
    color: '#4285F4',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: moderateScale(10),
    marginTop: verticalScale(12),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(15),
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
  },
  statIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    marginRight: moderateScale(4),
  },
  statText: {
    color: '#66666',
  },
  likeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  statIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  statCountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
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
  verifiedSection: {
    backgroundColor: '#F8F9FA',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
    marginTop: verticalScale(8),
  },
  verifiedTitle: {
    fontSize: moderateScale(12),
    color: '#000000',
    marginBottom: verticalScale(8),
  },
  verifiedProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    position: 'relative',
    // marginTop: verticalScale(8),
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
    paddingVertical: verticalScale(4),
    paddingHorizontal: moderateScale(20),
    paddingLeft: moderateScale(32),
    marginLeft: moderateScale(20),
    backgroundColor: '#000000',
    borderRadius: moderateScale(12),
    alignSelf: 'flex-start',
    marginTop: verticalScale(2),
  },
  verifiedName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#ffffff',
  },
  verifiedDetails: {
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  verifiedPosition: {
    fontSize: moderateScale(12),
    color: '#000000',
  },
  credibilityScore: {
    fontSize: moderateScale(12),
    color: '#34A853',
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
    color: '#0000',
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
  verifiedTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  verifiedControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showMoreButton: {
    marginLeft: moderateScale(8),
  },
  showMoreContainer: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  showMoreText: {
    fontSize: moderateScale(12),
    color: '#1967D2',
    fontWeight: '600',
  },
  timelineLeft1: {
    width: moderateScale(40),
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  achievementCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: verticalScale(10),
  },
  achievementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  titleContainer: {
    flex: 1,
  },
  achievementBadgeContainer: {
    width: '70%',
    marginLeft: -moderateScale(10),
    marginBottom: verticalScale(8),
  },
  badgeContent: {
    position: 'relative',
  },
  verifiedBadgeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingLeft: moderateScale(30),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(20),
  },
  badgeText: {
    fontSize: moderateScale(12),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badgeIconContainer: {
    position: 'absolute',
    top: -verticalScale(0.5),
    left: moderateScale(12),
    zIndex: 1,
  },
  badgeIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
  },
  achievementTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000000',
    marginTop: verticalScale(4),
  },
  achievementIcon: {
    borderColor: '#FBBC05',
    borderWidth: 2,
    zIndex: 2,
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  achievementIcon1: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: '#000',
  },
  dateContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  descriptionContainer: {
    marginBottom: verticalScale(8),
  },
  subtitle1: {
    fontSize: moderateScale(14),
    color: '#333333',
    lineHeight: moderateScale(20),
  },
  statsContainerAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: moderateScale(10),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  commentContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
  },
  addcommentContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6),
    marginLeft: moderateScale(14),
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
  groupedAchievementContainer: {
    marginTop: verticalScale(10),
  },
  imagesContainer: {
    marginVertical: verticalScale(8),
  },
  achievementImage: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    backgroundColor: '#f0f0',
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
    color: '#0000',
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
});

export default ProfileHobbyView;
