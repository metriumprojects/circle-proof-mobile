import { View, StyleSheet, ScrollView, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import FeedBox from '../components/FeedBox';
import Header from '../components/Header';

const PostScreen = () => {
  const handlePostCreated = () => {
    // Handle post creation callback if needed
    console.log('Post created successfully');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Create Post"/>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <FeedBox isPostScreen={true} onPostCreated={handlePostCreated} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 0,
    paddingBottom: 20,
  },
});

export default PostScreen;
