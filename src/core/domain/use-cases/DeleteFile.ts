
import { IStorageService } from '../../infra/supabase/storage/storageService'

export class DeleteFileUseCase {
  constructor(private storageService: IStorageService) {}

  async execute(data: {
    bucket: string
    path: string
  }): Promise<void> {
    const { bucket, path } = data
    
    if ( !bucket || !path) {
      throw new Error('Parâmetros obrigatórios:  bucket, path')
    }

    return await this.storageService.deleteFile( bucket, path)
    
  }
}
