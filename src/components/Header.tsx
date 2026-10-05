import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  FlatList,
  SectionList,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { searchQuery } from '../api/service';
import { fetchUnreadNotificationCount } from '../api/service';
import { useNotification } from '../context/NotificationContext';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface User {
  id: number;
  type: string;
  fullName: string;
  username: string | null;
  profilePicture: string | null;
  isVerified: boolean;
  bio: string | null;
}

interface Company {
  id: number;
  type: string;
  name: string;
  industry: string | null;
  logo: string | null;
  isVerified: boolean;
}

interface SearchResults {
  users: User[];
  companies: Company[];
  metadata?: {
    query: string;
    page: number;
    limit: number;
    totalResults: number;
    usersCount: number;
    companiesCount: number;
  };
}

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showSearchBar?: boolean;
  showNotification?: boolean;
  onNotificationPress?: () => void;
}

interface SectionData {
  title: string;
  data: (User | Company)[];
  type: 'users' | 'companies';
}

const Header: React.FC<HeaderProps> = ({
  title = 'Feed',
  showBackButton = false,
  onBackPress,
  showSearchBar = false,
  showNotification = false,
  onNotificationPress,
}) => {
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchContainerLayout, setSearchContainerLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [searchUnreadCount, setSearchUnreadCount] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<View>(null);
  const searchInputRef = useRef<TextInput>(null);

  const { unreadCount, setUnreadCount } = useNotification();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      navigation.navigate('NotificationScreen' as never);
    }
  };

  // Update the search handler to improve modal behavior:
  const handleSearch = async (text: string) => {
    setSearchText(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length >= 2) {
      // Show modal immediately when user starts typing (with 2+ chars)
      setShowResultsModal(true);
      setLoading(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await searchQuery(text);
          if (response.data.success) {
            setSearchResults(response.data.data);
          } else {
            setSearchResults(null);
          }
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults(null);
        } finally {
          setLoading(false);
        }
      }, 500);
    } else {
      // If text is cleared or less than 2 chars, close modal and clear results
      setShowResultsModal(false);
      setSearchResults(null);
      setLoading(false);
    }
  };

  const handleUserPress = (userId: number) => {
    setShowResultsModal(false);
    setSearchText('');
    setSearchResults(null);
    navigation.navigate('ProfileView', { userId });
  };

  const handleCompanyPress = (companyId: number) => {
    setShowResultsModal(false);
    setSearchText('');
    setSearchResults(null);
    navigation.navigate('CompanyProfile', { companyId: companyId });
  };

  const measureSearchContainer = () => {
    if (searchContainerRef.current) {
      searchContainerRef.current.measure(
        (x, y, width, height, pageX, pageY) => {
          setSearchContainerLayout({
            x: pageX,
            y: pageY,
            width,
            height,
          });
        },
      );
    }
  };

  const handleModalOverlayPress = (event: any) => {
    // Get the touch coordinates relative to the entire screen
    const { pageX, pageY } = event.nativeEvent;

    // Check if the touch is within the search container area
    const isTouchInSearchArea =
      pageX >= searchContainerLayout.x &&
      pageX <= searchContainerLayout.x + searchContainerLayout.width &&
      pageY >= searchContainerLayout.y &&
      pageY <= searchContainerLayout.y + searchContainerLayout.height;

    // If touch is not in search area, close the modal but keep input focused
    if (!isTouchInSearchArea) {
      setShowResultsModal(false);
      // Keep the input focused for better UX
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleSearchInputFocus = () => {
    measureSearchContainer();
    // Show modal if there are results or if user is typing
    if (searchText.length >= 2) {
      setShowResultsModal(true);
    }
  };

  const handleSearchContainerPress = () => {
    // When search container is pressed, ensure input is focused
    searchInputRef.current?.focus();
    // Show modal if we have text and should show results
    if (searchText.length >= 2) {
      setShowResultsModal(true);
    }
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetchUnreadNotificationCount();
        if (response.data.success) {
          setUnreadCount(response.data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
      }
    };

    fetchUnreadCount();

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Prepare section data for SectionList
  const getSectionData = (): SectionData[] => {
    const sections: SectionData[] = [];

    if (searchResults?.users && searchResults.users.length > 0) {
      sections.push({
        title: `Users (${searchResults.users.length})`,
        data: searchResults.users,
        type: 'users',
      });
    }

    if (searchResults?.companies && searchResults.companies.length > 0) {
      sections.push({
        title: `Companies (${searchResults.companies.length})`,
        data: searchResults.companies,
        type: 'companies',
      });
    }

    return sections;
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={headerStyles.resultItem}
      onPress={() => handleUserPress(item.id)}
    >
      <Image
        source={
          item.profilePicture
            ? { uri: item.profilePicture }
            : require('../assets/icons/person.png')
        }
        style={headerStyles.resultItemImage}
      />
      <View style={headerStyles.resultItemTextContainer}>
        <Text style={headerStyles.resultItemName} numberOfLines={1}>
          {item.fullName}
          {item.isVerified && (
            <Image
              source={require('../assets/icons/verified.png')}
              style={headerStyles.verifiedIcon}
            />
          )}
        </Text>
        {item.username && (
          <Text style={headerStyles.resultItemUsername} numberOfLines={1}>
            @{item.username}
          </Text>
        )}
        {item.bio && (
          <Text style={headerStyles.resultItemBio} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={headerStyles.resultItem}
      onPress={() => handleCompanyPress(item.id)}
    >
      <Image
        source={
          item.logo
            ? { uri: item.logo }
            : require('../assets/icons/company.png')
        }
        style={headerStyles.resultItemImage}
      />
      <View style={headerStyles.resultItemTextContainer}>
        <Text style={headerStyles.resultItemName} numberOfLines={1}>
          {item.name}
          {item.isVerified && (
            <Image
              source={require('../assets/icons/verified.png')}
              style={headerStyles.verifiedIcon}
            />
          )}
        </Text>
        {item.industry && (
          <Text style={headerStyles.resultItemIndustry} numberOfLines={1}>
            {item.industry}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={headerStyles.sectionHeader}>
      <Text style={headerStyles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderItem = ({
    item,
    section,
  }: {
    item: User | Company;
    section: SectionData;
  }) => {
    if (section.type === 'users') {
      return renderUserItem({ item: item as User });
    } else {
      return renderCompanyItem({ item: item as Company });
    }
  };

  const renderEmptyResults = () => (
    <View style={headerStyles.emptyResults}>
      <Image
        source={require('../assets/icons/search.png')}
        style={headerStyles.emptyResultsIcon}
      />
      <Text style={headerStyles.emptyResultsText}>No results found</Text>
      <Text style={headerStyles.emptyResultsSubText}>
        Try searching with different keywords
      </Text>
    </View>
  );

  const sectionData = getSectionData();
  const hasResults = sectionData.length > 0;
  const shouldShowModal = showResultsModal && searchText.length >= 2;

  return (
    <View style={headerStyles.containerWithBottomTitle}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={headerStyles.topContainer}
      >
        {showSearchBar ? (
          // Change the search container back to View but with proper touch handling:
          <View
            ref={searchContainerRef}
            style={headerStyles.searchContainer}
            onLayout={measureSearchContainer}
          >
            <Image
              source={require('../assets/icons/search.png')}
              style={headerStyles.searchIcon}
            />
            <TextInput
              ref={searchInputRef}
              style={headerStyles.searchInput}
              placeholder="Search users, companies..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearch}
              onFocus={handleSearchInputFocus}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {loading && (
              <View style={headerStyles.loadingContainer}>
                <Text style={headerStyles.loadingText}>...</Text>
              </View>
            )}
          </View>
        ) : (
          showBackButton && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={headerStyles.backButton}
            >
              <Image
                source={require('../assets/icons/back.png')}
                style={headerStyles.backIcon}
              />
            </TouchableOpacity>
          )
        )}
        {showNotification ? (
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={headerStyles.notificationButton}
          >
            <Image
              source={require('../assets/icons/bell.png')}
              style={headerStyles.notificationIcon}
            />
            {unreadCount > 0 && (
              <View style={headerStyles.notificationBadge}>
                <Text style={headerStyles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={headerStyles.placeholder} />
        )}
      </LinearGradient>
      <Text style={headerStyles.title}>{title}</Text>
      {/* Search Results Modal */}
      {shouldShowModal && (
        <View style={headerStyles.modalOverlay} pointerEvents="box-none">
          <View
            style={[
              headerStyles.modalContainer,
              {
                top: '100%',
                left: searchContainerLayout.x,
                width: '92%',
              },
            ]}
          >
            {loading ? (
              <View style={headerStyles.loadingResults}>
                <Text style={headerStyles.loadingResultsText}>
                  Searching...
                </Text>
              </View>
            ) : hasResults ? (
              <SectionList
                sections={sectionData}
                keyExtractor={(item, index) =>
                  `${item.type}-${item.id}-${index}`
                }
                renderSectionHeader={renderSectionHeader}
                renderItem={renderItem}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                style={headerStyles.resultsList}
                contentContainerStyle={headerStyles.resultsListContent}
                keyboardShouldPersistTaps="handled"
                stickySectionHeadersEnabled={false}
              />
            ) : (
              renderEmptyResults()
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default Header;

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(10),
    backgroundColor: '#ffffff',
    paddingTop:
      Platform.OS === 'android' ? verticalScale(15) : verticalScale(40),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: moderateScale(16),
    padding: moderateScale(4),
  },
  backIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  placeholder: {
    width: moderateScale(24),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    flex: 1,
    marginRight: moderateScale(12),
    zIndex: 10,
  },
  searchIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: moderateScale(8),
    tintColor: '#666',
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#333',
    padding: 0,
    zIndex: 10,
  },
  loadingContainer: {
    paddingHorizontal: moderateScale(8),
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  notificationButton: {
    position: 'relative',
    padding: moderateScale(4),
  },
  notificationIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  containerWithBottomTitle: {
    backgroundColor: '#ffffff',
    paddingTop:
      Platform.OS === 'android' ? verticalScale(15) : verticalScale(40),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(10),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    // This allows touches to pass through to the underlying components
    pointerEvents: 'box-none',
  },
  modalContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    maxHeight: verticalScale(400),
    borderRadius: moderateScale(12),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
    width: '100%',
    zIndex: 9999, // Ensure it appears above other elements
  },
  modalOverlayTouchable: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  resultsList: {
    flex: 1,
    width: '100%',
  },
  resultsListContent: {
    paddingBottom: moderateScale(8),
  },
  sectionHeader: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  resultItemImage: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(12),
  },
  resultItemTextContainer: {
    flex: 1,
  },
  resultItemName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(2),
  },
  resultItemUsername: {
    fontSize: moderateScale(14),
    color: '#666',
    marginBottom: moderateScale(2),
  },
  resultItemBio: {
    fontSize: moderateScale(12),
    color: '#888',
    fontStyle: 'italic',
  },
  resultItemIndustry: {
    fontSize: moderateScale(14),
    color: '#666',
    fontStyle: 'italic',
  },
  verifiedIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    marginLeft: moderateScale(4),
  },
  emptyResults: {
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResultsIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    tintColor: '#ccc',
    marginBottom: moderateScale(12),
  },
  emptyResultsText: {
    fontSize: moderateScale(16),
    color: '#666',
    fontWeight: '500',
    marginBottom: moderateScale(4),
  },
  emptyResultsSubText: {
    fontSize: moderateScale(14),
    color: '#999',
    textAlign: 'center',
  },
  loadingResults: {
    padding: moderateScale(20),
    alignItems: 'center',
  },
  loadingResultsText: {
    fontSize: moderateScale(14),
    color: '#666',
  },
});
