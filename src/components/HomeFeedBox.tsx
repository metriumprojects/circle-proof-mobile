import {
  View,
 Text,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { fetchProfileStats } from '../api/service';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const HomeFeedBox = () => {
  const navigation = useNavigation();
  const [postText, setPostText] = React.useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();

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

  const handleNavigateToPost = () => {
    // Navigate to the Post tab
    navigation.dispatch(CommonActions.navigate('Post'));
  };

  const handleMediaUpload = (mediaType: 'photo' | 'video' | 'mixed' = 'mixed') => {
    // Navigate to Post screen when media icon is clicked
    navigation.dispatch(CommonActions.navigate('Post'));
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.inputContainer}>
          <Image
            source={getImageSource()}
            style={styles.avatar}
            onError={() => setImageError(true)}
            defaultSource={require('../assets/images/dp.jpg')} // Fallback while loading
          />
          <TextInput
            style={styles.input}
            placeholder="Share your thoughts..."
            placeholderTextColor="#66"
            multiline
            value={postText}
            onChangeText={(text) => {
              // Limit to 30 characters
              if (text.length <= 30) {
                setPostText(text);
              }
            }}
            maxLength={30}
            onFocus={handleNavigateToPost}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => handleMediaUpload('mixed')}>
            <Image
              source={require('../assets/icons/gallery.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleMediaUpload('photo')}>
            <Image
              source={require('../assets/icons/document.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleMediaUpload('video')}>
            <Image
              source={require('../assets/icons/video.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.postButton}
          onPress={handleNavigateToPost}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeFeedBox;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: moderateScale(12),
    marginVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#eaecf0',
    padding: moderateScale(16),
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerContainer: {
    marginBottom: verticalScale(12),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginBottom: verticalScale(4),
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#191C1F',
    minHeight: verticalScale(40),
    maxHeight: verticalScale(100),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(16),
    lineHeight: moderateScale(20),
    backgroundColor: '#f5f5f5',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e9eaee',
    textAlignVertical: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#eaecf0',
  },
  iconContainer: {
    flexDirection: 'row',
    gap: moderateScale(20),
  },
  icon: {
    width: moderateScale(22),
    height: moderateScale(22),
  },
  postButton: {
    backgroundColor: '#191C1F',
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(8),
    borderRadius: 9999,
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
});
