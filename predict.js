const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const CryptoJS = require('crypto-js');

// Load the model
const loadModel = async () => {
    const model = await tf.loadLayersModel('/model/model.json');
    return model;
};

// Prepare the data (normalize the data in the same way as during training)
const prepareData = (bustValues) => {
    const normalizedValues = bustValues.map(value => (value - 1) / (999 - 1)); // assuming MinMaxScaler used with range 1 to 999
    const tensor = tf.tensor2d([normalizedValues], [1, 20]);
    return tensor;
};

// Make a prediction
const makePrediction = async (bustValues) => {
    const model = await loadModel();
    const inputTensor = prepareData(bustValues);
    const prediction = model.predict(inputTensor);
    const predictionValue = prediction.dataSync()[0];
    const originalValue = predictionValue * (999 - 1) + 1; // inverse normalization
    return Math.min(Math.max(originalValue, 1), 999); // ensure value is within 1 and 999
};

// Load last 20 rounds data from a CSV file
const loadLast20Rounds = () => {
    const data = fs.readFileSync('./last.csv', 'utf-8');
    const rows = data.split('\n').slice(1).filter(row => row.trim() !== '');
    const bustValues = rows.map(row => parseFloat(row.split(',')[0]));
    if (bustValues.length !== 20) {
        throw new Error("The CSV file must contain exactly 20 rows.");
    }
    return bustValues;
};


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
            throw new Error("Please provide a hash as a command line argument.");
        }

        const amount = 20;
        const salt = '0000000000000000000301e2801a9a9598bfb114e574a91a887f2132f33047e6';
        simulateGameVerification(initialHash, amount, salt);
        const last20Rounds = loadLast20Rounds();
        const nextBustPrediction = await makePrediction(last20Rounds);
        console.log("Next bust prediction:", nextBustPrediction);
    } catch (error) {
        console.error("Error:", error);
    }
};

main();
