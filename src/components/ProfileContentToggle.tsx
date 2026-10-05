import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

import ProfileFeed from './ProfileFeed';
import ProfileTimeline from './ProfileTimeline';
import ProfileAspirations from './ProfileAspirations';
import ProfileHobby from './ProfileHobby';
import ProfileSkills from './ProfileSkills';
import ProfileEducation from './ProfileEducation';

const { width } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type ContentType =
  | 'feed'
  | 'timeline'
  | 'aspirations'
  | 'hobby'
  | 'skills'
  | 'education';

interface ProfileContentToggleProps {
  userId?: number;
  key?: string | number;
}

const ProfileContentToggle: React.FC<ProfileContentToggleProps> = ({
  userId,
  key,
}) => {
  const [activeContent, setActiveContent] = useState<ContentType>('feed');

  // Convert the key prop to a refreshKey for the ProfileFeed component
  const refreshKey = key || 0;

  const renderContent = () => {
    switch (activeContent) {
      case 'feed':
        return <ProfileFeed key={refreshKey} />;
      case 'timeline':
        return <ProfileTimeline userId={userId} />;
      case 'aspirations':
        return <ProfileAspirations />;
      case 'hobby':
        return <ProfileHobby />;
      case 'skills':
        return <ProfileSkills />;
      case 'education':
        return <ProfileEducation />;
      default:
        return <ProfileTimeline />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Social Links - Toggle Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.socialScrollContainer}
      >
        <TouchableOpacity
          style={[
            styles.socialButton,
            activeContent === 'feed' && styles.activeSocialButton,
          ]}
          onPress={() => setActiveContent('feed')}
        >
          <Image
            source={require('../assets/icons/feed.png')}
            style={[
              styles.feedIcon,
              activeContent === 'feed' && styles.activeIcon,
            ]}
          />
          <Text
            style={[
              styles.socialText,
              activeContent === 'feed' && styles.activeSocialText,
            ]}
          >
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.socialButton,
            activeContent === 'timeline' && styles.activeSocialButton,
          ]}
          onPress={() => setActiveContent('timeline')}
        >
          <Image
            source={require('../assets/icons/timeline.png')}
            style={[
              styles.timelineIcon,
              activeContent === 'timeline' && styles.activeIcon,
            ]}
          />
          <Text
            style={[
              styles.socialText,
              activeContent === 'timeline' && styles.activeSocialText,
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.socialButton,
            activeContent === 'education' && styles.activeSocialButton,
          ]}
          onPress={() => setActiveContent('education')}
        >
          <Image
            source={require('../assets/icons/aspirations.png')}
            style={[
              styles.educationIcon,
              activeContent === 'education' && styles.activeIcon,
            ]}
          />
          <Text
            style={[
              styles.socialText,
              activeContent === 'education' && styles.activeSocialText,
            ]}
          >
            Education
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.socialButton,
            activeContent === 'hobby' && styles.activeSocialButton,
          ]}
          onPress={() => setActiveContent('hobby')}
        >
          <Image
            source={require('../assets/icons/feed.png')}
            style={[
              styles.hobbyIcon,
              activeContent === 'hobby' && styles.activeIcon,
            ]}
          />
          <Text
            style={[
              styles.socialText,
              activeContent === 'hobby' && styles.activeSocialText,
            ]}
          >
            Hobbies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.socialButton,
            activeContent === 'skills' && styles.activeSocialButton,
          ]}
          onPress={() => setActiveContent('skills')}
        >
          <Image
            source={require('../assets/icons/timeline.png')}
            style={[
              styles.skillsIcon,
              activeContent === 'skills' && styles.activeIcon,
            ]}
          />
          <Text
            style={[
              styles.socialText,
              activeContent === 'skills' && styles.activeSocialText,
            ]}
          >
            Skills
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.socialButton,
            activeContent === 'aspirations' && styles.activeSocialButton,
          ]}
          onPress={() => setActiveContent('aspirations')}
        >
          <Image
            source={require('../assets/icons/aspirations.png')}
            style={[
              styles.aspirationsIcon,
              activeContent === 'aspirations' && styles.activeIcon,
            ]}
          />
          <Text
            style={[
              styles.socialText,
              activeContent === 'aspirations' && styles.activeSocialText,
            ]}
          >
            Aspirations
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Render the active content */}
      <View style={styles.contentContainer}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  socialScrollContainer: {
    paddingHorizontal: 8,
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
    minWidth: 120,
    backgroundColor: 'transparent',
  },
  activeSocialButton: {
    backgroundColor: '#67C40C',
    borderColor: '#10B981',
  },
  feedIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#000000', // Add default color for normal state
  },
  timelineIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#000000', // Add default color for normal state
  },
  aspirationsIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#000000', // Add default color for normal state
  },
  hobbyIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#000000', // Add default color for normal state
  },
  skillsIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#000000', // Add default color for normal state
  },
  educationIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#000000', // Add default color for normal state
  },
  activeIcon: {
    tintColor: 'white',
  },
  socialText: {
    fontSize: 14,
    color: '#000000',
  },
  activeSocialText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
});

export default ProfileContentToggle;
