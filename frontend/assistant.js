// assistant feature. Shared runtime context stays private to bootstrap.
export function define(context) {
  context.bot = function bot(message, action) {
    const el = document.createElement('div');
    el.className = 'msg bot';
    const content = document.createElement('div');
    content.textContent = message;
    el.appendChild(content);
    if (action) {
      const b = document.createElement('button');
      b.className = 'action small';
      b.textContent = '↳ Insertar plantilla (reemplaza archivo actual)';
      b.onclick = async () => {
        if (
          !(await context.confirmAction(
            '¿Reemplazar el contenido del archivo actual por la plantilla?',
          ))
        )
          return;
        context.state.files[context.state.lang] = action;
        context.$('#code').value = action;
        context.updateHL();
        context.scheduleSave();
        context.toast('Plantilla aplicada');
      };
      el.appendChild(b);
    }
    context.$('#chatLog').appendChild(el);
    context.$('#chatLog').scrollTop = context.$('#chatLog').scrollHeight;
  };
  context.userMsg = function userMsg(message) {
    const el = document.createElement('div');
    el.className = 'msg user';
    el.textContent = message;
    context.$('#chatLog').appendChild(el);
    context.$('#chatLog').scrollTop = context.$('#chatLog').scrollHeight;
  };
  context.assistant = function assistant(text) {
    const ms = text.match(/(\d{2,5})\s*(?:ms|milisegundos?)/i);
    const n = Math.min(60000, Math.max(20, ms ? +ms[1] : 500));
    if (/\bled\b|parpad|blink/i.test(text)) {
      const isUno = context.state.fqbn === 'arduino:avr:uno';
      const pin = isUno ? 'LED_BUILTIN' : '2';
      const desc = isUno ? 'Arduino Uno: LED_BUILTIN (D13)' : 'ESP32: GPIO2 (comprobar perfil)';
      if (context.state.lang === 'py' && isUno) {
        context.bot(
          'Arduino Uno R3 tradicional usa Arduino C++, no MicroPython. Cambia a sketch.ino.',
        );
        return;
      }
      const code =
        context.state.lang === 'cpp'
          ? `// LED ${desc} · intervalo ${n} ms\nconst int LED_PIN = ${pin};\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(LED_PIN, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(LED_PIN, HIGH);\n  Serial.println("ON");\n  delay(${n});\n  digitalWrite(LED_PIN, LOW);\n  Serial.println("OFF");\n  delay(${n});\n}\n`
          : `# LED ESP32: GPIO2 · intervalo ${n} ms\nfrom machine import Pin\nimport time\nled = Pin(2, Pin.OUT)\nwhile True:\n    led.on()\n    print("ON")\n    time.sleep_ms(${n})\n    led.off()\n    print("OFF")\n    time.sleep_ms(${n})\n`;
      context.bot(
        `Plantilla para ${desc}: ${n} ms encendido y ${n} ms apagado. Verifica el LED y la revisión de placa. Esto NO lo ha generado una IA remota.`,
        code,
      );
      return;
    }
    if (/dht|temperatura|humedad/i.test(text)) {
      const code =
        context.state.lang === 'cpp'
          ? `#include <DHT.h>\n#define DHTPIN 4\n#define DHTTYPE DHT22\nDHT dht(DHTPIN, DHTTYPE);\nvoid setup() {\n  Serial.begin(115200);\n  dht.begin();\n}\nvoid loop() {\n  float t = dht.readTemperature();\n  float h = dht.readHumidity();\n  if (isnan(t) || isnan(h)) { Serial.println("Error DHT22"); }\n  else { Serial.printf("Temperatura: %.1f C Humedad: %.1f %%\\n", t, h); }\n  delay(2500);\n}\n`
          : `import time\nimport dht\nfrom machine import Pin\nsensor = dht.DHT22(Pin(4))\nwhile True:\n    try:\n        sensor.measure()\n        print("Temp:", sensor.temperature(), "Hum:", sensor.humidity())\n    except OSError as exc:\n        print("Error DHT22:", exc)\n    time.sleep_ms(2500)\n`;
      context.bot(
        'Plantilla DHT22 para GPIO4 preparada. Comprueba alimentación, pull-up del bus y compatibilidad. En Arduino C++ requiere DHT sensor library (y dependencias).',
        code,
      );
      return;
    }
    context.bot(
      'Soy un asistente LOCAL basado en plantillas, no una IA conectada. De momento puedo preparar programas para LED (con intervalos en ms) y DHT22. Usa Compilar para comprobar C++ realmente y revisa el hardware antes de grabar.',
    );
  };
  context.loadDeviceExample = async function loadDeviceExample(kind) {
    const info = {
      uno: { file: 'uno_r3_diagnostico.ino', name: 'Arduino Uno R3', fqbn: 'arduino:avr:uno' },
      cam: {
        file: 'esp32cam_ai_thinker_test.ino',
        name: 'ESP32-CAM AI-Thinker (clásico)',
        fqbn: 'esp32:esp32:esp32cam',
      },
      radar: {
        file: 'ideaspark_114_radar.ino',
        name: 'IdeaSpark ST7789 135×240 · radar',
        fqbn: 'esp32:esp32:esp32',
      },
      cyd: {
        file: 'cyd_28_bloques_tactil.ino',
        name: 'CYD ESP32-2432S028R · bloques táctiles',
        fqbn: 'esp32:esp32:esp32',
      },
    }[kind];
    if (!info) return;
    const advisory =
      kind === 'cam'
        ? 'IMPORTANTE: el ejemplo exige el pinout AI-Thinker clásico; identifica el sensor al ejecutarse. Probado con OV3660. NO sirve para ESP32-S3-CAM ni otros pinouts. USB-C no identifica el chip.\n\n'
        : '';
    if (kind !== 'cyd') {
      if (
        !(await context.confirmAction(
          advisory +
            '¿Cargar ' +
            info.name +
            '? Reemplazará sketch.ino y seleccionará su perfil de compilación. EXPORTA tu proyecto actual primero.',
        ))
      )
        return;
    }
    try {
      const r = await fetch('/examples/' + info.file, { cache: 'no-store' });
      if (!r.ok) throw Error('Ejemplo no disponible');
      const source = await r.text();
      if (!source.includes('void setup()') || !source.includes('void loop()'))
        throw Error('Ejemplo inválido');
      if (context.storageConflict)
        throw Error('Exporta primero la copia actual para resolver el conflicto de guardado');
      const backups = context.draftBackups;
      if (!Array.isArray(backups)) throw Error('No se pudo guardar la copia anterior');
      backups.unshift({
        date: new Date().toISOString(),
        lang: 'cpp',
        code: context.state.files.cpp,
      });
      context.draftBackups = backups.slice(0, 7);
      context.rememberAgentProject('');
      if (kind === 'radar') context.state.name = 'RadarIdeaSpark';
      if (kind === 'cyd') {
        context.state.name = 'BloquesCYD';
        context.setPhysicalProfile('esp32-cyd-28');
        context.$('#execAllowPC').checked = false;
      }
      context.state.files.cpp = source;
      context.state.fqbn = info.fqbn;
      context.state.baud = 115200;
      context.state.uploadSpeed = 115200;
      context.state.retrySlow = false;
      context.setLang('cpp');
      context.$('#code').value = source;
      context.updateHL();
      context.scheduleAdvisor();
      context.save();
      context.renderSidebar();
      context.$('#footBoard').textContent = info.name;
      context.updateHardwareLabVisibility();
      context.refreshQuickSelectors();
      context.toast('Ejemplo ' + info.name + ' cargado: selecciona el puerto físico y compila.');
      context.showLog(
        'console',
        'Ejemplo cargado: ' + info.name + ' | FQBN=' + info.fqbn + ' | monitor serie 115200',
        'cmd',
      );
    } catch (e) {
      context.toast('Error cargando ejemplo: ' + e.message);
    }
  };
}
export function initialize(context) {
  context.$('#chatSend').onclick = () => {
    const e = context.$('#chatInput'),
      s = e.value.trim();
    if (!s) return;
    e.value = '';
    const provider = context.$('#aiProvider').value;
    if (['codex', 'claude_code'].includes(provider)) {
      context.$('#execProvider').value = provider;
      context.renderAgentAccountNote();
      context.$('#agentWorkbench').open = true;
      document.body.dataset.right = 'ai';
      context.$('#execTask').value = s;
      context.saveAiPreferences();
      context.$('#execRun').click();
      return;
    }
    context.userMsg(s);
    if (provider === 'local') context.assistant(s);
    else context.sendCloudAgent(s);
  };
  context.$('#chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      context.$('#chatSend').click();
    }
  });
}
