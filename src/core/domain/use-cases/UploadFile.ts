
import { IStorageService } from '../../infra/supabase/storage/storageService'

export class UploadFileUseCase {
  constructor(private storageService: IStorageService) {}

  async execute(data: {
    imageUri: string
    bucket: string 
    userId: string
  }): Promise<string> {
    const { imageUri, bucket, userId } = data
    
    if (!imageUri || !bucket || !userId) {
      throw new Error('Parâmetros obrigatórios: imageUri, bucket, userId')
    }

    return await this.storageService.uploadImage(imageUri, bucket, userId)
    
  }
}
