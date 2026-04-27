# CONTEXTO DEL PROYECTO — Barco Pirata "El Rey del Mar"

> **Propósito de este archivo:** Documento de contexto completo para que una IA pueda generar, a partir de él, cualquiera de los siguientes entregables:
> - Manual técnico (arquitectura, BD, despliegue, variables de entorno)
> - Documentación técnica (componentes, API, flujos de datos)
> - Manual de usuario (cliente y administrador)
>
> Todas las secciones son auto-contenidas. No se requiere acceso al código fuente.

---

## 1. Descripción General del Proyecto

**Nombre del sistema:** Sistema de Reservaciones — Barco Pirata "El Rey del Mar"

**Descripción:** Aplicación web de reservaciones turísticas para el barco pirata "El Rey del Mar", ubicado en el Recinto Portuario de Puerto Peñasco, Sonora, México. El sistema permite a los turistas explorar los paquetes de paseo disponibles, reservar su lugar a bordo, y pagar en línea o en taquilla. Los administradores gestionan todas las reservaciones, cobran pagos, generan reportes y controlan la capacidad del barco.

**URL de producción (si aplica):** Por definir (actualmente en desarrollo local)

**Idioma de la interfaz:** Español (México)

**Moneda:** Pesos Mexicanos (MXN)

**Punto de embarque:** Recinto Portuario, Puerto Peñasco, Sonora, México

**Teléfono de contacto del negocio:** 638-123-4567

**Email de contacto:** reservas@barcopirata.com

---

## 2. Stack Tecnológico

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| React | 19.x | UI framework |
| React Router DOM | 7.x | Enrutamiento SPA |
| Vite | 8.x | Bundler y servidor de desarrollo |
| React DatePicker | 9.x | Selector de fechas con lógica de disponibilidad |
| date-fns | 4.x | Utilidades de fechas (locale español) |
| html2pdf.js | 0.14.x | Generación de PDF del comprobante de pago |
| react-icons | 5.x | Iconos SVG |
| CSS vanilla | — | Estilos (sin framework CSS; archivos .css por componente) |

### Backend / BaaS
| Tecnología | Versión | Rol |
|---|---|---|
| Supabase | — | Backend-as-a-Service: BD PostgreSQL, Auth, Storage, RLS |
| @supabase/supabase-js | 2.x | SDK cliente de Supabase |

### Infraestructura
- **Base de datos:** PostgreSQL administrado por Supabase
- **Autenticación:** Supabase Auth (email + password)
- **Almacenamiento de archivos:** Supabase Storage (imágenes de paquetes)
- **Hosting frontend:** Vite dev server (desarrollo local); en producción: Vercel / Netlify / Render (por definir)

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────┐
│           Navegador del usuario      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  React SPA (Vite)           │    │
│  │  - App.jsx (router raíz)    │    │
│  │  - Páginas: Home, Login,    │    │
│  │    Register, AdminDashboard,│    │
│  │    ClientDashboard          │    │
│  └──────────────┬──────────────┘    │
└─────────────────┼───────────────────┘
                  │ HTTPS + Supabase JS SDK
                  ▼
