# Contexto del Proyecto: Barco Pirata de Puerto Peñasco

**Empresa:** Barco Pirata de Puerto Peñasco (Ubicada en el área del Recinto Portuario).
**Objetivo:** Digitalizar y llevar un control automatizado de la venta de boletos de paseos en barco.

## Requisitos de Registro
- Cantidad de clientes.
- Tipo de servicio solicitado (Paseos individuales o grupales).

### Paquetes y Costos
- **Con comida incluida:** $450 por persona.
- **Solo Bebidas:** $350 por persona.
- **Solo paseo:** $250 por persona.

**Descuentos:** 
- En el caso de grupos de 5 personas o más, se considera un **10% de descuento** del costo del paquete.

## Propuesta de Software

### Entradas (Interfaces y Funcionalidad)
1. **Interfaz de Reservación:** 
   - Debe pedir día, fecha, cantidad de personas y datos de contacto (nombre y número de celular). 
   - Al enviar la información, el usuario obtendrá un mensaje de confirmación.
2. **Interfaz de Servicios y Costos:** 
   - Debe mostrar de forma clara los servicios de la empresa y sus precios.
3. **Validación y Pago:** 
   - Una vez que el administrador/usuario valida la información, se genera la intención de pago (Efectivo o Tarjeta).
   - *Si es efectivo:* Se realiza con el vendedor o empresa (se debe presentar pantalla de compra-venta).
   - *Si es tarjeta:* Se abrirá interfaz de pago pidiendo número de cuenta y tipo de cuenta. Desplegará el monto a pagar, realizará la transacción y emitirá comprobante.

### Salidas (Reportes y Exportación)
4. Reporte de reservaciones por día, incluyendo el tipo de pagos efectuados.
5. Comprobante de pago para el cliente (independientemente si pagó con tarjeta o con efectivo).
6. Base de datos exportable a Excel o PDF.
7. Interfaz gráfica afín a la empresa (temática acorde al Barco Pirata).

## Entregables y Fecha
- **Fecha de entrega límite:** 26 de abril a las 11:59 pm.
- **Documentación del proyecto:**
  - Guía rápida de usuario.
  - Guía rápida técnica.
