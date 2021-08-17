var Man3 = require('aiman');
man3 = new Man3(new Man3.providers.HttpProvider("https://api01.matrix.io"));

var blockNumber = 5000000;
const getBlock = () => {
    return new Promise((resolve, reject) => {
        man3.man.getBlock(blockNumber, true, function (error, result) {
            if (error) {
                reject(error);
            }
            resolve(result);
        });
    });
};

Promise.resolve(getBlock())
    .then(blockInfo => {
        console.dir(blockInfo.hash);
        console.dir(blockInfo.difficulty);
        for (var i = 0; i < blockInfo.transactions.MAN.length; i++) {
            console.log(blockInfo.transactions.MAN[i].hash);
        }
    })
    .catch((error) => {
        console.log("Some error has appeared,", error);
    });
