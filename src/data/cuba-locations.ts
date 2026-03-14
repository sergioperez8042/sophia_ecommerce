// Provincias y municipios de Cuba
// Fuente: EcuRed, Wikipedia - 15 provincias + 1 municipio especial = 168 municipios

export interface Province {
  name: string;
  municipalities: string[];
}

export const CUBA_PROVINCES: Province[] = [
  {
    name: "Pinar del Rio",
    municipalities: [
      "Consolacion del Sur",
      "Guane",
      "La Palma",
      "Los Palacios",
      "Mantua",
      "Minas de Matahambre",
      "San Juan y Martinez",
      "San Luis",
      "Sandino",
      "Vi\u00f1ales",
    ],
  },
  {
    name: "Artemisa",
    municipalities: [
      "Alquizar",
      "Artemisa",
      "Bahia Honda",
      "Bauta",
      "Caimito",
      "Candelaria",
      "Guanajay",
      "Guira de Melena",
      "Mariel",
      "San Antonio de los Banos",
      "San Cristobal",
    ],
  },
  {
    name: "La Habana",
    municipalities: [
      "Arroyo Naranjo",
      "Boyeros",
      "Centro Habana",
      "Cerro",
      "Cotorro",
      "Diez de Octubre",
      "Guanabacoa",
      "Habana del Este",
      "Habana Vieja",
      "La Lisa",
      "Marianao",
      "Playa",
      "Plaza de la Revolucion",
      "Regla",
      "San Miguel del Padron",
    ],
  },
  {
    name: "Mayabeque",
    municipalities: [
      "Batabano",
      "Bejucal",
      "Guines",
      "Jaruco",
      "Madruga",
      "Melena del Sur",
      "Nueva Paz",
      "Quivican",
      "San Jose de las Lajas",
      "San Nicolas de Bari",
      "Santa Cruz del Norte",
    ],
  },
  {
    name: "Matanzas",
    municipalities: [
      "Calimete",
      "Cardenas",
      "Cienaga de Zapata",
      "Colon",
      "Jaguey Grande",
      "Jovellanos",
      "Limonar",
      "Los Arabos",
      "Marti",
      "Matanzas",
      "Pedro Betancourt",
      "Perico",
      "Union de Reyes",
    ],
  },
  {
    name: "Cienfuegos",
    municipalities: [
      "Abreus",
      "Aguada de Pasajeros",
      "Cienfuegos",
      "Cruces",
      "Cumanayagua",
      "Lajas",
      "Palmira",
      "Rodas",
    ],
  },
  {
    name: "Villa Clara",
    municipalities: [
      "Caibarien",
      "Camajuani",
      "Cifuentes",
      "Corralillo",
      "Encrucijada",
      "Manicaragua",
      "Placetas",
      "Quemado de Guines",
      "Ranchuelo",
      "Remedios",
      "Sagua la Grande",
      "Santa Clara",
      "Santo Domingo",
    ],
  },
  {
    name: "Sancti Spiritus",
    municipalities: [
      "Cabaiguan",
      "Fomento",
      "Jatibonico",
      "La Sierpe",
      "Sancti Spiritus",
      "Taguasco",
      "Trinidad",
      "Yaguajay",
    ],
  },
  {
    name: "Ciego de Avila",
    municipalities: [
      "Baragua",
      "Bolivia",
      "Chambas",
      "Ciego de Avila",
      "Ciro Redondo",
      "Florencia",
      "Majagua",
      "Moron",
      "Primero de Enero",
      "Venezuela",
    ],
  },
  {
    name: "Camaguey",
    municipalities: [
      "Camaguey",
      "Carlos Manuel de Cespedes",
      "Esmeralda",
      "Florida",
      "Guaimaro",
      "Jimaguayu",
      "Minas",
      "Najasa",
      "Nuevitas",
      "Santa Cruz del Sur",
      "Sibanicu",
      "Sierra de Cubitas",
      "Vertientes",
    ],
  },
  {
    name: "Las Tunas",
    municipalities: [
      "Amancio",
      "Colombia",
      "Jesus Menendez",
      "Jobabo",
      "Las Tunas",
      "Majibacoa",
      "Manati",
      "Puerto Padre",
    ],
  },
  {
    name: "Holguin",
    municipalities: [
      "Antilla",
      "Baguanos",
      "Banes",
      "Cacocum",
      "Calixto Garcia",
      "Cueto",
      "Frank Pais",
      "Gibara",
      "Holguin",
      "Mayari",
      "Moa",
      "Rafael Freyre",
      "Sagua de Tanamo",
      "Urbano Noris",
    ],
  },
  {
    name: "Granma",
    municipalities: [
      "Bartolome Maso",
      "Bayamo",
      "Buey Arriba",
      "Campechuela",
      "Cauto Cristo",
      "Guisa",
      "Jiguani",
      "Manzanillo",
      "Media Luna",
      "Niquero",
      "Pilon",
      "Rio Cauto",
      "Yara",
    ],
  },
  {
    name: "Santiago de Cuba",
    municipalities: [
      "Contramaestre",
      "Guama",
      "Julio Antonio Mella",
      "Palma Soriano",
      "San Luis",
      "Santiago de Cuba",
      "Segundo Frente",
      "Songo la Maya",
      "Tercer Frente",
    ],
  },
  {
    name: "Guantanamo",
    municipalities: [
      "Baracoa",
      "Caimanera",
      "El Salvador",
      "Guantanamo",
      "Imias",
      "Maisi",
      "Manuel Tames",
      "Niceto Perez",
      "San Antonio del Sur",
      "Yateras",
    ],
  },
  {
    name: "Isla de la Juventud",
    municipalities: ["Isla de la Juventud"],
  },
];

// Helper: get all municipalities for a province
export function getMunicipalitiesByProvince(provinceName: string): string[] {
  const province = CUBA_PROVINCES.find(
    (p) => p.name.toLowerCase() === provinceName.toLowerCase()
  );
  return province?.municipalities || [];
}

// Helper: flat list of all municipalities with their province
export function getAllMunicipalitiesFlat(): { province: string; municipality: string }[] {
  const result: { province: string; municipality: string }[] = [];
  for (const province of CUBA_PROVINCES) {
    for (const municipality of province.municipalities) {
      result.push({ province: province.name, municipality });
    }
  }
  return result;
}
