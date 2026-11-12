# Bci RoadHome + HomeMarket

> Prototipo interactivo de experiencia digital para el acompañamiento integral de clientes en el camino hacia su **primera vivienda**, combinando planificación de ahorro guiada (*Mi ahorro*) y exploración inmobiliaria inteligente y compatible (*Explorar casas*).

---

## 1. Qué hace la app y para quién es

### Propósito
Comprar la primera vivienda en Chile es un proceso complejo y estresante: los usuarios no saben cuánto deben ahorrar para el **pie**, cuánto tiempo les tomará, qué tipo de propiedad realmente pueden pagar ni cuándo están listos para buscarla.

**Bci RoadHome + HomeMarket** resuelve este problema mediante un recorrido en tres pasos claros y evidentes:
1. **PASO 1: Definir tu casa ideal:** El usuario define su vivienda deseada mediante un asistente guiado de 4 pasos (*ArchetypeWizard*), un selector de fichas o un asistente conversacional (*ArchetypeChatbot*). Establece prioridades claras: **Imprescindible**, **Me gustaría** y **Sería un extra**. El sistema calcula automáticamente el valor referencial en UF y la meta del pie (normalmente el 20%).
2. **PASO 2: Ahorrar para el pie:** Monitorea el ahorro acumulado y proyecta los meses restantes en una sola línea clara. Permite realizar depósitos simulados inmediatos ($50.000, $100.000, $200.000 o personalizado) y modelar eventos extraordinarios (aumentos de sueldo, gastos imprevistos), adaptando la proyección en tiempo real.
3. **PASO 3: Explorar casas:** Un catálogo inmersivo de **128 propiedades** en formato vertical tipo Reel. Cada propiedad muestra su afinidad (*Match Score*), estado financiero del pie (*Pie cubierto*, *Cerca de tu meta*, *Requiere más ahorro*), dividendo mensual referencial, arriendo estimado, **inmobiliaria que comercializa la propiedad** y acceso directo a solicitud de evaluación hipotecaria Bci. Se desbloquea al alcanzar el **85%** del pie o cuando una vivienda compatible tiene el pie 100% cubierto.

### Para quién es
- **Jóvenes profesionales y familias en etapa de primera vivienda:** Personas que desean comprar su primer hogar y necesitan saber con exactitud cuánto dinero deben reunir y en qué plazo lo lograrán.
- **Clientes del Banco Bci:** Titulares de cuenta corriente o cuenta de ahorro que buscan convertir su capacidad de ahorro en un plan concreto y bancarizado.
- **Equipos de Producto, Diseño y Negocio Hipotecario Bci:** Evaluadores y diseñadores que deseen poner a prueba la interacción, la heurística de usabilidad y la integración entre ahorro programado y colocación hipotecaria.

---

## 2. Cómo probar la app

