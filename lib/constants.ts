export const PRODUCT_CATEGORIES = [
  "Aceites",
  "Algodón",
  "Arroz",
  "Café",
  "Cacao",
  "Caña de azúcar",
  "Cereales",
  "Especias",
  "Fertilizantes",
  "Forraje",
  "Frutas",
  "Granos Básicos",
  "Herbicidas",
  "Lácteos",
  "Plaguicidas",
  "Semillas",
  "Verduras",
  "Otros"
].sort();

export const UNIDADES_MEDIDA = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'TM', label: 'Toneladas Métricas (TM)' },
  { value: 'lt', label: 'Litros (lt)' },
  { value: 'unidad', label: 'Unidades (unidad)' },
];

/**
 * Control global para la compra directa en productos.
 * Por solicitud, la opción de compra está desactivada para todos los productos
 * (incluso si tienen precio definido). Para reactivarla en el futuro,
 * basta con cambiar este valor a true o configurar NEXT_PUBLIC_ENABLE_DIRECT_PURCHASE=true.
 */
export const ENABLE_DIRECT_PURCHASE = process.env.NEXT_PUBLIC_ENABLE_DIRECT_PURCHASE === "true";
