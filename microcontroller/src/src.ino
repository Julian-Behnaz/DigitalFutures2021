#include <Arduino.h>
#include <SPI.h>
#include <FastLED.h>
#include <math.h>

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CONFIG
////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇
const int NUM_LEDS = 5 + 5 + 5 + 5 + 5 + 5 + 5 + 5;
// 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const int TOTAL_BYTES_PER_FRAME = NUM_LEDS * 3;
CRGB g_dataBuffer[NUM_LEDS];

#define SERIAL_USB Serial

void setup()
{
    const int BAUD_RATE = 115200;
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
    FastLED.addLeds<WS2811, 15 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 17 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 2 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 5 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 3 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 6 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 18 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 21 /* PIN */, GRB>(g_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
    SERIAL_USB.println("LEDs registered");
    delay(1000);

    pinMode(13, OUTPUT);
}

int g_countSinceSync = 0;
bool g_blinker = true;
void loop()
{
    digitalWrite(13, g_blinker = !g_blinker);
    if (SERIAL_USB.available() == 0)
    {
        return;
    }

    if (g_countSinceSync >= TOTAL_BYTES_PER_FRAME)
    {
        SERIAL_USB.println(" - Integrity violation!");
        g_countSinceSync = 0;
    }
    while (SERIAL_USB.available())
    {
        // Synchronization bytes used to reduce chance for desync:
        if (0xFF == SERIAL_USB.read() && 0xFE == SERIAL_USB.read() && 0xFD == SERIAL_USB.read())
        {
            g_countSinceSync = 0;
            int rec = SERIAL_USB.readBytes((char *)g_dataBuffer, TOTAL_BYTES_PER_FRAME);
            if (rec == TOTAL_BYTES_PER_FRAME)
            {
                FastLED.show();
            }
            else
            {
                SERIAL_USB.println(" - Dropped Frame!");
            }
        }
        else
        {
            g_countSinceSync++;
        }
    }
}
