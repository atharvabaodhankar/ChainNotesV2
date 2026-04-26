// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Notes is ReentrancyGuard {
    // Maps a user smart account address to their array of note IPFS CIDs
    mapping(address => string[]) private userNotes;

    // Events
    event NoteCreated(address indexed user, string cid, uint256 timestamp);

    /**
     * @dev Adds a new note CID to the caller's list.
     * @param cid The IPFS CID of the note metadata.
     */
    function createNote(string calldata cid) external nonReentrant {
        require(bytes(cid).length > 0, "CID cannot be empty");
        userNotes[msg.sender].push(cid);
        emit NoteCreated(msg.sender, cid, block.timestamp);
    }

    /**
     * @dev Retrieves all note CIDs for the caller.
     * @return An array of CIDs.
     */
    function getNotes() external view returns (string[] memory) {
        return userNotes[msg.sender];
    }
}
