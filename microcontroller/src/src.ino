#include <Arduino.h>
#include <SPI.h>
#include <FastLED.h>
#include <math.h>

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CONFIG
////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇
const int TOTAL_NUM_LEDS = 102;
#define BAUD_RATE 1000000
// 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const int EXPECTED_BYTES_PER_FRAME = TOTAL_NUM_LEDS * 3;
CRGB g_dataBuffer[TOTAL_NUM_LEDS];
#define SERIAL_USB Serial

void setup()
{
    SERIAL_USB.begin(BAUD_RATE);
    delay(1000);
    SERIAL_USB.println("Serial opened");

    /** 
     * Set up LEDs with the correct
     * - Integrated Circuit (eg WS2811)
     * - Pin (eg 15)
     * - Color channel ordering of the IC (eg GRB for Green, Red, Blue)
     *   We are going to fill `g_dataBuffer` in red, green, blue order, but different LED strips
     *   need to be told the destination order (eg. GRB) to use from that. 
     * - Range of the g_dataBuffer.
     *   We use `g_dataBuffer + indexOffset` to indicate the address in memory the
     *   FastLED library should use as the place where the data for a given LED strip starts.
     *   Since g_dataBuffer is defined as `CRGB g_dataBuffer[NUM_LEDS]`, and CRGB is a 3 byte struct,
     *   `g_dataBuffer + 2` would skip 2*3=6 bytes.
     * 👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇
     */
    const int ledsInStrip0 = 120; // TODO(JULIAN+BEHNAZ): Add a diagram to explain what is going on!!!
    int indexOffset = 0;
    FastLED.addLeds<WS2811, 10 /* PIN */, GRB>(g_dataBuffer + indexOffset, ledsInStrip0 /* #LEDs in this strip */);
    indexOffset += ledsInStrip0;
    // const int ledsInStrip1 = 10;
    // FastLED.addLeds<WS2811, 11 /* PIN */, GRB>(g_dataBuffer + indexOffset, ledsInStrip1 /* #LEDs in this strip */);
    // indexOffset += ledsInStrip1;
    // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
    SERIAL_USB.println("LEDs registered");
    delay(1000);

    pinMode(13, OUTPUT);
}

bool g_isReadingFrame = false;
int g_dataBytesRead = EXPECTED_BYTES_PER_FRAME; // Start with the state we would get after reading a frame
void loop()
{
    /**
     * The general protocol implemented below is:
     * Every "packet" begins with 0xFF and is followed by EXPECTED_BYTES_PER_FRAME bytes that contain LED data
     * and are not 0xFF. If we get too many or too few LED data bytes in a frame, we complain in a human-readable message.
     * 
     * When we get a 0xFF, we set `g_isReadingFrame = true` and reset g_dataBytesRead to 0.
     * When we get any other byte, we read it into g_dataBuffer as long as g_isReadingFrame is true.
     * When we get the final byte of a frame while g_isReadingFrame is true, we display the frame and set g_isReadingFrame = false.
     */

    while (SERIAL_USB.available())
    {
        digitalWrite(13, !g_isReadingFrame);
        int got = Serial.read();
        if (got == 0xFF)
        { // Got a frame header byte indicating the remaining bytes should be usable data
            if (g_isReadingFrame)
            {
                // Message is too short because we expected to see non-start data when reading
                SERIAL_USB.print(" - Frame too short. Expected: ");
                SERIAL_USB.print(EXPECTED_BYTES_PER_FRAME, DEC);
                SERIAL_USB.print(" bytes. Got: ");
                SERIAL_USB.println(g_dataBytesRead, DEC);
            }
            else if (g_dataBytesRead > EXPECTED_BYTES_PER_FRAME)
            {
                // Message is too long because we only expect to see a start symbol after reading a complete message
                SERIAL_USB.print(" - Frame too long. Expected: ");
                SERIAL_USB.print(EXPECTED_BYTES_PER_FRAME, DEC);
                SERIAL_USB.print(" bytes. Got: ");
                SERIAL_USB.println(g_dataBytesRead, DEC);
            }

            // Irrespective of how we got here, getting 0xFF indicates that the next byte(s) should be LED data
            g_isReadingFrame = true;
            g_dataBytesRead = 0;
        }
        else
        { // Got a data byte (not 0xFF)
            if (g_isReadingFrame)
            {
                char *rawBuffer = (char *)g_dataBuffer; // byte pointer to the beginning of `g_dataBuffer`
                // rawBuffer[g_dataBytesRead] = (char)got; // equivalent to below:
                *(rawBuffer + g_dataBytesRead) = (char)got; // store got at the address `rawBuffer + g_dataBytesRead`
                g_dataBytesRead++;
                if (g_dataBytesRead == EXPECTED_BYTES_PER_FRAME)
                {
                    // We have read sufficient bytes for one frame, so display it and wait for the start of the next one
                    FastLED.show();
                    g_isReadingFrame = false;
                }
            }
            else
            { // We expected to see a frame header (0xFF) but we got a data byte. Increment to count how many extra bytes we got
                g_dataBytesRead++;
            }
        }
    }
}
