import React, { useState } from 'react';
import { KeyboardAvoidingView, View, Text, TextInput, Alert, Platform, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles as baseStyles } from '../Register/styles'; // Import base styles
import { colors } from '../../styles/colors';
import { ComponentButtonInterface, ComponentLoading } from '../../components';
import { makeVinylRecordUseCases } from '../../core/factories/makeVinylRecordUseCases';
import { VinylRecordTypes } from '../../navigations/VinylRecordStackNavigation';
import { useAuth } from '../../context/auth';

export function RegisterVinylRecordScreen({ navigation }: VinylRecordTypes) {
  const [band, setBand] = useState('');
  const [album, setAlbum] = useState('');
  const [year, setYear] = useState('');
  const [numberOfTracks, setNumberOfTracks] = useState('');
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null); // Stores the selected image asset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vinylRecordUseCases = makeVinylRecordUseCases();
  const { user } = useAuth();

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

  async function handleRegister() {
    setLoading(true);
    setError(null);
    if (!user) {
      setError('You must be logged in to register a vinyl record.');
      setLoading(false);
      return;
    }
    if (!imageAsset) {
      setError('Please select an image for the vinyl record.');
      setLoading(false);
      return;
    }

    try {
      // The photoUrl is now the local file URI
      const photoUrl = imageAsset.uri;

      await vinylRecordUseCases.registerVinylRecord.execute({
        band,
        album,
        year: parseInt(year, 10),
        numberOfTracks: parseInt(numberOfTracks, 10),
        photoUrl: photoUrl, // Pass the local URI
        ownerId: user.id,
      });
      Alert.alert('Success', 'Vinyl record saved locally. It will be synced when online.');
      navigation.navigate('ListVinylRecords');
    } catch (err) {
      setError('Failed to save vinyl record locally');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={localStyles.container}>
      <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
        <Text style={baseStyles.title}>Register Vinyl Record</Text>
        <View style={baseStyles.formRow}>
          <TextInput
            placeholderTextColor={colors.third}
            style={baseStyles.input}
            placeholder="Band"
            value={band}
            onChangeText={setBand}
          />
        </View>
        <View style={baseStyles.formRow}>
          <TextInput
            placeholderTextColor={colors.third}
            style={baseStyles.input}
            placeholder="Album"
            value={album}
            onChangeText={setAlbum}
          />
        </View>
        <View style={baseStyles.formRow}>
          <TextInput
            placeholderTextColor={colors.third}
            style={baseStyles.input}
            placeholder="Year"
            keyboardType="numeric"
            value={year}
            onChangeText={setYear}
          />
        </View>
        <View style={baseStyles.formRow}>
          <TextInput
            placeholderTextColor={colors.third}
            style={baseStyles.input}
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
          <ComponentButtonInterface title='Save' type='secondary' onPress={handleRegister} disabled={loading} />
        )}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
        <ComponentButtonInterface title='Back' type='primary' onPress={() => navigation.navigate('ListVinylRecords')} />
      </KeyboardAvoidingView>
    </View>
  );
}

export const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  imagePreview: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginVertical: 10,
    borderRadius: 10,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
  },
});
