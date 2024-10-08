import { SimpleAdapter, FetchResultFees, FetchOptions } from "../../adapters/types";
import fetchURL from "../../utils/fetchURL";
import { CHAIN } from "../../helpers/chains";

const DAILYURL = 'https://api.myx.finance/v2/scan/defilama/fee/all_by_chain'
const TOTALURL = 'https://api.myx.finance/v2/scan/defilama/cum_fee/all_by_chain'

enum FetchType {
  TOTAL = 1,
  DAILY = 2
}

type Data = {
  chainId: number,
  time: number,
  tradingFee?: string,
  cumTradingFee?: string
}

const methodology = {
  totalFees: "Tracks the cumulative fees generated by all transactions.",
  dailyFees: "Tracks the fees generated by transactions on a daily basis.",
}


const fetchApi = async (type: FetchType, startTime: number, endTime: number) => {
  const rs = await fetchURL(`${type === FetchType.DAILY ? DAILYURL : TOTALURL}?startTime=${startTime}&endTime=${endTime}`)
  const data: Data[] = rs?.data ?? []

  return data
}

const fetchFees = async (_t: any, _b: any, optios: FetchOptions) => {
  const start = optios.startOfDay;
  const end = start + 86400;
  const dailyAlls: Data[] = await fetchApi(FetchType.DAILY, start, end)
  const dailyFees = dailyAlls.find((daily: Data)=> daily.chainId === optios.toApi.chainId)

  const totalAlls: Data[] = await fetchApi(FetchType.TOTAL, start, end)
  const totalFees = totalAlls.find((daily: Data)=> daily.chainId === optios.toApi.chainId)

  return {
    totalFees: totalFees?.tradingFee,
    dailyFees: dailyFees?.tradingFee,
    timestamp: optios.startTimestamp
  }
}

const startTimestamps: { [chain: string]: number } = {
  [CHAIN.ARBITRUM]: 1706659200,
  [CHAIN.LINEA]: 1708473600,
}

const adapter: SimpleAdapter = {
  version: 1,
  adapter: {
    [CHAIN.ARBITRUM]: {
      fetch: fetchFees,
      start: startTimestamps[CHAIN.ARBITRUM],
      meta: {
        methodology
      }
    },
    [CHAIN.LINEA]: {
      fetch: fetchFees,
      start: startTimestamps[CHAIN.LINEA],
      meta: {
        methodology
      }
    },
  }
}

export default adapter;
