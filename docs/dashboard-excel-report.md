# Informe del dashboard

El botón Descargar informe genera un `.xlsx` en el navegador con los datos ya consultados del rol y período seleccionados. No vuelve a consultar la base de datos ni envía información a otro servicio.

Hojas: Resumen (indicadores, unidades, diferencias y variaciones), Gráficos (comparación diaria, estados y clasificación), Actividad diaria (fechas de ambos períodos y filtros), Totales (sumas de la actividad), Pedidos (situación actual), Clasificación (los elementos destacados del dashboard).

Las gráficas son objetos nativos de Excel y hacen referencia a las tablas del archivo. Números y fechas son valores tipados. Las diferencias, variaciones, totales y participaciones tienen fórmulas con resultados almacenados. Los textos de empresa y producto se escriben como cadenas, incluso si comienzan con `=`.

Se conservan las definiciones del dashboard: estados y visitas acumuladas no se filtran por fecha; importes por moneda corresponden a pedidos entregados creados en cada período. Los importes incompletos se identifican y no se comparan como si fueran totales completos. Las métricas de chat no disponibles se muestran como Sin datos.

La paleta toma el color primario de la página y la fuente Segoe UI del sistema de Windows. La generación OOXML y ZIP no agrega dependencias. El código se carga al pulsar el botón.

Verificación sin cuentas ni escrituras en la base de datos:

```powershell
node scripts/test-dashboard-report.cjs <carpeta-temporal>
python scripts/check-dashboard-report.py <carpeta-temporal>
npx tsc --noEmit --strict --skipLibCheck --target es2020 --moduleResolution node --module commonjs lib/dashboard/report-workbook.ts
```

El verificador Python requiere openpyxl y solo lee los archivos generados. Cubre 7, 30 y 90 días, vendedor y comprador, períodos históricos y actuales, monedas múltiples, cuentas vacías y chat no disponible. Comprueba CRC, relaciones XML, cifras, fechas, fórmulas y datos de los gráficos con un lector independiente.
