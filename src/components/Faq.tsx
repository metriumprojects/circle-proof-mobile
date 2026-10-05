import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQItem = ({ question, answer }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity onPress={toggleExpand} style={styles.questionContainer}>
        <Text style={styles.questionText}>{question}</Text>
        <Text style={styles.icon}>{isExpanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

const FAQComponent = () => {
  const faqData = [
    {
      question: 'What will the people I invite receive?',
      answer: 'They will receive an invitation email with instructions on how to get started...'
    },
    {
      question: 'Why ask for a referral?',
      answer: 'Referrals help us ensure the quality of our community and provide better service...'
    },
    {
      question: 'Is that useful?',
      answer: 'Yes, referrals help us maintain a trusted network and improve user experience...'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FAQ</Text>
      {faqData.map((item, index) => (
        <FAQItem
          key={index}
          question={item.question}
          answer={item.answer}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffffff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  faqItem: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff'
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  icon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8
  },
  answerContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#fafafa'
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666'
  }
});

export default FAQComponent;