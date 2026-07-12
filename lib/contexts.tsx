"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, CompanyProfile, QuestionnaireAnswer, Document } from "./types";

// Auth Context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, companyName: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem("dwaar_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in real app, call backend
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Find existing user or create demo user
    const newUser: User = {
      id: email.split("@")[0],
      email,
      companyName: "Your Company",
      isAdmin: email.includes("admin"),
    };
    
    setUser(newUser);
    localStorage.setItem("dwaar_user", JSON.stringify(newUser));
  };

  const register = async (email: string, password: string, companyName: string) => {
    // Mock register
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: email.split("@")[0],
      email,
      companyName,
      isAdmin: false,
    };
    
    setUser(newUser);
    localStorage.setItem("dwaar_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dwaar_user");
    localStorage.removeItem("dwaar_company");
    localStorage.removeItem("dwaar_questionnaire");
    localStorage.removeItem("dwaar_documents");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Company Context
interface CompanyContextType {
  company: CompanyProfile | null;
  updateCompany: (company: Partial<CompanyProfile>) => void;
  getCompletionPercentage: () => number;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dwaar_company");
    if (saved) {
      setCompany(JSON.parse(saved));
    }
  }, []);

  const updateCompany = (updates: Partial<CompanyProfile>) => {
    const updated = { ...company, ...updates } as CompanyProfile;
    setCompany(updated);
    localStorage.setItem("dwaar_company", JSON.stringify(updated));
  };

  const getCompletionPercentage = () => {
    if (!company) return 0;
    const fields = [
      company.companyName,
      company.registrationNumber,
      company.sector,
      company.businessDescription,
      company.yearOfIncorporation,
      company.promotersNames,
      company.boardMembers,
      company.keyFinancials,
    ];
    const filled = fields.filter((f) => f && (typeof f === "object" ? Object.keys(f).length > 0 : true)).length;
    return Math.round((filled / fields.length) * 100);
  };

  return (
    <CompanyContext.Provider value={{ company, updateCompany, getCompletionPercentage }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}

// Questionnaire Context
interface QuestionnaireContextType {
  answers: QuestionnaireAnswer[];
  saveAnswer: (answer: QuestionnaireAnswer) => void;
  getAnswersBySection: (sectionId: string) => QuestionnaireAnswer[];
  getCompletionBySection: (sectionId: string, totalQuestions: number) => number;
  getTotalCompletion: (totalQuestions: number) => number;
}

export const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

export function QuestionnaireProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("dwaar_questionnaire");
    if (saved) {
      setAnswers(JSON.parse(saved));
    }
  }, []);

  const saveAnswer = (answer: QuestionnaireAnswer) => {
    setAnswers((current) => {
      const updated = [...current.filter((a) => a.questionId !== answer.questionId), answer];
      localStorage.setItem("dwaar_questionnaire", JSON.stringify(updated));
      return updated;
    });
  };

  const getAnswersBySection = (sectionId: string) => {
    return answers.filter((a) => a.sectionId === sectionId);
  };

  const getCompletionBySection = (sectionId: string, totalQuestions: number) => {
    const sectionAnswers = getAnswersBySection(sectionId);
    const completed = sectionAnswers.filter((a) => a.completed).length;
    return totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;
  };

  const getTotalCompletion = (totalQuestions: number) => {
    const completed = answers.filter((a) => a.completed).length;
    return totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0;
  };

  return (
    <QuestionnaireContext.Provider
      value={{ answers, saveAnswer, getAnswersBySection, getCompletionBySection, getTotalCompletion }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error("useQuestionnaire must be used within QuestionnaireProvider");
  }
  return context;
}

// Documents Context
interface DocumentsContextType {
  documents: Document[];
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
}

export const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("dwaar_documents");
    if (saved) {
      setDocuments(JSON.parse(saved));
    }
  }, []);

  const addDocument = (document: Document) => {
    setDocuments((current) => {
      const updated = [...current, document];
      localStorage.setItem("dwaar_documents", JSON.stringify(updated));
      return updated;
    });
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    const updated = documents.map((d) => (d.id === id ? { ...d, ...updates } : d));
    setDocuments(updated);
    localStorage.setItem("dwaar_documents", JSON.stringify(updated));
  };

  const removeDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    localStorage.setItem("dwaar_documents", JSON.stringify(updated));
  };

  return (
    <DocumentsContext.Provider value={{ documents, addDocument, updateDocument, removeDocument }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error("useDocuments must be used within DocumentsProvider");
  }
  return context;
}
