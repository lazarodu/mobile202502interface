import React, { useState } from 'react';
import { KeyboardAvoidingView, View, Text, TextInput, Alert, Platform, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { styles } from '../Register/styles';
import { colors } from '../../styles/colors';
import { ComponentButtonInterface, ComponentLoading } from '../../components';
import { makeVinylRecordUseCases } from '../../core/factories/makeVinylRecordUseCases';
import { VinylRecord } from '../../core/domain/entities/VinylRecord';
import { VinylRecordTypes } from '../../navigations/VinylRecordStackNavigation';
import { localStyles } from './RegisterVinylRecord';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/auth';

export function EditVinylRecordScreen({ navigation }: VinylRecordTypes) {
  const route = useRoute();
  const { record } = route.params as { record: VinylRecord };
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [band, setBand] = useState(record.band.value);
  const [album, setAlbum] = useState(record.album.value);
  const [year, setYear] = useState(record.year.toString());
  const [numberOfTracks, setNumberOfTracks] = useState(record.numberOfTracks.toString());
  const [photoUrl, setPhotoUrl] = useState(record.photo.url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vinylRecordUseCases = makeVinylRecordUseCases();
  const { user } = useAuth();

  async function handleUpdate() {
    setLoading(true);
    setError(null);
    try {
      // If a new image was picked, its URI is the new photoUrl.
      // Otherwise, we keep the existing one.
      const newPhotoUrl = imageAsset ? imageAsset.uri : photoUrl;

      await vinylRecordUseCases.updateVinylRecord.execute({
        id: record.id,
        band,
        album,
        year: parseInt(year, 10),
        numberOfTracks: parseInt(numberOfTracks, 10),
        photoUrl: newPhotoUrl,
      });

      Alert.alert('Success', 'Vinyl record updated locally. It will be synced when online.');
      navigation.navigate('ListVinylRecords');
    } catch (err) {
      setError('Failed to update vinyl record');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function pickImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageAsset(result.assets[0]);
    }
  }

  async function takePhoto() {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("You've refused to allow this app to access your camera!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageAsset(result.assets[0]);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
        <Text style={styles.title}>Edit Vinyl Record</Text>
        <View style={styles.formRow}>
          <TextInput
            placeholderTextColor={colors.third}
            style={styles.input}
            placeholder="Band"
            value={band}
            onChangeText={setBand}
          />
        </View>
        <View style={styles.formRow}>
          <TextInput
            placeholderTextColor={colors.third}
            style={styles.input}
            placeholder="Album"
            value={album}
            onChangeText={setAlbum}
          />
        </View>
        <View style={styles.formRow}>
          <TextInput
            placeholderTextColor={colors.third}
            style={styles.input}
            placeholder="Year"
            keyboardType="numeric"
            value={year}
            onChangeText={setYear}
          />
        </View>
        <View style={styles.formRow}>
          <TextInput
            placeholderTextColor={colors.third}
            style={styles.input}
            placeholder="Number of Tracks"
            keyboardType="numeric"
            value={numberOfTracks}
            onChangeText={setNumberOfTracks}
          />
        </View>

        {imageAsset && <Image source={{ uri: imageAsset.uri }} style={localStyles.imagePreview} />}
        <View style={localStyles.photoButtonsContainer}>
          <ComponentButtonInterface title='Take Photo' type='third' onPress={takePhoto} />
          <ComponentButtonInterface title='Pick Image' type='third' onPress={pickImage} />
        </View>

        {loading ? (
          <ComponentLoading />
        ) : (
          <ComponentButtonInterface title='Update' type='secondary' onPress={handleUpdate} disabled={loading} />
        )}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
        <ComponentButtonInterface title='Back' type='primary' onPress={() => navigation.navigate('ListVinylRecords')} />
      </KeyboardAvoidingView>
    </View>
  );
}
