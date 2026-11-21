// Respond.js — SETU · RESPOND (after the flood) · English / हिन्दी / नेपाली
// Runs fully in the browser on FloodEngine.js (same demo network as the Dashboard).
// Ambulance first (rescue points -> nearest hospital), then supplies (base -> relief camps).
// One component, five pages (prop `view`): plan, closures, shelters, ambulance, chokepoints.
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
  edgeRisk, riskClass, edgeClassInfo, explainEdge, demoReplay, rainfallLoading, chokepoints,
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

  // ---- the five Respond pages (tabs, same names as the Home footer) ----
  tabsLabel: { en: "Respond pages", hi: "प्रतिक्रिया पृष्ठ", ne: "प्रतिक्रिया पृष्ठहरू" },
  tabPlan: { en: "Respond Plan", hi: "प्रतिक्रिया योजना", ne: "प्रतिक्रिया योजना" },
  tabClosures: { en: "Road Closures", hi: "सड़क बंदी", ne: "सडक बन्दी" },
  tabShelters: { en: "Shelters & Hospitals", hi: "आश्रय व अस्पताल", ne: "आश्रयस्थल र अस्पताल" },
  tabAmbulance: { en: "Ambulance Mode", hi: "एम्बुलेंस मोड", ne: "एम्बुलेन्स मोड" },
  tabChoke: { en: "Chokepoint Report", hi: "अवरोध रिपोर्ट", ne: "अवरोध प्रतिवेदन" },

  clEyebrow: { en: "RESPOND · ROAD CLOSURES", hi: "प्रतिक्रिया · सड़क बंदी", ne: "प्रतिक्रिया · सडक बन्दी" },
  clH1a: { en: "Close flooded roads.", hi: "डूबी सड़कें बंद करें।", ne: "डुबानमा परेका सडक बन्द गर्नुहोस्।" },
  clH1b: { en: "Routes update at once.", hi: "मार्ग तुरंत बदलते हैं।", ne: "मार्ग तुरुन्तै बदलिन्छन्।" },
  clSub: {
    en: "Click a road on the map to close or reopen it. Every ambulance and supply route is recalculated around your closures.",
    hi: "नक्शे पर सड़क पर क्लिक करके उसे बंद या दोबारा खोलें। हर एम्बुलेंस और आपूर्ति मार्ग आपकी बंदी के आसपास से दोबारा निकलता है।",
    ne: "नक्सामा सडकमा क्लिक गरेर बन्द वा फेरि खोल्नुहोस्। हरेक एम्बुलेन्स र आपूर्ति मार्ग तपाईंको बन्दीको वरिपरिबाट फेरि निकालिन्छ।",
  },
  shEyebrow: { en: "RESPOND · SHELTERS & HOSPITALS", hi: "प्रतिक्रिया · आश्रय व अस्पताल", ne: "प्रतिक्रिया · आश्रयस्थल र अस्पताल" },
  shH1a: { en: "Where to take people.", hi: "लोगों को कहाँ ले जाएँ।", ne: "मानिसलाई कहाँ लैजाने।" },
  shH1b: { en: "Which way is safe.", hi: "कौन सा रास्ता सुरक्षित है।", ne: "कुन बाटो सुरक्षित छ।" },
  shSub: {
    en: "Hospitals for rescue points, relief camps for supplies. Each camp shows its supply route time and how sure SETU is about it.",
    hi: "बचाव बिंदुओं के लिए अस्पताल, आपूर्ति के लिए राहत शिविर। हर शिविर में आपूर्ति मार्ग का समय और SETU को उसका कितना भरोसा है, दिखता है।",
    ne: "उद्धार बिन्दुका लागि अस्पताल, आपूर्तिका लागि राहत शिविर। हरेक शिविरमा आपूर्ति मार्गको समय र SETU लाई त्यसमा कति भरोसा छ भनेर देखिन्छ।",
  },
  amEyebrow: { en: "RESPOND · AMBULANCE MODE", hi: "प्रतिक्रिया · एम्बुलेंस मोड", ne: "प्रतिक्रिया · एम्बुलेन्स मोड" },
  amH1a: { en: "Every rescue point", hi: "हर बचाव बिंदु", ne: "हरेक उद्धार बिन्दु" },
  amH1b: { en: "to the nearest reachable hospital.", hi: "निकटतम पहुँच योग्य अस्पताल तक।", ne: "नजिकको पुग्न सकिने अस्पतालसम्म।" },
  amSub: {
    en: "Add rescue points on the map. Each ambulance takes the safest passable route to a hospital, and the statistics card shows the extra minutes that costs against the fastest route.",
    hi: "नक्शे पर बचाव बिंदु जोड़ें। हर एम्बुलेंस अस्पताल तक सबसे सुरक्षित पार करने योग्य मार्ग लेती है, और आँकड़ों का कार्ड दिखाता है कि सबसे तेज़ मार्ग की तुलना में इसमें कितने अतिरिक्त मिनट लगते हैं।",
    ne: "नक्सामा उद्धार बिन्दु थप्नुहोस्। हरेक एम्बुलेन्सले अस्पतालसम्म सबैभन्दा सुरक्षित पार गर्न मिल्ने मार्ग लिन्छ, र तथ्यांक कार्डले सबैभन्दा छिटो मार्गको तुलनामा कति थप मिनेट लाग्छ देखाउँछ।",
  },
  ckEyebrow: { en: "RESPOND · CHOKEPOINT REPORT", hi: "प्रतिक्रिया · अवरोध रिपोर्ट", ne: "प्रतिक्रिया · अवरोध प्रतिवेदन" },
  ckH1a: { en: "The roads everything depends on.", hi: "जिन सड़कों पर सब कुछ टिका है।", ne: "जसमा सबै कुरा निर्भर छ ती सडक।" },
  ckH1b: { en: "Watch them first.", hi: "इन पर पहले नज़र रखें।", ne: "पहिले यिनीमाथि नजर राख्नुहोस्।" },
  ckSub: {
    en: "Ranks the ten roads where a flood would hurt the network most: busy roads that are also flood-prone. The ranking is fixed for the demo network. The risk figure changes with the rainfall you set.",
    hi: "उन दस सड़कों का क्रम जहाँ बाढ़ नेटवर्क को सबसे ज़्यादा नुकसान पहुँचाएगी: व्यस्त सड़कें जो बाढ़-प्रवण भी हैं। डेमो नेटवर्क के लिए क्रम स्थिर है। जोखिम का आँकड़ा आपके तय किए गए बारिश के साथ बदलता है।",
    ne: "बाढीले सञ्जाललाई सबैभन्दा बढी असर गर्ने दश सडकको क्रम: व्यस्त र बाढी-प्रवण सडक। डेमो सञ्जालका लागि क्रम स्थिर छ। जोखिमको आँकडा तपाईंले तोकेको वर्षासँगै बदलिन्छ।",
  },

  // ---- pie charts ----
  chRiskTitle: { en: "Roads by flood-risk class", hi: "बाढ़-जोखिम वर्ग के अनुसार सड़कें", ne: "बाढी-जोखिम वर्ग अनुसार सडक" },
  chRiskNote: { en: "Every road in the demo network at the current rainfall. Colours match the map.", hi: "मौजूदा बारिश पर डेमो नेटवर्क की हर सड़क। रंग नक्शे से मेल खाते हैं।", ne: "हालको वर्षामा डेमो सञ्जालका हरेक सडक। रङ नक्सासँग मेल खान्छन्।" },
  chSupplyTitle: { en: "Supply units by relief camp", hi: "राहत शिविर के अनुसार आपूर्ति इकाइयाँ", ne: "राहत शिविर अनुसार आपूर्ति इकाई" },
  chSupplyNote: { en: "Capacity-based split (demo rule) among reachable camps.", hi: "पहुँच योग्य शिविरों में क्षमता-आधारित बँटवारा (डेमो नियम)।", ne: "पुग्न सकिने शिविरबीच क्षमतामा आधारित बाँडफाँड (डेमो नियम)।" },
  chStatusTitle: { en: "Road status", hi: "सड़क की स्थिति", ne: "सडकको अवस्था" },
  chStatusNote: { en: "Closed roads are the ones you closed on the map.", hi: "बंद सड़कें वे हैं जिन्हें आपने नक्शे पर बंद किया।", ne: "बन्द सडक तपाईंले नक्सामा बन्द गरेका हुन्।" },
  chCapTitle: { en: "Relief camp capacity", hi: "राहत शिविर की क्षमता", ne: "राहत शिविरको क्षमता" },
  chCapNote: { en: "Demo capacities, not surveyed figures.", hi: "डेमो क्षमताएँ, सर्वे किए आँकड़े नहीं।", ne: "डेमो क्षमता, सर्वेक्षण गरिएका तथ्यांक होइन।" },
  chHospTitle: { en: "Rescue points by hospital", hi: "अस्पताल के अनुसार बचाव बिंदु", ne: "अस्पताल अनुसार उद्धार बिन्दु" },
  chHospNote: { en: "Where each rescue point is sent at the current rainfall.", hi: "मौजूदा बारिश पर हर बचाव बिंदु कहाँ भेजा जाता है।", ne: "हालको वर्षामा हरेक उद्धार बिन्दु कहाँ पठाइन्छ।" },
  chChokeTitle: { en: "Chokepoints by risk class", hi: "जोखिम वर्ग के अनुसार अवरोध", ne: "जोखिम वर्ग अनुसार अवरोध" },
  chChokeNote: { en: "Risk class of the ten ranked roads at the current rainfall.", hi: "मौजूदा बारिश पर दस क्रमबद्ध सड़कों का जोखिम वर्ग।", ne: "हालको वर्षामा दश क्रमबद्ध सडकको जोखिम वर्ग।" },
  uRoads: { en: "roads", hi: "सड़कें", ne: "सडक" },
  uUnits: { en: "units", hi: "इकाइयाँ", ne: "इकाई" },
  uPeople: { en: "people", hi: "लोग", ne: "मानिस" },
  uPoints: { en: "points", hi: "बिंदु", ne: "बिन्दु" },
  uRoad: { en: "road", hi: "सड़क", ne: "सडक" },
  uUnit: { en: "unit", hi: "इकाई", ne: "इकाई" },
  uPerson: { en: "person", hi: "व्यक्ति", ne: "व्यक्ति" },
  uPoint: { en: "point", hi: "बिंदु", ne: "बिन्दु" },
  pieTotal: { en: "Total", hi: "कुल", ne: "जम्मा" },
  pieHint: { en: "Click a slice or a row to highlight it.", hi: "किसी हिस्से या पंक्ति पर क्लिक करके उसे उभारें।", ne: "कुनै भाग वा पङ्क्तिमा क्लिक गरेर उजागर गर्नुहोस्।" },
  pieEmpty: { en: "Nothing to chart yet.", hi: "अभी चार्ट के लिए कुछ नहीं।", ne: "अहिले चार्टका लागि केही छैन।" },
  stClosed: { en: "Closed by you", hi: "आपने बंद किया", ne: "तपाईंले बन्द गर्नुभयो" },
  stHigh: { en: "Open, high risk or worse", hi: "खुली, उच्च जोखिम या अधिक", ne: "खुला, उच्च जोखिम वा बढी" },
  stLow: { en: "Open, lower risk", hi: "खुली, कम जोखिम", ne: "खुला, कम जोखिम" },
  stNoData: { en: "No data", hi: "डेटा नहीं", ne: "डेटा छैन" },

  // ---- road closures page ----
  colRoad: { en: "Road", hi: "सड़क", ne: "सडक" },
  colClass: { en: "Risk class", hi: "जोखिम वर्ग", ne: "जोखिम वर्ग" },
  colRisk: { en: "Risk", hi: "जोखिम", ne: "जोखिम" },
  colLen: { en: "Length", hi: "लंबाई", ne: "लम्बाइ" },
  reopen: { en: "Reopen", hi: "खोलें", ne: "खोल्नुहोस्" },
  clNone: { en: "No roads closed. Click a road on the map to close it.", hi: "कोई सड़क बंद नहीं। बंद करने के लिए नक्शे पर सड़क पर क्लिक करें।", ne: "कुनै सडक बन्द छैन। बन्द गर्न नक्सामा सडकमा क्लिक गर्नुहोस्।" },
  closeHigh: { en: "Close all high-risk roads", hi: "सभी उच्च-जोखिम सड़कें बंद करें", ne: "सबै उच्च-जोखिम सडक बन्द गर्नुहोस्" },

  // ---- shelters & hospitals page ----
  shCampsTitle: { en: "Relief camps", hi: "राहत शिविर", ne: "राहत शिविर" },
  shCampsNote: { en: "Each card shows the supply route from the base. Distance from the river is measured to the demo river line, not surveyed.", hi: "हर कार्ड बेस से आपूर्ति मार्ग दिखाता है। नदी से दूरी डेमो नदी रेखा तक मापी गई है, सर्वे की हुई नहीं।", ne: "हरेक कार्डले बेसबाट आपूर्ति मार्ग देखाउँछ। नदीबाट दूरी डेमो नदी रेखासम्म नापिएको हो, सर्वेक्षण गरिएको होइन।" },
  shHospTitle: { en: "Hospitals", hi: "अस्पताल", ne: "अस्पताल" },
  shHospNote: { en: "Demo hospitals. Real bed counts and opening status need a data feed from the hospitals.", hi: "डेमो अस्पताल। असली बिस्तर संख्या और खुलने की स्थिति के लिए अस्पतालों से डेटा फ़ीड चाहिए।", ne: "डेमो अस्पताल। वास्तविक शय्या सङ्ख्या र खुल्ने अवस्थाका लागि अस्पतालबाट डेटा फिड चाहिन्छ।" },
  colHosp: { en: "Hospital", hi: "अस्पताल", ne: "अस्पताल" },
  colAssigned: { en: "Rescue points sent here", hi: "यहाँ भेजे गए बचाव बिंदु", ne: "यहाँ पठाइएका उद्धार बिन्दु" },
  colQuick: { en: "Quickest ambulance", hi: "सबसे तेज़ एम्बुलेंस", ne: "सबैभन्दा छिटो एम्बुलेन्स" },
  fromRiver: { en: "from river (approx.)", hi: "नदी से (लगभग)", ne: "नदीबाट (लगभग)" },
  showSafe: { en: "Show safe supply route", hi: "सुरक्षित आपूर्ति मार्ग दिखाएँ", ne: "सुरक्षित आपूर्ति मार्ग देखाउनुहोस्" },
  totalCap: { en: "Total camp capacity", hi: "कुल शिविर क्षमता", ne: "कुल शिविर क्षमता" },

  // ---- chokepoint page ----
  ckTitle: { en: "Top 10 chokepoints", hi: "शीर्ष 10 अवरोध", ne: "शीर्ष १० अवरोध" },
  ckNote: { en: "Ranked by how important the road is to the network and how flood-prone it is. Click a row to see it on the map.", hi: "सड़क नेटवर्क के लिए कितनी ज़रूरी है और कितनी बाढ़-प्रवण है, इस आधार पर क्रम। नक्शे पर देखने के लिए पंक्ति पर क्लिक करें।", ne: "सडक सञ्जालका लागि कति महत्त्वपूर्ण छ र कति बाढी-प्रवण छ भन्ने आधारमा क्रम। नक्सामा हेर्न पङ्क्तिमा क्लिक गर्नुहोस्।" },
  downloadChoke: { en: "Download chokepoints (CSV)", hi: "अवरोध डाउनलोड करें (CSV)", ne: "अवरोध डाउनलोड गर्नुहोस् (CSV)" },
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

