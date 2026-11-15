import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import FAQComponent from '../../components/Faq';
import {
  receivedVerificationRequest,
  sentVerificationRequest,
  validationRequest,
  checkCompanyPosition,
  getValidationOptions,
  cancelVerificationRequest,
} from '../../api/service';

// Define the stack navigator params
type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ChatInterface: undefined;
  Verification: undefined;
  Home: undefined;
  VerificationStep2: undefined;
  VerificationRequest: undefined;
  VerifcationConfirmation: { 
    requestId?: number | string; 
    itemId?: number | string;
    hasPosition?: boolean;
    userPosition?: any;
    requesterName?: string;
    positionData?: any;
    itemData?: any;
  };
};

type VerificationRequestScreenNavigationProp =
  StackNavigationProp<RootStackParamList>;

// Define interfaces based on the API response structure
interface Company {
  id: number | string;
  name: string;
  logo: string;
}

interface User {
  id: number | string;
  fullName: string;
  profilePicture: string;
}

interface Requester {
  id: number | string;
  fullName: string;
  profilePicture: string;
  currentCompany?: string;
  currentDesignation?: string;
}

interface Position {
  id: number | string;
  title: string;
  employmentType: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  description: string;
  formattedDateRange: string;
  isCurrentlyWorking: boolean;
  company: Company;
  user: User;
}

interface VerificationRequest {
  id: number | string;
  itemId?: number | string;
  requestId?: number | string;
  status: string;
  createdAt: string;
  formattedRequestDate: string;
  position: Position;
  requester: Requester;
  recipientEmail?: string;
  recipientName?: string;
  customMessage?: string;
  rawItem?: any;
  validation: any; // Could be more specific based on actual validation structure
}

// Define the tab types
type TabType = 'pending' | 'in_progress' | 'accepted' | 'rejected' | 'sent';

