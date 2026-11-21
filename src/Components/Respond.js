// Features.js — SETU (Flood Risk & Emergency Safe-Route Mapper)
// Pilot: Kathmandu, Nepal · Team TheLadyBugz_5 · Katathon 6.0 · PS 103
// Page order: Hero (text left, Plan/Alert/Respond right in 3 rows) → Feature pie chart → Engine → Data → CTA → Footer.
// No extra packages needed. No emojis anywhere: pie slices carry the category name.
//
// Logo: save your image as  public/Setu.jpg  (capital S — file names are case-sensitive). Also tries other common names.
// Languages: English / हिन्दी / नेपाली.
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import "./Features.css";

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */
const PUBLIC = typeof process !== "undefined" && process.env && process.env.PUBLIC_URL ? process.env.PUBLIC_URL : "";
// The first file that exists in /public is used. Add your own file name to the front of this list if needed.
const LOGO_LIST = [
  `${PUBLIC}/Setu.jpg`,
  `${PUBLIC}/Setu.jpeg`,
  `${PUBLIC}/setu.jpeg`,
  `${PUBLIC}/setu.jpg`,
  `${PUBLIC}/setu.JPG`,
  `${PUBLIC}/setu.png`,
  `${PUBLIC}/setu-logo.png`,
];
const LogoCtx = createContext(LOGO_LIST);

