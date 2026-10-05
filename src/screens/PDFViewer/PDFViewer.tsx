import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  pdfUrl?: string;
  title?: string;
}

const PDFViewer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { pdfUrl, title } = (route.params as RouteParams) || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    console.log(`Number of pages: ${numberOfPages}`);
    setTotalPages(numberOfPages);
    setLoading(false);
  };

  const handleError = (error: any) => {
    console.log(`PDF Error: ${error}`);
    setError(error.message || 'Failed to load PDF');
    setLoading(false);
  };

  // Add headers to handle potential authentication or security issues
  const pdfHeaders = {
    'Cache-Control': 'no-cache',
    'Accept': 'application/pdf',
    'Content-Type': 'application/pdf',
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button and title */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Image source={require('../../assets/icons/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || (pdfUrl ? pdfUrl.split('/').pop() : 'PDF Document')}
        </Text>
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {currentPage} / {totalPages}
          </Text>
        </View>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error" size={48} color="#e74c3c" style={styles.errorIcon} />
          <Text style={styles.errorText}>Error loading PDF</Text>
          <Text style={styles.errorSubText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setError(null)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : pdfUrl ? (
        <>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          <Pdf
            source={{ uri: pdfUrl, headers: pdfHeaders }}
            trustAllCerts={false}
            style={styles.pdf}
            onLoadComplete={handleLoadComplete}
            onPageChanged={(page, numberOfPages) => {
              setCurrentPage(page);
            }}
            onError={handleError}
            onPressLink={(uri) => {
              console.log(`Link pressed: ${uri}`);
            }}
            enablePaging={true}
            fitPolicy={2} // Fit width
            horizontal={false}
          />
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Icon name="error" size={48} color="#e74c3c" style={styles.errorIcon} />
          <Text style={styles.errorText}>No PDF URL provided</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: "12%",
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    zIndex: 1,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
 headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
  pageIndicator: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 15,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
});

export default PDFViewer;
