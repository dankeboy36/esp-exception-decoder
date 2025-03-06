#include "module2.h"
#include <Arduino.h>

void functionC(int num) {
  Serial.println("In functionC, about to trigger an error...");

  // Intentional crash: Dereferencing a NULL pointer to trigger a backtrace
  int* crashPtr = nullptr;
  *crashPtr = num;  // This will cause a crash and generate a backtrace
}

void functionB(int* ptr) {
  Serial.println("In functionB, calling functionC...");
  functionC(*ptr);
}
