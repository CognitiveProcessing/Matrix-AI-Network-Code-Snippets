var Man3 = require('aiman');
var man3 = new Man3(new Man3.providers.HttpProvider("https://api01.matrix.io")); //Http provider node address
var MatrixTx = require('matrixjs-tx')
var BigNumber = require('bignumber.js')

var privateKey = "somePrivateKey"; //Private key of the address we send from
var addressWeSendFrom = "addressWeSendFrom"; //Public address of the address we send from
var addressWeSendTo = "addressWeSendTo"; //Public address of the address we send to
var gasLimit = 210000;
var gasPrice = 18000000000;
var amountWeSend = man3.toWei('0.001', 'man'); //Amount to send denominated in MAN, ex: 0.001 MAN
var chainId = 1; //Mainnet chain ID


//We get the nonce, it is required for sending transactions, nonce represents the number of transactions we made
const getNonce = () => {
    return new Promise((resolve, reject) => {
        man3.man.getTransactionCount(addressWeSendFrom, (error, result) => {
            if (error) {
                reject(error);
            }
            resolve(numberToHex(result));
        });
    });
};

//We send the raw transaction after serializing, signing it, converting it to the right format for gman
const sendRawTransaction = (rawTx) => {
    return new Promise((resolve, reject) => {
        const tx = new MatrixTx(rawTx);
        const privateKeyBuffer = Buffer.from(privateKey, 'hex');
        tx.sign(privateKeyBuffer);
        const serializedTx = tx.serialize();
        const finalTx = getTxParams(serializedTx);
        man3.man.sendRawTransaction(finalTx, function (error, hash) {
            if (!error) {
                resolve('Hash of sent tx: ' + hash);
            }
            else {
                reject(error);
            }
        });
    });
}

var rawTx = {
    "to": addressWeSendTo,
    "value": numberToHex(amountWeSend),
    "gasLimit": numberToHex(gasLimit),
    "data": "0x",
    "gasPrice": numberToHex(gasPrice),
    "IsEntrustTx": "",
    "TxEnterType": "",
    "chainId": numberToHex(chainId),
    "extra_to": [
        [
            0,
            0,
            []
        ]
    ],
    "nonce": ''
};
//We change the nonce of raw TX then call the sendRawTransaction Promise
Promise.resolve(getNonce())
    .then(function (nonce) {
        rawTx.nonce = nonce;
        return rawTx;
    })
    .then(sendRawTransaction)
    .then((message) => {
        console.log(message);
    })
    .catch((error) => {
        console.log("Some error has appeared,", error);
    });

function getTxParams(hash, currency) {
    let txData = new MatrixTx(hash, true)
    let newTxData = {
        v: '',
        r: '',
        s: '',
        data: '',
        gasPrice: '',
        gas: '',
        value: '',
        nonce: '',
        currency: '',
        txType: 0,
        lockHeight: 0,
        isEntrustTx: 0,
        txEnterType: 0,
        commitTime: 0,
        extra_to: []
    }
    newTxData.v = '0x' + txData.v.toString('hex')
    newTxData.r = '0x' + txData.r.toString('hex')
    newTxData.s = '0x' + txData.s.toString('hex')
    newTxData.data = '0x' + txData.data.toString('hex')
    newTxData.gasPrice = '0x' + txData.gasPrice.toString('hex')
    newTxData.gas = '0x' + txData.gasLimit.toString('hex')
    newTxData.value = '0x' + txData.value.toString('hex')
    if (newTxData.value === '0x') {
        newTxData.value = '0x0'
    }
    newTxData.nonce = '0x' + txData.nonce.toString('hex')
    if (!currency) {
        if (txData.to.toString() !== '') {
            newTxData.to = txData.to.toString()
            newTxData.currency = txData.to.toString().split('.')[0]
        } else {
            newTxData.currency = 'MAN'
        }
    } else {
        newTxData.currency = currency
    }
    let isEntrustTx = '0x' + txData.IsEntrustTx.toString('hex')
    let txEnterType = '0x' + txData.TxEnterType.toString('hex')
    let commitTime = '0x' + txData.CommitTime.toString('hex')
    let txType = '0x' + txData.extra_to[0][0].toString('hex')
    let lockHeight = '0x' + txData.extra_to[0][1].toString('hex')
    newTxData.txType = txType === '0x' ? 0 : Number(hexToDecimal(txType))
    newTxData.lockHeight = lockHeight === '0x' ? 0 : Number(hexToDecimal(lockHeight))
    newTxData.isEntrustTx = isEntrustTx === '0x' ? 0 : Number(hexToDecimal(isEntrustTx))
    newTxData.txEnterType = txEnterType === '0x' ? 0 : Number(hexToDecimal(txEnterType))
    newTxData.commitTime = commitTime === '0x' ? 0 : Number(hexToDecimal(commitTime))
    newTxData.extra_to = []
    for (var i = 0, length = txData.extra_to[0][2].length; i < length; i++) {
        newTxData.extra_to.push({
            to: txData.extra_to[0][2][i][0].toString(),
            value: '0x' + txData.extra_to[0][2][i][1].toString('hex')
        })
    }
    return newTxData
}

function sanitizeHex(hex) {
    hex = hex.substring(0, 2) === '0x' ? hex.substring(2) : hex
    if (hex === '') return ''
    return '0x' + padLeftEven(hex)
}

function hexToDecimal(hex) {
    return new BigNumber(sanitizeHex(hex)).toString()
}

function padLeftEven(hex) {
    hex = hex.length % 2 !== 0 ? '0' + hex : hex
    return hex
}

function numberToHex(num) {
    return '0x' + new BigNumber(num).toString(16)
}
/*
    'noman':      '0',
    'wei':          '1',
    'kwei':         '1000',
    'Kwei':         '1000',
    'babbage':      '1000',
    'femtoman':   '1000',
    'mwei':         '1000000',
    'Mwei':         '1000000',
    'lovelace':     '1000000',
    'picoman':    '1000000',
    'gwei':         '1000000000',
    'Gwei':         '1000000000',
    'shannon':      '1000000000',
    'nanoeman':    '1000000000',
    'nano':         '1000000000',
    'szabo':        '1000000000000',
    'microman':   '1000000000000',
    'micro':        '1000000000000',
    'finney':       '1000000000000000',
    'milliman':   '1000000000000000',
    'milli':        '1000000000000000',
    'man':        '1000000000000000000',
    'kman':       '1000000000000000000000',
    'grand':        '1000000000000000000000',
    'meman':       '1000000000000000000000000',
    'gman':       '1000000000000000000000000000',
    'tman':       '1000000000000000000000000000000'
*/
