let bs58 = require('bs58');

let someAddressToConvert = "someEthAddressxxx";
console.dir(manToEthAddress(someAddressToConvert));

function manToEthAddress(addressWeWantConverted) {
    if (/MAN\.[0-9a-zA-Z]{21,29}$/.test(addressWeWantConverted)) {
        return getConvertedEthAddress(addressWeWantConverted);
    }
    else {
        return addressWeWantConverted.concat(" is not a valid MAN address");
    }
}

function getConvertedEthAddress(manAddress) {
    return '0x' + (bs58.decode(manAddress.substring(manAddress.indexOf('.') + 1, manAddress.length - 1)).toString('hex'));
}
