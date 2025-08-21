

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AppSettings, Language, ChatSession, EnabledModels, LocationAccess, ThreatScanResult, User, ActiveSession, AuthStatus, ApiCallLog, ThirdPartyApiKeys, Role } from './types';
import { GoogleGenAI, GenerateContentResponse, Content, Part, Type, Chat } from '@google/genai';

declare var YT: any;

// --- AI SERVICE ABSTRACTION LAYER ---

const AiService = {
  getProvider(settings: AppSettings): 'gemini' | 'openai' {
    if (settings.developerMode && settings.enableThirdPartyIntegrations) {
      return settings.activeThirdPartyModel;
    }
    return 'gemini';
  },

  createChat(ai: GoogleGenAI, config: any): Chat {
     return ai.chats.create(config);
  },

  async sendMessage(chat: Chat, payload: any) {
    return chat.sendMessage(payload);
  },

  async generateContent(ai: GoogleGenAI, settings: AppSettings, params: any): Promise<GenerateContentResponse> {
    const provider = this.getProvider(settings);
    if (provider === 'openai') {
        console.log(`--- SIMULATING API CALL TO OPENAI ---`);
        console.log(`API Key: ${settings.thirdPartyApiKeys.openai.substring(0, 8)}...`);
        console.log(`Prompt: `, params.contents);
        // Modify system prompt to simulate the other model, then call Gemini
        const simPrompt = `(SIMULATION MODE: Respond as if you are OpenAI's GPT model.)\n\n${params.contents}`;
        return ai.models.generateContent({ ...params, contents: simPrompt });
    }
    // Default to Gemini
    return ai.models.generateContent(params);
  },

  async generateImages(ai: GoogleGenAI, settings: AppSettings, params: any) {
    const provider = this.getProvider(settings);
     if (provider === 'gemini') {
      return ai.models.generateImages(params);
    }
    // In a real app, you would add logic here to call DALL-E or other services
    console.log("Image generation is currently only supported via Gemini. Falling back.");
    return ai.models.generateImages(params);
  },
};

