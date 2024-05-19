const fs = require('fs');
const CryptoJS = require('crypto-js');

const gameResult = (seed, salt, h = 1) => {
    const nBits = 52;

    if (salt) {
        const hmac = CryptoJS.HmacSHA256(CryptoJS.enc.Hex.parse(seed), salt);
        seed = hmac.toString(CryptoJS.enc.Hex);
    }
    seed = seed.slice(0, nBits / 4);
    const r = parseInt(seed, 16);

    let X = r / Math.pow(2, nBits);
    X = parseFloat(X.toPrecision(9));

    X = (100 - h) / (1 - X);

    const result = Math.floor(X);
    return Math.max(1, result / 100);
};

const simulateGameVerification = (initialHash, amount, salt) => {
    let prevHash = null;
    let csvData = 'bust\n';

    for (let i = 0; i < amount; i++) {
        const hashInput = prevHash ? prevHash : initialHash;
        var hash = CryptoJS.SHA256(hashInput).toString(CryptoJS.enc.Hex);
        const bust = gameResult(hash, salt);
        csvData = csvData + `${bust}\n`
        prevHash = hash;
    }

    fs.writeFile('last.csv', csvData, (err) => {
        if (err) throw err;
        console.log('CSV file has been saved!');
    });
};

const main = async () => {
    try {
        const initialHash = process.argv[2];
        if (!initialHash) {
            //
        }
        const amount = 20;
        const salt = '0000000000000000000301e2801a9a9598bfb114e574a91a887f2132f33047e6';
        simulateGameVerification(initialHash, amount, salt);
    } catch (error) {
        //
    }
};

main();
