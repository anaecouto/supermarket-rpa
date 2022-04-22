import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Product from 'src/product.interface';
import IData from 'src/shared/interfaces/data.interface';
import { SupermarketService } from '../supermarket.service';

puppeteer.use(StealthPlugin());

@Injectable()
export class BigService extends SupermarketService {
  constructor(@Inject('KAFKA_SERVICE') private client: ClientKafka) {
    super();
  }

  async run(data: IData) {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
      ],
      slowMo: 10,
    });

    let createProduct: Product;

    try {
      console.log('Opening puppeteer...');

      const page = await browser.newPage();

      console.log(`Entering website...`);

      await page.goto('https://www.big.com.br/', {
        waitUntil: 'networkidle2',
      });

      await page.waitForSelector('.vtex-cep');

      await page.click('.vtex-cep');

      console.log('Typing zip code...');

      await page.keyboard.type(data.zipCode);

      await page.keyboard.press('Enter');

      await page.waitForNavigation({
        waitUntil: 'networkidle2',
      });

      console.log('Searching for product...');

      await page.type('input', data.eanGtin);

      await page.keyboard.press('Enter');

      // needs to be fixed
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
      });

      const checkProductAvailability = await page.$(
        '.vtex-flex-layout-0-x-flexColChild--emptySearch:nth-child(2)',
      );

      const productNameHandle = await page.$(
        `.vtex-product-summary-2-x-productBrand`,
      );

      if (productNameHandle && !checkProductAvailability) {
        const productName = await productNameHandle.evaluate(
          (productSummary) => productSummary.textContent,
        );

        const unformatedPriceHandle = await page.$(
          '.vtex-productShowCasePrice',
        );

        if (unformatedPriceHandle) {
          console.log('Product found! Collecting data...');
          const unformattedPrice = await page.$eval(
            `.vtex-productShowCasePrice`,
            (el) => el.textContent,
          );

          const price = this.priceConversion(
            unformattedPrice.match(/\d+,\d{2}/gim)[0].replace(',', '.'),
          );

          const productImage = await page.$eval(
            `.vtex-product-summary-2-x-imageNormal`,
            (el) => el.getAttribute('src'),
          );

          createProduct = {
            id: data.id,
            gtin: data.eanGtin,
            productName,
            price,
            productImage,
            search_date: this.dateWithTimezone(-3),
          };
        } else {
          console.log('!!! Product not available');
          createProduct = {
            id: data.id,
            gtin: data.eanGtin,
            productName: 'Este produto não está disponível',
            price: null,
            productImage: null,
            search_date: this.dateWithTimezone(-3),
          };
        }
      } else {
        console.log('!!! Product not available');
        createProduct = {
          id: data.id,
          gtin: data.eanGtin,
          productName: 'Este produto não está disponível',
          price: null,
          productImage: null,
          search_date: this.dateWithTimezone(-3),
        };
      }
    } catch (err) {
      console.log(err);
    } finally {
      console.log('Adding products...');
      this.writeData('src/big/bigItems.json', createProduct);
      await browser.close();
    }
  }
}
