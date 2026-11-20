// Respond.js — SETU · RESPOND (after the flood) · English / हिन्दी / नेपाली
// Runs fully in the browser on FloodEngine.js (same demo network as the Dashboard).
// Ambulance first (rescue points -> nearest hospital), then supplies (base -> relief camps).
// All roads, hospitals, shelters, capacities and incident points are DEMO data, not measurements.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Home.css";
import "./Respond.css";
import setuLogo from "./Setu.jpg";
import {
  CENTER, CLASSES, NODATA, PRESETS, RIVER_LINE,
  buildNetwork, buildFacilities, nearestNode, route, confidence,
  edgeRisk, riskClass, edgeClassInfo, explainEdge, demoReplay, rainfallLoading,
} from "./FloodEngine";

// ---------- demo data (built once, same network as the Dashboard) ----------
const net = buildNetwork();
const facilities = buildFacilities(net);
const hospitals = facilities.filter((f) => f.type === "hospital");
const shelters = facilities.filter((f) => f.type === "shelter");
const hospitalNodes = hospitals.map((f) => f.node);
const replay = demoReplay();
const gridNode = (r, c) => net.nodes[r * 16 + c].id;

const START_INCIDENTS = [{ id: 1, node: gridNode(3, 5) }, { id: 2, node: gridNode(7, 10) }];
const START_BASE = gridNode(5, 7);

// Emergency numbers. Police, fire, ambulance: Nepal telecom and foreign-ministry travel pages.
// Disaster hotline 1234 replaced 1149 (Home Ministry notice, July 2026, per press). Confirm before public use.
const CONTACTS = [
  { key: "police", number: "100", label: { en: "Police", hi: "पुलिस", ne: "प्रहरी" } },
  { key: "fire", number: "101", label: { en: "Fire", hi: "दमकल", ne: "दमकल" } },
  { key: "ambulance", number: "102", label: { en: "Ambulance", hi: "एम्बुलेंस", ne: "एम्बुलेन्स" } },
  { key: "disaster", number: "1234", label: { en: "Disaster hotline", hi: "आपदा हॉटलाइन", ne: "विपद् हटलाइन" } },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ne", label: "नेपाली" },
];

