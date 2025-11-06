import { supabase } from '../client/supabaseClient'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'

export interface IStorageService {
  uploadImage(imageUri: string, bucket: string, userId: string): Promise<string>
  deleteFile(bucket: string, path: string): Promise<void>
  getPublicUrl(bucket: string, path: string): string
}

export class SupabaseStorageService implements IStorageService {

  async uploadImage(imageUri: string, bucket: string,  userId: string): Promise<string> {
    try {
      const fileExt = imageUri.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: `photo_${Date.now()}.${fileExt}`,
        type: `image/${fileExt}`,
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

    if (!data?.publicUrl) {
        throw new Error("Failed to get public URL for uploaded file.");
    }
    return data.publicUrl
  }
}
