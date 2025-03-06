#include "module1.h"

void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP32 backtrace test...");

  int value = 42;
  functionA(value);
}

void loop() {
  // Nothing needed here for the test
}
