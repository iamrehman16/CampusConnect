import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CompleteOnboardingDto } from './complete-onboarding.dto';

const base = {
  department: 'Computer Science',
  semester: 5,
  interests: ['Databases'],
  academicInfo: 'BS CS',
  expertise: [],
  isOpenToMentor: false,
  avatar: '',
};

async function check(name: unknown) {
  const dto = plainToInstance(CompleteOnboardingDto, { ...base, name });
  const errors = await validate(dto);
  return { dto, errors };
}

describe('CompleteOnboardingDto — display name', () => {
  it('trims and accepts a real name', async () => {
    const { dto, errors } = await check('  Abdur Rahman ');
    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('Abdur Rahman');
  });

  it.each(['', '   '])('rejects a blank name (%j)', async (name) => {
    const { errors } = await check(name);
    expect(errors.map((e) => e.property)).toContain('name');
  });
});