// ---------- the five Respond pages (same names as the Home footer links) ----------
const HERO = {
  plan: { eyebrow: T.eyebrow, a: T.h1a, b: T.h1b, sub: T.sub },
  closures: { eyebrow: T.clEyebrow, a: T.clH1a, b: T.clH1b, sub: T.clSub },
  shelters: { eyebrow: T.shEyebrow, a: T.shH1a, b: T.shH1b, sub: T.shSub },
  ambulance: { eyebrow: T.amEyebrow, a: T.amH1a, b: T.amH1b, sub: T.amSub },
  chokepoints: { eyebrow: T.ckEyebrow, a: T.ckH1a, b: T.ckH1b, sub: T.ckSub },
};
const VIEWS = [
  { key: "closures", path: "/closures", label: T.tabClosures },
  { key: "shelters", path: "/shelters", label: T.tabShelters },
  { key: "ambulance", path: "/ambulance", label: T.tabAmbulance },
  { key: "chokepoints", path: "/chokepoints", label: T.tabChoke },
  { key: "plan", path: "/Respond", label: T.tabPlan },
];

// Categorical colours for the pie charts: fixed order, checked with the palette validator
// (dark surface). A camp or hospital keeps its colour whatever else is on screen.
const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#0ca30c"];
const STATUS_COLORS = { closed: "#d03b3b", high: "#ec835a", low: "#0ca30c" };
const campColor = Object.fromEntries(shelters.map((s, i) => [s.id, SERIES[i % SERIES.length]]));
const hospColor = Object.fromEntries(hospitals.map((h, i) => [h.id, SERIES[i % SERIES.length]]));

