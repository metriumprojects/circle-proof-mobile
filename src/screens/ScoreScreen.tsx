import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const JobScoreBreakdown = ({ navigation }) => {
  const verificationItems = [
    {
      id: 1,
      icon: '✅',
      title: 'Job Verified Company + Badges 100%',
      description: 'The gold standard. We\'ve contacted the company\'s HR directly to verify this role.',
      subtitle: 'The strongest form of proof - grants a green "HR Verified" badge.',
      iconColor: '#4CAF50',
      percentage: 100,
    },
    {
      id: 2,
      icon: '🎓',
      title: 'Verified by verified Colleague (Full Health 100%',
      description: 'Confirmed by someone with a verified role at the same company.',
      subtitle: 'We contacted them at their same time.',
      iconColor: '#2196F3',
      percentage: 100,
    },
    {
      id: 3,
      icon: '🏅',
      title: 'Other Verifications (Partial) +10% each',
      description: 'Confirmed by people who are not yet verified at the same company.',
      subtitle: 'Capped at 50% total.',
      iconColor: '#FF9800',
      percentage: 10,
    },
  ];

  // Simple circular progress component without SVG
  const CircularProgress = ({ percentage, size = 80 }) => {
    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        {/* Outer ring background */}
        <View style={[styles.outerRing, { width: size, height: size }]} />
        
        {/* Inner circle */}
        <View style={[styles.innerCircle, { 
          width: size - 12, 
          height: size - 12,
        }]}>
          <View style={styles.centerContent}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.percentageText}>{percentage}%</Text>
          </View>
        </View>
        
        {/* Progress indicator (simplified) */}
        <View style={[styles.progressIndicator, {
          width: size * 0.8,
          height: size * 0.8,
        }]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
     
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Score Breakdown</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Circular Progress Section */}
        <View style={styles.progressSection}>
          <CircularProgress percentage={80} />
        </View>

        {/* Levels of verification title */}
        <Text style={styles.sectionTitle}>Levels of verification:</Text>

        {/* Verification Items */}
        {verificationItems.map((item) => (
          <View key={item.id} style={styles.verificationItem}>
            <View style={styles.itemHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
                <Text style={styles.emojiIcon}>{item.icon}</Text>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                {item.subtitle && (
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 34,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressSection: {
    paddingVertical: 32,
  },
  circularProgress: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    borderRadius: 50,
    borderWidth: 6,
    borderColor: '#4CAF50',
    position: 'absolute',
  },
  innerCircle: {
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  emojiIcon: {
    fontSize: 20,
  },
  progressIndicator: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#4CAF50',
    borderRightColor: '#4CAF50',
    transform: [{ rotate: '-45deg' }],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  verificationItem: {
    marginBottom: 24,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default JobScoreBreakdown;