/* Ankurit — static agronomy data. General reference values; vary by variety, region and weather. */
var MONTHS = {
  en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  hi:['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'],
  mr:['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर']
};

/* stage templates: [stageKey, start % of duration] */
var STAGESETS = {
  cereal:[['germ',0],['tiller',8],['flower',50],['fill',65],['mature',88]],
  legume:[['germ',0],['veg',8],['flower',40],['pod',55],['mature',85]],
  cotton:[['germ',0],['veg',6],['flower',30],['boll',50],['mature',80]],
  fruitveg:[['establish',0],['veg',12],['flower',30],['fruit',40],['harvest',55]],
  tuber:[['germ',0],['veg',10],['tuber',45],['mature',85]],
  cane:[['germ',0],['tiller',12],['grand',30],['mature',75]],
  banana:[['establish',0],['veg',8],['flower',60],['bunch',70],['mature',92]],
  orchard:[['flower',0],['fruit',15],['mature',85]]
};

/* crops: names, category, seasons, duration [min,max] days, soil keys, water, temp, sowing months, stage set, pests, diseases */
var CROPS = [
 {id:'rice',n:{en:'Rice (Paddy)',hi:'धान (चावल)',mr:'भात'},cat:'cereal',s:['kharif'],d:[100,150],soil:['clay','alluvial'],w:'high',t:'20–35°C',sow:[6,7],st:'cereal',p:['stemborer','bph','leaffolder'],ds:['blast','blb','sheathblight']},
 {id:'wheat',n:{en:'Wheat',hi:'गेहूं',mr:'गहू'},cat:'cereal',s:['rabi'],d:[110,130],soil:['loam','alluvial'],w:'medium',t:'15–25°C',sow:[10,11,12],st:'cereal',p:['aphid','termite'],ds:['rust','leafblight']},
 {id:'jowar',n:{en:'Jowar (Sorghum)',hi:'ज्वार',mr:'ज्वारी'},cat:'cereal',s:['kharif','rabi'],d:[100,120],soil:['black','loam'],w:'low',t:'25–32°C',sow:[6,7,9,10],st:'cereal',p:['shootfly','stemborer','faw'],ds:['grainmold','charcoalrot']},
 {id:'bajra',n:{en:'Bajra (Pearl millet)',hi:'बाजरा',mr:'बाजरी'},cat:'cereal',s:['kharif'],d:[75,90],soil:['sandy','loam'],w:'low',t:'25–35°C',sow:[6,7],st:'cereal',p:['shootfly','whitegrub'],ds:['downymildew','ergot']},
 {id:'maize',n:{en:'Maize',hi:'मक्का',mr:'मका'},cat:'cereal',s:['kharif','rabi'],d:[90,120],soil:['loam','welldrained'],w:'medium',t:'21–30°C',sow:[6,7,10,11],st:'cereal',p:['faw','stemborer'],ds:['turcicum','downymildew']},
 {id:'ragi',n:{en:'Ragi (Finger millet)',hi:'रागी (मडुआ)',mr:'नाचणी'},cat:'cereal',s:['kharif'],d:[100,120],soil:['red','loam'],w:'low',t:'20–30°C',sow:[6,7],st:'cereal',p:['stemborer','aphid'],ds:['blast']},
 {id:'tur',n:{en:'Tur (Pigeon pea)',hi:'अरहर (तुअर)',mr:'तूर'},cat:'pulse',s:['kharif'],d:[150,200],soil:['black','loam'],w:'low',t:'20–30°C',sow:[6,7],st:'legume',p:['podborer','podfly'],ds:['wilt','sterility']},
 {id:'chana',n:{en:'Chana (Chickpea)',hi:'चना',mr:'हरभरा'},cat:'pulse',s:['rabi'],d:[90,120],soil:['black','clay'],w:'low',t:'15–25°C',sow:[10,11],st:'legume',p:['podborer','cutworm'],ds:['wilt','dryrootrot']},
 {id:'moong',n:{en:'Moong (Green gram)',hi:'मूंग',mr:'मूग'},cat:'pulse',s:['kharif','zaid'],d:[60,75],soil:['loam','welldrained'],w:'low',t:'25–35°C',sow:[3,6,7],st:'legume',p:['whitefly','thrips'],ds:['yellowmosaic','powdery']},
 {id:'urad',n:{en:'Urad (Black gram)',hi:'उड़द',mr:'उडीद'},cat:'pulse',s:['kharif'],d:[70,90],soil:['loam','clay'],w:'low',t:'25–35°C',sow:[6,7],st:'legume',p:['whitefly','podborer'],ds:['yellowmosaic','leafspot']},
 {id:'soybean',n:{en:'Soybean',hi:'सोयाबीन',mr:'सोयाबीन'},cat:'oil',s:['kharif'],d:[90,110],soil:['black','loam'],w:'medium',t:'20–30°C',sow:[6,7],st:'legume',p:['girdle','spodoptera','stemfly'],ds:['yellowmosaic','rust','charcoalrot']},
 {id:'groundnut',n:{en:'Groundnut',hi:'मूंगफली',mr:'भुईमूग'},cat:'oil',s:['kharif','zaid'],d:[100,130],soil:['sandy','welldrained'],w:'medium',t:'22–30°C',sow:[1,2,6,7],st:'legume',p:['leafminer','whitegrub','aphid'],ds:['tikka','collarrot','rust']},
 {id:'mustard',n:{en:'Mustard',hi:'सरसों',mr:'मोहरी'},cat:'oil',s:['rabi'],d:[110,140],soil:['loam','alluvial'],w:'low',t:'15–25°C',sow:[10,11],st:'legume',p:['aphid'],ds:['alternaria','whiterust']},
 {id:'sunflower',n:{en:'Sunflower',hi:'सूरजमुखी',mr:'सूर्यफूल'},cat:'oil',s:['kharif','rabi','zaid'],d:[90,100],soil:['loam','welldrained'],w:'medium',t:'20–30°C',sow:[1,2,6,7,10],st:'legume',p:['podborer','jassid'],ds:['alternaria','downymildew']},
 {id:'cotton',n:{en:'Cotton',hi:'कपास',mr:'कापूस'},cat:'cash',s:['kharif'],d:[150,180],soil:['black'],w:'medium',t:'21–35°C',sow:[5,6,7],st:'cotton',p:['pinkbollworm','whitefly','jassid','thrips'],ds:['leafcurl','wilt','bollrot']},
 {id:'sugarcane',n:{en:'Sugarcane',hi:'गन्ना',mr:'ऊस'},cat:'cash',s:['annual'],d:[300,540],soil:['loam','black'],w:'high',t:'20–35°C',sow:[1,2,7,8,10,11],st:'cane',p:['shootborer','woollyaphid','whitegrub'],ds:['redrot','smut','wilt']},
 {id:'turmeric',n:{en:'Turmeric',hi:'हल्दी',mr:'हळद'},cat:'spice',s:['kharif'],d:[210,270],soil:['loam','welldrained'],w:'high',t:'20–30°C',sow:[5,6],st:'tuber',p:['shootborer','rhizomescale'],ds:['rhizomerot','leafspot']},
 {id:'onion',n:{en:'Onion',hi:'प्याज',mr:'कांदा'},cat:'veg',s:['kharif','rabi'],d:[110,150],soil:['loam','welldrained'],w:'medium',t:'13–25°C',sow:[6,7,8,10,11,12],st:'tuber',p:['thrips'],ds:['purpleblotch','basalrot']},
 {id:'tomato',n:{en:'Tomato',hi:'टमाटर',mr:'टोमॅटो'},cat:'veg',s:['kharif','rabi','zaid'],d:[120,150],soil:['loam','welldrained'],w:'medium',t:'20–28°C',sow:[1,6,7,9,10],st:'fruitveg',p:['fruitborer','whitefly','leafminer'],ds:['earlyblight','lateblight','leafcurl','bacterialwilt']},
 {id:'potato',n:{en:'Potato',hi:'आलू',mr:'बटाटा'},cat:'veg',s:['rabi'],d:[90,120],soil:['sandy','loam'],w:'medium',t:'15–25°C',sow:[10,11],st:'tuber',p:['aphid','cutworm','tubermoth'],ds:['lateblight','earlyblight']},
 {id:'brinjal',n:{en:'Brinjal',hi:'बैंगन',mr:'वांगी'},cat:'veg',s:['kharif','rabi','zaid'],d:[130,160],soil:['loam','welldrained'],w:'medium',t:'21–30°C',sow:[1,2,6,7,10],st:'fruitveg',p:['sfborer','jassid','whitefly'],ds:['littleleaf','bacterialwilt']},
 {id:'chilli',n:{en:'Chilli',hi:'मिर्च',mr:'मिरची'},cat:'spice',s:['kharif','rabi'],d:[150,180],soil:['loam','black'],w:'medium',t:'20–30°C',sow:[6,7,9,10],st:'fruitveg',p:['thrips','mites','fruitborer'],ds:['leafcurl','anthracnose','powdery']},
 {id:'okra',n:{en:'Okra (Bhindi)',hi:'भिंडी',mr:'भेंडी'},cat:'veg',s:['kharif','zaid'],d:[90,120],soil:['loam','welldrained'],w:'medium',t:'22–35°C',sow:[2,3,6,7],st:'fruitveg',p:['sfborer','jassid','whitefly'],ds:['yvmv','powdery']},
 {id:'banana',n:{en:'Banana',hi:'केला',mr:'केळी'},cat:'fruit',s:['annual'],d:[330,420],soil:['loam','alluvial'],w:'high',t:'20–35°C',sow:[6,7,10,11],st:'banana',p:['weevil','aphid','thrips'],ds:['panama','sigatoka','bunchytop']},
 {id:'pomegranate',n:{en:'Pomegranate',hi:'अनार',mr:'डाळिंब'},cat:'fruit',s:['perennial'],d:[150,210],soil:['loam','welldrained'],w:'low',t:'25–35°C',sow:[1,6,9],st:'orchard',p:['anarbutterfly','thrips','mites','shothole'],ds:['oilyspot','wilt','fruitspot']}
];

var PESTS = {
 stemborer:{en:'Stem borer',hi:'तना छेदक',mr:'खोडकिडा'},
 bph:{en:'Brown planthopper',hi:'भूरा फुदका',mr:'तपकिरी तुडतुडे'},
 leaffolder:{en:'Leaf folder',hi:'पत्ती लपेटक',mr:'पाने गुंडाळणारी अळी'},
 aphid:{en:'Aphids',hi:'माहू (चेपा)',mr:'मावा'},
 termite:{en:'Termites',hi:'दीमक',mr:'वाळवी'},
 shootfly:{en:'Shoot fly',hi:'प्ररोह मक्खी',mr:'खोडमाशी'},
 faw:{en:'Fall armyworm',hi:'फॉल आर्मीवर्म',mr:'लष्करी अळी'},
 whitegrub:{en:'White grub',hi:'सफेद गिडार',mr:'हुमणी'},
 podborer:{en:'Pod / fruit borer (Helicoverpa)',hi:'फली छेदक (हेलिकोवर्पा)',mr:'घाटे/शेंगा अळी (हेलिकोव्हर्पा)'},
 podfly:{en:'Pod fly',hi:'फली मक्खी',mr:'शेंगमाशी'},
 cutworm:{en:'Cutworm',hi:'कटुआ इल्ली',mr:'कटवर्म अळी'},
 whitefly:{en:'Whitefly',hi:'सफेद मक्खी',mr:'पांढरी माशी'},
 thrips:{en:'Thrips',hi:'थ्रिप्स',mr:'फुलकिडे'},
 jassid:{en:'Jassids (leafhopper)',hi:'हरा फुदका (जैसिड)',mr:'तुडतुडे'},
 girdle:{en:'Girdle beetle',hi:'गर्डल बीटल',mr:'चक्रीभुंगा'},
 spodoptera:{en:'Tobacco caterpillar (Spodoptera)',hi:'तंबाकू इल्ली',mr:'पाने खाणारी अळी (स्पोडोप्टेरा)'},
 stemfly:{en:'Stem fly',hi:'तना मक्खी',mr:'खोडमाशी'},
 leafminer:{en:'Leaf miner',hi:'पत्ती सुरंगक',mr:'पाने पोखरणारी अळी'},
 pinkbollworm:{en:'Pink bollworm',hi:'गुलाबी सुंडी',mr:'गुलाबी बोंडअळी'},
 shootborer:{en:'Shoot borer',hi:'अगेती तना छेदक',mr:'खोडकिडा'},
 woollyaphid:{en:'Woolly aphid',hi:'ऊनी माहू',mr:'लोकरी मावा'},
 rhizomescale:{en:'Rhizome scale',hi:'प्रकंद शल्क कीट',mr:'कंदावरील खवले कीड'},
 fruitborer:{en:'Fruit borer',hi:'फल छेदक',mr:'फळ पोखरणारी अळी'},
 tubermoth:{en:'Potato tuber moth',hi:'आलू कंद शलभ',mr:'बटाटा कंद पतंग'},
 sfborer:{en:'Shoot & fruit borer',hi:'तना एवं फल छेदक',mr:'शेंडा व फळ पोखरणारी अळी'},
 mites:{en:'Mites',hi:'माइट (मकड़ी)',mr:'कोळी'},
 weevil:{en:'Rhizome weevil',hi:'प्रकंद घुन',mr:'कंद भुंगा'},
 anarbutterfly:{en:'Anar butterfly (fruit borer)',hi:'अनार तितली',mr:'डाळिंब फुलपाखरू (फळ पोखरणारी अळी)'},
 shothole:{en:'Shot-hole borer',hi:'छिद्रक भृंग',mr:'खोड भुंगेरा'}
};

var DISEASES = {
 blast:{en:'Blast',hi:'ब्लास्ट (झोंका)',mr:'करपा (ब्लास्ट)'},
 blb:{en:'Bacterial leaf blight',hi:'जीवाणु पत्ती झुलसा',mr:'जिवाणूजन्य करपा'},
 sheathblight:{en:'Sheath blight',hi:'शीथ ब्लाइट',mr:'आवरण करपा'},
 rust:{en:'Rust',hi:'रतुआ (गेरुआ)',mr:'तांबेरा'},
 leafblight:{en:'Leaf blight',hi:'पत्ती झुलसा',mr:'पानांवरील करपा'},
 grainmold:{en:'Grain mold',hi:'दाना फफूंद',mr:'दाण्यावरील बुरशी'},
 charcoalrot:{en:'Charcoal rot',hi:'चारकोल सड़न',mr:'खोडकूज (कोळसा कूज)'},
 downymildew:{en:'Downy mildew',hi:'मृदुरोमिल आसिता',mr:'केवडा'},
 ergot:{en:'Ergot',hi:'अर्गट',mr:'अरगट'},
 turcicum:{en:'Turcicum leaf blight',hi:'टर्सिकम पत्ती झुलसा',mr:'टर्सिकम करपा'},
 wilt:{en:'Wilt',hi:'उकठा (म्लानि)',mr:'मर रोग'},
 sterility:{en:'Sterility mosaic',hi:'बांझपन मोज़ेक',mr:'वांझ रोग'},
 dryrootrot:{en:'Dry root rot',hi:'शुष्क जड़ सड़न',mr:'कोरडी मूळकूज'},
 yellowmosaic:{en:'Yellow mosaic virus',hi:'पीला मोज़ेक',mr:'पिवळा मोझॅक'},
 powdery:{en:'Powdery mildew',hi:'चूर्णिल आसिता (छाछ्या)',mr:'भुरी'},
 leafspot:{en:'Leaf spot',hi:'पत्ती धब्बा',mr:'पानांवरील ठिपके'},
 tikka:{en:'Tikka leaf spot',hi:'टिक्का रोग',mr:'टिक्का (पानांवरील ठिपके)'},
 collarrot:{en:'Collar rot',hi:'कॉलर सड़न',mr:'खोडकूज'},
 alternaria:{en:'Alternaria blight',hi:'आल्टरनेरिया झुलसा',mr:'अल्टरनेरिया करपा'},
 whiterust:{en:'White rust',hi:'सफेद रतुआ',mr:'पांढरा तांबेरा'},
 leafcurl:{en:'Leaf curl virus',hi:'पत्ती मरोड़ रोग',mr:'चुरडा-मुरडा (पर्णगुच्छ)'},
 bollrot:{en:'Boll rot',hi:'टिंडा सड़न',mr:'बोंडसड'},
 redrot:{en:'Red rot',hi:'लाल सड़न',mr:'लाल कूज'},
 smut:{en:'Smut',hi:'कंडुआ',mr:'काणी'},
 rhizomerot:{en:'Rhizome rot',hi:'प्रकंद सड़न',mr:'कंदकूज'},
 purpleblotch:{en:'Purple blotch',hi:'बैंगनी धब्बा',mr:'जांभळा करपा'},
 basalrot:{en:'Basal rot',hi:'आधार सड़न',mr:'बुडकूज'},
 earlyblight:{en:'Early blight',hi:'अगेती झुलसा',mr:'लवकर येणारा करपा'},
 lateblight:{en:'Late blight',hi:'पछेती झुलसा',mr:'उशिरा येणारा करपा'},
 bacterialwilt:{en:'Bacterial wilt',hi:'जीवाणु म्लानि',mr:'जिवाणूजन्य मर'},
 littleleaf:{en:'Little leaf',hi:'लघु पर्ण रोग',mr:'पर्णगुच्छ (लहान पान)'},
 anthracnose:{en:'Anthracnose / die-back',hi:'एन्थ्रेक्नोज (डाई-बैक)',mr:'फांदीमर (अँथ्रॅकनोज)'},
 yvmv:{en:'Yellow vein mosaic',hi:'पीत शिरा मोज़ेक',mr:'पिवळा शिरा मोझॅक'},
 panama:{en:'Panama wilt',hi:'पनामा उकठा',mr:'पनामा मर'},
 sigatoka:{en:'Sigatoka leaf spot',hi:'सिगाटोका पत्ती धब्बा',mr:'सिगाटोका करपा'},
 bunchytop:{en:'Bunchy top virus',hi:'बंची टॉप',mr:'बंची टॉप (पर्णगुच्छ)'},
 oilyspot:{en:'Bacterial blight (oily spot)',hi:'तेलिया रोग',mr:'तेलकट डाग रोग'},
 fruitspot:{en:'Fruit spot',hi:'फल धब्बा',mr:'फळावरील ठिपके'}
};

