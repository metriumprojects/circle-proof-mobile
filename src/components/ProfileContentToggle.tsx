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

import { THEME } from '../config/theme';

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  socialScrollContainer: {
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 6,
    marginBottom: 18,
  },
  socialButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.brandGreyTwo,
    minWidth: 105,
    backgroundColor: THEME.colors.brandGreyOne,
  },
  activeSocialButton: {
    backgroundColor: THEME.colors.white,
    borderColor: THEME.colors.brandInk,
    borderWidth: 1.5,
    shadowColor: THEME.colors.brandInk,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  feedIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
    tintColor: THEME.colors.brandGreyThree,
  },
  timelineIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
    tintColor: THEME.colors.brandGreyThree,
  },
  aspirationsIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
    tintColor: THEME.colors.brandGreyThree,
  },
  hobbyIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
    tintColor: THEME.colors.brandGreyThree,
  },
  skillsIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
    tintColor: THEME.colors.brandGreyThree,
  },
  educationIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
    tintColor: THEME.colors.brandGreyThree,
  },
  activeIcon: {
    tintColor: THEME.colors.brandInk,
  },
  socialText: {
    fontSize: 13,
    color: THEME.colors.brandGreyThree,
    fontWeight: '500',
  },
  activeSocialText: {
    color: THEME.colors.brandInk,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
});

export default ProfileContentToggle;
