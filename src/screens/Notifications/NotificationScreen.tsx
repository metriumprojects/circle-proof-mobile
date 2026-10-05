import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../api/service';
import { useNotification } from '../../context/NotificationContext';

interface Actor {
  id: number;
  fullName: string;
  profilePicture: string | null;
  username: string | null;
}

interface Metadata {
  action: string;
  [key: string]: any;
}

interface NotificationItem {
  id: number;
  userId: number;
  actorId: number;
  type: string;
  entityType: string;
  entityId: number;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Metadata;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  actor: Actor;
}

interface ApiResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    notifications: NotificationItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    unreadCount: number;
  };
  error: any;
}

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const { unreadCount, setUnreadCount } = useNotification();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffInMs = nowOnly.getTime() - dateOnly.getTime();
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks}w ago`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months}mo ago`;
    } else {
      const years = Math.floor(days / 365);
      return `${years}y ago`;
    }
  };

  const fetchNotificationData = async (
    pageNum: number = 1,
    isRefresh: boolean = false,
  ) => {
    try {
      const response = await fetchNotifications(pageNum);
      if (response.data.success) {
        const { notifications, pagination, unreadCount } = response.data.data;
        if (isRefresh) {
          setNotifications(notifications);
        } else if (pageNum === 1) {
          setNotifications(notifications);
        } else {
          setNotifications(prev => [...prev, ...notifications]);
        }
        setHasNextPage(pagination.hasNext);
        setUnreadCount(unreadCount);
        if (!isRefresh) {
          setPage(pageNum);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotificationData(1);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotificationData(1, true);
    setPage(1);
    setHasNextPage(true);
    setRefreshing(false);
  };

  const loadMoreNotifications = async () => {
    if (hasNextPage && !loadingMore) {
      setLoadingMore(true);
      await fetchNotificationData(page + 1);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const markNotificationAsReadHandler = async (id: number) => {
    try {
      const response = await markNotificationAsRead(id);
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
        setUnreadCount((prevUnreadCount: number) =>
          Math.max(0, prevUnreadCount - 1),
        );
      } else {
        Alert.alert('Error', 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
    setMenuVisible(false);
  };

  const markAllAsReadHandler = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true })),
        );
        setUnreadCount(0);
      } else {
        Alert.alert('Error', 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const showMenu = (id: number, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setSelectedNotificationId(id);
    setMenuVisible(true);
  };

  const NotificationItemComponent = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      // activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        {/* User image with unread indicator */}
        <View style={styles.userImageWrapper}>
          {item.actor.profilePicture ? (
            <Image
              source={{ uri: item.actor.profilePicture }}
              style={styles.userImage}
            />
          ) : (
            <View style={styles.defaultUserImage}>
              <Text style={styles.defaultUserInitial}>
                {item.actor.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {!item.isRead && <View style={styles.unreadBadge} />}
        </View>

        {/* Main content */}
        <View style={styles.notificationMainContent}>
          <View style={styles.titleRow}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>

          {/* <Text style={styles.actorName} numberOfLines={1}>
            {item.actor.fullName}
          </Text> */}
        </View>

        {/* Three dots menu */}
        {!item.isRead && (
          <TouchableOpacity
            onPress={event => showMenu(item.id, event)}
            style={styles.menuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasNextPage) return null;
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#57b915" />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMoreNotifications}
      >
        <Text style={styles.loadMoreText}>Load More</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔔</Text>
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateText}>You're all caught up!</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Image
              source={require('../../assets/icons/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#57b915" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Image
            source={require('../../assets/icons/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Top Controls */}
      {notifications.length > 0 && unreadCount > 0 && (
        <View style={styles.topControls}>
          <View style={styles.unreadCountContainer}>
            {/* {unreadCount > 0 && (
              <View style={styles.unreadBadgeTop}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )} */}
            {unreadCount > 0 && (
            <Text style={styles.unreadCountText}>Unread: {unreadCount}</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={markAllAsReadHandler}
            >
              <Text style={styles.markAllReadButtonText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={({ item }) => <NotificationItemComponent item={item} />}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#57b915"
            colors={['#57b915']}
          />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreNotifications}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyListContainer : undefined
        }
      />

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menuContainer,
              {
                top: Math.min(menuPosition.y, 600),
                left: Math.max(10, menuPosition.x - 140),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                selectedNotificationId &&
                markNotificationAsReadHandler(selectedNotificationId)
              }
            >
              <Text style={styles.menuItemText}>✓ Mark as read</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: Platform.OS === 'android' ? 40 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.05,
    //     shadowRadius: 3,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#212529',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  unreadCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBadgeTop: {
    backgroundColor: '#57b915',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  unreadCountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  markAllReadButton: {
    backgroundColor: '#57b915',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllReadButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  unreadNotification: {
    backgroundColor: '#f4fbf0',
    borderLeftWidth: 3,
    borderLeftColor: '#57b915',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
  },
  userImageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  userImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9ecef',
  },
  defaultUserImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#57b915',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultUserInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#57b915',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationMainContent: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginRight: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#868e96',
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 6,
  },
  actorName: {
    fontSize: 13,
    color: '#868e96',
    fontWeight: '500',
  },
  menuButton: {
    padding: 4,
    marginLeft: 4,
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#adb5bd',
  },
  footerLoader: {
    flexDirection: 'row',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#868e96',
  },
  loadMoreButton: {
    paddingVertical: 14,
    marginVertical: 12,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#57b915',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#868e96',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
  },
});

export default NotificationScreen;