var INGR = {
 water:{en:'Water',hi:'पानी',mr:'पाणी'},
 dung:{en:'Desi cow dung (fresh)',hi:'देसी गाय का ताज़ा गोबर',mr:'देशी गायीचे ताजे शेण'},
 urine:{en:'Desi cow urine',hi:'देसी गोमूत्र',mr:'देशी गोमूत्र'},
 jaggery:{en:'Jaggery',hi:'गुड़',mr:'गूळ'},
 flour:{en:'Pulse flour (besan or any pulse)',hi:'दाल का आटा (बेसन आदि)',mr:'कडधान्याचे पीठ (बेसन इ.)'},
 soil:{en:'Live soil (from bund or under a big tree)',hi:'जीवित मिट्टी (मेड़ या बड़े पेड़ के नीचे से)',mr:'जिवंत माती (बांधावरची किंवा मोठ्या झाडाखालची)'},
 lime:{en:'Lime (chuna)',hi:'चूना',mr:'चुना'},
 neem:{en:'Neem leaves (crushed)',hi:'नीम की पत्तियाँ (कुटी हुई)',mr:'कडुनिंबाची पाने (ठेचलेली)'},
 tobacco:{en:'Tobacco',hi:'तंबाकू',mr:'तंबाखू'},
 chilli:{en:'Green chilli (paste)',hi:'हरी मिर्च (पेस्ट)',mr:'हिरवी मिरची (वाटलेली)'},
 garlic:{en:'Garlic (paste)',hi:'लहसुन (पेस्ट)',mr:'लसूण (वाटलेला)'},
 custard:{en:'Custard apple leaves',hi:'सीताफल की पत्तियाँ',mr:'सीताफळाची पाने'},
 papaya:{en:'Papaya leaves',hi:'पपीते की पत्तियाँ',mr:'पपईची पाने'},
 pomleaf:{en:'Pomegranate leaves',hi:'अनार की पत्तियाँ',mr:'डाळिंबाची पाने'},
 guava:{en:'Guava leaves',hi:'अमरूद की पत्तियाँ',mr:'पेरूची पाने'},
 tenleaves:{en:'Mixed leaves of 10 plants (neem, karanj, custard apple, castor, papaya, guava, nirgudi, rui, marigold, tulsi)',hi:'10 पौधों की मिश्रित पत्तियाँ (नीम, करंज, सीताफल, अरंडी, पपीता, अमरूद, निर्गुंडी, आक, गेंदा, तुलसी)',mr:'10 वनस्पतींची मिश्र पाने (कडुनिंब, करंज, सीताफळ, एरंड, पपई, पेरू, निरगुडी, रुई, झेंडू, तुळस)'}
};
var UNITS = {L:{en:'L',hi:'लीटर',mr:'लिटर'},kg:{en:'kg',hi:'किलो',mr:'किलो'},g:{en:'g',hi:'ग्राम',mr:'ग्रॅम'},hand:{en:'handful',hi:'मुट्ठी',mr:'मूठभर'}};

/* base: acre = quantities for 1 acre; seed = per 100 kg seed; dilute = batch of concentrate, dose % of spray water */
var RECIPES = [
 {id:'jeevamrut',n:{en:'Jeevamrut',hi:'जीवामृत',mr:'जीवामृत'},base:'acre',
  purpose:{en:'Liquid microbial culture that wakes up soil life and improves nutrient availability.',hi:'तरल सूक्ष्मजीव घोल जो मिट्टी के जीवन को सक्रिय कर पोषक तत्वों की उपलब्धता बढ़ाता है।',mr:'मातीतील सूक्ष्मजीव सक्रिय करून अन्नद्रव्यांची उपलब्धता वाढवणारे द्रवरूप जिवाणू खत.'},
  ing:[['water',200,'L'],['dung',10,'kg'],['urine',10,'L'],['jaggery',2,'kg'],['flour',2,'kg'],['soil',1,'hand']],
  time:{en:'Ready in 2–7 days',hi:'2–7 दिन में तैयार',mr:'२–७ दिवसांत तयार'},
  m:{en:['Fill a drum (plastic or cement) with water and keep it in shade.','Add cow dung and cow urine and mix well.','Add jaggery, pulse flour and the handful of live soil.','Stir clockwise with a stick for a few minutes, twice a day. Cover with a jute bag.','Use within 7 days of preparation.'],
     hi:['ड्रम (प्लास्टिक या सीमेंट) में पानी भरकर छाया में रखें।','गोबर और गोमूत्र डालकर अच्छी तरह मिलाएँ।','गुड़, दाल का आटा और मुट्ठी भर जीवित मिट्टी डालें।','दिन में दो बार लकड़ी से घड़ी की दिशा में कुछ मिनट हिलाएँ। बोरी से ढक दें।','तैयारी के 7 दिनों के भीतर उपयोग करें।'],
     mr:['ड्रम (प्लास्टिक किंवा सिमेंट) पाण्याने भरून सावलीत ठेवा.','शेण व गोमूत्र टाकून चांगले मिसळा.','गूळ, कडधान्याचे पीठ व मूठभर जिवंत माती टाका.','दिवसातून दोनदा काठीने घड्याळाच्या दिशेने काही मिनिटे ढवळा. गोणपाटाने झाका.','तयार केल्यापासून ७ दिवसांच्या आत वापरा.']},
  use:{en:'Give 200 L per acre with irrigation water, or spray filtered Jeevamrut at 10% (10 L in 100 L water). Repeat every 15 days.',hi:'सिंचाई के पानी के साथ 200 लीटर प्रति एकड़ दें, या छना हुआ जीवामृत 10% (100 लीटर पानी में 10 लीटर) छिड़कें। हर 15 दिन दोहराएँ।',mr:'सिंचनाच्या पाण्यासोबत एकरी २०० लिटर द्या, किंवा गाळलेले जीवामृत १०% (१०० लिटर पाण्यात १० लिटर) फवारा. दर १५ दिवसांनी पुन्हा द्या.'},
  caution:{en:'Keep in shade; do not use metal containers.',hi:'छाया में रखें; धातु के बर्तन उपयोग न करें।',mr:'सावलीत ठेवा; धातूची भांडी वापरू नका.'}},
 {id:'ghanjeevamrut',n:{en:'Ghanjeevamrut',hi:'घनजीवामृत',mr:'घनजीवामृत'},base:'acre',
  purpose:{en:'Solid (dry) form of Jeevamrut for basal application at sowing.',hi:'बुवाई के समय डालने के लिए जीवामृत का सूखा (ठोस) रूप।',mr:'पेरणीवेळी जमिनीत देण्यासाठी जीवामृताचे घन (कोरडे) रूप.'},
  ing:[['dung',200,'kg'],['jaggery',2,'kg'],['flour',2,'kg'],['soil',1,'hand'],['urine',10,'L']],
  time:{en:'Ready in about 1 week',hi:'लगभग 1 सप्ताह में तैयार',mr:'सुमारे १ आठवड्यात तयार'},
  m:{en:['Spread cow dung on a clean floor in shade.','Sprinkle jaggery, pulse flour and live soil over it.','Sprinkle cow urine little by little and mix into a moist (not wet) heap.','Cover the heap with a jute bag for 48 hours.','Spread it thin to dry in shade, break lumps, and store in bags (usable for up to about 6 months).'],
     hi:['छाया में साफ फर्श पर गोबर फैलाएँ।','उस पर गुड़, दाल का आटा और जीवित मिट्टी डालें।','थोड़ा-थोड़ा गोमूत्र छिड़ककर नम (गीला नहीं) ढेर बनाएँ।','ढेर को 48 घंटे बोरी से ढकें।','छाया में पतला फैलाकर सुखाएँ, ढेले तोड़ें और बोरियों में रखें (लगभग 6 महीने तक उपयोगी)।'],
     mr:['सावलीत स्वच्छ जमिनीवर शेण पसरवा.','त्यावर गूळ, कडधान्याचे पीठ व जिवंत माती टाका.','थोडे थोडे गोमूत्र शिंपडून ओलसर (चिखल नव्हे) ढीग करा.','ढीग ४८ तास गोणपाटाने झाका.','सावलीत पातळ पसरवून वाळवा, ढेकळे फोडा व पोत्यात साठवा (सुमारे ६ महिने वापरता येते).']},
  use:{en:'Apply about 200 kg per acre at sowing, mixed into the soil near the seed line.',hi:'बुवाई के समय लगभग 200 किलो प्रति एकड़ बीज की कतार के पास मिट्टी में मिलाएँ।',mr:'पेरणीवेळी एकरी सुमारे २०० किलो, बियाण्याच्या ओळीजवळ मातीत मिसळा.'},
  caution:{en:'Dry in shade, not in direct sun.',hi:'सीधी धूप में नहीं, छाया में सुखाएँ।',mr:'थेट उन्हात नव्हे, सावलीत वाळवा.'}},
 {id:'beejamrut',n:{en:'Beejamrut (seed treatment)',hi:'बीजामृत (बीज उपचार)',mr:'बीजामृत (बीजप्रक्रिया)'},base:'seed',
  purpose:{en:'Protects seeds and young roots from soil-borne fungi and improves germination.',hi:'बीज व नई जड़ों को मिट्टी जनित फफूंद से बचाता है और अंकुरण सुधारता है।',mr:'बियाणे व कोवळ्या मुळांचे जमिनीतील बुरशीपासून संरक्षण करते व उगवण सुधारते.'},
  ing:[['water',20,'L'],['dung',5,'kg'],['urine',5,'L'],['lime',50,'g'],['soil',1,'hand']],
  time:{en:'Prepare the evening before sowing (12–24 hours)',hi:'बुवाई से पहले शाम को तैयार करें (12–24 घंटे)',mr:'पेरणीच्या आदल्या संध्याकाळी तयार करा (१२–२४ तास)'},
  m:{en:['Tie cow dung in a cloth and hang it in the water overnight.','In the morning squeeze the cloth well into the water.','Dissolve lime in a little water and add it, along with cow urine and the soil. Stir.','Coat the seeds evenly, dry them in shade and sow the same day.'],
     hi:['गोबर को कपड़े में बाँधकर रात भर पानी में लटकाएँ।','सुबह कपड़े को पानी में अच्छी तरह निचोड़ें।','चूने को थोड़े पानी में घोलकर, गोमूत्र और मिट्टी के साथ मिलाएँ। हिलाएँ।','बीजों पर समान रूप से लगाएँ, छाया में सुखाएँ और उसी दिन बोएँ।'],
     mr:['शेण कापडात बांधून रात्रभर पाण्यात लटकवा.','सकाळी कापड पाण्यात चांगले पिळा.','चुना थोड्या पाण्यात विरघळवून, गोमूत्र व मातीसह मिसळा. ढवळा.','बियाण्यांवर समान लावा, सावलीत सुकवा व त्याच दिवशी पेरा.']},
  use:{en:'For seedlings, dip roots briefly before transplanting.',hi:'रोपाई के लिए पौध की जड़ें थोड़ी देर डुबोएँ।',mr:'रोपांसाठी पुनर्लागवडीपूर्वी मुळे थोडा वेळ बुडवा.'},
  caution:{en:'Treat gently — do not damage the seed coat of soybean or groundnut.',hi:'सोयाबीन या मूंगफली के बीज का छिलका न टूटे, धीरे से उपचार करें।',mr:'सोयाबीन किंवा भुईमुगाचे बियाण्याचे आवरण फुटू नये, हळुवार प्रक्रिया करा.'}},
 {id:'neemastra',n:{en:'Neemastra',hi:'नीमास्त्र',mr:'निमास्त्र'},base:'acre',
  purpose:{en:'Repellent spray for sucking pests (aphids, jassids, whitefly) and small caterpillars.',hi:'रस चूसने वाले कीटों (माहू, फुदका, सफेद मक्खी) और छोटी इल्लियों के लिए छिड़काव।',mr:'रस शोषणाऱ्या किडी (मावा, तुडतुडे, पांढरी माशी) व लहान अळ्यांसाठी फवारणी.'},
  ing:[['water',100,'L'],['urine',5,'L'],['dung',1,'kg'],['neem',5,'kg']],
  time:{en:'Ready in 24–48 hours',hi:'24–48 घंटे में तैयार',mr:'२४–४८ तासांत तयार'},
  m:{en:['Crush neem leaves into a paste.','Mix water, cow urine, cow dung and the neem paste in a drum.','Cover and leave for 24–48 hours, stirring twice a day.','Filter through a cloth before spraying.'],
     hi:['नीम की पत्तियों को कूटकर पेस्ट बनाएँ।','ड्रम में पानी, गोमूत्र, गोबर और नीम का पेस्ट मिलाएँ।','ढककर 24–48 घंटे रखें, दिन में दो बार हिलाएँ।','छिड़काव से पहले कपड़े से छान लें।'],
     mr:['कडुनिंबाची पाने ठेचून वाटून घ्या.','ड्रममध्ये पाणी, गोमूत्र, शेण व निंबाचा लगदा मिसळा.','झाकून २४–४८ तास ठेवा, दिवसातून दोनदा ढवळा.','फवारणीपूर्वी कापडाने गाळा.']},
  use:{en:'Spray undiluted on the crop, preferably in the evening. Repeat every 7–10 days while pests are present.',hi:'बिना पानी मिलाए शाम के समय फसल पर छिड़कें। कीट रहने तक हर 7–10 दिन दोहराएँ।',mr:'पाणी न मिसळता शक्यतो संध्याकाळी पिकावर फवारा. कीड असेपर्यंत दर ७–१० दिवसांनी पुन्हा फवारा.'},
  caution:{en:'Use within about 6 months; store in shade.',hi:'लगभग 6 महीने में उपयोग करें; छाया में रखें।',mr:'सुमारे ६ महिन्यांत वापरा; सावलीत ठेवा.'}},
 {id:'agniastra',n:{en:'Agniastra',hi:'अग्निअस्त्र',mr:'अग्निअस्त्र'},base:'dilute',dose:2.5,
  purpose:{en:'Strong botanical spray for stem, pod and fruit borers.',hi:'तना, फली और फल छेदक कीटों के लिए तेज़ वनस्पति छिड़काव।',mr:'खोड, शेंगा व फळ पोखरणाऱ्या अळ्यांसाठी तीव्र वनस्पतीजन्य फवारणी.'},
  ing:[['urine',20,'L'],['neem',5,'kg'],['tobacco',0.5,'kg'],['chilli',0.5,'kg'],['garlic',0.5,'kg']],
  time:{en:'Ready in about 2 days after boiling',hi:'उबालने के बाद लगभग 2 दिन में तैयार',mr:'उकळल्यानंतर सुमारे २ दिवसांत तयार'},
  m:{en:['Put cow urine in a vessel and add neem paste, tobacco, chilli and garlic paste.','Boil the mixture, letting it come to a boil several times (about 5).','Cover and let it cool for 48 hours.','Filter through cloth and store the concentrate in bottles.'],
     hi:['बर्तन में गोमूत्र लेकर नीम का पेस्ट, तंबाकू, मिर्च और लहसुन का पेस्ट डालें।','मिश्रण को कई बार (लगभग 5 बार) उबाल आने तक उबालें।','ढककर 48 घंटे ठंडा होने दें।','कपड़े से छानकर सांद्र घोल बोतलों में रखें।'],
     mr:['भांड्यात गोमूत्र घेऊन निंबाचा लगदा, तंबाखू, मिरची व लसूण वाटण टाका.','मिश्रणाला अनेक वेळा (सुमारे ५ वेळा) उकळी येऊ द्या.','झाकून ४८ तास थंड होऊ द्या.','कापडाने गाळून अर्क बाटल्यांत साठवा.']},
  use:{en:'Mix 2–3 L of concentrate in 100 L water and spray.',hi:'100 लीटर पानी में 2–3 लीटर सांद्र घोल मिलाकर छिड़कें।',mr:'१०० लिटर पाण्यात २–३ लिटर अर्क मिसळून फवारा.'},
  caution:{en:'Wear gloves and a mask. Boil outdoors. Keep away from children and animals.',hi:'दस्ताने और मास्क पहनें। खुले में उबालें। बच्चों और पशुओं से दूर रखें।',mr:'हातमोजे व मास्क वापरा. उघड्यावर उकळा. मुले व जनावरांपासून दूर ठेवा.'}},
 {id:'brahmastra',n:{en:'Brahmastra',hi:'ब्रह्मास्त्र',mr:'ब्रह्मास्त्र'},base:'dilute',dose:2.5,
  purpose:{en:'Botanical spray for larger caterpillars and sucking pests.',hi:'बड़ी इल्लियों और रस चूसने वाले कीटों के लिए वनस्पति छिड़काव।',mr:'मोठ्या अळ्या व रस शोषणाऱ्या किडींसाठी वनस्पतीजन्य फवारणी.'},
  ing:[['urine',10,'L'],['neem',3,'kg'],['custard',2,'kg'],['papaya',2,'kg'],['pomleaf',2,'kg'],['guava',2,'kg']],
  time:{en:'Ready in 1–2 days after boiling',hi:'उबालने के बाद 1–2 दिन में तैयार',mr:'उकळल्यानंतर १–२ दिवसांत तयार'},
  m:{en:['Crush all the leaves into a paste.','Add the paste to cow urine in a vessel.','Boil, letting it come to a boil several times (about 5).','Cool for 24–48 hours, filter and store the concentrate.'],
     hi:['सभी पत्तियों को कूटकर पेस्ट बनाएँ।','बर्तन में गोमूत्र में पेस्ट डालें।','कई बार (लगभग 5 बार) उबाल आने तक उबालें।','24–48 घंटे ठंडा करें, छानकर सांद्र घोल रखें।'],
     mr:['सर्व पाने ठेचून लगदा करा.','भांड्यातील गोमूत्रात लगदा टाका.','अनेक वेळा (सुमारे ५ वेळा) उकळी येऊ द्या.','२४–४८ तास थंड करा, गाळून अर्क साठवा.']},
  use:{en:'Mix 2–3 L of concentrate in 100 L water and spray.',hi:'100 लीटर पानी में 2–3 लीटर सांद्र घोल मिलाकर छिड़कें।',mr:'१०० लिटर पाण्यात २–३ लिटर अर्क मिसळून फवारा.'},
  caution:{en:'Wear gloves. Store in shade, away from children.',hi:'दस्ताने पहनें। छाया में, बच्चों से दूर रखें।',mr:'हातमोजे वापरा. सावलीत, मुलांपासून दूर ठेवा.'}},
 {id:'dashparni',n:{en:'Dashparni Ark',hi:'दशपर्णी अर्क',mr:'दशपर्णी अर्क'},base:'dilute',dose:2.5,
  purpose:{en:'Broad-spectrum botanical pest repellent made from ten kinds of leaves.',hi:'दस प्रकार की पत्तियों से बना व्यापक कीट विकर्षक।',mr:'दहा प्रकारच्या पानांपासून बनवलेले व्यापक कीडनाशक/कीडरोधक अर्क.'},
  ing:[['water',200,'L'],['urine',10,'L'],['dung',2,'kg'],['tenleaves',20,'kg']],
  time:{en:'Ready in about 30–40 days',hi:'लगभग 30–40 दिन में तैयार',mr:'सुमारे ३०–४० दिवसांत तयार'},
  m:{en:['Chop or crush the leaves (about 2 kg of each kind).','Mix water, cow urine, cow dung and leaves in a drum.','Cover with a jute bag and keep in shade.','Stir twice a day for 30–40 days, then filter and store.'],
     hi:['पत्तियों को काटें या कूटें (हर प्रकार की लगभग 2 किलो)।','ड्रम में पानी, गोमूत्र, गोबर और पत्तियाँ मिलाएँ।','बोरी से ढककर छाया में रखें।','30–40 दिन तक दिन में दो बार हिलाएँ, फिर छानकर रखें।'],
     mr:['पाने कापून किंवा ठेचून घ्या (प्रत्येक प्रकारची सुमारे २ किलो).','ड्रममध्ये पाणी, गोमूत्र, शेण व पाने मिसळा.','गोणपाटाने झाकून सावलीत ठेवा.','३०–४० दिवस दिवसातून दोनदा ढवळा, नंतर गाळून साठवा.']},
  use:{en:'Mix 2–3 L in 100 L water and spray.',hi:'100 लीटर पानी में 2–3 लीटर मिलाकर छिड़कें।',mr:'१०० लिटर पाण्यात २–३ लिटर मिसळून फवारा.'},
  caution:{en:'Some leaves (rui, nirgudi) are irritants — wear gloves.',hi:'कुछ पत्तियाँ (आक, निर्गुंडी) त्वचा पर जलन कर सकती हैं — दस्ताने पहनें।',mr:'काही पाने (रुई, निरगुडी) त्रासदायक असतात — हातमोजे वापरा.'}}
];

var STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];
var DISTRICTS = {
 'Maharashtra':['Ahilyanagar (Ahmednagar)','Akola','Amravati','Beed','Bhandara','Buldhana','Chandrapur','Chhatrapati Sambhajinagar (Aurangabad)','Dharashiv (Osmanabad)','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal']
};

/* ===================================================================
   MORE CROPS — complete Maharashtra list (cereals, pulses, oilseeds,
   vegetables, leafy greens, fruits, spices, flowers, fodder).
   d = crop duration in days (for orchards: flowering → harvest of one bahar)
   =================================================================== */
STAGESETS.greens = [['germ',0],['veg',15],['harvest',65]];
STAGESETS.flowercrop = [['establish',0],['veg',15],['flower',45],['harvest',60]];

PESTS.mangohopper = {en:'Mango hopper',hi:'आम का फुदका (हॉपर)',mr:'आंब्यावरील तुडतुडे'};
PESTS.citruspsylla = {en:'Citrus psylla',hi:'सिट्रस सिल्ला',mr:'सिट्रस सायला'};
PESTS.citrusbutterfly = {en:'Lemon butterfly caterpillar',hi:'नींबू तितली की इल्ली',mr:'लिंबावरील फुलपाखराची अळी'};
PESTS.redpumpkinbeetle = {en:'Red pumpkin beetle',hi:'लाल कद्दू भृंग',mr:'लाल भुंगेरे (लाल भोपळा भुंगा)'};
PESTS.fleabeetle = {en:'Flea beetle',hi:'पिस्सू भृंग',mr:'उडद्या भुंगेरे (फ्ली बीटल)'};
PESTS.leafwebber = {en:'Leaf webber / roller',hi:'पत्ती लपेटक इल्ली',mr:'पाने गुंडाळणारी अळी'};
PESTS.hairycaterpillar = {en:'Hairy caterpillar',hi:'बालदार इल्ली',mr:'केसाळ अळी'};
PESTS.barkeater = {en:'Bark-eating caterpillar',hi:'छाल खाने वाली इल्ली',mr:'साल खाणारी अळी'};
PESTS.budborer = {en:'Bud borer',hi:'कली छेदक इल्ली',mr:'कळी पोखरणारी अळी'};
PESTS.teamosquito = {en:'Tea mosquito bug',hi:'टी मॉस्किटो बग',mr:'ढेकण्या (टी मॉस्किटो बग)'};
PESTS.stemrootborer = {en:'Stem & root borer',hi:'तना व जड़ छेदक',mr:'खोड व मूळ पोखरणारा भुंगा'};
PESTS.rhinobeetle = {en:'Rhinoceros beetle',hi:'गैंडा भृंग',mr:'गेंड्या भुंगा'};
PESTS.fruitpiercing = {en:'Fruit-sucking moth',hi:'फल चूसक पतंगा',mr:'फळातील रस शोषणारा पतंग'};
PESTS.nematode = {en:'Root-knot nematode',hi:'जड़ गाँठ सूत्रकृमि',mr:'मूळगाठ सूत्रकृमी'};
PESTS.capsulefly = {en:'Capsule fly',hi:'कैप्सूल मक्खी',mr:'बोंडमाशी'};
PESTS.budfly = {en:'Bud fly',hi:'कली मक्खी',mr:'कळीमाशी'};
PESTS.semilooper = {en:'Semilooper',hi:'सेमीलूपर इल्ली',mr:'उंटअळी'};
PESTS.capsuleborer = {en:'Capsule borer',hi:'कैप्सूल छेदक',mr:'बोंड पोखरणारी अळी'};
PESTS.pollubeetle = {en:'Pollu beetle',hi:'पोलू भृंग',mr:'पोलू भुंगा'};

DISEASES.canker = {en:'Canker',hi:'कैंकर',mr:'खैरा (कॅन्कर)'};
DISEASES.gummosis = {en:'Gummosis (Phytophthora)',hi:'गोंदिया रोग (गमोसिस)',mr:'डिंक्या (गमोसिस)'};
DISEASES.dieback = {en:'Dieback',hi:'शीर्ष सूखा (डाईबैक)',mr:'फांदीमर (डायबॅक)'};
DISEASES.greening = {en:'Citrus greening',hi:'सिट्रस ग्रीनिंग',mr:'सिट्रस ग्रीनिंग'};
DISEASES.malformation = {en:'Mango malformation',hi:'आम का गुच्छा रोग',mr:'आंब्याचा गुच्छ रोग'};
DISEASES.sootymould = {en:'Sooty mould',hi:'कालिख फफूंद',mr:'काळी बुरशी'};
DISEASES.blackrot = {en:'Black rot',hi:'काला सड़न',mr:'काळी कूज'};
DISEASES.mosaic = {en:'Mosaic virus',hi:'मोज़ेक विषाणु रोग',mr:'मोझॅक (केवडा)'};
DISEASES.bacterialblight = {en:'Bacterial blight',hi:'जीवाणु झुलसा',mr:'जिवाणूजन्य करपा'};
DISEASES.rootrot = {en:'Root rot',hi:'जड़ सड़न',mr:'मूळकूज'};
DISEASES.fruitrot = {en:'Fruit rot',hi:'फल सड़न',mr:'फळकूज'};
DISEASES.budrot = {en:'Bud rot',hi:'कली सड़न',mr:'शेंडेकूज'};
DISEASES.phyllody = {en:'Phyllody',hi:'फाइलोडी (पर्णाभ पुष्पता)',mr:'फायलोडी'};
DISEASES.blackspot = {en:'Black spot',hi:'काला धब्बा',mr:'काळे ठिपके'};

