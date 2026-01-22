// Test script for MultiContract compilation
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n=== Testing MultiContract ===\n');

// Check if contract file exists
const contractPath = path.join(__dirname, 'contracts', 'MultiContract.sol');
if (fs.existsSync(contractPath)) {
    console.log('✓ MultiContract.sol found');
    const stats = fs.statSync(contractPath);
    console.log(`  File size: ${stats.size} bytes`);
} else {
    console.log('✗ MultiContract.sol not found');
    process.exit(1);
}

// Try to compile
console.log('\nCompiling contracts...');
try {
    const output = execSync('npx hardhat compile', { 
        encoding: 'utf8',
        stdio: 'pipe'
    });
    console.log('✓ Compilation successful');
    console.log(output);
    
    // Check if artifacts were created
    const artifactPath = path.join(__dirname, 'artifacts', 'contracts', 'MultiContract.sol', 'MultiContract.json');
    if (fs.existsSync(artifactPath)) {
        console.log('\n✓ MultiContract artifacts generated');
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        console.log(`  Contract name: ${artifact.contractName}`);
        console.log(`  Bytecode size: ${artifact.bytecode.length / 2 - 1} bytes`);
    }
    
    console.log('\n=== All tests passed! ===\n');
} catch (error) {
    console.log('✗ Compilation failed');
    console.error(error.message);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.log(error.stderr.toString());
    process.exit(1);
}
