import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino as the global logger
  app.useLogger(app.get(Logger));

  // Enable Security Headers
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3001', 'https://knackherbal.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
  });

  // Enable GZIP Compression
  app.use(compression());

  // Enable Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Register Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Register Transform Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Configure Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Knack Herbal API')
    .setDescription('The official backend API documentation for Knack Herbal.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token here',
        in: 'header',
      },
      'JWT-auth', 
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);

  // Start the server
  await app.listen(3000);
}
bootstrap();