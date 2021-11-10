const anchor = require("@project-serum/anchor");
const assert = require("assert");
const { SystemProgram } = anchor.web3;

describe("WAGMI WALL Solana Tests", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Wagmiwall;
  const baseAccount = anchor.web3.Keypair.generate();

  it("initializes the program", async () => {
    console.log("🚀 Starting test...");

    const tx = await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount],
    });
    console.log("📝 Your transaction signature", tx);
    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    assert.ok(account.totalGifs.eq(new anchor.BN(0)));
  });

  it("Adds a GIF", async () => {
    await program.rpc.addGif(
      "https://media.giphy.com/media/lXgIUyf8NheDEZSnUt/giphy.gif",
      {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      }
    );
    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    assert.ok(account.totalGifs.eq(new anchor.BN(1)));
    let gifs = account.gifList;
    assert.equal(gifs[0].gifLink, "https://media.giphy.com/media/lXgIUyf8NheDEZSnUt/giphy.gif");
  });

  it("GMI Up Votes a GIF", async () => {
    await program.rpc.gmiVote(
      new anchor.BN(0),
      {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      }
    );
    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    let gifs = account.gifList;
    assert.ok(gifs[0].gmiVotes.eq(new anchor.BN(1)));
  });

  it("NGMI Up Votes a GIF", async () => {
    await program.rpc.ngmiVote(
      new anchor.BN(0),
      {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      }
    );
    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    let gifs = account.gifList;
    assert.ok(gifs[0].ngmiVotes.eq(new anchor.BN(1)));
  });
});
