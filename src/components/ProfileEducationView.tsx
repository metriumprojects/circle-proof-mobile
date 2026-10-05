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
import { getEducationDataById, addEducationLikesUnlike } from '../api/service';
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

interface School {
  id: number;
  name: string;
  logo: string;
  type: string;
  location: string;
  website: string;
}

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
  educationId: number;
  validatorUserId: number;
  validatorPositionId: number;
  validationRequestId: number;
  educationVersion: number;
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
  sourceId: number;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  mediaUrl: string | null;
  achievementType: string;
  dateRange: string;
  school: School;
  stats: Stats;
  isLiked: boolean;
  canEdit: boolean;
  validationStatus: 'verified' | 'pending' | 'rejected';
  validationScore: number;
  validations: Validation[];
}

interface EducationEntry {
  id: number;
  sourceId: number;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  mediaUrl: string | null;
  achievementType: string | null;
  dateRange: string;
  school: School;
  stats: Stats;
  isLiked: boolean;
  canEdit: boolean;
  achievements: Achievement[];
  validationStatus: 'verified' | 'pending' | 'rejected';
  validationScore: number;
  validations: Validation[];
}

interface EducationGroup {
  school: School;
  educationEntries: EducationEntry[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ProfileEducationViewProps {
  userId?: number;
}

const ProfileEducationView: React.FC<ProfileEducationViewProps> = ({
  userId,
}) => {
  const navigation = useNavigation<any>();
  const [educationGroups, setEducationGroups] = useState<EducationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [currentItemType, setCurrentItemType] = useState<
    'education' | 'achievement' | null
  >(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: number]: boolean;
  }>({});
  const [expandedValidations, setExpandedValidations] = useState<{
    [key: string]: boolean;
  }>({});
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const openValidationsModal = (item: any) => {
    // Only open for achievements if requested "achievement only"
    // Check if item has type 'achievement' or isAchievement flag
    if (item.type === 'achievement' || item.achievementType) {
      setSelectedEntity(item);
      setIsValidationsModalOpen(true);
    }
  };

  const handleStatsPress = (id: number, type: 'education' | 'achievement') => {
    setCurrentItemId(id);
    setCurrentItemType(type);
  };

  // Function to update comment count in local state when a comment is added
  const updateCommentCount = useCallback(
    (itemId: number, increment: number, type: string = 'education') => {
      setEducationGroups(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          educationEntries: group.educationEntries.map(entry => {
            if (type === 'education' && entry.id === itemId) {
              return {
                ...entry,
                stats: {
                  ...entry.stats,
                  commentsCount: entry.stats.commentsCount + increment,
                  topLevelCommentsCount:
                    entry.stats.topLevelCommentsCount + increment,
                },
              };
            }
            // Also check achievements within the entry
            if (
              type === 'achievement' &&
              entry.achievements &&
              entry.achievements.length > 0
            ) {
              const updatedAchievements = entry.achievements.map(
                achievement => {
                  if (Number(achievement.id) === Number(itemId)) {
                    return {
                      ...achievement,
                      stats: {
                        ...achievement.stats,
                        commentsCount:
                          achievement.stats.commentsCount + increment,
                        topLevelCommentsCount:
                          achievement.stats.topLevelCommentsCount + increment,
                      },
                    };
                  }
                  return achievement;
                },
              );

              // Check if any achievement was actually updated
              const isAchievementUpdated = entry.achievements.some(
                ach => Number(ach.id) === Number(itemId),
              );

              if (isAchievementUpdated) {
                return {
                  ...entry,
                  achievements: updatedAchievements,
                };
              }
            }
            return entry;
          }),
        }));
      });
    },
    [],
  );

  const fetchEducation = async (page: number = 1) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getEducationDataById(userId);
      if (response.data && response.data.data && response.data.data.education) {
        if (page === 1) {
          setEducationGroups(response.data.data.education);
        } else {
          setEducationGroups(prev => [
            ...prev,
            ...response.data.data.education,
          ]);
        }

        // Update pagination if available in response
        if (response.data.data.pagination) {
          setPagination(response.data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching education data:', error);
    } finally {
      if (loadingMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMoreEducation = async () => {
    if (pagination.hasNext && !loadingMore) {
      const nextPage = pagination.currentPage + 1;
      await fetchEducation(nextPage);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, [userId]);

  const handleLike = async (id: number, type: string) => {
    try {
      // Find the current item to get its current state
      let currentItem: EducationEntry | Achievement | null = null;
      let currentIsLiked = false;
      let currentLikesCount = 0;

      // Search for the item in the current education data
      for (const group of educationGroups) {
        for (const entry of group.educationEntries) {
          if (entry.id === id && entry.type === type) {
            currentItem = entry;
            currentIsLiked = entry.isLiked;
            currentLikesCount = entry.stats.likesCount || 0;
            break;
          }
          // Check achievements within this entry
          for (const achievement of entry.achievements) {
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
      setEducationGroups(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          educationEntries: group.educationEntries.map(entry => {
            // Check if this is the entry being liked/unliked
            if (entry.id === id && entry.type === type) {
              return {
                ...entry,
                isLiked: newIsLiked,
                stats: {
                  ...entry.stats,
                  likesCount: newLikesCount,
                },
              };
            }

            // Check achievements within this entry
            const updatedAchievements = entry.achievements.map(ach => {
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
              ...entry,
              achievements: updatedAchievements,
            };
          }),
        }));
      });

      // Make API call in background
      const response = await addEducationLikesUnlike(id, type);
      if (response.data.success) {
        const serverIsLiked = response.data.data.action === 'liked';
        const serverLikesCount = response.data.data.likesCount;

        // If server response differs from our optimistic update, update with server data
        if (
          serverIsLiked !== newIsLiked ||
          serverLikesCount !== newLikesCount
        ) {
          setEducationGroups(prevGroups => {
            return prevGroups.map(group => ({
              ...group,
              educationEntries: group.educationEntries.map(entry => {
                if (entry.id === id && entry.type === type) {
                  return {
                    ...entry,
                    isLiked: serverIsLiked,
                    stats: {
                      ...entry.stats,
                      likesCount: serverLikesCount || newLikesCount,
                    },
                  };
                }

                const updatedAchievements = entry.achievements.map(ach => {
                  if (ach.id === id && ach.type === type) {
                    return {
                      ...ach,
                      isLiked: serverIsLiked,
                      stats: {
                        ...ach.stats,
                        likesCount: serverLikesCount || newLikesCount,
                      },
                    };
                  }
                  return ach;
                });

                return {
                  ...entry,
                  achievements: updatedAchievements,
                };
              }),
            }));
          });
        }
      }
    } catch (error) {
      console.error('Error liking education item:', error);
      // If API fails, revert to original state by refetching data
      fetchEducation();
    }
  };

  const renderImages = (mediaUrl: string | null) => {
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
              width: 100,
              height: 100,
              marginRight: 8,
              marginBottom: 8,
              borderRadius: 8,
            }}
          />
        ))}
      </View>
    );
  };

  const toggleDescription = (id: number) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper function to render verified section
  const renderVerifiedSection = (
    validations: Validation[],
    parentItem: EducationEntry | Achievement,
  ) => {
    if (!validations || validations.length === 0) return null;

    // For each validation section, we need to maintain its own expanded state
    // We'll use a unique key based on the first validation ID to track expansion state
    const sectionKey = validations[0]?.id
      ? `validation-${validations[0].id}`
      : 'validation-section';

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
        <View key={validation?.id} style={styles.verificationCard}>
          {/* Registrar Verification Status */}
          {validatorRef && validatorRef.registrarVerified !== undefined && (
            <View style={styles.badgeContainer1}>
              <View style={styles.badgeContent}>
                {/* Text Badge */}
                <View
                  style={
                    validatorRef.registrarVerified
                      ? styles.verifiedBadge
                      : styles.notVerifiedBadge
                  }
                >
                  <Text style={styles.badgeText}>
                    {validatorRef.registrarVerified
                      ? 'Verified'
                      : 'Not Verified'}
                  </Text>
                </View>

                {/* Image - positioned to overlap */}
                <View style={styles.badgeIconContainer}>
                  <Image
                    source={
                      validatorRef.registrarVerified
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
                  </Text> */}
                  {/* {validator?.credibilityScore !== undefined && (
                    <Text style={styles.credibilityScore}>
                      Credibility Score: {validator?.credibilityScore}
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

          {/* Validator Profile */}

          {/* Verified Company Info */}
          {validatorRef && validatorRef?.school && (
            <View style={styles.verifiedCompanyInfo}>
              {/* <Text style={styles.verifiedLabel}>
                {validatorRef?.isVerified ? 'Verified:' : 'Unverified:'}{' '}
              </Text> */}
              <Text style={styles.verifiedText}>
                {' '}
                Studied at {validatorRef?.school?.name} from{' '}
                {validatorDateRange}{' '}
              </Text>
              {/* <Image
                source={
                  validatorRef?.school?.logo
                    ? { uri: validatorRef?.school?.logo }
                    : require('../assets/icons/google.png')
                }
                style={styles.verifiedCompanyLogo}
              />
              <Text style={styles.verifiedCompanyName}>
                {validatorRef?.school?.name}
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
                {validation?.relationship}
              </Text>
            </View>

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
          <TouchableOpacity
            onPress={() => openValidationsModal(parentItem)}
            disabled={
              parentItem.type !== 'achievement' && !parentItem.achievementType
            }
          >
            <Text style={styles.verifiedTitle}>
              Verified by {validations.length}{' '}
              {validations.length === 1 ? 'person' : 'people'}
            </Text>
          </TouchableOpacity>
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

        {visibleValidations.map(renderValidationCard)}

        {expandedValidations[sectionKey] &&
          hiddenValidations.map(renderValidationCard)}
      </View>
    );
  };

  const renderEntry = (
    entry: EducationEntry | Achievement,
    isAchievement = false,
  ) => {
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
          <View
            style={[
              styles.timelineIconContainer,
              isAchievement ? styles.achievementIcon : styles.educationIcon,
            ]}
          >
            <Image
              source={
                isAchievement
                  ? require('../assets/icons/achievement.png')
                  : entry.school?.logo
                  ? { uri: entry.school.logo }
                  : require('../assets/icons/timeline.png')
              }
              style={styles.timelineIcon}
            />
          </View>
          {/* Draw line if needed */}
          <View style={styles.timelineLine} />
        </View>

        {/* Content */}
        <View style={styles.timelineContent}>
          {isAchievement ? (
            <View style={styles.achievementCardContainer}>
              {/* Achievement Header */}
              <View>
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
                    {entry.title}
                  </Text>
                </View>
                {/* {entry.isCurrent && (
                  <Image
                    source={require('../assets/icons/tick.png')}
                    style={styles.checkedIcon}
                  />
                )} */}
              </View>

              <View style={styles.headerActionsRow}>
                <View style={styles.dateContainer1}>
                  <Image
                    source={require('../assets/icons/calendar.png')}
                    style={styles.calendarIcon}
                  />
                  <Text style={styles.dateText}>{entry.dateRange}</Text>
                </View>
              </View>

              {/* Images */}
              {renderImages(entry.mediaUrl)}

              {/* Description */}
              {entry.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.description}>
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

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.likeSection}>
                  <TouchableOpacity
                    style={styles.statIconContainer}
                    onPress={() => {
                      handleStatsPress(
                        entry.id,
                        isAchievement ? 'achievement' : 'education',
                      );
                      handleLike(
                        entry.id,
                        isAchievement ? 'achievement' : 'education',
                      );
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
                      handleStatsPress(
                        entry.id,
                        isAchievement ? 'achievement' : 'education',
                      );
                      setCurrentItemType(
                        isAchievement ? 'achievement' : 'education',
                      );
                      setLikesModalVisible(true);
                    }}
                  >
                    <Text style={styles.statText}>
                      {entry.stats.likesCount}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.commentContainer}
                  onPress={() => {
                    handleStatsPress(
                      entry.id,
                      isAchievement ? 'achievement' : 'education',
                    );
                    setIsAddingComment(true);
                    setCommentsModalVisible(true);
                  }}
                >
                  <Image
                    source={require('../assets/icons/comment.png')}
                    style={styles.statIcon}
                  />
                  <Text style={styles.statText}>
                    {entry.stats.commentsCount} Comments
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Total Validations Badge */}
              <TouchableOpacity onPress={() => openValidationsModal(entry)}>
                <View style={styles.badgeContent}>
                  <View
                    style={
                      entry?.validations?.length > 0
                        ? [styles.verifiedBadge, { width: '60%' }]
                        : [
                            styles.verifiedBadge,
                            { width: '60%', backgroundColor: '#7E7E7E' },
                          ]
                    }
                  >
                    <Text style={styles.badgeText}>
                      {entry.validations ? entry.validations.length : 0}{' '}
                      Verifications
                    </Text>
                  </View>
                  <View style={styles.badgeIconContainer}>
                    <Image
                      source={
                        entry?.validations?.length > 0
                          ? require('../assets/icons/verifiedShield.png')
                          : require('../assets/icons/no_verification_badge.png')
                      }
                      style={styles.badgeIcon}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Header with Date */}
              <View style={styles.contentHeader}>
                <Text style={styles.subtitleText}>{entry.subtitle}</Text>
              </View>

              <View style={styles.tagsContainer}>
                {entry.isCurrent && (
                  <View style={styles.currentlyWorkingTag}>
                    <Text style={styles.currentlyWorkingText}>Currently</Text>
                  </View>
                )}
                {'registrarVerified' in entry &&
                  entry.registrarVerified !== undefined && (
                    <View style={styles.badgeContainer}>
                      <View style={styles.badgeContent}>
                        {/* Text Badge */}
                        <View
                          style={
                            entry.registrarVerified
                              ? styles.verifiedBadge
                              : styles.notVerifiedBadge
                          }
                        >
                          <Text style={styles.badgeText}>
                            {entry.registrarVerified
                              ? 'Registrar'
                              : 'Not Verified'}
                          </Text>
                        </View>

                        {/* Image - positioned to overlap */}
                        <View style={styles.badgeIconContainer}>
                          <Image
                            source={
                              entry.registrarVerified
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

              {/* Subtitle */}
              <View style={styles.dateContainer}>
                <Image
                  source={require('../assets/icons/calendar.png')}
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>{entry.dateRange}</Text>
              </View>

              {/* Description */}
              {entry.description && (
                <Text style={styles.description}>
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
              )}

              {/* Media */}
              {renderImages(entry.mediaUrl)}

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.likeSection}>
                  <TouchableOpacity
                    style={styles.statIconContainer}
                    onPress={() => {
                      handleStatsPress(
                        entry.id,
                        isAchievement ? 'achievement' : 'education',
                      );
                      handleLike(
                        entry.id,
                        isAchievement ? 'achievement' : 'education',
                      );
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
                      handleStatsPress(
                        entry.id,
                        isAchievement ? 'achievement' : 'education',
                      );
                      setCurrentItemType(
                        isAchievement ? 'achievement' : 'education',
                      );
                      setLikesModalVisible(true);
                    }}
                  >
                    <Text style={styles.statText}>
                      {entry.stats.likesCount}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.commentContainer}
                  onPress={() => {
                    handleStatsPress(
                      entry.id,
                      isAchievement ? 'achievement' : 'education',
                    );
                    setIsAddingComment(true);
                    setCommentsModalVisible(true);
                  }}
                >
                  <Image
                    source={require('../assets/icons/comment.png')}
                    style={styles.statIcon}
                  />
                  <Text style={styles.statText}>
                    {entry.stats.commentsCount} Comments
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Verified Section */}
              {entry?.validations &&
                entry?.validations?.length > 0 &&
                renderVerifiedSection(entry?.validations, entry)}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderGroup = (group: EducationGroup, index: number) => {
    return (
      <View key={index} style={styles.groupContainer}>
        {/* School Header */}
        <View style={[styles.timelineItem, styles.schoolHeaderItem]}>
          <View style={styles.timelineLeft}>
            <View style={[styles.timelineIconContainer, styles.schoolIcon]}>
              <Image
                source={
                  group.school.logo
                    ? { uri: group.school.logo }
                    : require('../assets/icons/google.png')
                }
                style={styles.timelineIcon}
              />
            </View>
            <View style={styles.timelineLine} />
          </View>
          <View style={styles.timelineContent}>
            <View style={styles.contentHeader}>
              <Text style={styles.schoolName}>{group.school.name}</Text>
            </View>
            <Text style={styles.schoolLocation}>{group.school.location}</Text>
          </View>
        </View>

        {/* Entries */}
        <View style={styles.groupedEntriesContainer}>
          {group.educationEntries.map(entry => (
            <View key={entry.id} style={styles.groupedEntry}>
              {renderEntry(entry)}
              {entry.achievements &&
                entry.achievements.map(achievement => (
                  <View key={achievement.id} style={styles.groupedAchievement}>
                    {renderEntry(achievement, true)}
                  </View>
                ))}
            </View>
          ))}
        </View>
      </View>
    );
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
          onPress={loadMoreEducation}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
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
        {educationGroups.map((group, groupIndex) =>
          renderGroup(group, groupIndex),
        )}
        <LoadMoreButton />
        {educationGroups.length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
            No education data found.
          </Text>
        )}
      </ScrollView>
      <CommentsModal
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        isAddingComment={isAddingComment}
        educationId={currentItemId || undefined}
        entityType={
          currentItemType === 'achievement' ? 'achievement' : 'education'
        }
        onCommentAdded={() => {
          if (currentItemId !== null) {
            updateCommentCount(
              currentItemId,
              1,
              currentItemType || 'education',
            );
          }
        }}
      />
      <LikesModal
        visible={likesModalVisible}
        onClose={() => setLikesModalVisible(false)}
        educationId={currentItemId || undefined}
        entityType={
          currentItemType === 'achievement' ? 'achievement' : 'education'
        }
      />
      <ValidationsListModal
        visible={isValidationsModalOpen}
        onClose={() => {
          setIsValidationsModalOpen(false);
          fetchEducation(1);
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
  groupContainer: {
    marginBottom: verticalScale(10),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(15),
    paddingHorizontal: moderateScale(15),
  },
  schoolHeaderItem: {
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
  },
  schoolIcon: {
    borderColor: '#4285F4',
    borderWidth: 2,
  },
  educationIcon: {
    borderColor: '#4285F4',
    borderWidth: 2,
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
  achievementTitle: {
    color: '#222222',
    fontSize: moderateScale(18),
    width: '75%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  descriptionContainer: {
    // marginBottom: verticalScale(12),
  },
  achievementIcon: {
    borderColor: '#FBBC05',
    borderWidth: 2,
  },
  timelineIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
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
    marginLeft: moderateScale(20),
  },
  groupedEntry: {},
  groupedAchievement: {
    marginLeft: moderateScale(20),
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
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
  },
  schoolName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
  },
  schoolLocation: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  subtitleText: {
    fontSize: moderateScale(14),
    color: '#000',
    marginBottom: verticalScale(8),
    fontWeight: '500',
  },
  description: {
    fontSize: moderateScale(14),
    color: '#2A2A2A',
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
    color: '#666666',
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
  verifiedSection: {
    backgroundColor: '#F8F9FA',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
    marginTop: verticalScale(8),
  },
  verifiedTitle: {
    fontSize: moderateScale(16),
    color: '#000000',
    marginBottom: verticalScale(12),
    fontWeight: '600',
  },
  verifiedTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
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
  showMoreButton: {
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
    paddingVertical: verticalScale(4),
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
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: verticalScale(8),
  },
  skillBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(14),
  },
  skillBadgeText: {
    fontSize: moderateScale(14),
    color: '#ffffff',
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
    marginBottom: verticalScale(8),
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
    marginBottom: verticalScale(5),
    marginTop: verticalScale(-5),
    marginLeft: -moderateScale(8),
  },
});

export default ProfileEducationView;
