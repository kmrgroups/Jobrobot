// Best-effort structured extraction from raw resume text. This is
// regex/keyword based (no external AI call, no extra API key needed) so it
// works the moment someone uploads a file. It won't be perfect — the
// onboarding form always shows the results as editable fields so the user
// can fix anything before saving.

const SKILL_BANK = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "React", "React Native", "Next.js", "Vue", "Angular", "Node.js", "Express",
  "Django", "Flask", "Spring Boot", "GraphQL", "REST API",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD",
  "Git", "Jenkins", "Linux", "HTML", "CSS", "Tailwind CSS", "Sass",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
  "Data Analysis", "Pandas", "NumPy", "Power BI", "Tableau", "Excel",
  "Selenium", "Playwright", "Jest", "Cypress", "Agile", "Scrum", "Jira",
  "Salesforce", "SAP", "Figma", "Adobe XD", "Product Management",
  "Project Management", "Digital Marketing", "SEO", "Content Writing",
  "Communication", "Leadership", "Team Management", "Customer Service",
];

const ROLE_HINTS = [
  "Software Engineer", "Senior Software Engineer", "Full Stack Developer",
  "Frontend Developer", "Backend Developer", "Data Scientist",
  "Data Analyst", "Data Engineer", "Product Manager", "Project Manager",
  "DevOps Engineer", "QA Engineer", "Test Engineer", "UI/UX Designer",
  "Business Analyst", "Marketing Manager", "Sales Executive",
  "HR Manager", "Financial Analyst", "Operations Manager",
  "Machine Learning Engineer", "Mobile Developer", "System Administrator",
];

export interface ParsedResume {
  fullText: string;
  email?: string;
  phone?: string;
  name?: string;
  skills: string[];
  yearsExp?: number;
  desiredRoles: string[];
}

export function parseResumeText(fullText: string): ParsedResume {
  const text = fullText.replace(/\r/g, "");
  const lower = text.toLowerCase();

  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];

  // Matches Indian and international formats: +91 98765 43210, (555) 123-4567, etc.
  const phone = text
    .match(/(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g)
    ?.map((s) => s.trim())
    .find((s) => s.replace(/\D/g, "").length >= 10);

  // Name heuristic: first non-empty line, if it looks like a name (2-4 words,
  // no @ or digits, title-cased) rather than a heading like "Resume" or "CV".
  const firstLine = text.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  const looksLikeName =
    /^[A-Za-z][A-Za-z.\s]{2,50}$/.test(firstLine) &&
    firstLine.split(/\s+/).length <= 4 &&
    !/resume|curriculum|vitae|cv\b/i.test(firstLine);
  const name = looksLikeName ? firstLine : undefined;

  const skills = SKILL_BANK.filter((skill) =>
    new RegExp(`\\b${skill.toLowerCase().replace(/[.+]/g, "\\$&")}\\b`).test(lower)
  );

  const desiredRoles = ROLE_HINTS.filter((role) => lower.includes(role.toLowerCase())).slice(0, 3);

  // "5 years of experience", "5+ years", "3 yrs"
  const yearsMatch = lower.match(/(\d{1,2})\+?\s*(?:years?|yrs?)\b/);
  const yearsExp = yearsMatch ? Math.min(parseInt(yearsMatch[1], 10), 50) : undefined;

  return { fullText, email, phone, name, skills, yearsExp, desiredRoles };
}
