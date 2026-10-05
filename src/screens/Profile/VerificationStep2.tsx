import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import FAQComponent from '../../components/Faq';
import VerificationSystem from '../../components/Hr';
import {
  requestVerification,
  fetchMasterSkillList,
  sendHRVerificationRequest,
  addMasterSkill
} from '../../api/service';
import { CountryPicker } from 'react-native-country-codes-picker';

const VerificationStep2 = () => {
  const navigation = useNavigation();
  const route: any = useRoute();
  const selectedItemData = route.params?.selectedItemData || null;
  console.log(selectedItemData, 'selected item data');

  // Define TypeScript interfaces for verification items
  interface PositionItem {
    id: number;
    title: string;
    employmentType?: string;
    dateRange: string;
    description: string;
    validationStatus: 'verified' | 'pending' | 'rejected';
    validationScore: number;
    isCurrentlyWorking?: boolean;
    type: 'position';
    // Additional properties that might be used in the UI
    role?: string;
    subtitle?: string;
    period?: string;
    // Company related properties
    companyName?: string;
    companyLogo?: string;
  }

  interface AchievementItem {
    id: number;
    title: string;
    dateRange: string;
    description: string;
    validationStatus: 'verified' | 'pending' | 'rejected';
    validationScore: number;
    type: 'achievement' | 'hobby_achievement' | 'education_achievement' | 'skill_achievement' | 'aspiration_achievement';
    // Additional properties that might be used in the UI
    role?: string;
    subtitle?: string;
    period?: string;
    // Company related properties
    companyName?: string;
    companyLogo?: string;
    // School related properties (for education achievements)
    schoolName?: string;
    schoolLogo?: string;
    // Hobby related properties (for hobby achievements)
    hobbyName?: string;
    hobbyLogo?: string;
    // Skill related properties (for skill achievements)
    skillName?: string;
    skillLogo?: string;
    // Aspiration related properties (for aspiration achievements)
    aspirationName?: string;
    aspirationLogo?: string;
  }

  interface EducationItem {
    id: number;
    degree: string;
    fieldOfStudy: string;
    grade: string;
    dateRange: string;
    description: string;
    isVerified: boolean;
    isCurrentlyStudying: boolean;
    type: 'education';
    // School related properties
    schoolName?: string;
    schoolLogo?: string;
  }

  interface HobbyItem {
    id: number;
    title: string;
    skillLevel: string;
    description: string;
    location: string;
    dateRange: string;
    type: 'hobby';
    // Hobby related properties
    hobbyName?: string;
    hobbyLogo?: string;
  }

  interface SkillItem {
    id: number;
    skillName: string;
    name: string;
    skillLevel: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    mediaUrl: string | null;
    dateRange: string;
    user: {
      id: number;
      fullName: string;
      profilePicture: string;
      isVerified: boolean;
    };
    stats: {
      likesCount: number;
      commentsCount: number;
      topLevelCommentsCount: number;
    };
    isLiked: boolean;
    canEdit: boolean;
    type: 'skill';
    // Skill related properties
    skillTitle?: string;
    skillLogo?: string;
    subtitle?: string;
    role?: string;
  }

  interface AspirationItem {
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
    type: 'aspiration';
    // Aspiration related properties
    dateRange: string;
    goalTitle?: string;
    aspirationTitle?: string;
    // Properties for consistency with other items
    subtitle?: string;
    role?: string;
  }

  type VerificationItem =
    | PositionItem
    | AchievementItem
    | EducationItem
    | HobbyItem
    | SkillItem
    | AspirationItem;

  // Define interface for invitation items
  interface InvitationItem {
    id: number;
    email: string;
    customMessage: string;
    selectedSkills: SkillItem[];
  }

  const [invitations, setInvitations] = useState<InvitationItem[]>([
    { id: 1, email: '', customMessage: '', selectedSkills: [] },
    { id: 2, email: '', customMessage: '', selectedSkills: [] },
  ]);

  const [hrRequests, setHrRequests] = useState([
    {
      id: 1,
      hrName: '',
      hrEmail: '',
      hrPhone: '',
      countryCode: '+1',
      countryName: 'United States',
      countryFlag: '🇺🇸',
      hrLinkedin: '',
      additionalInfo: '',
    },
  ]);

  const [loadingStates, setLoadingStates] = useState<{
    [key: number]: boolean;
  }>({});

  // State for skills selection
  const [skills, setSkills] = useState<any[]>([]);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentEditingInvitationId, setCurrentEditingInvitationId] = useState<
    number | null
  >(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [currentCountryPickerId, setCurrentCountryPickerId] = useState<
    number | null
  >(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Check if selectedItemsData is passed (multiple items) or selectedItemData (single item)
  const selectedItemsData = route.params?.selectedItemsData || [];
  const singleItemData = route.params?.selectedItemData || null;

  // Use the selected item data if available, otherwise fallback to a default object
  const selectedItem: VerificationItem = singleItemData || {
    id: 0,
    title: 'Default Item',
    dateRange: 'N/A',
    description: 'No description available',
    validationStatus: 'pending',
    validationScore: 0,
    type: 'position',
  };

  // If we have multiple items, use those instead
  const itemsToDisplay: VerificationItem[] =
    selectedItemsData.length > 0 ? selectedItemsData : [selectedItem];

  // Fetch skills list when component mounts
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetchMasterSkillList();
        if (response.data.success) {
          setSkills(response.data.data);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: response.data.message || 'Failed to fetch skills',
          });
        }
      } catch (error: any) {
        console.error('Error fetching skills:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to fetch skills',
        });
      }
    };

    fetchSkills();
  }, []);

  // Function to toggle skill selection for a specific invitation
  const toggleSkillSelection = (skill: SkillItem) => {
    if (currentEditingInvitationId === null) return;

    setInvitations(prev =>
      prev.map(inv => {
        if (inv.id === currentEditingInvitationId) {
          const isAlreadySelected = inv.selectedSkills.some(
            s => s.id === skill.id,
          );
          if (isAlreadySelected) {
            // Remove skill from selection
            return {
              ...inv,
              selectedSkills: inv.selectedSkills.filter(s => s.id !== skill.id),
            };
          } else {
            // Add skill to selection
            return {
              ...inv,
              selectedSkills: [...inv.selectedSkills, skill],
            };
          }
        }
        return inv;
      }),
    );
  };

  // Function to handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Filter skills based on search query
  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Function to open the dropdown for a specific invitation
  const openSkillsDropdown = (invitationId: number) => {
    setCurrentEditingInvitationId(invitationId);
    setShowSkillsDropdown(true);
  };

  // Function to close the dropdown
  const closeSkillsDropdown = () => {
    setShowSkillsDropdown(false);
    setCurrentEditingInvitationId(null);
  };

  const updateInvitation = (id: number, field: string, value: string) => {
    setInvitations(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, [field]: value } : inv)),
    );
  };

  const updateHrRequest = (id: number, field: string, value: string) => {
    setHrRequests(prev =>
      prev.map(request =>
        request.id === id ? { ...request, [field]: value } : request,
      ),
    );
  };

  const addMoreInvitation = () => {
    const newId = invitations.length + 1;
    setInvitations(prev => [
      ...prev,
      { id: newId, email: '', customMessage: '', selectedSkills: [] },
    ]);
  };

  const addMoreHrRequest = () => {
    const newId = hrRequests.length + 1;
    setHrRequests(prev => [
      ...prev,
      {
        id: newId,
        hrName: '',
        hrEmail: '',
        hrPhone: '',
        countryCode: '+1',
        countryName: 'United States',
        countryFlag: '🇺🇸',
        hrLinkedin: '',
        additionalInfo: '',
      },
    ]);
  };

  const sendInvitation = async (invitationId: number) => {
    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation?.email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter an email address',
      });
      return;
    }

    // Set loading state to true for this specific invitation
    setLoadingStates(prev => ({ ...prev, [invitationId]: true }));

    try {
      // Prepare the items array from the selected items, adding skillIds to each item
      const items = itemsToDisplay.map(item => {
        // Check if it's an education achievement (has achievement type with school-related properties)
        let itemType: string = item.type;
        if (
          item.type === 'achievement' &&
          ((item as AchievementItem).schoolName ||
            (item as AchievementItem).schoolLogo)
        ) {
          itemType = 'education_achievement';
        } else if (item.type === 'achievement' && (item as AchievementItem).subtitle?.includes('Hobby')) {
          // Check if it's a hobby achievement
          itemType = 'hobby_achievement';
        } else if (item.type === 'achievement' && (item as AchievementItem).subtitle?.includes('Skill')) {
          // Check if it's a skill achievement
          itemType = 'skill_achievement';
        } else if (item.type === 'achievement' && (item as AchievementItem).subtitle?.includes('Aspiration')) {
          // Check if it's an aspiration achievement
          itemType = 'aspiration_achievement';
        } else if (item.type === 'hobby_achievement' || item.type === 'skill_achievement' || item.type === 'aspiration_achievement') {
          // Already identified types, use as is
          itemType = item.type;
        } else if (item.type === 'education') {
          itemType = 'education';
        }
        return {
          type: itemType,
          id: item.id,
          skillIds: invitation.selectedSkills.map(skill => skill.id),
        };
      });

      const response = await requestVerification({
        validatorEmail: invitation.email,
        customMessage: invitation.customMessage,
        items: items,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Verification request sent successfully!',
      });
      console.log('Verification request response:', response.data);

      // Clear the invitation fields after successful API call
      setInvitations(prev =>
        prev.map(inv => {
          if (inv.id === invitationId) {
            return {
              ...inv,
              email: '',
              customMessage: '',
              selectedSkills: [],
            };
          }
          return inv;
        }),
      );
    } catch (error: any) {
      console.error(
        'Error sending verification request:',
        error.response?.data?.message || error.message,
      );
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message ||
          error.message ||
          'Failed to send verification request',
      });
    } finally {
      // Set loading state to false for this specific invitation
      setLoadingStates(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  const onSelectCountry = (country: any) => {
    if (currentCountryPickerId !== null) {
      updateHrRequest(currentCountryPickerId, 'countryCode', country.dial_code);
      updateHrRequest(currentCountryPickerId, 'countryName', country.name);
      updateHrRequest(currentCountryPickerId, 'countryFlag', country.flag);
    }
    setShowCountryPicker(false);
    setCurrentCountryPickerId(null);
  };

  // Open country picker for specific HR request
  const openCountryPicker = (requestId: number) => {
    setCurrentCountryPickerId(requestId);
    setShowCountryPicker(true);
  };

  const sendHrRequest = async (requestId: number) => {
    const request = hrRequests.find(req => req.id === requestId);
    if (!request?.hrName.trim() || !request?.hrEmail.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in HR Name and Email fields',
      });
      return;
    }

    // Set loading state to true for this specific HR request
    setLoadingStates(prev => ({ ...prev, [requestId]: true }));

    try {
      // Prepare the items array from the selected items
      const items = itemsToDisplay.map(item => {
        // Check if it's an education achievement (has achievement type with school-related properties)
        let itemType: string = item.type;
        if (
          item.type === 'achievement' &&
          ((item as AchievementItem).schoolName ||
            (item as AchievementItem).schoolLogo)
        ) {
          itemType = 'education_achievement';
        } else if (item.type === 'achievement' && (item as AchievementItem).subtitle?.includes('Hobby')) {
          // Check if it's a hobby achievement
          itemType = 'hobby_achievement';
        } else if (item.type === 'achievement' && (item as AchievementItem).subtitle?.includes('Skill')) {
          // Check if it's a skill achievement
          itemType = 'skill_achievement';
        } else if (item.type === 'achievement' && (item as AchievementItem).subtitle?.includes('Aspiration')) {
          // Check if it's an aspiration achievement
          itemType = 'aspiration_achievement';
        } else if (item.type === 'hobby_achievement' || item.type === 'skill_achievement' || item.type === 'aspiration_achievement') {
          // Already identified types, use as is
          itemType = item.type;
        } else if (item.type === 'education') {
          itemType = 'education';
        }
        return {
          itemType: itemType,
          itemId: item.id,
        };
      });

      const requestData = {
        officialName: request.hrName,
        officialEmail: request.hrEmail,
        countryCode: request.countryCode,
        contactNumber: request.hrPhone,
        linkedInUrl: request.hrLinkedin,
        items: items,
        customMessage: request.additionalInfo || 'Hi, please verify my role',
      };

      const response = await sendHRVerificationRequest(requestData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'HR verification request sent successfully!',
      });
      console.log('HR verification request response:', response.data);

      // Clear the HR request fields after successful API call
      setHrRequests(prev =>
        prev.map(req => {
          if (req.id === requestId) {
            return {
              ...req,
              hrName: '',
              hrEmail: '',
              hrPhone: '',
              countryCode: '+1',
              hrLinkedin: '',
              additionalInfo: '',
            };
          }
          return req;
        }),
      );
    } catch (error: any) {
      console.error(
        'Error sending HR verification request:',
        error.response?.data?.message || error.message,
      );
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message ||
          error.message ||
          'Failed to send HR verification request',
      });
    } finally {
      // Set loading state to false for this specific HR request
      setLoadingStates(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const sendAllInvitations = () => {
    const validInvitations = invitations.filter(inv => inv.email.trim());
    if (validInvitations.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter at least one email address',
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: `${validInvitations.length} invitation(s) sent successfully!`,
    });
    // Here you would implement the actual sending logic
  };

  const renderSelectedItem = () => {
    return itemsToDisplay.map((item, index) => {
      console.log('item in renderSelectedItem =>', item);

      // Check if it's an education item
      if (item.type === 'education') {
        const educationItem = item as EducationItem;
        return (
          <View
            key={`${educationItem.id}-${index}`}
            style={styles.selectedItemCard}
          >
            <View style={styles.cardHeader}>
              {educationItem.schoolLogo ? (
                <Image
                  source={{ uri: educationItem.schoolLogo }}
                  style={styles.companyLogo}
                />
              ) : (
                <View style={styles.googleIcon}>
                  <Text style={styles.googleText}>
                    {educationItem.schoolName?.charAt(0) || 'S'}
                  </Text>
                </View>
              )}
              <View style={styles.cardContent}>
                {educationItem.schoolName && (
                  <Text style={styles.companyName}>
                    {educationItem.schoolName}
                  </Text>
                )}
                <View style={styles.periodContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={[styles.calendarIcon]}
                  />
                  <Text style={styles.period}>{educationItem.dateRange}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.description}>{educationItem.description}</Text>
          </View>
        );
      }

      // Check if it's an achievement item (could be from education, hobby, skill, or aspiration verification)
      if (item.type === 'achievement' || item.type === 'hobby_achievement' || item.type === 'education_achievement' || item.type === 'skill_achievement' || item.type === 'aspiration_achievement') {
        const achievementItem = item as AchievementItem;
        console.log(achievementItem,"qqqqqqqqq")
        return (
          <View
            key={`${achievementItem.id}-${index}`}
            style={styles.selectedItemCard}
          >
            <View style={styles.cardHeader}>
              {/* Use hobby logo if available (for hobby achievements), otherwise school logo if available (for education achievements), otherwise company logo */}
              {achievementItem.hobbyLogo ? (
                <Image
                  source={{ uri: achievementItem.hobbyLogo }}
                  style={styles.companyLogo}
                />
              ) : achievementItem.schoolLogo ? (
                <Image
                  source={{ uri: achievementItem.schoolLogo }}
                  style={styles.companyLogo}
                />
              ) : achievementItem.companyLogo ? (
                <Image
                  source={{ uri: achievementItem.companyLogo }}
                  style={styles.companyLogo}
                />
              ) : (
                <View style={styles.googleIcon}>
                  <Text style={styles.googleText}>
                    {achievementItem.hobbyName?.charAt(0) ||
                      achievementItem.schoolName?.charAt(0) ||
                      achievementItem.companyName?.charAt(0) ||
                      achievementItem.hobbyName?.charAt(0) ||
                      achievementItem.skillName?.charAt(0) ||
                      achievementItem.aspirationName?.charAt(0) ||
                      'A'}
                  </Text>
                </View>
              )}
              <View style={styles.cardContent}>
                {/* Show hobby name if it's a hobby achievement, otherwise school name if it's an education achievement, otherwise company name */}
                {(achievementItem.hobbyName ||
                  achievementItem.schoolName ||
                  achievementItem.companyName) && (
                  <Text style={styles.companyName}>
                    {achievementItem.hobbyName || achievementItem.schoolName || achievementItem.companyName || achievementItem.skillName}
                  </Text>
                )}
                <Text style={styles.cardTitle}>{achievementItem.title}</Text>
                {item.subtitle && (
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                )}
                {item.role && <Text style={styles.cardRole}>{item.role}</Text>}
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.periodContainer}>
              <Image
                source={require('../../assets/icons/calendar.png')}
                style={[styles.calendarIcon]}
              />
              <Text style={styles.period}>{achievementItem.dateRange}</Text>
            </View>

            <Text style={styles.description}>
              {achievementItem.description}
            </Text>
          </View>
        );
      }

      // Check if it's a hobby item
      if (item.type === 'hobby') {
        const hobbyItem = item as HobbyItem;
        console.log(hobbyItem,"sfdfdfgfggg")
        return (
          <View
            key={`${hobbyItem.id}-${index}`}
            style={styles.selectedItemCard}
          >
            <View style={styles.cardHeader}>
              {/* Use hobby logo if available */}
              {hobbyItem.hobbyLogo ? (
                <Image
                  source={{ uri: hobbyItem.hobbyLogo }}
                  style={styles.companyLogo}
                />
              ) : (
                <View style={styles.googleIcon}>
                  <Text style={styles.googleText}>
                    {hobbyItem.hobbyName?.charAt(0) || 'H'}
                  </Text>
                </View>
              )}
              <View style={styles.cardContent}>
                {/* Show hobby name */}
                {hobbyItem.hobbyName && (
                  <Text style={styles.companyName}>{hobbyItem.hobbyName}</Text>
                )}
                <Text style={styles.cardTitle}>{hobbyItem.title}</Text>
                {/* Date Range */}
                <View style={styles.periodContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={[styles.calendarIcon]}
                  />
                  <Text style={styles.period}>{hobbyItem.dateRange}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.description}>{hobbyItem.description}</Text>
          </View>
        );
      }

      // Check if it's a skill item
      if (item.type === 'skill') {
        const skillItem = item as SkillItem;
        return (
          <View
            key={`${skillItem.id}-${index}`}
            style={styles.selectedItemCard}
          >
            <View style={styles.cardHeader}>
              {/* Use user profile picture if available */}
              {skillItem.mediaUrl ? (
                <Image
                  source={{ uri: skillItem.mediaUrl }}
                  style={styles.companyLogo}
                />
              ) : (
                <View style={styles.googleIcon}>
                  <Text style={styles.googleText}>
                    {skillItem.user.fullName?.charAt(0) || 'S'}
                  </Text>
                </View>
              )}
              <View style={styles.cardContent}>
                {/* Show user name */}
                {skillItem.user.fullName && (
                  <Text style={styles.companyName}>{skillItem.skillName}</Text>
                )}
                <View style={styles.periodContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={[styles.calendarIcon]}
                  />
                  <Text style={styles.period}>{skillItem.dateRange}</Text>
                </View>
                {item.subtitle && (
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                )}
                {item.role && <Text style={styles.cardRole}>{item.role}</Text>}
              </View>
            </View>

            <Text style={styles.description}>{skillItem.description}</Text>
          </View>
        );
      }

      // Check if it's an aspiration item
      if (item.type === 'aspiration') {
        const aspirationItem = item as AspirationItem;
        return (
          <View
            key={`${aspirationItem.id}-${index}`}
            style={styles.selectedItemCard}
          >
            <View style={styles.cardHeader}>
              {/* Use aspiration icon */}
              <View style={styles.googleIcon}>
                <Text style={styles.googleText}>🎯</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{aspirationItem.goal}</Text>
                {item.subtitle && (
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                )}
                {item.role && <Text style={styles.cardRole}>{item.role}</Text>}
                <View style={styles.periodContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={[styles.calendarIcon]}
                  />
                  <Text style={styles.period}>{aspirationItem.dateRange}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.description}>
              {aspirationItem.whyItMatters}
            </Text>
          </View>
        );
      }

      // For position items (existing logic)
      const positionItem = item as PositionItem;
      return (
        <View
          key={`${positionItem.id}-${index}`}
          style={styles.selectedItemCard}
        >
          <View style={styles.cardHeader}>
            {positionItem.companyLogo ? (
              <Image
                source={{ uri: positionItem.companyLogo }}
                style={styles.companyLogo}
              />
            ) : (
              <View style={styles.googleIcon}>
                <Text style={styles.googleText}>
                  {positionItem.companyName?.charAt(0) || 'G'}
                </Text>
              </View>
            )}
            <View style={styles.cardContent}>
              {positionItem.companyName && (
                <Text style={styles.companyName}>
                  {positionItem.companyName}
                </Text>
              )}
              <Text style={styles.cardTitle}>{positionItem.title}</Text>
              {positionItem.subtitle && (
                <Text style={styles.cardSubtitle}>{positionItem.subtitle}</Text>
              )}
              {positionItem.role && (
                <Text style={styles.cardRole}>{positionItem.role}</Text>
              )}
            </View>
          </View>
          <View style={styles.periodContainer}>
            <Image
              source={require('../../assets/icons/calendar.png')}
              style={[styles.calendarIcon]}
            />
            <Text style={styles.period}>{positionItem.dateRange}</Text>
          </View>
          <Text style={styles.description}>{positionItem.description}</Text>
        </View>
      );
    });
  };

  const renderInvitationForm = (invitation: InvitationItem, index: number) => {
    const currentSelectedSkills = invitation.selectedSkills || [];

    return (
      <View key={invitation.id} style={styles.invitationSection}>
        <Text style={styles.personTitle}>Person {invitation.id}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.emailInput}
            placeholder="paul@google.com"
            value={invitation.email}
            onChangeText={text =>
              updateInvitation(invitation.id, 'email', text)
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.messageLabel}>Custom message (optional)</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Hey Paul! Could you please validate that I worked in this role for about a year? I'd really appreciate your help. Thank you!"
          value={invitation.customMessage}
          onChangeText={text =>
            updateInvitation(invitation.id, 'customMessage', text)
          }
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Skills verification field */}
        <Text style={styles.messageLabel}>
          What would you like this person to verify?
        </Text>
        <TouchableOpacity
          style={[styles.messageInput, styles.skillsInput]}
          onPress={() => openSkillsDropdown(invitation.id)}
        >
          <Text
            style={[
              styles.messageInputText,
              !currentSelectedSkills.length && { color: '#999' },
            ]}
          >
            {currentSelectedSkills.length > 0
              ? `${currentSelectedSkills.length} skill${
                  currentSelectedSkills.length > 1 ? 's' : ''
                } selected`
              : 'Select skills to verify...'}
          </Text>
        </TouchableOpacity>

        {/* Render selected skills as badges for this invitation */}
        {renderSelectedSkills(currentSelectedSkills, invitation.id)}

        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => sendInvitation(invitation.id)}
          disabled={loadingStates[invitation.id]}
        >
          {loadingStates[invitation.id] ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderHrForm = (hrRequest: {
    id: number;
    hrName: string;
    hrEmail: string;
    hrPhone: string;
    countryCode: string;
    countryName: string;
    countryFlag: string;
    hrLinkedin: string;
    additionalInfo: string;
  }) => (
    <View key={hrRequest.id} style={styles.hrFormContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {itemsToDisplay.some(
            item =>
              item.type === 'education' ||
              (item.type === 'achievement' &&
                (item as AchievementItem).schoolName),
          )
            ? 'Registrar Name'
            : 'HR Name'}
        </Text>
        <TextInput
          style={styles.textInput}
          value={hrRequest.hrName}
          onChangeText={text => updateHrRequest(hrRequest.id, 'hrName', text)}
          placeholder={
            itemsToDisplay.some(
              item =>
                item.type === 'education' ||
                (item.type === 'achievement' &&
                  (item as AchievementItem).schoolName),
            )
              ? 'Enter Registrar representative name'
              : 'Enter HR representative name'
          }
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {itemsToDisplay.some(
            item =>
              item.type === 'education' ||
              (item.type === 'achievement' &&
                (item as AchievementItem).schoolName),
          )
            ? 'Registrar Email'
            : 'HR Email'}
        </Text>
        <TextInput
          style={styles.textInput}
          value={hrRequest.hrEmail}
          onChangeText={text => updateHrRequest(hrRequest.id, 'hrEmail', text)}
          placeholder={
            itemsToDisplay.some(
              item =>
                item.type === 'education' ||
                (item.type === 'achievement' &&
                  (item as AchievementItem).schoolName),
            )
              ? 'registrar@university.edu'
              : 'hr@company.com'
          }
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {itemsToDisplay.some(
            item =>
              item.type === 'education' ||
              (item.type === 'achievement' &&
                (item as AchievementItem).schoolName),
          )
            ? 'Registrar Phone Number'
            : 'HR Phone Number'}
        </Text>
        <View style={styles.phoneInputContainer}>
          <TouchableOpacity
            style={styles.countryCodeButton}
            onPress={() => openCountryPicker(hrRequest.id)}
          >
            <Text style={styles.countryFlag}>{hrRequest.countryFlag}</Text>
            <Text style={styles.countryCodeText}>{hrRequest.countryCode}</Text>
            <Image
              source={require('../../assets/icons/down.png')}
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>
          <TextInput
            style={[styles.textInput, styles.phoneInput]}
            value={hrRequest.hrPhone}
            onChangeText={text => {
              // Only allow numeric input and limit to 10 digits
              const numericText = text.replace(/[^0-9]/g, '').substring(0, 10);
              updateHrRequest(hrRequest.id, 'hrPhone', numericText);
            }}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {itemsToDisplay.some(
            item =>
              item.type === 'education' ||
              (item.type === 'achievement' &&
                (item as AchievementItem).schoolName),
          )
            ? 'Registrar LinkedIn URL'
            : 'HR LinkedIn URL'}
        </Text>
        <TextInput
          style={styles.textInput}
          value={hrRequest.hrLinkedin}
          onChangeText={text =>
            updateHrRequest(hrRequest.id, 'hrLinkedin', text)
          }
          placeholder="LinkedIn profile URL"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Any things we should know before contacting them?
        </Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={hrRequest.additionalInfo}
          onChangeText={text =>
            updateHrRequest(hrRequest.id, 'additionalInfo', text)
          }
          placeholder="Additional information..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => sendHrRequest(hrRequest.id)}
        disabled={loadingStates[hrRequest.id]}
      >
        {loadingStates[hrRequest.id] ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.sendButtonText}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render the selected skills as badges for a specific invitation
  const renderSelectedSkills = (
    selectedSkills: SkillItem[],
    invitationId: number,
  ) => {
    if (selectedSkills.length === 0) return null;

    const removeSkill = (skill: SkillItem) => {
      setInvitations(prev =>
        prev.map(inv => {
          if (inv.id === invitationId) {
            return {
              ...inv,
              selectedSkills: inv.selectedSkills.filter(s => s.id !== skill.id),
            };
          }
          return inv;
        }),
      );
    };

    return (
      <View style={styles.selectedSkillsContainer}>
        {selectedSkills.map(skill => (
          <View key={skill.id} style={styles.skillBadge}>
            <Text style={styles.skillBadgeText}>{skill.name}</Text>
            <TouchableOpacity
              style={styles.skillBadgeRemove}
              onPress={() => removeSkill(skill)}
            >
              <Text style={styles.skillBadgeRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  // Get current selected skills for the modal
  const getCurrentSelectedSkills = () => {
    if (currentEditingInvitationId === null) return [];
    const invitation = invitations.find(
      inv => inv.id === currentEditingInvitationId,
    );
    return invitation ? invitation.selectedSkills : [];
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../../assets/icons/back.png')}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification</Text>
        </View>

        {renderSelectedItem()}

        <View style={styles.verificationsSection}>
          <Text style={styles.sectionTitle}>Ask for your verifications</Text>
          <Text style={styles.sectionDescription}>
            Tip: Invite at least two people to boost your chances of getting
            verified faster.
          </Text>
          <Text style={styles.tipText}>
            Tip 2: To earn a 100% verified badge, ensure our email finds
            suitable individuals who were present for your entire auditor.
            Otherwise, your validation will be capped at 10% (up to a maximum of
            60%).
          </Text>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Invite 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Invite 2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Invite 3</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Validate</Text>
            </TouchableOpacity>
          </View>

          {invitations.map((invitation, index) =>
            renderInvitationForm(invitation, index),
          )}

          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={addMoreInvitation}
          >
            <Text style={styles.addMoreText}>Add More</Text>
            <Text style={styles.addMoreIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.shareSection}>
          <Text style={styles.shareText}>Shareable link</Text>
          <View style={styles.shareLinkContainer}>
            <Text style={styles.shareLink}>🔗 Copy shareable link</Text>
          </View>
        </View> */}

        {/* HR/Registrar Verification Section - Only show for positions, education, and achievements */}
        {(itemsToDisplay.some(
          item =>
            item.type === 'position' ||
            item.type === 'education' ||
            (item.type === 'achievement' &&
              !(item as AchievementItem).schoolName),
        ) ||
          itemsToDisplay.some(
            item =>
              item.type === 'achievement' &&
              (item as AchievementItem).schoolName,
          )) && (
          <View style={styles.hrSection}>
            <Text style={styles.hrSectionTitle}>
              {itemsToDisplay.some(
                item =>
                  item.type === 'education' ||
                  (item.type === 'achievement' &&
                    (item as AchievementItem).schoolName),
              )
                ? 'Ask for a Registrar verification'
                : 'Ask for an HR verification'}
            </Text>
            <Text style={styles.hrSectionDescription}>
              {itemsToDisplay.some(
                item =>
                  item.type === 'education' ||
                  (item.type === 'achievement' &&
                    (item as AchievementItem).schoolName),
              )
                ? "The gold standard. We'll contact the school's Registrar directly to verify this education. As soon as it's verified we'll add a \"Registrar Verified\" badge next to your education."
                : "The gold standard. We'll contact the company's HR directly to verify this experience. As soon as it's verified we'll add an \"HR Verified\" badge next to your role."}
            </Text>

            {hrRequests.map(request => renderHrForm(request))}

            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={addMoreHrRequest}
            >
              <Text style={styles.addMoreText}>Add More</Text>
              <Text style={styles.addMoreIcon}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        <VerificationSystem />
        <FAQComponent />
      </ScrollView>

      {showCountryPicker && (
        <CountryPicker
          show={showCountryPicker}
          pickerButtonOnPress={onSelectCountry}
          onBackdropPress={() => {
            setShowCountryPicker(false);
            setCurrentCountryPickerId(null);
          }}
          style={{
            modal: {
              height: 500,
              backgroundColor: '#fff',
            },
            textInput: {
              height: 50,
              borderRadius: 8,
              paddingHorizontal: 12,
              fontSize: 16,
            },
            countryButtonStyles: {
              height: 50,
            },
            searchMessageText: {
              color: '#666',
            },
          }}
          searchMessage="Search country"
          lang={''}
        />
      )}

      {/* Single Modal at root level */}
      <Modal
        visible={showSkillsDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSkillsDropdown}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Skills</Text>
              <TouchableOpacity onPress={closeSkillsDropdown}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search skills..."
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
            </View>

            <FlatList
              data={filteredSkills}
              keyExtractor={item => item.id.toString()}
              ListEmptyComponent={
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No skills found</Text>
                  <TouchableOpacity
                    style={styles.addSkillButton}
                    onPress={() => {
                      // Show confirmation modal before adding skill
                      setShowConfirmationModal(true);
                    }}
                  >
                    <Text style={styles.addSkillButtonText}>+ Add Skill</Text>
                  </TouchableOpacity>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = getCurrentSelectedSkills().some(
                  s => s.id === item.id,
                );
                return (
                  <TouchableOpacity
                    style={[
                      styles.skillItem,
                      isSelected && styles.skillItemSelected,
                    ]}
                    onPress={() => toggleSkillSelection(item)}
                  >
                    <Text style={styles.skillItemText}>{item.name}</Text>
                    {/* <Text style={styles.skillItemLevel}>{item.skillLevel}</Text> */}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalOkButton}
                onPress={closeSkillsDropdown}
              >
                <Text style={styles.modalOkButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Confirmation Modal for Adding New Skill */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.confirmationModalContainer}>
          <View style={styles.confirmationModalContent}>
            <Text style={styles.confirmationModalTitle}>Add New Skill</Text>
            <Text style={styles.confirmationModalMessage}>
              Are you sure you want to add "{searchQuery}" as a new skill?
            </Text>
            <View style={styles.confirmationModalActions}>
              <TouchableOpacity
                style={styles.confirmationCancelButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text style={styles.confirmationCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmationAddButton}
                onPress={async () => {
                  try {
                    // Call the addMasterSkill API with the search query as the name
                    const response = await addMasterSkill({ name: searchQuery });
                    
                    if (response.data.success) {
                      // Add the new skill to the skills list
                      setSkills([...skills, { id: response.data.data.id, name: searchQuery }]);
                      
                      // Close the confirmation modal and the skills dropdown
                      setShowConfirmationModal(false);
                      closeSkillsDropdown();
                      setSearchQuery('');
                      
                      // Show success toast
                      Toast.show({
                        type: 'success',
                        text1: 'Success',
                        text2: 'Skill added successfully!',
                      });
                    } else {
                      throw new Error(response.data.message || 'Failed to add skill');
                    }
                  } catch (error: any) {
                    console.error('Error adding skill:', error);
                    Toast.show({
                      type: 'error',
                      text1: 'Error',
                      text2: error.message || 'Failed to add skill',
                    });
                  }
                }}
              >
                <Text style={styles.confirmationAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default VerificationStep2;

const styles = StyleSheet.create({
  // ... keep all your existing styles exactly as they are ...
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  backArrow: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedItemCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  googleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    // fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardRole: {
    fontSize: 14,
    color: '#666',
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarIcon: {
    width: 14,
    height: 14,
    fontSize: 14,
    marginRight: 8,
  },
  period: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000',
    borderRadius: 8,
    marginVertical: 20,
    marginHorizontal: 16,
  },
  addItemIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  addItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  verificationsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  invitationSection: {
    marginBottom: 24,
  },
  personTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  messageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 100,
    marginBottom: 16,
  },
  messageInputText: {
    fontSize: 14,
    color: '#333',
  },
  skillsInput: {
    minHeight: 40,
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: '#57B915',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  addMoreText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  addMoreIcon: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  shareSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  shareText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  shareLinkContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  shareLink: {
    color: '#fff',
    fontSize: 16,
  },
  // HR Section Styles
  hrSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  hrSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hrSectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  hrFormContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#33',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 100,
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    resizeMode: 'contain',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 4,
  },
  // Skills selection styles
  selectedSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillBadgeText: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 6,
  },
  skillBadgeRemove: {
    padding: 2,
  },
  skillBadgeRemoveText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Skills dropdown modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#999',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  skillItemSelected: {
    backgroundColor: '#e8f5e8',
  },
  skillItemText: {
    fontSize: 16,
    color: '#333',
  },
  skillItemLevel: {
    fontSize: 14,
    color: '#666',
  },
  modalFooter: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalOkButton: {
    backgroundColor: '#57B915',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalOkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginRight: 8,
    minWidth: 100,
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    marginRight: 4,
  },
  dropdownIcon: {
    width: 12,
    height: 12,
    tintColor: '#666',
  },
  phoneInput: {
    flex: 1,
    marginLeft: 0,
  },

  // Country picker modal styles
  countryPickerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  countryPickerContent: {
    width: '90%',
    height: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  countryPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // Styles for the no results view in skill dropdown
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  addSkillButton: {
    backgroundColor: '#57B915',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addSkillButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Confirmation modal styles
  confirmationModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmationModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  confirmationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationModalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  confirmationCancelButton: {
    flex: 1,
    backgroundColor: '#e1e5e9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  confirmationCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmationAddButton: {
    flex: 1,
    backgroundColor: '#57B915',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  confirmationAddText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
