import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
dotenv.config();
import mongoose from 'mongoose';

mongoose.set('debug', true);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //setting up cors
  app.enableCors({
    origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
  });

  //global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // global filters
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  //set common prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3101;

  await app.listen(port ?? 3101);
  console.log(`Server listening on Port ${port}`);
}
bootstrap();
