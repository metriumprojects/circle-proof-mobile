import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { reorderValidations, toggleValidation } from '../../api/service';
import Toast from 'react-native-toast-message';
import EyeIcon from '../../assets/icons/EyeIcon';
import HiddenEyeIcon from '../../assets/icons/HiddenEyeIcon';

const { height, width } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

interface Skill {
  skillName: string;
}

interface Company {
  id: number;
  name: string;
  logo: string;
  uniqueAddress: string;
  isVerified?: boolean;
}

interface Validator {
  id: number;
  fullName: string;
  profilePicture: string | null;
  currentDesignation: string | null;
  headline?: string | null;
}

interface Validation {
  id: number;
  validator: Validator;
  validatorReference?: {
    type: string;
    id: number;
    title: string;
    isVerified: boolean;
    hrVerified: boolean;
    company: {
      id: number;
      name: string;
      logo: string;
    };
    startMonth: number;
    startYear: number;
    endMonth: number | null;
    endYear: number | null;
    isCurrentlyWorking: boolean;
    registrarVerified?: boolean; // Added registrarVerified
  };
  relationship: string;
  recommendation: string;
  skills: Skill[];
}

interface ValidationEntity {
  id: number | string;
  title: string;
  company?: Company; // Made optional
  school?: {
    // Added school support
    id: number;
    name: string;
    logo: string;
    type: string;
    location: string;
    website: string;
    isVerified?: boolean;
  };
  mediaUrl: string | null;
  description: string;
  dateRange: string;
  validations: Validation[];
}

interface ValidationsListModalProps {
  visible: boolean;
  onClose: () => void;
  item: ValidationEntity | null;
  readOnly?: boolean; // New prop for read-only mode
}

