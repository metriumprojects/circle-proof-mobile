import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11)
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

interface VisibilityModalProps {
  visible: boolean;
  onClose: () => void;
  selectedOption: VisibilityOption;
  onSelect: (option: VisibilityOption) => void;
}

const visibilityOptions: VisibilityOption[] = [
  {
    id: 'everybody',
    title: 'Everybody',
    description: '',
    icon: 'globe',
  },
  {
    id: 'followers',
    title: 'Followers',
    description: '',
    icon: 'followers',
  },
  {
    id: 'verified',
    title: 'Verified',
    description: '',
    icon: 'verified',
  },
  {
    id: 'following',
    title: 'Following',
    description: '',
    icon: 'following',
  },
  {
    id: 'company',
    title: 'Company',
    description: '',
    icon: 'company',
  },
];

const VisibilityModal: React.FC<VisibilityModalProps> = ({
  visible,
  onClose,
  selectedOption,
  onSelect,
}) => {
  const getIconSource = (iconType: string) => {
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
        return require('../assets/icons/globe.png');
    }
  };

  const handleSelect = (option: VisibilityOption) => {
    onSelect(option);
    onClose();
  };

  const renderOption = (option: VisibilityOption) => {
    const isSelected = selectedOption.id === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionContainer,
          isSelected && styles.selectedOption,
        ]}
        onPress={() => handleSelect(option)}
      >
        <View style={styles.optionContent}>
          <Image
            source={getIconSource(option.icon)}
            style={styles.optionIcon}
          />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            {option.description && (
              <Text style={styles.optionDescription}>{option.description}</Text>
            )}
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            {/* <Image
              source={require('../assets/icons/check.png')}
              style={styles.checkmarkIcon}
            /> */}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Who can see your post?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Image
                source={require('../assets/icons/close.png')}
                style={styles.closeIcon}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.subtitle}>
            <Text style={styles.subtitleText}>
              Choose who can see this post. Anyone mentioned can always see the post and comment on it.
            </Text>
          </View>

          <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
            {visibilityOptions.map(renderOption)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  closeButton: {
    marginRight: moderateScale(16)
  },
  closeIcon: {
    width: moderateScale(16),
    height: moderateScale(16)
  },
  headerTitle: {
    fontSize: moderateScale(18),
    paddingLeft: moderateScale(16),
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  subtitle: {
    paddingHorizontal: moderateScale(20),
    marginBottom: verticalScale(20),
  },
  subtitleText: {
    fontSize: moderateScale(14),
    color: '#000',
    lineHeight: moderateScale(20),
  },
  optionsContainer: {
    maxHeight: height * 0.4,
    paddingHorizontal: moderateScale(20),
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(4),
  },
  selectedOption: {
    backgroundColor: '#e3fde6ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    marginRight: moderateScale(12),
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#000',
    marginBottom: verticalScale(2),
  },
  optionDescription: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  checkmark: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: '#57B915',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
    tintColor: 'white',
  },
});

export default VisibilityModal;
