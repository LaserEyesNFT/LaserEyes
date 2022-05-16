import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { Person } from '@stacks/profile';
import { StacksMainnet, StacksTestnet } from '@stacks/network'

const appConfig = new AppConfig(['store_write', 'publish_data']);

export const userSession = new UserSession({ appConfig });

export function getAppDetails() {
  return {
    name: 'Laser eyes',
    icon: 'https://ipfs.io/ipfs/QmXn7gUC1yJMqbPUp9CiDLD7AA8RTaZ95me6pWE5p6JWNa',
  }
}

export function authenticate() {
  showConnect({
    appDetails: getAppDetails(),
    redirectTo: '/',
    onFinish: () => {
      window.location.reload();
    },
    userSession: userSession,
  });
}

export function getUserData() {
  return userSession.loadUserData();
}

export function getPerson() {
  return new Person(getUserData().profile);
}

export function loginIn(failCallback) {
  if (typeof failCallback === 'function') {
    let outThis = this
    this.$confirm('Please sign in first.', 'Tips', {
        confirmButtonText: 'Sign in',
        cancelButtonText: 'No',
        type: 'info',
        center: true,
      }).then(() => {
        authenticate()
      }).catch(() => {
        failCallback()
      });
  } else {
    authenticate()
  }
}

export function loginOut() {
  userSession.signUserOut()
  window.location.reload()
}

//// environment related ///
const bUseMainnet = true // whether use mainnet
let network = null
let contractAddress = null
let BNSContractAddress = null
let BNSContractName = 'bns'
if (bUseMainnet) {
  network = new StacksMainnet();
  contractAddress = 'SPEFVJJXM9BT0PP3H2S6V6029SWF4B92RCJFE1Y0'
  BNSContractAddress = 'SP000000000000000000002Q6VF78'
} else {
  network = new StacksTestnet();
  network.coreApiUrl = 'http://localhost:3999'
  contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
  BNSContractAddress = 'ST000000000000000000002AMW42H'
}

export function getNetwork() {
  return network;
}

export function getAddress() {
  if (bUseMainnet) {
    return getUserData().profile.stxAddress.mainnet;
  } else {
    return getUserData().profile.stxAddress.testnet;
  }
}

export function getContractInfo() {
  const contractName = 'laser-eyes-v3'
  const marketContractName = 'laser-eyes-market-v3'
  const likeContractName = 'like-v3'
  const clubContractName = 'laser-eyes-clubs-v3'
  const chatroomContractName = 'laser-eyes-chatroom-v3'
  return {
    contractAddress,
    contractName: contractName,
    likeContractName: likeContractName,
    marketContractName: marketContractName,
    clubContractName: clubContractName,
    fullContractAddress: contractAddress + '.' + contractName,
    fullMarketContractAddress: contractAddress + '.' + marketContractName,
    chatroomContractName: chatroomContractName,
    BNSContractAddress: BNSContractAddress,
    BNSContractName: BNSContractName,
  }
}
