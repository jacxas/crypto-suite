# Crypto Suite - Test Suite

## Overview

Comprehensive test suite for the Crypto Suite smart contracts, covering all functionality including token operations, NFT management, marketplace, and multi-signature wallet.

## Test Files

### Unit Tests

#### 1. `AdvancedToken.test.js`
Tests for the ERC20 token with staking functionality:
- ✅ Deployment and initial configuration
- ✅ Token transfers with 1% fee
- ✅ Staking and unstaking
- ✅ Reward calculations (10% APR)
- ✅ Auto-compound functionality
- ✅ Permission controls
- ✅ Edge cases and error handling

**Coverage:** 50+ test cases

#### 2. `NFTCollection.test.js`
Tests for the ERC721 NFT collection:
- ✅ Deployment and configuration
- ✅ Individual minting
- ✅ Batch minting
- ✅ Token URI management
- ✅ Transfer functionality
- ✅ Owner permissions
- ✅ Supply tracking

**Coverage:** 20+ test cases

#### 3. `NFTMarketplace.test.js`
Tests for the NFT marketplace:
- ✅ Deployment and setup
- ✅ Listing NFTs for sale
- ✅ Buying NFTs with ERC20 tokens
- ✅ Cancelling listings
- ✅ Active listings management
- ✅ Approval requirements
- ✅ Payment transfers

**Coverage:** 30+ test cases

#### 4. `MultiContract.test.js`
Tests for the multi-signature wallet with NFT escrow:
- ✅ Multi-sig signer management
- ✅ Required signatures configuration
- ✅ NFT escrow deposits
- ✅ NFT releases and refunds
- ✅ Transaction submission
- ✅ Transaction signing and execution
- ✅ Signature revocation
- ✅ Complex multi-sig scenarios

**Coverage:** 60+ test cases

### Integration Tests

#### 5. `Integration.test.js`
End-to-end tests covering interactions between all contracts:
- ✅ Complete NFT marketplace flow
- ✅ Staking rewards used for purchases
- ✅ Multi-sig escrow with marketplace
- ✅ Complex multi-contract scenarios
- ✅ Token fees across operations
- ✅ Error handling and edge cases

**Coverage:** 15+ integration scenarios

## Test Helpers

### `helpers/testHelpers.js`
Utility functions for testing:
- `increaseTime(seconds)` - Fast-forward blockchain time
- `getLatestBlockTimestamp()` - Get current block timestamp
- `deployToken()` - Deploy AdvancedToken contract
- `deployNFT()` - Deploy NFTCollection contract
- `deployMarketplace()` - Deploy NFTMarketplace contract
- `deployMultiContract()` - Deploy MultiContract
- `expectRevert()` - Assert transaction reverts
- `expectEvent()` - Assert event emission

## Running Tests

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Test File
```bash
npx hardhat test test/AdvancedToken.test.js
npx hardhat test test/NFTCollection.test.js
npx hardhat test test/NFTMarketplace.test.js
npx hardhat test test/MultiContract.test.js
npx hardhat test test/Integration.test.js
```

### Run with Gas Report
```bash
REPORT_GAS=true npx hardhat test
```

### Run with Coverage
```bash
npx hardhat coverage
```

### Run Specific Test
```bash
npx hardhat test --grep "Should allow staking tokens"
```

## Test Structure

Each test file follows this structure:

```javascript
describe("ContractName", function () {
  // Setup
  beforeEach(async function () {
    // Deploy contracts and setup test environment
  });

  describe("Feature Group", function () {
    it("Should do something specific", async function () {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Key Testing Patterns

### 1. State Verification
```javascript
expect(await contract.someValue()).to.equal(expectedValue);
```

### 2. Event Emission
```javascript
await expect(contract.someFunction())
  .to.emit(contract, "EventName")
  .withArgs(arg1, arg2);
```

### 3. Revert Testing
```javascript
await expect(
  contract.someFunction()
).to.be.revertedWith("Error message");
```

### 4. Balance Changes
```javascript
const balanceBefore = await token.balanceOf(address);
// ... perform action
const balanceAfter = await token.balanceOf(address);
expect(balanceAfter - balanceBefore).to.equal(expectedChange);
```

### 5. Time Manipulation
```javascript
await time.increase(86400); // Increase by 1 day
```

## Test Coverage Goals

- ✅ **Unit Tests:** 100% function coverage
- ✅ **Integration Tests:** All critical user flows
- ✅ **Edge Cases:** Boundary conditions and error states
- ✅ **Security:** Permission checks and access control
- ✅ **Gas Optimization:** Verify efficient operations

## Common Test Scenarios

### Token Operations
- Transfer with fees
- Staking and unstaking
- Reward calculations
- Auto-compound

### NFT Operations
- Minting (single and batch)
- Transfers
- Marketplace listing and buying
- Escrow deposits and releases

### Multi-Signature
- Adding/removing signers
- Transaction submission and signing
- Execution with required signatures
- Signature revocation

### Integration Flows
- Stake → Earn → Buy NFT
- Escrow → Release → Marketplace
- Multi-sig → Token distribution → NFT purchase

## Debugging Tests

### Enable Console Logs
```javascript
console.log("Value:", await contract.someValue());
```

### Check Transaction Receipt
```javascript
const tx = await contract.someFunction();
const receipt = await tx.wait();
console.log("Gas used:", receipt.gasUsed.toString());
```

### Verbose Error Messages
```bash
npx hardhat test --verbose
```

## Best Practices

1. **Isolation:** Each test should be independent
2. **Setup:** Use `beforeEach` for common setup
3. **Clarity:** Test names should describe expected behavior
4. **Coverage:** Test both success and failure cases
5. **Gas:** Monitor gas usage for optimization
6. **Events:** Always verify event emissions
7. **State:** Check state changes after operations
8. **Permissions:** Test access control thoroughly

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npx hardhat test
  
- name: Generate Coverage
  run: npx hardhat coverage
```

## Test Data

### Default Values
- Initial token supply: 1,000,000 tokens
- Staking APR: 10%
- Transfer fee: 1%
- Test accounts: 4 (owner, user1, user2, user3)

### Common Amounts
- Small: 100 tokens
- Medium: 1,000 tokens
- Large: 10,000 tokens
- Stake: 5,000 tokens

## Troubleshooting

### Issue: Tests timeout
**Solution:** Increase timeout in hardhat.config.js
```javascript
mocha: {
  timeout: 60000 // 60 seconds
}
```

### Issue: Gas estimation failed
**Solution:** Check contract state and permissions

### Issue: Nonce too high
**Solution:** Reset Hardhat network
```bash
npx hardhat clean
```

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add tests to appropriate file
3. Update this README
4. Ensure all tests pass
5. Check gas usage

## Resources

- [Hardhat Testing](https://hardhat.org/tutorial/testing-contracts)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Test Helpers](https://docs.openzeppelin.com/test-helpers/)

## License

MIT
