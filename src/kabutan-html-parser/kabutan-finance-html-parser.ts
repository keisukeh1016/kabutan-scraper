// npm
import * as cheerio from "cheerio";

// types
import { Performance, StockFinancial } from "../../types/types";

export class KabutanFinanceHtmlParser {
  private cheerioRoot: cheerio.Root;

  public constructor(html: string) {
    this.cheerioRoot = cheerio.load(html);
  }

  private getYoYForecastPerformance(): Performance | null {
    const elements = this.cheerioRoot("#finance_box")
      .find("div.fin_year_t0_d.fin_year_result_d")
      .find("table")
      .find("tbody")
      .find("tr")
      .find("th:contains('前期比')")
      .parent()
      .children();

    const netSales = elements.eq(1).text().trim();
    if (netSales === "") {
      return null;
    }

    const operatingProfit = elements.eq(2).text().trim();
    if (operatingProfit === "") {
      return null;
    }

    const ordinaryProfit = elements.eq(3).text().trim();
    if (ordinaryProfit === "") {
      return null;
    }

    const profit = elements.eq(4).text().trim();
    if (profit === "") {
      return null;
    }

    const earningsPerShare = elements.eq(5).text().trim();
    if (earningsPerShare === "") {
      return null;
    }

    const performance: Performance = {
      netSales: netSales,
      operatingProfit: operatingProfit,
      ordinaryProfit: ordinaryProfit,
      profit: profit,
      earningsPerShare: earningsPerShare,
    };

    return performance;
  }

  private getYoYPerformance(): Performance | null {
    const elements = this.cheerioRoot("#finance_box")
      .find("div.fin_quarter_t0_d.fin_quarter_result_d")
      .find("table")
      .find("tbody")
      .find("tr")
      .find("th:contains('前年同期比')")
      .parent()
      .children();

    const netSales = elements.eq(1).text().trim();
    if (netSales === "") {
      return null;
    }

    const operatingProfit = elements.eq(2).text().trim();
    if (operatingProfit === "") {
      return null;
    }

    const ordinaryProfit = elements.eq(3).text().trim();
    if (ordinaryProfit === "") {
      return null;
    }

    const profit = elements.eq(4).text().trim();
    if (profit === "") {
      return null;
    }

    const earningsPerShare = elements.eq(5).text().trim();
    if (earningsPerShare === "") {
      return null;
    }

    const performance: Performance = {
      netSales: netSales,
      operatingProfit: operatingProfit,
      ordinaryProfit: ordinaryProfit,
      profit: profit,
      earningsPerShare: earningsPerShare,
    };

    return performance;
  }

  private formatFinancial(financial: StockFinancial) {
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

  public getStockFinancial(): StockFinancial | null {
    const YoYForecastPerformance = this.getYoYForecastPerformance();
    if (YoYForecastPerformance === null) {
      return null;
    }

    const YoYPerformance = this.getYoYPerformance();
    if (YoYPerformance === null) {
      return null;
    }

    const finance: StockFinancial = {
      YoYForecastNetSales: YoYForecastPerformance.netSales,
      YoYForecastOperatingProfit: YoYForecastPerformance.operatingProfit,
      YoYForecastOrdinaryProfit: YoYForecastPerformance.ordinaryProfit,
      YoYForecastProfit: YoYForecastPerformance.profit,
      YoYForecastEarningsPerShare: YoYForecastPerformance.earningsPerShare,
      YoYNetSales: YoYPerformance.netSales,
      YoYOperatingProfit: YoYPerformance.operatingProfit,
      YoYOrdinaryProfit: YoYPerformance.ordinaryProfit,
      YoYProfit: YoYPerformance.profit,
      YoYEarningsPerShare: YoYPerformance.earningsPerShare,
      QoQNetSales: "",
      QoQOperatingProfit: "",
      QoQOrdinaryProfit: "",
      QoQProfit: "",
      QoQEarningsPerShare: "",
    };

    this.formatFinancial(finance);

    return finance;
  }
}
