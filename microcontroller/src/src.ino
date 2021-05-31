#include <Arduino.h>
#include <SPI.h>
#include <FastLED.h>
#include <math.h>

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CONFIG
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const int DESIRED_MS_PER_FRAME = 33;
const int NUM_LEDS = 5 + 5 + 5 + 5 + 5 + 5 + 5 + 5;
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const int TOTAL_BYTES_PER_FRAME = NUM_LEDS * 3;
CRGB _dataBuffer[NUM_LEDS];

#define SERIAL_USB Serial

void setup()
{
    const int BAUD_RATE = 115200;
    SERIAL_USB.begin(BAUD_RATE);
    delay(1000);
    SERIAL_USB.println("Serial opened");

    int indexOffset = 0;
    FastLED.addLeds<WS2811, 15 /* PIN */, GRB>(_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 17 /* PIN */, GRB>(_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 2 /* PIN */, GRB>(_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 5 /* PIN */, GRB>(_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 3 /* PIN */, GRB>(_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 6 /* PIN */, GRB>(_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 18 /* PIN */, GRB>(_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    FastLED.addLeds<WS2811, 21 /* PIN */, GRB>(_dataBuffer + indexOffset, 5 /* #LEDs in this strip */);
    indexOffset += 5;
    SERIAL_USB.println("LEDs registered");
    delay(1000);

    pinMode(13, OUTPUT);
}

int countSinceSync = 0;
bool blinker = true;
void loop()
{
    digitalWrite(13, blinker = !blinker);
    if (SERIAL_USB.available() == 0)
    {
        return;
    }

    if (countSinceSync >= TOTAL_BYTES_PER_FRAME)
    {
        SERIAL_USB.println(" - Integrity violation!");
        countSinceSync = 0;
    }
    while (SERIAL_USB.available())
    {
        if (0xFF == SERIAL_USB.read() && 0xFE == SERIAL_USB.read() && 0xFD == SERIAL_USB.read())
        {
            countSinceSync = 0;
            int rec = SERIAL_USB.readBytes((char *)_dataBuffer, TOTAL_BYTES_PER_FRAME);
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
            countSinceSync++;
        }
    }
}
