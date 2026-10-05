import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Dimensions,
  PanResponder,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import SuccessModal from './SuccessModal';
import AddHobbyModal from './AddHobbyModal';
import {
  addPosition,
  getCompanies,
  addAchievement,
  updatePosition,
  updateAchievement,
  createEducation,
  createEducationAchievement,
  editEducationWithId,
  getSchoolList,
  editEducationAchievementWithId,
  createSkill,
  editSkill,
  fetchHobbiesList,
  createHobby,
  editHobby,
  createAspiration,
  editAspiration,
  addSectionAchievement,
  updateSectionAchievement,
} from '../../api/service';
import { useNavigation } from '@react-navigation/native';
import downArrow from '../../assets/icons/down.png';

const { width, height } = Dimensions.get('window');

type FormMode = 'add' | 'edit';
type FormType =
  | 'position'
  | 'achievement'
  | 'hobby'
  | 'skills'
  | 'education'
  | 'aspiration';
type AchievementType =
  | 'career'
  | 'position'
  | 'education'
  | 'hobby'
  | 'skill'
  | 'aspiration';

interface DateField {
  month: string;
  year: string;
}

interface School {
  id: number;
  name: string;
  type: string;
  logo: string;
  isVerified: boolean;
}

interface Hobby {
  id: number;
  name: string;
  image: string;
}

interface PositionData {
  title: string;
  employmentType: string;
  companyName: string;
  isCurrentlyWorking: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrentPosition: boolean;
  location: string;
  locationType: string;
  description: string;
  companyId?: number;
}

interface AchievementData {
  title: string;
  school?: string;
  schoolId?: number;
  achievedAtCurrentCompany?: boolean;
  companyName?: string;
  date: DateField;
  startDate?: DateField; // Added for education achievements
  endDate: DateField;
  description: string;
  isCurrentlyActive?: boolean;
}

interface HobbyData {
  hobbyImage: null;
  hobby: string;
  title: string;
  skillLevel: string;
  startDate: DateField;
  endDate: DateField;
  isActive: boolean;
  location: string;
  description: string;
}

interface SkillsData {
  skillName: string;
  skillLevel: string;
  title: string;

  startDate: DateField;
  endDate: DateField;
  isActive: boolean;
  description: string;
}

interface EducationData {
  school: string;
  schoolId?: number;
  degree: string;
  fieldOfStudy: string;
  grade: string;
  startDate: DateField;
  endDate: DateField;
  description: string;
  isCurrentlyStudying: boolean;
}

interface AspirationData {
  goal: string;
  whyItMatters: string;
  targetDate: DateField;
  media?: any;
}

type FormData =
  | PositionData
  | AchievementData
  | HobbyData
  | SkillsData
  | EducationData
  | AspirationData;

interface UniversalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: FormMode;
  type: FormType;
  achievementType?: AchievementType;
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  refreshTimeline?: () => void;
  onAddSchool?: () => void;
}

