import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {
  ChatMessage,
  ChatThread,
  ChatUser,
  deleteChatThread,
  fetchChatMessages,
  fetchChatThreads,
  fetchProfile,
  fetchSpecificUserProfileStats,
  getOrCreateChatThread,
  pinChatThread,
  sendChatMessage,
  spamChatThread,
} from '../../api/service';
import { getChatSocket } from '../../lib/chatSocket';

type UIMessage = ChatMessage & {
  pending?: boolean;
  failed?: boolean;
};

export interface ChatInterfaceProps {
  userId?: string | number;
  threadId?: string | number;
  otherUser?: ChatUser | null;
  initialPinned?: boolean;
  onBack?: () => void;
  onThreadUpdated?: () => void;
  route?: {
    params?: {
      userId?: string | number;
      threadId?: string | number;
      otherUser?: ChatUser | null;
      initialPinned?: boolean;
    };
  };
}

interface SendMessageAck {
  ok?: boolean;
  message?: ChatMessage;
  error?: string;
}

const formatDateLabel = (dateInput?: string | Date) => {
  if (!dateInput) {
    return '';
  }
  const messageDate = new Date(dateInput);
  if (Number.isNaN(messageDate.getTime())) {
    return '';
  }
  const today = new Date();
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
    day: 'numeric',
  });
};

