import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const screenshots = [
  {
    name: "login",
    prompt: `Create a mobile app login screen in landscape orientation (1400x900px):
- Clean modern UI with gradient blue header (#3B82F6 to #2DD4BF)
- Large blue gradient "t" logo at top (using the gradient colors)
- Email and password input fields with icons
- Blue gradient login button
- Language switcher showing "EN | العربية" at top right
- "Forgot Password?" link in blue
- White background with subtle shadows
- Professional, clean design similar to modern iOS apps
- Add 4 numbered blue circle callouts: #1 on logo, #2 on email field, #3 on language switcher, #4 on login button`,
    width: 1400,
    height: 900
  },
  {
    name: "parent-dashboard",
    prompt: `Create a parent dashboard screen in landscape (1400x900px):
- Header with profile photo, name "Sarah Ahmed", wallet balance "250.50 SAR" in large text
- 3 student cards in a row showing:
  Card 1: Photo, "Ahmed Mohammed", "Grade 5-A", green checkmark "Present"
  Card 2: Photo, "Fatima Ali", "Grade 3-B", green checkmark "Present"
  Card 3: Photo, "Omar Hassan", "Grade 7-C", red X "Absent"
- Grid of 8 quick action buttons with icons: Track Bus, Wallet, Canteen, Grades, Attendance, Notifications, Messages, Settings
- Recent activity feed on right showing 5 items with icons and timestamps
- Blue gradient theme (#3B82F6 to #2DD4BF)
- Add 4 numbered blue circle callouts: #1 on wallet, #2 on student cards, #3 on quick actions, #4 on activity feed`,
    width: 1400,
    height: 900
  },
  {
    name: "bus-tracking",
    prompt: `Create a bus tracking map screen in wide landscape (1400x900px):
- Full Google Maps style interactive map showing a city
- Blue route line connecting school building to 8 numbered stop markers
- Blue bus icon with "#12" label at current location on route
- Green home icon marker showing student's home
- Blue pickup point icon
- Bottom card overlay showing: "Bus #12", "Arrives in 5 minutes", "Next stop: Al-Noor Street", "Ahmed - On board ✓" with driver photo
- Map controls in corner
- Modern, clean UI with shadows
- Add 5 numbered blue circle callouts: #1 on bus location, #2 on route line, #3 on home marker, #4 on ETA card, #5 on student status`,
    width: 1400,
    height: 900
  },
  {
    name: "wallet-overview",
    prompt: `Create a digital wallet screen in landscape (1200x900px):
- Large balance display at top: "250.50 SAR" in big blue gradient text
- Prominent blue gradient "Top Up" button
- Recent transactions list showing 5 items:
  1. "🍽️ Canteen purchase" -15 SAR, "Today 12:30"
  2. "💵 Top-up" +100 SAR, "Yesterday"
  3. "🏪 Store purchase" -25 SAR, "2 days ago"
  4. "📚 Book fee" -50 SAR, "3 days ago"
  5. "💵 Monthly allowance" +200 SAR, "5 days ago"
- Colorful pie chart on right showing spending breakdown
- Yellow alert box: "Low balance alert" at bottom
- Clean modern design with blue gradient accents
- Add 5 numbered blue circle callouts: #1 on balance, #2 on top-up, #3 on transactions, #4 on pie chart, #5 on alert`,
    width: 1200,
    height: 900
  },
  {
    name: "canteen-menu",
    prompt: `Create a canteen menu ordering screen in wide landscape (1400x900px):
- Category tabs at top: "All", "Meals", "Snacks", "Drinks", "Desserts" (Meals selected)
- 2x4 grid of food items with photos, each showing:
  - Food photo (sandwich, pizza, pasta, salad, burger, wrap, rice bowl, soup)
  - Name and price in SAR
  - Calories count
  - Dietary badge (Halal/Vegan)
  - Blue "+" button to add
- Search bar at top
- Cart icon with "3" badge at top right
- Wallet balance "250 SAR" displayed prominently
- Modern food delivery app style
- Add 4 numbered blue circle callouts: #1 on categories, #2 on food items, #3 on cart icon, #4 on balance`,
    width: 1400,
    height: 900
  },
  {
    name: "grades-dashboard",
    prompt: `Create an academic grades dashboard in wide landscape (1400x900px):
- 3x2 grid of subject cards showing:
  Mathematics: "A (95%)" with upward arrow "+5%", "Class avg: 82%"
  Science: "B+ (88%)" with horizontal arrow, "Class avg: 80%"
  English: "A- (90%)" with down arrow "-2%", "Class avg: 85%"
  History, Physics, Arabic (similar format)
- Large "Overall GPA: 3.8/4.0" at top
- Line graph showing performance trend over semester
- "Class rank: 5/30" badge
- Blue gradient download report button
- Modern academic app design with blue accents
- Add 4 numbered blue circle callouts: #1 on subject cards, #2 on GPA, #3 on performance chart, #4 on rank`,
    width: 1400,
    height: 900
  },
  {
    name: "admin-dashboard",
    prompt: `Create an admin overview dashboard in wide landscape (1400x900px):
- 4 KPI cards across top row:
  "Total Students: 1,247" with green "+5%"
  "Active Parents: 892"
  "Staff Members: 87"
  "Pending Approvals: 12" with red badge
- 3 charts below:
  Left: Line chart "Attendance Trend" (30 days)
  Center: Bar chart "Revenue Overview" (6 months)
  Right: Pie chart "Student Distribution by Grade"
- Grid of 8 quick action buttons: Add User, Approve Students, Send Notification, Generate Report, etc.
- Modern admin dashboard with blue gradient theme
- Professional corporate style
- Add 4 numbered blue circle callouts: #1 on KPIs, #2 on charts, #3 on quick actions, #4 on pending badge`,
    width: 1400,
    height: 900
  },
  {
    name: "attendance-calendar",
    prompt: `Create an attendance calendar screen in landscape (1400x900px):
- Full month calendar view (January 2025)
- Days color-coded: Green (present), Red (absent), Yellow (late), Gray (weekend)
- Statistics box showing: "85% Present", "5% Absent", "10% Late" with icons
- Student selector dropdown at top
- Color legend showing what each color means
- Export button
- Modern calendar app design
- Clean, professional layout
- Add 4 numbered blue circle callouts: #1 on calendar, #2 on statistics, #3 on legend, #4 on export button`,
    width: 1400,
    height: 900
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { screenshotName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const screenshot = screenshots.find(s => s.name === screenshotName);
    if (!screenshot) {
      return new Response(
        JSON.stringify({ error: "Screenshot not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log(`Generating screenshot: ${screenshot.name}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: screenshot.prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    return new Response(
      JSON.stringify({ imageUrl, name: screenshot.name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