/* ------------------------------------------------------------------ */
/* Translations                                                        */
/* ------------------------------------------------------------------ */
const I18N = {
  en: {
    code: "en",
    nav: { home: "Home", features: "Features", ways: "Three Ways", about: "About", dashboard: "Open Dashboard", menu: "☰ Menu" },
    brand: { name: "Setu", tag: "FLOOD SAFE ROUTES" },
    hero: {
      eyebrow: "FEATURES · KATHMANDU PILOT",
      h1a: "From India to Nepal.",
      h1b: "Every feature, mapped.",
      sub: "SETU turns rainfall and terrain into a flood-risk map, then finds the safest way through — for commuters, ambulances and people heading to a shelter.",
      plan: ["PLAN", "Before the monsoon — risk map and chokepoint report."],
      alert: ["ALERT", "During rain — roads likely to flood within 30 min."],
      respond: ["RESPOND", "Roads blocked — instant reroute with confidence."],
      redAlert: "RED ALERT",
      alertMsg: "Demo alert: roads likely to flood within 30 minutes — reroute now.",
      cta1: "Plan a Safe Route →",
      cta2: "See all features",
      stats: ["features done", "cities", "districts"],
    },
    status: { done: "Done", starter: "Starter", partial: "Partial", todo: "To do", roadmap: "Roadmap" },
    feat: {
      eyebrow: "WHAT IT DOES", h2: "All features, and where they stand.",
      pieTitle: "Features by category",
      pieHint: "Each slice is one group of features. Click a slice to see the features inside it.",
      count: (n) => `${n} features`, doneOf: (d, n) => `${d} of ${n} done`, share: "of all features",
      cats: {
        risk: ["Risk mapping", "Scores every road and shows where water is likely to build up."],
        routing: ["Safe routing", "Finds the safest way through and explains how sure it is."],
        rain: ["Rain & live data", "Real roads and rainfall — live, replayed or set by hand."],
        emergency: ["Emergency response", "Alerts, ambulances, shelters and reports for the municipality."],
        rollout: ["Testing & rollout", "Proving the scores on real hotspots, then going live."],
      },
    },
    features: {
      roadscore: ["Road-level risk scoring", "Every OpenStreetMap road segment gets a 0–1 flood-risk score."],
      riskmap: ["Interactive risk map", "Roads coloured by class. Click any road to see why it scored that way."],
      classes: ["Five risk classes", "Very low to very high. Grey means no data — counted as moderate, never safe."],
      closeopen: ["Close & reopen roads", "Click a road to close it, click again to reopen it."],
      reroute: ["Automatic reroute", "Routes recalculate the moment a road is closed or rain changes."],
      planner: ["Risk-aware route planner", "Pick start and destination. Cost = travel time + λ × risk."],
      metrics: ["Route metrics", "Distance, time and average risk for every suggested route."],
      confidence: ["Confidence & reasons", "Green, amber or red confidence with a plain-language “why”."],
      modes: ["Plan · Alert · Respond", "Three modes for before, during and after the rain."],
      slider: ["Rainfall slider", "Dry, moderate, heavy and extreme presets for any scenario."],
      chokepoint: ["Chokepoint report", "Ranked risky roads for the municipality, with CSV download."],
      livefeed: ["Live rainfall feed", "Open-Meteo rainfall, refreshed on demand."],
      roadnet: ["Real road network", "Kathmandu roads loaded with OSMnx."],
      replay: ["Storm replay", "Replay of the Kathmandu flood, Sep 2024 (ERA5 reanalysis, not live)."],
      shelter: ["Shelter database", "shelters.csv plus OSM, routing to the nearest shelter. Nepal data being collected."],
      ambulance: ["Ambulance mode", "Hospital and shelter routing with signal-priority junctions."],
      terrain: ["Elevation & drainage model", "Elevation, basin depth and creek distance done. Flow accumulation and HAND next."],
      backtest: ["Back-test on real hotspots", "Check scores against 10–15 sourced Kathmandu flood points."],
      deploy: ["Real deployment", "Pilot with a ward office: login, audit log, hosted database, SMS. Not deployed yet."],
    },
    engine: {
      eyebrow: "UNDER THE HOOD", h2: "Transparent maths, not a black box.",
      cards: [
        { tag: "RISK ENGINE", title: "Susceptibility × rain", desc: "S mixes low elevation, basin depth, creek distance and built-up density. The scaling is a prototype assumption to validate." },
        { tag: "ROUTING", title: "Dijkstra with closures", desc: "NetworkX Dijkstra on the real road graph. Vehicle limits use risk classes (placeholders), never invented flood depths." },
        { tag: "ALERT RULE", title: "Likely to flood soon", desc: "Gives drivers and ambulance teams a 30-minute early-warning window." },
        { tag: "CONFIDENCE", title: "Green · Amber · Red", desc: "Every route says how sure it is and why — decision support, not a safety guarantee." },
      ],
      live: ["Live", "Open-Meteo feed. A dry day correctly shows 0 high-risk roads."],
      replay: ["Replay", "Real Kathmandu storm, Sep 2024 — reanalysis data, clearly labelled."],
      manual: ["Manual", "Slider for dry, moderate, heavy and extreme what-ifs."],
    },
    data: {
      eyebrow: "OPEN DATA ONLY", h2: "Free, reproducible sources.",
      head: ["Need", "Source", "Note"],
      rows: [
        ["Roads, hospitals, schools, shelters", "Check ward coverage first"],
        ["Terrain", "Coarse — we say so"],
        ["Rainfall, live & past", "ERA5 smooths extremes"],
        ["Shelters", "Source and date recorded"],
        ["Flood hotspots", "For the back-test"],
      ],
      limitsTitle: "Honest limits",
      limits: "Decision support, not a safety guarantee. Factor weights come from a Mumbai study and are reference values until validated for Nepal. Terrain is about 90 m resolution. We make no accuracy claims until the back-test against real Kathmandu hotspots is done.",
    },
    cta: {
      h2: "See your route before the water does.",
      p: "Open the dashboard, set the rain and close a road — SETU reroutes instantly.",
      b1: "Open Dashboard →", b2: "Back to Home",
    },
    footer: {
      blurb: "Flood risk & emergency safe-route mapper. Pilot: Kathmandu, Nepal.",
      chip: "Prototype · not deployed yet",
      explore: "Explore", all: "All features", how: "How it works", dataSrc: "Data sources",
      app: "App", home: "Home", dash: "Dashboard", planner: "Route planner", open: "Open data",
      copy: "© 2026 SETU · Team TheLadyBugz_5 · Katathon 6.0 · PS 103",
      disclaimer: "Decision support, not a safety guarantee.", top: "↑ Back to top",
    },
  },

  hi: {
    code: "hi",
    nav: { home: "होम", features: "सुविधाएँ", ways: "तीन तरीके", about: "हमारे बारे में", dashboard: "डैशबोर्ड खोलें", menu: "☰ मेनू" },
    brand: { name: "Setu", tag: "बाढ़ सुरक्षित रास्ते" },
    hero: {
      eyebrow: "सुविधाएँ · काठमांडू पायलट",
      h1a: "भारत से नेपाल तक।",
      h1b: "हर सुविधा, नक्शे पर।",
      sub: "SETU वर्षा और भू-भाग को बाढ़-जोखिम के नक्शे में बदलता है और फिर सबसे सुरक्षित रास्ता खोजता है — रोज़ आने-जाने वालों, एम्बुलेंस और आश्रय की ओर जाते लोगों के लिए।",
      plan: ["योजना", "मानसून से पहले — जोखिम नक्शा और अवरोध-बिंदु रिपोर्ट।"],
      alert: ["चेतावनी", "बारिश के दौरान — 30 मिनट में डूबने की आशंका वाली सड़कें।"],
      respond: ["कार्रवाई", "सड़कें बंद — भरोसे के साथ तुरंत नया रास्ता।"],
      redAlert: "रेड अलर्ट",
      alertMsg: "डेमो चेतावनी: 30 मिनट में सड़कें डूबने की आशंका — अभी नया रास्ता लें।",
      cta1: "सुरक्षित रास्ता चुनें →",
      cta2: "सभी सुविधाएँ देखें",
      stats: ["सुविधाएँ पूर्ण", "शहर", "ज़िले"],
    },
    status: { done: "पूर्ण", starter: "शुरुआती", partial: "आंशिक", todo: "करना बाकी", roadmap: "रोडमैप" },
    feat: {
      eyebrow: "यह क्या करता है", h2: "सभी सुविधाएँ, और वे कहाँ तक पहुँचीं।",
      pieTitle: "श्रेणी के अनुसार सुविधाएँ",
      pieHint: "हर टुकड़ा सुविधाओं का एक समूह है। उसके अंदर की सुविधाएँ देखने के लिए किसी टुकड़े पर क्लिक करें।",
      count: (n) => `${n} सुविधाएँ`, doneOf: (d, n) => `${n} में से ${d} पूर्ण`, share: "सभी सुविधाओं का",
      cats: {
        risk: ["जोखिम मानचित्रण", "हर सड़क को अंक देता है और दिखाता है कि पानी कहाँ जमा हो सकता है।"],
        routing: ["सुरक्षित रास्ता", "सबसे सुरक्षित रास्ता ढूँढता है और बताता है कि वह कितना भरोसेमंद है।"],
        rain: ["बारिश और लाइव डेटा", "असली सड़कें और बारिश — लाइव, दोहराई गई या हाथ से तय की गई।"],
        emergency: ["आपातकालीन प्रतिक्रिया", "नगर पालिका के लिए अलर्ट, एम्बुलेंस, आश्रय और रिपोर्ट।"],
        rollout: ["परीक्षण और लागू करना", "असली हॉटस्पॉट पर अंकों की जाँच, फिर लाइव शुरुआत।"],
      },
    },
    features: {
      roadscore: ["सड़क-स्तर पर जोखिम स्कोर", "हर OpenStreetMap सड़क खंड को 0–1 का बाढ़-जोखिम स्कोर मिलता है।"],
      riskmap: ["इंटरैक्टिव जोखिम नक्शा", "सड़कें वर्ग के अनुसार रंगीन। किसी भी सड़क पर क्लिक करके देखें कि उसे यह स्कोर क्यों मिला।"],
      classes: ["पाँच जोखिम वर्ग", "बहुत कम से बहुत उच्च तक। धूसर का मतलब डेटा नहीं — इसे मध्यम माना जाता है, कभी सुरक्षित नहीं।"],
      closeopen: ["सड़क बंद करें और खोलें", "सड़क बंद करने के लिए क्लिक करें, दोबारा क्लिक करने पर खुल जाती है।"],
      reroute: ["स्वचालित नया रास्ता", "सड़क बंद होते ही या बारिश बदलते ही रास्ते दोबारा निकलते हैं।"],
      planner: ["जोखिम-जागरूक रूट प्लानर", "शुरुआत और गंतव्य चुनें। लागत = यात्रा समय + λ × जोखिम।"],
      metrics: ["रूट मेट्रिक्स", "हर सुझाए गए रास्ते की दूरी, समय और औसत जोखिम।"],
      confidence: ["भरोसा और कारण", "हरा, पीला या लाल भरोसा और सरल भाषा में “क्यों”।"],
      modes: ["योजना · चेतावनी · कार्रवाई", "बारिश से पहले, दौरान और बाद के लिए तीन मोड।"],
      slider: ["वर्षा स्लाइडर", "किसी भी परिदृश्य के लिए सूखा, मध्यम, भारी और अत्यधिक प्रीसेट।"],
      chokepoint: ["अवरोध-बिंदु रिपोर्ट", "नगरपालिका के लिए जोखिम-क्रम में सड़कें, CSV डाउनलोड के साथ।"],
      livefeed: ["लाइव वर्षा फ़ीड", "Open-Meteo की वर्षा, माँग पर ताज़ा।"],
      roadnet: ["असली सड़क नेटवर्क", "OSMnx से लोड की गई काठमांडू की सड़कें।"],
      replay: ["तूफ़ान रिप्ले", "काठमांडू बाढ़ का रिप्ले, सितंबर 2024 (ERA5 पुनर्विश्लेषण, लाइव नहीं)।"],
      shelter: ["आश्रय डेटाबेस", "shelters.csv और OSM, निकटतम आश्रय तक रूटिंग। नेपाल का डेटा जुटाया जा रहा है।"],
      ambulance: ["एम्बुलेंस मोड", "सिग्नल-प्राथमिकता वाले चौराहों के साथ अस्पताल और आश्रय तक रूटिंग।"],
      terrain: ["ऊँचाई और जल-निकासी मॉडल", "ऊँचाई, बेसिन गहराई और नाले से दूरी पूरी। फ़्लो एक्युमुलेशन और HAND आगे।"],
      backtest: ["असली हॉटस्पॉट पर बैक-टेस्ट", "स्कोर को काठमांडू के 10–15 स्रोत-युक्त बाढ़ बिंदुओं से जाँचना।"],
      deploy: ["असली तैनाती", "वार्ड कार्यालय के साथ पायलट: लॉगिन, ऑडिट लॉग, होस्टेड डेटाबेस, SMS। अभी तैनात नहीं।"],
    },
    engine: {
      eyebrow: "अंदर की बात", h2: "पारदर्शी गणित, ब्लैक बॉक्स नहीं।",
      cards: [
        { tag: "जोखिम इंजन", title: "संवेदनशीलता × वर्षा", desc: "S में कम ऊँचाई, बेसिन की गहराई, नाले से दूरी और निर्मित घनत्व मिलते हैं। यह स्केलिंग प्रोटोटाइप की एक मान्यता है जिसे जाँचना बाकी है।" },
        { tag: "रूटिंग", title: "बंद सड़कों के साथ डिज्क्स्ट्रा", desc: "असली सड़क ग्राफ़ पर NetworkX डिज्क्स्ट्रा। वाहन सीमाएँ जोखिम वर्गों (प्लेसहोल्डर) पर आधारित हैं, गढ़ी हुई बाढ़ गहराई पर नहीं।" },
        { tag: "चेतावनी नियम", title: "जल्द डूबने की आशंका", desc: "चालकों और एम्बुलेंस टीमों को 30 मिनट की पूर्व-चेतावनी देता है।" },
        { tag: "भरोसा", title: "हरा · पीला · लाल", desc: "हर रास्ता बताता है कि वह कितना भरोसेमंद है और क्यों — निर्णय में सहायता, सुरक्षा की गारंटी नहीं।" },
      ],
      live: ["लाइव", "Open-Meteo फ़ीड। सूखे दिन में 0 उच्च-जोखिम सड़कें सही दिखती हैं।"],
      replay: ["रिप्ले", "काठमांडू का असली तूफ़ान, सितंबर 2024 — पुनर्विश्लेषण डेटा, स्पष्ट रूप से चिह्नित।"],
      manual: ["मैनुअल", "सूखा, मध्यम, भारी और अत्यधिक परिदृश्यों के लिए स्लाइडर।"],
    },
    data: {
      eyebrow: "केवल खुला डेटा", h2: "मुफ़्त, दोहराए जा सकने वाले स्रोत।",
      head: ["ज़रूरत", "स्रोत", "टिप्पणी"],
      rows: [
        ["सड़कें, अस्पताल, स्कूल, आश्रय", "पहले वार्ड कवरेज जाँचें"],
        ["भू-भाग", "मोटा रेज़ोल्यूशन — हम यह साफ़ कहते हैं"],
        ["वर्षा, लाइव और पिछली", "ERA5 चरम मानों को हल्का कर देता है"],
        ["आश्रय", "स्रोत और तारीख़ दर्ज"],
        ["बाढ़ हॉटस्पॉट", "बैक-टेस्ट के लिए"],
      ],
      limitsTitle: "ईमानदार सीमाएँ",
      limits: "निर्णय में सहायता, सुरक्षा की गारंटी नहीं। कारकों के भार एक मुंबई अध्ययन से लिए गए हैं और नेपाल के लिए जाँचे जाने तक केवल संदर्भ मान हैं। भू-भाग लगभग 90 मी. रेज़ोल्यूशन का है। काठमांडू के असली हॉटस्पॉट पर बैक-टेस्ट पूरा होने तक हम सटीकता का कोई दावा नहीं करते।",
    },
    cta: {
      h2: "पानी से पहले अपना रास्ता देखिए।",
      p: "डैशबोर्ड खोलें, बारिश तय करें और कोई सड़क बंद करें — SETU तुरंत नया रास्ता निकाल देता है।",
      b1: "डैशबोर्ड खोलें →", b2: "होम पर लौटें",
    },
    footer: {
      blurb: "बाढ़ जोखिम और आपातकालीन सुरक्षित-मार्ग मैपर। पायलट: काठमांडू, नेपाल।",
      chip: "प्रोटोटाइप · अभी तैनात नहीं",
      explore: "देखें", all: "सभी सुविधाएँ", how: "यह कैसे काम करता है", dataSrc: "डेटा स्रोत",
      app: "ऐप", home: "होम", dash: "डैशबोर्ड", planner: "रूट प्लानर", open: "खुला डेटा",
      copy: "© 2026 SETU · टीम TheLadyBugz_5 · Katathon 6.0 · PS 103",
      disclaimer: "निर्णय में सहायता, सुरक्षा की गारंटी नहीं।", top: "↑ ऊपर जाएँ",
    },
  },

  ne: {
    code: "ne",
    nav: { home: "गृहपृष्ठ", features: "सुविधाहरू", ways: "तीन तरिका", about: "हाम्रो बारेमा", dashboard: "ड्यासबोर्ड खोल्नुहोस्", menu: "☰ मेनु" },
    brand: { name: "Setu", tag: "बाढी सुरक्षित बाटो" },
    hero: {
      eyebrow: "सुविधाहरू · काठमाडौं पाइलट",
      h1a: "भारतदेखि नेपालसम्म।",
      h1b: "हरेक सुविधा, नक्सामा।",
      sub: "SETU ले वर्षा र भू-बनोटलाई बाढी-जोखिम नक्सामा बदल्छ र सबैभन्दा सुरक्षित बाटो खोज्छ — दैनिक यात्रु, एम्बुलेन्स र आश्रयतर्फ जाने मानिसहरूका लागि।",
      plan: ["योजना", "मनसुनअघि — जोखिम नक्सा र अवरोध-बिन्दु प्रतिवेदन।"],
      alert: ["सतर्कता", "वर्षाको बेला — ३० मिनेटभित्र डुबान हुन सक्ने सडकहरू।"],
      respond: ["प्रतिकार्य", "सडक बन्द — भरोसासहित तुरुन्तै नयाँ बाटो।"],
      redAlert: "रेड अलर्ट",
      alertMsg: "डेमो सतर्कता: ३० मिनेटभित्र सडक डुबान हुन सक्छ — अहिले नै अर्को बाटो लिनुहोस्।",
      cta1: "सुरक्षित बाटो योजना गर्नुहोस् →",
      cta2: "सबै सुविधाहरू हेर्नुहोस्",
      stats: ["सुविधा पूरा", "शहर", "जिल्ला"],
    },
    status: { done: "पूरा", starter: "सुरुवाती", partial: "आंशिक", todo: "गर्न बाँकी", roadmap: "रोडम्याप" },
    feat: {
      eyebrow: "यसले के गर्छ", h2: "सबै सुविधाहरू, र तिनीहरू कहाँ पुगे।",
      pieTitle: "श्रेणी अनुसार सुविधाहरू",
      pieHint: "हरेक टुक्रा सुविधाहरूको एउटा समूह हो। भित्रका सुविधाहरू हेर्न कुनै टुक्रामा क्लिक गर्नुहोस्।",
      count: (n) => `${n} सुविधाहरू`, doneOf: (d, n) => `${n} मध्ये ${d} पूरा`, share: "सबै सुविधाहरूको",
      cats: {
        risk: ["जोखिम नक्साङ्कन", "हरेक सडकलाई अङ्क दिन्छ र पानी कहाँ जम्न सक्छ भनेर देखाउँछ।"],
        routing: ["सुरक्षित बाटो", "सबैभन्दा सुरक्षित बाटो खोज्छ र त्यो कति भरपर्दो छ भनेर बताउँछ।"],
        rain: ["वर्षा र प्रत्यक्ष डेटा", "वास्तविक सडक र वर्षा — प्रत्यक्ष, दोहोर्‍याइएको वा हातले मिलाइएको।"],
        emergency: ["आपतकालीन प्रतिक्रिया", "नगरपालिकाका लागि अलर्ट, एम्बुलेन्स, आश्रयस्थल र रिपोर्ट।"],
        rollout: ["परीक्षण र कार्यान्वयन", "वास्तविक हटस्पटमा अङ्क जाँच, त्यसपछि प्रत्यक्ष सुरुवात।"],
      },
    },
    features: {
      roadscore: ["सडक-स्तरको जोखिम अंक", "हरेक OpenStreetMap सडक खण्डले ०–१ को बाढी-जोखिम अंक पाउँछ।"],
      riskmap: ["अन्तरक्रियात्मक जोखिम नक्सा", "सडकहरू वर्गअनुसार रङ्गिएका। कुनै पनि सडकमा क्लिक गरेर त्यसले यो अंक किन पायो हेर्नुहोस्।"],
      classes: ["पाँच जोखिम वर्ग", "धेरै कमदेखि धेरै उच्चसम्म। खैरो भनेको डेटा छैन — यसलाई मध्यम मानिन्छ, कहिल्यै सुरक्षित होइन।"],
      closeopen: ["सडक बन्द र खोल्नुहोस्", "सडक बन्द गर्न क्लिक गर्नुहोस्, फेरि क्लिक गर्दा खुल्छ।"],
      reroute: ["स्वचालित नयाँ बाटो", "सडक बन्द हुनासाथ वा वर्षा बदलिनासाथ बाटो फेरि निकालिन्छ।"],
      planner: ["जोखिम-सचेत बाटो योजनाकार", "सुरु र गन्तव्य छान्नुहोस्। लागत = यात्रा समय + λ × जोखिम।"],
      metrics: ["बाटोको मापन", "हरेक सुझाइएको बाटोको दूरी, समय र औसत जोखिम।"],
      confidence: ["भरोसा र कारण", "हरियो, पहेँलो वा रातो भरोसा र सरल भाषामा “किन”।"],
      modes: ["योजना · सतर्कता · प्रतिकार्य", "वर्षाअघि, वर्षाको बेला र पछिका लागि तीन मोड।"],
      slider: ["वर्षा स्लाइडर", "कुनै पनि परिदृश्यका लागि सुख्खा, मध्यम, भारी र अत्यधिक प्रिसेट।"],
      chokepoint: ["अवरोध-बिन्दु प्रतिवेदन", "नगरपालिकाका लागि जोखिमक्रममा सडकहरू, CSV डाउनलोडसहित।"],
      livefeed: ["प्रत्यक्ष वर्षा फिड", "Open-Meteo को वर्षा, माग गर्दा ताजा।"],
      roadnet: ["वास्तविक सडक सञ्जाल", "OSMnx बाट लोड गरिएका काठमाडौंका सडकहरू।"],
      replay: ["आँधी रिप्ले", "काठमाडौं बाढीको रिप्ले, सेप्टेम्बर २०२४ (ERA5 पुनर्विश्लेषण, प्रत्यक्ष होइन)।"],
      shelter: ["आश्रय डेटाबेस", "shelters.csv र OSM, नजिकको आश्रयसम्म रुटिङ। नेपालको डेटा सङ्कलन हुँदैछ।"],
      ambulance: ["एम्बुलेन्स मोड", "सिग्नल-प्राथमिकता चोकसहित अस्पताल र आश्रयसम्म रुटिङ।"],
      terrain: ["उचाइ र ढल-निकास मोडेल", "उचाइ, बेसिन गहिराइ र खोलाबाटको दूरी पूरा। फ्लो एक्युमुलेसन र HAND अर्को चरणमा।"],
      backtest: ["वास्तविक हटस्पटमा ब्याक-टेस्ट", "अंकहरूलाई काठमाडौंका १०–१५ स्रोतसहितका बाढी बिन्दुसँग जाँच्ने।"],
      deploy: ["वास्तविक प्रयोग", "वडा कार्यालयसँग पाइलट: लगइन, अडिट लग, होस्टेड डेटाबेस, SMS। अहिलेसम्म लागू भएको छैन।"],
    },
    engine: {
      eyebrow: "भित्री कुरा", h2: "पारदर्शी गणित, ब्ल्याक बक्स होइन।",
      cards: [
        { tag: "जोखिम इन्जिन", title: "संवेदनशीलता × वर्षा", desc: "S मा होचो उचाइ, बेसिन गहिराइ, खोलाबाटको दूरी र निर्मित घनत्व मिसिन्छन्। यो स्केलिङ प्रमाणित गर्न बाँकी प्रोटोटाइप अनुमान हो।" },
        { tag: "रुटिङ", title: "बन्द सडकसहित डाइक्स्ट्रा", desc: "वास्तविक सडक ग्राफमा NetworkX डाइक्स्ट्रा। सवारी सीमा जोखिम वर्ग (प्लेसहोल्डर) मा आधारित, बनावटी बाढी गहिराइमा होइन।" },
        { tag: "सतर्कता नियम", title: "छिट्टै डुबान हुने सम्भावना", desc: "चालक र एम्बुलेन्स टोलीलाई ३० मिनेटको पूर्व-सूचना दिन्छ।" },
        { tag: "भरोसा", title: "हरियो · पहेँलो · रातो", desc: "हरेक बाटोले आफू कति भरपर्दो छ र किन भन्छ — निर्णयमा सहयोग, सुरक्षाको ग्यारेन्टी होइन।" },
      ],
      live: ["प्रत्यक्ष", "Open-Meteo फिड। सुख्खा दिनमा ० उच्च-जोखिम सडक सही देखिन्छ।"],
      replay: ["रिप्ले", "काठमाडौंको वास्तविक आँधी, सेप्टेम्बर २०२४ — पुनर्विश्लेषण डेटा, स्पष्ट रूपमा चिनो लगाइएको।"],
      manual: ["म्यानुअल", "सुख्खा, मध्यम, भारी र अत्यधिक परिदृश्यका लागि स्लाइडर।"],
    },
    data: {
      eyebrow: "खुला डेटा मात्र", h2: "निःशुल्क, दोहोर्‍याउन सकिने स्रोतहरू।",
      head: ["आवश्यकता", "स्रोत", "टिप्पणी"],
      rows: [
        ["सडक, अस्पताल, विद्यालय, आश्रय", "पहिले वडाको कभरेज जाँच्नुहोस्"],
        ["भू-बनोट", "मोटो रिजोलुसन — हामी यो स्पष्ट भन्छौं"],
        ["वर्षा, प्रत्यक्ष र विगत", "ERA5 ले चरम मानलाई नरम बनाउँछ"],
        ["आश्रय", "स्रोत र मिति अभिलेखित"],
        ["बाढी हटस्पट", "ब्याक-टेस्टका लागि"],
      ],
      limitsTitle: "इमानदार सीमाहरू",
      limits: "निर्णयमा सहयोग, सुरक्षाको ग्यारेन्टी होइन। कारकहरूको भार मुम्बईको एक अध्ययनबाट लिइएको हो र नेपालका लागि प्रमाणित नभएसम्म सन्दर्भ मान मात्र हो। भू-बनोट करिब ९० मिटर रिजोलुसनको छ। काठमाडौंका वास्तविक हटस्पटमा ब्याक-टेस्ट पूरा नभएसम्म हामी शुद्धताको कुनै दाबी गर्दैनौं।",
    },
    cta: {
      h2: "पानी आउनुअघि आफ्नो बाटो हेर्नुहोस्।",
      p: "ड्यासबोर्ड खोल्नुहोस्, वर्षा तय गर्नुहोस् र कुनै सडक बन्द गर्नुहोस् — SETU ले तुरुन्तै नयाँ बाटो निकाल्छ।",
      b1: "ड्यासबोर्ड खोल्नुहोस् →", b2: "गृहपृष्ठमा फर्कनुहोस्",
    },
    footer: {
      blurb: "बाढी जोखिम र आपत्कालीन सुरक्षित-बाटो नक्सांकक। पाइलट: काठमाडौं, नेपाल।",
      chip: "प्रोटोटाइप · अहिलेसम्म लागू भएको छैन",
      explore: "हेर्नुहोस्", all: "सबै सुविधाहरू", how: "यो कसरी काम गर्छ", dataSrc: "डेटा स्रोत",
      app: "एप", home: "गृहपृष्ठ", dash: "ड्यासबोर्ड", planner: "बाटो योजनाकार", open: "खुला डेटा",
      copy: "© 2026 SETU · टोली TheLadyBugz_5 · Katathon 6.0 · PS 103",
      disclaimer: "निर्णयमा सहयोग, सुरक्षाको ग्यारेन्टी होइन।", top: "↑ माथि जानुहोस्",
    },
  },
};

