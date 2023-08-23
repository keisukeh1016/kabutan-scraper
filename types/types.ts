export type Stock = {
  info: StockInfo;
  financial: StockFinancial;
};

export type StockInfo = {
  code: string;
  name: string;
  market: string;
};

export type StockFinancial = {
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

export type Performance = {
  netSales: string;
  operatingProfit: string;
  ordinaryProfit: string;
  profit: string;
  earningsPerShare: string;
};

export const MARKET = ["東証Ｐ", "東証Ｓ", "東証Ｇ"] as const;
export type Market = (typeof MARKET)[number];
