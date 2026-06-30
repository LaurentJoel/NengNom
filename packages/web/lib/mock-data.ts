export type FarmType = 'poultry' | 'pigs' | 'cattle' | 'mixed';
export type Country = 'CM' | 'CG' | 'CD' | 'GA' | 'CI';
export type ConsultationStatus = 'active' | 'pending' | 'closed';
export type LabStatus = 'received' | 'scheduled' | 'technician_en_route' | 'samples_collected' | 'analysis' | 'results_ready' | 'delivered';
export type SuggestionPriority = 'high' | 'medium' | 'low';
export type PostCategory = 'question' | 'alert' | 'tip' | 'sale';

export interface Farmer {
  id: string;
  fullName: string;
  farmName: string;
  farmType: FarmType;
  animalCount: number;
  region: string;
  country: Country;
  phone: string;
}

export interface Vet {
  id: string;
  fullName: string;
  specialization: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  isAvailable: boolean;
  country: Country;
}

export interface Message {
  id: string;
  senderId: string;
  senderRole: 'farmer' | 'vet';
  content: string;
  timestamp: string;
  mediaUrl?: string;
}

export interface Consultation {
  id: string;
  farmerId: string;
  vetId: string;
  vet: Vet;
  status: ConsultationStatus;
  type: 'normal' | 'urgent';
  symptoms: string;
  animalGroup: string;
  startedAt: string;
  closedAt?: string;
  messages: Message[];
  fee: number;
}

export interface LabRequest {
  id: string;
  farmerId: string;
  testType: string;
  status: LabStatus;
  price: number;
  scheduledAt: string;
  location: string;
  technician?: string;
  results?: string;
  createdAt: string;
}

export interface FarmRecord {
  id: string;
  farmerId: string;
  date: string;
  totalAnimals: number;
  mortality: number;
  feedKg: number;
  notes: string;
}

export interface HealthEvent {
  id: string;
  farmerId: string;
  date: string;
  type: 'vaccination' | 'deworming' | 'treatment' | 'other';
  description: string;
  animalCount: number;
}

export interface AiSuggestion {
  id: string;
  title: string;
  content: string;
  priority: SuggestionPriority;
  context: string;
  generatedAt: string;
  feedback?: 'useful' | 'not_useful';
}

export interface CommunityPost {
  id: string;
  authorName: string;
  anonymous: boolean;
  farmType: FarmType;
  category: PostCategory;
  content: string;
  imageUrl?: string;
  tags: string[];
  likes: number;
  replies: number;
  createdAt: string;
  region: string;
}

export const mockFarmers: Farmer[] = [
  {
    id: 'farmer-1',
    fullName: 'Emmanuel Fodieng',
    farmName: 'Ferme Avicole du Wouri',
    farmType: 'poultry',
    animalCount: 2450,
    region: 'Littoral',
    country: 'CM',
    phone: '+237 677 234 891',
  },
  {
    id: 'farmer-2',
    fullName: 'Marlène Ngoma',
    farmName: 'Élevage Ngoma & Fils',
    farmType: 'mixed',
    animalCount: 800,
    region: 'Pool',
    country: 'CG',
    phone: '+242 06 551 78 43',
  },
  {
    id: 'farmer-3',
    fullName: 'Kofi Asante',
    farmName: 'Ferme Moderne d\'Abidjan',
    farmType: 'poultry',
    animalCount: 5200,
    region: 'Abidjan',
    country: 'CI',
    phone: '+225 07 88 22 14 36',
  },
];

export const mockVets: Vet[] = [
  {
    id: 'vet-1',
    fullName: 'Dr. Aminata Diallo',
    specialization: 'Aviculture & maladies respiratoires',
    rating: 4.8,
    reviewCount: 127,
    hourlyRate: 8000,
    isAvailable: true,
    country: 'CM',
  },
  {
    id: 'vet-2',
    fullName: 'Dr. Jean-Baptiste Nkoulou',
    specialization: 'Médecine porcine & bovine',
    rating: 4.6,
    reviewCount: 89,
    hourlyRate: 10000,
    isAvailable: true,
    country: 'CM',
  },
  {
    id: 'vet-3',
    fullName: 'Dr. Sophie Mabika',
    specialization: 'Parasitologie & bactériologie',
    rating: 4.9,
    reviewCount: 203,
    hourlyRate: 12000,
    isAvailable: false,
    country: 'CG',
  },
];

