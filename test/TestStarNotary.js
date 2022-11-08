const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;
const gasPrice = web3.utils.toWei(".000001", "ether");

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    let newStar = await instance.tokenIdToStarInfo.call(tokenId);

    assert.equal(newStar.name, 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();

    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".1", "ether");

    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});

    await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);

    let value1 = Number(balanceOfUser1BeforeTransaction)+ Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});

    await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);

    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".5", "ether");

    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});

    const balanceOfUser2BeforeTransaction = web3.utils.toBN(await web3.eth.getBalance(user2));

    await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice});
    const txInfo = await instance.buyStar(starId, {from: user2, value: balance, gasPrice:gasPrice});
    
    const balanceAfterUser2BuysStar = web3.utils.toBN(await web3.eth.getBalance(user2));

    const gasCost = await calculateGasFee(txInfo);
    const expectedUser2Balance = balanceOfUser2BeforeTransaction.sub(web3.utils.toBN(starPrice)).sub(web3.utils.toBN(gasCost));
    assert.equal(Number(expectedUser2Balance), Number(balanceAfterUser2BuysStar));
});

async function calculateGasFee(transactionInfo) {
    const tx = await web3.eth.getTransaction(transactionInfo.tx);
    const gasPrice = web3.utils.toBN(tx.gasPrice);
    const gasUsed = web3.utils.toBN(transactionInfo.receipt.gasUsed);    
    return gasPrice.mul(gasUsed);;
}

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    let tokenId = 123;
    let instance = await StarNotary.deployed();
    await instance.createStarWithNameAndSymbol('Star Xmas', 'XMS', tokenId, {from: accounts[0]})

    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let newStar = await instance.tokenIdToStarInfo.call(tokenId);
    assert.equal(newStar.name, 'Star Xmas');
    assert.equal(newStar.symbol, 'XMS');
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId1 = 111;
    let starId2 = 222
    await instance.createStar('Star One', starId1, {from: user1});
    await instance.createStar('Star Two', starId2, {from: user2});

    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.approve(user2, starId1, { from: user1, gasPrice: gasPrice});
    //await instance.approve(user1, starId1, { from: user2, gasPrice: gasPrice});

    await instance.exchangeStars(starId1, starId2, {from: user2});

    // 3. Verify that the owners changed
    assert.equal(await instance.ownerOf.call(starId1), user2);
    assert.equal(await instance.ownerOf.call(starId2), user1);
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 9876;

    await instance.createStar('Star One', starId, {from: user1});

    // 2. use the transferStar function implemented in the Smart Contract
    await instance.approve(user2, starId, {from: user1 });
    await instance.transferStar(user2, starId, {from: user1});

    // 3. Verify the star owner changed.
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('can get a star name by a star ID', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 22;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});

    // 2. Call your method lookUptokenIdToStarInfo
    let starName = await instance.lookUptokenIdToStarInfo(22, {from: user1});

    // 3. Verify if you Star name is the same
    assert.equal(starName, 'awesome star');

});