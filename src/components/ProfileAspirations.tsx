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

import AddModal from './modal/AddModal';
import UniversalFormModal from './modal/UniversalFormModal';
import { useState, useEffect } from 'react';
import {
  fetchMyAspirations,
  addAspirationLikeUnlike,
  getAspirationById,
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

interface AspirationItem {
  id: string;
  title: string;
  period: string;
  description: string;
  stats: {
    likesCount: number;
    commentsCount: number;
  };
  isLiked: boolean;
  relationship?: string;
  recommendation?: string;
  mediaUrl?: string;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  verificationCount: number;
  validations: any[];
  achievements: Achievement[];
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const sampleOptions = [{ value: 'aspiration', label: 'Add an Aspiration' }];

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

const ProfileAspirations = () => {
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
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [initialData, setInitialData] = useState<any>(null);
  const [achievementType, setAchievementType] = useState<
    'career' | 'position' | 'education' | 'hobby' | 'skill' | 'aspiration'
  >('career');
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [aspirationsData, setAspirationsData] = useState<AspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentItemType, setCurrentItemType] = useState<
    'aspiration' | 'achievement' | null
  >(null);
  const [expandedValidations, setExpandedValidations] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedEntity, setSelectedEntity] = useState<
    AspirationItem | Achievement | null
  >(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);
  const navigation = useNavigation<any>();

  // Function to update comment count in local state when a comment is added
  const updateCommentCount = useCallback(
    (itemId: number, increment: number, type: string = 'aspiration') => {
      setAspirationsData(prevAspirations => {
        return prevAspirations.map(aspiration => {
          if (type === 'aspiration' && parseInt(aspiration.id) === itemId) {
            return {
              ...aspiration,
              stats: {
                ...aspiration.stats,
                commentsCount: aspiration.stats.commentsCount + increment,
              },
            };
          }
          if (
            type === 'achievement' &&
            aspiration.achievements &&
            aspiration.achievements.length > 0
          ) {
            const updatedAchievements = aspiration.achievements.map(ach => {
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
            const isAchievementUpdated = aspiration.achievements.some(
              ach => Number(ach.id) === Number(itemId),
            );

            if (isAchievementUpdated) {
              return { ...aspiration, achievements: updatedAchievements };
            }
          }
          return aspiration;
        });
      });
    },
    [],
  );

  const handleLike = async (id: number, type: string = 'aspiration') => {
    try {
      // Optimistically update the UI before making the API call
      setAspirationsData(prevAspirations => {
        return prevAspirations.map(aspiration => {
          if (type === 'aspiration' && parseInt(aspiration.id) === id) {
            const newIsLiked = !aspiration.isLiked;
            const newLikesCount = newIsLiked
              ? aspiration.stats.likesCount + 1
              : aspiration.stats.likesCount - 1;
            return {
              ...aspiration,
              isLiked: newIsLiked,
              stats: {
                ...aspiration.stats,
                likesCount: newLikesCount,
              },
            };
          }
          if (aspiration.achievements) {
            const updatedAchievements = aspiration.achievements.map(ach => {
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
            return { ...aspiration, achievements: updatedAchievements };
          }
          return aspiration;
        });
      });

      // Make the API call to update the like status on the server
      if (type === 'aspiration') {
        await addAspirationLikeUnlike(id);
      } else if (type === 'achievement') {
        const response = await toggleLikeSectionAchievement(id);
        console.log('Achievement like response:', response.data);
      }
    } catch (error) {
      console.error('Error liking aspiration/achievement:', error);
      loadAspirations(currentPage);
    }
  };

  const handleStatsPress = (
    id: number,
    type: 'aspiration' | 'achievement' = 'aspiration',
  ) => {
    setCurrentItemId(id);
    setCurrentItemType(type);
  };

  console.log('Is modal open:', isModalOpen);

  const [selectedValue, setSelectedValue] = useState(null);
  const handleSelect = (selected: any) => {
    setSelectedValue(selected);
    console.log('Selected:', selected);
    if (selected.value === 'aspiration') {
      setModalType('aspiration');
      setFormMode('add');
      setInitialData(null);
      setIsUniversalModalOpen(true);
      setIsModalOpen(false);
    }
  };

  const handleEditItem = async (item: AspirationItem | Achievement) => {
    const isAchievement = 'achievementType' in item;
    console.log('Editing item:', item, 'isAchievement:', isAchievement);

    try {
      if (isAchievement) {
        const achData = item as Achievement;
        setModalType('achievement');
        setAchievementType((achData.achievementType as any) || 'aspiration');

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
          mediaUrl: mediaUrlsString,
          referenceId: achData.referenceId,
          achievementType: achData.achievementType || 'aspiration',
        };

        console.log('Setting initialData for achievement:', initialEditData);
        setInitialData(initialEditData);
        setIsUniversalModalOpen(true);
      } else {
        const aspirationItem = item as AspirationItem;
        setLoadingEdit(true);
        const response = await getAspirationById(parseInt(aspirationItem.id));
        if (response.data.success) {
          const aspiration = response.data.data.aspiration;
          const monthsForAspiration = [
            'Month',
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

          setModalType('aspiration');
          setFormMode('edit');
          setInitialData({
            id: aspiration.id,
            goal: aspiration.goal,
            whyItMatters: aspiration.whyItMatters,
            targetDate: {
              month: monthsForAspiration[aspiration.targetMonth] || 'Month',
              year: aspiration.targetYear.toString() || 'Year',
            },
            mediaUrl: aspiration.mediaUrl,
          });
          setIsUniversalModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleAddAchievement = (aspirationId: number) => {
    setModalType('achievement');
    setAchievementType('aspiration');
    setFormMode('add');
    setInitialData({ referenceId: aspirationId });
    setIsUniversalModalOpen(true);
  };

  const loadAspirations = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      console.log('Fetching aspirations...');
      const response = await fetchMyAspirations(page);
      console.log(
        'Aspirations response:',
        JSON.stringify(response.data, null, 2),
      );
      if (response.data.success) {
        const mappedData = response.data.data.aspirations.map((item: any) => {
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
          const monthName = months[item.targetMonth - 1] || '';
          return {
            id: item.id.toString(),
            title: item.goal,
            period: `${monthName} ${item.targetYear}`,
            description: item.whyItMatters,
            stats: {
              likesCount: item.likesCount || 0,
              commentsCount: item.commentsCount || 0,
            },
            isLiked: item.isLiked,
            validations: item.validations,
            mediaUrl: item.mediaUrl,
            achievements: item.achievements || [],
          };
        });
        console.log('Mapped data:', mappedData);
        if (page === 1) {
          setAspirationsData(mappedData);
        } else {
          setAspirationsData(prev => [...prev, ...mappedData]);
        }
        setPagination(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching aspirations:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadAspirations(1);
  }, []);

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

  const renderActionButtons = (item: AspirationItem) => (
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
        onPress={() => {
          // Navigate to Verification screen with the aspiration ID
          navigation.navigate('Verification', {
            aspirationId: parseInt(item.id),
            isAspiration: true,
          });
        }}
        style={{ ...styles.actionButton, backgroundColor: '#67C40C' }}
      >
        <Image
          source={require('../assets/icons/verify.png')}
          style={styles.actionIcon}
        />
      </TouchableOpacity>
    </View>
  );

  const renderVerifiedSection = (
    validations: Validation[],
    parentItem: AspirationItem | Achievement,
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
            {validation?.relationship && (
              <View style={styles.relationshipInfo}>
                <Text style={styles.relationshipText}>
                  <Text style={styles.relationshipLabel}>Relationship: </Text>
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

  const renderEntryImages = (mediaUrl: any) => {
    if (!mediaUrl) return null;

    let urls: string[] = [];
    if (typeof mediaUrl === 'string') {
      urls = mediaUrl
        .split(',')
        .map(url => url.trim())
        .filter(url => url !== '');
    } else if (Array.isArray(mediaUrl)) {
      urls = mediaUrl
        .map((m: any) => (typeof m === 'string' ? m : m.uri))
        .filter(Boolean);
    }

    if (urls.length === 0) return null;

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

  const formatDateRange_ach = (item: any) => {
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
    entry: AspirationItem | Achievement,
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

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setFormMode('edit');
                      handleEditItem(achievement);
                    }}
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
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#67C40C',
                    }}
                    onPress={() => {
                      navigation.navigate('Verification', {
                        achievementId: achievement.id,
                        aspirationId: achievement.referenceId,
                        isAspiration: true,
                      });
                    }}
                  >
                    <Image
                      source={require('../assets/icons/verify.png')}
                      style={styles.actionIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dateContainer1}>
                <Image
                  source={require('../assets/icons/calendar.png')}
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>
                  {formatDateRange_ach(achievement)}
                </Text>
              </View>

              {renderEntryImages(achievement.mediaUrls)}

              {achievement.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.subtitle1}>
                    {displayDescription}
                    {showSeeMore && (
                      <TouchableOpacity
                        onPress={() => toggleDescription(entry.id.toString())}
                      >
                        <Text style={styles.seeMore}> see more</Text>
                      </TouchableOpacity>
                    )}
                    {isExpanded && descriptionLength > 100 && (
                      <TouchableOpacity
                        onPress={() => toggleDescription(entry.id.toString())}
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
                        ? [styles.verifiedBadgeLabel2, { width: '60%' }]
                        : [
                            styles.verifiedBadgeLabel2,
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

  const renderImages = (item: AspirationItem) => {
    if (!item.mediaUrl) return null;

    // Handle multiple images if mediaUrl is a comma-separated string
    let images: string[] = [];
    if (typeof item.mediaUrl === 'string') {
      // Split comma-separated URLs and trim whitespace
      images = item.mediaUrl
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    } else if (Array.isArray(item.mediaUrl)) {
      images = item.mediaUrl;
    } else {
      images = [item.mediaUrl];
    }

    return (
      <View style={styles.imagesContainer}>
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.aspirationImage}
            resizeMode="cover"
          />
        ))}
      </View>
    );
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderAspirationItem = ({
    item,
    index,
  }: {
    item: AspirationItem;
    index: number;
  }) => {
    console.log(item, 'efefdf');
    const isExpanded = expandedDescriptions[item.id] || false;
    let displayDescription = item.description;
    let showSeeMore = false;

    // Check if description exists and is long enough to truncate
    const descriptionLength = item.description ? item.description.length : 0;

    // Only show "see more" if description is longer than 100 characters
    if (descriptionLength > 100 && !isExpanded) {
      displayDescription = item.description.substring(0, 100) + '...';
      showSeeMore = true;
    }

    // Always show full description if expanded
    if (isExpanded) {
      displayDescription = item.description;
    }

    return (
      <View style={styles.timelineItem}>
        {/* Timeline Line and Icon */}
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineIconContainer, styles.aspirationIconBg]}>
            <Image
              source={require('../assets/icons/aspirations.png')}
              style={styles.timelineIcon}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.timelineContent}>
          {/* Header with Date and Action Buttons */}
          <View style={styles.contentHeader}>
            {/* Title */}
            <Text style={[styles.title, styles.aspirationTitle]}>
              {item.title}
            </Text>

            {renderActionButtons(item)}
          </View>

          <View style={styles.dateContainer}>
            <Image
              source={require('../assets/icons/calendar.png')}
              style={styles.calendarIcon}
            />
            <Text style={styles.dateText}>{item.period}</Text>
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
            onPress={() => handleAddAchievement(parseInt(item.id))}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
              + Add achievement
            </Text>
          </TouchableOpacity>

          {/* Description */}
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

          {/* Images */}
          {renderImages(item)}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.likeSection}>
              <TouchableOpacity
                style={styles.statIconContainer}
                onPress={() => {
                  handleStatsPress(parseInt(item.id));
                  handleLike(parseInt(item.id));
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
                  handleStatsPress(parseInt(item.id));
                  setLikesModalVisible(true);
                }}
              >
                <Text style={styles.statText}>{item.stats.likesCount}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.commentContainer}
              onPress={() => {
                handleStatsPress(parseInt(item.id));
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

          {/* Verified Section */}
          {item?.validations &&
            item?.validations?.length > 0 &&
            renderVerifiedSection(item?.validations, item)}

          {/* Achievements Cards */}
          {item.achievements && item.achievements.length > 0 && (
            <View style={styles.groupedAchievementContainer}>
              {item.achievements.map(achievement =>
                renderEntry(achievement, true),
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const loadMoreAspirations = () => {
    if (pagination && pagination.hasNextPage && !loadingMore) {
      const nextPage = pagination.page + 1;
      loadAspirations(nextPage);
    }
  };

  const renderLoadMoreButton = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <Text style={styles.loadMoreText}>Loading more aspirations...</Text>
        </View>
      );
    }

    if (pagination && pagination.hasNextPage) {
      return (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMoreAspirations}
        >
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  if (loading && aspirationsData.length === 0) {
    // Only show full loading when no data exists yet
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {aspirationsData.map((item, index) => (
          <View key={item.id}>{renderAspirationItem({ item, index })}</View>
        ))}
        {renderLoadMoreButton()}
        {aspirationsData.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
            No aspirations found.
          </Text>
        )}
      </ScrollView>

      <AddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Item"
        placeholder="Search options..."
        options={sampleOptions}
        onSelect={handleSelect}
        searchable={false}
        multiple={false}
        showNextButton={false}
        achievementType="education"
      />

      <UniversalFormModal
        isOpen={isUniversalModalOpen}
        onClose={() => setIsUniversalModalOpen(false)}
        mode={formMode}
        type={modalType as any}
        achievementType={achievementType}
        initialData={initialData}
        refreshTimeline={loadAspirations}
        onSubmit={(data: any) => {
          console.log('Updated data:', data);
          if (modalType === 'achievement' && formMode === 'add') {
            setAspirationsData(prevAspirations => {
              return prevAspirations.map(aspiration => {
                if (
                  aspiration.id.toString() === data.referenceId?.toString() ||
                  aspiration.id.toString() ===
                    initialData?.referenceId?.toString()
                ) {
                  return {
                    ...aspiration,
                    achievements: [data, ...(aspiration.achievements || [])],
                  };
                }
                return aspiration;
              });
            });
          } else if (modalType === 'achievement' && formMode === 'edit') {
            setAspirationsData(prevAspirations => {
              return prevAspirations.map(aspiration => {
                if (
                  aspiration.id.toString() === data.referenceId?.toString() ||
                  aspiration.id.toString() ===
                    initialData?.referenceId?.toString()
                ) {
                  const updatedAchievements = aspiration.achievements.map(
                    ach => {
                      if (ach.id === data.id) {
                        return { ...ach, ...data };
                      }
                      return ach;
                    },
                  );
                  return { ...aspiration, achievements: updatedAchievements };
                }
                return aspiration;
              });
            });
          } else {
            loadAspirations(1);
          }
          setIsUniversalModalOpen(false);
        }}
      />
      <CommentsModal
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        isAddingComment={isAddingComment}
        aspirationId={
          currentItemType === 'aspiration'
            ? currentItemId || undefined
            : undefined
        }
        achievementId={
          currentItemType === 'achievement'
            ? currentItemId || undefined
            : undefined
        }
        entityType={
          currentItemType === 'achievement' ? 'achievement' : 'aspiration'
        }
        onCommentAdded={() => {
          if (currentItemId !== null) {
            updateCommentCount(
              currentItemId,
              1,
              currentItemType || 'aspiration',
            );
          }
        }}
      />
      <LikesModal
        visible={likesModalVisible}
        onClose={() => setLikesModalVisible(false)}
        aspirationId={
          currentItemType === 'aspiration'
            ? currentItemId || undefined
            : undefined
        }
        achievementId={
          currentItemType === 'achievement'
            ? currentItemId || undefined
            : undefined
        }
        entityType={
          currentItemType === 'achievement' ? 'achievement' : 'aspiration'
        }
      />
      <ValidationsListModal
        visible={isValidationsModalOpen}
        onClose={() => {
          setIsValidationsModalOpen(false);
          loadAspirations(1);
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
    backgroundColor: '#000',
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(5),
  },
  addButtonText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
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
  aspirationIconBg: {
    borderColor: '#EA4335',
    borderWidth: 2,
  },
  timelineIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
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
    color: '#666666',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    backgroundColor: '#000000',
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
  aspirationTitle: {
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
  statsContainerAchievement: {
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
    paddingTop: verticalScale(2),
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
    // borderWidth: 1,
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(6),
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
  aspirationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  aspirationIcon: {
    fontSize: moderateScale(16),
    marginRight: moderateScale(6),
  },
  aspirationText: {
    fontSize: moderateScale(12),
    color: '#000000',
    fontWeight: '600',
  },
  aspirationDates: {
    fontSize: moderateScale(11),
    color: '#666666',
    marginBottom: verticalScale(8),
  },
  imagesContainer: {
    marginVertical: verticalScale(8),
  },
  aspirationImage: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    backgroundColor: '#f0f0',
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  loadMoreButton: {
    backgroundColor: '#000',
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(5),
    alignSelf: 'center',
  },
  loadMoreButtonText: {
    fontSize: moderateScale(16),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadMoreText: {
    fontSize: moderateScale(14),
    color: '#666666',
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
  timelineLeft1: {
    width: moderateScale(40),
    alignItems: 'center',
    marginRight: moderateScale(10),
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
    width: moderateScale(30),
    height: moderateScale(30),
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
  dateContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  descriptionContainer: {
    marginTop: verticalScale(8),
  },
  subtitle1: {
    fontSize: moderateScale(15),
    color: '#000000',
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(4),
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
  verifiedBadgeLabel2: {
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
    marginLeft: moderateScale(10),
    marginTop: verticalScale(10),
  },
});

export default ProfileAspirations;
