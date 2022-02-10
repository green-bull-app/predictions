const { expect } = require("chai");
const { ethers } = require("hardhat");

let predictions;
let token;
let accounts;
let signers;
const betAmount = BigInt(5) * BigInt(10 ** 18);

const fee = (amount) => {
  return BigInt(amount) / BigInt(100) * BigInt(2)
}

describe("Predictions", () => {
  beforeEach(async () => {
    accounts = await ethers.provider.listAccounts();

    const IERC20 = await ethers.getContractFactory("IERC20");
    token = await IERC20.deploy(accounts[0], accounts[1]);
    const tokenAddress = (await token.deployed()).address;

    const Predictions = await ethers.getContractFactory("Predictions");
    predictions = await Predictions.deploy(100, tokenAddress);
    const predictionsAddress = (await predictions.deployed()).address;

    signers = await ethers.getSigners();

    await token.approve(predictionsAddress, betAmount);
    await token.connect(signers[1]).approve(predictionsAddress, betAmount);

  });

  it('Should test setting a new round', async () => {
    const {currentRound, nextRound} = await startNextRound(BigInt(1000));

    expect(nextRound).to.equal(currentRound + BigInt(1));
  });

  it("Should test if bulls can bet", async () => {
    const {nextRound} = await startNextRound(BigInt(1000));

    await predictions.betBull(betAmount, nextRound);

    const round = await predictions.round(nextRound);

    expect(round.bullAmount).to.equal(betAmount - fee(betAmount));
    expect(round.bearAmount).to.equal(BigInt(0));
  });

  it("Should test if bears can bet", async () => {
    const currentRound = BigInt(await predictions.currentRound());

    await predictions.betBear(betAmount, currentRound);

    const round = await predictions.round(currentRound);

    expect(round.bullAmount).to.equal(BigInt(0));
    expect(round.bearAmount).to.equal(betAmount - fee(betAmount));
  });

  it("Should test if minimum bet amount is applied", async () => {
    const betAmount = BigInt(10 ** 18) - BigInt(1);
    const currentRound = BigInt(await predictions.currentRound());

    await expect(predictions.betBear(betAmount, currentRound)).to.be.revertedWith('Amount too low.');
  });

  it('Should test the total value locked', async () => {
    const {nextRound} = await startNextRound(BigInt(1000));

    await predictions.betBear(betAmount, nextRound);
    await predictions.connect(signers[1]).betBull(betAmount, nextRound);


    expect(await predictions.totalLocked(nextRound)).to.equal((betAmount - fee(betAmount)) * BigInt(2));
  });

  it('Should test if none admin can close the round', async () => {
    await expect(predictions.connect(signers[1]).lockRound(BigInt(10004))).to.be.revertedWith('Not admin');
  });

  it('Should test if rounds can be closed', async () => {
    await ethers.provider.send("evm_increaseTime", [6001]);
    await predictions.lockRound(BigInt(10004));
  });

  it('Should test if rounds can be closed early', async () => {
    await expect(predictions.lockRound(BigInt(10004))).to.be.revertedWith('Too soon to lock round.');
  });

  it('Should test if rounds can be claimed early', async () => {
    await expect(predictions.claim(BigInt(10004))).to.be.revertedWith('Lock price not set yet.');
  });

  it('Should test if bear rounds can be claimed', async () => {
    const currentRound = BigInt(await predictions.currentRound());

    await predictions.betBull(betAmount, currentRound);
    await predictions.connect(signers[1]).betBear(betAmount / BigInt(2), currentRound);

    const total = BigInt(await predictions.totalLocked(currentRound));

    await ethers.provider.send("evm_increaseTime", [301]);
    await predictions.lockRound(BigInt(104));
    await ethers.provider.send("evm_increaseTime", [301]);
    await predictions.lockRound(BigInt(105));

    const initialBalance = BigInt(await token.balanceOf(accounts[0]));

    await predictions.claim(currentRound);

    expect(await token.balanceOf(accounts[0])).to.equal(initialBalance + total);
  });


});

async function startNextRound(lockPrice) {

  const currentRound = BigInt(await predictions.currentRound());
  await predictions.startNewRound(lockPrice);
  const nextRound = BigInt(await predictions.currentRound());
  return {currentRound, nextRound};
}