var MORE_CROPS = [
 /* cereals & millets */
 {id:'vari',n:{en:'Vari (Little millet)',hi:'कुटकी',mr:'वरई (वरी)'},cat:'cereal',s:['kharif'],d:[80,100],soil:['red','laterite'],w:'low',t:'20–30°C',sow:[6,7],st:'cereal',p:['shootfly','cutworm'],ds:['smut','rust']},
 /* pulses */
 {id:'matki',n:{en:'Matki (Moth bean)',hi:'मोठ',mr:'मटकी'},cat:'pulse',s:['kharif'],d:[75,90],soil:['sandy','loam'],w:'low',t:'25–35°C',sow:[6,7],st:'legume',p:['jassid','whitefly','podborer'],ds:['yellowmosaic','leafspot']},
 {id:'chavali',n:{en:'Chavali (Cowpea)',hi:'लोबिया',mr:'चवळी'},cat:'pulse',s:['kharif','zaid'],d:[70,90],soil:['loam','sandy','welldrained'],w:'low',t:'25–35°C',sow:[2,3,6,7],st:'legume',p:['aphid','podborer','podfly'],ds:['yellowmosaic','rust','anthracnose']},
 {id:'kulith',n:{en:'Kulith (Horse gram)',hi:'कुलथी',mr:'कुळीथ (हुलगा)'},cat:'pulse',s:['kharif','rabi'],d:[90,110],soil:['red','sandy'],w:'low',t:'20–32°C',sow:[8,9],st:'legume',p:['podborer','aphid'],ds:['yellowmosaic','anthracnose']},
 {id:'masoor',n:{en:'Masoor (Lentil)',hi:'मसूर',mr:'मसूर'},cat:'pulse',s:['rabi'],d:[100,120],soil:['loam','clay'],w:'low',t:'15–25°C',sow:[10,11],st:'legume',p:['aphid','podborer','cutworm'],ds:['wilt','rust']},
 {id:'pavta',n:{en:'Pavta / Wal (Field bean)',hi:'वाल (सेम दाना)',mr:'पावटा (वाल)'},cat:'pulse',s:['rabi'],d:[110,140],soil:['black','loam'],w:'low',t:'15–30°C',sow:[9,10],st:'legume',p:['aphid','podborer'],ds:['powdery','yellowmosaic']},
 {id:'rajma',n:{en:'Rajma (Kidney bean)',hi:'राजमा',mr:'राजमा'},cat:'pulse',s:['kharif','rabi'],d:[90,120],soil:['loam','welldrained'],w:'medium',t:'15–25°C',sow:[6,7,10,11],st:'legume',p:['aphid','podborer','stemfly'],ds:['anthracnose','rust','rootrot']},
 /* oilseeds */
 {id:'safflower',n:{en:'Safflower (Kardai)',hi:'कुसुम',mr:'करडई'},cat:'oil',s:['rabi'],d:[120,140],soil:['black','clay'],w:'low',t:'15–30°C',sow:[9,10],st:'seedcrop',p:['aphid','capsulefly'],ds:['alternaria','wilt','powdery']},
 {id:'sesame',n:{en:'Sesame (Til)',hi:'तिल',mr:'तीळ'},cat:'oil',s:['kharif','zaid'],d:[80,95],soil:['sandy','loam','welldrained'],w:'low',t:'25–35°C',sow:[2,6,7],st:'seedcrop',p:['leafwebber','jassid'],ds:['phyllody','charcoalrot','powdery']},
 {id:'niger',n:{en:'Niger (Karale)',hi:'रामतिल (जगनी)',mr:'कारळे'},cat:'oil',s:['kharif'],d:[90,110],soil:['red','sandy'],w:'low',t:'20–30°C',sow:[7,8],st:'seedcrop',p:['aphid','cutworm'],ds:['powdery','leafspot']},
 {id:'linseed',n:{en:'Linseed (Jawas)',hi:'अलसी',mr:'जवस'},cat:'oil',s:['rabi'],d:[110,130],soil:['black','clay'],w:'low',t:'15–25°C',sow:[10,11],st:'seedcrop',p:['budfly','aphid'],ds:['rust','wilt','powdery']},
 {id:'castor',n:{en:'Castor',hi:'अरंडी',mr:'एरंडी'},cat:'oil',s:['kharif'],d:[150,180],soil:['sandy','red','welldrained'],w:'low',t:'20–30°C',sow:[6,7],st:'seedcrop',p:['semilooper','capsuleborer','jassid'],ds:['wilt','greymould','rootrot']},
 /* cash crops */
 {id:'mulberry',n:{en:'Mulberry (for silkworm)',hi:'शहतूत (रेशम कीट पालन)',mr:'तुती (रेशीम शेती)'},cat:'cash',s:['perennial'],d:[60,75],soil:['loam','red','welldrained'],w:'medium',t:'24–28°C',sow:[6,7,8],st:'greens',p:['mealybug','thrips','whitefly'],ds:['leafspot','powdery','rootrot']},
 {id:'betel',n:{en:'Betel leaf (Paan)',hi:'पान (नागरबेल)',mr:'खाऊचे पान (नागवेल)'},cat:'cash',s:['perennial'],d:[120,150],soil:['loam','red','welldrained'],w:'high',t:'20–35°C, humid shade',sow:[6,7,8],st:'greens',p:['mealybug','mites','aphid'],ds:['phytophthora','leafspot','anthracnose']},
 {id:'arecanut',n:{en:'Areca nut (Supari)',hi:'सुपारी',mr:'सुपारी'},cat:'cash',s:['perennial'],d:[270,300],soil:['laterite','loam','welldrained'],w:'high',t:'15–38°C',sow:[6,7,8],st:'orchard',p:['whitegrub','mites'],ds:['fruitrot','budrot','anthracnose']},
 /* spices */
 {id:'garlic',n:{en:'Garlic',hi:'लहसुन',mr:'लसूण'},cat:'spice',s:['rabi'],d:[130,160],soil:['loam','welldrained'],w:'medium',t:'12–25°C',sow:[10,11],st:'tuber',p:['thrips','mites'],ds:['purpleblotch','basalrot','rust']},
 {id:'ginger',n:{en:'Ginger',hi:'अदरक',mr:'आले'},cat:'spice',s:['kharif'],d:[210,270],soil:['loam','welldrained','red'],w:'high',t:'20–30°C',sow:[5,6],st:'tuber',p:['shootborer','rhizomescale','whitegrub'],ds:['rhizomerot','leafspot','bacterialwilt']},
 {id:'blackpepper',n:{en:'Black pepper (Miri)',hi:'काली मिर्च',mr:'मिरी'},cat:'spice',s:['perennial'],d:[180,240],soil:['laterite','loam','welldrained'],w:'high',t:'20–30°C, humid',sow:[6,7],st:'orchard',p:['pollubeetle','mealybug'],ds:['phytophthora','anthracnose']},
 /* vegetables */
 {id:'cabbage',n:{en:'Cabbage',hi:'पत्ता गोभी',mr:'कोबी'},cat:'veg',s:['rabi','kharif'],d:[90,120],soil:['loam','welldrained'],w:'medium',t:'15–25°C',sow:[6,7,9,10,11],st:'leafy',p:['dbm','aphid','spodoptera'],ds:['blackrot','alternaria','downymildew']},
 {id:'cauliflower',n:{en:'Cauliflower',hi:'फूलगोभी',mr:'फुलकोबी'},cat:'veg',s:['rabi','kharif'],d:[90,120],soil:['loam','welldrained'],w:'medium',t:'15–25°C',sow:[6,7,9,10],st:'leafy',p:['dbm','aphid','spodoptera'],ds:['blackrot','alternaria','downymildew']},
 {id:'capsicum',n:{en:'Capsicum (Shimla mirch)',hi:'शिमला मिर्च',mr:'ढोबळी मिरची'},cat:'veg',s:['rabi','kharif'],d:[120,150],soil:['loam','welldrained'],w:'medium',t:'18–28°C',sow:[6,7,9,10],st:'fruitveg',p:['thrips','mites','aphid','fruitborer'],ds:['powdery','anthracnose','leafcurl']},
 {id:'cucumber',n:{en:'Cucumber (Kakdi)',hi:'खीरा',mr:'काकडी'},cat:'veg',s:['kharif','zaid'],d:[70,90],soil:['loam','sandy','welldrained'],w:'medium',t:'20–30°C',sow:[1,2,6,7],st:'fruitveg',p:['fruitfly','redpumpkinbeetle','aphid'],ds:['downymildew','powdery','mosaic']},
 {id:'bottlegourd',n:{en:'Bottle gourd (Dudhi)',hi:'लौकी',mr:'दुधी भोपळा'},cat:'veg',s:['kharif','zaid'],d:[100,130],soil:['loam','sandy'],w:'medium',t:'25–35°C',sow:[1,2,6,7],st:'fruitveg',p:['fruitfly','redpumpkinbeetle','aphid'],ds:['downymildew','powdery','mosaic']},
 {id:'bittergourd',n:{en:'Bitter gourd (Karle)',hi:'करेला',mr:'कारले'},cat:'veg',s:['kharif','zaid'],d:[100,130],soil:['loam','sandy','welldrained'],w:'medium',t:'25–35°C',sow:[1,2,6,7],st:'fruitveg',p:['fruitfly','redpumpkinbeetle','thrips'],ds:['downymildew','powdery','mosaic']},
 {id:'ridgegourd',n:{en:'Ridge gourd (Dodka)',hi:'तोरई',mr:'दोडका'},cat:'veg',s:['kharif','zaid'],d:[90,120],soil:['loam','sandy'],w:'medium',t:'25–35°C',sow:[1,2,6,7],st:'fruitveg',p:['fruitfly','redpumpkinbeetle','leafminer'],ds:['downymildew','powdery','mosaic']},
 {id:'spongegourd',n:{en:'Sponge gourd (Ghosale)',hi:'गिल्की (घिया तोरई)',mr:'घोसाळे'},cat:'veg',s:['kharif','zaid'],d:[90,120],soil:['loam','sandy'],w:'medium',t:'25–35°C',sow:[1,2,6,7],st:'fruitveg',p:['fruitfly','redpumpkinbeetle','aphid'],ds:['downymildew','powdery','mosaic']},
 {id:'snakegourd',n:{en:'Snake gourd (Padval)',hi:'चिचिंडा',mr:'पडवळ'},cat:'veg',s:['kharif','zaid'],d:[100,130],soil:['loam','sandy'],w:'medium',t:'25–35°C',sow:[1,2,6,7],st:'fruitveg',p:['fruitfly','redpumpkinbeetle'],ds:['downymildew','powdery']},
 {id:'pumpkin',n:{en:'Pumpkin (Lal bhopla)',hi:'कद्दू (सीताफल)',mr:'लाल भोपळा (डांगर)'},cat:'veg',s:['kharif','zaid'],d:[100,130],soil:['loam','sandy'],w:'medium',t:'25–35°C',sow:[1,2,6,7],st:'fruitveg',p:['fruitfly','redpumpkinbeetle','aphid'],ds:['powdery','downymildew','mosaic']},
 {id:'ivygourd',n:{en:'Ivy gourd (Tondli)',hi:'कुंदरू',mr:'तोंडली'},cat:'veg',s:['perennial'],d:[75,90],soil:['loam','sandy'],w:'medium',t:'25–35°C',sow:[2,6,7],st:'fruitveg',p:['fruitfly','mealybug'],ds:['powdery','downymildew']},
 {id:'drumstick',n:{en:'Drumstick (Shevga / Moringa)',hi:'सहजन',mr:'शेवगा'},cat:'veg',s:['perennial'],d:[160,200],soil:['sandy','red','welldrained'],w:'low',t:'25–35°C',sow:[6,7,9],st:'fruitveg',p:['hairycaterpillar','podfly','barkeater'],ds:['rootrot','leafspot']},
 {id:'clusterbean',n:{en:'Cluster bean (Gavar)',hi:'ग्वार',mr:'गवार'},cat:'veg',s:['kharif','zaid'],d:[90,110],soil:['sandy','loam'],w:'low',t:'25–35°C',sow:[2,3,6,7],st:'legume',p:['jassid','aphid','whitefly','podborer'],ds:['powdery','bacterialblight','alternaria']},
 {id:'frenchbean',n:{en:'French bean (Farasbi)',hi:'फ्रांसबीन',mr:'फरसबी (श्रावण घेवडा)'},cat:'veg',s:['kharif','rabi'],d:[60,90],soil:['loam','welldrained'],w:'medium',t:'15–25°C',sow:[6,7,9,10],st:'legume',p:['aphid','stemfly','podborer'],ds:['anthracnose','rust','mosaic']},
 {id:'ghevada',n:{en:'Indian bean (Ghevada / Walpapdi)',hi:'सेम फली',mr:'घेवडा (वालपापडी)'},cat:'veg',s:['kharif','rabi'],d:[100,140],soil:['loam','black'],w:'medium',t:'18–30°C',sow:[6,7,9,10],st:'legume',p:['aphid','podborer','podfly'],ds:['powdery','yellowmosaic','anthracnose']},
 {id:'peas',n:{en:'Green peas (Vatana)',hi:'मटर',mr:'वाटाणा'},cat:'veg',s:['rabi'],d:[75,100],soil:['loam','welldrained'],w:'medium',t:'10–25°C',sow:[10,11],st:'legume',p:['podborer','leafminer','aphid'],ds:['powdery','rust','wilt']},
 {id:'carrot',n:{en:'Carrot',hi:'गाजर',mr:'गाजर'},cat:'veg',s:['rabi'],d:[90,110],soil:['sandy','loam','welldrained'],w:'medium',t:'15–25°C',sow:[9,10,11],st:'tuber',p:['aphid','cutworm'],ds:['alternaria','powdery']},
 {id:'radish',n:{en:'Radish (Mula)',hi:'मूली',mr:'मुळा'},cat:'veg',s:['rabi','kharif'],d:[40,60],soil:['sandy','loam'],w:'medium',t:'10–25°C',sow:[8,9,10,11],st:'tuber',p:['aphid','fleabeetle','dbm'],ds:['alternaria','whiterust']},
 {id:'beetroot',n:{en:'Beetroot',hi:'चुकंदर',mr:'बीट'},cat:'veg',s:['rabi'],d:[60,90],soil:['sandy','loam'],w:'medium',t:'15–25°C',sow:[9,10,11],st:'tuber',p:['cutworm','leafminer','aphid'],ds:['leafspot','rootrot']},
 {id:'sweetpotato',n:{en:'Sweet potato (Ratale)',hi:'शकरकंद',mr:'रताळे'},cat:'veg',s:['kharif','rabi'],d:[110,130],soil:['sandy','loam','welldrained'],w:'medium',t:'20–30°C',sow:[6,7,10],st:'tuber',p:['weevil','spodoptera'],ds:['leafspot','wilt']},
 {id:'colocasia',n:{en:'Colocasia / Taro (Alu)',hi:'अरबी (घुइयाँ)',mr:'अळू'},cat:'veg',s:['kharif'],d:[150,180],soil:['loam','clay'],w:'high',t:'21–30°C',sow:[5,6,7],st:'tuber',p:['aphid','spodoptera'],ds:['phytophthora','leafspot']},
 {id:'suran',n:{en:'Elephant foot yam (Suran)',hi:'जिमीकंद (सूरन)',mr:'सुरण'},cat:'veg',s:['kharif'],d:[240,300],soil:['loam','sandy','welldrained'],w:'medium',t:'25–35°C',sow:[4,5,6],st:'tuber',p:['mealybug','termite'],ds:['collarrot','leafspot']},
 /* leafy greens */
 {id:'methi',n:{en:'Fenugreek (Methi)',hi:'मेथी',mr:'मेथी'},cat:'leafy',s:['rabi','kharif'],d:[25,40],soil:['loam','welldrained'],w:'low',t:'15–28°C',sow:[6,7,9,10,11,12,1],st:'greens',p:['aphid','leafminer'],ds:['powdery','downymildew','rootrot']},
 {id:'palak',n:{en:'Spinach (Palak)',hi:'पालक',mr:'पालक'},cat:'leafy',s:['rabi','kharif'],d:[30,60],soil:['loam','alluvial'],w:'medium',t:'15–25°C',sow:[6,7,9,10,11,12,1],st:'greens',p:['aphid','leafminer','spodoptera'],ds:['leafspot','downymildew']},
 {id:'kothimbir',n:{en:'Coriander (Kothimbir)',hi:'धनिया',mr:'कोथिंबीर'},cat:'leafy',s:['rabi','kharif','zaid'],d:[35,50],soil:['loam','welldrained','black'],w:'medium',t:'15–28°C',sow:[1,2,3,6,7,8,9,10,11,12],st:'greens',p:['aphid','cutworm'],ds:['powdery','wilt']},
 {id:'shepu',n:{en:'Dill (Shepu)',hi:'सोआ (सुवा)',mr:'शेपू'},cat:'leafy',s:['rabi'],d:[35,50],soil:['loam'],w:'low',t:'15–25°C',sow:[9,10,11,12,1],st:'greens',p:['aphid'],ds:['powdery']},
 {id:'lalmath',n:{en:'Amaranth (Lal math)',hi:'चौलाई',mr:'लाल माठ'},cat:'leafy',s:['kharif','zaid','rabi'],d:[25,40],soil:['loam','sandy'],w:'medium',t:'20–35°C',sow:[2,3,4,6,7,8,9],st:'greens',p:['spodoptera','leafwebber'],ds:['whiterust','leafspot']},
 {id:'ambadi',n:{en:'Roselle leaves (Ambadi)',hi:'पटवा (गोंगुरा)',mr:'अंबाडी'},cat:'leafy',s:['kharif'],d:[40,60],soil:['loam','sandy'],w:'low',t:'20–35°C',sow:[6,7],st:'greens',p:['jassid','mealybug'],ds:['leafspot','rootrot']},
 {id:'mint',n:{en:'Mint (Pudina)',hi:'पुदीना',mr:'पुदिना'},cat:'leafy',s:['perennial'],d:[60,90],soil:['loam'],w:'high',t:'20–30°C',sow:[1,2,6,7,10],st:'greens',p:['aphid','spodoptera'],ds:['rust','powdery','wilt']},
 {id:'curryleaf',n:{en:'Curry leaf (Kadipatta)',hi:'करी पत्ता',mr:'कढीपत्ता'},cat:'leafy',s:['perennial'],d:[180,240],soil:['loam','red','welldrained'],w:'medium',t:'20–35°C',sow:[6,7,8],st:'greens',p:['citruspsylla','leafminer'],ds:['leafspot']},
 /* fruits */
 {id:'mango',n:{en:'Mango (Hapus / Kesar)',hi:'आम',mr:'आंबा (हापूस / केशर)'},cat:'fruit',s:['perennial'],d:[110,150],soil:['laterite','loam','welldrained'],w:'low',t:'24–30°C',sow:[6,7,8],st:'orchard',p:['mangohopper','fruitfly','mealybug','thrips'],ds:['powdery','anthracnose','malformation','sootymould']},
 {id:'lime',n:{en:'Lime (Kagzi limbu)',hi:'कागज़ी नींबू',mr:'कागदी लिंबू'},cat:'fruit',s:['perennial'],d:[150,180],soil:['loam','black','welldrained'],w:'medium',t:'20–35°C',sow:[6,7,8],st:'orchard',p:['citruspsylla','leafminer','citrusbutterfly'],ds:['canker','gummosis','dieback']},
 {id:'chiku',n:{en:'Sapota (Chiku)',hi:'चीकू',mr:'चिकू'},cat:'fruit',s:['perennial'],d:[210,270],soil:['loam','alluvial','sandy'],w:'medium',t:'20–38°C',sow:[6,7,8],st:'orchard',p:['budborer','fruitfly','leafwebber'],ds:['leafspot','sootymould']},
 {id:'guava',n:{en:'Guava (Peru)',hi:'अमरूद',mr:'पेरू'},cat:'fruit',s:['perennial'],d:[120,150],soil:['loam','black','welldrained'],w:'low',t:'20–35°C',sow:[6,7,8],st:'orchard',p:['fruitfly','mealybug','barkeater'],ds:['wilt','anthracnose','fruitrot']},
 {id:'custardapple',n:{en:'Custard apple (Sitaphal)',hi:'सीताफल (शरीफा)',mr:'सीताफळ'},cat:'fruit',s:['perennial'],d:[120,150],soil:['red','sandy','welldrained'],w:'low',t:'25–35°C',sow:[6,7],st:'orchard',p:['mealybug','fruitfly'],ds:['anthracnose','fruitrot']},
 {id:'grapes',n:{en:'Grapes',hi:'अंगूर',mr:'द्राक्ष'},cat:'fruit',s:['perennial'],d:[120,150],soil:['loam','black','welldrained'],w:'medium',t:'15–35°C',sow:[1,2,3],st:'orchard',p:['mealybug','thrips','fleabeetle','mites'],ds:['downymildew','powdery','anthracnose']},
 {id:'orange',n:{en:'Nagpur orange (Santra)',hi:'संतरा (नागपुरी)',mr:'संत्रा (नागपुरी)'},cat:'fruit',s:['perennial'],d:[240,280],soil:['black','loam','welldrained'],w:'medium',t:'15–35°C',sow:[6,7,8],st:'orchard',p:['citruspsylla','leafminer','fruitpiercing'],ds:['gummosis','dieback','greening']},
 {id:'mosambi',n:{en:'Sweet lime (Mosambi)',hi:'मौसमी',mr:'मोसंबी'},cat:'fruit',s:['perennial'],d:[240,280],soil:['black','loam','welldrained'],w:'medium',t:'15–35°C',sow:[6,7,8],st:'orchard',p:['citruspsylla','leafminer','fruitpiercing'],ds:['gummosis','dieback','greening']},
 {id:'fig',n:{en:'Fig (Anjeer)',hi:'अंजीर',mr:'अंजीर'},cat:'fruit',s:['perennial'],d:[120,150],soil:['loam','welldrained','red'],w:'low',t:'20–35°C',sow:[6,7],st:'orchard',p:['mites','thrips'],ds:['rust','leafspot']},
 {id:'cashew',n:{en:'Cashew (Kaju)',hi:'काजू',mr:'काजू'},cat:'fruit',s:['perennial'],d:[80,100],soil:['laterite','red','sandy'],w:'low',t:'20–35°C',sow:[6,7,8],st:'orchard',p:['teamosquito','stemrootborer','thrips'],ds:['anthracnose','dieback','powdery']},
 {id:'coconut',n:{en:'Coconut (Naral)',hi:'नारियल',mr:'नारळ'},cat:'fruit',s:['perennial'],d:[330,365],soil:['laterite','sandy','loam'],w:'high',t:'20–32°C',sow:[6,7,8],st:'orchard',p:['rhinobeetle','weevil','mites'],ds:['budrot','wilt','leafspot']},
 {id:'jackfruit',n:{en:'Jackfruit (Phanas)',hi:'कटहल',mr:'फणस'},cat:'fruit',s:['perennial'],d:[120,180],soil:['laterite','loam','welldrained'],w:'medium',t:'22–35°C',sow:[6,7,8],st:'orchard',p:['shootborer','mealybug'],ds:['fruitrot','leafspot']},
 {id:'kokum',n:{en:'Kokum (Ratamba)',hi:'कोकम',mr:'कोकम (रातांबा)'},cat:'fruit',s:['perennial'],d:[120,150],soil:['laterite','red','welldrained'],w:'medium',t:'20–35°C, humid',sow:[6,7],st:'orchard',p:['mealybug','fruitfly'],ds:['anthracnose','leafspot']},
 {id:'jamun',n:{en:'Jamun',hi:'जामुन',mr:'जांभूळ'},cat:'fruit',s:['perennial'],d:[75,100],soil:['loam','laterite','welldrained'],w:'medium',t:'20–38°C',sow:[6,7,8],st:'orchard',p:['fruitfly','leafwebber'],ds:['anthracnose','leafspot']},
 {id:'ber',n:{en:'Ber (Bor)',hi:'बेर',mr:'बोर'},cat:'fruit',s:['perennial'],d:[120,150],soil:['sandy','black','loam'],w:'low',t:'25–40°C',sow:[6,7,8],st:'orchard',p:['fruitfly','fruitborer'],ds:['powdery','leafspot']},
 {id:'amla',n:{en:'Amla (Indian gooseberry)',hi:'आंवला',mr:'आवळा'},cat:'fruit',s:['perennial'],d:[210,270],soil:['sandy','black','loam'],w:'low',t:'20–40°C',sow:[6,7,8],st:'orchard',p:['barkeater','mealybug'],ds:['rust','fruitrot']},
 {id:'tamarind',n:{en:'Tamarind (Chinch)',hi:'इमली',mr:'चिंच'},cat:'fruit',s:['perennial'],d:[240,300],soil:['red','sandy','loam'],w:'low',t:'25–40°C',sow:[6,7,8],st:'orchard',p:['mealybug','fruitborer'],ds:['powdery','leafspot']},
 {id:'watermelon',n:{en:'Watermelon (Kalingad)',hi:'तरबूज',mr:'कलिंगड'},cat:'fruit',s:['zaid','rabi'],d:[80,100],soil:['sandy','loam','welldrained'],w:'medium',t:'25–35°C',sow:[12,1,2],st:'fruitveg',p:['fruitfly','redpumpkinbeetle','thrips','aphid'],ds:['downymildew','powdery','wilt','mosaic']},
 {id:'muskmelon',n:{en:'Muskmelon (Kharbuj)',hi:'खरबूजा',mr:'खरबूज'},cat:'fruit',s:['zaid'],d:[80,100],soil:['sandy','loam','welldrained'],w:'medium',t:'25–35°C',sow:[12,1,2],st:'fruitveg',p:['fruitfly','redpumpkinbeetle','aphid'],ds:['downymildew','powdery','mosaic']},
 /* flowers */
 {id:'marigold',n:{en:'Marigold (Zendu)',hi:'गेंदा',mr:'झेंडू'},cat:'flower',s:['kharif','rabi','zaid'],d:[100,130],soil:['loam','welldrained'],w:'medium',t:'18–30°C',sow:[1,5,6,9,10],st:'flowercrop',p:['mites','thrips','budborer'],ds:['powdery','leafspot','collarrot']},
 {id:'rose',n:{en:'Rose (Gulab)',hi:'गुलाब',mr:'गुलाब'},cat:'flower',s:['perennial'],d:[45,60],soil:['loam','welldrained'],w:'medium',t:'15–28°C',sow:[6,7,10],st:'flowercrop',p:['thrips','mites','aphid'],ds:['powdery','blackspot','dieback']},
 {id:'shevanti',n:{en:'Chrysanthemum (Shevanti)',hi:'गुलदाउदी',mr:'शेवंती'},cat:'flower',s:['kharif','rabi'],d:[120,150],soil:['loam','welldrained'],w:'medium',t:'15–25°C',sow:[6,7],st:'flowercrop',p:['aphid','thrips','leafminer'],ds:['wilt','leafspot','whiterust']},
 {id:'tuberose',n:{en:'Tuberose (Nishigandh)',hi:'रजनीगंधा',mr:'निशिगंध'},cat:'flower',s:['perennial'],d:[90,120],soil:['loam','sandy','welldrained'],w:'medium',t:'20–30°C',sow:[3,4,5,6],st:'flowercrop',p:['thrips','aphid','nematode'],ds:['stemrot','leafspot']},
 {id:'mogra',n:{en:'Jasmine (Mogra)',hi:'मोगरा (बेला)',mr:'मोगरा'},cat:'flower',s:['perennial'],d:[90,120],soil:['loam','sandy','welldrained'],w:'medium',t:'24–32°C',sow:[6,7,8],st:'flowercrop',p:['budborer','mites','whitefly'],ds:['rootrot','leafspot']},
 {id:'aster',n:{en:'China aster',hi:'एस्टर',mr:'ॲस्टर'},cat:'flower',s:['kharif','rabi'],d:[90,120],soil:['loam'],w:'medium',t:'15–25°C',sow:[6,7,9,10],st:'flowercrop',p:['aphid','thrips'],ds:['wilt','rootrot','leafspot']},
 /* fodder */
 {id:'lucerne',n:{en:'Lucerne (Lasun ghas)',hi:'रिजका (लूसर्न)',mr:'लसूण घास'},cat:'fodder',s:['rabi','perennial'],d:[55,70],soil:['loam','black','welldrained'],w:'medium',t:'15–30°C',sow:[10,11],st:'greens',p:['aphid','spodoptera'],ds:['leafspot','downymildew']},
 {id:'napier',n:{en:'Hybrid Napier grass',hi:'हाइब्रिड नेपियर घास',mr:'संकरित नेपियर गवत'},cat:'fodder',s:['perennial'],d:[60,75],soil:['loam','black'],w:'high',t:'25–35°C',sow:[2,3,6,7],st:'greens',p:['termite','spodoptera'],ds:['leafspot','rust']}
];
CROPS = CROPS.concat(MORE_CROPS);

