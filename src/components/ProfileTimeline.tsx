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
import LikesModal from './LikesModal';
import CommentsModal from './CommentsModal';
import ValidationsListModal from './modal/ValidationsListModal';
import { useState, useEffect } from 'react';
import {
  fetchMyTimeline,
  likeUnlikeTimeline,
  fetchPositionsById,
  fetchAchievementsById,
} from '../api/service';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (size * factor - size) * factor;

// API Response Types
interface Company {
  id: number;
  name: string;
  logo: string;
  uniqueAddress: string;
  isVerified: boolean;
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
  validatorReference: {
    type: string;
    id: number;
    title: string;
    isVerified: boolean;
    hrVerified: boolean;
    company: {
      id: number;
      name: string;
      logo: string;
    };
    startMonth: number;
    startYear: number;
    endMonth: number | null;
    endYear: number | null;
    isCurrentlyWorking: boolean;
  };
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
  id: number | string;
  sourceId: number | null;
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
  employmentType?: string;
  location?: string;
  locationType?: string;
}

interface Position {
  id: number | string;
  sourceId: number | null;
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
  employmentType?: string;
  location?: string;
  locationType?: string;
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

interface ProfileTimelineProps {
  timelineData?: TimelineCompany[];
  userId?: number | null;
}

const sampleOptions = [
  { value: 'position', label: 'Add a Position' },
  { value: 'achievement', label: 'Add an Achievement' },
];

const ProfileTimeline: React.FC<ProfileTimelineProps> = ({
  timelineData: propTimelineData,
  userId,
}) => {
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
  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<
    Achievement | Position | null
  >(null);

  /* Removed duplicate function */
  const [isReadOnly, setIsReadOnly] = useState(false); // Add isReadOnly state here

  const openValidationsModal = (achievement: Achievement) => {
    setSelectedEntity(achievement);
    setIsReadOnly(false); // Open in edit mode
    setIsValidationsModalOpen(true);
  };

  const updateCommentCount = useCallback(
    (itemId: number | string, increment: number, type: string) => {
      setApiTimelineData(prevData => {
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
  const [selectedValue, setSelectedValue] = useState(null);
  const [apiTimelineData, setApiTimelineData] = useState<TimelineCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | string | null>(
    null,
  );
  const [currentItemType, setCurrentItemType] = useState<
    'position' | 'achievement' | null
  >(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [switchingTabs, setSwitchingTabs] = useState(false);

  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const needsTruncation = useCallback(
    (text: string, maxLength: number = 150) => {
      return text.length > maxLength;
    },
    [],
  );

  const truncateText = useCallback((text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, []);

  const handleSelect = useCallback((selected: any) => {
    setSelectedValue(selected);
    console.log('Selected:', selected);
  }, []);

  const monthNames = [
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

  const getMonthName = (monthNumber: number | null): string => {
    if (monthNumber === null || monthNumber === undefined) return 'Month';
    if (monthNumber >= 1 && monthNumber <= 12) {
      return monthNames[monthNumber];
    }
    return 'Month';
  };

  const refreshTimeline = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const fetchDetailedData = useCallback(
    async (sourceId: number | null, type: 'position' | 'achievement') => {
      if (sourceId === null) {
        console.log('No sourceId provided, cannot fetch detailed data');
        return null;
      }

      try {
        if (type === 'position') {
          const response = await fetchPositionsById(sourceId);
          console.log('Position details API response:', response.data.data);
          return response.data.data;
        } else if (type === 'achievement') {
          const response = await fetchAchievementsById(sourceId);
          console.log('Achievement details API response:', response);
          return response;
        } else {
          console.warn('Unknown type for detailed data fetch:', type);
          return null;
        }
      } catch (error: any) {
        console.log(`Error fetching ${type} details:`, error);
        throw error;
      }
    },
    [],
  );

  const loadTimelineData = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      if (propTimelineData) {
        setApiTimelineData(propTimelineData);
        if (page === 1) setLoading(false);
        return;
      }

      const response = await fetchMyTimeline(page);
      console.log('API Response:', response);

      if (
        response &&
        response.data &&
        response.data.data &&
        response.data.data.timeline
      ) {
        if (page === 1) {
          setApiTimelineData(response.data.data.timeline);
        } else {
          setApiTimelineData(prevData => [
            ...prevData,
            ...response.data.data.timeline,
          ]);
        }

        if (response.data.data.pagination) {
          console.log('Pagination data:', response.data.pagination);
          setPagination(response.data.data.pagination);
        } else {
          console.log('No pagination data in response');
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
          setApiTimelineData(response.data.timeline);
        } else {
          setApiTimelineData(prevData => [
            ...prevData,
            ...response.data.timeline,
          ]);
        }

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
        if (page === 1) {
          setApiTimelineData(response);
        } else {
          setApiTimelineData(prevData => [...prevData, ...response]);
        }

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
        if (page === 1) {
          setApiTimelineData(response.data);
        } else {
          setApiTimelineData(prevData => [...prevData, ...response.data]);
        }

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
      setError('Failed to load timeline data');
    } finally {
      if (loadingMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTimelineData(1);
  }, [refreshTrigger, userId]);

  const timelineData = propTimelineData || apiTimelineData;

  const handleEditItem = useCallback(
    async (item: Position | Achievement, type: 'position' | 'achievement') => {
      console.log('Editing item:', item);
      setModalType(type);

      try {
        if (item.sourceId) {
          const detailedData = await fetchDetailedData(item.sourceId, type);
          console.log(detailedData, 'detailed data');

          if (detailedData) {
            if (type === 'position') {
              const positionData = detailedData.position;
              console.log('Position data for edit:', positionData);

              setInitialData({
                id: positionData.id,
                title: positionData.title || '',
                employmentType: positionData.employmentType || 'Please select',
                isCurrentlyWorking: positionData.isCurrentlyWorking || false,
                startMonth: getMonthName(positionData.startMonth) || 'Month',
                startYear: positionData.startYear?.toString() || 'Year',
                endMonth: getMonthName(positionData.endMonth) || 'Month',
                endYear: positionData.endYear?.toString() || 'Year',
                location: positionData.location || '',
                locationType: positionData.locationType || 'Please select',
                description: positionData.description || '',
                mediaUrl: positionData.mediaUrl || '',
                company: positionData.company || {},
                companyName: positionData.company?.name || '',
              });
            } else if (type === 'achievement') {
              const achievementData =
                detailedData.data?.achievement || detailedData.achievement;
              console.log('Achievement data for edit:', achievementData);

              setInitialData({
                id: achievementData.id,
                title: achievementData.title || '',
                description: achievementData.description || '',
                date: {
                  month: getMonthName(achievementData.startMonth) || 'Month',
                  year: achievementData.startYear?.toString() || 'Year',
                },
                endDate: {
                  month: getMonthName(achievementData.endMonth) || 'Month',
                  year: achievementData.endYear?.toString() || 'Year',
                },
                isCurrentlyWorking: achievementData.isCurrentlyWorking || false,
                mediaUrl: achievementData.mediaUrl || '',
                company: achievementData.company || {},
                companyName: achievementData.company?.name || '',
              });
            }
          }
        } else {
          console.log('No sourceId, using item data directly');
          if (type === 'position') {
            const positionItem = item as Position;
            setInitialData({
              id: positionItem.id,
              title: positionItem.title || '',
              employmentType: positionItem.employmentType || 'Please select',
              isCurrentlyWorking: positionItem.isCurrentlyWorking || false,
              startMonth: getMonthName(positionItem.startMonth) || 'Month',
              startYear: positionItem.startYear?.toString() || 'Year',
              endMonth: getMonthName(positionItem.endMonth) || 'Month',
              endYear: positionItem.endYear?.toString() || 'Year',
              location: positionItem.location || '',
              locationType: positionItem.locationType || 'Please select',
              description: positionItem.description || '',
              mediaUrl: positionItem.mediaUrl || '',
              company: positionItem.company || {},
              companyName: positionItem.company?.name || '',
            });
          } else if (type === 'achievement') {
            const achievementItem = item as Achievement;
            console.log(achievementItem, 'achievementItem');
            setInitialData({
              id: achievementItem.id,
              title: achievementItem.title || '',
              description: achievementItem.description || '',
              date: {
                month: getMonthName(achievementItem.startMonth) || 'Month',
                year: achievementItem.startYear?.toString() || 'Year',
              },
              endDate: {
                month: getMonthName(achievementItem.endMonth) || 'Month',
                year: achievementItem.endYear?.toString() || 'Year',
              },
              isCurrentlyWorking: achievementItem.isCurrentlyWorking || false,
              mediaUrl: achievementItem.mediaUrl || '',
              company: achievementItem.company || {},
              companyName: achievementItem.company?.name || '',
            });
          }
        }

        setIsUniversalModalOpen(true);
      } catch (error) {
        console.log('Error fetching detailed data for edit:', error);
        console.log('Error occurred, using item data directly');
        if (type === 'position') {
          const positionItem = item as Position;
          setInitialData({
            id: positionItem.id,
            title: positionItem.title || '',
            employmentType: positionItem.employmentType || 'Please select',
            isCurrentlyWorking: positionItem.isCurrentlyWorking || false,
            startMonth: getMonthName(positionItem.startMonth) || 'Month',
            startYear: positionItem.startYear?.toString() || 'Year',
            endMonth: getMonthName(positionItem.endMonth) || 'Month',
            endYear: positionItem.endYear?.toString() || 'Year',
            location: positionItem.location || '',
            locationType: positionItem.locationType || 'Please select',
            description: positionItem.description || '',
            mediaUrl: positionItem.mediaUrl || '',
            company: positionItem.company || {},
            companyName: positionItem.company?.name || '',
          });
        } else if (type === 'achievement') {
          const achievementItem = item as Achievement;
          setInitialData({
            id: achievementItem.id,
            title: achievementItem.title || '',
            description: achievementItem.description || '',
            date: {
              month: getMonthName(achievementItem.startMonth) || 'Month',
              year: achievementItem.startYear?.toString() || 'Year',
            },
            endDate: {
              month: getMonthName(achievementItem.endMonth) || 'Month',
              year: achievementItem.endYear?.toString() || 'Year',
            },
            isCurrentlyWorking: achievementItem.isCurrentlyWorking || false,
            mediaUrl: achievementItem.mediaUrl || '',
            company: achievementItem.company || {},
            companyName: achievementItem.company?.name || '',
          });
        }
        setIsUniversalModalOpen(true);
      }
    },
    [fetchDetailedData],
  );

  const navigation = useNavigation<any>();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        {/* <Text style={styles.loadingText}>Loading timeline...</Text> */}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            const loadTimelineData = async () => {
              try {
                const response = await fetchMyTimeline(1);
                if (response && response.data && response.data.timeline) {
                  setApiTimelineData(response.data.timeline);
                } else if (response && Array.isArray(response)) {
                  setApiTimelineData(response);
                } else if (
                  response &&
                  response.data &&
                  Array.isArray(response.data)
                ) {
                  setApiTimelineData(response.data);
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
          {showDraft ? 'Timeline' : 'Draft'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Filter unverified companies to show in draft section
  const unverifiedCompanies = timelineData.filter(
    company => !company.company.isVerified,
  );
  const verifiedCompanies = timelineData.filter(
    company => company.company.isVerified,
  );


  // Render the draft section for unverified companies
  const renderDraftSection = () => {
    if (unverifiedCompanies.length === 0) {
      return (
        <View style={styles.draftSection}>
          <Text style={styles.noDraftText}>No draft items available</Text>
        </View>
      );
    }

    return (
      <View style={styles.draftSection}>
        {/* <Text style={styles.draftTitle}>Draft</Text> */}
        {unverifiedCompanies.map((timelineCompany, index) =>
          renderCompanyItem(
            timelineCompany,
            timelineData.indexOf(timelineCompany),
          ),
        )}
      </View>
    );
  };

  const renderActionButtons = (
    item: Position | Achievement,
    type: 'position' | 'achievement',
  ) => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleEditItem(item, type)}
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
          // Check if this is a position or achievement item and call the appropriate API
          if (type === 'position' && item.sourceId) {
            // Navigate to Verification screen with position ID to call fetchPositionsById
            navigation.navigate('Verification', {
              companyId: item.sourceId,
              isPosition: true,
            });
          } else if (type === 'achievement' && item.sourceId) {
            // Navigate to Verification screen with achievement ID to call fetchAchievementsById
            navigation.navigate('Verification', {
              companyId: item.sourceId,
              isPosition: false,
              isAchievement: true,
            });
          } else {
            // For other items, navigate with company ID
            navigation.navigate('Verification', { companyId: item.company.id });
          }
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

  const renderEditButton = (
    item: Position | Achievement,
    type: 'position' | 'achievement',
  ) => (
    <View style={styles.editButtonContainer}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditItem(item, type)}
      >
        <Image
          source={require('../assets/icons/edit.png')}
          style={styles.editIcon}
        />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerifiedSection = (
    validations: Validation[],
    parentItem: Position | Achievement,
  ) => {
    if (!validations || validations.length === 0) return null;

    // For each validation section, we need to maintain its own expanded state
    const sectionKey = validations[0]?.id
      ? `validation-${validations[0].id}`
      : 'validation-section';

    const isExpanded = expandedItems.has(sectionKey);

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
              <Text style={styles.verifiedText}>
                Worked at {validatorRef.company.name} from {validatorDateRange}{' '}
              </Text>
              {/* <Image
                source={
                  validatorRef.company.logo
                    ? { uri: validatorRef.company.logo }
                    : require('../assets/icons/google.png')
                }
                style={styles.verifiedCompanyLogo}
              /> */}
              {/* <Text style={styles.verifiedCompanyName}>
                {validatorRef.company.name} from {validatorDateRange}      
              </Text> */}
              {/* {validatorDateRange && (
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
          <Text style={styles.verifiedTitle}>
            Verified by {validations.length}{' '}
            {validations.length === 1 ? 'person' : 'people'}
          </Text>

          <View style={styles.verifiedControlsRow}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: 'transparent' }]}
              onPress={() => {
                setSelectedEntity(parentItem);
                setIsReadOnly(false); // Open in edit mode
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
                onPress={() => toggleExpand(sectionKey)}
              >
                <View style={styles.showMoreContainer}>
                  <Text style={styles.showMoreText}>
                    {isExpanded
                      ? 'Show Less'
                      : `+${hiddenValidations.length} more`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {visibleValidations.map(renderValidationCard)}

        {isExpanded && hiddenValidations.map(renderValidationCard)}
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

  const handleStatsPress = async (
    itemId: number | string,
    itemType: 'position' | 'achievement',
  ) => {
    setCurrentItemId(itemId);
    setCurrentItemType(itemType);

    let foundItem: Position | Achievement | null = null;
    for (const companyData of timelineData) {
      for (const position of companyData.positions) {
        if (position.id === itemId) {
          foundItem = position;
          break;
        }
        for (const achievement of position.achievements) {
          if (achievement.id === itemId) {
            foundItem = achievement;
            break;
          }
        }
        if (foundItem) break;
      }
      if (foundItem) break;
    }

    if (foundItem && 'sourceId' in foundItem && foundItem.sourceId !== null) {
      const detailedData = await fetchDetailedData(
        foundItem.sourceId,
        foundItem.type,
      );
      if (detailedData) {
        console.log('Detailed data fetched successfully:', detailedData);
      }
    } else {
      console.log('Item not found or has no sourceId:', itemId);
    }
  };

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
            {/* Show timeline line if this is not the last company OR if there are positions */}
          </View>

          <View style={styles.timelineContent}>
            <View style={styles.contentHeader}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{company.name}</Text>
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
                      companyId: company.id,
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

  const handleLikeUnlike = async (
    id: any,
    type: 'position' | 'achievement',
  ) => {
    try {
      // First, find the current item to get its current like count
      let currentItem: Position | Achievement | null = null;
      let currentLikesCount = 0;

      for (const companyData of timelineData) {
        for (const position of companyData.positions) {
          if (position.id === id && position.type === type) {
            currentItem = position;
            currentLikesCount = position.stats.likesCount || 0;
            break;
          }
          for (const achievement of position.achievements) {
            if (achievement.id === id && achievement.type === type) {
              currentItem = achievement;
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

      const currentIsLiked = currentItem.isLiked;
      const newIsLiked = !currentIsLiked;

      // Calculate new likes count
      const newLikesCount = newIsLiked
        ? currentLikesCount + 1
        : Math.max(0, currentLikesCount - 1);

      // Update the state optimistically
      setApiTimelineData(prevData => {
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

      // Make the API call in the background
      likeUnlikeTimeline(id, type)
        .then(response => {
          if (response.data.success) {
            const serverIsLiked = response.data.data.action === 'liked';
            const serverLikesCount = response.data.data.likesCount;

            // If server response differs from our optimistic update, sync with server
            if (
              serverIsLiked !== newIsLiked ||
              (serverLikesCount !== undefined &&
                serverLikesCount !== newLikesCount)
            ) {
              console.log('Server response differs, syncing...');

              setApiTimelineData(prevData => {
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
          // If API fails, revert to original state
          setTimeout(() => {
            setApiTimelineData(prevData => {
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
          }, 1000); // Small delay before reverting
        });
    } catch (error: any) {
      console.log('Error in handleLikeUnlike:', error.response || error);
    }
  };

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
    const itemId = `position-${position.id}`;
    const isExpanded = expandedItems.has(itemId);
    const description = position.description || '';
    const shouldTruncate = needsTruncation(description);

    const shouldShowTimelineLine =
      !isLastPosition || hasAchievements || !isLastOverallItem;

    return (
      <View style={[styles.timelineItem, styles.roleItem]} key={itemId}>
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
            {renderActionButtons(position, 'position')}
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
                      {position.hrVerified ? 'HR' : 'Not Verified'}
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
          <View style={styles.dateContainer}>
            <Image
              source={require('../assets/icons/calendar.png')}
              style={styles.calendarIcon}
            />
            <Text style={styles.dateText}>{position.dateRange}</Text>
          </View>
          {/* Title */}

          {/* Images */}
          {renderImages(position.mediaUrl)}

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
              {renderActionButtons(achievement, 'achievement')}
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
                      {isExpanded ? 'See Less' : 'See More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Stats Row with Bottom Badge */}
            <View style={styles.cardFooter}>
              <View style={styles.statsContainer}>
                {/* Like Section - Two separate containers */}
                <View style={styles.likeSection}>
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

                {/* Comment Section */}
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

  const loadMoreTimeline = async () => {
    if (pagination.hasNext && !loadingMore) {
      const nextPage = pagination.currentPage + 1;
      await loadTimelineData(nextPage);
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
          onPress={loadMoreTimeline}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getMonthNumber = (monthName: string): number | null => {
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
    const index = monthNames.indexOf(monthName);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <View style={styles.container}>
      {(!timelineData || timelineData.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No timeline data available</Text>
          <Text style={styles.emptySubText}>
            Start by adding your first position or achievement!
          </Text>
          {renderAddButton()}
        </View>
      ) : (
        <>
          {renderAddButton()}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {showDraft ? (
              renderDraftSection()
            ) : verifiedCompanies.length > 0 ? (
              verifiedCompanies.map((timelineCompany, index) =>
                renderCompanyItem(timelineCompany, index),
              )
            ) : (
              <View style={styles.draftSection}>
                <Text style={styles.noDraftText}>
                  No verified timeline items available
                </Text>
              </View>
            )}
            <LoadMoreButton />
          </ScrollView>
        </>
      )}
      <AddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Item"
        placeholder="Search options..."
        options={sampleOptions}
        onSelect={handleSelect}
        searchable={false}
        multiple={false}
        achievementType="career"
        refreshTimeline={refreshTimeline}
      />
      <UniversalFormModal
        isOpen={isUniversalModalOpen}
        onClose={() => {
          setIsUniversalModalOpen(false);
          setInitialData(null);
        }}
        mode="edit"
        type={modalType || 'position'}
        initialData={initialData}
        onSubmit={updatedData => {
          console.log('Updated data received:', updatedData);

          // Update the timeline data immediately
          if (modalType === 'position') {
            setApiTimelineData(prevData => {
              return prevData.map(companyData => {
                // Check if this company has the position being edited
                const updatedPositions = companyData.positions.map(pos => {
                  if (pos.id === (updatedData as any).id) {
                    // Update the position with new data
                    return {
                      ...pos,
                      title: (updatedData as any).title || pos.title,
                      description:
                        (updatedData as any).description || pos.description,
                      startMonth: (updatedData as any).startMonth
                        ? getMonthNumber((updatedData as any).startMonth)
                        : pos.startMonth,
                      startYear:
                        (updatedData as any).startYear || pos.startYear,
                      endMonth: (updatedData as any).endMonth
                        ? getMonthNumber((updatedData as any).endMonth)
                        : pos.endMonth,
                      endYear: (updatedData as any).endYear || pos.endYear,
                      isCurrentlyWorking:
                        (updatedData as any).isCurrentlyWorking ??
                        pos.isCurrentlyWorking,
                      employmentType:
                        (updatedData as any).employmentType ||
                        pos.employmentType,
                      location: (updatedData as any).location || pos.location,
                      locationType:
                        (updatedData as any).locationType || pos.locationType,
                      mediaUrl: (updatedData as any).mediaUrl || pos.mediaUrl,
                    };
                  }
                  return pos;
                });

                return {
                  ...companyData,
                  positions: updatedPositions,
                };
              });
            });
          } else if (modalType === 'achievement') {
            setApiTimelineData(prevData => {
              return prevData.map(companyData => {
                const updatedPositions = companyData.positions.map(pos => {
                  // Check achievements within each position
                  const updatedAchievements = pos.achievements.map(ach => {
                    if (ach.id === (updatedData as any).id) {
                      return {
                        ...ach,
                        title: (updatedData as any).title || ach.title,
                        description:
                          (updatedData as any).description || ach.description,
                        startMonth: (updatedData as any).date?.month
                          ? getMonthNumber((updatedData as any).date?.month)
                          : ach.startMonth,
                        startYear:
                          (updatedData as any).date?.year || ach.startYear,
                        endMonth: (updatedData as any).endDate?.month
                          ? getMonthNumber((updatedData as any).endDate?.month)
                          : ach.endMonth,
                        endYear:
                          (updatedData as any).endDate?.year || ach.endYear,
                        isCurrentlyWorking:
                          (updatedData as any).isCurrentlyActive ??
                          ach.isCurrentlyWorking,
                        mediaUrl: (updatedData as any).mediaUrl || ach.mediaUrl,
                      };
                    }
                    return ach;
                  });

                  return {
                    ...pos,
                    achievements: updatedAchievements,
                  };
                });

                return {
                  ...companyData,
                  positions: updatedPositions,
                };
              });
            });
          }

          setIsUniversalModalOpen(false);
          setInitialData(null);
        }}
        refreshTimeline={refreshTimeline}
      />
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

      {/* Validations Modal */}
      <ValidationsListModal
        visible={isValidationsModalOpen}
        onClose={() => {
          setIsValidationsModalOpen(false);
          loadTimelineData(1);
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
    color: '#666666',
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
    color: '#FF0000',
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
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButtonContainer: {
    flexDirection: 'row',
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
  draftButtonTextActive: {
    fontSize: moderateScale(14),
    color: '#ffffffff',
    fontWeight: '500',
  },
  draftButtonText: {
    fontSize: moderateScale(14),
    color: '#000000',
    fontWeight: '500',
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
  draftTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: verticalScale(10),
  },
  listContent: {
    paddingVertical: verticalScale(10),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(25),
    paddingHorizontal: moderateScale(15),
    paddingRight: moderateScale(20),
  },
  companyItem: {
    marginBottom: verticalScale(15),
  },
  roleItem: {
    marginLeft: moderateScale(25),
  },
  achievementItem: {
    // marginLeft: moderateScale(1),
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
    width: moderateScale(20),
    height: moderateScale(20),
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#EBEBEB',
    marginTop: verticalScale(5),
    minHeight: verticalScale(20), // Increased from 10 to 20 for better visibility
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    flexWrap: 'nowrap', // Prevent wrapping
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow it to take available space
    flexShrink: 1, // Allow shrinking if needed
    // marginTop: verticalScale(-18),
  },
  dateContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow it to take available space
    flexShrink: 1, // Allow shrinking if needed
    marginTop: -verticalScale(18),
  },
  calendarIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: moderateScale(6),
  },
  dateText: {
    fontSize: moderateScale(14), // Reduced from 20 to 14
    color: '#666666',
    fontWeight: '500',
    paddingTop: verticalScale(1),
    flexShrink: 1, // Allow text to shrink if needed
  },

  actionButtons: {
    flexDirection: 'row',
    flexShrink: 0, // Prevent shrinking
    marginLeft: moderateScale(8), // Add margin for spacing
  },

  actionsContainer: {
    flexDirection: 'row',
    flexShrink: 0, // Prevent shrinking
    marginLeft: moderateScale(8), // Add margin for spacing
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
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
    // width:"45%"
  },
  companyTitle: {
    color: '#4285F4',
    fontSize: moderateScale(18),
  },
  roleTitle: {
    color: '#000000',
    fontSize: moderateScale(18),
  },
  achievementTitle: {
    color: '#222222',
    fontSize: moderateScale(18),
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
  statsContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(12),
    justifyContent: 'flex-start',
    gap: moderateScale(10),
    // marginTop: verticalScale(12),
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
    color: '#666666',
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
    // marginHorizontal: moderateScale(4),
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
    fontSize: moderateScale(16),
    color: '#000000',
    fontWeight: '600',
  },
  googleDates: {
    fontSize: moderateScale(16),
    color: '#666666',
    marginBottom: verticalScale(8),
  },
  relationshipIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    marginRight: moderateScale(6),
    marginTop: verticalScale(1),
  },
  editButtonContainer: {
    alignItems: 'center',
    backgroundColor: '#000000ff',
    borderRadius: moderateScale(25),
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    alignItems: 'center',
  },
  editIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    marginRight: moderateScale(6),
    tintColor: '#FFFFFF',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  descriptionContainer: {
    // marginBottom: verticalScale(12),
  },
  seeMoreButton: {
    alignSelf: 'flex-start',
    // marginTop: verticalScale(4),
  },
  seeMore: {
    color: '#4285F4',
    fontWeight: '600',
    fontSize: moderateScale(14),
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
    color: '#000000',
    fontSize: verticalScale(14),
    fontWeight: '500',
    marginLeft: verticalScale(8),
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
    color: '#99999',
    fontStyle: 'italic',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  checkedIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginLeft: moderateScale(8),
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
    color: '#000000',
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
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
  achievementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  editIcon1: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: '#666',
  },
  achievementBadgeContainer: {
    width: '60%',
    marginLeft: -moderateScale(10),
    marginBottom: verticalScale(8),
  },
  skillBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(10),
  },
  skillBadgeText: {
    fontSize: moderateScale(14),
    color: '#ffffff',
  },
  showMoreButton: {
    // marginTop: verticalScale(8),
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
    marginTop: -verticalScale(10),
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
    width: '90%',
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
    marginTop: verticalScale(-16),
    marginLeft: -moderateScale(8),
  },
});

export default ProfileTimeline;