const LANGS = [
  { code: "en", label: "English", script: "latn" },
  { code: "hi", label: "हिन्दी", script: "deva" },
  { code: "ne", label: "नेपाली", script: "deva" },
];

const LangCtx = createContext(I18N.en);
const useT = () => useContext(LangCtx);

/* ------------------------------------------------------------------ */
/* Features and their status                                           */
/* Text lives in I18N.<lang>.features[id] = [title, description]       */
/* ------------------------------------------------------------------ */
const FEATURES = [
  { id: "roadscore", status: "done" },
  { id: "riskmap", status: "done" },
  { id: "classes", status: "done" },
  { id: "closeopen", status: "done" },
  { id: "reroute", status: "done" },
  { id: "planner", status: "done" },
  { id: "metrics", status: "done" },
  { id: "confidence", status: "done" },
  { id: "modes", status: "done" },
  { id: "slider", status: "done" },
  { id: "chokepoint", status: "done" },
  { id: "livefeed", status: "starter" },
  { id: "roadnet", status: "starter" },
  { id: "replay", status: "starter" },
  { id: "shelter", status: "starter" },
  { id: "ambulance", status: "starter" },
  { id: "terrain", status: "partial" },
  { id: "backtest", status: "todo" },
  { id: "deploy", status: "roadmap" },
];

