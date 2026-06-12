import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { AttachmentRecord, AttachmentType, StorageType, SecurityLevel, AttachmentStatus } from "./src/types";

// Setup DNS caching / lookup priority
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
const isGeminiAvailable = !!process.env.GEMINI_API_KEY;
const ai = isGeminiAvailable
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Seed Initial Mock Database (In-Memory)
let attachments: AttachmentRecord[] = [
  {
    id: "ATT-2026-601",
    titleAr: "تقرير الرنين المغناطيسي للركبة اليسرى",
    titleEn: "MRI Knee Left Report",
    ownerName: "ممدوح ياسين أحمد",
    ownerId: "29508123400512",
    type: AttachmentType.MEDICAL,
    classificationAr: "أشعة رنين مغناطيسي",
    classificationEn: "MRI Scan",
    storageType: StorageType.SERVER,
    path: "\\\\hospital-server\\clinical_records\\29508123400512\\mri_knee_l_202604.pdf",
    fileSizeKb: 4120,
    fileExtension: "pdf",
    uploadedAt: "2026-04-12T10:14:00Z",
    securityLevel: SecurityLevel.CONFIDENTIAL,
    status: AttachmentStatus.ACTIVE,
    extractedNotesAr: "يظهر فحص الرنين المغناطيسي تمزقاً طفيفاً في الغضروف الهلالي الإنسي مع التهاب خفيف بالرباط الجانبي. يتطلب المتابعة مع طبيب العظام وإجراء علاج طبيعي وتحميل جزئي.",
    extractedNotesEn: "MRI scan shows a minor tear in the medial meniscus with slight inflammation in the collateral ligament. Requires orthopedic follow-up, physiotherapy, and partial weight bearing.",
    metadata: {
      clinicAr: "عيادة جراحة العظام والعمود الفقري",
      clinicEn: "Orthopedics Department",
      doctorAr: "د. كمال الشناوي",
      doctorEn: "Dr. Kamal El-Shennawy",
      associatedValue: "Meniscus Grade II Tear",
    },
  },
  {
    id: "ATT-2026-602",
    titleAr: "البحث الاجتماعي الميداني - أسرة فاطمة علي",
    titleEn: "Field Social Research - Fatima Aly Family",
    ownerName: "فاطمة محمد علي كمال",
    ownerId: "28812040988771",
    type: AttachmentType.SOCIAL,
    classificationAr: "تقرير بحث حالة وتكافل",
    classificationEn: "Social Case Study",
    storageType: StorageType.DATABASE,
    path: "db://central_social_arch/blob/social_602_fatima.docx",
    fileSizeKb: 1240,
    fileExtension: "docx",
    uploadedAt: "2026-05-18T08:30:00Z",
    securityLevel: SecurityLevel.INTERNAL,
    status: AttachmentStatus.ACTIVE,
    extractedNotesAr: "دراسة ميدانية تبين أن الأسرة مكونة من ٥ أفراد، رب الأسرة عاطل عن العمل بسبب إعاقة صحية مزمنة. لديهم طفل في المدرسة الابتدائية. الدخل الشهري غير منتظم ويبحثون عن مساعدة تكافل وتوعية دعم عائلي.",
    extractedNotesEn: "Field study shows the family consists of 5 members. The breadwinner is unemployed due to a chronic health disability. One child in primary school. Irregular monthly income, seeking Takaful aid and family support guidelines.",
    metadata: {
      socialWorkerAr: "الأخصائية رانيا محمود",
      socialWorkerEn: "Social Worker Rania Mahmoud",
      associatedValue: "Under Poverty Level (income < 2000 EGP)",
    },
  },
  {
    id: "ATT-2026-603",
    titleAr: "تحليل سكر الدم التراكمي وصورة الدم",
    titleEn: "HbA1c & CBC Laboratory Profile",
    ownerName: "ممدوح ياسين أحمد",
    ownerId: "29508123400512",
    type: AttachmentType.MEDICAL,
    classificationAr: "تحاليل معملية",
    classificationEn: "Lab Report",
    storageType: StorageType.DATABASE,
    path: "db://smart_clinical_db/blobs/lab_hba1c_ahmed_993.json",
    fileSizeKb: 345,
    fileExtension: "json",
    uploadedAt: "2026-06-01T14:45:00Z",
    securityLevel: SecurityLevel.INTERNAL,
    status: AttachmentStatus.ACTIVE,
    extractedNotesAr: "تحليل الهيموجلوبين السكري HbA1c يظهر نسبة 7.2٪ مما يشير إلى سكري غير منضبط بشكل كامل. ينصح بإعادة تنظيم جرعة الميتفورمين وجدول الغذاء مع الطبيب المختص.",
    extractedNotesEn: "HbA1c level is 7.2%, indicating partially uncontrolled diabetes mellitus. Recommended to adjust metformin dosage and dietary structure with the attending doctor.",
    metadata: {
      clinicAr: "قسم الأمراض الباطنية والغدد الصماء",
      clinicEn: "Endocrinology & Internal Medicine",
      doctorAr: "د. هاني عزب",
      doctorEn: "Dr. Hany Azab",
      associatedValue: "HbA1c: 7.2%, Hemoglobin: 14.1 g/dL",
    },
  },
  {
    id: "ATT-2026-604",
    titleAr: "شهادة إثبات الدخل السنوي الرسمي",
    titleEn: "Official Annual Income Verification Form",
    ownerName: "عمر خالد عبد الرحمن",
    ownerId: "29904151200422",
    type: AttachmentType.SOCIAL,
    classificationAr: "إثبات دخل ومستندات مالية",
    classificationEn: "Income Verification",
    storageType: StorageType.SERVER,
    path: "\\\\central-accounting\\finance_shares\\social_pensions\\sarah_cert_2026.pdf",
    fileSizeKb: 2150,
    fileExtension: "pdf",
    uploadedAt: "2026-06-05T09:22:00Z",
    securityLevel: SecurityLevel.RESTRICTED,
    status: AttachmentStatus.PENDING,
    extractedNotesAr: "شهادة دخل معتمدة تفيد بأن إجمالي راتب المواطن السنوي هو ٤٨,٠٠٠ جنيه مصري (ما يعادل ٤,٠٠٠ شهرياً). تم توريدها لاستحقاق الدعم الاسكاني الاجتماعي والغذائي.",
    extractedNotesEn: "Certified income sheet stating that the citizen's gross annual wage is 48,000 EGP (approx. 4,000/month). Uploaded for social housing program and nutrition aid eligibility evaluation.",
    metadata: {
      socialWorkerAr: "الباحث المالي عادل إمام",
      socialWorkerEn: "Financial Auditor Adel Emam",
      associatedValue: "Annual: 48,000 EGP",
    },
  }
];

