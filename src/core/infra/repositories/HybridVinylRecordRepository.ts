import NetInfo from '@react-native-community/netinfo';
import { IVinylRecordRepository } from '../../domain/repositories/IVinylRecordRepository';
import { VinylRecord } from '../../domain/entities/VinylRecord';
import { SupabaseVinylRepository } from './supabaseVinylRepository';
import { SQLiteVinylRecordRepository } from '../sqlite/SQLiteVinylRecordRepository';

export class HybridVinylRecordRepository implements IVinylRecordRepository {
  private static instance: HybridVinylRecordRepository;
  private onlineRepo: IVinylRecordRepository;
  private offlineRepo: IVinylRecordRepository;

  private constructor() {
    this.onlineRepo = SupabaseVinylRepository.getInstance();
    this.offlineRepo = SQLiteVinylRecordRepository.getInstance();
  }

  public static getInstance(): HybridVinylRecordRepository {
    if (!HybridVinylRecordRepository.instance) {
      HybridVinylRecordRepository.instance = new HybridVinylRecordRepository();
    }
    return HybridVinylRecordRepository.instance;
  }

  private async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  async save(record: VinylRecord): Promise<void> {
    if (await this.isOnline()) {
      try {
        await this.onlineRepo.save(record);
        await this.offlineRepo.save(record);
      } catch (error) {
        console.warn('Online save failed, falling back to offline.', error);
        await this.offlineRepo.save(record);
      }
    } else {
      await this.offlineRepo.save(record);
    }
  }

  async findById(id: string): Promise<VinylRecord | null> {
    if (await this.isOnline()) {
      return this.onlineRepo.findById(id);
    }
    return this.offlineRepo.findById(id);
  }

  async findAll(): Promise<VinylRecord[]> {
    if (await this.isOnline()) {
      return this.onlineRepo.findAll();
    }
    return this.offlineRepo.findAll();
  }

  async update(record: VinylRecord): Promise<void> {
    if (await this.isOnline()) {
      try {
        await this.onlineRepo.update(record);
        await this.offlineRepo.update(record);
      } catch (error) {
        console.warn('Online update failed, falling back to offline.', error);
        await this.offlineRepo.update(record);
      }
    } else {
      await this.offlineRepo.update(record);
    }
  }

  async delete(id: string): Promise<void> {
    if (await this.isOnline()) {
      try {
        await this.onlineRepo.delete(id);
        await this.offlineRepo.delete(id);
      } catch (error) {
        console.warn('Online delete failed, falling back to offline.', error);
        await this.offlineRepo.delete(id);
      }
    } else {
      await this.offlineRepo.delete(id);
    }
  }
}
