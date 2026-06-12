import React, { useState, useEffect } from "react";
import {
  FileText,
  Activity,
  Database,
  Server,
  Search,
  Plus,
  Trash2,
  Edit2,
  Globe,
  RefreshCw,
  Cpu,
  Check,
  ExternalLink,
  Code,
  ShieldAlert,
  Languages,
  Sparkles,
  Play,
  Info,
  Lock,
  ChevronRight,
  User,
  Hash,
  FolderOpen,
  Eye,
  AlertCircle
} from "lucide-react";
import { arDict, enDict } from "./dictionary";
import {
  AttachmentRecord,
  AttachmentType,
  StorageType,
  SecurityLevel,
  AttachmentStatus,
  Dictionary
} from "./types";

export default function App() {
  // Locale State
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const dict: Dictionary = lang === "ar" ? arDict : enDict;

  // Documents and In-Memory Data State
  const [records, setRecords] = useState<AttachmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | AttachmentType>("all");

  // AI Extraction Input State
  const [rawTextInput, setRawTextInput] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiLogMessage, setAiLogMessage] = useState("");

  // CRUD Form / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttachmentRecord | null>(null);

  // Form Fields
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formOwnerId, setFormOwnerId] = useState("");
  const [formType, setFormType] = useState<AttachmentType>(AttachmentType.MEDICAL);
  const [formClassificationAr, setFormClassificationAr] = useState("");
  const [formClassificationEn, setFormClassificationEn] = useState("");
  const [formStorageType, setFormStorageType] = useState<StorageType>(StorageType.SERVER);
  const [formPath, setFormPath] = useState("");
  const [formSizeKb, setFormSizeKb] = useState(1500);
  const [formExtension, setFormExtension] = useState("pdf");
  const [formSecurity, setFormSecurity] = useState<SecurityLevel>(SecurityLevel.INTERNAL);
  const [formStatus, setFormStatus] = useState<AttachmentStatus>(AttachmentStatus.ACTIVE);
  const [formNotesAr, setFormNotesAr] = useState("");
  const [formNotesEn, setFormNotesEn] = useState("");
  
  // Custom Metadata Fields
  const [formClinicAr, setFormClinicAr] = useState("");
  const [formClinicEn, setFormClinicEn] = useState("");
  const [formDoctorAr, setFormDoctorAr] = useState("");
  const [formDoctorEn, setFormDoctorEn] = useState("");
  const [formAssociatedValue, setFormAssociatedValue] = useState("");
  const [formSocialWorkerAr, setFormSocialWorkerAr] = useState("");
  const [formSocialWorkerEn, setFormSocialWorkerEn] = useState("");

  // Selected Record for Preview & Integration Simulator
  const [selectedRecordId, setSelectedRecordId] = useState<string>("ATT-2026-601");
  const [activeSimulator, setActiveSimulator] = useState<"EHR" | "WELFARE" | "API">("EHR");

  // API Developer Sandbox Test State
  const [apiEndpointId, setApiEndpointId] = useState("ATT-2026-601");
  const [apiConsoleResponse, setApiConsoleResponse] = useState<any>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Status Alerts
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load records from the server API on startup
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/attachments");
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
        if (data.length > 0 && !data.some((r: any) => r.id === selectedRecordId)) {
          setSelectedRecordId(data[0].id);
          setApiEndpointId(data[0].id);
        }
      } else {
        showFeedback("error", "Failed to retrieve documents from local service.");
      }
    } catch (e) {
      console.error(e);
      showFeedback("error", "Express server offline; running on mock browser registry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const showFeedback = (type: "success" | "error", text: string) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Quick preset text helper
  const handleQuickPaste = (type: "medical" | "social") => {
    const medSample = `المريض ممدوح ياسين أحمد، الرقم القومي 29508123400512، قسم الطوارئ. تم استلام تقرير تحليل الدم الشامل CBC الهيموجلوبين 14.2 والصفائح طبيعية. تم الحفظ في السيرفر الطبي بالمسار: \\\\clinical-storage\\lab-dept\\cbc_mamdouh_2026.pdf والسرية سري للغاية ومستوى المرفق طبي.`;
    const socSample = `المواطنة فاطمة محمد علي كمال، رقم الملف الموحد 28812040988771. أجرى الأخصائي الاجتماعي رانيا محمود دراسة حالة تبيّن أن الدخل الشهري للأسرة هو 1800 جنيه فقط وتبين استحقاق حافز الدعم تكافل وكرامة بسبب عجز صحي. تم أرشفة المستند بقاعدة البيانات المركزية بمسار الحفظ: db://social_blob_vault/certificates/income_fatima_1800.docx والسرية داخلية والمستند اجتماعي.`;
    setRawTextInput(type === "medical" ? medSample : socSample);
  };

  // Perform AI parsing & classification using server-side Gemini extract endpoint
  const handleAiExtract = async () => {
    if (!rawTextInput.trim()) {
      showFeedback("error", "الرجاء إدخال نص للتحليل / Please paste text first.");
      return;
    }
    setIsAiParsing(true);
    setAiLogMessage(dict.aiProcessing);
    try {
      const res = await fetch("/api/attachments/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawTextInput }),
      });
      if (res.ok) {
        const result = await res.json();
        const extracted: AttachmentRecord = result.extracted;
        
        // Save to Database via POST API
        const saveRes = await fetch("/api/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extracted),
        });

        if (saveRes.ok) {
          const savedRecord = await saveRes.json();
          setRecords((prev) => [savedRecord, ...prev]);
          setSelectedRecordId(savedRecord.id);
          setApiEndpointId(savedRecord.id);
          setRawTextInput("");
          showFeedback("success", `${dict.alertSuccess} (ID: ${savedRecord.id}) [Parsed via ${result.method}]`);
        } else {
          showFeedback("error", "Parsed successfully but database insertion failed.");
        }
      } else {
        showFeedback("error", "Error contacting the AI endpoint.");
      }
    } catch (e) {
      console.error(e);
      showFeedback("error", "Standard parsing fallback used due to connection error.");
    } finally {
      setIsAiParsing(false);
      setAiLogMessage("");
    }
  };

  // Active document object
  const currentRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  // Remove document record
  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا المرفق؟" : "Are you sure you want to delete this record?")) {
      return;
    }
    try {
      const res = await fetch(`/api/attachments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        showFeedback("success", dict.alertSuccess);
        if (selectedRecordId === id) {
          setSelectedRecordId("");
        }
      } else {
        showFeedback("error", "Failed to delete record.");
      }
    } catch (e) {
      console.error(e);
      showFeedback("error", "Could not delete record on the server.");
    }
  };

  // Open Edit Form
  const handleOpenEdit = (rec: AttachmentRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRecord(rec);
    setFormTitleAr(rec.titleAr);
    setFormTitleEn(rec.titleEn);
    setFormOwnerName(rec.ownerName);
    setFormOwnerId(rec.ownerId);
    setFormType(rec.type);
    setFormClassificationAr(rec.classificationAr);
    setFormClassificationEn(rec.classificationEn);
    setFormStorageType(rec.storageType);
    setFormPath(rec.path);
    setFormSizeKb(rec.fileSizeKb);
    setFormExtension(rec.fileExtension);
    setFormSecurity(rec.securityLevel);
    setFormStatus(rec.status);
    setFormNotesAr(rec.extractedNotesAr);
    setFormNotesEn(rec.extractedNotesEn);

    // Metadata
    setFormClinicAr(rec.metadata?.clinicAr || "");
    setFormClinicEn(rec.metadata?.clinicEn || "");
    setFormDoctorAr(rec.metadata?.doctorAr || "");
    setFormDoctorEn(rec.metadata?.doctorEn || "");
    setFormAssociatedValue(rec.metadata?.associatedValue || "");
    setFormSocialWorkerAr(rec.metadata?.socialWorkerAr || "");
    setFormSocialWorkerEn(rec.metadata?.socialWorkerEn || "");

    setIsFormOpen(true);
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormTitleAr("");
    setFormTitleEn("");
    setFormOwnerName("");
    setFormOwnerId("");
    setFormType(AttachmentType.MEDICAL);
    setFormClassificationAr("");
    setFormClassificationEn("");
    setFormStorageType(StorageType.SERVER);
    setFormPath("");
    setFormSizeKb(500);
    setFormExtension("pdf");
    setFormSecurity(SecurityLevel.INTERNAL);
    setFormStatus(AttachmentStatus.ACTIVE);
    setFormNotesAr("");
    setFormNotesEn("");
    setFormClinicAr("");
    setFormClinicEn("");
    setFormDoctorAr("");
    setFormDoctorEn("");
    setFormAssociatedValue("");
    setFormSocialWorkerAr("");
    setFormSocialWorkerEn("");

    setIsFormOpen(true);
  };

  // Submit manual upload or edit form to the backend
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitleAr || !formOwnerName) {
      showFeedback("error", "Title (Arabic) and Owner Name constitute mandatory parameters.");
      return;
    }

    const payload = {
      titleAr: formTitleAr,
      titleEn: formTitleEn || formTitleAr,
      ownerName: formOwnerName,
      ownerId: formOwnerId || "29508123400512",
      type: formType,
      classificationAr: formClassificationAr || (formType === AttachmentType.MEDICAL ? "تحاليل معملية" : "أبحاث اجتماعية"),
      classificationEn: formClassificationEn || (formType === AttachmentType.MEDICAL ? "Lab/Clinical Diagnostics" : "Social Welfare Research"),
      storageType: formStorageType,
      path: formPath || (formStorageType === StorageType.SERVER 
        ? `\\\\hospital-server\\clinical_records\\${formOwnerId || "unassigned"}\\man_${Date.now()}.${formExtension}`
        : `db://central_social_arch/blobs/man_social_${Date.now()}.${formExtension}`
      ),
      fileSizeKb: formSizeKb || 400,
      fileExtension: formExtension || "pdf",
      securityLevel: formSecurity,
      status: formStatus,
      extractedNotesAr: formNotesAr || "تم الإدخال اليدوي للمستند بنجاح.",
      extractedNotesEn: formNotesEn || "Manual record entry recorded successfully.",
      metadata: {
        clinicAr: formClinicAr,
        clinicEn: formClinicEn,
        doctorAr: formDoctorAr,
        doctorEn: formDoctorEn,
        associatedValue: formAssociatedValue,
        socialWorkerAr: formSocialWorkerAr,
        socialWorkerEn: formSocialWorkerEn,
      },
    };

    try {
      if (editingRecord) {
        // PUT API
        const res = await fetch(`/api/attachments/${editingRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? updated : r)));
          showFeedback("success", dict.alertSuccess);
          setIsFormOpen(false);
        } else {
          showFeedback("error", "Error saving record updates.");
        }
      } else {
        // POST API
        const res = await fetch("/api/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setRecords((prev) => [created, ...prev]);
          setSelectedRecordId(created.id);
          setApiEndpointId(created.id);
          showFeedback("success", dict.alertSuccess);
          setIsFormOpen(false);
        } else {
          showFeedback("error", "Error saving new record.");
        }
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Standard fallback used; action failed in production offline container.");
    }
  };

  // Test current REST API playground
  const testSandboxApi = async () => {
    setIsTestingApi(true);
    try {
      const res = await fetch(`/api/attachments/${apiEndpointId}`);
      if (res.ok) {
        const data = await res.json();
        setApiConsoleResponse(data);
      } else {
        const errorData = await res.json();
        setApiConsoleResponse(errorData);
      }
    } catch (e: any) {
      setApiConsoleResponse({ error: "Local Server connection failed.", details: e.message });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Filtered List
  const filteredRecords = records.filter((rec) => {
    const matchesCategory = categoryFilter === "all" || rec.type === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rec.id.toLowerCase().includes(q) ||
      rec.titleAr.toLowerCase().includes(q) ||
      rec.titleEn.toLowerCase().includes(q) ||
      rec.ownerName.toLowerCase().includes(q) ||
      rec.ownerId.toLowerCase().includes(q) ||
      rec.classificationAr.toLowerCase().includes(q) ||
      rec.classificationEn.toLowerCase().includes(q) ||
      rec.path.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  // Simple statistics
  const medicalCount = records.filter((r) => r.type === AttachmentType.MEDICAL).length;
  const socialCount = records.filter((r) => r.type === AttachmentType.SOCIAL).length;
  const serverPathCount = records.filter((r) => r.storageType === StorageType.SERVER).length;
  const dbPathCount = records.filter((r) => r.storageType === StorageType.DATABASE).length;

  return (
    <div
      id="main-applet-container"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col p-4 md:p-6 transition-all duration-300"
    >
      {/* Alert Ribbon */}
      {alert && (
        <div
          id="system-banner-alert"
          className={`fixed top-4 left-4 right-4 md:left-auto md:w-96 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 transition-all transform animate-bounce ${
            alert.type === "success"
              ? "bg-emerald-600 text-white border-l-4 border-emerald-900"
              : "bg-rose-600 text-white border-l-4 border-rose-900"
          }`}
        >
          {alert.type === "success" ? <Check className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-semibold">{alert.text}</p>
        </div>
      )}

      {/* Header Panel */}
      <header id="header-bento-unit" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 mb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md cursor-pointer hover:rotate-6 transition-transform">
            S
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {dict.title}
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold">PRO</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              {dict.subtitle}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-bold leading-none shadow-2xs">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
            <span>{lang === "ar" ? "قاعدة البيانات متصلة والـ API نشط" : "DB Online & Ingress Live"}</span>
          </div>

          <button
            id="lang-toggle-button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-xs text-slate-700 rounded-xl border border-slate-200/65 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Languages className="w-4 h-4" />
            {dict.langSelect}
          </button>
        </div>
      </header>

      {/* Main Bento Grid layout */}
      <main className="grid grid-cols-12 gap-5 flex-grow">
        
        {/* Unit 1: AI Intelligent Document Ingest (Col span 7, Row 1-2 equivalent) */}
        <div id="ai-ingestion-unit" className="col-span-12 lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {dict.ingest}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickPaste("medical")}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer"
                >
                  📝 {dict.sampleInput1}
                </button>
                <button
                  onClick={() => handleQuickPaste("social")}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer"
                >
                  👥 {dict.sampleInput2}
                </button>
              </div>
            </div>
            
            <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
              {dict.aiExtractorTitle}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-4">
              {dict.aiExtractorDesc}
            </p>
            
            <div className="relative">
              <textarea
                id="raw-text-analysis-input"
                rows={5}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                placeholder={dict.aiPlaceholder}
                className="w-full text-xs md:text-sm p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all resize-y font-mono"
              />
              {rawTextInput && (
                <button
                  onClick={() => setRawTextInput("")}
                  className="absolute bottom-3 right-3 text-xs bg-rose-50 text-rose-500 px-2 py-1 rounded hover:bg-rose-100 font-bold"
                >
                  {lang === "ar" ? "مسح النص" : "Clear"}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-slate-100">
            <button
              id="ai-process-button"
              disabled={isAiParsing}
              onClick={handleAiExtract}
              className={`w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-100 group-hover:scale-[1.01] ${isAiParsing ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {isAiParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === "ar" ? "جاري استخراج و تصنيف المرفقات..." : "Processing through Gemini..."}</span>
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5 text-indigo-200" />
                  <span>{dict.aiRecommendBtn}</span>
                </>
              )}
            </button>
            
            {isAiParsing && (
              <span className="text-xs text-indigo-600 font-bold animate-pulse text-center">
                {aiLogMessage}
              </span>
            )}
            
            {!isAiParsing && (
              <span className="text-xs text-slate-400">
                {lang === "ar" ? "* يتم هيكلة المعطيات تلقائياً وتحديد مسارات المجلدات" : "* Automatic directory mapping & object synthesis live"}
              </span>
            )}
          </div>
        </div>

        {/* Unit 2: Classification Stats & Precision Indicator (Col span 5, Row 1) */}
        <div id="stats-dashboard-unit" className="col-span-12 lg:col-span-5 bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-md group">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-slate-800"></div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold tracking-tight text-slate-350 opacity-90 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                {lang === "ar" ? "إحصائيات التصنيف وموقع الحفظ" : "Ingested Attachments Stats"}
              </h3>
              <span className="text-[10px] bg-slate-800 text-emerald-400 font-bold px-2 py-0.5 rounded">
                Live Audit
              </span>
            </div>

            <div className="space-y-4">
              {/* Stat Total */}
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30 flex justify-between items-center">
                <span className="text-xs opacity-75">{dict.statsTotal}</span>
                <span className="text-3xl font-black text-white font-mono bg-indigo-900/40 px-3 py-1 rounded-lg border border-indigo-700/20">{records.length}</span>
              </div>

              {/* Medical ratio */}
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs opacity-70 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
                    {dict.statsMedical}
                  </span>
                  <span className="text-sm font-bold font-mono">{medicalCount}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full transition-all duration-500"
                    style={{ width: `${records.length > 0 ? (medicalCount / records.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Social ratio */}
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs opacity-70 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                    {dict.statsSocial}
                  </span>
                  <span className="text-sm font-bold font-mono">{socialCount}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${records.length > 0 ? (socialCount / records.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-850">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/20 hover:border-slate-700 transition-colors">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{dict.statsServerPath}</p>
                <p className="text-lg font-bold font-mono mt-0.5 text-sky-300">{serverPathCount} <span className="text-xs text-slate-500">files</span></p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/20 hover:border-slate-700 transition-colors">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{dict.statsDbPath}</p>
                <p className="text-lg font-bold font-mono mt-0.5 text-emerald-300">{dbPathCount} <span className="text-xs text-slate-500">blobs</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Unit 3: Current Storage Pathway Config (Col span 5) */}
        <div id="storage-config-unit" className="col-span-12 md:col-span-5 lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              {lang === "ar" ? "مسارات وقنوات التخزين المعتمدة" : "Storage Pathways Configuration"}
            </h3>
            
            <div className="space-y-3">
              {/* Storage option 1 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-indigo-50/20 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                      <Server className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-bold text-xs text-slate-800">{dict.server}</span>
                  </div>
                  <span className="text-[9px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase">Default Medical</span>
                </div>
                <p className="text-[10px] font-mono text-slate-500 break-words mt-1.5 selection:bg-indigo-200">
                  \\\\hospital-main-server\\PROD_clinical_share\\
                </p>
              </div>

              {/* Storage option 2 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-emerald-50/20 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                      <Database className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-bold text-xs text-slate-800">{dict.database}</span>
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">Default Social</span>
                </div>
                <p className="text-[10px] font-mono text-slate-500 break-words mt-1.5 selection:bg-indigo-200">
                  db://smart_social_vault_prod@cl-mssql-01/blobs/
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <p className="text-[10px] text-slate-400 italic">
              {lang === "ar"
                ? "يتم توجيه الملفات بناء على التصنيف والسرية لتعزيز الأداء وتأمين السجلات القانونية للمكلفين."
                : "Dynamic sorting ensures compliance, preventing confidential spillages to unauthorized networks."}
            </p>
          </div>
        </div>

        {/* Unit 4: Simulation & External Systems Integration Viewer (Col span 7) */}
        <div id="integration-sim-unit" className="col-span-12 md:col-span-7 lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600 animate-pulse" />
                  {dict.integrationMode}
                </h3>
                <p className="text-slate-400 text-xs">{dict.integrationModeDesc}</p>
              </div>
              
              {/* Program selection tabs */}
              <div className="flex p-0.5 bg-slate-150 rounded-xl border border-slate-200 self-stretch sm:self-auto shrink-0 font-bold overflow-hidden">
                <button
                  onClick={() => setActiveSimulator("EHR")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs rounded-lg transition-all cursor-pointer ${
                    activeSimulator === "EHR" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  🏥 {lang === "ar" ? "نظام المستشفى EMR" : "EHR Medical App"}
                </button>
                <button
                  onClick={() => setActiveSimulator("WELFARE")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs rounded-lg transition-all cursor-pointer ${
                    activeSimulator === "WELFARE" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  🤝 {lang === "ar" ? "تطبيق التضامن الاجتماعي" : "Social Welfare Portal"}
                </button>
                <button
                  onClick={() => setActiveSimulator("API")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs rounded-lg transition-all cursor-pointer ${
                    activeSimulator === "API" ? "bg-slate-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  📡 {lang === "ar" ? "معاينة JSON" : "Raw JSON Call"}
                </button>
              </div>
            </div>

            {/* active simulation block */}
            <div className="bg-slate-105 border-2 border-dashed border-slate-300/80 rounded-2xl p-4 md:p-6 transition-all">
              {currentRecord ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {lang === "ar" ? "تغذية مستند مستدعى نشط" : "Live Embedded Integration Feed"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      currentRecord.type === AttachmentType.MEDICAL ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {currentRecord.type === AttachmentType.MEDICAL ? dict.medical : dict.social}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Simulator visual page */}
                    <div className="md:col-span-8 bg-white rounded-xl shadow-xs border border-slate-200 p-4">
                      {activeSimulator === "EHR" && (
                        <div>
                          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-rose-100">
                            <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest">Al-Shifa Clinical EHR Simulator v4.1</span>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                            <h4 className="text-sm font-bold text-slate-900 border-l-2 border-indigo-600 pl-2 pr-2">
                              {lang === "ar" ? "أرشيف الأشعة والفحوصات الطبية المرفقة للمريض" : "Patient Clinical Attachments & Diagnostic Viewer"}
                            </h4>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                              <div className="grid grid-cols-2 gap-2 mb-2 font-semibold">
                                <div><span className="text-slate-400">{dict.ownerName}:</span> {currentRecord.ownerName}</div>
                                <div><span className="text-slate-400">{dict.ownerId}:</span> {currentRecord.ownerId}</div>
                              </div>
                              <div className="text-[11px] bg-indigo-50/50 p-2 text-indigo-950 font-bold rounded border border-indigo-100">
                                📂 {lang === "ar" ? "عنوان المرفق الاستقصائي:" : "Selected Attachment:"} {lang === "ar" ? currentRecord.titleAr : currentRecord.titleEn}
                              </div>
                            </div>

                            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                              <strong className="block mb-0.5">🩺 {lang === "ar" ? "الاستخلاص السريري التلقائي والملاحظات:" : "Clinical Extracted Brief & Diagnosis:"}</strong>
                              {lang === "ar" ? currentRecord.extractedNotesAr : currentRecord.extractedNotesEn}
                            </div>
                            
                            {/* Medical custom block metadata */}
                            {currentRecord.type === AttachmentType.MEDICAL && (
                              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded">
                                <div>👨‍⚕️ <span className="text-slate-400">{lang === "ar" ? "الطبيب:" : "Physician:"}</span> {lang === "ar" ? currentRecord.metadata?.doctorAr || "د. كمال الشناوي" : currentRecord.metadata?.doctorEn || "Dr. Kamal"}</div>
                                <div>🏥 <span className="text-slate-400">{lang === "ar" ? "العيادة:" : "Clinic:"}</span> {lang === "ar" ? currentRecord.metadata?.clinicAr || "عيادة العظام" : currentRecord.metadata?.clinicEn || "Orthopedics"}</div>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between text-[11px] bg-slate-100 p-2 rounded gap-2">
                              <span className="font-mono text-slate-500 overflow-hidden text-ellipsis truncate block max-w-xs md:max-w-md">
                                🔗 URL path: <strong className="text-indigo-600 font-semibold">{currentRecord.path}</strong>
                              </span>
                              <div className="flex gap-2">
                                <a
                                  href={`/api/attachments/${currentRecord.id}`}
                                  target="_blank"
                                  className="px-2 py-1 bg-indigo-600 text-white font-semibold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  {dict.viewRawFile} <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSimulator === "WELFARE" && (
                        <div>
                          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-emerald-100">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Takaful & Solidarity Social Portal</span>
                          </div>

                          <div className="space-y-2 mt-2">
                            <h4 className="text-sm font-bold text-slate-900 border-l-2 border-emerald-600 pl-2 pr-2">
                              {lang === "ar" ? "رصد وبحث المستندات الاجتماعية لدعم الدخل المعيشي" : "Civic Social Aid Documents & Welfare Audit"}
                            </h4>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                              <div className="grid grid-cols-2 gap-2 mb-2 font-semibold">
                                <div><span className="text-slate-400">{dict.ownerName}:</span> {currentRecord.ownerName}</div>
                                <div><span className="text-slate-400">{dict.ownerId}:</span> {currentRecord.ownerId}</div>
                              </div>
                              <div className="text-[11px] bg-emerald-50/50 p-2 text-emerald-950 font-bold rounded border border-emerald-100">
                                💼 {lang === "ar" ? "المستند المحتسب:" : "Income Cert / Assessment File:"} {lang === "ar" ? currentRecord.titleAr : currentRecord.titleEn}
                              </div>
                            </div>

                            <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-lg text-[11px] text-teal-950">
                              <strong className="block mb-0.5">👤 {lang === "ar" ? "نتائج دراسة حالة الضمان والأثر الاجتماعي:" : "Solidarity Worker Assessment Summary:"}</strong>
                              {lang === "ar" ? currentRecord.extractedNotesAr : currentRecord.extractedNotesEn}
                            </div>

                            {/* Social custom block metadata */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded">
                              <div>🔍 <span className="text-slate-400">{lang === "ar" ? "الأخصائي الاجتماعي:" : "Welfare Officer:"}</span> {lang === "ar" ? currentRecord.metadata?.socialWorkerAr || "رانيا محمود" : currentRecord.metadata?.socialWorkerEn || "Rania Mahmoud"}</div>
                              <div>💰 <span className="text-slate-400">{lang === "ar" ? "القيمة المالية المرتبطة:" : "Associated Value:"}</span> <span className="text-emerald-700 font-bold">{currentRecord.metadata?.associatedValue || "تحت خط الفقر"}</span></div>
                            </div>

                            <div className="text-[10px] font-mono text-slate-500 bg-slate-100 p-2 rounded overflow-hidden text-ellipsis truncate">
                              📁 Path: <strong className="text-emerald-600 font-bold">{currentRecord.path}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSimulator === "API" && (
                        <div>
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-700">JSON Endpoint Fetch Simulation</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">GET /api/attachments/{currentRecord.id}</span>
                          </div>
                          <pre className="text-[10px] bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto max-h-56 font-mono selection:bg-slate-700">
                            {JSON.stringify(currentRecord, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Right integration parameters info box */}
                    <div className="md:col-span-4 flex flex-col justify-between space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{lang === "ar" ? "قناة الربط الطبي والاجتماعي" : "Integration Rules & Mapping"}</span>
                        
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span>{dict.idCode}:</span>
                            <span className="font-mono font-bold text-slate-900">{currentRecord.id}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span>{dict.secLevel}:</span>
                            <span className="font-bold text-slate-900">{lang === "ar" ? currentRecord.securityLevel : currentRecord.securityLevel}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span>{dict.fileSize}:</span>
                            <span className="font-bold text-slate-900">{currentRecord.fileSizeKb} KB</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span>{dict.fileExtensionLabel}:</span>
                            <span className="font-bold text-slate-900 uppercase font-mono">{currentRecord.fileExtension}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{dict.status}:</span>
                            <span className="text-emerald-600 font-bold">{currentRecord.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded border border-slate-200 text-[10px] text-slate-500 text-center leading-normal">
                        👨‍💻 {lang === "ar" ? "للربط الخارجي استخدم الـ SDK أو REST API الموضح بالأسفل." : "Call this secure record dynamically on behalf of foreign EHR programs."}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  {dict.noRecords}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unit 5: Comprehensive Attachment Grid List (Col span 12) */}
        <div id="records-registry-container" className="col-span-12 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div>
            {/* Table Header and Real-time Search Panel */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                  <FileText className="text-indigo-600 w-5 h-5" />
                  {dict.dashboard}
                  <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                    {filteredRecords.length} {lang === "ar" ? "مستند" : "documents"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{lang === "ar" ? "مستودع المرفقات الطبية لشبكة المستشفيات والضمان التكافلي" : "Secure index search for verified medical logs and civic welfare pensions"}</p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:flex-initial md:w-80">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    id="search-attachment-query"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={dict.searchPlaceholder}
                    className="w-full text-xs md:text-sm pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                  />
                </div>

                {/* Categories Tabs */}
                <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs font-bold shrink-0">
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      categoryFilter === "all" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:bg-slate-200/50"
                    }`}
                  >
                    {dict.filterAll}
                  </button>
                  <button
                    onClick={() => setCategoryFilter(AttachmentType.MEDICAL)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      categoryFilter === AttachmentType.MEDICAL ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:bg-slate-200/50"
                    }`}
                  >
                    {dict.filterMedical}
                  </button>
                  <button
                    onClick={() => setCategoryFilter(AttachmentType.SOCIAL)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      categoryFilter === AttachmentType.SOCIAL ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:bg-slate-200/50"
                    }`}
                  >
                    {dict.filterSocial}
                  </button>
                </div>

                {/* Create Custom Hand Manual */}
                <button
                  id="add-custom-manual-record"
                  onClick={handleOpenCreate}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all cursor-pointer select-none"
                >
                  <Plus className="w-4 h-4" />
                  {dict.addRecord}
                </button>
              </div>
            </div>

            {/* Ingestion Data View Grid */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
              <table className="w-full text-inner-registry text-xs md:text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[11px] md:text-xs">
                  <tr>
                    <th className="px-4 py-3 text-center">{dict.idCode}</th>
                    <th className="px-4 py-3">{lang === "ar" ? "عنوان المرفق" : "Document Title"}</th>
                    <th className="px-4 py-3">{dict.ownerName}</th>
                    <th className="px-4 py-3">{dict.classification}</th>
                    <th className="px-4 py-3">{dict.storage}</th>
                    <th className="px-4 py-3">{dict.secLevel}</th>
                    <th className="px-4 py-3 text-center">{dict.fileSize} / {dict.fileExtensionLabel}</th>
                    <th className="px-4 py-3 text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-500 font-bold">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        <span>{lang === "ar" ? "جاري تحميل سجلات الخادم الآمن..." : "Synchronizing security logs..."}</span>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 font-bold">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        {dict.noRecords}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        id={`row-attachment-${rec.id}`}
                        onClick={() => {
                          setSelectedRecordId(rec.id);
                          setApiEndpointId(rec.id);
                        }}
                        className={`hover:bg-slate-50/70 transition-all cursor-pointer ${
                          selectedRecordId === rec.id ? "bg-indigo-50/50" : ""
                        }`}
                      >
                        {/* ID */}
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-[11px]">
                          <span className={`px-2 py-0.5 rounded ${
                            selectedRecordId === rec.id ? "bg-indigo-200/60 text-indigo-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {rec.id}
                          </span>
                        </td>
                        
                        {/* Title */}
                        <td className="px-4 py-3.5 max-w-xs md:max-w-md">
                          <div className="font-extrabold text-slate-950">
                            {lang === "ar" ? rec.titleAr : rec.titleEn}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 truncate font-mono mt-0.5">
                            {rec.path}
                          </div>
                        </td>

                        {/* Owner */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">{rec.ownerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <span className="bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">{rec.ownerId}</span>
                          </div>
                        </td>

                        {/* Class */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              rec.type === AttachmentType.MEDICAL ? "bg-blue-500" : "bg-emerald-500"
                            }`}></span>
                            <span className="font-bold text-slate-800 text-[12px]">
                              {lang === "ar" ? rec.classificationAr : rec.classificationEn}
                            </span>
                          </div>
                          <span className="text-[9px] bg-slate-100 text-slate-400 font-bold px-1.5 py-0.2 rounded block mt-0.5 w-max">
                            {rec.type === AttachmentType.MEDICAL ? dict.medical : dict.social}
                          </span>
                        </td>

                        {/* Storage Path */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-slate-700 font-semibold font-sans text-xs">
                            {rec.storageType === StorageType.SERVER ? (
                              <Server className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            ) : (
                              <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span>{rec.storageType === StorageType.SERVER ? dict.server.split(" ")[0] : dict.database.split(" ")[0]}</span>
                          </div>
                        </td>

                        {/* Security Level */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase tracking-wider ${
                            rec.securityLevel === SecurityLevel.CONFIDENTIAL
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : rec.securityLevel === SecurityLevel.RESTRICTED
                              ? "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"
                              : rec.securityLevel === SecurityLevel.INTERNAL
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {rec.securityLevel}
                          </span>
                        </td>

                        {/* Size / Ext */}
                        <td className="px-4 py-3.5 text-center font-mono">
                          <span className="text-slate-800 font-bold">{(rec.fileSizeKb / 1024).toFixed(2)} MB</span>
                          <span className="text-[10px] block text-slate-400 font-sans">{rec.fileExtension.toUpperCase()} Form</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`edit-btn-${rec.id}`}
                              onClick={(e) => handleOpenEdit(rec, e)}
                              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-semibold text-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{lang === "ar" ? "تعديل" : "Edit"}</span>
                            </button>
                            <button
                              id={`delete-btn-${rec.id}`}
                              onClick={(e) => handleDeleteRecord(rec.id, e)}
                              className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-semibold text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{lang === "ar" ? "حذف" : "Del"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Unit 6: Rest API Interactive Playground Sandbox (Col span 12) */}
        <div id="developer-api-sandbox-unit" className="col-span-12 bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Developer intro */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-indigo-400 text-xs font-semibold uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <Code className="w-4 h-4 animate-spin-slow" />
                  REST API Sandbox Web Interface
                </span>
                <h3 className="text-xl font-bold tracking-tight mb-2">
                  {dict.apiDocTitle}
                </h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-4">
                  {dict.apiDocDesc}
                </p>

                {/* API Ingress Explorer Input */}
                <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700/60 mb-4">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                    {lang === "ar" ? "الربط البرمجي لملف محدد (ID)" : "Path Integration ID Endpoint Parameter:"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={apiEndpointId}
                      onChange={(e) => setApiEndpointId(e.target.value)}
                      placeholder="e.g. ATT-2026-601"
                      className="flex-1 bg-slate-950 border border-slate-750 text-xs font-mono px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={testSandboxApi}
                      disabled={isTestingApi}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer min-w-max"
                    >
                      {isTestingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      {dict.apiTestBtn}
                    </button>
                  </div>
                </div>
              </div>

              {/* API Endpoints description table */}
              <div className="space-y-2 mt-4">
                <div className="text-[10px] uppercase text-indigo-300 font-bold tracking-wider">{lang === "ar" ? "روابط بوابة التكامل النشطة:" : "Available Systems Hook Endpoints:"}</div>
                <div className="space-y-1.5 font-mono text-[10px] text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span className="text-blue-400">GET /api/attachments</span>
                    <span>{lang === "ar" ? "جلب السجلات الكترونياً" : "Retrieve list"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span className="text-blue-400">GET /api/attachments/:id</span>
                    <span>{lang === "ar" ? "عرض مرفق واحد" : "Fetch single item"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span className="text-purple-400">POST /api/attachments/extract</span>
                    <span>{lang === "ar" ? "تصنيف ذكي (AI)" : "Semantic extraction"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox results and dynamic codes */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              
              {/* Dynamic code sample */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  🌐 {dict.apiDocsCodeSample} (Javascript/Axios)
                </span>
                
                <pre className="text-[10px] md:text-xs bg-slate-950 p-4 rounded-xl font-mono text-slate-300 overflow-x-auto border border-slate-800 selection:bg-slate-700">
{`// 🏥 Retrieve Clinical and Social Attachment Link
async function fetchSecureAttachment(recordId) {
  const url = \`/api/attachments/\${recordId}\`;
  const response = await fetch(url);
  const record = await response.json();
  console.log("Loaded Attachment Owner Name: ", record.ownerName);
  console.log("Direct File Share Link (Path): ", record.path);
}`}
                </pre>
              </div>

              {/* API live test response panel */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    {dict.apiResponse}
                  </span>
                  {isTestingApi && <span className="text-[10px] text-indigo-400 animate-pulse font-mono font-black">Executing query...</span>}
                </div>
                
                {apiConsoleResponse ? (
                  <pre className="text-[10px] text-emerald-400 overflow-x-auto max-h-48 font-mono bg-slate-900/60 p-2.5 rounded border border-emerald-950">
                    {JSON.stringify(apiConsoleResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="text-[11px] text-slate-500 italic py-6 text-center">
                    {lang === "ar" ? "اضغط على زر (Live Test) لأرشفة ومحاكاة جلب الخادم" : "Click 'Live Test' above to process clinical database callback JSON live."}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* Manual Upload & Metadata Modal (Create/Edit) */}
      {isFormOpen && (
        <div id="manual-form-modal" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 dir-rtl">
            
            <div className="flex justify-between items-start pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">
                  {editingRecord ? dict.editRecord : dict.addRecord}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">{lang === "ar" ? "تعديل حقول المعطيات والمسارات الطبية الموحدة" : "Input or update validated client file metadata manually"}</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
              >
                ✕ {dict.cancel}
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              {/* Row 1: Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === "ar" ? "عنوان المرفق بالعربية *" : "Arabic Title *"}</label>
                  <input
                    type="text"
                    required
                    value={formTitleAr}
                    onChange={(e) => setFormTitleAr(e.target.value)}
                    placeholder="مثال: صور إشعة مفصل الكتف"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 fill-none outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === "ar" ? "عنوان المرفق بالإنجليزية" : "English Title"}</label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. Shoulder Joint X-Ray Report"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Row 2: Owner profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === "ar" ? "اسم صاحب المرفق (المريض / المواطن) *" : "Document Owner Name *"}</label>
                  <input
                    type="text"
                    required
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    placeholder="مثال: يوسف ممدوح ياسين"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === "ar" ? "الرقم القومي / المالي *" : "National ID / File Key *"}</label>
                  <input
                    type="text"
                    required
                    value={formOwnerId}
                    onChange={(e) => setFormOwnerId(e.target.value)}
                    placeholder="مثال: 29508123400512"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Row 3: Class and Storage Type */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === "ar" ? "نوع المرفق" : "Attachment Class Type"}</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AttachmentType)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value={AttachmentType.MEDICAL}>{dict.medical}</option>
                    <option value={AttachmentType.SOCIAL}>{dict.social}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{dict.storage}</label>
                  <select
                    value={formStorageType}
                    onChange={(e) => setFormStorageType(e.target.value as StorageType)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value={StorageType.SERVER}>{dict.server}</option>
                    <option value={StorageType.DATABASE}>{dict.database}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{dict.secLevel}</label>
                  <select
                    value={formSecurity}
                    onChange={(e) => setFormSecurity(e.target.value as SecurityLevel)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value={SecurityLevel.PUBLIC}>Public</option>
                    <option value={SecurityLevel.INTERNAL}>Internal</option>
                    <option value={SecurityLevel.CONFIDENTIAL}>Confidential</option>
                    <option value={SecurityLevel.RESTRICTED}>Restricted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{dict.status}</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AttachmentStatus)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value={AttachmentStatus.ACTIVE}>Active / نشط</option>
                    <option value={AttachmentStatus.PENDING}>Review Pending / قيد الانتظار</option>
                    <option value={AttachmentStatus.ARCHIVED}>Archived / مؤرشف</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Classification Arabic/English */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === "ar" ? "التصنيف الفرعي بالعربية" : "Arabic Subclassification"}</label>
                  <input
                    type="text"
                    value={formClassificationAr}
                    onChange={(e) => setFormClassificationAr(e.target.value)}
                    placeholder="مثال: أشعة سينية / أشعة مقطعية / صك مالي"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === "ar" ? "التصنيف الفرعي بالإنجليزية" : "English Subclassification"}</label>
                  <input
                    type="text"
                    value={formClassificationEn}
                    onChange={(e) => setFormClassificationEn(e.target.value)}
                    placeholder="e.g. Chest X-Ray diagnostic, Financial proof"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Path and File specification */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{dict.path} *</label>
                  <input
                    type="text"
                    value={formPath}
                    onChange={(e) => setFormPath(e.target.value)}
                    placeholder={formStorageType === StorageType.SERVER ? "\\\\fileshare\\medical\\patient_doc.pdf" : "db://social_pension_db/citizen_793.docx"}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{dict.fileSize} (KB)</label>
                  <input
                    type="number"
                    value={formSizeKb}
                    onChange={(e) => setFormSizeKb(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{dict.fileExtensionLabel}</label>
                  <input
                    type="text"
                    value={formExtension}
                    onChange={(e) => setFormExtension(e.target.value)}
                    placeholder="pdf"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Custom fields header dependent on selected record type */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                  🛡️ {lang === "ar" ? "المعلومات الوصفية المخصصة والملحقة" : "Custom Target Metadata Parameters"}
                </h4>

                {formType === AttachmentType.MEDICAL ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">{lang === "ar" ? "العيادة الطبية المختصة" : "Target Clinic (Ar)"}</label>
                      <input
                        type="text"
                        value={formClinicAr}
                        onChange={(e) => setFormClinicAr(e.target.value)}
                        placeholder="عيادة أمراض الباطنة"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">{lang === "ar" ? "الطبيب المعالج" : "Doctor Name (Ar)"}</label>
                      <input
                        type="text"
                        value={formDoctorAr}
                        onChange={(e) => setFormDoctorAr(e.target.value)}
                        placeholder="د. هاني عزب"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">{lang === "ar" ? "الرقم العيادي / الموشر" : "Clinical Indicator value"}</label>
                      <input
                        type="text"
                        value={formAssociatedValue}
                        onChange={(e) => setFormAssociatedValue(e.target.value)}
                        placeholder="HbA1c: 7.2%"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">{lang === "ar" ? "الأخصائي الاجتماعي المكلف" : "Welfare Worker (Ar)"}</label>
                      <input
                        type="text"
                        value={formSocialWorkerAr}
                        onChange={(e) => setFormSocialWorkerAr(e.target.value)}
                        placeholder="الأخصائية رانيا محمود"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">{lang === "ar" ? "الأخصائي بالإنجليزية" : "Welfare Worker (En)"}</label>
                      <input
                        type="text"
                        value={formSocialWorkerEn}
                        onChange={(e) => setFormSocialWorkerEn(e.target.value)}
                        placeholder="Worker Rania Mahmoud"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">{lang === "ar" ? "الدخل السنوي أو القيمة المعيشية" : "Associated Welfare Metric"}</label>
                      <input
                        type="text"
                        value={formAssociatedValue}
                        onChange={(e) => setFormAssociatedValue(e.target.value)}
                        placeholder="Annual: 48,000 EGP"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 6: Summaries & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{dict.notes} (بالعربية)</label>
                  <textarea
                    rows={3}
                    value={formNotesAr}
                    onChange={(e) => setFormNotesAr(e.target.value)}
                    placeholder="تقرير طبي أو اجتماعي..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{dict.notes} (In English)</label>
                  <textarea
                    rows={3}
                    value={formNotesEn}
                    onChange={(e) => setFormNotesEn(e.target.value)}
                    placeholder="Clinical evaluation or pension details..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow"
                >
                  {dict.save}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer id="footer-bento-bar" className="mt-8 pt-4 border-t border-slate-200/80 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-400 font-medium gap-3">
        <p>© 2026 {lang === "ar" ? "نظام الربط الإلكتروني الموحد للمرفقات الطبية والاجتماعية" : "Unified Ingest & Integration API System"} | Version 2.5.0-Beta</p>
        <div className="flex items-center gap-4">
          <span>{lang === "ar" ? "مشغل بواسطة: نموذج Gemini 3.5 Flash" : "Powering Engine: Gemini 3.5 Flash Model"}</span>
          <span>•</span>
          <span>{lang === "ar" ? "مسؤول النظام: mamdouhyasin30" : "Administrator: mamdouhyasin30"}</span>
        </div>
      </footer>
    </div>
  );
}
