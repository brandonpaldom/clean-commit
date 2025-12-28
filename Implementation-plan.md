# Documento de Diseño Técnico: Extensión "AI Commit Assistant" (Cross-Compatible)

## 1. Resumen Ejecutivo

Desarrollar una extensión universal de asistencia para commits, compatible con el ecosistema **VS Code y sus derivados (Cursor, Windsurf, VSCodium, etc.)**.

* **Interfaz:** Panel Lateral dedicado (Side Bar).
* **Motor de IA:** Google Gemini (Modelo `gemini-1.5-flash`).
* **Estándar:** Conventional Commits (Strict).
* **Compatibilidad:** Engine `^1.80.0` (Soporte amplio para forks actuales y futuros).

## 2. Estrategia de Compatibilidad (Universal Fork Support)

Para garantizar que funcione en Cursor, Windsurf, etc., se establecen las siguientes reglas de diseño:

1. **Cero Dependencias de Servicios Microsoft:**
* No usar `Microsoft Authentication` (login con GitHub/Microsoft) para guardar ajustes.
* No usar Telemetría propietaria de VS Code.
* La gestión de claves API se hará localmente vía `SecretStorage` (estándar disponible en todos los forks).


2. **API de Git Genérica:**
* La extensión consumirá la API de Git integrada (`vscode.git`). Aunque esta suele estar presente en todos los forks, el código debe incluir una **verificación de existencia defensiva**, ya que algunos entornos (como navegadores web o forks minimalistas) podrían no tenerla activada por defecto.


3. **Agnosticismo de Marketplace:**
* El paquete `.vsix` generado debe ser apto para publicarse tanto en el **Visual Studio Marketplace** (para VS Code oficial) como en **Open VSX Registry** (para VSCodium, Vercel, Gitpod, etc.).



## 3. Arquitectura del Sistema

Igual que la versión anterior, pero con énfasis en APIs estándar:

1. **Capa de Vista (Frontend - Webview):**
* **Tecnología:** HTML/CSS/JS puro o *VS Code Webview UI Toolkit*.
* **Nota de Compatibilidad:** El UI Toolkit funciona en forks, pero debemos asegurar que los colores usen las **CSS Variables del tema (`var(--vscode-...)`)** en lugar de colores hardcodeados. Esto asegura que si Cursor o Windsurf tienen temas oscuros personalizados, la extensión se vea nativa.


2. **Capa Lógica (Extension Host):**
* **AI Service:** Uso del SDK de Google (`@google/generative-ai`) que es puramente Node.js y no depende del editor.


3. **Persistencia:**
* Uso estricto de `context.globalState` y `context.secrets`. Evitar `Settings Sync` propietario de MS como dependencia crítica.



## 4. Stack Tecnológico

* **Lenguaje:** TypeScript.
* **Motor Mínimo:** Definir en `package.json`: `"engines": { "vscode": "^1.85.0" }`. (Un equilibrio seguro para soportar funciones recientes de IA sin romper compatibilidad con forks que van un par de versiones atrás).
* **Bundler:** `esbuild` o `webpack` (Standard).

## 5. Flujo de Datos Actualizado

El flujo se mantiene, pero añadimos un paso de validación de entorno:

1. **Init:** Al arrancar, la extensión verifica `vscode.extensions.getExtension('vscode.git')`.
* *Si falla:* Muestra notificación: "Git extension not found. Please install generic Git support." (Crucial para forks raros).


2. **Trigger & Process:** El usuario solicita el commit desde el Panel Lateral.
3. **Generación IA (Gemini):** Se envía el diff.
4. **Inyección:** Se inserta en el `InputBox`.

## 6. Plan de Implementación Ajustado

### Fase 1: Core & Compatibilidad

* **Tarea Crítica:** Configurar el `package.json` para definir puntos de contribución genéricos.
* **Prueba de Concepto:** Crear el "Hello World" y probarlo **inmediatamente** en VS Code y en **Cursor** (o el fork de elección) para verificar que el Sidebar se renderiza igual.

### Fase 2: Panel Lateral (Theming Agnostic)

* **Tarea:** Diseñar el CSS usando *únicamente* tokens de diseño del editor (ej: `background-color: var(--vscode-sideBar-background);`). Esto es vital para que en editores como **Windsurf** (que tiene una estética distinta) no se vea como un parche mal puesto.

### Fase 3: Lógica Gemini + Git

* Igual que el plan anterior. Implementar conexión a API y lectura de Diff.

### Fase 4: Distribución Multi-Store

* **Tarea:** Configurar `ovsx` (Open VSX CLI) además de `vsce` (VS Code CLI).
* **CI/CD:** Preparar script de release que publique el mismo `.vsix` en ambos registros.

## 7. Riesgos y Mitigación en Forks

| Riesgo | Mitigación |
| --- | --- |
| **API de Git diferente** | Algunos forks modifican la UI de Git. Usaremos la API lógica (`repository.inputBox`), no manipulación del DOM. |
| **Marketplace Access** | Los usuarios de forks a veces no ven el MS Marketplace. Proveeremos el archivo `.vsix` en los Releases de GitHub para instalación manual ("Sideloading"). |
| **AI Features Nativas** | Editores como Cursor ya traen "AI Commit". Nuestra extensión debe ofrecer valor añadido (ej. personalización estricta de nomenclatura) para no ser redundante, o permitir desactivar la nativa. |
