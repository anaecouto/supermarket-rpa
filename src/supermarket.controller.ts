import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Response } from 'express';
import { BigService } from './big/bigService';
import { CarrefourService } from './carrefour/carrefour.service';
import IData from './shared/interfaces/data.interface';

@Controller('/supermarket')
export class SupermarketController {
  constructor(
    private readonly carrefourService: CarrefourService,
    private readonly bigService: BigService,
  ) {}

  @Post('/big')
  bigRun(@Body() data: IData, @Res() res: Response): void {
    this.bigService.run(data);
    res.status(HttpStatus.OK).json([]);
  }

  @Post('/carrefour')
  carrefourRun(@Body() data: IData, @Res() res: Response): void {
    this.carrefourService.run(data);
    res.status(HttpStatus.OK).json([]);
  }

  /** NEEDS MAJOR FIXING **/
  // @MessagePattern('supermarket.producer')
  // async bigMessagePost(@Payload() data): Promise<void> {
  //   await this.bigService.run(data.value);
  // }

  @MessagePattern('products.producer')
  async carrefourMessagePost(@Payload() data): Promise<void> {
    await this.carrefourService.run(data.value);
  }
}