// Helper to generate IDs
let currentRecordCounter = 605;
function getNextId() {
  const nextId = `ATT-2026-${currentRecordCounter}`;
  currentRecordCounter++;
  return nextId;
}

// ---------------- REST API ROUTES ----------------

// 1. Get all attachments with query filters
app.get("/api/attachments", (req, res) => {
  const { type, search } = req.query;
  let filtered = [...attachments];

  if (type && (type === AttachmentType.MEDICAL || type === AttachmentType.SOCIAL)) {
    filtered = filtered.filter((a) => a.type === type);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    filtered = filtered.filter((a) => {
      return (
        a.id.toLowerCase().includes(q) ||
        a.titleAr.toLowerCase().includes(q) ||
        a.titleEn.toLowerCase().includes(q) ||
        a.ownerName.toLowerCase().includes(q) ||
        a.ownerId.toLowerCase().includes(q) ||
        a.classificationAr.toLowerCase().includes(q) ||
        a.classificationEn.toLowerCase().includes(q) ||
        a.path.toLowerCase().includes(q) ||
        (a.extractedNotesAr && a.extractedNotesAr.toLowerCase().includes(q)) ||
        (a.extractedNotesEn && a.extractedNotesEn.toLowerCase().includes(q))
      );
    });
  }

  res.json(filtered);
});