export const mockConsultations: Consultation[] = [
  {
    id: 'consult-1',
    farmerId: 'farmer-1',
    vetId: 'vet-1',
    vet: mockVets[0],
    status: 'active',
    type: 'urgent',
    symptoms: 'Plusieurs poulets présentent des difficultés respiratoires depuis hier soir. Toux, éternuements, et 2 décès ce matin.',
    animalGroup: 'Poulets de chair',
    startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderId: 'farmer-1',
        senderRole: 'farmer',
        content: 'Bonjour Docteur, j\'ai plusieurs poulets qui toussent depuis ce matin. Deux sont morts. Que faire ?',
        timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
      },
      {
        id: 'msg-2',
        senderId: 'vet-1',
        senderRole: 'vet',
        content: 'Bonjour Emmanuel. Je regarde votre dossier. Pouvez-vous m\'envoyer une photo des animaux malades et me dire combien de temps depuis la dernière vaccination Newcastle ?',
        timestamp: new Date(Date.now() - 26 * 60000).toISOString(),
      },
      {
        id: 'msg-3',
        senderId: 'farmer-1',
        senderRole: 'farmer',
        content: 'La dernière vaccination remonte à environ 8 semaines. Voici une photo.',
        timestamp: new Date(Date.now() - 24 * 60000).toISOString(),
        mediaUrl: 'https://images.pexels.com/photos/1769279/pexels-photo-1769279.jpeg?auto=compress&w=400',
      },
      {
        id: 'msg-4',
        senderId: 'vet-1',
        senderRole: 'vet',
        content: 'Merci pour la photo. Les symptômes ressemblent à la Maladie de Newcastle ou à une bronchite infectieuse. Isolez immédiatement les animaux malades. Je vais vous préparer un protocole de traitement.',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
      },
    ],
    fee: 12000,
  },
  {
    id: 'consult-2',
    farmerId: 'farmer-1',
    vetId: 'vet-2',
    vet: mockVets[1],
    status: 'pending',
    type: 'normal',
    symptoms: 'Baisse de ponte observée depuis 3 jours sur mes pondeuses.',
    animalGroup: 'Pondeuses',
    startedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    messages: [],
    fee: 8000,
  },
  {
    id: 'consult-3',
    farmerId: 'farmer-1',
    vetId: 'vet-1',
    vet: mockVets[0],
    status: 'closed',
    type: 'normal',
    symptoms: 'Quelques animaux présentaient des diarrhées légères.',
    animalGroup: 'Poulets de chair',
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString(),
    closedAt: new Date(Date.now() - 6 * 24 * 60 * 60000).toISOString(),
    messages: [],
    fee: 5000,
  },
];

export const mockLabRequests: LabRequest[] = [
  {
    id: 'lab-1',
    farmerId: 'farmer-1',
    testType: 'Diagnostic de maladies',
    status: 'technician_en_route',
    price: 18000,
    scheduledAt: new Date(Date.now() + 2 * 60 * 60000).toISOString(),
    location: 'Ferme Avicole du Wouri, Douala, Littoral',
    technician: 'Technicien Pierre Ekotto',
    createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
  },
  {
    id: 'lab-2',
    farmerId: 'farmer-1',
    testType: 'Qualité de l\'eau',
    status: 'results_ready',
    price: 15000,
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    location: 'Ferme Avicole du Wouri, Douala, Littoral',
    results: 'Eau conforme aux normes. pH: 7.2. Aucune contamination bactérienne détectée.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
  },
];