### Enlace al sitio publicado (GitHub Pages)
Puedes probar la aplicación directamente desde el navegador (móvil o escritorio) en:
👉 **[https://besfamillem.github.io/bci-home/](https://besfamillem.github.io/bci-home/)**

> **Avisos importantes:**
> - **Prototipo demostrativo · Datos ficticios · No es un sitio oficial de Bci:** Esta aplicación es un prototipo interactivo para fines de prueba, evaluación de experiencia de usuario y validación de concepto. No realiza transacciones financieras reales ni se conecta a cuentas bancarias reales.
> - **Sin backend ni almacenamiento remoto:** Todo el estado se mantiene localmente en tu navegador a través de `localStorage`. Ningún dato sensible sale de tu dispositivo.

### Cómo reiniciar los datos de prueba
Si deseas restablecer la aplicación a su estado inicial de bienvenida:
1. En la aplicación, abre el menú de opciones (ícono de tres puntos `···` o menú lateral en la esquina superior).
2. Haz clic en **"Reiniciar datos de prueba"**.
3. La aplicación limpiará el `localStorage` y te devolverá a la pantalla de bienvenida con los datos demostrativos listos para una nueva simulación.

---

## 3. Cómo instalarla y ejecutarla localmente (Comandos exactos)

### Requisitos previos
- **Node.js**: Versión 18.x, 20.x o superior instalada ([nodejs.org](https://nodejs.org/)).
- **npm** (incluido con Node.js), **pnpm** o **yarn**.

### Instalación de dependencias
Abre una terminal en el directorio raíz del proyecto y ejecuta:

```bash
npm install
```

### Comandos de ejecución

| Acción | Comando | Descripción |
| :--- | :--- | :--- |
| **Desarrollo local** | `npm run dev` | Inicia el servidor de desarrollo Vite (`http://localhost:5173/` y en red local `http://IP_LOCAL:5173/`). |
| **Compilación de producción** | `npm run build` | Compila TypeScript (`tsc -b`) y empaqueta la aplicación con Vite en `/dist`. |
| **Previsualización de producción** | `npm run preview` | Levanta un servidor local para probar la compilación de `/dist`. |
| **Ejecución de pruebas unitarias** | `npm test` | Ejecuta la suite de 20 pruebas automatizadas con Vitest (`vitest run`). |
| **Verificación estricta de tipos** | `npx tsc -b --noEmit` | Valida todos los tipos TypeScript del proyecto sin generar archivos. |

> **Nota para usuarios de Windows (PowerShell):**  
> Si la directiva de ejecución de scripts de PowerShell restringe la ejecución de archivos `.ps1`, ejecuta los comandos anteponiendo `.cmd` o llamándolos vía `cmd.exe`:
> ```powershell
> npm.cmd test
> npx.cmd tsc -b --noEmit
> ```

---

## 3. Estructura de carpetas y responsabilidad de archivos

```
BciHome-main/
├── index.html                     # Plantilla HTML base con fuentes Overpass y viewport móvil
├── package.json                   # Dependencias, scripts y metadatos del proyecto
├── tsconfig.json                  # Configuración del compilador TypeScript (ES2022, bundler)
├── vite.config.ts                 # Configuración de Vite con React, Tailwind CSS v4 y host: true
├── .gitignore                     # Exclusión de node_modules, dist, builds y archivos .env
├── checks-output.txt              # Registro de ejecución limpia de tsc y 20 tests Vitest
└── src/
    ├── main.tsx                   # Punto de entrada de React (montaje en DOM)
    ├── App.tsx                    # Router de pestañas y envoltorio principal de estado
    ├── index.css                  # Estilos globales, tokens de diseño y paleta de marca Bci
    │
    ├── types/
    │   └── app.ts                 # Interfaces y tipos de TypeScript (PropertyListing, HousingArchetype, etc.)
    │
    ├── context/
    │   └── AppContext.tsx         # Estado global (React Context) + persistencia en LocalStorage
    │
    ├── utils/
    │   ├── financialEngine.ts     # Motor matemático: cálculo de UF, pie, scoring, relajación y desbloqueo
    │   ├── userFlowEngine.ts      # Máquina de estados puros: cálculo del próximo paso (A/B/C/D)
    │   └── chatbotEngine.ts       # Motor NLP heurístico del asistente conversacional
    │
    ├── data/
    │   ├── developers.ts          # Lista tipada de 15 inmobiliarias chilenas reales con iniciales y helpers
    │   ├── preferenceVocabulary.ts# Vocabulario canónico compartido (comunas, interior, conectividad, exterior)
    │   ├── zoneProfiles.ts        # Perfiles visuales territoriales (paletas, motivos y fallback SVG)
    │   ├── mockProperties.ts      # Consolidación del catálogo (128 propiedades) y generador SVG
    │   ├── educationArticles.ts   # Artículos y cápsulas educativas sobre ahorro y crédito hipotecario
    │   └── catalog/               # Catálogo modular organizado por bloques territoriales
    │       ├── catalogHelpers.ts  # Helpers de cálculo de pie, dividendo y rotación determinista de fotos
    │       ├── rm.ts              # 79 propiedades de la Región Metropolitana (8 comunas + rural)
    │       ├── valparaiso.ts      # 17 propiedades de la Región de Valparaíso (costa y valles)
    │       ├── biobio.ts          # 14 propiedades de la Región del Biobío (Gran Concepción)
    │       └── otrasRegiones.ts   # 18 propiedades en Coquimbo, Antofagasta, O'Higgins, Araucanía y Los Lagos
    │
    ├── components/
    │   ├── common/
    │   │   ├── BciLogo.tsx                # Logotipo vectorial oficial de Bci
    │   │   ├── ModalDialog.tsx            # Diálogo modal accesible y reutilizable
    │   │   ├── UnlockCelebrationModal.tsx # Celebración memorable de desbloqueo al 85%
    │   │   └── UnlockPersistentBanner.tsx # Banner verde persistente hasta visitar Explorar
    │   │
    │   ├── layout/
    │   │   └── MobileShell.tsx    # Shell h-dvh unificado, menú opciones (⋯) y navbar 64px
    │   │
    │   ├── onboarding/
    │   │   └── WelcomeAndConnectScreen.tsx # Bienvenida con recorrido en 3 pasos claros
    │   │
    │   ├── home/
    │   │   └── HomeOverviewTab.tsx # "Tu camino": Stepper de 3 pasos y tarjeta destacada Von Restorff
    │   │
    │   ├── archetype/
    │   │   ├── MyHomeTab.tsx          # "Tu casa ideal": resumen activo con edición por sección
    │   │   ├── ArchetypeWizard.tsx    # Asistente guiado de 4 pasos con barra fija y feedback Tesler
    │   │   └── ArchetypeChatbot.tsx   # Alternativa conversacional ("Prefiero contarlo con mis palabras")
    │   │
    │   ├── savings/
    │   │   └── RoadHomeTab.tsx    # "Mi ahorro": botón Depositar dominante, hito y acordeón
    │   │
    │   └── homemarket/
    │       └── HomeMarketTab.tsx  # "Explorar casas": feed vertical, estado vacío inteligente y fila Inmobiliaria
    │
    └── __tests__/
        ├── scenarios.test.ts          # 10 pruebas automatizadas (escenarios de negocio + máquina de estados)
        └── catalogAndDevelopers.test.ts # 10 pruebas automatizadas (catálogo, 15 inmobiliarias, matriz y sugerencias)
```

---

## 4. Catálogo de Propiedades, Inmobiliarias y Cobertura

### 4.1. Las 15 Inmobiliarias Aliadas
Cada propiedad del catálogo indica de manera transparente qué inmobiliaria la comercializa dentro de la vista de detalle "Ver más" y en el resumen de simulación hipotecaria.

Las 15 empresas se encuentran balanceadas sin superar el 14% de participación:
- **Socovesa:** 12 propiedades (9.4%)
- **Inmobiliaria Galilea:** 12 propiedades (9.4%)
- **Inmobiliaria Almagro:** 10 propiedades (7.8%)
- **Inmobiliaria Manquehue:** 10 propiedades (7.8%)
- **Inmobiliaria Siena:** 10 propiedades (7.8%)
- **Inmobiliaria Aconcagua (Salfacorp):** 10 propiedades (7.8%)
- **Inmobiliaria Exxacon:** 9 propiedades (7.0%)
- **Paz Corp (Inmobiliaria Paz):** 8 propiedades (6.3%)
- **Inmobiliaria Fundamenta:** 8 propiedades (6.3%)
- **Ingevec Inmobiliaria:** 8 propiedades (6.3%)
- **Activa Inmobiliaria:** 8 propiedades (6.3%)
- **Inmobiliaria Actual:** 7 propiedades (5.5%)
- **Inmobiliaria Eurocorp:** 6 propiedades (4.7%)
- **Inmobiliaria RVC:** 5 propiedades (3.9%)
- **Inmobiliaria Imagina:** 5 propiedades (3.9%)

> **Nota legal y ética:** Los nombres de los proyectos y condominios son **ficticios** para efectos de demostración, manteniendo la etiqueta informativa *"Oferta referencial de demostración"*.

### 4.2. Matriz de Cobertura (128 Propiedades)

```
Zona                         | Depto | Casa | Parcela | Terreno | Total
-----------------------------+-------+------+---------+---------+------
Ñuñoa                        |     6 |    3 |       0 |       0 |     9
Providencia                  |     5 |    3 |       0 |       0 |     8
La Florida                   |     4 |    4 |       0 |       0 |     8
Santiago Centro              |     5 |    3 |       0 |       0 |     8
Las Condes                   |     4 |    3 |       0 |       0 |     7
Macul                        |     4 |    3 |       0 |       0 |     7
Puente Alto                  |     4 |    3 |       2 |       2 |    11
Vitacura                     |     4 |    3 |       0 |       0 |     7
RM Periferia / Rural         |     0 |    0 |       8 |       6 |    14
Valparaíso (Región)          |     6 |    5 |       3 |       3 |    17
Biobío (Región)              |     5 |    5 |       2 |       2 |    14
Otras Regiones               |     6 |    6 |       3 |       3 |    18
-----------------------------+-------+------+---------+---------+------
TOTAL                        |    53 |    40 |      18 |      17 |   128
```

### 4.3. Combinaciones Intencionalmente Vacías (Regla de Realismo Urbano)
Para reflejar fielmente el mercado inmobiliario chileno y la zonificación reguladora, ciertas combinaciones **no existen** en el catálogo:
1. **Parcelas en comunas urbanas consolidadas:** Santiago Centro, Providencia, Las Condes, Vitacura, Ñuñoa y Macul tienen 0 parcelas (los planos reguladores metropolitanos exigen densidad urbana y no permiten loteos de agrado de 5.000 m²). Las parcelas de RM se concentran en comunas rurales y periféricas: Pirque, Calera de Tango, Chicureo/Colina, Lampa, Buin, Paine, Melipilla, Padre Hurtado y Las Vizcachas en Puente Alto.
2. **Terrenos vacíos en comunas hiper-consolidadas:** Santiago Centro, Providencia y Ñuñoa no ofrecen sitios residenciales unifamiliares vacíos de autoconstrucción.
3. **Departamentos en comunas exclusivamente rurales o agrícolas:** Comunas como Pirque, Paine o Calera de Tango se enfocan en parcelas y casas quintas.
4. **"Cerca del metro" fuera de Santiago:** En Valparaíso, Biobío y otras regiones no existe Metro de Santiago; por ello, la conectividad se etiqueta con rigor geográfico como *"Cerca de transporte público"*.

### 4.4. Estado Vacío Inteligente y Sugerencias de 1 Toque
Si el usuario configura una combinación con 0 resultados (por ejemplo, buscar un departamento en Vitacura con *"Cerca del metro"* imprescindible):
- El sistema **no** muestra una pantalla muerta ni texto técnico.
- Ejecuta `findSmartRelaxationSuggestions` para calcular qué requisito imprescindible, al pasar a **"Me gustaría"**, libera el mayor número de alternativas.
- Muestra hasta 3 botones de un toque:
  `Pasar «Cerca del metro» a «Me gustaría» → +2 casas`
- Muestra una fila de inspiración *"Casi cumplen tu casa ideal"*, destacando propiedades que fallan en solo un requisito e indicando con transparencia: *"Te falta flexibilizar: {requisito}"*.

### 4.5. Respaldo Visual SVG Vectorial por Perfil Territorial
Para garantizar una experiencia visual ininterrumpida frente a bloqueos de red o fallas en CDNs externos:
- Cada imagen cuenta con `onError` conectado a `getFallbackImage(property)`.
- El generador `createPropertySvgDataUri` adapta paletas y motivos según el perfil de zona (`zoneProfiles.ts`):
  - **Oriente Premium:** Torres modernas de vidrio con reflejos y cielo azul profundo.
  - **Centro Urbano:** Edificios de mediana altura y avenidas arboladas.
  - **Sur-Oriente Familiar:** Condominios residenciales con antejardines y silueta de la Cordillera de Los Andes.
  - **Costa Valparaíso:** Cerros con casas de colores y curvas marinas del Pacífico.
  - **Biobío:** Ciudad verde junto al río Biobío y bosques nativos.
  - **Campo / Precordillera:** Viñedos, cercos rústicos y colinas.
  - **Norte / Sur:** Paisajes soleados costeros o volcanes y lagos australes.

---

## 5. Datos simulados vs. Datos de producción

| Dimensión | En el Prototipo Actual (Simulado / Mock) | En Producción Bancaria (Real) |
| :--- | :--- | :--- |
| **Valor de la UF** | Configurable en **$40.000 CLP** por defecto. | Conexión diaria a API oficial del **Banco Central de Chile** (actualizada a las 00:00 hrs). |
| **Cuentas y saldos del cliente** | Saldo demostrativo de **$18.000.000 CLP** en "Cuenta Ahorro Vivienda Bci". | Integración con Core Bancario Bci (Cuentas Corrientes, Cuentas de Ahorro para la Vivienda). |
| **Ingresos y gastos del usuario** | Renta líquida de **$2.500.000 CLP**, gastos de **$1.600.000 CLP** y ahorro de **$600.000 CLP**. | Motor de categorización automática sobre abonos de remuneraciones y cargos en cuenta. |
| **Catálogo de propiedades** | 128 propiedades estructuradas en `mockProperties.ts` con 15 inmobiliarias chilenas. | Conexión vía API con portales inmobiliarios y convenios preferenciales Bci. |
| **Dividendo hipotecario** | Fórmula canónica: $Precio \times 0.8 \times 0.005067$ (80% financiado, 4.5% anual, 30 años). | Motor oficial de cotización y tarificación hipotecaria Bci con tasas pizarra vigentes. |
| **Evaluación crediticia** | Simulación interactiva con emisión de comprobante demostrativo. | Motor de riesgo crediticio Bci: DTI, DICOM/CMF, antigüedad laboral y preaprobación formal. |

---

## 6. Pruebas y verificación de calidad

El proyecto cuenta con **20 pruebas automatizadas** con Vitest y validación estricta de TypeScript:
1. `src/__tests__/scenarios.test.ts` (10 tests): Los 9 escenarios de negocio requeridos, simulación de depósitos, eventos extraordinarios y máquina de estados del usuario.
2. `src/__tests__/catalogAndDevelopers.test.ts` (10 tests): Integridad del catálogo (128 propiedades), validación de las 15 inmobiliarias ($\ge 4$ y $\le 14\%$), coherencia de pie y dividendo, matriz de cobertura territorial, comodines "Otras comunas" / "Otra región", y motor de sugerencias de relajación.

Para ejecutar las pruebas:
```bash
npm test
npx tsc -b --noEmit
```

El registro completo se encuentra documentado en [checks-output.txt](checks-output.txt).

---

## 7. Sistema de Diseño y Look & Feel Oficial Bci

La aplicación implementa los lineamientos visuales oficiales extraídos del kit de diseño de Banco Bci:

- **Paleta oficial de colores:** Declaración exacta de tokens institucionales en `:root` (`--green-dark: #28652B`, `--green-normal: #28892B`, `--blue-normal: #2772CC`, `--blue-dark: #1D5699`, `--yellow-normal: #FFE300`, `--gray-dark: #37474F`, `--white: #FFFFFF`).
- **Escala tipográfica móvil:** Implementación de las clases oficiales (`.display-1` a `.display-4`, `.h1` a `.h6`, `.regular-text` y `.sub-text`) para pantallas táctiles (<992px) con piso mínimo estricto de accesibilidad de **12px** en toda la interfaz.
- **Botones institucionales Bci:** Botones píldora (`border-radius: 3rem`) con variantes Primario, Secundario, Terciario y Login, con anillo de foco visible amarillo (`#FFE300`), spinner de carga (`.spinner-border-sm`) y objetivo táctil accesible $\ge 44$px.
- **Formularios e inputs:** Altura mínima de 50px, bordes en `#BBC5CA`, hover en `#546E7A`, foco institucional con anillo amarillo y buscador con padding de 36px.
- **Activos de marca y favicon:** Integración de `LOGO.png` ($904 \times 197$ px con canal alfa) con `srcSet` 1x/2x y soporte para fondos oscuros (`variant="dark"` con logo oficial blanco en SVG), más `favicon.svg` institucional generado a partir del isotipo vectorial de Bci.
- **Accesibilidad y contraste WCAG AA:** Ratios de contraste calculados y validados superiores a 4.5:1 en texto regular y 3:1 en texto grande/insignias sobre todas las superficies.

