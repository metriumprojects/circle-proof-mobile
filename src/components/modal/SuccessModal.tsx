import React, { JSX } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';

interface DateObject {
  month?: string;
  year?: string;
}

interface PositionData {
  companyName: string;
  title: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  description?: string;
  media?: any; // Added for media
  company?: {
    id: number;
    name: string;
    logo: string;
    industry: string | null;
    website: string;
    location: string;
  };
}

interface AchievementData {
  companyName?: string;
  school?: string;
  title: string;
  date?: DateObject;
  description?: string;
}

interface EducationData {
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: DateObject;
  endDate?: DateObject;
  description?: string;
}

interface HobbyData {
  hobby: string;
  title?: string;
  skillLevel?: string;
  startDate?: DateObject;
  endDate?: DateObject;
  description?: string;
}

interface SkillsData {
  skillName: string;
  title: string;
  skillLevel?: string;
  skillType?: string;
  startDate?: DateObject;
  endDate?: DateObject;
  description?: string;
}

interface AspirationData {
  goal: string;
  targetDate?: DateObject;
  whyThisMatters?: string;
}

type SubmittedData =
  | PositionData
  | AchievementData
  | EducationData
  | HobbyData
  | SkillsData
  | AspirationData;

type EntryType =
  | 'position'
  | 'achievement'
  | 'hobby'
  | 'skills'
  | 'education'
  | 'aspiration';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EntryType;
  submittedData: SubmittedData;
  onPostToFeed: () => void;
  onDeleteEntry: () => void;
  companySuggestions?: any[];
  mode?: 'add' | 'edit'; // Added mode prop
  onSuccess?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  type,
  submittedData,
  onPostToFeed,
  onDeleteEntry,
  companySuggestions,
  mode = 'add',
  onSuccess,
}) => {
  const getModalTitle = (): string => {
    const typeMap: Record<EntryType, string> = {
      position: 'position',
      achievement: 'achievement',
      hobby: 'hobby',
      skills: 'skill',
      education: 'education',
      aspiration: 'aspiration',
    };
    const typeName = typeMap[type] || 'entry';
    const action = mode === 'edit' ? 'Edit' : 'Add';
    return `${action} a ${typeName}`;
  };

  const formatDate = (dateObj?: DateObject): string => {
    if (
      !dateObj ||
      !dateObj.month ||
      dateObj.month === 'Month' ||
      !dateObj.year ||
      dateObj.year === 'Year'
    ) {
      return '';
    }
    return `${dateObj.month} ${dateObj.year}`;
  };

  const renderEntryContent = (): JSX.Element | null => {
    switch (type) {
      case 'position': {
        const data = submittedData as PositionData;
        console.log(data, 'efffe');
        const startDate = formatDate({
          month: data.startMonth,
          year: data.startYear,
        });
        const endDate = formatDate({
          month: data.endMonth,
          year: data.endYear,
        });
        const dateRange =
          startDate && endDate
            ? `${startDate} - ${endDate}`
            : startDate || endDate;

        return (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              {/* Show company logo if available, otherwise show media, then default avatar */}
              {data.company?.logo ? (
                <Image
                  source={{ uri: data.company.logo }}
                  style={styles.avatarImage}
                />
              ) : data.media && data.media.uri ? (
                <Image
                  source={{ uri: data.media.uri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarBlue]}>
                  <Text style={styles.avatarText}>
                    {data.companyName?.charAt(0) || 'P'}
                  </Text>
                </View>
              )}
              <View style={styles.entryContent}>
                {data.companyName && (
                  <Text style={styles.entryTitle}>{data.companyName}</Text>
                )}
                {data.title && (
                  <Text style={styles.entrySubtitle}>{data.title}</Text>
                )}
                <Text style={styles.entryDate}>{dateRange}</Text>
                {data.description && (
                  <View style={styles.descriptionContainer}>
                    {/* <View style={styles.achievementRow}>
                      <Image source={require('../../assets/icons/tick.png')} style={[styles.iconSmall, { tintColor: '#10b981' }]} />
                      <Text style={styles.achievementText}>Exceeded Quarterly Sales Target by 140%</Text>
                      <Text style={styles.achievementDate}>March 2023</Text>
                    </View> */}
                    <Text style={styles.description}>{data.description}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* <View style={styles.interactionRow}>
              <TouchableOpacity style={styles.interactionButton}>
                <Image source={require('../../assets/icons/like.png')} style={[styles.iconSmall, { tintColor: '#6b7280' }]} />
                <Text style={styles.interactionText}>23 Likes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.interactionButton}>
                <Image source={require('../../assets/icons/comment.png')} style={[styles.iconSmall, { tintColor: '#6b7280' }]} />
                <Text style={styles.interactionText}>12 comments</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.interactionButton}>
                <Image source={require('../../assets/icons/add.png')} style={[styles.iconSmall, { tintColor: '#6b7280' }]} />
                <Text style={styles.interactionText}>Add a comment</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        );
      }

      case 'achievement': {
        const data = submittedData as AchievementData;
        // Check if company information is included in the submitted data (from UniversalFormModal)
        const hasCompanyInfo = (data as any).company && (data as any).company.logo;
        const companyLogo = hasCompanyInfo ? (data as any).company.logo : null;
        const companyName = hasCompanyInfo ? (data as any).company.name : data.companyName;

        // Fallback to finding the company logo from companySuggestions if not in submitted data
        let fallbackCompanyLogo = null;
        if (!companyLogo && data.companyName && companySuggestions && Array.isArray(companySuggestions)) {
          const company = companySuggestions.find(c => c.name === data.companyName);
          if (company && company.logo) {
            fallbackCompanyLogo = company.logo;
          }
        }

        return (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              {/* Show company logo if available (prioritize from submitted data, then from suggestions), otherwise show default avatar */}
              {companyLogo ? (
                <Image
                  source={{ uri: companyLogo }}
                  style={styles.avatarImage}
                />
              ) : fallbackCompanyLogo ? (
                <Image
                  source={{ uri: fallbackCompanyLogo }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarBlue]}>
                  <Text style={styles.avatarText}>
                    {data.companyName?.charAt(0) ||
                      data.school?.charAt(0) ||
                      'A'}
                  </Text>
                </View>
              )}
              <View style={styles.entryContent}>
                {companyName && (
                  <Text style={styles.entryTitle}>{companyName}</Text>
                )}
                {data.school && (
                  <Text style={styles.entryTitle}>{data.school}</Text>
                )}
                <Text style={styles.entrySubtitle}>{data.title}</Text>
                {data.date && (
                  <Text style={styles.entryDate}>{formatDate(data.date)}</Text>
                )}
                {data.description && (
                  <Text style={styles.description}>{data.description}</Text>
                )}
              </View>
            </View>
          </View>
        );
      }

      case 'education': {
        const data = submittedData as EducationData;
        const eduStartDate = formatDate(data.startDate);
        const eduEndDate = formatDate(data.endDate);
        const eduDateRange =
          eduStartDate && eduEndDate
            ? `${eduStartDate} - ${eduEndDate}`
            : eduStartDate || eduEndDate;

        return (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={[styles.avatar, styles.avatarBlue]}>
                <Text style={styles.avatarText}>
                  {data.school?.charAt(0) || 'S'}
                </Text>
              </View>
              <View style={styles.entryContent}>
                <Text style={styles.entryTitle}>{data.school}</Text>
                <Text style={styles.entrySubtitle}>{data.degree}</Text>
                {data.fieldOfStudy && (
                  <Text style={styles.fieldOfStudy}>{data.fieldOfStudy}</Text>
                )}
                <Text style={styles.entryDate}>{eduDateRange}</Text>
                {data.description && (
                  <Text style={styles.description}>{data.description}</Text>
                )}
              </View>
            </View>
          </View>
        );
      }

      case 'hobby': {
        const data = submittedData as HobbyData;
        const hobbyStartDate = formatDate(data.startDate);
        const hobbyEndDate = formatDate(data.endDate);
        const hobbyDateRange =
          hobbyStartDate && hobbyEndDate
            ? `${hobbyStartDate} - ${hobbyEndDate}`
            : hobbyStartDate || hobbyEndDate;

        return (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={[styles.avatar, styles.avatarPurple]}>
                <Text style={styles.avatarText}>
                  {data.hobby?.charAt(0) || 'H'}
                </Text>
              </View>
              <View style={styles.entryContent}>
                <Text style={styles.entryTitle}>
                  {data.title || data.hobby}
                </Text>
                <Text style={styles.entrySubtitle}>{data.hobby}</Text>
                <View style={styles.metaRow}>
                  {data.skillLevel && data.skillLevel !== 'Please select' && (
                    <Text style={styles.metaText}>
                      Level: {data.skillLevel}
                    </Text>
                  )}
                  {hobbyDateRange && (
                    <Text style={styles.metaText}> • {hobbyDateRange}</Text>
                  )}
                </View>
                {data.description && (
                  <Text style={styles.description}>{data.description}</Text>
                )}
              </View>
            </View>
          </View>
        );
      }

      case 'skills': {
        const data = submittedData as SkillsData;
        const skillStartDate = formatDate(data.startDate);
        const skillEndDate = formatDate(data.endDate);
        const skillDateRange =
          skillStartDate && skillEndDate
            ? `${skillStartDate} - ${skillEndDate}`
            : skillStartDate || skillEndDate;

        return (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={[styles.avatar, styles.avatarGreen]}>
                <Text style={styles.avatarText}>
                  {data.skillName?.charAt(0) || 'S'}
                </Text>
              </View>
              <View style={styles.entryContent}>
                <Text style={styles.entryTitle}>{data.skillName}</Text>
                <Text style={styles.entrySubtitle}>{data.title}</Text>
                <View style={styles.metaRow}>
                  {data.skillLevel && data.skillLevel !== 'Please select' && (
                    <Text style={styles.metaText}>
                      Level: {data.skillLevel}
                    </Text>
                  )}
                  {data.skillType && data.skillType !== 'Please select' && (
                    <Text style={styles.metaText}>
                      {' '}
                      • Type: {data.skillType}
                    </Text>
                  )}
                  {skillDateRange && (
                    <Text style={styles.metaText}> • {skillDateRange}</Text>
                  )}
                </View>
                {data.description && (
                  <Text style={styles.description}>{data.description}</Text>
                )}
              </View>
            </View>
          </View>
        );
      }

      case 'aspiration': {
        const data = submittedData as AspirationData;
        const aspirationDate = formatDate(data.targetDate);

        return (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={[styles.avatar, styles.avatarOrange]}>
                <Text style={styles.avatarText}>🎯</Text>
              </View>
              <View style={styles.entryContent}>
                <Text style={styles.entryTitle}>{data.goal}</Text>
                {aspirationDate && (
                  <Text style={styles.entryDate}>Target: {aspirationDate}</Text>
                )}
                {data.whyThisMatters && (
                  <Text style={styles.description}>{data.whyThisMatters}</Text>
                )}
              </View>
            </View>
          </View>
        );
      }

      default:
        return null;
    }
  };

  
  const handlePostToFeed = () => {
    onPostToFeed();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handlePreferNot = () => {
    onDeleteEntry();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Image
                source={require('../../assets/icons/close.png')}
                style={styles.iconMedium}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.infoText}>
              Your {type} was added to your profile. Congratulations! Would you
              like to share it to your feed?
            </Text>

            {renderEntryContent()}

            {(type === 'position' || type === 'education') && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  <Text style={styles.warningTextBold}>Important note:</Text> to
                  prevent fraud on our platform every time a position is
                  modified all previous validations and recommendations will be
                  put until approved again with the modified informations.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={handlePostToFeed}
              style={[styles.button, styles.buttonGreen]}
            >
              <Text style={styles.buttonText}>Post it to my feed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePreferNot}
              style={[styles.button, styles.buttonRed]}
            >
              <Text style={styles.buttonText}>I prefer not</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '100%',
    maxWidth: 448,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  modalBody: {
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarBlue: {
    backgroundColor: '#2563eb',
  },
  avatarPurple: {
    backgroundColor: '#933eaf',
  },
  avatarGreen: {
    backgroundColor: '#16a34a',
  },
  avatarOrange: {
    backgroundColor: '#ea580c',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  entrySubtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  fieldOfStudy: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  achievementDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  interactionRow: {
    flexDirection: 'row',
    marginTop: 16,
    columnGap: 16,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  warningBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
  },
  warningText: {
    fontSize: 14,
    color: '#dc2626',
  },
  warningTextBold: {
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    rowGap: 8,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonGreen: {
    backgroundColor: '#22c55e',
  },
  buttonRed: {
    backgroundColor: '#ed4721',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  iconSmall: {
    width: 16,
    height: 16,
  },
  iconMedium: {
    width: 20,
    height: 20,
  },
});

export default SuccessModal;
