use anchor_lang::prelude::*;

declare_id!("Adryj75Zwpo8Au98xNsCwxdNZ7hY2SX1XeiMWJoVyJZK");

#[program]
pub mod counter {
    use super::*;

    /// Initialize a new counter account with count set to 0
    /// Uses PDA derivation with user's public key for deterministic addresses
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.authority.key();
        msg!(
            "PDA {} initialized with count: {}",
            counter.key(),
            counter.count
        );
        Ok(())
    }

    /// Increment the counter by 1
    /// Wraps around to 0 if count exceeds 1000 (for demo purposes)
    pub fn increment(ctx: Context<Update>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1).unwrap();
        if counter.count > 1000 {
            counter.count = 0;
        }
        msg!("PDA {} count: {}", counter.key(), counter.count);
        Ok(())
    }

    /// Decrement the counter by 1
    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        require!(counter.count > 0, CounterError::CounterUnderflow);
        counter.count = counter.count.checked_sub(1).unwrap();
        msg!("PDA {} count: {}", counter.key(), counter.count);
        Ok(())
    }

    /// Set the counter to a specific value
    pub fn set(ctx: Context<Update>, value: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = value;
        msg!("PDA {} count: {}", counter.key(), counter.count);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Counter::INIT_SPACE,
        seeds = [authority.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(
        mut,
        seeds = [authority.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,

    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    /// The current count value
    pub count: u64,
    /// The authority who can update the counter
    pub authority: Pubkey,
}

#[error_code]
pub enum CounterError {
    #[msg("Counter cannot go below zero")]
    CounterUnderflow,
}