// shortest distance (m) from a point to the demo river line (flat-earth approximation, fine at city scale)
const distToRiverM = ([lat0, lon0]) => {
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110540;
  let best = Infinity;
  for (let i = 0; i < RIVER_LINE.length - 1; i++) {
    const ax = (RIVER_LINE[i][1] - lon0) * kx, ay = (RIVER_LINE[i][0] - lat0) * ky;
    const bx = (RIVER_LINE[i + 1][1] - lon0) * kx, by = (RIVER_LINE[i + 1][0] - lat0) * ky;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
};
const riverDist = Object.fromEntries(shelters.map((s) => [s.id, distToRiverM(s.pos)]));

const fmtPct = (p) => (p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`);

// ---------- pie chart (pure SVG, no extra library) ----------
// slices: [{ key, name, value, color }]. Hover or click a slice or a legend row to pull it out.
function PieChart({ slices, unit, unitOne, totalLabel, hint, emptyText, label }) {
  const [pin, setPin] = useState(null);
  const [hov, setHov] = useState(null);
  const active = hov ?? pin;
  const u = (n) => (n === 1 && unitOne ? unitOne : unit);
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return <p className="rs-empty">{emptyText}</p>;

  const W = 720, H = 330, cx = W / 2, cy = H / 2, R = 108;
  const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  let a = -Math.PI / 2;
  const arcs = slices.filter((s) => s.value > 0).map((s) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const arc = { ...s, a0: a, a1: a + sweep, mid: a + sweep / 2, pct: (s.value / total) * 100 };
    a += sweep;
    return arc;
  });

  // outside labels, pushed apart so they never overlap
  const labelY = {};
  ["r", "l"].forEach((side) => {
    const items = arcs
      .filter((s) => (Math.cos(s.mid) >= 0) === (side === "r"))
      .map((s) => ({ s, y: cy + (R + 22) * Math.sin(s.mid) }))
      .sort((p, q) => p.y - q.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 40) items[i].y = items[i - 1].y + 40;
    const over = items.length ? items[items.length - 1].y - (H - 26) : 0;
    if (over > 0) items.forEach((it) => { it.y -= over; });
    items.forEach((it) => { labelY[it.s.key] = Math.max(24, it.y); });
  });

  const sel = slices.find((s) => s.key === active);
  const toggle = (k) => setPin((p) => (p === k ? null : k));

  return (
    <div className="rs-pie-wrap">
      <svg className="rs-pie" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {arcs.map((s) => {
          const on = active === s.key;
          const full = s.a1 - s.a0 >= Math.PI * 2 - 1e-6;
          const [x0, y0] = pt(R, s.a0);
          const [x1, y1] = pt(R, s.a1);
          const [px, py] = pt(R * 0.62, s.mid);
          const d = `M${cx},${cy} L${x0},${y0} A${R},${R} 0 ${s.a1 - s.a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`;
          // only a clicked slice is pulled out; hover just brightens it (a moving slice under the cursor would flicker)
          const shift = pin === s.key ? `translate(${Math.cos(s.mid) * 10}px, ${Math.sin(s.mid) * 10}px)` : "none";
          return (
            <g
              key={s.key}
              className={`rs-slice${on ? " on" : ""}`}
              style={{ transform: shift }}
              role="button"
              tabIndex={0}
              aria-label={`${s.name}: ${s.value} ${u(s.value)}, ${fmtPct(s.pct)}`}
              onClick={() => toggle(s.key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle(s.key)}
              onMouseEnter={() => setHov(s.key)}
              onMouseLeave={() => setHov(null)}
              onFocus={() => setHov(s.key)}
              onBlur={() => setHov(null)}
            >
              <title>{`${s.name}: ${s.value} ${u(s.value)} (${fmtPct(s.pct)})`}</title>
              {full ? <circle cx={cx} cy={cy} r={R} fill={s.color} /> : <path d={d} fill={s.color} />}
              {s.pct >= 7 && <text x={px} y={py} className="rs-slice-pct">{fmtPct(s.pct)}</text>}
            </g>
          );
        })}
        {arcs.map((s) => {
          const right = Math.cos(s.mid) >= 0;
          const ly = labelY[s.key];
          const [ex, ey] = pt(R + 3, s.mid);
          const ox = cx + (right ? R + 34 : -(R + 34));
          const tx = ox + (right ? 8 : -8);
          return (
            <g key={`l-${s.key}`} className="rs-pie-lab" aria-hidden="true">
              <polyline className="rs-pie-leader" points={`${ex},${ey} ${ox},${ly} ${tx},${ly}`} />
              <text x={tx + (right ? 4 : -4)} y={ly - 3} textAnchor={right ? "start" : "end"} className="rs-pie-name">{s.name}</text>
              <text x={tx + (right ? 4 : -4)} y={ly + 15} textAnchor={right ? "start" : "end"} className="rs-pie-val">{s.value} {u(s.value)} · {fmtPct(s.pct)}</text>
            </g>
          );
        })}
      </svg>
      <p className="rs-pie-detail" aria-live="polite">
        {sel ? `${sel.name}: ${sel.value} ${u(sel.value)} · ${fmtPct((sel.value / total) * 100)}` : `${totalLabel}: ${total} ${u(total)} · ${hint}`}
      </p>
      <ul className="rs-pie-legend">
        {slices.map((s) => (
          <li
            key={s.key}
            className={`${active === s.key ? "on" : ""}${s.value === 0 ? " zero" : ""}`}
            onClick={() => s.value > 0 && toggle(s.key)}
            onMouseEnter={() => s.value > 0 && setHov(s.key)}
            onMouseLeave={() => setHov(null)}
          >
            <i style={{ background: s.color }} />
            <span>{s.name}</span>
            <b>{s.value}</b>
            <em>{fmtPct((s.value / total) * 100)}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
export default function Respond({ view = "plan" }) {
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

  // ---------- extra data for the five Respond pages ----------
  const gridRef = useRef(null);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  const riskCounts = useMemo(() => {
    const c = [0, 0, 0, 0, 0];
    let nd = 0;
    net.edges.forEach((e, i) => { if (e.S == null) nd++; else c[riskClass(risks[i])]++; });
    return { c, nd };
  }, [risks]);

  const statusCounts = useMemo(() => {
    let closedN = 0, high = 0, low = 0, nd = 0;
    net.edges.forEach((e, i) => {
      if (closed.has(e.id)) closedN++;
      else if (e.S == null) nd++;
      else if (riskClass(risks[i]) >= 3) high++;
      else low++;
    });
    return { closedN, high, low, nd };
  }, [closed, risks]);

  const chokes = useMemo(() => chokepoints(net, intensity, rain24), [intensity, rain24]);
  const chokeCounts = useMemo(() => {
    const c = [0, 0, 0, 0, 0];
    let nd = 0;
    chokes.forEach((k) => { if (k.e.S == null) nd++; else c[riskClass(k.risk)]++; });
    return { c, nd };
  }, [chokes]);

  const closedRows = useMemo(
    () => net.edges.map((e, i) => ({ e, i })).filter(({ e }) => closed.has(e.id)),
    [closed],
  );

  const hospLoad = useMemo(() => hospitals.map((h) => {
    const mine = calc.inc.filter((p) => p.safe && p.safe.target === h.node);
    return { ...h, count: mine.length, best: mine.length ? Math.min(...mine.map((p) => p.safe.time)) : null };
  }), [calc.inc]);

  const totalCap = shelters.reduce((s, c) => s + (c.capacity || 0), 0);

  // slices for the pie charts
  const riskSlices = [
    ...CLASSES.map((c, i) => ({ key: c.key, name: c.label, value: riskCounts.c[i], color: c.color })),
    { key: "nodata", name: tr(T.stNoData), value: riskCounts.nd, color: NODATA.color },
  ];
  const chokeSlices = [
    ...CLASSES.map((c, i) => ({ key: c.key, name: c.label, value: chokeCounts.c[i], color: c.color })),
    { key: "nodata", name: tr(T.stNoData), value: chokeCounts.nd, color: NODATA.color },
  ];
  const statusSlices = [
    { key: "closed", name: tr(T.stClosed), value: statusCounts.closedN, color: STATUS_COLORS.closed },
    { key: "high", name: tr(T.stHigh), value: statusCounts.high, color: STATUS_COLORS.high },
    { key: "low", name: tr(T.stLow), value: statusCounts.low, color: STATUS_COLORS.low },
    { key: "nodata", name: tr(T.stNoData), value: statusCounts.nd, color: NODATA.color },
  ];
  const supplySlices = calc.camps.map((c) => ({ key: c.id, name: c.name, value: c.r ? alloc[c.id] ?? 0 : 0, color: campColor[c.id] }));
  const capSlices = shelters.map((s) => ({ key: s.id, name: s.name, value: s.capacity || 0, color: campColor[s.id] }));
  const hospSlices = [
    ...hospLoad.map((h) => ({ key: h.id, name: h.name, value: h.count, color: hospColor[h.id] })),
    { key: "noroute", name: tr(T.noRoute), value: stats.noRoute, color: NODATA.color },
  ];

  const pieCard = (title, note, slices, unit, unitOne) => (
    <div className="rs-card">
      <h3>{tr(title)}</h3>
      <PieChart
        slices={slices}
        unit={tr(unit)}
        unitOne={tr(unitOne)}
        totalLabel={tr(T.pieTotal)}
        hint={tr(T.pieHint)}
        emptyText={tr(T.pieEmpty)}
        label={tr(title)}
      />
      <p className="rs-note">{tr(note)}</p>
    </div>
  );

  // ---------- actions for the extra pages ----------
  const scrollToMap = () => gridRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  const showCampRoute = (id) => {
    const off = selectedCamp === id;
    setSelectedCamp(off ? null : id);
    if (!off) scrollToMap();
  };
  const focusRoad = (e) => {
    setSelectedRoad(e.id);
    if (map.current) map.current.fitBounds(L.latLngBounds(e.coords), { maxZoom: 16, padding: [80, 80] });
    scrollToMap();
  };
  const closeHighRisk = () => setClosed((prev) => {
    const n = new Set(prev);
    net.edges.forEach((e, i) => { if (e.S != null && riskClass(risks[i]) >= 3) n.add(e.id); });
    return n;
  });
  const saveCsv = (name, rows) => {
    const csv = rows.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const downloadChokes = () => saveCsv("setu_chokepoints.csv", [
    ["rank", "road_id", "road", "risk_class", "risk", "length_m", "closed"],
    ...chokes.map((k, n) => [n + 1, k.e.id, k.e.name, edgeClassInfo(k.e, k.risk).label, k.risk.toFixed(2), Math.round(k.e.length), closed.has(k.e.id) ? "yes" : "no"]),
  ]);

  const hero = HERO[view] || HERO.plan;
  const showContacts = view === "plan" || view === "shelters";

  // ---------- page pieces (re-used by the different pages) ----------
  const unitsInput = (
    <label className="rs-units">
      <span>{tr(T.units)}</span>
      <input type="number" min="0" max="100000" step="50" value={units} onChange={(e) => setUnits(e.target.value)} />
    </label>
  );

  const incSection = (
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
  );

  const campSection = (
    <section className="rs-card rs-wide">
      <h3>{tr(T.campTitle)}</h3>
      <p className="rs-note">{tr(T.campNote)} {tr(T.vehicleNote)}</p>
      {unitsInput}
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
  );

  const statsCard = (
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
  );

  const roadCard = (
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
  );

  // Road Closures page: list of closed roads
  const closedCard = (
    <div className="rs-card">
      <h3>{tr(T.kClosed)} · {closedRows.length}</h3>
      <div className="rs-row rs-row--inline">
        <button className="rs-btn rs-btn--ghost" onClick={closeHighRisk} disabled={highCount === 0}>{tr(T.closeHigh)} ({highCount})</button>
        <button className="rs-btn rs-btn--ghost" onClick={() => { setClosed(new Set()); setSelectedRoad(null); }} disabled={!closed.size}>{tr(T.reopenAll)}</button>
      </div>
      {closedRows.length === 0 ? <p className="rs-empty">{tr(T.clNone)}</p> : (
        <div className="rs-table-wrap rs-scroll">
          <table className="rs-table">
            <thead><tr><th>{tr(T.colRoad)}</th><th>{tr(T.colClass)}</th><th>{tr(T.colLen)}</th><th /></tr></thead>
            <tbody>
              {closedRows.map(({ e, i }) => (
                <tr key={e.id} className={selectedRoad === e.id ? "is-sel" : ""} onClick={() => focusRoad(e)}>
                  <td>{e.name}</td>
                  <td><span className="rs-pill" style={{ background: edgeClassInfo(e, risks[i]).color }}>{edgeClassInfo(e, risks[i]).label}</span></td>
                  <td>{fmtKm(e.length)}</td>
                  <td><button className="rs-btn rs-btn--ghost rs-btn--sm" onClick={(ev) => { ev.stopPropagation(); toggleClosed(e.id); }}>{tr(T.reopen)}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Shelters & Hospitals page: camp cards + hospital table
  const campCards = (
    <section className="rs-card rs-wide">
      <h3>{tr(T.shCampsTitle)}</h3>
      <p className="rs-note">{tr(T.shCampsNote)} {tr(T.vehicleNote)}</p>
      {unitsInput}
      <div className="rs-cards">
        {calc.camps.map((c) => (
          <article key={c.id} className={`rs-camp${selectedCamp === c.id ? " is-sel" : ""}`}>
            <div className="rs-camp-top">
              <span className={`rs-conf rs-conf--${c.r ? c.conf.level : "red"}`}>{c.r ? lvl(c.conf.level) : tr(T.noRoute)}</span>
              <span>{fmtKm(riverDist[c.id])} {tr(T.fromRiver)}</span>
            </div>
            <h4><i style={{ background: campColor[c.id] }} />{c.name}</h4>
            <dl>
              <div><dt>{tr(T.colCap)}</dt><dd>{c.capacity} {tr(T.uPeople)}</dd></div>
              <div><dt>{tr(T.colEta)}</dt><dd>{c.r ? fmtMin(c.r.time) : "—"}</dd></div>
              <div><dt>{tr(T.colDist)}</dt><dd>{c.r ? fmtKm(c.r.distance) : "—"}</dd></div>
              <div><dt>{tr(T.colUnits)}</dt><dd>{c.r ? alloc[c.id] ?? 0 : 0}</dd></div>
            </dl>
            <button className="rs-btn rs-btn--ghost" disabled={!c.r} onClick={() => showCampRoute(c.id)}>
              {selectedCamp === c.id ? tr(T.hideRoute) : tr(T.showSafe)}
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  const hospCard = (
    <div className="rs-card">
      <h3>{tr(T.shHospTitle)}</h3>
      <div className="rs-table-wrap">
        <table className="rs-table">
          <thead><tr><th>{tr(T.colHosp)}</th><th>{tr(T.colAssigned)}</th><th>{tr(T.colQuick)}</th></tr></thead>
          <tbody>
            {hospLoad.map((h) => (
              <tr key={h.id}>
                <td><i className="rs-dot" style={{ background: hospColor[h.id] }} />{h.name}</td>
                <td><b>{h.count}</b></td>
                <td>{h.best != null ? fmtMin(h.best) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="rs-note">{tr(T.shHospNote)}</p>
      <p className="rs-note"><b>{tr(T.totalCap)}:</b> {totalCap} {tr(T.uPeople)} (demo)</p>
    </div>
  );

  // Chokepoint Report page: ranked table
  const chokeSection = (
    <section className="rs-card rs-wide">
      <h3>{tr(T.ckTitle)}</h3>
      <p className="rs-note">{tr(T.ckNote)}</p>
      <div className="rs-table-wrap">
        <table className="rs-table">
          <thead><tr><th>#</th><th>{tr(T.colRoad)}</th><th>{tr(T.colClass)}</th><th>{tr(T.colRisk)}</th><th>{tr(T.colLen)}</th><th /></tr></thead>
          <tbody>
            {chokes.map((k, n) => {
              const info = edgeClassInfo(k.e, k.risk);
              return (
                <tr key={k.e.id} className={selectedRoad === k.e.id ? "is-sel" : ""} onClick={() => focusRoad(k.e)}>
                  <td><span className="rs-num rs-num--rank">{n + 1}</span></td>
                  <td>{k.e.name}</td>
                  <td><span className="rs-pill" style={{ background: info.color }}>{closed.has(k.e.id) ? tr(T.closed) : info.label}</span></td>
                  <td>{k.risk.toFixed(2)}</td>
                  <td>{fmtKm(k.e.length)}</td>
                  <td><button className="rs-btn rs-btn--ghost rs-btn--sm" onClick={(ev) => { ev.stopPropagation(); toggleClosed(k.e.id); }}>{closed.has(k.e.id) ? tr(T.reopenRoad) : tr(T.closeRoad)}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="rs-btn rs-btn--primary" onClick={downloadChokes}>⬇ {tr(T.downloadChoke)}</button>
    </section>
  );

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
          <p className="eyebrow">{tr(hero.eyebrow)}</p>
          <h1>{tr(hero.a)} <span className="accent">{tr(hero.b)}</span></h1>
          <p className="rs-sub">{tr(hero.sub)}</p>
          <span className="rs-chip"><i />{tr(T.demoChip)}</span>
        </section>

        {/* the five Respond pages */}
        <nav className="rs-tabs" aria-label={tr(T.tabsLabel)}>
          {VIEWS.map((v) => (
            <Link key={v.key} to={v.path} className={view === v.key ? "on" : ""} aria-current={view === v.key ? "page" : undefined}>{tr(v.label)}</Link>
          ))}
        </nav>

        {/* EMERGENCY OVERVIEW */}
        <section className="rs-kpis">
          <div className="rs-kpi rs-kpi--warn"><b>{highCount}</b><small>/ {net.edges.length}</small><span>{tr(T.kHigh)}</span></div>
          <div className="rs-kpi rs-kpi--red"><b>{closed.size}</b><span>{tr(T.kClosed)}</span></div>
          <div className="rs-kpi"><b>{incidents.length}</b><span>{tr(T.kInc)}</span></div>
          <div className="rs-kpi rs-kpi--ok"><b>{stats.reachable}</b><small>{tr(T.of)} {incidents.length}</small><span>{tr(T.kAmb)}</span></div>
          <div className="rs-kpi rs-kpi--ok"><b>{stats.campsOk}</b><small>{tr(T.of)} {shelters.length}</small><span>{tr(T.kCamps)}</span></div>
        </section>

        {/* CONTROLS + MAP (on every page) */}
        <section className="rs-grid" ref={gridRef}>
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

            {showContacts && (
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
            )}
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

        {/* ---- page-specific sections ---- */}
        {view === "plan" && (
          <>
            <section className="rs-two">
              {pieCard(T.chRiskTitle, T.chRiskNote, riskSlices, T.uRoads, T.uRoad)}
              {pieCard(T.chSupplyTitle, T.chSupplyNote, supplySlices, T.uUnits, T.uUnit)}
            </section>
            {incSection}
            {campSection}
            <section className="rs-two">{statsCard}{roadCard}</section>
            <section className="rs-card rs-wide">
              <h3>{tr(T.roadmapTitle)}</h3>
              <p className="rs-note">{tr(T.roadmapNote)}</p>
              <ul className="rs-roadmap">{ROADMAP.map((r) => <li key={r.en}>{tr(r)}</li>)}</ul>
            </section>
          </>
        )}

        {view === "closures" && (
          <>
            <section className="rs-two">
              {closedCard}
              {pieCard(T.chStatusTitle, T.chStatusNote, statusSlices, T.uRoads, T.uRoad)}
            </section>
            <section className="rs-two">
              {pieCard(T.chRiskTitle, T.chRiskNote, riskSlices, T.uRoads, T.uRoad)}
              {roadCard}
            </section>
          </>
        )}

        {view === "shelters" && (
          <>
            <section className="rs-two">
              {pieCard(T.chCapTitle, T.chCapNote, capSlices, T.uPeople, T.uPerson)}
              {hospCard}
            </section>
            {campCards}
            <section className="rs-two">
              {pieCard(T.chSupplyTitle, T.chSupplyNote, supplySlices, T.uUnits, T.uUnit)}
              {pieCard(T.chHospTitle, T.chHospNote, hospSlices, T.uPoints, T.uPoint)}
            </section>
          </>
        )}

        {view === "ambulance" && (
          <>
            {incSection}
            <section className="rs-two">
              {pieCard(T.chHospTitle, T.chHospNote, hospSlices, T.uPoints, T.uPoint)}
              {statsCard}
            </section>
          </>
        )}

        {view === "chokepoints" && (
          <>
            {chokeSection}
            <section className="rs-two">
              {pieCard(T.chChokeTitle, T.chChokeNote, chokeSlices, T.uRoads, T.uRoad)}
              {roadCard}
            </section>
          </>
        )}

        <div className="rs-limits">{tr(T.limits)} {tr(T.limitsEngine)}</div>
      </main>
    </div>
  );
}
