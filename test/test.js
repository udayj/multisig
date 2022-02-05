const { expect } = require("chai");
const { ethers } = require("hardhat");

/*describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});*/

/*

To-Test
1. initial state - minapproval=1, numowners=1, only dpeloying address should be owner
2. add 2 new owners - check minapproval, numowners, owners mapping
3. 
*/

describe("Multisig", function () {

    it("Should set up the initial multisig wallet", async function () {

     
      const [wallet1, wallet2, wallet3, wallet4 ] = await ethers.getSigners();
      let addr1 = await wallet1.getAddress();
      let addr2 = await wallet2.getAddress();
      let addr3 = await wallet3.getAddress();

      //console.log(addr1+" "+addr2+" "+addr3);
      const Multisig= await ethers.getContractFactory("Multisig");

      const multisig = await Multisig.deploy();

      await multisig.deployed();
      let minApprovals = await multisig.minApprovals();
      
      expect(minApprovals).to.equal(1);
      
      let numOwners = await multisig.numOwners();

      expect(numOwners).to.equal(1);

      describe("Ownership on initialization", function () {

        it("Only first address should be owner initially", async function () {

          const isOwner = await multisig.owners(addr1);
  
          expect(isOwner).to.equal(true);
    
    
          
          let isOwner2 = await multisig.owners(addr2);
    
          expect(isOwner2).to.equal(false);
        });
      });

      describe("Adding new owners", function () {

        it("Should add owners and update minApproval, numOwners", async function() {

          const addOwnerTx = await multisig.addOwner(addr2);

          addOwnerTx.wait();
          minApprovals = await multisig.minApprovals();
          numOwners = await multisig.numOwners();

          expect(minApprovals).to.equal(2);
          expect(numOwners).to.equal(2);

          const newTx = await multisig.addOwner(addr3);

          newTx.wait();

          minApprovals = await multisig.minApprovals();
          numOwners = await multisig.numOwners();

          expect(minApprovals).to.equal(2);
          expect(numOwners).to.equal(3);

          let isOwner2 = await multisig.owners(addr2);
    
          expect(isOwner2).to.equal(true);

          let isOwner3 = await multisig.owners(addr3);
    
          expect(isOwner3).to.equal(true);

        })
      });

     

      
      
    })

});