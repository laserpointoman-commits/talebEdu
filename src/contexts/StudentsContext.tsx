import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  firstNameAr: string;
  lastNameAr: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  civilId: string;
  grade: string;
  class: string;
  classId?: string;
  className?: string;
  academicYear: string;
  enrollmentDate: string;
  previousSchool?: string;
  email: string;
  phone: string;
  address: string;
  parentName: string;
  parentNameAr: string;
  parentPhone: string;
  parentEmail: string;
  parentOccupation?: string;
  relationship: string;
  bloodGroup: string;
  allergies?: string;
  medicalConditions?: string;
  medications?: string;
  emergencyContact: string;
  emergencyContactName: string;
  transportationAgreement: boolean;
  profileImage?: string;
  nfcId?: string;
  barcode?: string;
  status?: 'active' | 'inactive';
  // Home location fields
  homeLatitude?: number;
  homeLongitude?: number;
  homeArea?: string;
  homeAreaAr?: string;
}

interface StudentsContextType {
  students: Student[];
  loading: boolean;
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudent: (id: string) => Student | undefined;
  getStudentByNfc: (nfcId: string) => Promise<Student | null>;
  searchStudents: (query: string) => Student[];
  fetchStudents: () => Promise<void>;
}

// Reduced initial mock data to prevent localStorage quota issues
const initialStudents: Student[] = [];

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Load students from database on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes:class_id (
            id,
            name,
            grade,
            section
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedStudents: Student[] = data.map(student => ({
          id: student.id,
          firstName: student.first_name || '',
          lastName: student.last_name || '',
          firstNameAr: student.first_name_ar || '',
          lastNameAr: student.last_name_ar || '',
          dateOfBirth: student.date_of_birth || '',
          gender: student.gender || '',
          nationality: student.nationality || '',
          civilId: student.civil_id || '',
          grade: student.grade || '',
          class: (student as any).classes?.name || student.class || '',
          classId: (student as any).class_id || undefined,
          className: (student as any).classes?.name || undefined,
          academicYear: student.academic_year || '',
          enrollmentDate: student.enrollment_date || '',
          previousSchool: student.previous_school,
          email: student.email || '',
          phone: student.phone || '',
          address: student.address || '',
          parentName: student.parent_name || '',
          parentNameAr: student.parent_name_ar || '',
          parentPhone: student.parent_phone || '',
          parentEmail: student.parent_email || '',
          parentOccupation: student.parent_occupation,
          relationship: student.relationship || '',
          bloodGroup: student.blood_group || '',
          allergies: student.allergies,
          medicalConditions: student.medical_conditions,
          medications: student.medications,
          emergencyContact: student.emergency_contact || '',
          emergencyContactName: student.emergency_contact_name || '',
          transportationAgreement: student.transportation_agreement || false,
          profileImage: student.profile_image,
          nfcId: student.nfc_id,
          barcode: student.barcode,
          status: (student.status as 'active' | 'inactive') || 'active',
          homeLatitude: (student as any).home_latitude,
          homeLongitude: (student as any).home_longitude,
          homeArea: (student as any).home_area,
          homeAreaAr: (student as any).home_area_ar,
        }));
        setStudents(mappedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      const studentId = `STU${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from('students')
        .insert({
          student_id: studentId,
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          first_name_ar: studentData.firstNameAr,
          last_name_ar: studentData.lastNameAr,
          date_of_birth: studentData.dateOfBirth,
          gender: studentData.gender,
          nationality: studentData.nationality,
          civil_id: studentData.civilId,
          grade: studentData.grade,
          class: studentData.class,
          academic_year: studentData.academicYear,
          enrollment_date: studentData.enrollmentDate,
          previous_school: studentData.previousSchool,
          email: studentData.email,
          phone: studentData.phone,
          address: studentData.address,
          parent_name: studentData.parentName,
          parent_name_ar: studentData.parentNameAr,
          parent_phone: studentData.parentPhone,
          parent_email: studentData.parentEmail,
          parent_occupation: studentData.parentOccupation,
          relationship: studentData.relationship,
          blood_group: studentData.bloodGroup,
          allergies: studentData.allergies,
          medical_conditions: studentData.medicalConditions,
          medications: studentData.medications,
          emergency_contact: studentData.emergencyContact,
          emergency_contact_name: studentData.emergencyContactName,
          transportation_agreement: studentData.transportationAgreement,
          nfc_id: studentData.nfcId || `NFC${Date.now().toString().slice(-6)}`,
          barcode: studentData.barcode || `BAR${Date.now().toString().slice(-6)}`,
          status: 'active',
          profile_image: studentData.profileImage
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await fetchStudents(); // Refresh the list
        
        toast({
          title: 'Student Added',
          description: `${studentData.firstName} ${studentData.lastName} has been registered successfully`,
        });
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive',
      });
    }
  };

  const updateStudent = async (id: string, updatedData: Partial<Student>) => {
    try {
      const updatePayload: any = {};
      
      if (updatedData.firstName !== undefined) updatePayload.first_name = updatedData.firstName;
      if (updatedData.lastName !== undefined) updatePayload.last_name = updatedData.lastName;
      if (updatedData.firstNameAr !== undefined) updatePayload.first_name_ar = updatedData.firstNameAr;
      if (updatedData.lastNameAr !== undefined) updatePayload.last_name_ar = updatedData.lastNameAr;
      if (updatedData.dateOfBirth !== undefined) updatePayload.date_of_birth = updatedData.dateOfBirth;
      if (updatedData.gender !== undefined) updatePayload.gender = updatedData.gender;
      if (updatedData.nationality !== undefined) updatePayload.nationality = updatedData.nationality;
      if (updatedData.civilId !== undefined) updatePayload.civil_id = updatedData.civilId;
      if (updatedData.grade !== undefined) updatePayload.grade = updatedData.grade;
      if (updatedData.class !== undefined) updatePayload.class = updatedData.class;
      if (updatedData.academicYear !== undefined) updatePayload.academic_year = updatedData.academicYear;
      if (updatedData.enrollmentDate !== undefined) updatePayload.enrollment_date = updatedData.enrollmentDate;
      if (updatedData.previousSchool !== undefined) updatePayload.previous_school = updatedData.previousSchool;
      if (updatedData.email !== undefined) updatePayload.email = updatedData.email;
      if (updatedData.phone !== undefined) updatePayload.phone = updatedData.phone;
      if (updatedData.address !== undefined) updatePayload.address = updatedData.address;
      if (updatedData.parentName !== undefined) updatePayload.parent_name = updatedData.parentName;
      if (updatedData.parentNameAr !== undefined) updatePayload.parent_name_ar = updatedData.parentNameAr;
      if (updatedData.parentPhone !== undefined) updatePayload.parent_phone = updatedData.parentPhone;
      if (updatedData.parentEmail !== undefined) updatePayload.parent_email = updatedData.parentEmail;
      if (updatedData.parentOccupation !== undefined) updatePayload.parent_occupation = updatedData.parentOccupation;
      if (updatedData.relationship !== undefined) updatePayload.relationship = updatedData.relationship;
      if (updatedData.bloodGroup !== undefined) updatePayload.blood_group = updatedData.bloodGroup;
      if (updatedData.allergies !== undefined) updatePayload.allergies = updatedData.allergies;
      if (updatedData.medicalConditions !== undefined) updatePayload.medical_conditions = updatedData.medicalConditions;
      if (updatedData.medications !== undefined) updatePayload.medications = updatedData.medications;
      if (updatedData.emergencyContact !== undefined) updatePayload.emergency_contact = updatedData.emergencyContact;
      if (updatedData.emergencyContactName !== undefined) updatePayload.emergency_contact_name = updatedData.emergencyContactName;
      if (updatedData.transportationAgreement !== undefined) updatePayload.transportation_agreement = updatedData.transportationAgreement;
      if (updatedData.nfcId !== undefined) updatePayload.nfc_id = updatedData.nfcId;
      if (updatedData.barcode !== undefined) updatePayload.barcode = updatedData.barcode;
      if (updatedData.status !== undefined) updatePayload.status = updatedData.status;
      if (updatedData.profileImage !== undefined) updatePayload.profile_image = updatedData.profileImage;

      const { error } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      await fetchStudents(); // Refresh the list
      
      toast({
        title: 'Student Updated',
        description: 'Student information has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student',
        variant: 'destructive',
      });
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const student = students.find(s => s.id === id);
      
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchStudents(); // Refresh the list
      
      if (student) {
        toast({
          title: 'Student Removed',
          description: `${student.firstName} ${student.lastName} has been removed`,
        });
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        variant: 'destructive',
      });
    }
  };

  const getStudent = (id: string) => {
    return students.find(student => student.id === id);
  };

  const getStudentByNfc = async (nfcId: string): Promise<Student | null> => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('nfc_id', nfcId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        firstNameAr: data.first_name_ar || '',
        lastNameAr: data.last_name_ar || '',
        dateOfBirth: data.date_of_birth || '',
        gender: data.gender || '',
        nationality: data.nationality || '',
        civilId: data.civil_id || '',
        grade: data.grade || '',
        class: data.class || '',
        academicYear: data.academic_year || '',
        enrollmentDate: data.enrollment_date || '',
        previousSchool: data.previous_school,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        parentName: data.parent_name || '',
        parentNameAr: data.parent_name_ar || '',
        parentPhone: data.parent_phone || '',
        parentEmail: data.parent_email || '',
        parentOccupation: data.parent_occupation,
        relationship: data.relationship || '',
        bloodGroup: data.blood_group || '',
        allergies: data.allergies,
        medicalConditions: data.medical_conditions,
        medications: data.medications,
        emergencyContact: data.emergency_contact || '',
        emergencyContactName: data.emergency_contact_name || '',
        transportationAgreement: data.transportation_agreement || false,
        profileImage: data.profile_image,
        nfcId: data.nfc_id,
        barcode: data.barcode,
        status: (data.status as 'active' | 'inactive') || 'active'
      };
    } catch (error) {
      console.error('Error fetching student by NFC:', error);
      return null;
    }
  };

  const searchStudents = (query: string) => {
    const searchTerm = query.toLowerCase();
    return students.filter(student => 
      student.firstName.toLowerCase().includes(searchTerm) ||
      student.lastName.toLowerCase().includes(searchTerm) ||
      student.firstNameAr.includes(searchTerm) ||
      student.lastNameAr.includes(searchTerm) ||
      student.civilId.includes(searchTerm) ||
      student.nfcId?.toLowerCase().includes(searchTerm) ||
      student.class.toLowerCase().includes(searchTerm)
    );
  };

  return (
    <StudentsContext.Provider value={{
      students,
      loading,
      addStudent,
      updateStudent,
      deleteStudent,
      getStudent,
      getStudentByNfc,
      searchStudents,
      fetchStudents
    }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
}