const T = {
  navHome: { en: "Home", hi: "होम", ne: "होम" },
  navFeatures: { en: "Features", hi: "सुविधाएँ", ne: "सुविधाहरू" },
  navDashboard: { en: "Dashboard", hi: "डैशबोर्ड", ne: "ड्यासबोर्ड" },
  navAbout: { en: "About", hi: "परिचय", ne: "बारेमा" },
  navSub: { en: "RESPOND", hi: "प्रतिक्रिया", ne: "प्रतिक्रिया" },
  openDash: { en: "Open Dashboard", hi: "डैशबोर्ड खोलें", ne: "ड्यासबोर्ड खोल्नुहोस्" },
  eyebrow: { en: "RESPOND · AFTER THE FLOOD", hi: "प्रतिक्रिया · बाढ़ के बाद", ne: "प्रतिक्रिया · बाढीपछि" },
  h1a: { en: "Ambulances first.", hi: "पहले एम्बुलेंस।", ne: "पहिले एम्बुलेन्स।" },
  h1b: { en: "Then food and medicine.", hi: "फिर भोजन और दवाइयाँ।", ne: "त्यसपछि खाना र औषधि।" },
  sub: {
    en: "Set the rain, close flooded roads and drop rescue points on the map. SETU recalculates the safest ambulance routes to hospitals and the supply routes to relief camps instantly.",
    hi: "बारिश तय करें, डूबी सड़कें बंद करें और नक्शे पर बचाव बिंदु रखें। SETU अस्पतालों तक सबसे सुरक्षित एम्बुलेंस मार्ग और राहत शिविरों तक आपूर्ति मार्ग तुरंत दोबारा निकालता है।",
    ne: "वर्षा तय गर्नुहोस्, डुबानमा परेका सडक बन्द गर्नुहोस् र नक्सामा उद्धार बिन्दु राख्नुहोस्। SETU ले अस्पतालसम्म सबैभन्दा सुरक्षित एम्बुलेन्स मार्ग र राहत शिविरसम्म आपूर्ति मार्ग तुरुन्तै पुनः निकाल्छ।",
  },
  demoChip: { en: "Demo network, hospitals and shelters", hi: "डेमो नेटवर्क, अस्पताल और आश्रय", ne: "डेमो सञ्जाल, अस्पताल र आश्रयस्थल" },

  kHigh: { en: "High-risk roads", hi: "उच्च जोखिम वाली सड़कें", ne: "उच्च जोखिमका सडक" },
  kClosed: { en: "Closed roads", hi: "बंद सड़कें", ne: "बन्द सडक" },
  kInc: { en: "Rescue points", hi: "बचाव बिंदु", ne: "उद्धार बिन्दु" },
  kAmb: { en: "Reach a hospital", hi: "अस्पताल पहुँच सकते हैं", ne: "अस्पताल पुग्न सक्छन्" },
  kCamps: { en: "Camps reachable", hi: "पहुँच योग्य शिविर", ne: "पुग्न सकिने शिविर" },
  of: { en: "of", hi: "में से", ne: "मध्ये" },

  rainTitle: { en: "Rainfall input", hi: "बारिश इनपुट", ne: "वर्षा इनपुट" },
  live: { en: "Live", hi: "लाइव", ne: "प्रत्यक्ष" },
  replayT: { en: "Replay", hi: "रिप्ले", ne: "रिप्ले" },
  manual: { en: "Manual", hi: "मैनुअल", ne: "म्यानुअल" },
  dry: { en: "Dry", hi: "सूखा", ne: "सुक्खा" },
  moderate: { en: "Moderate", hi: "मध्यम", ne: "मध्यम" },
  heavy: { en: "Heavy", hi: "भारी", ne: "भारी" },
  extreme: { en: "Extreme", hi: "अत्यधिक", ne: "अत्यधिक" },
  intensity: { en: "Intensity", hi: "तीव्रता", ne: "तीव्रता" },
  rain24: { en: "Rain in 24 h", hi: "24 घंटे में बारिश", ne: "२४ घण्टामा वर्षा" },
  liveOk: { en: "Open-Meteo reading. A dry day showing 0 mm is the correct answer.", hi: "Open-Meteo रीडिंग। सूखे दिन 0 मिमी सही उत्तर है।", ne: "Open-Meteo रिडिङ। सुक्खा दिन ० मिमी सही उत्तर हो।" },
  liveLoading: { en: "Fetching live Kathmandu rainfall…", hi: "काठमांडू की लाइव बारिश ला रहे हैं…", ne: "काठमाडौँको प्रत्यक्ष वर्षा ल्याउँदै…" },
  liveErr: { en: "Could not reach Open-Meteo. Use Replay or Manual.", hi: "Open-Meteo तक नहीं पहुँच सके। रिप्ले या मैनुअल उपयोग करें।", ne: "Open-Meteo सम्म पुग्न सकिएन। रिप्ले वा म्यानुअल प्रयोग गर्नुहोस्।" },
  refresh: { en: "Refresh live rain", hi: "लाइव बारिश ताज़ा करें", ne: "प्रत्यक्ष वर्षा ताजा गर्नुहोस्" },
  replayNote: { en: "Illustrative storm curve, not real data.", hi: "उदाहरण तूफ़ान वक्र, असली डेटा नहीं।", ne: "उदाहरणात्मक आँधी वक्र, वास्तविक डेटा होइन।" },

  toolsTitle: { en: "Map tools", hi: "नक्शा उपकरण", ne: "नक्सा उपकरण" },
  toolIncident: { en: "Add rescue point", hi: "बचाव बिंदु जोड़ें", ne: "उद्धार बिन्दु थप्नुहोस्" },
  toolBase: { en: "Set base", hi: "बेस तय करें", ne: "बेस तोक्नुहोस्" },
  toolOff: { en: "Off", hi: "बंद", ne: "बन्द" },
  toolHint: { en: "Click a road to close or reopen it. With a tool on, click empty map to place a point.", hi: "सड़क बंद या दोबारा खोलने के लिए उस पर क्लिक करें। उपकरण चालू हो तो खाली नक्शे पर क्लिक करके बिंदु रखें।", ne: "सडक बन्द वा फेरि खोल्न त्यसमा क्लिक गर्नुहोस्। उपकरण खोलेर खाली नक्सामा क्लिक गरी बिन्दु राख्नुहोस्।" },
  reopenAll: { en: "Reopen all roads", hi: "सभी सड़कें खोलें", ne: "सबै सडक खोल्नुहोस्" },
  resetPoints: { en: "Reset demo points", hi: "डेमो बिंदु रीसेट करें", ne: "डेमो बिन्दु रिसेट गर्नुहोस्" },
  recalc: { en: "Recalculated in", hi: "पुनर्गणना में लगा", ne: "पुनर्गणनामा लागेको" },

  contactsTitle: { en: "Emergency contacts", hi: "आपातकालीन संपर्क", ne: "आपतकालीन सम्पर्क" },
  contactsNote: { en: "Disaster hotline 1234 replaced 1149 in July 2026 (press reports). Confirm with NDRRMA before public use.", hi: "आपदा हॉटलाइन 1234 ने जुलाई 2026 में 1149 की जगह ली (समाचार रिपोर्ट)। सार्वजनिक उपयोग से पहले NDRRMA से पुष्टि करें।", ne: "विपद् हटलाइन १२३४ ले जुलाई २०२६ मा ११४९ को ठाउँ लियो (समाचार प्रतिवेदन)। सार्वजनिक प्रयोगअघि NDRRMA सँग पुष्टि गर्नुहोस्।" },

  mapLegendRoute: { en: "Ambulance route", hi: "एम्बुलेंस मार्ग", ne: "एम्बुलेन्स मार्ग" },
  mapLegendSupply: { en: "Supply route", hi: "आपूर्ति मार्ग", ne: "आपूर्ति मार्ग" },

  roadTitle: { en: "Road details", hi: "सड़क विवरण", ne: "सडक विवरण" },
  roadEmpty: { en: "Click any road on the map to see why it has its risk level.", hi: "किसी भी सड़क पर क्लिक करके देखें कि उसका जोखिम स्तर क्यों है।", ne: "कुनै पनि सडकमा क्लिक गरेर जोखिम स्तर किन छ हेर्नुहोस्।" },
  closed: { en: "Closed", hi: "बंद", ne: "बन्द" },
  closeRoad: { en: "Close road", hi: "सड़क बंद करें", ne: "सडक बन्द गर्नुहोस्" },
  reopenRoad: { en: "Reopen road", hi: "सड़क खोलें", ne: "सडक खोल्नुहोस्" },
  risk: { en: "risk", hi: "जोखिम", ne: "जोखिम" },

  incTitle: { en: "Rescue requests: ambulance dispatch", hi: "बचाव अनुरोध: एम्बुलेंस भेजना", ne: "उद्धार अनुरोध: एम्बुलेन्स पठाउने" },
  incNote: { en: "Each point is routed to its nearest reachable hospital as an ambulance, with signal priority on main roads. Points hold a location only, no personal details.", hi: "हर बिंदु को एम्बुलेंस के रूप में उसके निकटतम पहुँच योग्य अस्पताल तक रूट किया जाता है, मुख्य सड़कों पर सिग्नल प्राथमिकता के साथ। बिंदु में केवल स्थान है, कोई निजी जानकारी नहीं।", ne: "हरेक बिन्दुलाई एम्बुलेन्सका रूपमा नजिकको पुग्न सकिने अस्पतालसम्म रुट गरिन्छ, मुख्य सडकमा सिग्नल प्राथमिकतासहित। बिन्दुमा स्थान मात्र हुन्छ, व्यक्तिगत विवरण छैन।" },
  incEmpty: { en: "No rescue points. Turn on “Add rescue point” and click the map.", hi: "कोई बचाव बिंदु नहीं। “बचाव बिंदु जोड़ें” चालू करके नक्शे पर क्लिक करें।", ne: "कुनै उद्धार बिन्दु छैन। “उद्धार बिन्दु थप्नुहोस्” खोलेर नक्सामा क्लिक गर्नुहोस्।" },
  colPoint: { en: "Point", hi: "बिंदु", ne: "बिन्दु" },
  colHospital: { en: "Nearest hospital", hi: "निकटतम अस्पताल", ne: "नजिकको अस्पताल" },
  colTime: { en: "Time", hi: "समय", ne: "समय" },
  colDist: { en: "Distance", hi: "दूरी", ne: "दूरी" },
  colConf: { en: "Confidence", hi: "विश्वास", ne: "विश्वास" },
  noRoute: { en: "No passable route", hi: "कोई पार करने योग्य मार्ग नहीं", ne: "पार गर्न मिल्ने मार्ग छैन" },
  remove: { en: "Remove", hi: "हटाएँ", ne: "हटाउनुहोस्" },
  lvlGreen: { en: "High", hi: "उच्च", ne: "उच्च" },
  lvlAmber: { en: "Medium", hi: "मध्यम", ne: "मध्यम" },
  lvlRed: { en: "Low", hi: "कम", ne: "कम" },
  whyTitle: { en: "Why this confidence", hi: "यह विश्वास स्तर क्यों", ne: "यो विश्वास स्तर किन" },

  campTitle: { en: "Relief camps and supply routes", hi: "राहत शिविर और आपूर्ति मार्ग", ne: "राहत शिविर र आपूर्ति मार्ग" },
  campNote: { en: "Supplies leave the base by road and are split by camp capacity among reachable camps. Capacity-based split is a demo rule. Replace it with real occupancy and need once collected.", hi: "आपूर्ति बेस से सड़क द्वारा निकलती है और पहुँच योग्य शिविरों में क्षमता के अनुसार बाँटी जाती है। क्षमता-आधारित बँटवारा डेमो नियम है। असली भीड़ और ज़रूरत मिलने पर इसे बदलें।", ne: "आपूर्ति बेसबाट सडकमार्गले निस्कन्छ र पुग्न सकिने शिविरबीच क्षमताअनुसार बाँडिन्छ। क्षमतामा आधारित बाँडफाँड डेमो नियम हो। वास्तविक भीड र आवश्यकता सङ्कलन भएपछि यसलाई बदल्नुहोस्।" },
  units: { en: "Units to distribute (food + medical)", hi: "बाँटने की इकाइयाँ (भोजन + चिकित्सा)", ne: "बाँड्ने इकाई (खाना + औषधि)" },
  colCamp: { en: "Camp", hi: "शिविर", ne: "शिविर" },
  colCap: { en: "Capacity", hi: "क्षमता", ne: "क्षमता" },
  colEta: { en: "Supply ETA", hi: "आपूर्ति ETA", ne: "आपूर्ति ETA" },
  colUnits: { en: "Units", hi: "इकाइयाँ", ne: "इकाई" },
  showRoute: { en: "Show route", hi: "मार्ग दिखाएँ", ne: "मार्ग देखाउनुहोस्" },
  hideRoute: { en: "Hide route", hi: "मार्ग छिपाएँ", ne: "मार्ग लुकाउनुहोस्" },
  vehicleNote: { en: "Supply vehicle uses car rules (placeholder).", hi: "आपूर्ति वाहन कार के नियम उपयोग करता है (प्लेसहोल्डर)।", ne: "आपूर्ति सवारीले कारका नियम प्रयोग गर्छ (प्लेसहोल्डर)।" },
  download: { en: "Download response plan (CSV)", hi: "प्रतिक्रिया योजना डाउनलोड करें (CSV)", ne: "प्रतिक्रिया योजना डाउनलोड गर्नुहोस् (CSV)" },

  statsTitle: { en: "Emergency statistics", hi: "आपातकालीन आँकड़े", ne: "आपतकालीन तथ्यांक" },
  sAvgEta: { en: "Average ambulance time", hi: "औसत एम्बुलेंस समय", ne: "औसत एम्बुलेन्स समय" },
  sMaxEta: { en: "Longest ambulance time", hi: "सबसे लंबा एम्बुलेंस समय", ne: "सबैभन्दा लामो एम्बुलेन्स समय" },
  sAvoid: { en: "High-risk road avoided", hi: "बचाई गई उच्च-जोखिम सड़क", ne: "जोगाइएको उच्च-जोखिम सडक" },
  sExtra: { en: "Extra minutes vs fastest (total)", hi: "सबसे तेज़ से अतिरिक्त मिनट (कुल)", ne: "सबैभन्दा छिटोभन्दा थप मिनेट (जम्मा)" },
  sNoRoute: { en: "Points with no route", hi: "बिना मार्ग वाले बिंदु", ne: "मार्ग नभएका बिन्दु" },
  sCalc: { en: "Recalculation time", hi: "पुनर्गणना समय", ne: "पुनर्गणना समय" },
  statNote: { en: "Computed in the browser from the demo network. No lives-saved or accuracy claims.", hi: "डेमो नेटवर्क से ब्राउज़र में गणना। जान बचाने या सटीकता के कोई दावे नहीं।", ne: "डेमो सञ्जालबाट ब्राउजरमा गणना। ज्यान बचाएको वा शुद्धताको कुनै दाबी छैन।" },

  roadmapTitle: { en: "Roadmap (not in this build)", hi: "रोडमैप (इस संस्करण में नहीं)", ne: "रोडम्याप (यो संस्करणमा छैन)" },
  roadmapNote: { en: "For the demo story only. Not built, not claimed as deployed.", hi: "केवल डेमो कहानी के लिए। बनाया नहीं गया, तैनात होने का दावा नहीं।", ne: "डेमो कथाका लागि मात्र। बनाइएको होइन, तैनात भएको दाबी होइन।" },
  limits: { en: "Decision support, not a safety guarantee. Demo road grid, hospitals, shelters and capacities. Risk weights are reference values to be validated for Nepal. Vehicle limits are placeholders. No accuracy claim without ground-truth data.", hi: "निर्णय-सहायता, सुरक्षा की गारंटी नहीं। डेमो सड़क ग्रिड, अस्पताल, आश्रय और क्षमताएँ। जोखिम भार संदर्भ मान हैं जिन्हें नेपाल के लिए जाँचना है। वाहन सीमाएँ प्लेसहोल्डर हैं। ज़मीनी डेटा के बिना सटीकता का कोई दावा नहीं।", ne: "निर्णय-सहायता, सुरक्षाको ग्यारेन्टी होइन। डेमो सडक ग्रिड, अस्पताल, आश्रयस्थल र क्षमता। जोखिम भार सन्दर्भ मान हुन् जसलाई नेपालका लागि जाँच्नुपर्छ। सवारी सीमा प्लेसहोल्डर हुन्। भूमिगत डेटा बिना शुद्धताको कुनै दाबी छैन।" },
  limitsEngine: { en: "Road names, risk classes and confidence reasons are shown in English.", hi: "सड़कों के नाम, जोखिम वर्ग और विश्वास के कारण अंग्रेज़ी में दिखाए जाते हैं।", ne: "सडकका नाम, जोखिम वर्ग र विश्वासका कारण अङ्ग्रेजीमा देखाइन्छन्।" },
};

