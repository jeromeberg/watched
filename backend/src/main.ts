import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

const PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN') || '*' });
  await app.listen(PORT);
  console.log(`Backend listening on port ${PORT}`);
}
bootstrap();