// 2. Get Single Attachment by ID (Integration retrieval point)
app.get("/api/attachments/:id", (req, res) => {
  const record = attachments.find((a) => a.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Attachment record not found في قاعدة البيانات" });
  }
  res.json(record);
});

// 3. Create Attachment
app.post("/api/attachments", (req, res) => {
  const body = req.body;
  if (!body.ownerName || !body.titleAr || !body.type) {
    return res.status(400).json({ error: "Missing required attachment fields (ownerName, titleAr, type)" });
  }

  const newRecord: AttachmentRecord = {
    id: body.id || getNextId(),
    titleAr: body.titleAr,
    titleEn: body.titleEn || body.titleAr,
    ownerName: body.ownerName,
    ownerId: body.ownerId || "Unknown ID",
    type: body.type,
    classificationAr: body.classificationAr || "مستند عام",
    classificationEn: body.classificationEn || "General Document",
    storageType: body.storageType || StorageType.SERVER,
    path: body.path || "\\\\local-server\\unassigned_share\\" + (body.titleEn || "doc") + ".pdf",
    fileSizeKb: body.fileSizeKb || Math.floor(Math.random() * 3000) + 100,
    fileExtension: body.fileExtension || "pdf",
    uploadedAt: new Date().toISOString(),
    securityLevel: body.securityLevel || SecurityLevel.INTERNAL,
    status: body.status || AttachmentStatus.ACTIVE,
    extractedNotesAr: body.extractedNotesAr || "لا توجد ملاحظات ذكية مستخرجة.",
    extractedNotesEn: body.extractedNotesEn || "No extracted automated notes available.",
    metadata: body.metadata || {},
  };

  attachments.unshift(newRecord);
  res.status(201).json(newRecord);
});

// 4. Update Attachment
app.put("/api/attachments/:id", (req, res) => {
  const { id } = req.params;
  const index = attachments.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Record not found" });
  }

  const existing = attachments[index];
  const updatedData = {
    ...existing,
    ...req.body,
    id: existing.id, // Keep original ID
    uploadedAt: existing.uploadedAt, // Keep original date or allow edit selectively
  };

  attachments[index] = updatedData;
  res.json(updatedData);
});

// 5. Delete Attachment
app.delete("/api/attachments/:id", (req, res) => {
  const { id } = req.params;
  const index = attachments.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Record not found" });
  }

  const deleted = attachments.splice(index, 1);
  res.json({ success: true, message: "Record deleted", deleted: deleted[0] });
});