const ROADMAP = [
  { en: "Rescue team management and assignment", hi: "बचाव दल प्रबंधन और नियुक्ति", ne: "उद्धार टोली व्यवस्थापन र खटाइ" },
  { en: "Damage assessment", hi: "क्षति आकलन", ne: "क्षति मूल्याङ्कन" },
  { en: "Recovery progress tracking", hi: "पुनर्प्राप्ति प्रगति ट्रैकिंग", ne: "पुनर्लाभ प्रगति अनुगमन" },
  { en: "Real rescue-request intake and real shelter occupancy", hi: "असली बचाव-अनुरोध प्राप्ति और असली आश्रय भीड़", ne: "वास्तविक उद्धार-अनुरोध सङ्कलन र वास्तविक आश्रय भीड" },
  { en: "Login, audit log, hosted database, SMS gateway", hi: "लॉगिन, ऑडिट लॉग, होस्टेड डेटाबेस, SMS गेटवे", ne: "लगइन, अडिट लग, होस्टेड डाटाबेस, SMS गेटवे" },
];

// routing options (same defaults as the Dashboard)
const LAM = 3;
const ROBUST = true;

const fmtKm = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
const fmtMin = (t) => `${t.toFixed(1)} min`;

// ---------- background (same look as Home) ----------
const RIPPLES = [
  { left: 12, top: 78, delay: 0 }, { left: 32, top: 88, delay: 1.6 }, { left: 55, top: 82, delay: 3.1 },
  { left: 74, top: 90, delay: 0.8 }, { left: 88, top: 76, delay: 2.4 }, { left: 44, top: 70, delay: 4.2 },
];
function Background() {
  return (
    <div className="home-bg" aria-hidden="true">
      <div className="home-bg-img" />
      <div className="home-bg-overlay" />
      <span className="bg-orb bg-orb-1" />
      <span className="bg-orb bg-orb-2" />
      <span className="bg-orb bg-orb-3" />
      <div className="home-bg-rain" />
      {RIPPLES.map((r, i) => (
        <span key={i} className="bg-ripple" style={{ left: `${r.left}%`, top: `${r.top}%`, animationDelay: `${r.delay}s` }} />
      ))}
      <div className="home-bg-vignette" />
    </div>
  );
}

