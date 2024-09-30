import dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import '@nomicfoundation/hardhat-verify';

dotenv.config();

const DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.20'
      },
      {
        version: '0.8.16'
      }
    ]
  },
  networks: {
    // main: {
    //   chainId: 10,
    //   url: `${process.env.MAIN_RPC_URL}`,
    //   accounts: [`0x${process.env.MAIN_PRIVATE_KEY}`],
    //   gasPrice: 200000000000
    // },
    'opt-sepolia': {
      chainId: 11155420,
      url: `${process.env.OPT_SEPOLIA_RPC}`,
      accounts: [`0x${process.env.OPT_SEPOLIA_PRIVATE_KEY}`]
    }
    // localhost: {
    //   url: 'http://127.0.0.1:8545',
    //   accounts: {
    //     mnemonic: DEFAULT_MNEMONIC,
    //     path: "m/44'/60'/0'/0",
    //     initialIndex: 0,
    //     count: 20
    //   }
    // },
  },
  etherscan: {
    apiKey: {
      'opt-sepolia': process.env.OPT_SEPOLIA_API_KEY!
    },
    customChains: []
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_KEY,
    enabled: !!process.env.REPORT_GAS,
    token: 'ETH'
  }
};

export default config;