export const mockFarmRecords: FarmRecord[] = [
  { id: 'rec-1', farmerId: 'farmer-1', date: '2026-06-10', totalAnimals: 2450, mortality: 2, feedKg: 245, notes: '' },
  { id: 'rec-2', farmerId: 'farmer-1', date: '2026-06-09', totalAnimals: 2452, mortality: 1, feedKg: 248, notes: 'Distribution de vitamines' },
  { id: 'rec-3', farmerId: 'farmer-1', date: '2026-06-08', totalAnimals: 2453, mortality: 0, feedKg: 250, notes: '' },
  { id: 'rec-4', farmerId: 'farmer-1', date: '2026-06-07', totalAnimals: 2453, mortality: 3, feedKg: 252, notes: 'Quelques sujets léthargiques' },
  { id: 'rec-5', farmerId: 'farmer-1', date: '2026-06-06', totalAnimals: 2456, mortality: 1, feedKg: 248, notes: '' },
  { id: 'rec-6', farmerId: 'farmer-1', date: '2026-06-05', totalAnimals: 2457, mortality: 2, feedKg: 246, notes: '' },
  { id: 'rec-7', farmerId: 'farmer-1', date: '2026-06-04', totalAnimals: 2459, mortality: 0, feedKg: 251, notes: 'Bonne journée' },
  { id: 'rec-8', farmerId: 'farmer-1', date: '2026-06-03', totalAnimals: 2459, mortality: 1, feedKg: 249, notes: '' },
  { id: 'rec-9', farmerId: 'farmer-1', date: '2026-06-02', totalAnimals: 2460, mortality: 2, feedKg: 247, notes: '' },
  { id: 'rec-10', farmerId: 'farmer-1', date: '2026-06-01', totalAnimals: 2462, mortality: 1, feedKg: 250, notes: '' },
];

export const mockHealthEvents: HealthEvent[] = [
  {
    id: 'he-1',
    farmerId: 'farmer-1',
    date: '2026-06-03',
    type: 'vaccination',
    description: 'Vaccination Newcastle (souche La Sota)',
    animalCount: 2459,
  },
  {
    id: 'he-2',
    farmerId: 'farmer-1',
    date: '2026-05-25',
    type: 'deworming',
    description: 'Vermifugation générale — Piperazine 25%',
    animalCount: 2460,
  },
  {
    id: 'he-3',
    farmerId: 'farmer-1',
    date: '2026-05-15',
    type: 'vaccination',
    description: 'Vaccination Gumboro (Bursa IBD)',
    animalCount: 2480,
  },
  {
    id: 'he-4',
    farmerId: 'farmer-1',
    date: '2026-05-05',
    type: 'treatment',
    description: 'Traitement antibiotique — Diarrhées légères',
    animalCount: 45,
  },
];