/* ---------- more organic inputs ---------- */
Object.assign(INGR, {
 milk:{en:'Desi cow milk',hi:'देसी गाय का दूध',mr:'देशी गायीचे दूध'},
 curd:{en:'Curd',hi:'दही',mr:'दही'},
 ghee:{en:'Cow ghee',hi:'गाय का घी',mr:'गायीचे तूप'},
 ripebanana:{en:'Ripe bananas',hi:'पके केले',mr:'पिकलेली केळी'},
 coconutwater:{en:'Tender coconut water',hi:'नारियल पानी',mr:'शहाळ्याचे पाणी'},
 buttermilk:{en:'Sour buttermilk (3–5 days old)',hi:'खट्टी छाछ (3–5 दिन पुरानी)',mr:'आंबट ताक (३–५ दिवस जुने)'},
 neemseed:{en:'Neem seed kernel (dry, powdered)',hi:'नीम की निंबोली की गिरी (सूखी, पिसी)',mr:'निंबोळीचा गर (वाळवून कुटलेला)'},
 soap:{en:'Khadi / plain soap',hi:'खादी / सादा साबुन',mr:'खादी / साधा साबण'},
 fish:{en:'Fish waste (fresh)',hi:'मछली का कचरा (ताज़ा)',mr:'माशांचा कचरा (ताजा)'},
 egg:{en:'Eggs (whole)',hi:'अंडे (पूरे)',mr:'अंडी (पूर्ण)'},
 lemon:{en:'Lemons (juice)',hi:'नींबू (रस)',mr:'लिंबे (रस)'}
});
Object.assign(UNITS, {no:{en:'pcs',hi:'नग',mr:'नग'}});

/* rename the two boiled sprays to plain names */
RECIPES.forEach(function(r){
  if(r.id === 'agniastra'){ r.id = 'chilligarlic'; r.n = {en:'Chilli-Garlic Pest Spray (Tikhat Ark)',hi:'मिर्च-लहसुन कीटनाशक अर्क',mr:'मिरची-लसूण कीडनाशक अर्क (तिखट अर्क)'}; }
  if(r.id === 'brahmastra'){ r.id = 'panchparni'; r.n = {en:'Five-Leaf Pest Spray (Panchparni Ark)',hi:'पंचपत्ती कीटनाशक अर्क',mr:'पंचपर्णी कीडनाशक अर्क'}; }
});

RECIPES = RECIPES.concat([
 {id:'panchagavya',n:{en:'Panchagavya (growth tonic)',hi:'पंचगव्य (वृद्धि टॉनिक)',mr:'पंचगव्य (वाढ टॉनिक)'},base:'dilute',dose:3,
  purpose:{en:'Growth promoter — greener leaves, better flowering, fruit size and shine; also improves resistance.',hi:'वृद्धि वर्धक — हरी पत्तियाँ, बेहतर फूल, फल का आकार व चमक; रोग प्रतिरोध भी बढ़ाता है।',mr:'वाढवर्धक — हिरवी पाने, चांगला फुलोरा, फळांचा आकार व चकाकी; रोगप्रतिकारही वाढवते.'},
  ing:[['dung',7,'kg'],['ghee',1,'kg'],['urine',10,'L'],['water',10,'L'],['milk',3,'L'],['curd',2,'L'],['coconutwater',3,'L'],['jaggery',3,'kg'],['ripebanana',12,'no']],
  time:{en:'Ready in about 18–20 days',hi:'लगभग 18–20 दिन में तैयार',mr:'सुमारे १८–२० दिवसांत तयार'},
  m:{en:['Day 1: mix cow dung and ghee in a wide plastic drum or clay pot. Stir morning and evening for 3 days.','Day 4: add cow urine and water. Stir twice a day for 15 days.','Day 19: add milk, curd, coconut water, jaggery and mashed bananas. Mix well.','Keep in shade, covered with a net or cloth; stir twice daily. Ready after about 7 more days (sweet, fermented smell).'],
     hi:['पहला दिन: चौड़े प्लास्टिक ड्रम या मिट्टी के बर्तन में गोबर और घी मिलाएँ। 3 दिन सुबह-शाम हिलाएँ।','चौथा दिन: गोमूत्र और पानी डालें। 15 दिन तक दिन में दो बार हिलाएँ।','19वाँ दिन: दूध, दही, नारियल पानी, गुड़ और मसले केले डालें। अच्छी तरह मिलाएँ।','छाया में, जाली/कपड़े से ढककर रखें; रोज़ दो बार हिलाएँ। लगभग 7 दिन बाद तैयार (मीठी, खमीर जैसी गंध)।'],
     mr:['पहिला दिवस: रुंद प्लास्टिक ड्रम किंवा मातीच्या भांड्यात शेण व तूप मिसळा. ३ दिवस सकाळ-संध्याकाळ ढवळा.','चौथा दिवस: गोमूत्र व पाणी टाका. १५ दिवस दिवसातून दोनदा ढवळा.','१९ वा दिवस: दूध, दही, शहाळ्याचे पाणी, गूळ व कुस्करलेली केळी टाका. चांगले मिसळा.','सावलीत, जाळी/कापडाने झाकून ठेवा; रोज दोनदा ढवळा. सुमारे ७ दिवसांनी तयार (गोडसर, आंबवलेला वास).']},
  use:{en:'Spray 3 L in 100 L water (3%) every 15–20 days, especially before flowering and at fruit set. Can also be given with drip/irrigation.',hi:'100 लीटर पानी में 3 लीटर (3%) हर 15–20 दिन छिड़कें, खासकर फूल आने से पहले और फल लगते समय। ड्रिप/सिंचाई से भी दे सकते हैं।',mr:'१०० लिटर पाण्यात ३ लिटर (३%) दर १५–२० दिवसांनी फवारा, विशेषतः फुलोऱ्यापूर्वी व फळधारणेवेळी. ठिबक/पाण्यातूनही देता येते.'},
  caution:{en:'Filter before spraying to avoid nozzle blocking. Use within about 6 months; keep away from sun.',hi:'नोज़ल बंद न हो इसलिए छिड़काव से पहले छानें। लगभग 6 महीने में उपयोग करें; धूप से दूर रखें।',mr:'नोजल बंद होऊ नये म्हणून फवारणीपूर्वी गाळा. सुमारे ६ महिन्यांत वापरा; उन्हापासून दूर ठेवा.'}},
 {id:'matkakhat',n:{en:'Matka Khat (pot manure)',hi:'मटका खाद',mr:'मटका खत'},base:'acre',
  purpose:{en:'Quick liquid manure made in a clay pot — boosts soil microbes and early crop growth.',hi:'मिट्टी के मटके में बनने वाली जल्दी तैयार तरल खाद — मिट्टी के सूक्ष्मजीव और शुरुआती बढ़वार बढ़ाती है।',mr:'मातीच्या मडक्यात बनणारे झटपट द्रवरूप खत — मातीतील जिवाणू व सुरुवातीची वाढ वाढवते.'},
  ing:[['dung',10,'kg'],['urine',10,'L'],['water',10,'L'],['jaggery',0.25,'kg']],
  time:{en:'Ready in 5–7 days',hi:'5–7 दिन में तैयार',mr:'५–७ दिवसांत तयार'},
  m:{en:['Mix cow dung, cow urine, water and jaggery in a large clay pot (matka).','Close the mouth with a cloth and seal with mud.','Keep the pot in shade (it can be half buried in soil) for 5–7 days.','Open, stir and dilute before use.'],
     hi:['बड़े मिट्टी के मटके में गोबर, गोमूत्र, पानी और गुड़ मिलाएँ।','मुँह कपड़े से बाँधकर मिट्टी से सील करें।','मटके को 5–7 दिन छाया में रखें (आधा ज़मीन में गाड़ सकते हैं)।','खोलकर हिलाएँ और उपयोग से पहले पतला करें।'],
     mr:['मोठ्या मातीच्या मडक्यात शेण, गोमूत्र, पाणी व गूळ मिसळा.','तोंड कापडाने बांधून मातीने बंद करा.','मडके ५–७ दिवस सावलीत ठेवा (अर्धे जमिनीत पुरू शकता).','उघडून ढवळा आणि वापरण्यापूर्वी पाण्यात मिसळा.']},
  use:{en:'Mix the whole pot in about 200 L water and give to 1 acre near the roots or with irrigation. Repeat every 15–20 days.',hi:'पूरा मटका लगभग 200 लीटर पानी में मिलाकर 1 एकड़ में जड़ों के पास या सिंचाई के साथ दें। हर 15–20 दिन दोहराएँ।',mr:'संपूर्ण मडके सुमारे २०० लिटर पाण्यात मिसळून १ एकरात मुळांजवळ किंवा पाण्यासोबत द्या. दर १५–२० दिवसांनी पुन्हा द्या.'},
  caution:{en:'Always dilute — do not pour the concentrate directly on plants.',hi:'हमेशा पतला करें — सांद्र घोल सीधे पौधों पर न डालें।',mr:'नेहमी पाण्यात मिसळा — तीव्र मिश्रण थेट झाडांवर टाकू नका.'}},
 {id:'buttermilk',n:{en:'Sour Buttermilk Spray (Taak)',hi:'खट्टी छाछ का छिड़काव',mr:'आंबट ताक फवारणी'},base:'dilute',dose:5,
  purpose:{en:'Simple home remedy against fungal diseases like powdery mildew, leaf spot and early blight; also a mild growth tonic.',hi:'भभूतिया (पाउडरी मिल्ड्यू), पत्ती धब्बा, अगेती झुलसा जैसे फफूंद रोगों का आसान घरेलू उपाय; हल्का वृद्धि टॉनिक भी।',mr:'भुरी (पावडरी मिल्ड्यू), पानांवरील ठिपके, लवकर करपा अशा बुरशीजन्य रोगांवर सोपा घरगुती उपाय; सौम्य वाढ टॉनिकही.'},
  ing:[['buttermilk',5,'L']],
  time:{en:'Keep buttermilk 3–5 days to turn sour',hi:'छाछ को 3–5 दिन खट्टा होने दें',mr:'ताक ३–५ दिवस आंबट होऊ द्या'},
  m:{en:['Keep buttermilk in a covered plastic or clay pot for 3–5 days until sour.','Stir once a day.','Filter through a cloth before mixing with water.'],
     hi:['छाछ को ढके प्लास्टिक या मिट्टी के बर्तन में 3–5 दिन खट्टा होने तक रखें।','दिन में एक बार हिलाएँ।','पानी में मिलाने से पहले कपड़े से छानें।'],
     mr:['ताक झाकलेल्या प्लास्टिक किंवा मातीच्या भांड्यात ३–५ दिवस आंबट होईपर्यंत ठेवा.','दिवसातून एकदा ढवळा.','पाण्यात मिसळण्यापूर्वी कापडाने गाळा.']},
  use:{en:'Mix 5 L sour buttermilk in 100 L water (750 ml per 15-L pump) and spray at the first sign of disease. Repeat after 7–10 days.',hi:'100 लीटर पानी में 5 लीटर खट्टी छाछ (15 लीटर पंप में 750 मिली) मिलाकर रोग के पहले लक्षण पर छिड़कें। 7–10 दिन बाद दोहराएँ।',mr:'१०० लिटर पाण्यात ५ लिटर आंबट ताक (१५ लिटर पंपात ७५० मिली) मिसळून रोगाची पहिली लक्षणे दिसताच फवारा. ७–१० दिवसांनी पुन्हा फवारा.'},
  caution:{en:'Do not use metal containers. Spray in the evening; test on a few plants first.',hi:'धातु के बर्तन उपयोग न करें। शाम को छिड़कें; पहले कुछ पौधों पर आज़माएँ।',mr:'धातूची भांडी वापरू नका. संध्याकाळी फवारा; आधी काही झाडांवर करून पाहा.'}},
 {id:'nske',n:{en:'Neem Seed Kernel Extract (NSKE 5%)',hi:'निंबोली अर्क (5%)',mr:'निंबोळी अर्क (५%)'},base:'acre',
  purpose:{en:'Proven neem spray (recommended by agricultural universities) against caterpillars, sucking pests and leafminers — kills young larvae and stops feeding.',hi:'कृषि विश्वविद्यालयों द्वारा सुझाया नीम छिड़काव — इल्लियों, रस चूसक कीटों और लीफ माइनर पर; छोटी इल्लियों को मारता है और खाना बंद करता है।',mr:'कृषी विद्यापीठांनी शिफारस केलेली निंबोळी फवारणी — अळ्या, रसशोषक किडी व पाने पोखरणाऱ्या अळीवर; लहान अळ्या मरतात व खाणे थांबते.'},
  ing:[['neemseed',5,'kg'],['water',100,'L'],['soap',100,'g']],
  time:{en:'Soak overnight (12 hours)',hi:'रात भर (12 घंटे) भिगोएँ',mr:'रात्रभर (१२ तास) भिजवा'},
  m:{en:['Collect ripe neem seeds (nimboli), dry in shade and remove the outer skin; pound the kernels coarsely.','Tie the powder in a cloth and soak it overnight in about 10 L of water.','Next morning squeeze the cloth well, filter, and make the liquid up to 100 L with clean water.','Dissolve the soap in a little warm water and add it (helps the spray stick to leaves).'],
     hi:['पकी निंबोली इकट्ठा कर छाया में सुखाएँ, छिलका हटाएँ; गिरी को मोटा कूटें।','पाउडर को कपड़े में बाँधकर लगभग 10 लीटर पानी में रात भर भिगोएँ।','सुबह कपड़े को अच्छी तरह निचोड़ें, छानें और साफ़ पानी से 100 लीटर बनाएँ।','साबुन को थोड़े गुनगुने पानी में घोलकर मिलाएँ (छिड़काव पत्तियों पर चिपकता है)।'],
     mr:['पिकलेल्या निंबोळ्या गोळा करून सावलीत वाळवा, साल काढा; गर जाडसर कुटा.','भुकटी कापडात बांधून सुमारे १० लिटर पाण्यात रात्रभर भिजवा.','सकाळी कापड चांगले पिळा, गाळा आणि स्वच्छ पाण्याने १०० लिटर करा.','साबण थोड्या कोमट पाण्यात विरघळवून टाका (फवारणी पानांवर चिकटते).']},
  use:{en:'Spray the 100 L on 1 acre (about 7 pumps of 15 L) in the evening, as soon as pests appear. Repeat after 7–10 days.',hi:'100 लीटर 1 एकड़ में (15 लीटर के लगभग 7 पंप) शाम को, कीट दिखते ही छिड़कें। 7–10 दिन बाद दोहराएँ।',mr:'१०० लिटर १ एकरात (१५ लिटरचे सुमारे ७ पंप) संध्याकाळी, कीड दिसताच फवारा. ७–१० दिवसांनी पुन्हा फवारा.'},
  caution:{en:'Use the same day — it loses strength in sunlight. Use seeds less than 8 months old.',hi:'उसी दिन उपयोग करें — धूप में असर घटता है। 8 महीने से कम पुरानी निंबोली लें।',mr:'त्याच दिवशी वापरा — उन्हात परिणाम कमी होतो. ८ महिन्यांपेक्षा कमी जुन्या निंबोळ्या वापरा.'}},
 {id:'fishamino',n:{en:'Fish Amino Acid',hi:'मछली अमीनो एसिड',mr:'फिश अमिनो ॲसिड'},base:'dilute',dose:0.2,
  purpose:{en:'Nitrogen-rich liquid feed for fast leaf growth and green colour (good for vegetables and leafy greens).',hi:'नाइट्रोजन से भरपूर तरल खाद — तेज़ पत्ती बढ़वार और हरापन (सब्ज़ियों व पत्तेदार फसलों के लिए अच्छा)।',mr:'नत्रयुक्त द्रवरूप खत — पानांची जलद वाढ व हिरवेपणा (भाजीपाला व पालेभाज्यांसाठी उपयुक्त).'},
  ing:[['fish',1,'kg'],['jaggery',1,'kg']],
  time:{en:'Ready in 25–30 days',hi:'25–30 दिन में तैयार',mr:'२५–३० दिवसांत तयार'},
  m:{en:['Cut fish waste into small pieces.','Mix with jaggery (1:1) in a plastic container, filling only up to three-quarters.','Close the lid loosely and keep in shade; it turns into a thick brown liquid.','After 25–30 days filter and store in bottles.'],
     hi:['मछली के कचरे के छोटे टुकड़े करें।','प्लास्टिक के डिब्बे में गुड़ के साथ (1:1) मिलाएँ, केवल तीन-चौथाई भरें।','ढक्कन हल्का बंद कर छाया में रखें; यह गाढ़ा भूरा तरल बन जाता है।','25–30 दिन बाद छानकर बोतलों में रखें।'],
     mr:['माशांच्या कचऱ्याचे लहान तुकडे करा.','प्लास्टिक डब्यात गुळासोबत (१:१) मिसळा, फक्त तीन-चतुर्थांश भरा.','झाकण सैल लावून सावलीत ठेवा; त्याचे घट्ट तपकिरी द्रव तयार होते.','२५–३० दिवसांनी गाळून बाटल्यांत साठवा.']},
  use:{en:'Mix 2 ml per litre of water (30 ml per 15-L pump) and spray every 10–15 days during the growth stage.',hi:'प्रति लीटर पानी 2 मिली (15 लीटर पंप में 30 मिली) मिलाकर बढ़वार के समय हर 10–15 दिन छिड़कें।',mr:'प्रति लिटर पाण्यात २ मिली (१५ लिटर पंपात ३० मिली) मिसळून वाढीच्या काळात दर १०–१५ दिवसांनी फवारा.'},
  caution:{en:'Strong smell — keep away from the house and pets. Do not exceed the dose.',hi:'तेज़ गंध — घर और पालतू जानवरों से दूर रखें। मात्रा से ज़्यादा न दें।',mr:'उग्र वास — घर व पाळीव प्राण्यांपासून दूर ठेवा. मात्रेपेक्षा जास्त देऊ नका.'}},
 {id:'eggamino',n:{en:'Egg-Lemon Tonic (Egg Amino Acid)',hi:'अंडा-नींबू टॉनिक',mr:'अंडी-लिंबू टॉनिक'},base:'dilute',dose:0.2,
  purpose:{en:'Calcium and protein tonic for flowering and fruit setting; reduces flower and fruit drop.',hi:'फूल और फल लगने के लिए कैल्शियम व प्रोटीन टॉनिक; फूल-फल झड़ना कम करता है।',mr:'फुलोरा व फळधारणेसाठी कॅल्शियम व प्रथिनयुक्त टॉनिक; फुले-फळगळ कमी करते.'},
  ing:[['egg',10,'no'],['lemon',20,'no'],['jaggery',0.25,'kg']],
  time:{en:'Ready in about 20 days',hi:'लगभग 20 दिन में तैयार',mr:'सुमारे २० दिवसांत तयार'},
  m:{en:['Place whole eggs in a plastic or glass jar.','Squeeze lemon juice over them until the eggs are fully covered. Close the lid.','After 10 days the shells soften — mash everything into a paste.','Add jaggery dissolved in a little water, mix, and keep 10 more days. Filter and store.'],
     hi:['पूरे अंडे प्लास्टिक या काँच के जार में रखें।','अंडे पूरी तरह डूब जाएँ इतना नींबू रस निचोड़ें। ढक्कन बंद करें।','10 दिन बाद छिलके नरम हो जाते हैं — सब कुछ मसलकर पेस्ट बनाएँ।','थोड़े पानी में घुला गुड़ मिलाएँ और 10 दिन और रखें। छानकर रखें।'],
     mr:['पूर्ण अंडी प्लास्टिक किंवा काचेच्या बरणीत ठेवा.','अंडी पूर्ण बुडतील इतका लिंबाचा रस पिळा. झाकण लावा.','१० दिवसांनी कवच मऊ होते — सगळे कुस्करून लगदा करा.','थोड्या पाण्यात विरघळवलेला गूळ टाका, मिसळा आणि आणखी १० दिवस ठेवा. गाळून साठवा.']},
  use:{en:'Mix 2 ml per litre of water (30 ml per 15-L pump) and spray at flowering and fruit set, 2–3 times at 10-day gaps.',hi:'प्रति लीटर पानी 2 मिली (15 लीटर पंप में 30 मिली) मिलाकर फूल व फल लगते समय 10 दिन के अंतर पर 2–3 बार छिड़कें।',mr:'प्रति लिटर पाण्यात २ मिली (१५ लिटर पंपात ३० मिली) मिसळून फुलोरा व फळधारणेवेळी १० दिवसांच्या अंतराने २–३ वेळा फवारा.'},
  caution:{en:'Keep the jar closed and in shade. Do not spray on very hot afternoons.',hi:'जार बंद और छाया में रखें। तेज़ धूप वाली दोपहर में न छिड़कें।',mr:'बरणी बंद व सावलीत ठेवा. कडक उन्हाच्या दुपारी फवारू नका.'}}
]);

