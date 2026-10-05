import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { addSchool, checkSchoolName } from '../../api/service';

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolAdded: (school: any) => void;
}

const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  isOpen,
  onClose,
  onSchoolAdded,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    website: '',
    type: '',
    logo: null as any,
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [checkingSchool, setCheckingSchool] = useState(false);
  const [schoolCheckResult, setSchoolCheckResult] = useState<{
    exists: boolean | null;
    message: string;
  }>({ exists: null, message: '' });
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const schoolTypes = [
    'University',
    'College',
    'School',
    'Institute',
    'Bootcamp',
  ];

  const handleLogoUpload = () => {
    const options: any = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: true,
    };

    launchImageLibrary(options, handleLogoResponse);
  };

  const handleLogoResponse = (response: any) => {
    if (response.didCancel || response.error) {
      console.log(
        'User cancelled or error:',
        response.error || 'User cancelled',
      );
      return;
    }

    if (response.assets && response.assets[0]) {
      const selectedAsset = response.assets[0];
      setFormData({
        ...formData,
        logo: selectedAsset,
      });
    }
  };

  const checkSchool = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a school name first');
      return;
    }

    setCheckingSchool(true);
    try {
      const response = await checkSchoolName(formData.name.trim());
      if (response.data.success) {
        if (response.data.data.exists) {
          setSchoolCheckResult({
            exists: true,
            message: `School already exists.`,
          });
        } else {
          setSchoolCheckResult({
            exists: false,
            message: 'This school name is available to create.',
          });
        }
      } else {
        setSchoolCheckResult({
          exists: null,
          message: response.data.message || 'Error checking school name',
        });
      }
    } catch (error: any) {
      console.error('Error checking school name:', error);
      setSchoolCheckResult({
        exists: null,
        message: error.response?.data?.message || 'Failed to check school name',
      });
    } finally {
      setCheckingSchool(false);
    }
  };

  const handleAddSchool = async () => {
    if (!isFormValid()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields',
      });
      return;
    }

    setLoading(true);
    try {
      // Create FormData object
      const formDataToSend = new FormData();

      // Append all text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('website', formData.website);
      formDataToSend.append('type', formData.type);

      // Append logo file if it exists
      if (formData.logo) {
        formDataToSend.append('logo', {
          uri: formData.logo.uri || '',
          type: formData.logo.type || 'image/jpeg',
          name: formData.logo.fileName || `logo_${Date.now()}.jpg`,
        });
      }

      const response = await addSchool(formDataToSend);

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'School added successfully!',
        });
        onSchoolAdded(response.data.data.school);
        onClose();
        // Reset form
        setFormData({
          name: '',
          location: '',
          website: '',
          type: '',
          logo: null,
          agreeToTerms: false,
        });
      } else {
        throw new Error(response.data.message || 'Failed to add school');
      }
    } catch (error: any) {
      console.error('Error adding school:', error.response);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message ||
          'Failed to add school. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.website.trim() !== '' &&
      formData.type !== '' &&
      formData.type !== 'Please select' &&
      formData.agreeToTerms
    );
  };

  const renderDropdown = (
    value: string,
    placeholder: string,
    options: string[],
    isOpen: boolean,
    setIsOpen: (val: boolean) => void,
    onChange: (val: string) => void,
  ) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text
          style={
            value ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder
          }
        >
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            <ScrollView
              style={styles.dropdownScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Image
                source={require('../../assets/icons/back.png')}
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add a School</Text>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Preview Section */}
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Preview</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewContent}>
                    {formData.logo ? (
                      <Image
                        source={{ uri: formData.logo.uri }}
                        style={styles.previewLogoImage}
                      />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>
                          {formData.name
                            ? formData.name.charAt(0).toUpperCase()
                            : 'S'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewSchoolName}>
                        {formData.name || 'School Name'}
                      </Text>
                      <Text style={styles.previewLocation}>
                        {formData.location || 'Location'}
                      </Text>
                      <Text style={styles.previewType}>
                        {formData.type && formData.type !== 'Please select'
                          ? formData.type
                          : 'Type'}
                      </Text>
                      {/* <Text style={styles.previewWebsite}>
                        {formData.website || 'Website'}
                      </Text> */}
                    </View>
                  </View>
                </View>
              </View>

              {/* School Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Name <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.schoolNameContainer}>
                  <TextInput
                    style={[styles.input, styles.schoolNameInput]}
                    placeholder="School Name"
                    placeholderTextColor="#99999"
                    value={formData.name}
                    onChangeText={text => {
                      setFormData({ ...formData, name: text });
                      // Clear the check result whenever the input changes
                      setSchoolCheckResult({ exists: null, message: '' });
                    }}
                  />
                  <TouchableOpacity
                    style={styles.checkButton}
                    onPress={checkSchool}
                    disabled={checkingSchool}
                  >
                    {checkingSchool ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.checkButtonText}>Check</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {schoolCheckResult.message ? (
                  <Text
                    style={[
                      styles.checkResultText,
                      schoolCheckResult.exists === true
                        ? styles.checkResultError
                        : styles.checkResultSuccess,
                    ]}
                  >
                    {schoolCheckResult.message}
                  </Text>
                ) : null}
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Location<Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Add school location"
                  placeholderTextColor="#9999"
                  value={formData.location}
                  onChangeText={text =>
                    setFormData({ ...formData, location: text })
                  }
                />
              </View>

              {/* Website */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Website <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Begin with http:// https:// or www/"
                  placeholderTextColor="#99999"
                  value={formData.website}
                  onChangeText={text =>
                    setFormData({ ...formData, website: text })
                  }
                />
              </View>

              {/* Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Type <Text style={styles.required}>*</Text>
                </Text>
                {renderDropdown(
                  formData.type,
                  'Please select',
                  schoolTypes,
                  showTypeDropdown,
                  setShowTypeDropdown,
                  val => setFormData({ ...formData, type: val }),
                )}
              </View>

              {/* Add Logo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Add Logo</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleLogoUpload}
                >
                  <Text style={styles.uploadIcon}>⬆</Text>
                  <Text style={styles.uploadText}>
                    {formData.logo ? 'Change Logo' : 'Upload'}
                  </Text>
                </TouchableOpacity>
                {formData.logo && (
                  <Text style={styles.hint}>
                    Logo uploaded: {formData.logo.fileName}
                  </Text>
                )}
              </View>

              {/* Terms and Conditions */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({
                    ...formData,
                    agreeToTerms: !formData.agreeToTerms,
                  })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.agreeToTerms && styles.checkboxChecked,
                  ]}
                >
                  {formData.agreeToTerms && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  I confirm that I am an authorized representative of this
                  school and have the right to act on its behalf in the creation
                  and management of this page. Our school agrees to the
                  <Text style={styles.link}>
                    {' '}
                    Read Circle Proof terms of service
                  </Text>{' '}
                  for Schools.
                </Text>
              </TouchableOpacity>

              {/* Bottom Spacing */}
              <View style={styles.bottomSpacing} />
            </View>
          </ScrollView>

          {/* Add Button - Fixed at bottom */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                isFormValid() && styles.createButtonActive,
              ]}
              onPress={handleAddSchool}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Add School</Text>
              )}
            </TouchableOpacity>
          </View>
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
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '90%',
    maxWidth: 480,
    height: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: '#c8f5a0',
    borderRadius: 8,
    padding: 16,
    minHeight: 150,
  },
  previewContent: {
    flexDirection: 'row',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#4285f4',
  },
  previewLogoImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewSchoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  previewLocation: {
    fontSize: 12,
    color: '#66666',
    marginBottom: 2,
  },
  previewType: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  previewWebsite: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00000',
    marginBottom: 8,
  },
  required: {
    color: '#d93025',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  schoolNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolNameInput: {
    flex: 1,
    marginRight: 10,
  },
  checkButton: {
    backgroundColor: '#6ec71e',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkResultText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  checkResultError: {
    color: '#c62828',
  },
  checkResultSuccess: {
    color: '#6ec71e',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#66666',
    marginTop: 4,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dropdownTextPlaceholder: {
    fontSize: 14,
    color: '#999999',
  },
  dropdownTextSelected: {
    fontSize: 14,
    color: '#000000',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666666',
  },
  dropdownMenu: {
    position: 'absolute',
    width: '80%',
    maxHeight: 300,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#00000',
  },
  dropdownContainer: {
    position: 'relative',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  uploadIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#000000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 3,
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#0a66c2',
    borderColor: '#0a66c2',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#00000',
    flex: 1,
    lineHeight: 18,
  },
  link: {
    color: '#0a66c2',
    textDecorationLine: 'underline',
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  createButton: {
    backgroundColor: '#cccccc',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  createButtonActive: {
    backgroundColor: '#6ec71e',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default AddSchoolModal;
