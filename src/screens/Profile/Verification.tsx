import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect, ReactNode } from 'react';
import FAQComponent from '../../components/Faq';
import VerificationSystem from '../../components/Hr';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  fetchCompanyVerificationListById,
  fetchPositionsById,
  fetchAchievementsById,
  fetchEducationVerificationListById,
  getEducationByid,
  getEducationAchievementById,
  fetchHobbiesById,
  getHobbyById,
  getSkillById,
  getAspirationById,
  fetchSectionAchievementById,
} from '../../api/service';

// Define TypeScript interfaces for the API response
interface Position {
  id: number;
  title: string;
  employmentType: string;
  dateRange: string;
  description: string;
  validationStatus: 'verified' | 'pending' | 'rejected';
  validationScore: number;
  isCurrentlyWorking: boolean;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
}

interface Achievement {
  id: number;
  title: string;
  dateRange: string;
  description: string;
  validationStatus: 'verified' | 'pending' | 'rejected';
  validationScore: number;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
}

interface Education {
  id: number;
  degree: string;
  fieldOfStudy: string;
  grade: string;
  dateRange: string;
  description: string;
  isVerified: boolean;
  isCurrentlyStudying: boolean;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
}

interface School {
  id: number;
  name: string;
  logo: string;
}

interface EducationVerificationData {
  school: School;
  educations: Education[];
  achievements: Achievement[];
  summary: {
    educationsCount: number;
    achievementsCount: number;
  };
}

interface Company {
  id: number;
  name: string;
  logo: string;
  uniqueAddress: string;
}

interface CompanyVerificationData {
  company: Company;
  positions: Position[];
  achievements: Achievement[];
  summary: {
    totalItems: number;
    positionsCount: number;
    achievementsCount: number;
    verifiedItems: number;
    verificationRate: number;
  };
}

interface Hobby {
  id: number;
  title: string;
  skillLevel: string;
  description: string;
  location: string;
  dateRange: string;
}

interface MasterHobby {
  id: number;
  name: string;
  image: string;
}

interface HobbyVerificationData {
  masterHobby: MasterHobby;
  entries: Hobby[];
  achievements?: Achievement[];
}

interface Skill {
  dateRange: ReactNode;
  id: number;
  userId: number;
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
  likesCount: number;
  commentsCount: number;
  status: boolean;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  verificationCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    fullName: string;
    profilePicture: string;
    isVerified: boolean;
  };
  isLiked: boolean;
}

interface SkillVerificationData {
  skill: Skill;
  achievements?: Achievement[];
}

// Define interface for Aspiration
interface Aspiration {
  id: number;
  userId: number;
  goal: string;
  whyItMatters: string;
  targetMonth: number;
  targetYear: number;
  mediaUrl: string;
  status: boolean;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  verificationCount: number;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  dateRange: string;
}

interface AspirationVerificationData {
  aspiration: Aspiration;
  mediaUrl: string;
  achievements?: Achievement[];
}

// Define the interface for position details response
interface PositionDetailsResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    position: Position & {
      company: Company;
    };
  };
  error: string | null;
}

