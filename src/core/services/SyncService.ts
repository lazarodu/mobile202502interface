import NetInfo from '@react-native-community/netinfo';
import DatabaseConnection from '../infra/sqlite/connection';
import { SupabaseUserRepository } from '../infra/repositories/supabaseUserRepository';
import { SupabaseVinylRepository } from '../infra/repositories/supabaseVinylRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { IVinylRecordRepository } from '../domain/repositories/IVinylRecordRepository';
import { User } from '../domain/entities/User';
import { VinylRecord } from '../domain/entities/VinylRecord';
import { Name } from '../domain/value-objects/Name';
import { Email } from '../domain/value-objects/Email';
import { Password } from '../domain/value-objects/Password';
import { GeoCoordinates } from '../domain/value-objects/GeoCoordinates';
import { Photo } from '../domain/value-objects/Photo';
import {makeVinylRecordUseCases} from '../factories/makeVinylRecordUseCases'

export class SyncService {
  private static instance: SyncService;
  private isSyncing: boolean = false;
  private userRepository: IUserRepository;
  private vinylRecordRepository: IVinylRecordRepository;

  private constructor(
    userRepository: IUserRepository,
    vinylRecordRepository: IVinylRecordRepository
  ) {
    this.userRepository = userRepository;
    this.vinylRecordRepository = vinylRecordRepository;
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.syncAllPendingChanges();
      }
    });
  }

  public static getInstance(
    userRepository: IUserRepository = SupabaseUserRepository.getInstance(),
    vinylRecordRepository: IVinylRecordRepository = SupabaseVinylRepository.getInstance()
  ): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService(userRepository, vinylRecordRepository);
    }
    return SyncService.instance;
  }

  private async syncAllPendingChanges() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log('Starting sync...');

    try {
      await this.syncUsers();
      await this.syncVinylRecords();
      await this.processSyncLog();
      console.log('Sync finished successfully.');
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncUsers() {
    const db = await DatabaseConnection.getConnection();
    const pendingUsers = await db.getAllAsync<any>("SELECT * FROM users WHERE sync_status != 'synced'");

    for (const userRow of pendingUsers) {
      const user = User.create(
        userRow.id,
        Name.create(userRow.name),
        Email.create(userRow.email),
        Password.create(userRow.password_hash),
        GeoCoordinates.create(userRow.latitude, userRow.longitude)
      );

      try {
        if (userRow.sync_status === 'pending_create') {
          await this.userRepository.register(user);
        } else if (userRow.sync_status === 'pending_update') {
          await this.userRepository.update(user);
        }
        await db.runAsync("UPDATE users SET sync_status = 'synced' WHERE id = ?", user.id);
      } catch (error) {
        console.error(`Failed to sync user ${user.id}:`, error);
      }
    }
  }

  private async syncVinylRecords() {
    const db = await DatabaseConnection.getConnection();
    const pendingRecords = await db.getAllAsync<any>("SELECT * FROM vinyl_records WHERE sync_status != 'synced'");

    for (const recordRow of pendingRecords) {
      let photoUrl = recordRow.photo_url;

      try {
        if (photoUrl.startsWith('file://')) {
          console.log(`Uploading local image: ${photoUrl}`);
          const vinylRecordUseCases = makeVinylRecordUseCases();
          const uploadedPhotoUrl = await vinylRecordUseCases.uploadFile.execute({
            imageUri: photoUrl,
            bucket: 'photos',
            userId: recordRow.owner_id,
          });
          console.log(`Image uploaded. Remote URL: ${uploadedPhotoUrl}`);
          photoUrl = uploadedPhotoUrl;
        }

        if (!photoUrl) {
            throw new Error("Photo URL became null or undefined after upload attempt.");
        }

        const record = VinylRecord.create(
          recordRow.id,
          Name.create(recordRow.band),
          Name.create(recordRow.album),
          recordRow.year,
          recordRow.number_of_tracks,
          Photo.create(photoUrl),
          recordRow.owner_id
        );

        if (recordRow.sync_status === 'pending_create') {
          await this.vinylRecordRepository.save(record);
        } else if (recordRow.sync_status === 'pending_update') {
          await this.vinylRecordRepository.update(record);
        }

        await db.runAsync(
          "UPDATE vinyl_records SET photo_url = ?, sync_status = 'synced' WHERE id = ?",
          photoUrl,
          recordRow.id
        );

      } catch (error) {
        console.error(`Failed to sync vinyl record ${recordRow.id}:`, error);
      }
    }
  }

  private async processSyncLog() {
    const db = await DatabaseConnection.getConnection();
    const logEntries = await db.getAllAsync<any>("SELECT * FROM sync_log WHERE action = 'delete'");

    for (const logEntry of logEntries) {
      try {
        if (logEntry.entity_type === 'user') {
          await this.userRepository.delete(logEntry.entity_id);
        } else if (logEntry.entity_type === 'vinyl_record') {
          await this.vinylRecordRepository.delete(logEntry.entity_id);
        }
        await db.runAsync("DELETE FROM sync_log WHERE id = ?", logEntry.id);
      } catch (error) {
        console.error(`Failed to process sync_log entry ${logEntry.id}:`, error);
      }
    }
  }

  public async fetchAndSyncRemoteData() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log('Fetching remote data and syncing local DB...');

    try {
      const remoteUsers = await this.userRepository.findAll();
      await this.updateLocalUsers(remoteUsers);

      const remoteVinylRecords = await this.vinylRecordRepository.findAll();
      await this.updateLocalVinylRecords(remoteVinylRecords);

      console.log('Remote data sync finished successfully.');
    } catch (error) {
      console.error('Error during remote data sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async updateLocalUsers(remoteUsers: User[]) {
    const db = await DatabaseConnection.getConnection();
    for (const remoteUser of remoteUsers) {
      await db.runAsync(
        'INSERT OR REPLACE INTO users (id, name, email, password_hash, latitude, longitude, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        remoteUser.id,
        remoteUser.name.value,
        remoteUser.email.value,
        remoteUser.password.value,
        remoteUser.location.latitude,
        remoteUser.location.longitude,
        'synced'
      );
    }
  }

  private async updateLocalVinylRecords(remoteRecords: VinylRecord[]) {
    const db = await DatabaseConnection.getConnection();
    for (const remoteRecord of remoteRecords) {
      await db.runAsync(
        'INSERT OR REPLACE INTO vinyl_records (id, band, album, year, number_of_tracks, photo_url, owner_id, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        remoteRecord.id,
        remoteRecord.band.value,
        remoteRecord.album.value,
        remoteRecord.year,
        remoteRecord.numberOfTracks,
        remoteRecord.photo.url,
        remoteRecord.ownerId,
        'synced'
      );
    }
  }
}
