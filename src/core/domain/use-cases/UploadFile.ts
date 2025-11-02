
import { IStorageService } from '../../infra/supabase/storage/storageService'

export class UploadFileUseCase {
  constructor(private storageService: IStorageService) {}

  async execute(data: {
    imageAsset: any
    bucket: string 
    userId: string
  }): Promise<string> {
    const { imageAsset, bucket, userId } = data
    
    if (!imageAsset || !bucket || !userId) {
      throw new Error('Parâmetros obrigatórios: imageAsset, bucket, userId')
    }

    return await this.storageService.uploadImage(imageAsset, bucket, userId)
    
  }
}
