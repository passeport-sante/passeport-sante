import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // FRONTEND_URL peut contenir plusieurs origines séparées par des virgules.
  // On accepte aussi la variante avec/sans "www." : le site répond sur les deux,
  // et sans ça un élève qui tape www.… voit « Failed to fetch » (blocage CORS).
  const allowedOrigins = new Set<string>();
  for (const raw of (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')) {
    const url = raw.trim().replace(/\/$/, '');
    if (!url) continue;
    allowedOrigins.add(url);
    allowedOrigins.add(
      url.includes('://www.') ? url.replace('://www.', '://') : url.replace('://', '://www.'),
    );
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Pas d'en-tête Origin (curl, appels serveur à serveur) : autorisé.
      callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Prevention Platform API')
    .setDescription('API de la plateforme de prevention')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}/api`);
  console.log(`Swagger docs:           http://localhost:${port}/api/docs`);
}
bootstrap();
