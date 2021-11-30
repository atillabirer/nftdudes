import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers,waffle } from "hardhat";
import { NFTDudes } from "../typechain";


describe("NFTDudes", function () {

  let DudeContract: NFTDudes;
  let signers: SignerWithAddress[];
  let otherDude: SignerWithAddress;
  let contractOtherDude: NFTDudes;

  before(async function() {

    signers = await ethers.getSigners();
    let dudecontract = await ethers.getContractFactory("NFTDudes");
    DudeContract = await dudecontract.deploy();
    await DudeContract.deployed();
    otherDude = signers[1];
    contractOtherDude  = DudeContract.connect(otherDude);
    

  });

  it("Should have right name and symbol", async function () {

     expect(await DudeContract.symbol()).to.equal("NFTD");
     expect(await DudeContract.name()).to.equal("NFTDudes");
     

  });
  
  it("Mint a token and add URI",async function() {
    expect(await DudeContract.safeMint(signers[0].address,"blah")).to.emit(DudeContract,"Transfer");
    expect(await DudeContract.balanceOf(signers[0].address)).to.equal(1);
    expect(await DudeContract.tokenURI(0)).to.equal("ipfs://blah");
  })

  it("Can change URI if owner and fails if not owner",async function() {
    const tx = await DudeContract.setTokenURI(0,"newuri");
    tx.wait();
    expect(await DudeContract.tokenURI(0)).to.equal("ipfs://newuri");
    
  })

  it("Fail when non-owner attempt to change",async function() {
    //get another signer
   
    expect(contractOtherDude.setTokenURI(0,"test")).to.be.revertedWith("You do not own this NFT");
    
  })
  //test pausable
  it("Fails to transfer when paused, can when unpaused",async function() {
    expect(DudeContract.pause()).to.emit(DudeContract,"Paused");
    expect(DudeContract.safeMint(signers[0].address,"play")).to.be.revertedWith("ERC721Pausable: token transfer while paused");
    expect(DudeContract.unpause()).to.emit(DudeContract,"Unpaused");
    expect(DudeContract.safeMint(signers[0].address,"play")).to.emit(DudeContract,"Transfer");



  })
  //test enumerable
  it("Gets all NFTs for user",async function() {
    const firstToken = await DudeContract.tokenByIndex(1);
    expect(await DudeContract.tokenURI(firstToken)).to.equal("ipfs://play");
  })
  //roles
  it("Make another person a minter and pauser",async function() {
    //give minter and pauser to second signer (signers[1])
    expect(DudeContract.addMinter(signers[1].address)).to.emit(DudeContract,"RoleGranted");
    expect(contractOtherDude.safeMint(otherDude.address,"otherdudesnft")).to.emit(contractOtherDude,"Transfer");

    expect(DudeContract.addPauser(signers[1].address)).to.emit(DudeContract,"Paused");
    expect(contractOtherDude.safeMint(otherDude.address,"otherdudesnft")).to.be.revertedWith("Pausable: paused");

    

    
  })



});
