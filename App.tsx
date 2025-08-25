
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AppSettings, Language, ChatSession, EnabledModels, Role, User, AuthMode, SecurityScanResult, ActivityLog, ThirdPartyIntegrations } from './types';
import { GoogleGenAI, GenerateContentResponse, Content, Part, Type } from '@google/genai';


// --- POLICIES (HTML Content) ---
const RESPONSIBLE_AI_POLICY_HTML = `<style>
  [data-custom-class='body'], [data-custom-class='body'] * {
          background: transparent !important;
        }
[data-custom-class='title'], [data-custom-class='title'] * {
          font-family: Arial !important;
font-size: 26px !important;
color: #ffffff !important;
        }
[data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
          font-family: Arial !important;
color: #a0aec0 !important;
font-size: 14px !important;
        }
[data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
          font-family: Arial !important;
font-size: 19px !important;
color: #ffffff !important;
        }
[data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
          font-family: Arial !important;
font-size: 17px !important;
color: #ffffff !important;
        }
[data-custom-class='body_text'], [data-custom-class='body_text'] * {
          color: #cbd5e0 !important;
font-size: 14px !important;
font-family: Arial !important;
        }
[data-custom-class='link'], [data-custom-class='link'] * {
          color: #63b3ed !important;
font-size: 14px !important;
font-family: Arial !important;
word-break: break-word !important;
        }
</style>
      <div data-custom-class="body">
      <div data-custom-class="title" style="line-height: 1.5;"><strong><span style="font-size: 26px;"><bdt class="block-component"></bdt><bdt class="question"><h1>RESPONSIBLE AI POLICY</h1></bdt><bdt class="statement-end-if-in-editor"></bdt></span></strong></div><div data-custom-class="subtitle" style="line-height: 1.5;"><strong>Last updated</strong> <bdt class="question"><strong>October 01, 2025</strong></bdt></div><div style="line-height: 1.2;"><br></div><div style="line-height: 1.5;"><br></div><div style="line-height: 1.5;"><br></div><div data-custom-class="body_text" style="line-height: 1.5;">This <bdt class="block-component"></bdt><bdt class="question">Responsible AI Policy</bdt><bdt class="statement-end-if-in-editor"></bdt> (<bdt class="block-component"></bdt>"<strong>Policy</strong>"<bdt class="statement-end-if-in-editor"></bdt>) is part of our <bdt class="question">Terms of Use</bdt> (<bdt class="block-component"></bdt>"<strong>Legal Terms</strong>"<bdt class="statement-end-if-in-editor"></bdt>) and should therefore be read alongside our main Legal Terms: <span style="color: rgb(0, 58, 250);"><bdt class="question"><a href="https://betalive2023.blogspot.com/2024/05/betalive-community-guide-lines.html" target="_blank" data-custom-class="link">https://betalive2023.blogspot.com/2024/05/betalive-community-guide-lines.html</a></bdt></span>. <bdt class="block-component"></bdt>When you use the AI-powered services provided by <bdt class="question">Betalive </bdt> (<bdt class="block-component"></bdt>"<strong>AI Products</strong>"<bdt class="statement-end-if-in-editor"></bdt>), you warrant that you will comply with this document, our Legal Terms and all applicable laws and regulations governing AI. Your usage of our AI Products signifies your agreement to engage with our platform in a lawful, ethical, and responsible manner that respects the rights and dignity of all individuals. <bdt class="statement-end-if-in-editor"></bdt>If you do not agree with these Legal Terms, please refrain from using our Services. Your continued use of our Services implies acceptance of these Legal Terms.</div><div style="line-height: 1;"><br></div><div data-custom-class="body_text" style="line-height: 1.5;">Please carefully review this Policy which applies to any and all:</div><div style="line-height: 1;"><br></div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">(a) uses of our Services (as defined in <bdt class="block-component"></bdt>"Legal Terms"<bdt class="statement-end-if-in-editor"></bdt>)</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">(b) forms, materials, consent tools, comments, post, and all other content available on the Services (<bdt class="block-component"></bdt>"<strong>Content</strong>"<bdt class="statement-end-if-in-editor"></bdt>) <bdt class="block-component"></bdt></div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">(c) material which you contribute to the Services including any upload, post, review, disclosure, ratings, comments, chat etc.<bdt class="block-component"></bdt> in any forum, chatrooms, reviews, and to any interactive services associated with it<bdt class="statement-end-if-in-editor"></bdt> (<bdt class="block-component"></bdt>"<strong>Contribution</strong>"<bdt class="statement-end-if-in-editor"></bdt>)<bdt class="block-component"></bdt></div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">(d) responsible implementation and management of AI Products within our Services<bdt class="statement-end-if-in-editor"></bdt></div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>WHO WE ARE</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">We are <bdt class="question">Betalive </bdt><bdt class="block-component"></bdt> (<bdt class="block-component"></bdt>"<strong>Company</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"<bdt class="statement-end-if-in-editor"></bdt>) a company registered in <bdt class="block-component"></bdt><bdt class="question">Canada</bdt></bdt></bdt> at <bdt class="question">__________</bdt><bdt class="block-component"></bdt>, <bdt class="question">__________</bdt><bdt class="block-component"></bdt>, <bdt class="question">British Columbia</bdt><bdt class="block-component"></bdt><bdt class="block-component"></bdt>. We operate <bdt class="block-component"></bdt>the website <span style="color: rgb(0, 58, 250);"><bdt class="question"><a href="https://betalive-enterprise.ikol.com/#/?mobile_chat=1" target="_blank" data-custom-class="link">https://betalive-enterprise.ikol.com/#/?mobile_chat=1</a></bdt></span> (the <bdt class="block-component"></bdt>"<strong>Site</strong>"<bdt class="statement-end-if-in-editor"></bdt>)<bdt class="statement-end-if-in-editor"></bdt><bdt class="block-component"></bdt>, <bdt class="statement-end-if-in-editor"></bdt><bdt class="block-component"></bdt>the mobile application <bdt class="question">Betalive </bdt> (the <bdt class="block-component"></bdt>"<strong>App</strong>"<bdt class="statement-end-if-in-editor"></bdt>)<bdt class="statement-end-if-in-editor"></bdt>, as well as any other related products and services that refer or link to this Policy (collectively, the <bdt class="block-component"></bdt>"<strong>Services</strong>"<bdt class="statement-end-if-in-editor"></bdt>).</div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>USE OF THE SERVICES</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">When you use the Services, you warrant that you will comply with this Policy and with all applicable laws.</div><div style="line-height: 1;"><br></div><div data-custom-class="body_text" style="line-height: 1.5;">When you use our AI Products, you agree that you will not use our AI Products to:</div><div style="line-height: 1;"><br></div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Breach, or otherwise circumvent, any security or authentication measures.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Probe, scan, or test the vulnerability of any system or network.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Develop any third-party applications that interact with our AI Products, without our prior written consent.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use any data mining, robots, or similar data gathering and extraction methods in connection with our AI Products.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Interfere or disrupt any user, host, or network, for example by sending a virus, overloading, flooding, spamming, or mail-bombing any part of our AI Products.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products for any illegal, harmful, or abusive activity.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products to generate or disseminate sexually explicit or pornographic material, or any content that is violent, hateful, or discriminatory.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products to generate or disseminate unsolicited or unwanted email (spam).</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products to generate or disseminate content that is fraudulent, deceptive, or misleading.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products to generate or disseminate content that infringes on the intellectual property rights of others.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products to generate or disseminate content that is defamatory, libelous, or slanderous.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products to generate or disseminate content that is threatening, harassing, or abusive.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products to generate or disseminate content that is otherwise objectionable.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products to develop models that compete with us.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Extract data from our AI Products.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Misrepresent the output of our AI Products as human-generated.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Manipulate or otherwise exploit our AI Products for any purpose, including but not limited to, for financial gain, political purposes, or to harm others.</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Use our AI Products in a way that violates any applicable law, including but not limited to, laws governing privacy, intellectual property, and export controls.</div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>SAFETY AND MODERATION</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">We prioritize a safe and positive environment and strictly prohibit the use of our Services for generating harmful content including, but not limited to:</div><div style="line-height: 1;"><br></div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Sexually explicit materials</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Hateful or violent content</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Harassment</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Self-harm</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Misinformation</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Disinformation</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Malicious code</div><div data-custom-class="body_text" style="line-height: 1.5; margin-left: 20px;">- Spam</div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>USER-GENERATED CONTENT</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">Our AI Products may accept user-submitted content. Such content remains the intellectual property of its creator. By submitting content, you grant us a license to use it in connection with our Services.</div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>INTELLECTUAL PROPERTY</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">We respect the intellectual property rights of others. Users are prohibited from using our AI Products to infringe on any copyrights, trademarks, or other proprietary rights.</div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>ACCURACY AND RELIABILITY</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">While we strive for accuracy, our AI Products may not always be correct or complete. We are not liable for any errors or omissions in the content provided.</div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>PRIVACY AND DATA</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">We are committed to protecting user privacy. Our Privacy Policy details how we collect, use, and share data.</div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>POLICY ENFORCEMENT</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">We will investigate any reported violations of this Policy. We reserve the right to remove content and/or suspend or terminate user accounts that violate our terms.</div><div style="line-height: 1.5;"><br></div><div data-custom-class="heading_1" style="line-height: 1.5;"><strong><span style="font-size: 19px;"><h2>CONTACT US</h2></span></strong></div><div data-custom-class="body_text" style="line-height: 1.5;">If you have any questions or concerns about this Policy, please contact us at:</div><div style="line-height: 1.5;"><br></div><div data-custom-class="body_text" style="line-height: 1.5;"><bdt class="question">Betalive </bdt></div><div data-custom-class="body_text" style="line-height: 1.5;"><bdt class="question">__________</bdt></div><div data-custom-class="body_text" style="line-height: 1.5;"><bdt class="question">__________</bdt><bdt class="block-component"></bdt>, <bdt class="question">British Columbia</bdt><bdt class="block-component"></bdt></div><div data-custom-class="body_text" style="line-height: 1.5;"><bdt class="question">Canada</bdt></div><div data-custom-class="body_text" style="line-height: 1.5;">Phone: <bdt class="question">__________</bdt></div><div data-custom-class="body_text" style="line-height: 1.5;"><bdt class="question">infobetalive@protonmail.com</bdt></div></div>`;

