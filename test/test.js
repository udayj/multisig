const { expect } = require("chai");
const { ethers } = require("hardhat");

/*

To-Test
1. initial state - minapproval=1, numowners=1, only deploying address should be owner
2. add 2 new owners - check minapproval, numowners, owners mapping
3. submit transaction - check transaction data, id count
4. give 1 approval - check ds
5. execute without balance
6. execute without approval
7. give minapproval
8. execute with approval but without balance
9. give balance - check ds
10. revoke approval
11. give min approval
12. execute with approval and balance - check ds
13. check different contract for valid state
14. renounce ownership - check ds

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

          const Tester = await ethers.getContractFactory("Tester");
          const tester_instance=await Tester.deploy();
          await tester_instance.deployed();
          let tester_address = tester_instance.address;

          let abi = ["function setGreeting(string calldata _greeting) public payable"];

          let iface = new ethers.utils.Interface(abi);
          let callData = iface.encodeFunctionData("setGreeting",["testing"]);
          describe("Testing transactions", function () {

            it("Should add transaction and update id_count", async function() {

              let totalTransactions = await multisig.getTotalTransactions();
              
              expect(totalTransactions).to.equal(0);
              let submit = await multisig.submitTransaction(tester_address,callData,ethers.utils.parseUnits("1","ether"));
              submit.wait();
             
              totalTransactions = await multisig.getTotalTransactions();
              expect(totalTransactions).to.equal(1);

              let transaction_instance = await multisig.getTransactionData(0);
              //console.log(transaction_instance);
              let instance_id = transaction_instance['id'].toNumber();
              let instance_value = ethers.utils.formatUnits(transaction_instance['value'],"ether");
              let instance_conf = transaction_instance['conf'].toNumber();
              let instance_to = transaction_instance['to'];
              let instance_data= transaction_instance['data'];
              let instance_executed= transaction_instance['executed'];

              expect(instance_id).to.equal(0);
              expect(instance_value).to.equal('1.0');
              expect(instance_conf).to.equal(0);
              expect(instance_to).to.equal(tester_address);
              expect(instance_data).to.equal(callData);
              expect(instance_executed).to.equal(false);

              console.log(instance_id);
              console.log(instance_value);
              console.log(instance_to);
              console.log(instance_executed);

              describe("Transaction approval, balance checks", function () {

                it("Should change transaction struct, revert execution without approval/balance", async function () {

                  const multisig2 = multisig.connect(wallet2);

                  let approve_tx=await multisig.approveTransaction(0);
                  approve_tx.wait();

                  transaction_instance = await multisig.getTransactionData(0);

                  instance_conf = transaction_instance['conf'].toNumber();
                  console.log(instance_conf)
                  expect(instance_conf).to.equal(1);

                  await expect(multisig.executeTransaction(0)).to.be.revertedWith("Not enough balance for executing transaction");

                  let sendFundTx = {
                    to:multisig.address,
                    value:ethers.utils.parseUnits("2","ether")
                  }

                  await wallet2.sendTransaction(sendFundTx);

                  await expect(multisig.executeTransaction(0)).to.be.revertedWith("Approval quorum not met");

                  approve_tx = await multisig2.approveTransaction(0);

                  approve_tx.wait();

                  transaction_instance = await multisig.getTransactionData(0);

                  instance_conf = transaction_instance['conf'].toNumber();
                  console.log(instance_conf)
                  expect(instance_conf).to.equal(2);

                  let greeting = await tester_instance.connect(wallet2).getGreeting();

                  expect(greeting).to.equal("initial");

                  let exTx = await multisig2.executeTransaction(0);

                  console.log(exTx);
                 // expect(exTx).to.equal(true);

                  let tester_balance = await tester_instance.getBalance();

                  expect(tester_balance).to.equal(ethers.utils.parseUnits("1","ether"));

                  greeting = await tester_instance.connect(wallet2).getGreeting();

                  expect(greeting).to.equal("testing");


                })
              })

            })
          })

        })
      });

     

      
      
    })

});