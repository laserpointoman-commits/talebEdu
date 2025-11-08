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
      firstName: selectedLanguage === "ar" ? "الاسم الأول *" : "First Name *",
      lastName: selectedLanguage === "ar" ? "اسم العائلة *" : "Last Name *",
      firstNameAr: selectedLanguage === "ar" ? "الاسم الأول (عربي)" : "First Name (Arabic)",
      lastNameAr: selectedLanguage === "ar" ? "اسم العائلة (عربي)" : "Last Name (Arabic)",
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
      grade: selectedLanguage === "ar" ? "مثال: الصف الخامس" : "e.g., Grade 5",
      class: selectedLanguage === "ar" ? "مثال: 5أ" : "e.g., 5A",
      medical: selectedLanguage === "ar" ? "أي حالات طبية يجب أن نكون على علم بها" : "Any medical conditions we should be aware of",
      allergies: selectedLanguage === "ar" ? "أي حساسية معروفة" : "Any known allergies",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4" dir={selectedLanguage === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t.title}</CardTitle>
            <CardDescription>{t.welcome}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t.labels.firstName}</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t.labels.lastName}</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstNameAr">{t.labels.firstNameAr}</Label>
                      <Input
                        id="firstNameAr"
                        value={formData.firstNameAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstNameAr: e.target.value }))}
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastNameAr">{t.labels.lastNameAr}</Label>
                      <Input
                        id="lastNameAr"
                        value={formData.lastNameAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastNameAr: e.target.value }))}
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">{t.labels.dateOfBirth}</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">{t.labels.gender}</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.placeholders.selectGender} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{t.labels.male}</SelectItem>
                          <SelectItem value="female">{t.labels.female}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nationality">{t.labels.nationality}</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bloodType">{t.labels.bloodType}</Label>
                      <Select value={formData.bloodType} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.placeholders.selectBlood} />
                        </SelectTrigger>
                        <SelectContent>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="grade">{t.labels.grade}</Label>
                      <Input
                        id="grade"
                        value={formData.grade}
                        onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                        placeholder={t.placeholders.grade}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="class">{t.labels.class}</Label>
                      <Input
                        id="class"
                        value={formData.class}
                        onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                        placeholder={t.placeholders.class}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nfcId">{t.labels.nfcId}</Label>
                    <Input
                      id="nfcId"
                      value={formData.nfcId}
                      onChange={(e) => setFormData(prev => ({ ...prev, nfcId: e.target.value }))}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="address">{t.labels.address}</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">{t.labels.phone}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">{t.labels.emergencyContact}</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">{t.labels.emergencyPhone}</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="medicalConditions">{t.labels.medicalConditions}</Label>
                    <Textarea
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => setFormData(prev => ({ ...prev, medicalConditions: e.target.value }))}
                      placeholder={t.placeholders.medical}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">{t.labels.allergies}</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                      placeholder={t.placeholders.allergies}
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4 mt-6">
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
