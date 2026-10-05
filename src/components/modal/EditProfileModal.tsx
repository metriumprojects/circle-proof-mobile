import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { updateProfile, fetchProfile } from '../../api/service';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'react-native-image-picker';

const { width } = Dimensions.get('window');

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdate?: (updatedData: any) => void;
  initialData?: {
    fullName?: string;
    username?: string;
    location?: string;
    bio?: string;
    email?: string;
  };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onProfileUpdate,
  initialData,
}) => {
  const [fullName, setFullName] = useState('');
  const [handle, setHandle] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [publicVisibility, setPublicVisibility] = useState('Public');
  const [whoCanMessage, setWhoCanMessage] = useState('Everybody');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idDocument, setIdDocument] = useState<any>(null);
  const [multipleDocuments, setMultipleDocuments] = useState<any[]>([]); // New state for multiple documents
  const [canUploadId, setCanUploadId] = useState<boolean>(true);
  const [hasPendingVerification, setHasPendingVerification] =
    useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  const visibilityOptions = ['Public', 'Private', 'Friends only'];
  const messageOptions = ['Everybody', 'Connections only', 'Nobody'];

  // Initialize form with initialData when modal opens and fetch profile to check canUploadId
  useEffect(() => {
    if (visible) {
      // Fetch profile to check canUploadId
      const fetchProfileData = async () => {
        try {
          const response = await fetchProfile();
          if (response.data.success) {
            const profile = response.data.data.profile;
            setCanUploadId(profile.canUploadId);
            setHasPendingVerification(profile.hasPendingVerification);

            // If initialData is provided, use it to populate the form
            if (initialData) {
              setFullName(initialData.fullName || '');
              setHandle(initialData.username || '');
              setLocation(initialData.location || '');
              setBio(initialData.bio || '');
              setEmail(initialData.email || '');
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };

      fetchProfileData();
    }
  }, [visible, initialData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      // Reset dropdown states
      setShowVisibilityDropdown(false);
      setShowMessageDropdown(false);
      setShowShareModal(false);
      setMultipleDocuments([]);
      setIdDocument(null);
      setUploadError('');
    }
  }, [visible]);

  const selectDocument = () => {
    // Clear any previous errors
    setUploadError('');

    // Check if user can upload ID document
    if (!canUploadId) {
      setUploadError('You cannot upload an ID document at this time.');
      return;
    }

    const options: any = {
      mediaType: 'photo', // Allow both photos and documents
      includeBase64: false,
      maxHeight: 200,
      maxWidth: 2000,
      selectionLimit: 10, // Allow up to 10 documents to be selected at once
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        setUploadError('Failed to select document. Please try again.');
      } else if (response.assets && response.assets.length > 0) {
        // Add each selected asset to the multipleDocuments array
        const newDocuments = response.assets.map((asset: any) => ({
          ...asset,
          id: Date.now() + Math.random(), // Unique ID for each document
        }));

        setMultipleDocuments(prev => [...prev, ...newDocuments]);
      }
    });
  };

  const removeDocument = (id: number) => {
    setMultipleDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    setUploadError('');
    try {
      // Create FormData object to handle both regular fields and file uploads
      const formData = new FormData();


      // Append regular fields to FormData
      formData.append('fullName', fullName);
      formData.append('bio', bio);
      formData.append('username', handle);
      formData.append('location', location);

      // Append the single document if selected (keeping for backward compatibility)
      if (idDocument) {
        formData.append('idDocument', {
          uri: idDocument.uri,
          type: idDocument.type || 'image/jpeg',
          name: idDocument.fileName || `id_document_${Date.now()}.jpg`,
        });
      }

      // Append all multiple documents to FormData
      multipleDocuments.forEach((doc, index) => {
        formData.append(`idDocument`, {
          uri: doc.uri,
          type: doc.type || 'image/jpeg',
          name: doc.fileName || `document_${index}_${Date.now()}.jpg`,
        });
      });

      // Call the updateProfile API with FormData
      const response = await updateProfile(formData);

      if (response.data.success) {
        // Refetch profile to show real-time update
        const updatedProfile = await fetchProfile();
        console.log(updatedProfile.data.data.profile, 'updated profile');

        // Call the callback with updated data
        if (onProfileUpdate && updatedProfile.data.success) {
          onProfileUpdate(updatedProfile.data.data.profile);
        }

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully!',
        });

        // Clear ALL document states after successful API call
        setMultipleDocuments([]);
        setIdDocument(null); // Also clear single document if exists

        // Reset the form to close modal
        setShowShareModal(false);
        onClose();
      } else {
        const errorMessage =
          response.data.message || 'Failed to update profile';
        setUploadError(errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to update profile';
      setUploadError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleShareToFeed = () => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Shared to your feed!',
    });
    setShowShareModal(false);
    onClose();
  };

  const handleSkipShare = () => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Profile updated successfully!',
    });
    setShowShareModal(false);
    onClose();
  };

  const handleVisibilitySelect = (option: string) => {
    setPublicVisibility(option);
    setShowVisibilityDropdown(false);
  };

  const handleMessageSelect = (option: string) => {
    setWhoCanMessage(option);
    setShowMessageDropdown(false);
  };

  if (showShareModal) {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={handleSkipShare}
      >
        <View style={styles.centeredView}>
          <View style={styles.shareModalView}>
            {/* Header */}
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>Share this to you feed</Text>
              <TouchableOpacity
                onPress={handleSkipShare}
                style={styles.closeIcon}
              >
                <Text style={styles.closeIconText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Post Card */}
            <View style={styles.postCard}>
              {/* User Info */}
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>Alfredo Baptista</Text>
                  <Text style={styles.userRole}>
                    Head of sales EMEA region Google
                  </Text>
                </View>
                <Text style={styles.postTime}>• 1w</Text>
              </View>

              {/* Post Badges */}
              <View style={styles.badges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeIcon}>🎯</Text>
                  <Text style={styles.badgeText}>
                    Exceeded Quarterly Sales Target by 140%
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeIcon}>📅</Text>
                  <Text style={styles.badgeText}>March 2023</Text>
                </View>
              </View>

              {/* Post Content */}
              <Text style={styles.postContent}>
                Achieved $2.1M in ad sales for Google Ads, surpassing the
                original quota of $1.5M by landing a strategic partnership with
                a global e-commerce brand. This was a great achievement for the
                team for Google Ads ...{' '}
                <Text style={styles.seeMore}>See more</Text>
              </Text>

              {/* Post Actions */}
              <View style={styles.postActions}>
                <View style={styles.actionItem}>
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionText}>23 Likes</Text>
                </View>
                <View style={styles.actionItem}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionText}>12 comments</Text>
                </View>
                <View style={styles.actionItem}>
                  <Text style={styles.actionIcon}>➕</Text>
                  <Text style={styles.actionText}>Add a comment</Text>
                </View>
              </View>
            </View>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareToFeed}
            >
              <Text style={styles.shareButtonText}>Share to my feed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Text style={styles.closeIconText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  hasPendingVerification && styles.disabledInput,
                ]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor="#999"
                editable={!hasPendingVerification}
              />
            </View>

            {/* Handle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Handle</Text>
              <TextInput
                style={styles.input}
                value={handle}
                onChangeText={setHandle}
                placeholder="Enter handle"
                placeholderTextColor="#999"
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
                placeholderTextColor="#999"
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Enter bio"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Public Visibility */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Public visibility</Text>
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() =>
                  setShowVisibilityDropdown(!showVisibilityDropdown)
                }
              >
                <Text style={styles.pickerText}>{publicVisibility}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>

              {showVisibilityDropdown && (
                <View style={styles.dropdownContainer}>
                  {visibilityOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => handleVisibilitySelect(option)}
                    >
                      <Text style={styles.dropdownText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor="#999"
                keyboardType="email-address"
              />
              <TouchableOpacity style={styles.changeEmailButton}>
                <Text style={styles.changeEmailText}>Change your email</Text>
              </TouchableOpacity>
            </View>

            {/* Who Can Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Who can message you</Text>
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() => setShowMessageDropdown(!showMessageDropdown)}
              >
                <Text style={styles.pickerText}>{whoCanMessage}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>

              {showMessageDropdown && (
                <View style={styles.dropdownContainer}>
                  {messageOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => handleMessageSelect(option)}
                    >
                      <Text style={styles.dropdownText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Upload Document */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Upload ID or passport for profile verification
              </Text>
              {!hasPendingVerification && (
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    !canUploadId && styles.disabledUploadButton,
                  ]}
                  onPress={selectDocument}
                  disabled={!canUploadId}
                >
                  <Text style={styles.uploadIcon}>📄</Text>
                  <Text
                    style={[
                      styles.uploadText,
                      !canUploadId && styles.disabledUploadText,
                    ]}
                  >
                    {multipleDocuments.length > 0
                      ? `${multipleDocuments.length} documents selected`
                      : 'Upload'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Multiple Document Previews */}
              {multipleDocuments.length > 0 && (
                <View style={styles.multipleDocumentsContainer}>
                  {multipleDocuments.map((doc, index) => (
                    <View
                      key={doc.id || index}
                      style={styles.documentPreviewWrapper}
                    >
                      <Image
                        source={{ uri: doc.uri }}
                        style={styles.multipleDocumentPreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeDocument(doc.id)}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {!canUploadId && (
                <View
                  style={
                    hasPendingVerification
                      ? styles.pendingVerificationContainer
                      : styles.idUploadDisabledMessage
                  }
                >
                  {hasPendingVerification && (
                    <Text style={styles.pendingVerificationIcon}>⏳</Text>
                  )}
                  <Text
                    style={
                      hasPendingVerification
                        ? styles.pendingVerificationText
                        : styles.idUploadDisabledText
                    }
                  >
                    {hasPendingVerification
                      ? 'Your ID verification has pending review. You cannot change your name until the verification is complete.'
                      : 'ID upload is disabled. It will be enabled if you make changes in your Name require identity verification.'}
                  </Text>
                </View>
              )}
            </View>

            {uploadError ? (
              <View style={styles.errorMessage}>
                <Text style={styles.errorText}>{uploadError}</Text>
              </View>
            ) : null}

            {/* Warning Message */}
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Important note: ID or passport must be an 18+ identity and you
                must change your full name to be similar and to
                belong back to the one in your profile picture
              </Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: width * 0.9,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  scrollView: {
    width: '100%',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#a0a0a0',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 14,
    color: '#000',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 5,
    zIndex: 10,
    maxHeight: 150,
    overflow: 'scroll',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0',
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
  },
  changeEmailButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  changeEmailText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  uploadIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#000',
  },
  disabledUploadButton: {
    backgroundColor: '#f0f0',
    borderColor: '#d0d0d0',
  },
  disabledUploadText: {
    color: '#a0a0a0',
  },
  documentPreviewContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  documentPreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  multipleDocumentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 10,
    gap: 10,
  },
  documentPreviewWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  multipleDocumentPreview: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -2,
    right: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorMessage: {
    marginTop: 4,
    padding: 15,
    backgroundColor: '#ffe6e6',
    borderRadius: 5,
    color: '#ff0000',
    fontSize: 12,
  },
  errorText: {
    color: '#ee0c0cff',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  idUploadDisabledMessage: {
    backgroundColor: '#FFFAA0',
    borderRadius: 5,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  idUploadDisabledText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '500',
  },
  pendingVerificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFAA0',
    borderRadius: 5,
    padding: 10,
    marginTop: 8,
    // marginBottom: 8,
  },
  pendingVerificationText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  pendingVerificationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningBox: {
    backgroundColor: '#ff0000',
    borderRadius: 5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 10,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: '#67C40C',
    paddingVertical: 14,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // Share Modal Styles
  shareModalView: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  postCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#666',
  },
  postTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  postContent: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 12,
  },
  seeMore: {
    color: '#007bff',
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
  shareButton: {
    backgroundColor: '#67C40C',
    paddingVertical: 14,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default EditProfileModal;
