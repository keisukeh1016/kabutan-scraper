// npm
import * as cheerio from "cheerio";

// types
import { MARKET, Market, StockInfo } from "../../types/types";

export class KabutanTopHtmlParser {
  private cheerioRoot: cheerio.Root;

  public constructor(html: string) {
    this.cheerioRoot = cheerio.load(html);
  }

  private getCode(): string | null {
    const code = this.cheerioRoot("#stockinfo_i1")
      .find("div.si_i1_1")
      .find("h2")
      .contents()
      .eq(0)
      .text()
      .trim();

    if (code === "") {
      return null;
    }

    return code;
  }

  private getName(): string | null {
    const name = this.cheerioRoot("#kobetsu_right")
      .find("div.company_block")
      .find("h3")
      .text()
      .trim();

    if (name === "") {
      return null;
    }

    return name;
  }

  private getMarket(): Market | null {
    const market = this.cheerioRoot("#stockinfo_i1")
      .find("div.si_i1_1")
      .find("span.market")
      .text()
      .trim();

    if (!MARKET.includes(market as Market)) {
      return null;
    }

    return market as Market;
  }

  public getStockInfo(): StockInfo | null {
    const code = this.getCode();
    if (code === null) {
      return null;
    }

    const name = this.getName();
    if (name === null) {
      return null;
    }

    const market = this.getMarket();
    if (market === null) {
      return null;
    }

    const info: StockInfo = {
      code: code,
      name: name,
      market: market,
    };

    return info;
  }
}
