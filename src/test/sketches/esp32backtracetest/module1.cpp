#include "module1.h"
#include "module2.h"
#include <Arduino.h>

void functionA(int value) {
  Serial.println("In functionA, calling functionB...");
  functionB(&value);
}
