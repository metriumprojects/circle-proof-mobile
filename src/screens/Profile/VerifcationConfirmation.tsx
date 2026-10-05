import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  Asset,
} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import {
  confirmVerificationRequest,
  cancelVerificationRequest,
  getCompanies,
  addPosition,
} from '../../api/service';

const VerificationConfirmation = () => {
  const [title, setTitle] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [endCurrentPosition, setEndCurrentPosition] = useState(false);
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Asset[]>([]);
  const [hasPosition, setHasPosition] = useState<boolean | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [positionData, setPositionData] = useState<any>(null);
  const [userPositions, setUserPosition] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );
  const [addPositionLoading, setAddPositionLoading] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);

  // Modal visibility states
  const [showEmploymentModal, setShowEmploymentModal] = useState(false);
  const [showStartMonthModal, setShowStartMonthModal] = useState(false);
  const [showStartYearModal, setShowStartYearModal] = useState(false);
  const [showEndMonthModal, setShowEndMonthModal] = useState(false);
  const [showEndYearModal, setShowEndYearModal] = useState(false);
  const [showLocationTypeModal, setShowLocationTypeModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
    null,
  );

  const navigation = useNavigation();
  const route = useRoute();
  const {
    requestId,
    hasPosition: routeHasPosition,
    userPosition,
    requesterName: routeRequesterName,
    positionData: routePositionData,
  } = (route.params as {
    requestId?: number;
    hasPosition?: boolean;
    userPosition?: any;
    requesterName?: string;
    positionData?: any;
  }) || {};

  useEffect(() => {
    if (routeHasPosition !== undefined) {
      setHasPosition(routeHasPosition);
      setShowFullForm(false);
    }

    if (routeRequesterName) {
      setRequesterName(routeRequesterName);
    }

    if (routePositionData) {
      setPositionData(routePositionData);
    }

    if (userPosition) {
      setUserPosition(userPosition);
      // Set the selected position to the first position if available
      if (userPosition?.positions?.length > 0) {
        setSelectedPosition(userPosition.positions[0].title);
        setSelectedPositionId(userPosition.positions[0].id);
      }
    }
  }, [routeHasPosition, routeRequesterName, routePositionData, userPosition]);

  console.log(selectedPosition, 'dfdffgfg');

  // Fetch companies when component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompanies();
        console.log(response, 'company data');
        setCompanies(response.data.data.companies || []);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Dropdown options
  const employmentTypes = [
    'Part-time',
    'Contract',
    'Freelance',
    'Internship',
    'Self-employed',
    'Full-time',
  ];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const years = Array.from({ length: 50 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );
  const locationTypes = ['On-site', 'Remote', 'Hybrid'];
  const positions = [
    { title: 'Please select', id: null },
    ...(userPositions?.positions?.map((pos: any) => ({
      title: pos.title,
      id: pos.id,
    })) || []),
  ];

  const handleConfirm = async () => {
    if (!requestId) {
      console.error('Missing requestId for confirmation');
      return;
    }

    // Validate that a position is selected
    if (!selectedPositionId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select your position at the time',
      });
      return;
    }

    setConfirmLoading(true);
    try {
      // Prepare the request body with selectedPositionId
      const requestBody = {
        relationship: 'Senior', // Optional field
        recommendation: recommendation, // Optional field
        validatorPositionId: selectedPositionId, // Use the selected position ID
      };

      // Call the confirmVerificationRequest API
      const response = await confirmVerificationRequest(requestId, requestBody);
      console.log('Confirm verification response:', response);

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Verification request confirmed successfully',
      });

      // Navigate back to the previous screen
      navigation.goBack();
    } catch (error: any) {
      console.error(
        'Confirm verification error:',
        error.response?.data?.message,
      );
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message ||
          'Failed to confirm verification request. Please try again.',
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!requestId) {
      console.error('Missing requestId for cancellation');
      return;
    }

    setCancelLoading(true);
    try {
      // Call the cancelVerificationRequest API (no body required)
      const response = await cancelVerificationRequest(requestId);
      console.log('Cancel verification response:', response);

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Verification request cancelled successfully',
      });

      // Navigate back to the previous screen
      navigation.goBack();
    } catch (error) {
      console.error('Cancel verification error:', error);
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel verification request. Please try again.',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // Function to handle media upload
  const handleMediaUpload = () => {
    Alert.alert(
      'Upload Media',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handleTakePhoto() },
        {
          text: 'Choose from Library',
          onPress: () => handleChooseFromLibrary(),
        },
      ],
      { cancelable: true },
    );
  };

  // Function to handle taking a photo
  const handleTakePhoto = () => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      saveToPhotos: true,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to take photo');
        console.log(
          'Camera Error: ',
          response.errorCode,
          response.errorMessage,
        );
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        // Check if we already have 10 or more files
        if (selectedFiles.length >= 10) {
          Alert.alert(
            'Maximum Limit Reached',
            'You can only upload up to 10 images.',
          );
          return;
        }
        const newAsset = {
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
        };
        setSelectedFiles(prev => [...prev, newAsset as Asset]);
      }
    });
  };

  // Function to choose from library
  const handleChooseFromLibrary = () => {
    // Check if we already have 10 or more files
    if (selectedFiles.length >= 10) {
      Alert.alert(
        'Maximum Limit Reached',
        'You can only upload up to 10 images.',
      );
      return;
    }

    // Calculate how many more images we can add
    const remainingSlots = 10 - selectedFiles.length;
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      selectionLimit: remainingSlots, // Allow up to remaining slots
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to select image');
        console.log(
          'ImagePicker Error: ',
          response.errorCode,
          response.errorMessage,
        );
      } else if (response.assets && response.assets.length > 0) {
        const newAssets = response.assets.map(asset => ({
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
        }));
        setSelectedFiles(prev => [...prev, ...(newAssets as Asset[])]);
      }
    });
  };

  // Function to remove uploaded media at a specific index
  const handleRemoveMedia = (index: number) => {
    Alert.alert('Remove Media', 'Are you sure you want to remove this media?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => {
          const updatedFiles = selectedFiles.filter((_, i) => i !== index);
          setSelectedFiles(updatedFiles);
        },
        style: 'destructive',
      },
    ]);
  };

  const handleAddPosition = async () => {
    // Validate required fields
    if (
      !title ||
      !employmentType ||
      (!selectedCompanyId && !companyName) ||
      !location ||
      !locationType ||
      !description
    ) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    // Convert month strings to numbers for API
    const monthMap: { [key: string]: number } = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    const startMonthNumber = monthMap[startMonth] || 0;
    const endMonthNumber = monthMap[endMonth] || 0;

    setAddPositionLoading(true);
    try {
      // Prepare the request body for addPosition API
      const positionData: any = {
        title: title,
        employmentType: employmentType,
        isCurrentlyWorking: currentlyWorking,
        startMonth: startMonthNumber,
        startYear: parseInt(startYear),
        location: location,
        locationType: locationType,
        description: description,
      };

      // Only add companyId if it's selected, otherwise use companyName
      if (selectedCompanyId) {
        positionData.companyId = selectedCompanyId;
      } else {
        positionData.companyName = companyName;
      }

      // Add optional fields if they exist
      if (
        !currentlyWorking &&
        !endCurrentPosition &&
        endMonthNumber &&
        endYear
      ) {
        positionData.endMonth = endMonthNumber;
        positionData.endYear = parseInt(endYear);
      }

      let response;
      // Handle media uploads
      if (selectedFiles.length > 0) {
        // Create FormData object to handle multiple files
        const formData = new FormData();
        formData.append('title', positionData.title);
        formData.append('employmentType', positionData.employmentType);
        formData.append('isCurrentlyWorking', positionData.isCurrentlyWorking);
        formData.append('startMonth', positionData.startMonth);
        formData.append('startYear', positionData.startYear);
        formData.append('location', positionData.location);
        formData.append('locationType', positionData.locationType);
        formData.append('description', positionData.description);

        // Add company info
        if (selectedCompanyId) {
          formData.append('companyId', selectedCompanyId);
        } else {
          formData.append('companyName', companyName);
        }

        // Add optional fields
        if (positionData.endMonth !== undefined)
          formData.append('endMonth', positionData.endMonth);
        if (positionData.endYear !== undefined)
          formData.append('endYear', positionData.endYear);

        // Add media files
        selectedFiles.forEach((file, index) => {
          formData.append('media', {
            uri: file.uri || '',
            type: file.type || 'image/jpeg',
            name: file.fileName || `image_${index}.jpg`,
          } as any);
        });

        // Call the addPosition API with FormData
        response = await addPosition(formData);
        console.log('Add position response:', response);
      } else {
        // Call the addPosition API with regular data if no media files
        response = await addPosition(positionData);
        console.log('Add position response:', response);
      }

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Position added successfully',
      });

      // Create the new position object to add to the userPositions state
      const newPosition = {
        id: response.data.data?.id || Date.now(),
        title: title,
        employmentType: employmentType,
        isCurrentlyWorking: currentlyWorking,
        startMonth: startMonthNumber,
        startYear: parseInt(startYear),
        location: location,
        locationType: locationType,
        description: description,
        companyId: selectedCompanyId,
        companyName: selectedCompanyId
          ? companies.find(c => c.id === selectedCompanyId)?.name
          : companyName,
        ...response.data.data,
      };

      // Update userPositions and set as selected position
      setUserPosition((prev: any) => {
        if (prev && prev.positions) {
          const updatedPositions = [...prev.positions, newPosition];
          return {
            ...prev,
            positions: updatedPositions,
          };
        } else {
          return {
            positions: [newPosition],
          };
        }
      });

      // Set the newly created position as selected
      setSelectedPosition(newPosition.title);
      setSelectedPositionId(newPosition.id);

      // Update hasPosition to true to show the confirmation fields
      setHasPosition(true);
      setShowFullForm(false); // Reset to show the confirmation form
    } catch (error) {
      console.error('Add position error:', error);
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add position. Please try again.',
      });
    } finally {
      setAddPositionLoading(false);
    }
  };

  // Define types for dropdown modal props
  type DropdownModalProps = {
    visible: boolean;
    onClose: () => void;
    options: string[];
    onSelect: (option: string) => void;
    title: string;
  };

  const DropdownModal: React.FC<DropdownModalProps> = ({
    visible,
    onClose,
    options,
    onSelect,
    title,
  }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {options.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
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
        <Text style={styles.headerTitle}>Verification Request</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.notificationBar}>
          {positionData?.user?.profilePicture ? (
            <Image
              source={{ uri: positionData.user.profilePicture }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {requesterName ? requesterName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.notificationText}>
            {requesterName} would like you to confirm his/her experience:
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.companyHeader}>
            {positionData?.company?.logo ? (
              <Image
                source={{ uri: positionData.company.logo }}
                style={styles.logoImage}
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>
                  {positionData?.company?.name
                    ? positionData.company.name.charAt(0).toUpperCase()
                    : 'C'}
                </Text>
              </View>
            )}
            <Text style={styles.companyName}>
              {positionData?.company?.name || 'Company'}
            </Text>
          </View>

          <Text style={styles.dealTitle}>
            {positionData?.title || 'Position Title'}
          </Text>

          <View style={styles.dateContainer}>
            <Text style={styles.calendarIcon}>📅</Text>
            <Text style={styles.dateText}>
              {positionData?.formattedDateRange || 'Date'}
            </Text>
          </View>

          <Text style={styles.description}>
            {positionData?.description || 'Position description'}
          </Text>
        </View>

        <View style={styles.formSection}>
          {/* Case 1: User has position - show simplified form */}
          {hasPosition === true && (
            <>
              <Text style={styles.sectionTitle}>
                Thank you. You can now confirm or decline{' '}
                {requesterName || 'the user'} experiences:
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your position at the time</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowPositionModal(true)}
                >
                  <Text style={styles.dropdownText}>
                    {selectedPosition || 'Please select'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recommendation (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder=""
                  value={recommendation}
                  onChangeText={setRecommendation}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                  disabled={confirmLoading}
                >
                  {confirmLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? (
                    <ActivityIndicator size="small" color="#FF0000" />
                  ) : (
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Case 2: User doesn't have position */}
          {hasPosition === false && (
            <>
              {/* Show intro section only when showFullForm is false */}
              {!showFullForm && (
                <>
                  <Text style={styles.sectionTitle}>
                    But first, please tell us about your time at
                  </Text>

                  <View style={styles.companyBadge}>
                    <View style={styles.smallLogo}>
                      <Text style={styles.smallLogoText}>
                        {positionData?.company?.logo ? (
                          <Image
                            source={{ uri: positionData.company.logo }}
                            style={styles.logoImage}
                          />
                        ) : (
                          <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoText}>
                              {positionData?.company?.name
                                ? positionData.company.name
                                    .charAt(0)
                                    .toUpperCase()
                                : 'C'}
                            </Text>
                          </View>
                        )}
                      </Text>
                    </View>
                    <Text style={styles.companyBadgeText}>
                      {positionData?.company?.name || 'Company'}
                    </Text>
                  </View>

                  <Text style={styles.subText}>
                    You'll be able to add all your experience later on, please
                    add this experience first.
                  </Text>
                </>
              )}

              {/* Show full form with Next button initially */}
              {!showFullForm && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Head of sales EMEA"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Employment type</Text>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setShowEmploymentModal(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {employmentType || 'Please select'}
                      </Text>
                      <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company name</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={[styles.input, styles.inputWithIconStyle]}
                        value={companyName}
                        onChangeText={text => {
                          setCompanyName(text);
                          setSelectedCompanyId(null); // Clear selected company ID when typing
                          if (text.length > 0) {
                            // Filter companies based on input
                            const filtered = companies.filter(company =>
                              company.name
                                .toLowerCase()
                                .includes(text.toLowerCase()),
                            );
                            setFilteredCompanies(filtered);
                            setShowCompanySuggestions(true);
                          } else {
                            setShowCompanySuggestions(false);
                          }
                        }}
                        onFocus={() => {
                          if (companyName.length > 0) {
                            const filtered = companies.filter(company =>
                              company.name
                                .toLowerCase()
                                .includes(companyName.toLowerCase()),
                            );
                            setFilteredCompanies(filtered);
                            setShowCompanySuggestions(true);
                          }
                        }}
                        placeholder="Ex: Microsoft"
                        placeholderTextColor="#999999"
                      />
                      <Text style={styles.dropdownIcon}>▼</Text>
                    </View>

                    {/* Company Suggestions Dropdown */}
                    {showCompanySuggestions && companyName.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        {filteredCompanies.map((company, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => {
                              setCompanyName(company.name);
                              setSelectedCompanyId(company.id);
                              setShowCompanySuggestions(false);
                            }}
                          >
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
                            <Text style={styles.suggestionText}>
                              {company.name}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={() => {
                            (navigation as any).navigate('AddCompany');
                          }}
                        >
                          <Text style={styles.suggestionTextBold}>
                            Your company is not here yet?
                          </Text>
                        </TouchableOpacity>
                        {filteredCompanies.length === 0 && (
                          <View style={styles.suggestionItem}>
                            <Text style={styles.suggestionText}>
                              No companies found
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setCurrentlyWorking(!currentlyWorking)}
                    >
                      {currentlyWorking && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>
                      I am currently working in this role
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start date</Text>
                    <View style={styles.dateRow}>
                      <TouchableOpacity
                        style={[styles.dropdown, styles.halfWidth]}
                        onPress={() => setShowStartMonthModal(true)}
                      >
                        <Text style={styles.dropdownText}>
                          {startMonth || 'Month'}
                        </Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dropdown, styles.halfWidth]}
                        onPress={() => setShowStartYearModal(true)}
                      >
                        <Text style={styles.dropdownText}>
                          {startYear || 'Year'}
                        </Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>End date</Text>
                    <View style={styles.dateRow}>
                      <TouchableOpacity
                        style={[styles.dropdown, styles.halfWidth]}
                        onPress={() => setShowEndMonthModal(true)}
                      >
                        <Text style={styles.dropdownText}>
                          {endMonth || 'Month'}
                        </Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dropdown, styles.halfWidth]}
                        onPress={() => setShowEndYearModal(true)}
                      >
                        <Text style={styles.dropdownText}>
                          {endYear || 'Year'}
                        </Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setEndCurrentPosition(!endCurrentPosition)}
                    >
                      {endCurrentPosition && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>
                      End current position as of now - Head t
                    </Text>
                  </View> */}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Location</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: London"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Location type</Text>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setShowLocationTypeModal(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {locationType || 'Please select'}
                      </Text>
                      <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="List what you did there"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Add media</Text>

                    {/* Show multiple media if available */}
                    {selectedFiles.length > 0 ? (
                      <View style={styles.multipleMediaContainer}>
                        {selectedFiles.map((file, index) => (
                          <View
                            key={index}
                            style={styles.mediaPreviewContainer}
                          >
                            {file.type?.startsWith('image') ? (
                              <Image
                                source={{ uri: file.uri }}
                                style={styles.mediaPreviewImage}
                              />
                            ) : (
                              <View style={styles.mediaPreviewVideo}>
                                <Text style={styles.mediaPreviewText}>
                                  📹 Video: {file.fileName || 'Selected'}
                                </Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={styles.removeMediaButton}
                              onPress={() => {
                                const updatedFiles = selectedFiles.filter(
                                  (_, i) => i !== index,
                                );
                                setSelectedFiles(updatedFiles);
                              }}
                            >
                              <Text style={styles.removeText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                        {selectedFiles.length < 10 && (
                          <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handleMediaUpload}
                          >
                            <Text style={styles.uploadIcon}>⬆</Text>
                            <Text style={styles.uploadText}>Add More</Text>
                          </TouchableOpacity>
                        )}
                        {selectedFiles.length >= 10 && (
                          <Text style={styles.maxLimitText}>
                            Maximum 10 images allowed
                          </Text>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handleMediaUpload}
                      >
                        <Text style={styles.uploadIcon}>📷</Text>
                        <Text style={styles.uploadText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Next Button */}
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleAddPosition}
                    disabled={addPositionLoading}
                  >
                    {addPositionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.nextButtonText}>Next</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Show simplified form (like hasPosition true) after clicking Next */}
              {showFullForm && (
                <>
                  <Text style={styles.sectionTitle}>
                    Thank you. You can now confirm or decline{' '}
                    {requesterName || 'the user'} experiences:
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Your position at the time</Text>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setShowPositionModal(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {selectedPosition || 'Please select'}
                      </Text>
                      <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Recommendation (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder=""
                      value={recommendation}
                      onChangeText={setRecommendation}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* <View style={styles.inputGroup}>
                    <Text style={styles.label}>Add media</Text>
                    {uploadedMedia ? (
                      <View style={styles.mediaContainer}>
                        <Image
                          source={{ uri: uploadedMedia.uri }}
                          style={styles.mediaPreview}
                        />
                        <View style={styles.mediaInfo}>
                          <Text style={styles.mediaFileName} numberOfLines={1}>
                            {uploadedMedia.fileName || 'Image'}
                          </Text>
                          {uploadedMedia.fileSize && (
                            <Text style={styles.mediaFileSize}>
                              {(uploadedMedia.fileSize / 1024).toFixed(2)} KB
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={handleRemoveMedia}
                        >
                          <Text style={styles.removeButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handleMediaUpload}
                      >
                        <Text style={styles.uploadIcon}>📷</Text>
                        <Text style={styles.uploadButtonText}>
                          Upload Photo
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View> */}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleConfirm}
                      disabled={confirmLoading}
                    >
                      {confirmLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancel}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (
                        <ActivityIndicator size="small" color="#FF0000" />
                      ) : (
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={showEmploymentModal}
        onClose={() => setShowEmploymentModal(false)}
        options={employmentTypes}
        onSelect={setEmploymentType}
        title="Select Employment Type"
      />

      <DropdownModal
        visible={showStartMonthModal}
        onClose={() => setShowStartMonthModal(false)}
        options={months}
        onSelect={setStartMonth}
        title="Select Month"
      />

      <DropdownModal
        visible={showStartYearModal}
        onClose={() => setShowStartYearModal(false)}
        options={years}
        onSelect={setStartYear}
        title="Select Year"
      />

      <DropdownModal
        visible={showEndMonthModal}
        onClose={() => setShowEndMonthModal(false)}
        options={months}
        onSelect={setEndMonth}
        title="Select Month"
      />

      <DropdownModal
        visible={showEndYearModal}
        onClose={() => setShowEndYearModal(false)}
        options={years}
        onSelect={setEndYear}
        title="Select Year"
      />

      <DropdownModal
        visible={showLocationTypeModal}
        onClose={() => setShowLocationTypeModal(false)}
        options={locationTypes}
        onSelect={setLocationType}
        title="Select Location Type"
      />

      <DropdownModal
        visible={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        options={positions.map(pos => pos.title)}
        onSelect={selectedTitle => {
          const selectedPos = positions.find(
            pos => pos.title === selectedTitle,
          );
          if (selectedPos) {
            setSelectedPosition(selectedPos.title);
            setSelectedPositionId(selectedPos.id);
          }
        }}
        title="Select Position"
      />

      <DropdownModal
        visible={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        options={companies.map(company => company.name)}
        onSelect={selectedName => {
          const selectedCompany = companies.find(
            company => company.name === selectedName,
          );
          if (selectedCompany) {
            setSelectedCompanyId(selectedCompany.id);
            setCompanyName(selectedCompany.name);
          }
        }}
        title="Select Company"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    width: 24,
    height: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  notificationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  smallLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallLogoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  companyBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#57B915',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#666',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 3,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkmark: {
    fontSize: 14,
    color: '#333',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mediaContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaPreview: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  mediaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mediaFileName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  mediaFileSize: {
    fontSize: 12,
    color: '#999',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#57B915',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  cancelButtonText: {
    color: '#FF0000',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  // Styles for company suggestions dropdown
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  inputWithIconStyle: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'transparent',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666',
    paddingHorizontal: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50, // Adjust based on input height
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: '35%',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  companyLogoText: {
    fontSize: 16,
  },
  suggestionText: {
    fontSize: 14,
    color: '#000',
  },
  suggestionTextBold: {
    fontSize: 14,
    color: '#0a66c2',
    fontWeight: '600',
  },
  // Styles for multiple media upload
  multipleMediaContainer: {
    flexDirection: 'column',
    gap: 10,
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
  removeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  uploadText: {
    fontSize: 14,
    color: '#000000',
  },
  maxLimitText: {
    fontSize: 12,
    color: '#66666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default VerificationConfirmation;
