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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const ProfileScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          {/* Profile Header */}
          <View style={styles.header}>
            <Image
              source={{
                uri: 'https://via.placeholder.com/80x80/333/fff?text=E',
              }}
              style={styles.profileImage}
            />
          </View>
          {/* Name and Handle */}
          <View style={styles.verifiedBadge}>
            <Image
              source={require('../assets/icons/tick.png')}
              style={styles.checkmark}
            />
          </View>
          <Text style={styles.name}>Emery Lipshutz</Text>
          <Text style={styles.handle}>@elipshutz</Text>
          {/* Location and Join Date */}
          <View style={styles.infoRow}>
            <Text style={styles.location}>London, United Kingdom</Text>
          </View>
          <View style={styles.infoRow}>
            <Image
              source={require('../assets/icons/calendar.png')}
              style={styles.calendar}
            />
            <Text style={styles.joinDate}>Joined May 2022</Text>
          </View>
          {/* Followers */}
          <View style={styles.followersRow}>
            <Text style={styles.followersText}>22 Followers</Text>
            <Text style={styles.followingText}>38 Following</Text>
          </View>
          {/* Bio */}
          <Text style={styles.bio}>
            FinOps Certified Practitioner | Cloud Cost Optimization Expert | AWS
            | GCP | Azure | HRM | CXI | Product Hunt Official Content Creator |
            Developer | Product Hunt 🥇Top 1% of Community
          </Text>
          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
          {/* Credibility Score - Make it clickable */}
          <TouchableOpacity
            style={styles.credibilityRow}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.credibilityLabel}>Credibility score</Text>
            <Text style={styles.credibilityScore}>330</Text>
            <Text style={styles.credibilityScoreLevel}>Low</Text>
          </TouchableOpacity>
          {/* Social Links */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.socialScrollContainer}
          >
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require('../assets/icons/feed.png')}
                style={styles.feedIcon}
              />
              <Text style={styles.socialText}>Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.linkedinButton]}
            >
              <Image
                source={require('../assets/icons/timeline.png')}
                style={styles.timelineIcon}
              />
              <Text style={styles.linkedinText}>Timeline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require('../assets/icons/aspirations.png')}
                style={styles.aspirationsIcon}
              />
              <Text style={styles.socialText}>Aspirations</Text>
            </TouchableOpacity>
          </ScrollView>
          {/* Stats Row */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Image
                source={require('../assets/icons/like.png')}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}>23</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Image
                source={require('../assets/icons/comment.png')}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}>12</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Image
                source={require('../assets/icons/comment.png')}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}></Text>
            </TouchableOpacity>
          </View>
          {/* Timeline Section */}
          <View style={styles.timelineContainer}>
            {/* Google Timeline Item - Extended line version */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineIconContainer}>
                  <Image
                    source={require('../assets/icons/google.png')}
                    style={styles.timelineCompanyIcon}
                  />
                </View>
                <View style={styles.extendedLine} />
              </View>

              <View style={styles.timelineContent}>
                <View style={styles.timelineActions}>
                  <Text style={styles.timelineCompany}>Google</Text>
                  <View style={styles.timelineDateContainer}>
                    <Image
                      source={require('../assets/icons/calendar.png')}
                      style={styles.timelineCalendarIcon}
                    />
                    <Text style={styles.timelineDate}>2023 - 2025</Text>
                  </View>
                </View>

                {/* Stats for Google */}
                <View style={styles.timelineStats}>
                  <View style={styles.statItem}>
                    <Image
                      source={require('../assets/icons/like.png')}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>23</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Image
                      source={require('../assets/icons/comment.png')}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>12</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Image
                      source={require('../assets/icons/comment.png')}
                      style={styles.statIcon}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Head of Sales Timeline Item - Positioned absolutely over the extended line */}
            <View style={styles.overlayTimelineItem}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineIconContainer}>
                  <Image
                    source={require('../assets/icons/marks.png')}
                    style={styles.timelineRoleIcon}
                  />
                  <View style={styles.extendedLine1} />
                </View>
              </View>

              <View style={styles.timelineContent}>
                <View style={styles.timelineDateContainer}>
                  <Image
                    source={require('../assets/icons/calendar.png')}
                    style={styles.timelineCalendarIcon}
                  />
                  <Text style={styles.timelineDate}>May 2023 - June 2024</Text>
                </View>

                <Text style={styles.timelineJobTitle}>
                  Head of sales EMEA region
                </Text>
                <Text style={styles.timelineJobDescription}>
                  Cross-functional FinOps Architect optimizing cloud spend
                  across units and divisions as part of the Multi Cloud Landing
                  Zones
                </Text>

                <TouchableOpacity>
                  <Text style={styles.timelineSeeMore}>...see more</Text>
                </TouchableOpacity>

                {/* Stats for Head of Sales */}
                <View style={styles.timelineStats}>
                  <View style={styles.statItem}>
                    <Image
                      source={require('../assets/icons/like.png')}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>23</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Image
                      source={require('../assets/icons/comment.png')}
                      style={styles.statIcon}
                    />
                    <Text style={styles.statText}>12</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Image
                      source={require('../assets/icons/comment.png')}
                      style={styles.statIcon}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Credibility Score Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Credibility Score</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Score Display */}
            <View style={styles.scoreContainer}>
              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreNumber}>330</Text>
                <Text style={styles.scoreLevel}>Low</Text>
              </View>
              <View style={styles.levelIndicator}>
                <Text style={styles.levelText}>Level 2</Text>
                <Image
                  source={require('../assets/icons/Badge1.png')}
                  style={styles.levelImage}
                />
                <Image
                  source={require('../assets/icons/Badge2.png')}
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
              <View style={styles.criteriaItem}>
                <View style={styles.criteriaIcon}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <View style={styles.criteriaContent}>
                  <Text style={styles.criteriaTitle}>30 Times</Text>
                  <Text style={styles.criteriaDescription}>
                    Add roles and achievements and have them verified
                  </Text>
                </View>
                <Text style={styles.criteriaPoints}>36 Documents</Text>
              </View>

              {/* Criteria Item 2 */}
              <View style={styles.criteriaItem}>
                <View style={styles.criteriaIcon}>
                  <Text style={styles.xmark}>×</Text>
                </View>
                <View style={styles.criteriaContent}>
                  <Text style={styles.criteriaTitle}>
                    Validate other people skills and achievements
                  </Text>
                </View>
              </View>

              {/* Criteria Item 3 */}
              <View style={styles.criteriaItem}>
                <View style={styles.criteriaIcon}>
                  <Text style={styles.xmark}>×</Text>
                </View>
                <View style={styles.criteriaContent}>
                  <Text style={styles.criteriaTitle}>
                    Add skills, hobbies, aspirations
                  </Text>
                </View>
              </View>

              {/* Criteria Item 4 */}
              <View style={styles.criteriaItem}>
                <View style={styles.criteriaIcon}>
                  <Text style={styles.xmark}>×</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
  },
  verifiedBadge: {
    position: 'absolute',
    top: '15.8%',
    right: '77%',
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 18,
    height: 18,
    position: 'absolute',
    bottom: '200%',
    right: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendar: {
    width: 18,
    height: 18,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#000000',
  },
  handle: {
    fontSize: 17,
    color: '#787878',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#000000',
  },
  joinDate: {
    marginTop: 6,
    fontSize: 14,
    color: '#000000',
    fontWeight: 400,
  },
  followersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  followersText: {
    fontSize: 14,
    color: '#000000',
    marginTop: 6,
  },
  followingText: {
    fontSize: 14,
    color: '#000000',
    marginTop: 6,
    fontWeight: 500,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 20,
    fontWeight: 400,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#E9EAEE',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  followButtonText: {
    color: 'black',
    fontWeight: 400,
    fontSize: 14,
  },
  contactButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E9EAEE',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: '#E9EAEE',
  },
  contactButtonText: {
    color: 'black',
    fontWeight: 400,
    fontSize: 14,
  },
  credibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
    backgroundColor: '#FBBC05',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  credibilityLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: 400,
  },
  credibilityScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  credibilityScoreLevel: {
    color: '#EB4335',
    fontWeight: 'bold',
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
  },
  feedIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  timelineIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: 'white',
  },
  aspirationsIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  socialText: {
    fontSize: 14,
    color: '#000000',
  },
  linkedinText: {
    fontSize: 14,
    color: 'white',
  },
  linkedinButton: {
    backgroundColor: '#67C40C',
    borderColor: '#10B981',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: verticalScale(8),
    paddingLeft: moderateScale(40),
    gap: moderateScale(20),
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderRadius: moderateScale(4),
  },
  actionIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: moderateScale(6),
  },
  actionText: {
    fontSize: moderateScale(14),
    color: '#666',
  },

  // Timeline Styles
  timelineContainer: {
    marginTop: verticalScale(20),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(20),
  },
  timelineItem1: {
    flexDirection: 'row',
    marginBottom: verticalScale(20),
    marginLeft: moderateScale(25),
  },
  timelineLeft: {
    width: moderateScale(40),
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  timelineIconContainer: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(17.5),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timelineCompanyIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
  },
  timelineRoleIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#f81111ff',
    marginTop: verticalScale(5),
    marginBottom: verticalScale(5),
  },
  timelineContent: {
    flex: 1,
    paddingBottom: verticalScale(10),
  },
  timelineCompany: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: verticalScale(5),
  },
  timelineDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(5),
    marginTop: verticalScale(5),
  },
  timelineCalendarIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(5),
  },
  timelineDate: {
    fontSize: moderateScale(14),
    color: '#000',
    fontWeight: '500',
  },
  timelineJobTitle: {
    fontSize: moderateScale(14),
    color: '#222',
    fontWeight: 'bold',
    marginBottom: verticalScale(3),
    marginTop: verticalScale(15),
  },
  timelineJobDescription: {
    fontSize: moderateScale(13),
    color: '#2a2a2a',
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(18),
    marginTop: verticalScale(10),
  },
  timelineSeeMore: {
    fontSize: moderateScale(14),
    color: '#000000',
    fontWeight: '600',
    marginBottom: verticalScale(16),
  },
  timelineActions: {
    flexDirection: 'row',
    gap: moderateScale(20),
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  timelineActionButton: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderRadius: moderateScale(4),
  },
  timelineActionIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(6),
  },
  timelineActionText: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  timelineStats: {
    flexDirection: 'row',
    marginTop: verticalScale(8),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(15),
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(4),
  },
  statIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(5),
  },
  statText: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  indentedLine: {
    marginLeft: moderateScale(10),
    width: 1,
  },
  extendedLine: {
    position: 'absolute',
    top: moderateScale(35),
    left: '50%',
    transform: [{ translateX: -1 }],
    width: 2,
    height: '380%',
    backgroundColor: '#ebebebff',
    zIndex: 1,
  },
  extendedLine1: {
    position: 'absolute',
    top: moderateScale(35),
    left: '50%',
    transform: [{ translateX: -1 }],
    width: 2,
    height: '500%',
    backgroundColor: '#ebebebff',
    zIndex: 1,
  },
  overlayTimelineItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(20),
    marginLeft: moderateScale(25),
    zIndex: 2,
  },

  // Modal Styles
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
    // marginBottom: 10,
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
    // marginRight: 12,
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
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#4CAF50',
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

  xmark: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
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
  criteriaDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  criteriaPoints: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginTop: 2,
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
});

export default ProfileScreen;
