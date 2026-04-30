import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { getImageUrl } from '../services/api';

const PoolFormScreen = ({ route, navigation }) => {
  const isEditing = route.params && route.params.pool;
  const poolToEdit = isEditing ? route.params.pool : null;

  const [poolName, setPoolName] = useState(poolToEdit ? poolToEdit.poolName : '');
  const [pricePerSession, setPricePerSession] = useState(poolToEdit ? poolToEdit.pricePerSession.toString() : '');
  const [dayPrice, setDayPrice] = useState(poolToEdit && poolToEdit.dayPrice ? poolToEdit.dayPrice.toString() : '');
  const [nightPrice, setNightPrice] = useState(poolToEdit && poolToEdit.nightPrice ? poolToEdit.nightPrice.toString() : '');
  const [capacity, setCapacity] = useState(poolToEdit ? poolToEdit.capacity.toString() : '');
  const [description, setDescription] = useState(poolToEdit ? poolToEdit.description : '');
  const [guidelines, setGuidelines] = useState(poolToEdit ? (poolToEdit.guidelines || []).join('\n') : '');
  const [imageUrl, setImageUrl] = useState(poolToEdit ? poolToEdit.imageUrl : '');
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['image'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];
      await uploadImage(selectedImage);
    }
  };

  const uploadImage = async (imageAsset) => {
    setUploading(true);
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        formData.append('image', blob, `pool-${Date.now()}.jpg`);
      } else {
        formData.append('image', {
          uri: imageAsset.uri,
          name: `pool-${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }

      // NO manual 'Content-Type' header - let Axios handle it with the correct boundary
      const response = await api.post('/upload', formData);

      if (response.data.success) {
        setImageUrl(response.data.imageUrl);
        Alert.alert('Success', 'Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!poolName) {
      setFormError('Pool name is required');
      return;
    }
    if (!pricePerSession || isNaN(pricePerSession)) {
      setFormError('Price per session must be a valid number');
      return;
    }
    if (!dayPrice || isNaN(dayPrice)) {
      setFormError('Day price must be a valid number');
      return;
    }
    if (!nightPrice || isNaN(nightPrice)) {
      setFormError('Night price must be a valid number');
      return;
    }
    if (!capacity || isNaN(capacity)) {
      setFormError('Capacity must be a valid number');
      return;
    }
    if (!imageUrl) {
      setFormError('Please upload an image');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        poolName,
        pricePerSession: Number(pricePerSession),
        dayPrice: Number(dayPrice),
        nightPrice: Number(nightPrice),
        capacity: Number(capacity),
        description,
        imageUrl,
        guidelines: guidelines.split('\n').filter(line => line.trim() !== '').map(line => line.trim().replace(/^•\s*/, ''))
      };

      if (isEditing) {
        await api.put(`/pools/${poolToEdit._id}`, payload);
        Alert.alert('Success', 'Pool updated successfully');
      } else {
        await api.post('/pools', payload);
        Alert.alert('Success', 'Pool created successfully');
      }
      navigation.navigate('PoolList', { refresh: Date.now() });
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400) {
        setFormError(error.response?.data?.message || 'Validation error. Please check your inputs.');
      } else {
        setFormError(error.response?.data?.message || 'Failed to save pool');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Edit Pool' : 'Add New Pool'}</Text>
      
      {formError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Pool Name *" value={poolName} onChangeText={setPoolName} />
        <TextInput style={styles.input} placeholder="Price per Session (LKR) *" value={pricePerSession} onChangeText={setPricePerSession} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Day Price (LKR/hr) *" value={dayPrice} onChangeText={setDayPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Night Price (LKR/hr) *" value={nightPrice} onChangeText={setNightPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Capacity *" value={capacity} onChangeText={setCapacity} keyboardType="numeric" />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Rules & Guidelines (one per line)"
          value={guidelines}
          onChangeText={setGuidelines}
          multiline
          numberOfLines={6}
        />

        <Text style={styles.label}>Pool Image</Text>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: getImageUrl(imageUrl) }} 
              style={styles.previewImage} 
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image Selected</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.uploadButton, uploading && styles.disabledBtn]} 
            onPress={handlePickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>
                {imageUrl ? "Change Image" : "Select Image"}
              </Text>
            )}
          </TouchableOpacity>
          {imageUrl ? (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImageUrl('')}
            >
              <Text style={styles.removeImageText}>🗑️  Remove Image</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>{loading ? 'Saving...' : (isEditing ? 'Update Pool' : 'Create Pool')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  errorContainer: { backgroundColor: '#ffebee', padding: 10, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#ffcdd2' },
  errorText: { color: '#c62828', fontSize: 14, textAlign: 'center' },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 12, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  previewImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  placeholderImage: { width: '100%', height: 150, borderRadius: 10, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#aaa' },
  placeholderText: { color: '#888' },
  uploadButton: { backgroundColor: '#6c757d', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginBottom: 8 },
  uploadButtonText: { color: '#fff', fontWeight: 'bold' },
  removeImageButton: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#dc3545', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 5 },
  removeImageText: { color: '#dc3545', fontWeight: 'bold', fontSize: 13 },
  disabledBtn: { opacity: 0.5 },
  submitButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default PoolFormScreen;
