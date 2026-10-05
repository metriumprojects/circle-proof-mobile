import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import CredibilityScoreModal from '../../components/modal/CreadibilityScoreModal';
import EditProfileModal from '../../components/modal/EditProfileModal';
import ProfileContentToggle from '../../components/ProfileContentToggle';
import VerificationsModal from '../../components/modal/VerificationsModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { clearAuthData } from '../../util/authController';
import { deleteUserProfile, fetchProfileStats, updateProfilePicture } from '../../api/service';
import { launchImageLibrary } from 'react-native-image-picker';

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
  isVerified: boolean;
  idVerified: boolean;
  verificationsReceived: number;
  verificationsGiven: number;
}

const { width, height } = Dimensions.get('window');

// Custom Confirmation Modal Component
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'signout' | 'delete';
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
  type = 'signout',
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.confirmationModalOverlay}>
        <View style={styles.confirmationModalContainer}>
          <Text style={styles.confirmationModalTitle}>{title}</Text>
          <Text style={styles.confirmationModalMessage}>{message}</Text>
          <View style={styles.confirmationModalButtons}>
            <TouchableOpacity
              style={[
                styles.confirmationModalButton,
                styles.confirmationModalCancelButton,
              ]}
              onPress={onCancel}
            >
              <Text style={styles.confirmationModalCancelText}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmationModalButton,
                type === 'delete'
                  ? styles.confirmationModalDeleteButton
                  : styles.confirmationModalConfirmButton,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmationModalConfirmText}>
                {loading ? 'Deleting...' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProfileScreen = () => {
  const [credibilityModalVisible, setCredibilityModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [verificationsModalVisible, setVerificationsModalVisible] =
    useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [imageUploadModalVisible, setImageUploadModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [profileData, setProfileData] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mainImageLoading, setMainImageLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  // Confirmation modal states
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState(false);

  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const { logout } = useAuth();
  const navigation = useNavigation<any>();

  // Function to fetch profile stats
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetchProfileStats();
      if (response.data.success) {
        setProfileData(response.data.data.stats);
        setUserId(response.data.data.stats.userId);
      } else {
        console.error('Failed to fetch profile stats:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
      setRefreshKey(prev => prev + 1);
    }, []),
  );

  const handleSignOutConfirmation = () => {
    setMenuVisible(false);
    setSignOutModalVisible(true);
  };

  const handleSignOut = () => {
    setSignOutModalVisible(false);
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleDeleteAccountConfirmation = () => {
    setMenuVisible(false);
    setDeleteAccountModalVisible(true);
  };

  const handleDeleteAccount = async () => {
    setDeleteAccountModalVisible(false);
    try {
      setDeleteAccountLoading(true);
      await deleteUserProfile();
      clearAuthData();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });

      Toast.show({
        type: 'success',
        text1: 'Account Deleted',
        text2: 'Your account has been successfully deleted',
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete account. Please try again.',
      });
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const handleSelectImage = () => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as any,
      includeBase64: false,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel || response.errorMessage) {
        console.log('Image picker cancelled or error:', response.errorMessage);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.errorMessage || 'Image selection cancelled',
        });
        return;
      }

      if (response.assets && response.assets[0] && response.assets[0].uri) {
        const imageUri = response.assets[0].uri;
        setSelectedImage(imageUri);
      }
    });
  };

  const handleUploadImage = async () => {
    if (!selectedImage) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select an image first',
      });
      return;
    }

    try {
      setUploading(true);

      const imageUri = selectedImage.toLowerCase();
      let fileType = 'image/jpeg';
      let fileName = 'profile_picture.jpg';

      if (imageUri.includes('.png')) {
        fileType = 'image/png';
        fileName = 'profile_picture.png';
      } else if (imageUri.includes('.gif')) {
        fileType = 'image/gif';
        fileName = 'profile_picture.gif';
      } else if (imageUri.includes('.jpg') || imageUri.includes('.jpeg')) {
        fileType = 'image/jpeg';
        fileName = 'profile_picture.jpg';
      } else if (imageUri.includes('.webp')) {
        fileType = 'image/webp';
        fileName = 'profile_picture.webp';
      }

      const formData = new FormData();
      formData.append('profilePicture', {
        uri: selectedImage,
        type: fileType,
        name: fileName,
      } as any);

      const response = await updateProfilePicture(formData);
      console.log(response, 'frfrgrgr');

      if (response.data.success) {
        await fetchProfileData();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile picture updated successfully',
        });
        setImageUploadModalVisible(false);
        setSelectedImage(null);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || 'Failed to update profile picture',
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload profile picture',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = (updatedData: ProfileStats) => {
    setProfileData(updatedData);
    setRefreshKey(prev => prev + 1);
  };

  // Render profile data if available, otherwise show loading indicator
  if (loading && !profileData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#57B915" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Image
            source={require('../../assets/icons/settings.png')}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Settings Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.tooltipContainer}>
            <TouchableOpacity
              style={styles.tooltipItem}
              onPress={handleSignOutConfirmation}
            >
              <Text style={styles.tooltipText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tooltipItem}
              onPress={handleDeleteAccountConfirmation}
            >
              <Text style={[styles.tooltipText, styles.deleteText]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        visible={signOutModalVisible}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        onConfirm={handleSignOut}
        onCancel={() => setSignOutModalVisible(false)}
        type="signout"
        loading={deleteAccountLoading}
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        visible={deleteAccountModalVisible}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteAccountModalVisible(false)}
        type="delete"
      />

      {/* Image Upload Modal */}
      <Modal
        visible={imageUploadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImageUploadModalVisible(false)}
      >
        <View style={styles.uploadModalOverlay}>
          <View style={styles.uploadModalContainer}>
            <View style={styles.uploadModalHeader}>
              <Text style={styles.uploadModalTitle}>
                Update Profile Picture
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setImageUploadModalVisible(false);
                  setSelectedImage(null);
                }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.uploadModalContent}>
              <View style={styles.previewContainer}>
                <Image
                  source={{
                    uri:
                      selectedImage ||
                      (profileData?.profilePicture
                        ? `${profileData.profilePicture}${profileData.profilePicture.includes('?') ? '&' : '?'
                        }t=${Date.now()}`
                        : 'https://fastly.picsum.photos/id/513/4373/3280.jpg?hmac=LkZSEFr5H-jsaqmKTdANAlVWv6Zb38bDJxz5jQEyU0g'),
                  }}
                  style={styles.previewImage}
                  key={
                    selectedImage || profileData?.profilePicture || 'default'
                  }
                />
              </View>

              <TouchableOpacity
                style={styles.selectImageButton}
                onPress={handleSelectImage}
              >
                <Image
                  source={require('../../assets/icons/edit.png')}
                  style={styles.selectImageIcon}
                />
                <Text style={styles.selectImageText}>
                  {selectedImage ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  (!selectedImage || uploading) && styles.uploadButtonDisabled,
                ]}
                onPress={handleUploadImage}
                disabled={!selectedImage || uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.uploadButtonText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: profileData?.profilePicture
                    ? `${profileData.profilePicture}${profileData.profilePicture.includes('?') ? '&' : '?'
                    }t=${Date.now()}`
                    : 'https://fastly.picsum.photos/id/513/4373/3280.jpg?hmac=LkZSEFr5H-jsaqmKTdANAlVWv6Zb38bDJxz5jQEyU0g',
                }}
                style={styles.profileImage}
                key={
                  profileData?.profilePicture
                    ? profileData.profilePicture
                    : 'default'
                }
                defaultSource={require('../../assets/images/dp.jpg')}
              />
              <TouchableOpacity
                style={styles.editIconContainer}
                onPress={() => setImageUploadModalVisible(true)}
              >
                <Image
                  source={require('../../assets/icons/edit.png')}
                  style={styles.editIcon}
                />
              </TouchableOpacity>
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

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Image
                source={require('../../assets/icons/edit.png')}
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (userId !== null) {
                  navigation.navigate('ProfileView', { userId });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Unable to load profile information',
                  });
                }
              }}
            >
              <Image
                source={require('../../assets/icons/eye.png')}
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>View profile</Text>
            </TouchableOpacity>
          </View>

          {/* Credibility Score */}
          {/* <TouchableOpacity
            style={styles.credibilityScoreButton}
            onPress={() => setCredibilityModalVisible(true)}
          >
            <Text style={styles.credibilityLabel}>My credibility score</Text>
            <View style={styles.credibilityScoreContainer}>
              <Text style={styles.credibilityScore}>
                {profileData?.credibilityScore || 0}
              </Text>
              <Text style={styles.credibilityScoreLevel}>Low</Text>
            </View>
          </TouchableOpacity> */}

          {/* Company and Verification Request Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('AddCompany');
              }}
              style={styles.companyButton}
            >
              <Image
                source={require('../../assets/icons/company.png')}
                style={styles.buttonIconSmall}
              />
              <Text style={styles.buttonTextSmall}>Add Company</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('CompaniesScreen');
              }}
              style={styles.viewCompanyButton}
            >
              <Image
                source={require('../../assets/icons/company.png')}
                style={styles.buttonIconSmall}
              />
              <Text style={styles.buttonTextSmall}>View Companies</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            {/* <TouchableOpacity
              onPress={() => {
                navigation.navigate('VerificationRequest');
              }}
              style={styles.verificationButton}
            >
              <Text style={styles.verificationButtonText}>
                Verification Request
              </Text>
            </TouchableOpacity> */}
          </View>

          {/* Profile Content Toggle */}
          <ProfileContentToggle userId={userId || 0} key={refreshKey} />
        </View>
      </ScrollView>

      {/* Credibility Score Modal */}
      <CredibilityScoreModal
        visible={credibilityModalVisible}
        onClose={() => setCredibilityModalVisible(false)}
        score={profileData?.credibilityScore || 0}
        level={String(profileData?.profileLevel || 'Low')}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onProfileUpdate={handleProfileUpdate}
        initialData={{
          fullName: profileData?.fullName ?? undefined,
          username: profileData?.username ?? undefined,
          location: profileData?.location ?? undefined,
          bio: profileData?.bio ?? undefined,
        }}
      />

      {/* Verifications Modal */}
      <VerificationsModal
        visible={verificationsModalVisible}
        onClose={() => setVerificationsModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  menuButton: {
    padding: 5,
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  tooltipContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 50,
    marginRight: 20,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: '#f0f0f0',
  },
  tooltipText: {
    fontSize: 16,
    color: '#000',
  },
  deleteText: {
    color: '#FF0000',
  },
  // Confirmation Modal Styles
  confirmationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmationModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationModalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmationModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmationModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationModalCancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmationModalConfirmButton: {
    backgroundColor: '#57B915',
  },
  confirmationModalDeleteButton: {
    backgroundColor: '#FF0000',
  },
  confirmationModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  confirmationModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Rest of the styles remain the same...
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
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#57B915',
    width: 26,
    height: 26,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  editIcon: {
    width: 12,
    height: 12,
    tintColor: '#ffffff',
  },
  verifiedBadge: {
    marginLeft: 8,
    width: 20,
    height: 20,
    // backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  checkmark: {
    width: 16,
    height: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
    color: '#000000',
  },
  verifiedText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    gap: 4,
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
    color: '#000000',
    textAlign: 'center',
  },
  calendar: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: '#66666',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: '#333333',
  },
  buttonText: {
    color: '#33333',
    fontWeight: '500',
    fontSize: 14,
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
    color: '#00000',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  companyButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  viewCompanyButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    marginLeft: '1%',
  },
  verificationButton: {
    backgroundColor: '#57B915',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    marginLeft: '1%',
  },
  buttonIconSmall: {
    width: 16,
    height: 16,
    tintColor: '#333333',
    marginRight: 6,
  },
  buttonTextSmall: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  verificationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Upload Modal Styles
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  uploadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '300',
  },
  uploadModalContent: {
    padding: 20,
    alignItems: 'center',
  },
  previewContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  selectImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    width: '100%',
  },
  selectImageIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#333333',
  },
  selectImageText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
  },
  uploadButton: {
    backgroundColor: '#57B915',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
});

export default ProfileScreen;
