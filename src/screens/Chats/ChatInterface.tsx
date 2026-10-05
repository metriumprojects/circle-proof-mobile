import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Mock data for different users and their chat messages
const mockUsers = {
  '1': {
    id: '1',
    name: 'Emery Lipshutz',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    isOnline: true,
  },
  '2': {
    id: '2',
    name: 'Paul Matusin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    isOnline: false,
  },
  '3': {
    id: '3',
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b5c99cf5?w=40&h=40&fit=crop&crop=face',
    isOnline: true,
  },
};

const mockChatMessages = {
  '1': [
    {
      id: '1',
      senderId: '3',
      senderName: 'Paul Gimes',
      message: 'Hi I\'m interested in a lesson with you. But I have a few questions',
      time: '11:55 PM',
      timestamp: new Date('2024-05-29T23:55:00'),
      isCurrentUser: false,
    },
    {
      id: '2',
      senderId: 'current',
      senderName: 'You',
      message: 'Hi nice to meet you.',
      time: '11:56 PM',
      timestamp: new Date('2024-05-29T23:56:00'),
      isCurrentUser: true,
    },
    {
      id: '3',
      senderId: '3',
      senderName: 'Paul Gimes',
      message: 'I would like to know if we could focus the session on youtube seo?',
      time: '01:00 AM',
      timestamp: new Date('2024-05-30T01:00:00'),
      isCurrentUser: false,
    },
  ],
  '2': [
    {
      id: '1',
      senderId: '2',
      senderName: 'Paul Matusin',
      message: 'Hey! How are you doing?',
      time: '10:30 AM',
      timestamp: new Date('2024-05-29T10:30:00'),
      isCurrentUser: false,
    },
    {
      id: '2',
      senderId: 'current',
      senderName: 'You',
      message: 'I\'m good! Thanks for asking. How about you?',
      time: '10:35 AM',
      timestamp: new Date('2024-05-29T10:35:00'),
      isCurrentUser: true,
    },
  ],
  '3': [
    {
      id: '1',
      senderId: '3',
      senderName: 'Sarah Johnson',
      message: 'Can we schedule a meeting for tomorrow?',
      time: '2:15 PM',
      timestamp: new Date('2024-05-29T14:15:00'),
      isCurrentUser: false,
    },
  ],
};

const ChatInterface = ({ userId, onBack }) => {
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user data and messages for the specific userId
    if (userId && mockUsers[userId]) {
      setUser(mockUsers[userId]);
      setMessages(mockChatMessages[userId] || []);
    }
  }, [userId]);

  const sendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        senderId: 'current',
        senderName: 'You',
        message: messageInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(),
        isCurrentUser: true,
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessageInput('');
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const ChatMessage = ({ item, index }) => {
    const showDateSeparator = index === 0 || 
      new Date(messages[index - 1].timestamp).toDateString() !== 
      new Date(item.timestamp).toDateString();

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>
              {formatDate(item.timestamp)}, {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </Text>
          </View>
        )}
        <View style={[
          styles.chatMessageContainer,
          item.isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
        ]}>
          {!item.isCurrentUser && (
            <View style={styles.senderInfo}>
              <View style={styles.senderAvatar}>
                <Text style={styles.senderInitial}>
                  {item.senderName.charAt(0)}
                </Text>
              </View>
              <View style={styles.messageWrapper}>
                <Text style={styles.senderName}>{item.senderName}</Text>
                <Text style={styles.messageTime}>{item.time}</Text>
                <View style={styles.chatBubble}>
                  <Text style={styles.chatMessageText}>{item.message}</Text>
                </View>
              </View>
            </View>
          )}
          {item.isCurrentUser && (
            <View style={styles.currentUserMessageWrapper}>
              <View style={[styles.chatBubble, styles.currentUserBubble]}>
                <Text style={[styles.chatMessageText, styles.currentUserText]}>
                  {item.message}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Image source={require('../../assets/icons/back.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        
        {/* Chat Header with User Info */}
        <View style={styles.chatHeader}>
          <Image source={{ uri: user.avatar }} style={styles.chatAvatar} />
          <View style={styles.chatHeaderInfo}>
            <View style={styles.userNameContainer}>
              <Text style={styles.chatHeaderName}>{user.name}</Text>
              {user.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <TouchableOpacity>
              <Text style={styles.seeProfile}>👁 See profile</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.moreOptionsButton}>
            <Text style={styles.moreOptionsText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          data={messages}
          renderItem={({ item, index }) => <ChatMessage item={item} index={index} />}
          keyExtractor={(item) => item.id}
          style={styles.chatMessagesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContainer}
        />

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraButton}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.micButton}>
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[styles.sendButton, messageInput.trim() && styles.sendButtonActive]} 
              onPress={sendMessage}
              disabled={!messageInput.trim()}
            >
              <Text style={[styles.sendIcon, messageInput.trim() && styles.sendIconActive]}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  seeProfile: {
    fontSize: 12,
    color: '#666',
  },
  moreOptionsButton: {
    padding: 8,
  },
  moreOptionsText: {
    fontSize: 16,
    color: '#666',
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateText: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
  },
  chatMessagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chatMessageContainer: {
    marginVertical: 4,
  },
  currentUserMessage: {
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '85%',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  senderInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageWrapper: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  chatBubble: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '100%',
  },
  currentUserMessageWrapper: {
    alignItems: 'flex-end',
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    marginLeft: 40,
  },
  chatMessageText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  currentUserText: {
    color: '#fff',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachButton: {
    marginRight: 16,
    padding: 4,
  },
  attachIcon: {
    fontSize: 18,
  },
  cameraButton: {
    marginRight: 16,
    padding: 4,
  },
  cameraIcon: {
    fontSize: 18,
  },
  micButton: {
    marginRight: 16,
    padding: 4,
  },
  micIcon: {
    fontSize: 18,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    maxHeight: 100,
    paddingVertical: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    marginLeft: 8,
    padding: 4,
    opacity: 0.5,
  },
  sendButtonActive: {
    opacity: 1,
  },
  sendIcon: {
    fontSize: 18,
    color: '#999',
  },
  sendIconActive: {
    color: '#007AFF',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
  backIcon : {
    fontSize: 24,
    color: '#000',
    height: 24,
    width: 24
  },
});

export default ChatInterface;