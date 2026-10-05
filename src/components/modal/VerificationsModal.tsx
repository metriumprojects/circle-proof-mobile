import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { fetchMyTimeline, fetchTimeLineByUserId } from '../../api/service';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface VerificationsModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: number | null;
}

const VerificationsModal: React.FC<VerificationsModalProps> = ({
  visible,
  onClose,
  userId,
}) => {
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      loadTimeline();
    }
  }, [visible]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = userId
        ? await fetchTimeLineByUserId(userId)
        : await fetchMyTimeline();
      if (response.data.success) {
        setTimelineData(response.data.data.timeline || []);
      }
    } catch (error: any) {
      console.error('Error fetching timeline:', error.response);
    } finally {
      setLoading(false);
    }
  };

  const currentCompany = timelineData[activeTabIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Verifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#57B915" />
            </View>
          ) : timelineData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No verifications found.</Text>
            </View>
          ) : (
            <>
              {/* Company Tabs */}
              <View style={styles.tabsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabsScrollContent}
                >
                  {timelineData.map((item, index) => (
                    <TouchableOpacity
                      key={item.company.id || index}
                      onPress={() => setActiveTabIndex(index)}
                      style={[
                        styles.tab,
                        activeTabIndex === index && styles.activeTab,
                      ]}
                    >
                      <View style={styles.tabContent}>
                        {item.company.logo ? (
                          <Image
                            source={{ uri: item.company.logo }}
                            style={styles.tabLogo}
                          />
                        ) : (
                          <View style={styles.tabLogoPlaceholder}>
                            <Text style={styles.tabLogoPlaceholderText}>
                              {item.company.name.charAt(0)}
                            </Text>
                          </View>
                        )}
                        <Text
                          style={[
                            styles.tabText,
                            activeTabIndex === index && styles.activeTabText,
                          ]}
                        >
                          {item.company.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Positions List */}
              <ScrollView style={styles.content}>
                {currentCompany?.positions.map((pos: any) => (
                  <View key={pos.id} style={styles.positionCard}>
                    <LinearGradient
                      colors={['#ffffff', '#f9f9f9']}
                      style={styles.cardGradient}
                    >
                      <View style={styles.posHeader}>
                        <View style={styles.posTitleContainer}>
                          <Text style={styles.posTitle}>{pos.title}</Text>
                          <Text style={styles.posType}>
                            • {pos.employmentType}
                          </Text>
                        </View>
                        {pos.hrVerified && (
                          <View style={styles.hrBadge}>
                            <Text style={styles.hrBadgeText}>HR Verified</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.posDate}>{pos.dateRange}</Text>
                      <Text style={styles.posLocation}>
                        {pos.location} • {pos.locationType}
                      </Text>

                      {pos.description && (
                        <Text style={styles.posDescription}>
                          {pos.description}
                        </Text>
                      )}

                      {/* Validations (Certifications) */}
                      {pos.validations && pos.validations.length > 0 && (
                        <View style={styles.section}>
                          <View style={styles.sectionHeader}>
                            <Image
                              source={require('../../assets/icons/verified.png')}
                              style={styles.sectionIcon}
                            />
                            <Text style={styles.sectionTitle}>
                              Verifications received
                            </Text>
                          </View>
                          {pos.validations.map((val: any) => (
                            <View key={val.id} style={styles.validationItem}>
                              <View style={styles.validatorInfo}>
                                <Image
                                  source={
                                    val.validator?.profilePicture
                                      ? { uri: val.validator.profilePicture }
                                      : require('../../assets/images/dp.jpg')
                                  }
                                  style={styles.validatorAvatar}
                                />
                                <View>
                                  <Text style={styles.validatorName}>
                                    {val.validator?.fullName || 'Anonymous'}
                                  </Text>
                                  <Text style={styles.validatorDesignation}>
                                    {val.validator?.currentDesignation ||
                                      val.relationship}
                                  </Text>
                                </View>
                              </View>
                              {val.recommendation && (
                                <Text style={styles.recommendationText}>
                                  Recommendation: "{val.recommendation}"
                                </Text>
                              )}
                              {val.skills && val.skills.length > 0 && (
                                <View style={styles.skillsList}>
                                  {val.skills.map((s: any, idx: number) => (
                                    <View key={idx} style={styles.skillBadge}>
                                      <Text style={styles.skillText}>
                                        {s.skillName}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Achievements */}
                      {pos.achievements && pos.achievements.length > 0 && (
                        <View style={styles.section}>
                          <View style={styles.sectionHeader}>
                            <Image
                              source={require('../../assets/icons/achievement.png')}
                              style={styles.sectionIcon}
                            />
                            <Text style={styles.sectionTitle}>
                              Achievements
                            </Text>
                          </View>
                          {pos.achievements.map((ach: any) => (
                            <View key={ach.id} style={styles.achievementItem}>
                              <Text style={styles.achievementTitle}>
                                {ach.title}
                              </Text>
                              <Text style={styles.achievementDate}>
                                {ach.dateRange}
                              </Text>
                              <Text style={styles.achievementDesc}>
                                {ach.description}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                ))}

                {/* Orphaned Achievements associated with this company */}
                {currentCompany?.orphanedAchievements &&
                  currentCompany.orphanedAchievements.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Image
                          source={require('../../assets/icons/achievement.png')}
                          style={styles.sectionIcon}
                        />
                        <Text style={styles.sectionTitle}>
                          Other Achievements
                        </Text>
                      </View>
                      {currentCompany.orphanedAchievements.map((ach: any) => (
                        <View key={ach.id} style={styles.achievementItem}>
                          <Text style={styles.achievementTitle}>
                            {ach.title}
                          </Text>
                          <Text style={styles.achievementDate}>
                            {ach.dateRange}
                          </Text>
                          <Text style={styles.achievementDesc}>
                            {ach.description}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    height: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    position: 'relative',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    padding: 8,
  },
  closeButtonText: {
    fontSize: moderateScale(20),
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#999',
    textAlign: 'center',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeTab: {
    backgroundColor: '#57B915',
    borderColor: '#57B915',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  tabLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tabLogoPlaceholderText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#999',
  },
  tabText: {
    fontSize: moderateScale(14),
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  positionCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
  },
  posHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  posTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  posTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#333',
  },
  posType: {
    fontSize: moderateScale(13),
    color: '#888',
    marginTop: 2,
  },
  hrBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hrBadgeText: {
    fontSize: moderateScale(11),
    color: '#2E7D32',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  posDate: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#555',
  },
  posLocation: {
    fontSize: moderateScale(13),
    color: '#777',
    marginTop: 2,
  },
  posDescription: {
    fontSize: moderateScale(14),
    color: '#444',
    marginTop: 10,
    lineHeight: 20,
  },
  section: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: '#57B915',
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#333',
  },
  validationItem: {
    backgroundColor: '#fcfcfc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 10,
  },
  validatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  validatorName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
  },
  validatorDesignation: {
    fontSize: moderateScale(12),
    color: '#888',
  },
  recommendationText: {
    fontSize: moderateScale(13),
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#646464ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontSize: moderateScale(11),
    color: '#ffffff',
    fontWeight: '500',
  },
  achievementItem: {
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#333',
  },
  achievementDate: {
    fontSize: moderateScale(12),
    color: '#888',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: moderateScale(13),
    color: '#555',
  },
});

export default VerificationsModal;
