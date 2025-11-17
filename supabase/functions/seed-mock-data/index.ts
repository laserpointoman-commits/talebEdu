import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });

    console.log('Starting comprehensive mock data seeding...');

    // Step 1: Get parent account ID
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'parent@talebschool.com')
      .single();

    if (!parentProfile) {
      throw new Error('Parent test account not found. Run create-test-accounts first.');
    }

    const parentId = parentProfile.id;

    // Step 2: Create 10 Omani students
    const studentNames = [
      { en: 'Omar Mohammed Al-Balushi', ar: 'عمر محمد البلوشي', gender: 'male', grade: 5 },
      { en: 'Fatima Ahmed Al-Hinai', ar: 'فاطمة أحمد الهنائية', gender: 'female', grade: 7 },
      { en: 'Abdullah Salem Al-Rawahi', ar: 'عبدالله سالم الرواحي', gender: 'male', grade: 3 },
      { en: 'Mariam Hassan Al-Mamari', ar: 'مريم حسن المعمرية', gender: 'female', grade: 9 },
      { en: 'Khalid Ali Al-Kalbani', ar: 'خالد علي الكلباني', gender: 'male', grade: 6 },
      { en: 'Aisha Yousuf Al-Busaidi', ar: 'عائشة يوسف البوسعيدية', gender: 'female', grade: 4 },
      { en: 'Saif Rashid Al-Amri', ar: 'سيف راشد العامري', gender: 'male', grade: 8 },
      { en: 'Layla Ibrahim Al-Jabri', ar: 'ليلى إبراهيم الجابرية', gender: 'female', grade: 2 },
      { en: 'Hamza Nasser Al-Ghaithi', ar: 'حمزة ناصر الغيثي', gender: 'male', grade: 10 },
      { en: 'Noor Khalfan Al-Shaibani', ar: 'نور خلفان الشيباني', gender: 'female', grade: 5 }
    ];

    const students = [];
    for (let i = 0; i < studentNames.length; i++) {
      const student = studentNames[i];
      const { data, error } = await supabase
        .from('students')
        .insert({
          student_id: `STD${String(i + 1).padStart(6, '0')}`,
          first_name: student.en.split(' ')[0],
          last_name: student.en.split(' ').slice(1).join(' '),
          first_name_ar: student.ar.split(' ')[0],
          last_name_ar: student.ar.split(' ').slice(1).join(' '),
          gender: student.gender,
          date_of_birth: `201${3 - Math.floor(student.grade / 3)}-0${(i % 12) + 1}-15`,
          grade: `Grade ${student.grade}`,
          section: String.fromCharCode(65 + (i % 3)),
          parent_id: parentId,
          nfc_id: `NFC-STD-${String(i + 1).padStart(9, '0')}`,
          status: 'active'
        })
        .select()
        .single();

      if (error) console.error(`Error creating student ${i + 1}:`, error);
      else students.push(data);
    }

    console.log(`Created ${students.length} students`);

    // Step 3: Create wallet balances
    for (const student of students) {
      await supabase.from('student_wallets').insert({
        student_id: student.id,
        balance: 10 + Math.floor(Math.random() * 40),
        currency: 'OMR'
      });
    }

    // Step 4: Create Omani canteen categories
    const categories = [
      { name: 'Snacks & Chips', name_ar: 'وجبات خفيفة ورقائق', icon: '🥔', color: '#FFD700' },
      { name: 'Chocolates & Sweets', name_ar: 'شوكولاتة وحلويات', icon: '🍫', color: '#8B4513' },
      { name: 'Drinks', name_ar: 'مشروبات', icon: '🥤', color: '#4169E1' },
      { name: 'Healthy Options', name_ar: 'خيارات صحية', icon: '🥗', color: '#32CD32' },
      { name: 'Hot Meals', name_ar: 'وجبات ساخنة', icon: '🍽️', color: '#FF6347' }
    ];

    for (const cat of categories) {
      await supabase.from('canteen_categories').upsert({
        name: cat.name,
        name_ar: cat.name_ar,
        icon: cat.icon,
        color: cat.color,
        is_active: true
      }, { onConflict: 'name' });
    }

    // Step 5: Create 30+ Omani school canteen products
    const products = [
      // Snacks & Chips
      { name: 'Lays Classic Chips', name_ar: 'ليز شيبس كلاسيك', price: 0.35, category: 'Snacks & Chips', icon: '🥔' },
      { name: 'Pringles Original', name_ar: 'برينجلز أوريجينال', price: 0.50, category: 'Snacks & Chips', icon: '🥔' },
      { name: 'Cheetos Crunchy', name_ar: 'تشيتوس مقرمش', price: 0.30, category: 'Snacks & Chips', icon: '🧀' },
      { name: 'Doritos Nacho Cheese', name_ar: 'دوريتوس جبنة ناتشو', price: 0.40, category: 'Snacks & Chips', icon: '🧀' },
      { name: 'Kurkure Masala Munch', name_ar: 'كوركوري ماسالا مانش', price: 0.25, category: 'Snacks & Chips', icon: '🌶️' },
      { name: 'Oman Chips', name_ar: 'عمان شيبس', price: 0.20, category: 'Snacks & Chips', icon: '🇴🇲' },
      { name: 'Popcorn', name_ar: 'فشار', price: 0.30, category: 'Snacks & Chips', icon: '🍿' },
      
      // Chocolates & Sweets
      { name: 'KitKat 2-Finger', name_ar: 'كيت كات', price: 0.40, category: 'Chocolates & Sweets', icon: '🍫' },
      { name: 'Snickers Bar', name_ar: 'سنيكرز', price: 0.50, category: 'Chocolates & Sweets', icon: '🍫' },
      { name: 'Mars Bar', name_ar: 'مارس', price: 0.50, category: 'Chocolates & Sweets', icon: '🍫' },
      { name: 'Galaxy Chocolate', name_ar: 'جالاكسي', price: 0.60, category: 'Chocolates & Sweets', icon: '🍫' },
      { name: 'Cadbury Dairy Milk', name_ar: 'كادبوري ديري ميلك', price: 0.80, category: 'Chocolates & Sweets', icon: '🍫' },
      { name: 'Kinder Bueno', name_ar: 'كيندر بوينو', price: 0.70, category: 'Chocolates & Sweets', icon: '🍫' },
      { name: 'Bounty Bar', name_ar: 'باونتي', price: 0.50, category: 'Chocolates & Sweets', icon: '🥥' },
      { name: 'Twix', name_ar: 'تويكس', price: 0.45, category: 'Chocolates & Sweets', icon: '🍪' },
      
      // Drinks
      { name: 'Bottled Water 500ml', name_ar: 'مياه معبأة ٥٠٠مل', price: 0.20, category: 'Drinks', icon: '💧' },
      { name: 'Laban Al Marai', name_ar: 'لبن المراعي', price: 0.40, category: 'Drinks', icon: '🥛' },
      { name: 'Fresh Orange Juice', name_ar: 'عصير برتقال طازج', price: 0.60, category: 'Drinks', icon: '🍊' },
      { name: 'Coca-Cola 330ml', name_ar: 'كوكاكولا', price: 0.40, category: 'Drinks', icon: '🥤' },
      { name: 'Pepsi 330ml', name_ar: 'بيبسي', price: 0.40, category: 'Drinks', icon: '🥤' },
      { name: 'Sprite 330ml', name_ar: 'سبرايت', price: 0.40, category: 'Drinks', icon: '🥤' },
      { name: 'Fanta Orange', name_ar: 'فانتا برتقال', price: 0.40, category: 'Drinks', icon: '🍊' },
      { name: 'Vimto', name_ar: 'فيمتو', price: 0.45, category: 'Drinks', icon: '🍇' },
      { name: 'Al Rawabi Juice Box', name_ar: 'عصير الروابي', price: 0.50, category: 'Drinks', icon: '🧃' },
      { name: 'Smoothie Mixed Fruits', name_ar: 'سموذي فواكه مشكلة', price: 0.80, category: 'Drinks', icon: '🥤' },
      
      // Healthy Options
      { name: 'Fresh Apple', name_ar: 'تفاح طازج', price: 0.50, category: 'Healthy Options', icon: '🍎' },
      { name: 'Banana', name_ar: 'موز', price: 0.30, category: 'Healthy Options', icon: '🍌' },
      { name: 'Fruit Salad Cup', name_ar: 'كوب سلطة فواكه', price: 1.00, category: 'Healthy Options', icon: '🥗' },
      { name: 'Yogurt Danone', name_ar: 'زبادي دانون', price: 0.60, category: 'Healthy Options', icon: '🥛' },
      { name: 'Cheese Sandwich', name_ar: 'ساندويتش جبن', price: 1.20, category: 'Healthy Options', icon: '🥪' },
      { name: 'Veggie Wrap', name_ar: 'لفائف خضار', price: 1.50, category: 'Healthy Options', icon: '🌯' },
      { name: 'Dates Omani', name_ar: 'تمر عماني', price: 0.70, category: 'Healthy Options', icon: '🌴' },
      
      // Hot Meals
      { name: 'Chicken Shawarma', name_ar: 'شاورما دجاج', price: 1.80, category: 'Hot Meals', icon: '🌯' },
      { name: 'Falafel Wrap', name_ar: 'لفائف فلافل', price: 1.50, category: 'Hot Meals', icon: '🥙' },
      { name: 'Cheese Pizza Slice', name_ar: 'شريحة بيتزا جبن', price: 2.00, category: 'Hot Meals', icon: '🍕' },
      { name: 'Chicken Biryani Small', name_ar: 'برياني دجاج صغير', price: 2.50, category: 'Hot Meals', icon: '🍛' },
      { name: 'Pasta with Tomato Sauce', name_ar: 'باستا بصوص طماطم', price: 2.00, category: 'Hot Meals', icon: '🍝' },
      { name: 'Grilled Chicken Sandwich', name_ar: 'ساندويتش دجاج مشوي', price: 2.50, category: 'Hot Meals', icon: '🥪' }
    ];

    for (const product of products) {
      await supabase.from('canteen_items').insert({
        name: product.name,
        name_ar: product.name_ar,
        price: product.price,
        category: product.category,
        icon: product.icon,
        available: true,
        stock_quantity: 100
      });
    }

    console.log(`Created ${products.length} canteen products`);

    // Step 6: Create 3 Muscat bus routes
    const routes = [
      {
        route_name: 'Route A: Al Khuwair → School',
        route_name_ar: 'المسار أ: الخوير ← المدرسة',
        stops: [
          { name: 'Muscat Grand Mall', name_ar: 'مسقط جراند مول', lat: 23.5880, lng: 58.4059, time: '06:45' },
          { name: 'Al Khuwair Roundabout', name_ar: 'دوار الخوير', lat: 23.5917, lng: 58.4099, time: '06:50' },
          { name: 'Sultan Qaboos University', name_ar: 'جامعة السلطان قابوس', lat: 23.5925, lng: 58.1755, time: '06:55' },
          { name: 'Muscat City Centre', name_ar: 'مسقط سيتي سنتر', lat: 23.5958, lng: 58.3949, time: '07:00' },
          { name: 'Qurum Beach Park', name_ar: 'حديقة شاطئ القرم', lat: 23.6089, lng: 58.4745, time: '07:05' },
          { name: 'School Qurum', name_ar: 'المدرسة القرم', lat: 23.6145, lng: 58.4889, time: '07:10' }
        ],
        morning_schedule: { start_time: '06:45', end_time: '07:10' },
        afternoon_schedule: { start_time: '13:30', end_time: '14:00' }
      },
      {
        route_name: 'Route B: Ruwi → School',
        route_name_ar: 'المسار ب: روي ← المدرسة',
        stops: [
          { name: 'Ruwi Bus Station', name_ar: 'محطة روي للحافلات', lat: 23.5880, lng: 58.5431, time: '06:40' },
          { name: 'Central Business District', name_ar: 'منطقة الأعمال المركزية', lat: 23.5867, lng: 58.5420, time: '06:45' },
          { name: 'Muttrah Corniche', name_ar: 'كورنيش مطرح', lat: 23.6237, lng: 58.5651, time: '06:50' },
          { name: 'Al Wadi Kabir', name_ar: 'الوادي الكبير', lat: 23.5833, lng: 58.4667, time: '06:55' },
          { name: 'Bawshar', name_ar: 'بوشر', lat: 23.5667, lng: 58.4167, time: '07:00' },
          { name: 'School Qurum', name_ar: 'المدرسة القرم', lat: 23.6145, lng: 58.4889, time: '07:10' }
        ],
        morning_schedule: { start_time: '06:40', end_time: '07:10' },
        afternoon_schedule: { start_time: '13:30', end_time: '14:05' }
      },
      {
        route_name: 'Route C: Al Mawaleh → School',
        route_name_ar: 'المسار ج: المعبيلة ← المدرسة',
        stops: [
          { name: 'Al Mawaleh', name_ar: 'المعبيلة', lat: 23.6333, lng: 58.4000, time: '06:35' },
          { name: 'Seeb', name_ar: 'السيب', lat: 23.6709, lng: 58.1898, time: '06:45' },
          { name: 'Al Hail', name_ar: 'الحيل', lat: 23.5833, lng: 58.3167, time: '06:55' },
          { name: 'Al Azaiba', name_ar: 'العذيبة', lat: 23.6139, lng: 58.4428, time: '07:00' },
          { name: 'Ghubrah', name_ar: 'الغبرة', lat: 23.6167, lng: 58.4500, time: '07:05' },
          { name: 'School Qurum', name_ar: 'المدرسة القرم', lat: 23.6145, lng: 58.4889, time: '07:10' }
        ],
        morning_schedule: { start_time: '06:35', end_time: '07:10' },
        afternoon_schedule: { start_time: '13:30', end_time: '14:10' }
      }
    ];

    // Create buses first
    const buses = [];
    for (let i = 0; i < 3; i++) {
      const { data: bus } = await supabase.from('buses').insert({
        bus_number: `BUS-${String.fromCharCode(65 + i)}`,
        capacity: 35,
        model: 'Mercedes-Benz Sprinter',
        status: 'active'
      }).select().single();
      if (bus) buses.push(bus);
    }

    // Create routes
    for (let i = 0; i < routes.length; i++) {
      await supabase.from('bus_routes').insert({
        route_name: routes[i].route_name,
        route_name_ar: routes[i].route_name_ar,
        bus_id: buses[i]?.id,
        stops: routes[i].stops,
        morning_schedule: routes[i].morning_schedule,
        afternoon_schedule: routes[i].afternoon_schedule,
        is_active: true
      });

      // Create current bus location
      if (buses[i]) {
        await supabase.from('bus_locations').insert({
          bus_id: buses[i].id,
          latitude: routes[i].stops[2].lat,
          longitude: routes[i].stops[2].lng,
          current_stop: routes[i].stops[2].name,
          next_stop: routes[i].stops[3].name,
          eta_minutes: 5 + i,
          speed: 35,
          heading: 45
        });
      }
    }

    console.log('Created 3 Muscat bus routes with live GPS');

    // Step 7: Create canteen transactions
    const now = new Date();
    for (let day = 0; day < 7; day++) {
      for (const student of students.slice(0, 5)) {
        const transactionDate = new Date(now);
        transactionDate.setDate(transactionDate.getDate() - day);
        
        const items = products.slice(Math.floor(Math.random() * 5), Math.floor(Math.random() * 5) + 3);
        const total = items.reduce((sum, item) => sum + item.price, 0);

        await supabase.from('canteen_orders').insert({
          student_id: student.id,
          items: items.map(i => ({ name: i.name, price: i.price, quantity: 1 })),
          total_amount: total,
          payment_method: 'wallet',
          created_at: transactionDate.toISOString()
        });
      }
    }

    console.log('Created 50+ canteen transactions');

    // Step 8: Create attendance records (30 days)
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
      
      for (const student of students) {
        const isPresent = Math.random() > 0.1;
        await supabase.from('attendance_records').insert({
          student_id: student.id,
          date: date.toISOString().split('T')[0],
          time: '07:30:00',
          status: isPresent ? 'present' : 'absent',
          type: 'school_entrance',
          method: 'nfc'
        });
      }
    }

    console.log('Created 30 days of attendance records');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mock data created successfully',
        summary: {
          students: students.length,
          products: products.length,
          routes: routes.length,
          transactions: '50+',
          attendance: '30 days'
        }
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
