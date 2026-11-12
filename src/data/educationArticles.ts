export interface EducationArticle {
  id: string;
  title: string;
  summary: string;
  readTime: string;
  category: string;
  iconName:
    | 'piggy-bank'
    | 'landmark'
    | 'calendar-clock'
    | 'wallet'
    | 'receipt'
    | 'trending-up'
    | 'shield-check'
    | 'search-check';
  keyTakeaway: string;
  sections: {
    heading: string;
    body: string;
  }[];
}

export const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    id: 'que-es-el-pie',
    title: '¿Qué es el pie de una vivienda?',
    summary: 'Descubre por qué este monto inicial es el primer gran paso hacia tu propiedad.',
    readTime: '2 min',
    category: 'Conceptos clave',
    iconName: 'piggy-bank',
    keyTakeaway:
      'El pie suele representar entre el 10% y el 20% del valor total de la propiedad. Mientras mayor sea tu pie, menor será el monto que necesitarás financiar.',
    sections: [
      {
        heading: 'Tu aporte inicial para la compra',
        body: 'El pie es la parte del valor de la vivienda que pagas con tus propios ahorros al momento de la compraventa, sin formar parte del préstamo hipotecario.',
      },
      {
        heading: 'Ejemplo práctico en RoadHome',
        body: 'Si tu vivienda objetivo tiene un valor referencial de 4.500 UF y se considera un pie del 20%, tu meta de ahorro inicial será reunir 900 UF (equivalentes a $36.000.000 con una UF simulada de $40.000). El 80% restante se evalúa mediante financiamiento hipotecario.',
      },
      {
        heading: '¿Por qué te ayuda reunir un buen pie?',
        body: 'Contar con el pie completo reduce el monto del crédito solicitado, disminuye el dividendo mensual estimado y mejora tus condiciones al solicitar una evaluación hipotecaria.',
      },
    ],
  },
  {
    id: 'como-funciona-credito-hipotecario',
    title: '¿Cómo funciona un crédito hipotecario?',
    summary: 'Entiende de manera simple cómo el banco financia el porcentaje restante de tu vivienda.',
    readTime: '3 min',
    category: 'Financiamiento',
    iconName: 'landmark',
    keyTakeaway:
      'Un crédito hipotecario es un préstamo a largo plazo (habitualmente entre 15 y 30 años) donde la misma propiedad queda como garantía.',
    sections: [
      {
        heading: 'La combinación entre tu ahorro y el financiamiento',
        body: 'Cuando compras una vivienda, el precio total se cubre sumando tu pie ahorrado más el monto financiado por la institución financiera.',
      },
      {
        heading: 'Componentes principales',
        body: 'En una evaluación hipotecaria se revisan el porcentaje de financiamiento (por ejemplo 80%), el plazo en años, la tasa de interés (fija, variable o mixta) y los seguros obligatorios de desgravamen e incendio con sismo.',
      },
    ],
  },
  {
    id: 'que-significa-dividendo',
    title: '¿Qué significa el dividendo?',
    summary: 'Conoce cómo se calcula la cuota mensual que pagarás una vez que seas propietario.',
    readTime: '2 min',
    category: 'Presupuesto',
    iconName: 'calendar-clock',
    keyTakeaway:
      'Como regla saludable de planificación financiera, se recomienda que el dividendo mensual no supere entre el 25% y el 30% de tu ingreso líquido mensual.',
    sections: [
      {
        heading: 'Tu cuota mensual hipotecaria',
        body: 'El dividendo es el pago mensual que realizas para devolver el crédito hipotecario. Incluye amortización de capital, intereses del período y seguros asociados.',
      },
      {
        heading: 'Por qué se expresa en UF',
        body: 'Dado que los créditos hipotecarios suelen pactarse en Unidades de Fomento (UF), el valor en pesos del dividendo se actualiza mensualmente según el valor vigente de la UF.',
      },
    ],
  },
  {
    id: 'como-organizar-ahorro-mensual',
    title: '¿Cómo organizar un ahorro mensual?',
    summary: 'Estrategias prácticas para mantener la constancia sin descuidar tu tranquilidad.',
    readTime: '3 min',
    category: 'Hábitos de ahorro',
    iconName: 'wallet',
    keyTakeaway:
      'Separar tu ahorro apenas recibes tu ingreso mensual ("pagarte a ti primero") evita que dependas de lo que sobre a fin de mes.',
    sections: [
      {
        heading: 'Define una capacidad de ahorro realista',
        body: 'Resta tus gastos fijos y variables a tu ingreso líquido y deja siempre un margen de seguridad para imprevistos cotidianos. En RoadHome puedes simular imprevistos para anticipar cómo se adapta tu ruta.',
      },
      {
        heading: 'Aportes extraordinarios',
        body: 'Destinar parte de bonos, devoluciones o ingresos extra directamente a tu fondo de vivienda puede adelantar varios meses tu fecha estimada de cumplimiento.',
      },
    ],
  },
  {
    id: 'gastos-al-comprar-vivienda',
    title: '¿Qué gastos debo considerar al comprar una vivienda?',
    summary: 'Más allá del pie: conoce los gastos operacionales para que nada te tome por sorpresa.',
    readTime: '3 min',
    category: 'Planificación',
    iconName: 'receipt',
    keyTakeaway:
      'Reserva un monto adicional equivalente a entre el 1% y el 2% del valor de la propiedad para cubrir gastos operacionales del proceso.',
    sections: [
      {
        heading: 'Gastos operacionales habituales',
        body: 'Al gestionar un crédito hipotecario existen costos asociados como tasación de la propiedad, estudio de títulos, redacción de escritura, gastos notariales, impuesto al mutuo e inscripción en el Conservador de Bienes Raíces.',
      },
      {
        heading: 'Gastos de mudanza y habilitación',
        body: 'Considera también el presupuesto para traslado, equipamiento básico y eventuales gastos comunes desde el mes de entrega.',
      },
    ],
  },
  {
    id: 'que-es-la-uf',
    title: '¿Qué es la UF?',
    summary: 'Por qué las viviendas y créditos en Chile se valorizan en Unidades de Fomento.',
    readTime: '2 min',
    category: 'Conceptos clave',
    iconName: 'trending-up',
    keyTakeaway:
      'La Unidad de Fomento (UF) es una unidad de cuenta reajustable según la inflación (IPC), diseñada para mantener el valor adquisitivo en el tiempo.',
    sections: [
      {
        heading: '¿Cómo impacta en tu meta de ahorro?',
        body: 'Como las propiedades se expresan en UF, ahorrar en instrumentos que protejan tu dinero frente a la inflación ayuda a que tu progreso hacia el pie se mantenga firme.',
      },
      {
        heading: 'Nota sobre este prototipo',
        body: 'Para facilitar los cálculos demostrativos en RoadHome + HomeMarket, utilizamos un valor referencial configurable de 1 UF = $40.000 CLP.',
      },
    ],
  },
  {
    id: 'capacidad-de-endeudamiento',
    title: '¿Cómo evaluar mi capacidad de endeudamiento?',
    summary: 'Aprende a equilibrar tus ingresos, compromisos actuales y tu futuro dividendo.',
    readTime: '3 min',
    category: 'Salud financiera',
    iconName: 'shield-check',
    keyTakeaway:
      'Mantener bajas tus deudas de corto plazo (tarjetas o créditos de consumo) amplía tu holgura financiera al momento de solicitar una evaluación hipotecaria.',
    sections: [
      {
        heading: 'Carga financiera mensual',
        body: 'Las instituciones financieras revisan qué porcentaje de tu ingreso mensual se destina al pago total de deudas. Mientras más ordenada sea tu carga mensual, más saludable será tu evaluación.',
      },
      {
        heading: 'Alternativa de complementar renta',
        body: 'Muchos jóvenes profesionales optan por evaluar la compra complementando renta con su pareja o un familiar directo para acceder a propiedades de mayor valor.',
      },
    ],
  },
  {
    id: 'que-revisar-antes-de-elegir',
    title: '¿Qué debo revisar antes de elegir una propiedad?',
    summary: 'Lista de chequeo para comparar ubicación, conectividad y proyección antes de decidir.',
    readTime: '3 min',
    category: 'Decisión inmobiliaria',
    iconName: 'search-check',
    keyTakeaway:
      'Diferenciar tus requisitos indispensables de las características deseables te permite tomar una decisión equilibrada entre calidad de vida y presupuesto.',
    sections: [
      {
        heading: 'Conectividad y entorno',
        body: 'Evalúa tiempos de traslado a tu trabajo o estudio, cercanía a transporte público o metro, áreas verdes, centros de salud y comercio de barrio.',
      },
      {
        heading: 'Costos mensuales permanentes',
        body: 'Además del dividendo estimado, infórmate sobre el valor aproximado de los gastos comunes y contribuciones trimestrales según el tipo de propiedad.',
      },
    ],
  },
];

