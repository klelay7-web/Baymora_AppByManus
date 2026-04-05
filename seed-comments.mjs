import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

const AVATARS = ["👩‍💼", "👨‍💻", "👩‍🎨", "👨‍🍳", "👩‍✈️", "👨‍⚕️", "🧑‍🏫", "👩‍🔬", "🧔", "👱‍♀️", "👩‍🦰", "👨‍🦱", "🧑‍💼", "👸", "🤵", "💃"];

// Pre-generated comments per establishment category
const COMMENT_TEMPLATES = {
  restaurant: [
    { authorName: "Marie-Claire D.", authorCountry: "France", authorTravelStyle: "couple", rating: 5, title: "Une expérience transcendante", visitDate: "Mars 2026", language: "fr" },
    { authorName: "James W.", authorCountry: "United Kingdom", authorTravelStyle: "business", rating: 5, title: "Absolutely extraordinary", visitDate: "Février 2026", language: "en" },
    { authorName: "Isabelle R.", authorCountry: "Suisse", authorTravelStyle: "couple", rating: 5, title: "Un moment hors du temps", visitDate: "Janvier 2026", language: "fr" },
    { authorName: "Takeshi M.", authorCountry: "Japon", authorTravelStyle: "solo", rating: 4, title: "Cuisine remarquable", visitDate: "Décembre 2025", language: "fr" },
    { authorName: "Sofia L.", authorCountry: "Italie", authorTravelStyle: "amis", rating: 5, title: "Indimenticabile!", visitDate: "Novembre 2025", language: "fr" },
  ],
  hotel: [
    { authorName: "Alexandra V.", authorCountry: "France", authorTravelStyle: "couple", rating: 5, title: "Le paradis sur terre", visitDate: "Mars 2026", language: "fr" },
    { authorName: "Robert K.", authorCountry: "United States", authorTravelStyle: "famille", rating: 5, title: "Beyond expectations", visitDate: "Février 2026", language: "en" },
    { authorName: "Nadia B.", authorCountry: "Émirats arabes unis", authorTravelStyle: "couple", rating: 5, title: "Un séjour inoubliable", visitDate: "Janvier 2026", language: "fr" },
    { authorName: "Hans M.", authorCountry: "Allemagne", authorTravelStyle: "business", rating: 4, title: "Erstklassig", visitDate: "Décembre 2025", language: "fr" },
    { authorName: "Chiara F.", authorCountry: "Italie", authorTravelStyle: "couple", rating: 5, title: "Pura magia", visitDate: "Novembre 2025", language: "fr" },
  ],
  bar: [
    { authorName: "Pierre-Antoine G.", authorCountry: "France", authorTravelStyle: "amis", rating: 5, title: "L'art du cocktail", visitDate: "Mars 2026", language: "fr" },
    { authorName: "Emily S.", authorCountry: "Australia", authorTravelStyle: "couple", rating: 5, title: "Best bar experience ever", visitDate: "Février 2026", language: "en" },
    { authorName: "Karim A.", authorCountry: "Maroc", authorTravelStyle: "amis", rating: 4, title: "Ambiance exceptionnelle", visitDate: "Janvier 2026", language: "fr" },
    { authorName: "Yuki T.", authorCountry: "Japon", authorTravelStyle: "solo", rating: 5, title: "Un secret bien gardé", visitDate: "Décembre 2025", language: "fr" },
    { authorName: "Charlotte M.", authorCountry: "Belgique", authorTravelStyle: "couple", rating: 5, title: "Magique", visitDate: "Novembre 2025", language: "fr" },
  ],
  spa: [
    { authorName: "Léa P.", authorCountry: "France", authorTravelStyle: "solo", rating: 5, title: "Renaissance totale", visitDate: "Mars 2026", language: "fr" },
    { authorName: "Sarah J.", authorCountry: "United Kingdom", authorTravelStyle: "couple", rating: 5, title: "Pure bliss", visitDate: "Février 2026", language: "en" },
    { authorName: "Fatima Z.", authorCountry: "Maroc", authorTravelStyle: "amis", rating: 5, title: "Un havre de paix", visitDate: "Janvier 2026", language: "fr" },
    { authorName: "Ingrid N.", authorCountry: "Suède", authorTravelStyle: "solo", rating: 4, title: "Exceptionnel", visitDate: "Décembre 2025", language: "fr" },
    { authorName: "Marco R.", authorCountry: "Italie", authorTravelStyle: "couple", rating: 5, title: "Paradiso del benessere", visitDate: "Novembre 2025", language: "fr" },
  ],
  activity: [
    { authorName: "Thomas B.", authorCountry: "France", authorTravelStyle: "couple", rating: 5, title: "Adrénaline pure", visitDate: "Mars 2026", language: "fr" },
    { authorName: "Jennifer L.", authorCountry: "United States", authorTravelStyle: "famille", rating: 5, title: "Once in a lifetime", visitDate: "Février 2026", language: "en" },
    { authorName: "Olivier D.", authorCountry: "France", authorTravelStyle: "amis", rating: 5, title: "Inoubliable", visitDate: "Janvier 2026", language: "fr" },
    { authorName: "Akiko S.", authorCountry: "Japon", authorTravelStyle: "solo", rating: 4, title: "Magnifique expérience", visitDate: "Décembre 2025", language: "fr" },
    { authorName: "Carlos M.", authorCountry: "Espagne", authorTravelStyle: "couple", rating: 5, title: "Increíble", visitDate: "Novembre 2025", language: "fr" },
  ],
  experience: [
    { authorName: "Amélie C.", authorCountry: "France", authorTravelStyle: "couple", rating: 5, title: "Un voyage sensoriel", visitDate: "Mars 2026", language: "fr" },
    { authorName: "David H.", authorCountry: "Canada", authorTravelStyle: "solo", rating: 5, title: "Life-changing", visitDate: "Février 2026", language: "en" },
    { authorName: "Valentina P.", authorCountry: "Italie", authorTravelStyle: "amis", rating: 5, title: "Esperienza unica", visitDate: "Janvier 2026", language: "fr" },
    { authorName: "Kenji O.", authorCountry: "Japon", authorTravelStyle: "couple", rating: 4, title: "Très enrichissant", visitDate: "Décembre 2025", language: "fr" },
    { authorName: "Elena V.", authorCountry: "Russie", authorTravelStyle: "famille", rating: 5, title: "Extraordinaire", visitDate: "Novembre 2025", language: "fr" },
  ],
};