┌─────────────────────────────────────┐
│           Supabase Cloud            │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │PostgreSQL│  │   Supabase Auth  │ │
│  │  (tablas)│  │  (JWT sessions)  │ │
│  └──────────┘  └──────────────────┘ │
│  ┌──────────┐                       │
│  │ Storage  │  (imágenes paquetes)  │
│  └──────────┘                       │
└─────────────────────────────────────┘
```

**Patrón:** SPA (Single Page Application) con BaaS. No existe servidor propio — toda la lógica de negocio corre en el frontend y Supabase aplica seguridad mediante Row Level Security (RLS).

**Autenticación:** JWT gestionado por Supabase Auth. El cliente JS mantiene la sesión en `localStorage`. Al iniciar la app, `App.jsx` llama a `supabase.auth.getSession()` y suscribe cambios con `supabase.auth.onAuthStateChange`.

**Control de roles:** La tabla `profiles` almacena el campo `role` (`'admin'` | `'client'`). `App.jsx` lee este campo al autenticarse y lo pasa como prop `userRole` a los componentes.

---

## 4. Estructura de Directorios

```
Barco_pirata/
├── CONTEXTO_PROYECTO.md          ← este archivo
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   ├── hero-1-atardecer.jpg  ← slide 1 del carrusel hero
│   │   ├── hero-2-barco-dia.jpg  ← slide 2 (foto real El Rey del Mar)
│   │   ├── hero-3-cubierta.jpg   ← slide 3
│   │   ├── hero-4-personajes.jpg ← slide 4 (foto real El Rey del Mar)
│   │   ├── hero-5-noche.jpg      ← slide 5 (nocturna)
│   │   ├── fondo2.png            ← imágenes antiguas (ya no en uso)
│   │   ├── fondo3.png
│   │   ├── fondo4..png           ← nota: typo con doble punto en nombre
│   │   ├── hero-bg.png
│   │   └── solo-paseo.png        ← imagen de paquete local (fallback)
│   └── src/
│       ├── App.jsx               ← router raíz + gestión de sesión
│       ├── App.css               ← estilos globales
│       ├── main.jsx              ← punto de entrada React
│       ├── supabaseClient.js     ← instancia compartida del cliente Supabase
│       ├── utils/
│       │   └── logger.js         ← función logActivity() para auditoría
│       ├── components/
│       │   ├── Header.jsx/.css
│       │   ├── Footer.jsx
│       │   ├── Hero.jsx/.css         ← carrusel con Ken Burns
│       │   ├── BookingBar.jsx/.css   ← barra de reserva rápida en el hero
│       │   ├── PackagesList.jsx/.css ← grid de paquetes disponibles
│       │   ├── PackageCard.jsx       ← tarjeta individual de paquete
│       │   ├── ReservationModal.jsx/.css ← formulario de reservación (cliente)
│       │   ├── PaymentModal.jsx          ← cobro admin: tarjeta o efectivo
│       │   ├── ClientPaymentModal.jsx    ← pago cliente: tarjeta
│       │   ├── Voucher.jsx               ← comprobante compartido (admin+cliente)
│       │   ├── DailyReportModal.jsx      ← reporte diario de ingresos
│       │   ├── AnnualReportModal.jsx     ← reporte anual de ingresos
│       │   ├── ActivityLogModal.jsx      ← bitácora de actividades del sistema
│       │   └── BackupModal.jsx           ← exportación de respaldo de datos
│       └── pages/
│           ├── Home.jsx          ← página principal pública
│           ├── Login.jsx         ← inicio de sesión
│           ├── Register.jsx      ← registro de nuevo usuario
│           ├── AdminDashboard.jsx ← panel de administración
│           └── ClientDashboard.jsx ← panel del cliente (mis reservaciones)
```

---

## 5. Base de Datos (Supabase / PostgreSQL)

### 5.1 Tabla: `profiles`

Extiende la tabla de usuarios de Supabase Auth. Se crea automáticamente al registrarse.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK, FK → auth.users) | ID único del usuario |
| `email` | text | Correo electrónico |
| `role` | text | `'admin'` o `'client'` (default: `'client'`) |
| `created_at` | timestamptz | Fecha de registro |

### 5.2 Tabla: `packages`

Catálogo de paquetes de paseo disponibles.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | int (PK, serial) | ID del paquete |
| `name` | text | Nombre del paquete (ej. "Paseo Familiar") |
| `price` | numeric | Precio por persona en MXN |
| `description` | text | Descripción del paquete |
| `ideal_for` | text | Público objetivo (ej. "Familias con niños") |
| `image_url` | text | URL de la imagen en Supabase Storage |
| `created_at` | timestamptz | Fecha de creación |

### 5.3 Tabla: `reservations`

Núcleo del sistema. Registra cada solicitud de reservación y su estado actual.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | Folio único de la reservación |
| `user_id` | uuid (FK → profiles) | Cliente que reservó |
| `package_id` | int (FK → packages) | Paquete seleccionado |
| `reservation_date` | date | Fecha del paseo (formato YYYY-MM-DD) |
| `persons_count` | int | Cantidad de personas |
| `contact_name` | text | Nombre del contacto principal |
| `contact_phone` | text | Teléfono de contacto |
| `total_price` | numeric | Total calculado (ya con descuento si aplica) |
| `status` | text | Estado actual (ver enum de estados abajo) |
| `cancellation_reason` | text | Motivo de rechazo (si status = cancelled) |
| `created_at` | timestamptz | Fecha de creación de la solicitud |

### 5.4 Enum de Estados de Reservación

```
pending
  ↓ (admin acepta)         ↓ (admin rechaza)
