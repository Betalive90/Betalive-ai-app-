






import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message, AppSettings, Language, ChatSession, User, AuthMode, SecurityScanResult } from './types';
// FIX: Using named import for GoogleGenAI as per guidelines. Added 'Type' for JSON schema.
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

// --- MOCK API KEY (In a real app, this would be handled securely) ---
// Per instructions, this is a placeholder and the actual key is assumed to be in process.env.API_KEY
// FIX: Ensured API key is correctly passed as a named parameter and removed fallback value.
const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({apiKey: API_KEY});

type AppMode = 'chat' | 'image' | 'creator' | 'video';

// --- HELPER: useLocalStorage Hook ---
// FIX: Updated the type signature for the setter function to correctly handle function-based state updates.
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const data = result.split(',')[1];
            const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
            resolve({ data, mimeType });
        };
        reader.onerror = error => reject(error);
    });
};

// --- SECURITY SCANNER ---
const performSecurityScan = (text: string): SecurityScanResult => {
    const issues: string[] = [];
    const patterns = [
        { name: 'Generic API Key', regex: /[A-Za-z0-9_.-]{32,}/, message: 'Potential API Key detected.' },
        { name: 'Secret Key', regex: /(sk|pk)_[a-zA-Z0-9]{24,}/, message: 'Potential Secret Key detected.' },
        { name: 'Password Keyword', regex: /password\s*[:=]\s*.+/i, message: 'Plaintext password detected.' },
        { name: 'Private Key Header', regex: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/, message: 'Private key block detected.' },
    ];

    for (const pattern of patterns) {
        if (pattern.regex.test(text)) {
            // Check if it's not already added to avoid duplicates if patterns overlap
            if (!issues.includes(pattern.message)) {
                issues.push(pattern.message);
            }
        }
    }
    
    return {
        isSafe: issues.length === 0,
        issues: issues,
    };
};


