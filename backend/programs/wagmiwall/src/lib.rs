use anchor_lang::prelude::*;

declare_id!("6trfXDSaEPPZMQWAx9WHBfEXGTUnAPASc67xiMJnuU17");

#[program]
pub mod wagmiwall {
    use super::*;
    pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_gifs = 0;
        Ok(())
    }

    // Another function woo!
    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        // Get a reference to the account and increment total_gifs.
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        // Build the struct.
        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
            gmi_votes: 0,
            ngmi_votes: 0,
        };

        // Add it to the gif_list vector.
        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    // GMI Vote
    pub fn gmi_vote(ctx: Context<Vote>, index: u32) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        let i = index as usize;
        if i < base_account.gif_list.len() {
            let mut item = &mut base_account.gif_list[i];
            item.gmi_votes += 1;
        }
        Ok(())
    }

    // NGMI Vote
    pub fn ngmi_vote(ctx: Context<Vote>, index: u32) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        let i = index as usize;
        if i < base_account.gif_list.len() {
            let mut item = &mut base_account.gif_list[i];
            item.ngmi_votes += 1;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

// Create a custom struct for us to work with.
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub gmi_votes: u64,
    pub ngmi_votes: u64,
}

// Tell Solana what we want to store on this account.
#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
}
