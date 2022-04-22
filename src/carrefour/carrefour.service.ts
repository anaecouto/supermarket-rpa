import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Product from 'src/product.interface';
import IData from 'src/shared/interfaces/data.interface';
import { SupermarketService } from '../supermarket.service';

puppeteer.use(StealthPlugin());

@Injectable()
export class CarrefourService extends SupermarketService {
  constructor() {
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
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (
          ['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      console.log(`Entering website...`);

      await page.goto('https://mercado.carrefour.com.br/', {
        waitUntil: 'networkidle2',
      });

      await page.waitForSelector('.css-1fj1bi0');

      await page.click('.css-1fj1bi0');

      await page.waitForSelector('input#zipcode');

      console.log('Typing zip code...');

      await page.keyboard.type(data.zipCode);

      await page.keyboard.press('Enter');

      await page.waitForSelector('input#zipcode', { visible: false });

      await page.click(`input[type="search"]`);

      console.log('Searching for product...');

      await page.keyboard.type(data.eanGtin);

      await page.waitForTimeout(300);

      await page.keyboard.press('Enter');

      await page.waitForSelector('.css-s2g6r9');

      const productNameHandle = await page.$(
        `[data-testid="productSummaryTitle"]`,
      );

      if (productNameHandle) {
        console.log('Product found! Collecting data...');
        const productName = this.getContent(
          await productNameHandle.evaluate(
            (productSummary) => productSummary.textContent,
          ),
        );
        const unformattedPrice = this.getContent(
          await page.$eval(
            `[data-testid="offerPrice"]`,
            (el) => el.textContent,
          ),
        );
        const price = this.priceConversion(
          unformattedPrice.match(/\d+,\d{2}/gim)[0].replace(',', '.'),
        );
        const productImage = this.getContent(
          await page.$eval(`.css-j0j5gy`, (el) => el.getAttribute('src')),
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
      console.log('Adding products...');
      this.writeData('src/carrefour/carrefourItems.json', createProduct);
    } catch (err) {
      console.log(err);
    } finally {
      await browser.close();
    }
  }
}