const formatMessageTime = (dateInput?: string | Date) => {
  if (!dateInput) {
    return '';
  }
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatInterface: React.FC<ChatInterfaceProps> = props => {
  const navigation = useNavigation<any>();
  const hookRoute = useRoute<any>();
  const routeParams = props.route?.params ?? hookRoute?.params ?? {};

  const targetUserId = props.userId ?? routeParams.userId;
  const initialThreadId = props.threadId ?? routeParams.threadId;
  const initialOtherUser = props.otherUser ?? routeParams.otherUser ?? null;
  const { onBack, onThreadUpdated } = props;

  const [activeThreadId, setActiveThreadId] = useState<string | number | null>(
    initialThreadId ?? null,
  );
  const [peerUser, setPeerUser] = useState<ChatUser | null>(initialOtherUser);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showChatTooltip, setShowChatTooltip] = useState(false);
  const [isPinned, setIsPinned] = useState(
    Boolean(props.initialPinned ?? routeParams.initialPinned),
  );

  const flatListRef = useRef<FlatList<UIMessage> | null>(null);
  const onThreadUpdatedRef = useRef(onThreadUpdated);
  onThreadUpdatedRef.current = onThreadUpdated;
  const initialOtherUserRef = useRef(initialOtherUser);
  initialOtherUserRef.current = initialOtherUser;

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, onBack]);

  useEffect(() => {
    if (initialThreadId != null) {
      setActiveThreadId(initialThreadId);
    }
  }, [initialThreadId]);

  useEffect(() => {
    if (initialOtherUser) {
      setPeerUser(initialOtherUser);
    }
  }, [initialOtherUser]);

  // Resolve current authenticated Mongo user ID
  useEffect(() => {
    let cancelled = false;
    const loadMe = async () => {
      try {
        const res = await fetchProfile();
        const profile = res?.data?.data?.user || res?.data?.data || res?.data;
        const resolvedId = profile?.id ?? profile?._id ?? profile?.userId;
        if (!cancelled && resolvedId != null) {
          setCurrentUserId(String(resolvedId));
        }
      } catch {
        // Fallback comparison with peerUserId handles alignment
      }
    };
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve threadId, peer profile metadata, and initial messages
  useEffect(() => {
    let cancelled = false;

    const initializeConversation = async () => {
      if (initialThreadId == null && targetUserId == null) {
        setErrorMsg('Conversation user not specified.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        let resolvedThreadId: string | number | null = initialThreadId ?? null;

        if (resolvedThreadId == null && targetUserId != null) {
          const threadRes = await getOrCreateChatThread(targetUserId);
          const threadPayload =
            threadRes?.data?.data || threadRes?.data;
          resolvedThreadId = threadPayload?.id ?? threadPayload?._id ?? null;
          if (!cancelled && threadPayload?.isPinned != null) {
            setIsPinned(Boolean(threadPayload.isPinned));
          }
        }

        if (resolvedThreadId == null) {
          throw new Error('Could not initialize conversation');
        }

        if (!cancelled) {
          setActiveThreadId(resolvedThreadId);
        }

        // Load messages
        const messagesRes = await fetchChatMessages(resolvedThreadId, 1, 50);
        const rows: ChatMessage[] =
          messagesRes?.data?.data?.messages || [];
        if (!cancelled) {
          setMessages([...rows].reverse());
          onThreadUpdatedRef.current?.();
        }

        // Populate peer user info if missing fullName/avatar
        if (!initialOtherUserRef.current?.fullName) {
          try {
            const threadsRes = await fetchChatThreads();
            const threads: ChatThread[] = threadsRes?.data?.data || [];
            const matchedThread = threads.find(
              t =>
                String(t.id) === String(resolvedThreadId) ||
                (targetUserId != null &&
                  String(t.otherUserId) === String(targetUserId)),
            );
            if (!cancelled && matchedThread) {
              setIsPinned(Boolean(matchedThread.isPinned));
              if (matchedThread.otherUser) {
                setPeerUser(matchedThread.otherUser);
                return;
              }
            }
          } catch {
            // Try stats endpoint next
          }

          if (targetUserId != null) {
            try {
              const statsRes = await fetchSpecificUserProfileStats(targetUserId);
              const stats = statsRes?.data?.data?.stats;
              if (!cancelled && stats) {
                setPeerUser({
                  id: stats.userId ?? targetUserId,
                  fullName: stats.fullName,
                  username: stats.username ?? undefined,
                  profilePicture: stats.profilePicture ?? undefined,
                });
              }
            } catch {
              // Keep minimal placeholder derived from userId
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to load conversation';
          setErrorMsg(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeConversation();

    return () => {
      cancelled = true;
    };
  }, [initialThreadId, targetUserId]);

  // Real-time Socket.IO room join and message updates
  useEffect(() => {
    if (activeThreadId == null) {
      return;
    }

    let isMounted = true;
    let activeSocket: any = null;
    const threadKey = String(activeThreadId);

    const handleNewMessage = (incoming: ChatMessage) => {
      if (!isMounted || !incoming) {
        return;
      }
      if (String(incoming.conversationId) !== threadKey) {
        return;
      }

      setMessages(prev => {
        if (prev.some(m => String(m.id) === String(incoming.id))) {
          return prev;
        }
        const withoutPending = prev.filter(
          m =>
            !(
              m.pending &&
              m.body === incoming.body &&
              String(m.conversationId) === threadKey
            ),
        );
        return [...withoutPending, incoming];
      });
      onThreadUpdatedRef.current?.();
    };

    const joinThread = () => {
      if (activeSocket?.connected) {
        activeSocket.emit('join:thread', threadKey);
      }
    };

    getChatSocket()
      .then(socket => {
        if (!isMounted) {
          return;
        }
        activeSocket = socket;
        socket.on('message:new', handleNewMessage);
        socket.on('connect', joinThread);
        if (socket.connected) {
          socket.emit('join:thread', threadKey);
        }
      })
      .catch(err => {
        console.warn('[ChatInterface] Socket init warning:', err);
      });

    return () => {
      isMounted = false;
      if (activeSocket) {
        activeSocket.off('message:new', handleNewMessage);
        activeSocket.off('connect', joinThread);
        if (activeSocket.connected) {
          activeSocket.emit('leave:thread', threadKey);
        }
      }
    };
  }, [activeThreadId]);

  const sendViaRest = async (threadKey: string | number, body: string, tempId: string) => {
    const res = await sendChatMessage(threadKey, body);
    const raw = res?.data?.data;
    const savedMsg: ChatMessage | undefined = raw?.message || raw;
    if (savedMsg) {
      setMessages(prev => {
        const exists = prev.some(m => String(m.id) === String(savedMsg.id));
        if (exists) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => (m.id === tempId ? savedMsg : m));
      });
    } else {
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, pending: false } : m)),
      );
    }
    onThreadUpdatedRef.current?.();
  };

  const handleSendMessage = async () => {
    const body = messageInput.trim();
    if (!body || activeThreadId == null || sending) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: UIMessage = {
      id: tempId,
      body,
      senderId: currentUserId || 'current',
      conversationId: activeThreadId,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setMessageInput('');
    setSending(true);

    try {
      const socket = await getChatSocket();
      if (socket.connected) {
        await new Promise<void>((resolve, reject) => {
          let settled = false;
          const timer = setTimeout(async () => {
            if (settled) {
              return;
            }
            settled = true;
            try {
              await sendViaRest(activeThreadId, body, tempId);
              resolve();
            } catch (restErr) {
              reject(restErr);
            }
          }, 3000);

          socket.emit(
            'message:send',
            { threadId: String(activeThreadId), body },
            async (ack: SendMessageAck) => {
              if (settled) {
                return;
              }
              settled = true;
              clearTimeout(timer);
              if (ack?.ok && ack.message) {
                const confirmed = ack.message;
                setMessages(prev => {
                  const alreadyAdded = prev.some(
                    m => String(m.id) === String(confirmed.id),
                  );
                  if (alreadyAdded) {
                    return prev.filter(m => m.id !== tempId);
                  }
                  return prev.map(m => (m.id === tempId ? confirmed : m));
                });
                onThreadUpdatedRef.current?.();
                resolve();
              } else {
                try {
                  await sendViaRest(activeThreadId, body, tempId);
                  resolve();
                } catch (restErr) {
                  reject(restErr);
                }
              }
            },
          );
        });
      } else {
        await sendViaRest(activeThreadId, body, tempId);
      }
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m,
        ),
      );
      Toast.show({
        type: 'error',
        text1: 'Message failed',
        text2:
          err?.response?.data?.message || 'Could not deliver message. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleChatAction = async (action: 'pin' | 'spam' | 'delete') => {
    setShowChatTooltip(false);
    if (activeThreadId == null) {
      return;
    }
    try {
      if (action === 'pin') {
        const nextPinned = !isPinned;
        await pinChatThread(activeThreadId, nextPinned);
        setIsPinned(nextPinned);
        Toast.show({
          type: 'success',
          text1: nextPinned ? 'Conversation pinned' : 'Conversation unpinned',
        });
        onThreadUpdatedRef.current?.();
      } else if (action === 'spam') {
        await spamChatThread(activeThreadId);
        Toast.show({
          type: 'success',
          text1: 'Marked as spam',
        });
        onThreadUpdatedRef.current?.();
        handleBack();
      } else if (action === 'delete') {
        await deleteChatThread(activeThreadId);
        Toast.show({
          type: 'success',
          text1: 'Conversation deleted',
        });
        onThreadUpdatedRef.current?.();
        handleBack();
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: err?.response?.data?.message || 'Please try again.',
      });
    }
  };

  const peerId = peerUser?.id ?? targetUserId;
  const peerName =
    peerUser?.fullName || peerUser?.username || peerUser?.email || 'Conversation';
  const peerInitial = peerName.charAt(0).toUpperCase();

  const isOwnMessage = useCallback(
    (item: UIMessage) => {
      if (item.pending || item.senderId === 'current') {
        return true;
      }
      if (currentUserId) {
        return String(item.senderId) === currentUserId;
      }
      if (peerId != null) {
        return String(item.senderId) !== String(peerId);
      }
      return false;
    },
    [currentUserId, peerId],
  );

  const renderedMessages = useMemo(() => messages, [messages]);

  const renderMessageItem = ({
    item,
    index,
  }: {
    item: UIMessage;
    index: number;
  }) => {
    const prevMsg = index > 0 ? renderedMessages[index - 1] : null;
    const showDateSeparator =
      !prevMsg ||
      new Date(prevMsg.createdAt).toDateString() !==
        new Date(item.createdAt).toDateString();

    const own = isOwnMessage(item);
    const senderDisplayName =
      item.sender?.fullName || item.sender?.username || peerName;
    const senderInitial = senderDisplayName.charAt(0).toUpperCase();
    const timeText = formatMessageTime(item.createdAt);

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{formatDateLabel(item.createdAt)}</Text>
          </View>
        )}
        <View
          style={[
            styles.chatMessageContainer,
            own ? styles.currentUserMessage : styles.otherUserMessage,
          ]}
        >
          {!own ? (
            <View style={styles.senderInfo}>
              {item.sender?.profilePicture || peerUser?.profilePicture ? (
                <Image
                  source={{
                    uri:
                      (item.sender?.profilePicture ||
                        peerUser?.profilePicture) as string,
                  }}
                  style={styles.senderAvatarImage}
                />
              ) : (
                <View style={styles.senderAvatar}>
                  <Text style={styles.senderInitial}>{senderInitial}</Text>
                </View>
              )}
              <View style={styles.messageWrapper}>
                <Text style={styles.senderName}>{senderDisplayName}</Text>
                <Text style={styles.messageTime}>{timeText}</Text>
                <View style={styles.chatBubble}>
                  <Text style={styles.chatMessageText}>{item.body}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.currentUserMessageWrapper}>
              <View
                style={[
                  styles.chatBubble,
                  styles.currentUserBubble,
                  item.failed && styles.failedBubble,
                ]}
              >
                <Text style={[styles.chatMessageText, styles.currentUserText]}>
                  {item.body}
                </Text>
              </View>
              <Text style={styles.ownMessageTime}>
                {item.pending
                  ? 'Sending...'
                  : item.failed
                    ? 'Failed to send'
                    : timeText}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.stateText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {/* Chat Header with Peer Info */}
        <View style={styles.chatHeader}>
          {peerUser?.profilePicture ? (
            <Image
              source={{ uri: peerUser.profilePicture }}
              style={styles.chatAvatar}
            />
          ) : (
            <View style={styles.chatAvatarFallback}>
              <Text style={styles.chatAvatarInitial}>{peerInitial}</Text>
            </View>
          )}
          <View style={styles.chatHeaderInfo}>
            <View style={styles.userNameContainer}>
              <Text style={styles.chatHeaderName} numberOfLines={1}>
                {peerName}
              </Text>
              {isPinned && <Text style={styles.pinnedBadge}>Pinned</Text>}
            </View>
            {peerId != null && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileView', { userId: peerId })}
              >
                <Text style={styles.seeProfile}>See profile</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.moreMenuContainer}>
            <TouchableOpacity
              style={styles.moreOptionsButton}
              onPress={() => setShowChatTooltip(prev => !prev)}
            >
              <Text style={styles.moreOptionsText}>⋯</Text>
            </TouchableOpacity>
            {showChatTooltip && (
              <View style={styles.chatTooltip}>
                <TouchableOpacity
                  style={styles.tooltipItem}
                  onPress={() => handleChatAction('pin')}
                >
                  <Text style={styles.tooltipText}>
                    {isPinned ? 'Unpin chat' : 'Pin conversation'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tooltipItem}
                  onPress={() => handleChatAction('spam')}
                >
                  <Text style={styles.tooltipText}>Mark as spam</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tooltipItem, styles.tooltipItemLast]}
                  onPress={() => handleChatAction('delete')}
                >
                  <Text style={[styles.tooltipText, styles.dangerText]}>
                    Delete chat
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={renderedMessages}
          renderItem={renderMessageItem}
          keyExtractor={item => String(item.id)}
          style={styles.chatMessagesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.messagesContainer,
            renderedMessages.length === 0 && styles.emptyMessagesContainer,
          ]}
          onContentSizeChange={() => {
            if (renderedMessages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.stateText}>
                No messages yet. Say hello to {peerName}!
              </Text>
            </View>
          }
        />

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                Boolean(messageInput.trim()) && styles.sendButtonActive,
              ]}
              onPress={handleSendMessage}
              disabled={!messageInput.trim() || sending}
            >
              <Text
                style={[
                  styles.sendIcon,
                  Boolean(messageInput.trim()) && styles.sendIconActive,
                ]}
              >
                ➤
              </Text>
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
  backIcon: {
    height: 24,
    width: 24,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  pinnedBadge: {
    fontSize: 11,
    color: '#007AFF',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  seeProfile: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  moreMenuContainer: {
    position: 'relative',
  },
  moreOptionsButton: {
    padding: 8,
  },
  moreOptionsText: {
    fontSize: 18,
    color: '#666',
  },
  chatTooltip: {
    position: 'absolute',
    right: 0,
    top: 38,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 100,
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
  emptyMessagesContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
  senderAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  ownMessageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
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
  failedBubble: {
    backgroundColor: '#D32F2F',
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#D32F2F',
    textAlign: 'center',
  },
});

export default ChatInterface;
