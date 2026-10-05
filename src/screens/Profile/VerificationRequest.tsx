import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import FAQComponent from '../../components/Faq';
import {
  receivedVerificationRequest,
  validationRequest,
  checkCompanyPosition,
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
    requestId?: number; 
    hasPosition?: boolean;
    userPosition?: any;
    requesterName?: string;
    positionData?: any;
  };
};

type VerificationRequestScreenNavigationProp =
  StackNavigationProp<RootStackParamList>;

// Define interfaces based on the API response structure
interface Company {
  id: number;
  name: string;
  logo: string;
}

interface User {
  id: number;
  fullName: string;
  profilePicture: string;
}

interface Requester {
  id: number;
  fullName: string;
  profilePicture: string;
  currentCompany?: string;
  currentDesignation?: string;
}

interface Position {
  id: number;
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
  id: number;
  status: 'pending' | 'in_progress' | 'accepted' | 'rejected';
  createdAt: string;
  formattedRequestDate: string;
  position: Position;
  requester: Requester;
  validation: any; // Could be more specific based on actual validation structure
}

interface ApiResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    validationRequests: VerificationRequest[];
  };
  error: any;
}

// Define the tab types
type TabType = 'pending' | 'in_progress' | 'accepted' | 'rejected';

const VerificationRequest = () => {
  const navigation = useNavigation<VerificationRequestScreenNavigationProp>();

  // State for API data and loading
  const [requests, setRequests] = useState<
    Record<TabType, VerificationRequest[]>
  >({
    pending: [],
    in_progress: [],
    accepted: [],
    rejected: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [tabLoading, setTabLoading] = useState<Record<TabType, boolean>>({
    pending: false,
    in_progress: false,
    accepted: false,
    rejected: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set());
  const [loadingButtons, setLoadingButtons] = useState<{
    validate: number | null;
    decline: number | null;
  }>({
    validate: null,
    decline: null,
  }); // Track which button is loading

  // Fetch verification requests from API based on type
  const fetchRequests = useCallback(async (type: TabType) => {
    try {
      const response = await receivedVerificationRequest(type);
      const apiResponse: ApiResponse = response.data;
      console.log(apiResponse.data, 'api response for', type);
      return apiResponse.data.validationRequests;
    } catch (err: any) {
      console.error(`Error fetching ${type} verification requests:`, err);
      throw err;
    }
  }, []);

  // Fetch data for a specific tab
  const fetchTabData = useCallback(
    async (tab: TabType, forceRefresh = false) => {
      // Don't fetch if already loaded (unless force refresh) or currently loading
      if ((loadedTabs.has(tab) && !forceRefresh) || tabLoading[tab]) {
        return;
      }

      try {
        setTabLoading(prev => ({ ...prev, [tab]: true }));

        const tabRequests = await fetchRequests(tab);

        setRequests(prev => ({
          ...prev,
          [tab]: tabRequests,
        }));

        if (!forceRefresh) {
          setLoadedTabs(prev => new Set(prev).add(tab));
        }
        setError(null);
      } catch (err: any) {
        console.error(`Failed to fetch ${tab} requests:`, err);
        setRequests(prev => ({
          ...prev,
          [tab]: [],
        }));
      } finally {
        setTabLoading(prev => ({ ...prev, [tab]: false }));
      }
    },
    [fetchRequests, loadedTabs, tabLoading],
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
  }, []); // Empty dependency array - only run once on mount

  // Fetch data when active tab changes - FIXED: Only fetch if not loaded
  useEffect(() => {
    if (activeTab && !loadedTabs.has(activeTab) && !tabLoading[activeTab]) {
      fetchTabData(activeTab);
    }
  }, [activeTab]); // Only depend on activeTab

  // Refresh current tab when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (activeTab) {
        fetchTabData(activeTab, true); // Force refresh current tab
      }
    }, [activeTab]), // Only depend on activeTab
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

   const handleValidate = async (id: number) => {
    setLoadingButtons(prev => ({ ...prev, validate: id }));
    try {
      const response = await validationRequest(id, { action: 'validate' });
      console.log('Validation response:', response);

      // Show toast first
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Request validated successfully',
      });

      // Get the verification request to access the company ID
      const currentRequests = requests[activeTab];
      const verificationRequest = currentRequests.find(req => req.id === id);
      
      if (verificationRequest) {
        // Check if user has a position at the same company
        const companyId = verificationRequest.position.company.id;
        const positionCheckResponse = await checkCompanyPosition(companyId);
        console.log(positionCheckResponse,"position response check")
        const hasPosition = positionCheckResponse.data.data.hasPosition;
        const userPosition = positionCheckResponse.data.data.userPosition;

      // Refresh the current tab data
      await fetchTabData(activeTab, true);
      navigation.navigate('VerifcationConfirmation', { 
        requestId: id, 
        hasPosition: hasPosition,
        userPosition: userPosition,
        requesterName: verificationRequest.requester.fullName,
        positionData: verificationRequest.position
      });
      } else {
        // If we can't find the request, navigate without position check
        navigation.navigate('VerifcationConfirmation', { requestId: id });
      }
    } catch (error) {
      console.error('Validation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to validate request. Please try again.',
      });
    } finally {
      setLoadingButtons(prev => ({ ...prev, validate: null }));
    }
  };

  const handleContinue = async (id: number) => {
    setLoadingButtons(prev => ({ ...prev, validate: id }));
    try {
      // Get the verification request to access the company ID
      const currentRequests = requests[activeTab];
      const verificationRequest = currentRequests.find(req => req.id === id);
      
      if (verificationRequest) {
        // Check if user has a position at the same company
        const companyId = verificationRequest.position.company.id;
        const positionCheckResponse = await checkCompanyPosition(companyId);
        const hasPosition = positionCheckResponse.data.data.hasPosition;
        const userPosition = positionCheckResponse.data.data.userPosition;

        // Refresh the current tab data
        await fetchTabData(activeTab, true);
        navigation.navigate('VerifcationConfirmation', { 
          requestId: id, 
          hasPosition: hasPosition,
          userPosition: userPosition,
          requesterName: verificationRequest.requester.fullName,
          positionData: verificationRequest.position
        });
      } else {
        // If we can't find the request, navigate without position check
        navigation.navigate('VerifcationConfirmation', { requestId: id });
      }
    } catch (error) {
      console.error('Continue error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to continue request. Please try again.',
      });
    } finally {
      setLoadingButtons(prev => ({ ...prev, validate: null }));
    }
  };

  const handleDecline = async (id: number) => {
    setLoadingButtons(prev => ({ ...prev, decline: id }));
    try {
      const response = await validationRequest(id, { action: 'decline' });
      console.log('Decline response:', response);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Request declined successfully',
      });

      // Refresh the current tab after decline
      await fetchTabData(activeTab, true);
    } catch (error) {
      console.error('Decline error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to decline request. Please try again.',
      });
    } finally {
      setLoadingButtons(prev => ({ ...prev, decline: null }));
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
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
              (loadingButtons.validate === item.id ||
                loadingButtons.decline === item.id) &&
                styles.disabledButton,
            ]}
            onPress={() => handleValidate(item.id)}
            disabled={
              loadingButtons.validate === item.id ||
              loadingButtons.decline === item.id
            }
          >
            {loadingButtons.validate === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.validateButtonText}>Validate</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.declineButton,
              (loadingButtons.validate === item.id ||
                loadingButtons.decline === item.id) &&
                styles.disabledButton,
            ]}
            onPress={() => handleDecline(item.id)}
            disabled={
              loadingButtons.validate === item.id ||
              loadingButtons.decline === item.id
            }
          >
            {loadingButtons.decline === item.id ? (
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
              (loadingButtons.validate === item.id ||
                loadingButtons.decline === item.id) &&
                styles.disabledButton,
            ]}
            onPress={() => handleContinue(item.id)}
            disabled={
              loadingButtons.validate === item.id ||
              loadingButtons.decline === item.id
            }
          >
            {loadingButtons.validate === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.validateButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
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
                {activeTab === 'accepted' ? '\'s experience has been confirmed.' : activeTab === 'rejected' ? '\'s experience has been rejected.' : 'would like you to confirm his/her experience.'}
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
    if (Object.keys(groupedRequests).length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab} verification requests found
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
    if (activeTab === 'pending' || activeTab === 'in_progress' || activeTab === 'accepted' || activeTab === 'rejected') {
      return Object.entries(groupedRequests).map(
        ([requesterId, requesterRequests]) => {
          const requester = requesterRequests[0].requester;
          return renderRequesterGroup(requester, requesterRequests);
        },
      );
    }

    // Show flat list for other tabs if any
    return requests[activeTab].map(renderPositionCard);
  };

  const groupedRequests = groupRequestsByRequester(requests[activeTab]);

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
        {renderTabButton('pending', 'Pending')}
        {renderTabButton('in_progress', 'In Progress')}
        {renderTabButton('accepted', 'Accepted')}
        {renderTabButton('rejected', 'Rejected')}
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
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 6,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  declineButtonText: {
    color: '#333',
    fontSize: 15,
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
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  requesterGroup: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  positionsContainer: {
    paddingTop: 10,
  },
  notificationContent: {
    flex: 1,
  },
  requesterInfo: {
    fontSize: 12,
    color: '#666',
  },
  requesterGroupContainer: {
    // margin: 16,
    borderRadius: 2,
  },
  requesterCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
