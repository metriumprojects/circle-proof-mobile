import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AddModal from './modal/AddModal';
import UniversalFormModal from './modal/UniversalFormModal';
import AddSchoolModal from './modal/AddSchoolModal';
import {
  getEducationData,
  getEducationByid,
  getEducationAchievementById,
  addEducationLikesUnlike,
  getSchoolList,
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

const sampleOptions = [
  { value: 'education', label: 'Add an Education' },
  { value: 'achievement', label: 'Add an Achievement' },
];

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
  registrarVerified: boolean;
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

const ProfileEducation = () => {
  const [educationGroups, setEducationGroups] = useState<EducationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false); // Added readOnly state
  const [selectedEntity, setSelectedEntity] = useState<
    EducationEntry | Achievement | null
  >(null);
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState(false);
  const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
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
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [currentItemType, setCurrentItemType] = useState<string | null>(null);
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
  const [showDraft, setShowDraft] = useState(false);
  const [switchingTabs, setSwitchingTabs] = useState(false);
  const navigation = useNavigation<any>();

  const handleStatsPress = (id: number, type: string) => {
    setCurrentItemId(id);
    setCurrentItemType(type);
  };

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
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getEducationData();
      if (response.data && response.data.data.education) {
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

  useEffect(() => {
    fetchEducation(1);
  }, []);

  const handleSelect = (selected: any) => {
    console.log('Selected:', selected);
    if (selected.value === 'education') {
      setModalType('education');
      setInitialData(null);
      setIsUniversalModalOpen(true);
      setIsModalOpen(false);
    } else if (selected.value === 'achievement') {
      setModalType('achievement');
      setInitialData(null);
      setIsUniversalModalOpen(true);
      setIsModalOpen(false);
    }
  };

  const handleEditItem = async (item: EducationEntry | Achievement) => {
    try {
      if (item.type === 'education') {
        // Use sourceId for fetching education details
        console.log('Fetching education details for sourceId:', item.sourceId);
        const response = await getEducationByid(item.sourceId);
        console.log('Education details response:', response.data);

        if (response.data && response.data.data) {
          let eduData;
          // Check if it returns a list under educationEntries
          if (
            response.data.data.educationEntries &&
            Array.isArray(response.data.data.educationEntries)
          ) {
            const entries = response.data.data.educationEntries;
            eduData =
              entries.find(
                (e: any) => e.id === item.id || e.sourceId === item.sourceId,
              ) || entries[0];
          } else if (response.data.data.education) {
            // Fallback: sometimes it might be under 'education' or just the object itself
            eduData = Array.isArray(response.data.data.education)
              ? response.data.data.education[0]
              : response.data.data.education;
          } else {
            // Fallback: assume data itself is the object if no specific key matches
            eduData = response.data.data;
          }

          console.log('Found education data:', eduData);

          if (eduData) {
            // FIX: Proper month name conversion
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

            // Use startMonth directly from API (assuming it's 1-indexed: 1=Jan, 2=Feb, etc.)
            const startMonthNumber = eduData.startMonth || 1;
            const startMonthName =
              monthNames[startMonthNumber - 1] || 'January';

            let endDate;
            if (eduData.endMonth && eduData.endYear) {
              const endMonthNumber = eduData.endMonth || 1;
              const endMonthName = monthNames[endMonthNumber - 1] || 'January';
              endDate = {
                month: endMonthName,
                year: eduData.endYear.toString(),
              };
            }

            setModalType('education');
            setInitialData({
              id: eduData.id,
              school: eduData.school?.name,
              schoolId: eduData.school?.id || eduData.schoolId,
              degree: eduData.degree,
              fieldOfStudy: eduData.fieldOfStudy,
              grade: eduData.grade,
              description: eduData.description,
              startDate: {
                month: startMonthName,
                year: eduData.startYear.toString(),
              },
              endDate: endDate,
              isCurrentlyStudying: eduData.isCurrent,
              mediaUrl: eduData.mediaUrl,
              existingMedia: eduData.mediaUrls || [],
            });
            setIsUniversalModalOpen(true);
          } else {
            console.log('Invalid response structure for education details');
          }
        }
      } else {
        const response = await getEducationAchievementById(item.sourceId);
        console.log(response.data, '33333');
        if (
          response.data &&
          response.data.data &&
          response.data.data.achievement
        ) {
          const achData = response.data.data.achievement;

          // FIX: Same month conversion for achievements
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

          const startMonthNumber = achData.startMonth || 1;
          const startMonthName = monthNames[startMonthNumber - 1] || 'January';

          let endDate;
          if (achData.endMonth && achData.endYear) {
            const endMonthNumber = achData.endMonth || 1;
            const endMonthName = monthNames[endMonthNumber - 1] || 'January';
            endDate = {
              month: endMonthName,
              year: achData.endYear.toString(),
            };
          }

          setModalType('achievement');
          setInitialData({
            id: achData.id,
            title: achData.title,
            school: achData.school?.name,
            schoolId: achData.schoolId,
            description: achData.description,
            startDate: {
              month: startMonthName,
              year: achData.startYear.toString(),
            },
            endDate: endDate,
            isCurrentlyActive: achData.isCurrentlyActive,
            mediaUrl: achData.mediaUrl,
            existingMedia: achData.mediaUrls || [],
            achievementType: achData.achievementType,
          });
          setIsUniversalModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching details for edit:', error);
    }
  };

  const renderAddButton = () => (
    <View style={styles.addButtonContainer}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalOpen(true)}
      >
        <Text style={styles.addButtonText}>+ Add</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.draftButton,
          showDraft ? styles.draftButtonActive : styles.draftButtonInactive,
        ]}
        onPress={() => setShowDraft(!showDraft)}
      >
        <Text
          style={[
            showDraft ? styles.draftButtonTextActive : styles.draftButtonText,
          ]}
        >
          {showDraft ? 'Education' : 'Draft'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderActionButtons = (item: EducationEntry | Achievement) => {
    console.log('item', item);
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
            // Navigate to verification screen with the specific item for verification
            if (item.type === 'education') {
              navigation.navigate('Verification', { educationId: item.id });
            } else {
              navigation.navigate('Verification', { achievementId: item.id });
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

          {/* Verified Company Info */}
          {validatorRef && validatorRef?.school && (
            <View style={styles.verifiedCompanyInfo}>
              {/* <Text style={styles.verifiedLabel}>
                {validatorRef?.isVerified ? 'Verified:' : 'Unverified:'}{' '}
              </Text> */}
              <Text style={styles.verifiedText}>
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
          <Text style={styles.verifiedTitle}>
            Verified by {validations.length}{' '}
            {validations.length === 1 ? 'person' : 'people'}
          </Text>
          <View style={styles.verifiedControlsRow}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: 'transparent' }]}
              onPress={() => {
                setSelectedEntity(parentItem);
                setIsReadOnly(false); // Edit mode
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
    if (descriptionLength > 10 && !isExpanded) {
      displayDescription = entry.description.substring(0, 100) + '...';
      showSeeMore = true;
    }

    // Always show full description if expanded
    if (isExpanded) {
      displayDescription = entry.description;
    }

    if (isAchievement) {
      return (
        <View style={[styles.timelineItem]} key={entry.id}>
          <View style={styles.timelineLeft}>
            <View
              style={[styles.timelineIconContainer, styles.achievementIcon]}
            >
              <Image
                source={require('../assets/icons/achievement.png')}
                style={styles.timelineIcon}
              />
            </View>
          </View>

          <View style={styles.timelineContent}>
            <View style={styles.achievementCardContainer}>
              {/* Header */}
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
                  <Text style={styles.achievementTitle}>{entry.title}</Text>
                </View>
                {renderActionButtons(entry)}
              </View>

              <View style={styles.dateContainer1}>
                <Image
                  source={require('../assets/icons/calendar.png')}
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>{entry.dateRange}</Text>
              </View>

              {renderImages(entry.mediaUrl)}

              {entry.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.description}>{displayDescription}</Text>
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
                </View>
              )}

              <View style={styles.cardFooter}>
                {/* Inline Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.likeSection}>
                    <TouchableOpacity
                      style={styles.statIconContainer}
                      onPress={() => {
                        handleStatsPress(entry.id, 'achievement');
                        handleLike(entry.id, 'achievement');
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
                        handleStatsPress(entry.id, 'achievement');
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
                      handleStatsPress(entry.id, 'achievement');
                      setIsAddingComment(true); // Always show input in modal
                      setCommentsModalVisible(true);
                    }}
                  >
                    <Image
                      source={require('../assets/icons/comment.png')}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>
                      {entry.stats.commentsCount || 0} Comments
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Total Validations Badge */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedEntity(entry);
                  setIsReadOnly(false); // Edit mode
                  setIsValidationsModalOpen(true);
                }}
              >
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
          </View>
        </View>
      );
    }

    return (
      <View style={styles.timelineItem} key={entry.id}>
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
                  : entry.school.logo
                  ? { uri: entry.school.logo }
                  : require('../assets/icons/timeline.png')
              }
              style={styles.timelineIcon}
            />
          </View>
        </View>

        <View style={styles.timelineContent}>
          <View style={styles.contentHeader}>
            <Text style={styles.subtitleText}>
              {isAchievement ? entry.title : entry.subtitle}
            </Text>
            {renderActionButtons(entry)}
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
                        {entry.registrarVerified ? 'Registrar' : 'Not Verified'}
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

          <View style={styles.dateContainer}>
            <Image
              source={require('../assets/icons/calendar.png')}
              style={styles.calendarIcon}
            />
            <Text style={styles.dateText}>{entry.dateRange}</Text>
          </View>

          {entry.description && (
            <Text style={styles.description}>
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

          {renderImages(entry.mediaUrl)}

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
                <Text style={styles.statText}>{entry.stats.likesCount}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.commentContainer}
              onPress={() => {
                handleStatsPress(
                  entry.id,
                  isAchievement ? 'achievement' : 'education',
                );
                setIsAddingComment(true); // Always show input in modal
                setCommentsModalVisible(true);
              }}
            >
              <Image
                source={require('../assets/icons/comment.png')}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>
                {entry.stats.commentsCount || 0} Comments
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verified Section */}
          {entry?.validations &&
            entry?.validations?.length > 0 &&
            renderVerifiedSection(entry?.validations, entry)}
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
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Image
                source={require('../assets/icons/share.png')}
                style={styles.actionIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Verification', {
                  schoolId: group.school.id,
                })
              }
              style={{ ...styles.actionButton, backgroundColor: '#67C40C' }}
            >
              <Image
                source={require('../assets/icons/verify.png')}
                style={styles.actionIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Entries with indentation */}
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

  // Filter unverified schools to show in draft section
  const unverifiedGroups = educationGroups.filter(
    group => !group.school.isVerified,
  );
  const verifiedGroups = educationGroups.filter(
    group => group.school.isVerified,
  );

  const renderDraftSection = () => {
    if (unverifiedGroups.length === 0) {
      return (
        <View style={styles.draftSection}>
          <Text style={styles.noDraftText}>No draft items available</Text>
        </View>
      );
    }

    return (
      <View style={styles.draftSection}>
        {unverifiedGroups.map((group, index) => renderGroup(group, index))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderAddButton()}
      <View style={styles.listContent}>
        {showDraft ? (
          renderDraftSection()
        ) : verifiedGroups.length > 0 ? (
          verifiedGroups.map((group, groupIndex) =>
            renderGroup(group, groupIndex),
          )
        ) : (
          <View style={styles.draftSection}>
            <Text style={styles.noDraftText}>
              No verified education items available
            </Text>
          </View>
        )}
        <LoadMoreButton />
        {educationGroups.length === 0 && !loading && (
          <Text style={styles.noDataText}>No education data found.</Text>
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
        achievementType={modalType === 'achievement' ? 'education' : undefined}
        refreshTimeline={fetchEducation}
      />
      <UniversalFormModal
        isOpen={isUniversalModalOpen}
        onClose={() => {
          setIsUniversalModalOpen(false);
          setInitialData(null);
        }}
        mode={initialData ? 'edit' : 'add'}
        type={modalType as any}
        initialData={initialData}
        achievementType={modalType === 'achievement' ? 'education' : undefined}
        onSubmit={async data => {
          console.log('Form submission successful:', data);

          // Update local state immediately based on the returned data
          if (modalType === 'education') {
            const educationData = data as any;

            if (initialData) {
              // EDIT mode - Update existing education entry
              setEducationGroups(prevGroups => {
                return prevGroups.map(group => {
                  // Check if this group contains the edited education
                  const updatedEntries = group.educationEntries.map(entry => {
                    if (
                      entry.id === initialData.id ||
                      entry.sourceId === initialData.id
                    ) {
                      // Update the education entry with new data
                      return {
                        ...entry,
                        title: educationData.degree || entry.title,
                        subtitle: educationData.degree || entry.subtitle,
                        description:
                          educationData.description || entry.description,
                        startDate: educationData.startDate
                          ? `${educationData.startDate.month} ${educationData.startDate.year}`
                          : entry.startDate,
                        endDate: educationData.endDate
                          ? `${educationData.endDate.month} ${educationData.endDate.year}`
                          : entry.endDate,
                        dateRange:
                          educationData.startDate && educationData.endDate
                            ? `${educationData.startDate.month} ${educationData.startDate.year} - ${educationData.endDate.month} ${educationData.endDate.year}`
                            : educationData.startDate
                            ? `${educationData.startDate.month} ${educationData.startDate.year} - Present`
                            : entry.dateRange,
                        school: {
                          ...entry.school,
                          name: educationData.school || entry.school.name,
                        },
                        updatedAt: new Date().toISOString(),
                      };
                    }
                    return entry;
                  });

                  return {
                    ...group,
                    educationEntries: updatedEntries,
                  };
                });
              });
            } else {
              // ADD mode - Create new education entry
              const newEntry: EducationEntry = {
                id: Date.now(), // Temporary ID
                sourceId: Date.now(), // Temporary sourceId
                type: 'education',
                title: educationData.degree || '',
                subtitle: educationData.degree || '',
                description: educationData.description || '',
                startDate: educationData.startDate
                  ? `${educationData.startDate.month} ${educationData.startDate.year}`
                  : '',
                endDate: educationData.endDate
                  ? `${educationData.endDate.month} ${educationData.endDate.year}`
                  : null,
                isCurrent: educationData.isCurrentlyStudying || false,
                mediaUrl: educationData.mediaUrl || null,
                achievementType: null,
                dateRange:
                  educationData.startDate && educationData.endDate
                    ? `${educationData.startDate.month} ${educationData.startDate.year} - ${educationData.endDate.month} ${educationData.endDate.year}`
                    : educationData.startDate
                    ? `${educationData.startDate.month} ${educationData.startDate.year} - Present`
                    : '',
                school: {
                  id: Date.now(), // Temporary ID
                  name: educationData.school || '',
                  logo: '',
                  type: '',
                  location: '',
                  website: '',
                  isVerified: false, // New entries are not verified initially
                },
                stats: {
                  likesCount: 0,
                  commentsCount: 0,
                  topLevelCommentsCount: 0,
                },
                isLiked: false,
                canEdit: true,
                achievements: [],
                validationStatus: 'pending',
                validationScore: 0,
                validations: [],
                registrarVerified: false,
              };

              // Check if school group exists
              setEducationGroups(prevGroups => {
                const groupIndex = prevGroups.findIndex(
                  group => group.school.name === educationData.school,
                );

                if (groupIndex >= 0) {
                  // Add to existing school group
                  return prevGroups.map((group, index) => {
                    if (index === groupIndex) {
                      return {
                        ...group,
                        educationEntries: [newEntry, ...group.educationEntries],
                      };
                    }
                    return group;
                  });
                } else {
                  // Create new school group
                  const newGroup: EducationGroup = {
                    school: {
                      id: Date.now(),
                      name: educationData.school || '',
                      logo: '',
                      type: '',
                      location: '',
                      website: '',
                      isVerified: false, // New schools are not verified initially
                    },
                    educationEntries: [newEntry],
                  };

                  return [newGroup, ...prevGroups];
                }
              });
            }
          } else if (modalType === 'achievement') {
            const achievementData = data as any;
            console.log(achievementData, 'dffghghghghgh');

            if (initialData) {
              // EDIT mode - Update existing achievement
              setEducationGroups(prevGroups => {
                return prevGroups.map(group => {
                  // Check if this group contains the edited achievement
                  const updatedEntries = group.educationEntries.map(entry => {
                    // Update achievements within this entry
                    const updatedAchievements = entry.achievements.map(
                      achievement => {
                        if (achievement.id === initialData.id) {
                          return {
                            ...achievement,
                            title: achievementData.title || achievement.title,
                            description:
                              achievementData.description ||
                              achievement.description,
                            startDate: achievementData.startDate
                              ? `${achievementData.startDate.month} ${achievementData.startDate.year}`
                              : achievement.startDate,
                            endDate: achievementData.endDate
                              ? `${achievementData.endDate.month} ${achievementData.endDate.year}`
                              : achievement.endDate,
                            dateRange:
                              achievementData.startDate &&
                              achievementData.endDate
                                ? `${achievementData.startDate.month} ${achievementData.startDate.year} - ${achievementData.endDate.month} ${achievementData.endDate.year}`
                                : achievementData.startDate
                                ? `${achievementData.startDate.month} ${achievementData.startDate.year} - Present`
                                : achievement.dateRange,
                            updatedAt: new Date().toISOString(),
                          };
                        }
                        return achievement;
                      },
                    );

                    return {
                      ...entry,
                      achievements: updatedAchievements,
                    };
                  });

                  return {
                    ...group,
                    educationEntries: updatedEntries,
                  };
                });
              });
            } else {
              // ADD mode - Create new achievement
              const newAchievement: Achievement = {
                id: Date.now(), // Temporary ID
                sourceId: Date.now(), // Temporary sourceId
                type: 'achievement',
                title: achievementData.title || '',
                subtitle: achievementData.title || '',
                description: achievementData.description || '',
                startDate: achievementData.startDate
                  ? `${achievementData.startDate.month} ${achievementData.startDate.year}`
                  : '',
                endDate: achievementData.endDate
                  ? `${achievementData.endDate.month} ${achievementData.endDate.year}`
                  : null,
                isCurrent: achievementData.isCurrentlyActive || false,
                mediaUrl: achievementData.mediaUrl || null,
                achievementType: 'education',
                dateRange:
                  achievementData.startDate && achievementData.endDate
                    ? `${achievementData.startDate.month} ${achievementData.startDate.year} - ${achievementData.endDate.month} ${achievementData.endDate.year}`
                    : achievementData.startDate
                    ? `${achievementData.startDate.month} ${achievementData.startDate.year} - Present`
                    : '',
                school: {
                  id: Date.now(), // Temporary ID
                  name: achievementData.school || '',
                  logo: '',
                  type: '',
                  location: '',
                  website: '',
                  isVerified: false, // New schools are not verified initially
                },
                stats: {
                  likesCount: 0,
                  commentsCount: 0,
                  topLevelCommentsCount: 0,
                },
                isLiked: false,
                canEdit: true,
                validationStatus: 'pending',
                validationScore: 0,
                validations: [],
              };

              // Find which education entry to add this achievement to
              // For simplicity, add to the first education entry of the matching school
              setEducationGroups(prevGroups => {
                const groupIndex = prevGroups.findIndex(
                  group => group.school.name === achievementData.school,
                );

                if (
                  groupIndex >= 0 &&
                  prevGroups[groupIndex].educationEntries.length > 0
                ) {
                  // Add achievement to the first education entry in the group
                  return prevGroups.map((group, index) => {
                    if (
                      index === groupIndex &&
                      group.educationEntries.length > 0
                    ) {
                      const firstEntry = group.educationEntries[0];
                      return {
                        ...group,
                        educationEntries: [
                          {
                            ...firstEntry,
                            achievements: [
                              newAchievement,
                              ...firstEntry.achievements,
                            ],
                          },
                          ...group.educationEntries.slice(1),
                        ],
                      };
                    }
                    return group;
                  });
                }
                return prevGroups;
              });
            }
          }
        }}
        refreshTimeline={fetchEducation}
        onAddSchool={() => {
          setIsUniversalModalOpen(false);
          setIsAddSchoolModalOpen(true);
        }}
      />
      <AddSchoolModal
        isOpen={isAddSchoolModalOpen}
        onClose={() => {
          setIsAddSchoolModalOpen(false);
          setIsUniversalModalOpen(true); // Re-open the universal form after closing add school modal
        }}
        onSchoolAdded={school => {
          // Refresh the school list in the universal form modal to include the newly added school
          // This will be handled by the getSchoolList API call in UniversalFormModal
          setIsAddSchoolModalOpen(false);
          setIsUniversalModalOpen(true); // Re-open the universal form after adding school

          // Update the school suggestions in the universal form to include the new school
          // We'll need to trigger a refresh of the school list in the UniversalFormModal
          // This should happen automatically when the form re-opens due to the fetchSchools call in useEffect
        }}
      />
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
      {/* Validations Modal */}
      <ValidationsListModal
        visible={isValidationsModalOpen}
        onClose={() => {
          setIsValidationsModalOpen(false);
          fetchEducation(1);
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
  addButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(5),
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(5),
  },
  draftButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#b8b8b8ff',
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(5),
    marginLeft: moderateScale(10),
  },
  draftButtonActive: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(5),
    marginLeft: moderateScale(10),
  },
  draftButtonInactive: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9EAEE',
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(5),
    marginLeft: moderateScale(10),
  },
  addButtonText: {
    fontSize: moderateScale(14),
    color: '#ffffffff',
    fontWeight: '500',
  },
  draftButtonTextActive: {
    fontSize: moderateScale(14),
    color: '#ffffff',
    fontWeight: '500',
  },
  draftButtonText: {
    fontSize: moderateScale(14),
    color: '#000000',
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: verticalScale(10),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(15),
    paddingHorizontal: moderateScale(15),
  },
  schoolHeaderItem: {
    marginBottom: verticalScale(10),
  },
  groupContainer: {
    marginBottom: verticalScale(10),
  },
  schoolIcon: {
    borderColor: '#4285F4',
    borderWidth: 2,
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
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#EBEBEB',
    marginTop: verticalScale(5),
    minHeight: verticalScale(20),
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
  educationIcon: {
    borderColor: '#4285F4',
    borderWidth: 2,
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
  actionButtons: {
    flexDirection: 'row',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginRight: moderateScale(190),
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
    fontSize: moderateScale(17),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  educationTitle: {
    color: '#4285F4',
  },
  subtitleText: {
    fontSize: moderateScale(16),
    color: '#000000',
    marginBottom: verticalScale(8),
    fontWeight: '500',
  },
  description: {
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
    color: '#000',
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
  noDataText: {
    textAlign: 'center',
    marginTop: verticalScale(20),
    color: '#66',
    fontSize: moderateScale(16),
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
    marginTop: verticalScale(2),
  },
  verifiedName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#ffffff',
  },
  verifiedPosition: {
    fontSize: moderateScale(14),
    color: '#000000',
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
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  badgeContainer1: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: verticalScale(2),
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
    marginBottom: verticalScale(8),
    // marginTop: verticalScale(-3),
    marginLeft: -moderateScale(8),
  },
  currentlyWorkingTag: {
    backgroundColor: '#E9EAEE',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(8),
    marginTop: verticalScale(-8),
  },
  currentlyWorkingText: {
    fontSize: moderateScale(12),
    color: '#00000',
    fontWeight: '600',
  },
  draftSection: {
    paddingHorizontal: moderateScale(15),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  noDraftText: {
    fontSize: moderateScale(16),
    color: '#666666',
    textAlign: 'center',
    paddingVertical: verticalScale(10),
  },

  // New Card & Badge Styles
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
  headerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  totalValidationsBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#34A853',
  },
  totalValidationsText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#34A853',
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
  dateContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionContainer: {
    marginTop: verticalScale(8),
  },
});

export default ProfileEducation;
