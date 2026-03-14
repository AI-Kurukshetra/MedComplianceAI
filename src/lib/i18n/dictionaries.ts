import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";

export type TranslationDict = Record<string, string>;

const en: TranslationDict = {
  "lang.label": "Language",
  "lang.en": "English",
  "lang.es": "Spanish",

  "nav.dashboard": "Dashboard",
  "nav.training": "Training",
  "nav.certificates": "Certificates",
  "nav.notifications": "Notifications",
  "nav.aiCoach": "AI Coach",
  "nav.profile": "Profile",
  "nav.compliance": "Compliance",
  "nav.predictive": "Predictive",
  "nav.admin": "Admin",
  "nav.moduleStudio": "Module Studio",
  "nav.staff": "Staff",
  "nav.auditTrail": "Audit Trail",
  "nav.policyLibrary": "Policy Library",
  "nav.home": "Home",
  "nav.certs": "Certs",
  "nav.alerts": "Alerts",
  "nav.ai": "AI",
  "nav.audit": "Audit",
  "nav.policies": "Policies",
  "nav.modules": "Modules",

  "topbar.brand.short": "MedCompliance",
  "topbar.brand.full": "Healthcare Compliance Platform",
  "topbar.profile": "Open profile",
  "topbar.signOut": "Sign out",
  "topbar.online": "Online",
  "topbar.offline": "Offline",
  "topbar.syncPending": "Pending sync",

  "landing.badge": "HIPAA-Centered Compliance Platform",
  "landing.title": "Compliance That Feels Clear, Fast, And Audit-Ready",
  "landing.subtitle": "Replace fragmented spreadsheets and reminder chains with one intelligent workflow for HIPAA, HITECH, SOX, and FDA compliance training.",
  "landing.openDashboard": "Open Dashboard",
  "landing.secureAccess": "Secure Access",
  "landing.goWorkspace": "Go To Workspace",

  "offline.download": "Download for Offline",
  "offline.ready": "Offline package ready",
  "offline.downloading": "Preparing offline package...",
  "offline.failed": "Offline package failed. Try again.",
  "offline.pending": "pending sync",
};

const es: TranslationDict = {
  "lang.label": "Idioma",
  "lang.en": "Ingles",
  "lang.es": "Espanol",

  "nav.dashboard": "Panel",
  "nav.training": "Capacitacion",
  "nav.certificates": "Certificados",
  "nav.notifications": "Notificaciones",
  "nav.aiCoach": "Coach IA",
  "nav.profile": "Perfil",
  "nav.compliance": "Cumplimiento",
  "nav.predictive": "Predictivo",
  "nav.admin": "Admin",
  "nav.moduleStudio": "Estudio de Modulos",
  "nav.staff": "Personal",
  "nav.auditTrail": "Auditoria",
  "nav.policyLibrary": "Politicas",
  "nav.home": "Inicio",
  "nav.certs": "Certs",
  "nav.alerts": "Alertas",
  "nav.ai": "IA",
  "nav.audit": "Auditoria",
  "nav.policies": "Politicas",
  "nav.modules": "Modulos",

  "topbar.brand.short": "MedCompliance",
  "topbar.brand.full": "Plataforma de Cumplimiento en Salud",
  "topbar.profile": "Abrir perfil",
  "topbar.signOut": "Cerrar sesion",
  "topbar.online": "En linea",
  "topbar.offline": "Sin conexion",
  "topbar.syncPending": "Sincronizacion pendiente",

  "landing.badge": "Plataforma de Cumplimiento centrada en HIPAA",
  "landing.title": "Cumplimiento Claro, Rapido y Listo para Auditoria",
  "landing.subtitle": "Reemplaza hojas de calculo y recordatorios dispersos con un flujo inteligente para HIPAA, HITECH, SOX y FDA.",
  "landing.openDashboard": "Abrir Panel",
  "landing.secureAccess": "Acceso Seguro",
  "landing.goWorkspace": "Ir al Espacio",

  "offline.download": "Descargar sin conexion",
  "offline.ready": "Paquete offline listo",
  "offline.downloading": "Preparando paquete offline...",
  "offline.failed": "Fallo al preparar offline. Reintentar.",
  "offline.pending": "sincronizaciones pendientes",
};

const dictionaries: Record<AppLocale, TranslationDict> = {
  en,
  es,
};

export function getDictionary(locale: AppLocale): TranslationDict {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
