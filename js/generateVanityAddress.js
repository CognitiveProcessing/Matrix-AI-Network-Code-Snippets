let crypto = require('crypto')
let ethUtils = require('ethereumjs-util')
let Buffer = require('buffer/').Buffer
let cyclicRedundancyCheck = require('polycrc')
let bs58 = require('bs58')

var account = generateVanityWallet('Enjoy')
console.dir(account)

function generateVanityWallet (input) {
  let wallet = generateRandomWallet(); //Generate a random wallet
  while (!addressContainsTheInput(wallet, input)) { //while the generated wallet public address doesn't contain the input, generate another one
    wallet = generateRandomWallet();
  }
  return wallet;
}

function addressContainsTheInput (wallet, input) {
  let address = wallet.publicAddress;
  return address.substr(4, address.length).includes(input); //if the wallet public address we provide contains the 'input' content, return true
}

function generateRandomWallet () {
  let randomBytes = crypto.randomBytes(32); //We generate a cryptographically secure 256 bits (32 bytes) random number
  let address = '0x' + ethUtils.privateToAddress(randomBytes).toString('hex'); //We convert it to an eth address
  let wallet = { //We create an new object which contains both the public key and the private key 
    publicAddress: getManAddress(address), //eth address we generated to an MAN address by using the function from the previous article
    privateKey: randomBytes.toString('hex')
  }
  return wallet
}

function getManAddress (address) {
  let crc8 = cyclicRedundancyCheck.crc(8, 0x07, 0x00, 0x00, false);
  if (address.substring(0, 2) === '0x') {
    address = address.substring(2, address.length)
  }
  let bytes = Buffer.from(address, 'hex');
  const manAddress = bs58.encode(bytes);
  let array = [
    ...[...Array(9).keys()].map(i => (i + 1).toString()),
    ...[...Array(26).keys()].map(i => String.fromCharCode(i + 65)).filter(i => ![79, 73].includes(i.charCodeAt(0))),
    ...[...Array(26).keys()].map(i => String.fromCharCode(i + 97)).filter(i => ![108].includes(i.charCodeAt(0)))
  ];
  return 'MAN.'.concat(manAddress).concat(array[crc8('MAN.' + manAddress) % 58]);
}