/* ===================================================================
   HIGH-VALUE / FOREIGN (EXOTIC) CROPS — location-wise.
   x.good  = states where the crop is already grown well in open field
   x.ok    = possible with care (hill pockets, shade net, polyhouse, special varieties)
   x.yld   = yield per acre at full bearing [min,max] (x.yu: 'kg' per acre or 'bag' = per 100 bags)
   x.price = usual farm-gate price ₹/kg [min,max]
   x.inv   = first-year cost / setup ₹ per acre [min,max]
   All values are approximate reference ranges — confirm with KVK / horticulture department.
   =================================================================== */
STAGESETS.leafy = [['establish',0],['veg',15],['head',55],['harvest',80]];
STAGESETS.seedcrop = [['germ',0],['veg',10],['flower',50],['fill',68],['mature',88]];
STAGESETS.fruittree = [['establish',0],['veg',10],['flower',55],['fruit',70],['harvest',88]];
STAGESETS.mush = [['spawn',0],['run',3],['pin',40],['harvest',50]];

PESTS.mealybug = {en:'Mealybug',hi:'मिलीबग (चूर्णी मत्कुण)',mr:'पिठ्या ढेकूण'};
PESTS.fruitfly = {en:'Fruit fly',hi:'फल मक्खी',mr:'फळमाशी'};
PESTS.dbm = {en:'Diamondback moth',hi:'हीरक पृष्ठ पतंगा (DBM)',mr:'चौकोनी ठिपक्यांचा पतंग'};
PESTS.mushfly = {en:'Mushroom flies (sciarid)',hi:'मशरूम मक्खी',mr:'अळिंबीवरील माशी'};
PESTS.rodent = {en:'Rodents / porcupine',hi:'चूहे / साही',mr:'उंदीर / साळिंदर'};
DISEASES.stemrot = {en:'Stem rot',hi:'तना सड़न',mr:'खोडकूज'};
DISEASES.phytophthora = {en:'Phytophthora root rot',hi:'फाइटोफ्थोरा जड़ सड़न',mr:'फायटोफ्थोरा मुळकूज'};
DISEASES.greymould = {en:'Grey mould (Botrytis)',hi:'धूसर फफूंद (बोट्राइटिस)',mr:'करडी बुरशी (बोट्रायटिस)'};
DISEASES.prsv = {en:'Papaya ring spot virus',hi:'पपीता रिंग स्पॉट वायरस',mr:'पपई रिंग स्पॉट विषाणू'};
DISEASES.greenmould = {en:'Green mould (Trichoderma contamination)',hi:'हरी फफूंद',mr:'हिरवी बुरशी'};

