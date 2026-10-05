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

// Define TypeScript interfaces
interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  time: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

interface ChatMessageProps {
  item: Message;
  index: number;
}

interface ChatInterfaceProps {
  userId: string;
  onBack: () => void;
}

  // Mock data for different users and their chat messages
const mockUsers: Record<string, User> = {
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
  '4': {
    id: '4',
    name: 'Paul Mood',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
    isOnline: true,
  },
};

// Mock data for current user
const currentUser = {
  id: 'current',
  name: 'You',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', // Default avatar for current user
};

const mockChatMessages: Record<string, Message[]> = {
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
  '4': [
    {
      id: '1',
      senderId: '4',
      senderName: 'Paul Mood',
      message: 'Looking forward to our collaboration!',
      time: '3:45 PM',
      timestamp: new Date('2024-05-29T15:45:00'),
      isCurrentUser: false,
    },
  ],
};

// Mock messages for the main messages list
const mockMessages = [
  {
    id: '1',
    userId: '1', // Link to mockUsers
    name: 'Emery Lipshutz',
    message: 'Hi thanks for getting back to me. I just wanted to d...',
    time: '11:55 PM',
    unreadCount: 2,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
  },
  {
    id: '2',
    userId: '2', // Link to mockUsers
    name: 'Paul Matusin',
    message: 'Hey! How are you doing?',
    time: '10:35 AM',
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
  },
  {
    id: '3',
    userId: '3', // Link to mockUsers
    name: 'Sarah Johnson',
    message: 'Can we schedule a meeting for tomorrow?',
    time: '2:15 PM',
    unreadCount: 1,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b5c99cf5?w=40&h=40&fit=crop&crop=face',
  },
  {
    id: '4',
    userId: '4', // Link to mockUsers
    name: 'Paul Mood',
    message: 'Looking forward to our collaboration!',
    time: '3:45 PM',
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
  },
];

const mockContacts = [
  {
    id: '1',
    userId: '1',
    name: 'Emery Lipshutz',
    title: 'UI/UX Designer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
  },
  {
    id: '2',
    userId: '2',
    name: 'Paul Matusin',
    title: 'Head of sales at Google',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
  },
  {
    id: '3',
    userId: '4',
    name: 'Paul Mood',
    title: 'Head of sales at Google',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
  },
  {
    id: '4',
    userId: '3',
    name: 'Sarah Johnson',
    title: 'Product Manager',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b5c99cf5?w=40&h=40&fit=crop&crop=face',
  },
];

// Chat Interface Component
const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId, onBack }) => {
  const [messageInput, setMessageInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showChatTooltip, setShowChatTooltip] = useState<boolean>(false);

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

  const handleChatTooltipAction = (action) => {
    console.log(`Chat ${action} action for user ${userId}`);
    // Add your logic here for each action
    switch (action) {
      case 'mute':
        // Handle mute conversation logic
        break;
      case 'block':
        // Handle block user logic
        break;
      case 'report':
        // Handle report user logic
        break;
      case 'clear':
        // Handle clear chat history logic
        break;
      default:
        break;
    }
    setShowChatTooltip(false);
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

  const ChatMessage = ({ item, index }: ChatMessageProps) => {
    const showDateSeparator = index === 0 ||
      new Date(messages[index - 1].timestamp).toDateString() !==
      new Date(item.timestamp).toDateString();

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>
              {formatDate(item.timestamp)}
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
                {/* <Text style={styles.senderName}>{item.senderName}</Text> */}
                <View style={styles.chatBubble}>
                  <Text style={styles.chatMessageText}>{item.message}</Text>
                  <Text style={styles.senderMessageTime}>{item.time}</Text>
                </View>
              </View>
            </View>
          )}
          {item.isCurrentUser && (
            <View style={styles.currentUserMessageWrapper}>
              <View style={styles.currentUserWithAvatar}>
                <View style={[styles.chatBubble, styles.currentUserBubble]}>
                  <Text style={[styles.chatMessageText, styles.currentUserText]}>
                    {item.message}
                  </Text>
                  <Text style={styles.currentUserMessageTime}>{item.time}</Text>
                </View>
                <Image source={{ uri: currentUser.avatar }} style={styles.currentUserAvatarImage} />
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
          <TouchableOpacity
            style={styles.chatOverlay}
            activeOpacity={1}
            onPress={() => setShowChatTooltip(false)}
          >
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
          </TouchableOpacity>
          <View style={styles.chatMoreButtonContainer}>
            <TouchableOpacity
              style={styles.moreOptionsButton}
              onPress={() => setShowChatTooltip(!showChatTooltip)}
            >
              <Text style={styles.moreOptionsText}>⋯</Text>
            </TouchableOpacity>
            {showChatTooltip && (
              <View style={styles.chatTooltip}>
                <TouchableOpacity
                  style={styles.tooltipItem}
                  onPress={() => handleChatTooltipAction('mute')}
                >
                  <Text style={styles.tooltipText}>🔇 Mute conversation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tooltipItem}
                  onPress={() => handleChatTooltipAction('block')}
                >
                  <Text style={styles.tooltipText}>🚫 Block user</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tooltipItem}
                  onPress={() => handleChatTooltipAction('report')}
                >
                  <Text style={styles.tooltipText}>⚠️ Report user</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tooltipItem, styles.tooltipItemLast]}
                  onPress={() => handleChatTooltipAction('clear')}
                >
                  <Text style={styles.tooltipText}>🗑 Clear chat history</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Messages List */}
        <TouchableOpacity
          style={styles.chatMessagesOverlay}
          activeOpacity={1}
          onPress={() => setShowChatTooltip(false)}
        >
          <FlatList
            data={messages}
            renderItem={({ item, index }) => <ChatMessage item={item} index={index} />}
            keyExtractor={(item) => item.id}
            style={styles.chatMessagesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContainer}
          />
        </TouchableOpacity>

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraButton}>
             <Image source={require('../../assets/icons/video.png')} style={{width: 30, height: 30}} />
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.micButton}>
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity> */}
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

