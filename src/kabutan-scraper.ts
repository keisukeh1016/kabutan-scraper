// Node.js
import * as fs from "node:fs/promises";
import * as path from "node:path";

// npm
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import * as dotenv from "dotenv";

// src
import { KabutanFinanceHttpClient } from "./kabutan-http-client/kabutan-finance-http-client";
import { KabutanTopHttpClient } from "./kabutan-http-client/kabutan-top-http-client";

import { KabutanFinanceHtmlParser } from "./kabutan-html-parser/kabutan-finance-html-parser";
import { KabutanTopHtmlParser } from "./kabutan-html-parser/kabutan-top-html-parser";

// types
import { Stock, StockInfo, StockFinancial } from "../types/types";

main();
async function main() {
  // 初期処理
  dotenv.config();

  // コマンドライン引数からフラグを取得
  const isUpdate = process.argv[2]?.toLowerCase() === "update";

  // 株探情報を取得する
  const stocks = await getStocks(isUpdate);

  // 株探情報の出力先を取得
  const directoryName = await getDirectoryName();
  const filename = getFilename(directoryName);

  // 株探情報を出力
  await outputCSV(filename, stocks);
}

function newStock(): Stock {
  const stock: Stock = {
    info: newStockInfo(),
    financial: newStockFinancial(),
  };

  return stock;
}

function newStockInfo(): StockInfo {
  const stockInfo: StockInfo = {
    code: "",
    name: "",
    market: "",
  };

  return stockInfo;
}

function newStockFinancial(): StockFinancial {
  const stockFinancial: StockFinancial = {
    YoYForecastNetSales: "",
    YoYForecastOperatingProfit: "",
    YoYForecastOrdinaryProfit: "",
    YoYForecastProfit: "",
    YoYForecastEarningsPerShare: "",
    YoYNetSales: "",
    YoYOperatingProfit: "",
    YoYOrdinaryProfit: "",
    YoYProfit: "",
    YoYEarningsPerShare: "",
    QoQNetSales: "",
    QoQOperatingProfit: "",
    QoQOrdinaryProfit: "",
    QoQProfit: "",
    QoQEarningsPerShare: "",
  };

  return stockFinancial;
}

function getRangeStocks(start: number, length: number): Stock[] {
  const stocks: Stock[] = [...Array(length)].map((_, i) => {
    const code = (start + i).toString().padStart(4, "0");
    const stock = newStock();
    stock.info.code = code;
    return stock;
  });

  return stocks;
}

// ファイル関連処理
async function readStockInfos(): Promise<Stock[]> {
  const dirname = process.env["CSV_DIRECTORY"] ?? "";
  if (dirname === "") {
    throw new Error("CSV_DIRECTORY is not found");
  }
  const files = await fs.readdir(dirname);
  if (files.length === 0) {
    throw new Error("File is not found in CSV_DIRECTORY");
  }
  const filename = path.join(dirname, files.sort().pop() as string);
  const content = await fs.readFile(filename);

  const stocks: Stock[] = parse(content.toString(), {
    columns: true,
    skip_empty_lines: true,
  }).map((v: any) => {
    const stock = newStock();
    stock.info.code = v["info.code"];
    stock.info.name = v["info.name"];
    stock.info.market = v["info.market"];
    return stock;
  });

  return stocks;
}

async function getDirectoryName(): Promise<string> {
  const dir = process.env["CSV_DIRECTORY"] ?? "";
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function getFilename(dir: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  const filename = path.join(
    dir,
    `${year}-${month}-${day}-${date.valueOf()}.csv`
  );
  return filename;
}

async function outputCSV(file: string, stocks: Stock[]): Promise<void> {
  if (stocks.length === 0) {
    console.log(`Kabutan stocks is not found`);
    console.log();
    return;
  }

  const infoKeys = Object.keys(newStockInfo()).map((key) => "info." + key);
  const financialKeys = Object.keys(newStockFinancial()).map(
    (key) => "financial." + key
  );

  const output = stringify(stocks, {
    columns: [...infoKeys, ...financialKeys],
    header: true,
  });
  await fs.writeFile(file, output);

  console.log(`Output ${stocks.length} Kabutan stocks to "${file}"`);
  console.log();
}

// HTTP関連処理
async function getStocks(isUpdate: boolean): Promise<Stock[]> {
  let stocks: Stock[] = [];

  if (isUpdate) {
    stocks = getRangeStocks(1300, 50);
    // stocks = getRangeStocks(1300, 8700);
    console.log(`${stocks.length}件のリクエストを送信開始`);
    stocks = await getStockInfos(stocks, 300);
  } else {
    stocks = await readStockInfos();
    console.log(`${stocks.length}件の銘柄情報をファイルから取得`);
  }

  console.log(`${stocks.length}件のリクエストを送信開始`);
  stocks = await getStockFinancials(stocks, 300);

  return stocks;
}

async function getStockInfos(
  stocks: Stock[],
  interval: number
): Promise<Stock[]> {
  const promises: Promise<Stock | null>[] = [];

  for (const stock of stocks) {
    const promise = scrapeKabutanStockInfo(stock);
    promises.push(promise);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  const responses = await Promise.all(promises);
  stocks = responses.filter((v) => v) as Stock[];

  return stocks;
}

async function getStockFinancials(
  stocks: Stock[],
  interval: number
): Promise<Stock[]> {
  const promises: Promise<Stock | null>[] = [];

  for (const stock of stocks) {
    const promise = scrapeKabutanStockFinancial(stock);
    promises.push(promise);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  const responses = await Promise.all(promises);
  stocks = responses.filter((v) => v) as Stock[];

  return stocks;
}

async function scrapeKabutanStockInfo(stock: Stock): Promise<Stock | null> {
  const client = new KabutanTopHttpClient(stock.info.code);
  const html = await client.getHtml();

  const parser = new KabutanTopHtmlParser(html);
  const info = parser.getStockInfo();
  if (info === null) {
    return null;
  }

  stock.info = info;
  return stock;
}

async function scrapeKabutanStockFinancial(
  stock: Stock
): Promise<Stock | null> {
  const client = new KabutanFinanceHttpClient(stock.info.code);
  const html = await client.getHtml();

  const parser = new KabutanFinanceHtmlParser(html);
  const finance = parser.getStockFinancial();
  if (finance === null) {
    return null;
  }

  stock.financial = finance;
  return stock;
}
