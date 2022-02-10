const hre = require("hardhat");
const axios = require("axios");

const usdtContractAddress = process.env.BASE_TOKEN_ADDRESS;
const priceUrl = process.env.PRICE_URL;

const getBtcPrice = async () => {
    const priceRequest = await axios.get(priceUrl);
    const {data} = priceRequest;
    return data;
}

async function main() {
  const Predictions = await hre.ethers.getContractFactory("Predictions");
  const {price} = await getBtcPrice();
  const bigPrice = price.split('.')[0] + price.split('.')[1];

    console.log('Deploying contract');
    const predictions = await Predictions.deploy(bigPrice, usdtContractAddress);

    console.log('Submitting transaction');
    await predictions.deployed();

    console.log(`Predictions Contract Address: ${predictions.address}`)
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