const UniversalFormModal: React.FC<UniversalFormModalProps> = ({
  isOpen,
  onClose,
  mode = 'add',
  type,
  achievementType = 'career',
  initialData = {},
  onSubmit,
  refreshTimeline,
  onAddSchool,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Asset[]>([]);
  const [existingMedia, setExistingMedia] = useState<string[]>([]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<FormData>({} as FormData);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dropdown states
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSkillLevelDropdown, setShowSkillLevelDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStartMonthDropdown, setShowStartMonthDropdown] = useState(false);
  const [showStartYearDropdown, setShowStartYearDropdown] = useState(false);
  const [showEndMonthDropdown, setShowEndMonthDropdown] = useState(false);
  const [showEndYearDropdown, setShowEndYearDropdown] = useState(false);
  const [showTargetMonthDropdown, setShowTargetMonthDropdown] = useState(false);
  const [showTargetYearDropdown, setShowTargetYearDropdown] = useState(false);
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [dropdownCallback, setDropdownCallback] = useState<
    (val: string) => void
  >(() => {});
  const [dropdownTitle, setDropdownTitle] = useState('');

  const navigation = useNavigation();

  const employmentTypes = [
    'Part-time',
    'Contract',
    'Freelance',
    'Internship',
    'Self-employed',
    'Full-time',
  ];
  const locationTypes = ['On-site', 'Remote', 'Hybrid'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'Pass', 'Fail'];
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
  const years = [
    // '2035',
    // '2034',
    // '2033',
    // '2032',
    // '2031',
    // '2030',
    // '2029',
    '2028',
    '2027',
    '2026',
    '2025',
    '2024',
    '2023',
    '2022',
    '2021',
    '2020',
    '2019',
    '2018',
    '2017',
    '2016',
    '2015',
    '2014',
    '2013',
    '2012',
    '2011',
    '2010',
    '2009',
    '2008',
    '2007',
    '2006',
    '2004',
    '2003',
    '2002',
    '2001',
    '2000',
    '1999',
    '1998',
    '1997',
    '1996',
    '1995',
    '1994',
    '1993',
    '1992',
    '1991',
    '1990',
    '1989',
    '1988',
    '1987',
    '1986',
    '1985',
    '1984',
    '1983',
    '1982',
    '1981',
    '1980',
    '1979',
    '1978',
    '1977',
    '1976',
    '1975',
    '1974',
    '1973',
    '1972',
    '1971',
    '1970',
  ];

  // State for company suggestions
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [schoolSuggestions, setSchoolSuggestions] = useState<School[]>([]);
  const [hobbiesList, setHobbiesList] = useState<Hobby[]>([]);
  const [hobbyPagination, setHobbyPagination] = useState({
    page: 1,
    hasNextPage: false,
    loadingMore: false,
  });
  const [schoolPagination, setSchoolPagination] = useState({
    page: 1,
    hasNext: false,
    loadingMore: false,
  });
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [showAddSchoolButton, setShowAddSchoolButton] = useState(false);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);
  const [loadingHobbies, setLoadingHobbies] = useState<boolean>(false);
  const [showHobbySuggestions, setShowHobbySuggestions] = useState(false);
  const [isAddHobbyModalOpen, setIsAddHobbyModalOpen] =
    useState<boolean>(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [schoolModalVisible, setSchoolModalVisible] = useState(false);
  const [hobbyModalVisible, setHobbyModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [currentModalType, setCurrentModalType] = useState<
    'company' | 'school' | 'hobby'
  >('company');

  const prevIsOpen = useRef(false);

  const hobbies = ['Please select', ...hobbiesList.map(h => h.name)];

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

  // Fetch schools from API
  const fetchSchools = useCallback(async (page: number = 1) => {
    try {
      if (page === 1) {
        // For the first page, just fetch and set schools
        const response = await getSchoolList();
        if (response.data.success) {
          setSchoolSuggestions(response.data.data.schools);
          setSchoolPagination({
            page: 1,
            hasNext: response.data.data.pagination?.hasNext || false,
            loadingMore: false,
          });
        }
      } else {
        // For additional pages, we need to call the API with pagination parameters
        // Since the current API doesn't support pagination parameters, we'll just call the same endpoint
        // In a real implementation, you'd call getSchoolList(page) or similar
        const response = await getSchoolList();
        if (response.data.success) {
          setSchoolSuggestions(prev => [
            ...prev,
            ...response.data.data.schools,
          ]);
          setSchoolPagination(prev => ({
            page: prev.page + 1,
            hasNext: response.data.data.pagination?.hasNext || false,
            loadingMore: false,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  }, []);

  // Function to load more schools
  const loadMoreSchools = useCallback(() => {
    if (schoolPagination.hasNext && !schoolPagination.loadingMore) {
      fetchSchools(schoolPagination.page + 1);
    }
  }, [schoolPagination, fetchSchools]);

  // Fetch hobbies from API
  const fetchHobbies = useCallback(async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoadingHobbies(true);
      } else {
        setHobbyPagination(prev => ({ ...prev, loadingMore: true }));
      }

      const response = await fetchHobbiesList();
      if (response.data.success) {
        if (page === 1) {
          // For the first page, set the hobbies list
          setHobbiesList(response.data.data.hobbies);
          setHobbyPagination({
            page: 1,
            hasNextPage: response.data.data.hasNextPage || false,
            loadingMore: false,
          });
        } else {
          // For additional pages, append to the existing list
          setHobbiesList(prev => [...prev, ...response.data.data.hobbies]);
          setHobbyPagination(prev => ({
            page: prev.page + 1,
            hasNextPage: response.data.data.hasNextPage || false,
            loadingMore: false,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching hobbies:', error);
    } finally {
      if (page === 1) {
        setLoadingHobbies(false);
      } else {
        setHobbyPagination(prev => ({ ...prev, loadingMore: false }));
      }
    }
  }, []);

  // Function to load more hobbies
  const loadMoreHobbies = useCallback(() => {
    if (hobbyPagination.hasNextPage && !hobbyPagination.loadingMore) {
      fetchHobbies(hobbyPagination.page + 1);
    }
  }, [hobbyPagination, fetchHobbies]);

  console.log(companySuggestions, 'company suggestions');
  console.log(initialData, 'initial data');

  // Initialize form data and fetch companies/schools
  useEffect(() => {
    if (!isOpen) return;

    const initializeFormData = () => {
      if (
        mode === 'edit' &&
        initialData &&
        Object.keys(initialData).length > 0
      ) {
        console.log('Initializing form with edit data:', initialData);
        // For edit mode, we need to ensure the isCurrentlyActive field is properly set based on the API data
        let updatedInitialData = { ...initialData };
        if (type === 'achievement') {
          // If the achievement data from API has a field indicating it's currently active, use that
          const achievementInitialData =
            initialData as Partial<AchievementData>;
          if (achievementInitialData.isCurrentlyActive !== undefined) {
            (updatedInitialData as Partial<AchievementData>).isCurrentlyActive =
              achievementInitialData.isCurrentlyActive;
          } else {
            // Check for other possible fields that might indicate current activity
            // For example, if end date is empty or in the future, it might be currently active
            const endDate = achievementInitialData.endDate;
            (updatedInitialData as Partial<AchievementData>).isCurrentlyActive =
              !endDate ||
              (endDate?.month === '' && endDate?.year === '') ||
              endDate?.month === 'Month' ||
              endDate?.year === 'Year';
          }
        } else if (type === 'position') {
          const positionInitialData = initialData as Partial<PositionData>;
          if (positionInitialData.isCurrentlyWorking !== undefined) {
            (updatedInitialData as Partial<PositionData>).isCurrentlyWorking =
              positionInitialData.isCurrentlyWorking;
          } else {
            // Check for other possible fields that might indicate current activity
            (updatedInitialData as Partial<PositionData>).isCurrentlyWorking =
              !positionInitialData.endMonth ||
              (positionInitialData.endMonth === 'Month' &&
                positionInitialData.endYear === 'Year');
          }
        } else if (type === 'education') {
          const educationInitialData = initialData as Partial<EducationData>;
          if (educationInitialData.isCurrentlyStudying !== undefined) {
            (updatedInitialData as Partial<EducationData>).isCurrentlyStudying =
              educationInitialData.isCurrentlyStudying;
          } else {
            // Check for other possible fields that might indicate current activity
            (updatedInitialData as Partial<EducationData>).isCurrentlyStudying =
              !educationInitialData.endDate ||
              (educationInitialData.endDate?.month === '' &&
                educationInitialData.endDate?.year === '') ||
              educationInitialData.endDate?.month === 'Month' ||
              educationInitialData.endDate?.year === 'Year';
          }
        } else if (type === 'hobby') {
          const hobbyInitialData = initialData as Partial<HobbyData>;
          if (hobbyInitialData.isActive !== undefined) {
            (updatedInitialData as Partial<HobbyData>).isActive =
              hobbyInitialData.isActive;
          } else {
            // Check for other possible fields that might indicate current activity
            (updatedInitialData as Partial<HobbyData>).isActive =
              !hobbyInitialData.endDate ||
              (hobbyInitialData.endDate?.month === '' &&
                hobbyInitialData.endDate?.year === '') ||
              hobbyInitialData.endDate?.month === 'Month' ||
              hobbyInitialData.endDate?.year === 'Year';
          }
        } else if (type === 'skills') {
          const skillsInitialData = initialData as Partial<SkillsData>;
          if (skillsInitialData.isActive !== undefined) {
            (updatedInitialData as Partial<SkillsData>).isActive =
              skillsInitialData.isActive;
          } else {
            // Check for other possible fields that might indicate current activity
            (updatedInitialData as Partial<SkillsData>).isActive =
              !skillsInitialData.endDate ||
              (skillsInitialData.endDate?.month === '' &&
                skillsInitialData.endDate?.year === '') ||
              skillsInitialData.endDate?.month === 'Month' ||
              skillsInitialData.endDate?.year === 'Year';
          }
        }
        setFormData(updatedInitialData);

        const existingMediaData = (initialData as any).existingMedia;
        const mediaUrl = (initialData as any).mediaUrl;

        if (Array.isArray(existingMediaData) && existingMediaData.length > 0) {
          setExistingMedia(existingMediaData);
          setExistingMediaUrl(null);
        } else if (mediaUrl && mediaUrl !== null && mediaUrl.trim() !== '') {
          if (mediaUrl.includes(',')) {
            const mediaUrls = mediaUrl
              .split(',')
              .map((url: string) => url.trim())
              .filter((url: string) => url !== '');
            setExistingMedia(mediaUrls);
            setExistingMediaUrl(null);
          } else {
            setExistingMedia([mediaUrl]);
          }
        } else {
          setExistingMedia([]);
        }
      } else {
        const getDefaults = () => {
          const defaults: Record<string, Partial<FormData>> = {
            position: {
              title: '',
              employmentType: 'Please select',
              companyName: '',
              isCurrentlyWorking: false,
              startMonth: 'Month',
              startYear: 'Year',
              endMonth: 'Month',
              endYear: 'Year',
              isCurrentPosition: false,
              location: '',
              locationType: 'Please select',
              description: '',
            } as PositionData,
            achievement: {
              title: '',
              school: '',
              achievedAtCurrentCompany: false,
              companyName: '',
              date: { month: 'Month', year: 'Year' },
              endDate: { month: 'Month', year: 'Year' },
              description: '',
              isCurrentlyActive: false, // Default to true for new achievements
            } as AchievementData,
            education: {
              school: '',
              degree: '',
              fieldOfStudy: '',
              grade: '',
              startDate: { month: 'Month', year: 'Year' },
              endDate: { month: 'Month', year: 'Year' },
              description: '',
              isCurrentlyStudying: false,
            } as EducationData,
            hobby: {
              hobby: '',
              title: '',
              skillLevel: 'Please select',
              startDate: { month: 'Month', year: 'Year' },
              endDate: { month: 'Month', year: 'Year' },
              isActive: false,
              location: '',
              description: '',
            } as HobbyData,
            skills: {
              skillName: '',
              skillLevel: 'Please select',
              title: '',
              startDate: { month: 'Month', year: 'Year' },
              endDate: { month: 'Month', year: 'Year' },
              isActive: false,
              description: '',
            } as SkillsData,
            aspiration: {
              goal: '',
              whyItMatters: '',
              targetDate: { month: 'Month', year: 'Year' },
            } as AspirationData,
          };
          return defaults[type] || {};
        };

        const defaultData = getDefaults();
        const mergedData = { ...defaultData, ...initialData };
        console.log('Setting default form data:', mergedData);
        setFormData(mergedData);
        setExistingMedia([]);
      }
    };

    initializeFormData();
    console.log('achievement Type:', achievementType);

    if (
      type === 'position' ||
      (type === 'achievement' && achievementType === 'career')
    ) {
      fetchCompanies();
    }

    if (
      type === 'education' ||
      (type === 'achievement' && achievementType === 'education')
    ) {
      fetchSchools();
    }

    if (type === 'hobby') {
      fetchHobbies();
    }

    prevIsOpen.current = isOpen;
  }, [isOpen]);

  const handleInputChange = useCallback(
    (field: string, value: any): void => {
      console.log(`Input change: ${field} = ${value}`);

      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof FormData] as any),
            [child]: value,
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: value,
        }));
      }

      // Check if the field is school and update showAddSchoolButton state
      if (
        (field === 'school' || field === 'educationData.school') &&
        type === 'education' &&
        value
      ) {
        const schoolExists = schoolSuggestions.some(
          school => school.name.toLowerCase() === value.toLowerCase(),
        );
        setShowAddSchoolButton(!schoolExists && value.length > 0);
      } else if (
        (field === 'school' || field === 'achievementData.school') &&
        type === 'achievement' &&
        achievementType === 'education' &&
        value
      ) {
        const schoolExists = schoolSuggestions.some(
          school => school.name.toLowerCase() === value.toLowerCase(),
        );
        setShowAddSchoolButton(!schoolExists && value.length > 0);
      }
    },
    [schoolSuggestions, type, achievementType],
  );

  // Add this function to handle media removal
  const handleRemoveMedia = useCallback((): void => {
    setSelectedFiles([]);
    setExistingMediaUrl(null);
    handleInputChange('mediaUrl', null);
    handleInputChange('media', null);
  }, [handleInputChange]);

  const handleCheckboxChange = useCallback((field: string): void => {
    setFormData(prev => {
      const currentValue = (prev as any)[field];
      console.log(`Toggling ${field} from ${currentValue} to ${!currentValue}`);
      return {
        ...prev,
        [field]: !currentValue,
      };
    });
  }, []);

  const handleFileUpload = useCallback(async (): Promise<void> => {
    // Check if we already have 10 or more files
    if (selectedFiles.length >= 10) {
      Toast.show({
        type: 'error',
        text1: 'Maximum Limit Reached',
        text2: 'You can only upload up to 10 images.',
      });
      return;
    }

    try {
      // Calculate how many more images we can add
      const remainingSlots = 10 - selectedFiles.length;
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: false,
        selectionLimit: remainingSlots, // Allow up to remaining slots
      });

      if (result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
        }));

        setSelectedFiles(prev => [...prev, ...newFiles]);
        setExistingMediaUrl(null); // Clear existing URL when new file is selected
        handleInputChange('media', [...selectedFiles, ...newFiles]); // Update form data with all files
        handleInputChange('mediaUrl', null); // Clear mediaUrl when new file is selected
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image. Please try again.',
      });
    }
  }, [handleInputChange, selectedFiles]);

  console.log(existingMedia, 'existing media 1233');

  const handleSubmit = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      let responseData: any = null;
      if (type === 'position') {
        const positionData = formData as Partial<PositionData>;

        const startMonthIndex = months.indexOf(
          positionData.startMonth || 'Month',
        );
        const startMonthNumber = startMonthIndex > 0 ? startMonthIndex + 1 : 1;
        const startYearNumber =
          parseInt(positionData.startYear || '2025') || 2025;

        let endMonthNumber, endYearNumber;
        // Only include end date if not currently working
        if (
          !positionData.isCurrentlyWorking &&
          positionData.endMonth &&
          positionData.endYear &&
          positionData.endMonth !== 'Month' &&
          positionData.endYear !== 'Year'
        ) {
          const endMonthIndex = months.indexOf(positionData.endMonth);
          endMonthNumber = endMonthIndex > 0 ? endMonthIndex + 1 : 12;
          endYearNumber = parseInt(positionData.endYear) || 2025;
        }

        let companyId = null;
        let selectedCompany = null;
        if (positionData.companyName) {
          selectedCompany = companySuggestions.find(
            c => c.name === positionData.companyName,
          );
          if (selectedCompany) {
            companyId = selectedCompany.id;
          }
        }

        const formDataToSend = new FormData();
        formDataToSend.append('title', positionData.title || '');
        formDataToSend.append(
          'employmentType',
          positionData.employmentType || '',
        );

        if (companyId) {
          formDataToSend.append('companyId', companyId);
        } else {
          formDataToSend.append('companyName', positionData.companyName || '');
        }

        formDataToSend.append(
          'isCurrentlyWorking',
          positionData.isCurrentlyWorking || false,
        );
        formDataToSend.append('startMonth', startMonthNumber);
        formDataToSend.append('startYear', startYearNumber);

        // Only append end month/year if currently working is false and dates are provided
        if (endMonthNumber !== undefined && endYearNumber !== undefined) {
          formDataToSend.append('endMonth', endMonthNumber);
          formDataToSend.append('endYear', endYearNumber);
        }

        formDataToSend.append('location', positionData.location || '');
        formDataToSend.append('locationType', positionData.locationType || '');
        formDataToSend.append('description', positionData.description || '');

        // Handle media uploads separately for edit mode
        if (mode === 'edit') {
          // Send existing media URLs as an array in existingMedia field
          if (existingMedia.length > 0) {
            existingMedia.forEach((url, index) => {
              formDataToSend.append('existingMedia[]', url);
            });
          }

          // Send new media files in media field
          if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
              formDataToSend.append('media', {
                uri: file.uri || '',
                type: file.type || 'image/jpeg',
                name: file.fileName || `image_${index}.jpg`,
              } as any);
            });
          }
        } else {
          // For add mode, just send new media files
          if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
              formDataToSend.append('media', {
                uri: file.uri || '',
                type: file.type || 'image/jpeg',
                name: file.fileName || `image_${index}.jpg`,
              } as any);
            });
          }
        }

        if (mode === 'edit') {
          console.log(positionData, 'position data');
          // Handle edit mode - update existing position
          const positionId = (initialData as any)?.id;
          if (positionId) {
            const response = await updatePosition(positionId, formDataToSend);
            responseData = response.data.data;
            console.log(responseData, 'Position update response');

            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Position updated successfully!',
            });

            // Set submitted data for success modal
            const updatedFormData: PositionData = {
              title: positionData.title || '',
              employmentType: positionData.employmentType || '',
              companyName: positionData.companyName || '',
              isCurrentlyWorking: positionData.isCurrentlyWorking || false,
              startMonth: positionData.startMonth || 'Month',
              startYear: positionData.startYear || 'Year',
              endMonth: positionData.isCurrentlyWorking
                ? ''
                : positionData.endMonth || 'Month',
              endYear: positionData.isCurrentlyWorking
                ? ''
                : positionData.endYear || 'Year',
              isCurrentPosition: positionData.isCurrentPosition || false,
              location: positionData.location || '',
              locationType: positionData.locationType || '',
              description: positionData.description || '',
              companyId: companyId || undefined,
            };

            console.log(
              'Setting submitted data for edit mode:',
              updatedFormData,
            );
            setSubmittedData(updatedFormData);
            setIsSuccessModalOpen(true);

            onSubmit({
              ...formData,
              id: positionId,
              ...responseData.position,
            } as FormData);

            // Clear media fields after successful submission
            setSelectedFiles([]);
            setExistingMedia([]);
            setExistingMediaUrl(null);
            return;
          }
        } else {
          // Handle add mode - create new position
          const response = await addPosition(formDataToSend);
          responseData = response.data.data;
          console.log(responseData, 'Position add response');

          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Position added successfully!',
          });

          // Set submitted data for success modal
          const updatedFormData: PositionData = {
            title: positionData.title || '',
            employmentType: positionData.employmentType || '',
            companyName: positionData.companyName || '',
            isCurrentlyWorking: positionData.isCurrentlyWorking || false,
            startMonth: positionData.startMonth || 'Month',
            startYear: positionData.startYear || 'Year',
            endMonth: positionData.isCurrentlyWorking
              ? ''
              : positionData.endMonth || 'Month',
            endYear: positionData.isCurrentlyWorking
              ? ''
              : positionData.endYear || 'Year',
            isCurrentPosition: positionData.isCurrentPosition || false,
            location: positionData.location || '',
            locationType: positionData.locationType || '',
            description: positionData.description || '',
            companyId: companyId || undefined,
          };

          console.log('Setting submitted data for add mode:', updatedFormData);
          setSubmittedData(updatedFormData);
          setIsSuccessModalOpen(true);

          onSubmit({
            ...formData,
            id: responseData.position.id,
            ...responseData.position,
          } as FormData);

          // Clear media fields after successful submission
          setSelectedFiles([]);
          setExistingMedia([]);
          setExistingMediaUrl(null);

          // Don't call onClose here - let the success modal handle it
          return;
        }

        // if (refreshTimeline) {
        //   refreshTimeline();
        // }
      } else if (type === 'achievement') {
        const achievementData = formData as Partial<AchievementData>;
        console.log(
          achievementData,
          'achievementData',
          achievementType,
          'achievementType',
        );

        // For education achievements, use startDate/endDate, for others use date/endDate
        const startMonthValue =
          achievementType === 'education'
            ? achievementData.startDate?.month
            : achievementData.date?.month;
        const startYearValue =
          achievementType === 'education'
            ? achievementData.startDate?.year
            : achievementData.date?.year;

        const startMonthIndex = months.indexOf(startMonthValue || 'Month');
        const startMonthNumber = startMonthIndex > 0 ? startMonthIndex + 1 : 1;
        const startYearNumber = parseInt(startYearValue || '2025') || 2025;

        let endMonthNumber, endYearNumber;
        // Only include end date if not currently active (for career achievements) or not currently studying (for education achievements)
        if (
          !(
            achievementType === 'career' && achievementData.isCurrentlyActive
          ) &&
          achievementData.endDate?.month &&
          achievementData.endDate?.year &&
          achievementData.endDate?.month !== 'Month' &&
          achievementData.endDate?.year !== 'Year'
        ) {
          const endMonthIndex = months.indexOf(achievementData.endDate?.month);
          endMonthNumber = endMonthIndex > 0 ? endMonthIndex + 1 : 12;
          endYearNumber = parseInt(achievementData.endDate?.year) || 2025;
        }

        let companyId = null;
        if (achievementData.companyName) {
          const company = companySuggestions.find(
            c => c.name === achievementData.companyName,
          );
          if (company) {
            companyId = company.id;
          }
        }

        const formDataToSend = new FormData();
        formDataToSend.append('title', achievementData.title || '');

        const isSectionAchievementUpdate =
          ['hobby', 'skill', 'aspiration'].includes(achievementType) &&
          mode === 'edit';

        if (!isSectionAchievementUpdate) {
          if (companyId) {
            formDataToSend.append('companyId', companyId);
          } else {
            formDataToSend.append(
              'companyName',
              achievementData.companyName || '',
            );
          }
        }

        if (achievementType === 'education' && achievementData.schoolId) {
          formDataToSend.append('schoolId', String(achievementData.schoolId));
        }

        // FIX: Properly handle dates based on achievement type
        if (achievementType === 'education') {
          // For education, use startDate
          formDataToSend.append('startMonth', startMonthNumber);
          formDataToSend.append('startYear', startYearNumber);
        } else {
          // For career achievements, use date
          formDataToSend.append('startMonth', startMonthNumber);
          formDataToSend.append('startYear', startYearNumber);
        }

        // Only append end month/year if currently active is false and dates are provided
        if (endMonthNumber !== undefined && endYearNumber !== undefined) {
          formDataToSend.append('endMonth', endMonthNumber);
          formDataToSend.append('endYear', endYearNumber);
        }

        // Add isCurrentlyActive (default true if not present)
        formDataToSend.append(
          'isCurrentlyActive',
          achievementData.isCurrentlyActive,
        );

        // Add achievementType if it's education, hobby, skill, or aspiration
        if (achievementType === 'education') {
          formDataToSend.append('achievementType', 'activity');
        } else if (
          ['hobby', 'skill', 'aspiration'].includes(achievementType) &&
          mode !== 'edit'
        ) {
          // Send specific type for section achievements as requested only when creating
          formDataToSend.append('type', achievementType);
        }

        formDataToSend.append('description', achievementData.description || '');

        // Handle media uploads separately for edit mode
        if (mode === 'edit') {
          const achievementId = (initialData as any)?.id;
          if (achievementId) {
            // Send existing media URLs as an array in existingMedia field
            if (existingMedia.length > 0) {
              existingMedia.forEach((url, index) => {
                formDataToSend.append('existingMedia[]', url);
              });
            }

            // Send new media files in media field
            if (selectedFiles.length > 0) {
              selectedFiles.forEach((file, index) => {
                formDataToSend.append('media', {
                  uri: file.uri || '',
                  type: file.type || 'image/jpeg',
                  name: file.fileName || `image_${index}.jpg`,
                } as any);
              });
            }

            let response;
            if (achievementType === 'education') {
              response = await editEducationAchievementWithId(
                achievementId,
                formDataToSend,
              );
            } else if (
              ['skill', 'hobby', 'aspiration'].includes(achievementType)
            ) {
              response = await updateSectionAchievement(
                achievementId,
                formDataToSend,
              );
            } else {
              response = await updateAchievement(achievementId, formDataToSend);
            }

            responseData = response.data.data;

            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Achievement updated successfully!',
            });

            // FIX: Update the submitted data properly for success modal
            const updatedFormData = {
              ...formData,
              id: achievementId,
              title: achievementData.title || '',
              school: achievementData.school || '',
              companyName: achievementData.companyName || '',
              date:
                achievementType === 'education'
                  ? {
                      month: achievementData.startDate?.month || 'Month',
                      year: achievementData.startDate?.year || 'Year',
                    }
                  : achievementData.date || { month: 'Month', year: 'Year' },
              startDate:
                achievementType === 'education'
                  ? achievementData.startDate || {
                      month: 'Month',
                      year: 'Year',
                    }
                  : undefined,
              endDate:
                achievementType === 'career' &&
                achievementData.isCurrentlyActive
                  ? { month: '', year: '' }
                  : achievementData.endDate || {
                      month: 'Month',
                      year: 'Year',
                    },
              description: achievementData.description || '',
              isCurrentlyActive: achievementData.isCurrentlyActive || true,
            };

            setSubmittedData(updatedFormData as FormData);
            setIsSuccessModalOpen(true);

            onSubmit({
              ...formData,
              id: achievementId,
              ...responseData,
            } as FormData);

            // Clear media fields after successful submission
            setSelectedFiles([]);
            setExistingMedia([]);
            setExistingMediaUrl(null);
            return;
          }
        } else {
          // For add mode, just send new media files
          if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
              formDataToSend.append('media', {
                uri: file.uri || '',
                type: file.type || 'image/jpeg',
                name: file.fileName || `image_${index}.jpg`,
              } as any);
            });
          }

          if (achievementType === 'education') {
            const response = await createEducationAchievement(formDataToSend);
            responseData = response.data.data;
          } else if (
            ['hobby', 'skill', 'aspiration'].includes(achievementType)
          ) {
            const referenceId = (initialData as any)?.referenceId;
            console.log(
              `Calling addSectionAchievement for ${achievementType}`,
              referenceId,
            );

            // Ensure endMonth and endYear are sent as empty strings if currently active
            if (achievementData.isCurrentlyActive) {
              formDataToSend.append('endMonth', '');
              formDataToSend.append('endYear', '');
            }

            const response = await addSectionAchievement(
              achievementType,
              referenceId,
              formDataToSend,
            );
            responseData = response.data.data;
          } else {
            const response = await addAchievement(formDataToSend);
            responseData = response.data.data;
          }

          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: `Achievement added successfully!`,
          });

          // Set the submitted data for success modal
          const updatedFormData = {
            ...formData,
            title: achievementData.title || '',
            school: achievementData.school || '',
            companyName: achievementData.companyName || '',
            date: achievementData.date || { month: 'Month', year: 'Year' },
            endDate:
              achievementType === 'career' && achievementData.isCurrentlyActive
                ? { month: '', year: '' }
                : achievementData.endDate || {
                    month: 'Month',
                    year: 'Year',
                  },
            description: achievementData.description || '',
            isCurrentlyActive: achievementData.isCurrentlyActive || true,
          };

          setSubmittedData(updatedFormData as FormData);
          setIsSuccessModalOpen(true);

          onSubmit({
            ...formData,
            ...responseData,
          } as FormData);

          // Clear media fields after successful submission
          setSelectedFiles([]);
          setExistingMedia([]);
          setExistingMediaUrl(null);
          return;
        }
      } else if (type === 'education') {
        const educationData = formData as Partial<EducationData>;
        const formDataToSend = new FormData();

        // Basic fields
        formDataToSend.append('school', educationData.school || '');
        if (educationData.schoolId) {
          formDataToSend.append('schoolId', educationData.schoolId);
        }
        formDataToSend.append('degree', educationData.degree || '');
        formDataToSend.append('fieldOfStudy', educationData.fieldOfStudy || '');
        formDataToSend.append('grade', educationData.grade || '');
        formDataToSend.append(
          'isCurrentlyStudying',
          educationData.isCurrentlyStudying || false,
        );

        // Date handling
        const startMonthIndex = months.indexOf(
          educationData.startDate?.month || 'Month',
        );
        const startMonthNumber = startMonthIndex > 0 ? startMonthIndex + 1 : 1;
        const startYearNumber =
          parseInt(educationData.startDate?.year || '2025') || 2025;

        formDataToSend.append('startMonth', startMonthNumber);
        formDataToSend.append('startYear', startYearNumber);

        if (!educationData.isCurrentlyStudying) {
          const endMonthIndex = months.indexOf(
            educationData.endDate?.month || 'Month',
          );
          const endMonthNumber = endMonthIndex > 0 ? endMonthIndex + 1 : 12;
          const endYearNumber =
            parseInt(educationData.endDate?.year || '2025') || 2025;

          formDataToSend.append('endMonth', endMonthNumber);
          formDataToSend.append('endYear', endYearNumber);
        }

        formDataToSend.append('description', educationData.description || '');

        // Handle media
        if (mode === 'edit') {
          // Send existing media URLs as an array in existingMedia field
          if (existingMedia.length > 0) {
            existingMedia.forEach((url, index) => {
              formDataToSend.append('existingMedia[]', url);
            });
          }

          // Send new media files in media field
          if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
              formDataToSend.append('media', {
                uri: file.uri || '',
                type: file.type || 'image/jpeg',
                name: file.fileName || `image_${index}.jpg`,
              } as any);
            });
          }
        } else {
          // For add mode, just send new media files
          if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
              formDataToSend.append('media', {
                uri: file.uri || '',
                type: file.type || 'image/jpeg',
                name: file.fileName || `image_${index}.jpg`,
              } as any);
            });
          }
        }

        // Debug logging for FormData
        console.log('FormData parts:');
        // @ts-ignore
        if (formDataToSend._parts) {
          // @ts-ignore
          formDataToSend._parts.forEach(part => {
            console.log(`${part[0]}:`, part[1]);
          });
        }

        if (mode === 'edit') {
          const educationId = (initialData as any)?.id;
          if (educationId) {
            const response = await editEducationWithId(
              educationId,
              formDataToSend,
            );
            responseData = response.data.data;
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Education updated successfully!',
            });

            // Set the submitted data for success modal
            const updatedFormData = {
              ...formData,
              id: educationId,
              school: educationData.school || '',
              degree: educationData.degree || '',
              fieldOfStudy: educationData.fieldOfStudy || '',
              grade: educationData.grade || '',
              startDate: educationData.startDate || {
                month: 'Month',
                year: 'Year',
              },
              endDate: educationData.endDate || {
                month: 'Month',
                year: 'Year',
              },
              isCurrentlyStudying: educationData.isCurrentlyStudying || false,
              description: educationData.description || '',
            };

            setSubmittedData(updatedFormData as FormData);
            setIsSuccessModalOpen(true); // This shows the SuccessModal

            onSubmit({
              ...formData,
              id: educationId,
              ...responseData,
            } as FormData);

            // Clear media fields after successful submission
            setSelectedFiles([]);
            setExistingMedia([]);
            setExistingMediaUrl(null);
            return;
          }
        } else {
          const response = await createEducation(formDataToSend);
          responseData = response.data.data;
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Education added successfully!',
          });

          // Set the submitted data for success modal
          const updatedFormData = {
            ...formData,
            school: educationData.school || '',
            degree: educationData.degree || '',
            fieldOfStudy: educationData.fieldOfStudy || '',
            grade: educationData.grade || '',
            startDate: educationData.startDate || {
              month: 'Month',
              year: 'Year',
            },
            endDate: educationData.endDate || { month: 'Month', year: 'Year' },
            isCurrentlyStudying: educationData.isCurrentlyStudying || false,
            description: educationData.description || '',
          };

          setSubmittedData(updatedFormData as FormData);
          setIsSuccessModalOpen(true); // This shows the SuccessModal

          onSubmit({
            ...formData,
            ...responseData,
          } as FormData);

          // Clear media fields after successful submission
          setSelectedFiles([]);
          setExistingMedia([]);
          setExistingMediaUrl(null);
        }

        // Only refresh timeline if not in edit mode (since edit mode handles it differently above)
        // if (mode !== 'edit' && refreshTimeline) {
        //   refreshTimeline();
        // }
      } else if (type === 'skills') {
        const skillsData = formData as Partial<SkillsData>;
        const formDataToSend = new FormData();

        formDataToSend.append('skillName', skillsData.skillName || '');
        formDataToSend.append('skillLevel', skillsData.skillLevel || '');
        formDataToSend.append('title', skillsData.title || '');

        const startMonthIndex = months.indexOf(
          skillsData.startDate?.month || 'Month',
        );
        const startMonthNumber = startMonthIndex > 0 ? startMonthIndex + 1 : 1;
        const startYearNumber =
          parseInt(skillsData.startDate?.year || '2025') || 2025;

        formDataToSend.append('startMonth', String(startMonthNumber));
        formDataToSend.append('startYear', String(startYearNumber));

        if (!skillsData.isActive) {
          const endMonthIndex = months.indexOf(
            skillsData.endDate?.month || 'Month',
          );
          const endMonthNumber = endMonthIndex > 0 ? endMonthIndex + 1 : 12;
          const endYearNumber =
            parseInt(skillsData.endDate?.year || '2025') || 2025;

          formDataToSend.append('endMonth', String(endMonthNumber));
          formDataToSend.append('endYear', String(endYearNumber));
        }

        formDataToSend.append(
          'isCurrentlyActive',
          String(skillsData.isActive || false),
        );
        formDataToSend.append('description', skillsData.description || '');

        // Handle media
        if (mode === 'edit') {
          if (existingMedia.length > 0) {
            existingMedia.forEach((url, index) => {
              formDataToSend.append('existingMedia[]', url);
            });
          } else {
            formDataToSend.append('existingMedia[]', '');
          }
        }

        if (selectedFiles.length > 0) {
          selectedFiles.forEach((file, index) => {
            formDataToSend.append('media', {
              uri: file.uri,
              type: file.type || 'image/jpeg',
              name: file.fileName || `image_${index}.jpg`,
            } as any);
          });
        }

        if (mode === 'edit') {
          const skillId = (initialData as any)?.id;
          if (skillId) {
            const response = await editSkill(skillId, formDataToSend);
            responseData = response.data.data;
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Skill updated successfully!',
            });

            onSubmit({
              ...formData,
              id: skillId,
              ...responseData, // Include API response data
            } as FormData);
            // onClose();

            // Include skill information in the submitted data for the success modal
            const updatedFormData = {
              ...formData,
              skillName: skillsData.skillName || '',
              skillLevel: skillsData.skillLevel || '',
              title: skillsData.title || '',
              startDate: skillsData.startDate || {
                month: 'Month',
                year: 'Year',
              },
              endDate: skillsData.endDate || { month: 'Month', year: 'Year' },
              isActive: skillsData.isActive || false,
              description: skillsData.description || '',
            };

            setSubmittedData(updatedFormData as FormData);
            setIsSuccessModalOpen(true);
            return;
          }
        } else {
          const response = await createSkill(formDataToSend);
          responseData = response.data.data;
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Skill added successfully!',
          });
          // Clear media fields after successful submission
          setSelectedFiles([]);
          setExistingMedia([]);
          setExistingMediaUrl(null);
        }

        onSubmit({
          ...formData,
          ...responseData, // Include API response data
        } as FormData);
        // onClose();

        // if (refreshTimeline) {
        //   refreshTimeline();
        // }

        // Include skill information in the submitted data for the success modal
        const updatedFormData = {
          ...formData,
          skillName: skillsData.skillName || '',
          skillLevel: skillsData.skillLevel || '',
          title: skillsData.title || '',
          startDate: skillsData.startDate || { month: 'Month', year: 'Year' },
          endDate: skillsData.endDate || { month: 'Month', year: 'Year' },
          isActive: skillsData.isActive || false,
          description: skillsData.description || '',
        };

        setSubmittedData(updatedFormData as FormData);
        setIsSuccessModalOpen(true);
      } else if (type === 'hobby') {
        const hobbyData = formData as Partial<HobbyData>;
        const formDataToSend = new FormData();

        // Find hobby ID
        const selectedHobby = hobbiesList.find(h => h.name === hobbyData.hobby);
        if (selectedHobby) {
          formDataToSend.append('hobbyId', String(selectedHobby.id));
        }

        formDataToSend.append('title', hobbyData.title || '');
        formDataToSend.append('skillLevel', hobbyData.skillLevel || '');
        formDataToSend.append('location', hobbyData.location || '');
        formDataToSend.append('description', hobbyData.description || '');
        formDataToSend.append(
          'isHobbyActive',
          String(hobbyData.isActive || false),
        );

        const startMonthIndex = months.indexOf(
          hobbyData.startDate?.month || 'Month',
        );
        const startMonthNumber = startMonthIndex > 0 ? startMonthIndex + 1 : 1;
        const startYearNumber =
          parseInt(hobbyData.startDate?.year || '2025') || 2025;

        formDataToSend.append('startMonth', String(startMonthNumber));
        formDataToSend.append('startYear', String(startYearNumber));

        if (!hobbyData.isActive) {
          const endMonthIndex = months.indexOf(
            hobbyData.endDate?.month || 'Month',
          );
          const endMonthNumber = endMonthIndex > 0 ? endMonthIndex + 1 : 12;
          const endYearNumber =
            parseInt(hobbyData.endDate?.year || '2025') || 2025;

          formDataToSend.append('endMonth', String(endMonthNumber));
          formDataToSend.append('endYear', String(endYearNumber));
        }

        // Handle media
        if (mode === 'edit') {
          if (existingMedia.length > 0) {
            existingMedia.forEach(url => {
              formDataToSend.append('existingMedia[]', url);
            });
          }
        }

        if (selectedFiles.length > 0) {
          selectedFiles.forEach((file, index) => {
            formDataToSend.append('media', {
              uri: file.uri,
              type: file.type || 'image/jpeg',
              name: file.fileName || `image_${index}.jpg`,
            } as any);
          });
        }

        if (mode === 'edit') {
          const hobbyId = (initialData as any)?.id;
          if (hobbyId) {
            const response = await editHobby(hobbyId, formDataToSend);
            responseData = response.data.data;
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Hobby updated successfully!',
            });

            onSubmit({
              ...formData,
              id: hobbyId,
              ...responseData, // Include API response data
            } as FormData);
            // onClose();

            // Include hobby information in the submitted data for the success modal
            const updatedFormData = {
              ...formData,
              id: hobbyId,
              // Ensure all fields are included
              hobby: hobbyData.hobby || '',
              title: hobbyData.title || '',
              skillLevel: hobbyData.skillLevel || '',
              startDate: hobbyData.startDate || {
                month: 'Month',
                year: 'Year',
              },
              endDate: hobbyData.endDate || { month: 'Month', year: 'Year' },
              isActive: hobbyData.isActive || false,
              location: hobbyData.location || '',
              description: hobbyData.description || '',
              // Include media info
              media: selectedFiles.length > 0 ? selectedFiles : existingMedia,
            };

            setSubmittedData(updatedFormData as FormData);
            setIsSuccessModalOpen(true);
            return;
          }
        } else {
          const response = await createHobby(formDataToSend);
          responseData = response.data.data;
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Hobby added successfully!',
          });
        }

        onSubmit({
          ...formData,
          ...responseData, // Include API response data
        } as FormData);
        // onClose();

        // if (refreshTimeline) {
        //   refreshTimeline();
        // }

        // Include hobby information in the submitted data for the success modal
        const updatedFormData = {
          ...formData,
          hobby: hobbyData.hobby || '',
          title: hobbyData.title || '',
          skillLevel: hobbyData.skillLevel || '',
          startDate: hobbyData.startDate || { month: 'Month', year: 'Year' },
          endDate: hobbyData.endDate || { month: 'Month', year: 'Year' },
          isActive: hobbyData.isActive || false,
          location: hobbyData.location || '',
          description: hobbyData.description || '',
        };

        setSubmittedData(updatedFormData as FormData);
        setIsSuccessModalOpen(true);
      } else if (type === 'aspiration') {
        const aspirationData = formData as Partial<AspirationData>;
        const formDataToSend = new FormData();

        formDataToSend.append('goal', aspirationData.goal || '');
        formDataToSend.append(
          'whyItMatters',
          aspirationData.whyItMatters || '',
        );

        const targetMonthIndex = months.indexOf(
          aspirationData.targetDate?.month || 'Month',
        );
        const targetMonthNumber =
          targetMonthIndex >= 0 ? targetMonthIndex + 1 : 1;
        const targetYearNumber =
          parseInt(aspirationData.targetDate?.year || '2025') || 2025;

        formDataToSend.append('targetMonth', String(targetMonthNumber));
        formDataToSend.append('targetYear', String(targetYearNumber));

        // Handle media
        if (mode === 'edit') {
          if (existingMedia.length > 0) {
            existingMedia.forEach(url => {
              formDataToSend.append('existingMedia[]', url);
            });
          }
        }

        if (selectedFiles.length > 0) {
          selectedFiles.forEach((file, index) => {
            formDataToSend.append('media', {
              uri: file.uri,
              type: file.type || 'image/jpeg',
              name: file.fileName || `image_${index}.jpg`,
            } as any);
          });
        }

        if (mode === 'edit') {
          const aspirationId = (initialData as any)?.id;
          if (aspirationId) {
            const response = await editAspiration(aspirationId, formDataToSend);
            responseData = response.data.data;
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Aspiration updated successfully!',
            });

            onSubmit({
              ...formData,
              id: aspirationId,
              ...responseData, // Include API response data
            } as FormData);
            // onClose();

            // Include aspiration information in the submitted data for the success modal
            const updatedFormData = {
              ...formData,
              goal: aspirationData.goal || '',
              whyItMatters: aspirationData.whyItMatters || '',
              targetDate: aspirationData.targetDate || {
                month: 'Month',
                year: 'Year',
              },
            };

            setSubmittedData(updatedFormData as FormData);
            setIsSuccessModalOpen(true);
            return;
          }
        } else {
          const response = await createAspiration(formDataToSend);
          responseData = response.data.data;
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Aspiration added successfully!',
          });
        }

        onSubmit({
          ...formData,
          ...responseData, // Include API response data
        } as FormData);
        // onClose();

        // if (refreshTimeline) {
        //   refreshTimeline();
        // }

        // Include aspiration information in the submitted data for the success modal
        const updatedFormData = {
          ...formData,
          goal: aspirationData.goal || '',
          whyItMatters: aspirationData.whyItMatters || '',
          targetDate: aspirationData.targetDate || {
            month: 'Month',
            year: 'Year',
          },
        };

        setSubmittedData(updatedFormData as FormData);
        setIsSuccessModalOpen(true);
      } else {
        onSubmit(formData as FormData);

        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `${type} ${
            mode === 'edit' ? 'updated' : 'added'
          } successfully!`,
        });

        // Set submitted data and open success modal
        setSubmittedData(formData as FormData);
        setIsSuccessModalOpen(true);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error.response);
      const errorMessage =
        error.response?.data?.message ||
        `There was an error ${
          mode === 'edit' ? 'updating' : 'adding'
        } the ${type}. Please try again.`;

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    onSubmit,
    formData,
    type,
    achievementType,
    selectedFiles,
    existingMediaUrl,
    mode,
    months,
    companySuggestions,
    schoolSuggestions,
    refreshTimeline,
    initialData,
    // onClose,
    existingMedia,
  ]);

  const getModalTitle = useCallback((): string => {
    const action = mode === 'edit' ? 'Edit' : 'Add';
    const typeMap: Record<FormType, string> = {
      position: 'Position',
      achievement: 'Achievement',
      hobby: 'Hobby',
      skills: 'Skill',
      education: 'Education',
      aspiration: 'Aspiration',
    };
    return `${action} ${typeMap[type]}`;
  }, [mode, type]);

  const showSearchModal = useCallback(
    (type: 'company' | 'school' | 'hobby') => {
      setCurrentModalType(type);
      setModalSearchQuery('');
      switch (type) {
        case 'company':
          setCompanyModalVisible(true);
          break;
        case 'school':
          setSchoolModalVisible(true);
          break;
        case 'hobby':
          setHobbyModalVisible(true);
          break;
      }
    },
    [],
  );

  const showDropdownModal = useCallback(
    (title: string, options: string[], callback: (val: string) => void) => {
      setDropdownTitle(title);
      setDropdownOptions(options);
      setDropdownCallback(() => callback);
      setDropdownModalVisible(true);
    },
    [],
  );

  const renderDropdown = useCallback(
    (
      value: string,
      placeholder: string,
      options: string[],
      isOpen: boolean,
      setIsOpen: (val: boolean) => void,
      onChange: (val: string) => void,
      isDisabled: boolean = false,
      dropdownKey?: string,
    ) => (
      <View
        key={dropdownKey}
        style={[styles.dropdownContainer, { zIndex: isOpen ? 10000 : 1 }]}
      >
        <TouchableOpacity
          style={[styles.dropdown, isDisabled && styles.dropdownDisabled]}
          onPress={
            isDisabled
              ? undefined
              : () => {
                  // Show the dropdown modal instead of inline dropdown
                  showDropdownModal(
                    placeholder === 'Month'
                      ? 'Select Month'
                      : placeholder === 'Year'
                      ? 'Select Year'
                      : placeholder,
                    options,
                    onChange,
                  );
                }
          }
          disabled={isDisabled}
        >
          <Text
            style={[
              value && value !== placeholder
                ? styles.dropdownTextSelected
                : styles.dropdownTextPlaceholder,
              isDisabled && styles.dropdownTextDisabled,
            ]}
          >
            {value || placeholder}
          </Text>
          <Text
            style={[
              styles.dropdownArrow,
              isDisabled && styles.dropdownTextDisabled,
            ]}
          >
            <Image source={downArrow} style={styles.dropdownArrowImage} />
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [showDropdownModal],
  );

  const renderDateDropdowns = useCallback(
    (
      startMonth: string,
      startYear: string,
      endMonth: string,
      endYear: string,
      onStartMonthChange: (val: string) => void,
      onStartYearChange: (val: string) => void,
      onEndMonthChange: (val: string) => void,
      onEndYearChange: (val: string) => void,
      startLabel: string = 'Start date',
      endLabel: string = 'End date',
      isEndDisabled: boolean = false,
    ) => (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{startLabel}</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateDropdownWrapper}>
              {renderDropdown(
                startMonth,
                'Month',
                months,
                showStartMonthDropdown,
                setShowStartMonthDropdown,
                onStartMonthChange,
                false,
                'start-month',
              )}
            </View>
            <View style={styles.dateDropdownWrapper}>
              {renderDropdown(
                startYear,
                'Year',
                years,
                showStartYearDropdown,
                setShowStartYearDropdown,
                onStartYearChange,
                false,
                'start-year',
              )}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{endLabel}</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateDropdownWrapper}>
              {renderDropdown(
                endMonth,
                'Month',
                months,
                showEndMonthDropdown,
                setShowEndMonthDropdown,
                isEndDisabled ? () => {} : onEndMonthChange,
                isEndDisabled,
                'end-month',
              )}
            </View>
            <View style={styles.dateDropdownWrapper}>
              {renderDropdown(
                endYear,
                'Year',
                years,
                showEndYearDropdown,
                setShowEndYearDropdown,
                isEndDisabled ? () => {} : onEndYearChange,
                isEndDisabled,
                'end-year',
              )}
            </View>
          </View>
        </View>
      </>
    ),
    [
      showStartMonthDropdown,
      showStartYearDropdown,
      showEndMonthDropdown,
      showEndYearDropdown,
      months,
      years,
    ],
  );

  const renderCheckbox = useCallback(
    (label: string, field: string, value: boolean) => {
      // Get the latest value from formData to ensure it's always current
      const latestValue = (formData as any)[field] ?? value;
      return (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleCheckboxChange(field)}
        >
          <View
            style={[styles.checkbox, latestValue && styles.checkboxChecked]}
          >
            {latestValue && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>{label}</Text>
        </TouchableOpacity>
      );
    },
    [handleCheckboxChange, formData],
  );

  // Fixed renderFormFields function
  const renderFormFields = () => {
    switch (type) {
      case 'position':
        const positionData = formData as Partial<PositionData>;
        return (
          <View style={styles.formContent}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={positionData.title || ''}
                onChangeText={text => handleInputChange('title', text)}
                placeholder="Ex: Head of sales EMEA"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Employment Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employment type</Text>
              {renderDropdown(
                positionData.employmentType || '',
                'Please select',
                employmentTypes,
                showEmploymentDropdown,
                setShowEmploymentDropdown,
                val => handleInputChange('employmentType', val),
                false,
                'employment-type', // Add unique key
              )}
            </View>

            {/* Company Name - FIXED SECTION */}
            {/* Company Name - Custom dropdown with search */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company name</Text>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  mode === 'edit' && styles.dropdownDisabled,
                ]}
                onPress={
                  mode === 'edit' ? undefined : () => showSearchModal('company')
                }
                disabled={mode === 'edit'}
              >
                <Text
                  style={[
                    positionData.companyName &&
                    positionData.companyName !== 'Please select'
                      ? styles.dropdownTextSelected
                      : styles.dropdownTextPlaceholder,
                    mode === 'edit' && styles.dropdownTextDisabled,
                  ]}
                >
                  {positionData.companyName || 'Please select'}
                </Text>
                <Text style={styles.dropdownArrow}>
                  <Image source={downArrow} style={styles.dropdownArrowImage} />
                </Text>
              </TouchableOpacity>
            </View>
            {/* Currently Working Checkbox */}
            {renderCheckbox(
              'I am currently working in this role',
              'isCurrentlyWorking',
              positionData.isCurrentlyWorking || false,
            )}

            {/* Start and End Date */}
            {renderDateDropdowns(
              positionData.startMonth || 'Month',
              positionData.startYear || 'Year',
              positionData.endMonth || 'Month',
              positionData.endYear || 'Year',
              val => handleInputChange('startMonth', val),
              val => handleInputChange('startYear', val),
              val => handleInputChange('endMonth', val),
              val => handleInputChange('endYear', val),
              'Start date',
              'End date',
              positionData.isCurrentlyWorking || false,
            )}

            {/* End Current Position Checkbox */}
            {/* {renderCheckbox(
              'End current position as of now',
              'isCurrentPosition',
              positionData.isCurrentPosition || false,
            )} */}

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={positionData.location || ''}
                onChangeText={text => handleInputChange('location', text)}
                placeholder="Ex: Los Angeles"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Location Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location type</Text>
              {renderDropdown(
                positionData.locationType || '',
                'Please select',
                locationTypes,
                showLocationDropdown,
                setShowLocationDropdown,
                val => handleInputChange('locationType', val),
                false,
                'location-type', // Add unique key
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={positionData.description || ''}
                onChangeText={text => handleInputChange('description', text)}
                placeholder="Tell us about you"
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        );

      case 'achievement':
        const achievementData = formData as Partial<AchievementData>;
        console.log(achievementData, 'wwwwwwwwwwwwwwwwwwwwwwww');
        return (
          <View style={styles.formContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={achievementData.title || ''}
                onChangeText={text => handleInputChange('title', text)}
                placeholder="Activities And Societies: Teaching Computer To Kids"
                placeholderTextColor="#999999"
              />
            </View>

            {achievementType === 'education' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>School</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdown,
                    mode === 'edit' && styles.dropdownDisabled,
                  ]}
                  onPress={
                    mode === 'edit'
                      ? undefined
                      : () => showSearchModal('school')
                  }
                  disabled={mode === 'edit'}
                >
                  <Text
                    style={[
                      achievementData.school &&
                      achievementData.school !== 'Please select'
                        ? styles.dropdownTextSelected
                        : styles.dropdownTextPlaceholder,
                      mode === 'edit' && styles.dropdownTextDisabled,
                    ]}
                  >
                    {achievementData.school || 'Please select'}
                  </Text>
                  <Text style={styles.dropdownArrow}>
                    <Image
                      source={downArrow}
                      style={styles.dropdownArrowImage}
                    />
                  </Text>
                </TouchableOpacity>

                {/* Checkbox for "I am currently active on this" */}
                {renderCheckbox(
                  'I am currently active on this',
                  'isCurrentlyActive',
                  achievementData.isCurrentlyActive || false,
                )}

                {renderDateDropdowns(
                  achievementData.startDate?.month || 'Month',
                  achievementData.startDate?.year || 'Year',
                  achievementData.endDate?.month || 'Month',
                  achievementData.endDate?.year || 'Year',
                  val => handleInputChange('startDate.month', val),
                  val => handleInputChange('startDate.year', val),
                  val => handleInputChange('endDate.month', val),
                  val => handleInputChange('endDate.year', val),
                  'Start Date',
                  'End date (if any)',
                  achievementData.isCurrentlyActive || false, // Disable end date fields if currently active
                )}
              </View>
            )}

            {achievementType === 'career' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company name</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdown,
                    mode === 'edit' && styles.dropdownDisabled,
                  ]}
                  onPress={
                    mode === 'edit'
                      ? undefined
                      : () => showSearchModal('company')
                  }
                  disabled={mode === 'edit'}
                >
                  <Text
                    style={[
                      achievementData.companyName &&
                      achievementData.companyName !== 'Please select'
                        ? styles.dropdownTextSelected
                        : styles.dropdownTextPlaceholder,
                      mode === 'edit' && styles.dropdownTextDisabled,
                    ]}
                  >
                    {achievementData.companyName || 'Please select'}
                  </Text>
                  <Text style={styles.dropdownArrow}>
                    <Image
                      source={downArrow}
                      style={styles.dropdownArrowImage}
                    />
                  </Text>
                </TouchableOpacity>

                {/* Checkbox for "I am currently working on this" */}
                {renderCheckbox(
                  'I am currently working on this',
                  'isCurrentlyActive',
                  achievementData.isCurrentlyActive || false,
                )}

                {renderDateDropdowns(
                  achievementData.date?.month || 'Month',
                  achievementData.date?.year || 'Year',
                  achievementData.endDate?.month || 'Month',
                  achievementData.endDate?.year || 'Year',
                  val => handleInputChange('date.month', val),
                  val => handleInputChange('date.year', val),
                  val => handleInputChange('endDate.month', val),
                  val => handleInputChange('endDate.year', val),
                  'Start Date',
                  'End date (if any)',
                  achievementData.isCurrentlyActive || false, // Disable end date fields if currently active
                )}
              </View>
            )}

            {['hobby', 'skill', 'aspiration'].includes(achievementType) && (
              <View style={styles.inputGroup}>
                {/* Checkbox for "I am currently active on this" */}
                {renderCheckbox(
                  'I am currently active on this',
                  'isCurrentlyActive',
                  achievementData.isCurrentlyActive || false,
                )}

                {renderDateDropdowns(
                  achievementData.date?.month || 'Month',
                  achievementData.date?.year || 'Year',
                  achievementData.endDate?.month || 'Month',
                  achievementData.endDate?.year || 'Year',
                  val => handleInputChange('date.month', val),
                  val => handleInputChange('date.year', val),
                  val => handleInputChange('endDate.month', val),
                  val => handleInputChange('endDate.year', val),
                  'Start Date',
                  'End date (if any)',
                  achievementData.isCurrentlyActive || false,
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={achievementData.description || ''}
                onChangeText={text => handleInputChange('description', text)}
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        );

      case 'education':
        const educationData = formData as Partial<EducationData>;
        return (
          <View style={styles.formContent}>
            {/* School */}
            {/* School - Now a dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>School</Text>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  mode === 'edit' && styles.dropdownDisabled,
                ]}
                onPress={
                  mode === 'edit' ? undefined : () => showSearchModal('school')
                }
                disabled={mode === 'edit'}
              >
                <Text
                  style={[
                    educationData.school &&
                    educationData.school !== 'Please select'
                      ? styles.dropdownTextSelected
                      : styles.dropdownTextPlaceholder,
                    mode === 'edit' && styles.dropdownTextDisabled,
                  ]}
                >
                  {educationData.school || 'Please select'}
                </Text>
                <Text style={styles.dropdownArrow}>
                  <Image source={downArrow} style={styles.dropdownArrowImage} />
                </Text>
              </TouchableOpacity>
            </View>

            {/* Degree */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Degree</Text>
              <TextInput
                style={styles.input}
                value={educationData.degree || ''}
                onChangeText={text => handleInputChange('degree', text)}
                placeholder="Ex: Bachelor's Degree"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Field of Study */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Field of study</Text>
              <TextInput
                style={styles.input}
                value={educationData.fieldOfStudy || ''}
                onChangeText={text => handleInputChange('fieldOfStudy', text)}
                placeholder="Ex: Computer Science"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Grade */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Grade</Text>
              {renderDropdown(
                educationData.grade || '',
                'Please select',
                grades,
                showGradeDropdown,
                setShowGradeDropdown,
                val => handleInputChange('grade', val),
              )}
            </View>

            {/* Currently Studying Checkbox */}
            {renderCheckbox(
              'I am currently studying',
              'isCurrentlyStudying',
              educationData.isCurrentlyStudying || false,
            )}

            {/* Start and End Date */}
            {renderDateDropdowns(
              educationData.startDate?.month || 'Month',
              educationData.startDate?.year || 'Year',
              educationData.endDate?.month || 'Month',
              educationData.endDate?.year || 'Year',
              val => handleInputChange('startDate.month', val),
              val => handleInputChange('startDate.year', val),
              val => handleInputChange('endDate.month', val),
              val => handleInputChange('endDate.year', val),
              'Start date',
              'End date',
              educationData.isCurrentlyStudying || false, // Disable end date fields if currently studying
            )}

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={educationData.description || ''}
                onChangeText={text => handleInputChange('description', text)}
                placeholder="Describe your education experience"
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        );

      case 'hobby':
        const hobbyData = formData as Partial<HobbyData>;
        return (
          <View style={styles.formContent}>
            {/* Hobby - Custom dropdown with search */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hobby</Text>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  mode === 'edit' && styles.dropdownDisabled,
                ]}
                onPress={
                  mode === 'edit' ? undefined : () => showSearchModal('hobby')
                }
                disabled={mode === 'edit'}
              >
                <Text
                  style={[
                    hobbyData.hobby && hobbyData.hobby !== 'Please select'
                      ? styles.dropdownTextSelected
                      : styles.dropdownTextPlaceholder,
                    mode === 'edit' && styles.dropdownTextDisabled,
                  ]}
                >
                  {hobbyData.hobby || 'Please select'}
                </Text>
                <Text style={styles.dropdownArrow}>
                  <Image source={downArrow} style={styles.dropdownArrowImage} />
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={hobbyData.title || ''}
                onChangeText={text => handleInputChange('title', text)}
                placeholder="Ex: Chess Master"
                placeholderTextColor="#99999"
              />
            </View>

            {/* Skill Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skill Level</Text>
              {renderDropdown(
                hobbyData.skillLevel || '',
                'Please select',
                skillLevels,
                showSkillLevelDropdown,
                setShowSkillLevelDropdown,
                val => handleInputChange('skillLevel', val),
              )}
            </View>

            {/* Is Active Checkbox */}
            {renderCheckbox(
              'I am currently active in this hobby',
              'isActive',
              hobbyData.isActive || false,
            )}

            {/* Start and End Date */}
            {renderDateDropdowns(
              hobbyData.startDate?.month || 'Month',
              hobbyData.startDate?.year || 'Year',
              hobbyData.endDate?.month || 'Month',
              hobbyData.endDate?.year || 'Year',
              val => handleInputChange('startDate.month', val),
              val => handleInputChange('startDate.year', val),
              val => handleInputChange('endDate.month', val),
              val => handleInputChange('endDate.year', val),
              'Start date',
              'End date (if any)',
              hobbyData.isActive || false, // Disable end date fields if currently active
            )}

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={hobbyData.location || ''}
                onChangeText={text => handleInputChange('location', text)}
                placeholder="Ex: Los Angeles"
                placeholderTextColor="#99999"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={hobbyData.description || ''}
                onChangeText={text => handleInputChange('description', text)}
                placeholder="Describe your hobby experience"
                placeholderTextColor="#99999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        );

      case 'skills':
        const skillsData = formData as Partial<SkillsData>;
        return (
          <View style={styles.formContent}>
            {/* Skill Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skill Name</Text>
              <TextInput
                style={[styles.input, mode === 'edit' && styles.disabledInput]}
                value={skillsData.skillName || ''}
                onChangeText={text => handleInputChange('skillName', text)}
                placeholder="Ex: React Native Development"
                placeholderTextColor="#999999"
                editable={mode !== 'edit'}
              />
            </View>

            {/* Skill Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skill Level</Text>
              {renderDropdown(
                skillsData.skillLevel || '',
                'Please select',
                skillLevels,
                showSkillLevelDropdown,
                setShowSkillLevelDropdown,
                val => handleInputChange('skillLevel', val),
              )}
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={skillsData.title || ''}
                onChangeText={text => handleInputChange('title', text)}
                placeholder="Ex: Senior Developer"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Is Active Checkbox */}
            {renderCheckbox(
              'I am currently using this skill',
              'isActive',
              skillsData.isActive || false,
            )}

            {/* Start and End Date */}
            {renderDateDropdowns(
              skillsData.startDate?.month || 'Month',
              skillsData.startDate?.year || 'Year',
              skillsData.endDate?.month || 'Month',
              skillsData.endDate?.year || 'Year',
              val => handleInputChange('startDate.month', val),
              val => handleInputChange('startDate.year', val),
              val => handleInputChange('endDate.month', val),
              val => handleInputChange('endDate.year', val),
              'Start date',
              'End date (if any)',
              skillsData.isActive || false, // Disable end date fields if currently active
            )}

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={skillsData.description || ''}
                onChangeText={text => handleInputChange('description', text)}
                placeholder="Describe your skill experience"
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        );

      case 'aspiration':
        const aspirationData = formData as Partial<AspirationData>;
        return (
          <View style={styles.formContent}>
            {/* Goal */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal</Text>
              <TextInput
                style={styles.input}
                value={aspirationData.goal || ''}
                onChangeText={text => handleInputChange('goal', text)}
                placeholder="Ex: Become a Tech Lead"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Why This Matters */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Why this matters to you</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={aspirationData.whyItMatters || ''}
                onChangeText={text => handleInputChange('whyItMatters', text)}
                placeholder="Explain why this goal is important to you"
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Target Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target date</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateDropdownWrapper}>
                  {renderDropdown(
                    aspirationData.targetDate?.month || 'Month',
                    'Month',
                    months,
                    showTargetMonthDropdown,
                    setShowTargetMonthDropdown,
                    val => handleInputChange('targetDate.month', val),
                  )}
                </View>
                <View style={styles.dateDropdownWrapper}>
                  {renderDropdown(
                    aspirationData.targetDate?.year || 'Year',
                    'Year',
                    years,
                    showTargetYearDropdown,
                    setShowTargetYearDropdown,
                    val => handleInputChange('targetDate.year', val),
                  )}
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const isFormValid = useCallback(() => {
    // Basic validation - you can enhance this based on your requirements
    switch (type) {
      case 'position':
        const positionData = formData as PositionData;
        return (
          positionData.title &&
          positionData.employmentType !== 'Please select' &&
          positionData.companyName
        );
      case 'achievement':
        if (achievementType === 'career') {
          let startDate, endDate;
          const achievementData = formData as AchievementData;

          return (
            achievementData.title &&
            (achievementData.companyName || achievementData.school) &&
            achievementData.date?.month &&
            achievementData.date?.year &&
            achievementData.description
          );
        } else if (achievementType === 'education') {
          const achievementData = formData as AchievementData;

          return (
            achievementData.title &&
            achievementData.school &&
            achievementData.startDate?.month &&
            achievementData.startDate?.year &&
            achievementData.description
          );
        } else if (['hobby', 'skill', 'aspiration'].includes(achievementType)) {
          const achievementData = formData as AchievementData;
          return (
            achievementData.title &&
            achievementData.date?.month &&
            achievementData.date?.year &&
            achievementData.description
          );
        }
        return true;
      case 'education':
        const educationData = formData as EducationData;
        return educationData.school && educationData.degree;
      default:
        return true;
    }
  }, [type, formData, achievementType]);

  const DropdownModal = () => (
    <Modal
      visible={dropdownModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setDropdownModalVisible(false)}
    >
      <View style={styles.dropdownOverlay}>
        <View style={styles.dropdownModalContainer}>
          <View style={styles.dropdownModalHeader}>
            <Text style={styles.dropdownModalTitle}>{dropdownTitle}</Text>
            <TouchableOpacity
              style={styles.dropdownModalClose}
              onPress={() => setDropdownModalVisible(false)}
            >
              <Text style={styles.dropdownModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.dropdownModalScroll}>
            {dropdownOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownModalItem}
                onPress={() => {
                  dropdownCallback(option);
                  setDropdownModalVisible(false);
                }}
              >
                <Text style={styles.dropdownModalItemText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const SearchModal = React.memo(
    ({
      visible,
      type,
      data,
      onSelect,
      onClose,
      onAddNew,
      placeholder,
    }: {
      visible: boolean;
      type: 'company' | 'school' | 'hobby';
      data: any[];
      onSelect: (item: any) => void;
      onClose: () => void;
      onAddNew: () => void;
      placeholder: string;
    }) => {
      const [searchQuery, setSearchQuery] = useState('');
      const [filteredData, setFilteredData] = useState<any[]>(data);

      // Update filtered data when data or search query changes
      useEffect(() => {
        if (searchQuery.trim() === '') {
          setFilteredData(data);
        } else {
          const filtered = data.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          setFilteredData(filtered);
        }
      }, [searchQuery, data]);

      const getModalTitle = () => {
        switch (type) {
          case 'company':
            return 'Select Company';
          case 'school':
            return 'Select School';
          case 'hobby':
            return searchQuery.trim() !== '' && filteredData.length === 0
              ? 'Add Hobby'
              : 'Select Hobby';
          default:
            return 'Select';
        }
      };

      const getAddNewText = () => {
        switch (type) {
          case 'company':
            return 'Your company is not here yet?';
          case 'school':
            return 'Your school is not here yet?';
          case 'hobby':
            return '';
          default:
            return 'Not found?';
        }
      };

      const getAddButtonText = () => {
        switch (type) {
          case 'company':
            return 'Add Company';
          case 'school':
            return 'Add School';
          case 'hobby':
            return 'Add Hobby';
          default:
            return 'Add New';
        }
      };

      const handleSelect = (item: any) => {
        onSelect(item);
        setSearchQuery(''); // Clear search on select
      };

      const handleClose = () => {
        setSearchQuery(''); // Clear search on close
        onClose();
      };

      const handleAddNew = () => {
        setSearchQuery(''); // Clear search before adding new
        onAddNew();
      };

      // Determine if we should show the load more button based on type and pagination state
      const shouldShowLoadMore = () => {
        if (type === 'hobby') {
          return hobbyPagination.hasNextPage;
        } else if (type === 'school') {
          return schoolPagination.hasNext;
        }
        return false;
      };

      // Handle load more based on type
      const handleLoadMore = () => {
        if (type === 'hobby') {
          loadMoreHobbies();
        } else if (type === 'school') {
          loadMoreSchools();
        }
      };

      return (
        <Modal
          visible={visible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleClose}
        >
          <View style={styles.searchModalOverlay}>
            <View style={styles.searchModalContainer}>
              <View style={styles.searchModalHeader}>
                <Text style={styles.searchModalTitle}>{getModalTitle()}</Text>
                <TouchableOpacity
                  style={styles.searchModalClose}
                  onPress={handleClose}
                >
                  <Text style={styles.searchModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchModalSearchContainer}>
                <TextInput
                  style={styles.searchModalSearchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={placeholder}
                  placeholderTextColor="#999"
                  autoFocus
                />
              </View>

              <ScrollView
                style={styles.searchModalScroll}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {filteredData.length > 0 ? (
                  <>
                    {filteredData.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.modalSuggestionItem}
                        onPress={() => handleSelect(item)}
                      >
                        {item.logo || item.image ? (
                          <Image
                            source={{ uri: item.logo || item.image }}
                            style={styles.modalLogoImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.modalLogoPlaceholder}>
                            <Text style={styles.modalLogoText}>
                              {item.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.companyInfoContainer}>
                          <Text style={styles.modalSuggestionText}>
                            {item.name}
                          </Text>
                          {item.isVerified !== undefined && (
                            <View style={styles.verificationStatusContainer}>
                              <Image
                                source={
                                  item.isVerified
                                    ? require('../../assets/icons/tick.png')
                                    : require('../../assets/icons/time.png')
                                }
                                style={[
                                  item.isVerified
                                    ? styles.verifiedIcon
                                    : styles.pendingIcon,
                                ]}
                              />
                              <Text
                                style={[
                                  styles.verificationStatus,
                                  item.isVerified
                                    ? styles.verifiedText
                                    : styles.pendingText,
                                ]}
                              >
                                {item.isVerified ? 'Verified' : 'Pending'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}

                    {/* Load More Button for hobbies and schools */}
                    {shouldShowLoadMore() && searchQuery.trim() === '' && (
                      <TouchableOpacity
                        style={styles.modalSuggestionItem}
                        onPress={handleLoadMore}
                        disabled={
                          type === 'hobby'
                            ? hobbyPagination.loadingMore
                            : schoolPagination.loadingMore
                        }
                      >
                        <View style={styles.loadMoreContainer}>
                          <Text style={styles.loadMoreText}>
                            {type === 'hobby' && hobbyPagination.loadingMore
                              ? 'Loading more hobbies...'
                              : type === 'school' &&
                                schoolPagination.loadingMore
                              ? 'Loading more schools...'
                              : 'Load More'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </>
                ) : null}

                {/* Show "Add New" option when searching and no results */}
                {searchQuery.trim() !== '' && filteredData.length === 0 && (
                  <TouchableOpacity
                    style={styles.modalSuggestionItem}
                    onPress={handleAddNew}
                  >
                    <View style={styles.modalAddNewContainer}>
                      <Text style={styles.modalSuggestionTextBold}>
                        {getAddNewText()}
                      </Text>
                      <TouchableOpacity
                        style={styles.modalAddButton}
                        onPress={handleAddNew}
                      >
                        <Text style={styles.modalAddButtonText}>
                          {getAddButtonText()}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      );
    },
  );

  const renderSearchModal = () => {
    const getData = () => {
      switch (currentModalType) {
        case 'company':
          return companySuggestions;
        case 'school':
          return schoolSuggestions;
        case 'hobby':
          return hobbiesList;
        default:
          return [];
      }
    };

    const getPlaceholder = () => {
      switch (currentModalType) {
        case 'company':
          return 'Search companies...';
        case 'school':
          return 'Search schools...';
        case 'hobby':
          return 'Search hobbies...';
        default:
          return 'Search...';
      }
    };

    const getModalVisible = () => {
      switch (currentModalType) {
        case 'company':
          return companyModalVisible;
        case 'school':
          return schoolModalVisible;
        case 'hobby':
          return hobbyModalVisible;
        default:
          return false;
      }
    };

    const handleSelect = (item: any) => {
      switch (currentModalType) {
        case 'company':
          if (type === 'achievement') {
            handleInputChange('companyName', item.name);
          } else {
            handleInputChange('companyName', item.name);
          }
          break;
        case 'school':
          if (type === 'achievement') {
            handleInputChange('school', item.name);
            if (achievementType === 'education') {
              setFormData(prev => ({
                ...prev,
                schoolId: item.id,
              }));
            }
          } else {
            handleInputChange('school', item.name);
            if (type === 'education') {
              setFormData(prev => ({
                ...prev,
                schoolId: item.id,
              }));
            }
          }
          break;
        case 'hobby':
          handleInputChange('hobby', item.name);
          break;
      }
      closeModal();
    };

    const handleAddNew = () => {
      switch (currentModalType) {
        case 'company':
          closeModal();
          (navigation as any).navigate('AddCompany');
          break;
        case 'school':
          closeModal();
          if (onAddSchool) onAddSchool();
          break;
        case 'hobby':
          closeModal();
          setIsAddHobbyModalOpen(true);
          break;
      }
    };

    const closeModal = () => {
      setCompanyModalVisible(false);
      setSchoolModalVisible(false);
      setHobbyModalVisible(false);
    };

    return (
      <SearchModal
        visible={getModalVisible()}
        type={currentModalType}
        data={getData()}
        onSelect={handleSelect}
        onClose={closeModal}
        onAddNew={handleAddNew}
        placeholder={getPlaceholder()}
      />
    );
  };

  return (
    <>
      {/* Main Form Modal */}
      <Modal
        visible={isOpen && !isSuccessModalOpen}
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
              <Text style={styles.headerTitle}>{getModalTitle()}</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Form Content */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                {renderFormFields()}

                {/* Add Media Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Add media</Text>

                  {/* Show existing media if available - Hide for education and skills as per request */}
                  {existingMedia.length > 0 || selectedFiles.length > 0 ? (
                    <View style={styles.multipleMediaContainer}>
                      {existingMedia.map((url, index) => (
                        <View
                          key={`existing-${index}`}
                          style={styles.mediaPreviewContainer}
                        >
                          <Image
                            source={{ uri: url }}
                            style={styles.mediaPreviewImage}
                            resizeMode="cover"
                          />
                          {/* No remove button for existing media */}
                        </View>
                      ))}
                      {selectedFiles.map((file, index) => (
                        <View
                          key={`new-${index}`}
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
                              handleInputChange('media', updatedFiles);
                            }}
                          >
                            <Text style={styles.removeText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      {selectedFiles.length < 10 && (
                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={handleFileUpload}
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
                      onPress={handleFileUpload}
                    >
                      <Text style={styles.uploadIcon}>⬆</Text>
                      <Text style={styles.uploadText}>Upload</Text>
                    </TouchableOpacity>
                  )}

                  {/* Show info text when in edit mode with existing media */}
                  {mode === 'edit' && existingMediaUrl && (
                    <Text style={styles.existingMediaText}>
                      Current image will be kept unless you upload a new one or
                      remove it.
                    </Text>
                  )}
                </View>

                {/* Warning Message */}
                {(type === 'position' || type === 'education') &&
                  mode === 'edit' && (
                    <View style={styles.warningContainer}>
                      <Text style={styles.warningIcon}>❤️</Text>
                      <Text style={styles.warningText}>
                        Impossible oath to prevent fraud: Your platform may only
                        be used to verify and reference identity information.
                        <Text style={styles.warningTextBold}>
                          {' '}
                          Nullables and counterfactuals
                        </Text>{' '}
                        can be
                        <Text style={styles.warningTextBold}>
                          {' '}
                          only limited to false
                        </Text>
                      </Text>
                    </View>
                  )}

                {/* Bottom spacing */}
                <View style={styles.bottomSpacing} />
              </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  isFormValid() && styles.createButtonActive,
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid() || isLoading}
              >
                <Text style={styles.createButtonText}>
                  {mode === 'edit' ? 'Save Changes' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Loading Overlay */}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Submitting...</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Search Modal for Company/School/Hobby */}
      {renderSearchModal()}

      {/* Simple Dropdown Modal */}
      <DropdownModal />

      {/* Success Modal - SEPARATE from the form modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          onClose(); // Close the parent modal too
        }}
        type={type}
        submittedData={submittedData}
        companySuggestions={companySuggestions}
        mode={mode} // Pass the mode prop
        onPostToFeed={() => {
          console.log('Post to feed clicked');
          setIsSuccessModalOpen(false);
          onClose();
          if (refreshTimeline) {
            refreshTimeline();
          }
        }}
        onDeleteEntry={() => {
          console.log('Delete entry clicked');
          setIsSuccessModalOpen(false);
          onClose();
          if (refreshTimeline) {
            refreshTimeline();
          }
        }}
        onSuccess={() => {
          // This will be called for both actions to ensure refresh
          if (refreshTimeline) {
            refreshTimeline();
          }
        }}
      />

      {/* Add Hobby Modal */}
      <AddHobbyModal
        isOpen={isAddHobbyModalOpen}
        onClose={() => {
          setIsAddHobbyModalOpen(false);
          // Clear the hobby search input when closing the modal
          handleInputChange('hobby', '');
        }}
        onHobbyAdded={newHobby => {
          // Add the new hobby to the hobby field and close the modal
          handleInputChange('hobby', newHobby.name);
          setIsAddHobbyModalOpen(false);
          // Refresh the hobbies list
          fetchHobbies();
        }}
      />
    </>
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
    height: '90%',
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
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formContent: {
    gap: 0,
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
  disabledInput: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#999999',
    backgroundColor: '#f5f5f5',
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
  dropdownDisabled: {
    backgroundColor: '#f5f5f5',
  },
  dropdownTextPlaceholder: {
    fontSize: 14,
    color: '#999999',
  },
  dropdownTextSelected: {
    fontSize: 14,
    color: '#000000',
  },
  dropdownTextDisabled: {
    color: '#999999',
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
    maxHeight: 200, // Reduced height to ensure it fits within screen
    zIndex: 10000, // Increased zIndex
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 10,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    paddingLeft: 10,
  },
  uploadIcon: {
    fontSize: 16,
    marginRight: 2,
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
  companyLogoContainer: {
    width: 30,
    height: 30,
    marginRight: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  companyLogo: {
    width: '100%',
    height: '100%',
  },
  companyLogoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%', // Position below the input
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d0',
    borderRadius: 4,
    maxHeight: 400, // Increased max height for better scrolling
    zIndex: 10000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginTop: 4,
  },

  suggestionsScroll: {
    maxHeight: 398, // Slightly less than container to account for borders
  },

  // Make sure the dropdown item container has proper height
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 50, // Ensure consistent item height
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000000',
  },
  suggestionText: {
    fontSize: 14,
    color: '#000000',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3333',
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
  suggestionTextBold: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '300',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  inputWithIconStyle: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: 'transparent',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666666',
    paddingHorizontal: 12,
  },
  existingMediaText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  mediaButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  multipleMediaContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  removeText: {
    color: '#ffffff',
  },
  maxLimitText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  addNewContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },

  addButton: {
    backgroundColor: '#27c427ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    marginLeft: 10,
  },

  addButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  dropdownArrowImage: {
    width: 12,
    height: 12,
    marginLeft: 8,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownMenuContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffffff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    maxHeight: 300,
    zIndex: 10000000000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginTop: 4,
  },
  dropdownScroll: {
    maxHeight: 298, // Slightly less than container
    flexGrow: 1,
    overflow: 'hidden',
  },
  dropdownScrollContent: {
    // flexGrow: 1,
    zIndex: 10000000000,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000000000000,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000000',
  },
  // Update the dateDropdownWrapper
  dateDropdownWrapper: {
    flex: 1,
    position: 'relative',
    maxHeight: 100,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdownModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  dropdownModalClose: {
    padding: 5,
  },
  dropdownModalCloseText: {
    fontSize: 20,
    color: '#666666',
  },
  dropdownModalScroll: {
    maxHeight: 400,
  },
  dropdownModalItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownModalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  searchModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  searchModalClose: {
    padding: 5,
  },
  searchModalCloseText: {
    fontSize: 20,
    color: '#666666',
  },
  searchModalSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchModalSearchInput: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#f5f5f5',
  },
  searchModalScroll: {
    maxHeight: 400,
  },
  modalSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalLogoImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  modalLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalLogoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#66666',
  },
  modalSuggestionText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  modalSuggestionTextBold: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 8,
  },
  modalAddNewContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  modalAddButton: {
    backgroundColor: '#27c427ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  modalAddButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  // Load More styles
  loadMoreContainer: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  loadMoreText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  companyInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationStatusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    borderRadius: 25,
  },
  verificationStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 10,
    // marginLeft: 8,
  },
  verifiedText: {
    // backgroundColor: '#e6f4ea',
    color: '#27c427ff',
  },
  pendingText: {
    color: '#000000',
  },
  pendingIcon: {
    width: 20,
    height: 20,
    tintColor: '#000000',
  },
  verifiedIcon: {
    width: 20,
    height: 20,
    tintColor: '#27c427ff',
  },
});

export default UniversalFormModal;
