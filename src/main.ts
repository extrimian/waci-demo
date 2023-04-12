import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('WACI Demo API')
    .setDescription('A Demo API for performing the basic SSI flow')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = 'api';
  SwaggerModule.setup(swaggerPath, app, document);
  Logger.log(
    `Swagger UI available at http://localhost:3000/${swaggerPath}`,
    'Bootstrap',
  );
  await app.listen(3000);
}
bootstrap();