// 6. Gemini-powered dynamic extractor and classifier
app.post("/api/attachments/extract", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Prompt text is empty" });
  }

  // Define fallback structured object if Gemini is offline
  const fallbackStructure = (): AttachmentRecord => {
    const isMedicalText =
      /علاج|مريض|رنين|إشاعة|تحليل|طبيب|دواء|مستشفى|طبي|روشتة|دم|سكر|عظام|سخونة|سليم|lab|mri|xray|doctor|hospital|medical|cbc|clinic|blood/i.test(text);

    const nationalIdMatch = text.match(/\b\d{14}\b/) || text.match(/\b\d{8,12}\b/);
    const ownerId = nationalIdMatch ? nationalIdMatch[0] : "29508123400512";

    let name = "مستقبل مستند افتراضي";
    const nameKeywordsAr = ["المواطنة", "المواطن", "المريض", "المريضة", "للسيد", "للسيدة", "أحمد", "محمد", "فاطمة", "سارة", "علي", "عمر"];
    for (const kw of nameKeywordsAr) {
      const idx = text.indexOf(kw);
      if (idx !== -1) {
        // Simple extraction heuristic for names
        const words = text.substring(idx + kw.length).trim().split(/\s+/);
        if (words.length >= 2) {
          name = words.slice(0, 3).join(" ").replace(/[,."']/g, "");
          break;
        }
      }
    }

    if (isMedicalText) {
      return {
        id: "ATT-" + new Date().getFullYear() + "-" + (Math.floor(Math.random() * 500) + 700),
        titleAr: "تقرير فحص طبي مستخلص تلقائياً",
        titleEn: "Auto Extracted Clinical Record",
        ownerName: name,
        ownerId: ownerId,
        type: AttachmentType.MEDICAL,
        classificationAr: "تحاليل وفحوصات معملية",
        classificationEn: "Laboratory Diagnostic",
        storageType: StorageType.SERVER,
        path: "\\\\hospital-server\\clinical_records\\" + ownerId + "\\auto_doc.pdf",
        fileSizeKb: 1024,
        fileExtension: "pdf",
        uploadedAt: new Date().toISOString(),
        securityLevel: SecurityLevel.INTERNAL,
        status: AttachmentStatus.ACTIVE,
        extractedNotesAr: `تحليل محلي: النص يشير إلى مستند طبي يخص المريض ${name}. تم تحديد مسار الحفظ على السيرفر بنجاح لدواعي السرية والربط الطبي.`,
        extractedNotesEn: `Rule-based analysis: Document identifies as a medical file belonging to ${name}. Configured local server storage path for health confidentiality.`,
        metadata: {
          clinicAr: "العيادة العامة والتحاليل",
          clinicEn: "General Medicine Lab",
          doctorAr: "طبيب مستخلص افتراضياً",
          doctorEn: "Extracted Resident MD",
          associatedValue: "Extracted Clinical Keywords",
        },
      };
    } else {
      return {
        id: "ATT-" + new Date().getFullYear() + "-" + (Math.floor(Math.random() * 500) + 700),
        titleAr: "مستند وبحث حالة اجتماعية مستخلص",
        titleEn: "Auto Extracted Social Welfare File",
        ownerName: name,
        ownerId: ownerId,
        type: AttachmentType.SOCIAL,
        classificationAr: "تقرير بحث اجتماعي متكامل",
        classificationEn: "Social Assessment Form",
        storageType: StorageType.DATABASE,
        path: "db://central_social_arch/vault/social_citizen_" + ownerId + ".docx",
        fileSizeKb: 850,
        fileExtension: "docx",
        uploadedAt: new Date().toISOString(),
        securityLevel: SecurityLevel.INTERNAL,
        status: AttachmentStatus.ACTIVE,
        extractedNotesAr: `تحليل محلي: وثيقة إثبات حالة اجتماعية ومعيشية واستحقاق دعم للمواطن ${name}. تقرر حفظها بجدول البيانات للتكامل المركزي.`,
        extractedNotesEn: `Rule-based analysis: Identified citizen social assessment case file for ${name}. Scheduled database blob path storage for fast systemic integration queries.`,
        metadata: {
          socialWorkerAr: "باحث اجتماعي إلكتروني",
          socialWorkerEn: "Automated Welfare System Agent",
          associatedValue: "Citizen aid support request evaluated",
        },
      };
    }
  };

  if (!isGeminiAvailable || !ai) {
    // Return structured default parser
    const mockExtracted = fallbackStructure();
    return res.json({
      method: "mock-fallback",
      warning: "No GEMINI_API_KEY environment variable detected; returned a rule-based extracted schema.",
      extracted: mockExtracted,
    });
  }

  try {
    const prompt = `
You are an expert enterprise classification engine for an Integrated Social & Medical Attachment Management Platform.
Analyze this raw ingestion log or text:
"${text}"

Extract and generate a valid structured JSON representation mapping to the following TypeScript interface schema:
interface Structure {
  titleAr: string;        // Specific Arabic title of the file, e.g. "تقرير فحص دم" or "صورة بطاقة الأسرة"
  titleEn: string;        // English equivalent translation of title, e.g. "Complete Blood Count Report"
  ownerName: string;      // The full Arabic name of the patient/client/citizen mentioned in the text
  ownerId: string;        // National ID or File Number, e.g. "29508123400512". If missing, formulate an logical Egyptian-style 14-digit National ID or random 10-digit number.
  type: "medical" | "social"; // If the document mentions lab results, doctors, clinics, MRIs, medicine, diagnose, it must be "medical". If it is about pensions, family welfare, charity, income verification, field worker study, background research, citizen status, it must be "social".
  classificationAr: string; // Brief Arabic category, e.g. "تقارير معملية تحاليل", "أشعة ورنين", "أبحاث اجتماعية", "شهادة دخل مالي"
  classificationEn: string; // English category, e.g. "Hematology Lab", "Radiology / MRI", "Social Research", "Financial Certificate"
  storageType: "server" | "database"; // Suggest "server" for heavy imaging scans/PDFs, or if local disk paths look like "C:", "D:", "UNC", "\\\network". Suggest "database" for structured JSONs, XMLs, or social database links "db://", "oracle://", "base://".
  path: string;            // The file path mentioned in text. If none is found, generate a highly realistic corporate enterprise storage path structure following its classification and type, using standard UNC server share formats like "\\\\hospital-main-server\\records\\medical\\...pdf" for server, or database registry strings like "db://centralized_social_vault/blobs/doc_...docx" for database.
  fileSizeKb: number;      // Randomly suggested file size in KB if not mentioned, ranging from 100 to 5000.
  fileExtension: string;   // The file extension (e.g. "pdf", "docx", "png", "xlsx", "json") detected or suggested.
  securityLevel: "public" | "internal" | "confidential" | "restricted"; // Assess and label privacy properly. Confidentials for medical diagnostics; restricted for financial incomes/confidential social evaluations.
  status: "active" | "pending"; // Assign "active" as default or "pending" if it mentions review.
  extractedNotesAr: string; // A concise summary in beautiful ARABIC explaining what was extracted, patient's condition, diagnosis, income and clinical/social advice.
  extractedNotesEn: string; // A concise English translation of the extracted summary and systematic advice.
  metadata: {
    clinicAr?: string;     // Arabic Clinic or Agency name if applicable
    clinicEn?: string;     // English equivalent Clinic/Agency
    doctorAr?: string;     // Arabic Doctor name or social researcher name
    doctorEn?: string;     // English equivalent
    associatedValue?: string; // Estimated monthly wage (e.g. "5000 EGP") or main clinical metric (e.g. "HbA1c 7.5%", "Meniscus Tear")
  }
}

Return ONLY a parsed single, minified, valid JSON object that exactly satisfies this interface. No markdown formatting, three backticks, or extra commentary. Just pure structural JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const outputText = response.text?.trim() || "";
    // Clean up if the model returned markdown
    const jsonString = outputText.replace(/^```json/i, "").replace(/```$/, "").trim();
    const parsedData = JSON.parse(jsonString);

    // Ensure generated ID is appended
    parsedData.id = "ATT-" + new Date().getFullYear() + "-" + (Math.floor(Math.random() * 800) + 800);
    parsedData.uploadedAt = new Date().toISOString();

    res.json({
      method: "gemini-ai",
      extracted: parsedData,
    });
  } catch (error: any) {
    console.error("Gemini Ingestion Extraction Error:", error);
    // Fallback gracefully to non-ai rule extraction so app remains operational
    const mockExtracted = fallbackStructure();
    res.json({
      method: "mock-fallback-after-error",
      error: error.message,
      extracted: mockExtracted,
    });
  }
});

// Serve frontend assets
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express and Ingestion API running at http://0.0.0.0:${PORT}`);
    console.log(`Gemini AI Ingestion Features: ${isGeminiAvailable ? "ENABLED" : "DISABLED (No API Key)"}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to start server:", err);
});
