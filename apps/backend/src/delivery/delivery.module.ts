import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { GoogleMapsService } from '../integrations/google-maps.service';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService, GoogleMapsService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