confirmed                cancelled
  ↓ (admin procesa pago tarjeta o efectivo)
  ├─ [efectivo] → awaiting_cash
  │                  ↓ (cliente paga en taquilla → admin confirma)
  │                paid
  └─ [tarjeta admin] → paid
  ↓ (admin inicia el viaje)     [cliente también puede pagar con tarjeta desde confirmed]
in_progress
  ↓ (admin finaliza el viaje)
completed
```

| Estado | Significado | Quién lo dispara |
|---|---|---|
| `pending` | Solicitud recibida, en espera de revisión | Sistema (al crear reservación) |
| `confirmed` | Aceptada — pendiente de pago | Admin |
| `awaiting_cash` | El cliente debe pagar en taquilla en efectivo | Admin (al seleccionar método efectivo) |
| `paid` | Pago liquidado | Admin (cobro en persona) o Cliente (tarjeta en línea) |
| `in_progress` | El viaje está en curso | Admin |
| `completed` | Viaje finalizado | Admin |
| `cancelled` | Rechazada o cancelada | Admin |

### 5.5 Tabla: `payments`

Registra cada transacción de pago asociada a una reservación.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | int (PK, serial) | ID del pago |
| `reservation_id` | uuid (FK → reservations) | Reservación pagada |
| `amount` | numeric | Monto pagado en MXN |
| `payment_method` | text | `'cash'` o `'card'` |
| `card_number_last_4` | text | Últimos 4 dígitos (si aplica) |
| `payment_status` | text | `'completed'` (siempre, al insertar) |
| `payment_date` | timestamptz | Fecha/hora del pago |
| `processed_by` | text | Email del admin que procesó (o `'cliente'`) |

### 5.6 Tabla: `global_settings`

Configuración global del sistema (una sola fila, id = 1).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | int (PK) | Siempre 1 |
| `boat_capacity` | int | Capacidad máxima del barco (pasajeros totales por día) |

### 5.7 Tabla: `activity_logs`

Bitácora de auditoría de acciones del sistema.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | int (PK, serial) | ID del log |
| `user_email` | text | Email del usuario que realizó la acción |
| `action_type` | text | Tipo de acción: `'CREATE'`, `'UPDATE'`, `'DELETE'`, etc. |
| `entity_type` | text | Entidad afectada: `'RESERVATION'`, `'PACKAGE'`, `'SYSTEM'`, etc. |
| `description` | text | Descripción legible de la acción |
| `severity` | text | `'INFO'`, `'WARNING'`, `'ERROR'` (default: `'INFO'`) |
| `created_at` | timestamptz | Fecha/hora del evento |

### 5.8 Tabla: `backup_logs`

Registro de respaldos de datos exportados.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | int (PK, serial) | ID del respaldo |
| `created_at` | timestamptz | Fecha del respaldo |
| `created_by` | text | Email del admin que generó el respaldo |
| `record_count` | int | Número de registros exportados |

### 5.9 Políticas RLS (Row Level Security) — Resumen

- **`reservations`**: Los clientes solo leen/modifican sus propias filas (`user_id = auth.uid()`). Los admins tienen acceso total.
- **`packages`**: Lectura pública. Solo los admins pueden insertar, actualizar y eliminar.
- **`payments`**: Solo los admins pueden insertar y leer. Los clientes leen únicamente los pagos de sus propias reservaciones.
- **`profiles`**: Cada usuario lee y edita solo su perfil. Los admins leen todos los perfiles.
- **`global_settings`**: Lectura pública. Solo admins pueden actualizar.
- **`activity_logs`**, **`backup_logs`**: Solo admins.

---

## 6. Autenticación y Roles

### Flujo de autenticación

1. El usuario accede a `/login` y escribe su email y contraseña.
2. Se llama a `supabase.auth.signInWithPassword()`.
3. Supabase devuelve un JWT con el `user.id`.
4. `App.jsx` consulta la tabla `profiles` para obtener el `role`.
5. Según el role, el header muestra "Panel Admin" o "Mis Reservaciones".
6. Las rutas `/admin` y `/profile` están protegidas mediante `<Navigate>` condicional.

### Registro

- Ruta: `/register`
- Se llama a `supabase.auth.signUp()`.
- Supabase Auth crea el usuario y un disparador (trigger) de base de datos inserta automáticamente una fila en `profiles` con `role = 'client'`.

### Cambiar un usuario a admin

Actualmente manual: el admin debe modificar directamente en Supabase la columna `role` del `profiles` del usuario a `'admin'`.

### Cierre de sesión

- Llama a `supabase.auth.signOut()` y redirige a `/`.

---

## 7. Flujos de Usuario Completos

### 7.1 Flujo del Cliente — Reservar y Pagar

```
1. Cliente visita la página principal (/)
   └─ Ve el carrusel Hero con 5 imágenes del barco