const PRIVACY_POLICY_HTML = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset='utf-8'>
      <meta name='viewport' content='width=device-width'>
      <title>Privacy Policy</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          padding: 1em;
          background-color: #0f172a;
          color: #e2e8f0;
        }
        h1, h2, h3 {
          color: #ffffff;
        }
        a {
          color: #38bdf8;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
      </style>
    </head>
    <body>
    <div class="container">
      <h1>Privacy Policy</h1>
      <p>Last updated: July 24, 2024</p>
      <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
      <p>We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.</p>
      
      <h2>Interpretation and Definitions</h2>
      <h3>Interpretation</h3>
      <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
      <h3>Definitions</h3>
      <p>For the purposes of this Privacy Policy:</p>
      <ul>
        <li>
          <p><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</p>
        </li>
        <li>
          <p><strong>Affiliate</strong> means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</p>
        </li>
        <li>
          <p><strong>Application</strong> refers to Betalive AI, the software program provided by the Company.</p>
        </li>
        <li>
          <p><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Betalive.</p>
        </li>
        <li>
          <p><strong>Country</strong> refers to: British Columbia, Canada</p>
        </li>
        <li>
          <p><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</p>
        </li>
        <li>
          <p><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</p>
        </li>
        <li>
          <p><strong>Service</strong> refers to the Application.</p>
        </li>
        <li>
          <p><strong>Service Provider</strong> means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.</p>
        </li>
        <li>
          <p><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</p>
        </li>
        <li>
          <p><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</p>
        </li>
      </ul>
      
      <h2>Collecting and Using Your Personal Data</h2>
      <h3>Types of Data Collected</h3>
      <h4>Personal Data</h4>
      <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Since this is a local-first application, all personal data, including your username, password, settings, and conversation history, is stored exclusively on your device. We do not collect, transmit, or have access to any of this information.</p>
      <p>Information you provide is processed locally on your device.</p>
      
      <h4>Usage Data</h4>
      <p>Usage Data is collected automatically when using the Service.</p>
      <p>Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</p>
      <p>We do not collect Usage Data. All processing and data storage is done on your local device.</p>
      
      <h4>Information Collected while Using the Application</h4>
      <p>While using Our Application, in order to provide features of Our Application, We may collect, with Your prior permission:</p>
      <ul>
        <li>Information regarding your location</li>
        <li>Pictures and other information from your Device's camera and photo library</li>
      </ul>
      <p>We use this information to provide features of Our Service, to improve and customize Our Service. The information is stored locally on Your device and is not uploaded to the Company's servers.</p>
      <p>You can enable or disable access to this information at any time, through Your Device settings.</p>
      
      <h3>Use of Your Personal Data</h3>
      <p>The Company may use Personal Data for the following purposes:</p>
      <ul>
        <li>
          <p><strong>To provide and maintain our Service</strong>, including to monitor the usage of our Service.</p>
        </li>
        <li>
          <p><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.</p>
        </li>
      </ul>
      <p>Since all data is stored locally, we do not share your personal information with anyone.</p>
      
      <h3>Retention of Your Personal Data</h3>
      <p>The Company will retain Your Personal Data only for as long as it is stored on your device. Since we do not collect your data, we do not have a retention policy for it.</p>
      
      <h3>Deletion of Your Personal Data</h3>
      <p>You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You.</p>
      <p>You can delete your information by clearing the application data from your browser or device settings.</p>
      
      <h2>Security of Your Personal Data</h2>
      <p>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security. All data is stored on your device, so the security of your data depends on the security of your device.</p>
      
      <h2>Children's Privacy</h2>
      <p>Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers.</p>
      <p>If We need to rely on consent as a legal basis for processing Your information and Your country requires consent from a parent, We may require Your parent's consent before We collect and use that information.</p>
      
      <h2>Links to Other Websites</h2>
      <p>Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.</p>
      <p>We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.</p>
      
      <h2>Changes to this Privacy Policy</h2>
      <p>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.</p>
      <p>We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.</p>
      <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
      
      <h2>Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, You can contact us:</p>
      <ul>
        <li>By email: infobetalive@protonmail.com</li>
      </ul>
      </div>
    </body>
    </html>`;

// --- MOCK API (to be replaced with actual backend) ---
const mockApi = {
  // Simulates fetching translations
  getTranslations: (language: Language) => {
    const allTranslations = {
      en: {
        "appTitle": "Betalive AI",
        "newChat": "New Chat",
        "history": "History",
        "inputPlaceholder": "Ask me anything...",
        "send": "Send",
        "loading": "...",
        "deleteConfirm": "Are you sure you want to delete this conversation?",
        "welcomeGreeting": "{greeting}, {username}.",
        "welcomeMessage": "I am Betalive AI. How can I assist you today?",
        "qa_analyze": "Analyze & Create",
        "qa_analyze_prompt": "Analyze, translate, explain, or brainstorm ideas about: ",
        "qa_culture": "Iraqi Culture",
        "qa_culture_prompt": "Tell me about an aspect of Iraqi culture: ",
        "qa_image": "Image",
        "qa_image_prompt": "Generate an image of: ",
        "qa_code": "Code",
        "qa_code_prompt": "Write code for: ",
        "settingsTitle": "Settings",
        "general": "General",
        "language": "Language",
        "saveConversations": "Save Conversations",
        "features": "Features",
        "voiceCommands": "Voice Commands",
        "enableQuickActions": "Enable Quick Actions",
        "textToSpeech": "Text-to-Speech",
        "securityScan": "Security Scan",
        "securityScanDesc": "Scan prompts for sensitive data like keys or passwords.",
        "account": "Account",
        "loggedInAs": "You are logged in as {username}.",
        "logOut": "Log Out",
        "legal": "Legal & Policies",
        "privacyPolicy": "Privacy Policy",
        "responsibleAiPolicy": "Responsible AI Policy",
        "welcomeBack": "Welcome back",
        "createAccount": "Create an account",
        "username": "Username",
        "password": "Password",
        "logIn": "Log In",
        "register": "Register",
        "dontHaveAccount": "Don't have an account?",
        "alreadyHaveAccount": "Already have an account?",
        "signUp": "Sign Up",
        "developerOptions": "Developer Options",
        "showLatency": "Show Network Latency",
        "showLatencyDesc": "Display the model response time on each message.",
        "useAdvancedModelSettings": "Use Advanced Model Settings",
        "temperature": "Temperature",
        "topP": "Top-P",
        "integrations": "Third-Party Integrations",
        "integrationsDesc": "Manage connections to other services (demonstration).",
        "privacyAndSecurity": "Privacy & Security",
        "enablePrivacySandbox": "Enable Privacy Sandbox",
        "enablePrivacySandboxDesc": "Conceptual setting for future privacy-preserving APIs.",
        "warnSensitiveTopics": "Warn on Sensitive Topics",
        "warnSensitiveTopicsDesc": "Provides a warning when prompts contain potentially sensitive topics.",
        "stripImageMetadata": "Strip Image Metadata (Privacy)",
        "stripImageMetadataDesc": "Removes location and other metadata from uploaded images.",
        "enableEphemeralSessions": "Enable Ephemeral Sessions",
        "enableEphemeralSessionsDesc": "Chat history will not be saved for the current session.",
        "activityLog": "Activity Log",
        "viewActivityLog": "View Activity Log",
        "ephemeralModeActive": "Ephemeral Mode: This chat will not be saved.",
      },
      ar: {
        "appTitle": "بيتالايف AI",
        "newChat": "محادثة جديدة",
        "history": "السجل",
        "inputPlaceholder": "اسألني أي شيء...",
        "send": "إرسال",
        "loading": "جار التحميل...",
        "deleteConfirm": "هل أنت متأكد أنك تريد حذف هذه المحادثة؟",
        "welcomeGreeting": "{greeting}, {username}.",
        "welcomeMessage": "أنا بيتالايف AI. كيف يمكنني مساعدتك اليوم؟",
        "qa_analyze": "تحليل وإنشاء",
        "qa_analyze_prompt": "حلل، ترجم، اشرح، أو إطرح أفكارًا حول: ",
        "qa_culture": "الثقافة العراقية",
        "qa_culture_prompt": "أخبرني عن جانب من جوانب الثقافة العراقية: ",
        "qa_image": "صورة",
        "qa_image_prompt": "إنشاء صورة لـ: ",
        "qa_code": "كود",
        "qa_code_prompt": "اكتب كودًا لـ: ",
        "settingsTitle": "الإعدادات",
        "general": "عام",
        "language": "اللغة",
        "saveConversations": "حفظ المحادثات",
        "features": "الميزات",
        "voiceCommands": "الأوامر الصوتية",
        "enableQuickActions": "تفعيل الإجراءات السريعة",
        "textToSpeech": "تحويل النص إلى كلام",
        "securityScan": "فحص الأمان",
        "securityScanDesc": "فحص الموجهات بحثًا عن بيانات حساسة مثل المفاتيح أو كلمات المرور.",
        "account": "الحساب",
        "loggedInAs": "لقد سجلت الدخول باسم {username}.",
        "logOut": "تسجيل الخروج",
        "legal": "قانوني وسياسات",
        "privacyPolicy": "سياسة الخصوصية",
        "responsibleAiPolicy": "سياسة الذكاء الاصطناعي المسؤولة",
        "welcomeBack": "مرحبا بعودتك",
        "createAccount": "إنشاء حساب",
        "username": "اسم المستخدم",
        "password": "كلمة المرور",
        "logIn": "تسجيل الدخول",
        "register": "تسجيل",
        "dontHaveAccount": "ليس لديك حساب؟",
        "alreadyHaveAccount": "هل لديك حساب بالفعل؟",
        "signUp": "إنشاء حساب",
        "developerOptions": "خيارات المطور",
        "showLatency": "عرض زمن الاستجابة للشبكة",
        "showLatencyDesc": "عرض وقت استجابة النموذج في كل رسالة.",
        "useAdvancedModelSettings": "استخدام إعدادات النموذج المتقدمة",
        "temperature": "درجة الحرارة",
        "topP": "Top-P",
        "integrations": "تكاملات الطرف الثالث",
        "integrationsDesc": "إدارة الاتصالات بخدمات أخرى (للتوضيح).",
        "privacyAndSecurity": "الخصوصية والأمان",
        "enablePrivacySandbox": "تفعيل صندوق حماية الخصوصية",
        "enablePrivacySandboxDesc": "إعداد مفاهيمي لواجهات برمجة التطبيقات المستقبلية التي تحافظ على الخصوصية.",
        "warnSensitiveTopics": "التحذير من المواضيع الحساسة",
        "warnSensitiveTopicsDesc": "يوفر تحذيرًا عندما تحتوي الموجهات على مواضيع قد تكون حساسة.",
        "stripImageMetadata": "إزالة البيانات الوصفية للصور (خصوصية)",
        "stripImageMetadataDesc": "يزيل بيانات الموقع والبيانات الوصفية الأخرى من الصور المرفوعة.",
        "enableEphemeralSessions": "تفعيل الجلسات المؤقتة",
        "enableEphemeralSessionsDesc": "لن يتم حفظ سجل الدردشة للجلسة الحالية.",
        "activityLog": "سجل النشاط",
        "viewActivityLog": "عرض سجل النشاط",
        "ephemeralModeActive": "الوضع المؤقت: لن يتم حفظ هذه الدردشة.",
      },
      aii: {
        "appTitle": "Betalive AI (Neo-Aramaic)",
        "welcomeMessage": "ܫܠܵܡܵܐ! ܕܵܐܟ݂ܝܼ ܡܵܨܸܢ βοηθητικό اليوم؟",
        "inputPlaceholder": "Type your message or upload an image...",
      }
    };
    // Merge selected language with English as a fallback for missing keys
    const translations = { ...allTranslations.en, ...allTranslations[language] };
    return Promise.resolve(translations);
  },
  // Simulates checking security
  scanForSecurityIssues: async (text: string, checkSensitiveTopics: boolean): Promise<SecurityScanResult> => {
    // In a real app, this would call a security API.
    // Here, we'll just do a mock scan for sensitive patterns.
    const issues: string[] = [];
    const sensitivePatterns = {
      "Credit Card Number": /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
      "Social Security Number": /\b\d{3}-\d{2}-\d{4}\b/g,
      "Email Address": /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
      "Phone Number": /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    };

    for (const [issue, pattern] of Object.entries(sensitivePatterns)) {
      if (pattern.test(text)) {
        issues.push(issue);
      }
    }

    // Simulate a check for harmful language
    const harmfulWords = ["malware", "phishing", "exploit"];
    if (harmfulWords.some(word => text.toLowerCase().includes(word))) {
      issues.push("Potentially Harmful Language");
    }

    if(checkSensitiveTopics) {
        const sensitiveTopics = ["politics", "religion", "finance", "medical advice"];
         if (sensitiveTopics.some(word => text.toLowerCase().includes(word))) {
            issues.push("Sensitive Topic");
        }
    }

    return Promise.resolve({
      isSafe: issues.length === 0,
      issues: issues,
    });
  },
};

// --- Helper Functions ---
const getGreeting = (language: Language) => {
  const hour = new Date().getHours();
  const greetings = {
      morning: { en: 'Good morning', ar: 'صباح الخير', aii: 'Good morning' },
      afternoon: { en: 'Good afternoon', ar: 'مساء الخير', aii: 'Good afternoon' },
      evening: { en: 'Good evening', ar: 'مساء الخير', aii: 'Good evening' },
  };
  
  if (hour < 12) return greetings.morning[language] || greetings.morning.en;
  if (hour < 18) return greetings.afternoon[language] || greetings.afternoon.en;
  return greetings.evening[language] || greetings.evening.en;
};

// --- Main App Component ---
const App: React.FC = () => {
  // State Management
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('betalive_users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  const [prompt, setPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPolicy, setShowPolicy] = useState<'privacy' | 'responsible_ai' | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDevModeUnlocked, setIsDevModeUnlocked] = useState(false);
  
  const defaultSettings: AppSettings = {
    language: 'en',
    enabledModels: { openai: true, meta: false, amazon: false, microsoft: false },
    voiceCommands: true,
    textToSpeech: false,
    saveConversations: true,
    useCustomSystemPrompt: false,
    customSystemPrompt: "You are a helpful assistant.",
    enableCareerGuidance: false,
    appleIntelligence: false,
    developerMode: false,
    enableSecurityScan: true,
    enableQuickActions: true,
    showLatency: false,
    useAdvancedModelSettings: false,
    customTemperature: 0.7,
    customTopP: 0.9,
    thirdPartyIntegrations: { googleDrive: false, slack: false },
    enablePrivacySandbox: false,
    warnSensitiveTopics: true,
    stripImageMetadata: true,
    enableEphemeralSessions: false,
  };

  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Gemini AI Initialization ---
  const ai = useRef<GoogleGenAI | null>(null);
  useEffect(() => {
    if (process.env.API_KEY) {
      ai.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("API_KEY environment variable not set.");
    }
  }, []);

  // --- Translation Management ---
  useEffect(() => {
    mockApi.getTranslations(appSettings.language).then(setTranslations);
  }, [appSettings.language]);

  const t = (key: string, replacements?: Record<string, string>) => {
    let text = translations[key] || key; // Fallback to key if not found
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            text = text.replace(`{${rKey}}`, replacements[rKey]);
        });
    }
    return text;
  };

  // --- Auth & User Management ---
  useEffect(() => {
    localStorage.setItem('betalive_users', JSON.stringify(users));
  }, [users]);

  const updateUser = useCallback((updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, []);

  const logActivity = useCallback((action: string, details?: string) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        action,
        details,
    };
    const updatedUser = {
        ...currentUser,
        activityLog: [...(currentUser.activityLog || []), newLog],
    };
    updateUser(updatedUser);
  }, [currentUser, updateUser]);

  useEffect(() => {
    if (currentUser) {
      setAppSettings(currentUser.settings);
      setSessions(currentUser.sessions);
      if (currentUser.sessions.length > 0) {
        const sortedSessions = [...currentUser.sessions].sort((a, b) => b.createdAt - a.createdAt);
        setActiveSessionId(sortedSessions[0].id);
        setMessages(sortedSessions[0].messages);
      } else {
        createNewSession(false); // don't log activity on initial creation
      }
    } else {
      setMessages([]);
      setSessions([]);
      setActiveSessionId(null);
      setAuthMode('login');
      setAppSettings(defaultSettings);
    }
  }, [currentUser]);


  const handleRegister = (user: Omit<User, 'settings' | 'sessions' | 'id' | 'activityLog'>) => {
    if (users.find(u => u.username === user.username)) {
      alert("Username already exists.");
      return;
    }
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}`,
      settings: appSettings,
      sessions: [],
      activityLog: [{ id: `log_${Date.now()}`, timestamp: Date.now(), action: 'Account Registered' }],
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setAuthMode('app');
  };

  const handleLogin = (credentials: Omit<User, 'settings' | 'sessions' | 'id' | 'username' | 'activityLog'> & { username: string }) => {
    const user = users.find(u => u.username === credentials.username && u.password === credentials.password);
    if (user) {
      const updatedUser = {
        ...user,
        activityLog: [...(user.activityLog || []), { id: `log_${Date.now()}`, timestamp: Date.now(), action: 'Logged In' }]
      }
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setAuthMode('app');
    } else {
      alert("Invalid username or password.");
    }
  };

  const handleLogout = () => {
    logActivity("Logged Out");
    setCurrentUser(null);
  };


  // --- Session Management ---
  const createNewSession = (log: boolean = true) => {
    if (!currentUser) return;
    if (log) logActivity("Created New Session");
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };
    const updatedSessions = [...sessions, newSession];
    const updatedUser = { ...currentUser, sessions: updatedSessions };
    updateUser(updatedUser);
    
    // Update state directly after updating user
    setSessions(updatedSessions);
    setActiveSessionId(newSession.id);
    setMessages(newSession.messages);
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(session.id);
      setMessages(session.messages);
      logActivity("Switched Session", `To: ${session.title.substring(0,20)}...`);
    }
  };

  const deleteSession = (sessionId: string) => {
    if (!currentUser) return;
    if (!confirm(t('deleteConfirm'))) return;
    
    const sessionTitle = sessions.find(s => s.id === sessionId)?.title || 'Unknown';
    logActivity("Deleted Session", `Title: ${sessionTitle.substring(0,20)}...`);

    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    updateUser({ ...currentUser, sessions: updatedSessions });

    if (activeSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        const sorted = [...updatedSessions].sort((a,b) => b.createdAt - a.createdAt);
        switchSession(sorted[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // Auto-save messages to the current session
  useEffect(() => {
    if (!activeSessionId || !currentUser || !appSettings.saveConversations || appSettings.enableEphemeralSessions) return;

    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (!activeSession || JSON.stringify(activeSession.messages) === JSON.stringify(messages)) {
      return; 
    }

    const updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        let newTitle = s.title;
        if (newTitle === "New Chat" && messages.length > 0 && messages[0].role === 'user') {
          newTitle = messages[0].text.substring(0, 30) + (messages[0].text.length > 30 ? '...' : '');
        }
        return { ...s, messages: messages, title: newTitle };
      }
      return s;
    });
    
    if (JSON.stringify(currentUser.sessions) !== JSON.stringify(updatedSessions)) {
        updateUser({ ...currentUser, sessions: updatedSessions });
    }
  }, [messages, activeSessionId, currentUser, appSettings.saveConversations, appSettings.enableEphemeralSessions, sessions, updateUser]);


  // --- Speech Recognition ---
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI && appSettings.voiceCommands) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = appSettings.language === 'ar' ? 'ar-IQ' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prev => prev + transcript);
        setIsRecording(false);
      };
      recognitionRef.current.onerror = (event: any) => { console.error("Speech recognition error:", event.error); setIsRecording(false); };
      recognitionRef.current.onend = () => { setIsRecording(false); };
    } else {
      recognitionRef.current = null;
    }
  }, [appSettings.voiceCommands, appSettings.language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };


  // --- Core AI Interaction ---
  const executeSend = async (promptText: string, images: string[]) => {
    if (isLoading) return;
    if (!ai.current) {
        alert("Gemini AI is not initialized. Please check your API key.");
        return;
    }
    
    logActivity("Sent Message");
    setIsLoading(true);

    const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        text: promptText,
        images: images,
        timestamp: Date.now(),
    };

    if (appSettings.enableSecurityScan) {
        const scanResult = await mockApi.scanForSecurityIssues(promptText, appSettings.warnSensitiveTopics);
        if (!scanResult.isSafe) {
            userMessage.securityScanResult = scanResult;
        }
    }
    
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    const modelMessagePlaceholder: Message = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: '',
        timestamp: Date.now(),
        isGenerating: true,
    };
    setMessages([...newMessages, modelMessagePlaceholder]);

    const startTime = Date.now();

    try {
        const model = ai.current;
        let fullResponseText = '';
        const rawChunks: GenerateContentResponse[] = [];

        const contentsForApi: Content[] = newMessages
            .filter(msg => msg.role === 'user' || msg.role === 'model') // Ensure only user/model roles are sent
            .map((msg): Content => {
                const parts: Part[] = [];

                if (msg.images && msg.images.length > 0) {
                    msg.images.forEach(imgData => {
                        const match = imgData.match(/^data:(.*?);base64,/);
                        parts.push({
                            inlineData: {
                                mimeType: match ? match[1] : 'image/jpeg',
                                data: imgData.split(',')[1],
                            }
                        });
                    });
                }

                if (msg.text) {
                    parts.push({ text: msg.text });
                }

                return {
                    role: msg.role,
                    parts: parts,
                };
            });
        
        const config: any = {};
        
        let systemInstructionText: string;
        if (appSettings.useCustomSystemPrompt && appSettings.customSystemPrompt) {
            systemInstructionText = appSettings.customSystemPrompt;
        } else {
            const langMap = {
                en: 'English',
                ar: 'Arabic',
                aii: 'Assyrian Neo-Aramaic'
            };
            const langName = langMap[appSettings.language] || 'English';
            systemInstructionText = `You are a helpful assistant. Please provide responses in ${langName}.`;
        }
        config.systemInstruction = systemInstructionText;
        
        if (appSettings.useAdvancedModelSettings) {
            config.temperature = appSettings.customTemperature;
            config.topP = appSettings.customTopP;
        }

        const stream = await model.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: contentsForApi,
            config: config
        });

        for await (const chunk of stream) {
            if(appSettings.developerMode) rawChunks.push(chunk);
            const chunkText = chunk.text;
            fullResponseText += chunkText;
            setMessages(prev => prev.map(msg =>
                msg.id === modelMessagePlaceholder.id ? { ...msg, text: fullResponseText } : msg
            ));
        }
        
        const latency = Date.now() - startTime;
        setMessages(prev => prev.map(msg =>
            msg.id === modelMessagePlaceholder.id ? { 
                ...msg, 
                isGenerating: false, 
                timestamp: Date.now(), 
                rawResponse: appSettings.developerMode ? JSON.stringify(rawChunks, null, 2) : undefined,
                latency: latency
            } : msg
        ));

    } catch (error) {
        console.error("Error generating content:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            if (error.message.includes('403')) {
                errorMessage = "Error 403: Permission denied. Please verify the API key and its permissions.";
            } else {
                errorMessage = error.message;
            }
        }
        setMessages(prev => prev.map(msg =>
            msg.id === modelMessagePlaceholder.id
            ? { ...msg, text: `Error: ${errorMessage}`, isGenerating: false, timestamp: Date.now() }
            : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSend = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!prompt.trim() && uploadedImages.length === 0) return;
    executeSend(prompt, uploadedImages);
    setPrompt('');
    setUploadedImages([]);
  };

  const resendPrompt = (message: Message) => {
    if (isLoading) return;
    executeSend(message.text, message.images || []);
  };

  // --- UI Effects and Handlers ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const stripMetadata = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL(file.type));
                } else {
                    reject(new Error('Could not get canvas context'));
                }
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        logActivity("Image Uploaded", `${files.length} file(s)`);
        
        const imagePromises = files.map(file => {
            if (appSettings.stripImageMetadata) {
                return stripMetadata(file);
            } else {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
            }
        });

        try {
            const images = await Promise.all(imagePromises);
            setUploadedImages(prev => [...prev, ...images]);
        } catch (error) {
            console.error("Error processing images:", error);
            alert("There was an error processing one or more images.");
        }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };
  
   const quickActions = [
    {
      nameKey: 'qa_analyze',
      promptKey: 'qa_analyze_prompt',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 00-1.414 0l-1.414 1.414a1 1 0 001.414 1.414l1.414-1.414a1 1 0 000-1.414zM10 10a1 1 0 011 1v6a1 1 0 11-2 0v-6a1 1 0 011-1z" />
          <path d="M6 5a1 1 0 00-1.447-.894l-4 2A1 1 0 000 7v10a1 1 0 00.553.894l4 2A1 1 0 006 19V5z" />
        </svg>
      ),
    },
    { nameKey: 'qa_culture', promptKey: 'qa_culture_prompt', icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.69-1.996l-.523-.866A7.512 7.512 0 002.5 8.027v.002a7.5 7.5 0 003.5 6.494l.523-.866a6.012 6.012 0 01-1.69-4.629v-.002zM15.668 11.973a6.012 6.012 0 01-1.69 1.996l.523.866A7.512 7.512 0 0017.5 11.973v-.002a7.5 7.5 0 00-3.5-6.494l-.523.866a6.012 6.012 0 011.69 4.629v.002z" clipRule="evenodd" /> </svg> ), },
    { nameKey: 'qa_image', promptKey: 'qa_image_prompt', icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /> </svg> ), },
    { nameKey: 'qa_code', promptKey: 'qa_code_prompt', icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 01-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /> </svg> ), },
  ];

  const handleQuickAction = (text: string) => {
    setPrompt(text);
    promptInputRef.current?.focus();
  };

  // Render Logic
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} authMode={authMode} setAuthMode={setAuthMode} t={t} />;
  }
  
  if (showSettings) {
    return <SettingsScreen
              settings={appSettings}
              onSettingsChange={setAppSettings}
              onClose={() => setShowSettings(false)}
              onLogout={handleLogout}
              onShowPolicy={setShowPolicy}
              onShowActivityLog={() => setShowActivityLog(true)}
              currentUser={currentUser}
              updateUser={updateUser}
              logActivity={logActivity}
              t={t}
              isDevModeUnlocked={isDevModeUnlocked}
              setIsDevModeUnlocked={setIsDevModeUnlocked}
            />;
  }
  
  if (showActivityLog) {
      return <ActivityLogScreen 
                logs={currentUser.activityLog || []} 
                onClose={() => setShowActivityLog(false)}
                t={t}
            />
  }
  
  if (showPolicy) {
      const policyContent = showPolicy === 'privacy' ? PRIVACY_POLICY_HTML : RESPONSIBLE_AI_POLICY_HTML;
      const policyTitle = showPolicy === 'privacy' ? t('privacyPolicy') : t('responsibleAiPolicy');
      return (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex flex-col p-4 md:p-8">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">{policyTitle}</h2>
                  <button onClick={() => setShowPolicy(null)} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </div>
              <div className="overflow-y-auto flex-grow bg-slate-800 rounded-lg p-6" dangerouslySetInnerHTML={{ __html: policyContent }}></div>
          </div>
      );
  }

  const greeting = getGreeting(appSettings.language);

  // Main App UI
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950/50 flex-col p-4 hidden md:flex">
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-xl font-bold text-sky-400">{t('appTitle')}</h1>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-md hover:bg-slate-700 transition-colors" aria-label="Open settings">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
        <button onClick={() => createNewSession()} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4">
            {t('newChat')}
        </button>
        <div className="flex-grow overflow-y-auto pr-2">
            <h2 className="text-xs font-semibold uppercase text-slate-400 mb-2">{t('history')}</h2>
            <ul className="space-y-1">
                {[...sessions].sort((a,b) => b.createdAt - a.createdAt).map(session => (
                    <li key={session.id}>
                        <a href="#"
                           onClick={(e) => { e.preventDefault(); switchSession(session.id); }}
                           className={`flex justify-between items-center w-full text-left p-2 rounded-md text-sm truncate ${activeSessionId === session.id ? 'bg-sky-500/20 text-sky-300' : 'hover:bg-slate-800'}`}
                        >
                           <span className="flex-grow truncate">{session.title}</span>
                           <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="ml-2 p-1 opacity-50 hover:opacity-100" aria-label="Delete session">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                           </button>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-800/50">
        <header className="md:hidden flex items-center justify-between p-2 bg-slate-950/50">
             <h1 className="text-lg font-bold text-sky-400">{t('appTitle')}</h1>
             <button onClick={() => setShowSettings(true)} className="p-2 rounded-md hover:bg-slate-700 transition-colors" aria-label="Open settings">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 && !isLoading ? (
              <WelcomeScreen greeting={greeting} username={currentUser.username} t={t} />
            ) : (
               messages.map(msg => <MessageBubble key={msg.id} message={msg} settings={appSettings} onResend={resendPrompt} />)
            )}
             <div ref={messagesEndRef} />
        </div>
        
        <div className="p-2 md:p-4 bg-slate-900/40 border-t border-slate-700">
            {appSettings.enableEphemeralSessions && (
                <div className="text-center text-xs text-amber-300 bg-amber-500/10 rounded-md py-1 px-4 mb-2 max-w-4xl mx-auto">
                    {t('ephemeralModeActive')}
                </div>
            )}
            {appSettings.enableQuickActions && (
              <div className="px-4 md:px-6 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.nameKey}
                      onClick={() => handleQuickAction(t(action.promptKey))}
                      className="flex items-center gap-2 bg-slate-700/50 hover:bg-sky-500/30 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                      aria-label={`Quick action: ${t(action.nameKey)}`}
                    >
                      {action.icon}
                      <span>{t(action.nameKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={handleSend} className="max-w-4xl mx-auto">
              <div className="relative">
                {uploadedImages.length > 0 && (
                  <div className="p-2 bg-slate-700/50 rounded-t-lg flex items-center gap-2">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`upload-preview-${index}`} className="h-16 w-16 object-cover rounded-md" />
                        <button onClick={() => removeImage(index)} className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image" > &times; </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={t('inputPlaceholder')}
                  className="w-full pl-12 pr-28 py-3 bg-slate-700/50 text-slate-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none border-transparent placeholder-slate-400"
                  rows={Math.max(1, Math.min(6, prompt.split('\n').length))}
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                   <label htmlFor="image-upload" className="cursor-pointer p-2 text-slate-400 hover:text-sky-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /> </svg>
                  </label>
                  <input id="image-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  
                  {appSettings.voiceCommands && (
                    <button type="button" onClick={toggleRecording} className={`p-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-sky-400'}`} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /> <path d="M5.5 4.5a2.5 2.5 0 015 0v6a2.5 2.5 0 01-5 0V4.5z" /> <path d="M10 15a4 4 0 004-4h-1.5a2.5 2.5 0 01-5 0H6a4 4 0 004 4z" /> </svg>
                    </button>
                  )}
                </div>
                <button type="submit" disabled={isLoading || (!prompt.trim() && uploadedImages.length === 0)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-sky-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors" > {isLoading ? t('loading') : t('send')} </button>
              </div>
            </form>
        </div>
      </main>
    </div>
  );
};


// --- Sub-components ---
type Translator = (key: string, replacements?: Record<string, string>) => string;

const WelcomeScreen: React.FC<{ greeting: string, username: string, t: Translator }> = ({ greeting, username, t }) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="bg-sky-500/10 rounded-full p-4 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-100">{t('welcomeGreeting', { greeting, username })}</h2>
      <p className="text-slate-400 mt-2">{t('welcomeMessage')}</p>
  </div>
);

const MessageBubble: React.FC<{ message: Message, settings: AppSettings, onResend: (message: Message) => void }> = ({ message, settings, onResend }) => {
    const isUser = message.role === 'user';
    const [showRaw, setShowRaw] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (message.rawResponse) {
            navigator.clipboard.writeText(message.rawResponse);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    // A simple markdown-to-html converter
    const formatText = (text: string) => {
        let html = text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // Basic sanitation
            .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
            .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-700/50 text-emerald-400 rounded px-1 py-0.5 text-sm font-mono">$1</code>')
            .replace(/\n/g, '<br />');

        html = html.replace(/(<br \/>\s*){3,}/g, '<br /><br />');
        html = html.replace(/^\s*([-*]|\d+\.)\s/gm, (match) => `<li>${match.replace(/[-*]|\d+\./, '').trim()}</li>`)
                   .replace(/<\/li>(<br \/>\s*<li>)+/g, '</li><li>')
                   .replace(/(<li>.*<\/li>)/gs, (list) => {
                       const listType = list.includes('1.') ? 'ol' : 'ul';
                       return `<${listType}>${list}</${listType}>`;
                   })
                   .replace(/<\/([ou]l)><br \/><\1>/g, '');

        return html;
    };

    return (
        <div className={`flex gap-3 group ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex-shrink-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" /><path d="M9 9a1 1 0 00-1 1v3a1 1 0 002 0v-3a1 1 0 00-1-1z" /></svg>
                </div>
            )}
            {isUser && (
                <div className="flex items-center self-end -mr-2">
                    <button onClick={() => onResend(message)} className="p-2 text-slate-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Resend prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
                        </svg>
                    </button>
                </div>
            )}
            <div className={`max-w-xl ${isUser ? 'items-end' : ''}`}>
                 <div className={`px-4 py-3 rounded-2xl ${isUser ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-700/80 text-slate-200 rounded-bl-none'}`}>
                   {message.images && message.images.length > 0 && (
                     <div className="flex flex-wrap gap-2 mb-2">
                       {message.images.map((img, index) => (
                         <img key={index} src={img} alt={`sent-image-${index}`} className="max-h-48 rounded-lg" />
                       ))}
                     </div>
                   )}
                   {message.isGenerating && !message.text ? (
                     <div className="flex items-center gap-2">
                        <span className="animate-pulse block w-2 h-2 bg-slate-400 rounded-full"></span>
                        <span className="animate-pulse block w-2 h-2 bg-slate-400 rounded-full" style={{animationDelay: '0.2s'}}></span>
                        <span className="animate-pulse block w-2 h-2 bg-slate-400 rounded-full" style={{animationDelay: '0.4s'}}></span>
                    </div>
                   ) : (
                     <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatText(message.text) }} />
                   )}
                 </div>
                 {message.securityScanResult && !message.securityScanResult.isSafe && (
                   <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                     <strong>Warning:</strong> Potential {message.securityScanResult.issues.join(', ')} detected.
                   </div>
                 )}
                 <div className="text-xs text-slate-500 mt-1 px-1 flex items-center">
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                    {settings.showLatency && message.latency && <span className="ml-2">({(message.latency / 1000).toFixed(1)}s)</span>}
                 </div>
                 {settings.developerMode && message.role === 'model' && message.rawResponse && (
                    <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-slate-500 hover:text-sky-400">
                            {showRaw ? '</> Hide Raw' : '</> Show Raw'}
                        </button>
                         <button onClick={handleCopy} className="text-xs text-slate-500 hover:text-sky-400">
                           {copied ? 'Copied!' : 'Copy Raw'}
                        </button>
                        {showRaw && (
                            <pre className="mt-1 p-2 bg-slate-900 rounded text-xs overflow-x-auto text-slate-300 w-full">
                                <code>{message.rawResponse}</code>
                            </pre>
                        )}
                    </div>
                )}
            </div>
             {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                </div>
            )}
        </div>
    );
};


const SettingsScreen: React.FC<{
    settings: AppSettings,
    onSettingsChange: React.Dispatch<React.SetStateAction<AppSettings>>,
    onClose: () => void,
    onLogout: () => void,
    onShowPolicy: (policy: 'privacy' | 'responsible_ai') => void,
    onShowActivityLog: () => void,
    currentUser: User,
    updateUser: (user: User) => void,
    logActivity: (action: string, details?: string) => void,
    t: Translator,
    isDevModeUnlocked: boolean,
    setIsDevModeUnlocked: React.Dispatch<React.SetStateAction<boolean>>
}> = ({ settings, onSettingsChange, onClose, onLogout, onShowPolicy, onShowActivityLog, currentUser, updateUser, logActivity, t, isDevModeUnlocked, setIsDevModeUnlocked }) => {
    
    const [localSettings, setLocalSettings] = useState(settings);
    const [pinPromptVisible, setPinPromptVisible] = useState(false);

    const handleToggle = (key: keyof AppSettings) => {
        setLocalSettings(prev => ({...prev, [key]: !prev[key]}));
    };
    
    const handleSlider = (key: 'customTemperature' | 'customTopP', value: string) => {
        setLocalSettings(prev => ({...prev, [key]: parseFloat(value) }));
    };

    const handleSave = () => {
        onSettingsChange(localSettings); // Update appSettings for UI reactivity
        if (currentUser) {
            const newLog: ActivityLog = {
                id: `log_${Date.now()}`,
                timestamp: Date.now(),
                action: 'Settings Updated',
            };
            const updatedUser: User = {
                ...currentUser,
                settings: localSettings,
                activityLog: [...(currentUser.activityLog || []), newLog],
            };
            updateUser(updatedUser); // Single atomic update for the user object
        }
        onClose();
    };

    const handleDevModeToggle = () => {
        if (!localSettings.developerMode && !isDevModeUnlocked) {
            setPinPromptVisible(true);
        } else {
            setLocalSettings(prev => ({...prev, developerMode: false }));
            setIsDevModeUnlocked(false);
        }
    };

    const onPinSuccess = () => {
        setIsDevModeUnlocked(true);
        setLocalSettings(prev => ({...prev, developerMode: true }));
        setPinPromptVisible(false);
    };
    
    const languages: { code: Language, name: string }[] = [
        { code: 'en', name: 'English' },
        { code: 'ar', name: 'العربية' },
        { code: 'aii', name: 'ܐܬܘܪܝܐ' },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex flex-col p-4 md:p-8">
            {pinPromptVisible && (
                <PinPromptModal
                    onClose={() => setPinPromptVisible(false)}
                    onSuccess={onPinSuccess}
                />
            )}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-white">{t('settingsTitle')}</h2>
                <button onClick={handleSave} className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-1 px-3 rounded-lg transition-colors text-sm">
                    Save & Close
                </button>
            </div>

            <div className="overflow-y-auto flex-grow space-y-8 pr-4">
                <SettingsSection title={t('general')}>
                    <SettingsRow label={t('language')}>
                        <div className="flex items-center gap-1 bg-slate-700 p-1 rounded-lg">
                           {languages.map(lang => (
                               <button 
                                key={lang.code} 
                                onClick={() => setLocalSettings(p => ({...p, language: lang.code}))}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${localSettings.language === lang.code ? 'bg-sky-600 text-white' : 'hover:bg-slate-600/50 text-slate-300'}`}
                                >
                                   {lang.name}
                               </button>
                           ))}
                        </div>
                    </SettingsRow>
                    <ToggleRow label={t('saveConversations')} enabled={localSettings.saveConversations} onToggle={() => handleToggle('saveConversations')} />
                </SettingsSection>

                <SettingsSection title={t('features')}>
                    <ToggleRow label={t('voiceCommands')} enabled={localSettings.voiceCommands} onToggle={() => handleToggle('voiceCommands')} />
                    <ToggleRow label={t('enableQuickActions')} enabled={localSettings.enableQuickActions} onToggle={() => handleToggle('enableQuickActions')} />
                    <ToggleRow label={t('textToSpeech')} enabled={localSettings.textToSpeech} onToggle={() => handleToggle('textToSpeech')} />
                </SettingsSection>
                
                <SettingsSection title={t('privacyAndSecurity')}>
                    <ToggleRow label={t('securityScan')} enabled={localSettings.enableSecurityScan} onToggle={() => handleToggle('enableSecurityScan')} description={t('securityScanDesc')}/>
                    <ToggleRow label={t('warnSensitiveTopics')} enabled={localSettings.warnSensitiveTopics} onToggle={() => handleToggle('warnSensitiveTopics')} description={t('warnSensitiveTopicsDesc')}/>
                    <ToggleRow label={t('stripImageMetadata')} enabled={localSettings.stripImageMetadata} onToggle={() => handleToggle('stripImageMetadata')} description={t('stripImageMetadataDesc')}/>
                    <ToggleRow label={t('enableEphemeralSessions')} enabled={localSettings.enableEphemeralSessions} onToggle={() => handleToggle('enableEphemeralSessions')} description={t('enableEphemeralSessionsDesc')}/>
                    <ToggleRow label={t('enablePrivacySandbox')} enabled={localSettings.enablePrivacySandbox} onToggle={() => handleToggle('enablePrivacySandbox')} description={t('enablePrivacySandboxDesc')}/>
                     <div className="pt-2">
                        <button onClick={onShowActivityLog} className="text-sky-400 hover:underline text-sm">{t('viewActivityLog')}</button>
                    </div>
                </SettingsSection>
                
                <SettingsSection title={t('developerOptions')}>
                    <ToggleRow label="Developer Mode" enabled={localSettings.developerMode} onToggle={handleDevModeToggle} description="Enables debugging features. Access is PIN protected."/>
                    {localSettings.developerMode && (
                      <div className="pl-4 border-l-2 border-slate-700 space-y-4 pt-4">
                        <ToggleRow label={t('showLatency')} enabled={localSettings.showLatency} onToggle={() => handleToggle('showLatency')} description={t('showLatencyDesc')}/>
                        <ToggleRow label={t('useAdvancedModelSettings')} enabled={localSettings.useAdvancedModelSettings} onToggle={() => handleToggle('useAdvancedModelSettings')} />
                        {localSettings.useAdvancedModelSettings && (
                           <div className="space-y-4">
                                <SliderRow label={t('temperature')} value={localSettings.customTemperature} min={0} max={1} step={0.1} onChange={(e) => handleSlider('customTemperature', e.target.value)} />
                                <SliderRow label={t('topP')} value={localSettings.customTopP} min={0} max={1} step={0.1} onChange={(e) => handleSlider('customTopP', e.target.value)} />
                           </div>
                        )}
                        <ToggleRow label="Use Custom System Prompt" enabled={localSettings.useCustomSystemPrompt} onToggle={() => handleToggle('useCustomSystemPrompt')} />
                        {localSettings.useCustomSystemPrompt && (
                           <textarea value={localSettings.customSystemPrompt} onChange={(e) => setLocalSettings(prev => ({...prev, customSystemPrompt: e.target.value}))}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500 resize-y" rows={3} placeholder="e.g., You are a helpful assistant that speaks like a pirate."/>
                        )}
                      </div>
                    )}
                </SettingsSection>
                
                <SettingsSection title={t('integrations')}>
                    <p className="text-sm text-slate-400 mb-4">{t('integrationsDesc')}</p>
                    <ToggleRow label="Google Drive" enabled={localSettings.thirdPartyIntegrations.googleDrive} onToggle={() => setLocalSettings(p => ({...p, thirdPartyIntegrations: {...p.thirdPartyIntegrations, googleDrive: !p.thirdPartyIntegrations.googleDrive}}))} />
                    <ToggleRow label="Slack" enabled={localSettings.thirdPartyIntegrations.slack} onToggle={() => setLocalSettings(p => ({...p, thirdPartyIntegrations: {...p.thirdPartyIntegrations, slack: !p.thirdPartyIntegrations.slack}}))} />
                </SettingsSection>

                <SettingsSection title={t('account')}>
                     <p className="text-slate-400 mb-4">{t('loggedInAs', { username: currentUser.username })}</p>
                     <button onClick={onLogout} className="bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                        {t('logOut')}
                    </button>
                </SettingsSection>
                
                <SettingsSection title={t('legal')}>
                    <div className="flex flex-col items-start space-y-2">
                        <button onClick={() => onShowPolicy('privacy')} className="text-sky-400 hover:underline">{t('privacyPolicy')}</button>
                        <button onClick={() => onShowPolicy('responsible_ai')} className="text-sky-400 hover:underline">{t('responsibleAiPolicy')}</button>
                    </div>
                </SettingsSection>
            </div>
             <div className="text-center text-xs text-slate-500 mt-4 flex-shrink-0">
                Betalive AI v2.3.1
            </div>
        </div>
    );
};

const PinPromptModal: React.FC<{onClose: () => void, onSuccess: () => void}> = ({onClose, onSuccess}) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '354687') {
            onSuccess();
        } else {
            setError('Incorrect PIN. Please try again.');
            setPin('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-xs p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Enter Developer PIN</h3>
                <p className="text-sm text-slate-400 mb-4">Please enter the PIN to unlock developer mode.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        className="w-full text-center px-4 py-2 bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none border-transparent placeholder-slate-400 tracking-widest"
                        maxLength={6}
                    />
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            Unlock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SettingsSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-b border-slate-700/50 pb-6">
        <h3 className="text-lg font-semibold text-sky-400 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const SettingsRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between">
        <label className="text-slate-300 text-sm">{label}</label>
        {children}
    </div>
);

const ToggleRow: React.FC<{ label: string, enabled: boolean, onToggle: () => void, description?: string }> = ({ label, enabled, onToggle, description }) => (
    <div>
        <div className="flex items-center justify-between">
            <label className="text-slate-300 text-sm">{label}</label>
            <button onClick={onToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-sky-500' : 'bg-slate-600'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
        </div>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
);

const SliderRow: React.FC<{ label: string, value: number, min: number, max: number, step: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-slate-300 text-sm">{label}</label>
        <div className="flex items-center gap-3">
            <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-32 accent-sky-500" />
            <span className="text-sm font-mono text-slate-400 w-8 text-center">{value.toFixed(1)}</span>
        </div>
    </div>
);

const ActivityLogScreen: React.FC<{ logs: ActivityLog[], onClose: () => void, t: Translator }> = ({ logs, onClose, t}) => {
    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">{t('activityLog')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="overflow-y-auto flex-grow p-4">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-2">Timestamp</th>
                                <th scope="col" className="px-4 py-2">Action</th>
                                <th scope="col" className="px-4 py-2">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...logs].reverse().map(log => (
                                <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                                    <td className="px-4 py-2 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-4 py-2">{log.action}</td>
                                    <td className="px-4 py-2 text-slate-400">{log.details || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const AuthScreen: React.FC<{
    onLogin: (credentials: Omit<User, 'settings' | 'sessions' | 'id' | 'activityLog'>) => void;
    onRegister: (user: Omit<User, 'settings' | 'sessions' | 'id' | 'activityLog'>) => void;
    authMode: AuthMode;
    setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
    t: Translator;
}> = ({ onLogin, onRegister, authMode, setAuthMode, t }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(authMode === 'login') {
            onLogin({ username, password });
        } else {
            onRegister({ username, password });
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
            <div className="w-full max-w-sm p-8 bg-slate-800 rounded-2xl shadow-lg">
                <h1 className="text-3xl font-bold text-sky-400 text-center mb-2">{t('appTitle')}</h1>
                <p className="text-slate-400 text-center mb-8">{authMode === 'login' ? t('welcomeBack') : t('createAccount')}</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-slate-300">{t('username')}</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                         className="w-full mt-1 px-4 py-2 bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none border-transparent placeholder-slate-400" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300">{t('password')}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full mt-1 px-4 py-2 bg-slate-700/50 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none border-transparent placeholder-slate-400" required />
                    </div>
                    <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        {authMode === 'login' ? t('logIn') : t('register')}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-400 mt-6">
                    {authMode === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="font-semibold text-sky-400 hover:underline ml-1">
                        {authMode === 'login' ? t('signUp') : t('logIn')}
                    </button>
                </p>
            </div>
        </div>
    );
};


export default App;
