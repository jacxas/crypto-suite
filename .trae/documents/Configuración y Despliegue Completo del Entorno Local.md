Voy a configurar y ejecutar todo el entorno localmente para ti. Esto incluirá la instalación de dependencias, la configuración de una blockchain local (Hardhat), el despliegue de los contratos y el inicio de la aplicación.

### Pasos de la implementación:

1.  **Instalar dependencias**: Ejecutaré `npm install` para bajar todas las librerías necesarias.
2.  **Configurar entorno local (`.env`)**:
    *   Configuraré el archivo `.env` para usar una red local de pruebas (Hardhat Network).
    *   Estableceré `RPC_URL` a `http://127.0.0.1:8545`.
    *   Usaré la clave privada por defecto de Hardhat (Account #0) para que tengas fondos de prueba.
3.  **Iniciar Blockchain Local**:
    *   Abriré una nueva terminal para ejecutar `npx hardhat node`. Esto simulará una blockchain en tu PC.
4.  **Desplegar Contratos**:
    *   Ejecutaré `npm run deploy` para subir los contratos inteligentes a tu red local.
    *   Esto actualizará automáticamente las direcciones en tu archivo `.env`.
5.  **Iniciar la Aplicación**:
    *   Ejecutaré `.\deploy.ps1` (o los comandos equivalentes) para levantar la base de datos y el backend usando Docker.

Al finalizar, tendrás la aplicación corriendo en `http://localhost:3000` conectada a tu propia blockchain local.