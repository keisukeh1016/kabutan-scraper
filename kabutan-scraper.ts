import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import * as dotenv from "dotenv";
import * as fs from "node:fs/promises";
import * as path from "node:path";

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

// TypeScript関連
type Stock = {
  info: StockInfo;
  financial: StockFinancial;
};

type StockInfo = {
  code: string;
  name: string;
  market: string;
};

type StockFinancial = {
  YoYForecastNetSales: string;
  YoYForecastOperatingProfit: string;
  YoYForecastOrdinaryProfit: string;
  YoYForecastProfit: string;
  YoYForecastEarningsPerShare: string;
  YoYNetSales: string;
  YoYOperatingProfit: string;
  YoYOrdinaryProfit: string;
  YoYProfit: string;
  YoYEarningsPerShare: string;
  QoQNetSales: string;
  QoQOperatingProfit: string;
  QoQOrdinaryProfit: string;
  QoQProfit: string;
  QoQEarningsPerShare: string;
};

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
    stocks = getRangeStocks(1300, 8700);
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
  const url = `https://kabutan.jp/stock/?code=${stock.info.code}`;
  const response = await getAxiosResponse(url, 1);
  if (response === null) {
    return null;
  }
  const info = parseStockInfo(response);
  if (info === null) {
    return null;
  }
  stock.info = info;
  return stock;
}

async function scrapeKabutanStockFinancial(
  stock: Stock
): Promise<Stock | null> {
  const url = `https://kabutan.jp/stock/finance?code=${stock.info.code}`;
  const response = await getAxiosResponse(url, 1);
  if (response === null) {
    return null;
  }
  const financial = parseStockFinancial(response);
  if (financial === null) {
    return null;
  }
  stock.financial = financial;
  return stock;
}

async function getAxiosResponse(
  url: string,
  count: number
): Promise<AxiosResponse<any, any> | null> {
  try {
    const response = await axios.get(url);
    return response;
  } catch (error: any) {
    if (error instanceof axios.AxiosError) {
      switch (error.response?.status.toString()[0]) {
        case "5":
          // サーバーエラーの場合、最大5回のリクエストを実行する
          if (count > 5) {
            return null;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, count * 10 * 1000)
          );
          console.log(`リクエスト${count + 1}回目 "${url}"`);

          const response = await getAxiosResponse(url, count + 1);
          return response;
        default:
          return null;
      }
    }
    throw new Error(`Failed to get data: ${error.message}`);
  }
}

// HTML解析処理関連
function parseStockInfo(response: AxiosResponse<any, any>): StockInfo | null {
  const info = newStockInfo();

  const $ = cheerio.load(response.data);

  info.code = $("#stockinfo_i1")
    .find("div.si_i1_1")
    .find("h2")
    .contents()
    .eq(0)
    .text()
    .trim();
  if (info.code === "") {
    return null;
  }

  info.name = $("#kobetsu_right")
    .find("div.company_block")
    .find("h3")
    .text()
    .trim();
  if (info.name === "") {
    return null;
  }

  info.market = $("#stockinfo_i1")
    .find("div.si_i1_1")
    .find("span.market")
    .text()
    .trim();
  if (!["東証Ｐ", "東証Ｓ", "東証Ｇ"].includes(info.market)) {
    return null;
  }

  return info;
}

function parseStockFinancial(
  response: AxiosResponse<any, any>
): StockFinancial | null {
  const financial = newStockFinancial();

  const $ = cheerio.load(response.data);

  const YoYForecasts = $("#finance_box")
    .find("div.fin_year_t0_d.fin_year_result_d")
    .find("table")
    .find("tbody")
    .find("tr")
    .find("th:contains('前期比')")
    .parent()
    .children();

  financial.YoYForecastNetSales = YoYForecasts.eq(1).text().trim();
  financial.YoYForecastOperatingProfit = YoYForecasts.eq(2).text().trim();
  financial.YoYForecastOrdinaryProfit = YoYForecasts.eq(3).text().trim();
  financial.YoYForecastProfit = YoYForecasts.eq(4).text().trim();
  financial.YoYForecastEarningsPerShare = YoYForecasts.eq(5).text().trim();

  const YoY = $("#finance_box")
    .find("table")
    .find("tbody")
    .find("tr")
    .find("th:contains('前年比')")
    .parent()
    .children();

  financial.YoYNetSales = YoY.eq(1).text().trim();
  financial.YoYOperatingProfit = YoY.eq(2).text().trim();
  financial.YoYOrdinaryProfit = YoY.eq(3).text().trim();
  financial.YoYProfit = YoY.eq(4).text().trim();
  financial.YoYEarningsPerShare = YoY.eq(5).text().trim();

  const QoQ = $("#finance_box")
    .find("div.fin_quarter_t0_d.fin_quarter_result_d")
    .find("table")
    .find("tbody")
    .find("tr")
    .find("th:contains('前年同期比')")
    .parent()
    .children();

  financial.QoQNetSales = QoQ.eq(1).text().trim();
  financial.QoQOperatingProfit = QoQ.eq(2).text().trim();
  financial.QoQOrdinaryProfit = QoQ.eq(3).text().trim();
  financial.QoQProfit = QoQ.eq(4).text().trim();
  financial.QoQEarningsPerShare = QoQ.eq(5).text().trim();

  formatFinancial(financial);

  return financial;
}

function formatFinancial(financial: StockFinancial) {
  for (const key of Object.keys(financial) as (keyof StockFinancial)[]) {
    const value = financial[key];

    if (value === "－") {
      financial[key] = "";
      continue;
    }

    const isNum = value.split("").some((v) => /\d/.test(v));
    if (!isNum) {
      continue;
    }

    if (value.endsWith("倍")) {
      const times = Number(value.replace("倍", ""));
      const percent = (times - 1) * 100;
      const raw = percent / 100;
      financial[key] = raw.toFixed(3);
    } else {
      const percent = Number(value);
      const raw = percent / 100;
      financial[key] = raw.toFixed(3);
    }
  }
}
