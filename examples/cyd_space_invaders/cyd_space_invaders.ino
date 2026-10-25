/*
  Space Invaders / MS Robotika / CYD ESP32-2432S028R original.
  Hardware confirmado por el usuario con el ejemplo de bloques el 25-10-2026.
  ILI9341 240x320, horizontal 320x240 (rotation=1).
  LCD HSPI: CLK14 MISO12 MOSI13 CS15 DC2 RST=-1 BL21 HIGH.
  XPT2046 VSPI: CLK25 MISO39 MOSI32 CS33 IRQ36.
  SD CS5 HIGH; sin SD, WiFi, NVS, sonido ni interfaz en PC.
  Dependencias: Adafruit GFX, Adafruit ILI9341, XPT2046 de Paul Stoffregen.
  Calibracion afin de tres puntos en RAM basada en el ejemplo probado.
  Tras cada reset: tocar y soltar las tres cruces; despues tocar para jugar.
*/
#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <XPT2046_Touchscreen.h>
#include "CYDFrame.h"
#include "SpaceInvaders.h"

SPIClass lcdBus(HSPI), touchBus(VSPI);
Adafruit_ILI9341 lcd(&lcdBus, 2, 15, -1);
XPT2046_Touchscreen touch(33, 36);
CYDFrame frame;
SpaceInvaders game;
float ax=0, bx=0, cx=0, ay=0, by=0, cy=0;
uint32_t lastFrame=0, lastStatus=0;
int calibrationPoint=0;
bool gameReady=false;

void statusMarker() {
  Serial.printf("MSR_SPACEINVADERS_BOOT build=CYD_SI_20261025_v1 lcd=ILI9341_320x240 touch=XPT2046 render=ram_dirty_rows state=%s point=%d uptime_ms=%lu\n",
    gameReady ? "GAME_READY" : "CALIBRATION", calibrationPoint,
    (unsigned long)millis());
  lastStatus=millis();
}
void waitingDelay(uint32_t ms) {
  if (millis()-lastStatus >= 2000) statusMarker();
  delay(ms);
}
void label(int x,int y,const char *value,uint16_t color=ILI9341_WHITE,uint8_t size=1) {
  lcd.setCursor(x,y);lcd.setTextColor(color);lcd.setTextSize(size);lcd.print(value);
}
bool sampleRaw(int &x,int &y) {
  if(!touch.tirqTouched() || !touch.touched()) return false;
  TS_Point p=touch.getPoint();
  if(p.z<250) return false;
  x=p.x;y=p.y;return true;
}
void calibrate() {
  // Objetivos en el LCD horizontal. Tactil rotation=0 y matriz afin final.
  const int sx[3]={20,300,20}, sy[3]={20,20,220};
  int rx[3], ry[3];
  while(true) {
    for(int point=0;point<3;point++) {
      calibrationPoint=point+1;
      lcd.fillScreen(0x0843);lcd.setTextWrap(false);
      label(40,76,"SPACE INVADERS",ILI9341_GREEN,2);
      label(40,108,"CALIBRAR TACTIL",ILI9341_CYAN,2);
      label(40,139,"Toca el centro y suelta");
      char step[32];snprintf(step,sizeof(step),"Cruz %d de 3 / solo RAM",point+1);
      label(40,158,step);
      lcd.drawFastHLine(sx[point]-10,sy[point],21,ILI9341_YELLOW);
      lcd.drawFastVLine(sx[point],sy[point]-10,21,ILI9341_YELLOW);
      lcd.drawCircle(sx[point],sy[point],8,ILI9341_YELLOW);
      statusMarker();
      int x,y;while(sampleRaw(x,y)) waitingDelay(10);
      int32_t sumx=0,sumy=0;int samples=0;
      while(samples<12) {
        if(sampleRaw(x,y)){sumx+=x;sumy+=y;samples++;}
        else {samples=0;sumx=sumy=0;}
        waitingDelay(12);
      }
      rx[point]=sumx/samples;ry[point]=sumy/samples;
      while(sampleRaw(x,y)) waitingDelay(10);
      waitingDelay(150);
    }
    float ux=rx[1]-rx[0],uy=ry[1]-ry[0],vx=rx[2]-rx[0],vy=ry[2]-ry[0];
    float det=ux*vy-vx*uy;
    if(fabsf(det)<10000) {
      Serial.println("MSR_SPACEINVADERS_CALIBRATION_RETRY degenerate_points");
      label(40,184,"Repite las tres cruces",ILI9341_RED);waitingDelay(1000);continue;
    }
    ax=((sx[1]-sx[0])*vy-(sx[2]-sx[0])*uy)/det;
    bx=(ux*(sx[2]-sx[0])-vx*(sx[1]-sx[0]))/det;
    cx=sx[0]-ax*rx[0]-bx*ry[0];
    ay=((sy[1]-sy[0])*vy-(sy[2]-sy[0])*uy)/det;
    by=(ux*(sy[2]-sy[0])-vx*(sy[1]-sy[0]))/det;
    cy=sy[0]-ay*rx[0]-by*ry[0];
    Serial.println("MSR_SPACEINVADERS_CALIBRATION_OK RAM_ONLY");return;
  }
}
void setup() {
  Serial.begin(115200);delay(250);
  Serial.println("MSR_SPACEINVADERS_START build=CYD_SI_20261025_v1");
  pinMode(5,OUTPUT);digitalWrite(5,HIGH);
  pinMode(15,OUTPUT);digitalWrite(15,HIGH);
  pinMode(33,OUTPUT);digitalWrite(33,HIGH);
  pinMode(21,OUTPUT);digitalWrite(21,HIGH);
  const bool memoryOK=frame.begin();
  lcdBus.begin(14,12,13,15);lcd.begin(20000000);lcd.setRotation(1);
  touchBus.begin(25,39,32,33);
  const bool touchOK=touch.begin(touchBus);touch.setRotation(0);
  if(!memoryOK || !touchOK) {
    lcd.fillScreen(ILI9341_BLACK);label(20,80,"ERROR DE INICIALIZACION",ILI9341_RED);
    label(20,110,memoryOK ? "No inicia el tactil" : "RAM insuficiente");
    while(true) {Serial.printf("MSR_SPACEINVADERS_ERROR memory=%d touch_init=%d\n",memoryOK,touchOK);delay(2000);}
  }
  Serial.printf("MSR_SPACEINVADERS_HW_INIT heap_free=%lu framebuffer_bytes=153600 spi_hz=20000000 sd=unused\n",(unsigned long)ESP.getFreeHeap());
  calibrate();game.begin(millis());game.draw(frame);frame.present(lcd);
  gameReady=true;calibrationPoint=0;lastFrame=millis();statusMarker();
}
void loop() {
  uint32_t now=millis();
  if(now-lastFrame>=33) {
    lastFrame=now;
    int rawx,rawy;
    SpaceInvaders::Input input;
    input.down=sampleRaw(rawx,rawy);
    if(input.down) {
      input.x=constrain(lroundf(ax*rawx+bx*rawy+cx),0L,319L);
      input.y=constrain(lroundf(ay*rawx+by*rawy+cy),0L,239L);
    }
    game.update(now,input);game.draw(frame);frame.present(lcd);
  }
  if(now-lastStatus>=10000) statusMarker();
  delay(1);
}
