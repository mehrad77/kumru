/* Onboarding checks: Turkish suffixes on names, the hometown swap and the tutor's blurb. The code under test is TypeScript now
   (app/features/onboarding: model/ and personalize.ts, which reads the learner's name and profile from the page state).
   usage: node scripts/kumru_onb.test.cjs */
const OB="../app/features/onboarding/";
const {nameSuffix}=require(OB+"model/names.ts"),{cityLookup}=require(OB+"model/profile.ts"),{personalizeStr,personalize,learnerBlurb}=require(OB+"personalize.ts");
const S=require("../app/core/store.ts").S;   /* the same state object personalize.ts reads */
Object.assign(S,{nick:"Nima",profileName:"",profile:null});
let pass=0,fail=0;const eq=(got,want,msg)=>{if(JSON.stringify(got)===JSON.stringify(want))pass++;else{fail++;console.log("FAIL "+msg+"\n  got  "+JSON.stringify(got)+"\n  want "+JSON.stringify(want))}};
/* suffixes on names and cities */
eq(nameSuffix("Şiraz","lı",true),"Şirazlı","Şirazlı");
eq(nameSuffix("Kerkük","lu",true),"Kerküklü","Kerküklü");
eq(nameSuffix("Tebriz","daki"),"Tebriz'deki","Tebriz'deki");
eq(nameSuffix("İsfahan","danım"),"İsfahan'danım","İsfahan'danım");
eq(nameSuffix("Mehrad","ın"),"Mehrad'ın","Mehrad'ın");
eq(nameSuffix("Mehrad","a"),"Mehrad'a","Mehrad'a");
eq(nameSuffix("Ali","ye"),"Ali'ye","Ali'ye");
eq(nameSuffix("Sara","yı"),"Sara'yı","Sara'yı");
/* nothing changes without a profile or a new name */
eq(personalizeStr("Ben Nima. Tahran'danım.","tr"),"Ben Nima. Tahran'danım.","default");
/* hometown swap in tr / en / fa, with the name still Nima */
S.profile={city:{raw:"Şiraz",tr:"Şiraz",en:"Shiraz",fa:"شیراز"}};
eq(personalizeStr("Ben Nima. Tahran'danım.","tr"),"Ben Nima. Şiraz'danım.","tr swap");
eq(personalizeStr("Tahran! Hoş geldin!","tr"),"Şiraz! Hoş geldin!","tr bare");
eq(personalizeStr("Tahranlı","tr"),"Şirazlı","tr -lı");
eq(personalizeStr("Tahranlıyım.","tr"),"Şirazlıyım.","tr -lıyım");
eq(personalizeStr("Tahran'daki annem için.","tr"),"Şiraz'daki annem için.","tr -daki");
eq(personalizeStr("For my mum in Tehran.","en"),"For my mum in Shiraz.","en");
eq(personalizeStr("برای مادرم که در تهران است.","fa"),"برای مادرم که در شیراز است.","fa");
eq(personalizeStr("like Persian: Tahran'danım = اهلِ تهرانم, Tehran","en"),"like Persian: Şiraz'danım = اهلِ شیرازم, Shiraz","embedded examples in an en note");
eq(personalize({gl:{"tahran'danım":["اهلِ تهرانم","I'm from Tehran"]}}).gl,{"şiraz'danım":["اهلِ شیرازم","I'm from Shiraz"]},"gloss key and meanings");
S.profile={city:{raw:"Shiraz",tr:"Shiraz",en:"Shiraz",fa:"Shiraz"}};
eq(personalizeStr("اهلِ تهرانم","fa"),"اهلِ Shiraz\u200cم","latin city inside persian");
S.profile={city:{raw:"Şiraz",tr:"Şiraz",en:"Shiraz",fa:"شیراز"}};
/* name and city together */
S.nick="Mehrad";
eq(personalizeStr("Ben Nima. Tahran'danım.","tr"),"Ben Mehrad. Şiraz'danım.","name+city");
eq(personalizeStr("Nima'nın annesi için","tr"),"Mehrad'ın annesi için","name suffix");
eq(personalizeStr("Nima's mum","en"),"Mehrad's mum","en name");
eq(personalizeStr("مادرِ نیما","fa"),"مادرِ \u2068Mehrad\u2069","latin name isolated in persian");
eq(personalize({who:"nima",tr:"Nima'ya bak",gl:{"nima'ya":["به نیما","to Nima"]}}),{who:"nima",tr:"Mehrad'a bak",gl:{"mehrad'a":["به \u2068Mehrad\u2069","to Mehrad"]}},"a story step and its glossary");
S.profile=null;
eq(learnerBlurb().includes("Tehran"),true,"default blurb");
S.profile={city:{raw:"Şiraz",tr:"Şiraz",en:"Shiraz"},job:{raw:"mühendis",tr:"mühendis",en:"engineer"},bio:{en:"Likes football."}};
eq(learnerBlurb(),"The learner is Mehrad, a newcomer to Istanbul from Shiraz; engineer. Likes football.","blurb");
/* known cities */
eq(cityLookup("Shiraz"),{raw:"Shiraz",tr:"Şiraz",en:"Shiraz",fa:"شیراز"},"city from English");
eq(cityLookup("شیراز").tr,"Şiraz","city from Persian");
eq(cityLookup("isfahan").tr,"İsfahan","city case and dots");
eq(cityLookup("Atlantis"),null,"unknown city");
console.log(fail?`${fail} FAILED, ${pass} passed`:`ALL OK (${pass} checks)`);process.exit(fail?1:0);