// Specific content per establishment slug
const SPECIFIC_COMMENTS = {
  "le-cinq-paris": [
    "Le menu dégustation est une symphonie de saveurs. Chaque plat raconte une histoire, du homard bleu en entrée au soufflé final. Le sommelier nous a guidés avec une précision remarquable à travers leur cave exceptionnelle.",
    "The tasting menu was nothing short of spectacular. Chef Le Squer's mastery of French cuisine is evident in every single dish. The crystal chandeliers and marble decor create an atmosphere of pure elegance.",
    "Le cadre est somptueux, la cuisine sublime. Le service est d'une discrétion et d'une attention rares. Le chariot de fromages est à lui seul un spectacle. Un moment hors du temps que je recommande sans réserve.",
    "Les saveurs sont d'une précision chirurgicale. Le plat signature au homard est un chef-d'œuvre. Seul petit bémol : la salle peut être un peu bruyante le vendredi soir, mais rien qui gâche l'expérience.",
    "Un dîner qui restera gravé dans ma mémoire. L'accord mets-vins est d'une justesse absolue. Le personnel connaît chaque détail de chaque plat. C'est le sommet de la gastronomie française.",
  ],
  "plaza-athenee-paris": [
    "La suite Eiffel offre une vue à couper le souffle. Se réveiller face à la Tour illuminée est un privilège rare. Le spa Dior est une parenthèse de luxe absolu. Le petit-déjeuner en chambre est un festin.",
    "Every detail is perfection — from the Dior amenities to the impeccable turndown service. The courtyard restaurant feels like dining in a Parisian dream. Worth every penny for a special occasion.",
    "L'avenue Montaigne à nos pieds, le service irréprochable, la décoration d'un raffinement exquis. Le bar du Plaza est devenu notre rendez-vous parisien. Un palace qui mérite pleinement sa réputation.",
    "Le restaurant gastronomique est une expérience en soi. La terrasse intérieure avec ses plantes grimpantes est magique. Le concierge a organisé une visite privée du Louvre — service impeccable.",
    "Un séjour de rêve pour notre anniversaire de mariage. La chambre était décorée de pétales de roses à notre arrivée. Le personnel anticipe chaque besoin. C'est le luxe dans sa forme la plus pure.",
  ],
  "canaves-oia-santorini": [
    "La piscine à débordement privée face à la caldeira est un rêve éveillé. Chaque matin, le petit-déjeuner servi sur notre terrasse avec cette vue... il n'y a pas de mots. L'architecture blanche immaculée est sublime.",
    "We stayed in the Epitome Suite and it was beyond anything we imagined. The private pool overlooking the caldera, the sunset from our terrace — pure magic. The staff remembered our names from day one.",
    "Le coucher de soleil depuis notre suite est le plus beau spectacle naturel que j'aie jamais vu. Le restaurant propose une cuisine grecque réinventée avec finesse. Le transfert en bateau privé depuis le port est un plus.",
    "Architecture cycladic contemporaine parfaite. Chaque détail est pensé — des matériaux naturels aux lignes épurées. Le spa est un havre de paix. Seul regret : ne pas avoir réservé plus longtemps.",
    "Notre lune de miel de rêve. Le personnel a organisé un dîner privé au bord de la piscine avec bougies et musicien. La vue sur la mer Égée est hypnotique. Un endroit hors du commun.",
  ],
  "aman-tokyo": [
    "Le lobby en camphor wood vieux de 300 ans crée une atmosphère de sérénité absolue dès l'entrée. La chambre de 71 m² est un sanctuaire minimaliste parfait. Le spa onsen est une expérience transcendante.",
    "The most serene hotel I've ever stayed in. The blend of Japanese minimalism with modern luxury is flawless. The kaiseki dinner at Musashi was a culinary journey through Japan's finest traditions.",
    "La piscine de 30 mètres surplombant la ville est spectaculaire. Le petit-déjeuner japonais traditionnel est une cérémonie en soi. Le personnel est d'une discrétion et d'une attention remarquables.",
    "Vue sur le Palais Impérial depuis notre chambre. Le jardin zen du spa invite à la méditation. Chaque matériau — washi paper, pierre naturelle, bois — raconte l'histoire du Japon. Un lieu unique au monde.",
    "Séjour business transformé en retraite spirituelle. L'Aman a cette capacité rare de vous faire oublier que vous êtes au cœur de Tokyo. Le service est invisible mais omniprésent. Perfection japonaise.",
  ],
  "la-mamounia-marrakech": [
    "Les jardins centenaires sont un écrin de verdure au cœur de la médina. Le hammam royal est une expérience sensorielle complète. Le thé à la menthe servi au bord de la piscine est un rituel sacré.",
    "Churchill's favourite hotel lives up to its legendary reputation. The blend of Art Deco and Moroccan craftsmanship is breathtaking. The riads are private paradises within a paradise.",
    "Le restaurant marocain est un voyage culinaire extraordinaire. Les zellige, les stucs, les boiseries... chaque centimètre carré est une œuvre d'art. Le personnel est d'une gentillesse désarmante.",
    "Notre suite donnait sur les jardins avec l'Atlas en toile de fond. Le spa est le plus beau que j'aie visité. Le couscous du vendredi est une institution. Un palace qui transcende le temps.",
    "Marrakech dans toute sa splendeur. La piscine chauffée en hiver, les orangers en fleur, le chant des oiseaux au petit matin. Un lieu magique où l'on se sent comme un sultan. Absolument inoubliable.",
  ],
  "the-mark-hotel-new-york": [
    "La suite penthouse avec terrasse sur Central Park est le summum du luxe new-yorkais. Le room service par Jean-Georges est un privilège rare. Le bar est le rendez-vous du tout-Manhattan.",
    "Best hotel in NYC, hands down. The Jean-Georges restaurant downstairs is phenomenal. The black-and-white Art Deco lobby sets the tone for a truly sophisticated stay. Impeccable service.",
    "L'emplacement est parfait — Upper East Side, à deux pas du Met et de Central Park. Le design mêle Art Déco et contemporain avec une élégance rare. Le concierge a réservé des places impossibles à Broadway.",
    "Séjour business de 5 nuits. Le fitness center est excellent, le room service disponible 24h/24 avec une qualité de restaurant étoilé. Le personnel connaît vos préférences dès le deuxième jour.",
    "Notre pied-à-terre new-yorkais préféré. La terrasse du penthouse offre une vue à 360° sur Manhattan. Le brunch du dimanche est une institution. Un hôtel qui comprend le luxe discret.",
  ],
  "four-seasons-bali": [
    "Les villas avec piscine privée nichées dans la jungle sont un rêve tropical. Le spa balinais est une expérience spirituelle. Le petit-déjeuner face aux rizières en terrasse est magique.",
    "A true sanctuary in Ubud. The yoga pavilion overlooking the river valley is the most peaceful place I've ever practiced. The Balinese cooking class was a highlight of our entire trip.",
    "La villa au bord de la rivière Ayung est un paradis. Les sons de la nature, les offrandes fleuries chaque matin, le personnel souriant... Bali dans sa plus belle expression. Le restaurant Ayung Terrace est sublime.",
    "Retraite bien-être de 7 jours. Le programme de méditation et yoga a transformé mon rapport au stress. Les soins au spa utilisent des ingrédients locaux — curcuma, gingembre, fleurs de frangipanier.",
    "Notre lune de miel de rêve dans la jungle balinaise. Le dîner aux chandelles au bord de la piscine à débordement, avec les sons de la forêt tropicale en fond... un moment suspendu hors du temps.",
  ],
  "nobu-marrakech": [
    "La fusion nippo-marocaine est audacieuse et parfaitement maîtrisée. Le black cod miso est divin. Le cadre dans les jardins de La Mamounia ajoute une dimension magique à l'expérience.",
    "Nobu never disappoints, but this Marrakech outpost is something special. The terrace dining under the stars with Moroccan-Japanese fusion — genius. The sake selection is impressive.",
    "Le tartare de thon est le meilleur que j'aie goûté. L'ambiance est à la fois festive et raffinée. Le personnel maîtrise parfaitement le menu et les accords. Une adresse incontournable à Marrakech.",
    "Dîner entre amis mémorable. Les plats à partager permettent de goûter à tout. Le dessert au matcha et à la fleur d'oranger est une trouvaille. Réservez en terrasse pour la vue sur les jardins.",
    "La rencontre improbable entre le Japon et le Maroc fonctionne à merveille. Le service est impeccable, le cadre somptueux. Seul bémol : les prix sont élevés même pour Nobu, mais la qualité est au rendez-vous.",
  ],
  "le-comptoir-darna-marrakech": [
    "L'ambiance est électrique ! Les danseuses orientales, la musique live, les plats qui défilent... c'est une fête des sens. Le couscous royal est généreux et savoureux. Une soirée inoubliable.",
    "The most fun dining experience in Marrakech. The belly dancers, the live music, the incredible Moroccan food — it's a full sensory experience. Book the terrace for the best atmosphere.",
    "Le tajine d'agneau aux pruneaux fond dans la bouche. L'ambiance est unique — entre restaurant gastronomique et cabaret oriental. Le personnel est chaleureux et attentionné. À ne pas manquer.",
    "Soirée entre amis parfaite. La pastilla au pigeon est un chef-d'œuvre. L'ambiance monte crescendo au fil de la soirée. Le thé à la menthe en fin de repas est un moment de grâce.",
    "Un incontournable de Marrakech depuis des années. Chaque visite est différente mais toujours exceptionnelle. Le méchoui est le meilleur de la ville. L'atmosphère festive est contagieuse.",
  ],
  "wine-tasting-santorini": [
    "La dégustation de vins volcaniques face au coucher de soleil est une expérience unique au monde. L'Assyrtiko est une révélation. Le sommelier est passionné et pédagogue. Un moment magique.",
    "The volcanic wines of Santorini are unlike anything else. Tasting them while watching the sun set over the caldera — there's no better way to experience Greek wine culture. Highly recommend the Vinsanto.",
    "Les vignes poussent dans la lave volcanique, ce qui donne des vins d'une minéralité exceptionnelle. La visite des caves creusées dans la roche est fascinante. Le Nykteri blanc est notre coup de cœur.",
    "Expérience œnologique inoubliable. Le guide explique l'histoire millénaire de la viticulture santorinienne avec passion. Les accords mets-vins avec les produits locaux sont parfaits.",
    "Une après-midi parfaite entre amis. Les 6 vins dégustés étaient tous remarquables. La vue depuis la terrasse du domaine est spectaculaire. Le Vinsanto dessert est un nectar divin.",
  ],
  "tsukiji-outer-market-tokyo": [
    "Se lever à 5h du matin pour le marché aux poissons vaut chaque minute de sommeil perdue. Le thon frais du matin est incomparable. Les petits stands de street food sont authentiques et délicieux.",
    "The energy of this market is incredible. Fresh sushi at 6am that puts most restaurants to shame. The tamagoyaki (egg omelet) stands are a must-try. Arrive early to avoid the crowds.",
    "Le marché extérieur est un labyrinthe de saveurs. Les brochettes de poulpe grillé, les huîtres fraîches, le wasabi râpé à la main... chaque stand est une découverte. Un incontournable de Tokyo.",
    "Visite guidée matinale exceptionnelle. Notre guide nous a fait découvrir des stands cachés que les touristes ne trouvent jamais. Le petit-déjeuner sushi au comptoir est une expérience authentique.",
    "L'âme culinaire du Japon se trouve ici. Les artisans du couteau, les vendeurs de thé matcha, les maîtres sushi... c'est un musée vivant de la gastronomie japonaise. À visiter absolument.",
  ],
  "golden-gai-tokyo": [
    "Se perdre dans les ruelles de Golden Gai est une aventure nocturne unique. Chaque bar a sa personnalité — jazz, rock, anime, littérature. Les barmen sont des personnages fascinants.",
    "Six tiny bars in one night, each with its own character. The jazz bar on the second floor of a building barely wider than my shoulders was the highlight. Pure Tokyo magic.",
    "L'ambiance est intime et authentique. Les bars de 6 places créent des rencontres improbables. Le whisky japonais servi dans ces lieux minuscules prend une saveur particulière. Tokyo nocturne à son meilleur.",
    "Notre guide local nous a emmenés dans des bars cachés inaccessibles aux touristes. Le bar à saké tenu par un ancien moine bouddhiste est une expérience philosophique autant que gustative.",
    "Golden Gai est le cœur battant du Tokyo underground. Les néons, les escaliers étroits, les conversations avec des inconnus... c'est le Japon authentique loin des circuits touristiques.",
  ],
  "speakeasy-jazz-ny": [
    "Trouver l'entrée cachée fait partie du charme. Une fois à l'intérieur, le voyage dans le temps est total — jazz live, cocktails prohibition-era, lumière tamisée. Un secret bien gardé de Manhattan.",
    "The best speakeasy in NYC. The live jazz trio was phenomenal, the Old Fashioned was perfectly crafted, and the atmosphere transported us straight to the 1920s. Don't miss the absinthe ritual.",
    "L'ambiance feutrée, le jazz en fond, les cocktails d'auteur... c'est le New York des films noirs. Le bartender est un artiste qui crée des cocktails sur mesure selon vos goûts. Magique.",
    "Soirée entre amis parfaite. Le mot de passe pour entrer ajoute une touche de mystère. Les cocktails sont parmi les meilleurs que j'aie goûtés. Le set de jazz du vendredi soir est exceptionnel.",
    "Un bar qui mérite sa réputation underground. La carte des cocktails change chaque saison. Le Manhattan fumé est une révélation. Seul bémol : difficile d'avoir une table sans réservation le week-end.",
  ],
  "rooftop-bar-ny": [
    "La vue à 360° sur Manhattan depuis le 60ème étage est vertigineuse. Les cocktails sont à la hauteur du panorama. Au coucher du soleil, la skyline s'illumine — un spectacle hypnotique.",
    "Best rooftop bar in NYC, period. The Empire State Building feels close enough to touch. The signature cocktail with gold leaf is Instagram-worthy and actually delicious. Book a table at sunset.",
    "Le champagne coule, la vue est irréelle, l'ambiance est festive mais élégante. Le DJ set du samedi soir transforme le rooftop en club privé. Un incontournable de la nuit new-yorkaise.",
    "Célébration d'anniversaire parfaite. Le personnel a décoré notre table avec des bougies et des fleurs. La vue sur Brooklyn Bridge et la Statue de la Liberté est à couper le souffle.",
    "New York à ses pieds. Les cocktails sont créatifs et bien exécutés. L'ambiance change du coucher de soleil à la nuit tombée — de contemplative à festive. Réservez impérativement.",
  ],
  "helicopter-tour-ny": [
    "Survoler Manhattan en hélicoptère est une expérience à vivre au moins une fois. La Statue de la Liberté vue du ciel, Central Park en miniature, les gratte-ciels qui défilent... époustouflant.",
    "The 30-minute tour over Manhattan was the highlight of our NYC trip. Seeing the city from above puts everything in perspective. The pilot was knowledgeable and made us feel completely safe.",
    "Vol au coucher du soleil — le timing parfait. La skyline de Manhattan dorée par le soleil couchant est un spectacle inoubliable. Le pilote adapte le vol selon la météo pour la meilleure vue.",
    "Cadeau d'anniversaire pour mon mari. Son sourire en survolant l'Empire State Building valait tout l'or du monde. Le briefing de sécurité est rassurant. Photos incroyables garanties.",
    "Expérience premium avec champagne à bord. Le vol de nuit au-dessus de Times Square illuminé est magique. Seul conseil : réservez le siège avant pour la meilleure vue et les meilleures photos.",
  ],
  "spa-ubud-bali": [
    "Le spa niché dans la jungle avec vue sur les rizières en terrasse est un sanctuaire de paix. Le massage balinais aux huiles essentielles locales est le meilleur que j'aie jamais reçu.",
    "A transformative wellness experience. The sound of the river, the scent of frangipani, the skilled therapists — everything aligns for total relaxation. The flower bath ritual is pure magic.",
    "Le soin signature de 3 heures est un voyage sensoriel complet. Le gommage au curcuma, le bain de fleurs, le massage aux pierres chaudes... je suis ressortie transformée. Un lieu sacré.",
    "Retraite yoga et spa de 5 jours. Le programme personnalisé a dépassé toutes mes attentes. Les thérapeutes sont d'une douceur et d'une compétence remarquables. La cuisine healthy est délicieuse.",
    "Le cadre est à couper le souffle — la jungle tropicale, le chant des oiseaux, la rivière en contrebas. Le massage aux herbes médicinales balinaises est une tradition ancestrale préservée avec soin.",
  ],
  "sunset-temple-bali": [
    "Le coucher de soleil depuis le temple de Tanah Lot est le plus beau spectacle naturel de Bali. La cérémonie au crépuscule avec les chants et l'encens crée une atmosphère mystique inoubliable.",
    "Watching the sun set behind Tanah Lot temple while waves crash against the rocks below — it's spiritual even if you're not religious. The guided tour added incredible historical context.",
    "La visite guidée au coucher du soleil est une expérience spirituelle profonde. Le guide explique la signification de chaque offrande, chaque prière. Le temple semble flotter sur l'océan au crépuscule.",
    "Arrivez 2 heures avant le coucher du soleil pour explorer les grottes et les jardins. La lumière dorée sur le temple est un rêve de photographe. L'atmosphère est paisible malgré les visiteurs.",
    "Un moment de grâce absolue. Les Balinais en prière, le soleil qui embrase l'horizon, le son des vagues... on comprend pourquoi Bali est l'île des dieux. Une expérience qui marque l'âme.",
  ],
  "rice-terrace-trek-bali": [
    "La randonnée à travers les rizières de Tegallalang est un voyage dans le temps. Les paysages sont d'une beauté saisissante. Notre guide local nous a expliqué le système d'irrigation ancestral subak.",
    "The trek through the rice terraces was the most beautiful hike I've ever done. The emerald green of the paddies against the blue sky — no photo does it justice. Our guide was incredibly knowledgeable.",
    "Lever de soleil sur les rizières en terrasse — un spectacle qui justifie le réveil à 4h du matin. Le petit-déjeuner servi dans une cabane au milieu des rizières est un moment de bonheur pur.",
    "Randonnée de 3 heures parfaite pour tous les niveaux. Le guide adapte le rythme et partage des anecdotes fascinantes sur la culture balinaise. Le déjeuner dans un warung local est authentique.",
    "Les rizières de Bali sont un chef-d'œuvre de l'humanité. Marcher entre les terrasses sculptées depuis des siècles est une leçon d'humilité. Le guide nous a appris à planter du riz — moment inoubliable.",
  ],
  "riad-fes-marrakech": [
    "Le riad est un bijou caché dans la médina. La cour intérieure avec sa fontaine et ses orangers est un havre de paix. Le hammam privé est une expérience sensorielle complète.",
    "Stepping through the unassuming door into this riad was like entering another world. The mosaic tilework, the rooftop terrace overlooking the medina, the mint tea ceremony — pure Moroccan magic.",
    "L'accueil est d'une chaleur exceptionnelle. Le personnel nous a fait sentir comme des invités royaux. Le dîner sur la terrasse avec vue sur les toits de la médina est un moment suspendu.",
    "Le hammam traditionnel suivi d'un massage à l'huile d'argan est le meilleur soin que j'aie reçu. Les zellige et les stucs sont d'une finesse remarquable. Un lieu authentique et raffiné.",
    "Notre refuge à Marrakech. Le silence du riad contraste avec l'effervescence de la médina juste derrière la porte. Le petit-déjeuner marocain — msemen, amlou, jus d'orange frais — est un festin.",
  ],
  "sushi-omakase-tokyo": [
    "Le chef Tanaka est un artiste. Chaque pièce de sushi est sculptée avec une précision millimétrique. Le thon otoro fond sur la langue. Le comptoir en hinoki centenaire ajoute à la magie du lieu.",
    "The 18-course omakase was a masterclass in Japanese cuisine. Each piece of nigiri was a revelation. The uni from Hokkaido was the best I've ever tasted. Book months in advance — it's worth the wait.",
    "L'expérience omakase la plus intime de Tokyo. 8 places au comptoir, le chef devant vous, chaque geste est un spectacle. Le wasabi frais râpé à la main fait toute la différence.",
    "Le poisson du jour dicte le menu — c'est la philosophie du chef. La fraîcheur est absolue, les saveurs sont pures. Le saké sélectionné pour chaque plat est un accord parfait.",
    "Réservation obtenue après 3 mois d'attente — et chaque jour d'attente en valait la peine. Le chef explique chaque poisson, sa provenance, sa saison. C'est une leçon de gastronomie autant qu'un repas.",
  ],
  "jazz-club-marrakech": [
    "Le jazz résonne dans les voûtes du riad avec une acoustique parfaite. Les musiciens marocains mêlent jazz et gnawa avec une virtuosité rare. Les cocktails aux épices locales sont créatifs.",
    "A hidden gem in the medina. The fusion of jazz with traditional Moroccan music is unlike anything I've heard before. The intimate setting with candlelight and cushions creates pure magic.",
    "L'ambiance est envoûtante. Le trio jazz-gnawa crée une musique hypnotique. Le cocktail au safran et à la fleur d'oranger est une merveille. Un lieu secret que peu de touristes connaissent.",
    "Soirée mémorable dans ce club caché. L'entrée discrète dans la médina ajoute au mystère. La musique live est exceptionnelle. Le personnel est accueillant et les prix raisonnables pour la qualité.",
    "Le meilleur club de jazz d'Afrique du Nord. Les jam sessions du jeudi soir attirent des musiciens du monde entier. L'atmosphère est intime, chaleureuse, authentique. Un must à Marrakech.",
  ],
  "sunset-cruise-santorini": [
    "La croisière au coucher du soleil autour de la caldeira est le moment fort de notre séjour à Santorin. Le champagne, les eaux cristallines, le soleil qui plonge dans la mer Égée... parfait.",
    "Sailing around the caldera as the sun sets behind Oia — there's nothing more romantic. The captain knew the perfect spots for swimming in the hot springs. The BBQ dinner on board was excellent.",
    "Le catamaran privé nous a emmenés dans des criques inaccessibles par la route. La baignade dans les sources chaudes volcaniques est une expérience unique. Le dîner à bord face au coucher de soleil est magique.",
    "Croisière en couple parfaite. L'équipage est aux petits soins. Le champagne coule, les couleurs du ciel changent minute après minute. Les photos sont spectaculaires. Réservez le catamaran privé.",
    "La meilleure façon de découvrir Santorin. Depuis la mer, les villages blancs perchés sur les falaises sont encore plus impressionnants. La baignade au pied du volcan est surréaliste.",
  ],
  "cooking-class-santorini": [
    "Apprendre à cuisiner grec avec une grand-mère santorinienne est une expérience authentique et touchante. La moussaka maison, les dolmades, le tzatziki... tout était délicieux et fait avec amour.",
    "The cooking class exceeded all expectations. Learning to make traditional dishes with local ingredients while hearing stories about Santorini's culinary heritage — it's cultural immersion at its best.",
    "Le cours de cuisine dans une maison traditionnelle avec vue sur la caldeira est un moment de bonheur pur. La cheffe partage ses recettes familiales avec générosité. Le repas final est un festin.",
    "Activité parfaite en famille. Les enfants ont adoré pétrir la pâte et préparer les spanakopita. La cheffe est patiente et drôle. On repart avec un livret de recettes et des souvenirs impérissables.",
    "La meilleure activité culinaire de notre voyage en Grèce. Les produits locaux — tomates cerises, câpres, fava — sont d'une qualité exceptionnelle. Le vin local accompagne parfaitement le repas.",
  ],
};