// --- TRANSLATIONS ---
const translations = {
  ar: {
    chatTitle: "Betalive AI",
    chatSubtitle: "المساعد الشخصي الذكي",
    settingsTitle: "الإعدادات",
    ageVerificationTitle: "التحقق من العمر",
    initialMessage: "مرحباً! أنا مساعدك الشخصي Betalive AI. كيف يمكنني مساعدتك اليوم؟",
    appleIntelligenceInitialMessage: "مرحباً! أنا Apple Intelligence، مساعدك الشخصي من Betalive AI. كيف يمكنني مساعدتك اليوم؟",
    inputPlaceholder: "اكتب رسالتك أو الصق رابط فيديو...",
    errorApi: "فشل في تهيئة المساعد الذكي. يرجى التأكد من تكوين مفتاح API.",
    errorGeneral: "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    send: "إرسال",
    agePrompt: "يرجى إدخال تاريخ ميلادك للمتابعة. يجب أن يكون عمرك 13 عامًا أو أكثر.",
    ageErrorDate: "الرجاء إدخال تاريخ ميلادك الكامل.",
    ageError18: "يجب أن يكون عمرك 13 عامًا أو أكثر لاستخدام هذه الخدمة.",
    year: "سنة",
    month: "شهر",
    day: "يوم",
    verify: "تحقق",
    done: "تم",
    generating: "جار الإنشاء...",
    cancel: "إلغاء",
    newChat: "دردشة جديدة",
    imageGenerating: "جارٍ إنشاء صورة لـ:",
    imageDone: "تفضل، هذه هي الصورة التي طلبتها.",
    imagineHint: "استخدم /imagine <prompt> لإنشاء صورة.",
    playgroundError: "فشل إنشاء الصورة. يرجى المحاولة مرة أخرى.",
    chatHistory: "سجل الدردشة",
    deleteChat: "حذف الدردشة",
    confirmDelete: "هل أنت متأكد أنك تريد حذف هذه الدردشة؟",
    delete: "حذف",
    general: "عام",
    language: "اللغة",
    aiModelsTitle: "نماذج الذكاء الاصطناعي",
    aiModelsInfo: "يعمل هذا التطبيق كعميل لواجهة برمجة تطبيقات Google Gemini. لأسباب أمنية وتقنية، لا يمكنه تشغيل نماذج أخرى مثل Meta Llama مباشرة. تعمل مفاتيح التبديل هنا على تكييف شخصية الذكاء الاصطناعي لمحاكاة نماذج مختلفة، ولكن يتم إنشاء جميع الردود بواسطة Google Gemini.",
    openai: "OpenAI ChatGPT",
    meta: "Meta AI",
    amazon: "Amazon AI",
    microsoft: "Microsoft Copilot",
    appleIntelligenceTitle: "Apple Intelligence",
    appleIntelligenceDesc: "تمكين ميزات الذكاء الاصطناعي المحسنة مثل إنشاء الصور والبحث البصري.",
    enableAppleIntelligence: "تمكين الميزات المحسنة",
    voiceSettings: "الصوت والكلام",
    enableVoiceCommands: "تمكين الأوامر الصوتية",
    textToSpeech: "قراءة الردود بصوت عالٍ",
    ttsVoice: "صوت الذكاء الاصطناعي",
    privacyAndSecurity: "الخصوصية والأمان",
    allowMicrophone: "السماح بالوصول إلى الميكروفون",
    allowCamera: "السماح بالوصول إلى الكاميرا",
    permissionDeniedMic: "الوصول إلى الميكروفون معطل في الإعدادات.",
    permissionDeniedCam: "الوصول إلى الكاميرا معطل في الإعدادات.",
    saveConversations: "سجل المحادثات",
    logActivity: "تسجيل النشاط",
    improveAI: "تحسين نماذج الذكاء الاصطناعي",
    searchingGoogle: "جاري البحث باستخدام جوجل...",
    sources: "المصادر:",
    webSearch: "بحث الويب",
    version: "الإصدار",
    localCodeSectionTitle: "تعليمات مخصصة",
    localCodeSectionDesc: "قدّم تعليمات مخصصة لتحديد كيف يجب أن يستجيب الذكاء الاصطناعي. يمكنك تعيين شخصية محددة أو نبرة أو قواعد ليتبعها. سيتم تطبيق التغييرات على المحادثات الجديدة.",
    enableCustomInstructions: "تمكين التعليمات المخصصة",
    systemPromptPlaceholder: "مثال: أنت مساعد ذكاء اصطناعي مميز، تكلم باللهجة العراقية.",
    appleIntelligenceWelcome: "Apple Intelligence",
    getDirections: "الحصول على اتجاهات إلى المنزل",
    playPlaylist: "تشغيل قائمة أغاني الرحلة",
    shareETA: "مشاركة وقت وصولي مع صديق",
    carModeTitle: "وضع السيارة",
    enableCarMode: "تمكين وضع السيارة",
    carModeWelcome: "وضع السيارة",
    carGetDirections: "الحصول على اتجاهات للعمل",
    carPlayMusic: "تشغيل قائمة أغاني القيادة",
    carCallContact: "اتصل بسارة",
    carPlaySong: "تشغيل أغنية",
    carSearchMusic: "البحث عن موسيقى",
    proofread: "تدقيق لغوي",
    rewrite: "إعادة صياغة",
    summarize: "تلخيص",
    attachImages: "إرفاق صور",
    removeImage: "إزالة الصورة",
    visualLookupTitle: "البحث البصري",
    visualLookupDesc: "تعرف على الأشياء في صورة أو من الكاميرا.",
    useCamera: "استخدم الكاميرا",
    uploadImage: "تحميل صورة",
    capture: "التقاط",
    identifying: "جار التعرف...",
    identify: "تعرف",
    retake: "إعادة التقاط",
    back: "رجوع",
    photoMetadataPrivacyTitle: "خصوصية بيانات الصور الوصفية",
    photoMetadataPrivacyDesc: "يزيل البيانات التعريفية من الصور المرفوعة لخصوصية معززة.",
    objectRecognition: "التعرف على الأشياء",
    close: "إغلاق",
    enableCallIntegration: "تمكين إجراء المكالمات والمراسلة",
    enableCallIntegrationDesc: "يسمح للذكاء الاصطناعي بإنشاء روابط لإجراء مكالمات أو إرسال رسائل باستخدام تطبيقات جهازك.",
    carModeInstructionsTitle: "دليل الاتصال بالسيارة",
    carModeInstruction1: "1. قم بتوصيل هاتفك بنظام الصوت في سيارتك عبر البلوثوث.",
    carModeInstruction2: "2. تأكد من تشغيل صوت الوسائط من هاتفك عبر سماعات السيارة.",
    carModeInstruction3: "3. تفاعل مع الذكاء الاصطناعي صوتياً لتجربة قيادة آمنة، أو استخدم أزرار الإجراءات السريعة على الشاشة.",
    carModeInstruction4: "4. لسلامتك، استخدم لوحة المفاتيح لكتابة الرسائل فقط عندما تكون السيارة متوقفة تماماً.",
    carKeyboardWarning: "للسلامة، لا تستخدم لوحة المفاتيح أثناء القيادة.",
    hideIpAddressTitle: "إخفاء عنوان IP",
    hideIpAddressDesc: "محاولة لإخفاء عنوان IP الخاص بك. للحماية الكاملة، استخدم خدمة VPN مخصصة.",
    locationAccessTitle: "الوصول إلى الموقع",
    locationAccessDenied: "رفض",
    locationAccessApproximate: "تقريبي",
    locationAccessGranted: "سماح",
    securityReportTitle: "تقرير الأمان",
    viewSecurityReport: "عرض تقرير الأمان",
    yourSecurityScore: "درجة الأمان الخاصة بك",
    securityStatus: "حالة الأمان",
    securityRecTitle: "التوصيات",
    recSaveConvo: "عطّل 'حفظ المحادثات' لأقصى قدر من الخصوصية.",
    recMic: "عطّل الوصول إلى الميكروفون عند عدم الاستخدام.",
    recCam: "عطّل الوصول إلى الكاميرا عند عدم الاستخدام.",
    recPhoto: "فعّل 'خصوصية بيانات الصور الوصفية' لإزالة البيانات من الصور.",
    recIp: "فعّل 'إخفاء عنوان IP' لطبقة إضافية من الخصوصية.",
    recLocation: "اضبط 'الوصول إلى الموقع' على 'رفض' أو 'تقريبي'.",
    allGood: "كل شيء ممتاز! إعدادات الأمان لديك ممتازة.",
    speechRecognitionTitle: "التعرف على الكلام",
    speechRecognitionDesc: "يسمح للتطبيق بالتعرف على صوتك للأوامر. قد يختلف التوافق حسب المتصفح والجهاز (مثل أندرويد مقابل iOS).",
    nowPlaying: "قيد التشغيل الآن",
    unknownSong: "أغنية غير معروفة",
    unknownArtist: "فنان غير معروف",
    stopMusic: "إيقاف الموسيقى",
    openInYouTube: "فتح في يوتيوب",
    openInSpotify: "فتح في سبوتيفاي",
    couldNotPlaySuffix: "\n\nلم أتمكن من العثور على فيديو لتشغيله تلقائيًا، ولكن يمكنك تجربة الروابط أدناه.",
    iraqiCultureTitle: "الثقافة والتاريخ العراقي",
    exploreMuseum: "اكتشف المتحف العراقي",
    historyOfBaghdad: "تاريخ بغداد",
    whoIsHammurabi: "من هو حمورابي؟",
    iraqiCuisine: "أشهر الأكلات العراقية",
    codingInIraq: "أهمية البرمجة في العراق",
    devJobsForGrads: "وظائف برمجية للخريجين",
    iraqiTalentTitle: "مبادرة المبرمج العراقي",
    iraqiTalentDesc: "اكتشف كيف يساهم تطوير البرمجيات في خلق فرص عمل جديدة للخريجين في العراق ورسم مستقبل قطاع التكنولوجيا فيه.",
    enableCareerGuidance: "تفعيل التوجيه المهني",
    videoAnalysis: "تحليل الفيديو",
    videoUrlPlaceholder: "تم اكتشاف رابط فيديو من يوتيوب أو فيسبوك.",
    keyMoments: "النقاط الرئيسية",
    analyzeContent: "تحليل المحتوى",
    clear: "مسح",
    summarizingVideo: "جارٍ تلخيص الفيديو...",
    findingKeyMoments: "جارٍ البحث عن النقاط الرئيسية...",
    analyzingVideo: "جارٍ تحليل الفيديو...",
    threatScanTitle: "فحص تهديدات الأمان",
    threatScanDesc: "حلل محادثاتك وإعدادات تطبيقك بحثًا عن تهديدات أمنية محتملة. لإجراء التحليل، يتم إرسال بياناتك إلى الذكاء الاصطناعي عبر اتصال آمن ومشفّر. على الرغم من أنها ليست مشفرة من طرف إلى طرف (يحتاج الذكاء الاصطناعي لقراءتها)، فإن بياناتك محمية أثناء النقل.",
    startScan: "بدء الفحص",
    scanning: "جاري الفحص...",
    scanComplete: "اكتمل الفحص",
    noThreatsFound: "لم يتم العثور على تهديدات أمنية. تبدو بياناتك نظيفة.",
    threatsFound: "تم العثور على {count} تهديدات محتملة.",
    piiSectionTitle: "كشف البيانات الحساسة",
    piiDescription: "قد تحتوي الرسائل التالية على معلومات تعريف شخصية. ضع في اعتبارك حذفها لخصوصية أفضل.",
    linkSectionTitle: "روابط مشبوهة",
    linkDescription: "تم الإبلاغ عن الروابط التالية على أنها قد تكون مشبوهة. تجنب فتحها.",
    scanForThreats: "فحص التهديدات",
    inMessage: "في رسالة:",
    flaggedUrl: "الرابط المبلغ عنه:",
    reason: "السبب:",
    errorThreatScan: "تعذر إكمال فحص الأمان. يرجى المحاولة مرة أخرى لاحقًا.",
    appScanSectionTitle: "تحليل أمان التطبيق",
    appScanDescription: "قد تشكل تكوينات الإعدادات التالية خطرًا أمنيًا.",
    setting: "الإعداد",
    issue: "المشكلة المحتملة",
    recommendation: "التوصية",
    applyRecommendations: "تطبيق التوصيات",
    recommendationsApplied: "تم تطبيق التوصيات!",
    privacyPolicy: "سياسة الخصوصية",
    privacyPolicyTitle: "سياسة الخصوصية",
    privacyPolicyContent: `(المحتوى باللغة الإنجليزية)
Last updated: July 25, 2024

Betalive AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.

**1. Information We Collect**
- **Account Information:** When you register, we collect your email address and a password hash.
- **Conversation Data:** We collect the messages you send and receive to provide the chat functionality. If you enable "Save Conversations," this data is stored in your browser's local storage.
- **Settings:** We store your application preferences and settings in local storage.
- **Usage Data:** If "Log Activity" is enabled, we may collect anonymous data about your interactions with the app to improve our services. This does not include conversation content.

**2. How We Use Your Information**
- To provide and maintain the application's features.
- To process your requests and send them to the Google Gemini API.
- To personalize your experience based on your settings.
- To improve the application with anonymous usage data.

**3. Data Sharing and Disclosure**
- **Google Gemini API:** Your conversation prompts are sent to Google's servers to generate responses. We do not control how Google uses this data. Please refer to Google's Privacy Policy.
- **No Other Third Parties:** We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.

**4. Data Storage and Security**
- Your account data, conversations (if saved), and settings are stored in your browser's local storage on your device.
- We implement security measures to protect your data, but no method of transmission over the Internet or method of electronic storage is 100% secure.

**5. Your Choices**
- You can manage your privacy settings within the app's Settings panel.
- You can choose not to save conversations, which will delete them when you close the session.
- You can delete your account and all associated data.

**6. Contact Us**
If you have any questions about this Privacy Policy, please contact us at privacy@betalive.dev.
`,
    conversationRetentionPolicyTitle: "سياسة الاحتفاظ بالمحادثات",
    retentionForever: "الاحتفاظ بها دائمًا",
    retentionOnClose: "الحذف عند الإغلاق",
    retentionPolicyDesc: "إذا كان 'حفظ المحادثات' مُفعّلاً، فإن خيار 'الحذف عند الإغلاق' يوفر تخزينًا مؤقتًا.",
    textToSpeechWarning: "لخصوصيتك، كن على دراية بمحيطك عند تفعيل هذه الميزة حيث تتم قراءة الردود بصوت عالٍ.",
    logActivityDesc: "يساعد في تحسين التطبيق عن طريق تسجيل تفاعلات المستخدم مجهولة الهوية. لا يتم تسجيل محتوى المحادثة مطلقًا.",
    // Auth & Security
    loginTitle: "تسجيل الدخول",
    registerTitle: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    login: "تسجيل الدخول",
    register: "تسجيل",
    switchToRegister: "ليس لديك حساب؟ سجل الآن",
    switchToLogin: "هل لديك حساب بالفعل؟ سجل الدخول",
    logout: "تسجيل الخروج",
    errorUserExists: "هذا البريد الإلكتروني مسجل بالفعل.",
    errorUserNotFound: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    errorPasswordMatch: "كلمتا المرور غير متطابقتين.",
    errorInvalidEmail: "البريد الإلكتروني غير صالح.",
    errorPasswordWeak: "كلمة المرور ضعيفة جدًا.",
    passwordStrength: "قوة كلمة المرور",
    strengthWeak: "ضعيفة",
    strengthMedium: "متوسطة",
    strengthStrong: "قوية",
    accountAndSecurity: "الحساب والأمان",
    changePassword: "تغيير كلمة المرور",
    twoFactorAuth: "المصادقة الثنائية",
    activeSessions: "الجلسات النشطة",
    accountActions: "إجراءات الحساب",
    exportData: "تصدير بياناتي",
    deleteAccount: "حذف الحساب",
    developerMode: "وضع المطور",
    advanced: "متقدم",
    enable2FA: "تمكين المصادقة الثنائية",
    disable2FA: "تعطيل المصادقة الثنائية",
    "2faDescription": "أضف طبقة إضافية من الأمان إلى حسابك. امسح رمز الاستجابة السريعة هذا باستخدام تطبيق المصادقة الخاص بك.",
    verificationCode: "رمز التحقق",
    verifyCode: "تحقق",
    "2faEnabledSuccess": "تم تمكين المصادقة الثنائية بنجاح.",
    "2faDisabledSuccess": "تم تعطيل المصادقة الثنائية بنجاح.",
    currentDevice: "الجهاز الحالي",
    lastActive: "آخر نشاط",
    confirmDeleteAccount: "هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه. أدخل بريدك الإلكتروني للتأكيد.",
    privacyCheckup: "فحص الخصوصية",
    privacyCheckupDesc: "قم بمراجعة إعدادات الخصوصية الرئيسية الخاصة بك بسرعة.",
    // New Developer Mode
    developerOptions: "خيارات المطور",
    apiCallInspector: "مفتش استدعاءات API",
    viewApiLogs: "عرض سجلات API",
    enableApiLogging: "تمكين تسجيل استدعاءات API",
    apiLoggingDesc: "يسجل طلبات واستجابات API الخام لأغراض التصحيح.",
    privacySandbox: "صندوق حماية الخصوصية",
    enablePrivacySandbox: "تمكين صندوق حماية الخصوصية",
    privacySandboxDesc: "تفعيل ميزات اختبار الخصوصية التجريبية مثل تنقيح PII.",
    forceEphemeral: "فرض الجلسات المؤقتة",
    forceEphemeralDesc: "يتجاوز إعدادات المستخدم ويحذف جميع المحادثات عند تسجيل الخروج.",
    request: "الطلب",
    response: "الاستجابة",
    noApiLogs: "لم يتم تسجيل أي استدعاءات API بعد.",
    redactedMessageTooltip: "تم تنقيح هذه الرسالة بواسطة صندوق حماية الخصوصية.",
    // New PIN Protection
    pinModalTitle: "الوصول للمطور",
    pinModalPrompt: "أدخل رمز PIN لتمكين وضع المطور.",
    pinModalError: "رمز PIN غير صحيح. يرجى المحاولة مرة أخرى.",
    verifyPin: "تحقق",
    // New Experimental Features
    sensitiveTopicWarningTooltip: "قد تحتوي هذه الرسالة على مواضيع حساسة.",
    configure: "تكوين",
    redactionLevel: "مستوى التنقيح",
    standardRedaction: "تنقيح قياسي",
    standardRedactionDesc: "ينقح معلومات التعريف الشخصية الشائعة مثل رسائل البريد الإلكتروني وأرقام الهواتف.",
    aggressiveRedaction: "تنقيح متقدم",
    aggressiveRedactionDesc: "يحاول أيضًا تنقيح الأسماء المحتملة والعناوين الفعلية.",
    sensitiveTopicWarning: "التحذير من المواضيع الحساسة",
    sensitiveTopicWarningDesc: "يضع علامة على رسائل المستخدم التي قد تحتوي على مواضيع حساسة دون تنقيحها.",
    systemPromptOverride: "تجاوز موجه النظام",
    systemPromptOverrideDesc: "يتجاوز بشكل مؤقت موجهات النظام الافتراضية والمخصصة لهذه الجلسة فقط. امسح النص لإعادة التعيين.",
    systemPromptOverridePlaceholder: "مثال: أنت مساعد ساخر يرد بتهكم دائمًا.",
    simulateLatency: "محاكاة زمن استجابة الشبكة",
    simulateLatencyDesc: "يضيف تأخيرًا مصطنعًا لاستجابات الذكاء الاصطناعي لاختبار حالات التحميل.",
    devOverrideActive: "التجاوز نشط",
    // Quick Actions
    quickActions: "إجراءات سريعة",
    writingTools: "أدوات الكتابة",
    improveWriting: "تحسين الكتابة",
    summarizeText: "تلخيص النص",
    changeTone: "تغيير النبرة",
    translate: "ترجمة",
    ideaGeneration: "توليد الأفكار",
    brainstormIdeas: "عصف ذهني للأفكار",
    writePoem: "كتابة قصيدة",
    createStory: "إنشاء قصة",
    tone_professional: " احترافي",
    tone_casual: "غير رسمي",
    tone_friendly: "ودي",
    selectLanguage: "اختر لغة",
    generatingAction: "الذكاء الاصطناعي يعمل...",
    errorQuickAction: "عذراً، لم أتمكن من إكمال هذا الإجراء. يرجى المحاولة مرة أخرى.",
    actionRequiresText: "يتطلب هذا الإجراء كتابة بعض النصوص أولاً.",
    codeTools: "أدوات المبرمج",
    explainCode: "شرح الكود",
    debugCode: "تصحيح الكود",
    optimizeCode: "تحسين الكود",
    // New Modular Architecture
    thirdPartyIntegrationsTitle: "تكوين عمليات التكامل",
    thirdPartyIntegrationsDesc: "قم بتمكين وتكوين نماذج الذكاء الاصطناعي من جهات خارجية.",
    enableThirdPartyIntegrations: "تمكين إطار التكامل",
    openaiApiKey: "مفتاح OpenAI API",
    activeModel: "النموذج النشط",
    modelGemini: "Google Gemini (الافتراضي)",
    modelOpenAI: "OpenAI GPT-4 (محاكاة)",
    integrationCodeTitle: "عنصر واجهة قابل للتضمين",
    integrationCodeDesc: "انسخ أحد القصاصات أدناه لتضمين أداة الدردشة Betalive AI مباشرة في موقعك. الأداة تعمل بكامل طاقتها وتتصل بإعدادات حسابك.",
    yourApiKey: "مفتاح API لموقع الويب الخاص بك",
    generateNewKey: "إنشاء مفتاح جديد",
    copyCode: "نسخ الكود",
    copied: "تم النسخ!",
    embeddableWidget: "عنصر واجهة قابل للتضمين",
    fullSnippetTitle: "موصى به: Iframe مع حاوية",
    fullSnippetDesc: "حاوية منسقة لعرض نظيف.",
    htmlOnlySnippetTitle: "HTML فقط",
    htmlOnlySnippetDesc: "علامة iframe فقط بدون تنسيق.",
    // New PII Warning
    piiSendWarningTitle: "تحذير قبل إرسال معلومات حساسة",
    piiSendWarningDesc: "عرض تنبيه تأكيد قبل إرسال الرسائل التي قد تحتوي على معلومات شخصية مثل رسائل البريد الإلكتروني أو أرقام الهواتف.",
    piiModalTitle: "تحذير بشأن معلومات حساسة",
    piiModalContent: "قد تحتوي رسالتك على معلومات شخصية حساسة. هل أنت متأكد من أنك تريد إرسالها؟",
    piiSendAnyway: "إرسال على أي حال",
    // New Responsible AI Policy
    responsibleAiPolicy: "سياسة الذكاء الاصطناعي المسؤول",
    responsibleAiPolicyTitle: "سياسة الذكاء الاصطناعي المسؤول",
    responsibleAiPolicyContent: `(المحتوى باللغة الإنجليزية)
**Our Commitment to Responsible AI**
Betalive AI is designed to be a helpful and harmless assistant. We are committed to developing and deploying artificial intelligence responsibly, guided by principles of fairness, accountability, and transparency.

**1. Intended Use**
This AI is intended for general information, creative tasks, and personal assistance. It should not be used for:
- Activities that are illegal, unethical, or harmful.
- Generating hate speech, harassment, or discriminatory content.
- Spreading misinformation or disinformation.
- Decisions in high-stakes domains (e.g., medical diagnosis, legal advice, financial planning) without professional human consultation.

**2. Safety and Harm Prevention**
We employ safety filters and content moderation to prevent the generation of unsafe or harmful content. Users are encouraged to report any inappropriate responses. We do not tolerate the use of our service for creating explicit, violent, or abusive material.

**3. Fairness and Bias**
AI models learn from vast amounts of data and may reflect existing societal biases. We are actively working to reduce bias and promote fairness. Users should be aware that AI-generated content can sometimes be inaccurate or biased and should use critical judgment.

**4. Transparency**
We believe you should know when you are interacting with an AI. This application clearly identifies itself as an AI assistant powered by Google's Gemini models. Your conversations may be used (with privacy-preserving techniques) to improve our services if you opt-in via the 'Improve AI Models' setting.

**5. Accountability**
You are responsible for how you use the AI. Do not use it for harmful purposes. We are accountable for the system's behavior and are committed to addressing any issues that arise. If you have concerns, please contact us at support@betalive.dev.
`,
  },
  en: {
    chatTitle: "Betalive AI",
    chatSubtitle: "Your Smart Personal Assistant",
    settingsTitle: "Settings",
    ageVerificationTitle: "Age Verification",
    initialMessage: "Hello! I am your personal assistant, Betalive AI. How can I help you today?",
    appleIntelligenceInitialMessage: "Hello! I am Apple Intelligence, your personal assistant from Betalive AI. How may I help you?",
    inputPlaceholder: "Type your message or paste a video link...",
    errorApi: "Failed to initialize the AI assistant. Please ensure API key is configured.",
    errorGeneral: "Sorry, something went wrong. Please try again.",
    send: "Send",
    agePrompt: "Please enter your date of birth to continue. You must be 13 years old or older.",
    ageErrorDate: "Please enter your full date of birth.",
    ageError18: "You must be 13 years old or older to use this service.",
    year: "Year",
    month: "Month",
    day: "Day",
    verify: "Verify",
    done: "Done",
    generating: "Generating...",
    cancel: "Cancel",
    newChat: "New Chat",
    imageGenerating: "Generating an image of:",
    imageDone: "Here is the image you requested.",
    imagineHint: "Use /imagine <prompt> to generate an image.",
    playgroundError: "Failed to generate image. Please try again.",
    chatHistory: "Chat History",
    deleteChat: "Delete Chat",
    confirmDelete: "Are you sure you want to delete this chat?",
    delete: "Delete",
    general: "General",
    language: "Language",
    aiModelsTitle: "AI Models",
    aiModelsInfo: "This app operates as a client for the Google Gemini API. For security and technical reasons, it cannot run other models like Meta Llama directly. The toggles here adapt the AI's personality to simulate different models, but all responses are generated by Google Gemini.",
    openai: "OpenAI ChatGPT",
    meta: "Meta AI",
    amazon: "Amazon AI",
    microsoft: "Microsoft Copilot",
    appleIntelligenceTitle: "Apple Intelligence",
    appleIntelligenceDesc: "Enable enhanced AI features like image generation and Visual Lookup.",
    enableAppleIntelligence: "Enable Enhanced Features",
    voiceSettings: "Voice & Speech",
    enableVoiceCommands: "Enable Voice Commands",
    textToSpeech: "Read Responses Aloud",
    ttsVoice: "AI Voice",
    privacyAndSecurity: "Privacy & Security",
    allowMicrophone: "Allow Microphone Access",
    allowCamera: "Allow Camera Access",
    permissionDeniedMic: "Microphone access is disabled in settings.",
    permissionDeniedCam: "Camera access is disabled in settings.",
    saveConversations: "Save Conversations",
    logActivity: "Log Activity",
    improveAI: "Improve AI Models",
    searchingGoogle: "Searching with Google...",
    sources: "Sources:",
    webSearch: "Web Search",
    version: "Version",
    localCodeSectionTitle: "Custom Instructions",
    localCodeSectionDesc: "Provide custom instructions to define how the AI should respond. You can set a specific personality, tone, or rules for it to follow. Changes will apply to new conversations.",
    enableCustomInstructions: "Enable Custom Instructions",
    systemPromptPlaceholder: "e.g., You are a helpful assistant that speaks like a pirate.",
    appleIntelligenceWelcome: "Apple Intelligence",
    getDirections: "Get directions home",
    playPlaylist: "Play my road trip playlist",
    shareETA: "Share my ETA with a friend",
    carModeTitle: "Car Mode",
    enableCarMode: "Enable Car Mode",
    carModeWelcome: "Car Mode",
    carGetDirections: "Get directions to work",
    carPlayMusic: "Play my driving playlist",
    carCallContact: "Call Sarah",
    carPlaySong: "Play a song",
    carSearchMusic: "Search Music",
    proofread: "Proofread",
    rewrite: "Rewrite",
    summarize: "Summarize",
    attachImages: "Attach images",
    removeImage: "Remove image",
    visualLookupTitle: "Visual Lookup",
    visualLookupDesc: "Identify objects in an image or from your camera.",
    useCamera: "Use Camera",
    uploadImage: "Upload Image",
    capture: "Capture",
    identifying: "Identifying...",
    identify: "Identify",
    retake: "Retake",
    back: "Back",
    photoMetadataPrivacyTitle: "Photo Metadata Privacy",
    photoMetadataPrivacyDesc: "Strips identifying data from uploaded photos for enhanced privacy.",
    objectRecognition: "Object Recognition",
    close: "Close",
    enableCallIntegration: "Enable Calling & Messaging",
    enableCallIntegrationDesc: "Allows the AI to generate links for making calls or sending messages using your device's apps.",
    carModeInstructionsTitle: "Car Connection Guide",
    carModeInstruction1: "1. Connect your phone to your car's audio system using Bluetooth.",
    carModeInstruction2: "2. Make sure your phone's media audio is playing through your car speakers.",
    carModeInstruction3: "3. Interact with the AI using your voice for a true hands-free experience, or tap the quick-action buttons on the screen.",
    carModeInstruction4: "4. For your safety, only use the keyboard to type messages when your vehicle is fully stopped and parked.",
    carKeyboardWarning: "For safety, do not use the keyboard while driving.",
    hideIpAddressTitle: "Hide IP Address",
    hideIpAddressDesc: "Attempts to mask your IP address. For full protection, use a dedicated VPN service.",
    locationAccessTitle: "Location Access",
    locationAccessDenied: "Deny",
    locationAccessApproximate: "Approximate",
    locationAccessGranted: "Allow",
    securityReportTitle: "Security Report",
    viewSecurityReport: "View Security Report",
    yourSecurityScore: "Your Security Score",
    securityStatus: "Security Status",
    securityRecTitle: "Recommendations",
    recSaveConvo: "Disable 'Save Conversations' for maximum privacy.",
    recMic: "Turn off microphone access when not in use.",
    recCam: "Turn off camera access when not in use.",
    recPhoto: "Turn on 'Photo Metadata Privacy' to strip data from images.",
    recIp: "Turn on 'Hide IP Address' for an extra layer of privacy.",
    recLocation: "Set 'Location Access' to 'Deny' or 'Approximate'.",
    allGood: "All good! Your security settings are excellent.",
    speechRecognitionTitle: "Speech Recognition",
    speechRecognitionDesc: "Allows the app to recognize your voice for commands. Compatibility may vary by browser and device (e.g., Android vs. iOS).",
    nowPlaying: "Now Playing",
    unknownSong: "Unknown Song",
    unknownArtist: "Unknown Artist",
    stopMusic: "Stop Music",
    openInYouTube: "Open in YouTube",
    openInSpotify: "Open in Spotify",
    couldNotPlaySuffix: "\n\nI couldn't find a video to play automatically, but you can try the links below.",
    iraqiCultureTitle: "Iraqi Culture & History",
    exploreMuseum: "Explore the Iraqi Museum",
    historyOfBaghdad: "History of Baghdad",
    whoIsHammurabi: "Who was Hammurabi?",
    iraqiCuisine: "Famous Iraqi Cuisine",
    codingInIraq: "Importance of coding in Iraq",
    devJobsForGrads: "Software jobs for graduates",
    iraqiTalentTitle: "Iraqi Coder Initiative",
    iraqiTalentDesc: "Explore how software development is creating new job opportunities for graduates in Iraq and shaping the future of its tech industry.",
    enableCareerGuidance: "Enable Career Guidance",
    videoAnalysis: "Video Analysis",
    videoUrlPlaceholder: "YouTube or Facebook video link detected.",
    keyMoments: "Key Moments",
    analyzeContent: "Analyze Content",
    clear: "Clear",
    summarizingVideo: "Summarizing video...",
    findingKeyMoments: "Finding key moments...",
    analyzingVideo: "Analyzing video...",
    threatScanTitle: "Security Threat Scan",
    threatScanDesc: "Analyze your conversations and app settings for potential security threats. For analysis, your data is sent to the AI over a secure, encrypted connection. While not end-to-end encrypted (the AI needs to read it), your data is protected in transit.",
    startScan: "Start Scan",
    scanning: "Scanning...",
    scanComplete: "Scan Complete",
    noThreatsFound: "No security threats found. Your data looks clean.",
    threatsFound: "{count} potential threats found.",
    piiSectionTitle: "Sensitive Data Exposure",
    piiDescription: "The following messages may contain personally identifiable information. Consider deleting them for better privacy.",
    linkSectionTitle: "Suspicious Links",
    linkDescription: "The following links were flagged as potentially suspicious. Avoid opening them.",
    scanForThreats: "Scan for Threats",
    inMessage: "In message:",
    flaggedUrl: "Flagged URL:",
    reason: "Reason:",
    errorThreatScan: "Could not complete the security scan. Please try again later.",
    appScanSectionTitle: "App Security Analysis",
    appScanDescription: "The following settings configurations may pose a security risk.",
    setting: "Setting",
    issue: "Potential Issue",
    recommendation: "Recommendation",
    applyRecommendations: "Apply Recommendations",
    recommendationsApplied: "Recommendations Applied!",
    privacyPolicy: "Privacy Policy",
    privacyPolicyTitle: "Privacy Policy",
    privacyPolicyContent: `
Last updated: July 25, 2024

Betalive AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.

**1. Information We Collect**
- **Account Information:** When you register, we collect your email address and a password hash.
- **Conversation Data:** We collect the messages you send and receive to provide the chat functionality. If you enable "Save Conversations," this data is stored in your browser's local storage.
- **Settings:** We store your application preferences and settings in local storage.
- **Usage Data:** If "Log Activity" is enabled, we may collect anonymous data about your interactions with the app to improve our services. This does not include conversation content.

**2. How We Use Your Information**
- To provide and maintain the application's features.
- To process your requests and send them to the Google Gemini API.
- To personalize your experience based on your settings.
- To improve the application with anonymous usage data.

**3. Data Sharing and Disclosure**
- **Google Gemini API:** Your conversation prompts are sent to Google's servers to generate responses. We do not control how Google uses this data. Please refer to Google's Privacy Policy.
- **No Other Third Parties:** We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.

**4. Data Storage and Security**
- Your account data, conversations (if saved), and settings are stored in your browser's local storage on your device.
- We implement security measures to protect your data, but no method of transmission over the Internet or method of electronic storage is 100% secure.

**5. Your Choices**
- You can manage your privacy settings within the app's Settings panel.
- You can choose not to save conversations, which will delete them when you close the session.
- You can delete your account and all associated data.

**6. Contact Us**
If you have any questions about this Privacy Policy, please contact us at privacy@betalive.dev.
`,
    conversationRetentionPolicyTitle: "Conversation Retention Policy",
    retentionForever: "Keep Forever",
    retentionOnClose: "Delete on Close",
    retentionPolicyDesc: "If 'Save Conversations' is on, 'Delete on Close' offers ephemeral storage.",
    textToSpeechWarning: "For your privacy, be aware of your surroundings when enabling this feature as responses are read aloud.",
    logActivityDesc: "Helps improve the app by logging anonymous user interactions. Conversation content is never logged.",
    // Auth & Security
    loginTitle: "Login",
    registerTitle: "Create Account",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    login: "Login",
    register: "Register",
    switchToRegister: "Don't have an account? Sign up",
    switchToLogin: "Already have an account? Log in",
    logout: "Logout",
    errorUserExists: "This email is already registered.",
    errorUserNotFound: "Incorrect email or password.",
    errorPasswordMatch: "Passwords do not match.",
    errorInvalidEmail: "Invalid email address.",
    errorPasswordWeak: "Password is too weak.",
    passwordStrength: "Password Strength",
    strengthWeak: "Weak",
    strengthMedium: "Medium",
    strengthStrong: "Strong",
    accountAndSecurity: "Account & Security",
    changePassword: "Change Password",
    twoFactorAuth: "Two-Factor Authentication",
    activeSessions: "Active Sessions",
    accountActions: "Account Actions",
    exportData: "Export My Data",
    deleteAccount: "Delete Account",
    developerMode: "Developer Mode",
    advanced: "Advanced",
    enable2FA: "Enable Two-Factor Authentication",
    disable2FA: "Disable Two-Factor Authentication",
    "2faDescription": "Add an extra layer of security to your account. Scan this QR code with your authenticator app.",
    verificationCode: "Verification Code",
    verifyCode: "Verify",
    "2faEnabledSuccess": "Two-Factor Authentication enabled successfully.",
    "2faDisabledSuccess": "Two-Factor Authentication disabled successfully.",
    currentDevice: "Current Device",
    lastActive: "Last Active",
    confirmDeleteAccount: "Are you sure? This action cannot be undone. Enter your email to confirm.",
    privacyCheckup: "Privacy Checkup",
    privacyCheckupDesc: "Quickly review your key privacy settings.",
    // New Developer Mode
    developerOptions: "Developer Options",
    apiCallInspector: "API Call Inspector",
    viewApiLogs: "View API Logs",
    enableApiLogging: "Enable API Call Logging",
    apiLoggingDesc: "Logs raw API requests and responses for debugging purposes.",
    privacySandbox: "Privacy Sandbox",
    enablePrivacySandbox: "Enable Privacy Sandbox",
    privacySandboxDesc: "Activate experimental privacy-testing features like PII redaction.",
    forceEphemeral: "Force Ephemeral Sessions",
    forceEphemeralDesc: "Overrides user settings and deletes all conversations on logout.",
    request: "Request",
    response: "Response",
    noApiLogs: "No API calls have been logged yet.",
    redactedMessageTooltip: "This message was redacted by the Privacy Sandbox.",
    // New PIN Protection
    pinModalTitle: "Developer Access",
    pinModalPrompt: "Enter PIN to enable Developer Mode.",
    pinModalError: "Incorrect PIN. Please try again.",
    verifyPin: "Verify",
    // New Experimental Features
    sensitiveTopicWarningTooltip: "This message may contain sensitive topics.",
    configure: "Configure",
    redactionLevel: "Redaction Level",
    standardRedaction: "Standard Redaction",
    standardRedactionDesc: "Redacts common PII like emails and phone numbers.",
    aggressiveRedaction: "Aggressive Redaction",
    aggressiveRedactionDesc: "Also attempts to redact potential names and physical addresses.",
    sensitiveTopicWarning: "Sensitive Topic Warning",
    sensitiveTopicWarningDesc: "Flags user messages that may contain sensitive topics without redacting them.",
    systemPromptOverride: "System Prompt Override",
    systemPromptOverrideDesc: "Temporarily override the default and custom system prompts for this session only. Clear the text to reset.",
    systemPromptOverridePlaceholder: "e.g., You are a sarcastic assistant who always responds with witty comebacks.",
    simulateLatency: "Simulate Network Latency",
    simulateLatencyDesc: "Adds an artificial delay to AI responses to test loading states.",
    devOverrideActive: "Override Active",
    // Quick Actions
    quickActions: "Quick Actions",
    writingTools: "Writing Tools",
    improveWriting: "Improve Writing",
    summarizeText: "Summarize Text",
    changeTone: "Change Tone",
    translate: "Translate",
    ideaGeneration: "Idea Generation",
    brainstormIdeas: "Brainstorm Ideas",
    writePoem: "Write a Poem",
    createStory: "Create a Story",
    tone_professional: "Professional",
    tone_casual: "Casual",
    tone_friendly: "Friendly",
    selectLanguage: "Select a language",
    generatingAction: "AI is working...",
    errorQuickAction: "Sorry, I couldn't complete that action. Please try again.",
    actionRequiresText: "This action requires you to write some text first.",
    codeTools: "Code Tools",
    explainCode: "Explain Code",
    debugCode: "Debug Code",
    optimizeCode: "Optimize Code",
    // New Modular Architecture
    thirdPartyIntegrationsTitle: "Configure Integrations",
    thirdPartyIntegrationsDesc: "Enable and configure third-party AI models.",
    enableThirdPartyIntegrations: "Enable Integration Framework",
    openaiApiKey: "OpenAI API Key",
    activeModel: "Active Model",
    modelGemini: "Google Gemini (Default)",
    modelOpenAI: "OpenAI GPT-4 (Simulated)",
    integrationCodeTitle: "Embeddable Widget",
    integrationCodeDesc: "Copy one of the snippets below to embed the Betalive AI chat widget directly on your site. The widget is fully functional and connects to your account settings.",
    yourApiKey: "Your Website API Key",
    generateNewKey: "Generate New Key",
    copyCode: "Copy Code",
    copied: "Copied!",
    embeddableWidget: "Embeddable Widget",
    fullSnippetTitle: "Recommended: Iframe with Container",
    fullSnippetDesc: "A styled container for clean presentation.",
    htmlOnlySnippetTitle: "HTML Only",
    htmlOnlySnippetDesc: "Just the iframe tag with no styling.",
    // New PII Warning
    piiSendWarningTitle: "Warn Before Sending Sensitive Info",
    piiSendWarningDesc: "Show a confirmation alert before sending messages that may contain personal information like emails or phone numbers.",
    piiModalTitle: "Sensitive Information Warning",
    piiModalContent: "Your message may contain sensitive personal information. Are you sure you want to send it?",
    piiSendAnyway: "Send Anyway",
    // New Responsible AI Policy
    responsibleAiPolicy: "Responsible AI Policy",
    responsibleAiPolicyTitle: "Responsible AI Policy",
    responsibleAiPolicyContent: `
**Our Commitment to Responsible AI**
Betalive AI is designed to be a helpful and harmless assistant. We are committed to developing and deploying artificial intelligence responsibly, guided by principles of fairness, accountability, and transparency.

**1. Intended Use**
This AI is intended for general information, creative tasks, and personal assistance. It should not be used for:
- Activities that are illegal, unethical, or harmful.
- Generating hate speech, harassment, or discriminatory content.
- Spreading misinformation or disinformation.
- Decisions in high-stakes domains (e.g., medical diagnosis, legal advice, financial planning) without professional human consultation.

**2. Safety and Harm Prevention**
We employ safety filters and content moderation to prevent the generation of unsafe or harmful content. Users are encouraged to report any inappropriate responses. We do not tolerate the use of our service for creating explicit, violent, or abusive material.

**3. Fairness and Bias**
AI models learn from vast amounts of data and may reflect existing societal biases. We are actively working to reduce bias and promote fairness. Users should be aware that AI-generated content can sometimes be inaccurate or biased and should use critical judgment.

**4. Transparency**
We believe you should know when you are interacting with an AI. This application clearly identifies itself as an AI assistant powered by Google's Gemini models. Your conversations may be used (with privacy-preserving techniques) to improve our services if you opt-in via the 'Improve AI Models' setting.

**5. Accountability**
You are responsible for how you use the AI. Do not use it for harmful purposes. We are accountable for the system's behavior and are committed to addressing any issues that arise. If you have any concerns, please contact us at support@betalive.dev.
`,
  },
  aii: { // Aramaic - assuming this is a placeholder or requires specific handling
    // Copying English as a fallback for now.
    ...({
    chatTitle: "Betalive AI",
    chatSubtitle: "Your Smart Personal Assistant",
    settingsTitle: "Settings",
    ageVerificationTitle: "Age Verification",
    initialMessage: "Hello! I am your personal assistant, Betalive AI. How can I help you today?",
    appleIntelligenceInitialMessage: "Hello! I am Apple Intelligence, your personal assistant from Betalive AI. How may I help you?",
    inputPlaceholder: "Type your message or paste a video link...",
    errorApi: "Failed to initialize the AI assistant. Please ensure API key is configured.",
    errorGeneral: "Sorry, something went wrong. Please try again.",
    send: "Send",
    agePrompt: "Please enter your date of birth to continue. You must be 13 years old or older.",
    ageErrorDate: "Please enter your full date of birth.",
    ageError18: "You must be 13 years old or older to use this service.",
    year: "Year",
    month: "Month",
    day: "Day",
    verify: "Verify",
    done: "Done",
    generating: "Generating...",
    cancel: "Cancel",
    newChat: "New Chat",
    imageGenerating: "Generating an image of:",
    imageDone: "Here is the image you requested.",
    imagineHint: "Use /imagine <prompt> to generate an image.",
    playgroundError: "Failed to generate image. Please try again.",
    chatHistory: "Chat History",
    deleteChat: "Delete Chat",
    confirmDelete: "Are you sure you want to delete this chat?",
    delete: "Delete",
    general: "General",
    language: "Language",
    aiModelsTitle: "AI Models",
    aiModelsInfo: "This app operates as a client for the Google Gemini API. For security and technical reasons, it cannot run other models like Meta Llama directly. The toggles here adapt the AI's personality to simulate different models, but all responses are generated by Google Gemini.",
    openai: "OpenAI ChatGPT",
    meta: "Meta AI",
    amazon: "Amazon AI",
    microsoft: "Microsoft Copilot",
    appleIntelligenceTitle: "Apple Intelligence",
    appleIntelligenceDesc: "Enable enhanced AI features like image generation and Visual Lookup.",
    enableAppleIntelligence: "Enable Enhanced Features",
    voiceSettings: "Voice & Speech",
    enableVoiceCommands: "Enable Voice Commands",
    textToSpeech: "Read Responses Aloud",
    ttsVoice: "AI Voice",
    privacyAndSecurity: "Privacy & Security",
    allowMicrophone: "Allow Microphone Access",
    allowCamera: "Allow Camera Access",
    permissionDeniedMic: "Microphone access is disabled in settings.",
    permissionDeniedCam: "Camera access is disabled in settings.",
    saveConversations: "Save Conversations",
    logActivity: "Log Activity",
    improveAI: "Improve AI Models",
    searchingGoogle: "Searching with Google...",
    sources: "Sources:",
    webSearch: "Web Search",
    version: "Version",
    localCodeSectionTitle: "Custom Instructions",
    localCodeSectionDesc: "Provide custom instructions to define how the AI should respond. You can set a specific personality, tone, or rules for it to follow. Changes will apply to new conversations.",
    enableCustomInstructions: "Enable Custom Instructions",
    systemPromptPlaceholder: "e.g., You are a helpful assistant that speaks like a pirate.",
    appleIntelligenceWelcome: "Apple Intelligence",
    getDirections: "Get directions home",
    playPlaylist: "Play my road trip playlist",
    shareETA: "Share my ETA with a friend",
    carModeTitle: "Car Mode",
    enableCarMode: "Enable Car Mode",
    carModeWelcome: "Car Mode",
    carGetDirections: "Get directions to work",
    carPlayMusic: "Play my driving playlist",
    carCallContact: "Call Sarah",
    carPlaySong: "Play a song",
    carSearchMusic: "Search Music",
    proofread: "Proofread",
    rewrite: "Rewrite",
    summarize: "Summarize",
    attachImages: "Attach images",
    removeImage: "Remove image",
    visualLookupTitle: "Visual Lookup",
    visualLookupDesc: "Identify objects in an image or from your camera.",
    useCamera: "Use Camera",
    uploadImage: "Upload Image",
    capture: "Capture",
    identifying: "Identifying...",
    identify: "Identify",
    retake: "Retake",
    back: "Back",
    photoMetadataPrivacyTitle: "Photo Metadata Privacy",
    photoMetadataPrivacyDesc: "Strips identifying data from uploaded photos for enhanced privacy.",
    objectRecognition: "Object Recognition",
    close: "Close",
    enableCallIntegration: "Enable Calling & Messaging",
    enableCallIntegrationDesc: "Allows the AI to generate links for making calls or sending messages using your device's apps.",
    carModeInstructionsTitle: "Car Connection Guide",
    carModeInstruction1: "1. Connect your phone to your car's audio system using Bluetooth.",
    carModeInstruction2: "2. Make sure your phone's media audio is playing through your car speakers.",
    carModeInstruction3: "3. Interact with the AI using your voice for a true hands-free experience, or tap the quick-action buttons on the screen.",
    carModeInstruction4: "4. For your safety, only use the keyboard to type messages when your vehicle is fully stopped and parked.",
    carKeyboardWarning: "For safety, do not use the keyboard while driving.",
    hideIpAddressTitle: "Hide IP Address",
    hideIpAddressDesc: "Attempts to mask your IP address. For full protection, use a dedicated VPN service.",
    locationAccessTitle: "Location Access",
    locationAccessDenied: "Deny",
    locationAccessApproximate: "Approximate",
    locationAccessGranted: "Allow",
    securityReportTitle: "Security Report",
    viewSecurityReport: "View Security Report",
    yourSecurityScore: "Your Security Score",
    securityStatus: "Security Status",
    securityRecTitle: "Recommendations",
    recSaveConvo: "Disable 'Save Conversations' for maximum privacy.",
    recMic: "Turn off microphone access when not in use.",
    recCam: "Turn off camera access when not in use.",
    recPhoto: "Turn on 'Photo Metadata Privacy' to strip data from images.",
    recIp: "Turn on 'Hide IP Address' for an extra layer of privacy.",
    recLocation: "Set 'Location Access' to 'Deny' or 'Approximate'.",
    allGood: "All good! Your security settings are excellent.",
    speechRecognitionTitle: "Speech Recognition",
    speechRecognitionDesc: "Allows the app to recognize your voice for commands. Compatibility may vary by browser and device (e.g., Android vs. iOS).",
    nowPlaying: "Now Playing",
    unknownSong: "Unknown Song",
    unknownArtist: "Unknown Artist",
    stopMusic: "Stop Music",
    openInYouTube: "Open in YouTube",
    openInSpotify: "Open in Spotify",
    couldNotPlaySuffix: "\n\nI couldn't find a video to play automatically, but you can try the links below.",
    iraqiCultureTitle: "Iraqi Culture & History",
    exploreMuseum: "Explore the Iraqi Museum",
    historyOfBaghdad: "History of Baghdad",
    whoIsHammurabi: "Who was Hammurabi?",
    iraqiCuisine: "Famous Iraqi Cuisine",
    codingInIraq: "Importance of coding in Iraq",
    devJobsForGrads: "Software jobs for graduates",
    iraqiTalentTitle: "Iraqi Coder Initiative",
    iraqiTalentDesc: "Explore how software development is creating new job opportunities for graduates in Iraq and shaping the future of its tech industry.",
    enableCareerGuidance: "Enable Career Guidance",
    videoAnalysis: "Video Analysis",
    videoUrlPlaceholder: "YouTube or Facebook video link detected.",
    keyMoments: "Key Moments",
    analyzeContent: "Analyze Content",
    clear: "Clear",
    summarizingVideo: "Summarizing video...",
    findingKeyMoments: "Finding key moments...",
    analyzingVideo: "Analyzing video...",
    threatScanTitle: "Security Threat Scan",
    threatScanDesc: "Analyze your conversations and app settings for potential security threats. For analysis, your data is sent to the AI over a secure, encrypted connection. While not end-to-end encrypted (the AI needs to read it), your data is protected in transit.",
    startScan: "Start Scan",
    scanning: "Scanning...",
    scanComplete: "Scan Complete",
    noThreatsFound: "No security threats found. Your data looks clean.",
    threatsFound: "{count} potential threats found.",
    piiSectionTitle: "Sensitive Data Exposure",
    piiDescription: "The following messages may contain personally identifiable information. Consider deleting them for better privacy.",
    linkSectionTitle: "Suspicious Links",
    linkDescription: "The following links were flagged as potentially suspicious. Avoid opening them.",
    scanForThreats: "Scan for Threats",
    inMessage: "In message:",
    flaggedUrl: "Flagged URL:",
    reason: "Reason:",
    errorThreatScan: "Could not complete the security scan. Please try again later.",
    appScanSectionTitle: "App Security Analysis",
    appScanDescription: "The following settings configurations may pose a security risk.",
    setting: "Setting",
    issue: "Potential Issue",
    recommendation: "Recommendation",
    applyRecommendations: "Apply Recommendations",
    recommendationsApplied: "Recommendations Applied!",
    privacyPolicy: "Privacy Policy",
    privacyPolicyTitle: "Privacy Policy",
    privacyPolicyContent: `
Last updated: July 25, 2024

Betalive AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.

**1. Information We Collect**
- **Account Information:** When you register, we collect your email address and a password hash.
- **Conversation Data:** We collect the messages you send and receive to provide the chat functionality. If you enable "Save Conversations," this data is stored in your browser's local storage.
- **Settings:** We store your application preferences and settings in local storage.
- **Usage Data:** If "Log Activity" is enabled, we may collect anonymous data about your interactions with the app to improve our services. This does not include conversation content.

**2. How We Use Your Information**
- To provide and maintain the application's features.
- To process your requests and send them to the Google Gemini API.
- To personalize your experience based on your settings.
- To improve the application with anonymous usage data.

**3. Data Sharing and Disclosure**
- **Google Gemini API:** Your conversation prompts are sent to Google's servers to generate responses. We do not control how Google uses this data. Please refer to Google's Privacy Policy.
- **No Other Third Parties:** We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.

**4. Data Storage and Security**
- Your account data, conversations (if saved), and settings are stored in your browser's local storage on your device.
- We implement security measures to protect your data, but no method of transmission over the Internet or method of electronic storage is 100% secure.

**5. Your Choices**
- You can manage your privacy settings within the app's Settings panel.
- You can choose not to save conversations, which will delete them when you close the session.
- You can delete your account and all associated data.

**6. Contact Us**
If you have any questions about this Privacy Policy, please contact us at privacy@betalive.dev.
`,
    conversationRetentionPolicyTitle: "Conversation Retention Policy",
    retentionForever: "Keep Forever",
    retentionOnClose: "Delete on Close",
    retentionPolicyDesc: "If 'Save Conversations' is on, 'Delete on Close' offers ephemeral storage.",
    textToSpeechWarning: "For your privacy, be aware of your surroundings when enabling this feature as responses are read aloud.",
    logActivityDesc: "Helps improve the app by logging anonymous user interactions. Conversation content is never logged.",
    // Auth & Security
    loginTitle: "Login",
    registerTitle: "Create Account",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    login: "Login",
    register: "Register",
    switchToRegister: "Don't have an account? Sign up",
    switchToLogin: "Already have an account? Log in",
    logout: "Logout",
    errorUserExists: "This email is already registered.",
    errorUserNotFound: "Incorrect email or password.",
    errorPasswordMatch: "Passwords do not match.",
    errorInvalidEmail: "Invalid email address.",
    errorPasswordWeak: "Password is too weak.",
    passwordStrength: "Password Strength",
    strengthWeak: "Weak",
    strengthMedium: "Medium",
    strengthStrong: "Strong",
    accountAndSecurity: "Account & Security",
    changePassword: "Change Password",
    twoFactorAuth: "Two-Factor Authentication",
    activeSessions: "Active Sessions",
    accountActions: "Account Actions",
    exportData: "Export My Data",
    deleteAccount: "Delete Account",
    developerMode: "Developer Mode",
    advanced: "Advanced",
    enable2FA: "Enable Two-Factor Authentication",
    disable2FA: "Disable Two-Factor Authentication",
    "2faDescription": "Add an extra layer of security to your account. Scan this QR code with your authenticator app.",
    verificationCode: "Verification Code",
    verifyCode: "Verify",
    "2faEnabledSuccess": "Two-Factor Authentication enabled successfully.",
    "2faDisabledSuccess": "Two-Factor Authentication disabled successfully.",
    currentDevice: "Current Device",
    lastActive: "Last Active",
    confirmDeleteAccount: "Are you sure? This action cannot be undone. Enter your email to confirm.",
    privacyCheckup: "Privacy Checkup",
    privacyCheckupDesc: "Quickly review your key privacy settings.",
    // New Developer Mode
    developerOptions: "Developer Options",
    apiCallInspector: "API Call Inspector",
    viewApiLogs: "View API Logs",
    enableApiLogging: "Enable API Call Logging",
    apiLoggingDesc: "Logs raw API requests and responses for debugging purposes.",
    privacySandbox: "Privacy Sandbox",
    enablePrivacySandbox: "Enable Privacy Sandbox",
    privacySandboxDesc: "Activate experimental privacy-testing features like PII redaction.",
    forceEphemeral: "Force Ephemeral Sessions",
    forceEphemeralDesc: "Overrides user settings and deletes all conversations on logout.",
    request: "Request",
    response: "Response",
    noApiLogs: "No API calls have been logged yet.",
    redactedMessageTooltip: "This message was redacted by the Privacy Sandbox.",
    // New PIN Protection
    pinModalTitle: "Developer Access",
    pinModalPrompt: "Enter PIN to enable Developer Mode.",
    pinModalError: "Incorrect PIN. Please try again.",
    verifyPin: "Verify",
    // New Experimental Features
    sensitiveTopicWarningTooltip: "This message may contain sensitive topics.",
    configure: "Configure",
    redactionLevel: "Redaction Level",
    standardRedaction: "Standard Redaction",
    standardRedactionDesc: "Redacts common PII like emails and phone numbers.",
    aggressiveRedaction: "Aggressive Redaction",
    aggressiveRedactionDesc: "Also attempts to redact potential names and physical addresses.",
    sensitiveTopicWarning: "Sensitive Topic Warning",
    sensitiveTopicWarningDesc: "Flags user messages that may contain sensitive topics without redacting them.",
    systemPromptOverride: "System Prompt Override",
    systemPromptOverrideDesc: "Temporarily override the default and custom system prompts for this session only. Clear the text to reset.",
    systemPromptOverridePlaceholder: "e.g., You are a sarcastic assistant who always responds with witty comebacks.",
    simulateLatency: "Simulate Network Latency",
    simulateLatencyDesc: "Adds an artificial delay to AI responses to test loading states.",
    devOverrideActive: "Override Active",
    // Quick Actions
    quickActions: "Quick Actions",
    writingTools: "Writing Tools",
    improveWriting: "Improve Writing",
    summarizeText: "Summarize Text",
    changeTone: "Change Tone",
    translate: "Translate",
    ideaGeneration: "Idea Generation",
    brainstormIdeas: "Brainstorm Ideas",
    writePoem: "Write a Poem",
    createStory: "Create a Story",
    tone_professional: "Professional",
    tone_casual: "Casual",
    tone_friendly: "Friendly",
    selectLanguage: "Select a language",
    generatingAction: "AI is working...",
    errorQuickAction: "Sorry, I couldn't complete that action. Please try again.",
    actionRequiresText: "This action requires you to write some text first.",
    codeTools: "Code Tools",
    explainCode: "Explain Code",
    debugCode: "Debug Code",
    optimizeCode: "Optimize Code",
    // New Modular Architecture
    thirdPartyIntegrationsTitle: "Configure Integrations",
    thirdPartyIntegrationsDesc: "Enable and configure third-party AI models.",
    enableThirdPartyIntegrations: "Enable Integration Framework",
    openaiApiKey: "OpenAI API Key",
    activeModel: "Active Model",
    modelGemini: "Google Gemini (Default)",
    modelOpenAI: "OpenAI GPT-4 (Simulated)",
    integrationCodeTitle: "Embeddable Widget",
    integrationCodeDesc: "Copy one of the snippets below to embed the Betalive AI chat widget directly on your site. The widget is fully functional and connects to your account settings.",
    yourApiKey: "Your Website API Key",
    generateNewKey: "Generate New Key",
    copyCode: "Copy Code",
    copied: "Copied!",
    embeddableWidget: "Embeddable Widget",
    fullSnippetTitle: "Recommended: Iframe with Container",
    fullSnippetDesc: "A styled container for clean presentation.",
    htmlOnlySnippetTitle: "HTML Only",
    htmlOnlySnippetDesc: "Just the iframe tag with no styling.",
    // New PII Warning
    piiSendWarningTitle: "Warn Before Sending Sensitive Info",
    piiSendWarningDesc: "Show a confirmation alert before sending messages that may contain personal information like emails or phone numbers.",
    piiModalTitle: "Sensitive Information Warning",
    piiModalContent: "Your message may contain sensitive personal information. Are you sure you want to send it?",
    piiSendAnyway: "Send Anyway",
    // New Responsible AI Policy
    responsibleAiPolicy: "Responsible AI Policy",
    responsibleAiPolicyTitle: "Responsible AI Policy",
    responsibleAiPolicyContent: `
**Our Commitment to Responsible AI**
Betalive AI is designed to be a helpful and harmless assistant. We are committed to developing and deploying artificial intelligence responsibly, guided by principles of fairness, accountability, and transparency.

**1. Intended Use**
This AI is intended for general information, creative tasks, and personal assistance. It should not be used for:
- Activities that are illegal, unethical, or harmful.
- Generating hate speech, harassment, or discriminatory content.
- Spreading misinformation or disinformation.
- Decisions in high-stakes domains (e.g., medical diagnosis, legal advice, financial planning) without professional human consultation.

**2. Safety and Harm Prevention**
We employ safety filters and content moderation to prevent the generation of unsafe or harmful content. Users are encouraged to report any inappropriate responses. We do not tolerate the use of our service for creating explicit, violent, or abusive material.

**3. Fairness and Bias**
AI models learn from vast amounts of data and may reflect existing societal biases. We are actively working to reduce bias and promote fairness. Users should be aware that AI-generated content can sometimes be inaccurate or biased and should use critical judgment.

**4. Transparency**
We believe you should know when you are interacting with an AI. This application clearly identifies itself as an AI assistant powered by Google's Gemini models. Your conversations may be used (with privacy-preserving techniques) to improve our services if you opt-in via the 'Improve AI Models' setting.

**5. Accountability**
You are responsible for how you use the AI. Do not use it for harmful purposes. We are accountable for the system's behavior and are committed to addressing any issues that arise. If you have concerns, please contact us at support@betalive.dev.
`,
    })
  },
};

