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
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import {
  fetchSkillsByUserId,
  addSkillLikeUnlike,
  addEducationLikesUnlike,
  toggleLikeSectionAchievement,
} from '../api/service';
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

interface SkillItem {
  id: number;
  type: string;
  skillName: string;
  skillLevel: string;
  title: string;
  description: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  isCurrentlyActive: boolean;
  mediaUrl: string | null;
  dateRange: string;
  user: {
    id: number;
    fullName: string;
    profilePicture: string;
    idVerified: boolean;
  };
  stats: Stats;
  isLiked: boolean;
  canEdit: boolean;
  validations: Validation[];
  achievements: Achievement[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ProfileSkillsViewProps {
  userId?: number;
}

const ProfileSkillsView = ({ userId }: ProfileSkillsViewProps) => {
  const navigation = useNavigation<any>();
  const [skillsData, setSkillsData] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: number]: boolean;
  }>({});
  const [currentItemType, setCurrentItemType] = useState<
    'skill' | 'achievement' | null
  >(null);
  const [expandedValidations, setExpandedValidations] = useState<{
    [key: string]: boolean;
  }>({});
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<
    SkillItem | Achievement | null
  >(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);

  const months = [
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

  const getMonthName = (month: number) => {
    return months[month - 1] || '';
  };

  const formatDateRange = (item: any) => {
    const start = `${getMonthName(item.startMonth)} ${item.startYear}`;
    const end = item.isCurrentlyActive
      ? 'Present'
      : item.endMonth && item.endYear
      ? `${getMonthName(item.endMonth)} ${item.endYear}`
      : 'Present';
    return `${start} - ${end}`;
  };

  // Function to update comment count in local state when a comment is added
  const updateCommentCount = useCallback(
    (itemId: number, increment: number, type: string = 'skill') => {
      setSkillsData(prevSkills => {
        return prevSkills.map(skill => {
          if (type === 'skill' && Number(skill.id) === Number(itemId)) {
            return {
              ...skill,
              stats: {
                ...skill.stats,
                commentsCount: skill.stats.commentsCount + increment,
                topLevelCommentsCount:
                  skill.stats.topLevelCommentsCount + increment,
              },
            };
          }
          // Also check achievements
          if (
            type === 'achievement' &&
            skill.achievements &&
            skill.achievements.length > 0
          ) {
            const updatedAchievements = skill.achievements.map(ach => {
              if (Number(ach.id) === Number(itemId)) {
                return {
                  ...ach,
                  stats: {
                    ...ach.stats,
                    commentsCount: (ach.stats?.commentsCount || 0) + increment,
                    topLevelCommentsCount:
                      (ach.stats?.topLevelCommentsCount || 0) + increment,
                  },
                };
              }
              return ach;
            });

            // Check if any achievement was actually updated
            const isAchievementUpdated = skill.achievements.some(
              ach => Number(ach.id) === Number(itemId),
            );

            if (isAchievementUpdated) {
              return { ...skill, achievements: updatedAchievements };
            }
          }
          return skill;
        });
      });
    },
    [],
  );

  const loadSkills = async (page: number = 1) => {
    if (!userId) return;
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const response = await fetchSkillsByUserId(userId, page);
      if (response.data.success) {
        if (page === 1) {
          setSkillsData(response.data.data.skills);
        } else {
          setSkillsData(prev => [...prev, ...response.data.data.skills]);
        }
        setPagination(response.data.data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadSkills(1);
  }, [userId]);

  const handleLike = async (id: number, type: string = 'skill') => {
    try {
      // Update the local state directly instead of reloading all data
      setSkillsData(prevSkills => {
        return prevSkills.map(skill => {
          if (type === 'skill' && skill.id === id) {
            const newIsLiked = !skill.isLiked;
            return {
              ...skill,
              isLiked: newIsLiked,
              stats: {
                ...skill.stats,
                likesCount: newIsLiked
                  ? skill.stats.likesCount + 1
                  : skill.stats.likesCount - 1,
              },
            };
          }
          if (skill.achievements) {
            const updatedAchievements = skill.achievements.map(ach => {
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
            return { ...skill, achievements: updatedAchievements };
          }
          return skill;
        });
      });

      if (type === 'skill') {
        await addSkillLikeUnlike(id);
      } else if (type === 'achievement') {
        const response = await toggleLikeSectionAchievement(id);
        console.log('Achievement like response:', response.data);
      }
    } catch (error) {
      console.error('Error liking skill/achievement:', error);
      loadSkills(currentPage);
    }
  };

  const handleStatsPress = (
    id: number,
    type: 'skill' | 'achievement' = 'skill',
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

  const renderVerifiedSection = (
    validations: Validation[],
    parentItem: SkillItem | Achievement,
  ) => {
    if (!validations || validations.length === 0) return null;

    const sectionKey = validations[0]?.id
      ? `validation-${validations[0].id}`
      : 'validation-section';

    const MAX_VISIBLE_VALIDATIONS = 2;
    const visibleValidations = validations.slice(0, MAX_VISIBLE_VALIDATIONS);
    const hiddenValidations = validations.slice(MAX_VISIBLE_VALIDATIONS);

    const renderValidationCard = (validation: Validation) => {
      const validator = validation.validator;
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
          <Text style={styles.verifiedTitle}>
            Verified by {validations.length}{' '}
            {validations.length === 1 ? 'person' : 'people'}
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

  const renderEntry = (
    entry: SkillItem | Achievement,
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
                  <Text style={styles.subtitle}>
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

              <View style={styles.cardFooter}>
                <View style={styles.statsContainerAchievement}>
                  <View style={styles.likeSection}>
                    <TouchableOpacity
                      style={styles.statIconContainer}
                      onPress={() => {
                        handleStatsPress(achievement.id, 'achievement');
                        handleLike(achievement.id, 'achievement');
                      }}
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

  const renderSkillItem = ({
    item,
    index,
  }: {
    item: SkillItem;
    index: number;
  }) => {
    const isExpanded = expandedDescriptions[item.id] || false;
    let displayDescription = item.description;
    let showSeeMore = false;
    const descriptionLength = item.description ? item.description.length : 0;

    if (descriptionLength > 100 && !isExpanded) {
      displayDescription = item.description.substring(0, 100) + '...';
      showSeeMore = true;
    }

    if (isExpanded) {
      displayDescription = item.description;
    }

    return (
      <View style={styles.timelineItem} key={item.id}>
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineIconContainer, styles.skillIconBg]}>
            <Image
              source={require('../assets/icons/percentage.png')}
              style={styles.timelineIcon}
            />
          </View>
        </View>

        <View style={styles.timelineContent}>
          <View style={styles.contentHeader}>
            <Text style={[styles.title, styles.skillTitle]}>
              {item.skillName}
            </Text>
          </View>

          <View style={styles.dateContainer}>
            <Image
              source={require('../assets/icons/calendar.png')}
              style={styles.calendarIcon}
            />
            <Text style={styles.dateText}>{item.dateRange}</Text>
          </View>
          <Text style={styles.subtitle}>
            {item.title} • {item.skillLevel}
          </Text>

          {item.description && (
            <Text style={styles.subtitle}>
              {displayDescription}
              {showSeeMore && (
                <TouchableOpacity onPress={() => toggleDescription(item.id)}>
                  <Text style={styles.seeMore}> see more</Text>
                </TouchableOpacity>
              )}
              {isExpanded && descriptionLength > 100 && (
                <TouchableOpacity onPress={() => toggleDescription(item.id)}>
                  <Text style={styles.seeMore}> see less</Text>
                </TouchableOpacity>
              )}
            </Text>
          )}

          {renderEntryImages(item.mediaUrl)}

          <View style={styles.statsContainer}>
            <View style={styles.likeSection}>
              <TouchableOpacity
                style={styles.statIconContainer}
                onPress={() => {
                  handleStatsPress(item.id, 'skill');
                  handleLike(item.id, 'skill');
                }}
              >
                <Image
                  source={
                    item.isLiked
                      ? require('../assets/icons/like2.png')
                      : require('../assets/icons/like1.png')
                  }
                  style={styles.statIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCountContainer}
                onPress={() => {
                  handleStatsPress(item.id, 'skill');
                  setLikesModalVisible(true);
                }}
              >
                <Text style={styles.statText}>{item.stats.likesCount}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.commentContainer}
              onPress={() => {
                handleStatsPress(item.id, 'skill');
                setIsAddingComment(true); // Always show input in modal
                setCommentsModalVisible(true);
              }}
            >
              <Image
                source={require('../assets/icons/comment.png')}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>
                {item.stats.commentsCount} Comments
              </Text>
            </TouchableOpacity>
          </View>

          {item?.validations &&
            item?.validations?.length > 0 &&
            renderVerifiedSection(item?.validations, item)}

          {item.achievements && item.achievements.length > 0 && (
            <View style={styles.groupedAchievementContainer}>
              {item.achievements.map(achievement => (
                <View key={achievement.id} style={styles.groupedAchievement}>
                  {renderEntry(achievement, true)}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const loadMoreSkills = () => {
    if (pagination && pagination.hasNext && !loadingMore) {
      const nextPage = pagination.currentPage + 1;
      loadSkills(nextPage);
    }
  };

  const renderLoadMoreButton = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <Text style={styles.loadMoreText}>Loading more skills...</Text>
        </View>
      );
    }

    if (pagination && pagination.hasNext) {
      return (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMoreSkills}
        >
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      );
    }

    return null;
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
        {skillsData.map((item, index) => renderSkillItem({ item, index }))}
        {renderLoadMoreButton()}
      </ScrollView>
      <CommentsModal
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        isAddingComment={isAddingComment}
        skillId={
          currentItemType === 'skill' ? currentItemId || undefined : undefined
        }
        achievementId={
          currentItemType === 'achievement'
            ? currentItemId || undefined
            : undefined
        }
        entityType={currentItemType === 'achievement' ? 'achievement' : 'skill'}
        onCommentAdded={() => {
          if (currentItemId !== null) {
            updateCommentCount(currentItemId, 1, currentItemType || 'skill');
          }
        }}
      />
      <LikesModal
        visible={likesModalVisible}
        onClose={() => setLikesModalVisible(false)}
        skillId={
          currentItemType === 'skill' ? currentItemId || undefined : undefined
        }
        achievementId={
          currentItemType === 'achievement'
            ? currentItemId || undefined
            : undefined
        }
        entityType={currentItemType === 'achievement' ? 'achievement' : 'skill'}
      />
      <ValidationsListModal
        visible={isValidationsModalOpen}
        onClose={() => {
          setIsValidationsModalOpen(false);
          loadSkills(1);
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
  timelineItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(25),
    paddingHorizontal: moderateScale(15),
  },
  timelineLeft: {
    width: moderateScale(40),
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  timelineLeft1: {
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
  skillIconBg: {
    borderColor: '#FBBC05',
    borderWidth: 2,
  },
  timelineIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  achievementIcon1: {
    width: moderateScale(30),
    height: moderateScale(30),
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(-12),
    marginBottom: verticalScale(8),
  },
  dateContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer2: {
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
    fontSize: moderateScale(16),
    color: '#66666',
    fontWeight: '500',
  },
  levelContainer: {
    backgroundColor: '#FBBC05',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  levelText: {
    fontSize: moderateScale(12),
    color: '#000000',
    fontWeight: '600',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  skillTitle: {
    color: '#000000',
    fontSize: moderateScale(18),
  },
  subtitle: {
    fontSize: moderateScale(16),
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
    fontSize: moderateScale(12),
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
  commentContainer1: {
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
  },
  verifiedAvatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    marginRight: moderateScale(8),
  },
  avatarInitial: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#000',
    color: '#fff',
    textAlign: 'center',
    lineHeight: moderateScale(32),
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginRight: moderateScale(8),
  },
  verifiedInfo: {
    flex: 1,
  },
  verifiedName: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#000000',
  },
  verifiedPosition: {
    fontSize: moderateScale(12),
    color: '#666666',
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
  imagesContainer: {
    marginVertical: verticalScale(8),
  },
  achievementImage: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    backgroundColor: '#f0f0f0',
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  loadMoreButton: {
    backgroundColor: '#000000ff',
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(5),
    alignSelf: 'center',
  },
  loadMoreButtonText: {
    fontSize: moderateScale(16),
    color: '#ffffffff',
    fontWeight: '500',
  },
  loadMoreText: {
    fontSize: moderateScale(14),
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(8),
  },
  actionIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
  },
  achievementIcon: {
    borderColor: '#FBBC05',
    borderWidth: 2,
    zIndex: 2,
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
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
  achievementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  titleContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
  },
  achievementBadgeContainer: {
    width: '60%',
    marginLeft: -moderateScale(10),
    marginBottom: verticalScale(8),
  },
  badgeContent: {
    position: 'relative',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: moderateScale(12),
    paddingLeft: moderateScale(30),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(20),
  },
  badgeText: {
    fontSize: moderateScale(12),
    color: '#ffffff',
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
  descriptionContainer: {
    marginTop: verticalScale(8),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  statsContainerAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: moderateScale(10),
  },
  groupedAchievementContainer: {
    marginLeft: moderateScale(10),
    marginTop: verticalScale(10),
  },
  groupedAchievement: {
    marginBottom: verticalScale(10),
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
});

export default ProfileSkillsView;