2. Usa la BookingBar (barra de reserva rápida en el hero)
   ├─ Selecciona fecha (días llenos aparecen en rojo)
   ├─ Indica cantidad de personas
   └─ Click en "RESERVAR AHORA"
       ├─ Si NO tiene sesión → redirige a /login con mensaje pirata
       └─ Si tiene sesión → abre ReservationModal

3. ReservationModal (formulario)
   ├─ Selecciona paquete
   ├─ Confirma fecha y personas
   ├─ Ingresa nombre y teléfono de contacto
   ├─ Ve el total calculado (con o sin descuento grupal)
   └─ Envía → status = 'pending' insertado en BD

4. Admin recibe la reserva en su panel y la revisa
   ├─ RECHAZAR → status = 'cancelled' + motivo → cliente ve "❌ Rechazada"
   └─ ACEPTAR → status = 'confirmed' → cliente ve "✅ Aceptada — Pendiente de Pago"

5. Cliente ve la notificación en /profile (ClientDashboard)
   └─ Cuando status = 'confirmed' → aparece botón "💳 Pagar Ahora"
       └─ Abre ClientPaymentModal
           ├─ Ingresa datos de tarjeta (simulado)
           └─ Pago procesado → status = 'paid'
               └─ Muestra Voucher con comprobante imprimible/PDF

6. Admin puede:
   └─ Alternativamente cobrar en persona (tarjeta o efectivo)
       ├─ Efectivo → status = 'awaiting_cash' → cliente presenta folio en taquilla
       └─ Tarjeta (admin cobra) → status = 'paid'
```

### 7.2 Flujo del Administrador — Gestionar Reservaciones

```
Admin accede a /admin (requiere role = 'admin')

Panel contiene secciones:
│
├─ ALERTAS DE CAPACIDAD (automáticas si algún día supera el límite)
│
├─ RESERVAS PENDIENTES (status = 'pending')
│   ├─ [ACEPTAR] → status = 'confirmed'
│   └─ [RECHAZAR] → status = 'cancelled' (solicita motivo)
│
├─ ESPERANDO PAGO EN EFECTIVO (status = 'awaiting_cash')
│   └─ [CONFIRMAR PAGO] → abre PaymentModal (modo confirmar-efectivo)
│                          → status = 'paid'
│
├─ TODAS LAS RESERVACIONES (tabla filtrable)
│   Filtros: por fecha, por paquete, por estado
│   Por cada reserva:
│   ├─ Cambiar estado manualmente (dropdown)
│   ├─ [💳 Cobrar] → PaymentModal (modo admin-cobrar)
│   ├─ [📄 Recibo] → Voucher (solo para paid/in_progress/completed)
│   └─ [❌ Rechazar] → solicita motivo, status = 'cancelled'
│
├─ GESTIÓN DE PAQUETES (CRUD)
│   ├─ Crear paquete nuevo (nombre, precio, descripción, ideal_for, imagen)
│   └─ Editar / Eliminar paquetes existentes
│
├─ CONFIGURACIÓN
│   └─ Capacidad máxima del barco (global_settings.boat_capacity)
│
└─ HERRAMIENTAS
    ├─ Reporte Diario (ingresos de un día específico)
    ├─ Reporte Anual (ingresos mes a mes)
    ├─ Bitácora de Actividad (activity_logs)
    └─ Respaldo de Datos (exportar CSV/JSON de reservaciones)
```

### 7.3 Flujo de Vida de una Reservación (estados)

```
CREACIÓN → pending
  ↓ Admin acepta          ↓ Admin rechaza
confirmed               cancelled
  ↓                        (fin)
Admin elige método de pago:
  ├─ Efectivo → awaiting_cash → (cliente paga en taquilla) → Admin confirma → paid
  ├─ Tarjeta admin → paid
  └─ Tarjeta cliente (desde confirmed) → paid
  ↓
Admin inicia viaje → in_progress
  ↓
