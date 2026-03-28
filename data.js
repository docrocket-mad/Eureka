// ═══════════════════════════════════════════════════════
// data.js — Eureka! Chemistry Database
// ═══════════════════════════════════════════════════════

const STARTER_ATOMS = ['H','O','C','N'];

const ATOM_UNLOCKS = {
  // Wave 1: reachable from starters (H,O,C,N)
  H2O:         ['S'],       // water → sulfur
  CO2:         ['Na'],      // carbon dioxide → sodium
  NH3:         ['Cl'],      // ammonia → chlorine
  // Wave 2: reachable once S,Na,Cl are unlocked
  NaCl:        ['Fe'],      // salt → iron
  ATMOSPHERE:  ['Ca'],      // atmosphere → calcium
  H2S:         ['P'],       // hydrogen sulfide → phosphorus
  // Wave 3: reachable once Fe,Ca,P are unlocked
  STEEL:       ['Mg'],      // steel → magnesium
  BONES:       ['K'],       // bone → potassium
  // Wave 4: reachable once Mg,K are unlocked
  MgO:         ['Al'],      // magnesium oxide → aluminum
  CEMENT:      ['Si'],      // cement → silicon
};

const E = {
  // ── STARTER ATOMS (first 4 always available) ──
  H:  { id:'H',  name:'Hydrogen',   symbol:'H',  sub:'',  emoji:'⚛️', tier:'atom', color:'#FF6B9D', shadow:'rgba(255,107,157,0.5)', tc:'white',
        fact:'The most abundant element in the universe. Stars are basically giant balls of hydrogen trying to explode. Mostly succeeding.' },
  O:  { id:'O',  name:'Oxygen',     symbol:'O',  sub:'',  emoji:'💨', tier:'atom', color:'#FF4444', shadow:'rgba(255,68,68,0.5)', tc:'white',
        fact:'Makes up 21% of our atmosphere. Without it you have about 4 minutes. Appreciate it.' },
  C:  { id:'C',  name:'Carbon',     symbol:'C',  sub:'',  emoji:'⬛', tier:'atom', color:'#666677', shadow:'rgba(100,100,120,0.5)', tc:'white',
        fact:'The backbone of ALL life on Earth. Also makes up diamonds, pencils, and coal. Very versatile atom. Shows up everywhere.' },
  N:  { id:'N',  name:'Nitrogen',   symbol:'N',  sub:'',  emoji:'💙', tier:'atom', color:'#4477EE', shadow:'rgba(68,119,238,0.5)', tc:'white',
        fact:'78% of the air you breathe is nitrogen. You are literally swimming in it right now. You just can\'t use it without help.' },

  // ── UNLOCKABLE ATOMS ──
  Na: { id:'Na', name:'Sodium',     symbol:'Na', sub:'',  emoji:'✨', tier:'atom', color:'#FFD23F', shadow:'rgba(255,210,63,0.5)', tc:'#333', unlockedBy:'CO2',
        fact:'A soft metal that EXPLODES when it touches water. Yes, explodes. And yet you eat it every day in salt. Chemistry is wild.' },
  Cl: { id:'Cl', name:'Chlorine',   symbol:'Cl', sub:'',  emoji:'💚', tier:'atom', color:'#00CC88', shadow:'rgba(0,204,136,0.5)', tc:'#002', unlockedBy:'NH3',
        fact:'A toxic, yellow-green gas used as a chemical weapon in WWI. Combined with sodium it makes table salt. Perspective is everything.' },
  S:  { id:'S',  name:'Sulfur',     symbol:'S',  sub:'',  emoji:'💛', tier:'atom', color:'#FFAA00', shadow:'rgba(255,170,0,0.5)', tc:'#332', unlockedBy:'H2O',
        fact:'Smells like rotten eggs. Found around volcanoes. Used in gunpowder. Makes your hair curly. Busy atom.' },
  Fe: { id:'Fe', name:'Iron',       symbol:'Fe', sub:'',  emoji:'⚙️', tier:'atom', color:'#BB6633', shadow:'rgba(187,102,51,0.5)', tc:'white', unlockedBy:'NaCl',
        fact:'Makes your blood red by carrying oxygen around your body. Also makes up most of Earth\'s core. It\'s doing a lot.' },
  Ca: { id:'Ca', name:'Calcium',    symbol:'Ca', sub:'',  emoji:'🦴', tier:'atom', color:'#CCCCCC', shadow:'rgba(180,180,180,0.5)', tc:'#333', unlockedBy:'ATMOSPHERE',
        fact:'Your bones are basically calcium. Your teeth too. Milk is basically liquid bones. You\'re welcome for that image.' },
  P:  { id:'P',  name:'Phosphorus', symbol:'P',  sub:'',  emoji:'🔴', tier:'atom', color:'#FF7722', shadow:'rgba(255,119,34,0.5)', tc:'white', unlockedBy:'H2S',
        fact:'Glows in the dark. Essential for DNA. Used in matches and fertilizers. White phosphorus is also terrifyingly flammable. Don\'t touch it.' },
  K:  { id:'K',  name:'Potassium',  symbol:'K',  sub:'',  emoji:'🍌', tier:'atom', color:'#FFCC44', shadow:'rgba(255,200,60,0.5)', tc:'#333', unlockedBy:'BONES',
        fact:'Your heart literally cannot beat without potassium. It\'s in bananas. Eat bananas. Also explodes in water even more violently than sodium.' },
  Mg: { id:'Mg', name:'Magnesium',  symbol:'Mg', sub:'',  emoji:'⚡', tier:'atom', color:'#AADDFF', shadow:'rgba(150,200,255,0.5)', tc:'#333', unlockedBy:'STEEL',
        fact:'Burns with a blindingly bright white flame — so bright you literally cannot look at it. Used in flares and fireworks. Also in your muscles.' },
  Al: { id:'Al', name:'Aluminum',    symbol:'Al', sub:'',  emoji:'📐', tier:'atom', color:'#BBCCDD', shadow:'rgba(180,200,220,0.5)', tc:'#333', unlockedBy:'MgO',
        fact:'The most abundant metal in Earth\'s crust. Used to be more valuable than gold — Napoleon served dinner on aluminum plates to impress guests. Then we figured out cheap extraction and now it wraps leftovers.' },
  Si: { id:'Si', name:'Silicon',     symbol:'Si', sub:'',  emoji:'💎', tier:'atom', color:'#8899BB', shadow:'rgba(130,150,190,0.5)', tc:'white', unlockedBy:'CEMENT',
        fact:'The second most abundant element in Earth\'s crust. Makes up most sand and rocks. Also the thing your phone\'s brain is made of. From beach to processor. What a glow-up.' },

  // ── MOLECULES ──
  H2:  { id:'H2',  name:'Hydrogen Gas',  symbol:'H₂',  sub:'gas',  emoji:'🎈', tier:'molecule', color:'#FF9BB5', shadow:'rgba(255,107,157,0.4)', tc:'white',
         fact:'Two hydrogen atoms holding hands. Extremely flammable. The Hindenburg was full of it. We now use helium for blimps. Lesson learned.' },
  O2:  { id:'O2',  name:'Oxygen Gas',    symbol:'O₂',  sub:'gas',  emoji:'🌬️', tier:'molecule', color:'#FF5555', shadow:'rgba(255,68,68,0.4)', tc:'white',
         fact:'What you\'re actually breathing. Trees make it as a waste product. Your waste is their food, their waste is your food. Beautiful.' },
  N2:  { id:'N2',  name:'Nitrogen Gas',  symbol:'N₂',  sub:'gas',  emoji:'🌫️', tier:'molecule', color:'#6699FF', shadow:'rgba(100,150,255,0.4)', tc:'white',
         fact:'78% of every breath. Completely inert — won\'t react with almost anything. Just... there. The most politely useless molecule.' },
  H2O: { id:'H2O', name:'Water',         symbol:'H₂O', sub:'',     emoji:'💧', tier:'molecule', color:'#4488FF', shadow:'rgba(68,136,255,0.5)', tc:'white',
         fact:'Two explosive gases walked into a bar and became the thing fish live in. Water is genuinely the strangest molecule and we\'re made of it.' },
  CO2: { id:'CO2', name:'Carbon Dioxide',symbol:'CO₂', sub:'gas',  emoji:'💨', tier:'molecule', color:'#999999', shadow:'rgba(150,150,150,0.4)', tc:'white',
         fact:'You exhale it. Plants inhale it. What you consider waste, a tree considers breakfast. Try not to feel bad about breathing.' },
  CO:  { id:'CO',  name:'Carbon Monoxide',symbol:'CO', sub:'gas',  emoji:'⚠️', tier:'molecule', color:'#777777', shadow:'rgba(120,120,120,0.4)', tc:'white', danger:true,
         fact:'Colorless. Odorless. Undetectable by human senses. Lethal. Bonds to your hemoglobin 200x stronger than oxygen, quietly suffocating you from the inside. This is why we have smoke detectors.' },
  NaCl:{ id:'NaCl',name:'Table Salt',    symbol:'NaCl',sub:'',     emoji:'🧂', tier:'molecule', color:'#EEEEEE', shadow:'rgba(200,200,200,0.4)', tc:'#333',
         fact:'Sodium (explodes in water) + Chlorine (poison gas) = the thing you put on fries. Chemistry is basically magic.' },
  NH3: { id:'NH3', name:'Ammonia',       symbol:'NH₃', sub:'',     emoji:'🌿', tier:'molecule', color:'#55EE77', shadow:'rgba(85,238,119,0.4)', tc:'#002',
         fact:'Smells absolutely horrible. Also responsible for feeding half the humans alive today via fertilizers. You\'re welcome, humanity.' },
  H2S: { id:'H2S', name:'Hydrogen Sulfide',symbol:'H₂S',sub:'gas', emoji:'🦨', tier:'molecule', color:'#BBAA00', shadow:'rgba(190,170,0,0.4)', tc:'white', danger:true,
         fact:'The molecule responsible for farts, rotten eggs, and swamps. Also naturally occurring in volcanoes. In high concentrations: instantly deadly. Low concentrations: merely embarrassing.' },
  SO2: { id:'SO2', name:'Sulfur Dioxide',symbol:'SO₂', sub:'gas',  emoji:'🌋', tier:'molecule', color:'#FFAA33', shadow:'rgba(255,170,51,0.4)', tc:'#332',
         fact:'What volcanoes breathe out. Turns into sulfuric acid when it hits rain. Responsible for acid rain that kills forests. Volcanoes don\'t care.' },
  HCl: { id:'HCl', name:'Hydrochloric Acid',symbol:'HCl',sub:'acid',emoji:'⚗️',tier:'molecule', color:'#77FFBB', shadow:'rgba(100,255,180,0.4)', tc:'#002',
         fact:'Your stomach makes this to digest food. Strong enough to dissolve metal. The reason you don\'t dissolve yourself is a thin layer of mucus. Think about that at dinner.' },
  FeO: { id:'FeO', name:'Iron Oxide (Rust)',symbol:'FeO',sub:'',   emoji:'🟤', tier:'molecule', color:'#CC4422', shadow:'rgba(200,68,34,0.4)', tc:'white',
         fact:'Technically your iron is rotting. Slowly. The Titanic is slowly becoming rust on the ocean floor. Everything returns to dust, or in this case, oxide.' },
  CH4: { id:'CH4', name:'Methane',         symbol:'CH₄', sub:'gas',  emoji:'🐄', tier:'molecule', color:'#88CC44', shadow:'rgba(130,200,68,0.4)', tc:'white',
         fact:'Swamp gas. Cow farts. Natural gas. The simplest hydrocarbon — one carbon surrounded by four hydrogens. Also 80x more potent than CO₂ as a greenhouse gas. Cows are literally a climate problem.' },
  MgO: { id:'MgO', name:'Magnesium Oxide', symbol:'MgO', sub:'',     emoji:'💡', tier:'molecule', color:'#EEEEFF', shadow:'rgba(220,220,255,0.5)', tc:'#333',
         fact:'Burns with a blindingly white flame. So bright it was used in early camera flashes and stage lighting. That white stripe on a firework? Magnesium oxide. You\'re welcome, Fourth of July.' },
  KOH: { id:'KOH', name:'Potassium Hydroxide',symbol:'KOH',sub:'',  emoji:'🧴', tier:'molecule', color:'#FFDD77', shadow:'rgba(255,220,120,0.4)', tc:'#333',
         fact:'Caustic potash. Used to make liquid soap, biodiesel, and alkaline batteries. The reaction of potassium in water is violent enough to ignite the hydrogen produced. Don\'t try this at home. Or anywhere.' },
  NaOH:{ id:'NaOH',name:'Sodium Hydroxide',symbol:'NaOH',sub:'',    emoji:'🧼', tier:'molecule', color:'#DDDDFF', shadow:'rgba(200,200,255,0.4)', tc:'#333',
         fact:'Lye. Caustic soda. Dissolves organic matter including... you. Used to make soap, unclog drains, and cure olives. One of these things is not like the others.' },
  FeCl2:{ id:'FeCl2',name:'Iron(II) Chloride',symbol:'FeCl₂',sub:'',emoji:'🟢', tier:'molecule', color:'#55AA77', shadow:'rgba(85,170,119,0.4)', tc:'white',
         fact:'Green crystals formed when iron dissolves in hydrochloric acid, bubbling hydrogen. Used in water treatment to remove impurities. The iron sacrifices itself so your water stays clean. Noble.' },
  CaCl2:{ id:'CaCl2',name:'Calcium Chloride',symbol:'CaCl₂',sub:'', emoji:'🧊', tier:'molecule', color:'#99BBDD', shadow:'rgba(150,190,220,0.4)', tc:'white',
         fact:'The stuff they dump on icy roads. Absorbs moisture so aggressively it dissolves itself. Also used in cheese-making. Salt\'s more ambitious cousin.' },
  NO:  { id:'NO',  name:'Nitric Oxide',    symbol:'NO',  sub:'gas',  emoji:'❤️', tier:'molecule', color:'#FF6677', shadow:'rgba(255,100,120,0.4)', tc:'white',
         fact:'A signaling molecule in your body that relaxes blood vessels. Won the Nobel Prize in 1998. Also produced by lightning strikes. Your heart and thunderstorms run on the same chemistry.' },
  SiO2:{ id:'SiO2',name:'Silicon Dioxide', symbol:'SiO₂',sub:'',    emoji:'🏖️', tier:'molecule', color:'#DDCC88', shadow:'rgba(220,200,130,0.4)', tc:'#333',
         fact:'Sand. Glass. Quartz. The most common mineral on Earth\'s surface. Melt it, cool it fast, and you get glass. Humanity\'s been doing this for 5,000 years. We still think it\'s cool.' },

  // ── COMPOUNDS ──
  SALT_WATER:    { id:'SALT_WATER',    name:'Salt Water',      symbol:'NaCl·H₂O', sub:'', emoji:'🌊', tier:'compound', color:'#1166BB', shadow:'rgba(17,102,187,0.5)', tc:'white',
                   fact:'The ocean is 3.5% salt, which is why you can\'t drink it. Your kidneys would need MORE water to process it than you\'d gain. The ocean is actually thirsty.' },
  CARBONIC_ACID: { id:'CARBONIC_ACID', name:'Carbonic Acid',   symbol:'H₂CO₃',   sub:'', emoji:'🥤', tier:'compound', color:'#99DDFF', shadow:'rgba(153,221,255,0.4)', tc:'#333',
                   fact:'This is what makes soda fizzy. CO₂ dissolves in water under pressure. Open the bottle, release the pressure — the CO₂ escapes as bubbles. You\'re basically releasing tiny screaming gas molecules.' },
  ACID_RAIN:     { id:'ACID_RAIN',     name:'Acid Rain',       symbol:'H₂SO₃',   sub:'', emoji:'🌧️', tier:'compound', color:'#AAAA33', shadow:'rgba(170,170,51,0.4)', tc:'white',
                   fact:'SO₂ from factories and volcanoes dissolves in rain to make sulfurous acid. Falls from the sky. Kills trees. Dissolves limestone statues. Fun for nobody.' },
  PHOTOSYNTHESIS:{ id:'PHOTOSYNTHESIS',name:'Photosynthesis',  symbol:'CO₂+H₂O→C₆H₁₂O₆',sub:'',emoji:'🌱',tier:'compound',color:'#33BB55',shadow:'rgba(51,187,85,0.5)',tc:'white',
                   fact:'Plants eat CO₂ and water, use sunlight as energy, and poop out oxygen and sugar. Your entire food chain depends on this one reaction. Plants are out here doing the most.' },
  OCEAN:         { id:'OCEAN',         name:'The Ocean',       symbol:'H₂O+NaCl', sub:'', emoji:'🌍', tier:'compound', color:'#005599', shadow:'rgba(0,85,153,0.5)', tc:'white',
                   fact:'The ocean covers 71% of Earth and we\'ve explored less than 20% of it. There are creatures down there we\'ve never seen. The ocean keeps its secrets.' },
  STEEL:         { id:'STEEL',         name:'Steel',           symbol:'Fe+C',      sub:'', emoji:'🗼', tier:'compound', color:'#7788AA', shadow:'rgba(100,120,160,0.4)', tc:'white',
                   fact:'Iron with a tiny bit of carbon — 0.2 to 2%. That\'s it. That small addition makes it 1000x stronger. The Eiffel Tower, skyscrapers, your car — all just iron with a pinch of carbon.' },
  BONES:         { id:'BONES',         name:'Bone',            symbol:'Ca₃(PO₄)₂',sub:'', emoji:'🦴', tier:'compound', color:'#EEEEBB', shadow:'rgba(220,220,180,0.4)', tc:'#333',
                   fact:'Your skeleton is made of calcium phosphate — the exact same mineral found in rocks. You are literally made of rock. Your skeleton completely replaces itself every 10 years.' },
  ATMOSPHERE:    { id:'ATMOSPHERE',    name:'Atmosphere',      symbol:'N₂+O₂+CO₂',sub:'', emoji:'🌤️', tier:'compound', color:'#3366EE', shadow:'rgba(51,102,238,0.5)', tc:'white',
                   fact:'A thin shell of gas clinging to Earth by gravity. Without it, all water boils away, radiation fries everything, and it\'s -270°C at night. The atmosphere is doing a LOT of heavy lifting.' },
  STOMACH_ACID:  { id:'STOMACH_ACID',  name:'Stomach Acid',    symbol:'HCl(aq)',   sub:'', emoji:'🫃', tier:'compound', color:'#44EE77', shadow:'rgba(68,238,119,0.4)', tc:'#002',
                   fact:'pH of 1.5 to 3.5. Strong enough to dissolve a razor blade given enough time. Your stomach lining is protected by a thin layer of mucus. If that ever fails — that\'s an ulcer. Don\'t think about it.' },
  LIFE:          { id:'LIFE',          name:'Life!',           symbol:'C+H+O+N+P+S',sub:'',emoji:'🧬',tier:'compound',color:'#FF44AA',shadow:'rgba(255,68,170,0.6)',tc:'white',
                   fact:'You did it. All life on Earth is built from 6 elements: Carbon, Hydrogen, Oxygen, Nitrogen, Phosphorus, Sulfur. You are a walking chemistry experiment. You are literally stardust that learned to think.' },
  CaO:          { id:'CaO',          name:'Quicklime',       symbol:'CaO',      sub:'', emoji:'🔥', tier:'compound', color:'#EECC88', shadow:'rgba(230,200,130,0.4)', tc:'#333',
                   fact:'Calcium oxide. Made by heating limestone to 900°C. Reacts so violently with water it glows white-hot. Romans used it in construction. Also called "hot lime" because it literally is.' },
  CaCO3:        { id:'CaCO3',        name:'Limestone',       symbol:'CaCO₃',    sub:'', emoji:'🪨', tier:'compound', color:'#CCBB99', shadow:'rgba(200,190,150,0.4)', tc:'#333',
                   fact:'Seashells, chalk, marble, limestone — all calcium carbonate. The White Cliffs of Dover are made of this. Billions of years of sea creatures compressed into rock. You are standing on ancient graves.' },
  FERTILIZER:   { id:'FERTILIZER',   name:'Fertilizer',      symbol:'CO(NH₂)₂', sub:'', emoji:'🌾', tier:'compound', color:'#77BB44', shadow:'rgba(119,187,68,0.5)', tc:'white',
                   fact:'The Haber-Bosch process turns atmospheric nitrogen into ammonia fertilizer. It feeds half the humans alive today. Fritz Haber won a Nobel Prize for it. He also invented chemical weapons. History is complicated.' },
  CEMENT:       { id:'CEMENT',       name:'Cement',          symbol:'Ca(OH)₂',  sub:'', emoji:'🏗️', tier:'compound', color:'#AAAAAA', shadow:'rgba(160,160,160,0.4)', tc:'white',
                   fact:'Quicklime + water = calcium hydroxide = cement. The Romans figured this out 2000 years ago. Their concrete is STILL standing. Modern concrete crumbles in 50 years. We went backwards.' },
  BAKING_SODA:  { id:'BAKING_SODA',  name:'Baking Soda',     symbol:'NaHCO₃',   sub:'', emoji:'🧁', tier:'compound', color:'#FFEEDD', shadow:'rgba(255,230,210,0.4)', tc:'#333',
                   fact:'Sodium bicarbonate. Makes cakes rise, settles stomachs, puts out grease fires, and deodorizes your fridge. The most useful boring-looking white powder in your kitchen. Probably.' },
  NEUTRALIZATION:{ id:'NEUTRALIZATION',name:'Neutralization', symbol:'NaOH+HCl', sub:'', emoji:'⚖️', tier:'compound', color:'#AADDCC', shadow:'rgba(150,220,190,0.4)', tc:'#333',
                   fact:'Acid meets base. They cancel out. Exothermic — releases heat. What\'s left? Salt and water. Every acid-base reaction is secretly just making flavored salt water. Chemistry\'s great punchline.' },
  GLASS:        { id:'GLASS',        name:'Glass',           symbol:'SiO₂+Na₂O',sub:'', emoji:'🪟', tier:'compound', color:'#AADDEE', shadow:'rgba(150,220,240,0.4)', tc:'#333',
                   fact:'Melt sand with soda ash, cool it fast, and the atoms freeze in disorder — no crystal structure. That\'s glass. A liquid pretending to be a solid. Transparent because photons pass right through the chaos.' },
  SMOG:         { id:'SMOG',         name:'Smog',            symbol:'NO₂+SO₂',  sub:'', emoji:'🏭', tier:'compound', color:'#887744', shadow:'rgba(130,120,70,0.4)', tc:'white',
                   fact:'Nitrogen dioxide + sulfur dioxide + sunlight = photochemical smog. The brown haze over cities. London\'s Great Smog of 1952 killed 12,000 people in four days. Clean air is not optional.' },

  // ── DANGER ZONE ☠️ ──
  Cl2:     { id:'Cl2',     name:'Chlorine Gas',    symbol:'Cl₂',   sub:'gas',  emoji:'☠️', tier:'danger', color:'#88FF44', shadow:'rgba(100,220,50,0.6)', tc:'#002', danger:true,
             fact:'⚠️ DANGER ZONE. Used as a chemical weapon in WWI. Heavier than air so it sinks into trenches. Causes your lungs to fill with fluid. Smells like a swimming pool, but way more fatal. The swimming pool smell IS this gas — just very diluted.' },
  TNT:     { id:'TNT',     name:'TNT',             symbol:'C₇H₅N₃O₆',sub:'💥',emoji:'💣',tier:'danger',color:'#FF8800',shadow:'rgba(255,100,0,0.7)',tc:'white',danger:true,
             fact:'⚠️ DANGER ZONE. Trinitrotoluene. Releases energy stored in those nitrogen-oxygen bonds instantaneously. Invented in 1863. Originally used as a yellow dye. Then someone noticed it explodes. Oops. Still used to measure energy in "tons of TNT".' },
  H2O2:    { id:'H2O2',    name:'Hydrogen Peroxide',symbol:'H₂O₂',sub:'',     emoji:'🫧', tier:'danger', color:'#CCDDFF', shadow:'rgba(180,200,255,0.5)', tc:'#333', danger:true,
             fact:'⚠️ DANGER ZONE. Water\'s unstable cousin. An extra oxygen atom that REALLY wants to leave. 3% solution bleaches your hair. 30% will burn through skin. 90% concentration is used as rocket fuel. Yes. Rocket. Fuel.' },
  ACID:    { id:'ACID',    name:'Sulfuric Acid',   symbol:'H₂SO₄', sub:'',     emoji:'🧪', tier:'danger', color:'#FFEE00', shadow:'rgba(255,238,0,0.6)', tc:'#332', danger:true,
             fact:'⚠️ DANGER ZONE. The most industrially produced chemical on Earth. Dissolves almost everything. Generates so much heat when mixed with water that the water boils. You add acid to water, never water to acid. This is not optional advice.' },
  NITROGLYCERIN:{ id:'NITROGLYCERIN',name:'Nitroglycerin',symbol:'C₃H₅N₃O₉',sub:'',emoji:'💥',tier:'danger',color:'#FF2200',shadow:'rgba(255,34,0,0.7)',tc:'white',danger:true,
             fact:'⚠️ DANGER ZONE. So sensitive it can detonate from a slight vibration, temperature change, or a bad vibe. Alfred Nobel invented dynamite by stabilizing it with sand. Then felt so guilty about explosives he created the Nobel Peace Prize. Both facts are true.' },
  OZONE:   { id:'OZONE',   name:'Ozone',           symbol:'O₃',    sub:'',     emoji:'🌐', tier:'danger', color:'#44BBFF', shadow:'rgba(68,187,255,0.5)', tc:'white', danger:true,
             fact:'Three oxygen atoms. In the upper atmosphere: blocks UV radiation and saves all life on Earth. At ground level: toxic air pollutant that damages your lungs. Same molecule, two completely different jobs. Location is everything.' },
  BLEACH:  { id:'BLEACH',  name:'Bleach',          symbol:'NaClO',  sub:'',     emoji:'🪣', tier:'danger', color:'#EEFFEE', shadow:'rgba(200,240,200,0.4)', tc:'#333', danger:true,
             fact:'⚠️ DANGER ZONE. Great at killing bacteria. NEVER mix with ammonia — makes chloramine gas, a chemical weapon. NEVER mix with vinegar — makes chlorine gas. NEVER mix with hydrogen peroxide. Bleach is the difficult coworker of your cleaning cabinet.' },
  MUSTARD_GAS:{ id:'MUSTARD_GAS',name:'Mustard Gas',symbol:'C₄H₈Cl₂S',sub:'',emoji:'☣️',tier:'danger',color:'#CCAA00',shadow:'rgba(200,170,0,0.7)',tc:'white',danger:true,
             fact:'⚠️ DANGER ZONE. Not actually a gas — an oily liquid. Not actually mustard. Banned by the Geneva Protocol in 1925. Causes massive blistering of skin and lungs. You can make it by combining sulfur and chlorine compounds. Which is why we\'re not telling you the exact recipe.' },
  HCN:     { id:'HCN',     name:'Hydrogen Cyanide', symbol:'HCN',    sub:'',    emoji:'💀', tier:'danger', color:'#CC77FF', shadow:'rgba(200,120,255,0.6)', tc:'white', danger:true,
             fact:'⚠️ DANGER ZONE. Smells like almonds — but only 40% of people can detect it. Blocks cellular respiration. Your cells literally forget how to use oxygen. Used in gold mining and... worse things throughout history.' },
  PH3:     { id:'PH3',     name:'Phosphine',        symbol:'PH₃',   sub:'gas', emoji:'👻', tier:'danger', color:'#77FF99', shadow:'rgba(100,255,150,0.6)', tc:'#002', danger:true,
             fact:'⚠️ DANGER ZONE. Spontaneously ignites in air. The original will-o\'-the-wisp — mysterious lights floating over swamps at night? That was phosphine from decomposing organic matter. Ghosts are just chemistry.' },
  CHLORAMINE:{ id:'CHLORAMINE',name:'Chloramine Gas',symbol:'NH₂Cl', sub:'gas', emoji:'🫁', tier:'danger', color:'#AAFF44', shadow:'rgba(170,255,68,0.6)', tc:'#002', danger:true,
             fact:'⚠️ DANGER ZONE. What happens when you mix bleach and ammonia. Your cleaning products can combine into a chemical weapon in your bathroom. Burns eyes, throat, lungs, and everything else. READ. THE. LABELS.' },
  PHOSGENE:{ id:'PHOSGENE', name:'Phosgene',        symbol:'COCl₂', sub:'gas', emoji:'☣️', tier:'danger', color:'#99DDAA', shadow:'rgba(150,220,170,0.6)', tc:'#002', danger:true,
             fact:'⚠️ DANGER ZONE. Responsible for 85% of chemical weapon deaths in WWI. Smells like freshly cut hay. By the time you smell it, you\'ve already inhaled a lethal dose. Symptoms take 24-48 hours to appear. Truly nightmarish.' },
  NO2:     { id:'NO2',     name:'Nitrogen Dioxide',  symbol:'NO₂',   sub:'gas', emoji:'🟤', tier:'danger', color:'#CC6633', shadow:'rgba(200,100,50,0.6)', tc:'white', danger:true,
             fact:'⚠️ DANGER ZONE. The brown gas in smog. Reddish-brown, acrid, corrosive. Damages lung tissue at low concentrations. Major component of acid rain. Every car exhaust contains this. You breathe it daily in cities.' },
  THERMITE:{ id:'THERMITE', name:'Thermite',         symbol:'Fe₂O₃+Al',sub:'',  emoji:'🌋', tier:'danger', color:'#FF6600', shadow:'rgba(255,100,0,0.7)', tc:'white', danger:true,
             fact:'⚠️ DANGER ZONE. Iron oxide + aluminum powder. Once ignited, burns at 2,500°C — hot enough to melt through steel beams. Used to weld railroad tracks. Cannot be extinguished with water. Water makes it WORSE. Respect thermite.' },
};

