const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n=== Building Crypto Suite ===\n');

try {
  // Limpiar artifacts anteriores
  console.log('1. Limpiando artifacts anteriores...');
  if (fs.existsSync('./artifacts')) {
    execSync('npx hardhat clean', { stdio: 'inherit' });
  }
  console.log('   ✓ Limpieza completada\n');

  // Compilar contratos
  console.log('2. Compilando contratos...');
  execSync('npx hardhat compile', { stdio: 'inherit' });
  console.log('   ✓ Compilación completada\n');

  // Ejecutar tests
  console.log('3. Ejecutando tests...');
  execSync('npx hardhat test', { stdio: 'inherit' });
  console.log('   ✓ Tests completados\n');

  // Crear directorio de build si no existe
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Copiar ABIs importantes
  console.log('4. Copiando ABIs...');
  const contracts = ['AdvancedToken', 'NFTCollection', 'NFTMarketplace'];
  
  contracts.forEach(contractName => {
    const artifactPath = path.join(
      __dirname,
      'artifacts',
      'contracts',
      `${contractName}.sol`,
      `${contractName}.json`
    );
    
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const abi = {
        contractName: contractName,
        abi: artifact.abi,
        bytecode: artifact.bytecode
      };
      
      fs.writeFileSync(
        path.join(buildDir, `${contractName}.json`),
        JSON.stringify(abi, null, 2)
      );
      console.log(`   ✓ ${contractName}.json copiado`);
    }
  });

  console.log('\n=== Build completado exitosamente ===\n');
  console.log('Archivos generados en ./build/');
  console.log('Artifacts en ./artifacts/');
  
} catch (error) {
  console.error('\n❌ Error durante el build:', error.message);
  process.exit(1);
}