Admin finaliza viaje → completed
```

---

## 8. Componentes Clave

### `App.jsx`
- **Rol:** Router raíz. Gestiona sesión y rol de usuario. Pasa `session` y `userRole` a `Header`.
- **Props recibe:** ninguna
- **Estado:** `session`, `userRole`, `loadingContext`
- **Rutas:** `/` → Home, `/login` → Login, `/register` → Register, `/admin` → AdminDashboard, `/profile` → ClientDashboard

---

### `Header.jsx`
- **Rol:** Barra superior de información de contacto + navegación principal.
- **Props:** `session`, `userRole`
- **Comportamiento:** Si hay sesión y role = 'admin', muestra "⚙️ Panel Admin". Si role = 'client', muestra "🔔 Mis Reservaciones". Si no hay sesión, muestra "Iniciar sesión". Botón "Cerrar sesión" llama a `supabase.auth.signOut()`.

---

### `Hero.jsx` + `Hero.css`
- **Rol:** Sección hero de la página principal con carrusel automático de 5 imágenes y animación Ken Burns.
- **Props:** `onReserveNow(date, persons)` — callback al hacer click en "RESERVAR AHORA"
- **Estado:** `current` (índice del slide activo, 0–4)
- **Lógica:** `setInterval` de 5000ms cambia el slide. Cada slide es un `<div>` con `background-image` y clase `hero-bg-slide`; el activo tiene clase `active` que activa `opacity: 1` + animación `kenburns` (7s, scale 1→1.07 + traslación sutil).
- **Slides:** `/hero-1-atardecer.jpg`, `/hero-2-barco-dia.jpg`, `/hero-3-cubierta.jpg`, `/hero-4-personajes.jpg`, `/hero-5-noche.jpg`
- **Contiene:** Logo, texto "Vive la aventura...", badge de ubicación, dots de navegación, y `<BookingBar>`.

---

### `BookingBar.jsx`
- **Rol:** Barra de reserva rápida superpuesta sobre el hero. Permite seleccionar fecha y cantidad de personas antes de abrir el modal de reservación.
- **Props:** `onReserveNow(date, persons)`
- **Estado:** `selectedDate`, `persons`, `globalCapacity`, `dateCapacity`
- **Lógica:** Al montar, consulta `global_settings` para la capacidad del barco y `reservations` para calcular cuántos lugares están ocupados por fecha. Días llenos (ocupados + personas > capacidad) se marcan en rojo en el DatePicker. 5+ personas muestra badge de descuento 10%.

---

### `PackagesList.jsx` + `PackageCard.jsx`
- **Rol:** Grid de tarjetas con los paquetes disponibles.
- **Props PackagesList:** `packages[]`, `loading`, `onReservePackage(pkgId)`
- **PackageCard:** Muestra imagen, nombre, precio, descripción, detalles, y botón "Reservar Este Paquete".

---

### `ReservationModal.jsx`
- **Rol:** Formulario completo de reservación (overlay modal).
- **Props:** `isOpen`, `onClose`, `initialDate`, `initialPersons`, `initialPackageId`, `packages[]`
- **Lógica de negocio:**
  1. Verifica capacidad disponible en la fecha seleccionada (excluyendo `pending` y `cancelled`).
  2. Si no hay lugares suficientes, muestra error específico.
  3. Si hay lugar, inserta en `reservations` con `status = 'pending'`.
- **Cálculo de total:** `package.price × persons × (persons >= 5 ? 0.90 : 1.0)`

---

### `PaymentModal.jsx` (Admin)
- **Rol:** Modal de cobro para el administrador. Puede cobrar con tarjeta o confirmar pago en efectivo.
- **Props:** `reservation`, `onClose`, `onPaymentSuccess`, `mode` (`'admin-cobrar'` | `'admin-confirmar-efectivo'`)
- **Modos:**
  - `admin-cobrar`: Admin elige entre tarjeta o efectivo. Si tarjeta, simula cargo con delay 2.5s y valida longitud de número. Si efectivo, cambia status a `awaiting_cash`.
  - `admin-confirmar-efectivo`: Solo confirma el efectivo ya recibido → status `paid`.
- **Al completar:** Inserta en `payments`, actualiza `reservations.status = 'paid'`, registra en `activity_logs`, muestra `<Voucher dark={true}>`.

---

### `ClientPaymentModal.jsx` (Cliente)
- **Rol:** Modal de pago para el cliente (solo tarjeta).
- **Props:** `reservation`, `onClose`, `onPaymentSuccess`, `initialReceipt` (opcional, para modo ver-comprobante)
- **Lógica:** Si `initialReceipt` está presente, muestra directamente el `<Voucher>` (modo solo lectura). Si no, muestra formulario de tarjeta, simula el pago, actualiza status a `paid`, inserta en `payments`, y muestra `<Voucher>`.

---

### `Voucher.jsx`
- **Rol:** Componente compartido de comprobante de pago. Usado tanto por el admin como por el cliente.
- **Props:** `receipt { paymentId, date, method, amount, client, package }`, `reservation`, `onClose`, `dark` (bool — tema oscuro para admin)
- **Características:**
  - Overlay con scroll seguro (no usa `display: flex + alignItems: center` para evitar clipping).
  - Contenedor interno `maxWidth: 850px, margin: 0 auto`.
  - Panel de acciones: botón "Imprimir" (window.print), botón "Descargar PDF" (html2pdf.js), botón "✕ Cerrar".
  - Voucher imprimible con id `printable-voucher`.
  - Layout responsive: columna de detalles con CSS Grid, tabla con `overflow-x: auto`, padding con `clamp()`.
  - `@media print`: oculta todo excepto el voucher.

---

### `DailyReportModal.jsx`
- **Rol:** Reporte de ingresos de un día específico. Filtra `payments` por fecha y calcula totales por método de pago.

---

### `AnnualReportModal.jsx`
- **Rol:** Reporte anual de ingresos. Agrupa `payments` por mes y muestra tendencias.

---

### `ActivityLogModal.jsx`
- **Rol:** Tabla paginada de `activity_logs`. Permite filtrar por tipo de acción y entidad. Solo accesible por admins.

---

### `BackupModal.jsx`
- **Rol:** Exporta todas las reservaciones en formato JSON/CSV. Registra la exportación en `backup_logs`.

---

### `logger.js` (utilidad)

```js
// Firma de la función
logActivity(actionType, entityType, description, severity = 'INFO')
// Ejemplo de uso
await logActivity('UPDATE', 'RESERVATION', `Aceptó reserva #${r.id}`);
```

Inserta automáticamente en `activity_logs` con el email del usuario de la sesión activa.

---

## 9. Páginas y Rutas

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/` | `Home.jsx` | Público | Página principal: hero, paquetes, mapa |
| `/login` | `Login.jsx` | Solo no autenticados | Inicio de sesión |
| `/register` | `Register.jsx` | Solo no autenticados | Registro de cuenta nueva |
| `/admin` | `AdminDashboard.jsx` | Solo `role = 'admin'` | Panel de administración completo |
| `/profile` | `ClientDashboard.jsx` | Solo autenticados | Mis reservaciones y notificaciones |