const COUNTS = FEATURES.reduce((a, f) => ({ ...a, [f.status]: (a[f.status] || 0) + 1 }), {});
const CITY_COUNT = 3;      // Kathmandu, Pokhara, Biratnagar
const DISTRICT_COUNT = 77; // Nepal districts

// Feature categories for the pie chart. Every feature id belongs to exactly one category.
const CATEGORIES = [
  { key: "risk", color: "#f07167", ids: ["roadscore", "riskmap", "classes", "terrain"] },
  { key: "routing", color: "#f6bd60", ids: ["closeopen", "reroute", "planner", "metrics", "confidence"] },
  { key: "rain", color: "#6cb4ee", ids: ["slider", "livefeed", "roadnet", "replay"] },
  { key: "emergency", color: "#f497b6", ids: ["modes", "chokepoint", "shelter", "ambulance"] },
  { key: "rollout", color: "#84dcc6", ids: ["backtest", "deploy"] },
];
const FEATURE_BY_ID = Object.fromEntries(FEATURES.map((f) => [f.id, f]));

// One slice per category; its angle is proportional to how many features it holds.
const CAT_SLICES = (() => {
  const total = CATEGORIES.reduce((s, c) => s + c.ids.length, 0);
  let a = -Math.PI / 2 - 0.35;
  return CATEGORIES.map((c) => {
    const span = (c.ids.length / total) * Math.PI * 2;
    const feats = c.ids.map((id) => FEATURE_BY_ID[id]);
    const s = { c, feats, a0: a, a1: a + span, mid: a + span / 2, pct: (c.ids.length / total) * 100, done: feats.filter((f) => f.status === "done").length };
    a += span;
    return s;
  });
})();

