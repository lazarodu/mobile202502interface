import DatabaseConnection from './connection';
import { IVinylRecordRepository } from '../../domain/repositories/IVinylRecordRepository';
import { VinylRecord } from '../../domain/entities/VinylRecord';
import { Name } from '../../domain/value-objects/Name';
import { Photo } from '../../domain/value-objects/Photo';
import { v4 as uuid } from 'uuid';

export class SQLiteVinylRecordRepository implements IVinylRecordRepository {
  private static instance: SQLiteVinylRecordRepository;

  private constructor() {}

  public static getInstance(): SQLiteVinylRecordRepository {
    if (!SQLiteVinylRecordRepository.instance) {
      SQLiteVinylRecordRepository.instance = new SQLiteVinylRecordRepository();
    }
    return SQLiteVinylRecordRepository.instance;
  }

  async save(record: VinylRecord): Promise<void> {
    const db = await DatabaseConnection.getConnection();
    const id = uuid();
    await db.runAsync(
      'INSERT INTO vinyl_records (id, band, album, year, number_of_tracks, photo_url, owner_id, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, record.band.value, record.album.value, record.year, record.numberOfTracks, record.photo.url, record.ownerId, 'pending_create'
    );
  }

  async findById(id: string): Promise<VinylRecord | null> {
    const db = await DatabaseConnection.getConnection();
    const recordRow = await db.getFirstAsync<any>(
      'SELECT * FROM vinyl_records WHERE id = ?',
      id
    );

    if (recordRow) {
      return VinylRecord.create(
        recordRow.id,
        Name.create(recordRow.band),
        Name.create(recordRow.album),
        recordRow.year,
        recordRow.number_of_tracks,
        Photo.create(recordRow.photo_url),
        recordRow.owner_id
      );
    }
    return null;
  }

  async findAll(): Promise<VinylRecord[]> {
    const db = await DatabaseConnection.getConnection();
    const recordRows = await db.getAllAsync<any>('SELECT * FROM vinyl_records');
    return recordRows.map(recordRow =>
      VinylRecord.create(
        recordRow.id,
        Name.create(recordRow.band),
        Name.create(recordRow.album),
        recordRow.year,
        recordRow.number_of_tracks,
        Photo.create(recordRow.photo_url),
        recordRow.owner_id
      )
    );
  }

  async update(record: VinylRecord): Promise<void> {
    const db = await DatabaseConnection.getConnection();
    await db.runAsync(
      "UPDATE vinyl_records SET band = ?, album = ?, year = ?, number_of_tracks = ?, photo_url = ?, sync_status = CASE WHEN sync_status = 'synced' THEN 'pending_update' ELSE sync_status END WHERE id = ?",
      record.band.value, record.album.value, record.year, record.numberOfTracks, record.photo.url, record.id
    );
  }

  async delete(id: string): Promise<void> {
    const db = await DatabaseConnection.getConnection();
    await db.runAsync("INSERT INTO sync_log (entity_type, entity_id, action) VALUES ('vinyl_record', ?, 'delete')", id);
    await db.runAsync('DELETE FROM vinyl_records WHERE id = ?', id);
  }
}
