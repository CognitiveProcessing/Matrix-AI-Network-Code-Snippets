var Man3 = require('aiman');
var fs = require('fs');

var man3 = new Man3(new Man3.providers.HttpProvider("https://api01.matrix.io")); //Http provider node address

var jsonFile = "./SimpleContract.json";
var parsed = JSON.parse(fs.readFileSync(jsonFile));
var contractAbi = parsed.abi;

var contractAddress = "MAN.ContractAddress"


const readFunctionValue = () => {
    return new Promise((resolve, reject) => {
        let contractInstance = man3.man.contract(contractAbi).at(contractAddress); //We initialize a contract instance
        return contractInstance.get({ currency: 'MAN' }, (error, result) => {
            if (!error) {
                resolve(result.toNumber())
            }
            reject(error)
        });
    });
}

Promise.resolve(readFunctionValue())
    .then((message) => {
        console.log(message);
    })
    .catch((error) => {
        console.log("Some error has appeared,", error);
    });