const REACTIONS_RAW = [
  // ── Atoms → Diatomic Molecules ──
  [['H','H'],            'H2'],
  [['O','O'],            'O2'],
  [['N','N'],            'N2'],
  [['Cl','Cl'],          'Cl2'],     // ☠️

  // ── Water ──
  [['H2','O'],           'H2O'],
  [['H2','O2'],          'H2O'],     // simplified combustion

  // ── Carbon oxides ──
  [['C','O'],            'CO'],      // limited O → CO
  [['C','O2'],           'CO2'],     // excess O → CO2
  [['CO','O'],           'CO2'],
  [['CO','O2'],          'CO2'],

  // ── Salt ──
  [['Na','Cl'],          'NaCl'],

  // ── Ammonia ──
  [['N','H'],            'NH3'],     // simplified
  [['N2','H2'],          'NH3'],     // Haber process
  [['N','H2'],           'NH3'],

  // ── Methane ──
  [['C','H2'],           'CH4'],
  [['C','H'],            'CH4'],     // simplified
  [['CH4','O2'],         'CO2'],     // combustion

  // ── Sulfur compounds ──
  [['H','S'],            'H2S'],
  [['H2','S'],           'H2S'],
  [['S','O'],            'SO2'],
  [['S','O2'],           'SO2'],

  // ── Halogen acids ──
  [['H','Cl'],           'HCl'],

  // ── Nitric oxide ──
  [['N','O'],            'NO'],
  [['NO','O'],           'NO2'],     // ☠️
  [['NO','O2'],          'NO2'],     // ☠️

  // ── Iron ──
  [['Fe','O'],           'FeO'],
  [['Fe','O2'],          'FeO'],
  [['Fe','C'],           'STEEL'],
  [['Fe','HCl'],         'FeCl2'],

  // ── Calcium ──
  [['Ca','P'],           'BONES'],
  [['Ca','O'],           'CaO'],
  [['CaO','CO2'],        'CaCO3'],
  [['Ca','CO2'],         'CaCO3'],
  [['CaO','H2O'],        'CEMENT'],
  [['Ca','HCl'],         'CaCl2'],
  [['Ca','Cl'],          'CaCl2'],

  // ── Magnesium ──
  [['Mg','O'],           'MgO'],
  [['Mg','O2'],          'MgO'],

  // ── Potassium / Sodium hydroxides ──
  [['K','H2O'],          'KOH'],
  [['Na','H2O'],         'NaOH'],

  // ── Silicon ──
  [['Si','O2'],          'SiO2'],
  [['Si','O'],           'SiO2'],

  // ── Compounds ──
  [['NaCl','H2O'],       'SALT_WATER'],
  [['H2O','CO2'],        'CARBONIC_ACID'],
  [['SALT_WATER','H2O'], 'OCEAN'],
  [['SALT_WATER','NaCl'],'OCEAN'],
  [['N2','O2'],          'ATMOSPHERE'],
  [['CARBONIC_ACID','O2'],'PHOTOSYNTHESIS'],  // conceptual: CO₂+H₂O+light→sugar+O₂
  [['PHOTOSYNTHESIS','ATMOSPHERE'],'LIFE'],
  [['SO2','H2O'],        'ACID_RAIN'],
  [['H2O','HCl'],        'STOMACH_ACID'],
  [['NH3','CO2'],         'FERTILIZER'],
  [['NaOH','CO2'],        'BAKING_SODA'],
  [['NaOH','HCl'],        'NEUTRALIZATION'],
  [['SiO2','NaOH'],       'GLASS'],
  [['SiO2','Na'],         'GLASS'],
  [['NO2','SO2'],          'SMOG'],
  [['NO','SO2'],           'SMOG'],

  // ── Danger Zone ☠️ ──
  [['H2O','O'],          'H2O2'],     // water + atomic O → peroxide
  [['SO2','H2O2'],       'ACID'],     // SO₂ oxidation → H₂SO₄
  [['ACID_RAIN','O'],    'ACID'],     // H₂SO₃ + O → H₂SO₄
  [['ACID_RAIN','O2'],   'ACID'],
  [['NaCl','O'],         'BLEACH'],
  [['NaOH','Cl'],        'BLEACH'],
  [['NaOH','Cl2'],       'BLEACH'],
  [['O2','O'],           'OZONE'],
  [['S','Cl'],           'MUSTARD_GAS'],
  [['H2S','Cl2'],        'MUSTARD_GAS'],
  [['CH4','NO2'],        'TNT'],      // hydrocarbon + nitro group → nitro explosive
  [['NH3','O2'],         'NITROGLYCERIN'],  // simplified
  [['NH3','C'],          'HCN'],      // Andrussow process simplified
  [['C','N'],            'HCN'],      // carbon + nitrogen → cyanide
  [['P','H2'],           'PH3'],
  [['P','H'],            'PH3'],
  [['NH3','Cl2'],        'CHLORAMINE'],
  [['BLEACH','NH3'],     'CHLORAMINE'],
  [['CO','Cl2'],         'PHOSGENE'],
  [['FeO','Al'],         'THERMITE'],
  [['FeO','Mg'],         'THERMITE'],
];

