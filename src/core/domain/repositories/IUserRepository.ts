import { User } from '../entities/User';

export interface IUserRepository {
  register(user: User): Promise<User>;
  authenticate(email: string, password: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
}