var Man3 = require('aiman');
var MatrixTx = require('matrixjs-tx')
var BigNumber = require('bignumber.js')
var bs58 = require('bs58');
var fs = require('fs');


var man3 = new Man3(new Man3.providers.HttpProvider("https://api01.matrix.io")); //Http provider node address

var jsonFile = "./SimpleContract.json";
var parsed = JSON.parse(fs.readFileSync(jsonFile));
var contractAbi = parsed.abi;

var gasLimit = 210000;
var gasPrice = 18000000000;
var contractAddress = "MAN.ContractAddressFromTruffle"
var ourAddress = "MAN.TheAddressWeSendTheTxFrom"
var privateKey = "privateKeyOfTheAddressWeSendTxFrom"

var gasLimit = 210000;
var gasPrice = 18000000000;
var chainId = 1; //Mainnet chain ID

const sendRawTransaction = () => {
    return new Promise((resolve, reject) => {
        //We initialize a contract instance
        let ContractInstance = man3.man.contract(contractAbi).at(getAddress(contractAddress))
        //We get the nonce (tx count)
        let nonce = man3.man.getTransactionCount(ourAddress)
        nonce = numToHex(nonce)
        let txStructure = {
            to: contractAddress,
            value: 0,
            gasLimit: gasLimit,
            data: '',
            gasPrice: gasPrice,
            extra_to: [[0, 0, []]],
            nonce: nonce
        }
        let rawTx = getTxData(txStructure)
        //contract function with 152 and 68 as parameters: function addition(uint256 a, uint256 b)
        rawTx.data = ContractInstance.addition.getData(152, 68); //data of a contract function
        let tx = createTx(rawTx)
        privateKey = Buffer.from(privateKey, 'hex')
        tx.sign(privateKey)
        let serializedTx = tx.serialize()
        let finalTx = getTxParams(serializedTx)
        man3.man.sendRawTransaction(finalTx, function (error, hash) {
            if (!error) {
                man3.man.getTransaction(hash, function (err, tx) {
                    if (!err) {
                        resolve(tx)
                    }
                    else {
                        reject("Something went wrong:", err)
                    }
                });
            }
            else {
                reject(error);
            }
        });
    });
}

Promise.resolve(sendRawTransaction())
    .then((message) => {
        console.log(message);
    })
    .catch((error) => {
        console.log("Some error has appeared,", error);
    });


function getTxData(tradingObj) {
    if (JSON.stringify(tradingObj.extra_to[0][2]) != null) {
        for (var i = 0, length = tradingObj.extra_to[0][2].length; i < length; i++) {
            let weiValue = new BigNumber(String(tradingObj.extra_to[0][2][i][1])).times(new BigNumber(man3.toWei('1'), 10))
            let value = new BigNumber(weiValue.toString(10)).toString(16)
            tradingObj.extra_to[0][2][i][1] = '0x' + value
        }
    }
    return {
        to: tradingObj.to,
        value: '0x' + toWeiHex(tradingObj.value),
        gasLimit: '0x' + new BigNumber(tradingObj.gasLimit).toString(16),
        data: (tradingObj.data !== '' || tradingObj.data !== null) ? ('0x' + str2hex(tradingObj.data)) : '0x',
        gasPrice: '0x' + new BigNumber(tradingObj.gasPrice).toString(16),
        CommitTime: parseInt(new Date().getTime() / 1000),
        IsEntrustTx: tradingObj.IsEntrustTx,
        TxEnterType: '',
        chainId: chainId,
        extra_to: tradingObj.extra_to,
        nonce: tradingObj.nonce
    }
}

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


function getAddress(address) {
    let addrTemp = address.split('.')[1]
    return '0x' + (bs58.decode(addrTemp.substring(0, addrTemp.length - 1))).toString('hex')
}

function toWeiHex(num) {
    let weiValue = new BigNumber(String(num)).times(new BigNumber(man3.toWei('1'), 10))
    let value = new BigNumber(weiValue.toString(10)).toString(16)
    return value
}

function writeUTF(str, isGetBytes) {
    let back = []
    let byteSize = 0
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i)
        if (code >= 0x00 && code <= 0x7f) {
            byteSize += 1
            back.push(code)
        } else if (code >= 0x80 && code <= 0x7ff) {
            byteSize += 2
            back.push((192 | (31 & (code >> 6))))
            back.push((128 | (63 & code)))
        } else if ((code >= 0x800 && code <= 0xd7ff) ||
            (code >= 0xe000 && code <= 0xffff)) {
            byteSize += 3
            back.push((224 | (15 & (code >> 12))))
            back.push((128 | (63 & (code >> 6))))
            back.push((128 | (63 & code)))
        }
    }
    for (let i = 0; i < back.length; i++) {
        back[i] &= 0xff
    }
    if (isGetBytes) {
        return back
    }
    if (byteSize <= 0xff) {
        return [0, byteSize].concat(back)
    } else {
        return [byteSize >> 8, byteSize & 0xff].concat(back)
    }
}

function str2hex(str) {
    let charBuf = writeUTF(str, true)
    let re = ''
    for (let i = 0; i < charBuf.length; i++) {
        let x = (charBuf[i] & 0xFF).toString(16)
        if (x.length === 1) {
            x = '0' + x
        }
        re += x
    }
    return re
}

function createTx(jsonObj) {
    return new MatrixTx(jsonObj, true)
}

function numToHex(num) {
    return '0x' + new BigNumber(num).toString(16)
}

function sanitizeHex(hex) {
    hex = hex.substring(0, 2) === '0x' ? hex.substring(2) : hex
    if (hex === '') return ''
    return '0x' + padLeftEven(hex)
}


function padLeftEven(hex) {
    hex = hex.length % 2 !== 0 ? '0' + hex : hex
    return hex
}

function hexToDecimal(hex) {
    return new BigNumber(sanitizeHex(hex)).toString()
}
