import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { ResumeData } from "@/types/interview";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function useResumeParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractSkills = useCallback((text: string): string[] => {
    // Common tech skills to look for
    const skillPatterns = [
      // Programming languages
      /\b(Python|JavaScript|TypeScript|Java|C\+\+|C#|Ruby|Go|Rust|Kotlin|Swift|PHP|R|Scala|Perl)\b/gi,
      // Frameworks
      /\b(React|Angular|Vue|Node\.?js|Express|Django|Flask|Spring|Rails|Laravel|Next\.?js|Nuxt)\b/gi,
      // Databases
      /\b(SQL|MySQL|PostgreSQL|MongoDB|Redis|Elasticsearch|DynamoDB|Firebase|Supabase|Oracle)\b/gi,
      // Cloud/DevOps
      /\b(AWS|Azure|GCP|Docker|Kubernetes|CI\/CD|Jenkins|GitHub Actions|Terraform|Ansible)\b/gi,
      // Data/ML
      /\b(Machine Learning|Deep Learning|TensorFlow|PyTorch|Pandas|NumPy|Scikit-learn|NLP|AI|Data Science)\b/gi,
      // Tools
      /\b(Git|Jira|Figma|Sketch|Agile|Scrum|REST|GraphQL|API|Microservices)\b/gi,
    ];

    const skills = new Set<string>();
    
    for (const pattern of skillPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(skill => skills.add(skill));
      }
    }

    return Array.from(skills);
  }, []);

  const extractExperienceYears = useCallback((text: string): number => {
    // Look for patterns like "5+ years", "5 years of experience"
    const patterns = [
      /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i,
      /(?:experience|exp)(?:\s+of)?\s+(\d+)\+?\s*(?:years?|yrs?)/i,
      /(\d+)\+?\s*(?:years?|yrs?)\s+(?:in|of|working)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    // Try to estimate from date ranges
    const dateRanges = text.match(/(\d{4})\s*[-–—]\s*(?:(\d{4})|present|current)/gi);
    if (dateRanges) {
      let totalYears = 0;
      const currentYear = new Date().getFullYear();
      
      for (const range of dateRanges) {
        const years = range.match(/\d{4}/g);
        if (years) {
          const startYear = parseInt(years[0], 10);
          const endYear = years[1] ? parseInt(years[1], 10) : currentYear;
          totalYears += endYear - startYear;
        }
      }
      
      return totalYears;
    }

    return 0;
  }, []);

  const extractEducation = useCallback((text: string): string => {
    const educationPatterns = [
      /\b(Bachelor'?s?|B\.?S\.?|B\.?A\.?|Master'?s?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?|MBA|Associate'?s?)\s+(?:degree\s+)?(?:in|of)?\s+([A-Za-z\s]+?)(?:\n|,|from|at)/gi,
      /\b(Computer Science|Engineering|Business|Mathematics|Physics|Chemistry|Biology|Economics|Psychology|Data Science)\b/gi,
    ];

    const educations: string[] = [];
    
    for (const pattern of educationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => educations.push(match.trim()));
      }
    }

    return educations.join("; ");
  }, []);

  const parseSections = useCallback((text: string): Record<string, string> => {
    const sections: Record<string, string> = {};
    
    // Common resume section headers
    const sectionHeaders = [
      "experience",
      "work experience",
      "professional experience",
      "employment history",
      "education",
      "skills",
      "technical skills",
      "projects",
      "certifications",
      "achievements",
      "summary",
      "objective",
      "about",
    ];

    const lines = text.split("\n");
    let currentSection = "header";
    let sectionContent: string[] = [];

    for (const line of lines) {
      const normalizedLine = line.toLowerCase().trim();
      const isHeader = sectionHeaders.some(header => 
        normalizedLine === header || 
        normalizedLine.startsWith(header + ":") ||
        normalizedLine.endsWith(header)
      );

      if (isHeader) {
        // Save previous section
        if (sectionContent.length > 0) {
          sections[currentSection] = sectionContent.join("\n").trim();
        }
        currentSection = normalizedLine.replace(":", "").trim();
        sectionContent = [];
      } else if (line.trim()) {
        sectionContent.push(line.trim());
      }
    }

    // Save last section
    if (sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join("\n").trim();
    }

    return sections;
  }, []);

  const parseResume = useCallback(async (file: File): Promise<ResumeData> => {
    setIsParsing(true);
    setError(null);

    try {
      let text = "";

      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const textParts: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
          textParts.push(pageText);
        }
        text = textParts.join("\n");
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        text = await file.text();
      } else if (file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // For DOC/DOCX, we'll read as text (basic support)
        text = await file.text();
      } else {
        throw new Error("Unsupported file format. Please upload a PDF, DOC, DOCX, or TXT file.");
      }

      const skills = extractSkills(text);
      const experienceYears = extractExperienceYears(text);
      const education = extractEducation(text);
      const parsedSections = parseSections(text);

      const resumeData: ResumeData = {
        filename: file.name,
        rawText: text,
        skills,
        experienceYears,
        education,
        parsedSections,
      };

      setIsParsing(false);
      return resumeData;
    } catch (err) {
      console.error("Failed to parse resume:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to parse resume";
      setError(errorMessage);
      setIsParsing(false);
      throw err;
    }
  }, [extractSkills, extractExperienceYears, extractEducation, parseSections]);

  return {
    parseResume,
    isParsing,
    error,
  };
}
