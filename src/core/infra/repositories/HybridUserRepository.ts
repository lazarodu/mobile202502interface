import NetInfo from '@react-native-community/netinfo';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { SupabaseUserRepository } from './supabaseUserRepository';
import { SQLiteUserRepository } from '../sqlite/SQLiteUserRepository';

export class HybridUserRepository implements IUserRepository {
  private static instance: HybridUserRepository;
  private onlineRepo: IUserRepository;
  private offlineRepo: IUserRepository;

  private constructor() {
    this.onlineRepo = SupabaseUserRepository.getInstance();
    this.offlineRepo = SQLiteUserRepository.getInstance();
  }

  public static getInstance(): HybridUserRepository {
    if (!HybridUserRepository.instance) {
      HybridUserRepository.instance = new HybridUserRepository();
    }
    return HybridUserRepository.instance;
  }

  private async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  async register(user: User): Promise<User> {
    if (await this.isOnline()) {
      try {
        const remoteUser = await this.onlineRepo.register(user);
        // Also save to local db for offline access
        await this.offlineRepo.register(remoteUser);
        return remoteUser;
      } catch (error) {
        console.warn('Online registration failed, falling back to offline.', error);
        return this.offlineRepo.register(user);
      }
    }
    return this.offlineRepo.register(user);
  }

  async authenticate(email: string, password: string): Promise<User> {
    if (await this.isOnline()) {
      try {
        const user = await this.onlineRepo.authenticate(email, password);
        // Sync user data to local db after successful login
        await this.offlineRepo.update(user);
        return user;
      } catch (error) {
        console.warn('Online authentication failed, trying offline.', error);
        return this.offlineRepo.authenticate(email, password);
      }
    }
    return this.offlineRepo.authenticate(email, password);
  }

  async findByEmail(email: string): Promise<User | null> {
    if (await this.isOnline()) {
      return this.onlineRepo.findByEmail(email);
    }
    return this.offlineRepo.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    if (await this.isOnline()) {
      return this.onlineRepo.findById(id);
    }
    return this.offlineRepo.findById(id);
  }

  async update(user: User): Promise<void> {
    if (await this.isOnline()) {
      try {
        await this.onlineRepo.update(user);
        await this.offlineRepo.update(user);
      } catch (error) {
        console.warn('Online update failed, falling back to offline.', error);
        await this.offlineRepo.update(user);
      }
    } else {
      await this.offlineRepo.update(user);
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
  
  async findAll(): Promise<User[]> {
    if (await this.isOnline()) {
        return this.onlineRepo.findAll();
    }
    return this.offlineRepo.findAll();
  }
}
