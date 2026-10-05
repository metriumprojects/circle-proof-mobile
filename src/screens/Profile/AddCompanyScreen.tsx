import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { addCompany, checkCompanyName } from '../../api/service';

const { width, height } = Dimensions.get('window');

const AddCompanyScreen = () => {
 const navigation = useNavigation<any>();

  const [formData, setFormData] = useState({
    companyName: '',
    location: '',
    followers: '',
    specialty: '',
    website: '',
    industry: '',
    organizationSize: '',
    description: '',
    logo: null as any,
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(false);
  const [companyCheckResult, setCompanyCheckResult] = useState<{ exists: boolean | null, message: string }>({ exists: null, message: '' });
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showOrgSizeDropdown, setShowOrgSizeDropdown] = useState(false);

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Marketing',
    'Real Estate',
    'Transportation',
    'Agriculture',
    'Energy',
    'Telecommunications',
    'Media & Entertainment',
    'Automotive',
    'Aerospace',
    'Biotechnology',
    'Pharmaceuticals',
    'Construction',
    'Hospitality',
    'Tourism',
    'Food & Beverage',
    'Fashion & Apparel',
    'Sports & Recreation',
    'Government',
    'Non-profit',
    'Insurance',
    'Legal',
    'Artificial Intelligence',
    'Cybersecurity',
    'E-commerce',
    'Renewable Energy',
    'Environmental Services',
    'Mining',
    'Chemicals',
    'Utilities',
    'Shipping & Logistics',
    'Publishing',
    'Gaming',
    'Social Media',
  ];

  const orgSizes = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1001-5000',
    '5001-10000',
    '10001+',
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

  const handleCreate = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create FormData object
      const formDataToSend = new FormData();

      // Append all text fields
      formDataToSend.append('name', formData.companyName);
      formDataToSend.append('website', formData.website);
      formDataToSend.append('industry', formData.industry);
      formDataToSend.append('organizationSize', formData.organizationSize);
      formDataToSend.append('shortDescription', formData.description);
      formDataToSend.append('location', formData.location);

      // Append logo file if it exists
      if (formData.logo) {
        formDataToSend.append('logo', {
          uri: formData.logo.uri || '',
          type: formData.logo.type || 'image/jpeg',
          name: formData.logo.fileName || `logo_${Date.now()}.jpg`,
        });
      }

      const response = await addCompany(formDataToSend);

      Alert.alert('Success', 'Company created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating company:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Failed to create company. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.companyName.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.website.trim() !== '' &&
      formData.industry !== '' &&
      formData.industry !== 'Please select' &&
      formData.organizationSize !== '' &&
      formData.organizationSize !== 'Please select' &&
      formData.description.trim() !== '' &&
      formData.agreeToTerms
    );
  };

  const checkCompany = async () => {
    if (!formData.companyName.trim()) {
      Alert.alert('Error', 'Please enter a company name first');
      return;
    }

    setCheckingCompany(true);
    try {
      const response = await checkCompanyName(formData.companyName.trim());
      if (response.data.success) {
        if (response.data.data.exists) {
          setCompanyCheckResult({
            exists: true,
            message: `Company already exists.`
          });
        } else {
          setCompanyCheckResult({
            exists: false,
            message: 'This company name is available to create.'
          });
        }
      } else {
        setCompanyCheckResult({
          exists: null,
          message: response.data.message || 'Error checking company name'
        });
      }
    } catch (error: any) {
      console.error('Error checking company name:', error);
      setCompanyCheckResult({
        exists: null,
        message: error.response?.data?.message || 'Failed to check company name'
      });
    } finally {
      setCheckingCompany(false);
    }
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a Company Page</Text>
        </View>

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
                        {formData.companyName
                          ? formData.companyName.charAt(0).toUpperCase()
                          : 'G'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewCompanyName}>
                      {formData.companyName || 'Google'}
                    </Text>
                    <Text style={styles.previewLocation}>
                      {formData.location || 'London, United Kingdom'}
                    </Text>
                    <Text style={styles.previewCategory}>
                      {formData.industry &&
                      formData.industry !== 'Please select'
                        ? formData.industry
                        : 'Technology'}
                    </Text>
                    {/* <Text style={styles.previewSize}>
                      {formData.organizationSize &&
                      formData.organizationSize !== 'Please select'
                        ? formData.organizationSize
                        : '100-500'}
                    </Text> */}
                    <Text style={styles.previewFollowers}>
                      {formData.followers || ' 0 followers'} 0 following
                    </Text>
                    <Text style={styles.previewDescription} numberOfLines={2}>
                      {formData.description ||
                        'FANGM Certified Professional | Cloud Cost Optimization Expert | AWS | GCP | Azure | HBM | Newsletter | Community leader'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Company Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.companyNameContainer}>
                <TextInput
                  style={[styles.input, styles.companyNameInput]}
                  placeholder="Company Name"
                  placeholderTextColor="#99999"
                  value={formData.companyName}
                  onChangeText={text => {
                    setFormData({ ...formData, companyName: text });
                    // Clear the check result whenever the input changes
                    setCompanyCheckResult({ exists: null, message: '' });
                  }}
                />
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={checkCompany}
                  disabled={checkingCompany}
                >
                  {checkingCompany ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.checkButtonText}>Check</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              {companyCheckResult.message ? (
                <Text style={[
                  styles.checkResultText, 
                  companyCheckResult.exists === true ? styles.checkResultError : styles.checkResultSuccess
                ]}>
                  {companyCheckResult.message}
                </Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Location<Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Add your unique circle Proof address"
                placeholderTextColor="#999999"
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
                placeholderTextColor="#999999"
                value={formData.website}
                onChangeText={text =>
                  setFormData({ ...formData, website: text })
                }
              />
            </View>

            {/* Industry */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Industry <Text style={styles.required}>*</Text>
              </Text>
              {renderDropdown(
                formData.industry,
                'Please select',
                industries,
                showIndustryDropdown,
                setShowIndustryDropdown,
                val => setFormData({ ...formData, industry: val }),
              )}
            </View>

            {/* Organization Size */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Organization size <Text style={styles.required}>*</Text>
              </Text>
              {renderDropdown(
                formData.organizationSize,
                'Please select',
                orgSizes,
                showOrgSizeDropdown,
                setShowOrgSizeDropdown,
                val => setFormData({ ...formData, organizationSize: val }),
              )}
            </View>

            {/* Short Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Short description of what your company does{' '}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter a brief description..."
                placeholderTextColor="#999999"
                value={formData.description}
                onChangeText={text =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
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
                organization and have the right to act on its behalf in the
                creation and management of this page. Our organization agrees to
                the
                <Text style={styles.link}>
                  {' '}
                  Read Circle Proof terms of service
                </Text>{' '}
                for Pages.
              </Text>
            </TouchableOpacity>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>

        {/* Create Button - Fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              isFormValid() && styles.createButtonActive,
            ]}
            onPress={handleCreate}
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  previewCompanyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  previewLocation: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  previewCategory: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  previewSize: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  previewFollowers: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  previewDescription: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  dropdownContainer: {
    position: 'relative',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
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
    maxHeight: 284, // 300 - 16 (padding)
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000000',
  },
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyLogoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyLogoText: {
    fontSize: 20,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  suggestionDetails: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 1,
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
    color: '#000000',
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
  companyNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyNameInput: {
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
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  checkResultText: {
    fontSize: 12,
    marginTop: 4,
    padding: 8,
    borderRadius: 4,
  },
  checkResultError: {
    // backgroundColor: '#ffebee',
    color: '#c62828',
  },
  checkResultSuccess: {
    // backgroundColor: '#e8f5e9',
    color: '#6ec71e',
  },
});

export default AddCompanyScreen;
