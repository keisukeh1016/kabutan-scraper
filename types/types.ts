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
