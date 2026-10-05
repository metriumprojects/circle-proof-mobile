import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { addHobby } from '../../api/service';

interface AddHobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHobbyAdded: (hobby: any) => void;
}

const AddHobbyModal: React.FC<AddHobbyModalProps> = ({
  isOpen,
  onClose,
  onHobbyAdded,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    image: null as any,
  });

  const [loading, setLoading] = useState(false);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        image: null,
      });
    }
  }, [isOpen]);

  const handleImageUpload = () => {
    const options: any = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: true,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response: any) => {
    if (response.didCancel || response.error) {
      console.log(
        'User cancelled or error:',
        response.error || 'User cancelled',
      );
      return;
    }

    if (response.assets && response.assets[0]) {
      const selectedAsset = response.assets[0];
      setFormData({
        ...formData,
        image: selectedAsset,
      });
    }
  };

  const handleAddHobby = async () => {
    if (!isFormValid()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields',
      });
      return;
    }

    setLoading(true);
    try {
      // Create FormData object
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append('name', formData.name);

      // Append image file if it exists
      if (formData.image) {
        formDataToSend.append('image', {
          uri: formData.image.uri || '',
          type: formData.image.type || 'image/jpeg',
          name: formData.image.fileName || `hobby_image_${Date.now()}.jpg`,
        });
      }

      const response = await addHobby(formDataToSend);

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Hobby added successfully!',
        });
        onHobbyAdded(response.data.data.hobby);
        onClose();
        // Reset form
        setFormData({
          name: '',
          image: null,
        });
      } else {
        throw new Error(response.data.message || 'Failed to add hobby');
      }
    } catch (error: any) {
      console.error('Error adding hobby:', error.response);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message ||
          'Failed to add hobby. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== ''
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Image
                source={require('../../assets/icons/back.png')}
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add a Hobby</Text>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Preview Section */}
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Preview</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewContent}>
                    {formData.image ? (
                      <Image
                        source={{ uri: formData.image.uri }}
                        style={styles.previewImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.imageText}>
                          {formData.name
                            ? formData.name.charAt(0).toUpperCase()
                            : 'H'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.previewInfo}>
                      <Text style={styles.previewHobbyName}>
                        {formData.name || 'Hobby Name'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Hobby Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Hobby Name"
                  placeholderTextColor="#999999"
                  value={formData.name}
                  onChangeText={text =>
                    setFormData({ ...formData, name: text })
                  }
                />
              </View>

              {/* Add Image */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Add Image</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleImageUpload}
                >
                  <Text style={styles.uploadIcon}>⬆</Text>
                  <Text style={styles.uploadText}>
                    {formData.image ? 'Change Image' : 'Upload'}
                  </Text>
                </TouchableOpacity>
                {formData.image && (
                  <Text style={styles.hint}>
                    Image uploaded: {formData.image.fileName}
                  </Text>
                )}
              </View>

              {/* Bottom Spacing */}
              <View style={styles.bottomSpacing} />
            </View>
          </ScrollView>

          {/* Add Button - Fixed at bottom */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                isFormValid() && styles.createButtonActive,
              ]}
              onPress={handleAddHobby}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Add Hobby</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '90%',
    maxWidth: 480,
    height: '60%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: '#c8f5a0',
    borderRadius: 8,
    padding: 16,
    minHeight: 150,
  },
  previewContent: {
    flexDirection: 'row',
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imageText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#4285f4',
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewHobbyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  required: {
    color: '#d93025',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6666',
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  uploadIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#000000',
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  createButton: {
    backgroundColor: '#cccccc',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  createButtonActive: {
    backgroundColor: '#6ec71e',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default AddHobbyModal;