function makeKey(a,b) { return [a,b].sort().join('+'); }
const REACTIONS = {};
REACTIONS_RAW.forEach(([pair,result]) => {
  REACTIONS[makeKey(pair[0],pair[1])] = result;
});

const GIZMO_LINES = {
  idle: [
    "Combine two elements to get started!",
    "Try H + H first... go on.",
    "Science waits for no one. Mostly.",
    "I have a PhD you know. Several.",
    "Those atoms won't combine themselves.",
    "What are you waiting for? Discover something!",
    "I once combined sodium and chlorine at a party. I was very popular.",
    "Every atom in your body was forged in a dying star. No pressure.",
  ],
  normal: {
    H2:   "Hydrogen gas! Incredibly flammable. The Hindenburg learned this the hard way.",
    O2:   "Oxygen gas! The stuff keeping you alive. Don't take it for granted.",
    H2O:  "WATER! Two explosive gases walked into a bar and became... drinkable! I love chemistry!",
    N2:   "Nitrogen gas. 78% of every breath and it does absolutely nothing. Freeloading molecule.",
    NaCl: "SALT! An exploding metal + a poison gas = the thing you put on fries. Chefs kiss. 🤌",
    CO2:  "Carbon dioxide! You're exhaling this right now. Plants consider that breakfast.",
    NH3:  "Ammonia! Smells like a thousand cats. Feeds half the world. Complicated legacy.",
    H2S:  "...that's the fart molecule. I'm not judging you. I'm judging it. A little.",
    SO2:  "Sulfur dioxide. What volcanoes breathe out. They're not great neighbors.",
    HCl:  "Hydrochloric acid! Your stomach makes this right now. You're a walking chemistry lab.",
    FeO:  "Rust! You turned iron into sadness. Slowly. Inevitably. Poetically.",
    CH4:  "Methane! Swamp gas, cow emissions, natural gas. Simple but powerful. Like me.",
    MgO:  "Magnesium oxide! That blinding white flash in fireworks? You just made it. Beautiful.",
    KOH:  "Potassium hydroxide! Caustic potash. Makes soap and batteries. Busy molecule.",
    NaOH: "Sodium hydroxide — LYE! Dissolves almost anything organic. Including... nope, not finishing that thought.",
    FeCl2:"Iron chloride! The iron dissolved in acid. Green crystals of sacrifice. Noble.",
    CaCl2:"Calcium chloride! The stuff that melts ice on roads. Winter's nemesis.",
    NO:   "Nitric oxide! Your blood vessels use this to relax. Nobel Prize winner, 1998. Fancy.",
    SiO2: "Silicon dioxide — that's SAND! Also glass. Also quartz. Same molecule, different vibes.",
    STEEL: "STEEL! Iron + a pinch of carbon = 1000x stronger. The power of teamwork!",
    BONES: "BONE! You're literally made of calcium phosphate rocks. You are a rock person.",
    SALT_WATER: "Salt water! 3.5% salt. Undrinkable. Full of sharks. Two reasons to avoid it.",
    CARBONIC_ACID: "Carbonic acid — this is what makes soda fizzy! You're a soda scientist now.",
    ACID_RAIN: "Acid rain. That's what happens when volcanoes and factories misbehave. Disappointing.",
    STOMACH_ACID: "Stomach acid! You have a vat of pH 1.5 acid inside you RIGHT NOW. Sleep well!",
    ATMOSPHERE: "THE ATMOSPHERE! The only thing between you and the void of space! Good job making it!",
    PHOTOSYNTHESIS: "PHOTOSYNTHESIS! The most important reaction on Earth! I'm not crying. YOU'RE crying!",
    OCEAN: "THE OCEAN!! You made the whole ocean!! I need a moment. This is genuinely beautiful.",
    LIFE: "...LIFE. You made LIFE. I've been waiting my whole career for this. *openly weeping*",
    CaO:  "Quicklime! Add water and it gets white-hot. Romans loved it. Dangerous fun.",
    CaCO3:"Limestone! Seashells and marble — same stuff. Billions of years of dead sea creatures.",
    FERTILIZER: "FERTILIZER! The Haber process feeds half the planet. Nobel Prize AND war crimes. Complicated.",
    CEMENT: "CEMENT! Romans built with this 2000 years ago. Their stuff still stands. Ours... less so.",
    BAKING_SODA: "Baking soda! Makes cakes rise, calms stomachs, fights fires. Most useful powder in the kitchen.",
    NEUTRALIZATION: "NEUTRALIZATION! Acid + base = salt water. Chemistry's greatest punchline. Every time.",
    GLASS: "GLASS! Melted sand frozen in chaos. Transparent because photons just fly right through. Wild.",
    SMOG: "Smog. The brown haze of progress. London 1952 — 12,000 people. Clean air matters.",
  },
  danger: {
    CO:          "⚠️ Carbon monoxide... colorless... odorless... I'm opening EVERY window.",
    Cl2:         "☠️ Chlorine gas! Step back. No, further. FURTHER. Keep going.",
    H2O2:        "Hydrogen peroxide! 3% bleaches hair. 90% is ROCKET FUEL. Put. It. DOWN.",
    H2S:         "Hydrogen sulfide. Rotten eggs + instant death at high concentrations. Charming.",
    ACID:        "SULFURIC ACID! Do NOT add water to it. The water will BOIL and splash acid everywhere. I have seen things.",
    OZONE:       "Ozone! Saves all life from UV at 30km up. At ground level? Destroys your lungs. Location matters.",
    BLEACH:      "Bleach. Do NOT mix with ammonia. Do NOT mix with vinegar. Do NOT mix with ANYTHING. It's the difficult coworker of chemicals.",
    TNT:         "...you made TNT. I'm going to stand over here now. Way over HERE. Further. FURTHER.",
    NITROGLYCERIN: "NITROGLYCERIN?! Detonates from a SLIGHT VIBRATION! I'm typing very carefully right now!",
    MUSTARD_GAS: "MUSTARD GAS?! EVERYBODY OUT! THIS IS NOT A DRILL! I QUIT! I UNQUIT BECAUSE SCIENCE BUT STILL!",
    HCN:         "HYDROGEN CYANIDE! Smells like almonds! Stops your cells from breathing! Fun facts NOBODY WANTED!",
    PH3:         "PHOSPHINE! The will-o'-the-wisp molecule! Spontaneously ignites! Ghosts were chemistry ALL ALONG!",
    CHLORAMINE:  "CHLORAMINE GAS! This is literally what happens when you mix bleach and ammonia! READ CLEANING LABELS!",
    PHOSGENE:    "PHOSGENE?! 85% of WWI gas deaths! Smells like fresh hay! I am DEEPLY uncomfortable right now!",
    NO2:         "Nitrogen dioxide! Brown, toxic, in every car exhaust! The invisible price of driving!",
    THERMITE:    "THERMITE! 2,500°C! MELTS STEEL! WATER MAKES IT WORSE! I need to sit down. On a different continent.",
    default:     "☠️ That's... that's very dangerous. I need you to know I had nothing to do with this. My lawyer agrees.",
  },
  no_reaction: [
    "Hmm. Nothing happened. Try something else.",
    "Nope. Chemistry says no.",
    "Not everything reacts. Yet.",
    "Interesting attempt. Wrong, but interesting.",
    "I've seen worse ideas. Not many, but some.",
    "My notes say... no. Definitely no.",
    "That's not a thing. Trust me. I checked.",
    "If that worked, I'd have a Nobel Prize.",
  ],
  unlock: [
    "A new element! The periodic table grows!",
    "Look what you unlocked! Use it wisely. Or unwisely. I'm not your supervisor.",
    "New atom! The possibilities multiply! Dangerously!",
    "Fresh element! Your lab just got more interesting!",
  ]
};