var EXOTIC = [
 {id:'dragonfruit',n:{en:'Dragon fruit (Kamalam)',hi:'ड्रैगन फ्रूट (कमलम)',mr:'ड्रॅगन फ्रूट (कमलम)'},cat:'exotic',s:['perennial'],d:[420,540],soil:['sandy','welldrained','loam'],w:'low',t:'20–35°C',sow:[2,3,6,7],st:'fruittree',p:['mealybug','fruitfly'],ds:['stemrot','anthracnose'],
  x:{origin:{en:'Central America',hi:'मध्य अमेरिका',mr:'मध्य अमेरिका'},prot:'open',yld:[3000,6000],yu:'kg',price:[60,150],inv:[300000,600000],first:14,life:20,
   good:['Maharashtra','Gujarat','Karnataka','Telangana','Andhra Pradesh','Tamil Nadu','Madhya Pradesh','Chhattisgarh','Odisha','West Bengal','Rajasthan','Mizoram'],
   ok:['Uttar Pradesh','Haryana','Punjab','Bihar','Jharkhand','Kerala','Nagaland','Tripura','Assam','Delhi','Goa'],
   note:{en:'Drought-hardy cactus on concrete poles; low water and few pests. Red/pink flesh fetches better prices in city markets.',hi:'सीमेंट खंभों पर उगने वाला कैक्टस; कम पानी, कम कीट। लाल/गुलाबी गूदे वाली किस्म शहरों में अच्छे दाम पाती है।',mr:'सिमेंट खांबांवर वाढणारे निवडुंग; कमी पाणी, कमी कीड. लाल/गुलाबी गराच्या जातीला शहरात चांगला भाव मिळतो.'}}},
 {id:'avocado',n:{en:'Avocado',hi:'एवोकाडो',mr:'ॲव्होकॅडो'},cat:'exotic',s:['perennial'],d:[1100,1500],soil:['loam','welldrained','red'],w:'medium',t:'15–30°C',sow:[6,7,8],st:'fruittree',p:['mites','thrips'],ds:['phytophthora','anthracnose'],
  x:{origin:{en:'Mexico',hi:'मेक्सिको',mr:'मेक्सिको'},prot:'open',yld:[2000,5000],yu:'kg',price:[120,300],inv:[150000,350000],first:40,life:30,
   good:['Karnataka','Kerala','Tamil Nadu','Sikkim','Meghalaya'],
   ok:['Maharashtra','Mizoram','Arunachal Pradesh','Nagaland','Manipur','Uttarakhand','Goa','Assam','Himachal Pradesh'],
   note:{en:'Needs mild climate and perfect drainage — dies in waterlogged soil. Plant grafted plants (e.g. Hass) from a reliable nursery.',hi:'हल्की जलवायु और अच्छी जल निकासी ज़रूरी — पानी रुकने पर पौधा मर जाता है। भरोसेमंद नर्सरी से ग्राफ्टेड पौधे (जैसे हास) लगाएँ।',mr:'सौम्य हवामान आणि उत्तम निचरा आवश्यक — पाणी साचल्यास झाड मरते. खात्रीशीर रोपवाटिकेतून कलमी रोपे (उदा. हास) लावा.'}}},
 {id:'strawberry',n:{en:'Strawberry',hi:'स्ट्रॉबेरी',mr:'स्ट्रॉबेरी'},cat:'exotic',s:['rabi'],d:[150,200],soil:['sandy','loam','welldrained'],w:'medium',t:'15–25°C',sow:[9,10],st:'fruitveg',p:['mites','thrips','aphid'],ds:['greymould','powdery'],
  x:{origin:{en:'Europe / Americas',hi:'यूरोप / अमेरिका',mr:'युरोप / अमेरिका'},prot:'open',yld:[3000,5000],yu:'kg',price:[100,250],inv:[250000,450000],first:3,life:1,
   good:['Maharashtra','Himachal Pradesh','Uttarakhand','Jammu and Kashmir','Punjab','Haryana','Uttar Pradesh','Meghalaya','Sikkim','Delhi'],
   ok:['Rajasthan','Madhya Pradesh','Karnataka','Bihar','West Bengal','Nagaland','Manipur','Arunachal Pradesh','Chandigarh'],
   note:{en:'Winter crop on raised beds with plastic mulch and drip. Sell fresh near cities or tourist spots, or make pulp/jam.',hi:'सर्दी की फसल — ऊँची क्यारी, प्लास्टिक मल्च और ड्रिप पर। शहरों/पर्यटन स्थलों के पास ताज़ा बेचें या पल्प/जैम बनाएँ।',mr:'हिवाळी पीक — गादीवाफे, प्लास्टिक आच्छादन आणि ठिबकवर. शहर/पर्यटनस्थळाजवळ ताजी विक्री किंवा पल्प/जॅम.'}}},
 {id:'broccoli',n:{en:'Broccoli',hi:'ब्रोकली',mr:'ब्रोकोली'},cat:'exotic',s:['rabi'],d:[90,110],soil:['loam','welldrained'],w:'medium',t:'15–22°C',sow:[9,10,11],st:'leafy',p:['dbm','aphid'],ds:['alternaria','downymildew'],
  x:{origin:{en:'Italy (Mediterranean)',hi:'इटली (भूमध्य सागर)',mr:'इटली (भूमध्य प्रदेश)'},prot:'open',yld:[3000,5000],yu:'kg',price:[30,80],inv:[60000,100000],first:3,life:1,
   good:['Himachal Pradesh','Uttarakhand','Jammu and Kashmir','Punjab','Haryana','Uttar Pradesh','Delhi','Bihar','West Bengal','Maharashtra','Karnataka','Meghalaya','Sikkim','Chandigarh'],
   ok:['Madhya Pradesh','Rajasthan','Gujarat','Telangana','Tamil Nadu','Assam','Jharkhand','Odisha','Nagaland','Manipur','Arunachal Pradesh'],
   note:{en:'Grows like cauliflower in cool winter. Harvest the green head while buds are tight; supply hotels, supermarkets and city vegetable vendors.',hi:'ठंडी सर्दी में फूलगोभी की तरह उगती है। कलियाँ कसी हों तभी हरा फूल काटें; होटल, सुपरमार्केट और शहर के सब्ज़ी विक्रेताओं को दें।',mr:'थंड हिवाळ्यात फुलकोबीसारखी येते. कळ्या घट्ट असताना हिरवा गड्डा काढा; हॉटेल, सुपरमार्केट व शहरातील विक्रेत्यांना पुरवा.'}}},
 {id:'ccapsicum',n:{en:'Coloured capsicum',hi:'रंगीन शिमला मिर्च',mr:'रंगीत ढोबळी मिरची'},cat:'exotic',s:['annual'],d:[240,300],soil:['loam','welldrained'],w:'medium',t:'18–28°C',sow:[7,8,9],st:'fruitveg',p:['thrips','mites','whitefly'],ds:['powdery','collarrot','leafcurl'],
  x:{origin:{en:'Americas (Dutch varieties)',hi:'अमेरिका (डच किस्में)',mr:'अमेरिका (डच जाती)'},prot:'poly',yld:[25000,40000],yu:'kg',price:[40,100],inv:[3000000,4500000],first:3,life:1,
   good:['Maharashtra','Karnataka','Himachal Pradesh','Uttarakhand','Telangana','Haryana','Punjab','Tamil Nadu','Gujarat','Andhra Pradesh','Jammu and Kashmir','Uttar Pradesh','Madhya Pradesh','Rajasthan','Delhi'],
   ok:['Bihar','West Bengal','Odisha','Chhattisgarh','Jharkhand','Kerala','Assam','Meghalaya','Sikkim','Goa','Chandigarh'],
   note:{en:'Red and yellow capsicum in a polyhouse gives very high yield per acre. Polyhouse cost is high but MIDH/NHM gives about 50% subsidy — start with 10–20 guntha.',hi:'पॉलीहाउस में लाल-पीली शिमला मिर्च प्रति एकड़ बहुत उत्पादन देती है। पॉलीहाउस महँगा है पर MIDH/NHM में लगभग 50% सब्सिडी है — 10–20 गुंठा से शुरू करें।',mr:'पॉलीहाऊसमधील लाल-पिवळी ढोबळी मिरची एकरी खूप उत्पादन देते. पॉलीहाऊस महाग पण MIDH/NHM मध्ये सुमारे ५०% अनुदान — १०–२० गुंठ्यांपासून सुरुवात करा.'}}},
 {id:'cherrytomato',n:{en:'Cherry tomato',hi:'चेरी टमाटर',mr:'चेरी टोमॅटो'},cat:'exotic',s:['rabi','annual'],d:[150,210],soil:['loam','welldrained'],w:'medium',t:'18–27°C',sow:[7,8,9,10],st:'fruitveg',p:['fruitborer','whitefly','leafminer'],ds:['earlyblight','lateblight','leafcurl'],
  x:{origin:{en:'South America',hi:'दक्षिण अमेरिका',mr:'दक्षिण अमेरिका'},prot:'shade',yld:[8000,15000],yu:'kg',price:[40,120],inv:[200000,1500000],first:3,life:1,
   good:['Maharashtra','Karnataka','Telangana','Andhra Pradesh','Tamil Nadu','Himachal Pradesh','Uttarakhand','Punjab','Haryana','Gujarat','Madhya Pradesh','Uttar Pradesh','Delhi'],
   ok:['Rajasthan','Bihar','West Bengal','Odisha','Chhattisgarh','Kerala','Jharkhand','Assam','Meghalaya','Sikkim','Jammu and Kashmir','Goa'],
   note:{en:'Small sweet tomatoes sold in punnets to supermarkets and hotels. Best under shade net; possible in open field in winter. Find a buyer before planting.',hi:'छोटे मीठे टमाटर, डिब्बों में सुपरमार्केट/होटल को बिकते हैं। शेड नेट में सबसे अच्छा; सर्दी में खुले खेत में भी। लगाने से पहले खरीदार तय करें।',mr:'लहान गोड टोमॅटो, पनेटमध्ये सुपरमार्केट/हॉटेलला विकले जातात. शेडनेटमध्ये उत्तम; हिवाळ्यात उघड्यावरही. लागवडीपूर्वी खरेदीदार ठरवा.'}}},
 {id:'zucchini',n:{en:'Zucchini',hi:'ज़ुकीनी',mr:'झुकिनी'},cat:'exotic',s:['rabi','zaid'],d:[60,90],soil:['loam','sandy','welldrained'],w:'medium',t:'18–28°C',sow:[1,2,9,10,11],st:'fruitveg',p:['fruitfly','aphid','whitefly'],ds:['powdery','downymildew','yellowmosaic'],
  x:{origin:{en:'Italy',hi:'इटली',mr:'इटली'},prot:'open',yld:[5000,8000],yu:'kg',price:[25,70],inv:[50000,90000],first:2,life:1,
   good:['Punjab','Haryana','Himachal Pradesh','Uttarakhand','Uttar Pradesh','Delhi','Jammu and Kashmir','Maharashtra','Karnataka','Chandigarh'],
   ok:['Rajasthan','Madhya Pradesh','Gujarat','Telangana','Bihar','West Bengal','Meghalaya','Sikkim','Andhra Pradesh','Tamil Nadu'],
   note:{en:'Quick crop — first picking in about 45 days. Pick fruits young (15–20 cm) every 2–3 days for city markets and hotels.',hi:'जल्दी फसल — लगभग 45 दिन में पहली तुड़ाई। शहर/होटल के लिए फल छोटे (15–20 सेमी) रहते हुए हर 2–3 दिन तोड़ें।',mr:'झटपट पीक — सुमारे ४५ दिवसांत पहिली तोडणी. शहर/हॉटेलसाठी फळे लहान (१५–२० सेंमी) असतानाच दर २–३ दिवसांनी तोडा.'}}},
 {id:'lettuce',n:{en:'Iceberg lettuce',hi:'आइसबर्ग लेट्यूस (सलाद पत्ता)',mr:'आइसबर्ग लेट्यूस'},cat:'exotic',s:['rabi'],d:[60,90],soil:['loam','welldrained'],w:'medium',t:'12–22°C',sow:[9,10,11],st:'leafy',p:['aphid','cutworm'],ds:['downymildew','leafspot'],
  x:{origin:{en:'Mediterranean',hi:'भूमध्य सागर क्षेत्र',mr:'भूमध्य प्रदेश'},prot:'open',yld:[4000,7000],yu:'kg',price:[30,80],inv:[50000,100000],first:2,life:1,
   good:['Himachal Pradesh','Uttarakhand','Jammu and Kashmir','Punjab','Haryana','Uttar Pradesh','Delhi','Maharashtra','Karnataka','Meghalaya','Sikkim','Chandigarh'],
   ok:['Telangana','Madhya Pradesh','Rajasthan','Gujarat','West Bengal','Bihar','Nagaland','Tamil Nadu','Andhra Pradesh'],
   note:{en:'Demand from burger/sandwich chains and hotels. Cool weather is a must — heads do not form in heat. Grow near a city.',hi:'बर्गर/सैंडविच चेन और होटलों में माँग। ठंडा मौसम ज़रूरी — गर्मी में गड्डा नहीं बनता। शहर के पास उगाएँ।',mr:'बर्गर/सँडविच चेन व हॉटेलमध्ये मागणी. थंड हवामान आवश्यक — उष्णतेत गड्डा बसत नाही. शहराजवळ घ्या.'}}},
 {id:'quinoa',n:{en:'Quinoa',hi:'किनोआ',mr:'किनोआ'},cat:'exotic',s:['rabi'],d:[100,130],soil:['sandy','loam','welldrained'],w:'low',t:'15–25°C',sow:[10,11],st:'seedcrop',p:['aphid','cutworm'],ds:['downymildew'],
  x:{origin:{en:'Andes (Peru, Bolivia)',hi:'एंडीज़ (पेरू, बोलीविया)',mr:'अँडीज (पेरू, बोलिव्हिया)'},prot:'open',yld:[500,1000],yu:'kg',price:[50,100],inv:[15000,30000],first:4,life:1,
   good:['Rajasthan','Gujarat','Madhya Pradesh','Maharashtra','Telangana','Andhra Pradesh','Karnataka','Uttar Pradesh','Haryana'],
   ok:['Punjab','Bihar','Chhattisgarh','Odisha','Tamil Nadu','Jharkhand'],
   note:{en:'Low-water rabi grain, tolerates some salt. Market is limited — grow under contract with a processor or FPO.',hi:'कम पानी वाला रबी अनाज, थोड़ा खारापन सह लेता है। बाज़ार सीमित — प्रोसेसर या FPO के साथ अनुबंध पर उगाएँ।',mr:'कमी पाण्याचे रब्बी धान्य, थोडा क्षारपणा सहन करते. बाजार मर्यादित — प्रक्रिया उद्योग किंवा FPO सोबत करार करून घ्या.'}}},
 {id:'chia',n:{en:'Chia seed',hi:'चिया',mr:'चिया'},cat:'exotic',s:['rabi'],d:[110,130],soil:['loam','sandy','welldrained'],w:'low',t:'15–30°C',sow:[10,11],st:'seedcrop',p:['aphid'],ds:['collarrot'],
  x:{origin:{en:'Mexico',hi:'मेक्सिको',mr:'मेक्सिको'},prot:'open',yld:[250,450],yu:'kg',price:[150,300],inv:[15000,25000],first:4,life:1,
   good:['Karnataka','Madhya Pradesh','Rajasthan','Maharashtra','Telangana','Andhra Pradesh','Gujarat'],
   ok:['Uttar Pradesh','Haryana','Punjab','Tamil Nadu','Chhattisgarh'],
   note:{en:'Low-cost, low-water rabi crop; strong smell keeps most pests and animals away. Prices swing a lot — confirm a buyer first.',hi:'कम लागत, कम पानी वाली रबी फसल; तेज़ गंध से कीट और जानवर दूर रहते हैं। दाम बहुत ऊपर-नीचे होते हैं — पहले खरीदार पक्का करें।',mr:'कमी खर्च, कमी पाण्याचे रब्बी पीक; उग्र वासामुळे कीड व जनावरे दूर राहतात. भाव खूप बदलतात — आधी खरेदीदार निश्चित करा.'}}},
 {id:'kiwi',n:{en:'Kiwi',hi:'कीवी',mr:'किवी'},cat:'exotic',s:['perennial'],d:[1460,1825],soil:['loam','welldrained'],w:'medium',t:'10–30°C (needs winter chill)',sow:[1,2,12],st:'fruittree',p:['mites','mealybug'],ds:['collarrot','phytophthora'],
  x:{origin:{en:'China / New Zealand',hi:'चीन / न्यूज़ीलैंड',mr:'चीन / न्यूझीलंड'},prot:'open',yld:[3000,6000],yu:'kg',price:[80,200],inv:[400000,700000],first:54,life:30,
   good:['Himachal Pradesh','Arunachal Pradesh','Sikkim','Nagaland','Uttarakhand','Jammu and Kashmir','Meghalaya','Manipur'],
   ok:['Mizoram','West Bengal','Tamil Nadu'],
   note:{en:'Hill crop on a T-bar trellis. Plant 1 male vine for every 8 female vines for fruit set. Long wait (4–5 years) but a long life.',hi:'पहाड़ी फसल, T-बार जाली पर। फल लगने के लिए हर 8 मादा बेल पर 1 नर बेल लगाएँ। 4–5 साल इंतज़ार, पर बाग लंबा चलता है।',mr:'डोंगरी पीक, T-बार मांडवावर. फळधारणेसाठी दर ८ मादी वेलींमागे १ नर वेल लावा. ४–५ वर्षे थांबावे लागते, पण बाग दीर्घकाळ टिकते.'}}},
 {id:'blueberry',n:{en:'Blueberry',hi:'ब्लूबेरी',mr:'ब्लूबेरी'},cat:'exotic',s:['perennial'],d:[700,900],soil:['sandy','red'],w:'medium',t:'15–28°C',sow:[2,7,8],st:'fruittree',p:['thrips','mites'],ds:['phytophthora','anthracnose'],
  x:{origin:{en:'North America',hi:'उत्तरी अमेरिका',mr:'उत्तर अमेरिका'},prot:'shade',yld:[1500,3000],yu:'kg',price:[500,1000],inv:[1500000,2500000],first:24,life:15,
   good:['Himachal Pradesh','Uttarakhand','Meghalaya','Sikkim','Arunachal Pradesh'],
   ok:['Maharashtra','Karnataka','Tamil Nadu','Nagaland','Manipur','Mizoram','Kerala','Jammu and Kashmir'],
   note:{en:'Very high price but needs acidic soil (pH 4.5–5.5) — usually grown in pots/grow-bags with cocopeat and drip. Use low-chill varieties in warm areas. High investment: start small.',hi:'दाम बहुत ऊँचे, पर अम्लीय मिट्टी (pH 4.5–5.5) चाहिए — अक्सर कोकोपीट वाले गमलों/ग्रो-बैग में ड्रिप से। गर्म क्षेत्रों में लो-चिल किस्में। निवेश ज़्यादा: छोटे से शुरू करें।',mr:'भाव खूप जास्त, पण आम्लीय माती (pH ४.५–५.५) लागते — सहसा कोकोपीटच्या कुंड्या/ग्रो-बॅगमध्ये ठिबकवर. उष्ण भागात लो-चिल जाती. गुंतवणूक जास्त: लहान सुरुवात करा.'}}},
 {id:'passionfruit',n:{en:'Passion fruit',hi:'पैशन फ्रूट',mr:'पॅशन फ्रूट'},cat:'exotic',s:['perennial'],d:[270,365],soil:['loam','welldrained','red'],w:'medium',t:'20–30°C',sow:[6,7,8],st:'fruittree',p:['fruitfly','mites','mealybug'],ds:['wilt','collarrot'],
  x:{origin:{en:'Brazil',hi:'ब्राज़ील',mr:'ब्राझील'},prot:'open',yld:[3000,6000],yu:'kg',price:[50,120],inv:[200000,400000],first:10,life:6,
   good:['Kerala','Karnataka','Tamil Nadu','Mizoram','Manipur','Nagaland','Meghalaya','Sikkim','Arunachal Pradesh','Assam'],
   ok:['Maharashtra','Goa','Andhra Pradesh','Tripura','West Bengal','Odisha','Uttarakhand'],
   note:{en:'Vine on a trellis; fruits within a year. Juice and pulp industry buys in bulk; purple types suit higher areas, yellow types the plains.',hi:'जाली पर चढ़ने वाली बेल; एक साल में फल। जूस/पल्प उद्योग थोक में खरीदता है; बैंगनी किस्म ऊँचाई पर, पीली मैदान में।',mr:'मांडवावरील वेल; वर्षभरात फळे. ज्यूस/पल्प उद्योग मोठ्या प्रमाणात खरेदी करतो; जांभळी जात उंच भागात, पिवळी सपाट भागात.'}}},
 {id:'saffron',n:{en:'Saffron',hi:'केसर',mr:'केशर'},cat:'exotic',s:['rabi'],d:[90,110],soil:['loam','welldrained'],w:'low',t:'10–20°C (cold winters)',sow:[7,8],st:'tuber',p:['rodent'],ds:['rhizomerot'],
  x:{origin:{en:'Iran / Kashmir',hi:'ईरान / कश्मीर',mr:'इराण / काश्मीर'},prot:'open',yld:[1,2.5],yu:'kg',price:[150000,300000],inv:[500000,1000000],first:3,life:5,
   good:['Jammu and Kashmir'],
   ok:['Himachal Pradesh','Uttarakhand','Ladakh','Arunachal Pradesh','Sikkim'],
   note:{en:'Grows in cold, dry Kashmir-type climate. Elsewhere only in a cooled indoor (aeroponic) room — beware of costly "saffron farming" packages. Buy disease-free corms.',hi:'ठंडी, सूखी कश्मीर जैसी जलवायु में उगता है। बाकी जगह केवल ठंडे इनडोर (एरोपोनिक) कमरे में — महँगे "केसर पैकेज" से सावधान। रोगमुक्त कंद ही खरीदें।',mr:'थंड, कोरड्या काश्मीरसारख्या हवामानात येते. इतरत्र फक्त थंड इनडोअर (एरोपोनिक) खोलीत — महागड्या "केशर पॅकेज"पासून सावध. रोगमुक्त कंदच घ्या.'}}},
 {id:'mushroom',n:{en:'Oyster mushroom',hi:'ऑयस्टर मशरूम (ढींगरी)',mr:'ऑयस्टर मशरूम (अळिंबी)'},cat:'exotic',s:['annual'],d:[45,60],soil:['welldrained'],w:'medium',t:'20–30°C, high humidity',sow:[1,2,3,7,8,9,10,11,12],st:'mush',p:['mushfly'],ds:['greenmould'],
  x:{origin:{en:'Grown worldwide (indoor)',hi:'दुनिया भर में (इनडोर)',mr:'जगभर (इनडोअर)'},prot:'indoor',yld:[70,100],yu:'bag',price:[100,200],inv:[5000,10000],first:1,life:0,
   good:STATES.slice(),ok:[],
   note:{en:'Needs no land — grow in a clean, dark, humid room on chopped wheat/soybean straw. Fresh mushrooms spoil fast: sell locally or dry them.',hi:'ज़मीन की ज़रूरत नहीं — साफ़, अँधेरे, नम कमरे में कटे गेहूँ/सोयाबीन भूसे पर उगाएँ। ताज़ा मशरूम जल्दी खराब होता है: पास में बेचें या सुखाएँ।',mr:'जमीन लागत नाही — स्वच्छ, अंधाऱ्या, दमट खोलीत कापलेल्या गहू/सोयाबीन काडावर घ्या. ताजी अळिंबी लवकर खराब होते: जवळ विका किंवा वाळवा.'}}},
 {id:'papaya',n:{en:'Taiwan papaya (Red Lady)',hi:'ताइवान पपीता (रेड लेडी)',mr:'तैवान पपई (रेड लेडी)'},cat:'exotic',s:['annual'],d:[240,300],soil:['loam','welldrained','sandy'],w:'medium',t:'22–35°C',sow:[2,3,6,7,9,10],st:'fruittree',p:['mealybug','mites','aphid'],ds:['prsv','collarrot'],
  x:{origin:{en:'Taiwan',hi:'ताइवान',mr:'तैवान'},prot:'open',yld:[15000,30000],yu:'kg',price:[8,20],inv:[100000,180000],first:9,life:2,
   good:['Maharashtra','Gujarat','Karnataka','Andhra Pradesh','Telangana','Tamil Nadu','Madhya Pradesh','Chhattisgarh','Odisha','West Bengal','Bihar','Uttar Pradesh','Kerala','Assam','Jharkhand'],
   ok:['Punjab','Haryana','Rajasthan','Delhi','Tripura','Meghalaya'],
   note:{en:'Fruits in 8–10 months with heavy yield. Ring-spot virus is the big risk: use healthy seedlings, a border crop of maize and yellow sticky traps, and remove infected plants early.',hi:'8–10 महीने में फल, भारी उत्पादन। रिंग स्पॉट वायरस बड़ा खतरा: स्वस्थ पौध, मक्के की बॉर्डर फसल, पीले चिपचिपे ट्रैप लगाएँ और रोगी पौधे जल्दी उखाड़ें।',mr:'८–१० महिन्यांत फळे, भरघोस उत्पादन. रिंग स्पॉट विषाणू हा मोठा धोका: निरोगी रोपे, मक्याचे कुंपण पीक, पिवळे चिकट सापळे आणि रोगट झाडे लवकर उपटा.'}}},
 {id:'datepalm',n:{en:'Date palm (Khajur)',hi:'खजूर',mr:'खजूर'},cat:'exotic',s:['perennial'],d:[1095,1460],soil:['sandy','loam'],w:'medium',t:'25–45°C, dry',sow:[2,3,7,8],st:'fruittree',p:['weevil'],ds:['leafspot'],
  x:{origin:{en:'Middle East',hi:'मध्य पूर्व (अरब)',mr:'मध्यपूर्व (अरब)'},prot:'open',yld:[3000,6000],yu:'kg',price:[50,120],inv:[400000,700000],first:40,life:40,
   good:['Gujarat','Rajasthan'],
   ok:['Punjab','Haryana','Tamil Nadu','Karnataka','Maharashtra','Andhra Pradesh','Telangana'],
   note:{en:'Best for hot, dry, even slightly salty land (Kutch, western Rajasthan). Plant tissue-culture Barhee plants; fruits are sold fresh at the yellow (khalal) stage.',hi:'गर्म, सूखी, थोड़ी खारी ज़मीन के लिए उत्तम (कच्छ, पश्चिमी राजस्थान)। टिश्यू कल्चर बरही पौधे लगाएँ; पीले (खलाल) चरण में ताज़ा बिकता है।',mr:'उष्ण, कोरड्या, थोड्या क्षारयुक्त जमिनीसाठी उत्तम (कच्छ, पश्चिम राजस्थान). टिश्यू कल्चर बरही रोपे लावा; पिवळ्या (खलाल) अवस्थेत ताजी विक्री.'}}},
 {id:'sweetcorn',n:{en:'Sweet corn',hi:'स्वीट कॉर्न',mr:'स्वीट कॉर्न'},cat:'exotic',s:['kharif','rabi','zaid'],d:[75,90],soil:['loam','welldrained'],w:'medium',t:'20–30°C',sow:[1,2,6,7,10,11],st:'cereal',p:['faw','stemborer'],ds:['turcicum','downymildew'],
  x:{origin:{en:'Americas',hi:'अमेरिका',mr:'अमेरिका'},prot:'open',yld:[3000,5000],yu:'kg',price:[8,20],inv:[30000,50000],first:3,life:1,
   good:['Maharashtra','Karnataka','Telangana','Andhra Pradesh','Tamil Nadu','Punjab','Haryana','Uttar Pradesh','Bihar','Madhya Pradesh','Gujarat','Rajasthan','West Bengal','Delhi','Himachal Pradesh','Uttarakhand','Chhattisgarh','Odisha','Jharkhand'],
   ok:['Kerala','Assam','Meghalaya','Sikkim','Jammu and Kashmir','Goa','Tripura','Manipur','Nagaland','Mizoram','Arunachal Pradesh'],
   note:{en:'Quick 75–90 day crop; green cobs sell near cities, highways and to processors, and the green fodder feeds cattle. Watch for fall armyworm.',hi:'75–90 दिन की जल्दी फसल; हरे भुट्टे शहर, हाईवे और प्रोसेसर को बिकते हैं, हरा चारा पशुओं के काम आता है। फॉल आर्मीवर्म पर नज़र रखें।',mr:'७५–९० दिवसांचे झटपट पीक; हिरवी कणसे शहर, महामार्ग व प्रक्रिया उद्योगाला विकतात, हिरवा चारा जनावरांना. लष्करी अळीवर लक्ष ठेवा.'}}}
];
CROPS = CROPS.concat(EXOTIC);

