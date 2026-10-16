; =====================================================================
; Alomdah_Setup.iss — Inno Setup Script
; =====================================================================
#define MyAppName "العمده للخياطة"
#define MyAppNameEn "Alomdah Tailoring"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "رشيد عبدالله ثابت صالح"
#define MyAppURL "https://github.com/rasheed-cy"
#define MyAppExeName "Alomdah.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

DefaultDirName={autopf}\Alomdah
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
AllowNoIcons=yes

OutputDir=E:\Projects\Alomdah_Tailoring\installer
OutputBaseFilename=Alomdah_Setup_{#MyAppVersion}
SetupIconFile=E:\Projects\Alomdah_Tailoring\desktop\app.ico
UninstallDisplayIcon={app}\{#MyAppExeName}

Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

WizardStyle=modern
WizardSizePercent=110

ShowLanguageDialog=auto
MinVersion=10.0

VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} - Installer
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "إنشاء اختصار على سطح المكتب"; GroupDescription: "اختصارات إضافية:"; Flags: checkedonce
Name: "startmenu"; Description: "إضافة إلى قائمة ابدأ"; GroupDescription: "اختصارات إضافية:"; Flags: checkedonce
Name: "autostart"; Description: "تشغيل التطبيق تلقائيًا عند بدء Windows"; GroupDescription: "خيارات إضافية:"; Flags: unchecked

[Files]
Source: "E:\Projects\Alomdah_Tailoring\desktop\dist\Alomdah\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\إلغاء التثبيت"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "تشغيل {#MyAppName} الآن"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Registry]
Root: HKLM; Subkey: "Software\Alomdah"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\Alomdah"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "Alomdah"; ValueData: """{app}\{#MyAppExeName}"""; Tasks: autostart; Flags: uninsdeletevalue