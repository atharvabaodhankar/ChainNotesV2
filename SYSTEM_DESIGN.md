# ChainNotesV2 — System Design

> Production-style Web3 Notes application demonstrating modern consumer dApp architecture using Account Abstraction.

ChainNotes V2 removes traditional Web3 friction by replacing wallet-first UX with social login, smart accounts, gas sponsorship, and decentralized storage.

---

# 1. Goals

## Primary Goal

Create a Web2-like user experience while keeping Web3 ownership.

Users should:

- Login with Google/email
- Never install MetaMask
- Never handle seed phrases
- Never manually pay gas
- Own their data through blockchain identity

---

# 2. High Level Architecture


```
                    USER
                     |
                     |
              React Application
                     |
        +------------+-------------+
        |                          |
      Privy                     IPFS
  Authentication            Decentralized
 + Embedded Wallet            Storage
        |
        |
 ERC-4337 Smart Account
        |
        |
   Smart Account Client
        |
        |
     UserOperation
        |
        |
     Pimlico Bundler
        |
        |
     Pimlico Paymaster
        |
        |
    Polygon Blockchain
        |
        |
     Notes Contract

```

---

# 3. Tech Stack


## Frontend

- React + Vite
- Tailwind CSS
- Viem
- Permissionless.js
- Privy SDK


Responsibilities:

- UI
- Authentication
- Smart account initialization
- Contract reads/writes
- IPFS upload


---

## Authentication Layer

Provider:

Privy


Responsibilities:

- Google login
- Email login
- Embedded wallet creation
- Session management


Traditional:

```

User
 |
MetaMask
 |
EOA Wallet

```

ChainNotes V2:

```

User
 |
Google Login
 |
Privy Embedded Wallet
 |
ERC-4337 Smart Account

```

---

# 4. Account Architecture


## Embedded Wallet

Created automatically by Privy.

Purpose:

- Acts as signer
- Hidden from user
- Controls smart account


The user never sees:

- private key
- seed phrase
- wallet popup


---


## Smart Account


Every user gets:

```

0xSmartAccountAddress

```

Properties:

- deterministic
- same every login
- contract wallet
- programmable


Example:

User logs in today:

```

Google Account
       |
Smart Account
       |
0x123

```


Logs in next month:


```

Same Google Account
       |
Same Smart Account
       |
0x123

```

---

# 5. ERC-4337 Transaction Flow


User creates note:

```

Click Save

    |

Create Note JSON

    |

Upload JSON to IPFS

    |

Receive CID

    |

Create UserOperation

    |

Bundler receives operation

    |

Paymaster sponsors gas

    |

Transaction executed

    |

Polygon updates state

```


---

# 6. Storage Architecture


## Wrong Approach


Never store:

```solidity

string noteContent;

```


Problems:

- expensive
- public forever
- bad scalability



---


## Correct Approach


Note data:


```json

{
"title":"Meeting",
"content":"Call at 5PM",
"createdAt":12345678
}

```


Stored:

```

IPFS
 |
CID

```


Example:

```

QmX92828292...

```


Blockchain stores only:


```solidity

mapping(address => string[]) notes;

```


where string = IPFS CID


---

# 7. Smart Contract Design


Notes.sol


```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;


contract Notes {


mapping(address => string[]) private userNotes;


event NoteCreated(
address indexed user,
string cid
);



function createNote(
string memory cid
)
external
{

userNotes[msg.sender].push(cid);


emit NoteCreated(
msg.sender,
cid
);

}



function getNotes()
external
view
returns(string[] memory)
{

return userNotes[msg.sender];

}

}

```


Important:

With ERC-4337:

```

msg.sender

=

Smart Account Address

```

NOT:

```

Privy wallet address

```


---

# 8. Reading Data


Reads are free.

Flow:


```

React

 |

publicClient.readContract()

 |

Notes.sol

 |

CID[]

 |

Fetch IPFS Data

 |

Display Notes

```


No gas.

No wallet confirmation.


---

# 9. Writing Data


Writes:

```

React

 |

smartAccountClient.sendTransaction()

 |

UserOperation

 |

Bundler

 |

Paymaster

 |

Contract

```


---

# 10. Backend Decision


This app intentionally has:

NO backend.


Why?


Authentication:

Handled by Privy


Transactions:

Handled by ERC-4337


Gas:

Handled by Paymaster


Storage:

Handled by IPFS



Backend only required later for:

- notifications
- AI features
- indexing
- search
- analytics


---

# 11. Network Strategy


Development:

```

Polygon Amoy

```


Production:

```

Polygon Mainnet

```


Reason:

- cheap gas
- EVM compatible
- fast confirmation
- Solidity support


---

# 12. Production Upgrade Path


Small app:


```

React
Privy
ERC4337
IPFS
Polygon

```



Large app (Socio3):


```

React

|

Privy

|

Smart Accounts

|

Polygon

|

IPFS

|

Indexer
(The Graph / Ponder)

|

Database Cache

|

API

```


---

# 13. Environment Variables


Frontend:


```env

VITE_PRIVY_APP_ID=

VITE_PIMLICO_API_KEY=

VITE_RPC_URL=

VITE_CONTRACT_ADDRESS=

```


Never expose:

```

PRIVATE_KEY

ADMIN_KEY

DEPLOYER_KEY

```


---

# 14. Production Checklist


Authentication:

- [ ] Privy configured
- [ ] Session expiry handled


Smart Accounts:

- [ ] deterministic address checked
- [ ] transactions use smart account


Blockchain:

- [ ] contract tested
- [ ] events emitted
- [ ] deployed mainnet


Storage:

- [ ] only CID stored
- [ ] IPFS gateway configured


UX:

- [ ] no MetaMask requirement
- [ ] no gas popup
- [ ] transaction status shown


---

# Final Architecture


```

               React

                 |

              Privy

                 |

        Embedded Wallet

                 |

       ERC-4337 Account

                 |

       Pimlico Infrastructure

                 |

          Polygon Mainnet

                 |

          Smart Contracts

                 |

               IPFS

```


ChainNotes V2 represents the architecture pattern used by modern consumer Web3 applications.

```
Web2 UX
+
Web3 Ownership
```