const VerificationRequest = () => {
  const navigation = useNavigation<VerificationRequestScreenNavigationProp>();
  const route = useRoute<any>();
  const initialTabParam: TabType | undefined = route.params?.initialTab;

  // State for API data and loading
  const [requests, setRequests] = useState<
    Record<TabType, VerificationRequest[]>
  >({
    pending: [],
    in_progress: [],
    accepted: [],
    rejected: [],
    sent: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [tabLoading, setTabLoading] = useState<Record<TabType, boolean>>({
    pending: false,
    in_progress: false,
    accepted: false,
    rejected: false,
    sent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(
    initialTabParam || 'pending',
  );
  const loadedTabsRef = useRef<Set<TabType>>(new Set());
  const tabLoadingRef = useRef<Record<TabType, boolean>>({
    pending: false,
    in_progress: false,
    accepted: false,
    rejected: false,
    sent: false,
  });
  const [loadingButtons, setLoadingButtons] = useState<{
    validate: number | string | null;
    decline: number | string | null;
  }>({
    validate: null,
    decline: null,
  }); // Track which button is loading

  useEffect(() => {
    if (initialTabParam) {
      setActiveTab(initialTabParam);
    }
  }, [initialTabParam]);

  // Fetch verification requests from API based on type
  const fetchRequests = useCallback(async (type: TabType) => {
    try {
      if (type === 'sent') {
        const sentResponse = await sentVerificationRequest();
        const sentRequests = sentResponse.data?.data?.requests || [];
        const sentItemsList: any[] = [];
        sentRequests.forEach((req: any) => {
          const recipientName =
            req.validator?.fullName || req.validatorEmail || 'Peer';
          (req.items || []).forEach((item: any) => {
            const details = item.details || {};
            let dateRange = details.dateRange;
            if (!dateRange && (details.startYear || details.endYear)) {
              const start = details.startMonth
                ? `${details.startMonth}/${details.startYear}`
                : details.startYear;
              const end = details.endYear
                ? `${details.endMonth ? `${details.endMonth}/` : ''}${details.endYear}`
                : 'Present';
              dateRange = `${start} - ${end}`;
            }
            const itemTitle =
              details.title ||
              details.degree ||
              details.skillName ||
              details.hobbyName ||
              details.goal ||
              item.itemType;
            const orgName =
              details.company ||
              details.school ||
              (item.itemType?.includes('skill')
                ? 'Skill'
                : item.itemType?.includes('hobby')
                ? 'Hobby'
                : item.itemType?.includes('aspiration')
                ? 'Aspiration'
                : item.itemType);
            sentItemsList.push({
              id: item.id,
              itemId: item.id,
              requestId: req.id,
              status: item.status || req.status || 'pending',
              createdAt: req.createdAt,
              formattedRequestDate: req.createdAt
                ? new Date(req.createdAt).toLocaleDateString()
                : '',
              recipientEmail: req.validatorEmail,
              recipientName,
              customMessage: req.customMessage,
              requester: {
                id:
                  req.validator?._id ||
                  req.validator?.id ||
                  req.validatorEmail ||
                  req.id,
                fullName: recipientName,
                profilePicture: req.validator?.profilePicture || '',
              },
              position: {
                id: item.itemId,
                title: itemTitle,
                description:
                  details.description ||
                  details.fieldOfStudy ||
                  details.whyItMatters ||
                  '',
                formattedDateRange: dateRange || '',
                company: {
                  id: details.companyId || details.schoolId || '',
                  name: orgName,
                  logo: details.companyLogo || details.schoolLogo || '',
                },
                type: item.itemType,
              },
              rawItem: item,
            });
          });
        });
        return sentItemsList;
      }

      const response = await receivedVerificationRequest(type);
      const apiResponse = response.data;
      const rawData = apiResponse?.data;
      console.log(rawData, 'api response for', type);

      const statusMap: Record<Exclude<TabType, 'sent'>, string> = {
        pending: 'pending',
        in_progress: 'in_progress',
        accepted: 'verified',
        rejected: 'rejected',
      };
      const targetStatus = statusMap[type];

      if (rawData?.requesterGroups) {
        const itemsList: any[] = [];
        rawData.requesterGroups.forEach((group: any) => {
          const requester = group.requester || {};
          (group.requests || []).forEach((req: any) => {
            (req.items || []).forEach((item: any) => {
              if (item.status === targetStatus) {
                const details = item.details || {};
                let dateRange = details.dateRange;
                if (!dateRange && (details.startYear || details.endYear)) {
                  const start = details.startMonth
                    ? `${details.startMonth}/${details.startYear}`
                    : details.startYear;
                  const end = details.endYear
                    ? `${details.endMonth ? `${details.endMonth}/` : ''}${details.endYear}`
                    : 'Present';
                  dateRange = `${start} - ${end}`;
                }
                const itemTitle =
                  details.title ||
                  details.degree ||
                  details.skillName ||
                  details.hobbyName ||
                  details.goal ||
                  item.itemType;
                const orgName =
                  details.company ||
                  details.school ||
                  (item.itemType?.includes('skill')
                    ? 'Skill'
                    : item.itemType?.includes('hobby')
                    ? 'Hobby'
                    : item.itemType?.includes('aspiration')
                    ? 'Aspiration'
                    : item.itemType);

                itemsList.push({
                  id: item.id,
                  itemId: item.id,
                  requestId: req.id,
                  status: item.status,
                  createdAt: req.createdAt,
                  formattedRequestDate: req.createdAt
                    ? new Date(req.createdAt).toLocaleDateString()
                    : '',
                  requester: {
                    id: requester._id || requester.id,
                    fullName: requester.fullName || requester.name || 'Peer',
                    profilePicture: requester.profilePicture,
                  },
                  position: {
                    id: item.itemId,
                    title: itemTitle,
                    description:
                      details.description ||
                      details.fieldOfStudy ||
                      details.whyItMatters ||
                      '',
                    formattedDateRange: dateRange || '',
                    company: {
                      id: details.companyId || details.schoolId || '',
                      name: orgName,
                      logo: details.companyLogo || details.schoolLogo || '',
                    },
                    type: item.itemType,
                  },
                  rawItem: item,
                });
              }
            });
          });
        });
        return itemsList;
      }

      if (rawData?.validationRequests) {
        return rawData.validationRequests;
      }

      return [];
    } catch (err: any) {
      console.error(`Error fetching ${type} verification requests:`, err);
      return [];
    }
  }, []);

  // Fetch data for a specific tab
  const fetchTabData = useCallback(
    async (tab: TabType, forceRefresh = false) => {
      // Don't fetch if already loaded (unless force refresh) or currently loading
      if (
        (loadedTabsRef.current.has(tab) && !forceRefresh) ||
        tabLoadingRef.current[tab]
      ) {
        return;
      }

      try {
        tabLoadingRef.current[tab] = true;
        setTabLoading(prev => ({ ...prev, [tab]: true }));

        const tabRequests = await fetchRequests(tab);

        setRequests(prev => ({
          ...prev,
          [tab]: tabRequests,
        }));

        if (!forceRefresh) {
          loadedTabsRef.current.add(tab);
        }
        setError(null);
      } catch (err: any) {
        console.error(`Failed to fetch ${tab} requests:`, err);
        setRequests(prev => ({
          ...prev,
          [tab]: [],
        }));
      } finally {
        tabLoadingRef.current[tab] = false;
        setTabLoading(prev => ({ ...prev, [tab]: false }));
      }
    },
    [fetchRequests],
  );

  // Initial load - only fetch pending tab
  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        await fetchTabData('pending');
      } catch (err: any) {
        setError(err.message || 'Failed to fetch verification requests');
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, [fetchTabData]);

  // Fetch data when active tab changes - FIXED: Only fetch if not loaded
  useEffect(() => {
    if (
      activeTab &&
      !loadedTabsRef.current.has(activeTab) &&
      !tabLoadingRef.current[activeTab]
    ) {
      fetchTabData(activeTab);
    }
  }, [activeTab, fetchTabData]);

  // Refresh current tab when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (activeTab) {
        fetchTabData(activeTab, true); // Force refresh current tab
      }
    }, [activeTab, fetchTabData]),
  );

  // Manual refresh function
  const refreshAllTabs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Refresh current tab
      await fetchTabData(activeTab, true);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh requests');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Data will be fetched in the useEffect if not already loaded
  };

  const resolveValidationNavigation = async (verificationRequest: any) => {
    const requestId = verificationRequest?.requestId;
    const itemId = verificationRequest?.id;
    let hasPosition = true;
    let userPosition: any = null;

    if (requestId && itemId) {
      try {
        const optRes = await getValidationOptions(requestId, itemId);
        const optData = optRes.data?.data;
        if (optData) {
          if (optData.needsEducation) {
            Alert.alert(
              'Education Required',
              `Please add your education at ${
                verificationRequest?.position?.company?.name || 'this school'
              } on your Profile before verifying this item.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Go to Profile',
                  onPress: () =>
                    navigation.navigate('Home' as any, { screen: 'Profile' }),
                },
              ],
            );
            return false;
          }

          if (optData.needsPosition) {
            hasPosition = false;
            userPosition = null;
          } else if (optData.overlappingPositions?.length > 0) {
            hasPosition = true;
            userPosition = { positions: optData.overlappingPositions };
          } else if (optData.overlappingEducations?.length > 0) {
            hasPosition = true;
            userPosition = {
              positions: optData.overlappingEducations.map((e: any) => ({
                ...e,
                title: e.degree || e.fieldOfStudy || e.title || 'Education',
              })),
            };
          } else {
            hasPosition = true;
            userPosition = null;
          }

          await fetchTabData(activeTab, true);
          navigation.navigate('VerifcationConfirmation', {
            requestId,
            itemId,
            hasPosition,
            userPosition,
            requesterName: verificationRequest?.requester?.fullName,
            positionData: verificationRequest?.position,
            itemData: verificationRequest?.rawItem,
          });
          return true;
        }
      } catch (optErr) {
        console.warn('getValidationOptions fallback:', optErr);
      }
    }

    const itemType = verificationRequest?.position?.type;
    const isCompanyItem =
      itemType === 'position' || itemType === 'achievement';
    if (isCompanyItem && verificationRequest?.position?.company?.id) {
      hasPosition = false;
      try {
        const positionCheckResponse = await checkCompanyPosition(
          verificationRequest.position.company.id,
        );
        hasPosition = Boolean(positionCheckResponse.data?.data?.hasPosition);
        userPosition = positionCheckResponse.data?.data?.userPosition || null;
      } catch (_) {}
    } else {
      hasPosition = true;
    }

    await fetchTabData(activeTab, true);
    navigation.navigate('VerifcationConfirmation', {
      requestId: verificationRequest?.requestId || itemId,
      itemId,
      hasPosition,
      userPosition,
      requesterName: verificationRequest?.requester?.fullName,
      positionData: verificationRequest?.position,
      itemData: verificationRequest?.rawItem,
    });
    return true;
  };

  const handleValidate = async (id: number | string) => {
    setLoadingButtons(prev => ({ ...prev, validate: id }));
    try {
      const currentRequests = requests[activeTab] as any[];
      const verificationRequest = currentRequests.find(
        req => String(req.id) === String(id),
      );
      const requestId = verificationRequest?.requestId || id;
      const itemId = verificationRequest?.id || id;

      await validationRequest(requestId, itemId, { action: 'validate' });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Request validated successfully',
      });

      await resolveValidationNavigation(verificationRequest);
    } catch (error: any) {
      console.error('Validation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message ||
          'Failed to validate request. Please try again.',
      });
    } finally {
      setLoadingButtons(prev => ({ ...prev, validate: null }));
    }
  };

  const handleContinue = async (id: number | string) => {
    setLoadingButtons(prev => ({ ...prev, validate: id }));
    try {
      const currentRequests = requests[activeTab] as any[];
      const verificationRequest = currentRequests.find(
        req => String(req.id) === String(id),
      );
      await resolveValidationNavigation(verificationRequest);
    } catch (error: any) {
      console.error('Continue error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message ||
          'Failed to continue request. Please try again.',
      });
    } finally {
      setLoadingButtons(prev => ({ ...prev, validate: null }));
    }
  };

  const handleDecline = async (id: number | string) => {
    setLoadingButtons(prev => ({ ...prev, decline: id }));
    try {
      const currentRequests = requests[activeTab] as any[];
      const verificationRequest = currentRequests.find(
        req => String(req.id) === String(id),
      );
      const requestId = verificationRequest?.requestId || id;
      const itemId = verificationRequest?.id || id;

      await cancelVerificationRequest(requestId, itemId);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Request declined successfully',
      });

      // Refresh the current tab after decline
      await fetchTabData(activeTab, true);
    } catch (error: any) {
      console.error('Decline error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message ||
          'Failed to decline request. Please try again.',
      });
    } finally {
      setLoadingButtons(prev => ({ ...prev, decline: null }));
    }
  };

  // Helper function to get initials from a name
  const getInitials = (name: string): string => {
    if (!name) return '';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
  };

  // Helper function to render an image with fallback initials
  const renderImageWithFallback = (
    uri: string | undefined,
    name: string,
    style: any,
  ) => {
    if (uri) {
      return <Image source={{ uri }} style={style} />;
    } else {
      const initials = getInitials(name);
      return (
        <View style={[styles.avatarPlaceholder, style]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      );
    }
  };

  const groupRequestsByRequester = (requests: VerificationRequest[]) => {
    const grouped: Record<string, VerificationRequest[]> = {};

    requests.forEach(request => {
      const requesterId = request.requester.id;
      if (!grouped[requesterId]) {
        grouped[requesterId] = [];
      }
      grouped[requesterId].push(request);
    });

    return grouped;
  };

  const renderPositionCard = (item: VerificationRequest) => (
    <View key={item.id} style={styles.positionCard}>
      <View style={styles.companyHeader}>
        {renderImageWithFallback(
          item.position.company.logo,
          item.position.company.name,
          styles.logoImage,
        )}
        <Text style={styles.companyName}>{item.position.company.name}</Text>
      </View>

      <Text style={styles.positionTitle}>{item.position.title}</Text>

      <View style={styles.dateContainer}>
        <Text style={styles.calendarIcon}>📅</Text>
        <Text style={styles.dateText}>{item.position.formattedDateRange}</Text>
      </View>

      <Text style={styles.description}>{item.position.description}</Text>

      {activeTab === 'pending' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.validateButton,
              (String(loadingButtons.validate) === String(item.id) ||
                String(loadingButtons.decline) === String(item.id)) &&
                styles.disabledButton,
            ]}
            onPress={() => handleValidate(item.id)}
            disabled={
              String(loadingButtons.validate) === String(item.id) ||
              String(loadingButtons.decline) === String(item.id)
            }
          >
            {String(loadingButtons.validate) === String(item.id) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.validateButtonText}>Validate</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.declineButton,
              (String(loadingButtons.validate) === String(item.id) ||
                String(loadingButtons.decline) === String(item.id)) &&
                styles.disabledButton,
            ]}
            onPress={() => handleDecline(item.id)}
            disabled={
              String(loadingButtons.validate) === String(item.id) ||
              String(loadingButtons.decline) === String(item.id)
            }
          >
            {String(loadingButtons.decline) === String(item.id) ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <Text style={styles.declineButtonText}>Decline</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'in_progress' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.validateButton,
              (String(loadingButtons.validate) === String(item.id) ||
                String(loadingButtons.decline) === String(item.id)) &&
                styles.disabledButton,
            ]}
            onPress={() => handleContinue(item.id)}
            disabled={
              String(loadingButtons.validate) === String(item.id) ||
              String(loadingButtons.decline) === String(item.id)
            }
          >
            {String(loadingButtons.validate) === String(item.id) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.validateButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'sent' && (
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {item.recipientEmail ? `Sent to ${item.recipientEmail}` : 'Sent request'}
          </Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor:
                item.status === 'verified'
                  ? '#DCFCE7'
                  : item.status === 'rejected' || item.status === 'declined'
                  ? '#FEE2E2'
                  : '#FEF3C7',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color:
                  item.status === 'verified'
                    ? '#166534'
                    : item.status === 'rejected' || item.status === 'declined'
                    ? '#991B1B'
                    : '#92400E',
                textTransform: 'capitalize',
              }}
            >
              {(item.status || 'pending').replace('_', ' ')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderRequesterGroup = (
    requester: Requester,
    requests: VerificationRequest[],
  ) => (
    <View key={requester.id} style={styles.requesterGroupContainer}>
      <View style={styles.requesterCard}>
        <View style={styles.requesterInfoContainer}>
          {renderImageWithFallback(
            requester.profilePicture,
            requester.fullName,
            styles.avatarImage,
          )}
          <View style={styles.requesterContent}>
            <Text style={styles.requesterText}>
              <Text style={styles.requesterName}>{requester.fullName} </Text>
              <Text style={styles.requesterMessage}>
                {activeTab === 'sent'
                  ? 'was requested to verify your experience.'
                  : activeTab === 'accepted'
                  ? "'s experience has been confirmed."
                  : activeTab === 'rejected'
                  ? "'s experience has been rejected."
                  : 'would like you to confirm his/her experience.'}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.positionsContainer}>
        {requests.map(renderPositionCard)}
      </View>
    </View>
  );

  const renderRequestsContent = () => {
    const currentTabRequests = requests[activeTab] || [];
    const groupedRequests = groupRequestsByRequester(currentTabRequests);

    if (Object.keys(groupedRequests).length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab.replace('_', ' ')} verification requests found
          </Text>
          {!tabLoading[activeTab] && (
            <TouchableOpacity
              style={styles.refreshButtonSmall}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.refreshButtonSmallText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Show grouped layout for pending, in_progress, accepted and rejected tabs
    return Object.entries(groupedRequests).map(
      ([_requesterId, requesterRequests]) => {
        const requester = requesterRequests[0].requester;
        return renderRequesterGroup(requester, requesterRequests);
      },
    );
  };

  const renderTabButton = (tab: TabType, label: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => handleTabChange(tab)}
      disabled={tabLoading[tab]}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tab && styles.activeTabButtonText,
          tabLoading[tab] && styles.loadingTabText,
        ]}
      >
        {label}
        {tabLoading[tab] && ' ⏳'}
      </Text>
      {activeTab === tab && <View style={styles.activeTabIndicator} />}
    </TouchableOpacity>
  );

  // Show loading only for initial load of pending tab
  if (loading && activeTab === 'pending' && requests.pending.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#57B915" />
        <Text style={styles.loadingText}>Loading verification requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../../assets/icons/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Requests</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {renderTabButton('pending', 'Pending')}
          {renderTabButton('in_progress', 'In Progress')}
          {renderTabButton('accepted', 'Accepted')}
          {renderTabButton('rejected', 'Rejected')}
          {renderTabButton('sent', 'Sent')}
        </ScrollView>
      </View>

      {/* Show error message if any */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={refreshAllTabs}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Show loading indicator for current tab */}
        {tabLoading[activeTab] && requests[activeTab].length === 0 ? (
          <View style={styles.tabLoadingContainer}>
            <ActivityIndicator size="small" color="#57B915" />
            <Text style={styles.tabLoadingText}>
              Loading {activeTab} requests...
            </Text>
          </View>
        ) : (
          renderRequestsContent()
        )}

        <FAQComponent />
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  loadingTabText: {
    opacity: 0.7,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#57B915',
  },
  activeTabButtonText: {
    color: '#57B915',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    height: 2,
    backgroundColor: '#57B915',
    borderRadius: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginTop: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  tabLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorBanner: {
    backgroundColor: '#FFE6E6',
    padding: 12,
    margin: 16,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
  },
  retryLink: {
    color: '#57B915',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eaecf0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  calendarIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  validateButton: {
    flex: 1,
    backgroundColor: '#57B915',
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaecf0',
  },
  declineButtonText: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '600',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  refreshButtonSmall: {
    backgroundColor: '#57B915',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonSmallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  positionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eaecf0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  requesterGroup: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eaecf0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  positionsContainer: {
    paddingTop: 4,
  },
  notificationContent: {
    flex: 1,
  },
  requesterInfo: {
    fontSize: 12,
    color: '#667085',
  },
  requesterGroupContainer: {
    borderRadius: 16,
    marginBottom: 12,
  },
  requesterCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eaecf0',
  },
  requesterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  requesterContent: {
    flex: 1,
  },
  requesterText: {
    fontSize: 14,
    color: '#000',
    flexWrap: 'wrap',
    flexShrink: 1,
    lineHeight: 20, // Better line spacing for wrapped text
  },
  requesterName: {
    fontWeight: '600',
    color: '#000',
  },
  requesterMessage: {
    color: '#000',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default VerificationRequest;
