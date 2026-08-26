import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { RegisterDto } from '../../auth/dto/auth.dto';
import { AddTitleDto } from './add-title.dto';
import { TitleListQueryDto } from './title-list-query.dto';

/** Build the validation configuration used by HTTP requests. */
function createValidationPipe() {
  return new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
}

/** Validate one request value using the supplied DTO. */
function validate<T>(value: unknown, metatype: new () => T, type: 'body' | 'query') {
  return createValidationPipe().transform(value, { type, metatype });
}

describe('validated DTOs', () => {
  it('trims valid registration input', async () => {
    const dto = await validate({ username: '  alice  ', password: 'password1' }, RegisterDto, 'body');

    expect(dto).toMatchObject({ username: 'alice', password: 'password1' });
  });

  it('rejects invalid add-title fields', async () => {
    await expect(validate({ tmdbId: '0', title: 'Example' }, AddTitleDto, 'body')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects unknown fields', async () => {
    await expect(
      validate({ tmdbId: '7', title: 'Example', extra: true }, AddTitleDto, 'body'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transforms lowercase title-list status and numeric limit', async () => {
    const query = await validate(
      { status: 'to_watch', order: 'rating', limit: '10' },
      TitleListQueryDto,
      'query',
    );

    expect(query).toMatchObject({ status: 'TO_WATCH', order: 'rating', limit: 10 });
  });

  it('rejects invalid title-list values', async () => {
    await expect(validate({ status: 'later' }, TitleListQueryDto, 'query')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(validate({ limit: '0' }, TitleListQueryDto, 'query')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