// --- TRANSLATIONS ---
const translations = {
  en: {
    // General
    "Betalive AI": "Betalive AI",
    "Settings": "Settings",
    "Save": "Save",
    "Language": "Language",
    "Theme": "Theme",
    "Light": "Light",
    "Dark": "Dark",
    "Save Conversations": "Save Conversations",
    "New Chat": "New Chat",
    "HISTORY": "HISTORY",
    "Ask me anything...": "Ask me anything...",
    "Describe the image to generate...": "Describe the image to generate...",
    "Describe the video to generate...": "Describe the video to generate...",
    "Send": "Send",
    "Chat": "Chat",
    "Image Generation": "Image",
    "Creator": "Creator",
    "Video Generation": "Video",
    "Back to Start": "Back to Start",
    // Quick Actions
    "Clear History": "Clear History",
    "Are you sure you want to clear all messages in this chat?": "Are you sure you want to clear all messages in this chat?",
    "Toggle Latency": "Toggle Latency",
    // Settings Sections
    "General": "General",
    "Features": "Features",
    "Privacy & Security": "Privacy & Security",
    "Developer": "Developer",
    // Features
    "Voice Commands": "Voice Commands",
    "Enable Quick Actions": "Enable Quick Actions",
    "Text-to-Speech": "Text-to-Speech",
    "Enable Career Guidance": "Enable Career Guidance",
    "Provides career-focused advice and suggestions.": "Provides career-focused advice and suggestions.",
    "Apple Intelligence (Beta)": "Apple Intelligence (Beta)",
    "Simulates integration with Apple ecosystem features.": "Simulates integration with Apple ecosystem features.",
    // Privacy & Security
    "Security Scan": "Security Scan",
    "Scan prompts for sensitive data like keys or passwords.": "Scan prompts for sensitive data like keys or passwords.",
    "Warn on Sensitive Topics": "Warn on Sensitive Topics",
    "Provides a warning when prompts contain potentially sensitive topics.": "Provides a warning when prompts contain potentially sensitive topics.",
    "Strip Image Metadata (Privacy)": "Strip Image Metadata (Privacy)",
    "Removes location and other metadata from uploaded images.": "Removes location and other metadata from uploaded images.",
    "Enable Ephemeral Sessions": "Enable Ephemeral Sessions",
    "Chat history will not be saved for the current session.": "Chat history will not be saved for the current session.",
    "Enable Privacy Sandbox": "Enable Privacy Sandbox",
    "Conceptual setting for future privacy-preserving APIs.": "Conceptual setting for future privacy-preserving APIs.",
    "Proactive Security Warnings": "Proactive Security Warnings",
    "Warns about sensitive content generated by the AI.": "Warns about sensitive content generated by the AI.",
    "Ephemeral Mode: This chat will not be saved.": "Ephemeral Mode: This chat will not be saved.",
    "Warning: This content may be sensitive.": "Warning: This content may be sensitive.",
    "Show Anyway": "Show Anyway",
    // Developer
    "Developer Mode": "Developer Mode",
    "Enable developer-specific features and settings.": "Enable developer-specific features and settings.",
    "Show Latency": "Show Latency",
    "Display the response time for each message.": "Display the response time for each message.",
    "Use Advanced Model Settings": "Use Advanced Model Settings",
    "Allows customizing temperature and Top-P.": "Allows customizing temperature and Top-P.",
    "Temperature": "Temperature",
    "Top-P": "Top-P",
    // Auth
    "Login": "Login",
    "Register": "Register",
    "Username": "Username",
    "Password": "Password",
    "Welcome to Betalive AI": "Welcome to Betalive AI",
    "Your personal AI assistant.": "Your personal AI assistant.",
    "Already have an account?": "Already have an account?",
    "Don't have an account?": "Don't have an account?",
    "Logout": "Logout",
    "Account Settings": "Account Settings",
    // Creator Mode
    "Create a New Application": "Create a New Application",
    "Start with a template or describe the application you want to build.": "Start with a template or describe the application you want to build.",
    "Or describe your app here...": "Or describe your app here...",
    "Generate App": "Generate App",
    "Generating your application...": "Generating your application...",
    "Failed to generate the application. Please try again.": "Failed to generate the application. Please try again.",
    "Todo List App": "Todo List App",
    "Portfolio Website": "Portfolio Website",
    "Weather App": "Weather App",
    "Copy": "Copy",
    "Copied!": "Copied!",
    // Video Generation
    "Generate Video": "Generate Video",
    "Generating your video...": "Generating your video...",
    "This may take a few minutes.": "This may take a few minutes.",
    "Please wait, the AI is working its magic.": "Please wait, the AI is working its magic.",
    "Finalizing and rendering...": "Finalizing and rendering...",
    "Failed to generate video. Please try again.": "Failed to generate video. Please try again.",
    // Video Analysis
    "Upload Video": "Upload Video",
    "or drop a video file": "or drop a video file",
    // Apple Intelligence Modal
    "Apple Intelligence (Beta) Info": "Apple Intelligence (Beta) Info",
    "This feature is experimental...": "This feature is currently in beta. Apple Intelligence is a rapidly evolving system. To ensure stability and access to the latest capabilities, please keep your application updated. Future changes from Apple may affect this feature's functionality.",
    "I Understand": "I Understand",
  },
  ar: {
    // General
    "Betalive AI": "Betalive AI",
    "Settings": "الاعدادات",
    "Save": "حفظ",
    "Language": "اللغة",
    "Theme": "المظهر",
    "Light": "فاتح",
    "Dark": "داكن",
    "Save Conversations": "حفظ المحادثات",
    "New Chat": "محادثة جديدة",
    "HISTORY": "السجل",
    "Ask me anything...": "اسألني أي شيء...",
    "Describe the image to generate...": "صف الصورة التي تريد إنشاءها...",
    "Describe the video to generate...": "صف الفيديو الذي تريد إنشاءه...",
    "Send": "إرسال",
    "Chat": "محادثة",
    "Image Generation": "صور",
    "Creator": "إنشاء",
    "Video Generation": "فيديو",
    "Back to Start": "العودة للبداية",
    // Quick Actions
    "Clear History": "مسح السجل",
    "Are you sure you want to clear all messages in this chat?": "هل أنت متأكد أنك تريد مسح جميع الرسائل في هذه المحادثة؟",
    "Toggle Latency": "تبديل زمن الاستجابة",
    // Settings Sections
    "General": "عام",
    "Features": "الميزات",
    "Privacy & Security": "الخصوصية والأمان",
    "Developer": "المطور",
    // Features
    "Voice Commands": "الأوامر الصوتية",
    "Enable Quick Actions": "تفعيل الإجراءات السريعة",
    "Text-to-Speech": "تحويل النص إلى كلام",
    "Enable Career Guidance": "تفعيل الإرشاد المهني",
    "Provides career-focused advice and suggestions.": "يقدم نصائح واقتراحات تركز على الحياة المهنية.",
    "Apple Intelligence (Beta)": "ذكاء Apple (تجريبي)",
    "Simulates integration with Apple ecosystem features.": "يحاكي التكامل مع ميزات نظام Apple البيئي.",
    // Privacy & Security
    "Security Scan": "فحص أمني",
    "Scan prompts for sensitive data like keys or passwords.": "يفحص المدخلات بحثًا عن بيانات حساسة مثل المفاتيح أو كلمات المرور.",
    "Warn on Sensitive Topics": "تحذير من المواضيع الحساسة",
    "Provides a warning when prompts contain potentially sensitive topics.": "يوفر تحذيرًا عندما تحتوي المدخلات على مواضيع قد تكون حساسة.",
    "Strip Image Metadata (Privacy)": "إزالة البيانات الوصفية للصور (خصوصية)",
    "Removes location and other metadata from uploaded images.": "يزيل الموقع والبيانات الوصفية الأخرى من الصور المرفوعة.",
    "Enable Ephemeral Sessions": "تفعيل الجلسات المؤقتة",
    "Chat history will not be saved for the current session.": "لن يتم حفظ سجل الدردشة لهذه الجلسة.",
    "Enable Privacy Sandbox": "تفعيل وضع حماية الخصوصية",
    "Conceptual setting for future privacy-preserving APIs.": "إعداد مفاهيمي لواجهات برمجة التطبيقات المستقبلية التي تحافظ على الخصوصية.",
    "Proactive Security Warnings": "تحذيرات أمنية استباقية",
    "Warns about sensitive content generated by the AI.": "يحذر من المحتوى الحساس الذي تم إنشاؤه بواسطة الذكاء الاصطناعي.",
    "Ephemeral Mode: This chat will not be saved.": "الوضع المؤقت: لن يتم حفظ هذه الدردشة.",
    "Warning: This content may be sensitive.": "تحذير: قد يكون هذا المحتوى حساساً.",
    "Show Anyway": "عرض على أي حال",
    // Developer
    "Developer Mode": "وضع المطور",
    "Enable developer-specific features and settings.": "تمكين الميزات والإعدادات الخاصة بالمطور.",
    "Show Latency": "إظهار زمن الاستجابة",
    "Display the response time for each message.": "عرض وقت الاستجابة لكل رسالة.",
    "Use Advanced Model Settings": "استخدام إعدادات النموذج المتقدمة",
    "Allows customizing temperature and Top-P.": "يسمح بتخصيص درجة الحرارة و Top-P.",
    "Temperature": "درجة الحرارة",
    "Top-P": "Top-P",
    // Auth
    "Login": "تسجيل الدخول",
    "Register": "تسجيل حساب",
    "Username": "اسم المستخدم",
    "Password": "كلمة المرور",
    "Welcome to Betalive AI": "مرحباً بك في Betalive AI",
    "Your personal AI assistant.": "مساعدك الذكي الشخصي.",
    "Already have an account?": "هل لديك حساب بالفعل؟",
    "Don't have an account?": "ليس لديك حساب؟",
    "Logout": "تسجيل الخروج",
    "Account Settings": "إعدادت الحساب",
    // Creator Mode
    "Create a New Application": "إنشاء تطبيق جديد",
    "Start with a template or describe the application you want to build.": "ابدأ بقالب أو صف التطبيق الذي تريد بناءه.",
    "Or describe your app here...": "أو صف تطبيقك هنا...",
    "Generate App": "إنشاء التطبيق",
    "Generating your application...": "جاري إنشاء تطبيقك...",
    "Failed to generate the application. Please try again.": "فشل في إنشاء التطبيق. يرجى المحاولة مرة أخرى.",
    "Todo List App": "تطبيق قائمة المهام",
    "Portfolio Website": "موقع تعريفي",
    "Weather App": "تطبيق الطقس",
    "Copy": "نسخ",
    "Copied!": "تم النسخ!",
    // Video Generation
    "Generate Video": "إنشاء فيديو",
    "Generating your video...": "جاري إنشاء الفيديو...",
    "This may take a few minutes.": "قد يستغرق هذا بضع دقائق.",
    "Please wait, the AI is working its magic.": "يرجى الانتظار، الذكاء الاصطناعي يعمل بسحره.",
    "Finalizing and rendering...": "اللمسات الأخيرة والعرض...",
    "Failed to generate video. Please try again.": "فشل في إنشاء الفيديو. يرجى المحاولة مرة أخرى.",
    // Video Analysis
    "Upload Video": "تحميل فيديو",
    "or drop a video file": "أو قم بإسقاط ملف فيديو",
    // Apple Intelligence Modal
    "Apple Intelligence (Beta) Info": "معلومات عن ذكاء Apple (تجريبي)",
    "This feature is experimental...": "هذه الميزة تجريبية حاليًا. يتطور ذكاء Apple كنظام بسرعة. لضمان الاستقرار والوصول إلى أحدث الإمكانيات، يرجى الحفاظ على تحديث تطبيقك. قد تؤثر التغييرات المستقبلية من Apple على وظائف هذه الميزة.",
    "I Understand": "فهمت",
  },
  aii: {
    "Betalive AI": "Betalive AI",
    "Settings": "ܛܘܟܣ̈ܐ",
    "Save": "ܢܛܘܪ",
    "Language": "ܠܫܢܐ",
    "Theme": "ܐܣܟܝܡܐ",
    "Light": "ܢܗܝܪܐ",
    "Dark": "ܥܡܛܢܐ",
    "Save Conversations": "ܢܛܘܪ ܡܡܠܠܐ̈",
    "New Chat": "ܡܡܠܠܐ ܚܕܬܐ",
    "HISTORY": "ܬܫܥܝܬܐ",
    "Ask me anything...": "ܫܐܠ ܠܝ ܡܕܡ...",
    "Describe the image to generate...": "صف الصورة التي تريد إنشاءها...",
    "Describe the video to generate...": "صف الفيديو الذي تريد إنشاءه...",
    "Send": "ܫܕܪ",
    "Chat": "ܡܡܠܠܐ",
    "Image Generation": "ܨܘܪܬܐ",
    "Creator": "ܒܪܘܝܐ",
    "Video Generation": "ቪድዮ",
    "Back to Start": "ܕܥܘܪ ܠܫܘܪܝܐ",
     // Quick Actions
    "Clear History": "ܕܟܝ ܬܫܥܝܬܐ",
    "Are you sure you want to clear all messages in this chat?": "ܐܢܬ ܒܛוח ܕܐܢܬ ܒܥܐ ܕܐܢܬ ܦܫܛ ܟܠ ܐܓܪ̈ܬܐ ܒܗܢܐ ܡܡܠܠܐ؟",
    "Toggle Latency": "ܫܚܠܦ ܙܒܢܐ ܕܦܘܢܝܐ",
    "General": "ܓܘܢܝܐ",
    "Features": "ܡܥܒܕܢܘ̈ܬܐ",
    "Privacy & Security": "ܕܝܠܝܘܬܐ ܘܢܛܝܪܘܬܐ",
    "Developer": "ܕܡܘܬܢܐ",
    "Voice Commands": "ܦܘܩܕܢ̈ܐ ܩܠܢܝ̈ܐ",
    "Enable Quick Actions": "ܡܗܓܪ ܣܘܥܪ̈ܢܐ ܩܠܝܠܐ̈",
    "Text-to-Speech": "ܟܬܝܒܬܐ ܠܩܠܐ",
    "Enable Career Guidance": "ܡܗܓܪ ܗداܝܐ ܕܦܘܠܚܢܐ",
    "Provides career-focused advice and suggestions.": "ܝܗܒܠ ܡܠܟܐ ܘܪ̈ܥܝܢܐ ܥܠ ܦܘܠܚܢܐ.",
    "Apple Intelligence (Beta)": "Apple Intelligence (Beta)",
    "Simulates integration with Apple ecosystem features.": "ܡדܡܐ ܚܘܝܕܐ ܥܡ ܡܥܒܕܢܘ̈ܬܐ ܕ Apple.",
    "Security Scan": "ܒܨܝܐ ܢܛܝܪܘܬܢܝܐ",
    "Scan prompts for sensitive data like keys or passwords.": "ܒܨܐ ܠܫ̈ܘܐܠܐ ܥܠ ܝܕ̈ܥܬܐ ܚܫ̈ܚܐ ܐܝܟ ܡܦܬܚ̈ܐ ܐܘ ܡ̈ܠܐ ܕܥܠܠܐ.",
    "Warn on Sensitive Topics": "ܗܪܓ ܥܠ ܐܪ̈ বিষয়ܐ ܚܫ̈ܚܐ",
    "Provides a warning when prompts contain potentially sensitive topics.": "ܝܗܒܠ ܗܪܓܐ ܟܕ ܫܘܐܠܐ ܐܝܬ ܒܗ ܐܪ̈ বিষয়ܐ ܚܫ̈ܚܐ.",
    "Strip Image Metadata (Privacy)": "ܫܠܘܚ ܝܕ̈ܥܬܐ ܡܢ ܨܘܪܬܐ (ܕܝܠܝܘܬܐ)",
    "Removes location and other metadata from uploaded images.": "ܫܠܚ ܐܬܪܐ ܘܝܕ̈ܥܬܐ ܐܚܪ̈ܢܝܬܐ ܡܢ ܨܘܪ̈ܬܐ ܕܐܣܩ.",
    "Enable Ephemeral Sessions": "ܡܗܓܪ ܝܬܒ̈ܐ ܙܒܢܢܝ̈ܐ",
    "Chat history will not be saved for the current session.": "ܬܫܥܝܬܐ ܕܡܡܠܠܐ ܠܐ ܬܬܢܛܪ ܠܗܢܐ ܝܬܒܐ.",
    "Enable Privacy Sandbox": "ܡܗܓܪ ܣܢܕܘܩܐ ܕܕܝܠܝܘܬܐ",
    "Conceptual setting for future privacy-preserving APIs.": "ܛܘܟܣܐ ܪܥܝܢܢܝܐ ܠ APIs ܕܢܛܪܝܢ ܕܝܠܝܘܬܐ.",
    "Proactive Security Warnings": "ܗܪ̈ܓܐ ܢܛܝܪܘܬܢܝ̈ܐ ܩܕܡܝ̈ܐ",
    "Warns about sensitive content generated by the AI.": "ܡܗܪܓ ܥܠ ܝܕ̈ܥܬܐ ܚܫ̈ܚܐ ܕܒܪܐ ܛܢܘܬܐ.",
    "Ephemeral Mode: This chat will not be saved.": "ܐܣܟܝܡܐ ܙܒܢܢܝܐ: ܗܢܐ ܡܡܠܠܐ ܠܐ ܢܬܢܛܪ.",
    "Warning: This content may be sensitive.": "ܗܪܓܐ: ܗܢܐ  nội dung ܚܫܚܐ ܐܝܬܘܗܝ.",
    "Show Anyway": "ܚܘܝ ܐܟܡܐ ܕܐܝܬܘܗܝ",
    // Developer
    "Developer Mode": "ܐܣܟܝܡܐ ܕܡܘܬܢܝܐ",
    "Enable developer-specific features and settings.": "ܡܗܓܪ ܡܥܒܕܢܘ̈ܬܐ ܘܛܘܟܣ̈ܐ ܕܡܘܬܢܝܐ.",
    "Show Latency": "ܚܘܝ ܙܒܢܐ ܕܦܘܢܝܐ",
    "Display the response time for each message.": "ܚܘܝ ܙܒܢܐ ܕܦܘܢܝܐ ܠܟܠ ܐܓܪܬܐ.",
    "Use Advanced Model Settings": "ܐܬܚܫܚ ܛܘܟܣ̈ܐ ܕܡܘܕܠܐ ܡܬܩܕܡܢܐ",
    "Allows customizing temperature and Top-P.": "ܫܒܩ ܠܡܛܟܣܘ ܓܪܡܐ ܘ Top-P.",
    "Temperature": "ܓܪܡܐ",
    "Top-P": "Top-P",
    "Login": "ܥܠܘܠ",
    "Register": "ܪܫܘܡ",
    "Username": "ܫܡܐ ܕܡܬܚܫܚܢܐ",
    "Password": "ܡܠܬܐ ܕܥܠܠܐ",
    "Welcome to Betalive AI": "ܒܫܝܢܐ ܒ Betalive AI",
    "Your personal AI assistant.": "ܡܥܕܪܢܐ ܕܝܠܟ ܛܢܘܬܢܝܐ.",
    "Already have an account?": "ܐܝܬ ܠܟ ܚܘܫܒܢܐ؟",
    "Don't have an account?": "ܠܝܬ ܠܟ ܚܘܫܒܢܐ؟",
    "Logout": "ܦܠܘܛ",
    "Account Settings": "ܛܘܟܣ̈ܐ ܕܚܘܫܒܢܐ",
    // Creator Mode
    "Create a New Application": "ܒܪܝ ܛبيقܬܐ ܚܕܬܐ",
    "Start with a template or describe the application you want to build.": "ابدأ بقالب أو صف التطبيق الذي تريد بناءه.",
    "Or describe your app here...": "أو صف تطبيقك هنا...",
    "Generate App": "ܒܪܝ ܛبيقܬܐ",
    "Generating your application...": "جاري إنشاء تطبيقك...",
    "Failed to generate the application. Please try again.": "فشل في إنشاء التطبيق. يرجى المحاولة مرة أخرى.",
    "Todo List App": "تطبيق قائمة المهام",
    "Portfolio Website": "موقع تعريفي",
    "Weather App": "تطبيق الطقس",
    "Copy": "ܢܣܘܚ",
    "Copied!": "ܐܬܢܣܚ!",
    // Video Generation
    "Generate Video": "إنشاء فيديو",
    "Generating your video...": "جاري إنشاء الفيديو...",
    "This may take a few minutes.": "قد يستغرق هذا بضع دقائق.",
    "Please wait, the AI is working its magic.": "يرجى الانتظار، الذكاء الاصطناعي يعمل بسحره.",
    "Finalizing and rendering...": "اللمسات الأخيرة والعرض...",
    "Failed to generate video. Please try again.": "فشل في إنشاء الفيديو. يرجى المحاولة مرة أخرى.",
    // Video Analysis
    "Upload Video": "تحميل فيديو",
    "or drop a video file": "أو قم بإسقاط ملف فيديو",
     // Apple Intelligence Modal
    "Apple Intelligence (Beta) Info": "Apple Intelligence (Beta) Info",
    "This feature is experimental...": "This feature is currently in beta. Apple Intelligence is a rapidly evolving system. To ensure stability and access to the latest capabilities, please keep your application updated. Future changes from Apple may affect this feature's functionality.",
    "I Understand": "ܐܢܐ ܝܕܥ",
  }
};


