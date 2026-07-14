// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title DocumentRegistry
/// @notice Stores and verifies cryptographic document records on Ethereum.
contract DocumentRegistry {
    /// @notice Information associated with a registered document.
    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address signer;
        bytes signature;
    }

    /// @dev secp256k1 curve order divided by two.
    /// Signatures with a greater s value are rejected to prevent malleability.
    uint256 private constant SECP256K1_HALF_ORDER = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    mapping(bytes32 => Document) private documents;
    bytes32[] private documentHashes;

    /// @notice Emitted when a document is registered successfully.
    event DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp);

    /// @dev Ensures that a document hash has not already been registered.
    modifier documentNotExists(bytes32 _hash) {
        require(documents[_hash].signer == address(0), "Document already exists");
        _;
    }

    /// @dev Ensures that a document hash is already registered.
    modifier documentExists(bytes32 _hash) {
        require(documents[_hash].signer != address(0), "Document does not exist");
        _;
    }

    /// @notice Stores a document hash together with its signature and signer.
    /// @param _hash Keccak-256 hash of the original document bytes.
    /// @param _timestamp Timestamp supplied by the application.
    /// @param _signature Ethereum signed-message signature of the document hash.
    /// @param _signer Address that created the signature.
    function storeDocumentHash(bytes32 _hash, uint256 _timestamp, bytes memory _signature, address _signer)
        external
        documentNotExists(_hash)
    {
        require(_hash != bytes32(0), "Invalid document hash");
        require(_timestamp > 0, "Invalid timestamp");
        require(_signer != address(0), "Invalid signer");
        require(_signer == msg.sender, "Signer must be transaction sender");
        require(_signature.length == 65, "Invalid signature length");

        address recoveredSigner = _recoverSigner(_hash, _signature);
        require(recoveredSigner == _signer, "Invalid signature");

        documents[_hash] = Document({hash: _hash, timestamp: _timestamp, signer: _signer, signature: _signature});

        documentHashes.push(_hash);

        emit DocumentStored(_hash, _signer, _timestamp);
    }

    /// @notice Verifies a registered document, signer and signature.
    /// @return True when the stored information and recovered signer match.
    function verifyDocument(bytes32 _hash, address _signer, bytes memory _signature)
        external
        view
        documentExists(_hash)
        returns (bool)
    {
        if (_signer == address(0) || _signature.length != 65) {
            return false;
        }

        Document storage document = documents[_hash];

        if (document.signer != _signer) {
            return false;
        }

        bytes memory storedSignature = document.signature;

        if (keccak256(storedSignature) != keccak256(_signature)) {
            return false;
        }

        return _recoverSigner(_hash, _signature) == _signer;
    }

    /// @notice Returns all information stored for a document hash.
    function getDocumentInfo(bytes32 _hash) external view documentExists(_hash) returns (Document memory) {
        return documents[_hash];
    }

    /// @notice Indicates whether a document hash is registered.
    function isDocumentStored(bytes32 _hash) external view returns (bool) {
        return documents[_hash].signer != address(0);
    }

    /// @notice Returns the number of documents registered.
    function getDocumentCount() external view returns (uint256) {
        return documentHashes.length;
    }

    /// @notice Returns a registered document hash by its insertion index.
    function getDocumentHashByIndex(uint256 _index) external view returns (bytes32) {
        require(_index < documentHashes.length, "Index out of bounds");
        return documentHashes[_index];
    }

    /// @dev Recovers the signer of an EIP-191 signed bytes32 message.
    /// Invalid or malleable signatures return address(0).
    function _recoverSigner(bytes32 _hash, bytes memory _signature) internal pure returns (address) {
        if (_signature.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(_signature, 0x20))
            s := mload(add(_signature, 0x40))
            v := byte(0, mload(add(_signature, 0x60)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return address(0);
        }

        if (uint256(s) > SECP256K1_HALF_ORDER) {
            return address(0);
        }

        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));

        return ecrecover(ethSignedMessageHash, v, r, s);
    }
}
