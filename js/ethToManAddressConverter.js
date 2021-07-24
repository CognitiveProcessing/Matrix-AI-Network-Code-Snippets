let Buffer = require('buffer/').Buffer;
let cyclicRedundancyCheck = require('polycrc');
let bs58 = require('bs58');

let someAddressToConvert = "someaddressxxxxxxxxxxxx";
console.dir(ethToManAddress(someAddressToConvert));

function ethToManAddress(addressWeWantConverted) {
  if (/^(0x)?[0-9a-fA-F]{40}$/i.test(addressWeWantConverted)) {
    return getConvertedManAddress(addressWeWantConverted);
  }
  else {
    return addressWeWantConverted.concat(" is not a valid ETH address");
  }
}

function getConvertedManAddress(address) {
  let crc8 = cyclicRedundancyCheck.crc(8, 0x07, 0x00, 0x00, false);
  if (address.substring(0, 2) === '0x') {
    address = address.substring(2, address.length);
  }
  let bytes = Buffer.from(address, 'hex');
  let manAddress = bs58.encode(bytes);
  let array = [
    ...[...Array(9).keys()].map(i => (i + 1).toString()),
    ...[...Array(26).keys()].map(i => String.fromCharCode(i + 65)).filter(i => ![79, 73].includes(i.charCodeAt(0))),
    ...[...Array(26).keys()].map(i => String.fromCharCode(i + 97)).filter(i => ![108].includes(i.charCodeAt(0)))
  ];
  return 'MAN.'.concat(manAddress).concat(array[crc8('MAN.' + manAddress) % 58]);
}
