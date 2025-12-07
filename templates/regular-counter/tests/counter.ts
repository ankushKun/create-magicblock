import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import { Counter } from "../target/types/counter";

describe("counter", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.counter as Program<Counter>;
  const authority = provider.wallet;

  // We'll use a new keypair for the counter account
  let counterKeypair: Keypair;

  beforeEach(() => {
    // Generate a new counter keypair for each test
    counterKeypair = Keypair.generate();
  });

  describe("initialize", () => {
    it("initializes a counter with count 0", async () => {
      await program.methods
        .initialize()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: authority.publicKey,
        })
        .signers([counterKeypair])
        .rpc();

      const counterAccount = await program.account.counter.fetch(
        counterKeypair.publicKey
      );

      expect(counterAccount.count.toNumber()).to.equal(0);
      expect(counterAccount.authority.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
    });
  });

  describe("increment", () => {
    it("increments the counter by 1", async () => {
      // First initialize
      await program.methods
        .initialize()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: authority.publicKey,
        })
        .signers([counterKeypair])
        .rpc();

      // Then increment
      await program.methods
        .increment()
        .accounts({
          counter: counterKeypair.publicKey,
        })
        .rpc();

      const counterAccount = await program.account.counter.fetch(
        counterKeypair.publicKey
      );

      expect(counterAccount.count.toNumber()).to.equal(1);
    });

    it("increments multiple times", async () => {
      // Initialize
      await program.methods
        .initialize()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: authority.publicKey
        })
        .signers([counterKeypair])
        .rpc();

      // Increment 3 times
      for (let i = 0; i < 3; i++) {
        await program.methods
          .increment()
          .accounts({
            counter: counterKeypair.publicKey,
          })
          .rpc();
      }

      const counterAccount = await program.account.counter.fetch(
        counterKeypair.publicKey
      );

      expect(counterAccount.count.toNumber()).to.equal(3);
    });
  });

  describe("decrement", () => {
    it("decrements the counter by 1", async () => {
      // Initialize and increment first
      await program.methods
        .initialize()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: authority.publicKey,
        })
        .signers([counterKeypair])
        .rpc();

      await program.methods
        .increment()
        .accounts({
          counter: counterKeypair.publicKey,
        })
        .rpc();

      // Then decrement
      await program.methods
        .decrement()
        .accounts({
          counter: counterKeypair.publicKey,
        })
        .rpc();

      const counterAccount = await program.account.counter.fetch(
        counterKeypair.publicKey
      );

      expect(counterAccount.count.toNumber()).to.equal(0);
    });

    it("fails when trying to decrement below zero", async () => {
      // Initialize (count = 0)
      await program.methods
        .initialize()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: authority.publicKey,
        })
        .signers([counterKeypair])
        .rpc();

      // Try to decrement - should fail
      try {
        await program.methods
          .decrement()
          .accounts({
            counter: counterKeypair.publicKey,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("CounterUnderflow");
      }
    });
  });

  describe("set", () => {
    it("sets the counter to a specific value", async () => {
      // Initialize
      await program.methods
        .initialize()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: authority.publicKey,
        })
        .signers([counterKeypair])
        .rpc();

      // Set to 42
      await program.methods
        .set(new anchor.BN(42))
        .accounts({
          counter: counterKeypair.publicKey,
        })
        .rpc();

      const counterAccount = await program.account.counter.fetch(
        counterKeypair.publicKey
      );

      expect(counterAccount.count.toNumber()).to.equal(42);
    });
  });

  describe("authority validation", () => {
    it("fails when non-authority tries to increment", async () => {
      // Initialize
      await program.methods
        .initialize()
        .accounts({
          counter: counterKeypair.publicKey,
          authority: authority.publicKey,
        })
        .signers([counterKeypair])
        .rpc();

      // Create a fake authority
      const fakeAuthority = Keypair.generate();

      // Try to increment with fake authority - should fail
      try {
        await program.methods
          .increment()
          .accounts({
            counter: counterKeypair.publicKey,
            // @ts-ignore - authority is auto-resolved but we need to override it for this test
            authority: fakeAuthority.publicKey,
          })
          .signers([fakeAuthority])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // The error should be related to constraint violation
        expect(error.error.errorCode.code).to.equal("ConstraintHasOne");
      }
    });
  });
});
