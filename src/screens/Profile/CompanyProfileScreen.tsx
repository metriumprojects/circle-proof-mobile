import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getCompanyById } from '../../api/service';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const CompanyProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('Employees');
  const [isVerifiedEmployee, setIsVerifiedEmployee] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<number | null>(null);

   // Extract company ID from route params
  useEffect(() => {
    if (route.params && (route.params as any).companyId) {
      setCompanyId((route.params as any).companyId);
    } else if (route.params && (route.params as any).id) {
      setCompanyId((route.params as any).id);
    }
  }, [route.params]);

  // Fetch company data when component mounts and company ID is available
  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await getCompanyById(companyId!);
      if (response.data.success) {
        const company = response.data.data.company;
        // Format the company data to match the UI structure
        const formattedData = {
          id: company.id,
          name: company.name,
          handle: `@${company.uniqueAddress}`,
          location: company.location,
          joinedDate: `Joined ${new Date(company.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          followers: '167882', // Placeholder - would come from API
          following: '38', // Placeholder - would come from API
          website: company.website,
          logo: company.logo, // Use the actual logo URL from the API
          verified: company.isVerified,
          industry: company.industry, // Added industry field
          organizationSize: company.organizationSize, // Added organization size field
          shortDescription: company.shortDescription, // Added short description field
          employees: company.positions.map((position: any) => ({
            id: position.id,
            name: position.user.fullName,
            position: position.title,
            avatar: position.user.profilePicture,
            userId: position.userId,
          })),
        };
        setCompanyData(formattedData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch company data');
      }
    } catch (error) {
      console.log('Error fetching company data:', error.response);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load company data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#57B915" />
          <Text style={styles.loadingText}>Loading company profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!companyData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Company not found</Text>
        </View>
      </SafeAreaView>
    );
  }

   const    renderEmployeeCard = (employee: any, index: number) => (
    <View key={employee.id} style={styles.employeeCard}>
      <View style={styles.employeeHeader}>
        <Image source={employee.avatar} style={styles.employeeAvatar} />
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{employee.name}</Text>
          <Text style={styles.employeePosition}>{employee.position}</Text>
        </View>
      </View>
      <View style={styles.employeeActions}>
        <TouchableOpacity style={styles.followButton}>
          <Image source={require('../../assets/icons/add.png')} style={styles.followButtonIcon} />
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Image source={require('../../assets/icons/chat.png')} style={styles.messageButtonIcon} />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
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
          <Text style={styles.headerTitle}>Company Profile</Text>
        </View>
        
        <View style={styles.content}>
          {/* Company Logo */}
          <View style={styles.logoContainer}>
            <Image source={{ uri: companyData.logo }} style={styles.companyLogo} />
          </View>

          {/* Company Header Section */}
          <View style={styles.companyHeader}>
            <View style={styles.companyInfo}>
              <View style={styles.companyNameContainer}>
                <Text style={styles.companyName}>{companyData.name}</Text>
                {companyData.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedCheckmark}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.companyHandle}>{companyData.handle}</Text>
              <Text style={styles.companyLocation}>{companyData.location}</Text>
              <View style={styles.joinedContainer}>
                <Image 
                  source={require('../../assets/icons/calendar.png')} 
                  style={styles.calendarIcon}
                />
                <Text style={styles.joinedDate}>{companyData.joinedDate}</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{companyData.followers}</Text>
                  <Text style={styles.statLabel}> Followers</Text>
                </Text>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{companyData.following}</Text>
                  <Text style={styles.statLabel}> Following</Text>
                </Text>
              </View>
              
              <Text style={styles.website}>{companyData.website}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.followButtonLarge}>
              <Image source={require('../../assets/icons/add.png')} style={styles.followButtonLargeIcon} />
              <Text style={styles.followButtonLargeText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButtonLarge}>
              <Image source={require('../../assets/icons/chat.png')} style={styles.messageButtonLargeIcon} />
              <Text style={styles.messageButtonLargeText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Feed' && styles.activeTab]}
              onPress={() => setActiveTab('Feed')}
            >
              <Text style={[styles.tabText, activeTab === 'Feed' && styles.activeTabText]}>
                Feed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Employees' && styles.activeTab]}
              onPress={() => setActiveTab('Employees')}
            >
              <Text style={[styles.tabText, activeTab === 'Employees' && styles.activeTabText]}>
                Employees
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Verified Employees' && styles.activeTab]}
              onPress={() => setActiveTab('Verified Employees')}
            >
              <Text style={[styles.tabText, activeTab === 'Verified Employees' && styles.activeTabText]}>
                Verified Employees
              </Text>
            </TouchableOpacity>
          </View>

          {/* Employees List */}
          <View style={styles.employeesSection}>
            {companyData.employees.map(renderEmployeeCard)}
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    marginBottom: 16,
    alignItems: 'center',
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  companyHeader: {
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  companyInfo: {
    alignItems: 'center',
    width: '100%',
  },
  companyNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyHandle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  companyLocation: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: '#666666',
  },
  joinedDate: {
    fontSize: 13,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'center',
  },
  statText: {
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  website: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  followButtonLarge: {
    flex: 1,
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  followButtonLargeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  messageButtonLarge: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  messageButtonLargeText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedEmployeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  verifiedEmployeeLabel: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    marginRight: 10,
  },
  toggleButton: {
    width: 50,
    height: 24,
    backgroundColor: '#ccc',
    borderRadius: 12,
    justifyContent: 'center',
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#FF5101',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    transform: [{ translateX: 0 }],
  },
  toggleKnobActive: {
    transform: [{ translateX: 26 }],
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  employeesSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
   employeeCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  employeeInfo: {
    flex: 1,
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  employeePosition: {
    fontSize: 13,
    color: '#666666',
  },
    employeeActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  followButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  followButtonIcon: {
    width: 14,
    height: 14,
    tintColor: '#ffffff',
    marginRight: 6,
  },
  messageButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '500',
  },
  messageButtonIcon: {
    width: 14,
    height: 14,
    tintColor: '#000000',
    marginRight: 6,
  },
  followButtonLargeIcon: {
    width: 20,
    height: 20,
    tintColor: '#ffffff',
    marginRight: 8,
  },
  messageButtonLargeIcon: {
    width: 20,
    height: 20,
    tintColor: '#000000',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default CompanyProfileScreen;