// --- DEFAULT SETTINGS ---
const defaultSettings: AppSettings = {
  language: 'en',
  theme: 'dark',
  saveConversations: true,
  voiceCommands: true,
  textToSpeech: true,
  enableQuickActions: true,
  enableCareerGuidance: true,
  appleIntelligence: true,
  enableSecurityScan: true,
  warnSensitiveTopics: true,
  stripImageMetadata: true,
  enableEphemeralSessions: false,
  enablePrivacySandbox: true,
  proactiveSecurityWarnings: true,
  // Unused placeholders for potential future features
  useCustomSystemPrompt: false,
  customSystemPrompt: '',
  developerMode: false,
  showLatency: false,
  useAdvancedModelSettings: false,
  customTemperature: 0.9,
  customTopP: 1,
  enabledModels: { openai: false, meta: false, amazon: false, microsoft: false },
  thirdPartyIntegrations: { googleDrive: false, slack: false },
};

// --- HELPER & UI COMPONENTS ---

const Switch = ({ checked, onChange, label, description }: { checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string, description?: string }) => (
    <label className="flex items-center justify-between cursor-pointer py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex-grow mr-4">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
        </div>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block w-12 h-6 rounded-full transition ${checked ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
        </div>
    </label>
);

const SettingsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-xs font-semibold text-sky-500 dark:text-sky-400 uppercase tracking-wider mb-2 pt-4">{title}</h3>
        {children}
    </div>
);

