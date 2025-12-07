import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { Counter } from "../target/types/counter";

describe("counter", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.counter as Program<Counter>;
  const authority = provider.wallet;

  // Derive PDA using user's public key
  const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [authority.publicKey.toBuffer()],
    program.programId
  );

  console.log("Program ID: ", program.programId.toString());
  console.log("Counter PDA: ", counterPDA.toString());

  describe("initialize", () => {
    it("initializes a counter with count 0", async () => {
      const tx = await program.methods
        .initialize()
        .accounts({
          authority: authority.publicKey,
        })
        .rpc();

      console.log("Initialize tx:", tx);

      const counterAccount = await program.account.counter.fetch(counterPDA);

      expect(counterAccount.count.toNumber()).to.equal(0);
      expect(counterAccount.authority.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
    });
  });

  describe("increment", () => {
    it("increments the counter by 1", async () => {
      const counterBefore = await program.account.counter.fetch(counterPDA);
      const initialCount = counterBefore.count.toNumber();

      await program.methods
        .increment()
        .accounts({
          authority: authority.publicKey,
        })
        .rpc();

      const counterAccount = await program.account.counter.fetch(counterPDA);
      expect(counterAccount.count.toNumber()).to.equal(initialCount + 1);
    });

    it("increments multiple times", async () => {
      const counterBefore = await program.account.counter.fetch(counterPDA);
      const initialCount = counterBefore.count.toNumber();

      // Increment 3 times
      for (let i = 0; i < 3; i++) {
        await program.methods
          .increment()
          .accounts({
            authority: authority.publicKey,
          })
          .rpc();
      }

      const counterAccount = await program.account.counter.fetch(counterPDA);
      expect(counterAccount.count.toNumber()).to.equal(initialCount + 3);
    });
  });

  describe("decrement", () => {
    it("decrements the counter by 1", async () => {
      const counterBefore = await program.account.counter.fetch(counterPDA);
      const initialCount = counterBefore.count.toNumber();

      // Ensure we have something to decrement
      if (initialCount === 0) {
        await program.methods
          .increment()
          .accounts({
            authority: authority.publicKey,
          })
          .rpc();
      }

      const countAfterIncrement = (await program.account.counter.fetch(counterPDA)).count.toNumber();

      // Then decrement
      await program.methods
        .decrement()
        .accounts({
          authority: authority.publicKey,
        })
        .rpc();

      const counterAccount = await program.account.counter.fetch(counterPDA);
      expect(counterAccount.count.toNumber()).to.equal(countAfterIncrement - 1);
    });
  });

  describe("set", () => {
    it("sets the counter to a specific value", async () => {
      await program.methods
        .set(new anchor.BN(42))
        .accounts({
          authority: authority.publicKey,
        })
        .rpc();

      const counterAccount = await program.account.counter.fetch(counterPDA);
      expect(counterAccount.count.toNumber()).to.equal(42);
    });
  });

  describe("authority validation", () => {
    it("fails when non-authority tries to increment", async () => {
      // Create a fake authority
      const fakeAuthority = Keypair.generate();

      // Derive PDA for fake authority
      const [fakePDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [fakeAuthority.publicKey.toBuffer()],
        program.programId
      );

      // Try to increment with fake authority - should fail because PDA doesn't exist
      try {
        await program.methods
          .increment()
          .accounts({
            authority: fakeAuthority.publicKey,
          })
          .signers([fakeAuthority])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // The error should be that the account doesn't exist
        expect(error.message).to.include("AccountNotInitialized");
      }
    });
  });
});
