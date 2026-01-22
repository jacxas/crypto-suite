# CÓMO USAR IA EN VS CODE SIN COPILOT

## 🚨 PROBLEMA
Tu cuota mensual de GitHub Copilot se terminó y no puedes acceder a tus prompts e instrucciones.

## ✅ SOLUCIÓN
He extraído todas tus instrucciones de Copilot y configurado alternativas gratuitas.

---

## 💾 RESPALDO COMPLETO CREADO

Todas tus instrucciones de Copilot están respaldadas en:
- **Archivo de respaldo**: Ver con Vy el archivo `COPILOT_BACKUP_COMPLETO.md` en memoria
- **Instrucciones originales**: `C:\Users\Admin\crypto-suite\.github\copilot-instructions.md`
- **Prompts de Azure**: `C:\Users\Admin\AppData\Roaming\Code\User\prompts\azurecosmosdb.instructions.md`

---

## 🤖 ALTERNATIVAS DE IA INSTALADAS

### 1️⃣ CONTINUE (RECOMENDADA) ⭐

**Por qué es la mejor:**
- ✅ Open source y gratis
- ✅ Soporta múltiples modelos (GPT-4, Claude, Llama, etc.)
- ✅ Muy configurable
- ✅ Similar a Copilot
- ✅ **YA CONFIGURADA CON TUS INSTRUCCIONES**

**Cómo usar:**

1. **Abrir Continue:**
   - Presiona `Ctrl + L` en VS Code
   - O haz clic en el icono de Continue en la barra lateral

2. **Configurar modelo:**
   - Presiona `Ctrl + Shift + P`
   - Busca "Continue: Open Config"
   - Edita el archivo `config.json` que se abre
   - Añade tu API key (OpenAI, Anthropic, u otro)

3. **Usar comandos personalizados:**
   - En el chat de Continue, escribe `/explain-crypto` para explicar código
   - Escribe `/add-feature` para añadir funcionalidades
   - Escribe `/fix-bug` para corregir errores

**Ejemplo de config.json:**
```json
{
  "models": [
    {
      "title": "GPT-4",
      "provider": "openai",
      "model": "gpt-4",
      "apiKey": "TU_API_KEY_AQUI"
    }
  ]
}
```

**Archivos de configuración creados:**
- `C:\Users\Admin\crypto-suite\.continuerc.json` (Crypto Suite)
- `C:\Users\Admin\crypto-suite\optimizer\.continuerc.json` (Optimizer)

---

### 2️⃣ BLACKBOX AI (MÁS FÁCIL)

**Por qué es buena:**
- ✅ Completamente gratis
- ✅ No requiere API key
- ✅ Autocompletado de código
- ✅ Chat integrado

**Cómo usar:**

1. **Activar Blackbox:**
   - Haz clic en el icono de Blackbox en la barra lateral de VS Code
   - Inicia sesión (opcional) o usa sin cuenta

2. **Usar el chat:**
   - Escribe tus preguntas en el panel de Blackbox
   - Pega el contexto de tus instrucciones cuando sea necesario

3. **Autocompletado:**
   - Simplemente empieza a escribir código
   - Blackbox sugerirá completaciones automáticamente
   - Presiona `Tab` para aceptar

**Tip:** Copia las instrucciones del archivo `COPILOT_BACKUP_COMPLETO.md` y pégalas en el chat de Blackbox cuando necesites contexto específico.

---

### 3️⃣ CLAUDE DEV

**Por qué es buena:**
- ✅ Usa Claude de Anthropic (excelente para código)
- ✅ Interfaz similar a Copilot
- ✅ Muy bueno para explicaciones

**Cómo usar:**

1. **Configurar API key:**
   - Obtén una API key de Anthropic (https://console.anthropic.com/)
   - Presiona `Ctrl + Shift + P`
   - Busca "Claude Dev: Set API Key"
   - Pega tu API key

2. **Usar Claude:**
   - Presiona `Ctrl + Shift + P`
   - Busca "Claude Dev: Start Chat"
   - Escribe tus preguntas

---

### 4️⃣ VERDENT AI

**Cómo usar:**
- Haz clic en el icono de Verdent en la barra lateral
- Sigue las instrucciones de configuración

---

### 5️⃣ SIXTH AI

**Cómo usar:**
- Haz clic en el icono de Sixth en la barra lateral
- Sigue las instrucciones de configuración

---

## 📝 CÓMO IMPORTAR TUS INSTRUCCIONES

### Para Continue:
✅ **YA ESTÁ HECHO** - Los archivos `.continuerc.json` ya tienen tus instrucciones.

### Para Blackbox:
1. Abre el archivo de respaldo (pide a Vy que te lo muestre)
2. Copia las instrucciones relevantes
3. Pégalas en el chat de Blackbox cuando hagas preguntas

### Para Claude Dev:
1. Crea un archivo `.claude.json` en la raíz de tu proyecto
2. Copia las instrucciones del respaldo
3. Claude Dev las leerá automáticamente

---

## 🚀 INICIO RÁPIDO

### Opción 1: Continue (Recomendada)
```bash
# 1. Abre VS Code
code C:\Users\Admin\crypto-suite

# 2. Presiona Ctrl + L para abrir Continue

# 3. Configura tu API key:
# Ctrl + Shift + P > "Continue: Open Config"

# 4. Empieza a chatear con Continue
# Las instrucciones ya están cargadas automáticamente
```

### Opción 2: Blackbox (Más fácil)
```bash
# 1. Abre VS Code
code C:\Users\Admin\crypto-suite

# 2. Haz clic en el icono de Blackbox en la barra lateral

# 3. Empieza a chatear
# No requiere configuración adicional
```

---

## 📊 COMPARACIÓN

| Característica | Continue | Blackbox | Claude Dev |
|-----------------|----------|----------|------------|
| **Gratis** | ✅ | ✅ | ❌ (requiere API) |
| **API Key** | Opcional | No | Sí |
| **Autocompletado** | ✅ | ✅ | ❌ |
| **Chat** | ✅ | ✅ | ✅ |
| **Configuración** | Media | Fácil | Media |
| **Calidad** | Excelente | Buena | Excelente |
| **Instrucciones** | ✅ Configuradas | Manual | Manual |

---

## ❓ PREGUNTAS FRECUENTES

### ¿Puedo usar múltiples IAs a la vez?
✅ Sí, puedes tener Continue, Blackbox y Claude Dev activos simultáneamente.

### ¿Cuál es la mejor para mi caso?
- **Para desarrollo general**: Continue (ya configurada)
- **Para uso rápido sin configuración**: Blackbox
- **Para explicaciones detalladas**: Claude Dev

### ¿Qué pasa con mis instrucciones de Copilot?
✅ Están respaldadas y ya configuradas en Continue. No se perdió nada.

### ¿Necesito pagar por algo?
❌ No necesariamente. Blackbox es completamente gratis. Continue puede usar modelos gratuitos o de pago según prefieras.

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa el archivo de respaldo completo (pide a Vy que te lo muestre)
2. Consulta la documentación oficial de cada extensión
---

## 🎯 PRÓXIMOS PASOS

1. ✅ Abrir VS Code
2. ✅ Probar Continue (Ctrl + L)
3. ✅ Configurar API key si quieres usar GPT-4 o Claude
4. ✅ Probar Blackbox como alternativa gratuita
5. ✅ Empezar a programar con IA nuevamente

---

¡Listo! Ya no dependes de Copilot. Tienes múltiples alternativas configuradas y listas para usar.
