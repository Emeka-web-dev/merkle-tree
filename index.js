const crypto = require('crypto');

class MerkleTree {
    constructor(leaves) {
        // Hash the original data (names)
        this.leaves = leaves.map(leaf => this.hashData(leaf));
        this.layers = [this.leaves];
        this.buildTree();
    }

    // Create SHA256 hash of data
    hashData(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Hash pair of nodes
    hashPair(left, right) {
        // Sort hashes to ensure consistent results
        const concatenated = Buffer.concat([
            Buffer.from(left, 'hex'),
            Buffer.from(right || left, 'hex') // Use left hash if right doesn't exist
        ]);
        return crypto.createHash('sha256').update(concatenated).digest('hex');
    }

    // Build the Merkle tree from bottom up
    buildTree() {
        while (this.layers[this.layers.length - 1].length > 1) {
            const currentLayer = this.layers[this.layers.length - 1];
            const newLayer = [];

            // Process pairs of nodes
            for (let i = 0; i < currentLayer.length; i += 2) {
                const left = currentLayer[i];
                const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : currentLayer[i];
                const parentHash = this.hashPair(left, right);
                newLayer.push(parentHash);
            }

            this.layers.push(newLayer);
        }
    }

    // Get the Merkle root (top hash)
    getRoot() {
        return this.layers[this.layers.length - 1][0];
    }

    // Get proof for a leaf node
    getProof(index) {
        let currentIndex = index;
        const proof = [];

        for (let i = 0; i < this.layers.length - 1; i++) {
            const currentLayer = this.layers[i];
            const isLeft = currentIndex % 2 === 0;
            const pairIndex = isLeft ? currentIndex + 1 : currentIndex - 1;

            if (pairIndex < currentLayer.length) {
                proof.push({
                    position: isLeft ? 'right' : 'left',
                    hash: currentLayer[pairIndex]
                });
            }

            currentIndex = Math.floor(currentIndex / 2);
        }

        return proof;
    }

    // VERIFY PROOF
    static verifyProof(leaf, proof, root) {
        let currentHash = leaf;

        for (const { position, hash } of proof) {
            if (position === 'left') {
                currentHash = crypto.createHash('sha256')
                    .update(Buffer.concat([
                        Buffer.from(hash, 'hex'),
                        Buffer.from(currentHash, 'hex')
                    ]))
                    .digest('hex');
            } else {
                currentHash = crypto.createHash('sha256')
                    .update(Buffer.concat([
                        Buffer.from(currentHash, 'hex'),
                        Buffer.from(hash, 'hex')
                    ]))
                    .digest('hex');
            }
        }

        return currentHash === root;
    }
}

// Example use case
const names = ["Debo", "Kenneth", "Manji", "Jerry", "victor"];
const { root, tree } = createMerkleTreeFromNames(names);

console.log('Merkle Root:', root);

// Generate proof for 'Alice' (index 0)
const proof = tree.getProof(0);


// Verify the proof
const verified = MerkleTree.verifyProof(
    tree.leaves[0], // Alice's hash
    proof,
    root
);
console.log('Proof verified:', verified);

// Example usage
function createMerkleTreeFromNames(names) {
    const merkleTree = new MerkleTree(names);
    return {
        root: merkleTree.getRoot(),
        tree: merkleTree,
        layers: merkleTree.layers
    };
}