// Main Chat App Component
const ChatApp = () => {
  const [currentScreen, setCurrentScreen] = useState<string>('messages'); // 'messages', 'newMessage', 'chat'
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const navigateToChat = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentScreen('chat');
  };

  const navigateBack = () => {
    if (currentScreen === 'chat') {
      setCurrentScreen('messages');
      setSelectedUserId(null);
    } else if (currentScreen === 'newMessage') {
      setCurrentScreen('messages');
    }
  };

  const handleTooltipAction = (action: string, messageId: string) => {
    console.log(`${action} action for message ${messageId}`);
    // Add your logic here for each action
    switch (action) {
      case 'delete':
        // Handle delete logic
        break;
      case 'spam':
        // Handle mark as spam logic
        break;
      case 'pin':
        // Handle pin to top logic
        break;
      default:
        break;
    }
    setActiveTooltip(null);
  };

  const MessageItem = ({ item }: { item: any }) => (
    <View style={styles.messageItemContainer}>
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => navigateToChat(item.userId)}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageName}>{item.name}</Text>
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.message}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.moreButtonContainer}>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setActiveTooltip(activeTooltip === item.id ? null : item.id)}
        >
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
        {activeTooltip === item.id && (
          <View style={styles.tooltip}>
            <TouchableOpacity
              style={styles.tooltipItem}
              onPress={() => handleTooltipAction('delete', item.id)}
            >
              <Text style={styles.tooltipText}>🗑 Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tooltipItem}
              onPress={() => handleTooltipAction('spam', item.id)}
            >
              <Text style={styles.tooltipText}>⚠️ Mark as spam</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tooltipItem, styles.tooltipItemLast]}
              onPress={() => handleTooltipAction('pin', item.id)}
            >
              <Text style={styles.tooltipText}>📌 Pin to top</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const ContactItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => navigateToChat(item.userId)}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.contactContent}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const MessagesScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
        {/* <Image source={require('../../assets/icons/back.png')} style={styles.backIcon} /> */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchIcon}>
          <Text>🔍</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.newMessageButton}
        onPress={() => setCurrentScreen('newMessage')}
      >
        <Text style={styles.newMessageIcon}>✉</Text>
        <Text style={styles.newMessageText}>New message</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setActiveTooltip(null)}
      >
        <FlatList
          data={mockMessages}
          renderItem={({ item }) => <MessageItem item={item} />}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );

  const NewMessageScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigateBack}
        >
          <Image source={require('../../assets/icons/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchIcon}>
          <Text>🔍</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockContacts}
        renderItem={({ item }) => <ContactItem item={item} />}
        keyExtractor={(item) => item.id}
        style={styles.contactsList}
      />
    </SafeAreaView>
  );

  // Render based on current screen
  if (currentScreen === 'chat' && selectedUserId) {
    return <ChatInterface userId={selectedUserId} onBack={navigateBack} />;
  }

  return currentScreen === 'messages' ? <MessagesScreen /> : <NewMessageScreen />;
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
    marginTop: 24,
  },
  backButton: {
    marginRight: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  searchIcon: {
    padding: 4,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  newMessageIcon: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  newMessageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messageItemContainer: {
    position: 'relative',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  overlay: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  unreadBadge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreButtonContainer: {
    position: 'absolute',
    right: 16,
    top: 12,
    zIndex: 1000,
  },
  moreButton: {
    padding: 8,
  },
  moreText: {
    fontSize: 16,
    color: '#666',
  },
  tooltip: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 150,
    zIndex: 1001,
  },
  tooltipItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tooltipItemLast: {
    borderBottomWidth: 0,
  },
  tooltipText: {
    fontSize: 14,
    color: '#000',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactContent: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  contactTitle: {
    fontSize: 14,
    color: '#666',
  },
  // Chat Interface Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    position: 'relative',
  },
  chatOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatMoreButtonContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  chatMessagesOverlay: {
    flex: 1,
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
  chatTooltip: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 180,
    zIndex: 1001,
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
    marginVertical: 12,
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
    backgroundColor: '#000000ff',
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
  currentUserWithAvatar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  currentUserAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8, // Avatar appears after the message in the row for current user
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  senderMessageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  currentUserMessageTime: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'right',
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
  backIcon:{
    height: 20,
    width: 20
  }
  
});

export default ChatApp;
