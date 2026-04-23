# Esquema de Base de Datos - Supabase

A continuación se muestra la estructura recomendada para la base de datos de "Barco Pirata de Puerto Peñasco". Al utilizar Supabase, puedes crear estas tablas fácilmente usando su **Table Editor** visual, o simplemente ejecutando el código SQL que te dejo más abajo en el **SQL Editor**.

## 🚀 Actualizaciones (Atributos Dinámicos de Paquetes)
Abre tu **SQL Editor** en Supabase y ejecuta este comando para agregar la estructura completa a la tabla paquetes.

```sql
-- Agrega soporte para guardar las ligas de internet y el texto "Ideal para"
ALTER TABLE packages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS ideal_for TEXT;

-- Y solo por si todavía no habías ejecutado lo de los clientes:
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
```

## 🚨 Bitácora de Auditoría (Activity Logs)
¡EJECUTA ESTO EN EL SQL EDITOR PARA QUE LEVANTAR EL MÓDULO DE LOGS!

```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  entity_type TEXT NOT NULL, -- 'PACKAGE', 'RESERVATION', 'SYSTEM'
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

---
## Estructura Completa Desde Cero
```sql
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  image_url TEXT, -- FOTOGRAFÍAS AÑADIDAS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS reservations (
...
```
