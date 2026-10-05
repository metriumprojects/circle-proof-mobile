import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AddModal from './modal/AddModal';
import UniversalFormModal from './modal/UniversalFormModal';
import { useState, useEffect } from 'react';
import {
  fetchMySkills,
  addSkillLikeUnlike,
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

interface School {
  id: number;
  name: string;
  logo: string;
  type: string;
  location: string;
  website: string;
  isVerified?: boolean;
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

interface Validation {
  validatorReference: any;
  id: number;
  skillId?: number;
  validatorUserId: number;
  validatorPositionId: number;
  validationRequestId: number;
  status: 'verified' | 'pending' | 'rejected';
  relationship: string;
  recommendation: string;
  validatedAt: string;
  createdAt: string;
  updatedAt: string;
  achievementId: number | null;
  validator: Validator;
  skills: { skillName: string }[];
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
  type?: string; // For compatibility
  dateRange?: string; // For compatibility
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

const ProfileSkills = () => {
  const navigation = useNavigation<any>();
  const [skillsData, setSkillsData] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    | 'position'
    | 'achievement'
    | 'hobby'
    | 'skills'
    | 'education'
    | 'aspiration'
    | null
  >(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [achievementType, setAchievementType] = useState<
    'career' | 'position' | 'education' | 'hobby' | 'skill' | 'aspiration'
  >('career');
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: number]: boolean;
  }>({});
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<
    SkillItem | Achievement | null
  >(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [currentItemType, setCurrentItemType] = useState<
    'skill' | 'achievement' | null
  >(null);
  const [expandedValidations, setExpandedValidations] = useState<{
    [key: string]: boolean;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const sampleOptions = [{ value: 'skills', label: 'Add a Skill' }];

  const loadSkills = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const response = await fetchMySkills(page);
      if (response.data.success) {
        if (page === 1) {
          setSkillsData(response.data.data.skills);
        } else {
          setSkillsData(prev => [...prev, ...response.data.data.skills]);
        }
        setPagination(response.data.data.pagination);
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
  }, []);

  // Function to update comment count in local state when a comment is added
  const updateCommentCount = useCallback(
    (itemId: number, increment: number, type: string = 'skill') => {
      setSkillsData(prevSkills => {
        return prevSkills.map(skill => {
          // 1. Check if the skill itself is the target
          if (type === 'skill' && Number(skill.id) === Number(itemId)) {
            return {
              ...skill,
              stats: {
                ...(skill.stats || {}),
                commentsCount: (skill.stats?.commentsCount || 0) + increment,
                topLevelCommentsCount:
                  (skill.stats?.topLevelCommentsCount || 0) + increment,
              },
            };
          }

          // 2. Check if any achievement within this skill is the target
          if (
            type === 'achievement' &&
            skill.achievements &&
            skill.achievements.length > 0
          ) {
            const updatedAchievements = skill.achievements.map(ach => {
              if (Number(ach.id) === Number(itemId)) {
                return {
                  ...ach,
                  commentsCount: (ach.commentsCount || 0) + increment,
                  stats: {
                    ...(ach.stats || {}),
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

            // Only return a new skill object if an achievement was actually updated
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

  const toggleDescription = (id: number) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

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

  const handleLike = async (id: number, type: string = 'skill') => {
    try {
      // Optimistically update the state
      setSkillsData(prevSkills => {
        return prevSkills.map(skill => {
          if (type === 'skill' && skill.id === id) {
            const newIsLiked = !skill.isLiked;
            const newLikesCount = newIsLiked
              ? skill.stats.likesCount + 1
              : skill.stats.likesCount - 1;
            return {
              ...skill,
              isLiked: newIsLiked,
              stats: {
                ...skill.stats,
                likesCount: newLikesCount,
              },
            };
          }
          if (skill.achievements) {
            const updatedAchievements = skill.achievements.map(ach => {
              if (type === 'achievement' && ach.id === id) {
                const newIsLiked = !ach.isLiked;
                const newLikesCount = newIsLiked
                  ? (ach.stats?.likesCount || 0) + 1
                  : (ach.stats?.likesCount || 0) - 1;
                return {
                  ...ach,
                  isLiked: newIsLiked,
                  stats: {
                    ...(ach.stats || {}),
                    likesCount: newLikesCount,
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

      // Make the API call to update the like status on the server
      if (type === 'skill') {
        await addSkillLikeUnlike(id);
      } else if (type === 'achievement') {
        const response = await toggleLikeSectionAchievement(id);
        // If we want to be absolutely sure, we can update the state again with the actual result from server
        // but optimistic update is already done.
        console.log('Achievement like response:', response.data);
      }
    } catch (error) {
      console.error('Error liking skill/achievement:', error);
      // For simplicity in this error case, we'll re-load the data if it fails
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

  const handleSelect = (selected: any) => {
    setSelectedValue(selected);
    console.log('Selected:', selected);
    if (selected.value === 'skills') {
      setModalType('skills');
      setInitialData(null);
      setIsUniversalModalOpen(true);
      setIsModalOpen(false);
    }
  };

  const handleEditItem = async (item: SkillItem | Achievement) => {
    const isAchievement = 'achievementType' in item;
    console.log('Editing item:', item, 'isAchievement:', isAchievement);

    try {
      if (isAchievement) {
        const achData = item as Achievement;

        setModalType('achievement');
        setAchievementType((achData.achievementType as any) || 'skill');

        const startMonthName = achData.startMonth
          ? monthNames[achData.startMonth - 1]
          : 'Month';

        let endDate = { month: 'Month', year: 'Year' };
        if (achData.endMonth && achData.endYear) {
          endDate = {
            month: monthNames[achData.endMonth - 1],
            year: achData.endYear.toString(),
          };
        }

        // Prepare media - UniversalFormModal expects an array for existingMedia
        const mediaUrlsString =
          typeof achData.mediaUrls === 'string' ? achData.mediaUrls : '';
        const existingMediaArray = Array.isArray(achData.mediaUrls)
          ? achData.mediaUrls
          : mediaUrlsString
          ? mediaUrlsString
              .split(',')
              .map(u => u.trim())
              .filter(Boolean)
          : [];

        const initialEditData = {
          id: achData.id,
          title: achData.title,
          description: achData.description,
          date: {
            month: startMonthName,
            year: achData.startYear ? achData.startYear.toString() : 'Year',
          },
          endDate: endDate,
          isCurrentlyActive: achData.isCurrentlyActive,
          existingMedia: existingMediaArray,
          mediaUrl: mediaUrlsString, // Also provide as string for modal split logic
          referenceId: achData.referenceId,
          achievementType: achData.achievementType || 'skill',
        };

        console.log('Setting initialData for achievement:', initialEditData);
        setInitialData(initialEditData);
        setIsUniversalModalOpen(true);
      } else {
        const skillData = item as SkillItem;
        setModalType('skills');

        const startMonthName = skillData.startMonth
          ? monthNames[skillData.startMonth - 1]
          : 'Month';

        const endMonthName = skillData.endMonth
          ? monthNames[skillData.endMonth - 1]
          : 'Month';

        const skillMediaUrlsString =
          typeof skillData.mediaUrl === 'string' ? skillData.mediaUrl : '';
        const skillExistingMediaArray = skillMediaUrlsString
          ? skillMediaUrlsString
              .split(',')
              .map((u: string) => u.trim())
              .filter(Boolean)
          : [];

        setInitialData({
          skillName: skillData.skillName,
          skillLevel: skillData.skillLevel,
          title: skillData.title,
          description: skillData.description,
          startDate: {
            month: startMonthName,
            year: skillData.startYear ? skillData.startYear.toString() : 'Year',
          },
          endDate: {
            month: endMonthName,
            year: skillData.endYear ? skillData.endYear.toString() : 'Year',
          },
          isActive: skillData.isCurrentlyActive,
          id: skillData.id,
          existingMedia: skillExistingMediaArray,
          mediaUrl: skillMediaUrlsString,
        });
        setIsUniversalModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const handleAddAchievement = (skillId: number) => {
    setModalType('achievement');
    setAchievementType('skill');
    setInitialData({ referenceId: skillId });
    setIsUniversalModalOpen(true);
  };

  const renderAddButton = () => (
    <View style={styles.addButtonContainer}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalOpen(true)}
      >
        <Text style={styles.addButtonText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActionButtons = (item: SkillItem | Achievement) => {
    const isAchievement = 'achievementType' in item;
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditItem(item)}
        >
          <Image
            source={require('../assets/icons/edit.png')}
            style={styles.actionIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Image
            source={require('../assets/icons/share.png')}
            style={styles.actionIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.actionButton, backgroundColor: '#67C40C' }}
          onPress={() => {
            // Navigate to Verification screen with skill ID
            if (item.type === 'skill') {
              navigation.navigate('Verification', { skillId: item.id });
            } else {
              navigation.navigate('Verification', {
                achievementId: item.id,
                skillId: (item as Achievement).referenceId,
                isSkill: true,
              });
            }
          }}
        >
          <Image
            source={require('../assets/icons/verify.png')}
            style={styles.actionIcon}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // const renderVerifiedSection = (item: SkillItem) => (
  //   <View style={styles.verifiedSection}>
  //     <Text style={styles.verifiedTitle}>Verified by</Text>
  //     <View style={styles.verifiedProfile}>
  //       <View style={styles.verifiedAvatar}>
  //         <Text style={styles.verifiedAvatarText}>👤</Text>
  //       </View>
  //       <View style={styles.verifiedInfo}>
  //         <Text style={styles.verifiedName}>{item.verifiedBy[0]?.name || 'Verifier'}</Text>
  //         <Text style={styles.verifiedPosition}>{item.verifiedBy[0]?.role || 'Position'}</Text>
  //       </View>
  //     </View>
  //     <View style={styles.verifiedDetails}>
  //       <View style={styles.verifiedBadge}>
  //         <Image
  //           source={require('../assets/icons/verified.png')}
  //           style={styles.verifiedCheck}
  //         />
  //         <Text style={styles.verifiedText}>Verified: Worked at</Text>
  //       </View>
  //       <View style={styles.skillInfo}>
  //         <Text style={styles.skillIcon}>🔧</Text>
  //         <Text style={styles.skillText}>{item.verifiedBy[0]?.institution || 'Company'}</Text>
  //       </View>
  //       <Text style={styles.skillDates}>{item.verifiedBy[0]?.institution || 'Company'} from {item.verifiedBy[0]?.period || 'Date'}</Text>
  //     </View>
  //   </View>
  // );

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
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: 'transparent' }]}
              onPress={() => {
                setSelectedEntity(parentItem);
                setIsReadOnly(false);
                setIsValidationsModalOpen(true);
              }}
            >
              <Image
                source={require('../assets/icons/edit.png')}
                style={styles.editIcon1}
              />
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

  const renderImages = (item: SkillItem) => {
    if (!item.mediaUrl) return null;
    const images = item.mediaUrl
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    return (
      <View style={styles.imagesContainer}>
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.achievementImage}
            resizeMode="cover"
          />
        ))}
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
          <View style={styles.timelineLeft}>
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
                {renderActionButtons(achievement as any)}
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
                  <Text style={styles.description}>{displayDescription}</Text>
                  {showSeeMore && (
                    <TouchableOpacity
                      onPress={() => toggleDescription(achievement.id)}
                    >
                      <Text style={styles.seeMore}> see more</Text>
                    </TouchableOpacity>
                  )}
                  {isExpanded && descriptionLength > 100 && (
                    <TouchableOpacity
                      onPress={() => toggleDescription(achievement.id)}
                    >
                      <Text style={styles.seeMore}> see less</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.statsContainer}>
                  <View style={styles.likeSection}>
                    <TouchableOpacity
                      style={styles.statIconContainer}
                      onPress={() => {
                        handleStatsPress(Number(achievement.id), 'achievement');
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
                        handleStatsPress(Number(achievement.id), 'achievement');
                        setLikesModalVisible(true);
                      }}
                    >
                      <Text style={styles.statText}>
                        {achievement.stats?.likesCount || 0}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.commentContainer}
                    onPress={() => {
                      handleStatsPress(Number(achievement.id), 'achievement');
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
                  setIsReadOnly(false);
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

    return (
      <View style={styles.timelineItem} key={entry.id}>
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
              {(entry as SkillItem).skillName}
            </Text>
            {renderActionButtons(entry as SkillItem)}
          </View>
          <View style={styles.dateContainer}>
            <Image
              source={require('../assets/icons/calendar.png')}
              style={styles.calendarIcon}
            />
            <Text style={styles.dateText}>{entry.dateRange}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                width: '50%',
                paddingHorizontal: 8,
                borderRadius: 20,
                height: 28,
                marginBottom: 10,
              },
            ]}
            onPress={() => handleAddAchievement(entry.id)}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
              + Add achievement
            </Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>
            {(entry as SkillItem).title} • {(entry as SkillItem).skillLevel}
          </Text>

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

          {renderImages(entry as SkillItem)}

          <View style={styles.statsContainer}>
            <View style={styles.likeSection}>
              <TouchableOpacity
                style={styles.statIconContainer}
                onPress={() => {
                  handleStatsPress(Number(entry.id), 'skill');
                  handleLike(entry.id);
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
                  handleStatsPress(Number(entry.id), 'skill');
                  setLikesModalVisible(true);
                }}
              >
                <Text style={styles.statText}>
                  {(entry as SkillItem).stats.likesCount}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.commentContainer}
              onPress={() => {
                handleStatsPress(Number(entry.id), 'skill');
                setIsAddingComment(true); // Always show input in modal
                setCommentsModalVisible(true);
              }}
            >
              <Image
                source={require('../assets/icons/comment.png')}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>
                {entry.stats?.commentsCount || 0} Comments
              </Text>
            </TouchableOpacity>
          </View>

          {entry?.validations &&
            entry?.validations?.length > 0 &&
            renderVerifiedSection(entry?.validations, entry)}

          {/* Render Achievements */}
          {(entry as SkillItem).achievements &&
            (entry as SkillItem).achievements.length > 0 && (
              <View style={styles.groupedAchievementContainer}>
                {(entry as SkillItem).achievements.map(achievement => (
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
      {renderAddButton()}
      <View style={styles.listContent}>
        {skillsData.map((item, index) => renderEntry(item))}
        {renderLoadMoreButton()}
        {skillsData.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
            No skill data found.
          </Text>
        )}
      </View>
      <AddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Item"
        placeholder="Search options..."
        options={sampleOptions}
        onSelect={handleSelect}
        searchable={false}
        multiple={false}
        achievementType="education"
      />
      <UniversalFormModal
        isOpen={isUniversalModalOpen}
        onClose={() => setIsUniversalModalOpen(false)}
        mode={initialData?.id ? 'edit' : 'add'}
        type={modalType as any}
        achievementType={achievementType}
        initialData={initialData}
        refreshTimeline={loadSkills}
        onSubmit={data => {
          console.log('Updated data:', data);
          if (initialData?.id) {
            // Real-time update for edit mode
            setSkillsData(prevSkills => {
              return prevSkills.map(skill => {
                // If editing the skill itself
                if (modalType === 'skills' && skill.id === initialData.id) {
                  return { ...skill, ...data } as any;
                }
                // If editing an achievement within the skill
                if (skill.achievements) {
                  const updatedAchievements = skill.achievements.map(ach => {
                    if (ach.id === initialData.id) {
                      return { ...ach, ...data } as any;
                    }
                    return ach;
                  });
                  return { ...skill, achievements: updatedAchievements };
                }
                return skill;
              });
            });
          }
          setIsUniversalModalOpen(false);
        }}
      />
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
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: verticalScale(15),
    color: '#000',
    marginHorizontal: moderateScale(16),
  },
  addButtonContainer: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(5),
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000ff',
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(5),
  },
  addButtonText: {
    fontSize: moderateScale(14),
    color: '#ffffffff',
    fontWeight: '500',
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
    borderColor: '#4285F4',
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
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    backgroundColor: '#000000ff',
    borderRadius: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(4),
  },
  actionIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    tintColor: '#FFFFFF',
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
  verifiedCheck: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(6),
  },
  verifiedText: {
    fontSize: moderateScale(12),
    color: '#34A853',
    fontWeight: '600',
  },
  skillInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  skillIcon: {
    fontSize: moderateScale(16),
    marginRight: moderateScale(6),
  },
  skillText: {
    fontSize: moderateScale(16),
    color: '#000000',
    fontWeight: '600',
  },
  skillDates: {
    fontSize: moderateScale(11),
    color: '#66666',
    marginBottom: verticalScale(8),
  },
  imagesContainer: {
    marginVertical: verticalScale(8),
    width: '100%',
  },
  achievementImage: {
    width: '100%',
    height: verticalScale(300),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    backgroundColor: '#f0f0',
    resizeMode: 'cover',
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
  achievementIcon: {
    borderColor: '#FBBC05',
    borderWidth: 2,
    zIndex: 2,
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  groupedAchievementContainer: {
    marginLeft: moderateScale(10),
    marginTop: verticalScale(10),
  },
  groupedAchievement: {
    marginBottom: verticalScale(10),
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
  badgeText: {
    fontSize: moderateScale(12),
    color: '#ffffff',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  dateContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionContainer: {
    marginTop: verticalScale(8),
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
  editButton: {
    padding: moderateScale(4),
    marginRight: moderateScale(8),
  },
  editIcon1: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: '#666',
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
  description: {
    fontSize: moderateScale(15),
    color: '#000000',
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(4),
  },
});

export default ProfileSkills;
