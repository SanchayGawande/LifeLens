import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

const MAX_IMAGES = 3;
const MIN_IMAGES = 2;

export default function PhotoUploader({ 
  onImagesSelected, 
  initialImages = [], 
  disabled = false,
  style 
}) {
  const [images, setImages] = useState(initialImages);
  const [loading, setLoading] = useState(false);

  // Request permissions
  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions needed',
          'Please allow camera and photo library access to upload images for decisions.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  // Show image picker options
  const showImagePicker = async () => {
    if (disabled || loading) return;
    
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Maximum reached', `You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    // For web, go directly to gallery picker (camera not supported)
    if (Platform.OS === 'web') {
      pickFromGallery();
      return;
    }

    const options = [
      { text: 'Take Photo', onPress: () => takePicture() },
      { text: 'Choose from Gallery', onPress: () => pickFromGallery() },
      { text: 'Cancel', style: 'cancel' }
    ];

    Alert.alert('Add Photo', 'How would you like to add your photo?', options);
  };

  // Take picture with camera
  const takePicture = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: Platform.OS === 'web', // Include base64 for web platform
      });

      if (!result.canceled && result.assets[0]) {
        await addImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pick from gallery
  const pickFromGallery = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: Platform.OS === 'web', // Include base64 for web platform
      });

      if (!result.canceled && result.assets[0]) {
        await addImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add image to collection
  const addImage = async (asset) => {
    try {
      const newImage = {
        id: Date.now().toString(),
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        label: `Option ${images.length + 1}`,
        type: asset.type || 'image',
        base64: asset.base64, // Include base64 for web platform
      };

      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      
      if (onImagesSelected) {
        onImagesSelected(updatedImages);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Add image error:', error);
      Alert.alert('Error', 'Failed to add image. Please try again.');
    }
  };

  // Remove image
  const removeImage = (imageId) => {
    if (disabled) return;

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            const updatedImages = images.filter(img => img.id !== imageId);
            setImages(updatedImages);
            
            if (onImagesSelected) {
              onImagesSelected(updatedImages);
            }
          }
        }
      ]
    );
  };

  // Update image label
  const updateImageLabel = (imageId, newLabel) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, label: newLabel.slice(0, 30) } : img
    );
    setImages(updatedImages);
    
    if (onImagesSelected) {
      onImagesSelected(updatedImages);
    }
  };

  // Reorder images
  const moveImage = (fromIndex, toIndex) => {
    if (disabled) return;

    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    setImages(updatedImages);
    
    if (onImagesSelected) {
      onImagesSelected(updatedImages);
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const isValid = images.length >= MIN_IMAGES;
  const canAddMore = images.length < MAX_IMAGES;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Photos</Text>
        <Text style={styles.subtitle}>
          {`Add ${MIN_IMAGES}-${MAX_IMAGES} images to compare • ${images.length}/${MAX_IMAGES} selected`}
        </Text>
      </View>

      {/* Images Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imagesContainer}
      >
        {images.map((image, index) => (
          <View key={image.id} style={styles.imageCard}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            
            {/* Image Controls */}
            <View style={styles.imageOverlay}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(image.id)}
                disabled={disabled}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
              
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
            </View>

            {/* Label Input */}
            <TextInput
              style={styles.labelInput}
              value={image.label}
              onChangeText={(text) => updateImageLabel(image.id, text)}
              placeholder="Option name"
              maxLength={30}
              editable={!disabled}
            />

            {/* Reorder buttons */}
            {!disabled && images.length > 1 && (
              <View style={styles.reorderButtons}>
                {index > 0 && (
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => moveImage(index, index - 1)}
                  >
                    <Ionicons name="chevron-back" size={16} color="#6366f1" />
                  </TouchableOpacity>
                )}
                {index < images.length - 1 && (
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => moveImage(index, index + 1)}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#6366f1" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Add Photo Button */}
        {canAddMore && (
          <TouchableOpacity
            style={[styles.addButton, disabled && styles.addButtonDisabled]}
            onPress={showImagePicker}
            disabled={disabled || loading}
          >
            {loading ? (
              <ActivityIndicator color="#6366f1" size="small" />
            ) : (
              <>
                <Ionicons name="camera" size={32} color="#6366f1" />
                <Text style={styles.addButtonText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Status Messages */}
      {images.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="images" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No photos selected</Text>
          <Text style={styles.emptyText}>
            {`Add ${MIN_IMAGES}-${MAX_IMAGES} photos to compare options`}
          </Text>
        </View>
      )}

      {images.length > 0 && images.length < MIN_IMAGES && (
        <View style={styles.warningMessage}>
          <Ionicons name="information-circle" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            {`Add ${MIN_IMAGES - images.length} more photo${MIN_IMAGES - images.length !== 1 ? 's' : ''} to continue`}
          </Text>
        </View>
      )}

      {isValid && (
        <View style={styles.successMessage}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.successText}>
            {`Ready! You can add ${MAX_IMAGES - images.length} more photo${MAX_IMAGES - images.length !== 1 ? 's' : ''} if needed.`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  imagesContainer: {
    paddingRight: 16,
  },
  imageCard: {
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 160,
  },
  image: {
    width: 144,
    height: 108,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  indexBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  labelInput: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  reorderButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    gap: 8,
  },
  reorderButton: {
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 160,
    height: 140,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  warningMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  successText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
  },
});