var Man3 = require('aiman');
var man3 = new Man3(new Man3.providers.HttpProvider("nodeAddress")); //Http provider node address
var MatrixTx = require('matrixjs-tx')
var BigNumber = require('bignumber.js')

var privateKey = "somePrivateKey"; //Private key of the address we send from
var addressWeSendFrom = "addressWeSendFrom"; //Public address of the address we send from
var addressWeSendTo = "addressWeSendTo"; //Public address of the address we send to
var gasLimit = 210000;
var gasPrice = 18000000000;
var chainId = 1; //Mainnet chain ID


var rawTx = {
    "to": addressWeSendTo,
    "value": "0x",
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
    "nonce": "0x",
};

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

const getGasPrice = () => {
    return new Promise((resolve, reject) => {
        man3.man.getGasPrice((error, result) => {
            if (error) {
                reject(error);
            }
            resolve(numberToHex(result));
        });
    });
};

//We send the raw transaction after serializing, signing it, converting it to the right format for gman
const sendRawTransaction = async () => {
    rawTx.nonce = numberToHex(await getNonce()); //We get the nonce (tx count)
    let estimatedGas = new BigNumber(await getGasPrice()); //gas price
    let txGasValue = estimatedGas.multipliedBy(gasLimit);
    let addressBalance = man3.man.getBalance(addressWeSendFrom)[0].balance;
    let remainingValue = addressBalance.minus(txGasValue); // value - gas * price
    rawTx.value = numberToHex(remainingValue); //Whole balance
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


//We change the nonce of raw TX then call the sendRawTransaction Promise
Promise.resolve(sendRawTransaction())
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
