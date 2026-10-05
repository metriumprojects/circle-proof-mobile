import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getCompanies } from '../../api/service';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

interface Company {
  id: number;
  name: string;
  logo: string | null;
  industry: string;
  location: string;
}

const CompaniesScreen = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const navigation = useNavigation<any>();

  const fetchCompanies = async () => {
    try {
      const response = await getCompanies();
      if (response.data.success) {
        setCompanies(response.data.data.companies);
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
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanies();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#57B915" />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      </SafeAreaView>
    );
 }

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <Text style={styles.headerTitle}>Companies</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {companies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No companies found</Text>
          </View>
        ) : (
          <View style={styles.companiesContainer}>
            {companies.map((company) => (
              <TouchableOpacity
                key={company.id}
                style={styles.companyCard}
                onPress={() => {
                  // Navigate to company profile screen
                  navigation.navigate('CompanyProfile', { 
                    companyId: company.id,
                    companyName: company.name,
                    companyLogo: company.logo,
                    companyIndustry: company.industry,
                    companyLocation: company.location
                  });
                }}
              >
                <View style={styles.companyHeader}>
                  {company.logo ? (
                    <Image
                      source={{ uri: company.logo }}
                      style={styles.companyLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.companyLogoPlaceholder}>
                      <Text style={styles.companyLogoText}>
                        {company.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text style={styles.companyIndustry}>{company.industry}</Text>
                    <Text style={styles.companyLocation}>{company.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#66666',
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
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  companiesContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  companyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 2,
    marginRight: 15,
  },
  companyLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 2,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  companyLogoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#66666',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 14,
    color: '#66666',
    marginBottom: 2,
  },
  companyLocation: {
    fontSize: 13,
    color: '#999999',
  },
});

export default CompaniesScreen;
