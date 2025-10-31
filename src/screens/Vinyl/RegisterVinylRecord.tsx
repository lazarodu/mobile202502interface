import React, { useState } from 'react';
import { KeyboardAvoidingView, View, Text, TextInput, Alert, Platform, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles as baseStyles } from '../Register/styles'; // Import base styles
import { colors } from '../../styles/colors';
import { ComponentButtonInterface, ComponentLoading } from '../../components';
import { makeVinylRecordUseCases } from '../../core/factories/makeVinylRecordUseCases';
import { VinylRecordTypes } from '../../navigations/VinylRecordStackNavigation';
import { useAuth } from '../../context/auth';
import { supabase } from '../../core/infra/supabase/client/supabaseClient';

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

  async function uploadImage(): Promise<string> {
    if (!user) throw new Error("User not authenticated for upload");
    if (!imageAsset) throw new Error("Selecione uma imagem");
    const fileExt = imageAsset?.uri.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    // Convert base64 to ArrayBuffer for Supabase upload in React Native
    try {
      // const response = await fetch(`data:image/${fileExt};base64,${imageAsset?.base64}`);
      // const blob = await response.blob();
      const formData = new FormData();
        formData.append('file', {
        uri: imageAsset.uri,
        name: imageAsset.fileName || `photo_${Date.now()}.jpg`, // Tenta pegar o nome, senão gera um
        type: imageAsset.mimeType ?? 'image/jpeg', // Tenta pegar o tipo, senão usa um padrão
      } as unknown as Blob);

      const { error: uploadError } = await supabase.storage
        .from('vinyl-photos')
        .upload(`public/${fileName}`, formData);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }
    } catch (error) {
      console.log(error, 'aqui')
    }

    const { data: urlData } = supabase.storage
      .from('vinyl-photos')
      .getPublicUrl(fileName);

    if (!urlData) {
      throw new Error('Failed to get public URL for the image.');
    }

    return urlData.publicUrl;
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
      const uploadedPhotoUrl = await uploadImage();

      await vinylRecordUseCases.registerVinylRecord.execute({
        band,
        album,
        year: parseInt(year, 10),
        numberOfTracks: parseInt(numberOfTracks, 10),
        photoUrl: uploadedPhotoUrl,
        ownerId: user.id,
      });
      Alert.alert('Success', 'Vinyl record registered successfully');
      navigation.navigate('ListVinylRecords');
    } catch (err) {
      setError('Failed to register vinyl record');
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

const localStyles = StyleSheet.create({
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
