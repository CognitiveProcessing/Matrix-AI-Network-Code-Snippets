let bs58 = require('bs58');
let cyclicRedundancyCheck = require('polycrc')

let someAddressToConvert = "someEthAddressxxxx";
console.dir(manToEthAddress(someAddressToConvert));

function manToEthAddress(addressWeWantConverted) {
    if (/MAN\.[0-9a-zA-Z]{21,29}$/.test(addressWeWantConverted) && checkAddressCrc8(addressWeWantConverted)) {
        return getConvertedEthAddress(addressWeWantConverted);
    }
    else {
        return addressWeWantConverted.concat(" is not a valid MAN address");
    }
}

function checkAddressCrc8(manAddress) {
    let lastCharacter = manAddress[manAddress.length - 1];
    manAddress = manAddress.slice(0, -1)
    let crc8 = cyclicRedundancyCheck.crc(8, 0x07, 0x00, 0x00, false);

    let array = [
        ...[...Array(9).keys()].map(i => (i + 1).toString()),
        ...[...Array(26).keys()].map(i => String.fromCharCode(i + 65)).filter(i => ![79, 73].includes(i.charCodeAt(0))),
        ...[...Array(26).keys()].map(i => String.fromCharCode(i + 97)).filter(i => ![108].includes(i.charCodeAt(0)))
    ];

    return (lastCharacter === array[crc8(manAddress) % 58]);
}

function getConvertedEthAddress(manAddress) {
    return '0x' + (bs58.decode(manAddress.substring(manAddress.indexOf('.') + 1, manAddress.length - 1)).toString('hex'));
}