// --- CONSTANTS ---
const API_KEY = process.env.API_KEY;
const PII_REGEX = /(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i;
const APP_VERSION = "2.5.0"; // Incremented version
const DEV_PIN = "2024";

const defaultSettings: AppSettings = {
  language: 'en',
  enabledModels: { openai: true, meta: false, amazon: false, microsoft: false },
  voiceCommands: true,
  textToSpeech: false,
  ttsVoice: null,
  appleIntelligence: false,
  carMode: false,
  saveConversations: true,
  conversationRetentionPolicy: 'forever',
  logActivity: true,
  improveAI: true,
  useCustomSystemPrompt: false,
  customSystemPrompt: '',
  photoMetadataPrivacy: true,
  allowMicrophone: true,
  allowCamera: true,
  enableCallIntegration: true,
  hideIpAddress: false,
  locationAccess: 'approximate',
  piiSendWarning: true,
  enableCareerGuidance: true,
  developerMode: false,
  enableThirdPartyIntegrations: false,
  thirdPartyApiKeys: { openai: '' },
  activeThirdPartyModel: 'gemini',
  integrationApiKey: '',
  apiCallLogging: false,
  forceEphemeral: false,
  privacySandbox: false,
  privacySandboxRedactionLevel: 'standard',
  privacySandboxTopicWarning: false,

  developerLatencySimulation: 0,
};

// --- HELPER COMPONENTS ---
const Modal = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
);

