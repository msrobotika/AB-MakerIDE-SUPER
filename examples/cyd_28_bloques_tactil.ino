/*
  AB MakerIDE / MS Robotika — Bloques en la pantalla de la placa.
  Perfil DOCUMENTAL: CYD ESP32-2432S028R original, ILI9341 240x320,
  tactil resistivo XPT2046. Confirmar la serigrafia/revision antes de grabar.
  No utiliza Wi-Fi, microSD, altavoz, ventanas PC ni archivos externos.
  Librerias: Adafruit GFX, Adafruit ILI9341, XPT2046_Touchscreen (Paul Stoffregen).
  No modifica User_Setup.h ni configuraciones globales de otras pantallas.
  Tras cada reinicio: tocar las tres cruces para calibrar en RAM.
  Referencia de pines: github.com/witnessmenow/ESP32-Cheap-Yellow-Display/PINS.md
*/
#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <XPT2046_Touchscreen.h>

SPIClass lcdBus(HSPI), touchBus(VSPI);
Adafruit_ILI9341 lcd(&lcdBus, 2, 15, -1);
XPT2046_Touchscreen touch(33, 36);
constexpr int COLS=10, ROWS=20, CELL=11, GX=10, GY=42;
uint8_t field[ROWS][COLS] = {};
const uint16_t pieces[7][4] = {
  {0x00F0,0x4444,0x0F00,0x2222}, {0x0066,0x0066,0x0066,0x0066},
  {0x0072,0x0262,0x0270,0x0232}, {0x0036,0x0462,0x0360,0x0231},
  {0x0063,0x0264,0x0630,0x0132}, {0x0071,0x0226,0x0470,0x0322},
  {0x0074,0x0622,0x0170,0x0223}
};
const uint16_t colors[8]={ILI9341_BLACK,ILI9341_CYAN,ILI9341_YELLOW,ILI9341_MAGENTA,
  ILI9341_GREEN,ILI9341_RED,ILI9341_BLUE,ILI9341_ORANGE};
uint8_t piece=0, nextPiece=1, rotation=0, bag[7], bagPos=7;
int px=3, py=-1;
uint32_t points=0, cleared=0, lastFall=0, lastTouch=0;
bool paused=false, ended=false, dirty=true, touching=false;
float ax=0,bx=0,cx=0,ay=0,by=0,cy=0;
uint8_t drawn[ROWS][COLS];
bool layoutReady=false;
uint8_t previousPreview=255,previousOverlay=255;
uint32_t previousPoints=UINT32_MAX,previousLines=UINT32_MAX;

