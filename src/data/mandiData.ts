import { CropGroup, IndianState, MandiMarket, CultivationInputs, ClusterInfo, StateMetadata, IndianRegion } from '../types/mandi';

export const INDIAN_STATES: IndianState[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const STATE_METADATA: Record<IndianState, StateMetadata> = {
  'Andhra Pradesh': { state: 'Andhra Pradesh', region: 'South', capital: 'Amaravati', majorCrops: ['Chilli', 'Rice (Paddy)', 'Cotton', 'Tobacco', 'Groundnut'], averageRainfallMm: 78.4 },
  'Arunachal Pradesh': { state: 'Arunachal Pradesh', region: 'North-East', capital: 'Itanagar', majorCrops: ['Rice', 'Maize', 'Millet', 'Ginger', 'Orange'], averageRainfallMm: 232.0 },
  'Assam': { state: 'Assam', region: 'North-East', capital: 'Dispur', majorCrops: ['Tea', 'Rice (Paddy)', 'Jute', 'Mustard', 'Arecanut'], averageRainfallMm: 184.5 },
  'Bihar': { state: 'Bihar', region: 'East', capital: 'Patna', majorCrops: ['Maize', 'Rice', 'Wheat', 'Pulses', 'Litchi'], averageRainfallMm: 84.2 },
  'Chhattisgarh': { state: 'Chhattisgarh', region: 'Central', capital: 'Raipur', majorCrops: ['Rice (Paddy)', 'Maize', 'Soybean', 'Groundnut', 'Kodo-Kutki'], averageRainfallMm: 108.6 },
  'Goa': { state: 'Goa', region: 'West', capital: 'Panaji', majorCrops: ['Cashewnut', 'Coconut', 'Paddy', 'Arecanut', 'Mango'], averageRainfallMm: 250.4 },
  'Gujarat': { state: 'Gujarat', region: 'West', capital: 'Gandhinagar', majorCrops: ['Cotton', 'Groundnut', 'Cumin (Jeera)', 'Castor', 'Sesamum'], averageRainfallMm: 63.8 },
  'Haryana': { state: 'Haryana', region: 'North', capital: 'Chandigarh', majorCrops: ['Basmati Rice', 'Wheat', 'Mustard', 'Cotton', 'Sugarcane'], averageRainfallMm: 52.4 },
  'Himachal Pradesh': { state: 'Himachal Pradesh', region: 'North', capital: 'Shimla', majorCrops: ['Apple', 'Potato', 'Maize', 'Ginger', 'Off-season Vegetables'], averageRainfallMm: 104.2 },
  'Jharkhand': { state: 'Jharkhand', region: 'East', capital: 'Ranchi', majorCrops: ['Rice', 'Pulses', 'Oilseeds', 'Tomato', 'Vegetables'], averageRainfallMm: 110.2 },
  'Karnataka': { state: 'Karnataka', region: 'South', capital: 'Bengaluru', majorCrops: ['Ragi', 'Maize', 'Coffee', 'Tur (Arhar)', 'Sunflower', 'Arecanut'], averageRainfallMm: 74.2 },
  'Kerala': { state: 'Kerala', region: 'South', capital: 'Thiruvananthapuram', majorCrops: ['Black Pepper', 'Cardamom', 'Natural Rubber', 'Coconut', 'Banana'], averageRainfallMm: 252.0 },
  'Madhya Pradesh': { state: 'Madhya Pradesh', region: 'Central', capital: 'Bhopal', majorCrops: ['Soybean', 'Wheat (Sharbati)', 'Gram (Chana)', 'Garlic', 'Mustard'], averageRainfallMm: 88.6 },
  'Maharashtra': { state: 'Maharashtra', region: 'West', capital: 'Mumbai', majorCrops: ['Onion', 'Cotton', 'Soybean', 'Sugarcane', 'Pomegranate', 'Grapes'], averageRainfallMm: 86.4 },
  'Manipur': { state: 'Manipur', region: 'North-East', capital: 'Imphal', majorCrops: ['Paddy', 'Chilli (Hathei)', 'Passion Fruit', 'Ginger', 'Turmeric'], averageRainfallMm: 122.4 },
  'Meghalaya': { state: 'Meghalaya', region: 'North-East', capital: 'Shillong', majorCrops: ['Lakadong Turmeric', 'Ginger', 'Potato', 'Arecanut', 'Broomgrass'], averageRainfallMm: 240.0 },
  'Mizoram': { state: 'Mizoram', region: 'North-East', capital: 'Aizawl', majorCrops: ['Ginger', 'Turmeric', 'Paddy', 'Bird Eye Chilli', 'Mandarin Orange'], averageRainfallMm: 215.0 },
  'Nagaland': { state: 'Nagaland', region: 'North-East', capital: 'Kohima', majorCrops: ['Naga King Chilli', 'Rice', 'Maize', 'Cardamom', 'Coffee'], averageRainfallMm: 165.0 },
  'Odisha': { state: 'Odisha', region: 'East', capital: 'Bhubaneswar', majorCrops: ['Rice (Paddy)', 'Pulses', 'Turmeric (Kandhamal)', 'Cashew', 'Groundnut'], averageRainfallMm: 124.5 },
  'Punjab': { state: 'Punjab', region: 'North', capital: 'Chandigarh', majorCrops: ['Wheat', 'Rice (Paddy)', 'Cotton', 'Maize', 'Kinnow'], averageRainfallMm: 58.7 },
  'Rajasthan': { state: 'Rajasthan', region: 'North', capital: 'Jaipur', majorCrops: ['Mustard', 'Guar Gum', 'Bajra', 'Cumin', 'Coriander', 'Isabgol'], averageRainfallMm: 46.2 },
  'Sikkim': { state: 'Sikkim', region: 'North-East', capital: 'Gangtok', majorCrops: ['Organic Large Cardamom', 'Ginger', 'Buckwheat', 'Sikkim Mandarin'], averageRainfallMm: 228.0 },
  'Tamil Nadu': { state: 'Tamil Nadu', region: 'South', capital: 'Chennai', majorCrops: ['Paddy', 'Turmeric', 'Banana', 'Tapioca', 'Groundnut', 'Coconut'], averageRainfallMm: 79.5 },
  'Telangana': { state: 'Telangana', region: 'South', capital: 'Hyderabad', majorCrops: ['Cotton', 'Paddy', 'Red Chilli', 'Turmeric', 'Maize'], averageRainfallMm: 76.8 },
  'Tripura': { state: 'Tripura', region: 'North-East', capital: 'Agartala', majorCrops: ['Rubber', 'Rice', 'Pineapple (Queen)', 'Jute', 'Jackfruit'], averageRainfallMm: 192.0 },
  'Uttar Pradesh': { state: 'Uttar Pradesh', region: 'North', capital: 'Lucknow', majorCrops: ['Sugarcane', 'Wheat', 'Potato', 'Rice', 'Mango', 'Mustard'], averageRainfallMm: 71.5 },
  'Uttarakhand': { state: 'Uttarakhand', region: 'North', capital: 'Dehradun', majorCrops: ['Basmati', 'Finger Millet', 'Apple', 'Pulses (Bhatt/Gahat)', 'Soybean'], averageRainfallMm: 118.0 },
  'West Bengal': { state: 'West Bengal', region: 'East', capital: 'Kolkata', majorCrops: ['Paddy (Aman/Boro)', 'Jute', 'Potato', 'Tea', 'Betel Leaves'], averageRainfallMm: 148.0 },
};

export const MANDI_MARKETS: MandiMarket[] = [
  // 1. Andhra Pradesh
  { id: 'ap_guntur', name: 'Guntur (Mirchi Yard)', state: 'Andhra Pradesh', district: 'Guntur', totalArrivalsAnnualTonne: 480000, averageRainfallMm: 72.5 },
  { id: 'ap_vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', district: 'NTR', totalArrivalsAnnualTonne: 290000, averageRainfallMm: 81.0 },
  { id: 'ap_kurnool', name: 'Kurnool', state: 'Andhra Pradesh', district: 'Kurnool', totalArrivalsAnnualTonne: 210000, averageRainfallMm: 64.5 },
  { id: 'ap_rajahmundry', name: 'Rajahmundry', state: 'Andhra Pradesh', district: 'East Godavari', totalArrivalsAnnualTonne: 195000, averageRainfallMm: 95.8 },

  // 2. Arunachal Pradesh
  { id: 'ar_naharlagun', name: 'Naharlagun', state: 'Arunachal Pradesh', district: 'Papum Pare', totalArrivalsAnnualTonne: 42000, averageRainfallMm: 235.0 },
  { id: 'ar_pasighat', name: 'Pasighat', state: 'Arunachal Pradesh', district: 'East Siang', totalArrivalsAnnualTonne: 38000, averageRainfallMm: 228.0 },

  // 3. Assam
  { id: 'as_guwahati', name: 'Guwahati (Pamohi)', state: 'Assam', district: 'Kamrup Metropolitan', totalArrivalsAnnualTonne: 240000, averageRainfallMm: 172.0 },
  { id: 'as_darrang', name: 'Darrang (Kharupetia)', state: 'Assam', district: 'Darrang', totalArrivalsAnnualTonne: 165000, averageRainfallMm: 195.0 },
  { id: 'as_nagaon', name: 'Nagaon', state: 'Assam', district: 'Nagaon', totalArrivalsAnnualTonne: 130000, averageRainfallMm: 186.0 },

  // 4. Bihar
  { id: 'br_gulabbagh', name: 'Gulabbagh (Purnea Maize Hub)', state: 'Bihar', district: 'Purnea', totalArrivalsAnnualTonne: 580000, averageRainfallMm: 105.0 },
  { id: 'br_muzaffarpur', name: 'Muzaffarpur', state: 'Bihar', district: 'Muzaffarpur', totalArrivalsAnnualTonne: 230000, averageRainfallMm: 88.5 },
  { id: 'br_patna', name: 'Patna (Mithapur)', state: 'Bihar', district: 'Patna', totalArrivalsAnnualTonne: 310000, averageRainfallMm: 79.2 },

  // 5. Chhattisgarh
  { id: 'cg_raipur', name: 'Raipur', state: 'Chhattisgarh', district: 'Raipur', totalArrivalsAnnualTonne: 340000, averageRainfallMm: 112.0 },
  { id: 'cg_rajnandgaon', name: 'Rajnandgaon', state: 'Chhattisgarh', district: 'Rajnandgaon', totalArrivalsAnnualTonne: 220000, averageRainfallMm: 105.0 },
  { id: 'cg_bilaspur', name: 'Bilaspur', state: 'Chhattisgarh', district: 'Bilaspur', totalArrivalsAnnualTonne: 190000, averageRainfallMm: 109.0 },

  // 6. Goa
  { id: 'ga_margao', name: 'Margao', state: 'Goa', district: 'South Goa', totalArrivalsAnnualTonne: 85000, averageRainfallMm: 255.0 },
  { id: 'ga_mapusa', name: 'Mapusa', state: 'Goa', district: 'North Goa', totalArrivalsAnnualTonne: 72000, averageRainfallMm: 246.0 },

  // 7. Gujarat
  { id: 'gj_unjha', name: 'Unjha (Asia Cumin Capital)', state: 'Gujarat', district: 'Mehsana', totalArrivalsAnnualTonne: 490000, averageRainfallMm: 48.0 },
  { id: 'gj_rajkot', name: 'Rajkot', state: 'Gujarat', district: 'Rajkot', totalArrivalsAnnualTonne: 320000, averageRainfallMm: 54.2 },
  { id: 'gj_surat', name: 'Surat', state: 'Gujarat', district: 'Surat', totalArrivalsAnnualTonne: 310000, averageRainfallMm: 112.5 },
  { id: 'gj_ahmedabad', name: 'Ahmedabad (Jamalpur)', state: 'Gujarat', district: 'Ahmedabad', totalArrivalsAnnualTonne: 380000, averageRainfallMm: 63.8 },
  { id: 'gj_gondal', name: 'Gondal', state: 'Gujarat', district: 'Rajkot', totalArrivalsAnnualTonne: 215000, averageRainfallMm: 52.0 },

  // 8. Haryana
  { id: 'hr_karnal', name: 'Karnal (Basmati Hub)', state: 'Haryana', district: 'Karnal', totalArrivalsAnnualTonne: 460000, averageRainfallMm: 58.0 },
  { id: 'hr_sirsa', name: 'Sirsa (Cotton Yard)', state: 'Haryana', district: 'Sirsa', totalArrivalsAnnualTonne: 340000, averageRainfallMm: 38.0 },
  { id: 'hr_hisar', name: 'Hisar', state: 'Haryana', district: 'Hisar', totalArrivalsAnnualTonne: 270000, averageRainfallMm: 42.0 },

  // 9. Himachal Pradesh
  { id: 'hp_shimla', name: 'Shimla (Dhali Apple Yard)', state: 'Himachal Pradesh', district: 'Shimla', totalArrivalsAnnualTonne: 180000, averageRainfallMm: 115.0 },
  { id: 'hp_solan', name: 'Solan (Tomato Capital)', state: 'Himachal Pradesh', district: 'Solan', totalArrivalsAnnualTonne: 140000, averageRainfallMm: 102.0 },
  { id: 'hp_kullu', name: 'Kullu', state: 'Himachal Pradesh', district: 'Kullu', totalArrivalsAnnualTonne: 95000, averageRainfallMm: 96.0 },

  // 10. Jharkhand
  { id: 'jh_ranchi', name: 'Ranchi (Pandra)', state: 'Jharkhand', district: 'Ranchi', totalArrivalsAnnualTonne: 210000, averageRainfallMm: 114.0 },
  { id: 'jh_jamshedpur', name: 'Jamshedpur', state: 'Jharkhand', district: 'East Singhbhum', totalArrivalsAnnualTonne: 175000, averageRainfallMm: 118.0 },
  { id: 'jh_hazaribagh', name: 'Hazaribagh', state: 'Jharkhand', district: 'Hazaribagh', totalArrivalsAnnualTonne: 125000, averageRainfallMm: 98.0 },

  // 11. Karnataka
  { id: 'ka_satara_ref', name: 'Shimoga', state: 'Karnataka', district: 'Shivamogga', totalArrivalsAnnualTonne: 142000, averageRainfallMm: 94.3 },
  { id: 'ka_mysore', name: 'Mysore (Bandipalya)', state: 'Karnataka', district: 'Mysuru', totalArrivalsAnnualTonne: 168000, averageRainfallMm: 68.5 },
  { id: 'ka_bangalore', name: 'Bangalore (Yeshwanthpur)', state: 'Karnataka', district: 'Bengaluru Urban', totalArrivalsAnnualTonne: 420000, averageRainfallMm: 72.0 },
  { id: 'ka_tumkur', name: 'Tumkur', state: 'Karnataka', district: 'Tumakuru', totalArrivalsAnnualTonne: 110000, averageRainfallMm: 58.4 },
  { id: 'ka_davangere', name: 'Davangere', state: 'Karnataka', district: 'Davanagere', totalArrivalsAnnualTonne: 135000, averageRainfallMm: 61.2 },
  { id: 'ka_hubli', name: 'Hubli (Amaragol)', state: 'Karnataka', district: 'Dharwad', totalArrivalsAnnualTonne: 220000, averageRainfallMm: 64.9 },

  // 12. Kerala
  { id: 'kl_kochi', name: 'Kochi (Ernakulam Market)', state: 'Kerala', district: 'Ernakulam', totalArrivalsAnnualTonne: 280000, averageRainfallMm: 260.0 },
  { id: 'kl_kottayam', name: 'Kottayam (Spice & Rubber)', state: 'Kerala', district: 'Kottayam', totalArrivalsAnnualTonne: 160000, averageRainfallMm: 275.0 },
  { id: 'kl_palakkad', name: 'Palakkad (Rice Granary)', state: 'Kerala', district: 'Palakkad', totalArrivalsAnnualTonne: 195000, averageRainfallMm: 210.0 },

  // 13. Madhya Pradesh
  { id: 'mp_indore', name: 'Indore (Choithram Mandi)', state: 'Madhya Pradesh', district: 'Indore', totalArrivalsAnnualTonne: 510000, averageRainfallMm: 82.0 },
  { id: 'mp_neemuch', name: 'Neemuch (Medicinal & Garlic Hub)', state: 'Madhya Pradesh', district: 'Neemuch', totalArrivalsAnnualTonne: 340000, averageRainfallMm: 68.0 },
  { id: 'mp_ujjain', name: 'Ujjain', state: 'Madhya Pradesh', district: 'Ujjain', totalArrivalsAnnualTonne: 310000, averageRainfallMm: 85.0 },
  { id: 'mp_mandsaur', name: 'Mandsaur', state: 'Madhya Pradesh', district: 'Mandsaur', totalArrivalsAnnualTonne: 285000, averageRainfallMm: 71.0 },

  // 14. Maharashtra
  { id: 'mh_lasalgaon', name: 'Lasalgaon (Asia Onion Capital)', state: 'Maharashtra', district: 'Nashik', totalArrivalsAnnualTonne: 590000, averageRainfallMm: 76.0 },
  { id: 'mh_satara', name: 'Satara', state: 'Maharashtra', district: 'Satara', totalArrivalsAnnualTonne: 124500, averageRainfallMm: 86.4 },
  { id: 'mh_aurangabad', name: 'Aurangabad', state: 'Maharashtra', district: 'Chhatrapati Sambhajinagar', totalArrivalsAnnualTonne: 185000, averageRainfallMm: 62.1 },
  { id: 'mh_pune', name: 'Pune (Gultekdi)', state: 'Maharashtra', district: 'Pune', totalArrivalsAnnualTonne: 420000, averageRainfallMm: 74.8 },
  { id: 'mh_nashik', name: 'Nashik', state: 'Maharashtra', district: 'Nashik', totalArrivalsAnnualTonne: 295000, averageRainfallMm: 81.2 },
  { id: 'mh_kolhapur', name: 'Kolhapur (Jaggery Yard)', state: 'Maharashtra', district: 'Kolhapur', totalArrivalsAnnualTonne: 190000, averageRainfallMm: 98.6 },
  { id: 'mh_vashi', name: 'Vashi (APMC Navi Mumbai)', state: 'Maharashtra', district: 'Thane', totalArrivalsAnnualTonne: 640000, averageRainfallMm: 195.0 },

  // 15. Manipur
  { id: 'mn_imphal', name: 'Imphal (Khwairamband)', state: 'Manipur', district: 'Imphal West', totalArrivalsAnnualTonne: 55000, averageRainfallMm: 120.0 },
  { id: 'mn_thoubal', name: 'Thoubal', state: 'Manipur', district: 'Thoubal', totalArrivalsAnnualTonne: 42000, averageRainfallMm: 125.0 },

  // 16. Meghalaya
  { id: 'ml_shillong', name: 'Shillong (Iewduh Bara Bazar)', state: 'Meghalaya', district: 'East Khasi Hills', totalArrivalsAnnualTonne: 68000, averageRainfallMm: 245.0 },
  { id: 'ml_tura', name: 'Tura', state: 'Meghalaya', district: 'West Garo Hills', totalArrivalsAnnualTonne: 39000, averageRainfallMm: 230.0 },

  // 17. Mizoram
  { id: 'mz_aizawl', name: 'Aizawl (New Market)', state: 'Mizoram', district: 'Aizawl', totalArrivalsAnnualTonne: 46000, averageRainfallMm: 218.0 },
  { id: 'mz_kolasib', name: 'Kolasib', state: 'Mizoram', district: 'Kolasib', totalArrivalsAnnualTonne: 31000, averageRainfallMm: 212.0 },

  // 18. Nagaland
  { id: 'nl_dimapur', name: 'Dimapur (Supermarket Yard)', state: 'Nagaland', district: 'Dimapur', totalArrivalsAnnualTonne: 78000, averageRainfallMm: 158.0 },
  { id: 'nl_kohima', name: 'Kohima', state: 'Nagaland', district: 'Kohima', totalArrivalsAnnualTonne: 41000, averageRainfallMm: 172.0 },

  // 19. Odisha
  { id: 'od_bargarh', name: 'Bargarh (Rice Bowl Mandi)', state: 'Odisha', district: 'Bargarh', totalArrivalsAnnualTonne: 340000, averageRainfallMm: 122.0 },
  { id: 'od_cuttack', name: 'Cuttack (Malgodown)', state: 'Odisha', district: 'Cuttack', totalArrivalsAnnualTonne: 260000, averageRainfallMm: 130.0 },
  { id: 'od_sambalpur', name: 'Sambalpur', state: 'Odisha', district: 'Sambalpur', totalArrivalsAnnualTonne: 195000, averageRainfallMm: 126.0 },

  // 20. Punjab
  { id: 'pb_khanna', name: 'Khanna (Asia Largest Grain Mandi)', state: 'Punjab', district: 'Ludhiana', totalArrivalsAnnualTonne: 610000, averageRainfallMm: 60.1 },
  { id: 'pb_ludhiana', name: 'Ludhiana', state: 'Punjab', district: 'Ludhiana', totalArrivalsAnnualTonne: 410000, averageRainfallMm: 58.7 },
  { id: 'pb_amritsar', name: 'Amritsar (Bhagtanwala)', state: 'Punjab', district: 'Amritsar', totalArrivalsAnnualTonne: 280000, averageRainfallMm: 55.3 },
  { id: 'pb_jalandhar', name: 'Jalandhar', state: 'Punjab', district: 'Jalandhar', totalArrivalsAnnualTonne: 240000, averageRainfallMm: 59.4 },
  { id: 'pb_bathinda', name: 'Bathinda (Cotton Belt)', state: 'Punjab', district: 'Bathinda', totalArrivalsAnnualTonne: 320000, averageRainfallMm: 45.0 },

  // 21. Rajasthan
  { id: 'rj_kota', name: 'Kota (Bhamashah Mandi)', state: 'Rajasthan', district: 'Kota', totalArrivalsAnnualTonne: 520000, averageRainfallMm: 68.0 },
  { id: 'rj_ganganagar', name: 'Sri Ganganagar (Wheat/Mustard)', state: 'Rajasthan', district: 'Sri Ganganagar', totalArrivalsAnnualTonne: 440000, averageRainfallMm: 28.0 },
  { id: 'rj_jodhpur', name: 'Jodhpur (Jeera Mandi)', state: 'Rajasthan', district: 'Jodhpur', totalArrivalsAnnualTonne: 290000, averageRainfallMm: 34.0 },
  { id: 'rj_bikaner', name: 'Bikaner (Guar Gum Yard)', state: 'Rajasthan', district: 'Bikaner', totalArrivalsAnnualTonne: 260000, averageRainfallMm: 29.0 },

  // 22. Sikkim
  { id: 'sk_gangtok', name: 'Gangtok (Lall Market)', state: 'Sikkim', district: 'East Sikkim', totalArrivalsAnnualTonne: 35000, averageRainfallMm: 232.0 },
  { id: 'sk_mangan', name: 'Mangan (Cardamom Hub)', state: 'Sikkim', district: 'North Sikkim', totalArrivalsAnnualTonne: 28000, averageRainfallMm: 245.0 },

  // 23. Tamil Nadu
  { id: 'tn_koyambedu', name: 'Koyambedu (Chennai Wholesale)', state: 'Tamil Nadu', district: 'Chennai', totalArrivalsAnnualTonne: 550000, averageRainfallMm: 110.0 },
  { id: 'tn_erode', name: 'Erode (Turmeric City Yard)', state: 'Tamil Nadu', district: 'Erode', totalArrivalsAnnualTonne: 320000, averageRainfallMm: 62.0 },
  { id: 'tn_madurai', name: 'Madurai (Mattuthavani)', state: 'Tamil Nadu', district: 'Madurai', totalArrivalsAnnualTonne: 280000, averageRainfallMm: 72.0 },
  { id: 'tn_coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', district: 'Coimbatore', totalArrivalsAnnualTonne: 260000, averageRainfallMm: 58.0 },

  // 24. Telangana
  { id: 'ts_warangal', name: 'Warangal (Enamamula Asia 2nd Largest)', state: 'Telangana', district: 'Warangal', totalArrivalsAnnualTonne: 560000, averageRainfallMm: 82.0 },
  { id: 'ts_hyderabad', name: 'Hyderabad (Bowenpally)', state: 'Telangana', district: 'Hyderabad', totalArrivalsAnnualTonne: 390000, averageRainfallMm: 75.0 },
  { id: 'ts_nizamabad', name: 'Nizamabad (Turmeric Hub)', state: 'Telangana', district: 'Nizamabad', totalArrivalsAnnualTonne: 275000, averageRainfallMm: 86.0 },

  // 25. Tripura
  { id: 'tr_agartala', name: 'Agartala (Gol Bazar)', state: 'Tripura', district: 'West Tripura', totalArrivalsAnnualTonne: 68000, averageRainfallMm: 195.0 },
  { id: 'tr_udaipur', name: 'Udaipur', state: 'Tripura', district: 'Gomati', totalArrivalsAnnualTonne: 42000, averageRainfallMm: 188.0 },

  // 26. Uttar Pradesh
  { id: 'up_muzaffarnagar', name: 'Muzaffarnagar (Gur/Jaggery Capital)', state: 'Uttar Pradesh', district: 'Muzaffarnagar', totalArrivalsAnnualTonne: 520000, averageRainfallMm: 68.0 },
  { id: 'up_saharanpur', name: 'Saharanpur', state: 'Uttar Pradesh', district: 'Saharanpur', totalArrivalsAnnualTonne: 340000, averageRainfallMm: 72.0 },
  { id: 'up_bareilly', name: 'Bareilly', state: 'Uttar Pradesh', district: 'Bareilly', totalArrivalsAnnualTonne: 290000, averageRainfallMm: 79.0 },
  { id: 'up_varanasi', name: 'Varanasi (Chandauli Rice)', state: 'Uttar Pradesh', district: 'Varanasi', totalArrivalsAnnualTonne: 330000, averageRainfallMm: 85.0 },
  { id: 'up_kanpur', name: 'Kanpur (Chakeri)', state: 'Uttar Pradesh', district: 'Kanpur Nagar', totalArrivalsAnnualTonne: 380000, averageRainfallMm: 70.0 },

  // 27. Uttarakhand
  { id: 'uk_haldwani', name: 'Haldwani Mandi', state: 'Uttarakhand', district: 'Nainital', totalArrivalsAnnualTonne: 240000, averageRainfallMm: 145.0 },
  { id: 'uk_dehradun', name: 'Dehradun (Niranjanpur)', state: 'Uttarakhand', district: 'Dehradun', totalArrivalsAnnualTonne: 190000, averageRainfallMm: 160.0 },
  { id: 'uk_kashipur', name: 'Kashipur', state: 'Uttarakhand', district: 'Udham Singh Nagar', totalArrivalsAnnualTonne: 210000, averageRainfallMm: 110.0 },

  // 28. West Bengal
  { id: 'wb_siliguri', name: 'Siliguri (Regulated Market)', state: 'West Bengal', district: 'Darjeeling', totalArrivalsAnnualTonne: 360000, averageRainfallMm: 240.0 },
  { id: 'wb_burdwan', name: 'Burdwan (Rice Granary)', state: 'West Bengal', district: 'Purba Bardhaman', totalArrivalsAnnualTonne: 420000, averageRainfallMm: 125.0 },
  { id: 'wb_kolkata', name: 'Kolkata (Koley Market / Posta)', state: 'West Bengal', district: 'Kolkata', totalArrivalsAnnualTonne: 490000, averageRainfallMm: 142.0 },
  { id: 'wb_malda', name: 'Malda (Mango Yard)', state: 'West Bengal', district: 'Malda', totalArrivalsAnnualTonne: 210000, averageRainfallMm: 115.0 },
];

export const CROP_GROUPS: { group: CropGroup; sampleCommodities: string[]; defaultPriceQuintal: number; defaultMoM: number }[] = [
  { group: 'Cereals', sampleCommodities: ['Wheat', 'Rice (Paddy)', 'Bajra', 'Jowar', 'Maize', 'Barley'], defaultPriceQuintal: 82.31, defaultMoM: -2.4 },
  { group: 'Vegetables', sampleCommodities: ['Onion', 'Potato', 'Tomato', 'Cauliflower', 'Brinjal', 'Cabbage'], defaultPriceQuintal: 62.41, defaultMoM: 1.2 },
  { group: 'Oil Seeds', sampleCommodities: ['Groundnut', 'Soybean', 'Mustard', 'Sunflower', 'Sesamum'], defaultPriceQuintal: 142.78, defaultMoM: 5.6 },
  { group: 'Pulses', sampleCommodities: ['Gram (Chana)', 'Tur (Arhar)', 'Moong', 'Urad', 'Masur'], defaultPriceQuintal: 241.11, defaultMoM: 3.2 },
  { group: 'Fruits', sampleCommodities: ['Banana', 'Mango', 'Orange', 'Pomegranate', 'Apple', 'Grapes'], defaultPriceQuintal: 154.91, defaultMoM: 1.6 },
  { group: 'Spices', sampleCommodities: ['Dry Chilli', 'Turmeric', 'Coriander', 'Garlic', 'Cumin'], defaultPriceQuintal: 286.45, defaultMoM: 4.8 },
  { group: 'Fibre Crops', sampleCommodities: ['Cotton', 'Jute', 'Mesta', 'Sunhemp'], defaultPriceQuintal: 178.20, defaultMoM: -0.8 },
  { group: 'Dry Fruits', sampleCommodities: ['Cashewnuts', 'Almonds', 'Raisins', 'Walnuts'], defaultPriceQuintal: 412.50, defaultMoM: 2.1 },
  { group: 'Forest Products', sampleCommodities: ['Mahua', 'Tendu Leaves', 'Lac', 'Honey'], defaultPriceQuintal: 115.30, defaultMoM: 0.4 },
  { group: 'Drug and Narcotics', sampleCommodities: ['Tobacco', 'Opium (Regulated)', 'Betel Leaves'], defaultPriceQuintal: 385.60, defaultMoM: -1.5 },
  { group: 'Flowers', sampleCommodities: ['Marigold', 'Rose', 'Jasmine', 'Chrysanthemum'], defaultPriceQuintal: 76.80, defaultMoM: 6.4 },
  { group: 'Live Stock/Poultry/Fisheries', sampleCommodities: ['Fodder', 'Fish Meal', 'Poultry Feed Base'], defaultPriceQuintal: 360.20, defaultMoM: 0.9 },
  { group: 'Other', sampleCommodities: ['Sugarcane', 'Jaggery (Gur)', 'Animal Feed'], defaultPriceQuintal: 165.40, defaultMoM: 1.1 },
];

/**
 * Baseline statistics strictly from Page 9–11 of the research document
 */
export const BASELINE_CULTIVATION_INPUTS: CultivationInputs = {
  farmLabourHours: 196.32,
  farmLabourCost: 2185.8,
  machineryHours: 6.2,
  machineryCost: 816.09,
  animalOwnedHours: 27.99,
  animalOwnedCost: 1105.58,
  seedQuantityKg: 157.95,
  seedCost: 2698.24,
  fertilizerQuantityKg: 93.79,
  fertilizerCost: 996.49,
  manureTonne: 101.53,
  manureCost: 3245.53,
  insecticideCost: 660.51,
  totalCapitalCost: 101638.55,
  cropAreaHectare: 1.026,
  mainProductTonne: 841.12,
  rainfallMm: 71.99,
  arrivalQuantityTonne: 171.35,
};

/**
 * Multiple Linear Regression Model 1 Coefficients from Page 20–21 of the PDF
 */
export const MLR_MODEL_1 = {
  intercept: 1.026148,
  rSquared: 0.5706,
  adjRSquared: 0.5705,
  fStatistic: 3531,
  rmse: 0.206989,
  degreesOfFreedom: 77047,
  // Crop Group Dummies
  groupCoefficients: {
    Cereals: 0.032727,
    'Drug and Narcotics': 0.811234,
    'Dry Fruits': 0.812874,
    'Fibre Crops': 0.471324,
    Flowers: -0.225698,
    'Forest Products': -0.008503,
    Fruits: 0.183312,
    'Live Stock/Poultry/Fisheries': 0.789181,
    'Oil Seeds': 0.399807,
    Other: 0.410699,
    Pulses: 0.414306,
    Spices: 0.645883,
    Vegetables: 0.0, // Reference category
  } as Record<CropGroup, number>,
  // Numeric Explanatory Variables (log10(X + 1))
  numericCoefficients: {
    arrivalQuantity: 0.02253,
    rainfall: 0.0065,
    farmLabourHours: -0.259642,
    farmLabourCost: 0.358683,
    insecticideCost: 0.029124,
    mainProductTonne: 0.04405,
    totalCapitalCost: 0.006027,
    manureCost: 0.001305,
    manureTonne: 0.004123,
    fertilizerCost: 0.174325,
    fertilizerQuantityKg: -0.283519,
    seedCost: 0.090301,
    seedQuantityKg: -0.062313,
    machineryCost: -0.036309,
    machineryHours: -0.035706,
    animalOwnedCost: 0.084149,
    animalOwnedHours: -0.146888,
  },
};

/**
 * K-Means Cluster results (K=3) from Page 17 of the PDF
 */
export const KMEANS_CLUSTER_DATA: ClusterInfo[] = [
  { group: 'Cereals', cluster1: 18845, cluster2: 2381, cluster3: 2485, dominantCluster: 1, percentageInDominant: 79.5, notes: 'Heavy clustering in Cluster 1; overlaps with Vegetables' },
  { group: 'Vegetables', cluster1: 10791, cluster2: 4233, cluster3: 1274, dominantCluster: 1, percentageInDominant: 66.2, notes: 'High volume across Cluster 1 & 2' },
  { group: 'Oil Seeds', cluster1: 13014, cluster2: 411, cluster3: 1830, dominantCluster: 1, percentageInDominant: 85.3, notes: 'Strongly aligned with capital input group' },
  { group: 'Pulses', cluster1: 13743, cluster2: 160, cluster3: 1136, dominantCluster: 1, percentageInDominant: 91.4, notes: 'Very tight clustering with minimal noise' },
  { group: 'Spices', cluster1: 6624, cluster2: 673, cluster3: 896, dominantCluster: 1, percentageInDominant: 80.8, notes: 'Higher pricing tier with moderate input cost' },
  { group: 'Fruits', cluster1: 4436, cluster2: 2957, cluster3: 527, dominantCluster: 1, percentageInDominant: 56.0, notes: 'Split across Cluster 1 & Cluster 2 due to perishability' },
  { group: 'Fibre Crops', cluster1: 4658, cluster2: 666, cluster3: 654, dominantCluster: 1, percentageInDominant: 78.0, notes: 'Uniform distribution across secondary clusters' },
  { group: 'Dry Fruits', cluster1: 219, cluster2: 2, cluster3: 69, dominantCluster: 1, percentageInDominant: 75.5, notes: 'Distinct high-value profile' },
  { group: 'Drug and Narcotics', cluster1: 1821, cluster2: 0, cluster3: 529, dominantCluster: 1, percentageInDominant: 77.5, notes: 'Zero representation in Cluster 2' },
  { group: 'Forest Products', cluster1: 1468, cluster2: 4, cluster3: 458, dominantCluster: 1, percentageInDominant: 76.1, notes: 'Natural gathering pattern with low fertilizer inputs' },
  { group: 'Flowers', cluster1: 33, cluster2: 0, cluster3: 4, dominantCluster: 1, percentageInDominant: 89.2, notes: 'Highly specialized cluster profile' },
  { group: 'Live Stock/Poultry/Fisheries', cluster1: 0, cluster2: 0, cluster3: 1, dominantCluster: 3, percentageInDominant: 100.0, notes: 'Exclusive outlier cluster representation' },
  { group: 'Other', cluster1: 4263, cluster2: 25, cluster3: 1480, dominantCluster: 1, percentageInDominant: 73.9, notes: 'Blended agricultural byproducts' },
];

/**
 * Correlation matrix values from Page 16 of the PDF
 */
export const CORRELATION_MATRIX = {
  variables: [
    'PRICE',
    'QUANTITY',
    'RAINFALL',
    'MainProd',
    'FarmLab_Hrs',
    'FarmLab_Cost',
    'Machn_Cost',
    'Machn_Hrs',
    'Fert_Cost',
    'TotalCapital',
  ],
  data: [
    [1.000, 0.017, 0.010, -0.019, 0.045, 0.039, -0.045, -0.040, -0.036, -0.049],
    [0.017, 1.000, -0.010, 0.024, 0.019, 0.037, 0.027, 0.038, 0.033, 0.018],
    [0.010, -0.010, 1.000, 0.045, 0.037, 0.061, 0.028, -0.076, 0.087, 0.108],
    [-0.019, 0.024, 0.045, 1.000, 0.156, 0.139, 0.035, 0.027, 0.037, 0.059],
    [0.045, 0.019, 0.037, 0.156, 1.000, 0.696, 0.037, 0.247, 0.078, 0.358],
    [0.039, 0.037, 0.061, 0.139, 0.696, 1.000, 0.042, 0.035, 0.127, 0.595],
    [-0.045, 0.027, 0.028, 0.035, 0.037, 0.042, 1.000, 0.884, 0.649, 0.853],
    [-0.040, 0.038, -0.076, 0.027, 0.247, 0.035, 0.884, 1.000, 0.582, 0.719],
    [-0.036, 0.033, 0.087, 0.037, 0.078, 0.127, 0.649, 0.582, 1.000, 0.853],
    [-0.049, 0.018, 0.108, 0.059, 0.358, 0.595, 0.853, 0.719, 0.853, 1.000],
  ],
};

/**
 * Monthly seasonal distribution benchmarks (Page 13–15 boxplots)
 */
export const MONTHLY_SEASONAL_BENCHMARKS = [
  { month: 'January', rainfall: 2.1, laborCost: 2210, fertilizerCost: 820, insecticideCost: 480, avgPrice: 174.2 },
  { month: 'February', rainfall: 4.8, laborCost: 2190, fertilizerCost: 810, insecticideCost: 460, avgPrice: 178.5 },
  { month: 'March', rainfall: 14.5, laborCost: 2240, fertilizerCost: 860, insecticideCost: 490, avgPrice: 182.0 },
  { month: 'April', rainfall: 18.2, laborCost: 2280, fertilizerCost: 910, insecticideCost: 510, avgPrice: 186.4 },
  { month: 'May', rainfall: 54.6, laborCost: 2340, fertilizerCost: 980, insecticideCost: 540, avgPrice: 191.8 },
  { month: 'June', rainfall: 168.4, laborCost: 2150, fertilizerCost: 840, insecticideCost: 490, avgPrice: 179.3 },
  { month: 'July', rainfall: 265.8, laborCost: 2180, fertilizerCost: 870, insecticideCost: 530, avgPrice: 176.1 },
  { month: 'August', rainfall: 228.3, laborCost: 2160, fertilizerCost: 890, insecticideCost: 560, avgPrice: 175.4 },
  { month: 'September', rainfall: 184.2, laborCost: 2200, fertilizerCost: 930, insecticideCost: 590, avgPrice: 180.2 },
  { month: 'October', rainfall: 78.5, laborCost: 2170, fertilizerCost: 890, insecticideCost: 520, avgPrice: 184.6 },
  { month: 'November', rainfall: 22.1, laborCost: 2210, fertilizerCost: 840, insecticideCost: 470, avgPrice: 188.9 },
  { month: 'December', rainfall: 5.4, laborCost: 2230, fertilizerCost: 830, insecticideCost: 460, avgPrice: 185.3 },
];

/**
 * Diagnostic outliers identified in R Studio (Page 21–22)
 */
export const DIAGNOSTIC_INFLUENTIAL_POINTS = [
  { obsNumber: 53858, cooksDistance: 1.08, residual: 2.74, fittedValue: 2.24, label: 'Obs #53858 (Extreme Cook\'s distance > 1.0)' },
  { obsNumber: 44595, cooksDistance: 0.28, residual: 1.88, fittedValue: 1.76, label: 'Obs #44595 (High leverage point)' },
  { obsNumber: 60011, cooksDistance: 0.15, residual: -1.45, fittedValue: 2.58, label: 'Obs #60011 (Residual deviation)' },
  { obsNumber: 87806, cooksDistance: 0.12, residual: 2.41, fittedValue: 1.85, label: 'Obs #87806 (High residual)' },
];