const ENGINE_CODE = [
  "risk = S × (0.12 + 0.88·L)\nL = 0.65·rain/40\n  + 0.35·rain24h/150\nL capped at 1",
  "cost = time + λ·risk\nclosed road → removed\nrobust = worst of\nrain −20% · 0 · +30%",
  "now      < High\n+30 min  ≥ High\n(same rain rate)\n→ flag the road",
  "max road risk\n+ average risk\n+ no-data share\n+ robust? live rain?",
];

const SOURCE_NAMES = [
  "OpenStreetMap via OSMnx",
  "Open-Meteo elevation (Copernicus, ~90 m) or SRTM",
  "Open-Meteo forecast & archive (ERA5)",
  "shelters.csv · municipal, NDRRMA / BIPAD, OSM",
  "News, municipal & NDRRMA reports, Sentinel-1",
];

/* ------------------------------------------------------------------ */
/* Small hook: true once the element has scrolled into view            */
/* ------------------------------------------------------------------ */
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

/* ------------------------------------------------------------------ */
/* Logo + brand                                                        */
/* ------------------------------------------------------------------ */
function Logo({ small = false }) {
  const list = useContext(LogoCtx);
  const [i, setI] = useState(0); // index of the logo file being tried
  const imgRef = useRef(null);
  const failed = i >= list.length;
  const tryNext = () => setI((n) => n + 1);
  // With server rendering the image can fail before React attaches onError — check once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) tryNext();
  }, [i]);
  return (
    <span className={`fx-nav-logo ${small ? "small" : ""}`}>
      {failed ? <span className="fx-logo-fallback">S</span> : <img key={i} ref={imgRef} src={list[i]} alt="SETU logo" onError={tryNext} />}
    </span>
  );
}