// ---------- page ----------
export default function Respond() {
  // language (same storage key as the Features page)
  const [lang, setLangState] = useState("en");
  useEffect(() => {
    try { const s = localStorage.getItem("setu-lang"); if (s && LANGUAGES.some((l) => l.code === s)) setLangState(s); } catch { /* ignore */ }
  }, []);
  const setLang = (c) => { setLangState(c); try { localStorage.setItem("setu-lang", c); } catch { /* ignore */ } };
  const tr = (o) => (typeof o === "string" ? o : o[lang] ?? o.en);
  const [menuOpen, setMenuOpen] = useState(false);

  // rain
  const [source, setSource] = useState("manual");
  const [manual, setManual] = useState({ intensity: 25, rain24: 110 });
  const [live, setLive] = useState({ status: "idle", intensity: 0, rain24: 0, at: null });
  const [frame, setFrame] = useState(26);
  const [playing, setPlaying] = useState(false);
  const rain = source === "live" ? live : source === "replay" ? replay[frame] : manual;
  const { intensity, rain24 } = rain;
  const isLive = source === "live" && live.status === "ok";

  const fetchLive = useCallback(async () => {
    setLive((l) => ({ ...l, status: "loading" }));
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${CENTER[0]}&longitude=${CENTER[1]}&current=precipitation&hourly=precipitation&past_days=1&forecast_days=1&timezone=auto`;
      const d = await (await fetch(url)).json();
      const now = new Date(d.current.time).getTime();
      const past = d.hourly.time
        .map((t, i) => ({ t: new Date(t).getTime(), p: d.hourly.precipitation[i] ?? 0 }))
        .filter((x) => x.t <= now && x.t > now - 24 * 3600e3);
      setLive({
        status: "ok",
        intensity: d.current.precipitation ?? 0,
        rain24: Math.round(past.reduce((s, x) => s + x.p, 0) * 10) / 10,
        at: d.current.time,
      });
    } catch {
      setLive((l) => ({ ...l, status: "error" }));
    }
  }, []);
  useEffect(() => { if (source === "live" && live.status === "idle") fetchLive(); }, [source, live.status, fetchLive]);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setFrame((f) => {
      if (f >= replay.length - 1) { setPlaying(false); return f; }
      return f + 1;
    }), 450);
    return () => clearInterval(t);
  }, [playing]);

  // scenario
  const [closed, setClosed] = useState(() => new Set());
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [incidents, setIncidents] = useState(START_INCIDENTS);
  const [base, setBase] = useState(START_BASE);
  const [tool, setTool] = useState("off");
  const [selectedInc, setSelectedInc] = useState(null);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [units, setUnits] = useState(1000);
  const nextId = useRef(3);

  const toggleClosed = useCallback((id) => {
    setClosed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const onMapClick = useCallback((latlng, toolNow) => {
    const node = nearestNode(net, latlng);
    if (toolNow === "incident") {
      setIncidents((list) => [...list, { id: nextId.current++, node }]);
    } else if (toolNow === "base") {
      setBase(node);
      setTool("off");
    }
  }, []);

  // risk per road
  const risks = useMemo(() => net.edges.map((e) => edgeRisk(e.S, intensity, rain24)), [intensity, rain24]);
  const highCount = useMemo(
    () => net.edges.reduce((n, e, i) => n + (e.S != null && riskClass(risks[i]) >= 3 ? 1 : 0), 0),
    [risks],
  );

  // all routes
  const calc = useMemo(() => {
    const t0 = performance.now();
    const common = { closed, intensity, rain24 };
    const inc = incidents.map((p) => {
      const o = { ...common, start: p.node, targets: hospitalNodes, vehicle: "ambulance" };
      const safe = route(net, { ...o, lam: LAM, robust: ROBUST });
      const fast = route(net, { ...o, lam: 0, robust: false, ignoreRisk: true });
      return { ...p, safe, fast, conf: confidence(safe, { robust: ROBUST, live: isLive }) };
    });
    const camps = shelters.map((s) => {
      const r = route(net, { ...common, start: base, targets: [s.node], vehicle: "car", lam: LAM, robust: ROBUST });
      return { ...s, r, conf: confidence(r, { robust: ROBUST, live: isLive }) };
    });
    return { inc, camps, ms: performance.now() - t0 };
  }, [incidents, base, closed, intensity, rain24, isLive]);

  // capacity-based split among reachable camps (largest-remainder rounding)
  const alloc = useMemo(() => {
    const total = Math.max(0, Math.min(100000, Math.floor(Number(units) || 0)));
    const reach = calc.camps.filter((c) => c.r);
    const cap = reach.reduce((s, c) => s + (c.capacity || 0), 0);
    const out = {};
    let given = 0;
    const rem = [];
    reach.forEach((c) => {
      const exact = cap ? (total * c.capacity) / cap : 0;
      const fl = Math.floor(exact);
      out[c.id] = fl; given += fl; rem.push([c.id, exact - fl]);
    });
    rem.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < total - given && i < rem.length; i++) out[rem[i][0]]++;
    return out;
  }, [calc.camps, units]);

  // statistics (measured here from the engine)
  const stats = useMemo(() => {
    const ok = calc.inc.filter((p) => p.safe);
    const times = ok.map((p) => p.safe.time);
    return {
      reachable: ok.length,
      noRoute: calc.inc.length - ok.length,
      avg: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
      max: times.length ? Math.max(...times) : null,
      avoided: ok.reduce((s, p) => s + (p.fast ? Math.max(0, p.fast.highMeters - p.safe.highMeters) : 0), 0),
      extra: ok.reduce((s, p) => s + (p.fast ? Math.max(0, p.safe.time - p.fast.time) : 0), 0),
      campsOk: calc.camps.filter((c) => c.r).length,
    };
  }, [calc]);

  // ---------- Leaflet map ----------
  const mapEl = useRef(null);
  const map = useRef(null);
  const layers = useRef({});
  const handlers = useRef({});
  handlers.current = { toggleClosed, setSelectedRoad, setSelectedInc, onMapClick, tool };

  useEffect(() => {
    if (map.current || !mapEl.current) return undefined;
    const m = L.map(mapEl.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.25 }).setView(CENTER, 14);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(m);
    L.polyline(RIVER_LINE, { color: "#38bdf8", weight: 9, opacity: 0.22, interactive: false }).addTo(m);
    L.polyline(RIVER_LINE, { color: "#7dd3fc", weight: 2, opacity: 0.7, dashArray: "2 6", interactive: false }).addTo(m);
    layers.current = { roads: L.layerGroup().addTo(m), routes: L.layerGroup().addTo(m), marks: L.layerGroup().addTo(m) };
    m.on("click", (ev) => handlers.current.onMapClick([ev.latlng.lat, ev.latlng.lng], handlers.current.tool));
    const bounds = L.latLngBounds(net.nodes.map((n) => n.pos));
    m.fitBounds(bounds, { padding: [20, 20] });
    map.current = m;
    let first = true;
    const ro = new ResizeObserver(() => {
      m.invalidateSize();
      if (first) { m.fitBounds(bounds, { padding: [30, 30] }); first = false; }
    });
    ro.observe(mapEl.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
  }, []);

  // roads
  useEffect(() => {
    const g = layers.current.roads;
    if (!g) return;
    g.clearLayers();
    net.edges.forEach((e, i) => {
      const isClosed = closed.has(e.id);
      const info = edgeClassInfo(e, risks[i]);
      const line = L.polyline(e.coords, {
        color: isClosed ? "#0b0f19" : info.color,
        weight: e.primary ? 6 : 4,
        opacity: isClosed ? 0.95 : 0.85,
        dashArray: isClosed ? "4 6" : null,
        lineCap: "round",
      });
      if (isClosed) L.polyline(e.coords, { color: "#ef4444", weight: 2, opacity: 0.9, interactive: false }).addTo(g);
      if (selectedRoad === e.id) L.polyline(e.coords, { color: "#ffffff", weight: (e.primary ? 6 : 4) + 6, opacity: 0.35, interactive: false }).addTo(g);
      line.bindTooltip(`${e.name} · ${isClosed ? "CLOSED" : info.label}`, { sticky: true, className: "rs-tip" });
      line.on("click", (ev) => {
        L.DomEvent.stopPropagation(ev);
        handlers.current.toggleClosed(e.id);
        handlers.current.setSelectedRoad(e.id);
      });
      line.addTo(g);
    });
  }, [risks, closed, selectedRoad]);

  // routes + markers
  useEffect(() => {
    const g = layers.current.routes, mk = layers.current.marks;
    if (!g || !mk) return;
    g.clearLayers(); mk.clearLayers();

    calc.inc.forEach((p) => {
      if (!p.safe) return;
      const on = selectedInc === p.id;
      L.polyline(p.safe.coords, { color: "#22d3ee", weight: on ? 16 : 12, opacity: on ? 0.3 : 0.14, interactive: false }).addTo(g);
      L.polyline(p.safe.coords, { color: on ? "#a5f3fc" : "#22d3ee", weight: on ? 6 : 4, opacity: 1, interactive: false }).addTo(g);
    });
    const camp = calc.camps.find((c) => c.id === selectedCamp);
    if (camp?.r) {
      L.polyline(camp.r.coords, { color: "#f5c451", weight: 5, opacity: 0.95, dashArray: "8 8", interactive: false }).addTo(g);
    }

    facilities.forEach((f) => {
      L.marker(f.pos, {
        icon: L.divIcon({ className: "", html: `<div class="rs-pin rs-pin--${f.type}">${f.type === "hospital" ? "H" : "S"}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
      }).bindTooltip(`${f.name}${f.capacity ? ` · cap ${f.capacity}` : ""}`, { className: "rs-tip" }).addTo(mk);
    });
    calc.inc.forEach((p, i) => {
      L.marker(net.nodes[p.node].pos, {
        icon: L.divIcon({ className: "", html: `<div class="rs-pin rs-pin--incident${selectedInc === p.id ? " is-on" : ""}">${i + 1}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }),
      }).on("click", () => handlers.current.setSelectedInc(p.id)).addTo(mk);
    });
    L.marker(net.nodes[base].pos, {
      icon: L.divIcon({ className: "", html: `<div class="rs-pin rs-pin--base">B</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }),
      interactive: false,
    }).addTo(mk);
  }, [calc, selectedInc, selectedCamp, base]);

  // crosshair cursor while a tool is on
  useEffect(() => {
    if (mapEl.current) mapEl.current.classList.toggle("rs-map--tool", tool !== "off");
  }, [tool]);

  // ---------- helpers ----------
  const sel = selectedRoad ? net.edges.find((e) => e.id === selectedRoad) : null;
  const selIdx = sel ? net.edges.indexOf(sel) : -1;
  const hospitalName = (node) => hospitals.find((h) => h.node === node)?.name ?? "—";
  const selIncData = calc.inc.find((p) => p.id === selectedInc);
  const lvl = (level) => tr(T[level === "green" ? "lvlGreen" : level === "amber" ? "lvlAmber" : "lvlRed"]);

  const resetPoints = () => {
    setIncidents(START_INCIDENTS);
    nextId.current = 3;
    setBase(START_BASE);
    setSelectedInc(null);
    setSelectedCamp(null);
    setTool("off");
  };

  const downloadCsv = () => {
    const rows = [["type", "name", "destination", "distance_m", "time_min", "confidence", "units"]];
    calc.inc.forEach((p, i) => rows.push([
      "ambulance", `Rescue point ${i + 1}`, p.safe ? hospitalName(p.safe.target) : "no route",
      p.safe ? Math.round(p.safe.distance) : "", p.safe ? p.safe.time.toFixed(1) : "", p.conf.label, "",
    ]));
    calc.camps.forEach((c) => rows.push([
      "supply", "Base", c.name, c.r ? Math.round(c.r.distance) : "", c.r ? c.r.time.toFixed(1) : "",
      c.conf.label, c.r ? alloc[c.id] ?? 0 : 0,
    ]));
    const csv = rows.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "setu_response_plan.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sourceNote =
    source === "live" ? (live.status === "ok" ? `${tr(T.liveOk)} (${live.at?.replace("T", " ")})` : live.status === "error" ? tr(T.liveErr) : tr(T.liveLoading))
      : source === "replay" ? tr(T.replayNote) : "";

  const langClass = lang === "en" ? "" : `lang-hi lang-${lang}`;

  return (
    <div className={`home rs-page ${langClass}`} lang={lang}>
      <Background />

      {/* NAVBAR (same look as Home) */}
      <header className="nav">
        <Link to="/" className="nav-brand" aria-label="Setu home">
          <span className="setu-mark" aria-hidden="true"><img src={setuLogo} alt="" /></span>
          <span className="setu-word">
            <span className="nav-name">Setu</span>
            <span className="nav-sub">{tr(T.navSub)}</span>
          </span>
        </Link>
        <nav className={`nav-links ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
          <Link to="/">{tr(T.navHome)}</Link>
          <Link to="/Features">{tr(T.navFeatures)}</Link>
          <Link to="/dashboard">{tr(T.navDashboard)}</Link>
          <Link to="/About">{tr(T.navAbout)}</Link>
        </nav>
        <div className="nav-actions">
          <div className="lang-toggle" role="group" aria-label="Language">
            {LANGUAGES.map((l) => (
              <button key={l.code} className={lang === l.code ? "on" : ""} onClick={() => setLang(l.code)} lang={l.code}>{l.label}</button>
            ))}
          </div>
          <Link to="/dashboard" className="btn btn-primary btn-sm hide-mobile">{tr(T.openDash)}</Link>
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? "✕" : "☰"}</button>
        </div>
      </header>

      <main className="rs-main">
        {/* HERO */}
        <section className="rs-hero">
          <p className="eyebrow">{tr(T.eyebrow)}</p>
          <h1>{tr(T.h1a)} <span className="accent">{tr(T.h1b)}</span></h1>
          <p className="rs-sub">{tr(T.sub)}</p>
          <span className="rs-chip"><i />{tr(T.demoChip)}</span>
        </section>

        {/* EMERGENCY OVERVIEW */}
        <section className="rs-kpis">
          <div className="rs-kpi rs-kpi--warn"><b>{highCount}</b><small>/ {net.edges.length}</small><span>{tr(T.kHigh)}</span></div>
          <div className="rs-kpi rs-kpi--red"><b>{closed.size}</b><span>{tr(T.kClosed)}</span></div>
          <div className="rs-kpi"><b>{incidents.length}</b><span>{tr(T.kInc)}</span></div>
          <div className="rs-kpi rs-kpi--ok"><b>{stats.reachable}</b><small>{tr(T.of)} {incidents.length}</small><span>{tr(T.kAmb)}</span></div>
          <div className="rs-kpi rs-kpi--ok"><b>{stats.campsOk}</b><small>{tr(T.of)} {shelters.length}</small><span>{tr(T.kCamps)}</span></div>
        </section>

        {/* CONTROLS + MAP */}
        <section className="rs-grid">
          <aside className="rs-side">
            <div className="rs-card">
              <h3>{tr(T.rainTitle)}</h3>
              <div className="rs-seg">
                {[["live", T.live], ["replay", T.replayT], ["manual", T.manual]].map(([k, l]) => (
                  <button key={k} className={source === k ? "on" : ""} onClick={() => { setSource(k); setPlaying(false); }}>{tr(l)}</button>
                ))}
              </div>
              {source === "live" && (
                <button className="rs-btn rs-btn--ghost" onClick={fetchLive}>↻ {tr(T.refresh)}</button>
              )}
              {source === "replay" && (
                <div className="rs-replay">
                  <button className="rs-play" onClick={() => { if (frame >= replay.length - 1) setFrame(0); setPlaying((p) => !p); }}>{playing ? "❚❚" : "▶"}</button>
                  <input type="range" min="0" max={replay.length - 1} value={frame} onChange={(e) => { setPlaying(false); setFrame(+e.target.value); }} />
                  <span>H{String(frame).padStart(2, "0")}</span>
                </div>
              )}
              {source === "manual" && (
                <>
                  <div className="rs-presets">
                    {Object.entries(PRESETS).map(([k, p]) => (
                      <button key={k} className={manual.intensity === p.intensity && manual.rain24 === p.rain24 ? "on" : ""} onClick={() => setManual({ intensity: p.intensity, rain24: p.rain24 })}>{tr(T[k])}</button>
                    ))}
                  </div>
                  <label className="rs-slider">
                    <span>{tr(T.intensity)} <b>{manual.intensity} mm/h</b></span>
                    <input type="range" min="0" max="60" value={manual.intensity} onChange={(e) => setManual((m) => ({ ...m, intensity: +e.target.value }))} />
                  </label>
                  <label className="rs-slider">
                    <span>{tr(T.rain24)} <b>{manual.rain24} mm</b></span>
                    <input type="range" min="0" max="250" value={manual.rain24} onChange={(e) => setManual((m) => ({ ...m, rain24: +e.target.value }))} />
                  </label>
                </>
              )}
              <p className="rs-note">
                {intensity} mm/h · {rain24} mm · {(rainfallLoading(intensity, rain24) * 100).toFixed(0)}%
                {sourceNote && <><br />{sourceNote}</>}
              </p>
            </div>

            <div className="rs-card">
              <h3>{tr(T.toolsTitle)}</h3>
              <div className="rs-seg">
                {[["incident", T.toolIncident], ["base", T.toolBase], ["off", T.toolOff]].map(([k, l]) => (
                  <button key={k} className={tool === k ? "on" : ""} onClick={() => setTool(k)}>{tr(l)}</button>
                ))}
              </div>
              <p className="rs-note">{tr(T.toolHint)}</p>
              <div className="rs-row">
                <button className="rs-btn rs-btn--ghost" onClick={() => { setClosed(new Set()); setSelectedRoad(null); }} disabled={!closed.size}>{tr(T.reopenAll)} ({closed.size})</button>
                <button className="rs-btn rs-btn--ghost" onClick={resetPoints}>{tr(T.resetPoints)}</button>
              </div>
            </div>

            <div className="rs-card">
              <h3>{tr(T.contactsTitle)}</h3>
              <div className="rs-contacts">
                {CONTACTS.map((c) => (
                  <a key={c.key} href={`tel:${c.number}`} className="rs-contact">
                    <span>{tr(c.label)}</span><b>{c.number}</b>
                  </a>
                ))}
              </div>
              <p className="rs-note">{tr(T.contactsNote)}</p>
            </div>
          </aside>

          <div className="rs-mapcol">
            <div className="rs-mapwrap">
              <div ref={mapEl} className="rs-map" />
              <div className="rs-legend">
                <div className="rs-legend-row">
                  {[...CLASSES, NODATA].map((c) => <span key={c.key}><i style={{ background: c.color }} />{c.label}</span>)}
                </div>
                <div className="rs-legend-row">
                  <span><i className="lg-amb" />{tr(T.mapLegendRoute)}</span>
                  <span><i className="lg-sup" />{tr(T.mapLegendSupply)}</span>
                  <span><i className="lg-closed" />{tr(T.closed)}</span>
                  <span><b className="rs-key rs-key--h">H</b>Hospital</span>
                  <span><b className="rs-key rs-key--s">S</b>Shelter</span>
                  <span><b className="rs-key rs-key--b">B</b>Base</span>
                </div>
              </div>
              <div className="rs-calc">{tr(T.recalc)} {calc.ms.toFixed(1)} ms</div>
            </div>
          </div>
        </section>

        {/* RESCUE REQUESTS */}
        <section className="rs-card rs-wide">
          <h3>{tr(T.incTitle)}</h3>
          <p className="rs-note">{tr(T.incNote)}</p>
          {calc.inc.length === 0 ? <p className="rs-empty">{tr(T.incEmpty)}</p> : (
            <div className="rs-table-wrap">
              <table className="rs-table">
                <thead><tr><th>{tr(T.colPoint)}</th><th>{tr(T.colHospital)}</th><th>{tr(T.colTime)}</th><th>{tr(T.colDist)}</th><th>{tr(T.colConf)}</th><th /></tr></thead>
                <tbody>
                  {calc.inc.map((p, i) => (
                    <tr key={p.id} className={selectedInc === p.id ? "is-sel" : ""} onClick={() => setSelectedInc(selectedInc === p.id ? null : p.id)}>
                      <td><span className="rs-num">{i + 1}</span></td>
                      <td>{p.safe ? hospitalName(p.safe.target) : <em>{tr(T.noRoute)}</em>}</td>
                      <td>{p.safe ? fmtMin(p.safe.time) : "—"}</td>
                      <td>{p.safe ? fmtKm(p.safe.distance) : "—"}</td>
                      <td><span className={`rs-conf rs-conf--${p.conf.level}`}>{lvl(p.conf.level)}</span></td>
                      <td>
                        <button className="rs-btn rs-btn--ghost rs-btn--sm" onClick={(e) => { e.stopPropagation(); setIncidents((l) => l.filter((x) => x.id !== p.id)); if (selectedInc === p.id) setSelectedInc(null); }}>{tr(T.remove)}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selIncData && (
            <div className="rs-why">
              <b>{tr(T.whyTitle)}</b>
              <ul>{selIncData.conf.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          )}
        </section>

        {/* RELIEF CAMPS + SUPPLY */}
        <section className="rs-card rs-wide">
          <h3>{tr(T.campTitle)}</h3>
          <p className="rs-note">{tr(T.campNote)} {tr(T.vehicleNote)}</p>
          <label className="rs-units">
            <span>{tr(T.units)}</span>
            <input type="number" min="0" max="100000" step="50" value={units} onChange={(e) => setUnits(e.target.value)} />
          </label>
          <div className="rs-table-wrap">
            <table className="rs-table">
              <thead><tr><th>{tr(T.colCamp)}</th><th>{tr(T.colCap)}</th><th>{tr(T.colEta)}</th><th>{tr(T.colDist)}</th><th>{tr(T.colConf)}</th><th>{tr(T.colUnits)}</th><th /></tr></thead>
              <tbody>
                {calc.camps.map((c) => (
                  <tr key={c.id} className={selectedCamp === c.id ? "is-sel" : ""}>
                    <td>{c.name}</td>
                    <td>{c.capacity}</td>
                    <td>{c.r ? fmtMin(c.r.time) : <em>{tr(T.noRoute)}</em>}</td>
                    <td>{c.r ? fmtKm(c.r.distance) : "—"}</td>
                    <td><span className={`rs-conf rs-conf--${c.conf.level}`}>{c.r ? lvl(c.conf.level) : "—"}</span></td>
                    <td><b>{c.r ? alloc[c.id] ?? 0 : 0}</b></td>
                    <td>
                      <button className="rs-btn rs-btn--ghost rs-btn--sm" disabled={!c.r} onClick={() => setSelectedCamp(selectedCamp === c.id ? null : c.id)}>
                        {selectedCamp === c.id ? tr(T.hideRoute) : tr(T.showRoute)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="rs-btn rs-btn--primary" onClick={downloadCsv}>⬇ {tr(T.download)}</button>
        </section>

        {/* STATISTICS + ROAD DETAILS */}
        <section className="rs-two">
          <div className="rs-card">
            <h3>{tr(T.statsTitle)}</h3>
            <div className="rs-stats">
              <div><b>{stats.avg != null ? fmtMin(stats.avg) : "—"}</b><span>{tr(T.sAvgEta)}</span></div>
              <div><b>{stats.max != null ? fmtMin(stats.max) : "—"}</b><span>{tr(T.sMaxEta)}</span></div>
              <div><b>{fmtKm(stats.avoided)}</b><span>{tr(T.sAvoid)}</span></div>
              <div><b>+{stats.extra.toFixed(1)} min</b><span>{tr(T.sExtra)}</span></div>
              <div><b>{stats.noRoute}</b><span>{tr(T.sNoRoute)}</span></div>
              <div><b>{calc.ms.toFixed(1)} ms</b><span>{tr(T.sCalc)}</span></div>
            </div>
            <p className="rs-note">{tr(T.statNote)}</p>
          </div>

          <div className="rs-card">
            <h3>{tr(T.roadTitle)}{sel ? ` · ${sel.id}` : ""}</h3>
            {sel ? (
              <div className="rs-road">
                <div className="rs-road-head">
                  <b>{sel.name}</b>
                  <span className="rs-pill" style={{ background: edgeClassInfo(sel, risks[selIdx]).color }}>
                    {closed.has(sel.id) ? tr(T.closed) : edgeClassInfo(sel, risks[selIdx]).label}
                  </span>
                </div>
                <div className="rs-note">{tr(T.risk)} {risks[selIdx].toFixed(2)} · {fmtKm(sel.length)}</div>
                <ul>{explainEdge(sel, intensity, rain24).map((x) => <li key={x}>{x}</li>)}</ul>
                <button className="rs-btn rs-btn--ghost" onClick={() => toggleClosed(sel.id)}>{closed.has(sel.id) ? tr(T.reopenRoad) : tr(T.closeRoad)}</button>
              </div>
            ) : <p className="rs-empty">{tr(T.roadEmpty)}</p>}
          </div>
        </section>

        {/* ROADMAP */}
        <section className="rs-card rs-wide">
          <h3>{tr(T.roadmapTitle)}</h3>
          <p className="rs-note">{tr(T.roadmapNote)}</p>
          <ul className="rs-roadmap">{ROADMAP.map((r) => <li key={r.en}>{tr(r)}</li>)}</ul>
        </section>

        <div className="rs-limits">{tr(T.limits)} {tr(T.limitsEngine)}</div>
      </main>
    </div>
  );
}
