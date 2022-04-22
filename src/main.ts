import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SupermarketModule } from './supermarket.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SupermarketModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'supermarket-rpa',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'products-consumer',
        },
        subscribe: {
          fromBeginning: true,
        },
        run: {
          autoCommitThreshold: 1,
        },
      },
    },
  );

  await app.listen();
}
bootstrap();
