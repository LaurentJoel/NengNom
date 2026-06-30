/**
 * User factory for test data generation
 * Uses @faker-js/faker for realistic French context
 */
import { faker } from '@faker-js/faker/locale/fr'
import type { RegisterInput } from '@neng-nom/shared/schemas'

export const userFactory = {
  buildRegisterInput: (
    overrides: Partial<RegisterInput> = {}
  ): RegisterInput => ({
    email: faker.internet.email().toLowerCase(),
    phone: `+237${faker.string.numeric(9)}`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    fullName: faker.person.fullName(),
    role: 'FARMER',
    country: 'CM',
    region: faker.helpers.arrayElement([
      'Littoral',
      'Centre',
      'Ouest',
      'Nord',
    ]),
    ...overrides,
  }),

  buildLoginInput: (email?: string, password?: string) => ({
    email: email || faker.internet.email(),
    password: password || 'Password123!',
  }),
}