const PolicyModalContent = ({ content }) => {
  const formattedContent = content.split('\n').map((paragraph, index) => {
    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
      return <h3 key={index} className="text-lg font-semibold text-sky-300 mt-4 mb-2">{paragraph.slice(2, -2)}</h3>;
    }
     if (paragraph.startsWith('- ')) {
      return <li key={index} className="ml-5 list-disc text-slate-300">{paragraph.slice(2)}</li>
    }
    return <p key={index} className="text-slate-300 mb-4">{paragraph}</p>;
  });

  return <>{formattedContent}</>;
}


const PrivacyPolicyModal = ({ t, onClose }) => (
  <Modal title={t.privacyPolicyTitle} onClose={onClose}>
    <div className="prose prose-invert text-slate-300">
      <PolicyModalContent content={t.privacyPolicyContent}/>
    </div>
    <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors">{t.done}</button>
    </div>
  </Modal>
);

const ResponsibleAiPolicyModal = ({ t, onClose }) => (
  <Modal title={t.responsibleAiPolicyTitle} onClose={onClose}>
    <div className="prose prose-invert text-slate-300">
      <PolicyModalContent content={t.responsibleAiPolicyContent}/>
    </div>
    <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors">{t.done}</button>
    </div>
  </Modal>
);

const PiiConfirmationModal = ({ t, onConfirm, onCancel }) => (
    <Modal title={t.piiModalTitle} onClose={onCancel}>
      <p className="text-slate-300">{t.piiModalContent}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="bg-slate-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">{t.cancel}</button>
        <button onClick={onConfirm} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors">{t.piiSendAnyway}</button>
      </div>
    </Modal>
);