/* state → how well an exotic crop fits: 'good' | 'ok' | 'no' */
function exoticFit(c, state){ if(!c || !c.x) return 'no'; if(c.x.good.indexOf(state) > -1) return 'good'; if(c.x.ok.indexOf(state) > -1) return 'ok'; return 'no'; }

/* ===================================================================
   SOIL TEST — Soil Health Card ratings (general Indian SHC limits).
   r = [lowLimit, highLimit]: value < low → low, > high → high, else medium.
   =================================================================== */
var SOILP = [
 {k:'ph', u:'', min:3, max:11, step:0.1, ph:true},
 {k:'ec', u:'dS/m', min:0, max:20, step:0.01, r:[1,3], ec:true},
 {k:'oc', u:'%', min:0, max:5, step:0.01, r:[0.5,0.75]},
 {k:'n', u:'kg/ha', min:0, max:1500, step:1, r:[280,560]},
 {k:'p', u:'kg/ha', min:0, max:300, step:0.1, r:[10,25]},
 {k:'k', u:'kg/ha', min:0, max:1500, step:1, r:[120,280]},
 {k:'s', u:'ppm', min:0, max:200, step:0.1, r:[10,20], micro:true},
 {k:'zn', u:'ppm', min:0, max:50, step:0.01, r:[0.6,1.2], micro:true},
 {k:'fe', u:'ppm', min:0, max:200, step:0.01, r:[4.5,9], micro:true},
 {k:'mn', u:'ppm', min:0, max:200, step:0.01, r:[2,4], micro:true},
 {k:'cu', u:'ppm', min:0, max:50, step:0.01, r:[0.2,0.4], micro:true},
 {k:'b', u:'ppm', min:0, max:20, step:0.01, r:[0.5,1.0], micro:true}
];
/* returns {lv:'low'|'medium'|'high'|..., tone:'r'|'s'|'g'} */
function soilRate(p, v){
  if(v === '' || v == null || isNaN(v)) return null;
  v = +v;
  if(p.ph){ if(v < 5.5) return {lv:'ph_acid', tone:'r'}; if(v < 6.5) return {lv:'ph_sacid', tone:'s'}; if(v <= 7.5) return {lv:'ph_neutral', tone:'g'}; if(v <= 8.5) return {lv:'ph_salk', tone:'s'}; return {lv:'ph_alk', tone:'r'}; }
  if(p.ec){ if(v < p.r[0]) return {lv:'ec_normal', tone:'g'}; if(v <= p.r[1]) return {lv:'ec_mod', tone:'s'}; return {lv:'ec_high', tone:'r'}; }
  if(v < p.r[0]) return {lv:'low', tone:'r'}; if(v <= p.r[1]) return {lv:'medium', tone:'s'}; return {lv:'high', tone:'g'};
}
/* simple home soil tests (no lab needed) */
var HOMETESTS = [
 {id:'jar', n:{en:'Jar test — soil texture',hi:'बोतल परीक्षण — मिट्टी की बनावट',mr:'बरणी चाचणी — मातीचा पोत'},
  m:{en:['Fill one-third of a clear bottle with soil from 15 cm depth.','Add water till almost full, plus a pinch of salt or detergent.','Shake hard for 3 minutes and keep it still for 24 hours.','Sand settles at the bottom first, then silt, and clay on top.'],hi:['पारदर्शी बोतल का एक-तिहाई हिस्सा 15 सेमी गहराई की मिट्टी से भरें।','लगभग पूरा पानी भरें, एक चुटकी नमक या डिटर्जेंट डालें।','3 मिनट ज़ोर से हिलाएँ और 24 घंटे स्थिर रखें।','सबसे नीचे रेत, फिर गाद (सिल्ट), सबसे ऊपर चिकनी मिट्टी बैठती है।'],mr:['पारदर्शक बाटलीचा एक-तृतीयांश भाग १५ सेंमी खोलीवरील मातीने भरा.','जवळजवळ पूर्ण पाणी भरा, चिमूटभर मीठ किंवा डिटर्जंट टाका.','३ मिनिटे जोरात हलवा आणि २४ तास स्थिर ठेवा.','सर्वात खाली वाळू, मग गाळ (सिल्ट), सर्वात वर चिकण माती बसते.']},
  read:{en:'Mostly sand = sandy (drains fast, needs more organic matter). Thick clay layer = heavy clay (slow drainage). Roughly equal layers = loam (best for most crops).',hi:'ज़्यादातर रेत = बलुई (पानी जल्दी निकलता है, ज़्यादा जैविक खाद चाहिए)। मोटी चिकनी परत = भारी मिट्टी (धीमी जल निकासी)। लगभग बराबर परतें = दोमट (ज़्यादातर फसलों के लिए उत्तम)।',mr:'बहुतेक वाळू = हलकी वालुकामय (पाणी लवकर निचरते, जास्त सेंद्रिय खत लागते). जाड चिकण थर = भारी माती (निचरा हळू). साधारण समान थर = पोयटा/लोम (बहुतेक पिकांसाठी उत्तम).'}},
 {id:'ph', n:{en:'Vinegar & baking-soda test — rough pH',hi:'सिरका व खाने का सोडा — अनुमानित pH',mr:'व्हिनेगर व खायचा सोडा — अंदाजे pH'},
  m:{en:['Put 2 spoons of soil in two cups.','Cup 1: add half a cup of vinegar.','Cup 2: wet the soil with clean water, then add half a cup of baking soda.','Watch for fizzing (bubbles).'],hi:['दो कप में 2-2 चम्मच मिट्टी लें।','कप 1: आधा कप सिरका डालें।','कप 2: मिट्टी को साफ़ पानी से गीला करें, फिर आधा कप खाने का सोडा डालें।','झाग (बुलबुले) देखें।'],mr:['दोन कपांत २-२ चमचे माती घ्या.','कप १: अर्धा कप व्हिनेगर टाका.','कप २: माती स्वच्छ पाण्याने ओली करा, मग अर्धा कप खायचा सोडा टाका.','फेस (बुडबुडे) येतो का पाहा.']},
  read:{en:'Fizz with vinegar = alkaline soil (pH above 7.5). Fizz with soda = acidic soil (pH below 6). No fizz in both = near neutral. Confirm with a lab test.',hi:'सिरके से झाग = क्षारीय मिट्टी (pH 7.5 से ऊपर)। सोडा से झाग = अम्लीय मिट्टी (pH 6 से नीचे)। दोनों में झाग नहीं = लगभग सामान्य। लैब जाँच से पुष्टि करें।',mr:'व्हिनेगरने फेस = विम्लधर्मी/अल्कधर्मी माती (pH ७.५ पेक्षा जास्त). सोड्याने फेस = आम्लधर्मी माती (pH ६ पेक्षा कमी). दोन्हीत फेस नाही = साधारण उदासीन. प्रयोगशाळा तपासणीने खात्री करा.'}},
 {id:'worm', n:{en:'Earthworm count — soil life',hi:'केंचुआ गिनती — मिट्टी की जान',mr:'गांडूळ मोजणी — मातीचे आरोग्य'},
  m:{en:['After rain or irrigation, dig a block of soil 30 × 30 cm and 20 cm deep.','Break it on a sack and count the earthworms.'],hi:['बारिश या सिंचाई के बाद 30 × 30 सेमी और 20 सेमी गहरा मिट्टी का टुकड़ा खोदें।','बोरी पर तोड़कर केंचुए गिनें।'],mr:['पाऊस किंवा पाणी दिल्यानंतर ३० × ३० सेंमी आणि २० सेंमी खोल मातीचा तुकडा खणा.','पोत्यावर फोडून गांडुळे मोजा.']},
  read:{en:'10 or more worms = healthy, living soil. Fewer than 5 = low organic matter — add compost, Jeevamrut and mulch, reduce chemical use.',hi:'10 या ज़्यादा केंचुए = स्वस्थ, जीवित मिट्टी। 5 से कम = जैविक पदार्थ कम — कम्पोस्ट, जीवामृत, मल्च डालें, रसायन कम करें।',mr:'१० किंवा जास्त गांडुळे = निरोगी, जिवंत माती. ५ पेक्षा कमी = सेंद्रिय पदार्थ कमी — कंपोस्ट, जीवामृत, आच्छादन वाढवा, रसायने कमी करा.'}},
 {id:'drain', n:{en:'Drainage test',hi:'जल निकासी परीक्षण',mr:'निचरा चाचणी'},
  m:{en:['Dig a pit 30 cm wide and 30 cm deep.','Fill it with water and let it drain fully (this wets the soil).','Fill it again and note how long the water takes to go down.'],hi:['30 सेमी चौड़ा, 30 सेमी गहरा गड्ढा खोदें।','पानी भरकर पूरा सूखने दें (मिट्टी गीली हो जाएगी)।','फिर से भरें और देखें पानी कितनी देर में उतरता है।'],mr:['३० सेंमी रुंद, ३० सेंमी खोल खड्डा खणा.','पाण्याने भरा आणि पूर्ण जिरू द्या (माती ओली होईल).','पुन्हा भरा आणि पाणी किती वेळात उतरते ते पाहा.']},
  read:{en:'Under 1 hour = very fast (sandy, irrigate often in small doses). 1–4 hours = good. Over 4 hours = poor drainage — make raised beds and drains, avoid crops that hate waterlogging (avocado, papaya, chilli).',hi:'1 घंटे से कम = बहुत तेज़ (बलुई, थोड़ा-थोड़ा बार-बार पानी दें)। 1–4 घंटे = अच्छा। 4 घंटे से ज़्यादा = खराब निकासी — ऊँची क्यारी व नाली बनाएँ, जलभराव न सहने वाली फसलें (एवोकाडो, पपीता, मिर्च) न लगाएँ।',mr:'१ तासापेक्षा कमी = खूप जलद (वालुकामय, थोडे-थोडे वारंवार पाणी द्या). १–४ तास = चांगला. ४ तासांपेक्षा जास्त = निचरा कमी — गादीवाफे व चर करा, पाणी साचणे न सहन करणारी पिके (ॲव्होकॅडो, पपई, मिरची) टाळा.'}}
];

/* v7.7 — what each organic input is mainly for (used for filters in the जैविक section) */
(function(){ var K = {jeevamrut: 'soil', ghanjeevamrut: 'soil', matkakhat: 'soil', beejamrut: 'seed', neemastra: 'pest', chilligarlic: 'pest', panchparni: 'pest', dashparni: 'pest', nske: 'pest', buttermilk: 'disease', panchagavya: 'growth', fishamino: 'growth', eggamino: 'growth'};
  RECIPES.forEach(function(r){ if(!r.kind) r.kind = K[r.id] || (r.base === 'seed' ? 'seed' : (r.base === 'dilute' ? 'pest' : 'soil')); }); })();
