// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";

contract DocumentRegistryTest is Test {
    DocumentRegistry private registry;

    uint256 private constant SIGNER_PRIVATE_KEY = 0xA11CE;
    uint256 private constant OTHER_PRIVATE_KEY = 0xB0B;
    uint256 private constant DOCUMENT_TIMESTAMP = 1_720_000_000;

    address private signer;
    address private otherSigner;
    bytes32 private documentHash;
    bytes private signature;

    event DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp);

    function setUp() public {
        registry = new DocumentRegistry();

        signer = vm.addr(SIGNER_PRIVATE_KEY);
        otherSigner = vm.addr(OTHER_PRIVATE_KEY);
        documentHash = keccak256(bytes("document-one"));
        signature = _signDocument(SIGNER_PRIVATE_KEY, documentHash);
    }

    function testStoreDocumentHashCorrectly() public {
        vm.prank(signer);
        registry.storeDocumentHash(documentHash, DOCUMENT_TIMESTAMP, signature, signer);

        assertTrue(registry.isDocumentStored(documentHash));
        assertEq(registry.getDocumentCount(), 1);
        assertEq(registry.getDocumentHashByIndex(0), documentHash);
    }

    function testEmitDocumentStored() public {
        vm.expectEmit(true, true, false, true);
        emit DocumentStored(documentHash, signer, DOCUMENT_TIMESTAMP);

        vm.prank(signer);
        registry.storeDocumentHash(documentHash, DOCUMENT_TIMESTAMP, signature, signer);
    }

    function testVerifyStoredDocument() public {
        _storeDocument(documentHash, DOCUMENT_TIMESTAMP, SIGNER_PRIVATE_KEY);

        bool valid = registry.verifyDocument(documentHash, signer, signature);

        assertTrue(valid);
    }

    function testRejectDuplicateDocument() public {
        _storeDocument(documentHash, DOCUMENT_TIMESTAMP, SIGNER_PRIVATE_KEY);

        vm.expectRevert(bytes("Document already exists"));

        vm.prank(signer);
        registry.storeDocumentHash(documentHash, DOCUMENT_TIMESTAMP, signature, signer);
    }

    function testGetDocumentInfoCorrectly() public {
        _storeDocument(documentHash, DOCUMENT_TIMESTAMP, SIGNER_PRIVATE_KEY);

        DocumentRegistry.Document memory document = registry.getDocumentInfo(documentHash);

        assertEq(document.hash, documentHash);
        assertEq(document.timestamp, DOCUMENT_TIMESTAMP);
        assertEq(document.signer, signer);
        assertEq(document.signature, signature);
    }

    function testCountDocuments() public {
        bytes32 secondHash = keccak256(bytes("document-two"));
        bytes32 thirdHash = keccak256(bytes("document-three"));

        _storeDocument(documentHash, DOCUMENT_TIMESTAMP, SIGNER_PRIVATE_KEY);

        _storeDocument(secondHash, DOCUMENT_TIMESTAMP + 1, SIGNER_PRIVATE_KEY);

        _storeDocument(thirdHash, DOCUMENT_TIMESTAMP + 2, OTHER_PRIVATE_KEY);

        assertEq(registry.getDocumentCount(), 3);
    }

    function testIterateDocumentsByIndex() public {
        bytes32 secondHash = keccak256(bytes("document-two"));
        bytes32 thirdHash = keccak256(bytes("document-three"));

        _storeDocument(documentHash, DOCUMENT_TIMESTAMP, SIGNER_PRIVATE_KEY);

        _storeDocument(secondHash, DOCUMENT_TIMESTAMP + 1, SIGNER_PRIVATE_KEY);

        _storeDocument(thirdHash, DOCUMENT_TIMESTAMP + 2, OTHER_PRIVATE_KEY);

        assertEq(registry.getDocumentHashByIndex(0), documentHash);
        assertEq(registry.getDocumentHashByIndex(1), secondHash);
        assertEq(registry.getDocumentHashByIndex(2), thirdHash);
    }

    function testRejectMissingDocumentOperations() public {
        bytes32 missingHash = keccak256(bytes("missing-document"));

        vm.expectRevert(bytes("Document does not exist"));
        registry.getDocumentInfo(missingHash);

        vm.expectRevert(bytes("Document does not exist"));
        registry.verifyDocument(missingHash, signer, signature);
    }

    function testVerifyReturnsFalseForWrongSignerAndSignature() public {
        _storeDocument(documentHash, DOCUMENT_TIMESTAMP, SIGNER_PRIVATE_KEY);

        bool wrongSignerResult = registry.verifyDocument(documentHash, otherSigner, signature);

        bytes memory otherSignature = _signDocument(OTHER_PRIVATE_KEY, documentHash);

        bool wrongSignatureResult = registry.verifyDocument(documentHash, signer, otherSignature);

        bool invalidLengthResult = registry.verifyDocument(documentHash, signer, bytes("short"));

        assertFalse(wrongSignerResult);
        assertFalse(wrongSignatureResult);
        assertFalse(invalidLengthResult);
    }

    function testRejectInvalidStoreInputs() public {
        vm.startPrank(signer);

        vm.expectRevert(bytes("Invalid document hash"));
        registry.storeDocumentHash(bytes32(0), DOCUMENT_TIMESTAMP, signature, signer);

        vm.expectRevert(bytes("Invalid timestamp"));
        registry.storeDocumentHash(documentHash, 0, signature, signer);

        vm.expectRevert(bytes("Invalid signer"));
        registry.storeDocumentHash(documentHash, DOCUMENT_TIMESTAMP, signature, address(0));

        vm.expectRevert(bytes("Invalid signature length"));
        registry.storeDocumentHash(documentHash, DOCUMENT_TIMESTAMP, bytes("short"), signer);

        bytes memory invalidSignature = _signDocument(OTHER_PRIVATE_KEY, documentHash);

        vm.expectRevert(bytes("Invalid signature"));
        registry.storeDocumentHash(documentHash, DOCUMENT_TIMESTAMP, invalidSignature, signer);

        vm.stopPrank();

        vm.startPrank(otherSigner);
        vm.expectRevert(bytes("Signer must be transaction sender"));
        registry.storeDocumentHash(documentHash, DOCUMENT_TIMESTAMP, signature, signer);
        vm.stopPrank();
    }

    function testRejectOutOfBoundsIndex() public {
        vm.expectRevert(bytes("Index out of bounds"));
        registry.getDocumentHashByIndex(0);

        _storeDocument(documentHash, DOCUMENT_TIMESTAMP, SIGNER_PRIVATE_KEY);

        vm.expectRevert(bytes("Index out of bounds"));
        registry.getDocumentHashByIndex(1);
    }

    function _storeDocument(bytes32 _hash, uint256 _timestamp, uint256 _privateKey)
        internal
        returns (bytes memory generatedSignature)
    {
        address documentSigner = vm.addr(_privateKey);
        generatedSignature = _signDocument(_privateKey, _hash);

        vm.prank(documentSigner);
        registry.storeDocumentHash(_hash, _timestamp, generatedSignature, documentSigner);
    }

    function _signDocument(uint256 _privateKey, bytes32 _hash) internal pure returns (bytes memory) {
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_privateKey, ethSignedMessageHash);

        return abi.encodePacked(r, s, v);
    }
}
