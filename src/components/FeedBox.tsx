import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import VisibilityModal from './VisibilityModal';
import {
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker'; // Import the pick function
import { createPost, fetchProfileStats } from '../api/service';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface VisibilityOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface MediaAsset {
  uri: string;
  type: string;
  fileName?: string;
  fileSize?: number;
}

interface PostScreenProps {
  isPostScreen?: boolean;
  onPostCreated?: () => void;
}

const defaultVisibilityOption: VisibilityOption = {
  id: 'everybody',
  title: 'Everybody',
  description: '',
  icon: 'globe',
};

const FeedBox = ({ isPostScreen = false, onPostCreated }: PostScreenProps) => {
  const [postText, setPostText] = React.useState('');
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedVisibility, setSelectedVisibility] =
    React.useState<VisibilityOption>(defaultVisibilityOption);
  const [mediaAssets, setMediaAssets] = React.useState<MediaAsset[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isPosting, setIsPosting] = React.useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const { token, user } = useAuth();
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetchProfileStats();
        if (response.data.success) {
          const profilePicture = response.data.data.stats?.profilePicture;
          if (profilePicture) {
            setProfileImage(profilePicture);
            setImageError(false);
          }
        }
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      }
    };

    fetchProfileData();
  }, []);

  // Determine the image source with fallback
  const getImageSource = () => {
    if (imageError || !profileImage) {
      // Fallback to static image if profile image fails to load or is not available
      return require('../assets/images/dp.jpg'); // Using dp.jpg as fallback from assets/images
    }

    // Use the profile image with cache busting to ensure fresh image
    const imageUrl = `${profileImage}${profileImage.includes('?') ? '&' : '?'}t=${Date.now()}`;
    return { uri: imageUrl };
  };

  const getVisibilityIconSource = (iconType: string) => {
    switch (iconType) {
      case 'globe':
        return require('../assets/icons/globe.png');
      case 'followers':
        return require('../assets/icons/followers.png');
      case 'verified':
        return require('../assets/icons/verified.png');
      case 'company':
        return require('../assets/icons/company.png');
      case 'following':
        return require('../assets/icons/following.png');
      default:
        return require('../assets/icons/followers.png');
    }
  };

  const handleVisibilitySelect = (option: VisibilityOption) => {
    setSelectedVisibility(option);
  };

  const handleDocumentUpload = async () => {
    try {
      setIsUploading(true);

      // Use @react-native-documents/picker to pick documents
      const result = await pick({
        mode: 'import', // Use 'import' mode instead of 'open'
        allowMultiSelection: true,
        // Use common file types that are widely supported
        type: ['*/*'], // This allows all file types in a more compatible way
      });

      setIsUploading(false);

      if (result && result.length > 0) {
        const newAssets = result.map((file: any) => ({
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          fileName: file.name || `document_${Date.now()}`,
          fileSize: file.size || undefined,
        }));

        setMediaAssets(prev => [...prev, ...newAssets]);

        Toast.show({
          type: 'success',
          text1: 'Document Added',
          text2: `${result.length} document(s) selected`,
        });
      } else {
        // User cancelled or no files selected
        console.log('Document picker closed without selecting files');
        setIsUploading(false);
      }
    } catch (error: any) {
      setIsUploading(false);

      // Check if user cancelled the picker
      if (error?.code === 'DOCUMENT_PICKER_CANCELED' || error?.message?.includes('cancelled')) {
        console.log('User cancelled document picker');
        return;
      }

      console.error('Error picking document:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to pick document. Please try again.',
      });
    }
  };

  const handleMediaUpload = (
    mediaType: 'photo' | 'video' | 'mixed' | 'document' = 'mixed',
  ) => {
    if (mediaType === 'document') {
      handleDocumentUpload();
      return;
    }

    setIsUploading(true);

    // Use image picker for photos and videos
    const options: any = {
      mediaType,
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      includeBase64: false,
      selectionLimit: isPostScreen ? 10 : 1,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      setIsUploading(false);

      if (response.didCancel || response.errorMessage) {
        console.log(
          'User cancelled or error:',
          response.errorMessage || 'User cancelled',
        );
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newAssets = response.assets
          .filter(asset => asset.uri)
          .map(asset => ({
            uri: asset.uri!,
            type: asset.type || '',
            fileName: asset.fileName,
            fileSize: asset.fileSize,
          }));

        setMediaAssets(prev => [...prev, ...newAssets]);
      }
    });
  };

  const removeMediaAsset = (index: number) => {
    setMediaAssets(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostCreation = async () => {
    if (!postText.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please add some text to your post.',
      });
      return;
    }

    try {
      setIsPosting(true);

      const formData = new FormData();
      formData.append('content', postText);
      let visibilityValue = selectedVisibility.title;
      formData.append('visibility', visibilityValue);

      // Check if any media assets are videos and warn about upload time
      const hasVideos = mediaAssets.some(asset => asset.type && asset.type.startsWith('video'));
      if (hasVideos) {
        Toast.show({
          type: 'info',
          text1: 'Uploading Videos',
          text2: 'Video uploads may take a few moments. Please be patient.',
        });
      }

      mediaAssets.forEach((asset, index) => {
        if (asset.uri) {
          const fileName = asset.fileName || `file_${Date.now()}_${index}`;
          const fileType =
            asset.type ||
            (asset.uri.includes('jpeg') || asset.uri.includes('jpg')
              ? 'image/jpeg'
              : 'image/png');

          // Create a file object with explicit type for better handling
          const fileObject = {
            uri: asset.uri,
            type: fileType,
            name: fileName,
          };

          // Add file size check for videos to warn about large files
          if (asset.type && asset.type.startsWith('video') && asset.fileSize && asset.fileSize > 50 * 1024 * 1024) { // 50MB
            Toast.show({
              type: 'info',
              text1: 'Large Video File',
              text2: 'The video file is quite large and may take longer to upload. Consider compressing it for faster upload.',
            });
          }

          formData.append('files', fileObject as any);
        }
      });

      // Retry mechanism for failed uploads
      let maxRetries = 2;
      let retryCount = 0;
      let success = false;
      let lastError = null;

      while (retryCount <= maxRetries && !success) {
        try {
          const response = await createPost(formData);
          console.log('Post created successfully:', response);
          success = true;

          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Your post has been created!',
          });

          setPostText('');
          setMediaAssets([]);
          setSelectedVisibility(defaultVisibilityOption);

          if (onPostCreated) {
            onPostCreated();
          }

          navigation.navigate('Profile');
        } catch (error: any) {
          lastError = error;

          retryCount++;
          if (retryCount <= maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
            Toast.show({
              type: 'info',
              text1: `Retrying Upload (${retryCount}/${maxRetries})`,
              text2: 'Please wait...',
            });
          } else {
            console.error('Error creating post after retries:', error.response);
            let errorMessage = 'Failed to create post. Please try again.';
            if (error?.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error?.response?.data?.error) {
              errorMessage = error.response.data.error;
            } else if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
              // Handle array of errors
              errorMessage = error.response.data.errors.map((err: any) => err.message || err).join(', ');
            } else if (error?.message) {
              errorMessage = error.message;
            }
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: errorMessage,
            });
          }
        }
      }

      // If all retries failed, show final error with API message if available
      if (!success && lastError) {
        console.error('Final error creating post:', lastError);
        let finalErrorMessage = 'Failed to create post. Please try again.';
        if (lastError?.response?.data?.message) {
          finalErrorMessage = lastError.response.data.message;
        } else if (lastError?.response?.data?.error) {
          finalErrorMessage = lastError.response.data.error;
        } else if (lastError?.response?.data?.errors && Array.isArray(lastError.response.data.errors)) {
          // Handle array of errors
          finalErrorMessage = lastError.response.data.errors.map((err: any) => err.message || err).join(', ');
        } else if (lastError?.message) {
          finalErrorMessage = lastError.message;
        }
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: finalErrorMessage,
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create post. Please try again.',
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Helper function to extract file extension from filename or URI
  const getFileExtension = (fileNameOrUri: string): string => {
    const parts = fileNameOrUri.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1].toUpperCase();
      return ext.length <= 4 ? ext : 'FILE'; // Return the extension if it's reasonable length, otherwise 'FILE'
    }
    return 'FILE';
  };

  // Helper function to get document type icon
  const getDocumentTypeText = (fileName: string, fileType: string): string => {
    const extension = getFileExtension(fileName).toLowerCase();

    if (fileType.includes('pdf')) return '📕 PDF';
    if (['doc', 'docx'].includes(extension)) return '📘 DOC';
    if (['xls', 'xlsx'].includes(extension)) return '📗 XLS';
    if (['ppt', 'pptx'].includes(extension)) return '📙 PPT';
    if (['txt'].includes(extension)) return '📄 TXT';

    return `📄 ${extension}`;
  };

  const feedBoxStyles = createStyles(isPostScreen);
  return (
    <View style={feedBoxStyles.container}>
      <View style={feedBoxStyles.headerContainer}>
        <View style={feedBoxStyles.inputContainer}>
          <Image
            source={getImageSource()}
            style={feedBoxStyles.avatar}
            onError={() => setImageError(true)}
            defaultSource={require('../assets/images/dp.jpg')} // Fallback while loading
          />
          <TouchableOpacity
            style={feedBoxStyles.visibilitySelector}
            onPress={() => setModalVisible(true)}
          >
            <Image
              source={getVisibilityIconSource(selectedVisibility.icon)}
              style={feedBoxStyles.visibilityIcon}
            />
            <Text style={feedBoxStyles.visibilityText}>
              {selectedVisibility.title}
            </Text>
            <Image
              source={require('../assets/icons/down.png')}
              style={feedBoxStyles.dropdownIcon}
            />
          </TouchableOpacity>
        </View>
        <TextInput
          style={feedBoxStyles.input}
          placeholder={
            isPostScreen ? "What's on your mind?" : 'Share your thoughts...'
          }
          placeholderTextColor="#666"
          multiline
          value={postText}
          onChangeText={setPostText}
        />
      </View>

      {/* Media Preview Section - Always visible */}
      <View style={feedBoxStyles.mediaPreviewContainer}>
        {mediaAssets.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={feedBoxStyles.mediaContainer}
            contentContainerStyle={feedBoxStyles.mediaContentContainer}
          >
            {mediaAssets.map((asset, index) => (
              <View key={index} style={feedBoxStyles.mediaItem}>
                {asset.type && asset.type.startsWith('image') ? (
                  <Image
                    source={{ uri: asset.uri }}
                    style={feedBoxStyles.mediaPreviewImage}
                  />
                ) : asset.type && asset.type.startsWith('video') ? (
                  <View style={feedBoxStyles.mediaPreviewVideo}>
                    <Text style={feedBoxStyles.mediaPreviewText}>📹 Video</Text>
                  </View>
                ) : (
                  // For documents and other file types
                  <View style={feedBoxStyles.mediaPreviewDocument}>
                    <Text style={feedBoxStyles.mediaPreviewText}>
                      {getDocumentTypeText(asset.fileName || asset.uri, asset.type)}
                    </Text>
                    {asset.fileName && (
                      <Text style={feedBoxStyles.documentName} numberOfLines={1}>
                        {asset.fileName}
                      </Text>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={feedBoxStyles.removeMediaButton}
                  onPress={() => removeMediaAsset(index)}
                >
                  <Image
                    source={require('../assets/icons/close.png')}
                    style={feedBoxStyles.removeIcon}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={feedBoxStyles.emptyMediaContainer}>
            <Text style={feedBoxStyles.emptyMediaText}>
              {isPostScreen
                ? 'Add photos, videos, or documents to your post'
                : 'Media preview'}
            </Text>
          </View>
        )}
      </View>

      <View style={feedBoxStyles.footer}>
        <View style={feedBoxStyles.iconContainer}>
          <TouchableOpacity onPress={() => handleMediaUpload('mixed')}>
            <Image
              source={require('../assets/icons/gallery.png')}
              style={feedBoxStyles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleMediaUpload('document')}>
            <Image
              source={require('../assets/icons/document.png')}
              style={feedBoxStyles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleMediaUpload('video')}>
            <Image
              source={require('../assets/icons/video.png')}
              style={feedBoxStyles.icon}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            feedBoxStyles.postButton,
            !postText.trim() &&
            feedBoxStyles.postButtonDisabled,
          ]}
          disabled={(!postText.trim()) || isPosting}
          onPress={handlePostCreation}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={feedBoxStyles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Uploading Indicator */}
      {/* {isUploading && (
        <View style={feedBoxStyles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#57B915" />
          <Text style={feedBoxStyles.uploadingText}>Selecting files...</Text>
        </View>
      )} */}

      <VisibilityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedOption={selectedVisibility}
        onSelect={handleVisibilitySelect}
      />
    </View>
  );
};

export default FeedBox;

const createStyles = (isPostScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: isPostScreen ? 1 : 0,
      backgroundColor: '#ffffff',
      marginHorizontal: moderateScale(16),
      marginVertical: verticalScale(8),
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      justifyContent: isPostScreen ? 'space-between' : 'flex-start',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      minHeight: isPostScreen ? '90%' : 'auto',
    },
    headerContainer: {
      marginBottom: verticalScale(16),
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: moderateScale(12),
      marginBottom: verticalScale(12),
    },
    avatar: {
      width: moderateScale(40),
      height: moderateScale(40),
      borderRadius: moderateScale(20),
    },
    input: {
      flex: 1,
      fontSize: moderateScale(16),
      color: '#000',
      minHeight: verticalScale(120),
      maxHeight: verticalScale(300),
      paddingVertical: verticalScale(12),
      paddingHorizontal: moderateScale(16),
      lineHeight: moderateScale(20),
      backgroundColor: '#ffffff',
      borderRadius: moderateScale(12),
      borderWidth: 1,
      borderColor: '#e4e6eb',
      textAlignVertical: 'top',
    },
    mediaPreviewContainer: {
      minHeight: verticalScale(130),
      marginBottom: verticalScale(12),
      borderRadius: moderateScale(8),
      borderWidth: 1,
      borderColor: '#e4e6eb',
      borderStyle: 'dashed',
      backgroundColor: '#f9fafb',
      padding: moderateScale(8),
    },
    emptyMediaContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: verticalScale(114),
    },
    emptyMediaText: {
      fontSize: moderateScale(13),
      color: '#999',
      fontStyle: 'italic',
    },
    mediaContainer: {
      maxHeight: verticalScale(120),
    },
    mediaContentContainer: {
      gap: moderateScale(8),
      paddingVertical: moderateScale(8),
    },
    mediaItem: {
      position: 'relative',
      width: moderateScale(100),
      height: moderateScale(100),
      borderRadius: moderateScale(8),
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#e4e6eb',
    },
    mediaPreviewImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    mediaPreviewVideo: {
      width: '100%',
      height: '100%',
      backgroundColor: '#f0f2f5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    mediaPreviewDocument: {
      width: '100%',
      height: '100%',
      backgroundColor: '#f0f2f5',
      justifyContent: 'center',
      alignItems: 'center',
      padding: moderateScale(8),
    },
    mediaPreviewText: {
      fontSize: moderateScale(10),
      color: '#666',
      textAlign: 'center',
    },
    documentName: {
      fontSize: moderateScale(8),
      color: '#999',
      marginTop: moderateScale(4),
      textAlign: 'center',
    },
    removeMediaButton: {
      position: 'absolute',
      top: moderateScale(4),
      right: moderateScale(4),
      backgroundColor: '#e4e6eb',
      borderRadius: moderateScale(10),
      width: moderateScale(20),
      height: moderateScale(20),
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeIcon: {
      width: moderateScale(12),
      height: moderateScale(12),
      tintColor: '#000',
    },
    visibilitySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: moderateScale(12),
      paddingVertical: verticalScale(10),
      alignSelf: isPostScreen ? 'flex-start' : 'flex-start',
      borderRadius: moderateScale(20),
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#57B915',
      borderStyle: 'solid',
      minWidth: moderateScale(120),
    },
    visibilityIcon: {
      width: moderateScale(16),
      height: moderateScale(16),
      marginRight: moderateScale(6),
    },
    visibilityText: {
      fontSize: moderateScale(14),
      color: '#000',
      fontWeight: '500',
      marginRight: moderateScale(4),
    },
    dropdownIcon: {
      width: moderateScale(12),
      height: moderateScale(12),
      tintColor: '#666',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: verticalScale(12),
      paddingTop: verticalScale(12),
      borderTopWidth: 1,
      borderTopColor: '#e4e6eb',
    },
    iconContainer: {
      flexDirection: 'row',
      gap: moderateScale(24),
    },
    icon: {
      width: moderateScale(24),
      height: moderateScale(24),
    },
    postButton: {
      backgroundColor: '#57B915',
      paddingHorizontal: moderateScale(24),
      paddingVertical: verticalScale(10),
      borderRadius: moderateScale(20),
    },
    postButtonDisabled: {
      backgroundColor: '#c5c7c9',
    },
    postButtonText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: moderateScale(14),
    },
    uploadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: moderateScale(12),
    },
    uploadingText: {
      color: '#ffffff',
      marginTop: moderateScale(12),
      fontSize: moderateScale(16),
    },
  });
