/**
 * IA-Suite — 10 tokens de inteligencia artificial (AITH, AIPR, AIDT, AISC, AIBT,
 * AIWR, AICR, AITX, AIEX, AIFA) más el hub IAHub.
 *
 * Generado desde `tokens.ts` de la variante v2 de develop-ia-token-suite.
 * Datos de escaparate: los contratos existen en `contracts/iasuite/` pero
 * todavía no hay direcciones desplegadas.
 */

export const IA_TOKENS = [
  {
    "id": "aith",
    "name": "AI Thinker",
    "symbol": "AITH",
    "icon": "🧠",
    "image": "/ia/aith-coin.png",
    "color": "#6366F1",
    "colorRGB": "99, 102, 241",
    "gradient": "from-indigo-500 to-purple-600",
    "supply": "10,000,000",
    "supplyNum": 10000000,
    "maxSupply": "10,000,000",
    "decimals": 18,
    "utility": "Gobernanza del Sistema",
    "description": "Token de gobernanza central que permite a los holders votar en propuestas, gestionar decisiones del protocolo y definir la dirección del ecosistema IA TOKEN SUITE. El poder de voto se actualiza automáticamente con cada transferencia.",
    "features": [
      "Votación On-chain",
      "Gobernanza DAO",
      "Poder de Voto Dinámico",
      "Mint / Burn Controlado"
    ],
    "contract": "AITH.sol",
    "keyFunctions": [
      {
        "name": "addGovernanceMember()",
        "desc": "Añade miembro de gobernanza"
      },
      {
        "name": "updateVotingPower()",
        "desc": "Actualiza poder de voto"
      },
      {
        "name": "canVote()",
        "desc": "Verifica capacidad de voto"
      },
      {
        "name": "transfer() override",
        "desc": "Actualiza poder de voto auto."
      }
    ],
    "category": "governance"
  },
  {
    "id": "aipr",
    "name": "AI Processor",
    "symbol": "AIPR",
    "icon": "⚡",
    "image": "/ia/aipr-coin.png",
    "color": "#F59E0B",
    "colorRGB": "245, 158, 11",
    "gradient": "from-amber-500 to-orange-600",
    "supply": "50,000,000",
    "supplyNum": 50000000,
    "maxSupply": "50,000,000",
    "decimals": 18,
    "utility": "Pago por Tareas de IA",
    "description": "Compensa nodos de procesamiento que ejecutan tareas computacionales de IA. Cada tarea completada genera recompensas automáticas y acumula estadísticas de rendimiento por procesador.",
    "features": [
      "Task Registration",
      "Processor Stats",
      "Auto-reward Mint",
      "Performance Tracking"
    ],
    "contract": "AIPR.sol",
    "keyFunctions": [
      {
        "name": "registerTask()",
        "desc": "Registra tarea + recompensa"
      },
      {
        "name": "getProcessorStats()",
        "desc": "Estadísticas del procesador"
      },
      {
        "name": "mint()",
        "desc": "Mint controlado por IAHub"
      },
      {
        "name": "burnFrom()",
        "desc": "Burn autorizado"
      }
    ],
    "category": "compute"
  },
  {
    "id": "aidt",
    "name": "AI Data",
    "symbol": "AIDT",
    "icon": "💾",
    "image": "/ia/aidt-coin.png",
    "color": "#10B981",
    "colorRGB": "16, 185, 129",
    "gradient": "from-emerald-500 to-teal-600",
    "supply": "100,000,000",
    "supplyNum": 100000000,
    "maxSupply": "100,000,000",
    "decimals": 18,
    "utility": "Almacenamiento Descentralizado",
    "description": "Sistema de almacenamiento descentralizado de datos para datasets de IA. Los usuarios pagan con créditos para almacenar y recuperar datos indexados por hash criptográfico.",
    "features": [
      "Data Storage",
      "Storage Credits",
      "Hash Indexing",
      "Data Retrieval"
    ],
    "contract": "AIDT.sol",
    "keyFunctions": [
      {
        "name": "storeData()",
        "desc": "Almacena registro de datos"
      },
      {
        "name": "retrieveData()",
        "desc": "Recupera datos por hash"
      },
      {
        "name": "addStorageCredits()",
        "desc": "Añade créditos"
      },
      {
        "name": "getUserData()",
        "desc": "Datos del usuario"
      }
    ],
    "category": "data"
  },
  {
    "id": "aisc",
    "name": "AI Secure",
    "symbol": "AISC",
    "icon": "🔒",
    "image": "/ia/aisc-coin.png",
    "color": "#EF4444",
    "colorRGB": "239, 68, 68",
    "gradient": "from-red-500 to-rose-600",
    "supply": "25,000,000",
    "supplyNum": 25000000,
    "maxSupply": "25,000,000",
    "decimals": 18,
    "utility": "Seguridad y Validación",
    "description": "Red de validadores que asegura el protocolo. Los validadores acumulan security score al verificar transacciones, creando un sistema de reputación descentralizado.",
    "features": [
      "Validator Network",
      "Security Scoring",
      "TX Validation",
      "Reputation System"
    ],
    "contract": "AISC.sol",
    "keyFunctions": [
      {
        "name": "addValidator()",
        "desc": "Añade nodo validador"
      },
      {
        "name": "validateTransaction()",
        "desc": "Valida transacción"
      },
      {
        "name": "updateSecurityScore()",
        "desc": "Actualiza puntaje"
      },
      {
        "name": "isTransactionValidated()",
        "desc": "Verifica estado TX"
      }
    ],
    "category": "security"
  },
  {
    "id": "aibt",
    "name": "AI Bot",
    "symbol": "AIBT",
    "icon": "🤖",
    "image": "/ia/aibt-coin.png",
    "color": "#8B5CF6",
    "colorRGB": "139, 92, 246",
    "gradient": "from-violet-500 to-purple-600",
    "supply": "30,000,000",
    "supplyNum": 30000000,
    "maxSupply": "30,000,000",
    "decimals": 18,
    "utility": "Agentes Autónomos",
    "description": "Plataforma para desplegar, ejecutar y gestionar bots inteligentes con estados (ACTIVE, PAUSED, TERMINATED). Los bots requieren staking y acumulan ejecuciones.",
    "features": [
      "Bot Deployment",
      "State Machine",
      "Execution Tracking",
      "Staking Required"
    ],
    "contract": "AIBT.sol",
    "keyFunctions": [
      {
        "name": "createBot()",
        "desc": "Crea agente autónomo"
      },
      {
        "name": "executeBot()",
        "desc": "Ejecuta bot activo"
      },
      {
        "name": "changeBotStatus()",
        "desc": "Cambia estado del bot"
      },
      {
        "name": "getUserBots()",
        "desc": "Lista bots del usuario"
      }
    ],
    "category": "agents"
  },
  {
    "id": "aiwr",
    "name": "AI Reward",
    "symbol": "AIWR",
    "icon": "🏆",
    "image": "/ia/aiwr-coin.png",
    "color": "#EC4899",
    "colorRGB": "236, 72, 153",
    "gradient": "from-pink-500 to-rose-600",
    "supply": "200,000,000",
    "supplyNum": 200000000,
    "maxSupply": "200,000,000",
    "decimals": 18,
    "utility": "Recompensas y Staking",
    "description": "Protocolo de staking con recompensas automáticas basadas en tiempo. Los usuarios depositan tokens para generar yield continuo con tasa configurable.",
    "features": [
      "Auto Staking",
      "Time-based Rewards",
      "Configurable Rate",
      "Claim Mechanism"
    ],
    "contract": "AIWR.sol",
    "keyFunctions": [
      {
        "name": "stake()",
        "desc": "Deposita tokens en staking"
      },
      {
        "name": "unstake()",
        "desc": "Retira del staking"
      },
      {
        "name": "claimRewards()",
        "desc": "Reclama recompensas"
      },
      {
        "name": "pendingRewards()",
        "desc": "Calcula pendientes"
      }
    ],
    "category": "rewards"
  },
  {
    "id": "aicr",
    "name": "AI Creator",
    "symbol": "AICR",
    "icon": "🎨",
    "image": "/ia/aicr-coin.png",
    "color": "#14B8A6",
    "colorRGB": "20, 184, 166",
    "gradient": "from-teal-500 to-cyan-600",
    "supply": "75,000,000",
    "supplyNum": 75000000,
    "maxSupply": "75,000,000",
    "decimals": 18,
    "utility": "Desarrolladores de IA",
    "description": "Sistema de incentivos para creadores de modelos, herramientas y contribuciones al ecosistema. Incluye sistema de reputación y aprobación de contribuciones.",
    "features": [
      "Contribution System",
      "Reputation Score",
      "Approval Flow",
      "Creator Rewards"
    ],
    "contract": "AICR.sol",
    "keyFunctions": [
      {
        "name": "submitContribution()",
        "desc": "Envía contribución"
      },
      {
        "name": "approveContribution()",
        "desc": "Aprueba + recompensa"
      },
      {
        "name": "updateReputation()",
        "desc": "Actualiza reputación"
      },
      {
        "name": "getCreatorContributions()",
        "desc": "Lista contribuciones"
      }
    ],
    "category": "dev"
  },
  {
    "id": "aitx",
    "name": "AI Transaction",
    "symbol": "AITX",
    "icon": "⛽",
    "image": "/ia/aitx-coin.png",
    "color": "#F97316",
    "colorRGB": "249, 115, 22",
    "gradient": "from-orange-500 to-red-600",
    "supply": "500,000,000",
    "supplyNum": 500000000,
    "maxSupply": "500,000,000",
    "decimals": 18,
    "utility": "Gas Interno",
    "description": "Token de gas interno con auto-deducción en cada transfer. Incluye sistema de exención de tarifas y precio de gas configurable por el owner.",
    "features": [
      "Auto Gas Deduction",
      "Fee Exemption",
      "Dynamic Pricing",
      "Gas Tracking"
    ],
    "contract": "AITX.sol",
    "keyFunctions": [
      {
        "name": "payGas()",
        "desc": "Paga gas manualmente"
      },
      {
        "name": "setGasPrice()",
        "desc": "Configura precio gas"
      },
      {
        "name": "setFeeExempt()",
        "desc": "Exime de tarifas"
      },
      {
        "name": "transfer() override",
        "desc": "Auto-cobra gas en TX"
      }
    ],
    "category": "gas"
  },
  {
    "id": "aiex",
    "name": "AI Exchange",
    "symbol": "AIEX",
    "icon": "🔄",
    "image": "/ia/aiex-coin.png",
    "color": "#06B6D4",
    "colorRGB": "6, 182, 212",
    "gradient": "from-cyan-500 to-blue-600",
    "supply": "150,000,000",
    "supplyNum": 150000000,
    "maxSupply": "150,000,000",
    "decimals": 18,
    "utility": "Intercambio Interno (DEX)",
    "description": "DEX interno con modelo AMM para swap entre tokens de la suite. Soporta creación de pares, adición de liquidez y cálculo automático de precios.",
    "features": [
      "AMM Swap Engine",
      "Liquidity Pools",
      "Dynamic Pricing",
      "Volume Tracking"
    ],
    "contract": "AIEX.sol",
    "keyFunctions": [
      {
        "name": "createSwapPair()",
        "desc": "Crea par de intercambio"
      },
      {
        "name": "swap()",
        "desc": "Ejecuta swap AMM"
      },
      {
        "name": "addLiquidity()",
        "desc": "Añade liquidez"
      },
      {
        "name": "getPairPrice()",
        "desc": "Precio del par"
      }
    ],
    "category": "exchange"
  },
  {
    "id": "aifa",
    "name": "AI Farm",
    "symbol": "AIFA",
    "icon": "🌾",
    "image": "/ia/aifa-coin.png",
    "color": "#84CC16",
    "colorRGB": "132, 204, 22",
    "gradient": "from-lime-500 to-green-600",
    "supply": "300,000,000",
    "supplyNum": 300000000,
    "maxSupply": "300,000,000",
    "decimals": 18,
    "utility": "Farming y Liquidez",
    "description": "Plataforma de yield farming con pools múltiples y recompensas por bloque. Permite crear pools personalizados con tokens de recompensa configurables.",
    "features": [
      "Multi-pool Farming",
      "Block Rewards",
      "Harvest Mechanism",
      "Custom Pools"
    ],
    "contract": "AIFA.sol",
    "keyFunctions": [
      {
        "name": "createFarmPool()",
        "desc": "Crea pool de farming"
      },
      {
        "name": "farm()",
        "desc": "Deposita en pool"
      },
      {
        "name": "harvest()",
        "desc": "Cosecha recompensas"
      },
      {
        "name": "pendingRewards()",
        "desc": "Recompensas pendientes"
      }
    ],
    "category": "farming"
  }
];

export const IA_CATEGORIES = ["governance","compute","data","security","agents","rewards","dev","gas","exchange","farming"];

export const IA_CATEGORY_LABELS = {
  "governance": "Governance",
  "compute": "Compute",
  "data": "Data",
  "security": "Security",
  "agents": "Agents",
  "rewards": "Rewards",
  "dev": "Dev",
  "gas": "Gas",
  "exchange": "Exchange",
  "farming": "Farming"
};
