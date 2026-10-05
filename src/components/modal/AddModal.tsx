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
} from 'react-native';
import UniversalFormModal from './UniversalFormModal';

interface Option {
  label: string;
  value: string;
  description?: string;
}

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  placeholder?: string;
  options?: Option[];
  onSelect?: (selected: Option | Option[]) => void;
  onNext?: () => void;
  searchable?: boolean;
  multiple?: boolean;
  showNextButton?: boolean;
  achievementType?:
  | 'career'
  | 'position'
  | 'education'
  | 'hobby'
  | 'skill'
  | 'aspiration';
  refreshTimeline?: () => void;
}

const AddModal: React.FC<AddModalProps> = ({
  isOpen,
  onClose,
  title = 'Add',
  placeholder = 'Please select',
  options = [],
  onSelect,
  onNext,
  searchable = true,
  multiple = false,
  showNextButton = true,
  achievementType = 'career',
  refreshTimeline,
}) => {
  console.log('AddModal props:', {
    isOpen,
    title,
    placeholder,
    options,
    searchable,
    multiple,
    showNextButton,
    achievementType,
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Option[] | Option | null>(
    multiple ? [] : null,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // For debugging, let's use all options regardless of search term
  const filteredOptions = options; // options.filter(option =>
  // option.label.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  console.log('Options received:', options);
  console.log('Filtered options:', filteredOptions);
  console.log('Search term:', searchTerm);
  console.log('Is open:', isOpen);

  useEffect(() => {
    console.log('Options updated:', options);
    console.log('Options length:', options?.length);
  }, [options]);

  const handleSelect = (option: Option): void => {
    if (multiple) {
      const currentSelected = selectedItems as Option[];
      const isSelected = currentSelected.some(
        item => item.value === option.value,
      );
      let newSelected: Option[];

      if (isSelected) {
        newSelected = currentSelected.filter(
          item => item.value !== option.value,
        );
      } else {
        newSelected = [...currentSelected, option];
      }

      setSelectedItems(newSelected);
      onSelect?.(newSelected);
    } else {
      setSelectedItems(option);
      onSelect?.(option);
      // Don't auto-close when showNextButton is true
      if (!showNextButton) {
        onClose();
      }
    }
  };

  const handleNext = (): void => {
    setIsModalOpen(true);
  };

  const handleClose = (): void => {
    setSearchTerm('');
    setSelectedItems(multiple ? [] : null);
    onClose();
  };

  const isItemSelected = (option: Option): boolean => {
    if (multiple) {
      return (selectedItems as Option[]).some(
        item => item.value === option.value,
      );
    }
    return (selectedItems as Option | null)?.value === option.value;
  };

  const hasSelection = (): boolean => {
    if (multiple) {
      const result = (selectedItems as Option[]).length > 0;
      console.log('Has selection (multiple):', result);
      return result;
    }
    // For single selection, check if an item is selected
    const result = selectedItems !== null && selectedItems !== undefined;
    console.log('Has selection (single):', result);
    console.log('Selected items:', selectedItems);
    return result;
  };

  console.log('Rendering AddModal, isOpen:', isOpen);
  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {isOpen ? (
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../assets/icons/close.png')}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            {searchable && (
              <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                  <Image
                    source={require('../../assets/icons/search.png')}
                    style={{ width: 24, height: 24 }}
                  />
                  <TextInput
                    placeholder={placeholder}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    style={styles.searchInput}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            {/* Options List */}
            <ScrollView style={styles.optionsList}>
              {(() => {
                console.log(
                  'Rendering options list, filteredOptions.length:',
                  filteredOptions.length,
                );
                return null;
              })()}
              {filteredOptions.length === 0 ? (
                <View style={styles.noOptionsContainer}>
                  <Text style={styles.noOptionsText}>No options found</Text>
                </View>
              ) : (
                <View style={styles.optionsWrapper}>
                  {(() => {
                    console.log('Rendering', filteredOptions.length, 'options');
                    return null;
                  })()}
                  {filteredOptions.map((option, index) => {
                    const isSelected = isItemSelected(option);
                    console.log(
                      'Rendering option:',
                      option.label,
                      'isSelected:',
                      isSelected,
                    );

                    return (
                      <TouchableOpacity
                        key={option.value || index}
                        onPress={() => handleSelect(option)}
                        activeOpacity={0.7}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                        ]}
                      >
                        <View style={styles.optionContent}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {multiple && isSelected && (
                            <View style={styles.checkboxOuter}>
                              <View style={styles.checkboxInner} />
                            </View>
                          )}
                        </View>
                        {option.description && (
                          <Text
                            style={[
                              styles.optionDescription,
                              isSelected && styles.optionDescriptionSelected,
                            ]}
                          >
                            {option.description}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Footer with Next button */}
            {(() => {
              const shouldShowNext = showNextButton && hasSelection();
              console.log('Should show next button:', shouldShowNext);
              console.log('showNextButton:', showNextButton);
              console.log('hasSelection():', hasSelection());
              return shouldShowNext ? (
                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={handleNext}
                    activeOpacity={0.7}
                    style={styles.nextButton}
                  >
                    <Text style={styles.nextButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              ) : null;
            })()}

            {/* Footer for multiple selection without Next button */}
            {multiple && !showNextButton && (
              <View style={styles.multipleFooter}>
                <Text style={styles.selectedCount}>
                  {(selectedItems as Option[]).length} item(s) selected
                </Text>
                <View style={styles.footerButtons}>
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.7}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      onSelect?.(selectedItems as Option[]);
                      onClose();
                    }}
                    activeOpacity={0.7}
                    style={styles.doneButton}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <UniversalFormModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                handleClose(); // Close the AddModal as well
              }}
              mode="add"
              type={(selectedItems as Option)?.value as any} // Cast to any to bypass type checking for now
              onSubmit={(data: any) => {
                console.log('Position data:', data);
                // Handle form submission here if needed
              }}
              achievementType={achievementType as any}
              refreshTimeline={refreshTimeline} // Pass the refreshTimeline function from props
            />
          </View>
        ) : (
          <View style={{ width: 0, height: 0 }} />
        )}
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
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
    height: '30%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  optionsList: {
    flex: 1,
  },
  noOptionsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noOptionsText: {
    color: '#6B7280',
    fontSize: 14,
  },
  optionsWrapper: {
    padding: 8,
  },
  optionItem: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  optionItemSelected: {
    backgroundColor: '#10B981',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  optionLabelSelected: {
    color: 'white',
  },
  checkboxOuter: {
    width: 16,
    height: 16,
    backgroundColor: 'white',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 1,
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  optionDescriptionSelected: {
    color: '#D1FAE5',
  },
  footer: {
    padding: 16,
  },
  nextButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  multipleFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
  doneButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AddModal;
