#define AppName "AB MakerIDE SUPER"
#ifndef BuildLabel
  #define BuildLabel "development"
#endif

[Setup]
AppId={{B83FAFD1-183E-4494-B15C-21EE4C7E918E}
AppName={#AppName}
AppVersion=1.0.0-rc.4.dev
AppVerName={#AppName} - pruebas Windows ({#BuildLabel})
AppPublisher=MS Robotika
AppPublisherURL=https://github.com/msrobotika/AB-MakerIDE-SUPER
AppSupportURL=https://github.com/msrobotika/AB-MakerIDE-SUPER/issues
DefaultDirName={localappdata}\Programs\AB MakerIDE SUPER
DefaultGroupName=AB MakerIDE SUPER
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
Compression=lzma2
SolidCompression=yes
OutputDir=out
OutputBaseFilename=AB-MakerIDE-SUPER-Windows-x64-{#BuildLabel}-Setup
UninstallDisplayIcon={app}\AB-MakerIDE-SUPER.exe
CloseApplications=no
SetupLogging=yes
LicenseFile=..\LICENSE

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear acceso directo en el escritorio"; Flags: unchecked

[Files]
Source: "..\dist\AB-MakerIDE-SUPER\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\AB MakerIDE SUPER"; Filename: "{app}\AB-MakerIDE-SUPER.exe"; WorkingDir: "{app}"
Name: "{autodesktop}\AB MakerIDE SUPER"; Filename: "{app}\AB-MakerIDE-SUPER.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\AB-MakerIDE-SUPER.exe"; Description: "Abrir AB MakerIDE SUPER"; Flags: nowait postinstall skipifsilent
