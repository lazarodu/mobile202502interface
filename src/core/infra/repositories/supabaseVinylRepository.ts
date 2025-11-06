import { supabase } from '../supabase/client/supabaseClient';
import { IVinylRecordRepository } from '../../domain/repositories/IVinylRecordRepository';
import { VinylRecord } from '../../domain/entities/VinylRecord';
import { Name } from '../../domain/value-objects/Name';
import { Photo } from '../../domain/value-objects/Photo';

export class SupabaseVinylRepository implements IVinylRecordRepository {
  private static instance: SupabaseVinylRepository;

  private constructor() {}

  public static getInstance(): SupabaseVinylRepository {
    if (!SupabaseVinylRepository.instance) {
      SupabaseVinylRepository.instance = new SupabaseVinylRepository();
    }
    return SupabaseVinylRepository.instance;
  }

  async save(record: VinylRecord): Promise<void> {
    const { error } = await supabase.from('vinyl').insert({
      id: record.id,
      band: record.band.value,
      album: record.album.value,
      year: record.year,
      number_of_tracks: record.numberOfTracks,
      photo: record.photo.url,
      owner_id: record.ownerId,
    });

    if (error) {
      console.error('Error saving vinyl record:', error);
      throw new Error(error.message);
    }
  }

  async findById(id: string): Promise<VinylRecord | null> {
    const { data, error } = await supabase
      .from('vinyl')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    return VinylRecord.create(
      data.id,
      Name.create(data.band),
      Name.create(data.album),
      data.year,
      data.number_of_tracks,
      Photo.create(data.photo),
      data.owner_id
    );
  }

  async findAll(): Promise<VinylRecord[]> {
    const { data, error } = await supabase.from('vinyl').select('*');

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
        return [];
    }

    return data.map(item =>
      VinylRecord.create(
        item.id,
        Name.create(item.band),
        Name.create(item.album),
        item.year,
        item.number_of_tracks,
        Photo.create(item.photo),
        item.owner_id
      )
    );
  }

  async update(record: VinylRecord): Promise<void> {
    const { error } = await supabase
      .from('vinyl')
      .update({
        band: record.band.value,
        album: record.album.value,
        year: record.year,
        number_of_tracks: record.numberOfTracks,
        photo: record.photo.url,
      })
      .eq('id', record.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('vinyl').delete().eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
  }
}