**Protección de rutas:** Implementada con `<Navigate>` condicional en `App.jsx`. No hay middleware de servidor.

---

## 10. Variables de Entorno

El proyecto usa un único archivo de variables: `frontend/.env.local` (nunca se sube al repositorio).

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<clave-anónima-del-proyecto>
```

**Importante:** Solo se usa la `anon key` (clave pública). La seguridad se garantiza exclusivamente mediante las políticas RLS de Supabase, **no** mediante secretos en el frontend.

---

## 11. Comandos de Desarrollo

```bash
# Instalar dependencias
cd frontend
npm install

# Iniciar servidor de desarrollo (localhost:5173)
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview

# Lint
npm run lint
```

**Prerequisito:** Crear el archivo `frontend/.env.local` con las variables de Supabase antes de ejecutar.

---

## 12. Reglas de Negocio

### Precios y descuentos
- El precio base es por persona: `package.price × persons_count`
- **Descuento grupal:** 10% automático cuando `persons_count >= 5`
- Fórmula: `total = package.price × persons × (persons >= 5 ? 0.90 : 1.0)`
- El total calculado se guarda en `reservations.total_price` al crear la reserva

### Capacidad del barco
- La capacidad máxima (en pasajeros totales por día) está en `global_settings.boat_capacity` (default: 50)
- Se verifica al crear una reserva: suma de `persons_count` de todas las reservas de esa fecha con status ≠ `cancelled` ≠ `pending`
- Si la suma + la nueva solicitud supera la capacidad, la reserva es rechazada con mensaje de error
- El admin puede ver alertas visuales de días con capacidad completa en su dashboard
- El calendario de la BookingBar marca en rojo los días sin disponibilidad suficiente

### Folio de reservación
- El folio visible para el cliente es: `String(reservation.id).substring(0, 8).toUpperCase()` (primeros 8 caracteres del UUID)
- El folio del pase de abordar (cuando status = 'paid') es: `String(reservation.id).split('-')[0].toUpperCase()` (primera sección del UUID)

### Pago en efectivo
- Cuando el admin selecciona efectivo, el status cambia a `awaiting_cash` (no a `paid` todavía)
- El cliente recibe un folio para presentar en taquilla
- El admin confirma el pago presencial → status pasa a `paid`

### Comprobante de pago
- Disponible para los estados: `paid`, `in_progress`, `completed`
- El comprobante se puede imprimir (window.print) o descargar como PDF (html2pdf.js)
- El PDF se descarga como `Voucher_XXXXXXXX.pdf` donde `XXXXXXXX` es el paymentId

---

## 13. Integraciones Externas

### Supabase
- **Auth:** Email + password. JWT almacenado en localStorage por el SDK.
- **Database:** PostgreSQL. Consultas mediante el SDK de JS (sin ORM).
- **Storage:** Bucket para imágenes de paquetes. Las URLs se guardan en `packages.image_url`.
- **RLS:** Todas las tablas tienen RLS habilitado. Las políticas definen qué puede leer/escribir cada rol.

### html2pdf.js
- Usado exclusivamente en `Voucher.jsx` para convertir el elemento `#printable-voucher` a PDF.
- Configuración usada:
  ```js
  html2pdf().set({
      margin: 0,
      filename: `Voucher_${receipt.paymentId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).from(element).save();
  ```

### React DatePicker
- Usa el locale `es` (español) de `date-fns`.
- Configurado con `minDate = new Date()` (no se puede seleccionar fechas pasadas).
- `filterDate` inhabilita días llenos. `dayClassName` colorea en rojo los días sin lugares.

### Google Maps (iframe)
- La sección de ubicación en Home.jsx usa un `<iframe>` con embed de Google Maps apuntando al Recinto Portuario de Puerto Peñasco.
- No requiere API key (usa embed público).

---

## 14. Glosario de Términos del Dominio

| Término | Significado en el contexto del sistema |
|---|---|
| **El Rey del Mar** | Nombre del barco pirata. También llamado "Barco Pirata" en el negocio. |
| **Recinto Portuario** | Zona portuaria de Puerto Peñasco donde zarpa el barco. Punto de embarque. |
| **Paquete** | Tipo de paseo disponible (ej. Familiar, Romántico, Solo Paseo). Tiene nombre, precio/persona y descripción. |
| **Reservación** | Solicitud de lugar(es) a bordo para una fecha específica. Pasa por múltiples estados. |
| **Folio** | Código alfanumérico derivado del UUID de la reservación. Es el identificador visible para el cliente. |
| **Pase de Abordar** | Versión corta del folio mostrada cuando la reserva está pagada. |
| **Capacidad del Barco** | Máximo de pasajeros permitidos por día. Configurable por el admin. Default: 50. |
| **Pasajero** | Cada persona que aborda el barco. La cantidad determina el precio total. |
| **Taquilla** | Punto de venta físico en el Recinto Portuario donde se puede pagar en efectivo. |
| **Capitán** | Nombre coloquial del administrador del sistema en los mensajes al cliente. |
| **admin** | Role del sistema con acceso total al panel de administración. |
| **client** | Role del sistema para usuarios que solo pueden reservar y ver sus propias reservaciones. |
| **Bitácora** | Log de auditoría (`activity_logs`) que registra todas las acciones relevantes del sistema. |
| **Ken Burns** | Efecto de animación suave (zoom + traslación) aplicado a las imágenes del carrusel hero. |
| **Voucher** | Comprobante de pago generado tras liquidar una reservación. Se puede imprimir o descargar como PDF. |

---

## 15. Decisiones de Arquitectura Relevantes

### Por qué Supabase (y no un backend propio)
El negocio es pequeño, con un volumen de datos muy manejable. Supabase ofrece Auth, BD, Storage y RLS listos para usar sin infraestructura adicional. El costo de desarrollo se reduce significativamente. La desventaja es que la lógica de negocio corre en el frontend, lo que requiere que las políticas RLS estén bien configuradas.

### Por qué no se usa Stripe real
El procesamiento de tarjetas es **simulado** (no se integra Stripe ni ningún gateway real). La validación de tarjeta solo verifica que el número tenga al menos 15 dígitos. Esto fue una decisión deliberada para el MVP: el negocio prefiere cobros presenciales; el flujo de tarjeta en línea es para futuras iteraciones.

### Componente Voucher compartido
`PaymentModal.jsx` (admin) y `ClientPaymentModal.jsx` (cliente) solían tener el bloque de voucher duplicado. Se extrajo a `Voucher.jsx` con una prop `dark` (bool) para el tema oscuro del admin. Esto elimina la duplicación y centraliza la lógica de impresión/PDF.

### Scroll del overlay de voucher
El overlay del Voucher usa `overflowY: auto` sin `display: flex + alignItems: center`. El centrado se logra con `margin: 0 auto` en el contenedor interno. Esto evita el bug conocido de flex + scroll donde el contenido superior queda inaccesible.

### No hay servidor de email
Las notificaciones al cliente son visibles en `/profile` (ClientDashboard). No se envían correos automáticos al cambiar el estado de una reservación. Esta es una limitación conocida del sistema actual.

### Capacidad: `pending` no cuenta
Al verificar disponibilidad, las reservas con status `pending` **no** se descuentan de la capacidad. Solo cuentan los estados `confirmed`, `awaiting_cash`, `paid`, `in_progress`, `completed`. Esto porque una reserva pendiente puede ser rechazada.

---

## 16. Instrucciones para la IA Receptora

Este archivo es el contexto completo del sistema "Barco Pirata". Con él puedes generar los siguientes entregables sin necesidad de acceder al código fuente:

### A. Manual Técnico
Usa las secciones **2 (Stack)**, **3 (Arquitectura)**, **5 (Base de datos)**, **10 (Variables de entorno)**, **11 (Comandos)**, **13 (Integraciones)** y **15 (Decisiones de arquitectura)**.

Estructura sugerida para el Manual Técnico:
1. Requisitos del sistema (Node.js, npm, cuenta Supabase)
2. Instalación y configuración inicial
3. Variables de entorno (qué son y dónde obtenerlas en Supabase)
4. Estructura de la base de datos (cómo crear las tablas en Supabase)
5. Políticas RLS (cómo configurarlas)
6. Comandos de desarrollo y despliegue
7. Descripción de integraciones externas

### B. Documentación Técnica (para desarrolladores)
Usa las secciones **4 (Estructura de directorios)**, **8 (Componentes clave)**, **9 (Rutas)**, **12 (Reglas de negocio)** y **15 (Decisiones de arquitectura)**.

Estructura sugerida:
1. Arquitectura de la SPA y flujo de datos
2. Componentes: tabla con nombre, props, estado, responsabilidad
3. Páginas y rutas protegidas
4. Reglas de negocio implementadas
5. Utilidades (logger.js)
6. Guía para agregar un nuevo paquete / nuevo estado de reserva

### C. Manual de Usuario
Usa las secciones **1 (Descripción)**, **7 (Flujos de usuario)**, **12 (Reglas de negocio)** y **14 (Glosario)**.

El manual de usuario tiene **dos audiencias**:

**Cliente (turista):**
1. Cómo crear una cuenta
2. Cómo hacer una reservación (BookingBar o tarjeta de paquete)
3. Cómo ver el estado de mi reservación en "Mis Reservaciones"
4. Cómo pagar cuando el Capitán aprueba mi solicitud
5. Cómo descargar mi comprobante

**Administrador:**
1. Cómo acceder al panel de administración
2. Cómo revisar y aceptar/rechazar reservaciones pendientes
3. Cómo procesar un pago (tarjeta o efectivo)
4. Cómo iniciar y finalizar un viaje
5. Cómo gestionar los paquetes disponibles
6. Cómo generar reportes (diario y anual)
7. Cómo usar la bitácora de actividad
8. Cómo exportar un respaldo de los datos
9. Cómo configurar la capacidad máxima del barco

### Notas importantes para la IA
- El sistema no tiene email transaccional. Las notificaciones son solo en el panel del cliente.
- El procesamiento de tarjetas es **simulado** (no hay integración con Stripe u otro gateway).
- La autenticación usa Supabase Auth; los tokens JWT se manejan automáticamente por el SDK.
- La capacidad del barco es **global por día** (no por viaje o por horario).
- El folio visible para el cliente no es el UUID completo, sino los primeros 8 caracteres en mayúsculas.
- El sistema está en Español (México). Toda la UI y los mensajes de error están en español.
