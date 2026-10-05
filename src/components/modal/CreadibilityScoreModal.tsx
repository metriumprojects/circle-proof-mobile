import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface CredibilityScoreModalProps {
  visible: boolean;
  onClose: () => void;
  score: number;
  level: string;
}

const CredibilityScoreModal: React.FC<CredibilityScoreModalProps> = ({
  visible,
  onClose,
  score,
  level,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Credibility Score</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreNumber}>{score}</Text>
              <Text style={styles.scoreLevel}>{level}</Text>
            </View>
            <View style={styles.levelIndicator}>
              <Text style={styles.levelText}>Level 2</Text>
              <Image
                source={require('../../assets/icons/Badge1.png')}
                style={styles.levelImage}
              />
              <Image
                source={require('../../assets/icons/Badge2.png')}
                style={styles.levelImage}
              />
            </View>
            <View style={styles.levelProgress}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#FA6C57', '#FD8D69']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressFill1}
                />
              </View>
            </View>
          </View>

          {/* Criteria List */}
          <ScrollView style={styles.criteriaContainer}>
            {/* Criteria Item 1 */}
            <View style={styles.criteriaRow}>
              {/* First Box */}
              <View style={styles.criteriaBox}>
                <Image
                  source={require('../../assets/icons/verified.png')}
                  style={styles.criteriaBoxIcon}
                />
                <Text style={styles.criteriaBoxText}>38 Given</Text>
              </View>

              {/* Second Box */}
              <View style={styles.criteriaBox}>
                <Image
                  source={require('../../assets/icons/achievement.png')}
                  style={styles.criteriaBoxIcon}
                />
                <Text style={styles.criteriaBoxText}>24 Received</Text>
              </View>
            </View>
            
            {/* Criteria Item 2 */}
            <View style={styles.criteriaItem}>
              <View style={styles.criteriaIcon}>
                <Image
                  source={require('../../assets/icons/verified.png')}
                  style={styles.criteriaBoxIcon}
                />
              </View>
              <View style={styles.criteriaContent}>
                <Text style={styles.criteriaTitle}>
                  Add roles and achievements and have them verified
                </Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
            
            {/* Criteria Item 3 */}
            <View style={styles.criteriaItem}>
              <View style={styles.criteriaIcon}>
                <Image
                  source={require('../../assets/icons/followers.png')}
                  style={styles.criteriaBoxIcon}
                />
              </View>
              <View style={styles.criteriaContent}>
                <Text style={styles.criteriaTitle}>
                  Validate other people skills and achievements
                </Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
            
            {/* Criteria Item 4 */}
            <View style={styles.criteriaItem}>
              <View style={styles.criteriaIcon}>
                <Image
                  source={require('../../assets/icons/achievement.png')}
                  style={styles.criteriaBoxIcon}
                />
              </View>
              <View style={styles.criteriaContent}>
                <Text style={styles.criteriaTitle}>
                  Add skills, hobbies, aspirations
                </Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
            
            {/* Criteria Item 5 */}
            <View style={styles.criteriaItem}>
              <View style={styles.criteriaIcon}>
                <Image
                  source={require('../../assets/icons/achievement.png')}
                  style={styles.criteriaBoxIcon}
                />
              </View>
              <View style={styles.criteriaContent}>
                <Text style={styles.criteriaTitle}>
                  Add your education and validate it
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 24,
  },
  scoreContainer: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  scoreDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  scoreNumber: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
  },
  scoreLevel: {
    fontSize: 18,
    color: '#EB4335',
    fontWeight: 'bold',
  },
  levelIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  levelImage: {
    width: 30,
    height: 35,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  levelProgress: {
    width: '100%',
    height: 13,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill1: {
    width: '50%',
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  criteriaContainer: {
    flex: 1,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  criteriaIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  criteriaContent: {
    flex: 1,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  progressContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 13,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  criteriaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '48%',
    paddingVertical: 16,
  },
  criteriaBoxIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    tintColor: '#000',
  },
  criteriaBoxText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
});

export default CredibilityScoreModal;