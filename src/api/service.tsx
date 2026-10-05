// util/api.ts
import axios from 'axios';
import { getStoredToken, clearAuthData } from '../util/authController';

const base_url = 'https://api-dev.circleproof.com/api';
// const base_url = "http://192.168.0.123:8000/api";

export const api = axios.create({
  baseURL: base_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiFile = axios.create({
  baseURL: base_url,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Attach token dynamically
const attachToken = async (config: any) => {
  const token = await getStoredToken();
  console.log(token, 'khkh');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachToken);
apiFile.interceptors.request.use(attachToken);

// ✅ Response Interceptor to catch 401
const handleUnauthorized = async (error: any) => {
  if (error.response && error.response.status === 401) {
    console.warn('401 detected → clearing session & redirecting to login');

    // Clear storage
    await clearAuthData();
    // Note: localStorage.clear() is not needed in React Native since we're using AsyncStorage

    // In a real app, you might want to navigate to login screen here
    // For now, we'll just reject the error and let the calling component handle it
  }
  return Promise.reject(error);
};

api.interceptors.response.use(response => response, handleUnauthorized);
apiFile.interceptors.response.use(response => response, handleUnauthorized);

// ========================
// AUTH API ENDPOINTS
// ========================
export const signIn = (data: { email: string; password: string }) =>
  api.post('/login', data).then(response => {
    console.log(data, 'ujhhk');

    // Ensure the response contains token and user data
    return response;
  });

export const signUp = (data: {
  fullName: string;
  email: string;
  password: string;
}) =>
  api.post('/register', data).then(response => {
    // Ensure the response contains token and user data
    return response;
  });

// ========================
// USER API ENDPOINTS
// ========================
export const getCurrentUser = () => api.get('/user');

export const updateUserProfile = (data: any) => api.put('/user', data);
export const deleteUserProfile = () => api.delete('/users/profile');

// ========================
// POST API ENDPOINTS
// ========================
export const createPost = (data: FormData) =>
  apiFile.post('/create-post', data);

export const getAllPosts = (page: number = 1) =>
  api.get(`/all-posts?page=${page}`);

export const getCurrentUserPosts = (page: number = 1) =>
  api.get(`/user-posts?page=${page}`);

export const getUserPostsById = (userId: number, page: number = 1) =>
  api.get(`/user-posts/${userId}?page=${page}`);

// ========================
// POST INTERACTIONS API ENDPOINTS
// ========================
export const likePost = (postId: number) => api.post(`/${postId}/like`);

export const addComment = (
  postId: number,
  data: { content: string; parentCommentId?: number },
) => api.post(`/${postId}/comment`, data);

export const getPostLikes = (postId: number) => api.get(`/${postId}/likes`);

// ========================
// COMMENTS API ENDPOINTS
// ========================
export const getPostComments = (postId: number) =>
  api.get(`/${postId}/comments`);

export const getCommentDetails = (commentId: number) =>
  api.get(`/comments/${commentId}`);

export const likeComment = (commentId: number) => {
  console.log('Liking comment with ID:', commentId);
  return api.post(`/comments/${commentId}/like`);
};

// ========================
// POSITION API ENDPOINTS
// ========================

export const addPosition = (
  data:
    | {
      description: string;
      companyId: any;
      isCurrentlyWorking: any;
      title: string;
      employmentType: string;
      companyName: string;
      startMonth: number;
      startYear: number;
      endMonth?: number;
      endYear?: number;
      location: string;
      locationType: string;
      media?: any;
    }
    | FormData,
) => {
  console.log(data, 'position data');

  if (data instanceof FormData) {
    // If data is already a FormData object, use it directly
    return apiFile.post('/positions/create', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } else {
    // If data is an object, convert it to FormData
    const formData = new FormData();

    // Append all fields
    formData.append('title', data.title);
    formData.append('employmentType', data.employmentType);

    // Use companyId if available, otherwise use companyName
    if (data.companyId) {
      formData.append('companyId', data.companyId);
    } else {
      formData.append('companyName', data.companyName);
    }

    formData.append('isCurrentlyWorking', data.isCurrentlyWorking);
    formData.append('startMonth', data.startMonth);
    formData.append('startYear', data.startYear);

    // Only append endMonth and endYear if they exist
    if (data.endMonth !== undefined && data.endMonth !== null) {
      formData.append('endMonth', data.endMonth);
    }
    if (data.endYear !== undefined && data.endYear !== null) {
      formData.append('endYear', data.endYear);
    }

    formData.append('location', data.location);
    formData.append('locationType', data.locationType);
    formData.append('description', data.description);

    // Add media file if provided
    if (data.media) {
      formData.append('media', {
        uri: data.media.uri,
        type: data.media.type || 'image/jpeg',
        name: data.media.name || `image_${Date.now()}.jpg`,
      });
    }

    console.log('FormData entries:');
    for (let [key, value] of (formData as any)._parts) {
      console.log(key, value);
    }

    return apiFile.post('/positions/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

export const verifyPosition = (
  positionId: number,
  data: { status: string; comments: string },
) => api.post(`/positions/${positionId}/validations`, data);

export const editPosition = (positionId: number, data: any) =>
  api.put(`/positions/${positionId}`, data);

export const fetchProfileStats = () => api.get('/users/stats');

export const fetchSpecificUserProfileStats = (userId: number) =>
  api.get(`/users/stats/${userId}`);

export const updateProfilePicture = (data: FormData) =>
  apiFile.post('/users/profile/picture', data);

export const updateProfile = (data: any) => {
  console.log(data, 'profile data');
  if (data instanceof FormData) {
    // If data is a FormData object, use apiFile with multipart/form-data
    return apiFile.put('/users/profile', data);
  } else {
    // If data is a regular object, use api with application/json
    return api.put('/users/profile', data);
  }
};

interface ReorderValidations {
  validationId: number;
  order: number;
}

interface ToggleValidation {
  isHidden: boolean;
}

export const reorderValidations = (payload: ReorderValidations[]) => api.put('/validations/reorder', payload);
export const toggleValidation = (validationId: number, payload: ToggleValidation) => api.put(`/validations/${validationId}/visibility`, payload);

export const fetchProfile = () => api.get('/users/profile');

export const followUser = (data: any) => api.post('/users/follow', data);

export const unfollowUser = (data: any) => api.post('/users/unfollow', data);

export const toggleFollow = (data: any) =>
  api.post('/users/follow-toggle', data);

export const getCompanies = () => api.get('/companies');

export const addCompany = (data: any) => {
  console.log('API Call: addCompany', {
    endpoint: '/companies/create',
    requestData: data,
  });

  return apiFile.post('/companies/create', data);
};

export const getCompanyById = (id: number) => api.get(`/companies/${id}`);

export const addAchievement = (data: any) => {
  console.log('Adding achievement with data:', data);
  return apiFile.post('/achievements/create', data);
};

export const fetchTimeLineByUserId = (userId: number, page: number = 1) =>
  api.get(`/timeline/user/${userId}?page=${page}`);

export const fetchMyTimeline = (page: number = 1) =>
  api.get(`/timeline/me?page=${page}`);

export const searchQuery = (query: string) => api.get(`/search?q=${query}`);

export const likeUnlikeTimeline = (timelineId: number, entityType: string) => {
  console.log(
    'Liking/Unliking timeline with ID:',
    timelineId,
    'Entity Type:',
    entityType,
  );
  return api.post(`/timeline/${timelineId}/like`, { entityType });
};

export const fetchPositionsById = (id: number) => api.get(`/positions/${id}`);

export const fetchAchievementsById = (id: number) =>
  api.get(`/achievements/${id}`);

export const updatePosition = (positionId: number, data: any) => {
  console.log('Updating position with ID:', positionId);
  console.log('Update data:', data);
  return apiFile.put(`/positions/${positionId}`, data);
};

export const fetchTimelineLikes = (timelineId: number, entityType: string) => {
  console.log(
    'Fetching likes for timeline ID:',
    timelineId,
    'Entity Type:',
    entityType,
  );
  return api.get(`/timeline/${timelineId}/likes?entityType=${entityType}`);
};

export const fetchTimelineComments = (timelineId: number, entityType: string) =>
  api.get(`/timeline/${timelineId}/comments?entityType=${entityType}`);

export const addTimelineComment = (
  timelineId: number,
  data: any,
  entityType: string,
) => api.post(`/timeline/${timelineId}/comment`, { ...data, entityType });

export const updateAchievement = (achievementId: number, data: any) => {
  console.log('[updateAchievement] ID:', achievementId, 'Data:', data);
  return apiFile.put(`/achievements/${achievementId}`, data);
};

export const fetchCompanyVerificationListById = (id: number) =>
  api.get(`/companies/${id}/items`);

export const requestVerification = (data: any) => {
  console.log(data, 'data');
  return api.post(`/validations/requests`, data);
};

export const receivedVerificationRequest = (type?: string) => {
  let url = '/positions/validation-requests/received';
  if (type) {
    url += `?type=${type}`;
  }
  return api.get(url);
};

export const validationRequest = (requestId: number, data: any) => {
  console.log(requestId, 'request id', data, 'data');
  return api.post(`/validations/requests/${requestId}/process`, data);
};

export const checkCompanyPosition = (companyId: number) => {
  console.log(companyId, 'company id');
  return api.get(`/positions/check-company/${companyId}`);
};

export const confirmVerificationRequest = (requestId: number, data: any) => {
  console.log(requestId, 'confirm request id', data, 'data');
  return api.post(`/validations/requests/${requestId}/confirm`, data);
};

export const cancelVerificationRequest = (requestId: number) => {
  console.log(requestId, 'decline request id');
  return api.post(`/validations/requests/${requestId}/cancel`, {});
};

export const toggleTimelineCommentLike = (commentId: number) => {
  console.log('Liking timeline comment with ID:', commentId);
  return api.post(`/timeline/comments/${commentId}/like`);
};
export const getSchoolList = () => api.get(`/education/schools`);
export const getEducationData = (page: number = 1) =>
  api.get(`/education/feed/me?page=${page}`);

export const getEducationDataById = (educationId: number, page: number = 1) =>
  api.get(`/education/feed/${educationId}?page=${page}`);

export const getEducationByid = (educationId: number) =>
  api.get(`/education/${educationId}`);

export const editEducationWithId = (educationId: number, data: FormData) => {
  console.log('Editing education with ID:', educationId, 'Data:', data);
  return apiFile.put(`/education/${educationId}`, data);
};

export const createEducationAchievement = (data: FormData) => {
  console.log('Creating education achievement with data:', data);
  return apiFile.post('/education/achievement/create', data);
};

export const getEducationAchievementById = (educationAchievementId: number) => {
  console.log('Getting education achievement with ID:', educationAchievementId);
  return api.get(`/education/achievement/${educationAchievementId}`);
};

export const editEducationAchievementWithId = (
  educationAchievementId: number,
  data: FormData,
) => {
  console.log(
    'Editing education achievement with ID:',
    educationAchievementId,
    'Data:',
    data,
  );
  return apiFile.put(`/education/achievement/${educationAchievementId}`, data);
};

export const addEducationLikesUnlike = (Id: any, entityType: string) =>
  api.post(`/education/feed/${Id}/like`, { entityType });

export const addCommentsReplies = (Id: any, data: any, entityType?: string) =>
  api.post(
    `/education/feed/${Id}/comment`,
    entityType ? { ...data, entityType } : data,
  );

export const fetchCommentsByEducationId = (Id: any, entityType?: string) =>
  api.get(
    `/education/feed/${Id}/comments${entityType ? `?entityType=${entityType}` : ''
    }`,
  );

export const fetchEducationLikes = (Id: any, entityType: string) => {
  console.log(Id, 'education id');
  return api.get(`/education/feed/${Id}/likes?entityType=${entityType}`);
};

export const addLikeToCommentandReply = (Id: any) =>
  api.post(`/education/comment/${Id}/like`);

export const createEducation = (data: FormData) => {
  console.log('Creating education with data:', data);
  return apiFile.post('/education/create', data);
};

// Create Skill
export const createSkill = (data: any) => apiFile.post('/skill/create', data);

// Edit Skill by Id
export const editSkill = (skillId: number, data: any) =>
  apiFile.put(`/skill/${skillId}`, data);

// Get specific Skill details by Id
export const getSkillById = (skillId: number) => api.get(`/skill/${skillId}`);

// Get all skills by current user
export const fetchMySkills = (page: number = 1) =>
  api.get(`/skill/feed/me?page=${page}`);

// Get all skills for specific user by userId
export const fetchSkillsByUserId = (userId: number, page: number = 1) =>
  api.get(`/skill/feed/${userId}?page=${page}`);

export const addSkillLikeUnlike = (Id: number) => api.post(`/skill/${Id}/like`);

export const addSkillCommentReply = (Id: number, data: any) =>
  api.post(`/skill/${Id}/comment`, data);

export const fetchSkillComments = (Id: number) =>
  api.get(`/skill/${Id}/comments`);

export const fetchSkillLikes = (Id: number) => api.get(`/skill/${Id}/likes`);

export const likeSkillCommentReply = (Id: number) =>
  api.post(`/skill/comment/${Id}/like`);

// Create Hobby

export const fetchHobbiesList = () => api.get('/hobbies/list');

export const createHobby = (data: any) => apiFile.post('/hobbies/create', data);

// Fetch all Hobbies for current user
export const fetchMyHobbies = () => api.get('/hobbies/feed/me');

// Fetch Hobbies by user ID
export const fetchHobbiesByUserId = (userId: number, page: number = 1) =>
  api.get(`/hobbies/feed/${userId}?page=${page}`);

// Hobby details by ID
export const getHobbyById = (hobbyId: number) => api.get(`/hobbies/${hobbyId}`);

// Edit Hobby by ID
export const editHobby = (hobbyId: number, data: any) =>
  apiFile.put(`/hobbies/${hobbyId}`, data);

export const addHobbyLikeUnlike = (Id: number) =>
  api.post(`/hobbies/feed/${Id}/like`);

export const addHobbyCommentReply = (Id: number, data: any) =>
  api.post(`/hobbies/feed/${Id}/comment`, data);

export const fetchHobbyComments = (Id: number) =>
  api.get(`/hobbies/feed/${Id}/comments`);

export const fetchHobbyLikes = (Id: number) =>
  api.get(`/hobbies/feed/${Id}/likes`);

export const likeHobbyCommentReply = (Id: number) =>
  api.post(`/hobbies/comment/${Id}/like`);

// Create Aspiration
export const createAspiration = (data: any) => {
  if (data instanceof FormData) {
    return apiFile.post('/aspirations/create', data);
  }
  return api.post('/aspirations/create', data);
};

// Fetch all Aspirations of current user
export const fetchMyAspirations = (page: number = 1) =>
  api.get(`/aspirations/feed/me?page=${page}`);

// Fetch Aspirations by specific User ID
export const fetchAspirationsByUserId = (userId: number, page: number = 1) =>
  api.get(`/aspirations/feed/user/${userId}?page=${page}`);

// Get Aspiration details by ID
export const getAspirationById = (aspirationId: number) =>
  api.get(`/aspirations/${aspirationId}`);

// Update Aspiration
export const editAspiration = (aspirationId: number, data: any) => {
  console.log(data, 'aspiration data');
  if (data instanceof FormData) {
    return apiFile.put(`/aspirations/${aspirationId}`, data);
  }
  return api.put(`/aspirations/${aspirationId}`, data);
};

export const addAspirationLikeUnlike = (Id: number) =>
  api.post(`/aspirations/feed/${Id}/like`);

export const addAspirationCommentReply = (Id: number, data: any) =>
  api.post(`/aspirations/feed/${Id}/comment`, data);

export const fetchAspirationComments = (Id: number) =>
  api.get(`/aspirations/feed/${Id}/comments`);

export const fetchAspirationLikes = (Id: number) =>
  api.get(`/aspirations/feed/${Id}/likes`);

export const likeAspirationCommentReply = (Id: number) =>
  api.post(`/aspirations/comment/${Id}/like`);

export const addSchool = (data: any) => {
  console.log('Adding school with data:', data);
  return apiFile.post('/education/schools', data);
};

export const addHobby = (data: any) => {
  console.log('Adding hobby with data:', data);
  return apiFile.post('/hobbies', data);
};

export const fetchNotifications = (page: number = 1) =>
  api.get(`/notifications?page=${page}`);

export const fetchUnreadNotificationCount = () =>
  api.get('/notifications/unread-count');

export const markNotificationAsRead = (notificationId: number) =>
  api.put(`/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  api.put('/notifications/read-all');

export const fetchEducationVerificationListById = (id: number) =>
  api.get(`/education/${id}/items`);

export const fetchHobbiesById = (id: number) => api.get(`/hobbies/${id}/items`);

export const fetchSkillList = () => api.get(`/skill/list`);

export const fetchMasterSkillList = () => api.get(`/master-skills/search`);

export const addMasterSkill = (data: any) => api.post('/master-skills', data);

export const sendHRVerificationRequest = (data: any) => {
  console.log(data, 'hr data');
  return api.post('/official-verification/request', data);
};

export const checkCompanyName = (query: string) =>
  api.get(`/companies/check-name?name=${query}`);

export const checkSchoolName = (query: string) =>
  api.get(`/education/schools/check-name?name=${query}`);

export const addSectionAchievement = (
  type: string,
  referenceId: number,
  data: any,
) => {
  console.log('Adding achievement with data:', type, referenceId, data);
  return apiFile.post(`/section-achievements/${type}/${referenceId}`, data);
};

export const updateSectionAchievement = (achievementId: number, data: any) => {
  console.log('Updating achievement with data:', achievementId, data);
  return apiFile.put(`/section-achievements/${achievementId}`, data);
};

export const toggleLikeSectionAchievement = (achievementId: number) => {
  console.log('Toggling like for achievement with ID:', achievementId);
  return api.post(`/section-achievements/${achievementId}/like`);
};

export const fetchLikeListSectionAchievement = (achievementId: number) => {
  console.log('Fetching like list for achievement with ID:', achievementId);
  return api.get(`/section-achievements/${achievementId}/likes`);
};

export const addCommentSectionAchievement = (
  achievementId: number,
  data: any,
) => {
  console.log('Adding comment for achievement with ID:', achievementId, data);
  return api.post(`/section-achievements/${achievementId}/comment`, data);
};

export const fetchCommentSectionAchievement = (achievementId: number) => {
  console.log('Fetching comment list for achievement with ID:', achievementId);
  return api.get(`/section-achievements/${achievementId}/comments`);
};

export const likeCommentSectionAchievement = (commentId: number) => {
  console.log('Liking comment with ID:', commentId);
  return api.post(`/section-achievements/comment/${commentId}/like`);
};

export const fetchSectionAchievementById = (achievementId: number) => {
  console.log('Fetching achievement with ID:', achievementId);
  return api.get(`/section-achievements/${achievementId}`);
};

export const sendOtp = (data: any) => api.post('/forgot-password', data);
export const verifyOtp = (data: any) => api.post('/verify-otp', data);
export const resetPassword = (data: any) => api.post('/reset-password', data);

export const fetchSocialCommentsById = (
  commentId: number,
  page: number = 1,
) => {
  console.log('Fetching comment list for comment with ID:', commentId);
  return api.get(`/social/comments/${commentId}/replies?page=${page}`);
};