const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`${
      checked ? 'bg-sky-500' : 'bg-slate-600'
    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
  >
    <span
      aria-hidden="true"
      className={`${
        checked ? 'translate-x-5' : 'translate-x-0'
      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
    />
  </button>
);


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  // State variables
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('betalive_users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [inputText, setInputText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [apiLogs, setApiLogs] = useState<ApiCallLog[]>([]);
  const [devSystemPrompt, setDevSystemPrompt] = useState('');


  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showVisualLookup, setShowVisualLookup] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showResponsibleAiPolicy, setShowResponsibleAiPolicy] = useState(false);
  const [piiConfirmation, setPiiConfirmation] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeQuickActionSubmenu, setActiveQuickActionSubmenu] = useState<null | 'tone' | 'translate'>(null);
  
  // Developer Mode Modals State
  const [showPinModal, setShowPinModal] = useState(false);
  const [showApiLogsModal, setShowApiLogsModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');


  // Refs and other hooks
  const aiRef = useRef<GoogleGenAI | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  const t = translations[settings.language] || translations.en;
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const isDevOverrideActive = settings.developerMode && (devSystemPrompt.trim() !== '' || settings.developerLatencySimulation > 0);

  // --- Effects ---

  // Check for a logged in user on app start
  useEffect(() => {
    const loggedInUserEmail = localStorage.getItem('betalive_currentUserEmail');
    if (loggedInUserEmail) {
        const user = users.find(u => u.email === loggedInUserEmail);
        if (user) {
            setCurrentUser(user);
            setAuthStatus('authenticated');
        } else {
            localStorage.removeItem('betalive_currentUserEmail');
            setAuthStatus('unauthenticated');
        }
    } else {
        setAuthStatus('unauthenticated');
    }
  }, []); // Run only on mount. `users` state is available.

  // Initialize AI
  useEffect(() => {
    if (API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: API_KEY });
    } else {
      setError(t.errorApi);
    }
  }, [t.errorApi]);

  // Load user data on auth change
  useEffect(() => {
    if (authStatus === 'authenticated' && currentUser) {
      setSettings(currentUser.settings);
      setSessions(currentUser.sessions);
      const lastSession = currentUser.sessions.length > 0 ? currentUser.sessions[currentUser.sessions.length-1].id : null;
      setCurrentSessionId(lastSession);
    } else {
      setSettings(defaultSettings);
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [authStatus, currentUser]);

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('betalive_users', JSON.stringify(users));
  }, [users]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);
  
  // Handle clicks outside of quick actions menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
        setActiveQuickActionSubmenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [quickActionsRef]);


  // --- Core Functions ---
  const handleLogout = () => {
    localStorage.removeItem('betalive_currentUserEmail');
    setCurrentUser(null);
    setAuthStatus('unauthenticated');
    setSessions([]);
    setCurrentSessionId(null);
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    if (!currentUser) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    const updatedUsers = users.map(user =>
      user.email === currentUser.email ? { ...user, settings: newSettings } : user
    );
    setUsers(updatedUsers);
  };
  
  const createNewSession = () => {
    if (!currentUser) return;
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    
    // Clear session-only dev overrides
    setDevSystemPrompt('');

     const updatedUsers = users.map(user =>
      user.email === currentUser.email ? { ...user, sessions: updatedSessions } : user
    );
    setUsers(updatedUsers);
  };
  
  const getSystemInstruction = (): Content | undefined => {
      // Dev override takes top priority
      if (settings.developerMode && devSystemPrompt.trim()) {
          return { role: 'system', parts: [{ text: devSystemPrompt.trim() }] };
      }
      
      let prompt = "";
      if (settings.useCustomSystemPrompt && settings.customSystemPrompt.trim()) {
        prompt += settings.customSystemPrompt.trim() + "\n\n";
      }

      const enabledModels = Object.entries(settings.enabledModels).filter(([, v]) => v).map(([k]) => k);
      if(enabledModels.length > 0) {
        prompt += `Simulate the personality and response style of the following AI models: ${enabledModels.join(', ')}. `;
      }

      if (settings.appleIntelligence) {
        prompt += "Respond as Apple Intelligence, focusing on user privacy, on-device processing concepts, and a clean, helpful tone. ";
      }

      if (settings.carMode) {
        prompt += "You are in Car Mode. Keep responses concise, clear, and focused on driving-related tasks. Prioritize safety. ";
      }
      
      return prompt.trim() ? { role: 'system', parts: [{ text: prompt }] } : undefined;
  };
  
  const initializeChat = () => {
        if (!aiRef.current) return;
        const systemInstruction = getSystemInstruction();
        const config: any = { model: 'gemini-2.5-flash' };
        if (systemInstruction) {
           config.systemInstruction = systemInstruction;
        }
        chatRef.current = AiService.createChat(aiRef.current, config);
    };

    const addMessage = (message: Partial<Message> & { role: Role; text: string; }) => {
        if (!currentSessionId) {
            // This should not happen if a session is created before sending a message
            console.error("No active session to add message to.");
            return;
        }
        const fullMessage: Message = {
            ...message,
            id: message.id || `msg_${Date.now()}`,
            timestamp: message.timestamp || Date.now(),
        };
        const updatedSessions = sessions.map(session => {
            if (session.id === currentSessionId) {
                return { ...session, messages: [...session.messages, fullMessage] };
            }
            return session;
        });
        setSessions(updatedSessions);
    };

  const executeSend = async (text: string, attachedImages: string[]) => {
      if (!aiRef.current || isGenerating) return;
      if (!currentSessionId) {
          console.error("Cannot send message, no session is active.");
          return;
      }

      setIsGenerating(true);
      setError(null);
      initializeChat(); // Re-initialize with latest settings

      addMessage({ role: 'user', text, images: attachedImages });
      // Add a placeholder for the model's response
      const modelMessageId = `msg_${Date.now() + 1}`;
      addMessage({ id: modelMessageId, role: 'model', text: '', isGenerating: true, timestamp: Date.now() + 1 });

      try {
          // Construct message parts
          const parts: Part[] = [{ text }];
          attachedImages.forEach(imgBase64 => {
              parts.push({
                  inlineData: {
                      mimeType: 'image/jpeg', // Assuming jpeg, could be improved
                      data: imgBase64,
                  },
              });
          });

          const requestParams = {
              model: 'gemini-2.5-flash',
              contents: { role: 'user', parts },
              systemInstruction: getSystemInstruction()
          };
          
          // Latency Simulation
          if (settings.developerMode && settings.developerLatencySimulation > 0) {
              await new Promise(resolve => setTimeout(resolve, settings.developerLatencySimulation));
          }

          // Send message
          const result = await AiService.generateContent(aiRef.current, settings, requestParams);
          
          // API Logging
          if (settings.apiCallLogging) {
              const log: ApiCallLog = {
                  id: `log_${Date.now()}`,
                  timestamp: Date.now(),
                  request: requestParams,
                  response: result, 
              };
              setApiLogs(prev => [...prev, log]);
          }

          const responseText = result.text;

          // Update the placeholder message with the actual response
          const updatedSessions = sessions.map(session => {
              if (session.id === currentSessionId) {
                  const updatedMessages = session.messages.map(msg =>
                      msg.id === modelMessageId
                          ? { ...msg, text: responseText, isGenerating: false }
                          : msg
                  );
                  return { ...session, messages: updatedMessages };
              }
              return session;
          });
          setSessions(updatedSessions);


      } catch (e) {
          console.error(e);
          setError(t.errorGeneral);
          // Remove the placeholder on error
          const updatedSessions = sessions.map(session => {
            if(session.id === currentSessionId) {
                return {...session, messages: session.messages.filter(m => m.id !== modelMessageId)}
            }
            return session;
          });
          setSessions(updatedSessions);
      } finally {
          setIsGenerating(false);
          setInputText('');
          setImages([]);
      }
  };
  
    const handleSend = async () => {
        const textToSend = inputText.trim();
        const imagesToSend = [...images];

        if (!textToSend && imagesToSend.length === 0) return;
        
        let currentSessionExists = sessions.some(s => s.id === currentSessionId);
        if (!currentSessionExists) {
           createNewSession();
           // Since state updates are async, we need to wait for the next render or handle it.
           // For simplicity, we'll just return and let the user click send again. A better UX would queue the message.
           // A quick fix is to execute send in a timeout to allow state to update
           setTimeout(() => executeSend(textToSend, imagesToSend), 0);
           return;
        }

        if (settings.piiSendWarning && PII_REGEX.test(textToSend)) {
          setPiiConfirmation(textToSend);
          return;
        }

        executeSend(textToSend, imagesToSend);
    };

    const handlePiiConfirmation = () => {
        if (piiConfirmation) {
            executeSend(piiConfirmation, images);
        }
        setPiiConfirmation(null);
    };


    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = (e.target?.result as string).split(',')[1];
                    setImages(prev => [...prev, base64]);
                };
                reader.readAsDataURL(file);
            });
        }
    };
    
    const executeQuickAction = (promptPrefix: string, promptSuffix: string = '', requiresText: boolean = true) => {
        const text = inputText.trim();
        if (requiresText && !text) {
            setError(t.actionRequiresText);
            setTimeout(() => setError(null), 3000);
            return;
        }

        const fullPrompt = `${promptPrefix}${text ? `:\n\n---\n\n${text}` : ''}${promptSuffix}`;
        
        setShowQuickActions(false);
        setActiveQuickActionSubmenu(null);

        let currentSessionExists = sessions.some(s => s.id === currentSessionId);
        if (!currentSessionExists) {
           createNewSession();
           setTimeout(() => executeSend(fullPrompt, images), 0);
        } else {
           executeSend(fullPrompt, images);
        }
    };
  
  // --- UI Components (Inline for brevity) ---
  
    const PinModal = ({ onClose }) => {
      const handlePinVerify = () => {
          if (pinInput === DEV_PIN) {
              updateSetting('developerMode', true);
              onClose();
          } else {
              setPinError(t.pinModalError);
              setPinInput('');
          }
      };

      return (
        <Modal title={t.pinModalTitle} onClose={onClose}>
            <p className="text-slate-300 mb-4">{t.pinModalPrompt}</p>
            <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePinVerify()}
                className="w-full p-2 rounded bg-slate-800 border border-slate-700 mb-2 text-center tracking-widest"
                maxLength={4}
                autoFocus
            />
            {pinError && <p className="text-red-400 text-sm mt-2">{pinError}</p>}
            <div className="mt-6 flex justify-end">
                <button onClick={handlePinVerify} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors">{t.verifyPin}</button>
            </div>
        </Modal>
      );
    };

    const ApiLogsModal = ({ onClose }) => (
      <Modal title={t.apiCallInspector} onClose={onClose}>
        <div className="space-y-4 max-h-[60vh]">
            {apiLogs.length === 0 ? (
                <p className="text-slate-400">{t.noApiLogs}</p>
            ) : (
                [...apiLogs].reverse().map(log => (
                    <div key={log.id} className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500">{new Date(log.timestamp).toISOString()}</p>
                        <div>
                            <h4 className="font-semibold text-sky-300 mt-2">{t.request}</h4>
                            <pre className="text-xs bg-slate-900 p-2 rounded-md overflow-x-auto"><code>{JSON.stringify(log.request, null, 2)}</code></pre>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sky-300 mt-2">{t.response}</h4>
                            <pre className="text-xs bg-slate-900 p-2 rounded-md overflow-x-auto"><code>{JSON.stringify(log.response, null, 2)}</code></pre>
                        </div>
                    </div>
                ))
            )}
        </div>
      </Modal>
    );

  const SettingsModal = ({ onClose }) => {
    
    const handleDevModeToggle = (checked: boolean) => {
        if (checked) {
            // Turning on, show PIN modal
            setPinInput('');
            setPinError('');
            setShowPinModal(true);
        } else {
            // Turning off
            updateSetting('developerMode', false);
            setDevSystemPrompt(''); // Clear session override
        }
    };
    
    const GeneralSection = () => (
      <div>
        <h3 className="text-lg font-semibold text-sky-300 mb-4">{t.general}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">{t.language}</label>
            <select value={settings.language} onChange={(e) => updateSetting('language', e.target.value)}
              className="mt-1 block w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500">
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>
      </div>
    );
    
    const PrivacySection = () => (
        <div>
            <h3 className="text-lg font-semibold text-sky-300 mt-6 mb-4">{t.privacyAndSecurity}</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                    <div>
                        <h4 className="font-semibold text-white">{t.saveConversations}</h4>
                        <p className="text-sm text-slate-400 mt-1">{t.retentionPolicyDesc}</p>
                    </div>
                    <Switch checked={settings.saveConversations} onChange={(checked) => updateSetting('saveConversations', checked)} />
                </div>
                 <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                    <div>
                        <h4 className="font-semibold text-white">{t.photoMetadataPrivacyTitle}</h4>
                        <p className="text-sm text-slate-400 mt-1">{t.photoMetadataPrivacyDesc}</p>
                    </div>
                    <Switch checked={settings.photoMetadataPrivacy} onChange={(checked) => updateSetting('photoMetadataPrivacy', checked)} />
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                    <div>
                        <h4 className="font-semibold text-white">{t.piiSendWarningTitle}</h4>
                        <p className="text-sm text-slate-400 mt-1">{t.piiSendWarningDesc}</p>
                    </div>
                    <Switch checked={settings.piiSendWarning} onChange={(checked) => updateSetting('piiSendWarning', checked)} />
                </div>
            </div>
        </div>
    );

    const AiModelsSection = () => (
      <div>
        <h3 className="text-lg font-semibold text-sky-300 mt-6 mb-4">{t.aiModelsTitle}</h3>
        <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg mb-4">{t.aiModelsInfo}</p>
        {/* ... toggles for different models ... */}
      </div>
    );

    const IraqiCultureSection = ({ t, settings, updateSetting }) => (
        <div>
          <h3 className="text-lg font-semibold text-sky-300 mt-6 mb-4">{t.iraqiCultureTitle}</h3>
           <div className="mt-4 flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <div>
              <h4 className="font-semibold text-white">{t.iraqiTalentTitle}</h4>
              <p className="text-sm text-slate-400 mt-1">{t.iraqiTalentDesc}</p>
            </div>
            <Switch checked={settings.enableCareerGuidance} onChange={(checked) => updateSetting('enableCareerGuidance', checked)} />
          </div>
        </div>
    );

    const AdvancedSection = () => (
        <div>
            <h3 className="text-lg font-semibold text-sky-300 mt-6 mb-4">{t.advanced}</h3>
            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                <div>
                    <h4 className="font-semibold text-white">{t.developerMode}</h4>
                </div>
                <Switch checked={settings.developerMode} onChange={handleDevModeToggle} />
            </div>
            {settings.developerMode && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-sky-500/30 animate-fade-in">
                    <h4 className="text-md font-bold text-sky-300 mb-4">{t.developerOptions}</h4>
                    <div className="space-y-5">
                         {/* API Logging */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h5 className="font-semibold text-white">{t.enableApiLogging}</h5>
                                <p className="text-sm text-slate-400 mt-1">{t.apiLoggingDesc}</p>
                            </div>
                            <Switch checked={settings.apiCallLogging} onChange={(c) => updateSetting('apiCallLogging', c)} />
                        </div>
                        {settings.apiCallLogging && <button onClick={() => setShowApiLogsModal(true)} className="text-sm text-sky-400 hover:underline">{t.viewApiLogs}</button>}

                        {/* System Prompt Override */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">{t.systemPromptOverride}</label>
                            <p className="text-xs text-slate-400 mb-2">{t.systemPromptOverrideDesc}</p>
                            <textarea
                                value={devSystemPrompt}
                                onChange={(e) => setDevSystemPrompt(e.target.value)}
                                placeholder={t.systemPromptOverridePlaceholder}
                                className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-y"
                                rows={3}
                            />
                        </div>

                        {/* Simulate Latency */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">{t.simulateLatency}</label>
                             <p className="text-xs text-slate-400 mb-2">{t.simulateLatencyDesc}</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.developerLatencySimulation}
                                    onChange={(e) => updateSetting('developerLatencySimulation', parseInt(e.target.value, 10) || 0)}
                                    className="w-24 bg-slate-800 border border-slate-600 rounded-md p-2 text-white"
                                />
                                <span>ms</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
      <Modal title={t.settingsTitle} onClose={onClose}>
        <div className="space-y-6">
          <GeneralSection />
          <PrivacySection />
          <AiModelsSection />
          <IraqiCultureSection t={t} settings={settings} updateSetting={updateSetting} />
          <AdvancedSection />

          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
            <div className="flex justify-center gap-4">
               <button onClick={() => setShowPrivacyPolicy(true)} className="text-sky-400 hover:underline">{t.privacyPolicy}</button>
               <button onClick={() => setShowResponsibleAiPolicy(true)} className="text-sky-400 hover:underline">{t.responsibleAiPolicy}</button>
            </div>
            <p className="mt-2">{t.version}: {APP_VERSION}</p>
          </div>
        </div>
      </Modal>
    );
  };
  
  const QuickActionsMenu = () => {
    const ActionButton = ({ icon, label, onClick, disabled = false }) => (
      <button
        onClick={onClick}
        disabled={disabled || isGenerating}
        className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-sky-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <span className="text-sky-400">{icon}</span>
        <span>{label}</span>
      </button>
    );

    const languages = [
        { code: 'ar', name: 'Arabic' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'zh', name: 'Chinese' },
    ];

    const MainMenu = () => (
        <>
            <h3 className="text-sm font-semibold text-slate-400 px-2 mb-1">{t.writingTools}</h3>
            <div className="space-y-1">
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>} label={t.improveWriting} onClick={() => executeQuickAction(t.improveWriting)} />
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>} label={t.summarizeText} onClick={() => executeQuickAction(t.summarizeText)} />
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>} label={t.changeTone} onClick={() => setActiveQuickActionSubmenu('tone')} />
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16a5.973 5.973 0 01-2.197-1H5a2 2 0 01-2-2v-1a6.012 6.012 0 011.332-3.973z" clipRule="evenodd" /></svg>} label={t.translate} onClick={() => setActiveQuickActionSubmenu('translate')} />
            </div>
            <h3 className="text-sm font-semibold text-slate-400 px-2 mt-3 mb-1">{t.ideaGeneration}</h3>
            <div className="space-y-1">
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-1.414 8.486l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>} label={t.brainstormIdeas} onClick={() => executeQuickAction(t.brainstormIdeas, '', false)} />
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 4a3 3 0 00-2.7-2.98A3.012 3.012 0 0010.5 3.52 3 3 0 008 1a3.012 3.012 0 00-1.5.48A3 3 0 004 4c-1.1 0-2 .9-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6c0-1.1-.9-2-2-2zm-3 2v2.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V6H6v10h8V6h-2z" /></svg>} label={t.writePoem} onClick={() => executeQuickAction(t.writePoem, '', false)} />
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>} label={t.createStory} onClick={() => executeQuickAction(t.createStory, '', false)} />
            </div>
             <h3 className="text-sm font-semibold text-slate-400 px-2 mt-3 mb-1">{t.codeTools}</h3>
             <div className="space-y-1">
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>} label={t.explainCode} onClick={() => executeQuickAction(t.explainCode)} />
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>} label={t.debugCode} onClick={() => executeQuickAction(t.debugCode)} />
                <ActionButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>} label={t.optimizeCode} onClick={() => executeQuickAction(t.optimizeCode)} />
             </div>
        </>
    );

    const SubMenu = ({ title, children }) => (
        <>
            <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setActiveQuickActionSubmenu(null)} className="p-1 rounded-full hover:bg-sky-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
            </div>
            <div className="space-y-1">{children}</div>
        </>
    );

    const ToneMenu = () => (
        <SubMenu title={t.changeTone}>
            <ActionButton icon={<div/>} label={t.tone_professional} onClick={() => executeQuickAction(`Rewrite in a professional tone`)} />
            <ActionButton icon={<div/>} label={t.tone_casual} onClick={() => executeQuickAction(`Rewrite in a casual tone`)} />
            <ActionButton icon={<div/>} label={t.tone_friendly} onClick={() => executeQuickAction(`Rewrite in a friendly tone`)} />
        </SubMenu>
    );

    const TranslateMenu = () => (
        <SubMenu title={t.translate}>
            {languages.map(lang => (
                 <ActionButton key={lang.code} icon={<div/>} label={lang.name} onClick={() => executeQuickAction(`Translate to ${lang.name}`)} />
            ))}
        </SubMenu>
    );

    return (
        <div ref={quickActionsRef} className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-2 shadow-lg animate-fade-in-up z-20">
            {activeQuickActionSubmenu === 'tone' ? <ToneMenu/> : activeQuickActionSubmenu === 'translate' ? <TranslateMenu/> : <MainMenu />}
        </div>
    )
  }
  
  // --- Render Method ---
  
  if (authStatus === 'loading') {
    return <div className="bg-slate-900 h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  // A simplified login/auth screen for demonstration
  const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
      const user = users.find(u => u.email === email && u.passwordHash === password);
      if (user) {
        localStorage.setItem('betalive_currentUserEmail', user.email);
        setCurrentUser(user);
        setAuthStatus('authenticated');
      } else {
        alert(t.errorUserNotFound);
      }
    };
    
    const handleRegister = () => {
        // Dummy registration
        const newUser = {
            email: "user@example.com",
            passwordHash: "password",
            settings: defaultSettings,
            sessions: [],
            twoFactorEnabled: false
        };
        setUsers([...users, newUser]);
        localStorage.setItem('betalive_currentUserEmail', newUser.email);
        setCurrentUser(newUser);
        setAuthStatus('authenticated');
    }

    if (users.length === 0) {
      // First time user, show a simplified registration
      return (
        <div className="bg-slate-900 h-screen flex flex-col items-center justify-center text-white p-4">
            <h1 className="text-3xl font-bold mb-2">{t.chatTitle}</h1>
            <p className="mb-6">{t.chatSubtitle}</p>
            <p className="mb-4 text-center">Welcome! To get started, let's create a local profile.</p>
            <button onClick={handleRegister} className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors">Create Profile & Start</button>
        </div>
      )
    }

    return (
      <div className="bg-slate-900 h-screen flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-3xl font-bold mb-2">{t.chatTitle}</h1>
        <p className="mb-6">{t.chatSubtitle}</p>
        <div className="w-full max-w-sm">
            <input type="email" placeholder={t.email} value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-700 mb-2"/>
            <input type="password" placeholder={t.password} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-slate-700 mb-4"/>
            <button onClick={handleLogin} className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors">{t.login}</button>
        </div>
      </div>
    );
  };
  
  if (authStatus !== 'authenticated' || !currentUser) {
    return <AuthScreen />;
  }
  
  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showPrivacyPolicy && <PrivacyPolicyModal t={t} onClose={() => setShowPrivacyPolicy(false)} />}
      {showResponsibleAiPolicy && <ResponsibleAiPolicyModal t={t} onClose={() => setShowResponsibleAiPolicy(false)} />}
      {piiConfirmation && <PiiConfirmationModal t={t} onConfirm={handlePiiConfirmation} onCancel={() => setPiiConfirmation(null)} />}
      {showPinModal && <PinModal onClose={() => setShowPinModal(false)} />}
      {showApiLogsModal && <ApiLogsModal onClose={() => setShowApiLogsModal(false)} />}


      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-sky-400"><rect width="256" height="256" fill="none"/><path d="M128,24a104,104,0,1,0,104,104A104.2,104.2,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" opacity="0.2"/><path d="M128,24a104,104,0,1,0,104,104A104.2,104.2,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM88,128a40,40,0,0,1,40-40V68a60,60,0,0,0-60,60H88Zm80,0a40,40,0,0,1-40,40v20a60,60,0,0,0,60-60Z" fill="currentColor"/></svg>
           <div>
            <h1 className="text-xl font-bold text-white">{t.chatTitle}</h1>
            <p className="text-sm text-slate-400">{t.chatSubtitle}</p>
          </div>
          {isDevOverrideActive && (
              <span className="ml-2 bg-sky-500/20 text-sky-300 text-xs font-bold px-2 py-1 rounded-full border border-sky-500/30">
                  {t.devOverrideActive}
              </span>
          )}
        </div>
        <div className="flex items-center gap-2">
           <button onClick={createNewSession} className="p-2 rounded-full hover:bg-slate-800 transition-colors" title={t.newChat}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
           <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-slate-800 transition-colors" title={t.settingsTitle}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-slate-800 transition-colors" title={t.logout}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
          {currentSession ? (
            currentSession.messages.map((msg, index) => (
              <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-sky-500 flex-shrink-0"></div>}
                <div className={`p-4 rounded-2xl max-w-xl ${msg.role === 'user' ? 'bg-sky-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>
                   {msg.isGenerating ? <div className="animate-pulse">...</div> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 mt-20">
              <h2 className="text-2xl font-bold text-white mb-2">{t.chatTitle}</h2>
              <p>{settings.appleIntelligence ? t.appleIntelligenceInitialMessage : t.initialMessage}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
             {showQuickActions && <QuickActionsMenu />}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.inputPlaceholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pl-14 pr-24 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              rows={1}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button onClick={() => setShowQuickActions(s => !s)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" title={t.quickActions}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-2.707 2.707a1 1 0 000 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 000-1.414L8 4.586V3a1 1 0 00-1-1H5zm10 0a1 1 0 00-1 1v4.586l-2.707 2.707a1 1 0 000 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 000-1.414L18 7.586V3a1 1 0 00-1-1h-2z" clipRule="evenodd" /></svg>
                </button>
                 <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-slate-700 transition-colors" title={t.attachImages}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </button>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />

              <button onClick={() => handleSend()} disabled={isGenerating} className="bg-sky-600 rounded-full p-2 text-white hover:bg-sky-700 disabled:bg-slate-600 transition-colors">
                 {isGenerating ? 
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    :
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                 }
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
