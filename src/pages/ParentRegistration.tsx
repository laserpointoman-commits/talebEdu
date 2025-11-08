import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Language = "en" | "ar" | null;

export default function ParentRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(null);
  const [validating, setValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [parentInfo, setParentInfo] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    firstNameAr: "",
    lastNameAr: "",
    dateOfBirth: "",
    gender: "",
    grade: "",
    class: "",
    nationality: "",
    bloodType: "",
    address: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalConditions: "",
    allergies: "",
    nfcId: "",
    transportationAgreement: false,
    profileImage: "",
  });

  useEffect(() => {
    if (!token) {
      toast({
        title: selectedLanguage === "ar" ? "رابط غير صالح" : "Invalid Link",
        description: selectedLanguage === "ar" ? "لم يتم العثور على رمز التسجيل في الرابط." : "No registration token found in the URL.",
        variant: "destructive",
      });
      setValidating(false);
      return;
    }

    if (selectedLanguage) {
      validateToken();
    }
  }, [token, selectedLanguage]);

  const validateToken = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-registration-token", {
        body: { token },
      });

      if (error) throw error;

      if (data.valid) {
        setTokenValid(true);
        setParentInfo(data.parentInfo);
        setFormData(prev => ({
          ...prev,
          parentName: data.parentInfo.full_name || "",
          parentEmail: data.parentInfo.email || "",
          parentPhone: data.parentInfo.phone || "",
        }));
      } else {
        toast({
          title: selectedLanguage === "ar" ? "رمز غير صالح" : "Invalid Token",
          description: data.error || (selectedLanguage === "ar" ? "هذا الرابط غير صالح أو منتهي الصلاحية." : "This registration link is invalid or has expired."),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Token validation error:", error);
      toast({
        title: selectedLanguage === "ar" ? "خطأ في التحقق" : "Validation Error",
        description: selectedLanguage === "ar" ? "فشل التحقق من رمز التسجيل." : "Failed to validate registration token.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender || !formData.grade) {
      toast({
        title: selectedLanguage === "ar" ? "معلومات ناقصة" : "Missing Information",
        description: selectedLanguage === "ar" ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("parent-register-student", {
        body: {
          token,
          studentData: formData,
        },
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(true);
        toast({
          title: selectedLanguage === "ar" ? "تم التسجيل بنجاح!" : "Registration Successful!",
          description: selectedLanguage === "ar" ? "تم تسجيل طفلك بنجاح." : "Your child has been registered successfully.",
        });
        
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: selectedLanguage === "ar" ? "فشل التسجيل" : "Registration Failed",
        description: error.message || (selectedLanguage === "ar" ? "فشل تسجيل الطالب. يرجى المحاولة مرة أخرى." : "Failed to register student. Please try again."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Language Selection Screen
  if (!selectedLanguage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Globe className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">Select Language / اختر اللغة</CardTitle>
            <CardDescription className="text-center">
              Please select your preferred language<br />
              يرجى اختيار اللغة المفضلة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                onClick={() => setSelectedLanguage("en")}
                className="h-24 text-lg font-semibold"
              >
                English
              </Button>
              <Button
                size="lg"
                onClick={() => setSelectedLanguage("ar")}
                className="h-24 text-lg font-semibold"
              >
                العربية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10" dir={selectedLanguage === "ar" ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {selectedLanguage === "ar" ? "جاري التحقق من رابط التسجيل..." : "Validating registration link..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4" dir={selectedLanguage === "ar" ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-center">
              {selectedLanguage === "ar" ? "رابط تسجيل غير صالح" : "Invalid Registration Link"}
            </CardTitle>
            <CardDescription className="text-center">
              {selectedLanguage === "ar" 
                ? "هذا الرابط غير صالح أو منتهي الصلاحية أو تم استخدامه بالفعل."
                : "This registration link is invalid, has expired, or has already been used."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <p>
                {selectedLanguage === "ar"
                  ? "إذا كنت بحاجة إلى رابط تسجيل جديد، يرجى الاتصال بإدارة المدرسة."
                  : "If you need a new registration link, please contact the school administration."}
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full">
                {selectedLanguage === "ar" ? "الذهاب لتسجيل الدخول" : "Go to Login"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4" dir={selectedLanguage === "ar" ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center">
              {selectedLanguage === "ar" ? "تم التسجيل بنجاح!" : "Registration Successful!"}
            </CardTitle>
            <CardDescription className="text-center">
              {selectedLanguage === "ar"
                ? "تم تسجيل طفلك بنجاح. جاري التحويل لصفحة تسجيل الدخول..."
                : "Your child has been registered successfully. Redirecting to login..."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const t = {
    title: selectedLanguage === "ar" ? "تسجيل الطالب" : "Student Registration",
    welcome: selectedLanguage === "ar" ? `مرحباً، ${parentInfo?.full_name}! يرجى ملء معلومات طفلك أدناه.` : `Welcome, ${parentInfo?.full_name}! Please fill in your child's information below.`,
    tabs: {
      basic: selectedLanguage === "ar" ? "المعلومات الأساسية" : "Basic Info",
      academic: selectedLanguage === "ar" ? "الأكاديمية" : "Academic",
      contact: selectedLanguage === "ar" ? "الاتصال" : "Contact",
      medical: selectedLanguage === "ar" ? "الطبية" : "Medical",
    },
    labels: {
      firstName: selectedLanguage === "ar" ? "الاسم الأول (انجليزي) *" : "First Name (English) *",
      lastName: selectedLanguage === "ar" ? "اسم العائلة (انجليزي) *" : "Last Name (English) *",
      firstNameAr: selectedLanguage === "ar" ? "الاسم الأول (عربي)" : "First Name (Arabic)",
      lastNameAr: selectedLanguage === "ar" ? "اسم العائلة (عربي)" : "Last Name (Arabic)",
      enterInEnglish: selectedLanguage === "ar" ? "الرجاء الإدخال بالإنجليزية" : "Please enter in English",
      enterInArabic: selectedLanguage === "ar" ? "الرجاء الإدخال بالعربية" : "Please enter in Arabic",
      dateOfBirth: selectedLanguage === "ar" ? "تاريخ الميلاد *" : "Date of Birth *",
      gender: selectedLanguage === "ar" ? "الجنس *" : "Gender *",
      male: selectedLanguage === "ar" ? "ذكر" : "Male",
      female: selectedLanguage === "ar" ? "أنثى" : "Female",
      nationality: selectedLanguage === "ar" ? "الجنسية" : "Nationality",
      bloodType: selectedLanguage === "ar" ? "فصيلة الدم" : "Blood Type",
      grade: selectedLanguage === "ar" ? "الصف *" : "Grade *",
      class: selectedLanguage === "ar" ? "الفصل" : "Class",
      nfcId: selectedLanguage === "ar" ? "رقم NFC (إن وجد)" : "NFC ID (if available)",
      address: selectedLanguage === "ar" ? "العنوان" : "Address",
      phone: selectedLanguage === "ar" ? "هاتف الطالب" : "Student Phone",
      emergencyContact: selectedLanguage === "ar" ? "اسم جهة الاتصال الطارئة" : "Emergency Contact Name",
      emergencyPhone: selectedLanguage === "ar" ? "هاتف الطوارئ" : "Emergency Phone",
      medicalConditions: selectedLanguage === "ar" ? "الحالات الطبية" : "Medical Conditions",
      allergies: selectedLanguage === "ar" ? "الحساسية" : "Allergies",
    },
    buttons: {
      cancel: selectedLanguage === "ar" ? "إلغاء" : "Cancel",
      register: selectedLanguage === "ar" ? "تسجيل الطالب" : "Register Student",
      registering: selectedLanguage === "ar" ? "جاري التسجيل..." : "Registering...",
    },
    placeholders: {
      selectGender: selectedLanguage === "ar" ? "اختر الجنس" : "Select gender",
      selectBlood: selectedLanguage === "ar" ? "اختر فصيلة الدم" : "Select blood type",
      selectGrade: selectedLanguage === "ar" ? "اختر الصف" : "Select grade",
      selectClass: selectedLanguage === "ar" ? "اختر الفصل" : "Select class",
      medical: selectedLanguage === "ar" ? "أي حالات طبية يجب أن نكون على علم بها" : "Any medical conditions we should be aware of",
      allergies: selectedLanguage === "ar" ? "أي حساسية معروفة" : "Any known allergies",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4" dir={selectedLanguage === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto py-8">
        <Card className={selectedLanguage === "ar" ? "rtl" : ""}>
          <CardHeader className={selectedLanguage === "ar" ? "text-right" : "text-left"}>
            <CardTitle className="text-2xl">{t.title}</CardTitle>
            <CardDescription>{t.welcome}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={selectedLanguage === "ar" ? "text-right" : "text-left"}>
              <Tabs defaultValue="basic" className="w-full">
              <TabsList 
                className={`grid w-full grid-cols-4 ${selectedLanguage === "ar" ? "flex-row-reverse" : ""}`}
                dir={selectedLanguage === "ar" ? "rtl" : "ltr"}
              >
                  <TabsTrigger value="basic">{t.tabs.basic}</TabsTrigger>
                  <TabsTrigger value="academic">{t.tabs.academic}</TabsTrigger>
                  <TabsTrigger value="contact">{t.tabs.contact}</TabsTrigger>
                  <TabsTrigger value="medical">{t.tabs.medical}</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={formData.profileImage} />
                        <AvatarFallback>
                          {formData.firstName?.[0]}{formData.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 ${selectedLanguage === "ar" ? "direction-rtl" : ""}`}>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="firstName" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.firstName}</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        className={selectedLanguage === "ar" ? "text-right" : ""}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t.labels.enterInEnglish}</p>
                    </div>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="lastName" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.lastName}</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        className={selectedLanguage === "ar" ? "text-right" : ""}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t.labels.enterInEnglish}</p>
                    </div>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="firstNameAr" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.firstNameAr}</Label>
                      <Input
                        id="firstNameAr"
                        value={formData.firstNameAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstNameAr: e.target.value }))}
                        dir="rtl"
                        className="text-right"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t.labels.enterInArabic}</p>
                    </div>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="lastNameAr" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.lastNameAr}</Label>
                      <Input
                        id="lastNameAr"
                        value={formData.lastNameAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastNameAr: e.target.value }))}
                        dir="rtl"
                        className="text-right"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t.labels.enterInArabic}</p>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 ${selectedLanguage === "ar" ? "direction-rtl" : ""}`}>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="dateOfBirth" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.dateOfBirth}</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        required
                        className={selectedLanguage === "ar" ? "text-right" : ""}
                      />
                    </div>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="gender" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.gender}</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                        <SelectTrigger className={selectedLanguage === "ar" ? "text-right" : ""}>
                          <SelectValue placeholder={t.placeholders.selectGender} />
                        </SelectTrigger>
                        <SelectContent className={selectedLanguage === "ar" ? "text-right" : ""}>
                          <SelectItem value="male">{t.labels.male}</SelectItem>
                          <SelectItem value="female">{t.labels.female}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-4 ${selectedLanguage === "ar" ? "direction-rtl" : ""}`}>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="nationality" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.nationality}</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                        className={selectedLanguage === "ar" ? "text-right" : ""}
                      />
                    </div>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="bloodType" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.bloodType}</Label>
                      <Select value={formData.bloodType} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))}>
                        <SelectTrigger className={selectedLanguage === "ar" ? "text-right" : ""}>
                          <SelectValue placeholder={t.placeholders.selectBlood} />
                        </SelectTrigger>
                        <SelectContent className={selectedLanguage === "ar" ? "text-right" : ""}>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="academic" className="space-y-4 mt-4">
                  <div className={`grid grid-cols-2 gap-4 ${selectedLanguage === "ar" ? "direction-rtl" : ""}`}>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="grade" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.grade}</Label>
                      <Select value={formData.grade} onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))} required>
                        <SelectTrigger className={selectedLanguage === "ar" ? "text-right" : ""}>
                          <SelectValue placeholder={t.placeholders.selectGrade} />
                        </SelectTrigger>
                        <SelectContent className={selectedLanguage === "ar" ? "text-right" : ""}>
                          <SelectItem value="Grade 1">{selectedLanguage === "ar" ? "الصف الأول" : "Grade 1"}</SelectItem>
                          <SelectItem value="Grade 2">{selectedLanguage === "ar" ? "الصف الثاني" : "Grade 2"}</SelectItem>
                          <SelectItem value="Grade 3">{selectedLanguage === "ar" ? "الصف الثالث" : "Grade 3"}</SelectItem>
                          <SelectItem value="Grade 4">{selectedLanguage === "ar" ? "الصف الرابع" : "Grade 4"}</SelectItem>
                          <SelectItem value="Grade 5">{selectedLanguage === "ar" ? "الصف الخامس" : "Grade 5"}</SelectItem>
                          <SelectItem value="Grade 6">{selectedLanguage === "ar" ? "الصف السادس" : "Grade 6"}</SelectItem>
                          <SelectItem value="Grade 7">{selectedLanguage === "ar" ? "الصف السابع" : "Grade 7"}</SelectItem>
                          <SelectItem value="Grade 8">{selectedLanguage === "ar" ? "الصف الثامن" : "Grade 8"}</SelectItem>
                          <SelectItem value="Grade 9">{selectedLanguage === "ar" ? "الصف التاسع" : "Grade 9"}</SelectItem>
                          <SelectItem value="Grade 10">{selectedLanguage === "ar" ? "الصف العاشر" : "Grade 10"}</SelectItem>
                          <SelectItem value="Grade 11">{selectedLanguage === "ar" ? "الصف الحادي عشر" : "Grade 11"}</SelectItem>
                          <SelectItem value="Grade 12">{selectedLanguage === "ar" ? "الصف الثاني عشر" : "Grade 12"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="class" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.class}</Label>
                      <Select value={formData.class} onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}>
                        <SelectTrigger className={selectedLanguage === "ar" ? "text-right" : ""}>
                          <SelectValue placeholder={t.placeholders.selectClass} />
                        </SelectTrigger>
                        <SelectContent className={selectedLanguage === "ar" ? "text-right" : ""}>
                          <SelectItem value="A">{selectedLanguage === "ar" ? "أ" : "A"}</SelectItem>
                          <SelectItem value="B">{selectedLanguage === "ar" ? "ب" : "B"}</SelectItem>
                          <SelectItem value="C">{selectedLanguage === "ar" ? "ج" : "C"}</SelectItem>
                          <SelectItem value="D">{selectedLanguage === "ar" ? "د" : "D"}</SelectItem>
                          <SelectItem value="E">{selectedLanguage === "ar" ? "ه" : "E"}</SelectItem>
                          <SelectItem value="F">{selectedLanguage === "ar" ? "و" : "F"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                    <Label htmlFor="address" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.address}</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className={selectedLanguage === "ar" ? "text-right" : ""}
                    />
                  </div>

                  <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                    <Label htmlFor="phone" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.phone}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={selectedLanguage === "ar" ? "text-right" : ""}
                    />
                  </div>

                  <div className={`grid grid-cols-2 gap-4 ${selectedLanguage === "ar" ? "direction-rtl" : ""}`}>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="emergencyContact" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.emergencyContact}</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        className={selectedLanguage === "ar" ? "text-right" : ""}
                      />
                    </div>
                    <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                      <Label htmlFor="emergencyPhone" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.emergencyPhone}</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                        className={selectedLanguage === "ar" ? "text-right" : ""}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4 mt-4">
                  <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                    <Label htmlFor="medicalConditions" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.medicalConditions}</Label>
                    <Textarea
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => setFormData(prev => ({ ...prev, medicalConditions: e.target.value }))}
                      placeholder={t.placeholders.medical}
                      rows={3}
                      className={selectedLanguage === "ar" ? "text-right" : ""}
                    />
                  </div>

                  <div className={selectedLanguage === "ar" ? "text-right" : ""}>
                    <Label htmlFor="allergies" className={selectedLanguage === "ar" ? "text-right block" : ""}>{t.labels.allergies}</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                      placeholder={t.placeholders.allergies}
                      rows={3}
                      className={selectedLanguage === "ar" ? "text-right" : ""}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className={`flex gap-4 mt-6 ${selectedLanguage === "ar" ? "flex-row-reverse" : ""}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="flex-1"
                  disabled={submitting}
                >
                  {t.buttons.cancel}
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className={selectedLanguage === "ar" ? "ml-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"} />
                      {t.buttons.registering}
                    </>
                  ) : (
                    t.buttons.register
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
