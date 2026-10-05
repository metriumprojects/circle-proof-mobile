import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Text>ChatScreen</Text>
      <ScrollView style={styles.container}></ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  container: {
    flex: 1,
  }
});

export default ChatScreen;
