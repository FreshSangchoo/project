import {ResponseStock, stockPriceArr} from '@/api/stock';
import {CandleData} from './CandleChart';

type StockPrice = {
  close: number;
  createdAt: string;
  high: number;
  low: number;
  open: number;
  stockHistoryId: number;
};

const transformStockData = (rawData: ResponseStock): CandleData[] => {
  return rawData?.stockHistories?.map((item: StockPrice) => ({
    x: item.createdAt,
    shadowH: item.high,
    shadowL: item.low,
    open: item.open,
    close: item.close,
  }));
};

export default transformStockData;
