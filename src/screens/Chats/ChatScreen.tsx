import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {
  ChatMessage,
  ChatThread,
  ChatUser,
  deleteChatThread,
  fetchChatThreads,
  fetchProfile,
  fetchUserSuggestions,
  pinChatThread,
  searchUsers,
  spamChatThread,
} from '../../api/service';
import { getChatSocket } from '../../lib/chatSocket';
import ChatInterface from './ChatInterface';

interface ContactOption {
  id: string | number;
  fullName?: string;
  username?: string | null;
  email?: string;
  profilePicture?: string | null;
  bio?: string | null;
}

const formatThreadTimestamp = (dateInput?: string) => {
  if (!dateInput) {
    return '';
  }
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ChatScreen: React.FC = () => {
  const [currentView, setCurrentView] = useState<'messages' | 'newMessage' | 'chat'>(
    'messages',
  );
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedThread, setSelectedThread] = useState<{
    threadId?: string | number;
    userId?: string | number;
    otherUser?: ChatUser | null;
    isPinned?: boolean;
  } | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned'>(
    'all',
  );
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [contactSearch, setContactSearch] = useState('');
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedThreadIdRef = useRef<string | number | undefined>(undefined);
  const hasLoadedThreadsRef = useRef(false);

  useEffect(() => {
    selectedThreadIdRef.current = selectedThread?.threadId;
  }, [selectedThread]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await fetchProfile();
      const profile = res?.data?.data?.user || res?.data?.data || res?.data;
      const resolvedId = profile?.id ?? profile?._id ?? profile?.userId;
      if (resolvedId != null) {
        setCurrentUserId(String(resolvedId));
      }
    } catch {
      // Ignore if unauthenticated yet
    }
  }, []);

  const loadThreads = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoadingThreads(true);
    }
    try {
      const res = await fetchChatThreads();
      const list: ChatThread[] = res?.data?.data || [];
      setThreads(list);
      hasLoadedThreadsRef.current = true;
    } catch (err: any) {
      if (!opts?.silent) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load chats',
          text2: err?.response?.data?.message || 'Please try again.',
        });
      }
    } finally {
      setLoadingThreads(false);
      setRefreshing(false);
    }
  }, []);

  const handleThreadUpdated = useCallback(() => {
    loadThreads({ silent: true });
  }, [loadThreads]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useFocusEffect(
    useCallback(() => {
      loadThreads({ silent: hasLoadedThreadsRef.current });
    }, [loadThreads]),
  );

  // Live thread preview + unread count updates via Socket.IO
  useEffect(() => {
    let isMounted = true;
    let activeSocket: any = null;

    const handleIncomingMessage = (msg: ChatMessage) => {
      if (!isMounted || !msg) {
        return;
      }
      let matched = false;
      setThreads(prev =>
        prev.map(thread => {
          if (String(thread.id) !== String(msg.conversationId)) {
            return thread;
          }
          matched = true;
          const isOwn = currentUserId
            ? String(msg.senderId) === currentUserId
            : Boolean(
                thread.otherUserId != null &&
                  String(msg.senderId) !== String(thread.otherUserId),
              );
          const isOpen =
            selectedThreadIdRef.current != null &&
            String(selectedThreadIdRef.current) === String(msg.conversationId);
          return {
            ...thread,
            lastMessage: {
              id: msg.id,
              body: msg.body,
              createdAt: msg.createdAt,
              senderId: msg.senderId,
              sender: msg.sender,
            },
            lastMessageAt: msg.createdAt,
            unreadCount:
              isOpen || isOwn
                ? thread.unreadCount || 0
                : (thread.unreadCount || 0) + 1,
          };
        }),
      );
      if (!matched) {
        loadThreads({ silent: true });
      }
    };

    getChatSocket()
      .then(socket => {
        if (!isMounted) {
          return;
        }
        activeSocket = socket;
        socket.on('message:new', handleIncomingMessage);
      })
      .catch(err => {
        console.warn('[ChatScreen] Socket listener setup warning:', err);
      });

    return () => {
      isMounted = false;
      if (activeSocket) {
        activeSocket.off('message:new', handleIncomingMessage);
      }
    };
  }, [currentUserId, loadThreads]);

  // Fetch initial suggestions when entering New Message view
  const loadSuggestedContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await fetchUserSuggestions(20);
      const list: ContactOption[] = res?.data?.data?.suggestions || [];
      setContacts(
        list.filter(u => !currentUserId || String(u.id) !== currentUserId),
      );
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentView !== 'newMessage') {
      return;
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const trimmed = contactSearch.trim();
    if (!trimmed) {
      loadSuggestedContacts();
      return;
    }

    setLoadingContacts(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(trimmed);
        const foundUsers: ContactOption[] = res?.data?.data?.users || [];
        setContacts(
          foundUsers.filter(u => !currentUserId || String(u.id) !== currentUserId),
        );
      } catch {
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [contactSearch, currentView, currentUserId, loadSuggestedContacts]);

  const filteredThreads = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return [...threads]
      .filter(thread => {
        if (activeFilter === 'unread' && !(thread.unreadCount && thread.unreadCount > 0)) {
          return false;
        }
        if (activeFilter === 'pinned' && !thread.isPinned) {
          return false;
        }
        if (!q) {
          return true;
        }
        const name = (
          thread.otherUser?.fullName ||
          thread.otherUser?.username ||
          ''
        ).toLowerCase();
        const preview = (thread.lastMessage?.body || '').toLowerCase();
        return name.includes(q) || preview.includes(q);
      })
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        const timeA = new Date(
          a.lastMessage?.createdAt || a.lastMessageAt || 0,
        ).getTime();
        const timeB = new Date(
          b.lastMessage?.createdAt || b.lastMessageAt || 0,
        ).getTime();
        return timeB - timeA;
      });
  }, [threads, searchTerm, activeFilter]);

  const openThread = (thread: ChatThread) => {
    setActiveTooltip(null);
    setThreads(prev =>
      prev.map(t =>
        String(t.id) === String(thread.id) ? { ...t, unreadCount: 0 } : t,
      ),
    );
    setSelectedThread({
      threadId: thread.id,
      userId: thread.otherUserId ?? thread.otherUser?.id,
      otherUser: thread.otherUser ?? null,
      isPinned: Boolean(thread.isPinned),
    });
    setCurrentView('chat');
  };

  const startConversationWithContact = (contact: ContactOption) => {
    const existing = threads.find(
      t =>
        t.otherUserId != null &&
        String(t.otherUserId) === String(contact.id),
    );
    setSelectedThread({
      threadId: existing?.id,
      userId: contact.id,
      otherUser: {
        id: contact.id,
        fullName: contact.fullName,
        username: contact.username ?? undefined,
        email: contact.email,
        profilePicture: contact.profilePicture,
      },
      isPinned: Boolean(existing?.isPinned),
    });
    setCurrentView('chat');
  };

  const handleTooltipAction = async (
    action: 'delete' | 'spam' | 'pin',
    thread: ChatThread,
  ) => {
    setActiveTooltip(null);
    try {
      if (action === 'delete') {
        await deleteChatThread(thread.id);
        setThreads(prev => prev.filter(t => String(t.id) !== String(thread.id)));
        Toast.show({ type: 'success', text1: 'Conversation deleted' });
      } else if (action === 'spam') {
        await spamChatThread(thread.id);
        setThreads(prev => prev.filter(t => String(t.id) !== String(thread.id)));
        Toast.show({ type: 'success', text1: 'Marked as spam' });
      } else if (action === 'pin') {
        const nextPinned = !thread.isPinned;
        await pinChatThread(thread.id, nextPinned);
        setThreads(prev =>
          prev.map(t =>
            String(t.id) === String(thread.id)
              ? { ...t, isPinned: nextPinned }
              : t,
          ),
        );
        Toast.show({
          type: 'success',
          text1: nextPinned ? 'Pinned to top' : 'Unpinned conversation',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: err?.response?.data?.message || 'Please try again.',
      });
    }
  };

  const handleBackFromSubView = () => {
    setSelectedThread(null);
    setCurrentView('messages');
    loadThreads({ silent: true });
  };

  if (currentView === 'chat' && selectedThread) {
    return (
      <ChatInterface
        threadId={selectedThread.threadId}
        userId={selectedThread.userId}
        otherUser={selectedThread.otherUser}
        initialPinned={selectedThread.isPinned}
        onBack={handleBackFromSubView}
        onThreadUpdated={handleThreadUpdated}
      />
    );
  }

  if (currentView === 'newMessage') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setContactSearch('');
              setCurrentView('messages');
            }}
          >
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search people by name or username..."
            placeholderTextColor="#666"
            value={contactSearch}
            onChangeText={setContactSearch}
            autoCapitalize="none"
          />
          {contactSearch.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setContactSearch('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingContacts ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.stateText}>Finding people...</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={item => String(item.id)}
            style={styles.contactsList}
            renderItem={({ item }) => {
              const displayName =
                item.fullName || item.username || item.email || 'User';
              const initial = displayName.charAt(0).toUpperCase();
              return (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => startConversationWithContact(item)}
                >
                  {item.profilePicture ? (
                    <Image
                      source={{ uri: item.profilePicture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </View>
                  )}
                  <View style={styles.contactContent}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.contactTitle} numberOfLines={1}>
                      {item.username ? `@${item.username}` : item.bio || 'Circle Proof member'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.centerState}>
                <Text style={styles.stateText}>
                  {contactSearch.trim()
                    ? 'No matching users found.'
                    : 'Search by name or username to start a conversation.'}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchTerm('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'unread', 'pinned'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.newMessageButton}
        onPress={() => setCurrentView('newMessage')}
      >
        <Text style={styles.newMessageIcon}>✉</Text>
        <Text style={styles.newMessageText}>New message</Text>
      </TouchableOpacity>

      {loadingThreads ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.stateText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredThreads}
          keyExtractor={item => String(item.id)}
          style={styles.messagesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadThreads({ silent: true });
              }}
            />
          }
          renderItem={({ item }) => {
            const peerName =
              item.otherUser?.fullName ||
              item.otherUser?.username ||
              item.otherUser?.email ||
              'User';
            const initial = peerName.charAt(0).toUpperCase();
            const previewText = item.lastMessage?.body || 'No messages yet';
            const timestamp = formatThreadTimestamp(
              item.lastMessage?.createdAt || item.lastMessageAt,
            );
            const unread = item.unreadCount || 0;
            const threadIdStr = String(item.id);

            return (
              <View style={styles.messageItemContainer}>
                <TouchableOpacity
                  style={styles.messageItem}
                  onPress={() => openThread(item)}
                >
                  {item.otherUser?.profilePicture ? (
                    <Image
                      source={{ uri: item.otherUser.profilePicture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </View>
                  )}
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageName} numberOfLines={1}>
                        {item.isPinned ? `📌 ${peerName}` : peerName}
                      </Text>
                      <Text style={styles.messageTime}>{timestamp}</Text>
                    </View>
                    <Text style={styles.messageText} numberOfLines={1}>
                      {previewText}
                    </Text>
                  </View>
                  {unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.moreButtonContainer}>
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() =>
                      setActiveTooltip(
                        activeTooltip === threadIdStr ? null : threadIdStr,
                      )
                    }
                  >
                    <Text style={styles.moreText}>⋯</Text>
                  </TouchableOpacity>
                  {activeTooltip === threadIdStr && (
                    <View style={styles.tooltip}>
                      <TouchableOpacity
                        style={styles.tooltipItem}
                        onPress={() => handleTooltipAction('pin', item)}
                      >
                        <Text style={styles.tooltipText}>
                          {item.isPinned ? 'Unpin chat' : 'Pin to top'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.tooltipItem}
                        onPress={() => handleTooltipAction('spam', item)}
                      >
                        <Text style={styles.tooltipText}>Mark as spam</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tooltipItem, styles.tooltipItemLast]}
                        onPress={() => handleTooltipAction('delete', item)}
                      >
                        <Text style={[styles.tooltipText, styles.dangerText]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.stateText}>
                {searchTerm.trim()
                  ? 'No conversations match your search.'
                  : 'No messages yet. Tap "New message" to start chatting!'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f2f2f2',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  newMessageIcon: {
    fontSize: 18,
    color: '#1976d2',
    marginRight: 12,
  },
  newMessageText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messageItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  messageItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
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
    flex: 1,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreButtonContainer: {
    position: 'relative',
  },
  moreButton: {
    padding: 12,
  },
  moreText: {
    fontSize: 18,
    color: '#999',
  },
  tooltip: {
    position: 'absolute',
    right: 12,
    top: 38,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tooltipItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tooltipItemLast: {
    borderBottomWidth: 0,
  },
  tooltipText: {
    fontSize: 14,
    color: '#333',
  },
  dangerText: {
    color: '#D32F2F',
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
    fontSize: 13,
    color: '#666',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ChatScreen;