const SettingsModal = ({ settings, onUpdateSettings, onClose, onShowAppleIntelModal, t, onLogout }: { settings: AppSettings, onUpdateSettings: (s: Partial<AppSettings>) => void, onClose: () => void, onShowAppleIntelModal: () => void, t: (k: keyof typeof translations['en']) => string, onLogout: () => void }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleChange = (key: keyof AppSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleDevModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isEnabled = e.target.checked;
        if (isEnabled) {
            setLocalSettings(prev => ({ ...prev, developerMode: true }));
        } else {
            // When disabling dev mode, also turn off its sub-settings
            setLocalSettings(prev => ({
                ...prev,
                developerMode: false,
                showLatency: false,
                useAdvancedModelSettings: false
            }));
        }
    };
    
    const handleSave = () => {
        onUpdateSettings(localSettings);
        onClose();
    };

    const handleAppleIntelToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isEnabled = e.target.checked;
        handleChange('appleIntelligence', isEnabled);
        if (isEnabled) {
            onShowAppleIntelModal();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('Settings')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                    <SettingsSection title={t('General')}>
                        <div className="py-3 border-b border-slate-200 dark:border-slate-700">
                            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{t('Language')}</label>
                            <select value={localSettings.language} onChange={e => handleChange('language', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-sm">
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                                <option value="aii">ܐܬܘܪܝܐ</option>
                            </select>
                        </div>
                        <div className="py-3 border-b border-slate-200 dark:border-slate-700">
                            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{t('Theme')}</label>
                             <div className="flex space-x-2">
                                <button onClick={() => handleChange('theme', 'light')} className={`flex-1 p-2 rounded-md text-sm ${localSettings.theme === 'light' ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{t('Light')}</button>
                                <button onClick={() => handleChange('theme', 'dark')} className={`flex-1 p-2 rounded-md text-sm ${localSettings.theme === 'dark' ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{t('Dark')}</button>
                            </div>
                        </div>
                    </SettingsSection>
                    
                    <SettingsSection title={t('Features')}>
                        <Switch label={t('Enable Quick Actions')} checked={localSettings.enableQuickActions} onChange={e => handleChange('enableQuickActions', e.target.checked)} />
                        <Switch label={t('Enable Career Guidance')} description={t('Provides career-focused advice and suggestions.')} checked={localSettings.enableCareerGuidance} onChange={e => handleChange('enableCareerGuidance', e.target.checked)} />
                        <Switch label={t('Apple Intelligence (Beta)')} description={t('Simulates integration with Apple ecosystem features.')} checked={localSettings.appleIntelligence} onChange={handleAppleIntelToggle} />
                    </SettingsSection>

                    <SettingsSection title={t('Privacy & Security')}>
                         <Switch label={t('Security Scan')} description={t('Scan prompts for sensitive data like keys or passwords.')} checked={localSettings.enableSecurityScan} onChange={e => handleChange('enableSecurityScan', e.target.checked)} />
                         <Switch label={t('Proactive Security Warnings')} description={t('Warns about sensitive content generated by the AI.')} checked={localSettings.proactiveSecurityWarnings} onChange={e => handleChange('proactiveSecurityWarnings', e.target.checked)} />
                         <Switch label={t('Strip Image Metadata (Privacy)')} description={t('Removes location and other metadata from uploaded images.')} checked={localSettings.stripImageMetadata} onChange={e => handleChange('stripImageMetadata', e.target.checked)} />
                         <Switch label={t('Enable Ephemeral Sessions')} description={t('Chat history will not be saved for the current session.')} checked={localSettings.enableEphemeralSessions} onChange={e => handleChange('enableEphemeralSessions', e.target.checked)} />
                         <Switch label={t('Enable Privacy Sandbox')} description={t('Conceptual setting for future privacy-preserving APIs.')} checked={localSettings.enablePrivacySandbox} onChange={e => handleChange('enablePrivacySandbox', e.target.checked)} />
                    </SettingsSection>

                     <SettingsSection title={t('Developer')}>
                        <Switch label={t('Developer Mode')} description={t('Enable developer-specific features and settings.')} checked={localSettings.developerMode} onChange={handleDevModeToggle} />
                        {localSettings.developerMode && (
                            <>
                                <Switch label={t('Show Latency')} description={t('Display the response time for each message.')} checked={localSettings.showLatency} onChange={e => handleChange('showLatency', e.target.checked)} />
                                <Switch label={t('Use Advanced Model Settings')} description={t('Allows customizing temperature and Top-P.')} checked={localSettings.useAdvancedModelSettings} onChange={e => handleChange('useAdvancedModelSettings', e.target.checked)} />
                                {localSettings.useAdvancedModelSettings && (
                                    <div className="pl-4 pt-2">
                                        <div>
                                            <label className="text-sm font-medium">{t('Temperature')}: {localSettings.customTemperature.toFixed(2)}</label>
                                            <input type="range" min="0" max="1" step="0.01" value={localSettings.customTemperature} onChange={e => handleChange('customTemperature', parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                         <div className="mt-2">
                                            <label className="text-sm font-medium">{t('Top-P')}: {localSettings.customTopP.toFixed(2)}</label>
                                            <input type="range" min="0" max="1" step="0.01" value={localSettings.customTopP} onChange={e => handleChange('customTopP', parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </SettingsSection>
                </div>
                 <footer className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <button onClick={onLogout} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
                        {t('Logout')}
                    </button>
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        {t('Save')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

// --- ICONS ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const GearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const AppleIntelligenceModal = ({ onClose, t }: { onClose: () => void, t: (k: keyof typeof translations['en']) => string }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('Apple Intelligence (Beta) Info')}</h2>
            </header>
            <div className="p-4 sm:p-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                   {t('This feature is experimental...')}
                </p>
            </div>
            <footer className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                <button onClick={onClose} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {t('I Understand')}
                </button>
            </footer>
        </div>
    </div>
);

// --- MAIN APP COMPONENT ---
export const App: React.FC = () => {
  // --- STATE ---
  const [users, setUsers] = useLocalStorage<User[]>('betalive-users', []);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('betalive-currentUser', null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authError, setAuthError] = useState('');

  const [prompt, setPrompt] = useState('');
  const [messageMode, setMessageMode] = useState<AppMode>('chat');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppleIntelModalOpen, setIsAppleIntelModalOpen] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Memoize active session and settings to avoid unnecessary re-renders
  const activeSession = currentUser?.session;

  const settings = useMemo(() => currentUser?.settings || defaultSettings, [currentUser]);
  
  // --- TRANSLATION FUNCTION ---
  const t = useCallback((key: keyof typeof translations['en']) => {
    return translations[settings.language][key] || key;
  }, [settings.language]);

  // --- EFFECTS ---
  // Apply theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  // --- CORE FUNCTIONS ---
  const updateUser = (updatedUser: User) => {
      setCurrentUser(updatedUser);
      setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    if (currentUser) {
      const updatedUserSettings = { ...currentUser.settings, ...newSettings };
      updateUser({ ...currentUser, settings: updatedUserSettings });
    }
  };
  
  const updateActiveSession = (updatedSession: Partial<ChatSession>) => {
      if(currentUser && currentUser.session) {
          const newSession = {...currentUser.session, ...updatedSession};
          updateUser({...currentUser, session: newSession});
      }
  }
  
  // --- HANDLERS ---
  const handleRegister = (username: string, password: string) => {
    if (users.find(u => u.username === username)) {
      setAuthError('Username already exists.');
      return;
    }
    const newChatSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: t('New Chat'),
        messages: [],
        createdAt: Date.now(),
    };
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password, // In a real app, HASH THIS!
      settings: defaultSettings,
      session: newChatSession,
      activityLog: [{ id: `log-${Date.now()}`, timestamp: Date.now(), action: 'User Registered' }],
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setAuthError('');
  };

  const handleLogin = (username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      // If user has no session, create one.
      if (!user.session) {
        const newChatSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: t('New Chat'),
          messages: [],
          createdAt: Date.now(),
        };
        const updatedUser = {
          ...user, 
          session: newChatSession,
        };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      } else {
        setCurrentUser(user);
      }
      setAuthError('');
    } else {
      setAuthError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
  };
  
  const handleNewChat = () => {
    if (currentUser && currentUser.session) {
        updateActiveSession({
            messages: [],
            title: t('New Chat'),
        });
        setMessageMode('chat');
        setIsSidebarOpen(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!prompt.trim() && !videoFile) || !currentUser || !activeSession || messageMode === 'creator' || messageMode === 'video') return;
    const startTime = Date.now();
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: prompt,
      mode: messageMode,
      timestamp: Date.now(),
    };
    
    if (videoFile) {
        userMessage.videoUrl = URL.createObjectURL(videoFile);
    }

    const loadingMessage: Message = {
      id: `msg-${Date.now()}-loading`,
      role: 'model',
      text: '...',
      timestamp: Date.now(),
      isGenerating: true,
    };
    
    const updatedMessages = [...activeSession.messages, userMessage, loadingMessage];
    updateActiveSession({ messages: updatedMessages });
    
    const currentPrompt = prompt;
    const currentVideoFile = videoFile;
    setPrompt('');
    setVideoFile(null);

    try {
        if (messageMode === 'image') {
            const imageResult = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: currentPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                }
            });
    
        const base64Image = imageResult.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        const finalMessage: Message = {
            ...loadingMessage,
            isGenerating: false,
            text: `Image generated for: "${currentPrompt}"`,
            generatedImages: [imageUrl],
            latency: Date.now() - startTime
        };

        const finalMessages = [...activeSession.messages, userMessage, finalMessage];
        updateActiveSession({ messages: finalMessages });

      } else { // 'chat' mode with potential video analysis
        let systemInstruction = "";
        if (settings.appleIntelligence) {
            systemInstruction += "You are Apple Intelligence, Apple's new personal intelligence system. Your responses should be helpful, relevant, and deeply integrated with the user's personal context. Be proactive, personal, and prioritize privacy. Do not break character.\n";
        }
        if(settings.enableCareerGuidance){
            systemInstruction += "Provide career-focused advice and suggestions where relevant.\n";
        }
        
        let modelConfig: any = {};
        if (systemInstruction) {
            modelConfig.systemInstruction = systemInstruction;
        }
        if (settings.developerMode && settings.useAdvancedModelSettings) {
            modelConfig.temperature = settings.customTemperature;
            modelConfig.topP = settings.customTopP;
        }

        const contentParts: any[] = [{ text: currentPrompt }];
        if (currentVideoFile) {
            const { data, mimeType } = await fileToBase64(currentVideoFile);
            contentParts.unshift({ inlineData: { data, mimeType } });
        }

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: contentParts },
            ...(Object.keys(modelConfig).length > 0 && { config: modelConfig }),
        });
        const responseText = result.text;
        
        const finalMessage: Message = {
            ...loadingMessage,
            isGenerating: false,
            text: responseText,
            latency: Date.now() - startTime
        };

        if(settings.proactiveSecurityWarnings) {
            const sensitiveKeywords = ['self-harm', 'hate speech', 'explicit', 'violence']; 
            if(sensitiveKeywords.some(keyword => responseText.toLowerCase().includes(keyword))) {
                finalMessage.originalText = responseText;
                finalMessage.text = t('Warning: This content may be sensitive.');
                finalMessage.isSensitive = true;
                finalMessage.isRevealed = false;
            }
        }

        const finalMessages = [...activeSession.messages, userMessage, finalMessage];
        
        if (activeSession.messages.length === 0) {
            const titlePrompt = `Generate a short, 3-5 word title for this conversation: "${currentPrompt}"`;
            const titleResult = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: titlePrompt
            });
            const newTitle = titleResult.text.replace(/"/g, '');
            updateActiveSession({ messages: finalMessages, title: newTitle });
        } else {
            updateActiveSession({ messages: finalMessages });
        }
      }
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      const errorMessage: Message = {
          ...loadingMessage,
          isGenerating: false,
          text: `Error: ${error.message || 'Failed to get response from AI.'}`,
          latency: Date.now() - startTime,
      };
      const finalMessages = [...activeSession.messages, userMessage, errorMessage];
      updateActiveSession({ messages: finalMessages });
    }
  };
  
  const revealSensitiveMessage = (messageId: string) => {
       if(currentUser && activeSession) {
          const updatedMessages = activeSession.messages.map(m => {
              if (m.id === messageId && m.originalText) {
                  return {...m, isRevealed: true, text: m.originalText, isSensitive: false };
              }
              return m;
          });
          updateActiveSession({ messages: updatedMessages });
       }
  };

  // --- RENDER ---
  if (!currentUser) {
    return <AuthScreen 
      mode={authMode} 
      setMode={setAuthMode} 
      onLogin={handleLogin} 
      onRegister={handleRegister}
      error={authError}
      t={t}
    />;
  }

  const renderContent = () => {
    switch (messageMode) {
      case 'creator':
        return <CreatorView t={t} />;
      case 'video':
        return <VideoGeneratorView t={t} />;
      case 'chat':
      case 'image':
      default:
        return (
          <>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {activeSession?.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onReveal={revealSensitiveMessage} settings={settings} t={t} />
              ))}
              {activeSession && settings.enableEphemeralSessions && (
                <div className="text-center text-xs text-amber-500 bg-amber-500/10 rounded-full px-4 py-1 self-center mx-auto">
                  {t("Ephemeral Mode: This chat will not be saved.")}
                </div>
              )}
            </div>
            <ChatInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSendMessage={handleSendMessage}
              mode={messageMode}
              videoFile={videoFile}
              setVideoFile={setVideoFile}
              settings={settings}
              t={t}
            />
          </>
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex font-sans" dir={settings.language === 'ar' || settings.language === 'aii' ? 'rtl' : 'ltr'}>
      {isSettingsOpen && <SettingsModal settings={settings} onUpdateSettings={updateSettings} onClose={() => setIsSettingsOpen(false)} onShowAppleIntelModal={() => setIsAppleIntelModalOpen(true)} t={t} onLogout={handleLogout}/>}
      {isAppleIntelModalOpen && <AppleIntelligenceModal onClose={() => setIsAppleIntelModalOpen(false)} t={t} />}
      
      <SideNav
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewChat={handleNewChat}
          onOpenSettings={() => {
              setIsSettingsOpen(true);
              setIsSidebarOpen(false);
          }}
          t={t}
          language={settings.language}
      />
        
      <main className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors overflow-hidden">
        <Header
          mode={messageMode}
          onSetMode={setMessageMode}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          t={t}
        />
        {renderContent()}
      </main>
    </div>
  );
};


// --- SUB-COMPONENTS (These would typically be in separate files) ---

const AuthScreen = ({ mode, setMode, onLogin, onRegister, error, t }: any) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'login') {
            onLogin(username, password);
        } else {
            onRegister(username, password);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 font-sans p-4" dir={t('Login') === 'تسجيل الدخول' ? 'rtl' : 'ltr'}>
             <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                     <h1 className="text-4xl font-bold text-sky-500">Betalive AI</h1>
                     <p className="text-slate-500 dark:text-slate-400 mt-2">{t('Your personal AI assistant.')}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-6">{mode === 'login' ? t('Login') : t('Register')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('Username')}</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('Password')}</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" required />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            {mode === 'login' ? t('Login') : t('Register')}
                        </button>
                    </form>
                    <p className="text-sm text-center mt-6 text-slate-500 dark:text-slate-400">
                        {mode === 'login' ? t("Don't have an account?") : t("Already have an account?")}{' '}
                        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-medium text-sky-500 hover:text-sky-600">
                            {mode === 'login' ? t('Register') : t('Login')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

const Header = ({ mode, onSetMode, t, onToggleSidebar }: any) => {
    const modes: AppMode[] = ['chat', 'image', 'creator', 'video'];
    const modeTranslations: Record<AppMode, string> = {
        'chat': t('Chat'),
        'image': t('Image Generation'),
        'creator': t('Creator'),
        'video': t('Video Generation'),
    };
    
    return (
        <header className="flex-shrink-0 flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
                 <button onClick={onToggleSidebar} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Open menu">
                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
             <div className="flex-1 flex justify-center px-4">
                <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-full flex items-center space-x-1">
                   {modes.map((m) => (
                       <button key={m} onClick={() => onSetMode(m)} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${mode === m ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}>
                           {modeTranslations[m]}
                       </button>
                   ))}
                </div>
            </div>
            <div className="w-10"></div> {/* Spacer to balance the hamburger icon */}
        </header>
    );
};


const SideNav = ({ isOpen, onClose, onNewChat, onOpenSettings, t, language }: any) => {
    const isRtl = language === 'ar' || language === 'aii';
    
    // Determine translation classes based on language direction
    const transformClass = isRtl
        ? (isOpen ? 'translate-x-0' : 'translate-x-full')
        : (isOpen ? 'translate-x-0' : '-translate-x-full');
    const positionClass = isRtl ? 'right-0' : 'left-0';

    return (
        <div className={`fixed inset-0 z-40 ${!isOpen && 'pointer-events-none'}`} role="dialog" aria-modal="true">
            {/* Overlay */}
            <div 
                className={`absolute inset-0 bg-black/60 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Sidebar */}
            <aside className={`absolute top-0 ${positionClass} w-72 bg-slate-100 dark:bg-slate-800 h-full flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out ${transformClass}`}>
                <div className="p-4 flex-shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                     <h1 className="text-xl font-bold text-sky-500">{t('Betalive AI')}</h1>
                     <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" aria-label="Close menu">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                </div>
                <div className="p-4 flex-shrink-0">
                     <button onClick={onNewChat} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                        <PlusIcon />
                        <span>{t('New Chat')}</span>
                    </button>
                </div>
                <div className="flex-1" />
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <button onClick={onOpenSettings} className="w-full flex items-center justify-start space-x-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium py-2 px-4 rounded-lg transition-colors">
                        <GearIcon />
                        <span>{t('Account Settings')}</span>
                     </button>
                </div>
            </aside>
        </div>
    );
};


const MessageBubble = ({ message, onReveal, settings, t }: { message: Message, onReveal: (id: string) => void, settings: AppSettings, t: (k: string) => string }) => {
    const isUser = message.role === 'user';
    const latency = message.latency;
    const showLatency = settings.developerMode && settings.showLatency && latency !== undefined;

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 ${isUser ? 'bg-sky-500' : 'bg-slate-600'}`}></div>
            <div className={`p-3 rounded-2xl max-w-lg ${isUser ? 'bg-sky-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 rounded-bl-none'}`}>
                 {message.isGenerating ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                ) : message.isSensitive && !message.isRevealed ? (
                    <div className="space-y-2">
                        <p className="text-sm italic">{t('Warning: This content may be sensitive.')}</p>
                        <button onClick={() => onReveal(message.id)} className="text-sm font-bold text-sky-500 hover:underline">{t('Show Anyway')}</button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        {message.generatedImages && message.generatedImages.map((img, index) => (
                            <img key={index} src={img} alt="Generated content" className="mt-2 rounded-lg max-w-full" />
                        ))}
                         {message.videoUrl && (
                             <video controls src={message.videoUrl} className="mt-2 rounded-lg max-w-full" />
                         )}
                    </>
                )}
                {showLatency && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-right">
                        {Math.round(latency! / 1000 * 100) / 100}s
                    </p>
                )}
            </div>
        </div>
    );
};

const SecurityIcon = ({ status, issues }: { status: 'idle' | 'scanning' | 'safe' | 'unsafe', issues: string[] }) => {
    const iconContent = useMemo(() => {
        switch (status) {
            case 'scanning':
                return <svg className="w-5 h-5 text-sky-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.99988V5.99988" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.63608 5.63603L7.7574 7.75735" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.2427 16.2426L18.364 18.3639" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.63608 18.3639L7.7574 16.2426" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.2427 7.75735L18.364 5.63603" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
            case 'safe':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>;
            case 'unsafe':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" /><path d="M12 7v6m0 4h.01" /></svg>;
            case 'idle':
            default:
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" /></svg>;
        }
    }, [status]);
    
    const tooltipText = useMemo(() => {
        switch (status) {
            case 'scanning': return 'Scanning...';
            case 'safe': return 'Prompt seems safe.';
            case 'unsafe': return 'Potential issues found!';
            case 'idle': return 'Security scan is active.';
            default: return '';
        }
    }, [status]);

    return (
        <div className="group relative flex items-center">
            {iconContent}
            <div className="absolute bottom-full mb-2 w-max max-w-xs bg-slate-800 text-white text-xs rounded py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 -translate-x-1/2 left-1/2">
                {status === 'unsafe' && issues.length > 0 ? (
                    <>
                        <p className="font-bold">Potential Issues:</p>
                        <ul className="list-disc list-inside pl-2">
                            {issues.map((issue, i) => <li key={i}>{issue}</li>)}
                        </ul>
                    </>
                ) : (
                    tooltipText
                )}
                 <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
            </div>
        </div>
    );
};

const ChatInput = ({ prompt, setPrompt, onSendMessage, mode, videoFile, setVideoFile, settings, t }: any) => {
    const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    useEffect(() => {
        if (!settings.enableSecurityScan || !prompt.trim()) {
            setScanResult(null);
            setIsScanning(false);
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
            return;
        }

        setIsScanning(true);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = window.setTimeout(() => {
            const result = performSecurityScan(prompt);
            setScanResult(result);
            setIsScanning(false);
        }, 500); // 500ms debounce

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [prompt, settings.enableSecurityScan]);
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };
    
    const promptPlaceholder = {
      'chat': t('Ask me anything...'),
      'image': t('Describe the image to generate...'),
      'video': t('Describe the video to generate...'),
      'creator': '' // Not used
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    }

    return (
        <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            {videoFile && (
                <div className="mb-2 flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                    <p className="text-sm truncate">{videoFile.name}</p>
                    <button onClick={() => setVideoFile(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
            <div className="flex items-center space-x-2">
                <label className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </label>
                 <div className="relative flex-1">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={promptPlaceholder[mode]}
                        className="w-full p-3 pr-10 bg-slate-100 dark:bg-slate-700 rounded-lg resize-none border-transparent focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                        rows={1}
                    />
                     {(settings.enableSecurityScan && prompt.trim()) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <SecurityIcon status={isScanning ? 'scanning' : scanResult?.isSafe === false ? 'unsafe' : scanResult?.isSafe === true ? 'safe' : 'idle'} issues={scanResult?.issues || []} />
                        </div>
                    )}
                </div>
                <button onClick={onSendMessage} className="bg-sky-500 text-white rounded-full p-3 hover:bg-sky-600 transition-colors disabled:bg-slate-300" disabled={!prompt.trim() && !videoFile}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
            </div>
        </div>
    );
};

// --- MODE-SPECIFIC VIEWS ---
const CreatorView = ({t}: any) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [error, setError] = useState('');
    const [copyText, setCopyText] = useState(t('Copy'));

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setGeneratedCode('');
        setError('');
        setCopyText(t('Copy'));
        
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: `You are a world-class senior frontend engineer. Your task is to generate a complete, single-file HTML application based on the user's request. The file must include HTML structure, CSS within a <style> tag, and JavaScript within a <script> tag. The response MUST BE ONLY the raw code inside a single markdown block like this: \`\`\`html...your code here...\`\`\`. Do not add any explanation or introductory text outside the code block.`
                }
            });
            const responseText = result.text;
            const code = responseText.match(/```html\n([\s\S]+)```/)?.[1] || responseText;
            setGeneratedCode(code.trim());
        } catch (e: any) {
            setError(t('Failed to generate the application. Please try again.'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopyText(t('Copied!'));
        setTimeout(() => setCopyText(t('Copy')), 2000);
    };

    const setTemplate = (templatePrompt: string) => {
        setPrompt(templatePrompt);
    }

    return (
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">{t('Create a New Application')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('Start with a template or describe the application you want to build.')}</p>

            <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setTemplate('A responsive todo list app with local storage persistence.')} className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900">{t('Todo List App')}</button>
                <button onClick={() => setTemplate('A modern, single-page portfolio website for a photographer.')} className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900">{t('Portfolio Website')}</button>
                <button onClick={() => setTemplate('A simple weather app that fetches data from an API and displays the current weather.')} className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900">{t('Weather App')}</button>
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('Or describe your app here...')}
                className="w-full flex-grow p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 outline-none transition mb-4"
                rows={4}
                disabled={isLoading}
            />
            <button onClick={handleGenerate} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={isLoading || !prompt.trim()}>
                {isLoading ? t('Generating your application...') : t('Generate App')}
            </button>

            {(generatedCode || error) && (
                 <div className="mt-6 flex-1 flex flex-col min-h-0">
                    <div className="relative flex-1">
                        {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}
                        {generatedCode && (
                            <>
                               <button onClick={handleCopy} className="absolute top-2 right-2 bg-slate-600 text-white px-3 py-1 text-xs rounded hover:bg-slate-500">{copyText}</button>
                               <pre className="h-full w-full overflow-auto bg-slate-800 text-white p-4 rounded-lg"><code className="text-sm">{generatedCode}</code></pre>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const VideoGeneratorView = ({ t }: any) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState('');

    const loadingMessages = useMemo(() => [
        t("Generating your video..."),
        t("This may take a few minutes."),
        t("Please wait, the AI is working its magic."),
        t("Finalizing and rendering...")
    ], [t]);
    
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            let index = 0;
            setLoadingMessage(loadingMessages[0]);
            interval = setInterval(() => {
                index = (index + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[index]);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isLoading, loadingMessages]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setVideoUrl('');
        setError('');
        
        try {
            let operation = await ai.models.generateVideos({
                model: 'veo-2.0-generate-001',
                prompt: prompt,
                config: { numberOfVideos: 1 }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink && API_KEY) {
                const response = await fetch(`${downloadLink}&key=${API_KEY}`);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
            } else {
                 throw new Error("Video generation succeeded but no download link was found.");
            }
        } catch (e: any) {
            setError(t('Failed to generate video. Please try again.'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 text-center">
            <div className="w-full max-w-2xl">
                {!isLoading && !videoUrl && (
                    <>
                        <h2 className="text-2xl font-bold mb-2">{t('Video Generation')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{t('Describe the video you want to create with AI.')}</p>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('Describe the video to generate...')}
                            className="w-full p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 outline-none transition mb-4 text-center"
                            rows={2}
                        />
                        <button onClick={handleGenerate} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-400" disabled={!prompt.trim()}>
                            {t('Generate Video')}
                        </button>
                    </>
                )}
                
                {isLoading && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lg font-semibold">{loadingMessage}</p>
                    </div>
                )}
                
                {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}

                {videoUrl && !isLoading && (
                    <div>
                        <video src={videoUrl} controls autoPlay loop className="rounded-lg shadow-xl w-full max-w-2xl mb-4"></video>
                        <button onClick={() => { setVideoUrl(''); setPrompt(''); }} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold py-2 px-4 rounded-lg transition-colors">
                           {t('Back to Start')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}