
const initData = [{
  key: "energy",
  title: "Subvention pour l'amélioration de l'efficacité énergétique",
  detail: "Cette subvention permet aux propriétaires et aux gestionnaires de bâtiments publics dans le district de moderniser leurs installations pour améliorer l'efficacité énergétique. Les fonds couvrent jusqu'à 50 % des coûts des travaux de rénovation.",
  url: "https://example.com/energy"
},
{
  key: "solar",
  title: "Aide financière pour l'installation de panneaux solaires",
  detail: "Le district offre une aide financière pour l'installation de panneaux solaires sur les bâtiments publics et privés, afin de promouvoir les énergies renouvelables. La subvention peut couvrir jusqu'à 40 % du coût total de l'installation.",
  url: "https://example.com/solar"
},
{
  key: "biodiversity",
  title: "Aide pour la création de zones de biodiversité",
  detail: "Cette aide est destinée à la création et à l'entretien de zones de biodiversité dans les parcs et jardins publics du district. Les projets financés incluent la plantation d'espèces locales et la protection des habitats naturels.",
  url: "https://example.com/biodiversity"
},
{
  key: "mobility",
  title: "Subvention pour développer le Vélotourisme - ADEME",
  detail: "L'ADEME accompagne les socioprofessionnels et les collectivités territoriales dans le développement des véloroutes et des services dédiés aux touristes à vélo.",
  url: "https://agirpourlatransition.ademe.fr/collectivites/aides-financieres/20240725/developper-velotourisme?cible=78"
},
{
  key: "waste",
  title: "Financement pour des systèmes de gestion des déchets écologiques",
  detail: "Le district propose un financement aux entreprises et aux collectivités locales pour la mise en place de systèmes de gestion des déchets plus respectueux de l'environnement, incluant le recyclage et la réduction des déchets.",
  url: "https://example.com/waste"
},
{
  key: "agriculture",
  title: "Subvention pour la conversion à l'agriculture biologique",
  detail: "Les exploitations agricoles situées dans le district peuvent bénéficier d'une subvention pour la conversion à l'agriculture biologique. Les fonds peuvent couvrir jusqu'à 30 % des coûts de transition, incluant l'achat de matériel et les formations nécessaires.",
  url: "https://example.com/agriculture"
},
{
  key: "greenroof",
  title: "Aide pour la création de toitures végétalisées",
  detail: "Le district propose une aide pour la création de toitures végétalisées sur les bâtiments publics et privés. Ces toits verts contribuent à l'isolation thermique, à la biodiversité et à la gestion des eaux pluviales.",
  url: "https://example.com/greenroof"
},
{
  key: "water",
  title: "Aide pour la protection des cours d'eau",
  detail: "Cette aide est destinée aux projets visant à protéger et restaurer les cours d'eau du district. Les initiatives financées incluent la réduction de la pollution, la plantation de végétation riveraine et la restauration des écosystèmes aquatiques.",
  url: "https://example.com/water"
},
{
  key: "education",
  title: "Soutien pour des projets éducatifs écologiques",
  detail: "Le district soutient les projets éducatifs visant à sensibiliser le public aux enjeux écologiques. Les écoles, associations et collectivités peuvent obtenir une subvention pour organiser des ateliers, des conférences et des projets pédagogiques sur l'environnement.",
  url: "https://example.com/education"
},
{
  key: "circularity",
  title: "Subvention pour l'adoption de pratiques d'économie circulaire",
  detail: "Cette subvention vise à encourager les entreprises locales à adopter des pratiques d'économie circulaire. Les projets financés incluent le recyclage des matériaux, la réduction des déchets et la réutilisation des ressources dans le cadre de la production.",
  url: "https://example.com/circularity"
}];

db = db.getSiblingDB('subventions');
db.createCollection('subventions');
db.subventions.insertMany(initData); 