const VerificationSelectionSystem = ({ navigation }: { navigation: any }) => {
  const createUniqueId = (
    id: number,
    type:
      | 'position'
      | 'achievement'
      | 'education'
      | 'hobby'
      | 'skill'
      | 'aspiration',
  ) => `${type}-${id}`;

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [companyData, setCompanyData] =
    useState<CompanyVerificationData | null>(null);
  const [educationData, setEducationData] =
    useState<EducationVerificationData | null>(null);
  const [hobbyData, setHobbyData] = useState<HobbyVerificationData | null>(
    null,
  );
  const [skillData, setSkillData] = useState<SkillVerificationData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aspirationData, setAspirationData] =
    useState<AspirationVerificationData | null>(null);
  const route = useRoute();
  const {
    companyId,
    schoolId,
    educationId,
    achievementId,
    hobbyId,
    skillId,
    aspirationId,
    isPosition,
    isAchievement,
    isHobbyGroup,
    isHobbyEntry,
    isSkill,
    isAspiration,
    masterHobbyId,
  } = (route.params || {}) as {
    companyId?: number;
    schoolId?: number;
    educationId?: number;
    achievementId?: number;
    hobbyId?: number;
    skillId?: number;
    aspirationId?: number;
    isPosition?: boolean;
    isAchievement?: boolean;
    isHobbyGroup?: boolean;
    isHobbyEntry?: boolean;
    isSkill?: boolean;
    isAspiration?: boolean;
    masterHobbyId?: number;
  };

  useEffect(() => {
    if (companyId) {
      if (isPosition) {
        fetchPositionDetails(companyId);
      } else if (isAchievement) {
        fetchAchievementDetails(companyId);
      } else {
        fetchCompanyVerificationList(companyId);
      }
    } else if (educationId) {
      // If educationId is provided, fetch specific education data
      fetchEducationById(educationId);
    } else if (achievementId) {
      console.log(achievementId, 'sddsdsdsd');
      console.log(isHobbyGroup, 'asdsdfsfdfdf');
      // If achievementId is provided, check types
      if (skillId) {
        fetchSectionAchievementDetails(achievementId, skillId, 'skill');
      } else if ((isHobbyEntry || isHobbyGroup) && hobbyId) {
        fetchSectionAchievementDetails(achievementId, hobbyId, 'hobby');
      } else if (isAspiration && aspirationId) {
        fetchSectionAchievementDetails(
          achievementId,
          aspirationId,
          'aspiration',
        );
      } else {
        // Default to education achievement if no other type specified
        fetchEducationAchievementById(achievementId);
      }
    } else if (schoolId) {
      // If schoolId is provided, fetch education verification data
      fetchEducationVerificationList(schoolId);
    } else if (hobbyId) {
      // If hobbyId is provided, determine if it's a group or entry and fetch accordingly
      if (isHobbyGroup) {
        fetchHobbyGroupDetails(hobbyId);
      } else if (isHobbyEntry) {
        fetchHobbyEntryDetails(hobbyId);
      }
    } else if (skillId) {
      // If skillId is provided and isSkill flag is true, fetch skill data
      fetchSkillDetails(skillId);
    } else if (aspirationId && isAspiration) {
      // If aspirationId is provided and isAspiration flag is true, fetch aspiration data
      fetchAspirationDetails(aspirationId);
    }
  }, [
    companyId,
    schoolId,
    educationId,
    achievementId,
    hobbyId,
    skillId,
    aspirationId,
    isPosition,
    isAchievement,
    isHobbyGroup,
    isHobbyEntry,
    isSkill,
    isAspiration,
  ]);

  const fetchSectionAchievementDetails = async (
    achievementId: number,
    parentId: number,
    type: 'skill' | 'hobby' | 'aspiration',
  ) => {
    console.log(type, 'type 1223');
    try {
      setLoading(true);
      setError(null);

      // Use the fetchSectionAchievementById API directly to get the achievement details
      const response = await fetchSectionAchievementById(achievementId);
      console.log('Section achievement details response:', response?.data);

      if (response && response.data.success) {
        const achievement = response.data.data;

        // Format the date range using the helper function
        const formattedDateRange = formatDateRange(
          achievement.startMonth,
          achievement.startYear,
          achievement.endMonth,
          achievement.endYear,
          achievement.isCurrentlyActive,
        );

        const updatedAchievement = {
          ...achievement,
          dateRange: formattedDateRange,
          validationStatus: achievement.isVerified ? 'verified' : 'pending',
          validationScore: achievement.verificationCount || 0,
        };

        // Set the appropriate state based on the type
        if (type === 'skill') {
          // For skill achievements, we still need to get the skill details to show alongside the achievement
          const skillResponse = await getSkillById(parentId);
          if (skillResponse && skillResponse.data.success) {
            const mockSkillData: SkillVerificationData = {
              skill: skillResponse.data.data.skill,
              achievements: [updatedAchievement],
            };
            setSkillData(mockSkillData);
            setSelectedItem(
              createUniqueId(updatedAchievement.id, 'achievement'),
            );
          } else {
            setError('Failed to fetch parent skill details');
          }
        } else if (type === 'hobby') {
          // For hobby achievements, we still need to get the hobby details to show alongside the achievement
          const hobbyResponse = await getHobbyById(parentId);
          if (hobbyResponse && hobbyResponse.data.success) {
            const masterHobby = hobbyResponse.data.data.hobby || {
              name: 'Hobby',
              image: '',
            };
            const mockHobbyData: HobbyVerificationData = {
              masterHobby: masterHobby,
              entries: [], // We don't need entries if we are showing achievements
              achievements: [updatedAchievement],
            };
            setHobbyData(mockHobbyData);
            setSelectedItem(
              createUniqueId(updatedAchievement.id, 'achievement'),
            );
          } else {
            setError('Failed to fetch parent hobby details');
          }
        } else if (type === 'aspiration') {
          // For aspiration achievements, we still need to get the aspiration details to show alongside the achievement
          const aspirationResponse = await getAspirationById(parentId);
          if (aspirationResponse && aspirationResponse.data.success) {
            const mockAspirationData: AspirationVerificationData = {
              aspiration: aspirationResponse.data.data.aspiration,
              mediaUrl: '',
              achievements: [updatedAchievement],
            };
            setAspirationData(mockAspirationData);
            setSelectedItem(
              createUniqueId(updatedAchievement.id, 'achievement'),
            );
          } else {
            setError('Failed to fetch parent aspiration details');
          }
        }
      } else {
        setError(
          response?.data?.message || 'Failed to fetch achievement details',
        );
      }
    } catch (err) {
      console.error('Error fetching section achievement details:', err);
      setError('Error fetching achievement details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHobbyGroupDetails = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchHobbiesById(id);
      console.log('Hobby group details response:', response.data);
      if (response.data.success) {
        // Extract all achievements from entries and flatten them into a single array
        const allEntryAchievements: Achievement[] = [];
        if (response.data.data.entries) {
          response.data.data.entries.forEach((entry: any) => {
            if (entry.achievements && entry.achievements.length > 0) {
              entry.achievements.forEach((achievement: any) => {
                allEntryAchievements.push({
                  ...achievement,
                  validationStatus: achievement.isVerified
                    ? 'verified'
                    : 'pending',
                  validationScore: achievement.verificationCount || 0,
                  dateRange:
                    achievement.dateRange ||
                    formatDateRange(
                      achievement.startMonth,
                      achievement.startYear,
                      achievement.endMonth,
                      achievement.endYear,
                      achievement.isCurrentlyActive,
                    ),
                });
              });
            }
          });
        }

        // Combine with any top-level achievements that might exist
        const topLevelAchievements =
          response.data.data.achievements?.map((achievement: any) => ({
            ...achievement,
            validationStatus: achievement.isVerified ? 'verified' : 'pending',
            validationScore: achievement.verificationCount || 0,
            dateRange:
              achievement.dateRange ||
              formatDateRange(
                achievement.startMonth,
                achievement.startYear,
                achievement.endMonth,
                achievement.endYear,
                achievement.isCurrentlyActive,
              ),
          })) || [];

        // Combine all achievements (from entries + top-level)
        const allAchievements = [
          ...allEntryAchievements,
          ...topLevelAchievements,
        ];

        // Process the response data with flattened achievements
        const processedData = {
          ...response.data.data,
          entries: response.data.data.entries || [],
          achievements: allAchievements,
        };
        setHobbyData(processedData);
        // Set default selection to the first entry if available
        if (processedData.entries && processedData.entries.length > 0) {
          setSelectedItem(createUniqueId(processedData.entries[0].id, 'hobby'));
        } else if (
          processedData.achievements &&
          processedData.achievements.length > 0
        ) {
          // If no entries but there are achievements, select the first achievement
          setSelectedItem(
            createUniqueId(processedData.achievements[0].id, 'achievement'),
          );
        }
      } else {
        setError(
          response.data.message || 'Failed to fetch hobby group details',
        );
      }
    } catch (err) {
      console.error('Error fetching hobby group details:', err);
      setError('Error fetching hobby group details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHobbyEntryDetails = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getHobbyById(id);
      console.log('Hobby entry details response:', response.data);
      if (response.data.success) {
        // Create hobby data structure from the response
        const hobby = response.data.data.userHobby;
        // Format the date range using the helper function
        const formattedDateRange = formatDateRange(
          hobby.startMonth,
          hobby.startYear,
          hobby.endMonth,
          hobby.endYear,
          hobby.isHobbyActive,
        );
        const updatedHobby = {
          ...hobby,
          dateRange: formattedDateRange,
        };
        const masterHobby = hobby.hobby;
        const mockHobbyData: HobbyVerificationData = {
          masterHobby: masterHobby,
          entries: [updatedHobby],
        };
        setHobbyData(mockHobbyData);
        setSelectedItem(createUniqueId(updatedHobby.id, 'hobby'));
      } else {
        setError(
          response.data.message || 'Failed to fetch hobby entry details',
        );
      }
    } catch (err) {
      console.error('Error fetching hobby entry details:', err);
      setError('Error fetching hobby entry details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationById = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEducationByid(id);
      console.log('Education by ID response:', response.data);
      if (response.data.success) {
        // Create education data structure from the response
        const education = response.data.data.education;
        // Format the date range using the helper function
        const formattedDateRange = formatDateRange(
          education.startMonth,
          education.startYear,
          education.endMonth,
          education.endYear,
          education.isCurrentlyStudying,
        );
        const updatedEducation = {
          ...education,
          dateRange: formattedDateRange,
        };
        const school = education.school;
        const mockEducationData: EducationVerificationData = {
          school: school,
          educations: [updatedEducation],
          achievements: [],
          summary: {
            educationsCount: 1,
            achievementsCount: 0,
          },
        };
        setEducationData(mockEducationData);
      } else {
        setError(response.data.message || 'Failed to fetch education details');
      }
    } catch (err) {
      console.error('Error fetching education by ID:', err);
      setError('Error fetching education details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationAchievementById = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEducationAchievementById(id);
      console.log('Education achievement by ID response:', response.data);
      if (response.data.success) {
        // Create education data structure from the response
        const achievement = response.data.data.achievement;
        // Format the date range using the helper function
        const formattedDateRange = formatDateRange(
          achievement.startMonth,
          achievement.startYear,
          achievement.endMonth,
          achievement.endYear,
          achievement.isCurrentlyActive,
        );
        const updatedAchievement = {
          ...achievement,
          dateRange: formattedDateRange,
        };
        const school = achievement.school;
        const mockEducationData: EducationVerificationData = {
          school: school,
          educations: [],
          achievements: [updatedAchievement],
          summary: {
            educationsCount: 0,
            achievementsCount: 1,
          },
        };
        setEducationData(mockEducationData);
      } else {
        setError(
          response.data.message || 'Failed to fetch achievement details',
        );
      }
    } catch (err) {
      console.error('Error fetching education achievement by ID:', err);
      setError('Error fetching achievement details');
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationVerificationList = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchEducationVerificationListById(id);
      console.log('Education verification list response:', response.data);
      if (response.data.success) {
        setEducationData(response.data.data);
        // Set default selection to the first education if available, otherwise first achievement
        if (
          response.data.data.educations &&
          response.data.data.educations.length > 0
        ) {
          setSelectedItem(
            createUniqueId(response.data.data.educations[0].id, 'education'),
          );
        } else if (
          response.data.data.achievements &&
          response.data.data.achievements.length > 0
        ) {
          setSelectedItem(
            createUniqueId(
              response.data.data.achievements[0].id,
              'achievement',
            ),
          );
        }
      } else {
        setError(
          response.data.message ||
            'Failed to fetch education verification list',
        );
      }
    } catch (err) {
      console.error('Error fetching education verification list:', err);
      setError('Error fetching education verification list');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyVerificationList = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCompanyVerificationListById(id);
      console.log('Company verification list response:', response.data);
      if (response.data.success) {
        setCompanyData(response.data.data);
        // Set default selection to the first position if available, otherwise first achievement
        if (
          response.data.data.positions &&
          response.data.data.positions.length > 0
        ) {
          setSelectedItem(
            createUniqueId(response.data.data.positions[0].id, 'position'),
          );
        } else if (
          response.data.data.achievements &&
          response.data.data.achievements.length > 0
        ) {
          setSelectedItem(
            createUniqueId(
              response.data.data.achievements[0].id,
              'achievement',
            ),
          );
        }
      } else {
        setError(
          response.data.message || 'Failed to fetch company verification list',
        );
      }
    } catch (err) {
      console.error('Error fetching company verification list:', err);
      setError('Error fetching company verification list');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionDetails = async (positionId: number) => {
    console.log(positionId, 'position id');
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPositionsById(positionId);
      console.log('Position details response:', response);
      if (response.data.success) {
        // Create company data structure from the position details
        const position = response.data.data.position;
        // Format the date range using the helper function
        const formattedDateRange = formatDateRange(
          position.startMonth,
          position.startYear,
          position.endMonth,
          position.endYear,
          position.isCurrentlyWorking,
        );
        const updatedPosition = {
          ...position,
          dateRange: formattedDateRange,
        };
        const company = position.company;
        const mockCompanyData: CompanyVerificationData = {
          company: company,
          positions: [updatedPosition],
          achievements: [],
          summary: {
            totalItems: 1,
            positionsCount: 1,
            achievementsCount: 0,
            verifiedItems:
              updatedPosition.validationStatus === 'verified' ? 1 : 0,
            verificationRate:
              updatedPosition.validationStatus === 'verified' ? 10 : 0,
          },
        };
        setCompanyData(mockCompanyData);
        setSelectedItem(createUniqueId(updatedPosition.id, 'position'));
      } else {
        setError(response.data.message || 'Failed to fetch position details');
      }
    } catch (err: any) {
      console.error('Error fetching position details:', err.response);
      setError('Error fetching position details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievementDetails = async (achievementId: number) => {
    console.log(achievementId, 'achievement id');
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAchievementsById(achievementId);
      console.log('Achievement details response:', response);
      if (response.data.success) {
        // Create company data structure from the achievement details
        const achievement = response.data.data.achievement;
        // Format the date range using the helper function
        const formattedDateRange = formatDateRange(
          achievement.startMonth,
          achievement.startYear,
          achievement.endMonth,
          achievement.endYear,
          achievement.isCurrentlyWorking || false, // Using isCurrentlyWorking or default to false
        );
        const updatedAchievement = {
          ...achievement,
          dateRange: formattedDateRange,
        };
        const company = achievement.company;
        const mockCompanyData: CompanyVerificationData = {
          company: company,
          positions: [],
          achievements: [updatedAchievement],
          summary: {
            totalItems: 1,
            positionsCount: 0,
            achievementsCount: 1,
            verifiedItems:
              updatedAchievement.validationStatus === 'verified' ? 1 : 0,
            verificationRate:
              updatedAchievement.validationStatus === 'verified' ? 10 : 0,
          },
        };
        setCompanyData(mockCompanyData);
        setSelectedItem(createUniqueId(updatedAchievement.id, 'achievement'));
      } else {
        setError(
          response.data.message || 'Failed to fetch achievement details',
        );
      }
    } catch (err: any) {
      console.error('Error fetching achievement details:', err.response);
      setError('Error fetching achievement details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillDetails = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSkillById(id);
      console.log('Skill details response:', response.data);
      if (response.data.success) {
        console.log(response.data, 'rrrrrrrrrrrrrrrrr');
        // Create skill data structure from the response
        const skill = response.data.data.skill;
        // Format the date range using the helper function
        const formattedDateRange = formatDateRange(
          skill.startMonth,
          skill.startYear,
          skill.endMonth,
          skill.endYear,
          skill.isCurrentlyActive,
        );
        const updatedSkill = {
          ...skill,
          dateRange: formattedDateRange,
        };
        const skillDataWithInfo: SkillVerificationData = {
          skill: updatedSkill,
        };
        setSkillData(skillDataWithInfo);
      } else {
        setError(response.data.message || 'Failed to fetch skill details');
      }
    } catch (err) {
      console.error('Error fetching skill details:', err);
      setError('Error fetching skill details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAspirationDetails = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAspirationById(id);
      console.log('Aspiration details response:', response.data);
      if (response.data.success) {
        // Create aspiration data structure from the response
        const aspiration = response.data.data.aspiration;
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
        const monthName = months[aspiration.targetMonth - 1] || '';
        const formattedDateRange = `${monthName} ${aspiration.targetYear}`;
        const updatedAspiration = {
          ...aspiration,
          dateRange: formattedDateRange,
        };
        const aspirationData: AspirationVerificationData = {
          aspiration: updatedAspiration,
          mediaUrl: response.data.data.mediaUrl,
        };
        // Set the aspiration data to be displayed in the current screen
        setAspirationData(aspirationData);
      } else {
        setError(response.data.message || 'Failed to fetch aspiration details');
      }
    } catch (err) {
      console.error('Error fetching aspiration details:', err);
      setError('Error fetching aspiration details');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date range
  const formatDateRange = (
    startMonth: number | null,
    startYear: number | null,
    endMonth: number | null,
    endYear: number | null,
    isCurrentlyStudying: boolean = false,
  ) => {
    if (!startMonth || !startYear) return '';

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

    const startMonthName = months[startMonth - 1];
    const startDate = `${startMonthName} ${startYear}`;

    if (isCurrentlyStudying) {
      return `${startDate} - Present`;
    }

    if (endMonth && endYear) {
      const endMonthName = months[endMonth - 1];
      return `${startDate} - ${endMonthName} ${endYear}`;
    }

    return startDate;
  };

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelect = (
    id: number,
    type:
      | 'position'
      | 'achievement'
      | 'education'
      | 'hobby'
      | 'skill'
      | 'aspiration',
  ) => {
    const uniqueId = createUniqueId(id, type);
    setSelectedItems(prev => {
      if (prev.includes(uniqueId)) {
        // If already selected, remove it (toggle off)
        return prev.filter(item => item !== uniqueId);
      } else {
        // If not selected, add it (toggle on)
        return [...prev, uniqueId];
      }
    });
  };

  const renderHobbyCard = (hobby: Hobby) => {
    const itemUniqueId = createUniqueId(hobby.id, 'hobby');
    const isSelected = selectedItems.includes(itemUniqueId);

    return (
      <TouchableOpacity
        key={itemUniqueId}
        style={[
          verificationStyles.card,
          isSelected && verificationStyles.selectedCard,
        ]}
        onPress={() => handleSelect(hobby.id, 'hobby')}
      >
        {/* Hobby Info */}
        <View style={verificationStyles.companyInfo}>
          <View style={verificationStyles.companyLogo}>
            {hobbyData?.masterHobby.image ? (
              <Image
                source={{ uri: hobbyData.masterHobby.image }}
                style={verificationStyles.logoImage}
              />
            ) : (
              <Text style={verificationStyles.companyInitial}>
                {hobbyData?.masterHobby.name.charAt(0) || 'H'}
              </Text>
            )}
          </View>
          <View style={verificationStyles.companyDetails}>
            <Text
              style={[
                verificationStyles.achievementTitle,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {hobby.title}
            </Text>

            {/* <Text
              style={[
                verificationStyles.employmentType,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              Skill Level: {hobby.skillLevel}
            </Text> */}
            <View style={verificationStyles.dateContainer}>
              <Image
                source={require('../../assets/icons/calendar.png')}
                style={[
                  verificationStyles.calendarIcon,
                  isSelected && verificationStyles.selectedIcon,
                ]}
              />
              <Text
                style={[
                  verificationStyles.dateText,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                {hobby.dateRange}
              </Text>
            </View>
          </View>
        </View>

        {/* Location */}
        {/* <View style={verificationStyles.dateContainer}>
          <Image
            source={require('../../assets/icons/calendar.png')}
            style={[verificationStyles.calendarIcon, isSelected && verificationStyles.selectedIcon]}
          />
          <Text style={[verificationStyles.dateText, isSelected && verificationStyles.selectedText]}>
            {hobby.location}
          </Text>
        </View> */}

        {/* Description */}
        <Text
          style={[
            verificationStyles.description,
            isSelected && verificationStyles.selectedText,
          ]}
        >
          {hobby.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPositionCard = (position: Position) => {
    const itemUniqueId = createUniqueId(position.id, 'position');
    const isSelected = selectedItems.includes(itemUniqueId);

    return (
      <TouchableOpacity
        key={itemUniqueId}
        style={[
          verificationStyles.card,
          isSelected && verificationStyles.selectedCard,
        ]}
        onPress={() => handleSelect(position.id, 'position')}
      >
        {/* Company Info */}
        <View style={verificationStyles.companyInfo}>
          <View style={verificationStyles.companyLogo}>
            {companyData?.company.logo ? (
              <Image
                source={{ uri: companyData.company.logo }}
                style={verificationStyles.logoImage}
              />
            ) : (
              <Text style={verificationStyles.companyInitial}>
                {companyData?.company.name.charAt(0) || 'C'}
              </Text>
            )}
          </View>
          <View style={verificationStyles.companyDetails}>
            <Text
              style={[
                verificationStyles.companyName,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {companyData?.company.name}
            </Text>
            <Text
              style={[
                verificationStyles.positionTitle,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {position.title}
            </Text>
            <Text
              style={[
                verificationStyles.employmentType,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {position.employmentType}
            </Text>
          </View>
        </View>

        {/* Date Range */}
        <View style={verificationStyles.dateContainer}>
          <Image
            source={require('../../assets/icons/calendar.png')}
            style={[
              verificationStyles.calendarIcon,
              isSelected && verificationStyles.selectedIcon,
            ]}
          />
          <Text
            style={[
              verificationStyles.dateText,
              isSelected && verificationStyles.selectedText,
            ]}
          >
            {position.dateRange}
          </Text>
        </View>

        {/* Description */}
        <Text
          style={[
            verificationStyles.description,
            isSelected && verificationStyles.selectedText,
          ]}
        >
          {position.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEducationCard = (education: Education) => {
    const itemUniqueId = createUniqueId(education.id, 'education');
    const isSelected = selectedItems.includes(itemUniqueId);

    return (
      <TouchableOpacity
        key={itemUniqueId}
        style={[
          verificationStyles.card,
          isSelected && verificationStyles.selectedCard,
        ]}
        onPress={() => handleSelect(education.id, 'education')}
      >
        {/* School Info */}
        <View style={verificationStyles.companyInfo}>
          <View style={verificationStyles.companyLogo}>
            {educationData?.school.logo ? (
              <Image
                source={{ uri: educationData.school.logo }}
                style={verificationStyles.logoImage}
              />
            ) : (
              <Text style={verificationStyles.companyInitial}>
                {educationData?.school.name.charAt(0) || 'S'}
              </Text>
            )}
          </View>
          <View style={verificationStyles.companyDetails}>
            <Text
              style={[
                verificationStyles.companyName,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {educationData?.school.name}
            </Text>
            {/* <Text
              style={[
                verificationStyles.positionTitle,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {education.degree}
            </Text>
            <Text
              style={[
                verificationStyles.employmentType,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {education.fieldOfStudy}
            </Text> */}
            <View style={verificationStyles.dateContainer}>
              <Image
                source={require('../../assets/icons/calendar.png')}
                style={[
                  verificationStyles.calendarIcon,
                  isSelected && verificationStyles.selectedIcon,
                ]}
              />
              <Text
                style={[
                  verificationStyles.dateText,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                {education.dateRange}
              </Text>
            </View>
          </View>
        </View>

        {/* Date Range */}

        {/* Description */}
        <Text
          style={[
            verificationStyles.description,
            isSelected && verificationStyles.selectedText,
          ]}
        >
          {education.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const itemUniqueId = createUniqueId(achievement.id, 'achievement');
    const isSelected = selectedItems.includes(itemUniqueId);

    return (
      <TouchableOpacity
        key={itemUniqueId}
        style={[
          verificationStyles.card,
          isSelected && verificationStyles.selectedCard,
        ]}
        onPress={() => handleSelect(achievement.id, 'achievement')}
      >
        {/* Company/School Info */}
        <View style={verificationStyles.companyInfo}>
          <View style={verificationStyles.companyLogo}>
            {companyData?.company.logo ? (
              <Image
                source={{ uri: companyData.company.logo }}
                style={verificationStyles.logoImage}
              />
            ) : educationData?.school.logo ? (
              <Image
                source={{ uri: educationData.school.logo }}
                style={verificationStyles.logoImage}
              />
            ) : (
              <Text style={verificationStyles.companyInitial}>
                {companyData?.company.name.charAt(0) ||
                  educationData?.school.name.charAt(0) ||
                  'C'}
              </Text>
            )}
          </View>
          <View style={verificationStyles.companyDetails}>
            <Text
              style={[
                verificationStyles.companyName,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {companyData?.company.name || educationData?.school.name}
            </Text>
            <Text
              style={[
                verificationStyles.achievementTitle,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {achievement.title}
            </Text>
            <View style={verificationStyles.dateContainer}>
              <Image
                source={require('../../assets/icons/calendar.png')}
                style={[
                  verificationStyles.calendarIcon,
                  isSelected && verificationStyles.selectedIcon,
                ]}
              />
              <Text
                style={[
                  verificationStyles.dateText,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                {achievement.dateRange}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text
          style={[
            verificationStyles.description,
            isSelected && verificationStyles.selectedText,
          ]}
        >
          {achievement.description}
        </Text>

        {/* Verification Score */}
        {achievement.validationScore > 0 && (
          <View style={verificationStyles.scoreContainer}>
            <Text
              style={[
                verificationStyles.scoreText,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              Verification Score: {achievement.validationScore}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSkillCard = (skill: Skill) => {
    const itemUniqueId = createUniqueId(skill.id, 'skill');
    const isSelected = selectedItems.includes(itemUniqueId);

    return (
      <TouchableOpacity
        key={itemUniqueId}
        style={[
          verificationStyles.card,
          isSelected && verificationStyles.selectedCard,
        ]}
        onPress={() => handleSelect(skill.id, 'skill')}
      >
        {/* User Info */}
        <View style={verificationStyles.companyInfo}>
          <View style={verificationStyles.companyLogo}>
            <Text style={verificationStyles.companyInitial}>
              {skill.skillName.charAt(0) || 'S'}
            </Text>
          </View>
          <View style={verificationStyles.companyDetails}>
            <Text
              style={[
                verificationStyles.achievementTitle,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {skill.skillName}
            </Text>

            {/* <Text
              style={[
                verificationStyles.employmentType,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {skill.skillLevel}
            </Text> */}
            <View style={verificationStyles.dateContainer}>
              <Image
                source={require('../../assets/icons/calendar.png')}
                style={[
                  verificationStyles.calendarIcon,
                  isSelected && verificationStyles.selectedIcon,
                ]}
              />
              <Text
                style={[
                  verificationStyles.dateText,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                {skill.dateRange}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text
          style={[
            verificationStyles.description,
            isSelected && verificationStyles.selectedText,
          ]}
        >
          {skill.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAspirationCard = (aspiration: Aspiration) => {
    const itemUniqueId = createUniqueId(aspiration.id, 'aspiration');
    const isSelected = selectedItems.includes(itemUniqueId);

    return (
      <TouchableOpacity
        key={itemUniqueId}
        style={[
          verificationStyles.card,
          isSelected && verificationStyles.selectedCard,
        ]}
        onPress={() => handleSelect(aspiration.id, 'aspiration')}
      >
        {/* Aspiration Info */}
        <View style={verificationStyles.companyInfo}>
          <View style={verificationStyles.companyLogo}>
            <Text style={verificationStyles.companyInitial}>🎯</Text>
          </View>
          <View style={verificationStyles.companyDetails}>
            <Text
              style={[
                verificationStyles.achievementTitle,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {aspiration.goal}
            </Text>
            <View style={verificationStyles.dateContainer}>
              <Image
                source={require('../../assets/icons/calendar.png')}
                style={[
                  verificationStyles.calendarIcon,
                  isSelected && verificationStyles.selectedIcon,
                ]}
              />
              <Text
                style={[
                  verificationStyles.dateText,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                {aspiration.dateRange}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text
          style={[
            verificationStyles.description,
            isSelected && verificationStyles.selectedText,
          ]}
        >
          {aspiration.whyItMatters}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={verificationStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#57B915" />
        <Text style={verificationStyles.loadingText}>
          Loading verification options...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={verificationStyles.errorContainer}>
        <Text style={verificationStyles.errorText}>{error}</Text>
        <TouchableOpacity
          style={verificationStyles.retryButton}
          onPress={() => {
            if (schoolId) {
              fetchEducationVerificationList(schoolId);
            } else if (companyId) {
              fetchCompanyVerificationList(companyId);
            }
          }}
        >
          <Text style={verificationStyles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if we have education data (for school verification)
  if (educationData) {
    // Determine if there's only one education and no achievements
    if (
      educationData.educations.length === 1 &&
      educationData.achievements.length === 0
    ) {
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>Verify this education</Text>
          <View style={verificationStyles.cardsList}>
            {educationData.educations.map(education => (
              <View key={education.id} style={verificationStyles.card}>
                {/* School Info */}
                <View style={verificationStyles.companyInfo}>
                  <View style={verificationStyles.companyLogo}>
                    {educationData?.school.logo ? (
                      <Image
                        source={{ uri: educationData.school.logo }}
                        style={verificationStyles.logoImage}
                      />
                    ) : (
                      <Text style={verificationStyles.companyInitial}>
                        {educationData?.school.name.charAt(0) || 'S'}
                      </Text>
                    )}
                  </View>
                  <View style={verificationStyles.companyDetails}>
                    <Text style={verificationStyles.companyName}>
                      {educationData?.school.name}
                    </Text>
                    {/* <Text style={verificationStyles.positionTitle}>
                      {education.degree}
                    </Text>
                    <Text style={verificationStyles.employmentType}>
                      {education.fieldOfStudy}
                    </Text> */}
                  </View>
                </View>

                {/* Date Range */}
                <View style={verificationStyles.dateContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={verificationStyles.calendarIcon}
                  />
                  <Text style={verificationStyles.dateText}>
                    {education.dateRange}
                  </Text>
                </View>

                {/* Description */}
                <Text style={verificationStyles.description}>
                  {education.description}
                </Text>
              </View>
            ))}
          </View>
          {/* Next Button - Always active when there's only one item */}
          <TouchableOpacity
            style={verificationStyles.nextButtonActive}
            onPress={() => {
              // For single education, use the first (and only) education
              const education = educationData.educations[0];
              if (education && educationData) {
                const itemWithSchoolInfo = {
                  ...education,
                  type: 'education' as 'education',
                  schoolName: educationData.school.name,
                  schoolLogo: educationData.school.logo,
                };
                navigation.navigate('VerificationStep2', {
                  selectedItemData: itemWithSchoolInfo,
                });
              }
            }}
          >
            <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (
      educationData.achievements.length === 1 &&
      educationData.educations.length === 0
    ) {
      // Determine if there's only one achievement and no educations
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>
            Verify this achievement
          </Text>
          <View style={verificationStyles.cardsList}>
            {educationData.achievements.map(achievement => (
              <View key={achievement.id} style={verificationStyles.card}>
                {/* School Info */}
                <View style={verificationStyles.companyInfo}>
                  <View style={verificationStyles.companyLogo}>
                    {educationData?.school.logo ? (
                      <Image
                        source={{ uri: educationData.school.logo }}
                        style={verificationStyles.logoImage}
                      />
                    ) : (
                      <Text style={verificationStyles.companyInitial}>
                        {educationData?.school.name.charAt(0) || 'S'}
                      </Text>
                    )}
                  </View>
                  <View style={verificationStyles.companyDetails}>
                    <Text style={verificationStyles.companyName}>
                      {educationData?.school.name}
                    </Text>
                    <Text style={verificationStyles.achievementTitle}>
                      {achievement.title}
                    </Text>
                  </View>
                </View>

                {/* Date Range */}
                <View style={verificationStyles.dateContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={verificationStyles.calendarIcon}
                  />
                  <Text style={verificationStyles.dateText}>
                    {achievement.dateRange}
                  </Text>
                </View>

                {/* Description */}
                <Text style={verificationStyles.description}>
                  {achievement.description}
                </Text>

                {/* Verification Score */}
                {achievement.validationScore > 0 && (
                  <View style={verificationStyles.scoreContainer}>
                    <Text style={verificationStyles.scoreText}>
                      Verification Score: {achievement.validationScore}%
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          {/* Next Button - Always active when there's only one item */}
          <TouchableOpacity
            style={verificationStyles.nextButtonActive}
            onPress={() => {
              // For single achievement, use the first (and only) achievement
              const achievement = educationData.achievements[0];
              if (achievement && educationData) {
                const itemWithSchoolInfo = {
                  ...achievement,
                  type: 'achievement' as 'achievement',
                  schoolName: educationData.school.name,
                  schoolLogo: educationData.school.logo,
                };
                navigation.navigate('VerificationStep2', {
                  selectedItemData: itemWithSchoolInfo,
                });
              }
            }}
          >
            <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Multiple items case for education
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>
            Please select what you'd like to have verified
          </Text>

          {/* Educations Section */}
          {educationData.educations.length > 0 && (
            <View style={verificationStyles.section}>
              <View style={verificationStyles.sectionHeader}>
                <Text style={verificationStyles.sectionTitle}>Educations</Text>
                <Text style={verificationStyles.sectionCount}>
                  {educationData.educations.length}
                </Text>
              </View>
              <View style={verificationStyles.cardsList}>
                {educationData.educations.map(renderEducationCard)}
              </View>
            </View>
          )}

          {/* Achievements Section */}
          {educationData.achievements.length > 0 && (
            <View style={verificationStyles.section}>
              <View style={verificationStyles.sectionHeader}>
                <Text style={verificationStyles.sectionTitle}>
                  Achievements
                </Text>
                <Text style={verificationStyles.sectionCount}>
                  {educationData.achievements.length}
                </Text>
              </View>
              <View style={verificationStyles.cardsList}>
                {educationData.achievements.map(renderAchievementCard)}
              </View>
            </View>
          )}

          {/* Next Button */}
          <TouchableOpacity
            style={[
              verificationStyles.nextButton,
              selectedItems.length > 0 && verificationStyles.nextButtonActive,
            ]}
            onPress={() => {
              if (selectedItems.length > 0) {
                // Map selected items to their data objects
                const selectedItemsData = selectedItems
                  .map(uniqueId => {
                    const [type, id] = uniqueId.split('-');
                    let itemData;

                    if (type === 'education') {
                      itemData = educationData.educations.find(
                        e => e.id === parseInt(id),
                      );
                    } else {
                      itemData = educationData.achievements.find(
                        a => a.id === parseInt(id),
                      );
                    }

                    if (itemData) {
                      return {
                        ...itemData,
                        type: type as 'education' | 'achievement',
                        schoolName: educationData.school.name,
                        schoolLogo: educationData.school.logo,
                      };
                    }
                    return null;
                  })
                  .filter(Boolean); // Remove any null values

                navigation.navigate('VerificationStep2', {
                  selectedItemsData: selectedItemsData,
                });
              }
            }}
            disabled={selectedItems.length === 0}
          >
            <Text
              style={[
                verificationStyles.nextButtonText,
                selectedItems.length > 0 &&
                  verificationStyles.nextButtonTextActive,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  console.log(hobbyData, 'hobby data123');

  // Check if we have hobby data (for hobby verification)
  if (hobbyData) {
    const renderHobbyAchievementCard = (achievement: Achievement) => {
      const itemUniqueId = createUniqueId(achievement.id, 'achievement');
      const isSelected = selectedItems.includes(itemUniqueId);

      return (
        <TouchableOpacity
          key={itemUniqueId}
          style={[
            verificationStyles.card,
            isSelected && verificationStyles.selectedCard,
          ]}
          onPress={() => handleSelect(achievement.id, 'achievement')}
        >
          {/* Hobby Info */}
          <View style={verificationStyles.companyInfo}>
            <View style={verificationStyles.companyLogo}>
              {hobbyData?.masterHobby.image ? (
                <Image
                  source={{ uri: hobbyData.masterHobby.image }}
                  style={verificationStyles.logoImage}
                />
              ) : (
                <Text style={verificationStyles.companyInitial}>
                  {hobbyData?.masterHobby.name.charAt(0) || 'H'}
                </Text>
              )}
            </View>
            <View style={verificationStyles.companyDetails}>
              {/* <Text style={verificationStyles.companyName}>
                {hobbyData?.masterHobby.name}
              </Text> */}
              <Text
                style={[
                  verificationStyles.achievementTitle,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                {achievement.title}
              </Text>
              <View style={verificationStyles.dateContainer}>
                <Image
                  source={require('../../assets/icons/calendar.png')}
                  style={[
                    verificationStyles.calendarIcon,
                    isSelected && verificationStyles.selectedIcon,
                  ]}
                />
                <Text
                  style={[
                    verificationStyles.dateText,
                    isSelected && verificationStyles.selectedText,
                  ]}
                >
                  {achievement.dateRange}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text
            style={[
              verificationStyles.description,
              isSelected && verificationStyles.selectedText,
            ]}
          >
            {achievement.description}
          </Text>

          {/* Verification Score */}
          {achievement.validationScore > 0 && (
            <View style={verificationStyles.scoreContainer}>
              <Text
                style={[
                  verificationStyles.scoreText,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                Verification Score: {achievement.validationScore}%
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    };

    // Determine if there's only one hobby entry and no achievements
    if (
      hobbyData.entries.length === 1 &&
      (!hobbyData.achievements || hobbyData.achievements.length === 0)
    ) {
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>Verify this hobby</Text>
          <View style={verificationStyles.cardsList}>
            {hobbyData.entries.map(hobby => (
              <View key={hobby.id} style={verificationStyles.card}>
                {/* Hobby Info */}
                <View style={verificationStyles.companyInfo}>
                  <View style={verificationStyles.companyLogo}>
                    {hobbyData?.masterHobby.image ? (
                      <Image
                        source={{ uri: hobbyData.masterHobby.image }}
                        style={verificationStyles.logoImage}
                      />
                    ) : (
                      <Text style={verificationStyles.companyInitial}>
                        {hobbyData?.masterHobby.name.charAt(0) || 'H'}
                      </Text>
                    )}
                  </View>
                  <View style={verificationStyles.companyDetails}>
                    <Text style={verificationStyles.companyName}>
                      {hobbyData?.masterHobby.name}
                    </Text>
                    <Text style={verificationStyles.achievementTitle}>
                      {hobby.title}
                    </Text>
                    {/* Date Range */}
                    <View style={verificationStyles.dateContainer}>
                      <Image
                        source={require('../../assets/icons/calendar.png')}
                        style={verificationStyles.calendarIcon}
                      />
                      <Text style={verificationStyles.dateText}>
                        {hobby.dateRange}
                      </Text>
                    </View>
                    {/* <Text style={verificationStyles.employmentType}>
                      Skill Level: {hobby.skillLevel}
                    </Text> */}
                  </View>
                </View>

                {/* Location */}
                {/* <View style={verificationStyles.dateContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={verificationStyles.calendarIcon}
                  />
                  <Text style={verificationStyles.dateText}>
                    {hobby.location}
                  </Text>
                </View> */}

                {/* Description */}
                <Text style={verificationStyles.description}>
                  {hobby.description}
                </Text>
              </View>
            ))}
          </View>
          {/* Next Button - Always active when there's only one item */}
          <TouchableOpacity
            style={verificationStyles.nextButtonActive}
            onPress={() => {
              // For single hobby, use the first (and only) hobby
              const hobby = hobbyData.entries[0];
              if (hobby && hobbyData) {
                const itemWithHobbyInfo = {
                  ...hobby,
                  type: 'hobby' as 'hobby',
                  hobbyName: hobbyData.masterHobby.name,
                  hobbyLogo: hobbyData.masterHobby.image,
                };
                navigation.navigate('VerificationStep2', {
                  selectedItemData: itemWithHobbyInfo,
                });
              }
            }}
          >
            <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (
      hobbyData.achievements &&
      hobbyData.achievements.length === 1 &&
      hobbyData.entries.length === 0
    ) {
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>
            Verify this achievement
          </Text>
          <View style={verificationStyles.cardsList}>
            {hobbyData.achievements.map(renderHobbyAchievementCard)}
          </View>
          {/* Next Button - Always active when there's only one item */}
          <TouchableOpacity
            style={verificationStyles.nextButtonActive}
            onPress={() => {
              // For single achievement, use the first (and only) achievement
              const achievement = hobbyData.achievements![0];
              if (achievement && hobbyData) {
                const itemWithHobbyInfo = {
                  ...achievement,
                  type: 'hobby_achievement',
                  hobbyName: hobbyData.masterHobby.name,
                  hobbyLogo: hobbyData.masterHobby.image,
                };
                navigation.navigate('VerificationStep2', {
                  selectedItemData: itemWithHobbyInfo,
                });
              }
            }}
          >
            <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Multiple items case for hobbies
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>
            Please select what you'd like to have verified
          </Text>

          {/* Hobby Entries Section */}
          {hobbyData.entries.length > 0 && (
            <View style={verificationStyles.section}>
              {/* Section Header with master hobby info */}
              <View style={verificationStyles.sectionHeader}>
                <View style={verificationStyles.headerLeft}>
                  <View style={verificationStyles.sectionLogoContainer}>
                    {hobbyData.masterHobby.image ? (
                      <Image
                        source={{ uri: hobbyData.masterHobby.image }}
                        style={verificationStyles.sectionLogo}
                      />
                    ) : (
                      <View style={verificationStyles.sectionLogoPlaceholder}>
                        <Text style={verificationStyles.sectionLogoText}>
                          {hobbyData.masterHobby.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={verificationStyles.sectionTitle}>
                    {hobbyData.masterHobby.name}
                  </Text>
                </View>
                <Text style={verificationStyles.sectionCount}>
                  {hobbyData.entries.length}
                </Text>
              </View>
              <Text style={verificationStyles.entriesSubtitle}>
                Hobby Entries
              </Text>
              <View style={verificationStyles.cardsList}>
                {hobbyData.entries.map(renderHobbyCard)}
              </View>
            </View>
          )}

          {/* Achievements Section */}
          {hobbyData.achievements && hobbyData.achievements.length > 0 && (
            <View style={verificationStyles.section}>
              <View style={verificationStyles.sectionHeader}>
                <Text style={verificationStyles.sectionTitle}>
                  Achievements
                </Text>
                <Text style={verificationStyles.sectionCount}>
                  {hobbyData.achievements.length}
                </Text>
              </View>
              <View style={verificationStyles.cardsList}>
                {hobbyData.achievements.map(renderHobbyAchievementCard)}
              </View>
            </View>
          )}

          {/* Next Button */}
          <TouchableOpacity
            style={[
              verificationStyles.nextButton,
              selectedItems.length > 0 && verificationStyles.nextButtonActive,
            ]}
            onPress={() => {
              if (selectedItems.length > 0) {
                // Map selected items to their data objects
                const selectedItemsData = selectedItems
                  .map(uniqueId => {
                    const [type, id] = uniqueId.split('-');
                    let itemData;

                    if (type === 'hobby') {
                      itemData = hobbyData.entries.find(
                        h => h.id === parseInt(id),
                      );
                    } else if (type === 'achievement') {
                      itemData = hobbyData.achievements?.find(
                        a => a.id === parseInt(id),
                      );
                    }

                    if (itemData) {
                      const isAchievement = type === 'achievement';
                      return {
                        ...itemData,
                        type: isAchievement ? 'hobby_achievement' : 'hobby',
                        hobbyName: hobbyData.masterHobby.name,
                        hobbyLogo: hobbyData.masterHobby.image,
                      };
                    }
                    return null;
                  })
                  .filter(Boolean); // Remove any null values

                navigation.navigate('VerificationStep2', {
                  selectedItemsData: selectedItemsData,
                });
              }
            }}
            disabled={selectedItems.length === 0}
          >
            <Text
              style={[
                verificationStyles.nextButtonText,
                selectedItems.length > 0 &&
                  verificationStyles.nextButtonTextActive,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  // Check if we have skill data (for skill verification)
  if (skillData) {
    // Check if there are achievements in skillData and handle accordingly
    if (skillData.achievements && skillData.achievements.length > 0) {
      // If there are achievements, render them instead of the skill
      const renderSkillAchievementCard = (achievement: Achievement) => {
        const itemUniqueId = createUniqueId(achievement.id, 'achievement');
        const isSelected = selectedItems.includes(itemUniqueId);

        return (
          <TouchableOpacity
            key={itemUniqueId}
            style={[
              verificationStyles.card,
              isSelected && verificationStyles.selectedCard,
            ]}
            onPress={() => handleSelect(achievement.id, 'achievement')}
          >
            {/* Skill Info */}
            <View style={verificationStyles.companyInfo}>
              <View style={verificationStyles.companyLogo}>
                <Text style={verificationStyles.companyInitial}>
                  {skillData.skill.skillName.charAt(0) || 'S'}
                </Text>
              </View>
              <View style={verificationStyles.companyDetails}>
                <Text
                  style={[
                    verificationStyles.achievementTitle,
                    isSelected && verificationStyles.selectedText,
                  ]}
                >
                  {achievement.title}
                </Text>
                <View style={verificationStyles.dateContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={[
                      verificationStyles.calendarIcon,
                      isSelected && verificationStyles.selectedIcon,
                    ]}
                  />
                  <Text
                    style={[
                      verificationStyles.dateText,
                      isSelected && verificationStyles.selectedText,
                    ]}
                  >
                    {achievement.dateRange}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <Text
              style={[
                verificationStyles.description,
                isSelected && verificationStyles.selectedText,
              ]}
            >
              {achievement.description}
            </Text>

            {/* Verification Score */}
            {achievement.validationScore > 0 && (
              <View style={verificationStyles.scoreContainer}>
                <Text
                  style={[
                    verificationStyles.scoreText,
                    isSelected && verificationStyles.selectedText,
                  ]}
                >
                  Verification Score: {achievement.validationScore}%
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      };

      // If there's only one achievement, show it directly
      if (skillData.achievements.length === 1) {
        return (
          <View style={verificationStyles.selectionContainer}>
            <Text style={verificationStyles.subtitle}>
              Verify this skill achievement
            </Text>
            <View style={verificationStyles.cardsList}>
              {renderSkillAchievementCard(skillData.achievements[0])}
            </View>
            {/* Next Button - Always active when there's only one item */}
            <TouchableOpacity
              style={verificationStyles.nextButtonActive}
              onPress={() => {
                console.log(skillData, 'skill data');
                const achievement = skillData.achievements![0];
                if (achievement) {
                  const itemWithAchievementInfo = {
                    ...achievement,
                    type: 'skill_achievement' as 'skill_achievement',
                    skillName: skillData.skill.skillName,
                    skillLogo: skillData.skill.user.profilePicture,
                  };
                  navigation.navigate('VerificationStep2', {
                    selectedItemData: itemWithAchievementInfo,
                  });
                }
              }}
            >
              <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        // Multiple achievements case
        return (
          <View style={verificationStyles.selectionContainer}>
            <Text style={verificationStyles.subtitle}>
              Please select what you'd like to have verified
            </Text>
            <View style={verificationStyles.section}>
              <View style={verificationStyles.sectionHeader}>
                <Text style={verificationStyles.sectionTitle}>
                  Skill Achievements
                </Text>
                <Text style={verificationStyles.sectionCount}>
                  {skillData.achievements.length}
                </Text>
              </View>
              <View style={verificationStyles.cardsList}>
                {skillData.achievements.map(renderSkillAchievementCard)}
              </View>
            </View>
            {/* Next Button */}
            <TouchableOpacity
              style={[
                verificationStyles.nextButton,
                selectedItems.length > 0 && verificationStyles.nextButtonActive,
              ]}
              onPress={() => {
                if (selectedItems.length > 0) {
                  // Map selected items to their data objects
                  const selectedItemsData = selectedItems
                    .map(uniqueId => {
                      const [type, id] = uniqueId.split('-');
                      if (type === 'achievement') {
                        const itemData = skillData.achievements?.find(
                          a => a.id === parseInt(id),
                        );
                        if (itemData) {
                          return {
                            ...itemData,
                            type: 'skill_achievement' as 'skill_achievement',
                            skillName: skillData.skill.skillName,
                            skillLogo: skillData.skill.user.profilePicture,
                          };
                        }
                      }
                      return null;
                    })
                    .filter(Boolean); // Remove any null values

                  navigation.navigate('VerificationStep2', {
                    selectedItemsData: selectedItemsData,
                  });
                }
              }}
              disabled={selectedItems.length === 0}
            >
              <Text
                style={[
                  verificationStyles.nextButtonText,
                  selectedItems.length > 0 &&
                    verificationStyles.nextButtonTextActive,
                ]}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
    } else {
      // No achievements, render the skill itself
      console.log(skillData, 'sdsfdfdfyyyyyyyyyyyy');
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>Verify this skill</Text>
          <View style={verificationStyles.cardsList}>
            {renderSkillCard(skillData.skill)}
          </View>
          {/* Next Button - Always active when there's only one item */}
          <TouchableOpacity
            style={verificationStyles.nextButtonActive}
            onPress={() => {
              // For single skill, use the skill data
              const skill = skillData.skill;
              if (skill) {
                const itemWithSkillInfo = {
                  ...skill,
                  type: 'skill' as 'skill',
                  skillName: skill.skillName,
                  skillLogo: skill.user.profilePicture,
                };
                navigation.navigate('VerificationStep2', {
                  selectedItemData: itemWithSkillInfo,
                });
              }
            }}
          >
            <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  if (aspirationData) {
    console.log(aspirationData,"aspiration data")
  if (aspirationData.achievements && aspirationData.achievements.length > 0) {
    const renderAspirationAchievementCard = (achievement: Achievement) => {
      const itemUniqueId = createUniqueId(achievement.id, 'achievement'); // Fixed type
      const isSelected = selectedItems.includes(itemUniqueId);

      return (
        <TouchableOpacity
          key={itemUniqueId}
          style={[
            verificationStyles.card,
            isSelected && verificationStyles.selectedCard,
          ]}
          onPress={() => handleSelect(achievement.id, 'achievement')} // Fixed type
        >
          {/* Aspiration Info */}
          <View style={verificationStyles.companyInfo}>
            <View style={verificationStyles.companyLogo}>
              <Text style={verificationStyles.companyInitial}>🎯</Text>
            </View>
            <View style={verificationStyles.companyDetails}>
              <Text
                style={[
                  verificationStyles.achievementTitle,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                {achievement.title}
              </Text>
              <View style={verificationStyles.dateContainer}>
                <Image
                  source={require('../../assets/icons/calendar.png')}
                  style={[
                    verificationStyles.calendarIcon,
                    isSelected && verificationStyles.selectedIcon,
                  ]}
                />
                <Text
                  style={[
                    verificationStyles.dateText,
                    isSelected && verificationStyles.selectedText,
                  ]}
                >
                  {achievement.dateRange}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text
            style={[
              verificationStyles.description,
              isSelected && verificationStyles.selectedText,
            ]}
          >
            {achievement.description}
          </Text>

          {/* Verification Score */}
          {achievement.validationScore > 0 && (
            <View style={verificationStyles.scoreContainer}>
              <Text
                style={[
                  verificationStyles.scoreText,
                  isSelected && verificationStyles.selectedText,
                ]}
              >
                Verification Score: {achievement.validationScore}%
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    };

    // If there's only one achievement, show it directly
    if (aspirationData.achievements.length === 1) {
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>Verify this aspiration achievement</Text>
          <View style={verificationStyles.cardsList}>
            {renderAspirationAchievementCard(aspirationData.achievements[0])}
          </View>
          {/* Next Button - Always active when there's only one item */}
          <TouchableOpacity
            style={verificationStyles.nextButtonActive}
            onPress={() => {
              const achievement = aspirationData.achievements![0];
              if (achievement) {
                const itemWithAchievementInfo = {
                  ...achievement,
                  type: 'aspiration_achievement' as const,
                  goal: aspirationData.aspiration.goal,
                  whyItMatters: aspirationData.aspiration.whyItMatters,
                };
                navigation.navigate('VerificationStep2', {
                  selectedItemData: itemWithAchievementInfo,
                });
              }
            }}
          >
            <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Multiple achievements case - FIXED: Properly closed the section view
      return (
        <View style={verificationStyles.selectionContainer}>
          <Text style={verificationStyles.subtitle}>Please select what you'd like to have verified</Text>
          
          <View style={verificationStyles.section}>
            <View style={verificationStyles.sectionHeader}>
              <Text style={verificationStyles.sectionTitle}>Aspiration Achievements</Text>
              <Text style={verificationStyles.sectionCount}>
                {aspirationData.achievements.length}
              </Text>
            </View>
            <View style={verificationStyles.cardsList}>
              {aspirationData.achievements.map(renderAspirationAchievementCard)}
            </View>
          </View> {/* Added missing closing tag for section View */}
          
          {/* Next Button - MOVED OUTSIDE the section */}
          <TouchableOpacity
            style={[
              verificationStyles.nextButton,
              selectedItems.length > 0 && verificationStyles.nextButtonActive,
            ]}
            onPress={() => {
              if (selectedItems.length > 0) {
                // Map selected items to their data objects
                const selectedItemsData = selectedItems
                  .map(uniqueId => {
                    const [type, id] = uniqueId.split('-');
                    if (type === 'aspiration_achievement') {
                      const itemData = aspirationData.achievements?.find(
                        a => a.id === parseInt(id),
                      );
                      if (itemData) {
                        return {
                          ...itemData,
                          type: 'aspiration_achievement' as const,
                          goal: aspirationData.aspiration.goal,
                          whyItMatters: aspirationData.aspiration.whyItMatters,
                        };
                      }
                    }
                    return null;
                  })
                  .filter(Boolean); // Remove any null values

                navigation.navigate('VerificationStep2', {
                  selectedItemsData: selectedItemsData,
                });
              }
            }}
            disabled={selectedItems.length === 0}
          >
            <Text
              style={[
                verificationStyles.nextButtonText,
                selectedItems.length > 0 &&
                  verificationStyles.nextButtonTextActive,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  } else {
    // No achievements, render the aspiration itself
    return (
      <View style={verificationStyles.selectionContainer}>
        <Text style={verificationStyles.subtitle}>Verify this aspiration</Text>
        <View style={verificationStyles.cardsList}>
          <View style={verificationStyles.card}>
            {/* Aspiration Info */}
            <View style={verificationStyles.companyInfo}>
              <View style={verificationStyles.companyLogo}>
                <Text style={verificationStyles.companyInitial}>🎯</Text>
              </View>
              <View style={verificationStyles.companyDetails}>
                <Text style={verificationStyles.achievementTitle}>
                  {aspirationData.aspiration.goal}
                </Text>
                <View style={verificationStyles.dateContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={verificationStyles.calendarIcon}
                  />
                  <Text style={verificationStyles.dateText}>
                    {aspirationData.aspiration.dateRange}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <Text style={verificationStyles.description}>
              {aspirationData.aspiration.whyItMatters}
            </Text>
          </View>
        </View>
        {/* Next Button - Always active when there's only one item */}
        <TouchableOpacity
          style={verificationStyles.nextButtonActive}
          onPress={() => {
            // Navigate to VerificationStep2 with the aspiration data
            const itemWithAspirationInfo = {
              ...aspirationData.aspiration,
              type: 'aspiration' as const,
              goal: aspirationData.aspiration.goal,
              whyItMatters: aspirationData.aspiration.whyItMatters,
            };
            navigation.navigate('VerificationStep2', {
              selectedItemData: itemWithAspirationInfo,
            });
          }}
        >
          <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

  // Default case for company verification (existing logic)
  if (!companyData) {
    return (
      <View style={verificationStyles.errorContainer}>
        <Text style={verificationStyles.errorText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={verificationStyles.selectionContainer}>
      {/* Determine if there's only one position and no achievements */}
      {companyData.positions.length === 1 &&
      companyData.achievements.length === 0 ? (
        <>
          <Text style={verificationStyles.subtitle}>Verify this position</Text>
          <View style={verificationStyles.cardsList}>
            {companyData.positions.map(position => (
              <View key={position.id} style={verificationStyles.card}>
                {/* Company Info */}
                <View style={verificationStyles.companyInfo}>
                  <View style={verificationStyles.companyLogo}>
                    {companyData?.company.logo ? (
                      <Image
                        source={{ uri: companyData.company.logo }}
                        style={verificationStyles.logoImage}
                      />
                    ) : (
                      <Text style={verificationStyles.companyInitial}>
                        {companyData?.company.name.charAt(0) || 'C'}
                      </Text>
                    )}
                  </View>
                  <View style={verificationStyles.companyDetails}>
                    <Text style={verificationStyles.companyName}>
                      {companyData?.company.name}
                    </Text>
                    <Text style={verificationStyles.positionTitle}>
                      {position.title}
                    </Text>
                    <Text style={verificationStyles.employmentType}>
                      {position.employmentType}
                    </Text>
                  </View>
                </View>

                {/* Date Range */}
                <View style={verificationStyles.dateContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={verificationStyles.calendarIcon}
                  />
                  <Text style={verificationStyles.dateText}>
                    {position.dateRange}
                  </Text>
                </View>

                {/* Description */}
                <Text style={verificationStyles.description}>
                  {position.description}
                </Text>
              </View>
            ))}
          </View>
          {/* Next Button - Always active when there's only one item */}
          <TouchableOpacity
            style={verificationStyles.nextButtonActive}
            onPress={() => {
              // For single position, use the first (and only) position
              const position = companyData.positions[0];
              if (position && companyData) {
                const itemWithCompanyInfo = {
                  ...position,
                  type: 'position' as 'position' | 'achievement',
                  companyName: companyData.company.name,
                  companyLogo: companyData.company.logo,
                };
                navigation.navigate('VerificationStep2', {
                  selectedItemData: itemWithCompanyInfo,
                });
              }
            }}
          >
            <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
          </TouchableOpacity>
        </>
      ) : companyData.achievements.length === 1 &&
        companyData.positions.length === 0 ? (
        <>
          <Text style={verificationStyles.subtitle}>
            Verify this achievement
          </Text>
          <View style={verificationStyles.cardsList}>
            {companyData.achievements.map(achievement => (
              <View key={achievement.id} style={verificationStyles.card}>
                {/* Company Info */}
                <View style={verificationStyles.companyInfo}>
                  <View style={verificationStyles.companyLogo}>
                    {companyData?.company.logo ? (
                      <Image
                        source={{ uri: companyData.company.logo }}
                        style={verificationStyles.logoImage}
                      />
                    ) : (
                      <Text style={verificationStyles.companyInitial}>
                        {companyData?.company.name.charAt(0) || 'C'}
                      </Text>
                    )}
                  </View>
                  <View style={verificationStyles.companyDetails}>
                    <Text style={verificationStyles.companyName}>
                      {companyData?.company.name}
                    </Text>
                    <Text style={verificationStyles.achievementTitle}>
                      {achievement.title}
                    </Text>
                  </View>
                </View>

                {/* Date Range */}
                <View style={verificationStyles.dateContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={verificationStyles.calendarIcon}
                  />
                  <Text style={verificationStyles.dateText}>
                    {achievement.dateRange}
                  </Text>
                </View>

                {/* Description */}
                <Text style={verificationStyles.description}>
                  {achievement.description}
                </Text>

                {/* Verification Score */}
                {achievement.validationScore > 0 && (
                  <View style={verificationStyles.scoreContainer}>
                    <Text style={verificationStyles.scoreText}>
                      Verification Score: {achievement.validationScore}%
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          {/* Next Button - Always active when there's only one item */}
          <TouchableOpacity
            style={verificationStyles.nextButtonActive}
            onPress={() => {
              // For single achievement, use the first (and only) achievement
              const achievement = companyData.achievements[0];
              if (achievement && companyData) {
                const itemWithCompanyInfo = {
                  ...achievement,
                  type: 'achievement' as 'position' | 'achievement',
                  companyName: companyData.company.name,
                  companyLogo: companyData.company.logo,
                };
                navigation.navigate('VerificationStep2', {
                  selectedItemData: itemWithCompanyInfo,
                });
              }
            }}
          >
            <Text style={verificationStyles.nextButtonTextActive}>Next</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={verificationStyles.subtitle}>
            Please select what you'd like to have verified
          </Text>

          {/* Positions Section */}
          {companyData.positions.length > 0 && (
            <View style={verificationStyles.section}>
              <View style={verificationStyles.sectionHeader}>
                <Text style={verificationStyles.sectionTitle}>Positions</Text>
                <Text style={verificationStyles.sectionCount}>
                  {companyData.positions.length}
                </Text>
              </View>
              <View style={verificationStyles.cardsList}>
                {companyData.positions.map(renderPositionCard)}
              </View>
            </View>
          )}

          {/* Achievements Section */}
          {companyData.achievements.length > 0 && (
            <View style={verificationStyles.section}>
              <View style={verificationStyles.sectionHeader}>
                <Text style={verificationStyles.sectionTitle}>
                  Achievements
                </Text>
                <Text style={verificationStyles.sectionCount}>
                  {companyData.achievements.length}
                </Text>
              </View>
              <View style={verificationStyles.cardsList}>
                {companyData.achievements.map(renderAchievementCard)}
              </View>
            </View>
          )}

          {/* Next Button */}
          <TouchableOpacity
            style={[
              verificationStyles.nextButton,
              selectedItems.length > 0 && verificationStyles.nextButtonActive,
            ]}
            onPress={() => {
              if (selectedItems.length > 0) {
                // Map selected items to their data objects
                const selectedItemsData = selectedItems
                  .map(uniqueId => {
                    const [type, id] = uniqueId.split('-');
                    let itemData;

                    if (type === 'position') {
                      itemData = companyData.positions.find(
                        p => p.id === parseInt(id),
                      );
                    } else {
                      itemData = companyData.achievements.find(
                        a => a.id === parseInt(id),
                      );
                    }

                    if (itemData) {
                      return {
                        ...itemData,
                        type: type as 'position' | 'achievement',
                        companyName: companyData.company.name,
                        companyLogo: companyData.company.logo,
                      };
                    }
                    return null;
                  })
                  .filter(Boolean); // Remove any null values

                navigation.navigate('VerificationStep2', {
                  selectedItemsData: selectedItemsData,
                });
              }
            }}
            disabled={selectedItems.length === 0}
          >
            <Text
              style={[
                verificationStyles.nextButtonText,
                selectedItems.length > 0 &&
                  verificationStyles.nextButtonTextActive,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const Verification = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={require('../../assets/icons/back.png')}
          style={{ width: 24, height: 24 }}
        />
        <Text style={{ fontSize: 16, color: '#000' }}>Verification</Text>
      </TouchableOpacity>

      {/* New Verification Selection System */}
      <VerificationSelectionSystem navigation={navigation} />

      {/* Your existing components */}
      <VerificationSystem />
      <FAQComponent />
    </ScrollView>
  );
};

export default Verification;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});

// Enhanced styles for the verification selection system
const verificationStyles = StyleSheet.create({
  selectionContainer: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyLogoLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoImageLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  companyInitialLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
  },
  companyInfoHeader: {
    flex: 1,
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionLogoContainer: {
    marginRight: 12,
  },
  sectionLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sectionLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLogoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  entriesSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 16,
  },
  hobbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillLevel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardsList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#57B915',
    borderColor: '#57B915',
    shadowColor: '#57B915',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  achievementBadge: {
    backgroundColor: '#FEF7CD',
  },
  typeIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: '#475569',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  companyInitial: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  employmentType: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  subTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#64748B',
  },
  selectedIcon: {
    tintColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  scoreContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonActive: {
    backgroundColor: '#57B915',
    shadowColor: '#57B915',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  nextButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
