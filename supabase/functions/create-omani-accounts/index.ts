import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Account {
  email: string;
  password: string;
  role: string;
  name: string;
  nameAr: string;
  phone: string;
}

const omanPhonePrefix = '+968 9';

function generateOmaniPhone(): string {
  return `${omanPhonePrefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
}

function generateNfcId(prefix: string, index: number): string {
  return `NFC-${prefix}-${String(index).padStart(9, '0')}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });

    console.log('🇴🇲 Starting Omani accounts creation...');

    const createdAccounts: Account[] = [];

    // ========== PARENT ACCOUNTS (20) ==========
    const parentNames = [
      { en: 'Mohammed Al-Balushi', ar: 'محمد البلوشي' },
      { en: 'Ahmed Al-Hinai', ar: 'أحمد الهنائي' },
      { en: 'Salem Al-Rawahi', ar: 'سالم الرواحي' },
      { en: 'Hassan Al-Mamari', ar: 'حسن المعمري' },
      { en: 'Ali Al-Kalbani', ar: 'علي الكلباني' },
      { en: 'Yousuf Al-Busaidi', ar: 'يوسف البوسعيدي' },
      { en: 'Rashid Al-Amri', ar: 'راشد العامري' },
      { en: 'Ibrahim Al-Jabri', ar: 'إبراهيم الجابري' },
      { en: 'Nasser Al-Ghaithi', ar: 'ناصر الغيثي' },
      { en: 'Khalfan Al-Shaibani', ar: 'خلفان الشيباني' },
      { en: 'Salim Al-Harthi', ar: 'سالم الحارثي' },
      { en: 'Hamad Al-Rashdi', ar: 'حمد الراشدي' },
      { en: 'Said Al-Farsi', ar: 'سعيد الفارسي' },
      { en: 'Khalid Al-Maskari', ar: 'خالد المسكري' },
      { en: 'Saud Al-Tubi', ar: 'سعود الطوبي' },
      { en: 'Majid Al-Siyabi', ar: 'ماجد السيابي' },
      { en: 'Faisal Al-Wahaibi', ar: 'فيصل الوهيبي' },
      { en: 'Abdullah Al-Riyami', ar: 'عبدالله الريامي' },
      { en: 'Omar Al-Zadjali', ar: 'عمر الزدجالي' },
      { en: 'Hilal Al-Mawali', ar: 'هلال الموالي' }
    ];

    const parentIds: string[] = [];

    for (let i = 0; i < 20; i++) {
      const email = `parent${i + 1}@talebschool.om`;
      const password = `Parent@${i + 1}23`;
      const phone = generateOmaniPhone();

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: parentNames[i].en, role: 'parent' }
      });

      if (authError) {
        console.error(`Error creating parent ${i + 1}:`, authError);
        continue;
      }

      const userId = authData.user.id;

      // Create profile
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: parentNames[i].en,
        full_name_ar: parentNames[i].ar,
        phone,
        role: 'parent',
        expected_students_count: i < 10 ? 2 : 1 // First 10 parents get 2 students each
      });

      // Create wallet balance
      await supabase.from('wallet_balances').upsert({
        user_id: userId,
        balance: 50 + Math.floor(Math.random() * 100),
        currency: 'OMR'
      });

      parentIds.push(userId);
      createdAccounts.push({ email, password, role: 'parent', name: parentNames[i].en, nameAr: parentNames[i].ar, phone });
      console.log(`✅ Parent ${i + 1}: ${email}`);
    }

    // ========== STUDENTS (30) ==========
    const studentNames = [
      { en: 'Omar', ar: 'عمر', gender: 'male', grade: 5 },
      { en: 'Fatima', ar: 'فاطمة', gender: 'female', grade: 7 },
      { en: 'Abdullah', ar: 'عبدالله', gender: 'male', grade: 3 },
      { en: 'Mariam', ar: 'مريم', gender: 'female', grade: 9 },
      { en: 'Khalid', ar: 'خالد', gender: 'male', grade: 6 },
      { en: 'Aisha', ar: 'عائشة', gender: 'female', grade: 4 },
      { en: 'Saif', ar: 'سيف', gender: 'male', grade: 8 },
      { en: 'Layla', ar: 'ليلى', gender: 'female', grade: 2 },
      { en: 'Hamza', ar: 'حمزة', gender: 'male', grade: 10 },
      { en: 'Noor', ar: 'نور', gender: 'female', grade: 5 },
      { en: 'Yousef', ar: 'يوسف', gender: 'male', grade: 6 },
      { en: 'Sara', ar: 'سارة', gender: 'female', grade: 8 },
      { en: 'Ahmed', ar: 'أحمد', gender: 'male', grade: 7 },
      { en: 'Hana', ar: 'هناء', gender: 'female', grade: 3 },
      { en: 'Rashid', ar: 'راشد', gender: 'male', grade: 9 },
      { en: 'Maha', ar: 'مها', gender: 'female', grade: 4 },
      { en: 'Sultan', ar: 'سلطان', gender: 'male', grade: 10 },
      { en: 'Reem', ar: 'ريم', gender: 'female', grade: 6 },
      { en: 'Faisal', ar: 'فيصل', gender: 'male', grade: 5 },
      { en: 'Dana', ar: 'دانة', gender: 'female', grade: 7 },
      { en: 'Saud', ar: 'سعود', gender: 'male', grade: 8 },
      { en: 'Lina', ar: 'لينا', gender: 'female', grade: 2 },
      { en: 'Majid', ar: 'ماجد', gender: 'male', grade: 3 },
      { en: 'Noura', ar: 'نورة', gender: 'female', grade: 9 },
      { en: 'Badr', ar: 'بدر', gender: 'male', grade: 4 },
      { en: 'Amira', ar: 'أميرة', gender: 'female', grade: 10 },
      { en: 'Hatem', ar: 'حاتم', gender: 'male', grade: 6 },
      { en: 'Salma', ar: 'سلمى', gender: 'female', grade: 5 },
      { en: 'Mansour', ar: 'منصور', gender: 'male', grade: 7 },
      { en: 'Zainab', ar: 'زينب', gender: 'female', grade: 8 }
    ];

    const studentIds: string[] = [];
    const sections = ['A', 'B', 'C'];

    for (let i = 0; i < 30; i++) {
      // First 10 parents get 2 students each (indices 0-19), next 10 parents get 1 each (indices 20-29)
      const parentIndex = i < 20 ? Math.floor(i / 2) : (i - 10);
      const parentId = parentIds[parentIndex];
      
      if (!parentId) continue;

      const student = studentNames[i];
      const parentName = parentNames[parentIndex];
      const section = sections[i % 3];
      const studentId = `STD-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`;
      const nfcId = generateNfcId('STD', i + 1);

      const { data: studentData, error: studentError } = await supabase.from('students').insert({
        student_id: studentId,
        first_name: student.en,
        last_name: parentName.en.split(' ').slice(-1)[0],
        first_name_ar: student.ar,
        last_name_ar: parentName.ar.split(' ').slice(-1)[0],
        gender: student.gender,
        date_of_birth: `${2012 + Math.floor(student.grade / 3)}-0${(i % 12) + 1}-${10 + (i % 15)}`,
        grade: `Grade ${student.grade}`,
        class: `${student.grade}${section}`,
        parent_id: parentId,
        parent_name: parentName.en,
        parent_name_ar: parentName.ar,
        nfc_id: nfcId,
        status: 'active',
        approval_status: 'approved',
        nationality: 'Omani',
        academic_year: '2024-2025',
        enrollment_date: '2024-09-01',
        emergency_contact: generateOmaniPhone(),
        transportation_agreement: true,
        canteen_agreement: true,
        visible_to_parent: true
      }).select().single();

      if (studentError) {
        console.error(`Error creating student ${i + 1}:`, studentError);
        continue;
      }

      studentIds.push(studentData.id);

      // Create student wallet
      await supabase.from('student_wallets').upsert({
        student_id: studentData.id,
        balance: 10 + Math.floor(Math.random() * 30),
        currency: 'OMR'
      });

      console.log(`✅ Student ${i + 1}: ${student.en} ${parentName.en.split(' ').slice(-1)[0]}`);
    }

    // ========== TEACHERS (10) ==========
    const teacherNames = [
      { en: 'Dr. Salim Al-Hashmi', ar: 'د. سالم الهاشمي', subjects: ['Mathematics', 'Physics'] },
      { en: 'Ms. Fatima Al-Lawati', ar: 'أ. فاطمة اللواتية', subjects: ['Arabic', 'Islamic Studies'] },
      { en: 'Mr. Ahmed Al-Suleimani', ar: 'أ. أحمد السليماني', subjects: ['English', 'Social Studies'] },
      { en: 'Mrs. Aisha Al-Kindi', ar: 'أ. عائشة الكندية', subjects: ['Science', 'Biology'] },
      { en: 'Mr. Mohammed Al-Hadhrami', ar: 'أ. محمد الحضرمي', subjects: ['Chemistry', 'Physics'] },
      { en: 'Ms. Mariam Al-Riyami', ar: 'أ. مريم الريامية', subjects: ['English', 'French'] },
      { en: 'Dr. Khalid Al-Farsi', ar: 'د. خالد الفارسي', subjects: ['Mathematics', 'Computer Science'] },
      { en: 'Mrs. Sara Al-Balushi', ar: 'أ. سارة البلوشية', subjects: ['Arabic', 'Art'] },
      { en: 'Mr. Hassan Al-Maamari', ar: 'أ. حسن المعمري', subjects: ['Physical Education', 'Health'] },
      { en: 'Ms. Noura Al-Wahaibi', ar: 'أ. نورة الوهيبية', subjects: ['Music', 'Art'] }
    ];

    const teacherIds: string[] = [];

    for (let i = 0; i < 10; i++) {
      const email = `teacher${i + 1}@talebschool.om`;
      const password = `Teacher@${i + 1}23`;
      const phone = generateOmaniPhone();
      const teacher = teacherNames[i];

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: teacher.en, role: 'teacher' }
      });

      if (authError) {
        console.error(`Error creating teacher ${i + 1}:`, authError);
        continue;
      }

      const userId = authData.user.id;

      await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: teacher.en,
        full_name_ar: teacher.ar,
        phone,
        role: 'teacher'
      });

      const nfcId = generateNfcId('TCH', i + 1);
      const { data: teacherData } = await supabase.from('teachers').insert({
        profile_id: userId,
        employee_id: `TCH-${String(i + 1).padStart(4, '0')}`,
        subjects: teacher.subjects,
        classes: [`${5 + i % 6}A`, `${5 + i % 6}B`],
        qualification: i < 2 ? 'PhD' : 'Masters',
        experience_years: 5 + i,
        join_date: '2020-09-01',
        nfc_id: nfcId
      }).select().single();

      if (teacherData) teacherIds.push(teacherData.id);

      await supabase.from('wallet_balances').upsert({
        user_id: userId,
        balance: 0,
        currency: 'OMR'
      });

      createdAccounts.push({ email, password, role: 'teacher', name: teacher.en, nameAr: teacher.ar, phone });
      console.log(`✅ Teacher ${i + 1}: ${email}`);
    }

    // ========== DRIVERS (5) ==========
    const driverNames = [
      { en: 'Salim Said Al-Busaidi', ar: 'سالم سعيد البوسعيدي' },
      { en: 'Hamad Nasser Al-Harthi', ar: 'حمد ناصر الحارثي' },
      { en: 'Rashid Mohammed Al-Kindi', ar: 'راشد محمد الكندي' },
      { en: 'Saeed Ali Al-Maskari', ar: 'سعيد علي المسكري' },
      { en: 'Faris Abdullah Al-Zadjali', ar: 'فارس عبدالله الزدجالي' }
    ];

    const driverProfileIds: string[] = [];
    const driverIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const email = `driver${i + 1}@talebschool.om`;
      const password = `Driver@${i + 1}23`;
      const phone = generateOmaniPhone();
      const driver = driverNames[i];

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: driver.en, role: 'driver' }
      });

      if (authError) {
        console.error(`Error creating driver ${i + 1}:`, authError);
        continue;
      }

      const userId = authData.user.id;

      await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: driver.en,
        full_name_ar: driver.ar,
        phone,
        role: 'driver'
      });

      const nfcId = generateNfcId('DRV', i + 1);
      const licenseNumber = `OM-DL-${String(100000 + i).padStart(6, '0')}`;
      
      const { data: driverData } = await supabase.from('drivers').insert({
        profile_id: userId,
        employee_id: `DRV-${String(i + 1).padStart(4, '0')}`,
        license_number: licenseNumber,
        license_expiry: '2027-12-31',
        experience_years: 5 + i * 2,
        status: 'active',
        join_date: '2022-01-01'
      }).select().single();

      if (driverData) driverIds.push(driverData.id);
      driverProfileIds.push(userId);

      await supabase.from('wallet_balances').upsert({
        user_id: userId,
        balance: 0,
        currency: 'OMR'
      });

      createdAccounts.push({ email, password, role: 'driver', name: driver.en, nameAr: driver.ar, phone });
      console.log(`✅ Driver ${i + 1}: ${email}`);
    }

    // ========== SUPERVISORS (5) ==========
    const supervisorNames = [
      { en: 'Maryam Khalid Al-Riyami', ar: 'مريم خالد الريامية' },
      { en: 'Zahra Ahmed Al-Hinai', ar: 'زهراء أحمد الهنائية' },
      { en: 'Amal Sultan Al-Amri', ar: 'أمل سلطان العامرية' },
      { en: 'Huda Salim Al-Farsi', ar: 'هدى سالم الفارسية' },
      { en: 'Laila Hamad Al-Jabri', ar: 'ليلى حمد الجابرية' }
    ];

    const supervisorProfileIds: string[] = [];
    const supervisorIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const email = `supervisor${i + 1}@talebschool.om`;
      const password = `Supervisor@${i + 1}23`;
      const phone = generateOmaniPhone();
      const supervisor = supervisorNames[i];

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: supervisor.en, role: 'supervisor' }
      });

      if (authError) {
        console.error(`Error creating supervisor ${i + 1}:`, authError);
        continue;
      }

      const userId = authData.user.id;

      await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: supervisor.en,
        full_name_ar: supervisor.ar,
        phone,
        role: 'supervisor'
      });

      const { data: supData } = await supabase.from('supervisors').insert({
        profile_id: userId,
        employee_id: `SUP-${String(i + 1).padStart(4, '0')}`,
        phone,
        status: 'active'
      }).select().single();

      if (supData) supervisorIds.push(supData.id);
      supervisorProfileIds.push(userId);

      await supabase.from('wallet_balances').upsert({
        user_id: userId,
        balance: 0,
        currency: 'OMR'
      });

      createdAccounts.push({ email, password, role: 'supervisor', name: supervisor.en, nameAr: supervisor.ar, phone });
      console.log(`✅ Supervisor ${i + 1}: ${email}`);
    }

    // ========== BUSES (5) ==========
    const busModels = [
      'Toyota Coaster 2023',
      'Mercedes-Benz Sprinter 2022',
      'Hyundai County 2023',
      'Isuzu Journey 2022',
      'Mitsubishi Rosa 2023'
    ];

    const busIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const { data: busData, error: busError } = await supabase.from('buses').insert({
        bus_number: `BUS-${String.fromCharCode(65 + i)}${i + 1}`,
        capacity: 30 + i * 5,
        model: busModels[i],
        year: 2022 + (i % 2),
        status: 'active',
        driver_id: driverIds[i] || null,
        supervisor_id: supervisorProfileIds[i] || null
      }).select().single();

      if (busError) {
        console.error(`Error creating bus ${i + 1}:`, busError);
        continue;
      }

      if (busData) busIds.push(busData.id);

      // Update driver with bus_id
      if (driverIds[i]) {
        await supabase.from('drivers').update({ bus_id: busData.id }).eq('id', driverIds[i]);
      }

      // Update supervisor with bus_id
      if (supervisorIds[i]) {
        await supabase.from('supervisors').update({ bus_id: busData.id }).eq('id', supervisorIds[i]);
      }

      console.log(`✅ Bus ${i + 1}: ${busData.bus_number}`);
    }

    // ========== BUS ROUTES (5) ==========
    const routes = [
      {
        name: 'Route A: Al Khuwair Loop',
        nameAr: 'المسار أ: دائرة الخوير',
        stops: [
          { name: 'Al Khuwair 33', name_ar: 'الخوير ٣٣', lat: 23.5917, lng: 58.4099, time: '06:30' },
          { name: 'Muscat Grand Mall', name_ar: 'مسقط جراند مول', lat: 23.5880, lng: 58.4059, time: '06:40' },
          { name: 'Al Khuwair Roundabout', name_ar: 'دوار الخوير', lat: 23.5925, lng: 58.4120, time: '06:50' },
          { name: 'MQ (Ministries)', name_ar: 'المنطقة الوزارية', lat: 23.5958, lng: 58.3949, time: '07:00' },
          { name: 'School - Main Gate', name_ar: 'المدرسة - البوابة الرئيسية', lat: 23.6145, lng: 58.4889, time: '07:15' }
        ]
      },
      {
        name: 'Route B: Ruwi Express',
        nameAr: 'المسار ب: روي السريع',
        stops: [
          { name: 'Ruwi Bus Station', name_ar: 'محطة روي', lat: 23.5880, lng: 58.5431, time: '06:25' },
          { name: 'CBD Ruwi', name_ar: 'منطقة الأعمال روي', lat: 23.5867, lng: 58.5420, time: '06:35' },
          { name: 'Wadi Kabir', name_ar: 'الوادي الكبير', lat: 23.5833, lng: 58.4667, time: '06:45' },
          { name: 'Qurum Heights', name_ar: 'مرتفعات القرم', lat: 23.6089, lng: 58.4745, time: '07:00' },
          { name: 'School - Main Gate', name_ar: 'المدرسة - البوابة الرئيسية', lat: 23.6145, lng: 58.4889, time: '07:15' }
        ]
      },
      {
        name: 'Route C: Seeb Coastal',
        nameAr: 'المسار ج: السيب الساحلي',
        stops: [
          { name: 'Seeb Clock Tower', name_ar: 'برج الساعة السيب', lat: 23.6709, lng: 58.1898, time: '06:20' },
          { name: 'Al Mawaleh South', name_ar: 'المعبيلة الجنوبية', lat: 23.6333, lng: 58.4000, time: '06:35' },
          { name: 'Al Hail North', name_ar: 'الحيل الشمالية', lat: 23.5833, lng: 58.3167, time: '06:50' },
          { name: 'Al Ghubra', name_ar: 'الغبرة', lat: 23.6167, lng: 58.4500, time: '07:05' },
          { name: 'School - Main Gate', name_ar: 'المدرسة - البوابة الرئيسية', lat: 23.6145, lng: 58.4889, time: '07:15' }
        ]
      },
      {
        name: 'Route D: Bausher Hills',
        nameAr: 'المسار د: تلال بوشر',
        stops: [
          { name: 'Bausher Heights', name_ar: 'مرتفعات بوشر', lat: 23.5667, lng: 58.4167, time: '06:35' },
          { name: 'Al Ansab', name_ar: 'الأنصب', lat: 23.5500, lng: 58.4333, time: '06:45' },
          { name: 'Al Azaiba', name_ar: 'العذيبة', lat: 23.6139, lng: 58.4428, time: '06:55' },
          { name: 'Shatti Al Qurum', name_ar: 'شاطئ القرم', lat: 23.6100, lng: 58.4800, time: '07:05' },
          { name: 'School - Main Gate', name_ar: 'المدرسة - البوابة الرئيسية', lat: 23.6145, lng: 58.4889, time: '07:15' }
        ]
      },
      {
        name: 'Route E: Muttrah Heritage',
        nameAr: 'المسار هـ: مطرح التراثي',
        stops: [
          { name: 'Muttrah Souq', name_ar: 'سوق مطرح', lat: 23.6237, lng: 58.5651, time: '06:25' },
          { name: 'Muttrah Corniche', name_ar: 'كورنيش مطرح', lat: 23.6200, lng: 58.5600, time: '06:35' },
          { name: 'Old Muscat', name_ar: 'مسقط القديمة', lat: 23.6150, lng: 58.5950, time: '06:45' },
          { name: 'Sidab', name_ar: 'سداب', lat: 23.6000, lng: 58.5800, time: '06:55' },
          { name: 'School - Main Gate', name_ar: 'المدرسة - البوابة الرئيسية', lat: 23.6145, lng: 58.4889, time: '07:15' }
        ]
      }
    ];

    for (let i = 0; i < 5; i++) {
      const route = routes[i];
      
      await supabase.from('bus_routes').insert({
        route_name: route.name,
        route_name_ar: route.nameAr,
        bus_id: busIds[i] || null,
        stops: route.stops,
        morning_schedule: { start_time: route.stops[0].time, end_time: '07:15' },
        afternoon_schedule: { start_time: '13:30', end_time: '14:30' },
        is_active: true
      });

      // Create bus location
      if (busIds[i]) {
        await supabase.from('bus_locations').upsert({
          bus_id: busIds[i],
          latitude: route.stops[2].lat,
          longitude: route.stops[2].lng,
          current_stop: route.stops[2].name,
          next_stop: route.stops[3].name,
          eta_minutes: 10,
          speed: 40,
          heading: 45
        });
      }

      console.log(`✅ Route ${i + 1}: ${route.name}`);
    }

    // ========== ASSIGN STUDENTS TO BUSES ==========
    for (let i = 0; i < studentIds.length; i++) {
      const busIndex = i % 5;
      if (busIds[busIndex] && studentIds[i]) {
        await supabase.from('student_bus_assignments').upsert({
          student_id: studentIds[i],
          bus_id: busIds[busIndex],
          pickup_location: routes[busIndex].stops[0].name,
          dropoff_location: routes[busIndex].stops[0].name,
          is_active: true
        });

        // Update student with bus_id
        await supabase.from('students').update({ bus_id: busIds[busIndex] }).eq('id', studentIds[i]);
      }
    }

    console.log('✅ Students assigned to buses');

    // ========== CANTEEN ITEMS (10) ==========
    const canteenItems = [
      { name: 'Oman Chips Classic', name_ar: 'عمان شيبس كلاسيك', price: 0.15, category: 'Snacks', icon: '🥔' },
      { name: 'Lays Chips', name_ar: 'ليز شيبس', price: 0.25, category: 'Snacks', icon: '🥔' },
      { name: 'KitKat Bar', name_ar: 'كيت كات', price: 0.35, category: 'Chocolates', icon: '🍫' },
      { name: 'Galaxy Chocolate', name_ar: 'جالاكسي', price: 0.50, category: 'Chocolates', icon: '🍫' },
      { name: 'Vimto Juice', name_ar: 'عصير فيمتو', price: 0.30, category: 'Drinks', icon: '🍇' },
      { name: 'Fresh Orange Juice', name_ar: 'عصير برتقال طازج', price: 0.50, category: 'Drinks', icon: '🍊' },
      { name: 'Bottled Water', name_ar: 'مياه معبأة', price: 0.10, category: 'Drinks', icon: '💧' },
      { name: 'Cheese Sandwich', name_ar: 'ساندويتش جبن', price: 0.75, category: 'Sandwiches', icon: '🥪' },
      { name: 'Chicken Shawarma', name_ar: 'شاورما دجاج', price: 1.50, category: 'Hot Meals', icon: '🌯' },
      { name: 'Omani Dates', name_ar: 'تمر عماني', price: 0.40, category: 'Healthy', icon: '🌴' }
    ];

    for (const item of canteenItems) {
      await supabase.from('canteen_items').upsert({
        name: item.name,
        name_ar: item.name_ar,
        price: item.price,
        category: item.category,
        icon: item.icon,
        available: true,
        stock_quantity: 100
      }, { onConflict: 'name' });
    }

    console.log('✅ Created 10 canteen items');

    // ========== STORE PRODUCTS (10) ==========
    const storeProducts = [
      { name: 'School Uniform Shirt', name_ar: 'قميص الزي المدرسي', price: 8.00, category: 'Uniforms', description: 'White cotton school shirt' },
      { name: 'School Uniform Pants', name_ar: 'بنطال الزي المدرسي', price: 12.00, category: 'Uniforms', description: 'Navy blue school pants' },
      { name: 'School Backpack', name_ar: 'حقيبة مدرسية', price: 15.00, category: 'Bags', description: 'Durable school backpack with logo' },
      { name: 'Notebook Pack (5)', name_ar: 'حزمة دفاتر (٥)', price: 3.00, category: 'Stationery', description: 'Pack of 5 ruled notebooks' },
      { name: 'Pen Set', name_ar: 'طقم أقلام', price: 2.50, category: 'Stationery', description: 'Blue and black pen set' },
      { name: 'School Shoes', name_ar: 'حذاء مدرسي', price: 25.00, category: 'Footwear', description: 'Black leather school shoes' },
      { name: 'PE Uniform Set', name_ar: 'زي التربية البدنية', price: 18.00, category: 'Uniforms', description: 'Sports uniform set' },
      { name: 'Art Supplies Kit', name_ar: 'طقم أدوات فنية', price: 10.00, category: 'Supplies', description: 'Colors, brushes, and paper' },
      { name: 'Calculator Scientific', name_ar: 'آلة حاسبة علمية', price: 8.00, category: 'Electronics', description: 'Scientific calculator for math' },
      { name: 'School Cap', name_ar: 'قبعة مدرسية', price: 5.00, category: 'Accessories', description: 'School logo baseball cap' }
    ];

    for (const product of storeProducts) {
      await supabase.from('products').upsert({
        name: product.name,
        name_ar: product.name_ar,
        price: product.price,
        category: product.category,
        description: product.description,
        description_ar: product.name_ar,
        stock_quantity: 50,
        in_stock: true
      }, { onConflict: 'name' });
    }

    console.log('✅ Created 10 store products');

    // ========== CLASSES ==========
    const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const grade of grades) {
      for (const section of ['A', 'B', 'C']) {
        await supabase.from('classes').upsert({
          name: `Grade ${grade} - Section ${section}`,
          grade: `Grade ${grade}`,
          section,
          total_students: Math.floor(Math.random() * 10) + 20
        }, { onConflict: 'grade,section' });
      }
    }

    console.log('✅ Created classes');

    // ========== SCHOOL ATTENDANCE ACCOUNT ==========
    const schoolAttEmail = 'schoolattendance@talebschool.om';
    const schoolAttPassword = 'SchoolAtt@2024';

    const { data: existingSchoolAtt } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', schoolAttEmail)
      .maybeSingle();

    if (!existingSchoolAtt) {
      const { data: schoolAttAuth, error: schoolAttError } = await supabase.auth.admin.createUser({
        email: schoolAttEmail,
        password: schoolAttPassword,
        email_confirm: true,
        user_metadata: { full_name: 'School Gate Attendance', role: 'school_attendance' }
      });

      if (!schoolAttError && schoolAttAuth.user) {
        await supabase.from('profiles').upsert({
          id: schoolAttAuth.user.id,
          email: schoolAttEmail,
          full_name: 'School Gate Attendance',
          full_name_ar: 'حضور بوابة المدرسة',
          role: 'school_attendance',
          linked_entity_type: 'device'
        });

        // Create employee record for NFC login
        const nfcId = generateNfcId('ATT', 1);
        await supabase.from('employees').insert({
          profile_id: schoolAttAuth.user.id,
          employee_id: 'ATT-0001',
          position: 'security',
          nfc_id: nfcId,
          employment_status: 'active',
          join_date: '2024-01-01'
        });

        createdAccounts.push({
          email: schoolAttEmail,
          password: schoolAttPassword,
          role: 'school_attendance',
          name: 'School Gate Attendance',
          nameAr: 'حضور بوابة المدرسة',
          phone: '+968 90000001'
        });

        console.log(`✅ School Attendance: ${schoolAttEmail} (NFC: ${nfcId})`);
      }
    }

    console.log('✅ School attendance account ready');

    // ========== ADMIN ACCOUNT ==========
    const adminEmail = 'admin@talebschool.om';
    const adminPassword = 'Admin@2024';

    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();

    if (!existingAdmin) {
      const { data: adminAuth, error: adminError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: 'System Administrator', role: 'admin' }
      });

      if (!adminError && adminAuth.user) {
        await supabase.from('profiles').upsert({
          id: adminAuth.user.id,
          email: adminEmail,
          full_name: 'System Administrator',
          full_name_ar: 'مدير النظام',
          role: 'admin'
        });

        createdAccounts.unshift({
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          name: 'System Administrator',
          nameAr: 'مدير النظام',
          phone: '+968 91234567'
        });
      }
    }

    console.log('✅ Admin account ready');

    // ========== ADMIN WALLET ==========
    await supabase.from('admin_wallets').upsert({
      id: crypto.randomUUID(),
      balance: 10000,
      currency: 'OMR'
    });

    console.log('🎉 All accounts and data created successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All Omani accounts created successfully',
        summary: {
          parents: 20,
          students: 30,
          teachers: 10,
          drivers: 5,
          supervisors: 5,
          buses: 5,
          routes: 5,
          canteenItems: 10,
          storeProducts: 10
        },
        accounts: createdAccounts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
