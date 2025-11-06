import { supabase } from '../supabase/client/supabaseClient';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { Name } from '../../domain/value-objects/Name';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { GeoCoordinates } from '../../domain/value-objects/GeoCoordinates';

export class SupabaseUserRepository implements IUserRepository {
  private static instance: SupabaseUserRepository;

  private constructor() {}

  public static getInstance(): SupabaseUserRepository {
    if (!SupabaseUserRepository.instance) {
      SupabaseUserRepository.instance = new SupabaseUserRepository();
    }
    return SupabaseUserRepository.instance;
  }

  async register(user: User): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email.value,
      password: user.password.value, // Plain password
    });

    if (authError) {
      throw new Error(authError.message);
    }
    if (!authData.user) {
      throw new Error('Could not create user');
    }

    const { error: profileError } = await supabase.from('user').insert({
      id: authData.user.id,
      name: user.name.value,
      email: user.email.value, // Storing email in profile for easier access
      latitude: user.location.latitude,
      longitude: user.location.longitude,
    });

    if (profileError) {
      // If profile creation fails, we should ideally delete the auth user.
      // This requires admin rights and is best handled via a server-side function.
      console.error("Failed to create user profile:", profileError.message);
      throw new Error('Failed to create user profile after authentication.');
    }

    return User.create(
      authData.user.id,
      user.name,
      user.email,
      Password.create('hashed_123'), // Password should not be held in the entity after registration
      user.location
    );
  }

  async authenticate(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }
    if (!authData.user) {
      throw new Error('User not found');
    }

    const user = await this.findById(authData.user.id);
    if (!user) {
      // This case means there's an auth user without a corresponding profile.
      throw new Error('User profile not found');
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const { data: profileData, error: profileError } = await supabase
      .from('user')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
        throw new Error(profileError.message);
    }
    if (!profileData) {
      return null;
    }

    return User.create(
      profileData.id,
      Name.create(profileData.name),
      Email.create(profileData.email),
      Password.create('hashed_123'), // Password is not stored in the entity
      GeoCoordinates.create(profileData.latitude, profileData.longitude)
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data: profileData, error: profileError } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
        throw new Error(profileError.message);
    }
    if (!profileData) {
      return null;
    }

    return User.create(
      profileData.id,
      Name.create(profileData.name),
      Email.create(profileData.email),
      Password.create('hashed_123'),
      GeoCoordinates.create(profileData.latitude, profileData.longitude)
    );
  }

  async update(user: User): Promise<void> {
    const { error } = await supabase
      .from('user')
      .update({
        name: user.name.value,
        latitude: user.location.latitude,
        longitude: user.location.longitude,
        email: user.email.value,
      })
      .eq('id', user.id);

    if (error) {
      throw new Error(error.message);
    }
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser && authUser.email !== user.email.value) {
        const { error: authError } = await supabase.auth.updateUser({ email: user.email.value });
        if (authError) {
            throw new Error(`Profile updated, but failed to update auth email: ${authError.message}`);
        }
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('user').delete().eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
    console.warn("User profile deleted, but the auth user was not. This requires an admin call.");
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await supabase.from('user').select('*');

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
        return [];
    }

    return data.map(item =>
      User.create(
        item.id,
        Name.create(item.name),
        Email.create(item.email),
        Password.create('hashed_123'),
        GeoCoordinates.create(item.latitude, item.longitude)
      )
    );
  }
}