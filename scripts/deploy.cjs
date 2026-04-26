const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);

    const NotesFactory = await hre.ethers.getContractFactory("Notes");
    const notesContract = await NotesFactory.deploy();
    await notesContract.waitForDeployment();

    const address = await notesContract.getAddress();
    console.log("Notes contract deployed to:", address);

    // Prepare config folders in the frontend directory
    const configDir = path.join(__dirname, "..", "src", "config");
    const abisDir = path.join(configDir, "abis");

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    if (!fs.existsSync(abisDir)) {
        fs.mkdirSync(abisDir, { recursive: true });
    }

    // 1. Save deployed contract address
    const addresses = {
        Notes: address,
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployedAt: new Date().toISOString(),
    };
    fs.writeFileSync(
        path.join(configDir, "contractAddresses.json"),
        JSON.stringify(addresses, null, 2)
    );
    console.log("Saved contract address to src/config/contractAddresses.json");

    // 2. Save contract ABI
    const NotesArtifact = require("../artifacts/contracts/Notes.sol/Notes.json");
    fs.writeFileSync(
        path.join(abisDir, "Notes.json"),
        JSON.stringify(NotesArtifact, null, 2)
    );
    console.log("Saved contract ABI to src/config/abis/Notes.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
