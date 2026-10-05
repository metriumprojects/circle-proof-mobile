import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { addPosition, getCompanies } from '../../api/service';

const { width, height } = Dimensions.get('window');

const AddPositionScreen = () => {
  const navigation = useNavigation<any>();

  interface MediaAsset {
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
    width?: number;
    height?: number;
  }

  const [formData, setFormData] = useState({
    title: '',
    employmentType: '',
    companyName: '',
    isCurrentlyWorking: false,
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    endCurrentPosition: false,
    location: '',
    locationType: '',
    description: '',
    media: null as MediaAsset | null,
  });

  // State for company suggestions
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);

  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showStartMonthDropdown, setShowStartMonthDropdown] = useState(false);
  const [showStartYearDropdown, setShowStartYearDropdown] = useState(false);
  const [showEndMonthDropdown, setShowEndMonthDropdown] = useState(false);
  const [showEndYearDropdown, setShowEndYearDropdown] = useState(false);

  const employmentTypes = ['Please select', 'Full-time', 'Part-time', 'Self-employed', 'Freelance', 'Contract', 'Internship', 'Apprenticeship', 'Seasonal'];
  const locationTypes = ['Please select', 'On-site', 'Hybrid', 'Remote'];
  const months = ['Month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['Year', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'];

  // Fetch companies from API
  const fetchCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const response = await getCompanies();
      if (response.data.success) {
        setCompanySuggestions(response.data.data.companies);
      } else {
        throw new Error(response.data.message || 'Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load companies. Please try again.',
      });
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  // Fetch companies when component mounts
  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleMediaUpload = () => {
    // Options for the image picker
    const options: any = {
      mediaType: 'mixed', // Can select both photos and videos
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: false,
    };

    // For now, let's just use the image library (gallery) as default
    // In a real app, you might want to show an action sheet to choose between camera/gallery
    launchImageLibrary(options, handleMediaResponse);
  };

  const handleMediaResponse = (response: any) => {
    if (response.didCancel || response.error) {
      console.log('User cancelled or error:', response.error || 'User cancelled');
      return;
    }

    if (response.assets && response.assets[0]) {
      const selectedAsset = response.assets[0];
      setFormData({
        ...formData,
        media: selectedAsset,
      });
    }
  };

   const handleCreate = async () => {
    try {
      // Convert month strings to numbers for the API
      const startMonthIndex = months.indexOf(formData.startMonth || 'Month');
      const startMonthNumber = startMonthIndex > 0 ? startMonthIndex : 1;
      const startYearNumber = parseInt(formData.startYear || '2025') || 2025;

      let endMonthNumber, endYearNumber;
      if (
        formData.endMonth &&
        formData.endYear &&
        formData.endMonth !== 'Month' &&
        formData.endYear !== 'Year'
      ) {
        const endMonthIndex = months.indexOf(formData.endMonth);
        endMonthNumber = endMonthIndex > 0 ? endMonthIndex : 12;
        endYearNumber = parseInt(formData.endYear) || 2025;
      }

      // Find the company ID based on the selected company name
      let companyId = null;
      if (formData.companyName) {
        const company = companySuggestions.find(
          c => c.name === formData.companyName,
        );
        if (company) {
          companyId = company.id;
        }
      }

      // Always use FormData, whether there's a file or not
      const formDataToSend = new FormData();

      // Append all the form fields
      formDataToSend.append('title', formData.title || '');
      formDataToSend.append('employmentType', formData.employmentType || '');

      // Use companyId if available, otherwise use companyName
      if (companyId) {
        formDataToSend.append('companyId', companyId);
      } else {
        formDataToSend.append('companyName', formData.companyName || '');
      }

      formDataToSend.append('isCurrentlyWorking', formData.isCurrentlyWorking || false);
      formDataToSend.append('startMonth', startMonthNumber);
      formDataToSend.append('startYear', startYearNumber);

      // Only append end dates if they exist
      if (endMonthNumber !== undefined) {
        formDataToSend.append('endMonth', endMonthNumber);
      }
      if (endYearNumber !== undefined) {
        formDataToSend.append('endYear', endYearNumber);
      }

      formDataToSend.append('location', formData.location || '');
      formDataToSend.append('locationType', formData.locationType || '');
      formDataToSend.append('description', formData.description || '');

      // Append the file if it exists
      if (formData.media) {
        formDataToSend.append('media', {
          uri: formData.media.uri || '',
          type: formData.media.type || 'image/jpeg',
          name: formData.media.fileName || 'image.jpg',
        } as any);
      }

      // Call the addPosition API with FormData
      await addPosition(formDataToSend);

      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Position added successfully!',
      });

      // Navigate to the next screen
      navigation.navigate('AddCompany');
    } catch (error) {
      console.error('Error submitting form:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'There was an error adding the position. Please try again.',
      });
    }
  };

  const isFormValid = () => {
    return formData.title && formData.employmentType !== 'Please select' && formData.companyName;
  };

  const renderDropdown = (
    value: string,
    placeholder: string,
    options: string[],
    isOpen: boolean,
    setIsOpen: (val: boolean) => void,
    onChange: (val: string) => void
  ) => (
    <View>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={value && value !== 'Please select' ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
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
      )}
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
          <Text style={styles.headerTitle}>Add A Position</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Head of sales EMEA"
                placeholderTextColor="#999999"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            {/* Employment Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employment type</Text>
              {renderDropdown(
                formData.employmentType,
                'Please select',
                employmentTypes,
                showEmploymentDropdown,
                setShowEmploymentDropdown,
                (val) => setFormData({ ...formData, employmentType: val })
              )}
            </View>

            {/* Company Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company name</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Microsoft"
                placeholderTextColor="#999999"
                value={formData.companyName}
                onChangeText={(text) => {
                  setFormData({ ...formData, companyName: text });
                  setShowCompanySuggestions(text.length > 0);
                }}
                onFocus={() => setShowCompanySuggestions(formData.companyName.length > 0)}
              />
              {showCompanySuggestions && formData.companyName && (
                <View style={styles.suggestionsContainer}>
                  {companySuggestions
                    .filter(c => c.name.toLowerCase().includes(formData.companyName.toLowerCase()))
                    .map((company, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setFormData({ ...formData, companyName: company.name });
                          setShowCompanySuggestions(false);
                        }}
                      >
                        {/* Replace the Text component with Image component for logo */}
                        {company.logo ? (
                          <Image
                            source={{ uri: company.logo }}
                            style={styles.companyLogoImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.companyLogoPlaceholder}>
                            <Text style={styles.companyLogoText}>
                              {company.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.suggestionText}>{company.name}</Text>
                      </TouchableOpacity>
                    ))}
                  <TouchableOpacity style={styles.suggestionItem} onPress={() => navigation.navigate('AddCompany')}>
                    <Text style={styles.suggestionTextBold}>Your company is not here yet?</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Currently Working Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setFormData({ ...formData, isCurrentlyWorking: !formData.isCurrentlyWorking })}
            >
              <View style={[styles.checkbox, formData.isCurrentlyWorking && styles.checkboxChecked]}>
                {formData.isCurrentlyWorking && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I am currently working in this role</Text>
            </TouchableOpacity>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start date</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateDropdownWrapper}>
                  {renderDropdown(
                    formData.startMonth,
                    'Month',
                    months,
                    showStartMonthDropdown,
                    setShowStartMonthDropdown,
                    (val) => setFormData({ ...formData, startMonth: val })
                  )}
                </View>
                <View style={styles.dateDropdownWrapper}>
                  {renderDropdown(
                    formData.startYear,
                    'Year',
                    years,
                    showStartYearDropdown,
                    setShowStartYearDropdown,
                    (val) => setFormData({ ...formData, startYear: val })
                  )}
                </View>
              </View>
            </View>

            {/* End Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End date</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateDropdownWrapper}>
                  {renderDropdown(
                    formData.endMonth,
                    'Month',
                    months,
                    showEndMonthDropdown,
                    setShowEndMonthDropdown,
                    (val) => setFormData({ ...formData, endMonth: val })
                  )}
                </View>
                <View style={styles.dateDropdownWrapper}>
                  {renderDropdown(
                    formData.endYear,
                    'Year',
                    years,
                    showEndYearDropdown,
                    setShowEndYearDropdown,
                    (val) => setFormData({ ...formData, endYear: val })
                  )}
                </View>
              </View>
            </View>

            {/* End Current Position Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setFormData({ ...formData, endCurrentPosition: !formData.endCurrentPosition })}
            >
              <View style={[styles.checkbox, formData.endCurrentPosition && styles.checkboxChecked]}>
                {formData.endCurrentPosition && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>End current position as of now - I lead all of us as a Ex Google</Text>
            </TouchableOpacity>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Los Angeles"
                placeholderTextColor="#999999"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
            </View>

            {/* Location Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location type</Text>
              {renderDropdown(
                formData.locationType,
                'Please select',
                locationTypes,
                showLocationDropdown,
                setShowLocationDropdown,
                (val) => setFormData({ ...formData, locationType: val })
              )}
              <Text style={styles.helperText}>
                Expected Quarterly Sales Target for 2025: - Achieved 62.5% of 63 sales by landing in the second quarter of 3.1M by landing a massive 22.5M growth! Boom!
              </Text>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about you (Here"
                placeholderTextColor="#999999"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Add Media */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Add media</Text>
              {formData.media ? (
                <View style={styles.mediaPreviewContainer}>
                  {formData.media.type && formData.media.type.startsWith('image') ? (
                    <Image source={{ uri: formData.media.uri }} style={styles.mediaPreviewImage} />
                  ) : (
                    <View style={styles.mediaPreviewVideo}>
                      <Text style={styles.mediaPreviewText}>📹 Video: {formData.media.fileName || 'Selected'}</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.removeMediaButton}
                    onPress={() => setFormData({ ...formData, media: null })}
                  >
                    <Text style={styles.removeMediaText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={handleMediaUpload}>
                  <Text style={styles.uploadIcon}>⬆</Text>
                  <Text style={styles.uploadText}>Upload</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Warning Message */}
            <View style={styles.warningContainer}>
              <Text style={styles.warningIcon}>❤️</Text>
              <Text style={styles.warningText}>
                Impossible oath to prevent fraud: Your platform may only be used to verify and reference identity information. 
                <Text style={styles.warningTextBold}> Nullables and counterfactuals</Text> can be 
                <Text style={styles.warningTextBold}> only limited to false</Text>
              </Text>
            </View>

            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>

        {/* Create Button - Fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createButton, isFormValid() && styles.createButtonActive]}
            onPress={handleCreate}
            disabled={!isFormValid()}
          >
            <Text style={styles.createButtonText}>Create</Text>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
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
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#000000',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateDropdownWrapper: {
    flex: 1,
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
  suggestionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  companyLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  companyLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  companyLogoText: {
    fontSize: 16,
  },
  suggestionText: {
    fontSize: 14,
    color: '#000000',
  },
  suggestionTextBold: {
    fontSize: 14,
    color: '#0a66c2',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    lineHeight: 16,
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
  mediaPreviewContainer: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 10,
  },
  mediaPreviewVideo: {
    flex: 1,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  mediaPreviewText: {
    fontSize: 14,
    color: '#000000',
  },
  removeMediaButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 10,
  },
  removeMediaText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 10,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#d93025',
    flex: 1,
    lineHeight: 16,
  },
  warningTextBold: {
    fontWeight: '600',
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

export default AddPositionScreen;