void text(int x,int y,const char* value,uint16_t color=ILI9341_WHITE,uint8_t size=1){
  lcd.setCursor(x,y);lcd.setTextColor(color);lcd.setTextSize(size);lcd.print(value);
}
void button(int x,int y,int w,int h,const char* label){
  lcd.fillRoundRect(x,y,w,h,4,0x19C9);lcd.drawRoundRect(x,y,w,h,4,0x3DFF);
  text(x+6,y+h/2-4,label);
}
bool block(uint8_t type,uint8_t rot,int x,int y){return (pieces[type][rot] & (uint16_t(1)<<(y*4+x)))!=0;}
bool fits(int nx,int ny,uint8_t nr){
  for(int y=0;y<4;y++)for(int x=0;x<4;x++)if(block(piece,nr,x,y)){
    int xx=nx+x,yy=ny+y;
    if(xx<0||xx>=COLS||yy>=ROWS||(yy>=0&&field[yy][xx]))return false;
  }
  return true;
}
uint8_t drawPiece(){
  if(bagPos==7){for(int i=0;i<7;i++)bag[i]=i;for(int i=6;i>0;i--){int j=random(i+1);uint8_t t=bag[i];bag[i]=bag[j];bag[j]=t;}bagPos=0;}
  return bag[bagPos++];
}
void spawn(){piece=nextPiece;nextPiece=drawPiece();rotation=0;px=3;py=-1;lastFall=millis();if(!fits(px,py,rotation))ended=true;dirty=true;}
void newGame(){memset(field,0,sizeof(field));points=cleared=0;bagPos=7;nextPiece=drawPiece();paused=ended=false;spawn();}
void lockPiece(){
  for(int y=0;y<4;y++)for(int x=0;x<4;x++)if(block(piece,rotation,x,y)){
    int yy=py+y;if(yy<0)ended=true;else if(yy<ROWS)field[yy][px+x]=piece+1;
  }
  if(ended){dirty=true;return;}
  int count=0;
  for(int y=ROWS-1;y>=0;y--){bool full=true;for(int x=0;x<COLS;x++)if(!field[y][x])full=false;
    if(full){for(int row=y;row>0;row--)memcpy(field[row],field[row-1],COLS);memset(field[0],0,COLS);count++;y++;}}
  if(count){const uint16_t award[]={0,100,300,500,800};points+=award[count]*(1+cleared/10);cleared+=count;}
  spawn();
}
void move(int dx){if(fits(px+dx,py,rotation)){px+=dx;dirty=true;}}
void rotatePiece(){uint8_t nr=(rotation+1)%4;for(int offset : {0,-1,1,-2,2})if(fits(px+offset,py,nr)){px+=offset;rotation=nr;dirty=true;return;}}
void hardDrop(){while(fits(px,py+1,rotation)){py++;points+=2;}lockPiece();}
void tile(int x,int y,uint16_t color){
  // Called inside one SPI transaction. Clear only this cell, including its grid.
  lcd.writeFillRect(GX+x*CELL,GY+y*CELL,CELL,CELL,ILI9341_BLACK);
  if(color!=ILI9341_BLACK)lcd.writeFillRect(GX+x*CELL+1,GY+y*CELL+1,CELL-2,CELL-2,color);
}
void render(){
  // Draw the layout once. Falling/moving pieces never blank the whole screen.
  if(!layoutReady){
    lcd.fillScreen(0x0843);text(12,8,"MS ROBOTIKA",ILI9341_CYAN,2);text(12,29,"BLOQUES / CYD 2.8 / SIN PC");
    lcd.drawRect(GX-1,GY-1,COLS*CELL+2,ROWS*CELL+2,0x7BEF);
    text(135,44,"SIGUIENTE",ILI9341_CYAN);text(135,132,"PUNTOS");text(135,166,"LINEAS");
    button(132,191,101,31,"PAUSA");button(132,230,101,31,"NUEVA");
    button(4,276,48,36,"<");button(57,276,65,36,"GIRAR");button(127,276,47,36,">");button(179,276,57,36,"CAER");
    memset(drawn,255,sizeof(drawn));layoutReady=true;
  }
  uint8_t wanted[ROWS][COLS];memcpy(wanted,field,sizeof(wanted));
  if(!ended)for(int y=0;y<4;y++)for(int x=0;x<4;x++)if(block(piece,rotation,x,y)&&py+y>=0&&py+y<ROWS)wanted[py+y][px+x]=piece+1;
  uint8_t overlay=ended?2:(paused?1:0);
  if(overlay!=previousOverlay){
    // Restore cells covered by a previous pause/end banner, including gaps.
    for(int y=7;y<=11;y++)memset(drawn[y],255,COLS);
    button(132,191,101,31,paused?"SEGUIR":"PAUSA");
  }
  lcd.startWrite();
  for(int y=0;y<ROWS;y++)for(int x=0;x<COLS;x++)if(drawn[y][x]!=wanted[y][x]){
    tile(x,y,colors[wanted[y][x]]);drawn[y][x]=wanted[y][x];
  }
  lcd.endWrite();
  if(nextPiece!=previousPreview){
    lcd.fillRect(144,63,60,60,0x0843);
    for(int y=0;y<4;y++)for(int x=0;x<4;x++)if(block(nextPiece,0,x,y))lcd.fillRect(144+x*15,63+y*15,13,13,colors[nextPiece+1]);
    previousPreview=nextPiece;
  }
  char digits[16];
  if(points!=previousPoints){lcd.setCursor(135,145);lcd.setTextSize(2);lcd.setTextColor(ILI9341_WHITE,0x0843);snprintf(digits,sizeof(digits),"%7lu",(unsigned long)points);lcd.print(digits);previousPoints=points;}
  if(cleared!=previousLines){lcd.setCursor(180,166);lcd.setTextSize(1);lcd.setTextColor(ILI9341_WHITE,0x0843);snprintf(digits,sizeof(digits),"%5lu",(unsigned long)cleared);lcd.print(digits);previousLines=cleared;}
  if(overlay&&overlay!=previousOverlay){lcd.fillRect(GX+2,GY+83,COLS*CELL-4,37,0x18C6);text(GX+5,GY+97,ended?"FIN / NUEVA":"EN PAUSA",ILI9341_YELLOW);}
  previousOverlay=overlay;
  dirty=false;
}
bool sampleRaw(int& x,int& y){
  if(!touch.tirqTouched()||!touch.touched())return false;
  TS_Point p=touch.getPoint();if(p.z<250)return false;x=p.x;y=p.y;return true;
}
void calibrate(){
  const int sx[3]={20,220,20},sy[3]={20,20,300};int rx[3],ry[3];
  while(true){
    for(int point=0;point<3;point++){
      lcd.fillScreen(0x0843);text(42,120,"CALIBRAR TACTIL",ILI9341_CYAN,2);text(42,148,"Toca el centro de la cruz");
      lcd.drawFastHLine(sx[point]-10,sy[point],21,ILI9341_YELLOW);lcd.drawFastVLine(sx[point],sy[point]-10,21,ILI9341_YELLOW);
      lcd.drawCircle(sx[point],sy[point],8,ILI9341_YELLOW);
      Serial.printf("MSR_CYD_CALIBRATION point=%d\n",point+1);
      int x,y;while(sampleRaw(x,y))delay(10);
      int32_t sumx=0,sumy=0;int samples=0;
      while(samples<12){if(sampleRaw(x,y)){sumx+=x;sumy+=y;samples++;}else{samples=0;sumx=sumy=0;}delay(12);}
      rx[point]=sumx/samples;ry[point]=sumy/samples;while(sampleRaw(x,y))delay(10);delay(150);
    }
    float ux=rx[1]-rx[0],uy=ry[1]-ry[0],vx=rx[2]-rx[0],vy=ry[2]-ry[0];float det=ux*vy-vx*uy;
    if(abs(det)<10000){text(30,190,"Repite las tres cruces",ILI9341_RED);delay(1000);continue;}
    ax=((sx[1]-sx[0])*vy-(sx[2]-sx[0])*uy)/det;bx=(ux*(sx[2]-sx[0])-vx*(sx[1]-sx[0]))/det;cx=sx[0]-ax*rx[0]-bx*ry[0];
    ay=((sy[1]-sy[0])*vy-(sy[2]-sy[0])*uy)/det;by=(ux*(sy[2]-sy[0])-vx*(sy[1]-sy[0]))/det;cy=sy[0]-ay*rx[0]-by*ry[0];
    Serial.println("MSR_CYD_CALIBRATION_OK RAM_ONLY");return;
  }
}
void setup(){
  Serial.begin(115200);delay(250);Serial.println("MSR_CYD_START profile=ESP32-2432S028R display=ILI9341 touch=XPT2046 render=dirty_cells_v2");
  pinMode(5,OUTPUT);digitalWrite(5,HIGH);  // SD deseleccionada; no se monta ni escribe.
  pinMode(21,OUTPUT);digitalWrite(21,HIGH);
  lcdBus.begin(14,12,13,15);lcd.begin(20000000);lcd.setRotation(0);
  touchBus.begin(25,39,32,33);touch.begin(touchBus);touch.setRotation(0);
  randomSeed(esp_random());calibrate();newGame();render();Serial.println("MSR_CYD_GAME_READY touch_controls=on pc_window=none sd=unused");
}
void loop(){
  int rawx,rawy;bool down=sampleRaw(rawx,rawy);uint32_t now=millis();
  if(down&&!touching&&now-lastTouch>130){
    int x=lroundf(ax*rawx+bx*rawy+cx),y=lroundf(ay*rawx+by*rawy+cy);lastTouch=now;
    if(x>=132&&x<234&&y>=191&&y<222&&!ended){paused=!paused;lastFall=now;dirty=true;}
    else if(x>=132&&x<234&&y>=230&&y<262)newGame();
    else if(!paused&&!ended&&y>=276&&y<313&&x>=0&&x<240){if(x<55)move(-1);else if(x<124)rotatePiece();else if(x<177)move(1);else hardDrop();}
  }
  touching=down;
  uint32_t fall=600-min<uint32_t>(cleared/10,10)*45;
  if(!paused&&!ended&&now-lastFall>=fall){lastFall=now;if(fits(px,py+1,rotation)){py++;dirty=true;}else lockPiece();}
  if(dirty)render();delay(8);
}