async function seedComments() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Get all published establishments
  const [establishments] = await conn.execute(
    'SELECT id, slug, name, category FROM establishments WHERE status = "published"'
  );
  
  console.log(`Found ${establishments.length} published establishments`);
  
  let totalInserted = 0;
  
  for (const estab of establishments) {
    // Check if comments already exist
    const [existing] = await conn.execute(
      'SELECT COUNT(*) as cnt FROM establishmentComments WHERE establishmentId = ?',
      [estab.id]
    );
    
    if (existing[0].cnt > 0) {
      console.log(`  ⏭ ${estab.name} — already has ${existing[0].cnt} comments`);
      continue;
    }
    
    // Get template comments for this category
    const templates = COMMENT_TEMPLATES[estab.category] || COMMENT_TEMPLATES.restaurant;
    const specificContents = SPECIFIC_COMMENTS[estab.slug] || null;
    
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const content = specificContents ? specificContents[i] : `Expérience exceptionnelle à ${estab.name}. Le service est impeccable et l'ambiance est unique. Je recommande vivement cet établissement à tous les voyageurs exigeants.`;
      
      await conn.execute(
        `INSERT INTO establishmentComments 
         (establishmentId, authorName, authorAvatar, authorCountry, authorTravelStyle, rating, title, content, visitDate, helpfulCount, isAiGenerated, isVerified, language, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          estab.id,
          template.authorName,
          AVATARS[i % AVATARS.length],
          template.authorCountry,
          template.authorTravelStyle,
          template.rating,
          template.title,
          content,
          template.visitDate,
          Math.floor(Math.random() * 25) + 3, // 3-27 helpful votes
          true,
          Math.random() > 0.4, // 60% verified
          template.language,
          "published",
        ]
      );
      totalInserted++;
    }
    
    console.log(`  ✅ ${estab.name} — ${templates.length} comments inserted`);
  }
  
  console.log(`\n✅ Total: ${totalInserted} comments inserted for ${establishments.length} establishments`);
  
  await conn.end();
}

seedComments().catch(e => { console.error(e); process.exit(1); });
