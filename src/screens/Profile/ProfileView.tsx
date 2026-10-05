import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CredibilityScoreModal from '../../components/modal/CreadibilityScoreModal';
import ProfileContentToggleView from '../../components/ProfileContentToggleView';
import VerificationsModal from '../../components/modal/VerificationsModal';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchSpecificUserProfileStats, toggleFollow } from '../../api/service';

// Define the type for profile stats
interface ProfileStats {
  userId: number;
  fullName: string;
  username: string | null;
  profilePicture: string | null;
  credibilityScore: number;
  profileLevel: number | string;
  followers: number;
  following: number;
  bio: string | null;
  connections: number;
  posts: number;
  validations: number;
  location: string | null;
  dateOfJoining: string;
  isFollowing?: boolean; // Add isFollowing field to the profile data if available from API
  idVerified?: boolean;
  verificationsReceived: number;
  verificationsGiven: number;
}

const { width, height } = Dimensions.get('window');

const ProfileView = () => {
  const [credibilityModalVisible, setCredibilityModalVisible] = useState(false);
  const [profileData, setProfileData] = useState<ProfileStats | null>(null);
  const [verificationsModalVisible, setVerificationsModalVisible] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { userId } = route.params || {};
  console.log(userId, 'errrrr');

  // Function to fetch specific user profile stats
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      if (userId) {
        const response = await fetchSpecificUserProfileStats(userId);
        if (response.data.success) {
          setProfileData(response.data.data.stats);
        } else {
          console.error(
            'Failed to fetch profile stats:',
            response.data.message,
          );
        }
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  // Update the isFollowing state whenever profileData changes
  useEffect(() => {
    if (profileData) {
      setIsFollowing(!!profileData.isFollowing);
    }
  }, [profileData]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Render profile data if available, otherwise show loading indicator
  if (loading && !profileData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} /> {/* Placeholder for alignment */}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#57B915" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Image
            source={require('../../assets/icons/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} /> {/* Placeholder for alignment */}
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: profileData?.profilePicture
                    ? profileData.profilePicture
                    : 'https://fastly.picsum.photos/id/513/4373/3280.jpg?hmac=LkZSEFr5H-jsaqmKTdANAlVWv6Zb38bDJxz5jQEyU0g',
                }}
                style={styles.profileImage}
              />
            </View>
          </View>

          {/* Name and Handle */}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {profileData?.fullName || 'User Name'}
            </Text>
          </View>
          <Text style={styles.handle}>
            @{profileData?.username || 'username'}
          </Text>

          {profileData?.idVerified && (
            <View style={styles.verifyContainer}>
              <View style={styles.verifiedBadge}>
                <Image
                  source={require('../../assets/icons/tick.png')}
                  style={styles.checkmark}
                />
              </View>
              <Text style={styles.verifiedText}>ID Verified</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.infoRow}>
            <Text style={styles.location}>
              {profileData?.location || 'Location not specified'}
            </Text>
          </View>

          {/* Join Date */}
          <View style={styles.infoRow}>
            <Image
              source={require('../../assets/icons/calendar.png')}
              style={styles.calendar}
            />
            <Text style={styles.joinDate}>
              Joined{' '}
              {profileData?.dateOfJoining
                ? new Date(profileData.dateOfJoining).toLocaleDateString(
                    'en-US',
                    { month: 'long', year: 'numeric' },
                  )
                : 'Unknown'}
            </Text>
          </View>

          {/* Followers */}
          <View style={styles.followersRow}>
            <Text style={styles.followersText}>
              {profileData?.followers || 0} Followers
            </Text>
            <Text style={styles.followingText}>
              {profileData?.following || 0} Following
            </Text>
          </View>

          <View style={styles.verification}>
            <TouchableOpacity
              style={styles.verifyContainers}
              onPress={() => setVerificationsModalVisible(true)}
            >
              <View style={styles.verifiedBadge}>
                <Image
                  source={require('../../assets/icons/achievement.png')}
                  style={styles.checkmark}
                />
              </View>
              <Text style={styles.verifiedText}>
                {profileData?.verificationsReceived} Verifications received
              </Text>
            </TouchableOpacity>
            <View style={styles.verifyContainers}>
              <View style={styles.verifiedBadge}>
                <Image
                  source={require('../../assets/icons/verified.png')}
                  style={styles.checkmark}
                />
              </View>
              <Text style={styles.verifiedText}>
                {profileData?.verificationsGiven} Verifications given
              </Text>
            </View>
          </View>

          {/* Bio */}
          <Text style={styles.bio}>
            {profileData?.bio || 'No bio available'}
          </Text>

          {/* Follow and Contact Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.followButton}
              onPress={async () => {
                try {
                  const response = await toggleFollow({ followingId: userId });
                  if (response.data.success) {
                    await fetchProfileData();
                  }
                } catch (error) {
                  console.error('Error toggling follow status:', error);
                }
              }}
            >
              <Text style={styles.followButtonText}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>

          {/* Credibility Score */}
          {/* <TouchableOpacity
            style={styles.credibilityScoreButton}
            onPress={() => setCredibilityModalVisible(true)}
          >
            <Text style={styles.credibilityLabel}>Credibility score</Text>
            <View style={styles.credibilityScoreContainer}>
              <Text style={styles.credibilityScore}>
                {profileData?.credibilityScore || 0}
              </Text>
              <Text style={styles.credibilityScoreLevel}>Low</Text>
            </View>
          </TouchableOpacity> */}

          {/* Profile Content Toggle */}
          <ProfileContentToggleView userId={userId} />
        </View>
      </ScrollView>

      {/* Credibility Score Modal */}
      <CredibilityScoreModal
        visible={credibilityModalVisible}
        onClose={() => setCredibilityModalVisible(false)}
        score={profileData?.credibilityScore || 0}
        level={String(profileData?.profileLevel || 'Low')}
      />

      {/* Verifications Modal */}
      <VerificationsModal
        visible={verificationsModalVisible}
        onClose={() => setVerificationsModalVisible(false)}
        userId={userId}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 24, // Same width as back button to center title
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  card: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    gap: 4,
  },
  verifyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginBottom: 8,
    gap: 4,
  },
  verifyContainers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  verifiedBadge: {
    marginLeft: 8,
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verification: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#E9EAEE',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 2,
  },
  checkmark: {
    width: 16,
    height: 16,
  },
  verifiedText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
    color: '#000000',
  },
  handle: {
    fontSize: 14,
    color: '#66666',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#00000',
    textAlign: 'center',
  },
  calendar: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: '#666666',
  },
  joinDate: {
    fontSize: 14,
    color: '#000000',
  },
  followersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  followersText: {
    fontSize: 14,
    color: '#000000',
    marginRight: 16,
  },
  followingText: {
    fontSize: 14,
    color: '#000000',
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  credibilityLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  credibilityScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  credibilityScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginRight: 8,
  },
  credibilityScoreLevel: {
    fontSize: 14,
    color: '#EB4335',
    fontWeight: '600',
  },
  credibilityScoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBC05',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
    gap: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  followButton: {
    backgroundColor: '#E9EAEE',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 2,
    marginRight: 10,
    alignItems: 'center',
  },
  followButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  contactButton: {
    backgroundColor: '#E9EAEE',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 2,
    marginLeft: 10,
    alignItems: 'center',
  },
  contactButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
});

export default ProfileView;
