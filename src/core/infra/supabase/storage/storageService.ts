import { supabase } from '../client/supabaseClient'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'

export interface IStorageService {
  uploadImage(imageAsset: ImagePicker.ImagePickerAsset, bucket: string, userId: string): Promise<string>
  deleteFile(bucket: string, path: string): Promise<void>
  getPublicUrl(bucket: string, path: string): string
}

export class SupabaseStorageService implements IStorageService {

  async uploadImage(imageAsset: ImagePicker.ImagePickerAsset, bucket: string,  userId: string): Promise<string> {
    try {
      // Pedir permissão para acessar a galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Permissão para acessar galeria negada')
      }

      const fileExt = imageAsset?.uri.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri: imageAsset.uri,
        name: imageAsset.fileName || `photo_${Date.now()}.jpg`, // Tenta pegar o nome, senão gera um
        type: imageAsset.mimeType ?? 'image/jpeg', // Tenta pegar o tipo, senão usa um padrão
      } as unknown as Blob);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(`${fileName}`, formData);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      return this.getPublicUrl(bucket, fileName)

    } catch (error) {
      console.error('Erro no upload:', error)
      throw error
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }
}
