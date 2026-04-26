const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Notes Contract", function () {
    let notesContract;
    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        const NotesFactory = await ethers.getContractFactory("Notes");
        notesContract = await NotesFactory.deploy();
        await notesContract.waitForDeployment();
    });

    describe("createNote", function () {
        it("should successfully save a note CID for a user", async function () {
            const cid = "QmXoypizjW3WknFixtdKL94pS5D83D9FkwP9G kwP9G"; // Sample CID
            const tx = await notesContract.connect(user1).createNote(cid);
            await tx.wait();

            const userNotes = await notesContract.connect(user1).getNotes();
            expect(userNotes.length).to.equal(1);
            expect(userNotes[0]).to.equal(cid);
        });

        it("should emit a NoteCreated event", async function () {
            const cid = "QmXoypizjW3WknFixtdKL94pS5D83D9FkwP9G kwP9G";
            await expect(notesContract.connect(user1).createNote(cid))
                .to.emit(notesContract, "NoteCreated")
                .withArgs(user1.address, cid, (ts) => ts > 0);
        });

        it("should revert if CID is empty", async function () {
            await expect(notesContract.connect(user1).createNote(""))
                .to.be.revertedWith("CID cannot be empty");
        });
    });

    describe("getNotes", function () {
        it("should return empty array for user with no notes", async function () {
            const userNotes = await notesContract.connect(user1).getNotes();
            expect(userNotes.length).to.equal(0);
        });

        it("should only return notes belonging to the calling address", async function () {
            const cid1 = "QmUser1NoteCID12345";
            const cid2 = "QmUser2NoteCID67890";

            await notesContract.connect(user1).createNote(cid1);
            await notesContract.connect(user2).createNote(cid2);

            const user1Notes = await notesContract.connect(user1).getNotes();
            expect(user1Notes.length).to.equal(1);
            expect(user1Notes[0]).to.equal(cid1);

            const user2Notes = await notesContract.connect(user2).getNotes();
            expect(user2Notes.length).to.equal(1);
            expect(user2Notes[0]).to.equal(cid2);
        });
    });
});
