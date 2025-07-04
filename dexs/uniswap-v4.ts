import { FetchOptions, SimpleAdapter } from "../adapters/types";
import { httpGet } from "../utils/fetchURL";

const adapter: SimpleAdapter = {
  version: 1,
  adapter: {
  },
};

const chains = [
  "ethereum", "optimism", "base", "arbitrum", "polygon", "blast", "zora", "wc",
  "ink", "soneium", "avax", "bsc", "unichain"
]

chains.forEach(chain => adapter.adapter[chain] = { fetch: fetch as any })

export default adapter;

const dataCache = {} as any

async function fetch(_: any, _1: any, { api, startOfDay, }: FetchOptions) {
  switch (api.chain) {
    case 'unichain': api.chainId = 130; break;
  }
  const endpoint = `https://interface.gateway.uniswap.org/v2/uniswap.explore.v1.ExploreStatsService/ExploreStats?connect=v1&encoding=json&message=%7B%22chainId%22%3A%22${api.chainId}%22%7D`

  try {
    if (!dataCache[endpoint]) dataCache[endpoint] = await httpGet(endpoint, {
      headers: {
        'origin': 'https://app.uniswap.org',
      }
    })
    const res = await dataCache[endpoint]
    const datapoint = res.stats.historicalProtocolVolume.Month.v4.find((i: any) => i.timestamp === startOfDay)

    if (!datapoint) throw new Error('No datapoint found for given timestamp: ' + startOfDay)

    let volumeUSD = datapoint.value

    // remove bad data from farming/spaming trading
    if (api.chain === 'bsc' && startOfDay === 1749340800) {
      // 11B volume from KOGE - 0xe6DF05CE8C8301223373CF5B969AFCb1498c5528
      volumeUSD -= 11_000_000_000
    }

    return { dailyVolume: volumeUSD }

  } catch (e) {
    api.log(`Uniswap v4: Failed to fetch data for ${api.chain}`)
    return { dailyVolume: '0' }
  }

}