export const mockAiSuggestions: AiSuggestion[] = [
  {
    id: 'sug-1',
    title: 'Risque élevé de Maladie de Newcastle — Action immédiate',
    content: 'Vos données montrent une augmentation de la mortalité de 3 sujets cette semaine. En cette saison de transition (harmattan), le risque de Newcastle est élevé dans votre région. Recommandations : 1) Vérifiez le statut vaccinal de votre effectif — rappel vaccinal recommandé si plus de 6 semaines depuis la dernière injection. 2) Isolez immédiatement les sujets présentant des signes nerveux ou respiratoires. 3) Renforcez la biosécurité à l\'entrée du poulailler. 4) Contactez un vétérinaire si vous observez plus de 2 décès par jour.',
    priority: 'high',
    context: 'Basé sur : 3 décès cette semaine · Vaccination Newcastle il y a 7 jours · Saison de transition',
    generatedAt: new Date().toISOString(),
  },
  {
    id: 'sug-2',
    title: 'Rappel vaccin Gumboro dans 7 jours',
    content: 'Votre dernier rappel Gumboro remonte au 15 mai. Pour une protection optimale, il est recommandé d\'effectuer un rappel toutes les 6 semaines. Planifiez une commande de vaccin dès aujourd\'hui pour éviter toute rupture.',
    priority: 'medium',
    context: 'Basé sur : Calendrier vaccinal · Dernier rappel il y a 26 jours',
    generatedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
  },
  {
    id: 'sug-3',
    title: 'Optimisation de l\'alimentation — économie potentielle de 15%',
    content: 'En analysant vos données d\'alimentation des 30 derniers jours, la consommation moyenne est de 249 kg/jour pour 2450 sujets, soit 101.6g/tête/jour. Ce chiffre est légèrement supérieur à la norme (95-100g) pour des poulets de chair à ce stade. Une légère réduction de la quantité servie le soir, combinée à une distribution plus fractionnée, pourrait réduire le gaspillage alimentaire.',
    priority: 'low',
    context: 'Basé sur : 10 jours d\'enregistrements · Moyenne 249 kg/j · Stade de croissance estimé',
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: 'sug-4',
    title: 'Alerte qualité eau — Test recommandé',
    content: 'En saison des pluies, la qualité de l\'eau d\'abreuvement peut se dégrader rapidement (contamination fécale, prolifération bactérienne). Votre dernier test remonte à 5 jours et était positif. Un test mensuel est conseillé, surtout si vos sources sont des puits ou forages non couverts.',
    priority: 'medium',
    context: 'Basé sur : Dernier test labo il y a 5 jours · Saison des pluies · Résultat antérieur positif',
    generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: 'sug-5',
    title: 'Bilan de santé mensuel recommandé',
    content: 'Il est conseillé de faire un bilan de santé complet de votre troupeau chaque mois. Cela inclut une pesée d\'échantillon (5% de l\'effectif), une observation du comportement général, et la vérification des équipements d\'abreuvement et d\'alimentation.',
    priority: 'low',
    context: 'Basé sur : Aucun bilan enregistré depuis 28 jours',
    generatedAt: new Date(Date.now() - 4 * 24 * 60 * 60000).toISOString(),
  },
];

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: 'post-1',
    authorName: 'Éleveur du Littoral',
    anonymous: true,
    farmType: 'poultry',
    category: 'alert',
    content: 'ALERTE : plusieurs cas de Gumboro signalés dans la zone industrielle de Douala. Mes voisins ont perdu 20% de leurs effectifs en 3 jours. Soyez vigilants et vérifiez vos vaccinations !',
    tags: ['Gumboro', 'Douala', 'Alerte'],
    likes: 34,
    replies: 12,
    createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    region: 'Littoral',
  },
  {
    id: 'post-2',
    authorName: 'Mama Berthe Essomba',
    anonymous: false,
    farmType: 'poultry',
    category: 'question',
    content: 'Bonjour à tous. Est-ce que quelqu\'un a déjà utilisé le vaccin Hitchner B1 pour Newcastle ? J\'hésite entre La Sota et B1. Mon vétérinaire n\'est pas disponible et j\'ai les vaccins dans 2 jours.',
    tags: ['Vaccination', 'Newcastle', 'Conseil'],
    likes: 8,
    replies: 15,
    createdAt: new Date(Date.now() - 5 * 60 * 60000).toISOString(),
    region: 'Centre',
  },
  {
    id: 'post-3',
    authorName: 'Ferme Agropastorale Ntem',
    anonymous: false,
    farmType: 'mixed',
    category: 'tip',
    content: 'Astuce pratique : pour réduire le stress thermique pendant l\'harmattan, j\'ai installé des brumisateurs artisanaux avec des tuyaux percés. Résultat : mortalité réduite de 40% et meilleure croissance. Matériel disponible au marché de Mokolo pour moins de 15 000 FCFA.',
    imageUrl: 'https://images.pexels.com/photos/325257/pexels-photo-325257.jpeg?auto=compress&w=600',
    tags: ['Stress thermique', 'Astuce', 'Harmattan'],
    likes: 67,
    replies: 23,
    createdAt: new Date(Date.now() - 8 * 60 * 60000).toISOString(),
    region: 'Nord',
  },
  {
    id: 'post-4',
    authorName: 'Éleveur anonyme',
    anonymous: true,
    farmType: 'poultry',
    category: 'sale',
    content: 'À vendre : lot de 500 poulets de chair prêts à l\'abattage, poids moyen 2.2 kg. Prix : 2 800 FCFA/kg vif, négociable pour quantité. Disponible à partir de samedi. Localisation : Bafoussam, Ouest Cameroun.',
    tags: ['Vente', 'Poulets de chair', 'Bafoussam'],
    likes: 12,
    replies: 8,
    createdAt: new Date(Date.now() - 12 * 60 * 60000).toISOString(),
    region: 'Ouest',
  },
  {
    id: 'post-5',
    authorName: 'Dr. Aminata Diallo',
    anonymous: false,
    farmType: 'poultry',
    category: 'tip',
    content: 'En cette période, veillez à bien désinfecter vos abreuvoirs chaque semaine. L\'eau stagnante est un vecteur majeur de Salmonella et E. coli. Utilisez une solution d\'hypochlorite à 0.5% (eau de javel diluée) — économique et efficace. Rincez bien avant de remettre l\'eau.',
    tags: ['Biosécurité', 'Désinfection', 'Salmonella'],
    likes: 89,
    replies: 31,
    createdAt: new Date(Date.now() - 18 * 60 * 60000).toISOString(),
    region: 'Toutes régions',
  },
  {
    id: 'post-6',
    authorName: 'Marlène Ngoma',
    anonymous: false,
    farmType: 'mixed',
    category: 'question',
    content: 'Quelqu\'un connaît un bon technicien de laboratoire à Brazzaville ? Je cherche quelqu\'un pour faire des prélèvements sur mes cochons. Merci d\'avance.',
    tags: ['Congo Brazzaville', 'Labo', 'Porc'],
    likes: 4,
    replies: 6,
    createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    region: 'Pool',
  },
  {
    id: 'post-7',
    authorName: 'Jean-Pierre Mballa',
    anonymous: false,
    farmType: 'poultry',
    category: 'tip',
    content: 'Résultat après 3 mois d\'utilisation de la plateforme : j\'ai réduit ma mortalité de 8% à 2.5% grâce aux rappels vaccins automatiques et aux consultations rapides. Le calcul est vite fait — 5 000 FCFA par mois, c\'est moins cher qu\'un seul animal perdu.',
    tags: ['Témoignage', 'Résultats', 'ROI'],
    likes: 145,
    replies: 42,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
    region: 'Centre',
  },
  {
    id: 'post-8',
    authorName: 'Éleveur du Pool',
    anonymous: true,
    farmType: 'cattle',
    category: 'alert',
    content: 'Fièvre aphteuse signalée dans plusieurs villages du département du Pool. Les bovins présentent des lésions aux pieds et à la bouche. Évitez tout mouvement d\'animaux jusqu\'à la levée de l\'alerte par les services vétérinaires officiels.',
    tags: ['Fièvre aphteuse', 'Congo', 'Alerte urgente'],
    likes: 78,
    replies: 19,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    region: 'Pool',
  },
];

export const mockWeeklyMortality = [
  { week: 'S-4', mortality: 4, effectif: 2470 },
  { week: 'S-3', mortality: 6, effectif: 2466 },
  { week: 'S-2', mortality: 3, effectif: 2462 },
  { week: 'S-1', mortality: 7, effectif: 2457 },
  { week: 'Cette sem.', mortality: 3, effectif: 2450 },
];

export const mockEffectifHistory = [
  { date: '1 mai', effectif: 2480 },
  { date: '8 mai', effectif: 2475 },
  { date: '15 mai', effectif: 2468 },
  { date: '22 mai', effectif: 2462 },
  { date: '29 mai', effectif: 2455 },
  { date: '5 juin', effectif: 2452 },
  { date: '10 juin', effectif: 2450 },
];