function Brand() {
  const t = useT();
  return (
    <a href="/" className="fx-nav-brand">
      <Logo />
      <span className="fx-nav-brandtext">
        <span className="fx-nav-name">{t.brand.name}</span>
        <span className="fx-nav-tag">{t.brand.tag}</span>
      </span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Plan · Alert · Respond — right side of the hero, 3 rows, one by one */
/* ------------------------------------------------------------------ */
const MODES = [
  { key: "plan", color: "#9fded6", no: "01" },
  { key: "alert", color: "#ef5b5b", no: "02" },
  { key: "respond", color: "#7fcfb0", no: "03" },
];

function Modes() {
  const t = useT();
  const [live, setLive] = useState(false);
  return (
    <div className="fx-mode-list" id="ways">
      {MODES.map((m, i) => {
        const isAlert = m.key === "alert";
        return (
          <div
            key={m.key}
            className={`fx-mode fx-mode-${m.key} ${isAlert && live ? "live" : ""}`}
            style={{ "--mc": m.color, "--d": `${0.15 + i * 0.35}s` }}
            tabIndex={0}
          >
            <span className="fx-mode-no">{m.no}</span>
            <div className="fx-mode-body">
              <span className="fx-mode-name">{t.hero[m.key][0]}</span>
              <p>{t.hero[m.key][1]}</p>
              {isAlert && (
                <>
                  <button className="fx-redbtn" onClick={() => setLive((v) => !v)} aria-pressed={live}>
                    <span className="fx-bulb" aria-hidden="true" />
                    {t.hero.redAlert}
                  </button>
                  {live && <p className="fx-alertmsg" role="alert">{t.hero.alertMsg}</p>}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pie chart: one slice per feature category, name written on slice    */
/* ------------------------------------------------------------------ */
const PIE_W = 680, PIE_H = 470, PIE_CX = 340, PIE_CY = 235, PIE_R = 160;
const pieAt = (r, a) => [PIE_CX + r * Math.cos(a), PIE_CY + r * Math.sin(a)];
function wedgePath(a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pieAt(PIE_R, a0), [x1, y1] = pieAt(PIE_R, a1);
  return `M${PIE_CX},${PIE_CY} L${x0.toFixed(2)},${y0.toFixed(2)} A${PIE_R},${PIE_R} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}
// Split a category name onto two lines so it fits inside its slice.
const nameLines = (name) => {
  const i = name.indexOf(" ");
  return i === -1 ? [name] : [name.slice(0, i), name.slice(i + 1)];
};

function FeaturePie() {
  const t = useT();
  const [ref, seen] = useInView(0.25);
  const [sel, setSel] = useState(CAT_SLICES[1].c.key);
  const cur = CAT_SLICES.find((s) => s.c.key === sel) || CAT_SLICES[0];

  return (
    <div ref={ref} className={`fx-cpie ${seen ? "run" : ""}`}>
      <div className="fx-cpie-chart">
        <p className="fx-cpie-title">{t.feat.pieTitle}</p>
        <svg viewBox={`0 0 ${PIE_W} ${PIE_H}`} className="fx-cpie-svg" role="group" aria-label={t.feat.pieTitle}>
          {CAT_SLICES.map((s, i) => {
            const on = s.c.key === sel;
            const cos = Math.cos(s.mid), sin = Math.sin(s.mid);
            const [ix, iy] = pieAt(PIE_R * 0.64, s.mid);
            const [l0x, l0y] = pieAt(PIE_R + 6, s.mid);
            const [l1x, l1y] = pieAt(PIE_R + 26, s.mid);
            const right = cos >= 0;
            const l2x = l1x + (right ? 16 : -16);
            const lines = nameLines(t.feat.cats[s.c.key][0]);
            const top = iy - (lines.length * 16 + 22) / 2 + 8;
            return (
              <g
                key={s.c.key}
                className={`fx-cpie-slice ${on ? "on" : ""}`}
                style={{ "--c": s.c.color, "--dx": `${(cos * 18).toFixed(1)}px`, "--dy": `${(sin * 18).toFixed(1)}px` }}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${t.feat.cats[s.c.key][0]} — ${t.feat.count(s.c.ids.length)}`}
                onClick={() => setSel(s.c.key)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(s.c.key); } }}
              >
                <g className="fx-cpie-grow" style={{ animationDelay: `${i * 0.12}s` }}>
                  <path d={wedgePath(s.a0, s.a1)} fill={s.c.color} />
                  {lines.map((ln, k) => (
                    <text key={k} x={ix} y={top + k * 16} className="fx-cpie-inname">{ln}</text>
                  ))}
                  <text x={ix} y={top + lines.length * 16 + 6} className="fx-cpie-pct">{s.pct.toFixed(1)}%</text>
                </g>
                <g className="fx-cpie-label" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
                  <polyline points={`${l0x},${l0y} ${l1x},${l1y} ${l2x},${l1y}`} />
                  <text x={l2x + (right ? 6 : -6)} y={l1y + 4} textAnchor={right ? "start" : "end"} className="fx-cpie-count">{t.feat.count(s.c.ids.length)}</text>
                </g>
              </g>
            );
          })}
        </svg>
        <div className="fx-cpie-legend">
          {CAT_SLICES.map((s) => (
            <button key={s.c.key} className={s.c.key === sel ? "on" : ""} style={{ "--c": s.c.color }} onClick={() => setSel(s.c.key)} aria-pressed={s.c.key === sel}>
              <i />{t.feat.cats[s.c.key][0]}
            </button>
          ))}
        </div>
      </div>

      <div className="fx-cpie-side" style={{ "--c": cur.c.color }}>
        <p className="fx-cpie-hint">{t.feat.pieHint}</p>
        <div className="fx-cpie-detail" key={cur.c.key}>
          <h3>{t.feat.cats[cur.c.key][0]}</h3>
          <span className="fx-cpie-meta">{t.feat.count(cur.c.ids.length)} · {cur.pct.toFixed(1)}% {t.feat.share} · {t.feat.doneOf(cur.done, cur.c.ids.length)}</span>
          <p className="fx-cpie-desc">{t.feat.cats[cur.c.key][1]}</p>
          <ul className="fx-cpie-list">
            {cur.feats.map((f, i) => (
              <li key={f.id} style={{ animationDelay: `${i * 60}ms` }}>
                <div>
                  <b>{t.features[f.id][0]}</b>
                  <p>{t.features[f.id][1]}</p>
                </div>
                <span className={`fx-badge fx-badge-xs fx-badge-${f.status}`}>{t.status[f.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function Features({ logo }) {
  // Start in English on the server, then restore the saved choice in the browser.
  const [lang, setLangState] = useState("en");
  useEffect(() => {
    try { const saved = localStorage.getItem("setu-lang"); if (saved && I18N[saved]) setLangState(saved); } catch { /* ignore */ }
  }, []);
  const setLang = (code) => {
    setLangState(code);
    try { localStorage.setItem("setu-lang", code); } catch { /* ignore */ }
  };
  const t = I18N[lang] || I18N.en;
  const script = (LANGS.find((l) => l.code === lang) || LANGS[0]).script;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <LogoCtx.Provider value={logo ? [logo] : LOGO_LIST}>
    <LangCtx.Provider value={t}>
      <div className="features" lang={lang} data-script={script}>
        {/* NAVBAR */}
        <header className="fx-nav">
          <Brand />
          <nav className={`fx-nav-links ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
            <a href="/">{t.nav.home}</a>
            <a href="#all" className="active">{t.nav.features}</a>
            <a href="#ways">{t.nav.ways}</a>
            <a href="#about">{t.nav.about}</a>
          </nav>
          <div className="fx-nav-actions">
            <div className="fx-lang" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <button key={l.code} lang={l.code} className={lang === l.code ? "active" : ""} aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>{l.label}</button>
              ))}
            </div>
            <a href="/dashboard" className="fx-btn fx-btn-primary fx-btn-sm">{t.nav.dashboard}</a>
            <button className="fx-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>{t.nav.menu}</button>
          </div>
        </header>

        {/* HERO: text on the left, Plan / Alert / Respond on the right in 3 rows */}
        <section className="fx-hero" id="live">
          <div className="fx-hero-text">
            <p className="fx-eyebrow">{t.hero.eyebrow}</p>
            <h1>{t.hero.h1a}<br /><span className="fx-accent">{t.hero.h1b}</span></h1>
            <p className="fx-sub">{t.hero.sub}</p>
            <div className="fx-hero-stats">
              <div><b>{COUNTS.done || 0}/{FEATURES.length}</b><span>{t.hero.stats[0]}</span></div>
              <div><b>{CITY_COUNT}</b><span>{t.hero.stats[1]}</span></div>
              <div><b>{DISTRICT_COUNT}</b><span>{t.hero.stats[2]}</span></div>
            </div>
            <div className="fx-cta-row">
              <a href="/route-planner" className="fx-btn fx-btn-primary">{t.hero.cta1}</a>
              <a href="#all" className="fx-btn fx-btn-ghost">{t.hero.cta2}</a>
            </div>
          </div>
          <Modes />
        </section>

        {/* FEATURES: CATEGORY PIE */}
        <section className="fx-section" id="all">
          <p className="fx-eyebrow">{t.feat.eyebrow}</p>
          <h2>{t.feat.h2}</h2>
          <FeaturePie />
        </section>

        {/* ENGINE */}
        <section className="fx-section" id="engine">
          <p className="fx-eyebrow">{t.engine.eyebrow}</p>
          <h2>{t.engine.h2}</h2>
          <div className="fx-engine">
            {t.engine.cards.map((e, i) => (
              <div className="fx-engine-card" key={i}>
                <span className="fx-engine-tag">{e.tag}</span>
                <h3>{e.title}</h3>
                <pre>{ENGINE_CODE[i]}</pre>
                <p>{e.desc}</p>
              </div>
            ))}
          </div>
          <div className="fx-rain-sources">
            <div><span className="fx-dot fx-dot-live" /><b>{t.engine.live[0]}</b><p>{t.engine.live[1]}</p></div>
            <div><span className="fx-dot fx-dot-replay" /><b>{t.engine.replay[0]}</b><p>{t.engine.replay[1]}</p></div>
            <div><span className="fx-dot fx-dot-manual" /><b>{t.engine.manual[0]}</b><p>{t.engine.manual[1]}</p></div>
          </div>
        </section>

        {/* DATA */}
        <section className="fx-section" id="data">
          <p className="fx-eyebrow">{t.data.eyebrow}</p>
          <h2>{t.data.h2}</h2>
          <div className="fx-table">
            <div className="fx-tr fx-th">{t.data.head.map((h) => <span key={h}>{h}</span>)}</div>
            {t.data.rows.map((r, i) => (
              <div className="fx-tr" key={i}><span>{r[0]}</span><span>{SOURCE_NAMES[i]}</span><span>{r[1]}</span></div>
            ))}
          </div>
          <div className="fx-limits">
            <strong>{t.data.limitsTitle}</strong>
            <p>{t.data.limits}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="fx-cta">
          <h2>{t.cta.h2}</h2>
          <p>{t.cta.p}</p>
          <div className="fx-cta-row fx-center">
            <a href="/dashboard" className="fx-btn fx-btn-primary">{t.cta.b1}</a>
            <a href="/" className="fx-btn fx-btn-ghost">{t.cta.b2}</a>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="fx-footer" id="about">
          <svg className="fx-wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
            <path className="fx-wave-a" d="M0 35 Q180 5 360 35 T720 35 T1080 35 T1440 35 T1800 35 T2160 35 T2520 35 T2880 35 V70 H0 Z" />
            <path className="fx-wave-b" d="M0 45 Q180 20 360 45 T720 45 T1080 45 T1440 45 T1800 45 T2160 45 T2520 45 T2880 45 V70 H0 Z" />
          </svg>
          <div className="fx-footer-inner">
            <div className="fx-footer-brand">
              <Brand />
              <p>{t.footer.blurb}</p>
              <span className="fx-footer-chip"><span className="fx-dot fx-dot-replay" />{t.footer.chip}</span>
            </div>
            <div className="fx-footer-col">
              <h4>{t.footer.explore}</h4>
              <a href="#all">{t.footer.all}</a>
              <a href="#engine">{t.footer.how}</a>
              <a href="#data">{t.footer.dataSrc}</a>
            </div>
            <div className="fx-footer-col">
              <h4>{t.footer.app}</h4>
              <a href="/">{t.footer.home}</a>
              <a href="/dashboard">{t.footer.dash}</a>
              <a href="/route-planner">{t.footer.planner}</a>
            </div>
            <div className="fx-footer-col">
              <h4>{t.footer.open}</h4>
              <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
              <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
              <a href="https://bipadportal.gov.np" target="_blank" rel="noopener noreferrer">NDRRMA · BIPAD</a>
            </div>
          </div>
          <div className="fx-footer-bottom">
            <span>{t.footer.copy}</span>
            <span className="fx-muted">{t.footer.disclaimer}</span>
            <a href="#live" className="fx-top">{t.footer.top}</a>
          </div>
        </footer>
      </div>
    </LangCtx.Provider>
    </LogoCtx.Provider>
  );
}