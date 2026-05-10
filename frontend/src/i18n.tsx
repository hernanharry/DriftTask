import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

type Lang = "en" | "es";

const STORAGE_KEY = "driftask_lang";

const dict = {
  en: {
    "app.brand": "Driftask",
    "common.skip": "Skip",
    "common.continue": "Continue",
    "common.getStarted": "Get Started",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.error": "Error",
    "common.success": "Success",
    "common.search": "Search",
    "common.required": "Required",
    "common.loading": "Loading...",
    "onboarding.s1.title": "Data & Analytics",
    "onboarding.s1.text": "Track every metric. Real-time clarity for every decision you make.",
    "onboarding.s2.title": "Workflow Pipeline",
    "onboarding.s2.text": "Visualize your sales. Move deals through stages with a single swipe.",
    "onboarding.s3.title": "Contacts & CRM",
    "onboarding.s3.text": "Every relationship. Every conversation. All in one elegant place.",
    "auth.welcomeBack": "Welcome back.",
    "auth.signinSub": "Sign in to keep your pipeline moving.",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signin": "Sign In",
    "auth.or": "or",
    "auth.createAccount": "Create an account",
    "auth.create": "Create account.",
    "auth.createSub": "Start managing leads in under a minute.",
    "auth.fullName": "Full name",
    "auth.passwordHint": "Password (min 6 chars)",
    "auth.haveAccount": "Already have an account?",
    "auth.signUp": "Sign up",
    "auth.errEmpty": "Enter your email and password",
    "auth.errInvalidEmail": "Enter a valid email",
    "auth.errPasswordShort": "Password must be at least 6 characters",
    "auth.errName": "Enter your full name",
    "tabs.dashboard": "Dashboard",
    "tabs.contacts": "Contacts",
    "tabs.pipeline": "Pipeline",
    "tabs.tasks": "Tasks",
    "tabs.profile": "Profile",
    "dash.hello": "Hello",
    "dash.metrics": "METRICS — SWIPE",
    "dash.revenue": "Revenue",
    "dash.revenueHint": "from won deals",
    "dash.pipelineValue": "Pipeline Value",
    "dash.pipelineValueHint": "across all stages",
    "dash.conversion": "Conversion",
    "dash.conversionHint": "won / total deals",
    "dash.wonDeals": "Won Deals",
    "dash.wonDealsHint": "this period",
    "dash.contacts": "Contacts",
    "dash.activeDeals": "Active Deals",
    "dash.openTasks": "Open Tasks",
    "dash.breakdown": "PIPELINE BREAKDOWN",
    "contacts.title": "Contacts",
    "contacts.searchPh": "Search contacts...",
    "contacts.empty": "No contacts yet",
    "contacts.emptySub": "Tap + to add your first contact",
    "contacts.new": "New Contact",
    "contacts.name": "Name *",
    "contacts.phone": "Phone",
    "contacts.company": "Company",
    "contacts.position": "Position",
    "contacts.save": "Save Contact",
    "contacts.errName": "Please enter a contact name",
    "contact.detail": "Contact",
    "contact.notes": "INTERACTION HISTORY",
    "contact.addNote": "Add a note...",
    "contact.post": "Post",
    "contact.notesEmpty": "No notes yet — start the conversation.",
    "pipeline.title": "Pipeline",
    "pipeline.empty": "No deals in this stage",
    "pipeline.new": "New Deal",
    "pipeline.dealTitle": "TITLE *",
    "pipeline.value": "VALUE (USD)",
    "pipeline.contactName": "CONTACT NAME",
    "pipeline.stage": "STAGE",
    "pipeline.save": "Save Deal",
    "pipeline.errTitle": "Please enter a deal title",
    "stage.lead": "Lead",
    "stage.qualified": "Qualified",
    "stage.proposal": "Proposal",
    "stage.negotiation": "Negotiation",
    "stage.won": "Won",
    "stage.lost": "Lost",
    "tasks.title": "Tasks",
    "tasks.open": "Open",
    "tasks.all": "All",
    "tasks.done": "Done",
    "tasks.empty": "No tasks",
    "tasks.emptySub": "Tap + to add a new task",
    "tasks.new": "New Task",
    "tasks.titleField": "TITLE *",
    "tasks.descField": "DESCRIPTION",
    "tasks.dueField": "DUE DATE & TIME",
    "tasks.setDue": "Set reminder",
    "tasks.clearDue": "Clear",
    "tasks.priority": "PRIORITY",
    "tasks.save": "Save Task",
    "tasks.errTitle": "Please enter a task title",
    "tasks.notifTitle": "Driftask reminder",
    "tasks.notifBody": "Task due now",
    "tasks.priority.low": "Low",
    "tasks.priority.medium": "Medium",
    "tasks.priority.high": "High",
    "profile.title": "Profile",
    "profile.cloud": "CLOUD INTEGRATIONS",
    "profile.driveTitle": "Google Drive",
    "profile.driveConnected": "Connected as {email}",
    "profile.driveNotConnected": "Backup & restore your CRM data",
    "profile.driveConnect": "Connect Google Drive",
    "profile.driveBackup": "Backup now",
    "profile.driveRestore": "Restore from Drive",
    "profile.driveDisconnect": "Disconnect",
    "profile.driveBackups": "Available backups",
    "profile.driveNoBackups": "No backups yet. Tap Backup now.",
    "profile.driveBackupOk": "Backup uploaded",
    "profile.driveRestoreOk": "Backup restored",
    "profile.driveRestoreConfirm": "This will overwrite your current data. Continue?",
    "profile.prefs": "PREFERENCES",
    "profile.language": "Language",
    "profile.notifications": "Notifications",
    "profile.privacy": "Privacy & Security",
    "profile.help": "Help & Support",
    "profile.logout": "Sign out",
    "profile.logoutConfirm": "Are you sure you want to sign out?",
    "version": "Driftask · v1.1.0",
  },
  es: {
    "app.brand": "Driftask",
    "common.skip": "Saltar",
    "common.continue": "Continuar",
    "common.getStarted": "Comenzar",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.delete": "Eliminar",
    "common.confirm": "Confirmar",
    "common.error": "Error",
    "common.success": "Listo",
    "common.search": "Buscar",
    "common.required": "Requerido",
    "common.loading": "Cargando...",
    "onboarding.s1.title": "Datos y Analítica",
    "onboarding.s1.text": "Mide cada métrica. Claridad en tiempo real para cada decisión.",
    "onboarding.s2.title": "Pipeline de Ventas",
    "onboarding.s2.text": "Visualiza tus ventas. Mueve oportunidades entre etapas con un deslizamiento.",
    "onboarding.s3.title": "Contactos y CRM",
    "onboarding.s3.text": "Cada relación. Cada conversación. Todo en un solo lugar elegante.",
    "auth.welcomeBack": "Bienvenido de nuevo.",
    "auth.signinSub": "Inicia sesión para mantener tu pipeline en marcha.",
    "auth.email": "Correo",
    "auth.password": "Contraseña",
    "auth.signin": "Entrar",
    "auth.or": "o",
    "auth.createAccount": "Crear una cuenta",
    "auth.create": "Crear cuenta.",
    "auth.createSub": "Empieza a gestionar leads en menos de un minuto.",
    "auth.fullName": "Nombre completo",
    "auth.passwordHint": "Contraseña (mín. 6 caracteres)",
    "auth.haveAccount": "¿Ya tienes cuenta?",
    "auth.signUp": "Regístrate",
    "auth.errEmpty": "Introduce tu correo y contraseña",
    "auth.errInvalidEmail": "Introduce un correo válido",
    "auth.errPasswordShort": "La contraseña debe tener mínimo 6 caracteres",
    "auth.errName": "Introduce tu nombre completo",
    "tabs.dashboard": "Panel",
    "tabs.contacts": "Contactos",
    "tabs.pipeline": "Pipeline",
    "tabs.tasks": "Tareas",
    "tabs.profile": "Perfil",
    "dash.hello": "Hola",
    "dash.metrics": "MÉTRICAS — DESLIZA",
    "dash.revenue": "Ingresos",
    "dash.revenueHint": "de oportunidades ganadas",
    "dash.pipelineValue": "Valor del Pipeline",
    "dash.pipelineValueHint": "en todas las etapas",
    "dash.conversion": "Conversión",
    "dash.conversionHint": "ganadas / totales",
    "dash.wonDeals": "Ganadas",
    "dash.wonDealsHint": "este periodo",
    "dash.contacts": "Contactos",
    "dash.activeDeals": "Oportunidades",
    "dash.openTasks": "Tareas abiertas",
    "dash.breakdown": "DESGLOSE DEL PIPELINE",
    "contacts.title": "Contactos",
    "contacts.searchPh": "Buscar contactos...",
    "contacts.empty": "Aún no hay contactos",
    "contacts.emptySub": "Pulsa + para añadir tu primer contacto",
    "contacts.new": "Nuevo contacto",
    "contacts.name": "Nombre *",
    "contacts.phone": "Teléfono",
    "contacts.company": "Empresa",
    "contacts.position": "Puesto",
    "contacts.save": "Guardar contacto",
    "contacts.errName": "Por favor introduce un nombre",
    "contact.detail": "Contacto",
    "contact.notes": "HISTORIAL DE INTERACCIONES",
    "contact.addNote": "Añade una nota...",
    "contact.post": "Publicar",
    "contact.notesEmpty": "Aún no hay notas — empieza la conversación.",
    "pipeline.title": "Pipeline",
    "pipeline.empty": "Sin oportunidades en esta etapa",
    "pipeline.new": "Nueva oportunidad",
    "pipeline.dealTitle": "TÍTULO *",
    "pipeline.value": "VALOR (USD)",
    "pipeline.contactName": "CONTACTO",
    "pipeline.stage": "ETAPA",
    "pipeline.save": "Guardar oportunidad",
    "pipeline.errTitle": "Por favor introduce un título",
    "stage.lead": "Lead",
    "stage.qualified": "Calificado",
    "stage.proposal": "Propuesta",
    "stage.negotiation": "Negociación",
    "stage.won": "Ganada",
    "stage.lost": "Perdida",
    "tasks.title": "Tareas",
    "tasks.open": "Abiertas",
    "tasks.all": "Todas",
    "tasks.done": "Hechas",
    "tasks.empty": "Sin tareas",
    "tasks.emptySub": "Pulsa + para añadir una nueva tarea",
    "tasks.new": "Nueva tarea",
    "tasks.titleField": "TÍTULO *",
    "tasks.descField": "DESCRIPCIÓN",
    "tasks.dueField": "FECHA Y HORA",
    "tasks.setDue": "Programar recordatorio",
    "tasks.clearDue": "Quitar",
    "tasks.priority": "PRIORIDAD",
    "tasks.save": "Guardar tarea",
    "tasks.errTitle": "Por favor introduce un título",
    "tasks.notifTitle": "Recordatorio de Driftask",
    "tasks.notifBody": "Tarea para ahora",
    "tasks.priority.low": "Baja",
    "tasks.priority.medium": "Media",
    "tasks.priority.high": "Alta",
    "profile.title": "Perfil",
    "profile.cloud": "INTEGRACIONES EN LA NUBE",
    "profile.driveTitle": "Google Drive",
    "profile.driveConnected": "Conectado como {email}",
    "profile.driveNotConnected": "Respalda y restaura tus datos del CRM",
    "profile.driveConnect": "Conectar Google Drive",
    "profile.driveBackup": "Respaldar ahora",
    "profile.driveRestore": "Restaurar desde Drive",
    "profile.driveDisconnect": "Desconectar",
    "profile.driveBackups": "Respaldos disponibles",
    "profile.driveNoBackups": "Aún no hay respaldos. Pulsa Respaldar.",
    "profile.driveBackupOk": "Respaldo subido",
    "profile.driveRestoreOk": "Respaldo restaurado",
    "profile.driveRestoreConfirm": "Esto sobreescribirá tus datos actuales. ¿Continuar?",
    "profile.prefs": "PREFERENCIAS",
    "profile.language": "Idioma",
    "profile.notifications": "Notificaciones",
    "profile.privacy": "Privacidad y Seguridad",
    "profile.help": "Ayuda y Soporte",
    "profile.logout": "Cerrar sesión",
    "profile.logoutConfirm": "¿Seguro que quieres cerrar sesión?",
    "version": "Driftask · v1.1.0",
  },
} as const;

type Key = keyof typeof dict["en"];

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  t: (key: Key, params?: Record<string, string | number>) => string;
  ready: boolean;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "es") {
          setLangState(stored);
        } else {
          const locales = Localization.getLocales?.() || [];
          const code = (locales[0]?.languageCode || "en").toLowerCase();
          setLangState(code === "es" ? "es" : "en");
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    await AsyncStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: Key, params?: Record<string, string | number>) => {
      let s = (dict[lang] as Record<string, string>)[key] || (dict.en as Record<string, string>)[key] || key;
      if (params) {
        for (const k of Object.keys(params)) {
          s = s.replace(`{${k}}`, String(params[k]));
        }
      }
      return s;
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t, ready }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
