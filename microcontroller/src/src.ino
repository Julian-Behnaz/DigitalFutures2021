#include <Arduino.h>
#include <SPI.h>
#include <FastLED.h>
#include <math.h>

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CONFIG
////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇
const int NUM_LEDS = 20;
// + 5 + 5 + 5 + 5 + 5 + 5 + 5;
#define BAUD_RATE 115200
// 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const int TOTAL_BYTES_PER_FRAME = NUM_LEDS * 3;
CRGB g_dataBuffer[NUM_LEDS];
char g_sync[3];

#define SERIAL_USB Serial

void setup()
{
    SERIAL_USB.begin(BAUD_RATE);
    delay(1000);
    SERIAL_USB.println("Serial opened");

    /** 
     * Set up LEDs with the correct
     * - Device (eg WS2811)
     * - Pin (eg 15)
     * - Color channel ordering of the device (eg GRB for Green, Red, Blue)
     *   We are going to fill `g_dataBuffer` in red, green, blue order, but different LED strips
     *   need to be told the destination order to use from that.
     * - Range of the g_dataBuffer.
     *   We use `g_dataBuffer + indexOffset` to indicate the address in memory the
     *   FastLED library should use as the place where the data for a given LED strip starts.
     *   Since g_dataBuffer is defined as `CRGB g_dataBuffer[NUM_LEDS]`, and CRGB is a 3 byte struct,
     *   `g_dataBuffer + 2` would skip 2*3=6 bytes.
     * 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇
     */
    int indexOffset = 0;
    FastLED.addLeds<WS2811, 10 /* PIN */, GRB>(g_dataBuffer + indexOffset, 20 /* #LEDs in this strip */);
    indexOffset += 20;
    // FastLED.addLeds<WS2811, 10 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    // indexOffset += 5;
    // FastLED.addLeds<WS2811, 11 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    // indexOffset += 5;
    // FastLED.addLeds<WS2811, 12 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    // indexOffset += 5;
    // FastLED.addLeds<WS2811, 8 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    // indexOffset += 5;
    // FastLED.addLeds<WS2811, 6 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    // indexOffset += 5;
    // FastLED.addLeds<WS2811, 7 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    // indexOffset += 5;
    // FastLED.addLeds<WS2811, 5 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    // indexOffset += 5;
    // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
    SERIAL_USB.println("LEDs registered");
    delay(1000);

    pinMode(13, OUTPUT);
}

int g_countSinceSync = 0;
bool g_blinker = true;
bool g_gotStart = false;
void loop()
{
    if (!g_gotStart)
    {
        while (SERIAL_USB.available())
        {
            g_countSinceSync++;
            if (SERIAL_USB.read() == 0xFF)
            { // Start of a frame!
                if (g_countSinceSync - 1 > TOTAL_BYTES_PER_FRAME)
                {
                    SERIAL_USB.print(" - Integrity violation: Expected ");
                    SERIAL_USB.print(TOTAL_BYTES_PER_FRAME, DEC);
                    SERIAL_USB.print(" bytes. Got before sync: ");
                    SERIAL_USB.println(g_countSinceSync, DEC);
                }
                g_gotStart = true;
                g_countSinceSync = 0;
                break;
            }
            else if (g_countSinceSync < TOTAL_BYTES_PER_FRAME)
            {
                SERIAL_USB.println(" - Too few bytes before sync!");
            }
        }
    }
    else
    {
        while (SERIAL_USB.available())
        {
            if (g_countSinceSync < TOTAL_BYTES_PER_FRAME)
            {
                ((char *)g_dataBuffer)[g_countSinceSync] = SERIAL_USB.read();
                g_countSinceSync++;
                break;
            }
            else
            {
                FastLED.show();
                g_gotStart = false;
                break;
            }
        }
    }
}
