// LikesModal.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  getPostLikes,
  toggleFollow,
  fetchTimelineLikes,
  fetchEducationLikes,
  fetchSkillLikes,
  fetchHobbyLikes,
  fetchAspirationLikes,
  fetchLikeListSectionAchievement,
} from '../api/service';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) =>
  (Dimensions.get('window').width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface LikesModalProps {
  visible: boolean;
  onClose: () => void;
  postId?: number; // Add postId prop to fetch real data
  timelineId?: number; // Add timelineId prop to fetch timeline likes
  educationId?: number; // Add educationId prop to fetch education likes
  skillId?: number; // Add skillId prop to fetch skill likes
  hobbyId?: number; // Add hobbyId prop to fetch hobby likes
  aspirationId?: number; // Add aspirationId prop to fetch aspiration likes
  achievementId?: number; // Add achievementId prop to fetch achievement likes
  entityType?: string;
}

const LikesModal: React.FC<LikesModalProps> = ({
  visible,
  onClose,
  postId,
  timelineId,
  educationId,
  skillId,
  hobbyId,
  aspirationId,
  achievementId,
  entityType,
}) => {
  const [sortOption, setSortOption] = React.useState<'recent' | 'alphabetical'>(
    'recent',
  );
  const [sortModalVisible, setSortModalVisible] = React.useState(false);
  const [likesData, setLikesData] = React.useState<any[]>([]); // Store real likes data
  const [loading, setLoading] = React.useState(false); // Loading state

  // Sort the likes data based on the selected sort option
  const getSortedLikesData = () => {
    const sortedData = [...likesData]; // Create a copy to avoid mutating the original array

    switch (sortOption) {
      case 'recent':
        // Sort by createdAt in descending order (most recent first)
        return sortedData.sort((a, b) => {
          // For education likes, the date field is 'likedAt', for others it's 'createdAt'
          const dateA = new Date(a.likedAt || a.createdAt).getTime();
          const dateB = new Date(b.likedAt || b.createdAt).getTime();
          return dateB - dateA; // Descending order (most recent first)
        });
      case 'alphabetical':
        // Sort by user's full name in ascending order (A to Z)
        return sortedData.sort((a, b) => {
          // Handle both structures: direct fields (education) and user sub-object (others)
          const nameA = (a.fullName || a.user?.fullName || '').toLowerCase();
          const nameB = (b.fullName || b.user?.fullName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      default:
        return sortedData;
    }
  };

  // Fetch likes data when modal is opened and postId or timelineId is available
  useEffect(() => {
    if (
      visible &&
      (postId ||
        timelineId ||
        educationId ||
        skillId ||
        hobbyId ||
        aspirationId ||
        achievementId)
    ) {
      fetchLikes();
    } else if (
      visible &&
      !postId &&
      !timelineId &&
      !educationId &&
      !skillId &&
      !hobbyId &&
      !aspirationId &&
      !achievementId
    ) {
      // If no postId or timelineId, set an empty array
      setLikesData([]);
    }
  }, [
    visible,
    postId,
    timelineId,
    educationId,
    skillId,
    hobbyId,
    aspirationId,
    achievementId,
    entityType,
  ]);

  const fetchLikes = async () => {
    if (
      !postId &&
      !timelineId &&
      !educationId &&
      !skillId &&
      !hobbyId &&
      !aspirationId &&
      !achievementId
    )
      return;

    try {
      setLoading(true);
      let response;
      if (timelineId && entityType) {
        console.log(
          timelineId,
          'timelineId for likes',
          entityType,
          'frrfrfrfrf',
        );
        response = await fetchTimelineLikes(timelineId, entityType);
      } else if (postId) {
        console.log(postId, 'postId for likes');
        response = await getPostLikes(postId);
      } else if (educationId) {
        console.log(educationId, 'educationId for likes');
        response = await fetchEducationLikes(
          educationId,
          entityType || 'education',
        );
      } else if (skillId) {
        console.log(skillId, 'skillId for likes');
        response = await fetchSkillLikes(skillId);
      } else if (hobbyId) {
        console.log(hobbyId, 'hobbyId for likes');
        response = await fetchHobbyLikes(hobbyId);
      } else if (aspirationId) {
        console.log(aspirationId, 'aspirationId for likes');
        response = await fetchAspirationLikes(aspirationId);
      } else if (achievementId) {
        console.log(achievementId, 'achievementId for likes');
        response = await fetchLikeListSectionAchievement(achievementId);
      } else {
        setLikesData([]);
        return;
      }
      console.log('[LikesModal] Likes API Response:', response.data);
      if (response.data && response.data.data && response.data.data.likes) {
        setLikesData(response.data.data.likes);
      } else {
        setLikesData([]);
      }
    } catch (error) {
      // console.error('[LikesModal] Error fetching likes:', error);
      setLikesData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (
    userId: number,
    currentlyFollowing: boolean,
  ) => {
    try {
      // Call the toggleFollow API which handles both follow and unfollow
      const response: any = await toggleFollow({ followingId: userId });

      // Check the response to determine the new following state
      const isFollowing = response.data.data.isFollowing;
      const action = response.data.data.action; // 'followed' or 'unfollowed'

      // Update the UI state using userId instead of index
      setLikesData(prev =>
        prev.map(like => {
          // Determine if this is education-style response (direct fields) or user object response
          const isEducationStyle =
            like.fullName !== undefined && like.profilePicture !== undefined;
          const userData = isEducationStyle ? like : like.user;

          if (userData?.id === userId) {
            if (isEducationStyle) {
              // For education-style response, update fields directly on the like object
              return {
                ...like,
                isFollowing: isFollowing,
                following: isFollowing, // Also update the following field for consistency
              };
            } else {
              // For user object response, update fields within the user object
              return {
                ...like,
                user: {
                  ...like.user,
                  isFollowing: isFollowing,
                  following: isFollowing, // Also update the following field for consistency
                },
              };
            }
          }
          return like;
        }),
      );

      // Show success message based on the action taken
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `User ${action} successfully.`,
      });
    } catch (error: any) {
      // console.error(
      //   '[LikesModal] Error toggling follow status:',
      //   error.response,
      // );
      // Show error message to user
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.error ||
          'Failed to toggle follow status. Please try again.',
      });
      // Revert the UI state change if the API call fails
      setLikesData(prev =>
        prev.map(like => {
          // Determine if this is education-style response (direct fields) or user object response
          const isEducationStyle =
            like.fullName !== undefined && like.profilePicture !== undefined;
          const userData = isEducationStyle ? like : like.user;

          if (userData?.id === userId) {
            if (isEducationStyle) {
              // For education-style response, update fields directly on the like object
              return {
                ...like,
                isFollowing: currentlyFollowing,
                following: currentlyFollowing,
              };
            } else {
              // For user object response, update fields within the user object
              return {
                ...like,
                user: {
                  ...like.user,
                  isFollowing: currentlyFollowing,
                  following: currentlyFollowing,
                },
              };
            }
          }
          return like;
        }),
      );
    }
  };

  // Get sorted data for rendering
  const sortedLikesData = getSortedLikesData();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* ✅ Fixed Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Image
                source={require('../assets/icons/back.png')}
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Likes</Text>
          </View>

          {/* ✅ Fixed Sort Section */}
          <View style={styles.sortSection}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortModalVisible(true)}
            >
              <Text style={styles.modalSubtitle}>
                {sortOption === 'recent'
                  ? 'Most recent'
                  : sortOption === 'alphabetical'
                  ? 'Alphabetical'
                  : 'Most recent'}
              </Text>
              <Image
                source={require('../assets/icons/down.png')}
                style={styles.downIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* ✅ Only Likes List Scrolls */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {loading ? (
              <Text style={styles.followUserName}>Loading...</Text>
            ) : sortedLikesData.length > 0 ? (
              sortedLikesData.map(like => {
                // Determine if this is education-style response (direct fields) or user object response
                const isEducationStyle =
                  like.fullName !== undefined &&
                  like.profilePicture !== undefined;
                const userData = isEducationStyle ? like : like.user;

                return (
                  <View
                    key={userData?.id || like.id}
                    style={styles.followUserContainer}
                  >
                    <View style={styles.followUserInfo}>
                      {userData?.profilePicture ? (
                        <Image
                          source={{ uri: userData.profilePicture }}
                          style={styles.avatarSmallImage}
                        />
                      ) : (
                        <View style={styles.avatarSmall}>
                          <Text style={styles.avatarSmallText}>
                            {userData?.fullName?.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                      {userData?.idVerified && (
                        <Image
                          source={require('../assets/icons/tick.png')}
                          style={styles.verifiedIcon}
                        />
                      )}
                      <View style={styles.userTextContainer}>
                        <Text
                          style={styles.followUserName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {userData?.fullName || 'Unknown User'}
                        </Text>
                        <Text
                          style={styles.followUserTitle}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {userData?.currentDesignation && (
                            <>{userData.currentDesignation} at </>
                          )}
                          {userData?.company}
                        </Text>
                      </View>
                    </View>
                    {/* ✅ Toggle Follow - Use userId instead of index */}
                    <TouchableOpacity
                      onPress={() =>
                        handleToggleFollow(
                          userData?.id,
                          userData?.isFollowing || userData?.following,
                        )
                      }
                      style={[
                        styles.followButton,
                        (userData?.isFollowing || userData?.following) &&
                          styles.followingButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.followButtonText,
                          (userData?.isFollowing || userData?.following) &&
                            styles.followingButtonText,
                        ]}
                      >
                        {userData?.isFollowing || userData?.following
                          ? 'Following'
                          : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noLikesText}>No likes yet</Text>
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        transparent={true}
        animationType="slide"
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.sortOverlay}
          activeOpacity={1}
          onPressOut={() => setSortModalVisible(false)}
        >
          <View style={styles.sortModal}>
            <TouchableOpacity
              onPress={() => {
                setSortOption('recent');
                setSortModalVisible(false);
              }}
              style={styles.sortOption}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortOption === 'recent' && styles.selectedSort,
                ]}
              >
                Most recent
              </Text>
              <Text>See all likes, the most recent likes are first</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSortOption('alphabetical');
                setSortModalVisible(false);
              }}
              style={styles.sortOption}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortOption === 'alphabetical' && styles.selectedSort,
                ]}
              >
                Alphabetical
              </Text>
              <Text>See all likes sorted alphabetically by name</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

export default LikesModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    width: '100%',
    height: height * 0.8,
    overflow: 'hidden',
    paddingHorizontal: moderateScale(14),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
  },
  modalScrollContent: {
    paddingBottom: verticalScale(20),
    paddingHorizontal: moderateScale(10),
  },
  backIcon: {
    width: moderateScale(24),
    height: moderateScale(20),
    tintColor: '#000',
    marginRight: moderateScale(10),
    fontWeight: 'bold',
  },
  closeButtonText: {
    fontSize: moderateScale(24),
    color: '#000',
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: '#000',
    marginBottom: verticalScale(10),
  },
  likedUser: {
    marginBottom: verticalScale(20),
  },
  likedUserName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000',
  },
  likedUserTitle: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  modalSectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  followUserContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: verticalScale(18),
  },
  followUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: moderateScale(10),
  },
  userTextContainer: {
    flex: 1,
  },
  avatarSmall: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  avatarSmallImage: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    marginRight: moderateScale(10),
  },
  avatarSmallText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#666',
  },
  verifiedIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    marginRight: moderateScale(8),
  },
  followUserName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000',
  },
  followUserTitle: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  followButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(4),
    minWidth: moderateScale(80),
  },
  followingButton: {
    backgroundColor: '#57B915',
  },
  followButtonText: {
    color: '#000',
    fontSize: moderateScale(12),
    fontWeight: '600',
    textAlign: 'center',
  },
  followingButtonText: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: verticalScale(10),
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: verticalScale(10),
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
    marginLeft: moderateScale(6),
    marginBottom: verticalScale(8),
    tintColor: '#000',
  },

  // Sort Modal
  sortOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sortModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    width: '100%',
  },
  sortOption: {
    paddingVertical: verticalScale(10),
  },
  sortOptionText: {
    fontSize: moderateScale(14),
    color: '#000',
  },
  selectedSort: {
    fontWeight: 'bold',
    color: '#000',
  },
  noLikesText: {
    fontSize: moderateScale(14),
    color: '#666',
    textAlign: 'center',
    marginTop: verticalScale(20),
    paddingHorizontal: moderateScale(16),
  },
});
