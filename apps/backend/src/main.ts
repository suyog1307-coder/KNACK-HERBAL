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

  // 1. Prefix all routes with /api (Must be done BEFORE Swagger)
 app.setGlobalPrefix('api/v1');

  // 2. Use Pino as the global logger
  app.useLogger(app.get(Logger));

  // 3. Enable Security Headers
  app.use(helmet());

  // 4. Enable CORS for frontend origins
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://knackherbal.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
  });

  // 5. Enable GZIP Compression
  app.use(compression());

  // 6. Enable Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 7. Register Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 8. Register Transform Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // 9. Configure Swagger API Documentation
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
  SwaggerModule.setup('api/v1/docs', app, document);

  // 10. Start the server (Using 3000 so Next.js can run on 3000 without conflict)
  const PORT = process.env.PORT || 3000; // (or 3001 if you changed it)
await app.listen(PORT);

console.log(`🚀 API is running on: http://localhost:${PORT}/api/v1`);
console.log(`📚 Swagger Docs available at: http://localhost:${PORT}/api/v1/docs`);
}
bootstrap();