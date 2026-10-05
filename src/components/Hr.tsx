import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const VerificationItem = ({ 
  icon, 
  title, 
  percentage, 
  description, 
  note, 
  isGoldStandard = false 
}) => {
  return (
    <View style={styles.verificationItem}>
      {/* Icon */}
      <View style={[
        styles.iconContainer,
        isGoldStandard ? styles.goldIcon : styles.grayIcon
      ]}>
        <Text style={styles.iconText}>
          {icon}
        </Text>
      </View>
      
      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {title}
          </Text>
          <Text style={styles.percentage}>
            {percentage}
          </Text>
        </View>
        
        <Text style={styles.description}>
          {description}
        </Text>
        
        {note && (
          <Text style={styles.note}>
            {note}
          </Text>
        )}
      </View>
    </View>
  );
};

const VerificationSystem = () => {
  const verificationData = [
    {
      icon: "✓",
      title: "HR-Verified (Verified + Badge)",
      percentage: "100%",
      description: "The gold standard. We've contacted the company's HR directly to verify this experience.",
      note: "The strongest form of proof - grants a green 'HR Verified' badge.",
      isGoldStandard: true
    },
    {
      icon: "👥",
      title: "Verified by Colleague (Full Trust)",
      percentage: "100%",
      description: "Confirmed by someone with a verified role at the same company, who overlapped during the same time.",
      note: "No badge, but full score."
    },
    {
      icon: "💡",
      title: "Other Verifications (Partial)",
      percentage: "+10% each",
      description: "Confirmed by people who are not yet verified themselves, or not fully matched in time/company.",
      note: "Capped at 60% total."
    }
  ];

  return (
    <View style={styles.container}>
      {verificationData.map((item, index) => (
        <VerificationItem
          key={index}
          icon={item.icon}
          title={item.title}
          percentage={item.percentage}
          description={item.description}
          note={item.note}
          isGoldStandard={item.isGoldStandard}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  
    padding: 20,
    backgroundColor: '#ffffff'
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  goldIcon: {
    backgroundColor: '#22c55e',
  },
  grayIcon: {
    backgroundColor: '#9ca3af',
  },
  iconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  }
});

export default VerificationSystem;