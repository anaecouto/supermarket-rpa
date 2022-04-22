import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import IData from './shared/interfaces/data.interface';

@Injectable()
export abstract class SupermarketService {
  writeData(path: string, content: any): void {
    try {
      fs.appendFileSync(path, JSON.stringify(content) + ',');
    } catch (err) {
      console.log(err);
    }
  }

  priceConversion(string: string): number {
    return Number.parseFloat(string);
  }

  dateWithTimezone(timezone: number): Date {
    return new Date(new Date().getTime() + timezone * 3600 * 1000);
  }

  getContent(content: string): string {
    return content;
  }

  abstract run(data: IData): Promise<void>;
}
