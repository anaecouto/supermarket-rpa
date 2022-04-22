import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BigService } from './big/bigService';
import { CarrefourService } from './carrefour/carrefour.service';
import { SupermarketController } from './supermarket.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'supermarket-rpa',
            brokers: ['localhost:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [SupermarketController],
  providers: [CarrefourService, BigService],
})
export class SupermarketModule {}