const ValidationsListModal: React.FC<ValidationsListModalProps> = ({
  visible,
  onClose,
  item,
  readOnly = false, // Default to false
}) => {
  const [data, setData] = useState<Validation[]>([]);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [isVisibilityChanging, setIsVisibilityChanging] = useState<number | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  useEffect(() => {
    if (item?.validations) {
      const hiddenIds = item.validations
        .filter((validation: any) => validation.isHidden)
        .map(validation => validation.id);
      setHiddenIds(hiddenIds);

      setData(item.validations);
    }
  }, [item]);

  const reorderPayload = () => {
    const payload = data.map((validation, index) => ({
      validationId: Number(validation.id),
      order: Number(index + 1),
    }));
    return payload;
  }

  const submitReorderValidations = async () => {
    try {
      setLoading(true);
      const payload = reorderPayload();
      const response = await reorderValidations(payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Validations reordered successfully',
      });
    } catch (error) {
      console.error(error);
      setError('Failed to reorder validations');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to reorder validations',
      });
    } finally {
      setLoading(false);
    }
  }




  if (!item) return null;

  const renderValidationItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<Validation>) => {
    const validation = item;
    const validator = validation.validator;
    const validatorRef = validation.validatorReference;
    const isHidden = hiddenIds.includes(validation.id);


    const toggleValidationVisibility = async (id: number) => {
      try {
        setIsVisibilityChanging(id);
        const payload = { isHidden: !isHidden };
        const response = await toggleValidation(id, payload);
        setHiddenIds(prev =>
          prev.includes(id)
            ? prev.filter(hiddenId => hiddenId !== id)
            : [...prev, id],
        );
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Validation visibility toggled successfully',
        });
      } catch (error) {
        console.error(error);
        setVisibilityError('Failed to toggle validation visibility');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to toggle validation visibility',
        });
      } finally {
        setIsVisibilityChanging(null);
      }
    };

    let validatorDateRange = '';
    if (validatorRef) {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const startMonth = validatorRef.startMonth
        ? monthNames[validatorRef.startMonth - 1]
        : '';
      const endMonth = validatorRef.endMonth
        ? monthNames[validatorRef.endMonth - 1]
        : '';

      if (startMonth && validatorRef.startYear) {
        validatorDateRange = `${startMonth} ${validatorRef.startYear}`;
        if (endMonth && validatorRef.endYear) {
          validatorDateRange += ` - ${endMonth} ${validatorRef.endYear}`;
        } else {
          validatorDateRange += ' - Present';
        }
      }
    }

    return (
      <ScaleDecorator>
        <View style={styles.itemRow}>
          {/* Sidebar for Controls - Only show if NOT readOnly */}
          {!readOnly && (
            <View style={styles.controlSidebar}>
              <TouchableOpacity
                disabled={isVisibilityChanging !== null}
                onPress={() => toggleValidationVisibility(validation.id)}
                style={[styles.controlButton, isVisibilityChanging !== null && { opacity: 0.5 }]}
              >
                {isVisibilityChanging !== null && isVisibilityChanging === validation.id ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  isHidden ? <HiddenEyeIcon size={24} color="#000" /> : <EyeIcon size={24} color="#000" />
                  // <Image
                  //   source={
                  //     icons[isHidden ? 'hidden' : 'eye']
                  //   }
                  //   // source={
                  //   //   isHidden
                  //   //     ? require('../../assets/icons/hidden.png')
                  //   //     : require('../../assets/icons/eye.png')
                  //   // }
                  //   style={[styles.controlIcon, isHidden && styles.hiddenIcon]}
                  // />
                  // <Text>{isHidden ? 'Hide' : 'Show'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={100}
                style={styles.controlButton}
              >
                {/* Custom 6-dot drag handle visual */}
                <View style={styles.dragHandle}>
                  <View style={styles.dragDotRow}>
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </View>
                  <View style={styles.dragDotRow}>
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </View>
                  <View style={styles.dragDotRow}>
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Card Content */}
          <View
            style={[styles.verificationCard, isHidden && styles.hiddenCard]}
          >
            <View style={styles.badgeContainer}>
              {validatorRef &&
                !(
                  (item as any)?.type === 'skill' ||
                  (item as any)?.type === 'hobby' ||
                  (item as any)?.type === 'aspiration' ||
                  (item as any)?.achievementType === 'skill' ||
                  (item as any)?.achievementType === 'hobby' ||
                  (item as any)?.achievementType === 'aspiration'
                ) &&
                (validatorRef.hrVerified !== undefined ||
                  validatorRef.registrarVerified !== undefined) && (
                  <View style={styles.badgeContent}>
                    <View
                      style={
                        validatorRef.hrVerified ||
                          validatorRef.registrarVerified
                          ? styles.verifiedBadge
                          : styles.notVerifiedBadge
                      }
                    >
                      <Text style={styles.badgeText}>
                        {validatorRef.registrarVerified !== undefined
                          ? validatorRef.registrarVerified
                            ? 'Registrar'
                            : 'Not Verified'
                          : validatorRef.hrVerified
                            ? 'HR'
                            : 'Not Verified'}
                      </Text>
                    </View>
                    <View style={styles.badgeIconContainer}>
                      <Image
                        source={
                          validatorRef.hrVerified ||
                            validatorRef.registrarVerified
                            ? require('../../assets/icons/verifiedShield.png')
                            : require('../../assets/icons/unverifiedShield.png')
                        }
                        style={styles.badgeIcon}
                      />
                    </View>
                  </View>
                )}

              <View style={styles.verifiedProfile}>
                {validator?.profilePicture ? (
                  <Image
                    source={{ uri: validator.profilePicture }}
                    style={styles.verifiedAvatar}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {validator?.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                )}
                <View style={styles.verifiedInfo}>
                  <Text style={styles.verifiedName}>{validator?.fullName}</Text>
                </View>
              </View>
            </View>

            {/* Skills */}
            {validation.skills && validation.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                {validation.skills.map((skill, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillBadgeText}>{skill.skillName}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Company Info */}
            {validatorRef && validatorRef.company && (
              <View style={styles.verifiedCompanyInfo}>
                <Text style={styles.verifiedText}>
                  Worked at {validatorRef.company.name} from{' '}
                  {validatorDateRange}
                </Text>
              </View>
            )}

            {/* Details */}
            <View style={styles.verifiedDetails}>
              {validation?.relationship && (
                <View style={styles.relationshipInfo}>
                  <Text style={styles.relationshipText}>
                    <Text style={styles.relationshipLabel}>Relationship: </Text>
                    {validation.relationship}
                  </Text>
                </View>
              )}

              {validation.recommendation && (
                <View style={styles.recommendationInfo}>
                  <Text style={styles.recommendationLabel}>
                    Recommendation:{' '}
                  </Text>
                  <Text style={styles.recommendationText}>
                    {validation.recommendation}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  const ListHeader = () => {
    // Determine logo and name (Company or School)
    const entityLogo = item.company?.logo || item.school?.logo;
    const entityName = item.company?.name || item.school?.name;

    return (
      <>
        {/* Achievement/Position Details Header */}
        <View style={styles.achievementHeader}>
          <View style={styles.companyRow}>
            <Image
              source={
                entityLogo
                  ? { uri: entityLogo }
                  : require('../../assets/icons/marks.png')
              }
              style={styles.companyLogo}
            />
            <View>
              <Text style={styles.achievementTitle}>{item.title}</Text>
              <Text style={styles.companyName}>{item.dateRange}</Text>
            </View>
          </View>
          <Text style={styles.dateRange}>{item.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* Validations List Title */}
        <Text style={styles.sectionTitle}>
          Verified by {item.validations.length}{' '}
          {item.validations.length === 1 ? 'person' : 'people'}
        </Text>
      </>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Image
                source={require('../../assets/icons/back.png')}
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Verifications</Text>
          </View>

          <GestureHandlerRootView style={{ flex: 1 }}>
            <DraggableFlatList
              data={data}
              onDragEnd={({ data }) => setData(data)}
              keyExtractor={item => item.id.toString()}
              renderItem={renderValidationItem}
              ListHeaderComponent={ListHeader}
              contentContainerStyle={styles.scrollContent}
              ListEmptyComponent={
                <Text style={styles.noDataText}>No validations found.</Text>
              }
            />
          </GestureHandlerRootView>

          <View style={styles.modalFooter}>
            <Pressable disabled={loading || isVisibilityChanging !== null} style={[styles.saveButton, { opacity: (loading || isVisibilityChanging !== null) ? 0.5 : 1 }]} onPress={submitReorderValidations}>
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ValidationsListModal;

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
    height: height * 0.85,
    overflow: 'hidden',
    paddingHorizontal: moderateScale(14),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backIcon: {
    width: moderateScale(24),
    height: moderateScale(20),
    tintColor: '#000',
    marginRight: moderateScale(10),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContent: {
    paddingBottom: verticalScale(30),
    paddingTop: verticalScale(10),
  },
  achievementHeader: {
    paddingVertical: verticalScale(10),
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  companyLogo: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  achievementTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
  },
  companyName: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  dateRange: {
    fontSize: moderateScale(14),
    color: '#000000',
    marginTop: verticalScale(4),
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: verticalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(12),
  },
  // Row for Item (Sidebar + Card)
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  controlSidebar: {
    width: moderateScale(50),
    alignItems: 'center',
    paddingTop: verticalScale(12),
    marginRight: moderateScale(3),
  },
  controlButton: {
    padding: moderateScale(8),
    marginBottom: verticalScale(16),
  },
  controlIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    tintColor: '#555',
  },
  hiddenIcon: {
    tintColor: '#999',
  },
  // Drag Custom UI
  dragHandle: {
    gap: verticalScale(3),
    paddingVertical: verticalScale(4),
  },
  dragDotRow: {
    flexDirection: 'row',
    gap: moderateScale(3),
  },
  dragDot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#999',
  },
  // Validation Card Styles (Modified)
  verificationCard: {
    flex: 1, // Take remaining width
    backgroundColor: '#E9EAEE',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    // marginBottom: verticalScale(12), // Removed as margin is handled by itemRow
  },
  hiddenCard: {
    opacity: 0.6,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // marginBottom: verticalScale(8),
    marginLeft: moderateScale(10),
    marginTop: -verticalScale(10),
  },
  badgeContent: {
    position: 'relative',
    marginTop: verticalScale(6),
    marginLeft: -moderateScale(20),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#57B915',
    paddingHorizontal: moderateScale(12),
    paddingLeft: moderateScale(30),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(20),
    width: '90%',
  },
  notVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0031',
    paddingHorizontal: moderateScale(12),
    paddingLeft: moderateScale(30),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(20),
  },
  badgeText: {
    fontSize: moderateScale(12),
    color: '#ffffff',
    fontWeight: '600',
  },
  badgeIconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // gap: moderateScale(6),
    marginBottom: verticalScale(8),
    marginTop: verticalScale(-25),
    marginLeft: moderateScale(12),
  },
  badgeIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
  },
  verifiedProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    position: 'relative',
    marginTop: verticalScale(8),
  },
  verifiedAvatar: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(18),
    position: 'absolute',
    left: moderateScale(8),
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInitial: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(18),
    position: 'absolute',
    left: moderateScale(12),
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    textAlign: 'center',
    color: '#ffffff',
    backgroundColor: '#000000',
    paddingTop: verticalScale(2),
  },
  verifiedInfo: {
    paddingVertical: verticalScale(4),
    paddingHorizontal: moderateScale(12),
    paddingLeft: moderateScale(32),
    marginLeft: moderateScale(20),
    backgroundColor: '#000000',
    borderRadius: moderateScale(12),
    alignSelf: 'flex-start',
  },
  verifiedName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  verifiedPosition: {
    fontSize: moderateScale(14),
    color: '#666666',
    marginBottom: verticalScale(2),
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  skillBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(10),
  },
  skillBadgeText: {
    fontSize: moderateScale(14),
    color: '#ffffff',
  },
  verifiedCompanyInfo: {
    marginTop: verticalScale(4),
    marginBottom: verticalScale(4),
  },
  verifiedText: {
    fontSize: moderateScale(14),
    color: '#333',
    fontStyle: 'italic',
  },
  verifiedDetails: {
    marginTop: verticalScale(8),
    paddingTop: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  relationshipInfo: {
    marginBottom: verticalScale(4),
  },
  relationshipText: {
    fontSize: moderateScale(14),
    color: '#000',
  },
  relationshipLabel: {
    fontWeight: '600',
  },
  recommendationInfo: {
    marginTop: verticalScale(4),
  },
  recommendationLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000',
    marginBottom: verticalScale(2),
  },
  recommendationText: {
    fontSize: moderateScale(14),
    color: '#333',
    lineHeight: moderateScale(20),
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginTop: verticalScale(20),
    fontSize: moderateScale(14),
  },
  modalFooter: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(12),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#000000',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});
