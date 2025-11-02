import { User } from '../entities/User';
import { IUserRepository } from '../repositories/IUserRepository';
import { Name } from '../value-objects/Name';
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';
import { GeoCoordinates } from '../value-objects/GeoCoordinates';

export class RegisterUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(params: {
    name: string;
    email: string;
    password: string;
    latitude: number;
    longitude: number;
  }): Promise<User> {
    const { name, email, password, latitude, longitude } = params;

    const userExists = await this.userRepository.findByEmail(email);
    
    if (userExists) {
      throw new Error('User already exists');
    }

    const user = User.create(
      '', // ID is empty, to be filled by repository
      Name.create(name),
      Email.create(email),
      Password.create(password), // Pass plain password
      GeoCoordinates.create(latitude, longitude)
    );

    return this.userRepository.register(user);
  }
}